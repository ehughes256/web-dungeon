// Dragon family - symbol 'D', fire breath, fire resistant, ice weak
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Dragon extends Monster {
    constructor(id, x, y) {
        super(id, x, y);
        this.breathCooldown = 0;
        this.resistances.fire = 0.5;
        this.resistances.ice = 1.3;
    }

    getSymbol() { return 'D'; }

    useFireBreath(monsterManager, damage, radius, message) {
        const game = monsterManager.game;
        game.addMessage(message || `The ${this.getDisplayName()} breathes fire!`);

        const distToPlayer = Math.sqrt(
            Math.pow(Game.player.x - this.x, 2) + Math.pow(Game.player.y - this.y, 2)
        );

        if (distToPlayer <= radius) {
            const actualDamage = Game.player.hitPlayer(damage, 'fire');
            if (actualDamage > 0) {
                game.addMessage(`You are burned for ${actualDamage} damage!`);
            }

            if (Game.player.isDead()) {
                game.gameOver = true;
                game.addMessage('You die. Game over.');
            }
        }
    }
}

class DragonWyrmling extends Dragon {
    static levelRange = [4, 8];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A hatchling drake, scales still soft, but breath already smoldering with promise.';
    }

    getType() { return 'dragon wyrmling'; }

    setStats() {
        this.hp = 18 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 90;
        this.speed = 110;
        this.experience = 20;
    }

    getColor() { return '#FF6347'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 3 && this.breathCooldown <= 0 && Math.random() < 0.4) {
            this.useFireBreath(monsterManager, 6, 2);
            this.breathCooldown = 8;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.breathCooldown = Math.max(0, this.breathCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

class YoungDragon extends Dragon {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Wings spread wide, this drake has mastered flame and flight; only wisdom remains elusive.';
        this.resistances.fire = 0.3;
    }

    getType() { return 'young dragon'; }

    setStats() {
        this.hp = 40 + Math.floor(Math.random() * 11);
        this.maxHp = this.hp;
        this.dmg = 14;
        this.size = 140;
        this.speed = 130;
        this.armor = 3;
        this.experience = 70;
    }

    getColor() { return '#FF4500'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 4 && this.breathCooldown <= 0 && Math.random() < 0.5) {
            this.useFireBreath(monsterManager, 12, 3, `The ${this.getDisplayName()} breathes a gout of flame!`);
            this.breathCooldown = 6;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.breathCooldown = Math.max(0, this.breathCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

class AncientDragon extends Dragon {
    static levelRange = [12, 20];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Centuries of hoarded gold gleam beneath scales harder than steel; this is death made flesh.';
        this.resistances.fire = 0.1;
        this.resistances.physical = 0.8;
    }

    getType() { return 'ancient dragon'; }

    setStats() {
        this.hp = 80 + Math.floor(Math.random() * 21);
        this.maxHp = this.hp;
        this.dmg = 22;
        this.size = 200;
        this.speed = 150;
        this.armor = 5;
        this.experience = 150;
    }

    getColor() { return '#DC143C'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 1.5 && dist <= 5 && this.breathCooldown <= 0 && Math.random() < 0.6) {
            this.useFireBreath(monsterManager, 20, 4, `The ${this.getDisplayName()} unleashes an inferno!`);
            this.breathCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.breathCooldown = Math.max(0, this.breathCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Dragon, DragonWyrmling, YoungDragon, AncientDragon};
}
