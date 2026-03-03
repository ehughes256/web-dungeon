// Trap classes for the dungeon

// Shared fireball effect class used by both FireballTrap and FireballScroll
class FireballEffect {
    constructor(x, y, damage, radius, game) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.radius = radius;
        this.game = game;
    }

    async execute(options = {}) {
        const {
            animate = true,
            damagePlayer = true,
            damageMonsters = true,
            useFalloff = true,
            triggerMessage = null
        } = options;

        const isVisible = this.isVisibleToPlayer();

        if (triggerMessage && isVisible) {
            this.game.addMessage(triggerMessage);
        }

        // Animate the explosion effect if visible and animation enabled
        if (isVisible && animate) {
            await this.animateExplosion();
        }

        // Damage all entities in radius
        const affectedEntities = this.getEntitiesInRadius(damagePlayer, damageMonsters);

        for (const target of affectedEntities) {
            const distance = Math.sqrt(
                Math.pow(target.x - this.x, 2) +
                Math.pow(target.y - this.y, 2)
            );

            // Damage falls off with distance if enabled (100% at center, ~40% at edge)
            const damageFalloff = useFalloff
                ? Math.max(0.4, 1 - (distance / this.radius) * 0.6)
                : 1.0;
            const actualDamage = Math.floor(this.damage * damageFalloff);

            if (target === Game.player) {
                const damageDealt = target.hitPlayer(actualDamage, 'fire');
                this.game.addMessage(`The fireball hits you for ${damageDealt} damage!`);

                if (target.isDead()) {
                    this.game.handlePlayerDeath();
                }
            } else {
                // It's a monster
                const result = target.takeDamage(actualDamage, 'fire');

                if (isVisible) {
                    const monsterName = target.getDisplayName();
                    if (target.hp <= 0) {
                        this.game.addMessage(`The fireball incinerates a ${monsterName}!`);
                    } else {
                        let msg = `The fireball hits a ${monsterName} for ${result.actualDamage} damage`;
                        if (result.wasResisted) msg += ' (resisted)';
                        else if (result.wasWeak) msg += ' (CRITICAL)';
                        msg += '!';
                        this.game.addMessage(msg);
                    }
                }
            }
        }

        // Clean up dead monsters after explosion
        if (this.game.monsterManager) {
            this.game.monsterManager.monsters = this.game.monsterManager.monsters.filter(m => m.isAlive());
        }

        if (isVisible) {
            this.game.render();
        }

        return affectedEntities;
    }

    getEntitiesInRadius(includePlayer = true, includeMonsters = true) {
        const entities = [];

        // Check if player is in radius
        if (includePlayer) {
            const playerDist = Math.sqrt(
                Math.pow(Game.player.x - this.x, 2) +
                Math.pow(Game.player.y - this.y, 2)
            );
            if (playerDist <= this.radius) {
                entities.push(Game.player);
            }
        }

        // Check all monsters
        if (includeMonsters && this.game.monsterManager && this.game.monsterManager.monsters) {
            for (const monster of this.game.monsterManager.monsters) {
                const monsterDist = Math.sqrt(
                    Math.pow(monster.x - this.x, 2) +
                    Math.pow(monster.y - this.y, 2)
                );
                if (monsterDist <= this.radius) {
                    entities.push(monster);
                }
            }
        }

        return entities;
    }

    isVisibleToPlayer() {
        return this.game.visible && this.game.visible[this.y] && this.game.visible[this.y][this.x];
    }

    async animateExplosion() {
        // Animate expanding fireball effect
        const frames = [
            { radius: 1, color: '#ffff00', duration: 50 },  // Yellow flash
            { radius: 2, color: '#ff9900', duration: 60 },  // Orange expansion
            { radius: 3, color: '#ff6600', duration: 70 },  // Deep orange
            { radius: 4, color: '#ff3300', duration: 80 },  // Red-orange
            { radius: 5, color: '#ff0000', duration: 90 },  // Red at full radius
            { radius: 4, color: '#cc0000', duration: 60 },  // Fade back
            { radius: 3, color: '#990000', duration: 50 },  // Darker red
            { radius: 2, color: '#660000', duration: 40 },  // Very dark
        ];

        for (const frame of frames) {
            this.drawExplosionFrame(frame.radius, frame.color);
            await this.game.sleep(frame.duration);
        }
    }

    drawExplosionFrame(radius, color) {
        const ts = this.game.tileSize;
        const ctx = this.game.ctx;

        // Draw explosion effect over the normal render
        this.game.render();

        // Draw fireball radius
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    const tx = this.x + dx;
                    const ty = this.y + dy;

                    // Only draw on visible tiles
                    if (this.game.visible && this.game.visible[ty] && this.game.visible[ty][tx]) {
                        // Convert world coordinates to screen coordinates
                        const px = (tx - this.game.cameraX) * ts;
                        const py = (ty - this.game.cameraY) * ts;

                        // Calculate alpha based on distance from center
                        const alpha = Math.max(0.3, 1 - (dist / radius) * 0.7);

                        // Draw glowing effect
                        ctx.fillStyle = color;
                        ctx.globalAlpha = alpha;
                        ctx.fillRect(px, py, ts, ts);
                        ctx.globalAlpha = 1.0;

                        // Add flame symbol at center
                        if (dx === 0 && dy === 0) {
                            ctx.fillStyle = '#ffff00';
                            ctx.font = `bold ${ts}px monospace`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('*', px + ts / 2, py + ts / 2);
                        }
                    }
                }
            }
        }
    }
}

