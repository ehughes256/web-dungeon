// Wolf family - symbol 'w', keen perception
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Wolf extends Monster {
    static levelRange = [2, 6];

    constructor(id, x, y) {
        super(id, x, y);
        this.perception = 75;
        this.description = 'Lean and hungry, yellow eyes gleaming; the pack hunts as one.';
    }

    getType() { return 'wolf'; }

    setStats() {
        this.hp = 10 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 90;
        this.speed = 90;
        this.experience = 10;
    }

    getSymbol() { return 'w'; }
    getColor() { return '#808080'; }
}

class DireWolf extends Wolf {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Twice the size of common wolves, jaws strong enough to snap bone like kindling.';
    }

    getType() { return 'dire wolf'; }

    setStats() {
        this.hp = 22 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 120;
        this.speed = 95;
        this.experience = 28;
    }

    getColor() { return '#2F4F4F'; }
}

class Werewolf extends Wolf {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Man and beast twisted into one cursed form; silver alone can end its rampage.';
        this.regenTick = 0;
    }

    getType() { return 'werewolf'; }

    setStats() {
        this.hp = 35 + Math.floor(Math.random() * 11);
        this.maxHp = this.hp;
        this.dmg = 14;
        this.size = 110;
        this.speed = 85;
        this.experience = 65;
    }

    getColor() { return '#8B4513'; }

    performAction(monsterManager) {
        this.regenTick++;
        if (this.regenTick >= 3 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + 2);
            if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} regenerates!`);
            }
            this.regenTick = 0;
        }

        super.performAction(monsterManager);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Wolf, DireWolf, Werewolf};
}
