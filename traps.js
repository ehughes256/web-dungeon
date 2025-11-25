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

    trigger(game, player) {
        if (this.triggered) return;
        this.triggered = true;
        // Override in subclass
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

    trigger(game, player) {
        if (this.triggered) return;
        super.trigger(game, player);

        const actualDamage = player.hitPlayer(this.damage);
        game.addMessage(`You triggered a spike trap! You take ${actualDamage} damage.`);

        if (player.isDead()) {
            game.handlePlayerDeath();
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

    trigger(game, player) {
        if (this.triggered) return;
        super.trigger(game, player);

        const actualDamage = player.hitPlayer(this.damage);
        game.addMessage(`A poison dart shoots out! You take ${actualDamage} damage.`);

        // Additional poison effect - reduce max health temporarily (not implemented yet)
        if (player.isDead()) {
            game.handlePlayerDeath();
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

    trigger(game, player) {
        if (this.triggered) return;
        super.trigger(game, player);

        const actualDamage = player.hitPlayer(this.damage);
        game.addMessage(`You fall into a pit! You take ${actualDamage} damage.`);

        // Player takes time to climb out
        game.consumeTurn(50);

        if (player.isDead()) {
            game.handlePlayerDeath();
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

    trigger(game, player) {
        if (this.triggered) return;
        super.trigger(game, player);

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
            player.x = newX;
            player.y = newY;
            game.addMessage('You are teleported to a random location!');
            game.computeFOV();
        } else {
            game.addMessage('The teleport trap fizzles...');
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

    trigger(game, player) {
        if (this.triggered) return;
        super.trigger(game, player);

        game.addMessage('You triggered an alarm! Monsters are alerted!');

        // Wake up all monsters in range and make them aggressive
        const alertRadius = 15;
        game.monsterManager.monsters.forEach(monster => {
            const dx = monster.x - player.x;
            const dy = monster.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= alertRadius) {
                // Make monster aware and move towards player
                monster.lastKnownPlayerLocation = [Game.player.x, Game.player.y];
                monster.lastSawPlayerMoves = 0;
                monster.state = 'aggressive';
            }
        });
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

    trigger(game, player) {
        if (this.triggered) return;
        super.trigger(game, player);

        // Temporarily reduce player stats
        const statReduction = Math.floor(Math.random() * 5) + 3; // 3-8 stat reduction
        player.strength = Math.max(1, player.strength - statReduction);
        player.dexterity = Math.max(1, player.dexterity - statReduction);
        game.timeManager.scheduleEvent(5000, this, () => {
            player.strength += statReduction;
            player.dexterity += statReduction;
            game.addMessage('You feel your strength returning.');
        });

        game.addMessage(`You feel weakened! -${statReduction} to strength and dexterity.`);
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

// Add method to Player class to check for traps
// This will be called from game.js when player moves
function checkForTraps(game, player) {
    const tile = game.dungeon.getTile(player.x, player.y);
    if (!tile || !tile.trap) return null;

    const trap = tile.trap;

    // If trap is already discovered, return it
    if (trap.discovered) {
        return trap;
    }

    // Calculate detection chance based on intelligence and luck
    const baseChance = 5; // 5% base chance
    const intBonus = Math.floor((player.intelligence - 50) / 10); // +1% per 10 int above 50
    const luckBonus = Math.floor((player.luck - 50) / 20); // +1% per 20 luck above 50

    const detectionDifficulty = trap.getDetectionDifficulty();
    const detectionChance = Math.min(95, Math.max(1, baseChance + intBonus + luckBonus + (100 - detectionDifficulty) / 2));

    const roll = Math.random() * 100;
    if (roll < detectionChance) {
        // Player spotted the trap!
        trap.discovered = true;
        game.addMessage(`You spot a ${trap.name}!`);
        game.running = false; // Stop running
        return trap;
    }

    return null;
}

// Function to trigger trap when player steps on it
function triggerTrap(game, player, trap) {
    if (!trap || trap.triggered || trap.discovered) return;

    trap.trigger(game, player);
    trap.discovered = true; // Traps become visible after triggering
}

