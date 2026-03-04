// armor.js - All armor-related logic
// NOTE: This file expects EquippableItem to be available (defined in items.js)
// In browser: items.js loads before this file via script tags
// In Node.js: items.js sets global.EquippableItem before requiring this module

// Armor configuration constants - centralized stats for easy balancing
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
    },
    strengthRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.03,
        levelRange: [2, 8],
        color: '#ff4444',
        bodyLocation: 'ring',
        bonuses: {damage: 3}
    },
    dexterityRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.03,
        levelRange: [2, 8],
        color: '#44ff44',
        bodyLocation: 'ring',
        bonuses: {speed: -20} // Negative = faster
    },
    intelligenceRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.02,
        levelRange: [3, 10],
        color: '#4444ff',
        bodyLocation: 'ring',
        bonuses: {intelligence: 15}
    },
    wisdomRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.02,
        levelRange: [3, 10],
        color: '#ffff44',
        bodyLocation: 'ring',
        bonuses: {wisdom: 15}
    },
    regenerationRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.02,
        levelRange: [4, 12],
        color: '#ff88ff',
        bodyLocation: 'ring',
        bonuses: {regeneration: 1} // Heals 1 HP every few turns
    },
    vampiricRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.015,
        levelRange: [6, 14],
        color: '#aa0000',
        bodyLocation: 'ring',
        bonuses: {lifesteal: 0.15} // 15% lifesteal
    },
    fireResistanceRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.025,
        levelRange: [3, 10],
        color: '#ff6600',
        bodyLocation: 'ring',
        bonuses: {fireResist: 0.5} // 50% fire damage reduction
    },
    iceResistanceRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.025,
        levelRange: [3, 10],
        color: '#00ffff',
        bodyLocation: 'ring',
        bonuses: {iceResist: 0.5} // 50% ice damage reduction
    },
    lightningResistanceRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.025,
        levelRange: [3, 10],
        color: '#ffff00',
        bodyLocation: 'ring',
        bonuses: {lightningResist: 0.5}
    },
    accuracyRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.03,
        levelRange: [2, 8],
        color: '#00ff00',
        bodyLocation: 'ring',
        bonuses: {accuracy: 10} // +10% hit chance
    },
    evasionRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.03,
        levelRange: [2, 8],
        color: '#aaaaff',
        bodyLocation: 'ring',
        bonuses: {evasion: 10} // +10% dodge chance
    },
    searchingRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.02,
        levelRange: [1, 6],
        color: '#ffaa88',
        bodyLocation: 'ring',
        bonuses: {trapDetection: 25} // +25% trap detection
    },
    wealthRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.015,
        levelRange: [3, 12],
        color: '#ffdd00',
        bodyLocation: 'ring',
        bonuses: {goldFind: 0.5} // 50% more gold
    },
    experienceRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.015,
        levelRange: [4, 14],
        color: '#88ff88',
        bodyLocation: 'ring',
        bonuses: {experience: 0.25} // 25% more XP
    },
    teleportationRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.01,
        levelRange: [5, 15],
        color: '#ff00ff',
        bodyLocation: 'ring',
        bonuses: {teleport: 1} // Can teleport occasionally
    },
    invisibilityRing: {
        defense: 0,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.008,
        levelRange: [6, 16],
        color: '#cccccc',
        bodyLocation: 'ring',
        bonuses: {invisibility: 1} // Monsters less likely to detect
    },
    berserkerRing: {
        defense: -5,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.02,
        levelRange: [4, 12],
        color: '#ff0000',
        bodyLocation: 'ring',
        bonuses: {damage: 8, defense: -5} // More damage, less defense
    },
    turtleRing: {
        defense: 8,
        speed: 5,
        weight: 1,
        size: 1,
        dropChance: 0.02,
        levelRange: [4, 12],
        color: '#44aa44',
        bodyLocation: 'ring',
        bonuses: {defense: 8, speed: 30} // More defense, slower
    }
};

// Base Armor class
class Armor extends EquippableItem {
    constructor(x, y, name, bodyLocation, configKey = null) {
        super(x, y, name, bodyLocation);
        this.speed = 0;
        this.weight = 0;
        this.size = 0;
        this.bonuses = {};
        this.enchantments = {};
        this.enchantable = true;
        this.defense = 0;
        this.resistances = {}; // e.g., { fire: 0.2, ice: 0.15 }

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

    // Get total resistance for a specific element
    getResistance(element) {
        const base = this.resistances[element] || 0;
        const enchant = (this.enchantments.resistances && this.enchantments.resistances[element]) || 0;
        return base + enchant;
    }

    // Get all resistances
    getAllResistances() {
        const result = {};

        // Combine base resistances
        for (const [element, value] of Object.entries(this.resistances)) {
            result[element] = value;
        }

        // Add enchantment resistances
        if (this.enchantments.resistances) {
            for (const [element, value] of Object.entries(this.enchantments.resistances)) {
                result[element] = (result[element] || 0) + value;
            }
        }

        return result;
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
        const displayName = copy.getDisplayName ? copy.getDisplayName() : copy.name;
        game.addMessage(`Found a ${displayName}!`);
    }

    getType() {
        return 'armor';
    }
}

// Specialized armor base classes
class BodyArmor extends Armor {
    constructor(x, y, name, configKey = null) {
        super(x, y, name, 'armor', configKey);
    }

