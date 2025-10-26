class PlayerBody {
    constructor(player) {
        this.player = player;

        // Define inventory slots
        this.weapon = new Fists();
        this.armor = null;
        this.helmet = null;
        this.gloves = null;
        this.boots = null;
        this.ring = null;
    }

    equip(location, item) {
        const oldItem = this[location];
        this[location] = item;
        return oldItem;
    }

    unequip(location) {
        const oldItem = this[location];
        this[location] = null;
        return oldItem;
    }

    equipWeapon(weapon) {
        return this.equip("weapon", weapon);
    }

    unequipWeapon() {
        if (!(this.weapon instanceof Fists)) {
            const weapon = this.weapon;
            this.weapon = new Fists();
            return weapon;
        }
        return new EmptyItem();
    }

    equipArmor(armor) {
        return this.equip("armor", armor);
    }

    unequipArmor() {
        return this.unequip("armor");
    }

    equipRing(ring) {
        return this.equip("ring", ring);
    }

    unequipRing() {
        return this.unequip("ring");
    }

    equipHelmet(helmet) {
        return this.equip("helmet", helmet);
    }

    unequipHelmet() {
        return this.unequip("helmet");
    }

    equipGloves(gloves) {
        return this.equip("gloves", gloves);
    }

    unequipGloves() {
        return this.unequip("gloves");
    }

    equipBoots(boots) {
        return this.equip("boots", boots);
    }

    unequipBoots() {
        return this.unequip("boots");
    }

    grow() {
        // Increase player's max health and attributes on level up
        this.player.maxHealth += Math.floor(Math.random() * this.player.constitution / 10  + 5);
        this.player.health = this.player.maxHealth; // Heal to full on level up
        this.player.strength += 2;
        this.player.dexterity += 2;
        this.player.intelligence += 2;
        this.player.wisdom += 2;
        this.player.charisma += 2;
        this.player.luck += 2;
        this.player.constitution += 2;
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

        // Attributes (1-100 scale)
        this.strength = 50; // Strength attribute
        this.dexterity = 50; // Dexterity attribute
        this.intelligence = 50; // Intelligence attribute
        this.wisdom = 50; // Wisdom attribute
        this.charisma = 50; // Charisma attribute
        this.constitution = 50; // Constitution attribute
        this.luck = 50; // Luck attribute
        this.experience = 0; // Experience points
        this.name = 'Hero Protagonist';
        this.class = 'Adventurer'; // Player class
        this.nextFreeHealTime = 3000; // Next time the player can heal
    }

    equippedWeapon() {
        return this.body.weapon;
    }

    equippedArmor() {
        return [
            this.body.helmet,
            this.body.armor,
            this.body.boots,
            this.body.gloves,
            this.body.ring,
        ].filter((a) => !(a instanceof EmptyItem) && a !== null);
    }

    carriedWeight() {
        let total = 0;
        for (const category in this.inventory) {
            if (Array.isArray(this.inventory[category])) {
                for (const item of this.inventory[category]) {
                    if (item.weight) total += item.weight;
                }
            }
        }
        for (const armor of this.equippedArmor()) {
            if (armor.weight) total += armor.weight;
        }
        const weapon = this.equippedWeapon();
        if (weapon && weapon.weight) total += weapon.weight;
        return total;
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

    getDefense() {
        const armor = this.equippedArmor();
        let baseDefense = 0;
        let bonusDefense = 0;
        for (const piece of armor) {
            const def = piece.getDefense();
            baseDefense += def.base;
            bonusDefense += def.bonus;
        }
        // Dexterity bonus
        const dexBonus = Math.floor((this.dexterity - 50) / 10);
        return {
            base: baseDefense,
            bonus: bonusDefense + dexBonus,
        };
    }

    // Health management
    heal(amount) {
        const missingHealth = this.maxHealth - this.health;
        if (missingHealth <= 0) return 0; // Already at max health

        const amountLeft = Math.max(0, missingHealth - amount);
        this.health += amountLeft;

        return amount - amountLeft; // Return actual amount healed
    }

    hitPlayer(possibleDamage) {
        const defense = this.getDefense();
        const actualDefense = Math.floor((Math.random() * defense.base)) + defense.bonus;
        const actualDamage = Math.max(0, possibleDamage - actualDefense);

        this.health -= actualDamage;
        return actualDamage;
    }

    isDead() {
        return this.health <= 0;
    }

    // Equipment management
    equipWeapon(weapon) {
        this.inventory.weapons.splice(this.inventory.weapons.indexOf(weapon), 1);
        const oldWeapon = this.unEquipWeapon();
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
        if (!bodyLocation || !['helmet', 'armor', 'gloves', 'boots', 'ring'].includes(bodyLocation)) {
            return false;
        }
        this.inventory.armor.splice(this.inventory.armor.indexOf(armor), 1);
        const oldArmor = this.unEquipArmor(armor);
        this.body.equip(bodyLocation, armor);
        return oldArmor;
    }

    unEquipArmor(armor) {
        const {bodyLocation} = armor;
        if (!bodyLocation || !['helmet', 'armor', 'gloves', 'boots', 'ring'].includes(bodyLocation)) {
            return null;
        }
        const oldArmor = this.body.unequip(bodyLocation);
        if (oldArmor && !(oldArmor instanceof EmptyItem)) {
            this.inventory.armor.push(armor);
            return oldArmor;
        }
        return null;
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
        if (!this.game.dungeon.canDropHere(this.x, this.y, this.game.itemManager.items)) {
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

    chanceToEvade() {
        // Base 5% chance to evade
        let chance = 5;
        // Increase chance based on dexterity (up to +10%)
        chance += Math.floor((this.dexterity - 50) / 5);
        // Cap at 20%
        if (chance > 20) chance = 20;
        // if you're carrying a heavy load compared to your strength, reduce chance
        const carried = this.carriedWeight();
        const strengthCapacity = this.strength * 2; // arbitrary capacity
        if (carried > strengthCapacity) {
            const overload = carried - strengthCapacity;
            chance -= Math.floor(overload / 10); // lose 1% per 10 units overloaded
            if (chance < 0) chance = 0;
        }

        return chance;
    }

}
