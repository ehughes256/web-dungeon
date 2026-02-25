// wands.js - Wand items and effects
// Note: This file depends on Item class being defined (from items.js)

// Wand visual descriptions for unidentified wands
const WAND_MATERIALS = [
    'oak', 'maple', 'birch', 'ebony', 'ivory', 'bone', 'crystal', 'iron',
    'silver', 'gold', 'copper', 'bronze', 'obsidian', 'glass', 'jade',
    'ruby', 'sapphire', 'emerald', 'coral', 'willow', 'yew', 'ash',
    'bamboo', 'teak', 'mahogany', 'pine', 'cedar', 'marble', 'granite', 'onyx'
];

// Store material assignments for wand types (will be shuffled at game start)
const WAND_MATERIAL_ASSIGNMENTS = {};

// Initialize random material assignments for wand types
function initializeWandMaterials() {
    const wandTypes = [
        'Wand of Magic Missile',
        'Wand of Lightning',
        'Wand of Fire',
        'Wand of Ice',
        'Wand of Polymorph',
        'Wand of Slow',
        'Wand of Teleportation',
        'Wand of Death'
    ];
    const shuffledMaterials = [...WAND_MATERIALS].sort(() => Math.random() - 0.5);

    wandTypes.forEach((type, index) => {
        WAND_MATERIAL_ASSIGNMENTS[type] = shuffledMaterials[index];
    });
}

const WAND_CONFIGS = {
    magicMissile: {
        damage: 8,
        charges: 10,
        dropChance: 0.04,
        levelRange: [1, 10],
        color: '#ff00ff',
        speed: 15,
        weight: 2,
        size: 1
    },
    lightning: {
        damage: 15,
        charges: 6,
        dropChance: 0.03,
        levelRange: [3, 15],
        color: '#00ffff',
        speed: 15,
        weight: 2,
        size: 1
    },
    fire: {
        damage: 12,
        radius: 2,
        charges: 5,
        dropChance: 0.03,
        levelRange: [4, 15],
        color: '#ff4400',
        speed: 15,
        weight: 2,
        size: 1
    },
    ice: {
        damage: 10,
        slowDuration: 5,
        charges: 6,
        dropChance: 0.03,
        levelRange: [3, 12],
        color: '#88ddff',
        speed: 15,
        weight: 2,
        size: 1
    },
    polymorph: {
        charges: 4,
        dropChance: 0.02,
        levelRange: [5, 18],
        color: '#aa44ff',
        speed: 15,
        weight: 2,
        size: 1
    },
    slow: {
        slowDuration: 10,
        charges: 8,
        dropChance: 0.04,
        levelRange: [2, 10],
        color: '#888888',
        speed: 15,
        weight: 2,
        size: 1
    },
    teleportation: {
        charges: 5,
        dropChance: 0.02,
        levelRange: [4, 15],
        color: '#44aaff',
        speed: 15,
        weight: 2,
        size: 1
    },
    death: {
        damage: 100,
        charges: 2,
        dropChance: 0.01,
        levelRange: [8, 20],
        color: '#220022',
        speed: 15,
        weight: 3,
        size: 1
    }
};

// Base Wand class
class Wand extends Item {
    constructor(x, y, name, configKey = null) {
        super(x, y, name);
        this.speed = 15;
        this.weight = 2;
        this.size = 1;
        this.charges = 5;
        this.maxCharges = 5;
        this.materialName = WAND_MATERIAL_ASSIGNMENTS[name] || "wooden";
        this.description = 'A slender rod thrumming with arcane potential, waiting to channel its power.';

        // Check if this wand type has already been identified
        if (typeof Player !== 'undefined' && Player.identifiedWandTypes && Player.identifiedWandTypes.has(name)) {
            this.identified = true;
        }

        // Apply config if provided
        if (configKey && WAND_CONFIGS[configKey]) {
            this.applyConfig(WAND_CONFIGS[configKey]);
        }
    }

