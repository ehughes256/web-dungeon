
// Constants for item spawning and generation
const ITEM_SPAWN_CHANCE = 0.7;
const MAX_ITEMS_PER_ROOM = 3;

// Weapon constants moved to weapons.js
// Armor constants moved to armor.js

// Potion-related code has been moved to potions.js
// Scroll-related code has been moved to scrolls.js
// Armor-related code has been moved to armor.js


// Base Item class
class Item {
    static dropChance = 0.0;

    static levelRange = [1, 5];

    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.speed = 1; // Time cost to pick up or use
        this.enchantments = {};
        this.bonuses = {};
        this.weight = 0;
        this.size = 0;
        this.identified = false;
        this.cursed = false;
        this.description = 'This is a plain old item.';
    }

    // Apply curse to an item - converts bonuses to negative values
    applyCurse() {
        this.cursed = true;

        // For weapons and armor, invert bonuses
        if (this instanceof Weapon) {
            // Store original damage if not already stored
            if (this.originalDamage === undefined) {
                this.originalDamage = this.damage;
            }
            // Make damage negative or reduce it significantly
            this.damage = -Math.abs(Math.floor(this.originalDamage / 2));

            // Invert any existing bonuses
            if (this.bonuses.damage) this.bonuses.damage = -Math.abs(this.bonuses.damage);
            if (this.bonuses.attack) this.bonuses.attack = -Math.abs(this.bonuses.attack);
        } else if (this instanceof Armor) {
            // Store original defense if not already stored
            if (this.originalDefense === undefined) {
                this.originalDefense = this.defense;
            }
            // Make defense negative
            this.defense = -Math.abs(Math.floor(this.originalDefense / 2));

            // Invert any existing bonuses
            if (this.bonuses.defense) this.bonuses.defense = -Math.abs(this.bonuses.defense);
        }
        // Consumables (potions, scrolls, wands) just get the cursed flag;
        // inverted behavior is handled in each use() method

        // Increase speed penalty for equippables
        if (this instanceof Weapon || this instanceof Armor) {
            this.speed = Math.abs(this.speed) * 1.5;
        }
    }

    // Remove curse from an item - restores original values
    removeCurse() {
        if (!this.cursed) return;

        this.cursed = false;

        if (this instanceof Weapon) {
            if (this.originalDamage !== undefined) {
                this.damage = this.originalDamage;
            }
            // Restore bonuses to positive
            if (this.bonuses.damage) this.bonuses.damage = Math.abs(this.bonuses.damage);
            if (this.bonuses.attack) this.bonuses.attack = Math.abs(this.bonuses.attack);
        } else if (this instanceof Armor) {
            if (this.originalDefense !== undefined) {
                this.defense = this.originalDefense;
            }
            // Restore bonuses to positive
            if (this.bonuses.defense) this.bonuses.defense = Math.abs(this.bonuses.defense);
        }

        // Restore normal speed
        this.speed = Math.abs(this.speed) / 1.5;
    }

    isCursed() {
        return this.cursed === true;
    }

    // Abstract methods to be implemented by subclasses
    getSymbol() {
        throw new Error('getSymbol must be implemented by subclass');
    }

    getWeight() {
        return this.weight;
    }

    getColor() {
        throw new Error('getColor must be implemented by subclass');
    }

    onCollect(game) {
        throw new Error('onCollect must be implemented by subclass');
    }

    onDrop(game) {
    }

    use(game) {
    }

    remove(game) {
    }

    getType() {
        return this.constructor.name.toLowerCase();
    }

    // Get display name respecting identification status
    getDisplayName() {
        let displayName = this.baseName || this.name;

        // Show elemental prefix if identified and has elemental damage (weapons)
        if (this.identified && this instanceof Weapon && this.enchantments && this.enchantments.elemental) {
            const elements = Object.keys(this.enchantments.elemental);
            if (elements.length > 0) {
                const primaryElement = elements[0];
                const elementName = primaryElement.charAt(0).toUpperCase() + primaryElement.slice(1);
                displayName = `${elementName} ${displayName}`;
            }
        }

        // Show resistance prefix if identified and has resistances (armor)
        if (this.identified && this instanceof Armor && this.enchantments && this.enchantments.resistances) {
            const elements = Object.keys(this.enchantments.resistances);
            if (elements.length > 0) {
                const primaryElement = elements[0];
                const elementName = primaryElement.charAt(0).toUpperCase() + primaryElement.slice(1);
                displayName = `${elementName}-resistant ${displayName}`;
            }
        }

        // Show quality bonus if identified
        if (this.identified && this.qualityBonus && this.qualityBonus > 0) {
            displayName = `${displayName} +${this.qualityBonus}`;
        }

        // Show cursed status if identified and cursed
        if (this.identified && this.cursed) {
            displayName = `${displayName} (Cursed)`;
        }

        return displayName;
    }

    // Create a copy for inventory (without position)
    createInventoryCopy() {
        const copy = Object.create(Object.getPrototypeOf(this));
        Object.assign(copy, this);
        delete copy.x;
        delete copy.y;
        return copy;
    }
}

