// Bat family - symbol 'b', keen perception, erratic movement
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Bat extends Monster {
    static levelRange = [3, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.perception = 75;
        this.description = 'A squeaking blur of leathery wings and needle teeth, darting erratically through the gloom.';
    }

    getType() { return 'bat'; }

    setStats() {
        this.hp = 2 + Math.floor(Math.random() * 2);
        this.maxHp = this.hp;
        this.dmg = 2;
        this.size = 50;
        this.speed = 40;
        this.experience = 4;
    }

    getSymbol() { return 'b'; }
    getColor() { return '#aa4400'; }

    // Shared erratic movement helper
    erraticMove(monsterManager) {
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
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        if (Math.random() < 0.7) {
            this.erraticMove(monsterManager);
        } else {
            super.performAction(monsterManager);
        }
    }
}

class VampireBat extends Bat {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Red-eyed and ravenous, this bat\'s fangs drip with an unholy thirst for warm blood.';
        this.resistances.dark = 0.5;
        this.resistances.holy = 1.5;
    }

    getType() { return 'vampire bat'; }

    setStats() {
        this.hp = 5 + Math.floor(Math.random() * 3);
        this.maxHp = this.hp;
        this.dmg = 4;
        this.size = 55;
        this.speed = 35;
        this.experience = 10;
    }

    getColor() { return '#8B0000'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
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

        if (Math.random() < 0.5) {
            this.erraticMove(monsterManager);
        } else {
            Monster.prototype.performAction.call(this, monsterManager);
        }
    }
}

class DireBat extends Bat {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A monstrous bat with a wingspan wider than a man is tall, its shriek rattles the bones.';
        this.screechCooldown = 0;
    }

    getType() { return 'dire bat'; }

    setStats() {
        this.hp = 14 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 7;
        this.size = 100;
        this.speed = 55;
        this.experience = 20;
    }

    getColor() { return '#2F2F2F'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

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

        if (Math.random() < 0.4) {
            this.erraticMove(monsterManager);
        } else {
            Monster.prototype.performAction.call(this, monsterManager);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Bat, VampireBat, DireBat};
}
