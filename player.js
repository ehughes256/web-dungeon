class PlayerBody {
    static armorLocations = ['helmet', 'armor', 'gloves', 'boots', 'ring'];

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

        // Check if item is cursed
        if (oldItem && oldItem.cursed) {
            return null; // Cannot unequip cursed item
        }

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

    grow() {
        // Increase player's max health and attributes on level up
        this.player.maxHealth += Math.floor(Math.random() * this.player.constitution / 10 + 5);
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
        this.baseSpeed = 100;
        this.speed = 100;
        this.maxHealth = 20;
        this.health = this.maxHealth;
        this.maxMana = 100;
        this.mana = this.maxMana;
        this.level = 1;
        this.inventory = {gold: 0, potions: [], scrolls: [], wands: [], weapons: [], armor: [], keys: [], lockpicks: [], food: []};
        this.hunger = 1000;
        this.maxHunger = 1000;
        this.hungerRate = 1;
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
        this.invisible = false; // Invisibility state
        this.poisoned = false; // Poison status effect
        this.poisonDamage = 0; // Damage per poison tick
        this.poisonTicksRemaining = 0; // How many poison ticks left
    }

    giveStartingEquipment() {
        // Always give a random low-level weapon
        const starterWeapons = [Stick, RustyKnife, Club, BoneShard, SmallDagger];
        const WeaponClass = starterWeapons[Math.floor(Math.random() * starterWeapons.length)];
        const weapon = new WeaponClass(0, 0);
        weapon.identified = true;
        this.addWeapon(weapon);
        this.equipWeapon(weapon);

        // 60% chance of a health potion
        if (Math.random() < 0.6) {
            const potion = new HealthPotion(0, 0);
            potion.identified = true;
            this.addPotion(potion);
        }

        // 40% chance of a second health potion
        if (Math.random() < 0.4) {
            const potion = new HealthPotion(0, 0);
            potion.identified = true;
            this.addPotion(potion);
        }

        // 30% chance of a piece of armor (helmet or body armor)
        if (Math.random() < 0.3) {
            const armor = new Helmet(0, 0, 'Leather Cap');
            armor.defense = 1;
            armor.weight = 3;
            armor.identified = true;
            this.addArmor(armor);
            this.equipArmor(armor);
        }

        // 20% chance of a speed potion
        if (Math.random() < 0.2) {
            const potion = new SpeedPotion(0, 0);
            potion.identified = true;
            this.addPotion(potion);
        }

        // Start with 2 Bread
        this.addFood(new Bread(0, 0));
        this.addFood(new Bread(0, 0));
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

    // Aggregate bonuses from all equipped items
    getEquipmentBonus(bonusType) {
        let total = 0;
        const weapon = this.equippedWeapon();
        if (weapon && weapon.bonuses && weapon.bonuses[bonusType]) {
            total += weapon.bonuses[bonusType];
        }
        for (const armor of this.equippedArmor()) {
            if (armor.bonuses && armor.bonuses[bonusType]) {
                total += armor.bonuses[bonusType];
            }
        }
        return total;
    }

    // Get current speed with equipment modifiers and encumbrance
    getCurrentSpeed() {
        let speed = this.baseSpeed + this.getEquipmentBonus('speed');

        // Encumbrance: weight beyond strength capacity slows you down
        const carried = this.carriedWeight();
        const capacity = this.strength * 2;
        if (carried > capacity) {
            const overload = carried - capacity;
            // +1 speed (slower) per 5 weight over capacity, up to +50
            speed += Math.min(50, Math.floor(overload / 5));
        }

        return speed;
    }

    // Get regeneration bonus from equipment
    getRegenerationBonus() {
        return this.getEquipmentBonus('regeneration');
    }

    // Get lifesteal bonus from equipment (percentage)
    getLifestealBonus() {
        return this.getEquipmentBonus('lifesteal');
    }

    // Get elemental resistances
    getFireResistance() {
        return Math.min(0.9, this.getEquipmentBonus('fireResist')); // Cap at 90%
    }

    getIceResistance() {
        return Math.min(0.9, this.getEquipmentBonus('iceResist')); // Cap at 90%
    }

    getLightningResistance() {
        return Math.min(0.9, this.getEquipmentBonus('lightningResist')); // Cap at 90%
    }

    // Get accuracy bonus (percentage)
    getAccuracyBonus() {
        return this.getEquipmentBonus('accuracy') + this.getEquipmentBonus('accuracyBonus');
    }

    // Get evasion bonus (percentage)
    getEvasionBonus() {
        return this.getEquipmentBonus('evasion');
    }

    // Get trap detection bonus (percentage)
    getTrapDetectionBonus() {
        return this.getEquipmentBonus('trapDetection');
    }

    // Get gold find bonus (multiplier)
    getGoldFindBonus() {
        return 1.0 + this.getEquipmentBonus('goldFind');
    }

    // Get experience bonus (multiplier)
    getExperienceBonus() {
        return 1.0 + this.getEquipmentBonus('experience');
    }

    // Get mana bonuses
    getMaxManaBonus() {
        return this.getEquipmentBonus('mana');
    }

    getManaRegenBonus() {
        return this.getEquipmentBonus('manaRegen');
    }

    // Check if player can teleport
    canTeleport() {
        return this.getEquipmentBonus('teleport') > 0;
    }

    // Check if player can go invisible
    canGoInvisible() {
        return this.getEquipmentBonus('invisibility') > 0;
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

        const actualHeal = Math.min(amount, missingHealth);
        this.health += actualHeal;

        return actualHeal; // Return actual amount healed
    }

    // Mana management
    getEffectiveMaxMana() {
        return this.maxMana + this.getMaxManaBonus();
    }

    restoreMana(amount) {
        const maxMana = this.getEffectiveMaxMana();
        const missingMana = maxMana - this.mana;
        if (missingMana <= 0) return 0;

        const actualRestore = Math.min(amount, missingMana);
        this.mana += actualRestore;
        return actualRestore;
    }

    consumeMana(amount) {
        if (this.mana < amount) return false;
        this.mana -= amount;
        return true;
    }

    hitPlayer(possibleDamage, damageType = 'physical') {
        // Check for evasion
        const evasionChance = this.getEvasionBonus();
        if (evasionChance > 0 && Math.random() * 100 < evasionChance) {
            return 0; // Evaded!
        }

        const defense = this.getDefense();
        const actualDefense = Math.floor((Math.random() * defense.base)) + defense.bonus;
        let actualDamage = Math.max(0, possibleDamage - actualDefense);

        // Apply elemental resistances
        if (damageType === 'fire') {
            actualDamage = Math.floor(actualDamage * (1 - this.getFireResistance()));
        } else if (damageType === 'ice') {
            actualDamage = Math.floor(actualDamage * (1 - this.getIceResistance()));
        } else if (damageType === 'lightning') {
            actualDamage = Math.floor(actualDamage * (1 - this.getLightningResistance()));
        }

        // Constitution: poison resistance/vulnerability
        // CON 50 = neutral, CON 100 = 50% resist, CON 10 = 40% extra poison damage
        if (damageType === 'poison') {
            const poisonResist = Math.min(0.5, (this.constitution - 50) / 100);
            actualDamage = Math.max(0, Math.floor(actualDamage * (1 - poisonResist)));
        }

        // Constitution: flat damage reduction (toughness)
        // CON 50 = neutral, high CON reduces, low CON does NOT add damage
        const conReduction = Math.max(0, Math.floor((this.constitution - 50) / 10));
        actualDamage = Math.max(0, actualDamage - conReduction);

        this.health -= actualDamage;
        return actualDamage;
    }

    isDead() {
        return this.health <= 0;
    }

    // Poison status effect
    applyPoison(damagePerTick, ticks) {
        if (this.poisoned) {
            // Stack: add damage, take longer duration
            this.poisonDamage += damagePerTick;
            this.poisonTicksRemaining = Math.max(this.poisonTicksRemaining, ticks);
        } else {
            this.poisoned = true;
            this.poisonDamage = damagePerTick;
            this.poisonTicksRemaining = ticks;
        }
    }

    processPoisonTick(game) {
        if (!this.poisoned || this.poisonTicksRemaining <= 0) {
            this.poisoned = false;
            return 0;
        }

        // CON reduces poison tick damage (same formula as hitPlayer poison resist)
        const poisonResist = Math.min(0.5, (this.constitution - 50) / 100);
        const damage = Math.max(1, Math.floor(this.poisonDamage * (1 - poisonResist)));
        this.health -= damage;
        this.poisonTicksRemaining--;

        if (this.poisonTicksRemaining <= 0) {
            this.poisoned = false;
            game.addMessage('The poison wears off.');
        }

        return damage;
    }

    curePoison() {
        this.poisoned = false;
        this.poisonDamage = 0;
        this.poisonTicksRemaining = 0;
    }

    // Hunger management
    eat(amount) {
        const missing = this.maxHunger - this.hunger;
        const actual = Math.min(amount, missing);
        this.hunger += actual;
        return actual;
    }

    isStarving() {
        return this.hunger <= 0;
    }

    isHungry() {
        return this.hunger < this.maxHunger * 0.15;
    }

    addFood(food) {
        if (!this.inventory.food) this.inventory.food = [];
        const match = this.inventory.food.find(f => f.name === food.name);
        if (match) match.count += 1;
        else {
            food.count = 1;
            this.inventory.food.push(food);
        }
    }

    // Equipment management
    equipWeapon(weapon) {
        // Check if current weapon is cursed before removing anything
        if (this.body.weapon && this.body.weapon.cursed) {
            return 'cursed';
        }
        this.inventory.weapons.splice(this.inventory.weapons.indexOf(weapon), 1);
        const oldWeapon = this.unEquipWeapon();
        this.body.equipWeapon(weapon);

        // Initialize equipped time tracking for gradual identification
        if (weapon && !weapon.identified && weapon.equippedTime === undefined) {
            weapon.equippedTime = 0;
        }

        return oldWeapon;
    }

    unEquipWeapon() {
        // Check if weapon is cursed before attempting to unequip
        if (this.body.weapon && this.body.weapon.cursed) {
            return 'cursed'; // Special return value to indicate cursed item
        }

        const weapon = this.body.unequipWeapon();
        if (weapon && !(weapon instanceof EmptyItem)) {
            this.inventory.weapons.push(weapon);
            return weapon;
        }
        return null;
    }

    equipArmor(armor) {
        const {bodyLocation} = armor;
        if (!bodyLocation || !PlayerBody.armorLocations.includes(bodyLocation)) {
            return false;
        }
        // Check if current item in that slot is cursed before removing anything
        const equippedItem = this.body[bodyLocation];
        if (equippedItem && equippedItem.cursed) {
            return 'cursed';
        }
        this.inventory.armor.splice(this.inventory.armor.indexOf(armor), 1);
        const oldArmor = this.unEquipArmor(armor);
        this.body.equip(bodyLocation, armor);

        // Initialize equipped time tracking for gradual identification
        if (armor && !armor.identified && armor.equippedTime === undefined) {
            armor.equippedTime = 0;
        }

        return oldArmor;
    }

    unEquipArmor(armor) {
        const {bodyLocation} = armor;
        if (!bodyLocation || !PlayerBody.armorLocations.includes(bodyLocation)) {
            return null;
        }

        // Check if armor is cursed before attempting to unequip
        const equippedItem = this.body[bodyLocation];
        if (equippedItem && equippedItem.cursed) {
            return 'cursed'; // Special return value to indicate cursed item
        }

        const oldArmor = this.body.unequip(bodyLocation);
        if (oldArmor && !(oldArmor instanceof EmptyItem)) {
            this.inventory.armor.push(oldArmor);
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
        const match = this.inventory.potions.find((p) => p.name === potion.name && p.healAmount === potion.healAmount && !!p.cursed === !!potion.cursed);
        if (match) match.count += 1;
        else {
            potion.count = 1;
            this.inventory.potions.push(potion);
        }
    }

    identifyPotionType(potionName) {
        // Add to global identified types
        if (!Player.identifiedPotionTypes) {
            Player.identifiedPotionTypes = new Set();
        }
        Player.identifiedPotionTypes.add(potionName);

        // Mark all potions of this type as identified in inventory
        if (this.inventory.potions) {
            this.inventory.potions.forEach(p => {
                if (p.name === potionName) {
                    p.identified = true;
                }
            });
        }

        // Mark all potions of this type on the ground as identified
        if (Game.instance && Game.instance.dungeon) {
            for (let y = 0; y < Game.instance.height; y++) {
                for (let x = 0; x < Game.instance.width; x++) {
                    const tile = Game.instance.dungeon.getTile(x, y);
                    if (tile && tile.items) {
                        tile.items.forEach(item => {
                            if (item instanceof Potion && item.name === potionName) {
                                item.identified = true;
                            }
                        });
                    }
                }
            }
        }
    }

    identifyScrollType(scrollName) {
        // Add to global identified types
        if (!Player.identifiedScrollTypes) {
            Player.identifiedScrollTypes = new Set();
        }
        Player.identifiedScrollTypes.add(scrollName);

        // Mark all scrolls of this type as identified in inventory
        if (this.inventory.scrolls) {
            this.inventory.scrolls.forEach(s => {
                if (s.name === scrollName) {
                    s.identified = true;
                }
            });
        }

        // Mark all scrolls of this type on the ground as identified
        if (Game.instance && Game.instance.dungeon) {
            for (let y = 0; y < Game.instance.height; y++) {
                for (let x = 0; x < Game.instance.width; x++) {
                    const tile = Game.instance.dungeon.getTile(x, y);
                    if (tile && tile.items) {
                        tile.items.forEach(item => {
                            if (item instanceof Scroll && item.name === scrollName) {
                                item.identified = true;
                            }
                        });
                    }
                }
            }
        }
    }

    addScroll(scroll) {
        if (!this.inventory.scrolls) this.inventory.scrolls = [];
        const match = this.inventory.scrolls.find((s) => s.name === scroll.name && s.damage === scroll.damage && !!s.cursed === !!scroll.cursed);
        if (match) match.count += 1;
        else {
            scroll.count = 1;
            this.inventory.scrolls.push(scroll);
        }
    }

    addWand(wand) {
        if (!this.inventory.wands) this.inventory.wands = [];
        // Wands don't stack - each has its own charges
        this.inventory.wands.push(wand);
    }

    identifyWandType(wandName) {
        // Add to global identified types
        if (!Player.identifiedWandTypes) {
            Player.identifiedWandTypes = new Set();
        }
        Player.identifiedWandTypes.add(wandName);

        // Mark all wands of this type as identified in inventory
        if (this.inventory.wands) {
            this.inventory.wands.forEach(w => {
                if (w.name === wandName) {
                    w.identified = true;
                }
            });
        }

        // Mark all wands of this type on the ground as identified
        if (Game.instance && Game.instance.dungeon) {
            for (let y = 0; y < Game.instance.height; y++) {
                for (let x = 0; x < Game.instance.width; x++) {
                    const tile = Game.instance.dungeon.getTile(x, y);
                    if (tile && tile.items) {
                        tile.items.forEach(item => {
                            if (item instanceof Wand && item.name === wandName) {
                                item.identified = true;
                            }
                        });
                    }
                }
            }
        }
    }

    addKey(key) {
        if (!this.inventory.keys) this.inventory.keys = [];
        const match = this.inventory.keys.find(k => k.name === key.name);
        if (match) match.count += 1;
        else {
            key.count = 1;
            this.inventory.keys.push(key);
        }
    }

    hasKey() {
        return this.inventory.keys && this.inventory.keys.length > 0 && this.inventory.keys[0].count > 0;
    }

    useKey() {
        if (!this.hasKey()) return false;
        const key = this.inventory.keys[0];
        key.count -= 1;
        if (key.count <= 0) this.inventory.keys.splice(0, 1);
        return true;
    }

    addLockpick(lockpick) {
        if (!this.inventory.lockpicks) this.inventory.lockpicks = [];
        const match = this.inventory.lockpicks.find(l => l.name === lockpick.name);
        if (match) match.count += 1;
        else {
            lockpick.count = 1;
            this.inventory.lockpicks.push(lockpick);
        }
    }

    hasLockpick() {
        return this.inventory.lockpicks && this.inventory.lockpicks.length > 0 && this.inventory.lockpicks[0].count > 0;
    }

    useLockpick() {
        if (!this.hasLockpick()) return false;
        const lockpick = this.inventory.lockpicks[0];
        lockpick.count -= 1;
        if (lockpick.count <= 0) this.inventory.lockpicks.splice(0, 1);
        return true;
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

        // Add all accuracy bonuses from equipment
        hitChance += this.getAccuracyBonus();

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
        if (!this.game.dungeon.canDropHere(this.x, this.y)) {
            this.game.addMessage('Cannot drop here.');
            return;
        }
        const tile = this.game.dungeon.getTile(this.x, this.y);
        if (!tile) {
            this.game.addMessage('Cannot drop here.');
            return;
        }
        if (category === 'keys') {
            const stack = arr[index];
            const single = new Key(this.x, this.y);
            tile.addItem(single);
            stack.count -= 1;
            if (stack.count <= 0) arr.splice(index, 1);
            this.game.addMessage('You drop a key.');
        } else if (category === 'lockpicks') {
            const stack = arr[index];
            const single = new Lockpick(this.x, this.y);
            tile.addItem(single);
            stack.count -= 1;
            if (stack.count <= 0) arr.splice(index, 1);
            this.game.addMessage('You drop a lockpick.');
        } else if (category === 'food') {
            const stack = arr[index];
            const single = new stack.constructor(this.x, this.y);
            tile.addItem(single);
            stack.count -= 1;
            if (stack.count <= 0) arr.splice(index, 1);
            this.game.addMessage(`You drop ${stack.name}.`);
        } else if (category === 'potions' || category === 'scrolls') {
            const stack = arr[index];
            const single = this.game.instantiateDroppedItem(stack, this.x, this.y);
            if (!single) {
                this.game.addMessage('Failed to drop item.');
                return;
            }
            tile.addItem(single);
            stack.count -= 1;
            if (stack.count <= 0) arr.splice(index, 1);
            const displayName = stack.getDisplayName ? stack.getDisplayName() : stack.name;
            this.game.addMessage(`You drop one ${displayName}.`);
        } else if (category === 'wands') {
            const item = arr.splice(index, 1)[0];
            item.x = this.x;
            item.y = this.y;
            tile.addItem(item);
            const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
            this.game.addMessage(`You drop the ${displayName}.`);
        } else {
            const item = arr.splice(index, 1)[0];
            if (p.equippedWeapon() === item) p.unEquipWeapon();
            if (p.equippedArmor() === item) p.unEquipArmor(item.bodyLocation);
            item.x = this.x;
            item.y = this.y;
            // Place the item on the ground in the floor tile
            tile.addItem(item);
            const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
            this.game.addMessage(`You drop ${displayName}.`);
        }
        this.game.updateUI();
        this.game.consumeTurn(10);
    }

    gainExperience(amount) {
        const baseAmount = amount;
        const multiplier = this.getExperienceBonus();
        const finalAmount = Math.floor(baseAmount * multiplier);
        this.experience += finalAmount;

        if (multiplier > 1.0 && finalAmount > baseAmount) {
            this.game.addMessage(`Gained ${finalAmount} XP (${baseAmount} base + ${Math.floor((multiplier - 1) * 100)}% bonus)!`);
        }

        const expToLevel = this.level * 100;
        if (this.experience >= expToLevel) {
            this.level += 1;
            this.experience -= expToLevel;
            this.body.grow();
            this.game.addMessage(`You leveled up to level ${this.level}!`);
        }
    }

    // Calculate ticks needed to identify an item based on intelligence and wisdom
    getIdentificationTime() {
        const baseTicks = 15000; // Base time to identify by wearing

        // Int and Wis reduce identification time
        // Each 10 points above 50 reduces time by 100 ticks
        const intBonus = Math.floor((this.intelligence - 50) / 10) * 100;
        const wisBonus = Math.floor((this.wisdom - 50) / 10) * 100;

        return Math.max(3000, baseTicks - intBonus - wisBonus);
    }

    // Update equipped items' identification progress
    updateEquippedItemIdentification() {
        const identificationTime = this.getIdentificationTime();
        let identifiedSomething = false;

        // Check weapon
        const weapon = this.equippedWeapon();
        if (weapon && !weapon.identified && weapon.equippedTime !== undefined) {
            weapon.equippedTime++;
            if (weapon.equippedTime >= identificationTime) {
                weapon.identified = true;
                this.game.addMessage(`After using it, you've identified this weapon: ${weapon.getDisplayName()}!`);
                identifiedSomething = true;
            }
        }

        // Check all armor pieces
        for (const armor of this.equippedArmor()) {
            if (!armor.identified && armor.equippedTime !== undefined) {
                armor.equippedTime++;
                if (armor.equippedTime >= identificationTime) {
                    armor.identified = true;
                    this.game.addMessage(`After wearing it, you've identified this armor: ${armor.getDisplayName()}!`);
                    identifiedSomething = true;
                }
            }
        }

        return identifiedSomething;
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