    // Helper method to apply configuration
    applyConfig(config) {
        if (config.speed !== undefined) this.speed = config.speed;
        if (config.weight !== undefined) this.weight = config.weight;
        if (config.size !== undefined) this.size = config.size;
        if (config.damage !== undefined) this.damage = config.damage;
        if (config.radius !== undefined) this.radius = config.radius;
        if (config.charges !== undefined) {
            this.charges = config.charges;
            this.maxCharges = config.charges;
        }
        if (config.slowDuration !== undefined) this.slowDuration = config.slowDuration;
    }

    getDisplayName() {
        // If identified, show actual name with charges; otherwise show material
        if (this.identified) {
            return `${this.name} [${this.charges}]`;
        }
        return `${this.materialName} wand`;
    }

    getSymbol() {
        return '/';
    }

    getColor() {
        return '#ff00ff';
    }

    // Treat all subclassed wands uniformly for memory coloring
    getType() {
        return 'wand';
    }

    onCollect(game) {
        Game.player.addWand(this.createInventoryCopy());
        game.addMessage(`Found a ${this.getDisplayName()}!`);
    }

    // Get the nearest monster in a given direction
    getTargetInDirection(game, dx, dy) {
        let x = Game.player.x + dx;
        let y = Game.player.y + dy;

        while (game.dungeon.inBounds(x, y)) {
            const tile = game.dungeon.getTile(x, y);
            if (!tile || tile.type === '#') break; // Hit a wall

            // Check for monster at this position
            const monster = game.monsterManager.monsters.find(m => m.x === x && m.y === y);
            if (monster) return monster;

            x += dx;
            y += dy;
        }
        return null;
    }

    // Get all monsters in a line (for chain effects)
    getMonstersInLine(game, dx, dy) {
        const monsters = [];
        let x = Game.player.x + dx;
        let y = Game.player.y + dy;

        while (game.dungeon.inBounds(x, y)) {
            const tile = game.dungeon.getTile(x, y);
            if (!tile || tile.type === '#') break;

            const monster = game.monsterManager.monsters.find(m => m.x === x && m.y === y);
            if (monster) monsters.push(monster);

            x += dx;
            y += dy;
        }
        return monsters;
    }

    // Get nearest visible monster
    getNearestVisibleMonster(game) {
        let nearestMonster = null;
        let nearestDist = Infinity;

        for (const monster of game.monsterManager.monsters) {
            if (!game.visible[monster.y] || !game.visible[monster.y][monster.x]) continue;

            const dx = monster.x - Game.player.x;
            const dy = monster.y - Game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < nearestDist) {
                nearestDist = dist;
                nearestMonster = monster;
            }
        }
        return nearestMonster;
    }

    use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }
        // Override in subclasses
        return { success: true };
    }

    consumeCharge(game) {
        this.charges--;
        this.identified = true;
        Game.player.identifyWandType(this.name);
    }
}

// Magic Missile Wand - fires a bolt at the nearest visible enemy
class MagicMissileWand extends Wand {
    static dropChance = WAND_CONFIGS.magicMissile.dropChance;
    static levelRange = WAND_CONFIGS.magicMissile.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Magic Missile', 'magicMissile');
        this.description = 'A focused conduit of raw arcane force—each bolt unerringly seeks its target.';
    }

    getColor() {
        return WAND_CONFIGS.magicMissile.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        // Start targeting mode
        const wand = this;
        game.startTargetingMode(this, async (targetX, targetY) => {
            // Find monster at target location
            const target = game.monsterManager.monsters.find(m => m.x === targetX && m.y === targetY);

            if (!target) {
                game.addMessage(`You zap the wand but there's nothing there.`);
                return;
            }

            // Check if target is visible
            if (!game.visible[targetY] || !game.visible[targetY][targetX]) {
                game.addMessage(`You can't see that target!`);
                return;
            }

            wand.consumeCharge(game);

            // Animate bolt
            await wand.animateBolt(game, target.x, target.y, '#ff00ff');

            const result = target.takeDamage(wand.damage, 'dark');
            let msg = `A magic missile strikes ${target.getDisplayName()} for ${result.actualDamage} damage`;
            if (result.wasResisted) msg += ' (resisted)';
            else if (result.wasWeak) msg += ' (CRITICAL)';
            msg += '!';
            game.addMessage(msg);

            if (target.hp <= 0) {
                Game.player.gainExperience(target.experience);
                game.monsterManager.monsters = game.monsterManager.monsters.filter(m => m !== target);
                game.addMessage(`${target.getDisplayName()} is destroyed!`);
            }

            game.render();
            await game.consumeTurn(wand.speed);
        });

        return { success: true };
    }

    async animateBolt(game, targetX, targetY, color) {
        const startX = Game.player.x;
        const startY = Game.player.y;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));

        for (let i = 1; i <= steps; i++) {
            const x = Math.round(startX + (dx * i) / steps);
            const y = Math.round(startY + (dy * i) / steps);

            // Draw the bolt
            const ctx = game.ctx;
            const tileSize = game.tileSize;

            game.render();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                x * tileSize + tileSize / 2,
                y * tileSize + tileSize / 2,
                tileSize / 4,
                0,
                Math.PI * 2
            );
            ctx.fill();

            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }
}

