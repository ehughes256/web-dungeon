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
        // Elemental resistances: 0.0 = immune, 0.5 = half damage, 1.0 = normal, 1.5 = weakness, 2.0 = double damage
        this.resistances = {
            physical: 1.0,
            fire: 1.0,
            ice: 1.0,
            lightning: 1.0,
            poison: 1.0,
            holy: 1.0,
            dark: 1.0
        };

        // Poison status effect
        this.poisoned = false;
        this.poisonDamage = 0;
        this.poisonTicksRemaining = 0;

        // Whether this monster can open unlocked doors
        this.canOpenDoors = false;

        // Wander target for idle movement (null = standing still)
        this.wanderTarget = null;

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

        // Default behavior: move toward player if visible (and not invisible)
        if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x] && dist <= 10 && !Game.player.invisible) {
            this.lastKnownPlayerLocation = [Game.player.x, Game.player.y];
            this.lastSawPlayerMoves = 0;
            this.wanderTarget = null;
            const step =
                monsterManager.aStarNextStep(this.x, this.y, Game.player.x, Game.player.y, this) ||
                monsterManager.pathStepToward(this.x, this.y, Game.player.x, Game.player.y, this);
            if (step) {
                const [tx, ty] = step;
                if (
                    !(tx === Game.player.x && ty === Game.player.y) &&
                    monsterManager.isWalkableForMonster(tx, ty, this)
                ) {
                    this.moveTo(tx, ty);
                }
            }
        } else if (this.lastKnownPlayerLocation) {
            // Move toward last known player location
            if (this.lastSawPlayerMoves < 15) { // remember for 15 moves
                const [lx, ly] = this.lastKnownPlayerLocation;
                const step =
                    monsterManager.aStarNextStep(this.x, this.y, lx, ly, this) ||
                    monsterManager.pathStepToward(this.x, this.y, lx, ly, this);
                if (step) {
                    const [tx, ty] = step;
                    if (!(tx === Game.player.x && ty === Game.player.y) &&
                        monsterManager.isWalkableForMonster(tx, ty, this)) {
                        this.moveTo(tx, ty);
                    }
                }
            } else {
                this.lastKnownPlayerLocation = null; // forget after some time
            }
            this.lastSawPlayerMoves += 1;
        } else {
            // Idle wandering: move toward wander target or pick a new one
            this.idleWander(monsterManager);
        }
        this.scheduleNextAction(monsterManager.game.currentTick);
    }

    // Common methods for all monsters
    isAlive() {
        return this.hp > 0;
    }

    takeDamage(amount, damageType = 'physical') {
        // Apply elemental resistance/weakness
        const resistance = this.resistances[damageType] || 1.0;
        const actualDamage = Math.floor(amount * resistance);

        this.hp -= actualDamage;
        return {
            died: this.hp <= 0,
            actualDamage: actualDamage,
            resistance: resistance,
            wasResisted: resistance < 1.0,
            wasWeak: resistance > 1.0
        };
    }

    applyPoison(damagePerTick, ticks) {
        // Poison-immune monsters (resistance 0.0) can't be poisoned
        if (this.resistances.poison === 0.0) return;
        if (this.poisoned) {
            // Stack: add damage, take longer duration
            this.poisonDamage += damagePerTick;
            this.poisonTicksRemaining = Math.max(this.poisonTicksRemaining, ticks);
        } else {
            this.poisoned = true;
            this.poisonDamage = damagePerTick;
            this.poisonTicksRemaining = ticks;
        }
    }

    processPoisonTick(game) {
        if (!this.poisoned || this.poisonTicksRemaining <= 0) {
            this.poisoned = false;
            return 0;
        }

        const resistance = this.resistances.poison || 1.0;
        const damage = Math.max(1, Math.floor(this.poisonDamage * resistance));
        this.hp -= damage;
        this.poisonTicksRemaining--;

        if (this.poisonTicksRemaining <= 0) {
            this.poisoned = false;
        }

        return damage;
    }

    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }


    moveTo(x, y) {
        // Open closed unlocked doors if able
        if (this.canOpenDoors && Game.instance) {
            const tile = Game.instance.dungeon.getTile(x, y);
            if (tile && tile.type === '+' && !tile.locked) {
                tile.type = '/';
                if (Game.instance.visible[y] && Game.instance.visible[y][x]) {
                    Game.instance.addMessage(`The ${this.getDisplayName()} opens a door.`);
                }
            }
        }
        this.x = x;
        this.y = y;
    }

    // Idle wandering: pick a random walkable spot or stand still
    idleWander(monsterManager) {
        // Arrived at target or no target — decide what to do next
        if (!this.wanderTarget || (this.x === this.wanderTarget[0] && this.y === this.wanderTarget[1])) {
            this.wanderTarget = null;
            // 50% chance to stand still, 50% to pick a new destination
            if (Math.random() < 0.5) return;
            this.wanderTarget = this.pickWanderTarget(monsterManager);
            if (!this.wanderTarget) return;
        }

        const [wx, wy] = this.wanderTarget;
        const step =
            monsterManager.aStarNextStep(this.x, this.y, wx, wy, this) ||
            monsterManager.pathStepToward(this.x, this.y, wx, wy, this);
        if (step) {
            const [tx, ty] = step;
            if (!(tx === Game.player.x && ty === Game.player.y) &&
                monsterManager.isWalkableForMonster(tx, ty, this)) {
                this.moveTo(tx, ty);
            } else {
                // Path blocked — give up on this target
                this.wanderTarget = null;
            }
        } else {
            // No path found — give up
            this.wanderTarget = null;
        }
    }

    // Pick a random walkable floor tile as a wander destination
    pickWanderTarget(monsterManager) {
        const dungeon = monsterManager.game.dungeon;
        const rooms = dungeon.rooms;
        if (!rooms || rooms.length === 0) return null;

        // Try a few times to find a valid spot
        for (let i = 0; i < 10; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const tx = room.x + Math.floor(Math.random() * room.width);
            const ty = room.y + Math.floor(Math.random() * room.height);
            const tile = dungeon.getTile(tx, ty);
            if (tile && tile.type === '.') {
                return [tx, ty];
            }
        }
        return null;
    }

    // Check if monster triggered a trap
    checkForTraps(game) {
        const tile = game.dungeon.getTile(this.x, this.y);
        if (!tile || !tile.trap) return;

        const trap = tile.trap;

        // If trap is already triggered, don't trigger again
        if (trap.triggered) return;

        // Check if trap can trigger
        if (!trap.canTrigger(this)) return;

        // Monsters always trigger traps (no detection chance)
        trap.trigger(game, this);
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
        this.canOpenDoors = true;
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
        this.canOpenDoors = true;
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
        // Thematic resistances (undead)
        this.resistances.poison = 0.0; // Immune to poison
        this.resistances.ice = 0.5; // Resistant to cold
        this.resistances.holy = 1.5; // Weak to holy
        this.resistances.dark = 0.5; // Resistant to dark
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
        this.canOpenDoors = true;
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
    static levelRange = [3, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A skittering cavern spider, chitin glistening while venom beads along its hooked fangs.';
        // Thematic resistances
        this.resistances.poison = 0.0; // Immune to poison (produces it)
        this.resistances.fire = 1.5; // Weak to fire (chitin burns)
        // Venomous bite
        this.poisonChance = 0.4;
        this.poisonDmgPerTick = 1;
        this.poisonDuration = 4;
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
                if (newDist > dist && monsterManager.isWalkableForMonster(newX, newY, this)) {
                    this.moveTo(newX, newY);
                    break;
                }
            }
            return;
        }

        // Default spider behavior if not adjacent
        super.performAction(monsterManager);
    }
}

// Phase Spider - Teleports short distances, stronger venom
class PhaseSpider extends Monster {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A spider that flickers between planes of existence, its translucent body phasing in and out of sight.';
        this.resistances.poison = 0.0;
        this.resistances.fire = 1.5;
        this.resistances.physical = 0.7; // Partially phased
        this.poisonChance = 0.5;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 5;
        this.phaseCooldown = 0;
    }

    getType() {
        return 'phase spider';
    }

    setStats() {
        this.hp = 10 + Math.floor(Math.random() * 5); // 10-14 HP
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 60;
        this.speed = 50;
        this.experience = 18;
    }

    getSymbol() {
        return 'x';
    }

    getColor() {
        return '#00CCCC'; // Cyan — ethereal
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            // Phase away after attacking
            if (this.phaseCooldown <= 0) {
                this.phaseShift(monsterManager);
                this.phaseCooldown = 3;
            }
            return;
        }

        this.phaseCooldown = Math.max(0, this.phaseCooldown - 1);

        // Phase toward player if in range but not adjacent
        if (dist <= 6 && dist > 2 && this.phaseCooldown <= 0 &&
            monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
            // Teleport to a tile adjacent to the player
            const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            const shuffled = dirs.sort(() => Math.random() - 0.5);
            for (const [dx, dy] of shuffled) {
                const tx = Game.player.x + dx;
                const ty = Game.player.y + dy;
                if (monsterManager.isWalkableForMonster(tx, ty, this)) {
                    if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
                        monsterManager.game.addMessage(`The ${this.getDisplayName()} blinks through reality!`);
                    }
                    this.moveTo(tx, ty);
                    this.phaseCooldown = 3;
                    this.scheduleNextAction(monsterManager.game.currentTick);
                    return;
                }
            }
        }

        // Fall back to spider hit-and-run behavior
        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }
        super.performAction(monsterManager);
    }

    phaseShift(monsterManager) {
        // Teleport 2-3 tiles away from current position
        const candidates = [];
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                const d = Math.abs(dx) + Math.abs(dy);
                if (d < 2 || d > 3) continue;
                const tx = this.x + dx;
                const ty = this.y + dy;
                if (monsterManager.isWalkableForMonster(tx, ty, this)) {
                    candidates.push([tx, ty]);
                }
            }
        }
        if (candidates.length > 0) {
            const [tx, ty] = candidates[Math.floor(Math.random() * candidates.length)];
            this.moveTo(tx, ty);
        }
    }
}

