// scrolls.js - Scroll items and magic phrase system
// Note: This file depends on Item class being defined (from items.js)

// 40 magical phrases for scroll identification
const SCROLL_MAGIC_PHRASES = [
    'XYZZY', 'PLUGH', 'ZELGO MER', 'NR 9', 'JUYED AWK',
    'ELAM EBOW', 'VERR YED', 'VENZAR', 'PRATYAVAYAH', 'ELBIB YLOH',
    'GHOTI', 'KERNOD WEL', 'HAPAX', 'ETAOIN', 'VELOX NEB',
    'ASHPD', 'FOOBIE', 'TEMOV', 'GNIK SISI', 'PHOL ENDE',
    'LOREM IPSUM', 'HACKEM MUCHE', 'PRIRUTSENIE', 'READ ME',
    'THARR', 'YUM YUM', 'LEP GEX', 'KIRJE', 'VE FORBRYDERNE',
    'ZLORFIK', 'XORB', 'DUAM XNAHT', 'ANDOVA BEGARIN',
    'AQUE BRAGH', 'MAPIRO', 'VERR YED HOE', 'FROBOZZ',
    'GARVEN DEH', 'ABRA KA', 'STRC PRST'
];

// Store magic phrase assignments for scroll types (will be shuffled at game start)
const SCROLL_MAGIC_ASSIGNMENTS = {};

// Initialize random magic phrase assignments for scroll types
function initializeScrollMagicPhrases() {
    const scrollTypes = [
        'Psionic Scroll',
        'Teleportation Scroll',
        'Mapping Scroll',
        'Fireball Scroll',
        'Regeneration Scroll',
        'Enchantment Scroll',
        'Uncurse Scroll',
        'Identify Scroll',
        'Poison Enchantment Scroll'
    ];
    const shuffledPhrases = [...SCROLL_MAGIC_PHRASES].sort(() => Math.random() - 0.5);

    scrollTypes.forEach((type, index) => {
        SCROLL_MAGIC_ASSIGNMENTS[type] = shuffledPhrases[index];
    });
}

const SCROLL_CONFIGS = {
    psionic: {damage: 25, dropChance: 0.1, levelRange: [1, 5], color: '#aa00ff', speed: 30, weight: 1, size: 1},
    teleport: {dropChance: 0.05, levelRange: [1, 15], color: '#44aaff', speed: 30, weight: 1, size: 1},
    mapping: {dropChance: 0.04, levelRange: [1, 12], color: '#ffff44', speed: 30, weight: 1, size: 1},
    fireball: {
        damage: 18,
        radius: 3,
        dropChance: 0.06,
        levelRange: [2, 15],
        color: '#ff5522',
        speed: 30,
        weight: 1,
        size: 1
    },
    regeneration: {
        totalHeals: 5,
        healPerTick: 4,
        interval: 400,
        dropChance: 0.1,
        levelRange: [3, 18],
        color: '#33dd55',
        speed: 30,
        weight: 1,
        size: 1
    },
    enchantment: {
        enchantmentPower: 1,
        dropChance: 0.04,
        levelRange: [1, 15],
        color: '#ff99ff',
        speed: 30,
        weight: 1,
        size: 1
    },
    uncurse: {dropChance: 0.06, levelRange: [1, 15], color: '#ffddaa', speed: 30, weight: 1, size: 1},
    identify: {dropChance: 0.08, levelRange: [1, 20], color: '#88ddff', speed: 30, weight: 1, size: 1},
    poisonEnchantment: {poisonPower: 3, dropChance: 0.03, levelRange: [3, 12], color: '#44ff44', speed: 30, weight: 1, size: 1}
};