// Lightning Wand - strikes all enemies in a line
class LightningWand extends Wand {
    static dropChance = WAND_CONFIGS.lightning.dropChance;
    static levelRange = WAND_CONFIGS.lightning.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Lightning', 'lightning');
        this.description = 'Crackling electricity coils within—unleashing it rends the air with blinding devastation.';
    }

    getColor() {
        return WAND_CONFIGS.lightning.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        // Start targeting mode to determine direction
        const wand = this;
        game.startTargetingMode(this, async (targetX, targetY) => {
            wand.consumeCharge(game);

            // Calculate direction from player to target
            const dx = Math.sign(targetX - Game.player.x);
            const dy = Math.sign(targetY - Game.player.y);

            // Get all monsters in line
            const monstersHit = wand.getMonstersInLine(game, dx, dy);

            // Animate lightning
            await wand.animateLightning(game, dx, dy);

            let totalKilled = 0;
            let totalExperience = 0;
            let totalDamage = 0;
            monstersHit.forEach(monster => {
                const result = monster.takeDamage(wand.damage, 'lightning');
                totalDamage += result.actualDamage;
                if (monster.hp <= 0) {
                    totalKilled++;
                    totalExperience += monster.experience;
                }
            });

            if (totalExperience > 0) {
                Game.player.gainExperience(totalExperience);
            }

            game.monsterManager.monsters = game.monsterManager.monsters.filter(m => m.hp > 0);

            if (monstersHit.length > 0) {
                game.addMessage(`Lightning arcs through ${monstersHit.length} enemies for ${Math.floor(totalDamage / monstersHit.length)} average damage!`);
                if (totalKilled > 0) {
                    game.addMessage(`${totalKilled} enemies destroyed!`);
                }
            } else {
                game.addMessage(`Lightning crackles harmlessly into the distance.`);
            }

            game.render();
            await game.consumeTurn(wand.speed);
        });

        return { success: true };
    }

    async animateLightning(game, dx, dy) {
        let x = Game.player.x + dx;
        let y = Game.player.y + dy;
        const positions = [];

        while (game.dungeon.inBounds(x, y)) {
            const tile = game.dungeon.getTile(x, y);
            if (!tile || tile.type === '#') break;
            positions.push({ x, y });
            x += dx;
            y += dy;
        }

        // Flash effect
        for (let flash = 0; flash < 3; flash++) {
            const ctx = game.ctx;
            const tileSize = game.tileSize;

            game.render();
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(
                Game.player.x * tileSize + tileSize / 2,
                Game.player.y * tileSize + tileSize / 2
            );

            positions.forEach(pos => {
                // Add slight randomness for lightning effect
                const jitterX = (Math.random() - 0.5) * tileSize * 0.3;
                const jitterY = (Math.random() - 0.5) * tileSize * 0.3;
                ctx.lineTo(
                    pos.x * tileSize + tileSize / 2 + jitterX,
                    pos.y * tileSize + tileSize / 2 + jitterY
                );
            });
            ctx.stroke();

            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
}

// Fire Wand - creates a small fireball explosion
class FireWand extends Wand {
    static dropChance = WAND_CONFIGS.fire.dropChance;
    static levelRange = WAND_CONFIGS.fire.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Fire', 'fire');
        this.description = 'Heat radiates from the rod\'s tip—a single word ignites a blossom of flame at range.';
    }

    getColor() {
        return WAND_CONFIGS.fire.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        // Start targeting mode - can target any visible tile
        const wand = this;
        game.startTargetingMode(this, async (targetX, targetY) => {
            // Check if target is visible
            if (!game.visible[targetY] || !game.visible[targetY][targetX]) {
                game.addMessage(`You can't see that location!`);
                return;
            }

            wand.consumeCharge(game);

            // If FireballEffect exists, use it; otherwise do simple area damage
            if (typeof FireballEffect !== 'undefined') {
                const fireballEffect = new FireballEffect(
                    targetX,
                    targetY,
                    wand.damage,
                    wand.radius || 2,
                    game
                );

                await fireballEffect.execute({
                    animate: true,
                    damagePlayer: true,
                    damageMonsters: true,
                    useFalloff: true,
                    triggerMessage: `A bolt of fire erupts at the target location!`
                });
            } else {
                // Simple fallback
                const monsters = game.monsterManager.monsters.filter(m => {
                    const dx = Math.abs(m.x - targetX);
                    const dy = Math.abs(m.y - targetY);
                    return dx <= wand.radius && dy <= wand.radius;
                });

                monsters.forEach(m => {
                    m.hp -= wand.damage;
                });

                game.monsterManager.monsters = game.monsterManager.monsters.filter(m => m.hp > 0);
                game.addMessage(`Fire erupts, burning ${monsters.length} enemies!`);
            }

            game.render();
            await game.consumeTurn(wand.speed);
        });

        return { success: true };
    }
}