// Brood Mother - Large spider that spawns spiderlings
class BroodMother extends Monster {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A bloated spider queen, her abdomen swollen with writhing offspring ready to spill forth.';
        this.resistances.poison = 0.0;
        this.resistances.fire = 1.5;
        this.poisonChance = 0.3;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 6;
        this.spawnCooldown = 0;
    }

    getType() {
        return 'brood mother';
    }

    setStats() {
        this.hp = 22 + Math.floor(Math.random() * 8); // 22-29 HP
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 120;
        this.speed = 150; // Slow — heavy
        this.experience = 35;
    }

    getSymbol() {
        return 'x';
    }

    getColor() {
        return '#4B0082'; // Indigo — darker, larger
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Try to spawn a spiderling when hurt and player is nearby
        if (this.spawnCooldown <= 0 && this.hp < this.maxHp && dist <= 6 &&
            monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
            const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            const shuffled = dirs.sort(() => Math.random() - 0.5);
            for (const [dx, dy] of shuffled) {
                const sx = this.x + dx;
                const sy = this.y + dy;
                if (monsterManager.isWalkableForMonster(sx, sy, this) &&
                    !(sx === Game.player.x && sy === Game.player.y)) {
                    const spiderling = monsterManager.spawnSpecificMonster(Spider, sx, sy);
                    if (spiderling && monsterManager.game.visible[sy] && monsterManager.game.visible[sy][sx]) {
                        monsterManager.game.addMessage(`The ${this.getDisplayName()} births a spider!`);
                    }
                    this.spawnCooldown = 6;
                    this.scheduleNextAction(monsterManager.game.currentTick);
                    return;
                }
            }
        }

        this.spawnCooldown = Math.max(0, this.spawnCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

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
            if (monsterManager.isWalkableForMonster(wx, wy, this)) {
                this.moveTo(wx, wy);
            }
        } else {
            // Sometimes chase player normally
            super.performAction(monsterManager);
        }
    }
}

// Vampire Bat - Drains life on hit, faster than regular bat
class VampireBat extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Red-eyed and ravenous, this bat\'s fangs drip with an unholy thirst for warm blood.';
        this.resistances.dark = 0.5;
        this.resistances.holy = 1.5;
    }

    getType() {
        return 'vampire bat';
    }

    setStats() {
        this.hp = 5 + Math.floor(Math.random() * 3); // 5-7 HP
        this.maxHp = this.hp;
        this.dmg = 4;
        this.size = 55;
        this.speed = 35; // Very fast
        this.experience = 10;
    }

    getSymbol() {
        return 'b';
    }

    getColor() {
        return '#8B0000'; // Dark red
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            // Custom attack with life drain
            monsterManager.game.running = false;
            const chanceToEvade = Game.player.chanceToEvade();
            if ((Math.random() * 100) < chanceToEvade) {
                monsterManager.game.addMessage(`You evade the ${this.getDisplayName()}'s bite!`);
                this.scheduleNextAction(monsterManager.game.currentTick, this.attackSpeed);
                return;
            }
            const dmg = Math.max(1, this.getDamage());
            const actualDamage = Game.player.hitPlayer(dmg);
            if (actualDamage > 0) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} bites you for ${actualDamage} damage and drinks your blood!`);
                this.hp = Math.min(this.maxHp, this.hp + Math.ceil(actualDamage / 2));
            } else {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} bites but can't pierce your armor!`);
            }
            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }
            this.scheduleNextAction(monsterManager.game.currentTick, this.attackSpeed);
            return;
        }

        // Erratic movement like regular bat, but more aggressive (50/50 instead of 70/30)
        if (Math.random() < 0.5) {
            const dirs = [
                [1, 0], [-1, 0], [0, 1], [0, -1],
                [1, 1], [1, -1], [-1, 1], [-1, -1]
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const wx = this.x + d[0];
            const wy = this.y + d[1];
            if (monsterManager.isWalkableForMonster(wx, wy, this)) {
                this.moveTo(wx, wy);
            }
        } else {
            super.performAction(monsterManager);
        }
    }
}

