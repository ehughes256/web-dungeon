
// Constants for item spawning and generation
const ITEM_SPAWN_CHANCE = 0.7;
const MAX_ITEMS_PER_ROOM = 3;
const WEAPON_SPAWN_MAX_ATTEMPTS = 60;
const PRIMITIVE_WEAPON_PHASE_OUT_LEVEL = 3;
const BASIC_WEAPON_PHASE_OUT_LEVEL = 4;

// Item configuration constants - centralized stats for easy balancing
const WEAPON_CONFIGS = {
    stick: {damage: 2, speed: 40, weight: 3, size: 3, dropChance: 0.05, levelRange: [1, 2], color: '#aa8844'},
    rustyKnife: {damage: 4, speed: 32, weight: 4, size: 4, dropChance: 0.045, levelRange: [1, 3], color: '#bb9966'},
    club: {damage: 6, speed: 55, weight: 8, size: 8, dropChance: 0.04, levelRange: [1, 3], color: '#885522'},
    boneShard: {damage: 3, speed: 38, weight: 2, size: 2, dropChance: 0.035, levelRange: [1, 2], color: '#ddd5c5'},
    smallDagger: {damage: 5, speed: 30, weight: 5, size: 5, dropChance: 0.1, levelRange: [1, 5], color: '#ff4444'},
    shortsword: {damage: 7, speed: 40, weight: 7, size: 7, dropChance: 0.08, levelRange: [2, 6], color: '#ff4444'},
    rapier: {damage: 6, speed: 35, weight: 6, size: 6, dropChance: 0.06, levelRange: [3, 7], color: '#ffaa44'},
    longsword: {damage: 15, speed: 50, weight: 20, size: 20, dropChance: 0.07, levelRange: [3, 8], color: '#ff4444'},
    spear: {
        damage: 12,
        speed: 50,
        weight: 20,
        size: 20,
        dropChance: 0.07,
        levelRange: [2, 7],
        color: '#ffcc44',
        symbol: '|'
    },
    battleaxe: {
        damage: 20,
        speed: 50,
        weight: 30,
        size: 20,
        dropChance: 0.06,
        levelRange: [4, 9],
        color: '#ff6644',
        symbol: '¥'
    },
    warhammer: {
        damage: 30,
        speed: 75,
        weight: 50,
        size: 30,
        dropChance: 0.05,
        levelRange: [4, 9],
        color: '#aa4444',
        symbol: 'T'
    },
    greatsword: {
        damage: 30,
        speed: 75,
        weight: 40,
        size: 40,
        dropChance: 0.04,
        levelRange: [5, 10],
        color: '#ff2222',
        symbol: '†'
    },
    halberd: {
        damage: 25,
        speed: 60,
        weight: 35,
        size: 40,
        dropChance: 0.03,
        levelRange: [6, 12],
        color: '#ff4488',
        symbol: 'Þ'
    },
    enchantedBlade: {
        damage: 20,
        speed: 45,
        weight: 20,
        size: 20,
        dropChance: 0.02,
        levelRange: [7, 15],
        color: '#44ffff'
    },
    dragonSlayer: {
        damage: 50,
        speed: 55,
        weight: 45,
        size: 40,
        dropChance: 0.01,
        levelRange: [10, 20],
        color: '#ffdd00',
        symbol: '♦',
        bonuses: {attack: 5, damage: 10}
    }
};

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

class EquippableItem extends Item {
    constructor(x, y, name, bodyLocation = null) {
        super(x, y, name);
        this.bodyLocation = bodyLocation;
    }
}

// Weapon item class
class Weapon extends EquippableItem {
    static baseDamage = 5;

    static baseSpeed = 50; // Base time cost to swing. 2 attacks per 'turn'

    constructor(x, y, name, configKey = null) {
        super(x, y, name, 'weapon');
        this.speed = Weapon.baseSpeed;
        this.weight = 3;
        this.size = 0;
        this.bonuses = {};
        this.enchantments = {};
        this.damage = Weapon.baseDamage;
        this.attackBonus = 0;

        // Apply config if provided
        if (configKey && WEAPON_CONFIGS[configKey]) {
            this.applyConfig(WEAPON_CONFIGS[configKey]);
        }
    }