// Load scroll classes in Node.js environment (after Item is defined)
if (typeof require !== 'undefined' && typeof Scroll === 'undefined') {
    // Make Item available globally first so scrolls.js can use it
    global.Item = Item;
    const scrolls = require('./scrolls.js');
    Object.assign(global, scrolls);
}

// Load wand classes in Node.js environment (after Item is defined)
if (typeof require !== 'undefined' && typeof Wand === 'undefined') {
    // Make Item available globally first so wands.js can use it
    global.Item = Item;
    const wands = require('./wands.js');
    Object.assign(global, wands);
}

// Load potion classes in Node.js environment (after Item is defined)
if (typeof require !== 'undefined' && typeof HealthPotion === 'undefined') {
    // Make Item available globally first so potions.js can use it
    global.Item = Item;
    const potions = require('./potions.js');
    Object.assign(global, potions);
}

class EmptyItem extends Item {
    constructor() {
        super(-1, -1, 'Empty');
        this.speed = 0;
        this.weight = 0;
        this.size = 0;
        this.description = 'An empty slot, awaiting plunder hard-won in the depths.';
    }

    getSymbol() {
        return ' ';
    }

    getColor() {
        return '#000000';
    }

    onCollect(game) {
    }

    getDamageBonus() {
        return 0;
    }

    getDamage() {
        return 0;
    }
}

// Gold item class
class Gold extends Item {
    static dropChance = 0.4;

    static levelRange = [1, 100];

    constructor(x, y, amount) {
        const altNames = ['Gold Coins', 'Gold Nugget', 'Treasure', 'Pile of Gold', 'Coin Purse'];
        super(x, y, altNames[Math.floor(Math.random() * altNames.length)]);
        this.speed = 0;
        this.weight = 0;
        this.size = 0;
        this.amount = amount || Math.floor(Math.random() * 50) + 10;
        this.description = 'A glittering promise of tavern songs, arcane reagents, and sharpened steel.';
    }

    getWeight() {
        return Math.ceil(this.amount / 100); // 1 weight per 100 gold
    }

    getSymbol() {
        return '$';
    }

    getColor() {
        return '#ffff00';
    }

    onCollect(game) {
        const baseAmount = this.amount;
        const multiplier = Game.player.getGoldFindBonus();
        const finalAmount = Math.floor(baseAmount * multiplier);
        Game.player.addGold(finalAmount);
        if (multiplier > 1.0) {
            game.addMessage(`Found ${finalAmount} gold! (${baseAmount} base + ${Math.floor((multiplier - 1) * 100)}% bonus)`);
        } else {
            game.addMessage(`Found ${finalAmount} gold!`);
        }
    }
}

// Potion classes have been moved to potions.js
// Weapon classes have been moved to weapons.js

// Key item class
class Key extends Item {
    static dropChance = 0.06;
    static levelRange = [1, 10];

    constructor(x, y) {
        super(x, y, 'Key');
        this.weight = 0;
        this.description = 'A brass skeleton key, worn smooth by countless hands.';
    }

    getSymbol() { return '}'; }
    getColor() { return '#FFD700'; }

    onCollect(game) {
        Game.player.addKey(this);
        game.addMessage('Found a key!');
    }
}

// Lockpick item class
class Lockpick extends Item {
    static dropChance = 0.04;
    static levelRange = [2, 12];

    constructor(x, y) {
        super(x, y, 'Lockpick');
        this.weight = 0;
        this.description = 'A slender steel pick for coaxing stubborn locks.';
    }

    getSymbol() { return '}'; }
    getColor() { return '#C0C0C0'; }

    onCollect(game) {
        Game.player.addLockpick(this);
        game.addMessage('Found a lockpick!');
    }
}

// Food base class
class Food extends Item {
    constructor(x, y, name, hungerRestore, color) {
        super(x, y, name);
        this.hungerRestore = hungerRestore;
        this.color = color;
        this.identified = true;
        this.weight = 2;
    }

    getSymbol() { return '%'; }
    getColor() { return this.color; }

