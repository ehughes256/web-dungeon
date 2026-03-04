// Elemental family - symbol 'E', poison immune, low perception
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Elemental extends Monster {
    constructor(id, x, y) {
        super(id, x, y);
        this.resistances.poison = 0.0;
        this.perception = 30;
    }

    getSymbol() { return 'E'; }
}

class FireElemental extends Elemental {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Living flame given rage and form, scorching all it touches.';
        this.resistances.fire = 0.0;
        this.resistances.ice = 1.5;
    }

    getType() { return 'fire elemental'; }

    setStats() {
        this.hp = 20 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 100;
        this.speed = 100;
        this.experience = 38;
    }

    getColor() { return '#FF4500'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);

            const burnDamage = Game.player.hitPlayer(3, 'fire');
            if (burnDamage > 0) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()}'s flames burn you for ${burnDamage} additional damage!`);
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }
            return;
        }

        super.performAction(monsterManager);
    }
}

class IceElemental extends Elemental {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Crystalline and cruel, winter\'s wrath shaped into merciless purpose.';
        this.resistances.ice = 0.0;
        this.resistances.fire = 1.5;
    }

    getType() { return 'ice elemental'; }

    setStats() {
        this.hp = 24 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 100;
        this.speed = 140;
        this.experience = 38;
    }

    getColor() { return '#00FFFF'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);

            if (Math.random() < 0.5) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()}'s icy touch slows you down!`);
                const oldSpeed = Game.player.speed;
                Game.player.speed = Math.min(200, Game.player.speed + 50);

                monsterManager.game.timeManager.scheduleEvent(100, () => {
                    Game.player.speed = oldSpeed;
                    monsterManager.game.addMessage('You shake off the chill.');
                });
            }
            return;
        }

        super.performAction(monsterManager);
    }
}

class LightningElemental extends Elemental {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Pure electricity arcing with lethal intent, faster than thought, deadly as a thunderbolt.';
        this.shockCooldown = 0;
        this.resistances.lightning = 0.0;
        this.resistances.ice = 1.3;
    }

    getType() { return 'lightning elemental'; }

    setStats() {
        this.hp = 18 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 14;
        this.size = 90;
        this.speed = 60;
        this.experience = 42;
    }

    getColor() { return '#FFFF00'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 5 && this.shockCooldown <= 0 && Math.random() < 0.4) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} hurls a lightning bolt!`);

            const shockDamage = Game.player.hitPlayer(10, 'lightning');
            if (shockDamage > 0) {
                monsterManager.game.addMessage(`You are shocked for ${shockDamage} damage!`);
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.shockCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.shockCooldown = Math.max(0, this.shockCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Elemental, FireElemental, IceElemental, LightningElemental};
}
