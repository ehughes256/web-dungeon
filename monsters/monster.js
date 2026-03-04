// Base Monster class for the roguelike dungeon game

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
        this.nextActionTime = 0;
        this.experience = 0;
        this.description = "A generic monster.";
        this.lastKnownPlayerLocation = null;
        this.lastSawPlayerMoves = 0;
        this.type = this.getType();
        this.resistances = {
            physical: 1.0,
            fire: 1.0,
            ice: 1.0,
            lightning: 1.0,
            poison: 1.0,
            holy: 1.0,
            dark: 1.0
        };

        this.poisoned = false;
        this.poisonDamage = 0;
        this.poisonTicksRemaining = 0;

        this.canOpenDoors = false;
        this.wanderTarget = null;
        this.perception = 50;

        this.setStats();
    }

    getDamage() {
        return Math.floor(Math.random() * this.dmg) + 1;
    }

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
        return 'red';
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x] && dist <= 10 && !Game.player.invisible && this.canNoticePlayer(dist)) {
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
            if (this.lastSawPlayerMoves < 15) {
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
                this.lastKnownPlayerLocation = null;
            }
            this.lastSawPlayerMoves += 1;
        } else {
            this.idleWander(monsterManager);
        }
        this.scheduleNextAction(monsterManager.game.currentTick);
    }

    canNoticePlayer(dist) {
        if (this.lastKnownPlayerLocation) return true;
        if (dist < 2) return true;

        const stealth = Game.player.getStealthScore();
        const distanceFactor = 1 - (dist - 2) / 16;
        const detectChance = (this.perception - stealth) * distanceFactor;
        const pct = Math.max(5, Math.min(95, 50 + detectChance));

        return Math.random() * 100 < pct;
    }

    isAlive() {
        return this.hp > 0;
    }

    takeDamage(amount, damageType = 'physical') {
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
        if (this.resistances.poison === 0.0) return;
        if (this.poisoned) {
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

    idleWander(monsterManager) {
        if (!this.wanderTarget || (this.x === this.wanderTarget[0] && this.y === this.wanderTarget[1])) {
            this.wanderTarget = null;
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
                this.wanderTarget = null;
            }
        } else {
            this.wanderTarget = null;
        }
    }

    pickWanderTarget(monsterManager) {
        const dungeon = monsterManager.game.dungeon;
        const rooms = dungeon.rooms;
        if (!rooms || rooms.length === 0) return null;

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

    checkForTraps(game) {
        const tile = game.dungeon.getTile(this.x, this.y);
        if (!tile || !tile.trap) return;

        const trap = tile.trap;
        if (trap.triggered) return;
        if (!trap.canTrigger(this)) return;

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

    onDeath(monsterManager) {
        // Override in subclasses for death effects
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Monster};
}
