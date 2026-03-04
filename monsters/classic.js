// Classic D&D monsters - unique standalone creatures
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class GelatinousCube extends Monster {
    static levelRange = [3, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A ten-foot cube of transparent jelly. You can see half-digested bones and a rusty helmet floating inside.';
        this.resistances.physical = 0.5;
        this.resistances.poison = 0.0;
    }

    getType() { return 'gelatinous cube'; }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 10);
        this.maxHp = this.hp;
        this.dmg = 5;
        this.size = 140;
        this.speed = 200;
        this.armor = 1;
        this.experience = 25;
        this.perception = 20;
    }

    getSymbol() { return 'c'; }
    getColor() { return '#7FFFD4'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
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

class RustMonster extends Monster {
    static levelRange = [3, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'An insectoid creature with feathery antennae that twitch eagerly at the scent of metal. Every warrior\'s nightmare.';
    }

    getType() { return 'rust monster'; }

    setStats() {
        this.hp = 10 + Math.floor(Math.random() * 4);
        this.maxHp = this.hp;
        this.dmg = 3;
        this.size = 90;
        this.speed = 100;
        this.experience = 20;
    }

    getSymbol() { return 'r'; }
    getColor() { return '#B7410E'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            const weapon = Game.player.body.weapon;
            if (weapon && weapon.name !== 'Fists' && !weapon.isCursed && Math.random() < 0.3) {
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

class Flumph extends Monster {
    static levelRange = [1, 4];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A small floating jellyfish-like creature that bobs gently in the air. It seems more confused than threatening.';
    }

    getType() { return 'flumph'; }

    setStats() {
        this.hp = 4 + Math.floor(Math.random() * 3);
        this.maxHp = this.hp;
        this.dmg = 1;
        this.size = 60;
        this.speed = 70;
        this.experience = 2;
    }

    getSymbol() { return 'f'; }
    getColor() { return '#FFB6C1'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 4 && Math.random() < 0.5) {
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
        this.hp = 20 + Math.floor(Math.random() * 8);
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
        return this.disguised ? '#FFD700' : '#8B4513';
    }

    takeDamage(amount) {
        if (this.disguised) {
            this.disguised = false;
        }
        return super.takeDamage(amount);
    }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (this.disguised) {
            if (dist < 1.5) {
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

class Owlbear extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Eight feet of feathered fury — the body of a bear with the head of an owl. It hoots menacingly.';
    }

    getType() { return 'owlbear'; }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 10);
        this.maxHp = this.hp;
        this.dmg = 13;
        this.size = 130;
        this.speed = 100;
        this.armor = 2;
        this.experience = 45;
    }

    getSymbol() { return 'Q'; }
    getColor() { return '#8B6914'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} hoots and mauls you!`);
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

class Gazebo extends Monster {
    static levelRange = [1, 20];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'It is a gazebo. It sits there ominously. You are likely to be eaten by it.';
        this.resistances.physical = 0.5;
        this.resistances.fire = 0.5;
        this.resistances.ice = 0.0;
        this.resistances.lightning = 0.5;
        this.resistances.poison = 0.0;
    }

    getType() { return 'gazebo'; }

    setStats() {
        this.hp = 1;
        this.maxHp = this.hp;
        this.dmg = 0;
        this.size = 200;
        this.speed = 9999;
        this.experience = 1;
    }

    getSymbol() { return 'n'; }
    getColor() { return '#F5F5DC'; }

    performAction(monsterManager) {
        this.scheduleNextAction(monsterManager.game.currentTick);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {GelatinousCube, RustMonster, Flumph, Mimic, Owlbear, Gazebo};
}
