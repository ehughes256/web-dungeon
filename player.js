class BodyPart {
    constructor(name, size, attachedTo) {
        this.name = name;
        this.size = size; // Size affects hit chance
        this.maxHp = size; // Max HP based on size
        this.currentHp = this.maxHp;
        this.attachedTo = attachedTo; // e.g., 'torso' for arms, legs, head
        this.equipped = new EmptyItem(); // Armor worn on this part
    }

    isUsable() {
        let usable = true;
        let bp = this;
        while (bp) {
            if (bp.currentHp <= 0) {
                usable = false;
                break;
            }
            bp = bp.attachedTo;
        }
        return usable;
    }

    takeDamage(damage) {
        this.currentHp -= damage;
        if (this.currentHp <= 0) {
            this.currentHp = 0;
            // If a body part is destroyed, all parts attached to it are also destroyed
            for (const part of Game.player.body.allBodyParts()) {
                if (part instanceof BodyPart && part.attachedTo === this) {
                    part.takeDamage(part.currentHp); // Destroy attached parts
                }
            }
            // drop equipped weapons
            if (this.equipped instanceof Weapon && !(this.equipped instanceof Fists)) {
                Game.player.game.addMessage(`Your ${this.attachedTo.name} is mangled, dropping your ${this.equipped.name}!`);
                Game.player.dropWeapon();
            }
        }
    }

    getDefense() {
        if (this.equipped && typeof this.equipped.getDefense === 'function') {
            return this.equipped.getDefense();
        }
        return {
            base: 0,
            bonus: 0,
            fromBonus: 0,
            fromEnchantment: 0
        }
    }
}

class PlayerBody {
    constructor(player) {
        this.player = player;

        // Define body parts
        this.torso = new BodyPart("torso", 30, null);
        this.head = new BodyPart("head", 10, this.torso);
        this.arms = new BodyPart("arms", 15, this.torso);
        this.hands = new BodyPart("hands", 10, this.arms);
        this.weapon = new BodyPart("weapon", 1, this.hands); // Placeholder for weapon
        this.legs = new BodyPart("legs", 20, this.torso);
        this.feet = new BodyPart("feet", 5, this.legs);
        this.finger = new BodyPart("finger", 2, this.hands);

        this.weapon.equipped = new Fists();
    }

    randomPartFromWeightedList(parts) {
        const totalWeight = parts.reduce((sum, part) => sum + part.size, 0);
        let roll = Math.random() * totalWeight;
        for (const part of parts) {
            if (roll < part.size) {
                return part;
            }
            roll -= part.size;
        }
        return parts[parts.length - 1]; // Fallback
    }

    allBodyParts() {
        return [
            this.head, this.arms, this.torso,
            this.hands,
            this.legs, this.feet,
            this.finger, this.weapon
        ];
    }

    randomUpperBodyPart() {
        const parts = [this.head, this.arms, this.torso];
        return this.randomPartFromWeightedList(parts);
    }

    randomMiddleBodyPart() {
        const parts = [this.hands, this.torso, this.arms];
        return this.randomPartFromWeightedList(parts);
    }

    randomLowerBodyPart() {
        const parts = [this.legs, this.feet, this.torso];
        return this.randomPartFromWeightedList(parts);
    }

    randomAttackablePart() {
        const parts = [
            this.head, this.arms, this.torso,
            this.hands,
            this.legs, this.feet
        ];
        return this.randomPartFromWeightedList(parts);
    }

    equippedWeapon() {
        if (this.weapon.isUsable() && !(this.weapon.equipped instanceof Fists)) {
            return this.weapon.equipped;
        }
        return new Fists();
    }

    equipWeapon(weapon) {
        if (this.weapon.isUsable()) {
            this.weapon.equipped = weapon;
            return true;
        }
        return false;
    }

    unequipWeapon() {
        if (!(this.weapon.equipped instanceof Fists)) {
            const weapon = this.weapon.equipped;
            this.weapon.equipped = new Fists();
            return weapon;
        }
        return new EmptyItem();
    }

    equipArmor(armor, bodyLocation) {
        if (bodyLocation && this[bodyLocation] && armor.bodyLocation === bodyLocation) {
            this[bodyLocation].equipped = armor;
            return true;
        }
        return false;
    }

    unequipArmor(bodyLocation) {
        if (bodyLocation && this[bodyLocation] && !(this[bodyLocation].equipped instanceof EmptyItem)) {
            const armor = this[bodyLocation].equipped;
            this[bodyLocation].equipped = new EmptyItem();
            return armor;
        }
        return null;
    }

    grow() {
        for (const part of this.allBodyParts()) {
            part.size = Math.max(Math.floor(part.size * 1.1), 1);
            part.maxHp = part.size;
        }
    }
}