// Ice Wand - damages and slows target
class IceWand extends Wand {
    static dropChance = WAND_CONFIGS.ice.dropChance;
    static levelRange = WAND_CONFIGS.ice.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Ice', 'ice');
        this.description = 'Frost clings to the shaft—its touch crystallizes flesh and numbs motion.';
    }

    getColor() {
        return WAND_CONFIGS.ice.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        const target = this.getNearestVisibleMonster(game);
        if (!target) {
            game.addMessage(`You zap the wand but find no target.`);
            return { success: false };
        }

        this.consumeCharge(game);

        // Animate frost bolt
        await this.animateFrost(game, target.x, target.y);

        const result = target.takeDamage(this.damage, 'ice');

        // Apply slow effect
        const originalSpeed = target.speed || 100;
        target.speed = Math.floor(originalSpeed * 2); // Double move time = slower
        target.slowedUntil = game.currentTick + (this.slowDuration * 100);

        let msg = `An ice bolt strikes ${target.getDisplayName()} for ${result.actualDamage} damage`;
        if (result.wasResisted) msg += ' (resisted)';
        else if (result.wasWeak) msg += ' (CRITICAL)';
        msg += ' and slows it!';
        game.addMessage(msg);

        if (target.hp <= 0) {
            game.monsterManager.monsters = game.monsterManager.monsters.filter(m => m !== target);
            game.addMessage(`${target.getDisplayName()} shatters into frozen fragments!`);
        }

        game.render();
        return { success: true };
    }

    async animateFrost(game, targetX, targetY) {
        const startX = Game.player.x;
        const startY = Game.player.y;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));

        for (let i = 1; i <= steps; i++) {
            const x = Math.round(startX + (dx * i) / steps);
            const y = Math.round(startY + (dy * i) / steps);

            const ctx = game.ctx;
            const tileSize = game.tileSize;

            game.render();

            // Draw icy bolt
            ctx.fillStyle = '#88ddff';
            ctx.beginPath();
            ctx.moveTo(x * tileSize + tileSize / 2, y * tileSize + tileSize / 4);
            ctx.lineTo(x * tileSize + tileSize * 3 / 4, y * tileSize + tileSize / 2);
            ctx.lineTo(x * tileSize + tileSize / 2, y * tileSize + tileSize * 3 / 4);
            ctx.lineTo(x * tileSize + tileSize / 4, y * tileSize + tileSize / 2);
            ctx.closePath();
            ctx.fill();

            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }
}