    // Helper method to apply configuration
    applyConfig(config) {
        if (config.damage !== undefined) this.damage = config.damage;
        if (config.speed !== undefined) this.speed = config.speed;
        if (config.weight !== undefined) this.weight = config.weight;
        if (config.size !== undefined) this.size = config.size;
        if (config.bonuses) this.bonuses = {...config.bonuses};
        // Static properties handled by class
    }

    getSymbol() {
        return '/';
    }

    getColor() {
        return '#ff4444';
    }

    getDamage() {
        return this.damage;
    }

    getDamageBonus() {
        return (this.bonuses.damage || 0) + (this.enchantments.damage || 0);
    }

    getAttackBonus() {
        return (this.bonuses.attack || 0) + (this.enchantments.attack || 0) + this.attackBonus;
    }

    onCollect(game) {
        const weaponCopy = this.createInventoryCopy();
        Game.player.addWeapon(weaponCopy);
        game.addMessage(`Found a ${this.name}!`);
    }

    getType() {
        return 'weapon';
    }
}

class Fists extends Weapon {
    constructor() {
        super(-1, -1, 'Fists');
        this.speed = 30;
        this.weight = 0;
        this.size = 0;
        this.damage = 2;
        this.description = 'Your own two hands—last resort of the desperate and the disciplined.';
    }

    getSymbol() {
        return ' ';
    }

    getColor() {
        return '#ffffff';
    }

    onCollect(game) {
    }
}

// --- New Low-Level Weapons ---
class Stick extends Weapon {
    static dropChance = WEAPON_CONFIGS.stick.dropChance;
    static levelRange = WEAPON_CONFIGS.stick.levelRange;

    constructor(x, y) {
        super(x, y, 'Stick', 'stick');
        this.description = 'A simple length of wood—better than bare hands, barely.';
    }

    getColor() {
        return WEAPON_CONFIGS.stick.color;
    }
}

class RustyKnife extends Weapon {
    static dropChance = WEAPON_CONFIGS.rustyKnife.dropChance;
    static levelRange = WEAPON_CONFIGS.rustyKnife.levelRange;

    constructor(x, y) {
        super(x, y, 'Rusty Knife', 'rustyKnife');
        this.description = 'Pitted and dull, yet still capable of drawing blood.';
    }

    getColor() {
        return WEAPON_CONFIGS.rustyKnife.color;
    }
}

class Club extends Weapon {
    static dropChance = WEAPON_CONFIGS.club.dropChance;
    static levelRange = WEAPON_CONFIGS.club.levelRange;

    constructor(x, y) {
        super(x, y, 'Club', 'club');
        this.description = 'A crude bludgeon hewn from a knot of hardwood.';
    }

    getColor() {
        return WEAPON_CONFIGS.club.color;
    }
}

class BoneShard extends Weapon {
    static dropChance = WEAPON_CONFIGS.boneShard.dropChance;
    static levelRange = WEAPON_CONFIGS.boneShard.levelRange;

    constructor(x, y) {
        super(x, y, 'Bone Shard', 'boneShard');
        this.description = 'A jagged splinter of bone—unpleasant to meet at speed.';
    }

    getColor() {
        return WEAPON_CONFIGS.boneShard.color;
    }
}

// Restored original weapon classes
class SmallDagger extends Weapon {
    static dropChance = WEAPON_CONFIGS.smallDagger.dropChance;
    static levelRange = WEAPON_CONFIGS.smallDagger.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Small Dagger', 'smallDagger');
        this.description = 'A slender blade balanced for quick thrusts—beloved of rogues and alley shadows.';
    }
}

class Shortsword extends Weapon {
    static dropChance = WEAPON_CONFIGS.shortsword.dropChance;
    static levelRange = WEAPON_CONFIGS.shortsword.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Shortsword', 'shortsword');
        this.description = 'A versatile soldier\'s blade—equally suited to parry, riposte, or decisive thrust.';
    }
}

class Rapier extends Weapon {
    static dropChance = WEAPON_CONFIGS.rapier.dropChance;
    static levelRange = WEAPON_CONFIGS.rapier.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Rapier', 'rapier');
        this.description = 'A needle-fine blade tuned for elegance and lethal precision.';
    }

    getColor() {
        return WEAPON_CONFIGS.rapier.color;
    }
}

