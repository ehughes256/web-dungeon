
// Constants for item spawning and generation
const ITEM_SPAWN_CHANCE = 0.7;
const MAX_ITEMS_PER_ROOM = 3;

// Weapon constants moved to weapons.js

const ARMOR_CONFIGS = {
    tatteredCloak: {
        defense: 1,
        speed: 18,
        weight: 3,
        size: 5,
        dropChance: 0.08,
        levelRange: [1, 2],
        color: '#888888',
        bodyLocation: 'armor'
    },
    paddedCap: {
        defense: 2,
        speed: 8,
        weight: 6,
        size: 6,
        dropChance: 0.07,
        levelRange: [1, 2],
        color: '#8888ff',
        bodyLocation: 'helmet'
    },
    wornSandals: {
        defense: 1,
        speed: 10,
        weight: 4,
        size: 5,
        dropChance: 0.08,
        levelRange: [1, 2],
        color: '#aa8844',
        bodyLocation: 'boots'
    },
    raggedGloves: {
        defense: 1,
        speed: 9,
        weight: 3,
        size: 4,
        dropChance: 0.07,
        levelRange: [1, 2],
        color: '#4444ff',
        bodyLocation: 'gloves'
    },
    clothRobe: {
        defense: 2,
        speed: 20,
        weight: 5,
        size: 5,
        dropChance: 0.1,
        levelRange: [1, 5],
        color: '#4444ff',
        bodyLocation: 'armor'
    },
    leatherHelm: {
        defense: 5,
        speed: 10,
        weight: 10,
        size: 10,
        dropChance: 0.08,
        levelRange: [1, 3],
        color: '#aa8844',
        bodyLocation: 'helmet'
    },
    ironHelmet: {
        defense: 10,
        speed: 15,
        weight: 25,
        size: 10,
        dropChance: 0.05,
        levelRange: [2, 6],
        color: '#8888ff',
        bodyLocation: 'helmet'
    },
    leatherVest: {
        defense: 10,
        speed: 10,
        weight: 20,
        size: 20,
        dropChance: 0.08,
        levelRange: [1, 4],
        color: '#aa8844',
        bodyLocation: 'armor'
    },
    chainMail: {
        defense: 20,
        speed: 20,
        weight: 50,
        size: 25,
        dropChance: 0.06,
        levelRange: [2, 6],
        color: '#8888ff',
        bodyLocation: 'armor'
    },
    plateMail: {
        defense: 30,
        speed: 30,
        weight: 80,
        size: 30,
        dropChance: 0.03,
        levelRange: [4, 8],
        color: '#4444ff',
        bodyLocation: 'armor'
    },
    leatherBoots: {
        defense: 5,
        speed: 12,
        weight: 10,
        size: 10,
        dropChance: 0.09,
        levelRange: [1, 3],
        color: '#aa8844',
        bodyLocation: 'boots'
    },
    ironBoots: {
        defense: 12,
        speed: 20,
        weight: 30,
        size: 15,
        dropChance: 0.06,
        levelRange: [2, 5],
        color: '#8888ff',
        bodyLocation: 'boots'
    },
    leatherGloves: {
        defense: 4,
        speed: 10,
        weight: 8,
        size: 8,
        dropChance: 0.08,
        levelRange: [1, 3],
        color: '#4444ff',
        bodyLocation: 'gloves'
    },
    ironGauntlets: {
        defense: 10,
        speed: 18,
        weight: 20,
        size: 12,
        dropChance: 0.05,
        levelRange: [3, 6],
        color: '#4444ff',
        bodyLocation: 'gloves'
    },
    protectionRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.03,
        levelRange: [2, 8],
        color: '#ffaa00',
        bodyLocation: 'ring',
        bonuses: {defense: 5}
    }
};

// Potion-related code has been moved to potions.js
// Scroll-related code has been moved to scrolls.js


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

        // Increase speed penalty
        this.speed = Math.abs(this.speed) * 1.5;
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
        Game.player.addGold(this.amount);
        game.addMessage(`Found ${this.amount} gold!`);
    }
}

