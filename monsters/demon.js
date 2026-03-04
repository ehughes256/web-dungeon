// Demon family - symbol '&', can open doors, fire/poison/dark resistant, holy weak
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Demon extends Monster {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.resistances.fire = 0.3;
        this.resistances.poison = 0.4;
        this.resistances.dark = 0.3;
        this.resistances.holy = 1.5;
        this.description = 'Corded muscle, burning eyes, and claws like obsidian razors—a lieutenant of the abyss.';
    }

    getType() { return 'demon'; }

    setStats() {
        this.hp = 28 + Math.floor(Math.random() * 9);
        this.maxHp = this.hp;
        this.dmg = 13;
        this.size = 120;
        this.speed = 110;
        this.armor = 2;
        this.experience = 50;
    }

    getSymbol() { return '&'; }
    getColor() { return '#8B0000'; }
}

class Imp extends Demon {
    static levelRange = [3, 7];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A cackling sprite of sulfur and spite, horned and winged, delighting in mischief and pain.';
        // Weaker demon resistances
        this.resistances.fire = 0.5;
        this.resistances.poison = 0.5;
        this.resistances.dark = 0.5;
    }

    getType() { return 'imp'; }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 70;
        this.speed = 70;
        this.experience = 15;
        this.perception = 60;
    }

    getColor() { return '#FF1493'; }
}

class DemonLord extends Demon {
    static levelRange = [11, 16];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Ancient, terrible, and crowned in flame; a prince of perdition walks the mortal realm.';
        this.fireCooldown = 0;
        // Stronger demon resistances
        this.resistances.fire = 0.0;
        this.resistances.poison = 0.2;
        this.resistances.dark = 0.0;
        this.resistances.physical = 0.7;
        this.resistances.holy = 2.0;
    }

    getType() { return 'demon lord'; }

    setStats() {
        this.hp = 55 + Math.floor(Math.random() * 16);
        this.maxHp = this.hp;
        this.dmg = 18;
        this.size = 150;
        this.speed = 120;
        this.armor = 4;
        this.experience = 120;
    }

    getColor() { return '#FF0000'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Demon, Imp, DemonLord};
}