// Dire Bat - Large bat, screech stuns, tougher
class DireBat extends Monster {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A monstrous bat with a wingspan wider than a man is tall, its shriek rattles the bones.';
        this.screechCooldown = 0;
    }

    getType() {
        return 'dire bat';
    }

    setStats() {
        this.hp = 14 + Math.floor(Math.random() * 5); // 14-18 HP
        this.maxHp = this.hp;
        this.dmg = 7;
        this.size = 100;
        this.speed = 55;
        this.experience = 20;
    }

    getSymbol() {
        return 'b';
    }

    getColor() {
        return '#2F2F2F'; // Near-black
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Screech attack: slows the player temporarily
        if (dist <= 3 && dist > 1 && this.screechCooldown <= 0 && Math.random() < 0.3 &&
            monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} lets out a bone-rattling screech!`);
            monsterManager.game.running = false;
            Game.player.speed = Math.min(250, Game.player.speed + 50);
            monsterManager.game.timeManager.scheduleEvent(300, () => {
                Game.player.speed = Math.max(100, Game.player.speed - 50);
            });
            this.screechCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.screechCooldown = Math.max(0, this.screechCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        // Less erratic than normal bat (40% random, 60% chase)
        if (Math.random() < 0.4) {
            const dirs = [
                [1, 0], [-1, 0], [0, 1], [0, -1],
                [1, 1], [1, -1], [-1, 1], [-1, -1]
            ];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const wx = this.x + d[0];
            const wy = this.y + d[1];
            if (monsterManager.isWalkableForMonster(wx, wy, this)) {
                this.moveTo(wx, wy);
            }
        } else {
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
        this.canOpenDoors = true;
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
                if (newDist > dist && monsterManager.isWalkableForMonster(newX, newY, this)) {
                    this.moveTo(newX, newY);
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
        this.canOpenDoors = true;
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
        // Thematic resistances (undead/incorporeal)
        this.resistances.poison = 0.0; // Immune to poison
        this.resistances.ice = 0.3; // Highly resistant to cold
        this.resistances.physical = 0.5; // Resistant to physical (incorporeal)
        this.resistances.holy = 1.5; // Weak to holy
        this.resistances.dark = 0.5; // Resistant to dark
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

            if (monsterManager.game.dungeon.inBounds(newX, newY)) {
                this.moveTo(newX, newY);
            }
        } else {
            // Random movement when not chasing
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const wx = this.x + d[0];
            const wy = this.y + d[1];
            if (monsterManager.game.dungeon.inBounds(wx, wy)) {
                this.moveTo(wx, wy);
            }
        }
    }
}

// ============================================
// ORC HIERARCHY (all use 'O' symbol)
// ============================================

// Uruk-hai - Elite orc warriors
class UrukHai extends Monster {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A towering orc-breed forged for war, armored in blackened steel and fear.';
    }

    getType() {
        return 'uruk-hai';
    }

    setStats() {
        this.hp = 22 + Math.floor(Math.random() * 7); // 22-28 HP
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 120;
        this.speed = 140; // Faster than regular orc
        this.experience = 25;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'O';
    }

    getColor() {
        return '#8B0000'; // Dark red
    }
}

// Orc Berserker - Frenzied attacker
class OrcBerserker extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Frothing with battle-lust, this orc warrior fights with reckless, devastating fury.';
    }

    getType() {
        return 'orc berserker';
    }

    setStats() {
        this.hp = 18 + Math.floor(Math.random() * 7); // 18-24 HP
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 115;
        this.speed = 120;
        this.experience = 30;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'O';
    }

    getColor() {
        return '#FF0000'; // Bright red
    }
}

// Orc Shaman - Magic-using orc
class OrcShaman extends Monster {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Bones and fetishes clatter as this orc witch-doctor channels dark, primal magic.';
        this.spellCooldown = 0;
        // Toxic curse
        this.poisonChance = 0.25;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 6;
    }

    getType() {
        return 'orc shaman';
    }

    setStats() {
        this.hp = 16 + Math.floor(Math.random() * 5); // 16-20 HP
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 105;
        this.speed = 160;
        this.experience = 35;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'O';
    }

    getColor() {
        return '#9932CC'; // Purple
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Cast spell at range
        if (dist >= 2 && dist <= 5 && this.spellCooldown <= 0 && Math.random() < 0.4) {
            const spellType = Math.floor(Math.random() * 2);

            if (spellType === 0) {
                // Dark bolt
                monsterManager.game.addMessage(`The ${this.getDisplayName()} hurls a dark bolt!`);
                const boltDamage = Game.player.hitPlayer(9);
                if (boltDamage > 0) {
                    monsterManager.game.addMessage(`Dark magic strikes you for ${boltDamage} damage!`);
                }
            } else {
                // Curse (weaken player temporarily)
                monsterManager.game.addMessage(`The ${this.getDisplayName()} curses you!`);
                const curseDamage = Game.player.hitPlayer(5);
                if (curseDamage > 0) {
                    monsterManager.game.addMessage(`The curse drains ${curseDamage} HP!`);
                }
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.spellCooldown = 6;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.spellCooldown = Math.max(0, this.spellCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// ============================================
// GOBLIN HIERARCHY (all use 'g' symbol)
// ============================================

// Hobgoblin - Larger, disciplined goblins
class Hobgoblin extends Monster {
    static levelRange = [3, 7];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A disciplined goblinoid soldier, taller and crueler than its lesser kin.';
    }

    getType() {
        return 'hobgoblin';
    }

    setStats() {
        this.hp = 12 + Math.floor(Math.random() * 5); // 12-16 HP
        this.maxHp = this.hp;
        this.dmg = 7;
        this.size = 95;
        this.speed = 100;
        this.experience = 12;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'g';
    }

    getColor() {
        return '#FFA500'; // Orange
    }
}

// Goblin Archer - Ranged attacker
class GoblinArcher extends Monster {
    static levelRange = [2, 6];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A sneering goblin with a crude bow, quick to loose poison-tipped arrows.';
    }

    getType() {
        return 'goblin archer';
    }

    setStats() {
        this.hp = 5 + Math.floor(Math.random() * 3); // 5-7 HP
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 75;
        this.speed = 80;
        this.experience = 8;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'g';
    }

    getColor() {
        return '#00CC00'; // Lime green
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Shoot arrow at range 2-5
        if (dist >= 2 && dist <= 5 && Math.random() < 0.6) {
            monsterManager.game.running = false;
            monsterManager.game.addMessage(`The ${this.getDisplayName()} shoots an arrow!`);

            const chanceToEvade = Game.player.chanceToEvade();
            if ((Math.random() * 100) < chanceToEvade) {
                monsterManager.game.addMessage('You dodge the arrow!');
            } else {
                const arrowDamage = Game.player.hitPlayer(this.dmg);
                if (arrowDamage > 0) {
                    monsterManager.game.addMessage(`The arrow hits for ${arrowDamage} damage!`);
                } else {
                    monsterManager.game.addMessage('Your armor deflects the arrow!');
                }

                if (Game.player.isDead()) {
                    monsterManager.game.gameOver = true;
                    monsterManager.game.addMessage('You die. Game over.');
                }
            }

            this.scheduleNextAction(monsterManager.game.currentTick, this.attackSpeed);
            return;
        }

        // Melee if adjacent
        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        // Move toward player
        super.performAction(monsterManager);
    }
}

// Goblin King - Rare boss-type goblin
class GoblinKing extends Monster {
    static levelRange = [6, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A bloated goblin chieftain draped in stolen gold and unearned arrogance.';
    }

    getType() {
        return 'goblin king';
    }

    setStats() {
        this.hp = 28 + Math.floor(Math.random() * 8); // 28-35 HP
        this.maxHp = this.hp;
        this.dmg = 9;
        this.size = 105;
        this.speed = 90;
        this.experience = 40;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'g';
    }

    getColor() {
        return '#FFD700'; // Gold
    }
}

// ============================================
// UNDEAD HIERARCHY (various symbols)
// ============================================

// Zombie - Slow, durable undead (use 'z')
class Zombie extends Monster {
    static levelRange = [1, 5];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Rotting flesh drips from shambling bones; hunger eternal drives each lurching step.';
        // Thematic resistances (undead)
        this.resistances.poison = 0.0; // Immune to poison
        this.resistances.ice = 0.5; // Resistant to cold
        this.resistances.holy = 1.5; // Weak to holy
        this.resistances.dark = 0.5; // Resistant to dark
        this.resistances.fire = 1.3; // Somewhat weak to fire (decaying flesh)
    }

    getType() {
        return 'zombie';
    }

    setStats() {
        this.hp = 16 + Math.floor(Math.random() * 5); // 16-20 HP
        this.maxHp = this.hp;
        this.dmg = 5;
        this.size = 100;
        this.speed = 250; // Very slow
        this.experience = 8;
    }

    getSymbol() {
        return 'z';
    }

    getColor() {
        return '#556B2F'; // Dark olive
    }
}

// Wight - Powerful undead warrior (use 'W')
class Wight extends Monster {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Once a warrior-king, now a hollow husk armored in ancient mail and deathless malice.';
        // Thematic resistances (undead/armored)
        this.resistances.poison = 0.0; // Immune to poison
        this.resistances.ice = 0.4; // Highly resistant to cold
        this.resistances.physical = 0.8; // Resistant (armored)
        this.resistances.holy = 1.5; // Weak to holy
        this.resistances.dark = 0.3; // Highly resistant to dark
    }

    getType() {
        return 'wight';
    }

    setStats() {
        this.hp = 20 + Math.floor(Math.random() * 7); // 20-26 HP
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 105;
        this.speed = 130;
        this.experience = 45;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'W';
    }

    getColor() {
        return '#4169E1'; // Royal blue
    }
}

// Lich - Undead sorcerer with powerful magic
class Lich extends Monster {
    static levelRange = [10, 15];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A desiccated sorcerer wrapped in eldritch power, immortality\'s terrible price paid in full.';
        this.spellCooldown = 0;
        // Thematic resistances (undead/sorcerer)
        this.resistances.poison = 0.0; // Immune to poison
        this.resistances.ice = 0.3; // Highly resistant to cold
        this.resistances.fire = 0.7; // Resistant (magical)
        this.resistances.lightning = 0.7; // Resistant (magical)
        this.resistances.holy = 1.5; // Weak to holy
        this.resistances.dark = 0.0; // Immune to dark (source of power)
    }

    getType() {
        return 'lich';
    }

    setStats() {
        this.hp = 35 + Math.floor(Math.random() * 11); // 35-45 HP
        this.maxHp = this.hp;
        this.dmg = 15;
        this.size = 100;
        this.speed = 140;
        this.experience = 80;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'L';
    }

    getColor() {
        return '#9400D3'; // Dark violet
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Cast powerful spell at range
        if (dist >= 2 && dist <= 7 && this.spellCooldown <= 0 && Math.random() < 0.5) {
            const spellType = Math.floor(Math.random() * 3);

            switch (spellType) {
                case 0: // Death bolt
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} casts a death bolt!`);
                    const boltDamage = Game.player.hitPlayer(18);
                    if (boltDamage > 0) {
                        monsterManager.game.addMessage(`Necrotic energy sears you for ${boltDamage} damage!`);
                    }
                    break;

                case 1: // Drain life
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} drains your life force!`);
                    const drainDamage = Game.player.hitPlayer(12);
                    if (drainDamage > 0) {
                        this.hp = Math.min(this.maxHp, this.hp + drainDamage);
                        monsterManager.game.addMessage(`You lose ${drainDamage} HP and the ${this.getDisplayName()} heals!`);
                    }
                    break;

                case 2: // Ice storm
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} summons an ice storm!`);
                    const iceDamage = Game.player.hitPlayer(14, 'ice');
                    if (iceDamage > 0) {
                        monsterManager.game.addMessage(`You are frozen for ${iceDamage} damage!`);
                        Game.player.speed = Math.min(250, Game.player.speed + 75);
                        monsterManager.game.timeManager.scheduleEvent(100, () => {
                            Game.player.speed = Math.max(100, Game.player.speed - 75);
                        });
                    }
                    break;
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.spellCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.spellCooldown = Math.max(0, this.spellCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Vampire - Blood-draining undead (use 'V')
class Vampire extends Monster {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Aristocratic death incarnate; beauty, cruelty, and hunger wrapped in a velvet cloak.';
        // Thematic resistances (undead/vampiric)
        this.resistances.poison = 0.0; // Immune to poison
        this.resistances.ice = 0.5; // Resistant to cold
        this.resistances.physical = 0.8; // Resistant (supernatural resilience)
        this.resistances.holy = 2.0; // Double damage from holy
        this.resistances.dark = 0.0; // Immune to dark
        this.resistances.fire = 1.3; // Somewhat weak to fire
    }

    getType() {
        return 'vampire';
    }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 9); // 30-38 HP
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 100;
        this.speed = 80; // Very fast
        this.experience = 60;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'V';
    }

    getColor() {
        return '#8B0000'; // Dark red
    }

    // Override attack to add life drain
    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            // Life drain attack
            monsterManager.game.running = false;

            const chanceToEvade = Game.player.chanceToEvade();
            if ((Math.random() * 100) < chanceToEvade) {
                monsterManager.game.addMessage(`You evade the ${this.getDisplayName()}'s bite!`);
                this.scheduleNextAction(monsterManager.game.currentTick, this.attackSpeed);
                return;
            }

            const dmg = Math.max(1, this.getDamage());
            const actualDamage = Game.player.hitPlayer(dmg);

            if (actualDamage > 0) {
                // Heal vampire for half the damage dealt
                const healAmount = Math.ceil(actualDamage / 2);
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                monsterManager.game.addMessage(`The ${this.getDisplayName()} drains your blood for ${actualDamage} damage and heals ${healAmount} HP!`);
            } else {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} attacks but you block it!`);
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.scheduleNextAction(monsterManager.game.currentTick, this.attackSpeed);
            return;
        }

        // Default movement behavior
        super.performAction(monsterManager);
    }
}

// ============================================
// DRAGON HIERARCHY (all use 'D' symbol)
// ============================================

// Dragon Wyrmling - Baby dragon
class DragonWyrmling extends Monster {
    static levelRange = [4, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A hatchling drake, scales still soft, but breath already smoldering with promise.';
        this.breathCooldown = 0; // Cooldown for breath weapon
        // Thematic resistances
        this.resistances.fire = 0.5; // Resistant to fire
        this.resistances.ice = 1.3; // Somewhat weak to ice
    }

    getType() {
        return 'dragon wyrmling';
    }

    setStats() {
        this.hp = 18 + Math.floor(Math.random() * 7); // 18-24 HP
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 90;
        this.speed = 110;
        this.experience = 20;
    }

    getSymbol() {
        return 'D';
    }

    getColor() {
        return '#FF6347'; // Tomato red
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Use fire breath if in range (2-3 tiles) and off cooldown
        if (dist >= 2 && dist <= 3 && this.breathCooldown <= 0 && Math.random() < 0.4) {
            this.useFireBreath(monsterManager, 6, 2); // 6 damage, 2 tile radius
            this.breathCooldown = 8; // 8 turn cooldown
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.breathCooldown = Math.max(0, this.breathCooldown - 1);

        // If adjacent, melee attack
        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        // Otherwise use default movement
        super.performAction(monsterManager);
    }

    useFireBreath(monsterManager, damage, radius) {
        const game = monsterManager.game;
        game.addMessage(`The ${this.getDisplayName()} breathes fire!`);

        // Calculate distance to player
        const distToPlayer = Math.sqrt(
            Math.pow(Game.player.x - this.x, 2) + Math.pow(Game.player.y - this.y, 2)
        );

        if (distToPlayer <= radius) {
            const actualDamage = Game.player.hitPlayer(damage, 'fire');
            if (actualDamage > 0) {
                game.addMessage(`You are burned for ${actualDamage} damage!`);
            }

            if (Game.player.isDead()) {
                game.gameOver = true;
                game.addMessage('You die. Game over.');
            }
        }
    }
}

// Young Dragon - Adolescent dragon
class YoungDragon extends Monster {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Wings spread wide, this drake has mastered flame and flight; only wisdom remains elusive.';
        this.breathCooldown = 0;
        // Thematic resistances
        this.resistances.fire = 0.3; // Highly resistant to fire
        this.resistances.ice = 1.3; // Somewhat weak to ice
    }

    getType() {
        return 'young dragon';
    }

    setStats() {
        this.hp = 40 + Math.floor(Math.random() * 11); // 40-50 HP
        this.maxHp = this.hp;
        this.dmg = 14;
        this.size = 140;
        this.speed = 130;
        this.armor = 3;
        this.experience = 70;
    }

    getSymbol() {
        return 'D';
    }

    getColor() {
        return '#FF4500'; // Orange-red
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Use fire breath if in range and off cooldown
        if (dist >= 2 && dist <= 4 && this.breathCooldown <= 0 && Math.random() < 0.5) {
            this.useFireBreath(monsterManager, 12, 3); // 12 damage, 3 tile radius
            this.breathCooldown = 6;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.breathCooldown = Math.max(0, this.breathCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }

    useFireBreath(monsterManager, damage, radius) {
        const game = monsterManager.game;
        game.addMessage(`The ${this.getDisplayName()} breathes a gout of flame!`);

        const distToPlayer = Math.sqrt(
            Math.pow(Game.player.x - this.x, 2) + Math.pow(Game.player.y - this.y, 2)
        );

        if (distToPlayer <= radius) {
            const actualDamage = Game.player.hitPlayer(damage, 'fire');
            if (actualDamage > 0) {
                game.addMessage(`You are seared for ${actualDamage} damage!`);
            }

            if (Game.player.isDead()) {
                game.gameOver = true;
                game.addMessage('You die. Game over.');
            }
        }
    }
}

// Ancient Dragon - Boss-tier dragon
class AncientDragon extends Monster {
    static levelRange = [12, 20];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Centuries of hoarded gold gleam beneath scales harder than steel; this is death made flesh.';
        this.breathCooldown = 0;
        // Thematic resistances
        this.resistances.fire = 0.1; // Nearly immune to fire
        this.resistances.ice = 1.3; // Somewhat weak to ice
        this.resistances.physical = 0.8; // Armored scales
    }

    getType() {
        return 'ancient dragon';
    }

    setStats() {
        this.hp = 80 + Math.floor(Math.random() * 21); // 80-100 HP
        this.maxHp = this.hp;
        this.dmg = 22;
        this.size = 200;
        this.speed = 150;
        this.armor = 5;
        this.experience = 150;
    }

    getSymbol() {
        return 'D';
    }

    getColor() {
        return '#DC143C'; // Crimson
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Use devastating fire breath if in range
        if (dist >= 1.5 && dist <= 5 && this.breathCooldown <= 0 && Math.random() < 0.6) {
            this.useFireBreath(monsterManager, 20, 4); // 20 damage, 4 tile radius
            this.breathCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.breathCooldown = Math.max(0, this.breathCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }

    useFireBreath(monsterManager, damage, radius) {
        const game = monsterManager.game;
        game.addMessage(`The ${this.getDisplayName()} unleashes an inferno!`);

        const distToPlayer = Math.sqrt(
            Math.pow(Game.player.x - this.x, 2) + Math.pow(Game.player.y - this.y, 2)
        );

        if (distToPlayer <= radius) {
            const actualDamage = Game.player.hitPlayer(damage, 'fire');
            if (actualDamage > 0) {
                game.addMessage(`You are engulfed in flames for ${actualDamage} damage!`);
            }

            if (Game.player.isDead()) {
                game.gameOver = true;
                game.addMessage('You die. Game over.');
            }
        }
    }
}

// ============================================
// DEMON HIERARCHY (all use '&' symbol)
// ============================================

// Imp - Minor demon
class Imp extends Monster {
    static levelRange = [3, 7];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A cackling sprite of sulfur and spite, horned and winged, delighting in mischief and pain.';
        // Thematic resistances (demon)
        this.resistances.fire = 0.5; // Resistant to fire
        this.resistances.poison = 0.5; // Resistant to poison
        this.resistances.dark = 0.5; // Resistant to dark
        this.resistances.holy = 1.5; // Weak to holy
    }

    getType() {
        return 'imp';
    }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 5); // 8-12 HP
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 70;
        this.speed = 70; // Very fast
        this.experience = 15;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return '&';
    }

    getColor() {
        return '#FF1493'; // Deep pink
    }
}

// Demon - Mid-tier demon
class Demon extends Monster {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Corded muscle, burning eyes, and claws like obsidian razors—a lieutenant of the abyss.';
        // Thematic resistances (demon)
        this.resistances.fire = 0.3; // Highly resistant to fire
        this.resistances.poison = 0.4; // Highly resistant to poison
        this.resistances.dark = 0.3; // Highly resistant to dark
        this.resistances.holy = 1.5; // Weak to holy
    }

    getType() {
        return 'demon';
    }

    setStats() {
        this.hp = 28 + Math.floor(Math.random() * 9); // 28-36 HP
        this.maxHp = this.hp;
        this.dmg = 13;
        this.size = 120;
        this.speed = 110;
        this.armor = 2;
        this.experience = 50;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return '&';
    }

    getColor() {
        return '#8B0000'; // Dark red
    }
}

// Demon Lord - Boss demon with area fire
class DemonLord extends Monster {
    static levelRange = [11, 16];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Ancient, terrible, and crowned in flame; a prince of perdition walks the mortal realm.';
        this.fireCooldown = 0;
        // Thematic resistances (demon lord)
        this.resistances.fire = 0.0; // Immune to fire (crowned in flame)
        this.resistances.poison = 0.2; // Highly resistant to poison
        this.resistances.dark = 0.0; // Immune to dark (prince of perdition)
        this.resistances.physical = 0.7; // Resistant (armored)
        this.resistances.holy = 2.0; // Double damage from holy
    }

    getType() {
        return 'demon lord';
    }

    setStats() {
        this.hp = 55 + Math.floor(Math.random() * 16); // 55-70 HP
        this.maxHp = this.hp;
        this.dmg = 18;
        this.size = 150;
        this.speed = 120;
        this.armor = 4;
        this.experience = 120;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return '&';
    }

    getColor() {
        return '#FF0000'; // Bright red
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Hellfire blast at range
        if (dist >= 2 && dist <= 6 && this.fireCooldown <= 0 && Math.random() < 0.5) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} unleashes hellfire!`);

            const distToPlayer = Math.sqrt(
                Math.pow(Game.player.x - this.x, 2) + Math.pow(Game.player.y - this.y, 2)
            );

            if (distToPlayer <= 3) {
                const fireDamage = Game.player.hitPlayer(16, 'fire');
                if (fireDamage > 0) {
                    monsterManager.game.addMessage(`Infernal flames engulf you for ${fireDamage} damage!`);
                }

                if (Game.player.isDead()) {
                    monsterManager.game.gameOver = true;
                    monsterManager.game.addMessage('You die. Game over.');
                }
            }

            this.fireCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.fireCooldown = Math.max(0, this.fireCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// ============================================
// BEAST HIERARCHY (all use 'w' symbol for wolves)
// ============================================

// Wolf - Pack hunter
class Wolf extends Monster {
    static levelRange = [2, 6];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Lean and hungry, yellow eyes gleaming; the pack hunts as one.';
    }

    getType() {
        return 'wolf';
    }

    setStats() {
        this.hp = 10 + Math.floor(Math.random() * 5); // 10-14 HP
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 90;
        this.speed = 90;
        this.experience = 10;
    }

    getSymbol() {
        return 'w';
    }

    getColor() {
        return '#808080'; // Gray
    }
}