    onCollect(game) {
        Game.player.addFood(this);
        game.addMessage(`Found ${this.name}.`);
    }

    use(game) {
        const restored = Game.player.eat(this.hungerRestore);
        return { message: `You eat the ${this.name}. (+${restored} hunger)`, restored };
    }
}

class Bread extends Food {
    static dropChance = 0.08;
    static levelRange = [1, 8];

    constructor(x, y) {
        super(x, y, 'Bread', 300, '#D2691E');
        this.description = 'A crusty loaf, surprisingly fresh.';
    }
}

class DriedMeat extends Food {
    static dropChance = 0.06;
    static levelRange = [1, 12];

    constructor(x, y) {
        super(x, y, 'Dried Meat', 500, '#8B4513');
        this.description = 'Salt-cured strips of mystery meat.';
    }
}

class Ration extends Food {
    static dropChance = 0.04;
    static levelRange = [3, 15];

    constructor(x, y) {
        super(x, y, 'Iron Ration', 800, '#808080');
        this.description = 'A compact military ration, nourishing if bland.';
    }
}

class Fruit extends Food {
    static dropChance = 0.07;
    static levelRange = [1, 6];

    constructor(x, y) {
        super(x, y, 'Dungeon Fruit', 200, '#32CD32');
        this.description = 'A strange luminescent fruit.';
    }
}

class EquippableItem extends Item {
    constructor(x, y, name, bodyLocation = null) {
        super(x, y, name);
        this.bodyLocation = bodyLocation;
    }
}

// Import weapon classes after EquippableItem is defined (for Node.js environment)
let weaponsModule;
if (typeof require !== 'undefined') {
    // Make EquippableItem available globally so weapons.js can use it
    global.EquippableItem = EquippableItem;
    weaponsModule = require('./weapons.js');
    // Make weapon constants and classes available globally
    Object.assign(global, weaponsModule);
}

// Import armor classes after EquippableItem is defined (for Node.js environment)
let armorModule;
if (typeof require !== 'undefined') {
    // Make EquippableItem available globally so armor.js can use it
    global.EquippableItem = EquippableItem;
    armorModule = require('./armor.js');
    // Make armor constants and classes available globally
    Object.assign(global, armorModule);
}

// Item Rarity System
const ItemRarity = {
    COMMON: { name: 'Common', color: '#aaaaaa', enchantChance: 0.0, qualityRange: [0, 0] },
    UNCOMMON: { name: 'Uncommon', color: '#00ff00', enchantChance: 0.1, qualityRange: [0, 1] },
    RARE: { name: 'Rare', color: '#0088ff', enchantChance: 0.3, qualityRange: [1, 2] },
    EPIC: { name: 'Epic', color: '#aa00ff', enchantChance: 0.6, qualityRange: [2, 3] },
    LEGENDARY: { name: 'Legendary', color: '#ff8800', enchantChance: 1.0, qualityRange: [3, 5] }
};

// Item Categories for easier filtering
const ItemCategory = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    POTION: 'potion',
    SCROLL: 'scroll',
    WAND: 'wand',
    GOLD: 'gold',
    CONSUMABLE: 'consumable'
};

// Item factory for creating items
class ItemFactory {
    // Helper method to calculate effective level with luck modifier
    static calculateEffectiveLevel(currentLevel, playerLuck = 50) {
        // Luck 0 = -2 levels, Luck 50 = 0 levels, Luck 100 = +2 levels
        const luckModifier = Math.floor((playerLuck - 50) / 25);
        return Math.max(1, currentLevel + luckModifier);
    }

    // Helper method for weighted random selection from item list
    static selectWeightedRandom(items) {
        if (items.length === 0) return null;
        const totalChance = items.reduce((sum, it) => sum + it.chance, 0);
        let rand = Math.random() * totalChance;
        for (const item of items) {
            if (rand < item.chance) return item;
            rand -= item.chance;
        }
        return items[0]; // fallback to first item
    }

    // Get item category from class
    static getItemCategory(itemClass) {
        if (itemClass.prototype instanceof Weapon || itemClass === Weapon) return ItemCategory.WEAPON;
        if (itemClass.prototype instanceof Armor || itemClass === Armor) return ItemCategory.ARMOR;
        if (itemClass.prototype instanceof Wand || itemClass === Wand) return ItemCategory.WAND;
        if (itemClass.prototype instanceof Scroll || itemClass === Scroll) return ItemCategory.SCROLL;
        if (itemClass.name && itemClass.name.includes('Potion')) return ItemCategory.POTION;
        if (itemClass === Gold) return ItemCategory.GOLD;
        return ItemCategory.CONSUMABLE;
    }