class Player {
    constructor(game, x = 0, y = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        // 100 is normal speed; lower is faster
        this.speed = 100;
        this.maxHealth = 20;
        this.health = this.maxHealth;
        this.level = 1;
        this.inventory = {gold: 0, potions: [], scrolls: [], weapons: [], armor: []};
        this.body = new PlayerBody(this);
        this.weight = 0; // Current carried weight

        // Attributes (1-100 scale)
        this.strength = 50; // Strength attribute
        this.dexterity = 50; // Dexterity attribute
        this.intelligence = 50; // Intelligence attribute
        this.wisdom = 50; // Wisdom attribute
        this.charisma = 50; // Charisma attribute
        this.luck = 50; // Luck attribute
        this.experience = 0; // Experience points
        this.name = 'Hero Protagonist';
        this.class = 'Adventurer'; // Player class
        this.nextFreeHealTime = 3000; // Next time the player can heal
    }

    equippedWeapon() {
        return this.body.equippedWeapon();
    }

    defenseBonus(bodyPart) {
        return bodyPart.getDefense();
    }

    equippedArmor() {
        return [
            this.body.head.equipped,
            this.body.torso.equipped,
            this.body.legs.equipped,
            this.body.feet.equipped,
            this.body.arms.equipped,
            this.body.hands.equipped,
            this.body.finger.equipped,
        ].filter((a) => !(a instanceof EmptyItem));
    }

    // Combat stats
    getAttack() {
        return {
            baseDamage: this.equippedWeapon().getDamage(),
            bonus: this.equippedWeapon().getDamageBonus(),
            strengthBonus: Math.floor((this.strength - 50) / 10),
            weapon: this.equippedWeapon(),
        };
    }

    // Health management
    heal(amount) {
        let amountLeft = amount;
        let didHeal = true;
        while (amountLeft > 0 && didHeal) {
            didHeal = false;
            const array = this.body.allBodyParts();
            const random = array.map(() => Math.random());
            const randomOrder = array.sort((a, b) => {
                return random[a] - random[b];
            });
            for (const part of randomOrder) {
                if (part.currentHp < part.maxHp) {
                    part.currentHp += 1;
                    didHeal = true;
                    amountLeft -= 1;
                    if (amountLeft <= 0) break;
                }
            }
        }

        return amount - amountLeft; // Return actual amount healed
    }

    takeDamage(bodyPart, damage) {
        const defense = bodyPart.getDefense();
        const actualDefense = Math.floor((Math.random() * defense.base)) + defense.bonus;
        const actualDamage = Math.max(0, damage - actualDefense);

        bodyPart.takeDamage(actualDamage);
        return actualDamage;
    }

    isDead() {
        return this.health <= 0;
    }

    // Equipment management
    equipWeapon(weapon) {
        const oldWeapon = this.unEquipWeapon();
        this.inventory.weapons.splice(this.inventory.weapons.indexOf(weapon), 1);
        this.body.equipWeapon(weapon);
        return oldWeapon;
    }

    unEquipWeapon() {
        const weapon = this.body.unequipWeapon();
        if (weapon && !(weapon instanceof EmptyItem)) {
            this.inventory.weapons.push(weapon);
            return weapon;
        }
        return null;
    }

    equipArmor(armor) {
        const {bodyLocation} = armor;
        if (!bodyLocation || !['head', 'torso', 'legs', 'feet', 'hands', 'arms', 'finger'].includes(bodyLocation)) {
            return false;
        }
        this.inventory.armor.splice(this.inventory.armor.indexOf(armor), 1);
        const oldArmor = this.unEquipArmor(bodyLocation);
        this.body.equipArmor(armor, bodyLocation);
        return oldArmor;
    }

    unEquipArmor(bodyLocation) {
        if (!bodyLocation || !['head', 'torso', 'legs', 'feet', 'hands', 'arms', 'rings'].includes(bodyLocation)) {
            return false;
        }
        const armor = this.body.unequipArmor(bodyLocation);
        if (armor && !(armor instanceof EmptyItem)) {
            this.inventory.armor.push(armor);
            return true;
        }
        return false;
    }

    // Inventory management
    addGold(amount) {
        this.inventory.gold += amount;
    }

    addPotion(potion) {
        if (!this.inventory.potions) this.inventory.potions = [];
        const match = this.inventory.potions.find((p) => p.name === potion.name && p.healAmount === potion.healAmount);
        if (match) match.count += 1;
        else {
            potion.count = 1;
            this.inventory.potions.push(potion);
        }
    }

    addScroll(scroll) {
        if (!this.inventory.scrolls) this.inventory.scrolls = [];
        const match = this.inventory.scrolls.find((s) => s.name === scroll.name && s.damage === scroll.damage);
        if (match) match.count += 1;
        else {
            scroll.count = 1;
            this.inventory.scrolls.push(scroll);
        }
    }

    addWeapon(weapon) {
        if (!this.inventory.weapons) this.inventory.weapons = [];
        this.inventory.weapons.push(weapon);
    }