class Trap {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.discovered = false;
        this.triggered = false;
        this.name = 'Trap';
        this.description = 'A dangerous trap';
        this.symbol = '^';
        this.color = '#ff4444';
    }

    trigger(game, entity) {
        if (this.triggered) return;
        this.triggered = true;
        // Override in subclass
    }

    // Check if entity can trigger this trap
    canTrigger(entity) {
        // By default, all entities can trigger traps
        return !this.triggered;
    }

    // Check if entity is the player
    isPlayer(entity) {
        return entity === Game.player;
    }

    // Check if trap location is visible to player
    isVisibleToPlayer(game) {
        return game.visible && game.visible[this.y] && game.visible[this.y][this.x];
    }

    getDetectionDifficulty() {
        // Base difficulty for detection (0-100)
        return 50;
    }
}

class SpikeTrap extends Trap {
    constructor(x, y) {
        super(x, y);
        this.name = 'Spike Trap';
        this.description = 'Sharp spikes shoot up from the floor';
        this.damage = Math.floor(Math.random() * 10) + 5; // 5-15 damage
    }

    trigger(game, entity) {
        if (this.triggered) return;
        super.trigger(game, entity);

        const isPlayer = this.isPlayer(entity);
        const isVisible = this.isVisibleToPlayer(game);

        if (isPlayer) {
            this.discovered = true; // Player always discovers trap when triggering
            const actualDamage = entity.hitPlayer(this.damage, 'physical');
            game.addMessage(`You triggered a spike trap! You take ${actualDamage} damage.`);

            if (entity.isDead()) {
                game.handlePlayerDeath();
            }
        } else {
            // Monster triggered the trap
            const result = entity.takeDamage(this.damage, 'physical');

            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                let msg = `A ${monsterName} triggered a spike trap!`;
                if (entity.hp <= 0) {
                    msg += ' It died.';
                } else if (result.wasResisted) {
                    msg += ' (resisted)';
                } else if (result.wasWeak) {
                    msg += ' (CRITICAL)';
                }
                game.addMessage(msg);
            }
        }
    }

    getDetectionDifficulty() {
        return 40; // Relatively easy to spot
    }
}

class PoisonDartTrap extends Trap {
    constructor(x, y) {
        super(x, y);
        this.name = 'Poison Dart Trap';
        this.description = 'A hidden mechanism fires poisoned darts';
        this.damage = Math.floor(Math.random() * 8) + 3; // 3-11 damage
        this.symbol = '^';
        this.color = '#44ff44';
    }

    trigger(game, entity) {
        if (this.triggered) return;
        super.trigger(game, entity);

        const isPlayer = this.isPlayer(entity);
        const isVisible = this.isVisibleToPlayer(game);

        if (isPlayer) {
            this.discovered = true; // Player always discovers trap when triggering
            const actualDamage = entity.hitPlayer(this.damage, 'poison');
            game.addMessage(`A poison dart shoots out! You take ${actualDamage} damage.`);

            // Apply poison DoT effect (2-4 damage per tick for 5-8 ticks)
            const poisonDmg = 2 + Math.floor(Math.random() * 3);
            const poisonTicks = 5 + Math.floor(Math.random() * 4);
            entity.applyPoison(poisonDmg, poisonTicks);
            game.addMessage('You feel poison spreading through your veins!');

            if (entity.isDead()) {
                game.handlePlayerDeath();
            }
        } else {
            // Monster triggered the trap
            const result = entity.takeDamage(this.damage, 'poison');

            // Apply poison DoT to monster
            const poisonDmg = 2 + Math.floor(Math.random() * 3);
            const poisonTicks = 5 + Math.floor(Math.random() * 4);
            entity.applyPoison(poisonDmg, poisonTicks);

            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                let msg = `A poison dart hits a ${monsterName}!`;
                if (entity.hp <= 0) {
                    msg += ' It died.';
                } else if (result.wasResisted) {
                    msg += ' (resisted)';
                } else if (result.wasWeak) {
                    msg += ' (CRITICAL)';
                }
                game.addMessage(msg);
            }
        }
    }

    getDetectionDifficulty() {
        return 60; // Harder to spot
    }
}