// Potion classes have been moved to potions.js
// Weapon classes have been moved to weapons.js

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

// ==== Armor System (restored) ====
class Armor extends EquippableItem {
    constructor(x, y, name, bodyLocation, configKey = null) {
        super(x, y, name, bodyLocation);
        this.speed = 0;
        this.weight = 0;
        this.size = 0;
        this.bonuses = {};
        this.enchantments = {};
        this.defense = 0;

        // Apply config if provided
        if (configKey && ARMOR_CONFIGS[configKey]) {
            this.applyConfig(ARMOR_CONFIGS[configKey]);
        }
    }

    // Helper method to apply configuration
    applyConfig(config) {
        if (config.defense !== undefined) this.defense = config.defense;
        if (config.speed !== undefined) this.speed = config.speed;
        if (config.weight !== undefined) this.weight = config.weight;
        if (config.size !== undefined) this.size = config.size;
        if (config.bonuses) this.bonuses = {...config.bonuses};
    }

    getDefense() {
        return {
            base: this.defense,
            bonus: this.getDefenseBonus(),
            fromBonus: this.bonuses.defense || 0,
            fromEnchantment: this.enchantments.defense || 0
        };
    }

    getDefenseBonus() {
        return (this.bonuses.defense || 0) + (this.enchantments.defense || 0);
    }

    getEncumbrance() {
        return this.weight / Math.max(1, this.size);
    }

    getSymbol() {
        return '[';
    }

    getColor() {
        return '#4444ff';
    }

    onCollect(game) {
        const copy = this.createInventoryCopy();
        Game.player.addArmor(copy);
        game.addMessage(`Found a ${this.name}!`);
    }

    getType() {
        return 'armor';
    }
}

class BodyArmor extends Armor {
    constructor(x, y, name, configKey = null) {
        super(x, y, name, 'armor', configKey);
    }

    getSymbol() {
        return '[';
    }
}

class Gloves extends Armor {
    constructor(x, y, name, configKey = null) {
        super(x, y, name, 'gloves', configKey);
    }

    getSymbol() {
        return '}';
    }
}

class Shoes extends Armor {
    constructor(x, y, name, configKey = null) {
        super(x, y, name, 'boots', configKey);
    }

    getSymbol() {
        return 'v';
    }
}

// Low-level armor (new / common early)
class TatteredCloak extends BodyArmor {
    static dropChance = ARMOR_CONFIGS.tatteredCloak.dropChance;
    static levelRange = ARMOR_CONFIGS.tatteredCloak.levelRange;

    constructor(x, y) {
        super(x, y, 'Tattered Cloak', 'tatteredCloak');
        this.description = 'Shredded fabric offering the barest whisper of protection.';
    }

    getColor() {
        return ARMOR_CONFIGS.tatteredCloak.color;
    }
}

class Helmet extends Armor {
    static dropChance = 0.07;
    static levelRange = [1, 2];

    constructor(x, y, name, configKey = null) {
        super(x, y, name, 'helmet', configKey);
    }

    getSymbol() {
        return '^';
    }
}

class PaddedCap extends Helmet {
    static dropChance = ARMOR_CONFIGS.paddedCap.dropChance;
    static levelRange = ARMOR_CONFIGS.paddedCap.levelRange;

    constructor(x, y) {
        super(x, y, 'Padded Cap', 'paddedCap');
        this.description = 'Layers of cloth and batting absorb a little of the world\'s cruelty.';
    }

    getColor() {
        return ARMOR_CONFIGS.paddedCap.color;
    }
}

class WornSandals extends Shoes {
    static dropChance = ARMOR_CONFIGS.wornSandals.dropChance;
    static levelRange = ARMOR_CONFIGS.wornSandals.levelRange;

    constructor(x, y) {
        super(x, y, 'Worn Sandals', 'wornSandals');
        this.description = 'Leather thongs and tired soles—better than bare stone beneath you.';
    }

    getColor() {
        return ARMOR_CONFIGS.wornSandals.color;
    }
}

