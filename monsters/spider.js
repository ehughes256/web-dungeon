// Spider family - symbol 'x', poison immune, fire weak, keen perception
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Spider extends Monster {
    static levelRange = [3, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.perception = 75;
        this.resistances.poison = 0.0;
        this.resistances.fire = 1.5;
        this.poisonChance = 0.4;
        this.poisonDmgPerTick = 1;
        this.poisonDuration = 4;
        this.description = 'A skittering cavern spider, chitin glistening while venom beads along its hooked fangs.';
    }

    getType() { return 'spider'; }

    setStats() {
        this.hp = 3 + Math.floor(Math.random() * 2);
        this.maxHp = this.hp;
        this.dmg = 3;
        this.size = 50;
        this.speed = 30;
        this.experience = 7;
    }

    getSymbol() { return 'x'; }
    getColor() { return '#8800ff'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
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

        super.performAction(monsterManager);
    }
}

class PhaseSpider extends Spider {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A spider that flickers between planes of existence, its translucent body phasing in and out of sight.';
        this.resistances.physical = 0.7;
        this.poisonChance = 0.5;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 5;
        this.phaseCooldown = 0;
    }

    getType() { return 'phase spider'; }

    setStats() {
        this.hp = 10 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 60;
        this.speed = 50;
        this.experience = 18;
    }

    getColor() { return '#00CCCC'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            if (this.phaseCooldown <= 0) {
                this.phaseShift(monsterManager);
                this.phaseCooldown = 3;
            }
            return;
        }

        this.phaseCooldown = Math.max(0, this.phaseCooldown - 1);

        if (dist <= 6 && dist > 2 && this.phaseCooldown <= 0 &&
            monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
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

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }
        // Skip Spider's hit-and-run, use base Monster AI
        Monster.prototype.performAction.call(this, monsterManager);
    }

    phaseShift(monsterManager) {
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

class BroodMother extends Spider {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A bloated spider queen, her abdomen swollen with writhing offspring ready to spill forth.';
        this.poisonChance = 0.3;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 6;
        this.spawnCooldown = 0;
    }

    getType() { return 'brood mother'; }

    setStats() {
        this.hp = 22 + Math.floor(Math.random() * 8);
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 120;
        this.speed = 150;
        this.experience = 35;
    }

    getColor() { return '#4B0082'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

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

        // Skip Spider's hit-and-run, use base Monster AI
        Monster.prototype.performAction.call(this, monsterManager);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Spider, PhaseSpider, BroodMother};
}
