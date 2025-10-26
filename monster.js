// Monster system for the roguelike dungeon game

// Base Monster class
class Monster {
    static levelRange = [1, 5];

    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.hp = 1;
        this.maxHp = this.hp;
        this.dmg = 1;
        this.speed = 100;
        this.attackSpeed = 50;
        this.size = 100;
        this.armor = 0;
        this.nextActionTime = 0; // Time when the monster can next act
        this.experience = 0; // Experience given to player on death
        this.description = "A generic monster.";
        this.lastKnownPlayerLocation = null; // For tracking player last seen position
        this.lastSawPlayerMoves = 0;
        this.type = this.getType();

        // Set stats - to be overridden by subclasses
        this.setStats();
    }

    getDamage() {
        return Math.floor(Math.random() * this.dmg) + 1;
    }

    // Abstract methods to be implemented by subclasses
    getType() {
        throw new Error('getType must be implemented by subclass');
    }

    setStats() {
        throw new Error('setStats must be implemented by subclass');
    }

    getSymbol() {
        throw new Error('getSymbol must be implemented by subclass');
    }

    getColor() {
        return 'red'; // Default color, can be overridden
    }

    // AI behavior - can be overridden by subclasses for specific behavior
    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        // Default behavior: move toward player if visible
        if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x] && dist <= 10) {
            this.lastKnownPlayerLocation = [Game.player.x, Game.player.y];
            this.lastSawPlayerMoves = 0;
            const step =
                monsterManager.aStarNextStep(this.x, this.y, Game.player.x, Game.player.y) ||
                monsterManager.pathStepToward(this.x, this.y, Game.player.x, Game.player.y);
            if (step) {
                const [tx, ty] = step;
                if (
                    !(tx === Game.player.x && ty === Game.player.y) &&
                    monsterManager.isWalkableForMonster(tx, ty)
                ) {
                    this.moveToWithDelay(tx, ty, monsterManager.game, 50).then();
                }
            }
        } else if (this.lastKnownPlayerLocation) {
            // Move toward last known player location
            if (this.lastSawPlayerMoves < 15) { // remember for 15 moves
                const [lx, ly] = this.lastKnownPlayerLocation;
                const step =
                    monsterManager.aStarNextStep(this.x, this.y, lx, ly) ||
                    monsterManager.pathStepToward(this.x, this.y, lx, ly);
                if (step) {
                    const [tx, ty] = step;
                    if (!(tx === Game.player.x && ty === Game.player.y) &&
                        monsterManager.isWalkableForMonster(tx, ty)) {
                        this.moveToWithDelay(tx, ty, monsterManager.game, 50).then();
                    }
                }
            } else {
                this.lastKnownPlayerLocation = null; // forget after some time
            }
        } else if (Math.random() < 0.2) {
            // Random movement when not chasing - now includes diagonal directions
            const dirs = [
                [1, 0], [-1, 0], [0, 1], [0, -1], // Cardinal directions
                [1, 1], [1, -1], [-1, 1], [-1, -1] // Diagonal directions
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const wx = this.x + d[0];
            const wy = this.y + d[1];
            if (monsterManager.isWalkableForMonster(wx, wy)) {
                this.moveTo(wx, wy);
            }
        }
        this.scheduleNextAction(monsterManager.game.currentTick);
    }

    // Common methods for all monsters
    isAlive() {
        return this.hp > 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    async moveToWithDelay(x, y, game, delay) {
        this.x = x;
        this.y = y;
        game.render();
        await game.sleep(delay);
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    canAct(currentTick) {
        return currentTick >= this.nextActionTime;
    }

    scheduleNextAction(currentTick, delay = this.speed) {
        this.nextActionTime = currentTick + delay;
    }

    getDisplayName() {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }
}

// Goblin - Fast, weak melee monster
class Goblin extends Monster {
    static levelRange = [1, 5];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A wiry, sharp-toothed humanoid reeking of damp leather and bad intentions.';
    }

    getType() {
        return 'goblin';
    }

    setStats() {
        this.hp = 6 + Math.floor(Math.random() * 3); // 6-8 HP
        this.maxHp = this.hp;
        this.dmg = 5;
        this.speed = 75;
        this.size = 80; // Smaller size
        this.experience = 5; // Experience given to player on death
    }

    getSymbol() {
        return 'g';
    }

    getColor() {
        return '#00ff00'; // Green color for goblins
    }
}