    // Scale drop chance based on level progression (makes rare items more common at higher levels)
    static scaleDropChance(baseChance, itemLevelRange, currentLevel) {
        if (!itemLevelRange) return baseChance;

        const [minLevel, maxLevel] = itemLevelRange;
        const levelMid = (minLevel + maxLevel) / 2;

        // Items are most common around their mid-level
        if (currentLevel < minLevel) {
            return baseChance * 0.5; // Slightly reduce chance before level range
        } else if (currentLevel > maxLevel) {
            return baseChance * 0.7; // Reduce chance after level range
        } else {
            // Within range: increase chance as we approach mid-level
            const progressInRange = (currentLevel - minLevel) / (maxLevel - minLevel);
            const distanceFromMid = Math.abs(progressInRange - 0.5) * 2; // 0 at mid, 1 at edges
            return baseChance * (1.0 + (1.0 - distanceFromMid) * 0.5); // Up to 1.5x at mid-level
        }
    }

    // Apply random enchantment to an item based on rarity
    static applyRandomEnchantment(item, rarity, currentLevel) {
        if (!(item instanceof Weapon || item instanceof Armor)) return;
        if (Math.random() > rarity.enchantChance) return;

        const enchantPower = Math.floor(Math.random() * 3) + 1 + Math.floor(currentLevel / 10);

        if (item instanceof Weapon) {
            item.enchantments.damage = (item.enchantments.damage || 0) + enchantPower;

            // Chance for elemental enchantment on higher rarity weapons
            if (rarity === ItemRarity.RARE || rarity === ItemRarity.EPIC || rarity === ItemRarity.LEGENDARY) {
                ItemFactory.applyElementalEnchantment(item, rarity, currentLevel);
            }
        } else if (item instanceof Armor) {
            item.enchantments.defense = (item.enchantments.defense || 0) + enchantPower;

            // Chance for elemental resistance on higher rarity armor
            if (rarity === ItemRarity.RARE || rarity === ItemRarity.EPIC || rarity === ItemRarity.LEGENDARY) {
                ItemFactory.applyResistanceEnchantment(item, rarity, currentLevel);
            }
        }
    }

    // Apply elemental enchantment to a weapon
    static applyElementalEnchantment(weapon, rarity, currentLevel) {
        if (!(weapon instanceof Weapon)) return;

        // Chance for elemental damage based on rarity
        let elementalChance = 0;
        if (rarity === ItemRarity.RARE) elementalChance = 0.3;
        if (rarity === ItemRarity.EPIC) elementalChance = 0.5;
        if (rarity === ItemRarity.LEGENDARY) elementalChance = 0.8;

        if (Math.random() > elementalChance) return;

        // Choose random element
        const elements = ['fire', 'ice', 'lightning', 'poison', 'holy', 'dark'];
        const element = elements[Math.floor(Math.random() * elements.length)];

        // Calculate elemental damage (scales with level and rarity)
        let elementalDamage = Math.floor(Math.random() * 3) + 2; // 2-4 base
        if (rarity === ItemRarity.EPIC) elementalDamage += 2;
        if (rarity === ItemRarity.LEGENDARY) elementalDamage += 4;
        elementalDamage += Math.floor(currentLevel / 5); // +1 per 5 levels

        // Apply elemental enchantment
        if (!weapon.enchantments.elemental) {
            weapon.enchantments.elemental = {};
        }
        weapon.enchantments.elemental[element] = elementalDamage;

        // Update weapon name to reflect element (only when identified)
        if (!weapon.baseName) {
            weapon.baseName = weapon.name;
        }
    }

    // Apply resistance enchantment to armor
    static applyResistanceEnchantment(armor, rarity, currentLevel) {
        if (!(armor instanceof Armor)) return;

        // Chance for resistance based on rarity
        let resistanceChance = 0;
        if (rarity === ItemRarity.RARE) resistanceChance = 0.3;
        if (rarity === ItemRarity.EPIC) resistanceChance = 0.5;
        if (rarity === ItemRarity.LEGENDARY) resistanceChance = 0.8;

        if (Math.random() > resistanceChance) return;

        // Choose random element to resist
        const elements = ['fire', 'ice', 'lightning', 'poison', 'holy', 'dark'];
        const element = elements[Math.floor(Math.random() * elements.length)];

        // Calculate resistance value (percentage, scales with level and rarity)
        let resistance = 0.10 + Math.random() * 0.10; // 10-20% base
        if (rarity === ItemRarity.EPIC) resistance += 0.10; // +10%
        if (rarity === ItemRarity.LEGENDARY) resistance += 0.20; // +20%
        resistance += Math.floor(currentLevel / 10) * 0.05; // +5% per 10 levels

        // Cap at reasonable values
        resistance = Math.min(0.50, resistance); // Max 50% per piece

        // Apply resistance enchantment
        if (!armor.enchantments.resistances) {
            armor.enchantments.resistances = {};
        }
        armor.enchantments.resistances[element] = resistance;

        // Update armor name to reflect resistance (only when identified)
        if (!armor.baseName) {
            armor.baseName = armor.name;
        }
    }