// Base Scroll class
class Scroll extends Item {
    constructor(x, y, name, configKey = null) {
        super(x, y, name);
        this.speed = 30;
        this.weight = 1;
        this.size = 1;
        this.magicName = SCROLL_MAGIC_ASSIGNMENTS[name] || "";
        this.description = 'A crackling parchment covered in sigils that shimmer and rearrange when not directly watched.';

        // Check if this scroll type has already been identified
        if (typeof Player !== 'undefined' && Player.identifiedScrollTypes && Player.identifiedScrollTypes.has(name)) {
            this.identified = true;
        }

        // Apply config if provided
        if (configKey && SCROLL_CONFIGS[configKey]) {
            this.applyConfig(SCROLL_CONFIGS[configKey]);
        }
    }

    // Helper method to apply configuration
    applyConfig(config) {
        if (config.speed !== undefined) this.speed = config.speed;
        if (config.weight !== undefined) this.weight = config.weight;
        if (config.size !== undefined) this.size = config.size;
        if (config.damage !== undefined) this.damage = config.damage;
        if (config.radius !== undefined) this.radius = config.radius;
        if (config.totalHeals !== undefined) this.totalHeals = config.totalHeals;
        if (config.healPerTick !== undefined) this.healPerTick = config.healPerTick;
        if (config.interval !== undefined) this.interval = config.interval;
        if (config.enchantmentPower !== undefined) this.enchantmentPower = config.enchantmentPower;
    }

    getDisplayName() {
        // If identified, show actual name; otherwise show magic phrase
        if (this.identified) {
            return this.name;
        }
        return this.magicName ? `scroll "${this.magicName}"` : this.name;
    }

    getSymbol() {
        return '?';
    }

    getColor() {
        return '#00ffff';
    }

    // Treat all subclassed scrolls uniformly for memory coloring
    getType() {
        return 'scroll';
    }

    onCollect(game) {
        Game.player.addScroll(this.createInventoryCopy());
    }

    onSelectItem(game) {
    }
}

class PsionicScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.psionic.dropChance;
    static levelRange = SCROLL_CONFIGS.psionic.levelRange;

    constructor(x, y, name, damage) {
        super(x, y, 'Psionic Scroll', 'psionic');
        if (damage !== undefined) this.damage = damage; // Allow override
        this.description = 'A vellum scroll humming with latent mental force—its release is a silent scream that shatters thought.';
    }

    getColor() {
        return SCROLL_CONFIGS.psionic.color;
    }

    onCollect(game) {
        super.onCollect(game);
        game.addMessage(`Found a ${this.getDisplayName()}!`);
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        if (this.cursed) {
            const dmg = this.damage || 10;
            const actualDamage = Game.player.hitPlayer(dmg);
            game.addMessage(`You read ${displayName}. Psychic energy rebounds into your mind! ${actualDamage} damage. It was a cursed ${this.name}!`);
            if (Game.player.isDead()) {
                game.gameOver = true;
                game.addMessage('Your mind shatters. Game over.');
            }
            return;
        }

        const targets = game.monsterManager.monsters.filter((m) => game.visible[m.y] && game.visible[m.y][m.x]);
        if (!targets.length) {
            game.addMessage(`You read ${displayName}. No targets in sight. It was a ${this.name}!`);
            return;
        }
        const dmg = this.damage || 10;
        let killed = 0;
        targets.forEach((m) => {
            m.hp -= dmg;
            if (m.hp <= 0) killed++;
        });
        if (killed) game.monsterManager.monsters = game.monsterManager.monsters.filter((m) => m.hp > 0);
        game.addMessage(`You read ${displayName}. ${targets.length} hit, ${killed} slain. It was a ${this.name}!`);
        game.render();
    }
}

// --- New Scroll Types ---