// Dire Wolf - Giant wolf
class DireWolf extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Twice the size of common wolves, jaws strong enough to snap bone like kindling.';
    }

    getType() {
        return 'dire wolf';
    }

    setStats() {
        this.hp = 22 + Math.floor(Math.random() * 7); // 22-28 HP
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 120;
        this.speed = 95;
        this.experience = 28;
    }

    getSymbol() {
        return 'w';
    }

    getColor() {
        return '#2F4F4F'; // Dark slate
    }
}

// Werewolf - Shapeshifter with regeneration
class Werewolf extends Monster {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Man and beast twisted into one cursed form; silver alone can end its rampage.';
        this.regenTick = 0;
    }

    getType() {
        return 'werewolf';
    }

    setStats() {
        this.hp = 35 + Math.floor(Math.random() * 11); // 35-45 HP
        this.maxHp = this.hp;
        this.dmg = 14;
        this.size = 110;
        this.speed = 85; // Very fast
        this.experience = 65;
    }

    getSymbol() {
        return 'w';
    }

    getColor() {
        return '#8B4513'; // Saddle brown
    }

    performAction(monsterManager) {
        // Regenerate 2 HP every 3 turns
        this.regenTick++;
        if (this.regenTick >= 3 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + 2);
            if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} regenerates!`);
            }
            this.regenTick = 0;
        }

        // Normal behavior
        super.performAction(monsterManager);
    }
}

// ============================================
// ELEMENTAL HIERARCHY (all use 'E' symbol)
// ============================================

// Fire Elemental - Burns on contact
class FireElemental extends Monster {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Living flame given rage and form, scorching all it touches.';
        // Thematic resistances
        this.resistances.fire = 0.0; // Immune to fire
        this.resistances.ice = 1.5; // Weak to ice
        this.resistances.poison = 0.0; // Immune to poison (no body)
    }

    getType() {
        return 'fire elemental';
    }

    setStats() {
        this.hp = 20 + Math.floor(Math.random() * 7); // 20-26 HP
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 100;
        this.speed = 100;
        this.experience = 38;
    }

    getSymbol() {
        return 'E';
    }

    getColor() {
        return '#FF4500'; // Orange-red
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Burn player if adjacent (in addition to regular attack)
        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);

            // Additional burn damage
            const burnDamage = Game.player.hitPlayer(3, 'fire');
            if (burnDamage > 0) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()}'s flames burn you for ${burnDamage} additional damage!`);
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }
            return;
        }

        super.performAction(monsterManager);
    }
}