// Orc - Strong, slow melee monster
class Orc extends Monster {
    static levelRange = [1, 5];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A brutish green-skinned warrior, muscles knotted under scarred hide and eyes burning with crude fury.';
    }

    getType() {
        return 'orc';
    }

    setStats() {
        this.hp = 14 + Math.floor(Math.random() * 5); // 14-18 HP
        this.maxHp = this.hp;
        this.dmg = 7;
        this.size = 110;
        this.speed = 200; // Acts every 2.0 time units (slow)
        this.experience = 15; // Experience given to player on death
    }

    getSymbol() {
        return 'O';
    }

    getColor() {
        return '#ff4444'; // Red color for orcs
    }
}

// Skeleton - Undead, medium stats, immune to certain effects
class Skeleton extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Rattling bones bound by necromantic malice; empty sockets glow with cold, unwavering purpose.';
    }

    getType() {
        return 'skeleton';
    }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 4); // 8-11 HP
        this.maxHp = this.hp;
        this.dmg = 4;
        this.size = 90;
        this.speed = 120; // Medium speed
        this.experience = 10; // Experience given to player on death
    }

    getSymbol() {
        return 's';
    }

    getColor() {
        return '#cccccc'; // Bone white color
    }
}

// Spider - Very fast, low HP, poison attack
class Spider extends Monster {
    static levelRange = [2, 6];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A skittering cavern spider, chitin glistening while venom beads along its hooked fangs.';
    }

    getType() {
        return 'spider';
    }

    setStats() {
        this.hp = 3 + Math.floor(Math.random() * 2); // 3-4 HP (fragile)
        this.maxHp = this.hp;
        this.dmg = 3;
        this.size = 50;
        this.speed = 30; // Very fast
        this.experience = 7; // Experience given to player on death
    }

    getSymbol() {
        return 'x';
    }

    getColor() {
        return '#8800ff'; // Purple for spiders
    }

    performAction(monsterManager) {
        // Spiders prefer to stay at range and dart in for quick attacks
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            // After attacking, try to move away
            const retreatDirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            for (const [dx, dy] of retreatDirs) {
                const newX = this.x + dx;
                const newY = this.y + dy;
                const newDist = Math.abs(newX - Game.player.x) + Math.abs(newY - Game.player.y);
                if (newDist > dist && monsterManager.isWalkableForMonster(newX, newY)) {
                    this.moveToWithDelay(newX, newY, monsterManager.game, 50).then();
                    break;
                }
            }
            return;
        }

        // Default spider behavior if not adjacent
        super.performAction(monsterManager);
    }
}