// Teleportation: randomly relocates the player to a safe tile.
class TeleportScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.teleport.dropChance;
    static levelRange = SCROLL_CONFIGS.teleport.levelRange;

    constructor(x, y) {
        super(x, y, 'Teleportation Scroll', 'teleport');
        this.description = 'Glyphs swirl in spirals—space seems thin where your fingers brush the vellum.';
    }

    getColor() {
        return SCROLL_CONFIGS.teleport.color;
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        if (this.cursed) {
            // Teleport next to a random monster
            const monsters = game.monsterManager.monsters;
            if (monsters.length > 0) {
                const target = monsters[Math.floor(Math.random() * monsters.length)];
                const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
                for (const [dx, dy] of offsets) {
                    const tx = target.x + dx;
                    const ty = target.y + dy;
                    const tile = game.dungeon.getTile(tx, ty);
                    if (tile && (tile.type === '.' || tile.type === '/') && !game.monsterManager.monsters.some(m => m.x === tx && m.y === ty)) {
                        Game.player.x = tx;
                        Game.player.y = ty;
                        game.addMessage(`You read ${displayName}. Reality twists maliciously—you appear next to a ${target.getDisplayName()}! It was a cursed ${this.name}!`);
                        game.computeFOV();
                        game.render();
                        return;
                    }
                }
            }
            game.addMessage(`You read ${displayName}. The cursed magic fizzles. It was a cursed ${this.name}!`);
            return;
        }

        const validPositions = [];
        for (let y = 0; y < game.height; y++) {
            for (let x = 0; x < game.width; x++) {
                if (!game.dungeon.inBounds(x, y)) continue;
                const tile = game.dungeon.getTile(x, y);
                if (!tile) continue;
                const t = tile.type;
                if (!(t === '.' || t === '/' || t === '<' || t === '>')) continue;
                if (game.monsterManager.monsters.some(m => m.x === x && m.y === y)) continue;
                validPositions.push([x, y]);
            }
        }
        if (!validPositions.length) {
            game.addMessage(`You read ${displayName}. The magic fizzles—nowhere to go. It was a ${this.name}!`);
            return;
        }
        const [nx, ny] = validPositions[Math.floor(Math.random() * validPositions.length)];
        Game.player.x = nx;
        Game.player.y = ny;
        game.addMessage(`You read ${displayName}. Reality folds; you reappear elsewhere! It was a ${this.name}!`);
        game.computeFOV();
        game.render();
    }
}

// Mapping: reveals the dungeon layout (walkable tiles + doors + stairs).
class MappingScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.mapping.dropChance;
    static levelRange = SCROLL_CONFIGS.mapping.levelRange;

    constructor(x, y) {
        super(x, y, 'Mapping Scroll', 'mapping');
        this.description = 'An ink lattice of corridors overlays the parchment—reading it crystallizes spatial insight.';
    }

    getColor() {
        return SCROLL_CONFIGS.mapping.color;
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        if (this.cursed) {
            // Erase explored tiles except current FOV
            for (let y = 0; y < game.height; y++) {
                for (let x = 0; x < game.width; x++) {
                    if (!game.visible[y][x]) {
                        game.explored[y][x] = false;
                    }
                }
            }
            game.addMessage(`You read ${displayName}. Your memories of the dungeon dissolve! It was a cursed ${this.name}!`);
            game.render();
            return;
        }

        for (let y = 0; y < game.height; y++) {
            for (let x = 0; x < game.width; x++) {
                const tile = game.dungeon.getTile(x, y);
                if (tile && tile.type !== '#') game.explored[y][x] = true; // reveal all non-walls
            }
        }
        game.addMessage(`You read ${displayName}. Your mind expands—paths and chambers blaze in memory. It was a ${this.name}!`);
        game.render();
    }
}