class RaggedGloves extends Gloves {
    static dropChance = ARMOR_CONFIGS.raggedGloves.dropChance;
    static levelRange = ARMOR_CONFIGS.raggedGloves.levelRange;

    constructor(x, y) {
        super(x, y, 'Ragged Gloves', 'raggedGloves');
        this.description = 'Frayed finger coverings that keep grime out more than blades.';
    }
}

// Mid baseline cloth
class ClothRobe extends BodyArmor {
    static dropChance = ARMOR_CONFIGS.clothRobe.dropChance;
    static levelRange = ARMOR_CONFIGS.clothRobe.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Cloth Robe', 'clothRobe');
        this.description = 'Simple woven garments—little protection, but movement comes easily.';
    }
}

// Standard armor & accessories (moved here after Armor so inheritance works)
class LeatherHelm extends Helmet {
    static dropChance = ARMOR_CONFIGS.leatherHelm.dropChance;
    static levelRange = ARMOR_CONFIGS.leatherHelm.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Leather Helm', 'leatherHelm');
        this.description = 'Cured leather shaped to turn aside glancing cuts and falling grit.';
    }

    getColor() {
        return ARMOR_CONFIGS.leatherHelm.color;
    }
}

class IronHelmet extends Helmet {
    static dropChance = ARMOR_CONFIGS.ironHelmet.dropChance;
    static levelRange = ARMOR_CONFIGS.ironHelmet.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Iron Helmet', 'ironHelmet');
        this.description = 'A riveted iron dome—heavy, but reassuring when arrows whisper past.';
    }

    getColor() {
        return ARMOR_CONFIGS.ironHelmet.color;
    }
}

class LeatherVest extends BodyArmor {
    static dropChance = ARMOR_CONFIGS.leatherVest.dropChance;
    static levelRange = ARMOR_CONFIGS.leatherVest.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Leather Vest', 'leatherVest');
        this.description = 'Supple layers of boiled leather—light, flexible, and modestly protective.';
    }

    getColor() {
        return ARMOR_CONFIGS.leatherVest.color;
    }
}

class ChainMail extends BodyArmor {
    static dropChance = ARMOR_CONFIGS.chainMail.dropChance;
    static levelRange = ARMOR_CONFIGS.chainMail.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Chain Mail', 'chainMail');
        this.description = 'Interlocked iron rings that chime softly—a stalwart defense against slashing blows.';
    }

    getColor() {
        return ARMOR_CONFIGS.chainMail.color;
    }
}

class PlateMail extends BodyArmor {
    static dropChance = ARMOR_CONFIGS.plateMail.dropChance;
    static levelRange = ARMOR_CONFIGS.plateMail.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Plate Mail', 'plateMail');
        this.description = 'A walking fortress of tempered plates—few blows land true against such craft.';
    }

    getColor() {
        return ARMOR_CONFIGS.plateMail.color;
    }
}

class LeatherBoots extends Shoes {
    static dropChance = ARMOR_CONFIGS.leatherBoots.dropChance;
    static levelRange = ARMOR_CONFIGS.leatherBoots.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Leather Boots', 'leatherBoots');
        this.description = 'Well-oiled boots that hug the foot—tread soft, tread sure.';
    }

    getColor() {
        return ARMOR_CONFIGS.leatherBoots.color;
    }
}

class IronBoots extends Shoes {
    static dropChance = ARMOR_CONFIGS.ironBoots.dropChance;
    static levelRange = ARMOR_CONFIGS.ironBoots.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Iron Boots', 'ironBoots');
        this.description = 'Clanking sabatons—subtlety traded for steadfast protection.';
    }

    getColor() {
        return ARMOR_CONFIGS.ironBoots.color;
    }
}

class LeatherGloves extends Gloves {
    static dropChance = ARMOR_CONFIGS.leatherGloves.dropChance;
    static levelRange = ARMOR_CONFIGS.leatherGloves.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Leather Gloves', 'leatherGloves');
        this.description = 'Supple gloves improving grip and shielding knuckles from cruel stone.';
    }
}

