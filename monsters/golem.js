// Golem family - symbol 'G', poison immune, low perception, constructs
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Golem extends Monster {
    constructor(id, x, y) {
        super(id, x, y);
        this.resistances.poison = 0.0;
        this.perception = 30;
    }

    getSymbol() { return 'G'; }
}

class ClayGolem extends Golem {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Mud and magic molded into a lumbering guardian, loyal unto dissolution.';
        this.resistances.lightning = 0.3;
        this.resistances.fire = 0.7;
    }

    getType() { return 'clay golem'; }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 11);
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 120;
        this.speed = 170;
        this.armor = 2;
        this.experience = 25;
    }

    getColor() { return '#D2691E'; }
}

class StoneGolem extends Golem {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Carved from living rock and bound by ancient runes, unstoppable but ponderous.';
        this.resistances.physical = 0.7;
        this.resistances.fire = 0.5;
        this.resistances.ice = 0.7;
    }

    getType() { return 'stone golem'; }

    setStats() {
        this.hp = 40 + Math.floor(Math.random() * 11);
        this.maxHp = this.hp;
        this.dmg = 11;
        this.size = 140;
        this.speed = 200;
        this.armor = 4;
        this.experience = 45;
    }

    getColor() { return '#808080'; }
}

class IronGolem extends Golem {
    static levelRange = [9, 14];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.description = 'Forged in arcane furnaces, this metal titan knows neither fear nor mercy.';
        this.resistances.physical = 0.5;
        this.resistances.fire = 0.4;
        this.resistances.ice = 0.6;
        this.resistances.lightning = 1.5;
    }

    getType() { return 'iron golem'; }

    setStats() {
        this.hp = 60 + Math.floor(Math.random() * 16);
        this.maxHp = this.hp;
        this.dmg = 15;
        this.size = 160;
        this.speed = 180;
        this.armor = 6;
        this.experience = 75;
    }

    getColor() { return '#C0C0C0'; }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Golem, ClayGolem, StoneGolem, IronGolem};
}