// Fireball: damages all monsters within a radius around the player.
class FireballScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.fireball.dropChance;
    static levelRange = SCROLL_CONFIGS.fireball.levelRange;

    constructor(x, y, damage, radius) {
        super(x, y, 'Fireball Scroll', 'fireball');
        if (damage !== undefined) this.damage = damage; // Allow override
        if (radius !== undefined) this.radius = radius; // Allow override
        this.description = 'Crimson sigils pulse with heat—unleash it to bathe nearby foes in roaring flame.';
    }

    getColor() {
        return SCROLL_CONFIGS.fireball.color;
    }

    async use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        if (this.cursed) {
            // Fireball centered on player, damages player
            const fireballEffect = new FireballEffect(
                Game.player.x,
                Game.player.y,
                this.damage,
                this.radius,
                game
            );

            await fireballEffect.execute({
                animate: true,
                damagePlayer: true,
                damageMonsters: true,
                useFalloff: false,
                triggerMessage: `You read ${displayName}. The fireball explodes in your face! It was a cursed ${this.name}!`
            });

            if (Game.player.isDead()) {
                game.gameOver = true;
                game.addMessage('You are incinerated by your own scroll. Game over.');
            }
            return;
        }

        // Use shared fireball effect
        const fireballEffect = new FireballEffect(
            Game.player.x,
            Game.player.y,
            this.damage,
            this.radius,
            game
        );

        const affectedEntities = await fireballEffect.execute({
            animate: true,
            damagePlayer: false,  // Scroll doesn't hurt player
            damageMonsters: true,
            useFalloff: false,     // Scroll does full damage to all in radius
            triggerMessage: `You read ${displayName}. A sphere of fire erupts!`
        });

        // Count monsters that were affected
        const monstersAffected = affectedEntities.filter(e => e !== Game.player).length;

        if (monstersAffected === 0) {
            game.addMessage(`Flames curl harmlessly—no foes nearby. It was a ${this.name}!`);
        } else {
            game.addMessage(`It was a ${this.name}!`);
        }
    }
}

// Regeneration: grants periodic healing over time.
class RegenerationScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.regeneration.dropChance;
    static levelRange = SCROLL_CONFIGS.regeneration.levelRange;

    constructor(x, y, totalHeals, healPerTick, interval) {
        super(x, y, 'Regeneration Scroll', 'regeneration');
        if (totalHeals !== undefined) this.totalHeals = totalHeals; // Allow override
        if (healPerTick !== undefined) this.healPerTick = healPerTick; // Allow override
        if (interval !== undefined) this.interval = interval; // Allow override
        this.description = 'Verdant runes shed tiny motes—life reknits at their whispered urging.';
    }

    getColor() {
        return SCROLL_CONFIGS.regeneration.color;
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        if (this.cursed) {
            game.addMessage(`You read ${displayName}. Dark energy gnaws at your flesh! It was a cursed ${this.name}!`);
            for (let i = 1; i <= this.totalHeals; i++) {
                game.timeManager.scheduleEvent(this.interval * i, this, () => {
                    Game.player.health -= this.healPerTick;
                    game.addMessage(`The curse drains ${this.healPerTick} HP from you!`);
                    if (Game.player.isDead()) {
                        game.gameOver = true;
                        game.addMessage('The cursed scroll drains your life. Game over.');
                    }
                    game.updateUI();
                    game.render();
                });
            }
            return;
        }

        game.addMessage(`You read ${displayName}. Warm vitality suffuses your frame. It was a ${this.name}!`);
        for (let i = 1; i <= this.totalHeals; i++) {
            game.timeManager.scheduleEvent(this.interval * i, this, () => {
                const healed = Game.player.heal(this.healPerTick);
                game.addMessage(`Regeneration restores ${healed} HP across your wounds.`);
                game.updateUI();
                game.render();
            });
        }
    }
}