// Ice Elemental - Slows on contact
class IceElemental extends Monster {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Crystalline and cruel, winter\'s wrath shaped into merciless purpose.';
        // Thematic resistances
        this.resistances.ice = 0.0; // Immune to ice
        this.resistances.fire = 1.5; // Weak to fire
        this.resistances.poison = 0.0; // Immune to poison (no body)
    }

    getType() {
        return 'ice elemental';
    }

    setStats() {
        this.hp = 24 + Math.floor(Math.random() * 7); // 24-30 HP
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 100;
        this.speed = 140;
        this.experience = 38;
    }

    getSymbol() {
        return 'E';
    }

    getColor() {
        return '#00FFFF'; // Cyan
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);

            // Slow player
            if (Math.random() < 0.5) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()}'s icy touch slows you down!`);
                const oldSpeed = Game.player.speed;
                Game.player.speed = Math.min(200, Game.player.speed + 50);

                // Schedule return to normal speed
                monsterManager.game.timeManager.scheduleEvent(100, () => {
                    Game.player.speed = oldSpeed;
                    monsterManager.game.addMessage('You shake off the chill.');
                });
            }
            return;
        }

        super.performAction(monsterManager);
    }
}

// Lightning Elemental - Chain lightning
class LightningElemental extends Monster {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Pure electricity arcing with lethal intent, faster than thought, deadly as a thunderbolt.';
        this.shockCooldown = 0;
        // Thematic resistances
        this.resistances.lightning = 0.0; // Immune to lightning
        this.resistances.ice = 1.3; // Somewhat weak to ice (conductivity)
        this.resistances.poison = 0.0; // Immune to poison (no body)
    }

    getType() {
        return 'lightning elemental';
    }

    setStats() {
        this.hp = 18 + Math.floor(Math.random() * 7); // 18-24 HP
        this.maxHp = this.hp;
        this.dmg = 14;
        this.size = 90;
        this.speed = 60; // Very fast
        this.experience = 42;
    }

    getSymbol() {
        return 'E';
    }

    getColor() {
        return '#FFFF00'; // Yellow
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Lightning bolt attack at range
        if (dist >= 2 && dist <= 5 && this.shockCooldown <= 0 && Math.random() < 0.4) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} hurls a lightning bolt!`);

            const shockDamage = Game.player.hitPlayer(10, 'lightning');
            if (shockDamage > 0) {
                monsterManager.game.addMessage(`You are shocked for ${shockDamage} damage!`);
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.shockCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.shockCooldown = Math.max(0, this.shockCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// ============================================
// CONSTRUCT HIERARCHY (all use 'G' symbol)
// ============================================

// Clay Golem
class ClayGolem extends Monster {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Mud and magic molded into a lumbering guardian, loyal unto dissolution.';
        // Thematic resistances
        this.resistances.poison = 0.0; // Immune to poison (construct)
        this.resistances.lightning = 0.3; // Highly resistant (insulator)
        this.resistances.fire = 0.7; // Resistant (baked clay)
    }

    getType() {
        return 'clay golem';
    }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 11); // 25-35 HP
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 120;
        this.speed = 170;
        this.armor = 2;
        this.experience = 25;
    }

    getSymbol() {
        return 'G';
    }

    getColor() {
        return '#D2691E'; // Chocolate
    }
}

// Stone Golem
class StoneGolem extends Monster {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Carved from living rock and bound by ancient runes, unstoppable but ponderous.';
        // Thematic resistances
        this.resistances.poison = 0.0; // Immune to poison (construct)
        this.resistances.physical = 0.7; // Resistant (stone)
        this.resistances.fire = 0.5; // Resistant (stone)
        this.resistances.ice = 0.7; // Resistant (stone)
    }

    getType() {
        return 'stone golem';
    }

    setStats() {
        this.hp = 40 + Math.floor(Math.random() * 11); // 40-50 HP
        this.maxHp = this.hp;
        this.dmg = 11;
        this.size = 140;
        this.speed = 200; // Very slow
        this.armor = 4;
        this.experience = 45;
    }

    getSymbol() {
        return 'G';
    }

    getColor() {
        return '#808080'; // Gray
    }
}

// Iron Golem
class IronGolem extends Monster {
    static levelRange = [9, 14];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Forged in arcane furnaces, this metal titan knows neither fear nor mercy.';
        // Thematic resistances
        this.resistances.poison = 0.0; // Immune to poison (construct)
        this.resistances.physical = 0.5; // Highly resistant (iron)
        this.resistances.fire = 0.4; // Highly resistant (forged)
        this.resistances.ice = 0.6; // Resistant (metal)
        this.resistances.lightning = 1.5; // Weak (conductor)
    }

    getType() {
        return 'iron golem';
    }

    setStats() {
        this.hp = 60 + Math.floor(Math.random() * 16); // 60-75 HP
        this.maxHp = this.hp;
        this.dmg = 15;
        this.size = 160;
        this.speed = 180;
        this.armor = 6;
        this.experience = 75;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'G';
    }

    getColor() {
        return '#C0C0C0'; // Silver
    }
}

// ============================================
// UNIQUE MONSTERS (each has unique symbol)
// ============================================

// Basilisk - Petrifying serpent
class Basilisk extends Monster {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Eyes like death itself; to meet its gaze is to become stone eternal.';
        // Thematic resistances
        this.resistances.poison = 0.0; // Immune to poison (venomous)
        this.resistances.physical = 0.7; // Resistant (tough scales)
        // Venomous bite
        this.poisonChance = 0.5;
        this.poisonDmgPerTick = 3;
        this.poisonDuration = 6;
    }

    getType() {
        return 'basilisk';
    }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 8); // 25-32 HP
        this.maxHp = this.hp;
        this.dmg = 11;
        this.size = 110;
        this.speed = 120;
        this.experience = 55;
    }

    getSymbol() {
        return 'B';
    }

    getColor() {
        return '#9ACD32'; // Yellow-green
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Petrifying gaze attack at range 2-4
        if (dist >= 2 && dist <= 4 && Math.random() < 0.3) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()}'s gaze finds you!`);

            // 40% chance to be paralyzed (miss next 2 turns)
            if (Math.random() < 0.4) {
                monsterManager.game.addMessage('You feel your body turning to stone! You are paralyzed!');
                // Slow player by making their next actions much slower
                Game.player.speed = Math.min(500, Game.player.speed + 200);

                // Schedule return to normal speed
                monsterManager.game.timeManager.scheduleEvent(200, () => {
                    Game.player.speed = Math.max(100, Game.player.speed - 200);
                    monsterManager.game.addMessage('You break free from the paralysis!');
                });
            } else {
                monsterManager.game.addMessage('You avert your eyes just in time!');
            }

            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Beholder - Many-eyed aberration with random eye rays