// Polymorph Wand - transforms monster into a weaker creature
class PolymorphWand extends Wand {
    static dropChance = WAND_CONFIGS.polymorph.dropChance;
    static levelRange = WAND_CONFIGS.polymorph.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Polymorph', 'polymorph');
        this.description = 'Reality warps around this rod—point it at a foe and watch flesh reshape.';
    }

    getColor() {
        return WAND_CONFIGS.polymorph.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        const target = this.getNearestVisibleMonster(game);
        if (!target) {
            game.addMessage(`You zap the wand but find no target.`);
            return { success: false };
        }

        this.consumeCharge(game);

        // Animate transformation
        await this.animatePolymorph(game, target.x, target.y);

        // Transform into a weaker creature
        const oldName = target.name;
        target.name = 'Polymorphed Creature';
        target.symbol = 'p';
        target.color = '#aa44ff';
        target.hp = Math.min(target.hp, 5);
        target.maxHp = 5;
        target.damage = 1;
        target.xp = 1;

        game.addMessage(`${oldName} transforms into a harmless creature!`);
        game.render();
        return { success: true };
    }

    async animatePolymorph(game, targetX, targetY) {
        const ctx = game.ctx;
        const tileSize = game.tileSize;

        // Swirling transformation effect
        for (let i = 0; i < 10; i++) {
            game.render();

            ctx.strokeStyle = `hsl(${280 + i * 10}, 100%, 60%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                targetX * tileSize + tileSize / 2,
                targetY * tileSize + tileSize / 2,
                tileSize / 2 * (1 - i / 10),
                0,
                Math.PI * 2
            );
            ctx.stroke();

            await new Promise(resolve => setTimeout(resolve, 40));
        }
    }
}

// Slow Wand - slows target monster
class SlowWand extends Wand {
    static dropChance = WAND_CONFIGS.slow.dropChance;
    static levelRange = WAND_CONFIGS.slow.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Slow', 'slow');
        this.description = 'Time itself thickens around this wand\'s targets, dragging their every motion.';
    }

    getColor() {
        return WAND_CONFIGS.slow.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        const target = this.getNearestVisibleMonster(game);
        if (!target) {
            game.addMessage(`You zap the wand but find no target.`);
            return { success: false };
        }

        this.consumeCharge(game);

        // Apply slow effect
        const originalSpeed = target.speed || 100;
        target.speed = Math.floor(originalSpeed * 3); // Triple move time = much slower
        target.slowedUntil = game.currentTick + (this.slowDuration * 100);

        game.addMessage(`${target.getDisplayName()} moves sluggishly as time warps around it!`);
        game.render();
        return { success: true };
    }
}

// Teleportation Wand - teleports target monster randomly
class TeleportationWand extends Wand {
    static dropChance = WAND_CONFIGS.teleportation.dropChance;
    static levelRange = WAND_CONFIGS.teleportation.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Teleportation', 'teleportation');
        this.description = 'Space folds at this rod\'s command—aim it to scatter foes across the dungeon.';
    }

    getColor() {
        return WAND_CONFIGS.teleportation.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        const target = this.getNearestVisibleMonster(game);
        if (!target) {
            game.addMessage(`You zap the wand but find no target.`);
            return { success: false };
        }

        this.consumeCharge(game);

        // Find valid positions
        const validPositions = [];
        for (let y = 0; y < game.height; y++) {
            for (let x = 0; x < game.width; x++) {
                if (!game.dungeon.inBounds(x, y)) continue;
                const tile = game.dungeon.getTile(x, y);
                if (!tile) continue;
                const t = tile.type;
                if (!(t === '.' || t === '/' || t === '<' || t === '>')) continue;
                if (x === Game.player.x && y === Game.player.y) continue;
                if (game.monsterManager.monsters.some(m => m.x === x && m.y === y)) continue;
                validPositions.push([x, y]);
            }
        }

        if (validPositions.length === 0) {
            game.addMessage(`The magic fizzles—nowhere to send ${target.getDisplayName()}!`);
            return { success: false };
        }

        const [nx, ny] = validPositions[Math.floor(Math.random() * validPositions.length)];
        const oldName = target.name;
        target.x = nx;
        target.y = ny;

        game.addMessage(`${oldName} vanishes and reappears elsewhere!`);
        game.render();
        return { success: true };
    }
}

// Death Wand - instantly kills or heavily damages target
class DeathWand extends Wand {
    static dropChance = WAND_CONFIGS.death.dropChance;
    static levelRange = WAND_CONFIGS.death.levelRange;

    constructor(x, y) {
        super(x, y, 'Wand of Death', 'death');
        this.description = 'Darkness coils within this dread rod—its utterance rends the soul from its vessel.';
    }

    getColor() {
        return WAND_CONFIGS.death.color;
    }

    async use(game) {
        if (this.charges <= 0) {
            game.addMessage(`The ${this.getDisplayName()} is empty.`);
            return { success: false };
        }

        const target = this.getNearestVisibleMonster(game);
        if (!target) {
            game.addMessage(`You zap the wand but find no target.`);
            return { success: false };
        }

        this.consumeCharge(game);

        // Animate death ray
        await this.animateDeathRay(game, target.x, target.y);

        // High chance of instant kill, or massive damage
        const killChance = Math.random();
        if (killChance > 0.3) {
            // Instant kill
            const oldName = target.getDisplayName();
            game.monsterManager.monsters = game.monsterManager.monsters.filter(m => m !== target);
            game.addMessage(`A black ray engulfs ${oldName}. It crumbles to dust!`);
        } else {
            // Massive damage
            const result = target.takeDamage(this.damage, 'dark');
            let msg = `A death ray strikes ${target.getDisplayName()} for ${result.actualDamage} damage`;
            if (result.wasResisted) msg += ' (resisted)';
            else if (result.wasWeak) msg += ' (CRITICAL)';
            msg += '!';
            game.addMessage(msg);
            if (target.hp <= 0) {
                game.monsterManager.monsters = game.monsterManager.monsters.filter(m => m !== target);
                game.addMessage(`${target.getDisplayName()} falls!`);
            }
        }

        game.render();
        return { success: true };
    }

    async animateDeathRay(game, targetX, targetY) {
        const startX = Game.player.x;
        const startY = Game.player.y;
        const ctx = game.ctx;
        const tileSize = game.tileSize;

        // Dark pulsing beam
        for (let pulse = 0; pulse < 5; pulse++) {
            game.render();

            ctx.strokeStyle = pulse % 2 === 0 ? '#440044' : '#220022';
            ctx.lineWidth = 4 + pulse;
            ctx.beginPath();
            ctx.moveTo(
                startX * tileSize + tileSize / 2,
                startY * tileSize + tileSize / 2
            );
            ctx.lineTo(
                targetX * tileSize + tileSize / 2,
                targetY * tileSize + tileSize / 2
            );
            ctx.stroke();

            // Dark glow at target
            ctx.fillStyle = `rgba(68, 0, 68, ${0.3 + pulse * 0.1})`;
            ctx.beginPath();
            ctx.arc(
                targetX * tileSize + tileSize / 2,
                targetY * tileSize + tileSize / 2,
                tileSize * (0.5 + pulse * 0.2),
                0,
                Math.PI * 2
            );
            ctx.fill();

            await new Promise(resolve => setTimeout(resolve, 60));
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        WAND_MATERIALS,
        WAND_MATERIAL_ASSIGNMENTS,
        initializeWandMaterials,
        WAND_CONFIGS,
        Wand,
        MagicMissileWand,
        LightningWand,
        FireWand,
        IceWand,
        PolymorphWand,
        SlowWand,
        TeleportationWand,
        DeathWand
    };
}

