// Potion-related functionality for the roguelike game

// 40 potion colors for randomization
const POTION_COLORS = [
    'crimson', 'azure', 'emerald', 'violet', 'amber', 'sapphire', 'ruby', 'golden',
    'silver', 'bronze', 'turquoise', 'magenta', 'indigo', 'coral', 'jade', 'obsidian',
    'pearl', 'opal', 'topaz', 'amethyst', 'chartreuse', 'cerulean', 'vermilion', 'teal',
    'ochre', 'scarlet', 'cobalt', 'burgundy', 'lavender', 'mint', 'peach', 'plum',
    'olive', 'maroon', 'navy', 'tan', 'beige', 'ivory', 'slate', 'copper'
];

// Mapping from color names to hex codes for visual display
const POTION_COLOR_HEX = {
    'crimson': '#DC143C',
    'azure': '#007FFF',
    'emerald': '#50C878',
    'violet': '#8F00FF',
    'amber': '#FFBF00',
    'sapphire': '#0F52BA',
    'ruby': '#E0115F',
    'golden': '#FFD700',
    'silver': '#C0C0C0',
    'bronze': '#CD7F32',
    'turquoise': '#40E0D0',
    'magenta': '#FF00FF',
    'indigo': '#4B0082',
    'coral': '#FF7F50',
    'jade': '#00A86B',
    'obsidian': '#0B1C26',
    'pearl': '#F0EAD6',
    'opal': '#A8C3BC',
    'topaz': '#FFCC00',
    'amethyst': '#9966CC',
    'chartreuse': '#7FFF00',
    'cerulean': '#007BA7',
    'vermilion': '#E34234',
    'teal': '#008080',
    'ochre': '#CC7722',
    'scarlet': '#FF2400',
    'cobalt': '#0047AB',
    'burgundy': '#800020',
    'lavender': '#B57EDC',
    'mint': '#98FF98',
    'peach': '#FFE5B4',
    'plum': '#8E4585',
    'olive': '#808000',
    'maroon': '#800000',
    'navy': '#000080',
    'tan': '#D2B48C',
    'beige': '#F5F5DC',
    'ivory': '#FFFFF0',
    'slate': '#708090',
    'copper': '#B87333'
};

// Store color assignments for potion types (will be shuffled at game start)
const POTION_COLOR_ASSIGNMENTS = {};

// Initialize random color assignments for potion types
function initializePotionColors() {
    const potionTypes = ['Health Potion', 'Speed Potion', 'Antidote Potion'];
    const shuffledColors = [...POTION_COLORS].sort(() => Math.random() - 0.5);

    potionTypes.forEach((type, index) => {
        POTION_COLOR_ASSIGNMENTS[type] = shuffledColors[index];
    });
}

const POTION_CONFIGS = {
    health: {healAmount: 20, dropChance: 0.05, levelRange: [1, 5], color: '#ff88ff', speed: 10, weight: 1, size: 2},
    speed: {
        speedBoost: 50,
        duration: 1000,
        dropChance: 0.05,
        levelRange: [1, 5],
        color: '#00ff00',
        speed: 10,
        weight: 1,
        size: 2
    },
    antidote: {
        dropChance: 0.04,
        levelRange: [1, 6],
        color: '#88ffaa',
        speed: 10,
        weight: 1,
        size: 2
    }
};

// Potion item class
class Potion extends Item {
    constructor(x, y, name, configKey = null) {
        super(x, y, name);
        this.speed = 10;
        this.weight = 1;
        this.size = 2;
        this.enchantments = {};
        this.colorName = POTION_COLOR_ASSIGNMENTS[name] || "";
        this.description = 'A glass vial of alchemical mystery—its contents swirl with latent promise.';

        // Check if this potion type has already been identified
        if (typeof Player !== 'undefined' && Player.identifiedPotionTypes && Player.identifiedPotionTypes.has(name)) {
            this.identified = true;
        }

        // Apply config if provided
        if (configKey && POTION_CONFIGS[configKey]) {
            this.applyConfig(POTION_CONFIGS[configKey]);
        }
    }

    // Helper method to apply configuration
    applyConfig(config) {
        if (config.speed !== undefined) this.speed = config.speed;
        if (config.weight !== undefined) this.weight = config.weight;
        if (config.size !== undefined) this.size = config.size;
        if (config.healAmount !== undefined) this.healAmount = config.healAmount;
        if (config.speedBoost !== undefined) this.speedBoost = config.speedBoost;
        if (config.duration !== undefined) this.duration = config.duration;
    }

    getDisplayName() {
        // If identified, show actual name; otherwise show color
        if (this.identified) {
            return this.name;
        }
        return this.colorName ? `${this.colorName} potion` : this.name;
    }

    getSymbol() {
        return '!';
    }