// Troll - Very tanky, regenerates health, slow
class Troll extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.lastRegenTick = 0;
        this.description = 'A hulking regenerating brute—mottled flesh knitting as quickly as blades can part it.';
    }

    getType() {
        return 'troll';
    }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 10); // 25-34 HP (very tanky)
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 120;
        this.speed = 300; // Very slow
        this.experience = 25; // Experience given to player on death
    }

    getSymbol() {
        return 'T';
    }

    getColor() {
        return '#00aa00'; // Dark green for trolls
    }

    performAction(monsterManager) {
        // Regenerate health every few ticks
        if (monsterManager.game.currentTick - this.lastRegenTick > 500 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + 2);
            this.lastRegenTick = monsterManager.game.currentTick;
            if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} regenerates!`);
            }
        }

        super.performAction(monsterManager);
    }
}

// Bat - Flying creature, erratic movement, weak but annoying
class Bat extends Monster {
    static levelRange = [3, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A squeaking blur of leathery wings and needle teeth, darting erratically through the gloom.';
    }

    getType() {
        return 'bat';
    }

    setStats() {
        this.hp = 2 + Math.floor(Math.random() * 2); // 2-3 HP
        this.maxHp = this.hp;
        this.dmg = 2;
        this.size = 50;
        this.speed = 40; // Fast and erratic
        this.experience = 4; // Experience given to player on death
    }

    getSymbol() {
        return 'b';
    }

    getColor() {
        return '#aa4400'; // Brown color for bats
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        // Bats move more erratically, even when chasing
        if (Math.random() < 0.7) {
            // Random erratic movement 70% of the time
            const dirs = [
                [1, 0], [-1, 0], [0, 1], [0, -1],
                [1, 1], [1, -1], [-1, 1], [-1, -1]
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const wx = this.x + d[0];
            const wy = this.y + d[1];
            if (monsterManager.isWalkableForMonster(wx, wy)) {
                this.moveToWithDelay(wx, wy, monsterManager.game, 50).then();
            }
        } else {
            // Sometimes chase player normally
            super.performAction(monsterManager);
        }
    }
}

// Wizard - Ranged attacker, stays at distance
class Wizard extends Monster {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.lastSpellTick = 0;
        this.description = 'A gaunt spellcaster in threadbare robes, fingers crackling with unstable arcane intent.';
    }

    getType() {
        return 'wizard';
    }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 3); // 8-10 HP
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 100;
        this.speed = 150; // Medium-slow
        this.experience = 20; // Experience given to player on death
    }

    getSymbol() {
        return 'W';
    }

    getColor() {
        return '#4444ff'; // Blue for wizards
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Wizards prefer to attack from range
        if (dist >= 2 && dist <= 5 && monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
            if (monsterManager.game.currentTick - this.lastSpellTick > 600) {
                // Cast magic missile
                const damage = this.dmg;
                Game.player.hitPlayer(damage);
                monsterManager.game.addMessage(`The ${this.getDisplayName()} casts magic missile for ${damage} damage!`);
                this.lastSpellTick = monsterManager.game.currentTick;
                return;
            }
        }

        // If too close, try to move away
        if (dist <= 2) {
            const retreatDirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            for (const [dx, dy] of retreatDirs) {
                const newX = this.x + dx;
                const newY = this.y + dy;
                const newDist = Math.abs(newX - Game.player.x) + Math.abs(newY - Game.player.y);
                if (newDist > dist && monsterManager.isWalkableForMonster(newX, newY)) {
                    this.moveToWithDelay(newX, newY, monsterManager.game, 50).then(() => {
                    });
                    monsterManager.game.render();
                    return;
                }
            }
        }

        // Default behavior if can't cast or retreat
        super.performAction(monsterManager);
    }
}

// Minotaur - Elite monster, high stats, charges at player
class Minotaur extends Monster {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.charging = false;
        this.description = 'A towering bull-headed terror—steam rises from flared nostrils as it paws for the charge.';
    }

    getType() {
        return 'minotaur';
    }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 15); // 30-44 HP (boss-like)
        this.maxHp = this.hp;
        this.dmg = 16;
        this.size = 130;
        this.speed = 130; // Medium-slow normally
        this.experience = 50; // Experience given to player on death
    }

    getSymbol() {
        return 'M';
    }

    getColor() {
        return '#ff8800'; // Orange for minotaurs
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Start charging if player is in line of sight and at medium distance
        if (!this.charging && dist >= 3 && dist <= 6) {
            const dx = Game.player.x - this.x;
            const dy = Game.player.y - this.y;

            // Check if player is in a straight line (horizontal, vertical, or diagonal)
            if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
                this.charging = true;
                this.speed = 50; // Much faster when charging
                monsterManager.game.addMessage(`The ${this.getDisplayName()} begins charging!`);
            }
        }

        // Stop charging when adjacent or after a few moves
        if (this.charging && (dist <= 1.5 || Math.random() < 0.3)) {
            this.charging = false;
            this.speed = 130; // Back to normal speed
        }

        super.performAction(monsterManager);
    }
}

// Ghost - Phases through walls, ethereal
class Ghost extends Monster {
    static levelRange = [3, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A translucent remnant of a restless soul, its edges fraying into the chill air.';
    }

    getType() {
        return 'ghost';
    }

    setStats() {
        this.hp = 6 + Math.floor(Math.random() * 4); // 6-9 HP
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 105;
        this.speed = 80; // Medium-fast
        this.experience = 12; // Experience given to player on death
    }

    getSymbol() {
        return 'G';
    }

    getColor() {
        return '#aaaaff'; // Pale blue for ghosts
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        // Ghosts can move through walls - direct path to player
        if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x] && dist <= 8) {
            const dx = Game.player.x - this.x;
            const dy = Game.player.y - this.y;

            let moveX = 0;
            let moveY = 0;
            if (dx > 0) moveX = 1;
            else if (dx < 0) moveX = -1;
            if (dy > 0) moveY = 1;
            else if (dy < 0) moveY = -1;

            const newX = this.x + moveX;
            const newY = this.y + moveY;

            if (monsterManager.game.inBounds(newX, newY)) {
                this.moveToWithDelay(newX, newY, monsterManager.game, 50).then();
            }
        } else {
            // Random movement when not chasing
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const wx = this.x + d[0];
            const wy = this.y + d[1];
            if (monsterManager.game.inBounds(wx, wy)) {
                this.moveTo(wx, wy);
            }
        }
    }
}

// Monster factory for creating monsters
class MonsterFactory {
    static monsterTypes = [
        {class: Goblin, weight: 4},
        {class: Orc, weight: 2},
        {class: Skeleton, weight: 2},
        {class: Spider, weight: 3},
        {class: Troll, weight: 1},
        {class: Bat, weight: 3},
        {class: Wizard, weight: 2},
        {class: Minotaur, weight: 1},
        {class: Ghost, weight: 2},
    ];

    static createRandomMonster(id, x, y, currentLevel = 1) {
        // Filter monsters that are appropriate for the current level
        const validMonsters = this.monsterTypes.filter(monsterType => {
            const levelRange = monsterType.class.levelRange;
            if (!levelRange) return true; // If no level range defined, always valid

            // Monster is valid if current level is within its level range
            return currentLevel >= levelRange[0] && currentLevel <= levelRange[1];
        });

        // If no valid monsters found (shouldn't happen), fall back to all monsters
        if (validMonsters.length === 0) {
            validMonsters.push(...this.monsterTypes);
        }

        // Calculate total weight for valid monsters
        const totalWeight = validMonsters.reduce((sum, type) => sum + type.weight, 0);
        let random = Math.random() * totalWeight;

        for (const monsterType of validMonsters) {
            if (random < monsterType.weight) {
                return new monsterType.class(id, x, y);
            }
            random -= monsterType.weight;
        }

        // Fallback to goblin
        return new Goblin(id, x, y);
    }
}

class MonsterManager {
    constructor(game) {
        this.game = game;
        this.monsters = [];
        this.monsterIdCounter = 1;
    }

    // Monster spawning logic using factory
    spawnMonsters() {
        const maxMon = Math.max(1, Math.floor(this.game.dungeon.rooms.length * 0.7));
        const startRoom = this.game.dungeon.rooms[0];
        let attempts = 0;
        this.monsters = [];

        while (this.monsters.length < maxMon && attempts < 800) {
            attempts++;
            const room = this.game.dungeon.rooms[Math.floor(Math.random() * this.game.dungeon.rooms.length)];
            if (room === startRoom) continue;

            const x = room.x + Math.floor(Math.random() * room.width);
            const y = room.y + Math.floor(Math.random() * room.height);

            if (!this.isWalkableForMonster(x, y)) continue;
            if (this.game.itemManager.items.some((it) => it.x === x && it.y === y)) continue;
            if (
                (this.game.upStair && x === this.game.upStair.x && y === this.game.upStair.y) ||
                (this.game.downStair && x === this.game.downStair.x && y === this.game.downStair.y)
            )
                continue;

            // Pass the current dungeon level to createRandomMonster
            const currentLevel = this.game.dungeonLevel || 1;
            const monster = MonsterFactory.createRandomMonster(this.monsterIdCounter++, x, y, currentLevel);
            this.monsters.push(monster);
        }
    }

    // Helper for monster walkability
    isWalkableForMonster(x, y) {
        if (x < 0 || y < 0 || x >= this.game.width || y >= this.game.height) return false;
        const tile = this.game.dungeon.getTile(x, y);
        if (!tile || tile.type === '#' || tile.type === '+') return false; // wall or closed door
        return !this.monsters.some((m) => m.x === x && m.y === y);
    }

    // Greedy step toward target (simple heuristic)
    pathStepToward(sx, sy, tx, ty) {
        const dx = Math.sign(tx - sx);
        const dy = Math.sign(ty - sy);
        const primaryFirst = Math.random() < 0.5; // small variation
        const options = primaryFirst
            ? [
                [sx + dx, sy],
                [sx, sy + dy],
            ]
            : [
                [sx, sy + dy],
                [sx + dx, sy],
            ];

        for (const [nx, ny] of options) {
            if (this.isWalkableForMonster(nx, ny) || (nx === Game.player.x && ny === Game.player.y)) {
                return [nx, ny];
            }
        }
        return null;
    }

    // A* pathfinding for smarter monster movement
    aStarNextStep(sx, sy, tx, ty, maxNodes = 800) {
        if (sx === tx && sy === ty) return null;

        const open = new Map();
        const cameFrom = new Map(); // childKey -> parentKey
        const key = (x, y) => x + ',' + y;
        const h = (x, y) => Math.abs(x - tx) + Math.abs(y - ty);
        const startKey = key(sx, sy);
        const targetKey = key(tx, ty);
        const start = {x: sx, y: sy, g: 0, f: h(sx, sy)};

        open.set(startKey, start);
        const gScore = new Map([[startKey, 0]]);
        const closed = new Set();
        let nodes = 0;
        let found = false;

        while (open.size && nodes < maxNodes) {
            nodes++;
            let current;
            for (const v of open.values()) {
                if (!current || v.f < current.f) current = v;
            }

            const currentKey = key(current.x, current.y);
            open.delete(currentKey);

            if (currentKey === targetKey) {
                found = true;
                break;
            }

            closed.add(currentKey);

            const dirs = [
                [1, 0],
                [1, 1],
                [-1, 0],
                [-1, 1],
                [0, 1],
                [-1, -1],
                [0, -1],
                [1, -1]
            ];
            for (const [dx, dy] of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                if (nx < 0 || ny < 0 || nx >= this.game.width || ny >= this.game.height) continue;
                const nk = key(nx, ny);
                if (closed.has(nk)) continue;
                const tile = this.game.dungeon.getTile(nx, ny);
                if (!tile || tile.type === '#' || tile.type === '+') continue;
                if (this.monsters.some((m) => m.x === nx && m.y === ny && !(nx === tx && ny === ty))) continue;

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
                const existing = open.get(nk);
                if (!existing || tentativeG < (gScore.get(nk) ?? Infinity)) {
                    cameFrom.set(nk, currentKey);
                    gScore.set(nk, tentativeG);
                    const f = tentativeG + h(nx, ny);
                    open.set(nk, {x: nx, y: ny, g: tentativeG, f});
                }
            }
        }

        if (!found) return null;

        // Reconstruct path from target back to start
        const path = [];
        let currentKey = targetKey;
        while (currentKey) {
            const [cx, cy] = currentKey.split(',').map(Number);
            path.push([cx, cy]);
            if (currentKey === startKey) break;
            currentKey = cameFrom.get(currentKey);
        }
        if (path[path.length - 1][0] !== sx || path[path.length - 1][1] !== sy) return null; // didn't reach start
        path.reverse();
        if (path.length < 2) return null; // already at target
        return path[1]; // first step after start
    }

    // Process time increments and handle monster actions
    processTimeIncrement() {
        const actingMonsters = this.monsters.filter(
            (monster) => monster.isAlive() && monster.canAct(this.game.currentTick)
        );

        let anyMovement = false;
        for (const monster of actingMonsters) {
            const oldX = monster.x;
            const oldY = monster.y;
            monster.performAction(this);

            // Track if any monster moved for rendering purposes
            if (monster.x !== oldX || monster.y !== oldY) {
                anyMovement = true;
            }
        }

        // Render the screen if monsters moved or acted
        if (actingMonsters.length > 0) {
            this.game.render();
            // Add a small delay to make movement visible
            if (anyMovement) {
                // Use a shorter delay for smoother animation
                setTimeout(() => {
                }, 100); // 100ms delay
            }
        }

        return actingMonsters.length > 0;
    }

    // Combat methods
    monsterAttackPlayer(monster) {
        this.game.running = false;

        const chanceToEvade = Game.player.chanceToEvade();
        if ((Math.random() * 100) < chanceToEvade) {
            this.game.addMessage(`You evade the ${monster.getDisplayName()}'s attack!`);
            monster.scheduleNextAction(this.game.currentTick, monster.attackSpeed);
            return;
        }
        const dmg = Math.max(1, monster.getDamage());
        const actualDamage = Game.player.hitPlayer(dmg);

        this.game.addMessage(`The ${monster.getDisplayName()} hits you for ${actualDamage} damage.`);

        if (Game.player.isDead()) {
            this.game.gameOver = true;
            this.game.addMessage('You die. Game over.');
        }
        monster.scheduleNextAction(this.game.currentTick, monster.attackSpeed);
    }

    attackMonster(monster) {
        const attack = Game.player.getAttack();
        const damage = Math.floor((Math.random() * attack.baseDamage) + attack.bonus + attack.strengthBonus);

        const died = monster.takeDamage(damage);
        this.game.addMessage(`You hit ${monster.getDisplayName()} for ${damage} damage.`);

        if (died) {
            this.game.addMessage(`${monster.getDisplayName()} dies.`);
            Game.player.gainExperience(monster.experience);
            this.monsters = this.monsters.filter((m) => m !== monster);
            this.game.render();
        }

        this.game.consumeTurn(Game.player.equippedWeapon().speed || 50);
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Monster, Goblin, Orc, MonsterFactory, MonsterManager};
}
