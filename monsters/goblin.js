// Goblin family - symbol 'g', all can open doors
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Goblin extends Monster {
    static levelRange = [1, 5];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.perception = 60;
        this.description = 'A wiry, sharp-toothed humanoid reeking of damp leather and bad intentions.';
    }

    getType() { return 'goblin'; }

    setStats() {
        this.hp = 6 + Math.floor(Math.random() * 3);
        this.maxHp = this.hp;
        this.dmg = 5;
        this.speed = 75;
        this.size = 80;
        this.experience = 5;
    }

    getSymbol() { return 'g'; }
    getColor() { return '#00ff00'; }
}

class GoblinArcher extends Goblin {
    static levelRange = [2, 6];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A sneering goblin with a crude bow, quick to loose poison-tipped arrows.';
    }

    getType() { return 'goblin archer'; }

    setStats() {
        this.hp = 5 + Math.floor(Math.random() * 3);
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 75;
        this.speed = 80;
        this.experience = 8;
    }

    getColor() { return '#00CC00'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

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

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

class Hobgoblin extends Goblin {
    static levelRange = [3, 7];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A disciplined goblinoid soldier, taller and crueler than its lesser kin.';
    }

    getType() { return 'hobgoblin'; }

    setStats() {
        this.hp = 12 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 7;
        this.size = 95;
        this.speed = 100;
        this.experience = 12;
    }

    getColor() { return '#FFA500'; }
}

class GoblinKing extends Goblin {
    static levelRange = [6, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A bloated goblin chieftain draped in stolen gold and unearned arrogance.';
    }

    getType() { return 'goblin king'; }

    setStats() {
        this.hp = 28 + Math.floor(Math.random() * 8);
        this.maxHp = this.hp;
        this.dmg = 9;
        this.size = 105;
        this.speed = 90;
        this.experience = 40;
    }

    getColor() { return '#FFD700'; }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Goblin, GoblinArcher, Hobgoblin, GoblinKing};
}
