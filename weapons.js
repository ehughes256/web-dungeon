// weapons.js - All weapon-related logic
// NOTE: This file expects EquippableItem to be available (defined in items.js)
// In browser: items.js loads before this file via script tags
// In Node.js: items.js sets global.EquippableItem before requiring this module

// Weapon spawning constants
const WEAPON_SPAWN_MAX_ATTEMPTS = 60;
const PRIMITIVE_WEAPON_PHASE_OUT_LEVEL = 3;
const BASIC_WEAPON_PHASE_OUT_LEVEL = 4;

// Weapon configuration constants - centralized stats for easy balancing
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

// Base Weapon class
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

// Fists - default unarmed weapon
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

// --- Low-Level Weapons ---
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

// --- Core Weapons ---
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

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WEAPON_SPAWN_MAX_ATTEMPTS,
        PRIMITIVE_WEAPON_PHASE_OUT_LEVEL,
        BASIC_WEAPON_PHASE_OUT_LEVEL,
        WEAPON_CONFIGS,
        Weapon,
        Fists,
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
        DragonSlayer
    };
}