// Enchantment: allows player to select and enhance an item
class EnchantmentScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.enchantment.dropChance;
    static levelRange = SCROLL_CONFIGS.enchantment.levelRange;

    constructor(x, y, enchantmentPower) {
        super(x, y, 'Enchantment Scroll', 'enchantment');
        if (enchantmentPower !== undefined) this.enchantmentPower = enchantmentPower; // Allow override
        this.description = 'Swirling glyphs of amplification—channel its power into a weapon or armor to transcend mortal limits.';
    }

    getColor() {
        return SCROLL_CONFIGS.enchantment.color;
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        // Trigger the enchantment selection UI
        game.startItemSelection(this);
        return {
            success: true,
            message: `You read ${displayName}. Select an item to enchant... It was a ${this.name}!`,
            scroll: this,
        };
    }

    onSelectItem(game, item) {
        if (!item || !(item instanceof Weapon || item instanceof Armor)) {
            game.addMessage('You can only enchant weapons or armor.');
            return;
        }
        const power = this.enchantmentPower || 1;
        const displayName = item.getDisplayName ? item.getDisplayName() : item.name;

        if (this.cursed) {
            // De-enchant: reduce enchantments
            if (item instanceof Weapon) {
                item.enchantments.damage = (item.enchantments.damage || 0) - power;
                game.addMessage(`${displayName} dims! -${power} damage enchantment. It was a cursed scroll!`);
            } else if (item instanceof Armor) {
                item.enchantments.defense = (item.enchantments.defense || 0) - power;
                game.addMessage(`${displayName} weakens! -${power} defense enchantment. It was a cursed scroll!`);
            }
            return;
        }

        if (item instanceof Weapon) {
            item.enchantments.damage = (item.enchantments.damage || 0) + power;
            game.addMessage(`${displayName} glows with power! +${power} damage enchantment applied.`);
        } else if (item instanceof Armor) {
            item.enchantments.defense = (item.enchantments.defense || 0) + power;
            game.addMessage(`${displayName} shimmers with protective magic! +${power} defense enchantment applied.`);
        }
    }
}

// Uncurse: removes curses from equipped items
class UncurseScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.uncurse.dropChance;
    static levelRange = SCROLL_CONFIGS.uncurse.levelRange;

    constructor(x, y) {
        super(x, y, 'Uncurse Scroll', 'uncurse');
        this.description = 'Pale glyphs of purification—their invocation breaks malevolent bindings and frees the afflicted.';
    }

    getColor() {
        return SCROLL_CONFIGS.uncurse.color;
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        // Trigger the enchantment selection UI
        game.startItemSelection(this);
        return {
            success: true,
            message: `You read ${displayName}. Select an item to uncurse... It was a ${this.name}!`,
            scroll: this,
        };
    }

    onSelectItem(game, item) {
        if (this.cursed) {
            // Cursed uncurse scroll curses the selected item
            if (item && !item.cursed) {
                item.applyCurse();
                const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
                game.addMessage(`Dark energy engulfs ${displayName}! It is now cursed! It was a cursed scroll!`);
            } else {
                game.addMessage('The cursed scroll fizzles—that item is already cursed.');
            }
            return;
        }

        if (item && item.cursed && typeof item.removeCurse === 'function') {
            const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
            item.removeCurse();
            game.addMessage(`Holy light washes over you! ${displayName} is freed from the curse!`);
        } else {
            game.addMessage('The scroll glows faintly, but that item isn\'t cursed.');
        }
    }
}

class IdentifyScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.identify.dropChance;
    static levelRange = SCROLL_CONFIGS.identify.levelRange;

    constructor(x, y) {
        super(x, y, 'Identify Scroll', 'identify');
        this.description = 'Azure runes of revelation—their power unveils the true nature of mysterious items.';
    }

    getColor() {
        return SCROLL_CONFIGS.identify.color;
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        if (this.cursed) {
            // Un-identify a random identified potion/scroll/wand type
            const types = [
                { set: Player.identifiedPotionTypes, label: 'potion', inv: 'potions' },
                { set: Player.identifiedScrollTypes, label: 'scroll', inv: 'scrolls' },
                { set: Player.identifiedWandTypes, label: 'wand', inv: 'wands' },
            ].filter(t => t.set && t.set.size > 0);

            if (types.length > 0) {
                const chosen = types[Math.floor(Math.random() * types.length)];
                const names = [...chosen.set];
                const targetName = names[Math.floor(Math.random() * names.length)];
                chosen.set.delete(targetName);
                // Un-identify matching items in inventory
                const inv = Game.player.inventory[chosen.inv];
                if (inv) {
                    inv.forEach(item => { if (item.name === targetName) item.identified = false; });
                }
                game.addMessage(`You read ${displayName}. Your knowledge of ${targetName} fades! It was a cursed ${this.name}!`);
            } else {
                game.addMessage(`You read ${displayName}. A wave of confusion washes over you. It was a cursed ${this.name}!`);
            }
            return { success: true, scroll: this };
        }

        // Trigger the item selection UI
        game.startItemSelection(this);
        return {
            success: true,
            message: `You read ${displayName}. Select an item to identify... It was a ${this.name}!`,
            scroll: this,
        };
    }

    onSelectItem(game, item) {
        if (item && !item.identified) {
            item.identified = true;
            const displayName = item.getDisplayName ? item.getDisplayName() : item.name;
            game.addMessage(`The scroll glows brightly! You now know this item: ${displayName}!`);

            // Show detailed info about the newly identified item
            if (item.qualityBonus && item.qualityBonus > 0) {
                game.addMessage(`  It has a quality bonus of +${item.qualityBonus}!`);
            }
            if (item.enchantments && Object.keys(item.enchantments).length > 0) {
                const enchantText = Object.entries(item.enchantments)
                    .filter(([k, v]) => v !== 0)
                    .map(([k, v]) => `+${v} ${k}`)
                    .join(', ');
                game.addMessage(`  Enchantments: ${enchantText}`);
            }
            if (item.cursed) {
                game.addMessage(`  WARNING: This item is CURSED!`);
            }
        } else if (item && item.identified) {
            game.addMessage('The scroll glows faintly... you already know this item.');
        } else {
            game.addMessage('The scroll fizzles. Choose a valid item to identify.');
        }
    }
}