    addArmor(armor) {
        if (!this.inventory.armor) this.inventory.armor = [];
        this.inventory.armor.push(armor);
    }

    // Item usage
    drinkPotion(game) {
        if (!this.inventory.potions || this.inventory.potions.length === 0) {
            game.addMessage('No potions to drink.');
            return;
        }
        const stack = this.inventory.potions[0];
        if (stack && typeof stack.use === 'function') stack.use(game);
        stack.count -= 1;
        if (stack.count <= 0) this.inventory.potions.shift();
        game.consumeTurn(20);
    }

    castScroll(game) {
        if (!this.inventory.scrolls || this.inventory.scrolls.length === 0) {
            game.addMessage('No scrolls to cast.');
            return {success: false, message: 'No scrolls to cast.'};
        }
        const stack = this.inventory.scrolls[0];
        game.addMessage('You read the scroll.');
        if (stack && typeof stack.use === 'function') stack.use(game);
        stack.count -= 1;
        if (stack.count <= 0) this.inventory.scrolls.shift();
        game.consumeTurn(30);
        return {success: true, message: 'Scroll cast.'};
    }

    attemptAttack(monster) {
        const weapon = this.equippedWeapon();

        // Existing context object (add monsterSpeed)
        const ctx = {
            weaponSpeed: weapon ? weapon.speed : 100,
            monsterSize: monster.size,
            monsterSpeed: monster.speed
        };

        // Example existing size modifier (assumed)
        const sizeMod = ctx.monsterSize ? Math.max(-15, Math.min(15, 10 - ctx.monsterSize / 10)) : 0;

        // New speed modifier: faster monsters (lower speed value) reduce hit chance.
        // Normalize: reference 100 as neutral. Clamp to avoid extremes.
        const rawSpeedRatio = 100 / Math.max(10, ctx.monsterSpeed); // higher if monster is very fast
        // Convert to a penalty in range ~0 to 20
        let speedPenalty = (rawSpeedRatio - 1) * 12; // tune scaling
        if (speedPenalty < 0) speedPenalty = 0;
        if (speedPenalty > 20) speedPenalty = 20;
        speedPenalty = Math.round(speedPenalty);

        // Base hit chance (example baseline)
        let hitChance = 65 + sizeMod - speedPenalty;

        // Weapon accuracy bonus (if any)
        if (weapon && weapon.bonuses.accuracyBonus) {
            hitChance += weapon.bonuses.accuracyBonus;
        }

        // Clamp
        hitChance = Math.max(5, Math.min(95, hitChance));

        const roll = Math.random() * 100;
        const hit = roll < hitChance;

        return {
            hit,
            roll: Math.round(roll),
            hitChance,
            sizeMod,
            speedPenalty
        };
    }

    dropInventoryItem(category, index) {
        const p = this;
        const arrays = p.inventory;
        const arr = arrays[category];
        if (!arr || !arr[index]) {
            this.game.addMessage('Nothing to drop.');
            return;
        }
        if (!this.game.canDropHere()) {
            this.game.addMessage('Cannot drop here.');
            return;
        }
        if (category === 'potions' || category === 'scrolls') {
            const stack = arr[index];
            const single = this.game.instantiateDroppedItem(stack, this.x, this.y);
            if (!single) {
                this.game.addMessage('Failed to drop item.');
                return;
            }
            this.game.itemManager.items.push(single);
            stack.count -= 1;
            if (stack.count <= 0) arr.splice(index, 1);
            this.game.addMessage(`You drop one ${stack.name}.`);
        } else {
            const item = arr.splice(index, 1)[0];
            if (p.equippedWeapon() === item) p.unEquipWeapon();
            if (p.equippedArmor() === item) p.unEquipArmor(item.bodyLocation);
            item.x = this.x;
            item.y = this.y;
            // Place the item on the ground
            this.game.itemManager.items.push(item);
            this.game.addMessage(`You drop ${item.name}.`);
        }
        this.game.updateUI();
        this.game.consumeTurn(10);
    }

    dropWeapon() {
        const weapon = this.body.unequipWeapon();
        if (weapon && !(weapon instanceof EmptyItem)) {
            if (!this.game.canDropHere()) {
                this.body.equipWeapon(weapon); // Re-equip if can't drop
                this.game.addMessage('Cannot drop here.');
                return;
            }
            weapon.x = this.x;
            weapon.y = this.y;
            this.game.itemManager.items.push(weapon);
            this.game.updateUI();
        }
    }

    gainExperience(amount) {
        this.experience += amount;
        const expToLevel = this.level * 100;
        if (this.experience >= expToLevel) {
            this.level += 1;
            this.experience -= expToLevel;
            this.body.grow();
            this.game.addMessage(`You leveled up to level ${this.level}!`);
        }
    }
}