class PitTrap extends Trap {
    constructor(x, y) {
        super(x, y);
        this.name = 'Pit Trap';
        this.description = 'A concealed pit waiting to swallow the unwary';
        this.damage = Math.floor(Math.random() * 15) + 10; // 10-25 damage
    }

    trigger(game, entity) {
        if (this.triggered) return;
        super.trigger(game, entity);

        const isPlayer = this.isPlayer(entity);
        const isVisible = this.isVisibleToPlayer(game);

        if (isPlayer) {
            this.discovered = true; // Player always discovers trap when triggering
            const actualDamage = entity.hitPlayer(this.damage, 'physical');
            game.addMessage(`You fall into a pit! You take ${actualDamage} damage.`);

            // Player takes time to climb out
            game.consumeTurn(50);

            if (entity.isDead()) {
                game.handlePlayerDeath();
            }
        } else {
            // Monster triggered the trap
            const result = entity.takeDamage(this.damage, 'physical');

            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                let msg = `A ${monsterName} falls into a pit!`;
                if (entity.hp <= 0) {
                    msg += ' It died.';
                } else if (result.wasResisted) {
                    msg += ' (resisted)';
                } else if (result.wasWeak) {
                    msg += ' (CRITICAL)';
                }
                game.addMessage(msg);
            }
        }
    }

    getDetectionDifficulty() {
        return 35; // Easier to spot if you're careful
    }
}

class TeleportTrap extends Trap {
    constructor(x, y) {
        super(x, y);
        this.name = 'Teleport Trap';
        this.description = 'Ancient runes that transport victims to random locations';
        this.symbol = '^';
        this.color = '#4444ff';
    }

    trigger(game, entity) {
        if (this.triggered) return;
        super.trigger(game, entity);

        const isPlayer = this.isPlayer(entity);
        const isVisible = this.isVisibleToPlayer(game);

        if (isPlayer) {
            this.discovered = true; // Player always discovers trap when triggering
            // Find a random walkable location
            let attempts = 0;
            let newX, newY;
            while (attempts < 100) {
                newX = Math.floor(Math.random() * game.width);
                newY = Math.floor(Math.random() * game.height);

                if (game.dungeon.isValidMove(newX, newY)) {
                    // Make sure there's no monster there
                    const monsterHere = game.monsterManager.monsters.find(m => m.x === newX && m.y === newY);
                    if (!monsterHere) {
                        break;
                    }
                }
                attempts++;
            }

            if (attempts < 100) {
                entity.x = newX;
                entity.y = newY;
                game.addMessage('You are teleported to a random location!');
                game.computeFOV();
            } else {
                game.addMessage('The teleport trap fizzles...');
            }
        } else {
            // Monster triggered the trap - teleport them too
            let attempts = 0;
            let newX, newY;
            while (attempts < 100) {
                newX = Math.floor(Math.random() * game.width);
                newY = Math.floor(Math.random() * game.height);

                if (game.dungeon.isValidMove(newX, newY)) {
                    // Make sure there's no entity there
                    const monsterHere = game.monsterManager.monsters.find(m => m.x === newX && m.y === newY);
                    if (!monsterHere && !(newX === Game.player.x && newY === Game.player.y)) {
                        break;
                    }
                }
                attempts++;
            }

            if (attempts < 100) {
                entity.x = newX;
                entity.y = newY;
                if (isVisible) {
                    this.discovered = true;
                    const monsterName = entity.getDisplayName();
                    game.addMessage(`A ${monsterName} is teleported away!`);
                }
            }
        }
    }

    getDetectionDifficulty() {
        return 70; // Very hard to spot
    }
}

class AlarmTrap extends Trap {
    constructor(x, y) {
        super(x, y);
        this.name = 'Alarm Trap';
        this.description = 'A loud mechanism that alerts nearby monsters';
        this.symbol = '^';
        this.color = '#ffff44';
    }

    trigger(game, entity) {
        if (this.triggered) return;
        super.trigger(game, entity);

        const isPlayer = this.isPlayer(entity);
        const isVisible = this.isVisibleToPlayer(game);

        if (isPlayer) {
            this.discovered = true; // Player always discovers trap when triggering
            game.addMessage('You triggered an alarm! Monsters are alerted!');

            // Wake up all monsters in range and make them aggressive
            const alertRadius = 15;
            game.monsterManager.monsters.forEach(monster => {
                const dx = monster.x - entity.x;
                const dy = monster.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= alertRadius) {
                    // Make monster aware and move towards player
                    monster.lastKnownPlayerLocation = [Game.player.x, Game.player.y];
                    monster.lastSawPlayerMoves = -1000;
                    monster.state = 'aggressive';
                }
            });
        } else {
            // Monster triggered alarm - no effect on other monsters
            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                game.addMessage(`A ${monsterName} triggered an alarm trap!`);
            }
        }
    }

    getDetectionDifficulty() {
        return 55; // Medium difficulty
    }
}