    // Apply quality modifier (+1, +2, etc.) to weapons and armor
    static applyQualityModifier(item, rarity) {
        if (!(item instanceof Weapon || item instanceof Armor)) return;

        const [minQuality, maxQuality] = rarity.qualityRange;
        const quality = Math.floor(Math.random() * (maxQuality - minQuality + 1)) + minQuality;

        if (quality > 0) {
            // Store the base name before modification
            if (!item.baseName) {
                item.baseName = item.name;
            }

            // Store quality as a bonus that will be added when identified
            item.qualityBonus = quality;

            if (item instanceof Weapon) {
                item.damage += quality;
            } else if (item instanceof Armor) {
                item.defense += quality;
            }

            // Don't modify the name yet - it will be done when displayed/identified
        }
    }

    // Determine rarity based on level and luck
    static rollRarity(currentLevel, playerLuck = 50) {
        const luckBonus = (playerLuck - 50) / 100; // -0.5 to +0.5
        const levelBonus = Math.min(0.3, currentLevel / 100); // Up to +0.3 at level 30

        const roll = Math.random() + luckBonus + levelBonus;

        if (roll > 0.98) return ItemRarity.LEGENDARY;
        if (roll > 0.92) return ItemRarity.EPIC;
        if (roll > 0.80) return ItemRarity.RARE;
        if (roll > 0.60) return ItemRarity.UNCOMMON;
        return ItemRarity.COMMON;
    }