// Poison Enchantment: adds poison damage to a weapon
class PoisonEnchantmentScroll extends Scroll {
    static dropChance = SCROLL_CONFIGS.poisonEnchantment.dropChance;
    static levelRange = SCROLL_CONFIGS.poisonEnchantment.levelRange;

    constructor(x, y) {
        super(x, y, 'Poison Enchantment Scroll', 'poisonEnchantment');
        this.description = 'Venomous script writhes across the parchment—its power coats a blade in lasting toxin.';
    }

    getColor() {
        return SCROLL_CONFIGS.poisonEnchantment.color;
    }

    use(game) {
        const displayName = this.getDisplayName();
        this.identified = true;
        Game.player.identifyScrollType(this.name);

        game.startItemSelection(this);
        return {
            success: true,
            message: `You read ${displayName}. Select a weapon to envenom... It was a ${this.name}!`,
            scroll: this,
        };
    }

    onSelectItem(game, item) {
        if (!item || !(item instanceof Weapon)) {
            game.addMessage('You can only apply poison to weapons.');
            return;
        }
        const displayName = item.getDisplayName ? item.getDisplayName() : item.name;

        if (this.cursed) {
            // Remove poison enchantment
            if (item.enchantments.elemental && item.enchantments.elemental.poison > 0) {
                const removed = Math.min(item.enchantments.elemental.poison, SCROLL_CONFIGS.poisonEnchantment.poisonPower);
                item.enchantments.elemental.poison -= removed;
                if (item.enchantments.elemental.poison <= 0) delete item.enchantments.elemental.poison;
                game.addMessage(`${displayName}'s venom evaporates! -${removed} poison damage. It was a cursed scroll!`);
            } else {
                game.addMessage(`The cursed scroll fizzles—${displayName} has no poison to remove.`);
            }
            return;
        }

        const power = SCROLL_CONFIGS.poisonEnchantment.poisonPower;
        if (!item.enchantments.elemental) item.enchantments.elemental = {};
        item.enchantments.elemental.poison = (item.enchantments.elemental.poison || 0) + power;
        game.addMessage(`${displayName} drips with venom! +${power} poison damage enchantment applied.`);
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        SCROLL_MAGIC_PHRASES,
        SCROLL_MAGIC_ASSIGNMENTS,
        initializeScrollMagicPhrases,
        SCROLL_CONFIGS,
        Scroll,
        PsionicScroll,
        TeleportScroll,
        MappingScroll,
        FireballScroll,
        RegenerationScroll,
        EnchantmentScroll,
        IdentifyScroll,
        UncurseScroll,
        PoisonEnchantmentScroll
    };
}