class WeakeningTrap extends Trap {
    constructor(x, y) {
        super(x, y);
        this.name = 'Weakening Trap';
        this.description = 'Cursed runes that sap your strength';
        this.symbol = '^';
        this.color = '#ff44ff';
    }

    trigger(game, entity) {
        if (this.triggered) return;
        super.trigger(game, entity);

        const isPlayer = this.isPlayer(entity);
        const isVisible = this.isVisibleToPlayer(game);

        if (isPlayer) {
            this.discovered = true; // Player always discovers trap when triggering
            // Temporarily reduce player stats
            const statReduction = Math.floor(Math.random() * 5) + 3; // 3-8 stat reduction
            entity.strength = Math.max(1, entity.strength - statReduction);
            entity.dexterity = Math.max(1, entity.dexterity - statReduction);
            game.timeManager.scheduleEvent(5000, this, () => {
                entity.strength += statReduction;
                entity.dexterity += statReduction;
                game.addMessage('You feel your strength returning.');
            });

            game.addMessage(`You feel weakened! -${statReduction} to strength and dexterity.`);
        } else {
            // Monster triggered weakening trap - reduce their damage temporarily
            const damageReduction = Math.floor(entity.dmg * 0.3); // 30% damage reduction
            if (entity.dmg > 1) {
                entity.dmg = Math.max(1, entity.dmg - damageReduction);
                game.timeManager.scheduleEvent(5000, this, () => {
                    entity.dmg += damageReduction;
                });
            }

            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                game.addMessage(`A ${monsterName} looks weakened by cursed runes!`);
            }
        }
    }

    getDetectionDifficulty() {
        return 65; // Hard to spot
    }
}

class FireballTrap extends Trap {
    constructor(x, y) {
        super(x, y);
        this.name = 'Fireball Trap';
        this.description = 'A magical glyph that erupts in a massive explosion of flame';
        this.damage = Math.floor(Math.random() * 15) + 15; // 15-30 damage
        this.radius = 5;
        this.symbol = '^';
        this.color = '#ff6600';
    }

    async trigger(game, entity) {
        if (this.triggered) return;
        super.trigger(game, entity);

        const isPlayer = this.isPlayer(entity);
        const isVisible = this.isVisibleToPlayer(game);

        // Always discover fireball traps when triggered (they're loud and bright!)
        this.discovered = true;

        let triggerMessage;
        if (isPlayer) {
            triggerMessage = 'You triggered a fireball trap!';
        } else if (isVisible) {
            const monsterName = entity.getDisplayName();
            triggerMessage = `A ${monsterName} triggered a fireball trap!`;
        }

        // Use shared fireball effect
        const fireballEffect = new FireballEffect(this.x, this.y, this.damage, this.radius, game);
        await fireballEffect.execute({
            animate: true,
            damagePlayer: true,
            damageMonsters: true,
            useFalloff: true,
            triggerMessage: triggerMessage
        });
    }

    getDetectionDifficulty() {
        return 75; // Very hard to spot - magical trap
    }
}

// Trap factory for level-appropriate trap generation
class TrapFactory {
    static trapTypes = [
        SpikeTrap,
        PoisonDartTrap,
        PitTrap,
        TeleportTrap,
        AlarmTrap,
        WeakeningTrap,
        FireballTrap
    ];

    static createRandomTrap(x, y, dungeonLevel = 1) {
        // Higher level = more dangerous traps
        let availableTraps = [...TrapFactory.trapTypes];

        // Early levels have simpler traps
        if (dungeonLevel <= 2) {
            availableTraps = [SpikeTrap, AlarmTrap];
        } else if (dungeonLevel <= 5) {
            availableTraps = [SpikeTrap, PoisonDartTrap, PitTrap, AlarmTrap];
        } else if (dungeonLevel <= 10) {
            // Mid-level dungeons can have weakening traps and occasional fireballs
            availableTraps = [SpikeTrap, PoisonDartTrap, PitTrap, TeleportTrap, AlarmTrap, WeakeningTrap];
            if (Math.random() < 0.3) availableTraps.push(FireballTrap); // 30% chance for fireball
        } else {
            // Deep dungeons have all traps, higher chance of fireballs
            availableTraps = [...TrapFactory.trapTypes];
        }

        const TrapClass = availableTraps[Math.floor(Math.random() * availableTraps.length)];
        return new TrapClass(x, y);
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FireballEffect,
        Trap,
        SpikeTrap,
        PoisonDartTrap,
        PitTrap,
        TeleportTrap,
        AlarmTrap,
        WeakeningTrap,
        FireballTrap,
        TrapFactory
    };
}