    // Lazy-initialized item types getter to ensure scroll classes are loaded
    static get itemTypes() {
        if (!this._itemTypes) {
            this._itemTypes = [
                {class: Gold, chance: Gold.dropChance}, // move Gold to top again for clarity
                {class: Key, chance: Key.dropChance},
                {class: Lockpick, chance: Lockpick.dropChance},
                // Food
                {class: Bread, chance: Bread.dropChance},
                {class: DriedMeat, chance: DriedMeat.dropChance},
                {class: Ration, chance: Ration.dropChance},
                {class: Fruit, chance: Fruit.dropChance},
                // Low-level weapons (reduced chances)
                {class: Stick, chance: Stick.dropChance},
                {class: RustyKnife, chance: RustyKnife.dropChance},
                {class: Club, chance: Club.dropChance},
                {class: BoneShard, chance: BoneShard.dropChance},
                // Core consumables & scrolls
                {class: HealthPotion, chance: HealthPotion.dropChance},
                {class: SpeedPotion, chance: SpeedPotion.dropChance},
                {class: AntidotePotion, chance: AntidotePotion.dropChance},
                {class: PsionicScroll, chance: PsionicScroll.dropChance},
                {class: TeleportScroll, chance: TeleportScroll.dropChance},
                {class: MappingScroll, chance: MappingScroll.dropChance},
                {class: FireballScroll, chance: FireballScroll.dropChance},
                {class: RegenerationScroll, chance: RegenerationScroll.dropChance},
                {class: EnchantmentScroll, chance: EnchantmentScroll.dropChance},
                {class: UncurseScroll, chance: UncurseScroll.dropChance},
                {class: IdentifyScroll, chance: IdentifyScroll.dropChance},
                {class: PoisonEnchantmentScroll, chance: PoisonEnchantmentScroll.dropChance},
                // Wands
                {class: MagicMissileWand, chance: MagicMissileWand.dropChance},
                {class: LightningWand, chance: LightningWand.dropChance},
                {class: FireWand, chance: FireWand.dropChance},
                {class: IceWand, chance: IceWand.dropChance},
                {class: PolymorphWand, chance: PolymorphWand.dropChance},
                {class: SlowWand, chance: SlowWand.dropChance},
                {class: TeleportationWand, chance: TeleportationWand.dropChance},
                {class: DeathWand, chance: DeathWand.dropChance},
                // Weapons - Light/Fast
                {class: SmallDagger, chance: SmallDagger.dropChance},
                {class: Shortsword, chance: Shortsword.dropChance},
                {class: Rapier, chance: Rapier.dropChance},
                // Weapons - Medium
                {class: Longsword, chance: Longsword.dropChance},
                {class: Spear, chance: Spear.dropChance},
                {class: Battleaxe, chance: Battleaxe.dropChance},
                {class: Warhammer, chance: Warhammer.dropChance},
                // Weapons - Heavy/Exotic
                {class: Greatsword, chance: Greatsword.dropChance},
                {class: Halberd, chance: Halberd.dropChance},
                {class: EnchantedBlade, chance: EnchantedBlade.dropChance},
                {class: DragonSlayer, chance: DragonSlayer.dropChance},
                // Armor (low-level first)
                {class: TatteredCloak, chance: TatteredCloak.dropChance},
                {class: PaddedCap, chance: PaddedCap.dropChance},
                {class: WornSandals, chance: WornSandals.dropChance},
                {class: RaggedGloves, chance: RaggedGloves.dropChance},
                {class: ClothRobe, chance: ClothRobe.dropChance},
                // Head armor
                {class: LeatherHelm, chance: LeatherHelm.dropChance},
                {class: IronHelmet, chance: IronHelmet.dropChance},
                // Torso armor
                {class: LeatherVest, chance: LeatherVest.dropChance},
                {class: ChainMail, chance: ChainMail.dropChance},
                {class: PlateMail, chance: PlateMail.dropChance},
                // Foot armor
                {class: LeatherBoots, chance: LeatherBoots.dropChance},
                {class: IronBoots, chance: IronBoots.dropChance},
                // Hand armor
                {class: LeatherGloves, chance: LeatherGloves.dropChance},
                {class: IronGauntlets, chance: IronGauntlets.dropChance},
                // Ring armor
                {class: ProtectionRing, chance: ProtectionRing.dropChance},
                {class: StrengthRing, chance: StrengthRing.dropChance},
                {class: DexterityRing, chance: DexterityRing.dropChance},
                {class: IntelligenceRing, chance: IntelligenceRing.dropChance},
                {class: WisdomRing, chance: WisdomRing.dropChance},
                {class: RegenerationRing, chance: RegenerationRing.dropChance},
                {class: VampiricRing, chance: VampiricRing.dropChance},
                {class: FireResistanceRing, chance: FireResistanceRing.dropChance},
                {class: IceResistanceRing, chance: IceResistanceRing.dropChance},
                {class: LightningResistanceRing, chance: LightningResistanceRing.dropChance},
                {class: AccuracyRing, chance: AccuracyRing.dropChance},
                {class: EvasionRing, chance: EvasionRing.dropChance},
                {class: SearchingRing, chance: SearchingRing.dropChance},
                {class: WealthRing, chance: WealthRing.dropChance},
                {class: ExperienceRing, chance: ExperienceRing.dropChance},
                {class: TeleportationRing, chance: TeleportationRing.dropChance},
                {class: InvisibilityRing, chance: InvisibilityRing.dropChance},
                {class: BerserkerRing, chance: BerserkerRing.dropChance},
                {class: TurtleRing, chance: TurtleRing.dropChance},
            ];
        }
        return this._itemTypes;
    }

    static createRandomItem(x, y) {
        const selectedItem = ItemFactory.selectWeightedRandom(ItemFactory.itemTypes);
        if (selectedItem) {
            return new selectedItem.class(x, y);
        }
        // Fallback to gold if no other item is selected
        return new Gold(x, y);
    }

    static createLevelAppropriateItem(x, y, currentLevel, playerLuck = 50, options = {}) {
        const {
            forceRarity = null,
            category = null,
            guaranteeEnchantment = false,
            bossDropBonus = false
        } = options;

        const effectiveLevel = ItemFactory.calculateEffectiveLevel(currentLevel, playerLuck);

        // Filter items that are appropriate for this level
        let validItems = ItemFactory.itemTypes.filter(itemType => {
            const levelRange = itemType.class.levelRange;
            if (!levelRange) return true;
            return effectiveLevel >= levelRange[0] && effectiveLevel <= levelRange[1];
        });

        // Filter by category if specified
        if (category) {
            validItems = validItems.filter(itemType =>
                ItemFactory.getItemCategory(itemType.class) === category
            );
        }

        if (validItems.length === 0) {
            return ItemFactory.createRandomItem(x, y);
        }

        // Scale drop chances based on level
        const scaledItems = validItems.map(itemType => ({
            class: itemType.class,
            chance: ItemFactory.scaleDropChance(
                itemType.chance,
                itemType.class.levelRange,
                effectiveLevel
            )
        }));

        // Select item
        const selectedItem = ItemFactory.selectWeightedRandom(scaledItems);
        if (!selectedItem) {
            return new validItems[0].class(x, y);
        }

        const item = new selectedItem.class(x, y);

        // Determine rarity (with boss drop bonus)
        const rarity = forceRarity || ItemFactory.rollRarity(
            currentLevel + (bossDropBonus ? 5 : 0),
            playerLuck + (bossDropBonus ? 20 : 0)
        );

        // Apply rarity effects
        if (item instanceof Weapon || item instanceof Armor) {
            ItemFactory.applyQualityModifier(item, rarity);

            if (guaranteeEnchantment || Math.random() < rarity.enchantChance) {
                ItemFactory.applyRandomEnchantment(item, rarity, currentLevel);
            }

            // Store rarity info
            item.rarity = rarity;
        }

        return item;
    }