class IronGauntlets extends Gloves {
    static dropChance = ARMOR_CONFIGS.ironGauntlets.dropChance;
    static levelRange = ARMOR_CONFIGS.ironGauntlets.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Iron Gauntlets', 'ironGauntlets');
        this.description = 'Segmented gauntlets of overlapping plates—turning blades with practiced ease.';
    }
}

class Ring extends Armor {
    constructor(x, y, name, configKey = null) {
        super(x, y, name, 'ring', configKey);
        // Only set defaults if no config provided
        if (!configKey) {
            this.speed = 5;
            this.weight = 1;
            this.size = 1;
            this.defense = 0;
        }
    }

    getSymbol() {
        return 'o';
    }
}

class ProtectionRing extends Ring {
    static dropChance = ARMOR_CONFIGS.protectionRing.dropChance;
    static levelRange = ARMOR_CONFIGS.protectionRing.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Ring of Protection', 'protectionRing');
        this.description = 'A faint, translucent shimmer halos this band—an unseen bulwark against harm.';
    }

    getColor() {
        return ARMOR_CONFIGS.protectionRing.color;
    }
}

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

    // Lazy-initialized item types getter to ensure scroll classes are loaded
    static get itemTypes() {
        if (!this._itemTypes) {
            this._itemTypes = [
                {class: Gold, chance: Gold.dropChance}, // move Gold to top again for clarity
                // Low-level weapons (reduced chances)
                {class: Stick, chance: Stick.dropChance},
                {class: RustyKnife, chance: RustyKnife.dropChance},
                {class: Club, chance: Club.dropChance},
                {class: BoneShard, chance: BoneShard.dropChance},
                // Core consumables & scrolls
                {class: HealthPotion, chance: HealthPotion.dropChance},
                {class: SpeedPotion, chance: SpeedPotion.dropChance},
                {class: PsionicScroll, chance: PsionicScroll.dropChance},
                {class: TeleportScroll, chance: TeleportScroll.dropChance},
                {class: MappingScroll, chance: MappingScroll.dropChance},
                {class: FireballScroll, chance: FireballScroll.dropChance},
                {class: RegenerationScroll, chance: RegenerationScroll.dropChance},
                {class: EnchantmentScroll, chance: EnchantmentScroll.dropChance},
                {class: UncurseScroll, chance: UncurseScroll.dropChance},
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

    static createLevelAppropriateItem(x, y, currentLevel, playerLuck = 50) {
        const effectiveLevel = ItemFactory.calculateEffectiveLevel(currentLevel, playerLuck);

        // Filter items that are appropriate for this level (with luck modifier)
        const validItems = ItemFactory.itemTypes.filter(itemType => {
            const levelRange = itemType.class.levelRange;
            if (!levelRange) return true; // Items without level range are always valid

            // Item is valid if the effective level overlaps with its level range
            return effectiveLevel >= levelRange[0] && effectiveLevel <= levelRange[1];
        });

        // If no valid items found (shouldn't happen), fall back to all items
        if (validItems.length === 0) {
            return ItemFactory.createRandomItem(x, y);
        }

        // Use weighted random selection
        const selectedItem = ItemFactory.selectWeightedRandom(validItems);
        if (selectedItem) {
            return new selectedItem.class(x, y);
        }

        // Fallback to first valid item
        return new validItems[0].class(x, y);
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

                    // Chance to curse weapons and armor (5% base chance, increases with level)
                    if (item && (item instanceof Weapon || item instanceof Armor)) {
                        const curseChance = 0.05 + (currentLevel * 0.01); // 5% + 1% per level
                        if (Math.random() < curseChance) {
                            item.applyCurse();
                        }
                    }

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
        Armor,
        Gold,
        EmptyItem,
        LeatherHelm,
        IronHelmet,
        LeatherVest,
        ChainMail,
        PlateMail,
        LeatherBoots,
        IronBoots,
        LeatherGloves,
        IronGauntlets,
        ProtectionRing,
        // Re-export weapon classes from weapons module for backward compatibility
        ...weaponsModule
    };
}
