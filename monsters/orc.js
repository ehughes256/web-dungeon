// Orc family - symbol 'O', all can open doors
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Orc extends Monster {
    static levelRange = [1, 5];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.description = 'A brutish green-skinned warrior, muscles knotted under scarred hide and eyes burning with crude fury.';
    }

    getType() { return 'orc'; }

    setStats() {
        this.hp = 14 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 7;
        this.size = 110;
        this.speed = 200;
        this.experience = 15;
    }

    getSymbol() { return 'O'; }
    getColor() { return '#ff4444'; }
}

class UrukHai extends Orc {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A towering orc-breed forged for war, armored in blackened steel and fear.';
    }

    getType() { return 'uruk-hai'; }

    setStats() {
        this.hp = 22 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 120;
        this.speed = 140;
        this.experience = 25;
    }

    getColor() { return '#8B0000'; }
}

class OrcBerserker extends Orc {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Frothing with battle-lust, this orc warrior fights with reckless, devastating fury.';
    }

    getType() { return 'orc berserker'; }

    setStats() {
        this.hp = 18 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 115;
        this.speed = 120;
        this.experience = 30;
    }

    getColor() { return '#FF0000'; }
}

class OrcShaman extends Orc {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Bones and fetishes clatter as this orc witch-doctor channels dark, primal magic.';
        this.spellCooldown = 0;
        this.poisonChance = 0.25;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 6;
    }

    getType() { return 'orc shaman'; }

    setStats() {
        this.hp = 16 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 105;
        this.speed = 160;
        this.experience = 35;
    }

    getColor() { return '#9932CC'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 5 && this.spellCooldown <= 0 && Math.random() < 0.4) {
            const spellType = Math.floor(Math.random() * 2);

            if (spellType === 0) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} hurls a dark bolt!`);
                const boltDamage = Game.player.hitPlayer(9);
                if (boltDamage > 0) {
                    monsterManager.game.addMessage(`Dark magic strikes you for ${boltDamage} damage!`);
                }
            } else {
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Orc, UrukHai, OrcBerserker, OrcShaman};
}