class Beholder extends Monster {
    static levelRange = [10, 15];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A floating nightmare of eyes and teeth; each gaze brings a different doom.';
        this.eyeRayCooldown = 0;
        // Thematic resistances (magical aberration)
        this.resistances.poison = 0.5; // Resistant to poison
        this.resistances.fire = 0.6; // Resistant to fire (magical)
        this.resistances.ice = 0.6; // Resistant to ice (magical)
        this.resistances.lightning = 0.6; // Resistant to lightning (magical)
    }

    getType() {
        return 'beholder';
    }

    setStats() {
        this.hp = 32 + Math.floor(Math.random() * 11); // 32-42 HP
        this.maxHp = this.hp;
        this.dmg = 13;
        this.size = 120;
        this.speed = 110;
        this.armor = 3;
        this.experience = 85;
    }

    getSymbol() {
        return 'e';
    }

    getColor() {
        return '#FF00FF'; // Magenta
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Fire random eye ray at range
        if (dist >= 2 && dist <= 6 && this.eyeRayCooldown <= 0 && Math.random() < 0.5) {
            const rayType = Math.floor(Math.random() * 4);

            switch (rayType) {
                case 0: // Disintegration ray
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s disintegration ray strikes!`);
                    const disDamage = Game.player.hitPlayer(15);
                    if (disDamage > 0) {
                        monsterManager.game.addMessage(`You take ${disDamage} disintegration damage!`);
                    }
                    break;

                case 1: // Slow ray
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s slow ray hits you!`);
                    Game.player.speed = Math.min(300, Game.player.speed + 100);
                    monsterManager.game.timeManager.scheduleEvent(150, () => {
                        Game.player.speed = Math.max(100, Game.player.speed - 100);
                        monsterManager.game.addMessage('You recover from the slow effect.');
                    });
                    break;

                case 2: // Fear ray
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s fear ray terrifies you!`);
                    const fearDamage = Game.player.hitPlayer(8);
                    if (fearDamage > 0) {
                        monsterManager.game.addMessage(`Fear racks your body for ${fearDamage} damage!`);
                    }
                    break;

                case 3: // Telekinetic ray
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s telekinetic ray batters you!`);
                    const tkDamage = Game.player.hitPlayer(10);
                    if (tkDamage > 0) {
                        monsterManager.game.addMessage(`You take ${tkDamage} force damage!`);
                    }
                    break;
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.eyeRayCooldown = 4;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.eyeRayCooldown = Math.max(0, this.eyeRayCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Hydra - Multi-headed serpent
class Hydra extends Monster {
    static levelRange = [9, 14];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Seven heads writhe on serpentine necks; sever one and two more shall rise.';
    }

    getType() {
        return 'hydra';
    }

    setStats() {
        this.hp = 45 + Math.floor(Math.random() * 16); // 45-60 HP
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 150;
        this.speed = 130;
        this.armor = 2;
        this.experience = 70;
    }

    getSymbol() {
        return 'Y';
    }

    getColor() {
        return '#006400'; // Dark green
    }

    // Multiple attacks per turn (3 heads strike)
    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.game.running = false;

            // Hydra attacks 3 times per turn (multiple heads)
            let totalDamage = 0;
            let hitCount = 0;

            for (let i = 0; i < 3; i++) {
                const chanceToEvade = Game.player.chanceToEvade();
                if ((Math.random() * 100) < chanceToEvade) {
                    continue; // This head misses
                }

                const dmg = Math.max(1, this.getDamage());
                const actualDamage = Game.player.hitPlayer(dmg);
                totalDamage += actualDamage;
                if (actualDamage > 0) hitCount++;
            }

            if (hitCount > 0) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()}'s ${hitCount} head${hitCount > 1 ? 's' : ''} strike for ${totalDamage} total damage!`);
            } else {
                monsterManager.game.addMessage(`You dodge all of the ${this.getDisplayName()}'s heads!`);
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.scheduleNextAction(monsterManager.game.currentTick, this.attackSpeed);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Manticore - Hybrid beast with tail spikes
class Manticore extends Monster {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Lion\'s body, dragon\'s wings, scorpion\'s tail, and human face twisted in eternal hunger.';
        this.spikeCooldown = 0;
    }

    getType() {
        return 'manticore';
    }

    setStats() {
        this.hp = 28 + Math.floor(Math.random() * 9); // 28-36 HP
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 130;
        this.speed = 100;
        this.armor = 2;
        this.experience = 48;
        this.canOpenDoors = true;
    }

    getSymbol() {
        return 'M';
    }

    getColor() {
        return '#8B4513'; // Saddle brown
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Fire tail spikes at range
        if (dist >= 3 && dist <= 6 && this.spikeCooldown <= 0 && Math.random() < 0.4) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} launches tail spikes!`);

            // Fire 3 spikes
            let totalDamage = 0;
            for (let i = 0; i < 3; i++) {
                if (Math.random() < 0.7) { // 70% hit chance per spike
                    const spikeDamage = Game.player.hitPlayer(4);
                    totalDamage += spikeDamage;
                }
            }

            if (totalDamage > 0) {
                monsterManager.game.addMessage(`The spikes pierce you for ${totalDamage} total damage!`);
            } else {
                monsterManager.game.addMessage('The spikes miss!');
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.spikeCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.spikeCooldown = Math.max(0, this.spikeCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Bandit - Common human thief
class Bandit extends Monster {
    static levelRange = [1, 6];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A desperate outlaw in patched leather, eyes darting for an opening to strike.';
    }

    getType() {
        return 'bandit';
    }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 4); // 8-11 HP
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 100;
        this.speed = 90;
        this.experience = 8;
    }

    getSymbol() {
        return 'H';
    }

    getColor() {
        return '#D2B48C'; // Tan
    }
}

// Rogue - Stealthy human assassin
class Rogue extends Monster {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A shadow-cloaked killer who strikes from blind spots with poisoned steel.';
        this.resistances.dark = 0.5; // Comfortable in darkness
        // Poisoned blade
        this.poisonChance = 0.3;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 5;
    }

    getType() {
        return 'rogue';
    }

    setStats() {
        this.hp = 12 + Math.floor(Math.random() * 5); // 12-16 HP
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 95;
        this.speed = 80; // Fast
        this.experience = 22;
    }

    getSymbol() {
        return 'H';
    }

    getColor() {
        return '#2F4F4F'; // Dark slate gray
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            // 25% chance of backstab for double damage
            if (Math.random() < 0.25) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} backstabs you!`);
                const baseDmg = this.getDamage();
                Game.player.hitPlayer(baseDmg); // Extra hit on top of normal attack
            }
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Knight - Armored human warrior
class Knight extends Monster {
    static levelRange = [6, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A fallen knight in dented plate armor, sworn oath long forgotten, blade still sharp.';
    }

    getType() {
        return 'knight';
    }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 8); // 25-32 HP
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 110;
        this.speed = 120; // Slow due to heavy armor
        this.armor = 4;
        this.experience = 40;
    }

    getSymbol() {
        return 'H';
    }

    getColor() {
        return '#C0C0C0'; // Silver
    }
}

// Necromancer - Dark human spellcaster
class Necromancer extends Monster {
    static levelRange = [8, 14];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Robed in funereal black, whispering words that make the dead twitch and the living weep.';
        this.resistances.dark = 0.5;
        this.resistances.holy = 1.5;
        this.summonCooldown = 0;
    }

    getType() {
        return 'necromancer';
    }

    setStats() {
        this.hp = 20 + Math.floor(Math.random() * 6); // 20-25 HP
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 100;
        this.speed = 110;
        this.experience = 55;
    }

    getSymbol() {
        return 'H';
    }

    getColor() {
        return '#800080'; // Purple
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Try to summon a skeleton if player is visible and cooldown is ready
        if (dist <= 8 && dist > 2 && this.summonCooldown <= 0 && Math.random() < 0.3) {
            // Find an empty adjacent tile to summon on
            const offsets = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
            for (const [dx, dy] of offsets) {
                const sx = this.x + dx;
                const sy = this.y + dy;
                const tile = monsterManager.game.dungeon.getTile(sx, sy);
                if (tile && tile.type === 'floor' && !monsterManager.getMonsterAt(sx, sy)) {
                    const skeleton = new Skeleton(monsterManager.monsterIdCounter++, sx, sy);
                    skeleton.scheduleNextAction(monsterManager.game.currentTick);
                    monsterManager.monsters.push(skeleton);
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} raises a skeleton from the ground!`);
                    this.summonCooldown = 8;
                    this.scheduleNextAction(monsterManager.game.currentTick);
                    return;
                }
            }
        }

        this.summonCooldown = Math.max(0, this.summonCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Gelatinous Cube - Transparent ooze that dissolves adventurers
class GelatinousCube extends Monster {
    static levelRange = [3, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A ten-foot cube of transparent jelly. You can see half-digested bones and a rusty helmet floating inside.';
        this.resistances.physical = 0.5;
        this.resistances.poison = 0.0; // Immune
    }

    getType() {
        return 'gelatinous cube';
    }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 10); // 30-39 HP
        this.maxHp = this.hp;
        this.dmg = 5;
        this.size = 140;
        this.speed = 200; // Very slow
        this.armor = 1;
        this.experience = 25;
    }

    getSymbol() {
        return 'c';
    }

    getColor() {
        return '#7FFFD4'; // Aquamarine - semi-transparent look
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            // Engulf attack - acid damage
            monsterManager.game.addMessage(`The ${this.getDisplayName()} engulfs you in acidic jelly!`);
            const acidDmg = Game.player.hitPlayer(this.getDamage());
            if (acidDmg > 0) {
                monsterManager.game.addMessage(`The acid burns for ${acidDmg} damage!`);
            }
            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You are slowly dissolved. Game over.');
            }
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Rust Monster - Corrodes your equipment
class RustMonster extends Monster {
    static levelRange = [3, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'An insectoid creature with feathery antennae that twitch eagerly at the scent of metal. Every warrior\'s nightmare.';
    }

    getType() {
        return 'rust monster';
    }

    setStats() {
        this.hp = 10 + Math.floor(Math.random() * 4); // 10-13 HP
        this.maxHp = this.hp;
        this.dmg = 3; // Weak attack
        this.size = 90;
        this.speed = 100;
        this.experience = 20;
    }

    getSymbol() {
        return 'r';
    }

    getColor() {
        return '#B7410E'; // Rust color
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            // Try to corrode equipped weapon
            const weapon = Game.player.body.weapon;
            if (weapon && weapon.name !== 'Fists' && !weapon.isCursed && Math.random() < 0.3) {
                // Reduce weapon damage by 1
                if (weapon.damage > 1) {
                    weapon.damage -= 1;
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s antennae corrode your ${weapon.name}! (-1 damage)`);
                } else {
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} gnaws on your ${weapon.name} but it can't get any worse.`);
                }
            } else {
                monsterManager.monsterAttackPlayer(this);
            }
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Flumph - Comically weak floating jellyfish
class Flumph extends Monster {
    static levelRange = [1, 4];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A small floating jellyfish-like creature that bobs gently in the air. It seems more confused than threatening.';
    }

    getType() {
        return 'flumph';
    }

    setStats() {
        this.hp = 4 + Math.floor(Math.random() * 3); // 4-6 HP
        this.maxHp = this.hp;
        this.dmg = 1; // Pathetically weak
        this.size = 60;
        this.speed = 70; // Fast but useless
        this.experience = 2;
    }

    getSymbol() {
        return 'f';
    }

    getColor() {
        return '#FFB6C1'; // Light pink
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Flumphs try to run away 50% of the time when close
        if (dist < 4 && Math.random() < 0.5) {
            // Move away from player
            const dx = this.x - Game.player.x;
            const dy = this.y - Game.player.y;
            const moveX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
            const moveY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            const tile = monsterManager.game.dungeon.getTile(newX, newY);
            if (tile && tile.type === 'floor' && !monsterManager.getMonsterAt(newX, newY)) {
                this.x = newX;
                this.y = newY;
                this.scheduleNextAction(monsterManager.game.currentTick);
                return;
            }
        }

        if (dist < 1.5) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} flails at you ineffectually.`);
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Mimic - Disguises as a treasure chest
class Mimic extends Monster {
    static levelRange = [4, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'What you thought was a treasure chest has grown teeth, a tongue, and a very bad attitude.';
        this.disguised = true;
    }

    getType() {
        return this.disguised ? 'chest' : 'mimic';
    }

    setStats() {
        this.hp = 20 + Math.floor(Math.random() * 8); // 20-27 HP
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 100;
        this.speed = 110;
        this.armor = 2;
        this.experience = 35;
    }

    getSymbol() {
        return this.disguised ? '$' : 'm';
    }

    getColor() {
        return this.disguised ? '#FFD700' : '#8B4513'; // Gold when disguised, brown when revealed
    }

    takeDamage(amount) {
        if (this.disguised) {
            this.disguised = false;
        }
        return super.takeDamage(amount);
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        // Stay still when disguised, waiting for prey
        if (this.disguised) {
            if (dist < 1.5) {
                // Surprise attack!
                this.disguised = false;
                monsterManager.game.addMessage('The chest springs to life and bites you! It\'s a Mimic!');
                const surpriseDmg = Game.player.hitPlayer(this.getDamage() * 1.5);
                if (surpriseDmg > 0) {
                    monsterManager.game.addMessage(`The Mimic's surprise bite deals ${surpriseDmg} damage!`);
                }
                if (Game.player.isDead()) {
                    monsterManager.game.gameOver = true;
                    monsterManager.game.addMessage('Eaten by furniture. Game over.');
                }
                this.scheduleNextAction(monsterManager.game.currentTick);
                return;
            }
            // Stay still when disguised
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Owlbear - It's an owl. And a bear. At the same time.
class Owlbear extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Eight feet of feathered fury — the body of a bear with the head of an owl. It hoots menacingly.';
    }

    getType() {
        return 'owlbear';
    }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 10); // 30-39 HP
        this.maxHp = this.hp;
        this.dmg = 13;
        this.size = 130;
        this.speed = 100;
        this.armor = 2;
        this.experience = 45;
    }

    getSymbol() {
        return 'Q';
    }

    getColor() {
        return '#8B6914'; // Dark goldenrod
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            // Bear hug: if both claw and bite hit, bonus damage
            monsterManager.game.addMessage(`The ${this.getDisplayName()} hoots and mauls you!`);
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

// Gazebo - The legendary immovable menace
class Gazebo extends Monster {
    static levelRange = [1, 20];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'It is a gazebo. It sits there ominously. You are likely to be eaten by it.';
        this.resistances.physical = 0.5;
        this.resistances.fire = 0.5;
        this.resistances.ice = 0.0; // Immune
        this.resistances.lightning = 0.5;
        this.resistances.poison = 0.0; // Immune
    }

    getType() {
        return 'gazebo';
    }

    setStats() {
        this.hp = 1; // One HP but doesn't move or attack
        this.maxHp = this.hp;
        this.dmg = 0;
        this.size = 200;
        this.speed = 9999; // Never acts
        this.experience = 1;
    }

    getSymbol() {
        return 'n';
    }

    getColor() {
        return '#F5F5DC'; // Beige
    }

    performAction(monsterManager) {
        // The gazebo does nothing. It is a gazebo.
        this.scheduleNextAction(monsterManager.game.currentTick);
    }
}

