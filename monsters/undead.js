// Undead family - poison immune, holy weak, dark resistant (various symbols)
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Undead extends Monster {
    constructor(id, x, y) {
        super(id, x, y);
        this.resistances.poison = 0.0;
        this.resistances.holy = 1.5;
        this.resistances.dark = 0.5;
    }
}

class Skeleton extends Undead {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.description = 'Rattling bones bound by necromantic malice; empty sockets glow with cold, unwavering purpose.';
        this.resistances.ice = 0.5;
    }

    getType() { return 'skeleton'; }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 4);
        this.maxHp = this.hp;
        this.dmg = 4;
        this.size = 90;
        this.speed = 120;
        this.experience = 10;
    }

    getSymbol() { return 's'; }
    getColor() { return '#cccccc'; }
}

class Zombie extends Undead {
    static levelRange = [1, 5];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Rotting flesh drips from shambling bones; hunger eternal drives each lurching step.';
        this.resistances.ice = 0.5;
        this.resistances.fire = 1.3;
        this.perception = 30;
    }

    getType() { return 'zombie'; }

    setStats() {
        this.hp = 16 + Math.floor(Math.random() * 5);
        this.maxHp = this.hp;
        this.dmg = 5;
        this.size = 100;
        this.speed = 250;
        this.experience = 8;
    }

    getSymbol() { return 'z'; }
    getColor() { return '#556B2F'; }
}

class Ghost extends Undead {
    static levelRange = [3, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A translucent remnant of a restless soul, its edges fraying into the chill air.';
        this.resistances.ice = 0.3;
        this.resistances.physical = 0.5;
    }

    getType() { return 'ghost'; }

    setStats() {
        this.hp = 6 + Math.floor(Math.random() * 4);
        this.maxHp = this.hp;
        this.dmg = 6;
        this.size = 105;
        this.speed = 80;
        this.experience = 12;
    }

    getSymbol() { return 'G'; }
    getColor() { return '#aaaaff'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x] && dist <= 8) {
            const dx = Game.player.x - this.x;
            const dy = Game.player.y - this.y;

            let moveX = 0;
            let moveY = 0;
            if (dx > 0) moveX = 1;
            else if (dx < 0) moveX = -1;
            if (dy > 0) moveY = 1;
            else if (dy < 0) moveY = -1;

            const newX = this.x + moveX;
            const newY = this.y + moveY;

            if (monsterManager.game.dungeon.inBounds(newX, newY)) {
                this.moveTo(newX, newY);
            }
        } else {
            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            const d = dirs[Math.floor(Math.random() * dirs.length)];
            const wx = this.x + d[0];
            const wy = this.y + d[1];
            if (monsterManager.game.dungeon.inBounds(wx, wy)) {
                this.moveTo(wx, wy);
            }
        }
    }
}

class Wight extends Undead {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.description = 'Once a warrior-king, now a hollow husk armored in ancient mail and deathless malice.';
        this.resistances.ice = 0.4;
        this.resistances.physical = 0.8;
        this.resistances.dark = 0.3;
    }

    getType() { return 'wight'; }

    setStats() {
        this.hp = 20 + Math.floor(Math.random() * 7);
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 105;
        this.speed = 130;
        this.experience = 45;
    }

    getSymbol() { return 'W'; }
    getColor() { return '#4169E1'; }
}

class Lich extends Undead {
    static levelRange = [10, 15];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.description = 'A desiccated sorcerer wrapped in eldritch power, immortality\'s terrible price paid in full.';
        this.spellCooldown = 0;
        this.resistances.ice = 0.3;
        this.resistances.fire = 0.7;
        this.resistances.lightning = 0.7;
        this.resistances.dark = 0.0;
        this.perception = 60;
    }

    getType() { return 'lich'; }

    setStats() {
        this.hp = 35 + Math.floor(Math.random() * 11);
        this.maxHp = this.hp;
        this.dmg = 15;
        this.size = 100;
        this.speed = 140;
        this.experience = 80;
    }

    getSymbol() { return 'L'; }
    getColor() { return '#9400D3'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 7 && this.spellCooldown <= 0 && Math.random() < 0.5) {
            const spellType = Math.floor(Math.random() * 3);

            switch (spellType) {
                case 0:
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} casts a death bolt!`);
                    const boltDamage = Game.player.hitPlayer(18);
                    if (boltDamage > 0) {
                        monsterManager.game.addMessage(`Necrotic energy sears you for ${boltDamage} damage!`);
                    }
                    break;

                case 1:
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} drains your life force!`);
                    const drainDamage = Game.player.hitPlayer(12);
                    if (drainDamage > 0) {
                        this.hp = Math.min(this.maxHp, this.hp + drainDamage);
                        monsterManager.game.addMessage(`You lose ${drainDamage} HP and the ${this.getDisplayName()} heals!`);
                    }
                    break;

                case 2:
                    monsterManager.game.addMessage(`The ${this.getDisplayName()} summons an ice storm!`);
                    const iceDamage = Game.player.hitPlayer(14, 'ice');
                    if (iceDamage > 0) {
                        monsterManager.game.addMessage(`You are frozen for ${iceDamage} damage!`);
                        Game.player.speed = Math.min(250, Game.player.speed + 75);
                        monsterManager.game.timeManager.scheduleEvent(100, () => {
                            Game.player.speed = Math.max(100, Game.player.speed - 75);
                        });
                    }
                    break;
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.spellCooldown = 5;
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

class Vampire extends Undead {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.canOpenDoors = true;
        this.description = 'Aristocratic death incarnate; beauty, cruelty, and hunger wrapped in a velvet cloak.';
        this.resistances.ice = 0.5;
        this.resistances.physical = 0.8;
        this.resistances.holy = 2.0;
        this.resistances.dark = 0.0;
        this.resistances.fire = 1.3;
        this.perception = 75;
    }

    getType() { return 'vampire'; }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 9);
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 100;
        this.speed = 80;
        this.experience = 60;
    }

    getSymbol() { return 'V'; }
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
                const healAmount = Math.ceil(actualDamage / 2);
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                monsterManager.game.addMessage(`The ${this.getDisplayName()} drains your blood for ${actualDamage} damage and heals ${healAmount} HP!`);
            } else {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} attacks but you block it!`);
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.scheduleNextAction(monsterManager.game.currentTick, this.attackSpeed);
            return;
        }

        super.performAction(monsterManager);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Undead, Skeleton, Zombie, Ghost, Wight, Lich, Vampire};
}
