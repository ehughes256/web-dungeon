// Trap classes for the dungeon

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
            const actualDamage = entity.hitPlayer(this.damage);
            game.addMessage(`You triggered a spike trap! You take ${actualDamage} damage.`);

            if (entity.isDead()) {
                game.handlePlayerDeath();
            }
        } else {
            // Monster triggered the trap
            const actualDamage = Math.min(this.damage, entity.hp);
            entity.takeDamage(this.damage);

            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                game.addMessage(`A ${monsterName} triggered a spike trap!${entity.hp <= 0 ? ' It died.' : ''}`);
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
            const actualDamage = entity.hitPlayer(this.damage);
            game.addMessage(`A poison dart shoots out! You take ${actualDamage} damage.`);

            // Additional poison effect - reduce max health temporarily (not implemented yet)
            if (entity.isDead()) {
                game.handlePlayerDeath();
            }
        } else {
            // Monster triggered the trap
            const actualDamage = Math.min(this.damage, entity.hp);
            entity.takeDamage(this.damage);

            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                game.addMessage(`A poison dart hits a ${monsterName}!${entity.hp <= 0 ? ' It died.' : ''}`);
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
            const actualDamage = entity.hitPlayer(this.damage);
            game.addMessage(`You fall into a pit! You take ${actualDamage} damage.`);

            // Player takes time to climb out
            game.consumeTurn(50);

            if (entity.isDead()) {
                game.handlePlayerDeath();
            }
        } else {
            // Monster triggered the trap
            const actualDamage = Math.min(this.damage, entity.hp);
            entity.takeDamage(this.damage);

            if (isVisible) {
                this.discovered = true;
                const monsterName = entity.getDisplayName();
                game.addMessage(`A ${monsterName} falls into a pit!${entity.hp <= 0 ? ' It died.' : ''}`);
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
                    monster.lastSawPlayerMoves = 0;
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

// Trap factory for level-appropriate trap generation
class TrapFactory {
    static trapTypes = [
        SpikeTrap,
        PoisonDartTrap,
        PitTrap,
        TeleportTrap,
        AlarmTrap,
        WeakeningTrap
    ];

    static createRandomTrap(x, y, dungeonLevel = 1) {
        // Higher level = more dangerous traps
        let availableTraps = [...TrapFactory.trapTypes];

        // Early levels have simpler traps
        if (dungeonLevel <= 2) {
            availableTraps = [SpikeTrap, AlarmTrap];
        } else if (dungeonLevel <= 5) {
            availableTraps = [SpikeTrap, PoisonDartTrap, PitTrap, AlarmTrap];
        }

        const TrapClass = availableTraps[Math.floor(Math.random() * availableTraps.length)];
        return new TrapClass(x, y);
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Trap,
        SpikeTrap,
        PoisonDartTrap,
        PitTrap,
        TeleportTrap,
        AlarmTrap,
        WeakeningTrap,
        TrapFactory
    };
}