class Longsword extends Weapon {
    static dropChance = WEAPON_CONFIGS.longsword.dropChance;
    static levelRange = WEAPON_CONFIGS.longsword.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Longsword', 'longsword');
        this.description = 'A knightly blade of balanced heft and reach—reliable in any melee.';
    }
}

class Spear extends Weapon {
    static dropChance = WEAPON_CONFIGS.spear.dropChance;
    static levelRange = WEAPON_CONFIGS.spear.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Spear', 'spear');
        this.description = 'A stout haft ending in a leaf-shaped head—reach keeps foes an arm\'s length away.';
    }

    getSymbol() {
        return WEAPON_CONFIGS.spear.symbol;
    }

    getColor() {
        return WEAPON_CONFIGS.spear.color;
    }
}

class Battleaxe extends Weapon {
    static dropChance = WEAPON_CONFIGS.battleaxe.dropChance;
    static levelRange = WEAPON_CONFIGS.battleaxe.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Battleaxe', 'battleaxe');
        this.description = 'A brutal, bearded axe meant to hew through timber, mail, and bone alike.';
    }

    getSymbol() {
        return WEAPON_CONFIGS.battleaxe.symbol;
    }

    getColor() {
        return WEAPON_CONFIGS.battleaxe.color;
    }
}

class Warhammer extends Weapon {
    static dropChance = WEAPON_CONFIGS.warhammer.dropChance;
    static levelRange = WEAPON_CONFIGS.warhammer.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Warhammer', 'warhammer');
        this.description = 'A mass of forged iron on a haft—designed to crumple plate and pulp shields.';
    }

    getSymbol() {
        return WEAPON_CONFIGS.warhammer.symbol;
    }

    getColor() {
        return WEAPON_CONFIGS.warhammer.color;
    }
}

class Greatsword extends Weapon {
    static dropChance = WEAPON_CONFIGS.greatsword.dropChance;
    static levelRange = WEAPON_CONFIGS.greatsword.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Greatsword', 'greatsword');
        this.description = 'An immense two-handed blade—each swing a cleaving arc of ruin.';
    }

    getSymbol() {
        return WEAPON_CONFIGS.greatsword.symbol;
    }

    getColor() {
        return WEAPON_CONFIGS.greatsword.color;
    }
}

class Halberd extends Weapon {
    static dropChance = WEAPON_CONFIGS.halberd.dropChance;
    static levelRange = WEAPON_CONFIGS.halberd.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Halberd', 'halberd');
        this.description = 'A polearm marrying axe blade, spear point, and hook—control and carnage in equal measure.';
    }

    getSymbol() {
        return WEAPON_CONFIGS.halberd.symbol;
    }

    getColor() {
        return WEAPON_CONFIGS.halberd.color;
    }
}

class EnchantedBlade extends Weapon {
    static dropChance = WEAPON_CONFIGS.enchantedBlade.dropChance;
    static levelRange = WEAPON_CONFIGS.enchantedBlade.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Enchanted Blade', 'enchantedBlade');
        this.description = 'Runes shimmer along its fuller—the metal hums with restrained arcana.';
    }

    getColor() {
        return WEAPON_CONFIGS.enchantedBlade.color;
    }
}

class DragonSlayer extends Weapon {
    static dropChance = WEAPON_CONFIGS.dragonSlayer.dropChance;
    static levelRange = WEAPON_CONFIGS.dragonSlayer.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Dragonslayer Sword', 'dragonSlayer');
        this.description = 'A legendary blade wreathed in ancient heat—said to drink the heartfire of slain wyrms.';
    }

    getSymbol() {
        return WEAPON_CONFIGS.dragonSlayer.symbol;
    }

    getColor() {
        return WEAPON_CONFIGS.dragonSlayer.color;
    }
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
        Weapon,
        Armor,
        Gold,
        Stick,
        RustyKnife,
        Club,
        BoneShard,
        SmallDagger,
        Shortsword,
        Rapier,
        Longsword,
        Spear,
        Battleaxe,
        Warhammer,
        Greatsword,
        Halberd,
        EnchantedBlade,
        DragonSlayer,
        LeatherHelm,
        IronHelmet,
        LeatherVest,
        ChainMail,
        PlateMail,
        LeatherBoots,
        IronBoots,
        LeatherGloves,
        IronGauntlets,
        ProtectionRing
    };
}