    // Get items by category
    static getItemsByCategory(category) {
        return ItemFactory.itemTypes.filter(itemType =>
            ItemFactory.getItemCategory(itemType.class) === category
        );
    }

    // Generate a boss drop (guaranteed high quality)
    static createBossDrop(x, y, currentLevel, playerLuck = 50) {
        // Boss drops are always weapons or armor
        const category = Math.random() < 0.5 ? ItemCategory.WEAPON : ItemCategory.ARMOR;

        return ItemFactory.createLevelAppropriateItem(x, y, currentLevel, playerLuck, {
            category: category,
            bossDropBonus: true,
            guaranteeEnchantment: true
        });
    }

    // Generate a treasure chest drop (multiple items, higher quality)
    static createTreasureChestLoot(x, y, currentLevel, playerLuck = 50) {
        const items = [];
        const numItems = Math.floor(Math.random() * 3) + 2; // 2-4 items

        for (let i = 0; i < numItems; i++) {
            // Higher chance of good items from chests
            const item = ItemFactory.createLevelAppropriateItem(
                x, y,
                currentLevel + 2, // +2 level bonus
                playerLuck + 10,  // +10 luck bonus
                { bossDropBonus: Math.random() < 0.3 } // 30% chance of boss-quality
            );
            items.push(item);
        }

        // Always include gold
        const goldAmount = Math.floor((Math.random() * 100 + 50) * (1 + currentLevel / 10));
        items.push(new Gold(x, y, goldAmount));

        return items;
    }

    // Apply curse chance to an item (called by ItemManager)
    static rollCurse(item, currentLevel) {
        const playerLuck = (typeof Game !== 'undefined' && Game.player) ? Game.player.luck : 50;
        const luckModifier = (50 - playerLuck) / 500; // Luck 0 = +10%, Luck 50 = 0%, Luck 100 = -10%
        const curseChance = Math.max(0.01, 0.05 + (currentLevel * 0.01) + luckModifier);
        if (Math.random() < curseChance) {
            item.applyCurse();
        }
    }

    // Get statistics about the item pool (useful for debugging)
    static getItemPoolStats() {
        const stats = {
            total: ItemFactory.itemTypes.length,
            byCategory: {},
            byLevelRange: {}
        };

        ItemFactory.itemTypes.forEach(itemType => {
            const category = ItemFactory.getItemCategory(itemType.class);
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            const range = itemType.class.levelRange;
            if (range) {
                const rangeKey = `${range[0]}-${range[1]}`;
                stats.byLevelRange[rangeKey] = (stats.byLevelRange[rangeKey] || 0) + 1;
            }
        });

        return stats;
    }
}

// Restored ItemManager class (handles item placement, guaranteed weapon spawn, pickup, and memory)
class ItemManager {
    constructor(game) {
        this.game = game;
        this.itemMemory = new Map(); // key: "x,y" -> {symbol, type}
    }

    // Helper method to check if a location is valid for spawning items
    isValidSpawnLocation(x, y, tile) {
        if (!tile || tile.type !== '.') {
            return false;
        }

        // Check stairs
        if (this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) {
            return false;
        }
        if (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y) {
            return false;
        }

        // Check player position
        return !(x === Game.player.x && y === Game.player.y);
    }