// Monster factory for creating monsters
class MonsterFactory {
    static monsterTypes = [
        // Original monsters
        {class: Goblin, weight: 4},
        {class: Orc, weight: 2},
        {class: Skeleton, weight: 2},
        {class: Spider, weight: 3},
        {class: PhaseSpider, weight: 1.5},
        {class: BroodMother, weight: 1},
        {class: Troll, weight: 1},
        {class: Bat, weight: 3},
        {class: VampireBat, weight: 2},
        {class: DireBat, weight: 1.5},
        {class: Wizard, weight: 2},
        {class: Minotaur, weight: 1},
        {class: Ghost, weight: 2},

        // Orc hierarchy
        {class: UrukHai, weight: 2},
        {class: OrcBerserker, weight: 2},
        {class: OrcShaman, weight: 1},

        // Goblin hierarchy
        {class: Hobgoblin, weight: 3},
        {class: GoblinArcher, weight: 3},
        {class: GoblinKing, weight: 1}, // Rare

        // Undead hierarchy
        {class: Zombie, weight: 4},
        {class: Wight, weight: 2},
        {class: Lich, weight: 1}, // Rare boss
        {class: Vampire, weight: 1},

        // Dragon hierarchy
        {class: DragonWyrmling, weight: 2},
        {class: YoungDragon, weight: 1},
        {class: AncientDragon, weight: 0.5}, // Very rare boss

        // Demon hierarchy
        {class: Imp, weight: 3},
        {class: Demon, weight: 2},
        {class: DemonLord, weight: 0.5}, // Very rare boss

        // Beast hierarchy
        {class: Wolf, weight: 4},
        {class: DireWolf, weight: 2},
        {class: Werewolf, weight: 1},

        // Elemental hierarchy
        {class: FireElemental, weight: 2},
        {class: IceElemental, weight: 2},
        {class: LightningElemental, weight: 2},

        // Construct hierarchy
        {class: ClayGolem, weight: 2},
        {class: StoneGolem, weight: 1.5},
        {class: IronGolem, weight: 1},

        // Unique monsters
        {class: Basilisk, weight: 1},
        {class: Beholder, weight: 0.5}, // Very rare
        {class: Hydra, weight: 1},
        {class: Manticore, weight: 1.5},

        // Human hierarchy
        {class: Bandit, weight: 3},
        {class: Rogue, weight: 2},
        {class: Knight, weight: 1.5},
        {class: Necromancer, weight: 1},

        // Silly D&D classics
        {class: GelatinousCube, weight: 1.5},
        {class: RustMonster, weight: 2},
        {class: Flumph, weight: 3},
        {class: Mimic, weight: 1.5},
        {class: Owlbear, weight: 2},
        {class: Gazebo, weight: 0.3}, // Rare and pointless
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

    // Spawn a specific monster type at a given position
    spawnSpecificMonster(MonsterClass, x, y) {
        const monster = new MonsterClass(this.monsterIdCounter++, x, y);
        this.monsters.push(monster);
        return monster;
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
            // Check if there are items on this tile
            const tile = this.game.dungeon.getTile(x, y);
            if (tile && tile.hasItems()) continue;
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
    isWalkableForMonster(x, y, monster) {
        if (x < 0 || y < 0 || x >= this.game.width || y >= this.game.height) return false;
        const tile = this.game.dungeon.getTile(x, y);
        if (!tile || tile.type === '#') return false; // wall
        if (tile.type === '+') {
            // Closed door: only passable if monster can open doors and door is unlocked
            if (!(monster && monster.canOpenDoors && !tile.locked)) return false;
        }
        return !this.monsters.some((m) => m.x === x && m.y === y);
    }

    // Greedy step toward target (simple heuristic)
    pathStepToward(sx, sy, tx, ty, monster) {
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
            if (this.isWalkableForMonster(nx, ny, monster) || (nx === Game.player.x && ny === Game.player.y)) {
                return [nx, ny];
            }
        }
        return null;
    }

    // A* pathfinding for smarter monster movement
    aStarNextStep(sx, sy, tx, ty, monster, maxNodes = 800) {
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
                if (!tile || tile.type === '#') continue;
                if (tile.type === '+' && !(monster && monster.canOpenDoors && !tile.locked)) continue;
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
    async processTimeIncrement() {
        const actingMonsters = this.monsters.filter(
            (monster) => monster.isAlive() && monster.canAct(this.game.currentTick)
        );

        let anyMovement = false;
        for (const monster of actingMonsters) {
            const oldX = monster.x;
            const oldY = monster.y;
            monster.performAction(this);

            // Track if any monster moved or acted
            const moved = (monster.x !== oldX || monster.y !== oldY);
            if (moved) {
                anyMovement = true;
                // Check for traps after monster moves
                monster.checkForTraps(this.game);

                // Remove dead monsters (killed by traps)
                this.monsters = this.monsters.filter((m) => m.isAlive());

                // Only add delay if the monster is visible to the player
                const isVisible = monster.isAlive() && this.game.visible[monster.y] && this.game.visible[monster.y][monster.x];
                if (isVisible) {
                    // Render immediately after each visible monster moves so we can see it
                    this.game.render();
                    // Add a delay after each visible monster action to make movement visible
                    await this.game.sleep(50);
                }
            }
        }

        // Process poison ticks (every 500 ticks, same rate as player)
        if (this.game.currentTick % 500 === 0) {
            for (const monster of this.monsters) {
                if (monster.isAlive() && monster.poisoned) {
                    const poisonDmg = monster.processPoisonTick(this.game);
                    if (poisonDmg > 0) {
                        const isVisible = this.game.visible[monster.y] && this.game.visible[monster.y][monster.x];
                        if (isVisible) {
                            this.game.addMessage(`The ${monster.getDisplayName()} takes ${poisonDmg} poison damage!`);
                            anyMovement = true;
                        }
                        if (!monster.isAlive()) {
                            if (isVisible) {
                                this.game.addMessage(`The ${monster.getDisplayName()} dies from poison!`);
                            }
                            Game.player.experience += monster.experience;
                        }
                    }
                }
            }
            this.monsters = this.monsters.filter((m) => m.isAlive());
        }

        // Return whether any monster actually moved (for conditional rendering)
        return anyMovement;
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

        if(actualDamage === 0) {
            this.game.addMessage(`The ${monster.getDisplayName()} attacks but you block it!`);
        } else {
            this.game.addMessage(`The ${monster.getDisplayName()} hits you for ${actualDamage} damage.`);
        }

        // Monster poison attack
        if (actualDamage > 0 && monster.poisonChance && Math.random() < monster.poisonChance) {
            const poisonDmg = monster.poisonDmgPerTick || 2;
            const poisonTicks = monster.poisonDuration || 5;
            Game.player.applyPoison(poisonDmg, poisonTicks);
            this.game.addMessage(`The ${monster.getDisplayName()}'s attack poisons you!`);
        }

        if (Game.player.isDead()) {
            this.game.gameOver = true;
            this.game.addMessage('You die. Game over.');
        }
        monster.scheduleNextAction(this.game.currentTick, monster.attackSpeed);
    }
    async attackMonster(monster) {
        // Player attacks a monster
        const attack = Game.player.getAttack();
        const physicalDamage = Math.floor((Math.random() * attack.baseDamage) + attack.bonus + attack.strengthBonus) + 1;

        // Apply physical damage with resistance
        const physicalResult = monster.takeDamage(physicalDamage, 'physical');
        let totalActualDamage = physicalResult.actualDamage;
        const damageBreakdown = [{
            type: 'physical',
            intended: physicalDamage,
            actual: physicalResult.actualDamage,
            resistance: physicalResult.resistance
        }];

        // Calculate and apply elemental damage
        const weapon = attack.weapon;
        const elementalDamages = weapon.getAllElementalDamage();

        for (const [type, amount] of Object.entries(elementalDamages)) {
            if (amount > 0) {
                // Apply to current HP (don't kill with elemental if already dead)
                if (monster.hp > 0) {
                    const elementalResult = monster.takeDamage(amount, type);
                    totalActualDamage += elementalResult.actualDamage;
                    damageBreakdown.push({
                        type: type,
                        intended: amount,
                        actual: elementalResult.actualDamage,
                        resistance: elementalResult.resistance
                    });
                }
            }
        }

        // Apply poison DoT if weapon has poison damage and monster survived
        if (monster.hp > 0) {
            const poisonAmount = weapon.getElementalDamage('poison');
            if (poisonAmount > 0 && monster.resistances.poison !== 0.0) {
                monster.applyPoison(Math.ceil(poisonAmount / 2), 5);
                this.game.addMessage(`${monster.getDisplayName()} is poisoned!`);
            }
        }

        const died = monster.hp <= 0;

        // Build damage message with resistance indicators
        let damageMsg = `You hit ${monster.getDisplayName()} for `;
        const damageParts = [];

        for (const part of damageBreakdown) {
            let partMsg = `${part.actual}`;
            if (part.resistance < 0.75) {
                partMsg += ' resisted';
            } else if (part.resistance > 1.25) {
                partMsg += ' CRITICAL';
            }
            if (part.type !== 'physical') {
                partMsg += ` ${part.type}`;
            }
            damageParts.push(partMsg);
        }

        damageMsg += damageParts.join(' + ') + ` damage (${totalActualDamage} total).`;
        this.game.addMessage(damageMsg);

        // Apply lifesteal
        const lifestealBonus = Game.player.getLifestealBonus();
        if (lifestealBonus > 0) {
            const lifestealAmount = Math.floor(totalActualDamage * lifestealBonus);
            if (lifestealAmount > 0) {
                const healed = Game.player.heal(lifestealAmount);
                if (healed > 0) {
                    this.game.addMessage(`You drain ${healed} health from ${monster.getDisplayName()}.`);
                }
            }
        }

        if (died) {
            this.game.addMessage(`${monster.getDisplayName()} dies.`);
            Game.player.gainExperience(monster.experience);

            // Check for loot drops
            this.rollMonsterLoot(monster);

            this.monsters = this.monsters.filter((m) => m !== monster);
            this.game.render();
        }

        await this.game.consumeTurn(Game.player.equippedWeapon().speed || 50);
    }

    // Roll for loot when a monster dies
    rollMonsterLoot(monster) {
        // Base drop chance: 20% for weak monsters, up to 80% for powerful ones
        const experienceThreshold = Math.max(1, monster.experience);
        const baseDropChance = Math.min(0.80, 0.20 + (experienceThreshold / 100) * 0.6);

        // Wealth ring bonus to drop chance
        const wealthBonus = Game.player.getGoldFindBonus() - 1.0; // Convert multiplier to bonus
        const finalDropChance = Math.min(0.95, baseDropChance + (wealthBonus * 0.2));

        if (Math.random() > finalDropChance) {
            return; // No drop
        }

        // Determine monster's effective level for loot quality
        const monsterLevel = this.estimateMonsterLevel(monster);
        const playerLuck = Game.player.luck;

        // Determine number of drops (rare chance for multiple items from tough monsters)
        let numDrops = 1;
        if (experienceThreshold > 50 && Math.random() < 0.15) {
            numDrops = 2; // 15% chance for 2 items from tough monsters
        }
        if (experienceThreshold > 100 && Math.random() < 0.05) {
            numDrops = 3; // 5% chance for 3 items from very tough monsters
        }

        const tile = this.game.dungeon.getTile(monster.x, monster.y);
        if (!tile) return;

        // Generate drops
        for (let i = 0; i < numDrops; i++) {
            const lootType = this.determineMonsterLootType(monster);
            let item;

            if (lootType === 'gold') {
                // Gold drop scales with monster difficulty
                const goldAmount = Math.floor((10 + experienceThreshold * 2) * (0.8 + Math.random() * 0.4));
                item = new Gold(monster.x, monster.y, goldAmount);
            } else if (lootType === 'boss') {
                // Boss-quality drop
                item = ItemFactory.createBossDrop(monster.x, monster.y, monsterLevel, playerLuck);
            } else {
                // Regular item with potential quality boost for tough monsters
                const options = {};
                if (lootType !== 'any') {
                    options.category = lootType;
                }
                if (experienceThreshold > 50) {
                    options.bossDropBonus = true; // Tough monsters drop better loot
                }

                item = ItemFactory.createLevelAppropriateItem(
                    monster.x,
                    monster.y,
                    monsterLevel,
                    playerLuck,
                    options
                );
            }

            if (item) {
                tile.addItem(item);
                if (i === 0) { // Only show message for first drop
                    const itemName = item instanceof Gold ? `${item.amount} gold` : (item.getDisplayName ? item.getDisplayName() : item.name);
                    this.game.addMessage(`${monster.getDisplayName()} dropped ${itemName}!`);
                }
            }
        }

        this.game.itemManager.updateItemMemory();
    }

    // Estimate a monster's level based on its stats
    estimateMonsterLevel(monster) {
        // Use experience as primary indicator, with bounds checking
        const levelFromExp = Math.max(1, Math.floor(monster.experience / 10));

        // Also check the monster's levelRange if available
        if (monster.constructor.levelRange) {
            const [minLevel, maxLevel] = monster.constructor.levelRange;
            const avgLevel = Math.floor((minLevel + maxLevel) / 2);
            // Average the two estimates
            return Math.floor((levelFromExp + avgLevel) / 2);
        }

        return levelFromExp;
    }

    // Determine what type of loot a monster should drop
    determineMonsterLootType(monster) {
        const experience = monster.experience;
        const monsterName = monster.getDisplayName().toLowerCase();

        // Boss monsters (very high experience) drop boss-quality loot
        if (experience > 100) {
            return 'boss';
        }

        // Monster-specific loot preferences
        if (monsterName.includes('dragon')) {
            // Dragons prefer dropping weapons, armor, or gold
            const roll = Math.random();
            if (roll < 0.3) return ItemCategory.WEAPON;
            if (roll < 0.5) return ItemCategory.ARMOR;
            return 'gold';
        }

        if (monsterName.includes('lich') || monsterName.includes('demon') || monsterName.includes('shaman')) {
            // Spellcasters prefer dropping scrolls, wands, or potions
            const roll = Math.random();
            if (roll < 0.4) return ItemCategory.SCROLL;
            if (roll < 0.7) return ItemCategory.WAND;
            return ItemCategory.POTION;
        }

        if (monsterName.includes('orc') || monsterName.includes('warrior') || monsterName.includes('berserker')) {
            // Warriors prefer dropping weapons or armor
            return Math.random() < 0.6 ? ItemCategory.WEAPON : ItemCategory.ARMOR;
        }

        if (monsterName.includes('goblin') || monsterName.includes('kobold')) {
            // Weaker monsters mostly drop gold or consumables
            const roll = Math.random();
            if (roll < 0.6) return 'gold';
            return ItemCategory.POTION;
        }

        // Default: random weighted drop
        const roll = Math.random();
        if (roll < 0.3) return 'gold';
        if (roll < 0.5) return ItemCategory.WEAPON;
        if (roll < 0.65) return ItemCategory.ARMOR;
        if (roll < 0.80) return ItemCategory.POTION;
        if (roll < 0.90) return ItemCategory.SCROLL;
        return ItemCategory.WAND;
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Monster, Goblin, Orc, MonsterFactory, MonsterManager};
}
