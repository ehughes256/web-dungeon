// Human family - symbol 'H'
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }
if (typeof module !== 'undefined' && typeof Skeleton === 'undefined') { Skeleton = require('./undead.js').Skeleton; }

class Human extends Monster {
    constructor(id, x, y) {
        super(id, x, y);
    }

    getSymbol() { return 'H'; }
}

class Bandit extends Human {
    static levelRange = [1, 6];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A desperate outlaw in patched leather, eyes darting for an opening to strike.';
    }

    getType() { return 'bandit'; }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 4);
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 100;
        this.speed = 90;
        this.experience = 8;
    }

    getColor() { return '#D2B48C'; }
}

class Rogue extends Human {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A shadow-cloaked killer who strikes from blind spots with poisoned steel.';
        this.resistances.dark = 0.5;
        this.poisonChance = 0.3;
        this.poisonDmgPerTick = 2;
        this.poisonDuration = 5;
    }

    getType() { return 'rogue'; }

    setStats() {
        this.hp = 12 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 95;
        this.speed = 80;
        this.experience = 22;
        this.perception = 70;
    }

    getColor() { return '#2F4F4F'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            if (Math.random() < 0.25) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} backstabs you!`);
                const baseDmg = this.getDamage();
                Game.player.hitPlayer(baseDmg);
            }
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

class Knight extends Human {
    static levelRange = [6, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A fallen knight in dented plate armor, sworn oath long forgotten, blade still sharp.';
    }

    getType() { return 'knight'; }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 8);
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 110;
        this.speed = 120;
        this.armor = 4;
        this.experience = 40;
    }

    getColor() { return '#C0C0C0'; }
}

class Necromancer extends Human {
    static levelRange = [8, 14];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Robed in funereal black, whispering words that make the dead twitch and the living weep.';
        this.resistances.dark = 0.5;
        this.resistances.holy = 1.5;
        this.summonCooldown = 0;
    }

    getType() { return 'necromancer'; }

    setStats() {
        this.hp = 20 + Math.floor(Math.random() * 6);
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 100;
        this.speed = 110;
        this.experience = 55;
    }

    getColor() { return '#800080'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist <= 8 && dist > 2 && this.summonCooldown <= 0 && Math.random() < 0.3) {
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Human, Bandit, Rogue, Knight, Necromancer};
}