    generateItems() {
        // Clear all items from floor tiles
        for (let y = 0; y < this.game.height; y++) {
            for (let x = 0; x < this.game.width; x++) {
                const tile = this.game.dungeon.getTile(x, y);
                if (tile) {
                    tile.clearItems();
                }
            }
        }
        this.itemMemory = new Map();

        // Ensure at least one level-appropriate weapon spawns
        this.guaranteeWeapon();

        this.game.dungeon.rooms.forEach((room) => {
            const numItems = Math.floor(Math.random() * MAX_ITEMS_PER_ROOM);
            for (let i = 0; i < numItems; i++) {
                if (Math.random() < ITEM_SPAWN_CHANCE) {
                    const x = room.x + Math.floor(Math.random() * room.width);
                    const y = room.y + Math.floor(Math.random() * room.height);

                    const tile = this.game.dungeon.getTile(x, y);
                    if (!this.isValidSpawnLocation(x, y, tile)) {
                        continue;
                    }

                    const currentLevel = Game.player.level;
                    const playerLuck = Game.player.luck;
                    const item = ItemFactory.createLevelAppropriateItem(x, y, currentLevel, playerLuck);

                    // Chance to curse weapons and armor
                    ItemFactory.rollCurse(item, currentLevel);

                    // Store item in the floor tile
                    tile.addItem(item);
                }
            }
        });
        this.updateItemMemory();
    }

    guaranteeWeapon() {
        const weaponClasses = [
            Stick, RustyKnife, Club, BoneShard,
            SmallDagger, Shortsword, Rapier, Longsword, Spear,
            Battleaxe, Warhammer, Greatsword, Halberd,
            EnchantedBlade, DragonSlayer
        ];

        const currentLevel = Game.player.level;
        const playerLuck = Game.player.luck || 50;
        const effectiveLevel = ItemFactory.calculateEffectiveLevel(currentLevel, playerLuck);

        // Phase out primitive weapons after early game
        const phased = weaponClasses.filter(wc => {
            if (effectiveLevel >= PRIMITIVE_WEAPON_PHASE_OUT_LEVEL && (wc === Stick || wc === BoneShard)) {
                return false;
            }
            if (effectiveLevel >= BASIC_WEAPON_PHASE_OUT_LEVEL && (wc === RustyKnife || wc === Club)) {
                return false;
            }
            const lr = wc.levelRange;
            if (!lr) return true;
            return effectiveLevel >= lr[0] && effectiveLevel <= lr[1];
        });

        const validWeapons = phased.length ? phased : weaponClasses;
        if (validWeapons.length === 0) {
            validWeapons.push(SmallDagger, Shortsword);
        }

        const weaponClass = validWeapons[Math.floor(Math.random() * validWeapons.length)];

        let attempts = 0;
        while (attempts < WEAPON_SPAWN_MAX_ATTEMPTS) {
            attempts++;
            const room = this.game.dungeon.rooms[Math.floor(Math.random() * this.game.dungeon.rooms.length)];
            const x = room.x + Math.floor(Math.random() * room.width);
            const y = room.y + Math.floor(Math.random() * room.height);
            const tile = this.game.dungeon.getTile(x, y);

            if (this.isValidSpawnLocation(x, y, tile)) {
                // Store weapon in floor tile
                const weapon = new weaponClass(x, y);

                // Small chance to curse even the guaranteed weapon (lower than normal items)
                const curseChance = 0.03 + (currentLevel * 0.005); // 3% + 0.5% per level
                if (Math.random() < curseChance) {
                    weapon.applyCurse();
                }

                tile.addItem(weapon);
                break;
            }
        }
    }

    checkForItems() {
        const p = Game.player;
        const tile = this.game.dungeon.getTile(p.x, p.y);
        if (tile && tile.hasItems()) {
            // Pick up the top item (last in the list)
            const item = tile.getTopItem();
            if (item) {
                item.onCollect(this.game);
                tile.removeItem(item);
                this.itemMemory.delete(`${p.x},${p.y}`);
                this.game.updateUI();
                return true;
            }
        }
        return false;
    }

    updateItemMemory() {
        if (!this.itemMemory) this.itemMemory = new Map();
        for (let y = 0; y < this.game.height; y++) {
            for (let x = 0; x < this.game.width; x++) {
                const tile = this.game.dungeon.getTile(x, y);
                if (tile && tile.hasItems() && this.game.visible[y] && this.game.visible[y][x]) {
                    const item = tile.getTopItem(); // Show the top item
                    if (item) {
                        this.itemMemory.set(`${x},${y}`, {
                            symbol: item.getSymbol(),
                            type: item.getType(),
                        });
                    }
                }
            }
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        ItemFactory,
        ItemManager,
        Item,
        EquippableItem,
        Gold,
        EmptyItem,
        Key,
        Lockpick,
        Food,
        Bread,
        DriedMeat,
        Ration,
        Fruit,
        ItemRarity,
        ItemCategory,
        // Re-export weapon classes from weapons module for backward compatibility
        ...weaponsModule,
        // Re-export armor classes from armor module for backward compatibility
        ...armorModule
    };
}