    getSymbol() {
        return '[';
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

// Low-level armor pieces
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

class ClothRobe extends BodyArmor {
    static dropChance = ARMOR_CONFIGS.clothRobe.dropChance;
    static levelRange = ARMOR_CONFIGS.clothRobe.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Cloth Robe', 'clothRobe');
        this.description = 'Simple woven garments—little protection, but movement comes easily.';
    }
}

// Standard armor pieces
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

class StrengthRing extends Ring {
    static dropChance = ARMOR_CONFIGS.strengthRing.dropChance;
    static levelRange = ARMOR_CONFIGS.strengthRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Strength', 'strengthRing');
        this.description = 'Crimson metal pulsing with raw power—each blow lands with brutal certainty.';
    }

    getColor() {
        return ARMOR_CONFIGS.strengthRing.color;
    }
}

class DexterityRing extends Ring {
    static dropChance = ARMOR_CONFIGS.dexterityRing.dropChance;
    static levelRange = ARMOR_CONFIGS.dexterityRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Dexterity', 'dexterityRing');
        this.description = 'A quicksilver band that grants the grace of a dancer and the speed of a striking viper.';
    }

    getColor() {
        return ARMOR_CONFIGS.dexterityRing.color;
    }
}

class IntelligenceRing extends Ring {
    static dropChance = ARMOR_CONFIGS.intelligenceRing.dropChance;
    static levelRange = ARMOR_CONFIGS.intelligenceRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Intelligence', 'intelligenceRing');
        this.description = 'Sapphire-set circlet that sharpens the mind and illuminates hidden truths.';
    }

    getColor() {
        return ARMOR_CONFIGS.intelligenceRing.color;
    }
}

class WisdomRing extends Ring {
    static dropChance = ARMOR_CONFIGS.wisdomRing.dropChance;
    static levelRange = ARMOR_CONFIGS.wisdomRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Wisdom', 'wisdomRing');
        this.description = 'Golden band inscribed with ancient runes—clarity and insight made tangible.';
    }

    getColor() {
        return ARMOR_CONFIGS.wisdomRing.color;
    }
}

class RegenerationRing extends Ring {
    static dropChance = ARMOR_CONFIGS.regenerationRing.dropChance;
    static levelRange = ARMOR_CONFIGS.regenerationRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Regeneration', 'regenerationRing');
        this.description = 'Pink gemstone that pulses in rhythm with your heartbeat, knitting wounds with each throb.';
    }

    getColor() {
        return ARMOR_CONFIGS.regenerationRing.color;
    }
}

class VampiricRing extends Ring {
    static dropChance = ARMOR_CONFIGS.vampiricRing.dropChance;
    static levelRange = ARMOR_CONFIGS.vampiricRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Vampirism', 'vampiricRing');
        this.description = 'Dark crimson stone that drinks deeply from your foes—their life becomes yours.';
    }

    getColor() {
        return ARMOR_CONFIGS.vampiricRing.color;
    }
}

class FireResistanceRing extends Ring {
    static dropChance = ARMOR_CONFIGS.fireResistanceRing.dropChance;
    static levelRange = ARMOR_CONFIGS.fireResistanceRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Fire Resistance', 'fireResistanceRing');
        this.description = 'Orange-red gem cool to the touch—flames slide off your skin like water.';
    }

    getColor() {
        return ARMOR_CONFIGS.fireResistanceRing.color;
    }
}

class IceResistanceRing extends Ring {
    static dropChance = ARMOR_CONFIGS.iceResistanceRing.dropChance;
    static levelRange = ARMOR_CONFIGS.iceResistanceRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Ice Resistance', 'iceResistanceRing');
        this.description = 'Frozen aquamarine that never melts—cold cannot touch one who wears winter\'s heart.';
    }

    getColor() {
        return ARMOR_CONFIGS.iceResistanceRing.color;
    }
}