    getColor() {
        // Return hex color based on colorName, or default magenta if not found
        return this.colorName && POTION_COLOR_HEX[this.colorName]
            ? POTION_COLOR_HEX[this.colorName]
            : '#ff00ff';
    }

    onCollect(game) {
        Game.player.addPotion(this.createInventoryCopy());
    }
}

// HealthPotion subclass - enhanced healing potion
class HealthPotion extends Potion {
    static dropChance = POTION_CONFIGS.health.dropChance;
    static levelRange = POTION_CONFIGS.health.levelRange;

    constructor(x, y, name, healAmount) {
        super(x, y, name || 'Health Potion', 'health');
        if (healAmount !== undefined) this.healAmount = healAmount; // Allow override
        this.description = 'A ruby-red draught that knits torn flesh and steadies the warrior\'s breath.';
    }


    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyPotionType(this.name);

        if (this.cursed) {
            const damage = this.healAmount;
            Game.player.health -= damage;
            game.addMessage(`You drink ${displayName}. It burns! It was a cursed ${this.name}!`);
            if (Game.player.isDead()) {
                game.gameOver = true;
                game.addMessage('The cursed potion kills you. Game over.');
            }
            return { success: true, message: `You take ${damage} damage from the cursed potion!`, potion: this };
        }

        game.addMessage(`You drink the health potion!`);
        const healedAmount = Game.player.heal(this.healAmount);
        return {
            success: true,
            message: `You drink ${displayName} (+${healedAmount} HP). It was a ${this.name}!`,
            potion: this,
        };
    }

    onCollect(game) {
        super.onCollect(game);
        game.addMessage(`Found a ${this.getDisplayName()}!`);
    }
}

class SpeedPotion extends Potion {
    static dropChance = POTION_CONFIGS.speed.dropChance;
    static levelRange = POTION_CONFIGS.speed.levelRange;

    constructor(x, y, name, speedBoost) {
        super(x, y, name || 'Speed Potion', 'speed');
        if (speedBoost !== undefined) this.speedBoost = speedBoost; // Allow override
        this.description = 'An emerald tonic that sharpens reflexes—time itself seems to lean in your favor.';
    }


    onCollect(game) {
        super.onCollect(game);
        game.addMessage(`Found a ${this.getDisplayName()}!`);
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyPotionType(this.name);

        if (this.cursed) {
            game.addMessage(`You drink ${displayName}. Your limbs feel like lead! It was a cursed ${this.name}!`);
            Game.player.speed += this.speedBoost;
            game.timeManager.scheduleEvent(POTION_CONFIGS.speed.duration, this, () => {
                Game.player.speed -= this.speedBoost;
                game.addMessage('The sluggishness from the cursed potion wears off.');
            });
            return { success: true, message: `You are slowed! (-${this.speedBoost} speed)`, potion: this };
        }

        game.addMessage(`You drink the speed potion!`);
        Game.player.speed -= this.speedBoost;
        game.timeManager.scheduleEvent(POTION_CONFIGS.speed.duration, this, () => {
            Game.player.speed += this.speedBoost;
            game.addMessage('The effect of the speed potion wears off.');
        });
        return {
            success: true,
            message: `You drink ${displayName} and feel faster! (+${this.speedBoost} speed). It was a ${this.name}!`,
            potion: this,
        };
    }
}

class AntidotePotion extends Potion {
    static dropChance = POTION_CONFIGS.antidote.dropChance;
    static levelRange = POTION_CONFIGS.antidote.levelRange;

    constructor(x, y, name) {
        super(x, y, name || 'Antidote Potion', 'antidote');
        this.description = 'A bitter green tincture that purges toxins and steadies trembling hands.';
    }

    onCollect(game) {
        super.onCollect(game);
        game.addMessage(`Found a ${this.getDisplayName()}!`);
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyPotionType(this.name);

        if (this.cursed) {
            Game.player.applyPoison(3, 6);
            game.addMessage(`You drink ${displayName}. It's toxic! It was a cursed ${this.name}!`);
            return { success: true, message: 'Poison courses through your veins!', potion: this };
        }

        if (Game.player.poisoned) {
            Game.player.curePoison();
            return {
                success: true,
                message: `You drink ${displayName} and the poison fades! It was a ${this.name}!`,
                potion: this,
            };
        } else {
            // Still consumed but grants temporary poison immunity (reduces next poison by half)
            return {
                success: true,
                message: `You drink ${displayName}. You feel hardened against toxins. It was a ${this.name}!`,
                potion: this,
            };
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined') {
    module.exports = {
        Potion,
        HealthPotion,
        SpeedPotion,
        AntidotePotion,
        POTION_COLOR_ASSIGNMENTS,
        POTION_COLORS,
        POTION_COLOR_HEX,
        POTION_CONFIGS,
        initializePotionColors
    };
}