class LightningResistanceRing extends Ring {
    static dropChance = ARMOR_CONFIGS.lightningResistanceRing.dropChance;
    static levelRange = ARMOR_CONFIGS.lightningResistanceRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Lightning Resistance', 'lightningResistanceRing');
        this.description = 'Yellow topaz crackling with static—lightning bends around you seeking easier prey.';
    }

    getColor() {
        return ARMOR_CONFIGS.lightningResistanceRing.color;
    }
}

class AccuracyRing extends Ring {
    static dropChance = ARMOR_CONFIGS.accuracyRing.dropChance;
    static levelRange = ARMOR_CONFIGS.accuracyRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Accuracy', 'accuracyRing');
        this.description = 'Emerald-set band that guides your hand true—every strike finds its mark.';
    }

    getColor() {
        return ARMOR_CONFIGS.accuracyRing.color;
    }
}

class EvasionRing extends Ring {
    static dropChance = ARMOR_CONFIGS.evasionRing.dropChance;
    static levelRange = ARMOR_CONFIGS.evasionRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Evasion', 'evasionRing');
        this.description = 'Pale blue stone that whispers warnings—you twist away from blows unseen.';
    }

    getColor() {
        return ARMOR_CONFIGS.evasionRing.color;
    }
}

class SearchingRing extends Ring {
    static dropChance = ARMOR_CONFIGS.searchingRing.dropChance;
    static levelRange = ARMOR_CONFIGS.searchingRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Searching', 'searchingRing');
        this.description = 'Amber band that tingles when danger lurks—hidden traps reveal themselves.';
    }

    getColor() {
        return ARMOR_CONFIGS.searchingRing.color;
    }
}

class WealthRing extends Ring {
    static dropChance = ARMOR_CONFIGS.wealthRing.dropChance;
    static levelRange = ARMOR_CONFIGS.wealthRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Wealth', 'wealthRing');
        this.description = 'Gilded band studded with diamonds—fortune smiles upon the bearer.';
    }

    getColor() {
        return ARMOR_CONFIGS.wealthRing.color;
    }
}

class ExperienceRing extends Ring {
    static dropChance = ARMOR_CONFIGS.experienceRing.dropChance;
    static levelRange = ARMOR_CONFIGS.experienceRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Experience', 'experienceRing');
        this.description = 'Jade circlet that sharpens the lessons of battle—wisdom gained from every victory.';
    }

    getColor() {
        return ARMOR_CONFIGS.experienceRing.color;
    }
}

class TeleportationRing extends Ring {
    static dropChance = ARMOR_CONFIGS.teleportationRing.dropChance;
    static levelRange = ARMOR_CONFIGS.teleportationRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Teleportation', 'teleportationRing');
        this.description = 'Amethyst band that bends space itself—escape is always an option.';
    }

    getColor() {
        return ARMOR_CONFIGS.teleportationRing.color;
    }
}

class InvisibilityRing extends Ring {
    static dropChance = ARMOR_CONFIGS.invisibilityRing.dropChance;
    static levelRange = ARMOR_CONFIGS.invisibilityRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of Invisibility', 'invisibilityRing');
        this.description = 'Translucent crystal that bends light—you become shadow and whisper.';
    }

    getColor() {
        return ARMOR_CONFIGS.invisibilityRing.color;
    }
}

class BerserkerRing extends Ring {
    static dropChance = ARMOR_CONFIGS.berserkerRing.dropChance;
    static levelRange = ARMOR_CONFIGS.berserkerRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of the Berserker', 'berserkerRing');
        this.description = 'Blood-red iron that ignites rage—defense forsaken for overwhelming fury.';
    }

    getColor() {
        return ARMOR_CONFIGS.berserkerRing.color;
    }
}

class TurtleRing extends Ring {
    static dropChance = ARMOR_CONFIGS.turtleRing.dropChance;
    static levelRange = ARMOR_CONFIGS.turtleRing.levelRange;

    constructor(x, y) {
        super(x, y, 'Ring of the Turtle', 'turtleRing');
        this.description = 'Green jade carved like a shell—steady and unbreakable, though ponderous.';
    }

    getColor() {
        return ARMOR_CONFIGS.turtleRing.color;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ARMOR_CONFIGS,
        Armor,
        BodyArmor,
        Helmet,
        Gloves,
        Shoes,
        Ring,
        TatteredCloak,
        PaddedCap,
        WornSandals,
        RaggedGloves,
        ClothRobe,
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
        StrengthRing,
        DexterityRing,
        IntelligenceRing,
        WisdomRing,
        RegenerationRing,
        VampiricRing,
        FireResistanceRing,
        IceResistanceRing,
        LightningResistanceRing,
        AccuracyRing,
        EvasionRing,
        SearchingRing,
        WealthRing,
        ExperienceRing,
        TeleportationRing,
        InvisibilityRing,
        BerserkerRing,
        TurtleRing
    };
}

