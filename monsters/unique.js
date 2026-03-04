// Unique monsters - standalone creatures with no family hierarchy
if (typeof module !== 'undefined' && typeof Monster === 'undefined') { Monster = require('./monster.js').Monster; }

class Troll extends Monster {
    static levelRange = [5, 10];

    constructor(id, x, y) {
        super(id, x, y);
        this.lastRegenTick = 0;
        this.description = 'A hulking regenerating brute—mottled flesh knitting as quickly as blades can part it.';
    }

    getType() { return 'troll'; }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 10);
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 120;
        this.speed = 300;
        this.experience = 25;
    }

    getSymbol() { return 'T'; }
    getColor() { return '#00aa00'; }

    performAction(monsterManager) {
        if (monsterManager.game.currentTick - this.lastRegenTick > 500 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + 2);
            this.lastRegenTick = monsterManager.game.currentTick;
            if (monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()} regenerates!`);
            }
        }

        super.performAction(monsterManager);
    }
}

class Wizard extends Monster {
    static levelRange = [4, 9];

    constructor(id, x, y) {
        super(id, x, y);
        this.lastSpellTick = 0;
        this.description = 'A gaunt spellcaster in threadbare robes, fingers crackling with unstable arcane intent.';
    }

    getType() { return 'wizard'; }

    setStats() {
        this.hp = 8 + Math.floor(Math.random() * 3);
        this.maxHp = this.hp;
        this.dmg = 8;
        this.size = 100;
        this.speed = 150;
        this.experience = 20;
        this.canOpenDoors = true;
        this.perception = 60;
    }

    getSymbol() { return 'W'; }
    getColor() { return '#4444ff'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 5 && monsterManager.game.visible[this.y] && monsterManager.game.visible[this.y][this.x]) {
            if (monsterManager.game.currentTick - this.lastSpellTick > 600) {
                const damage = this.dmg;
                Game.player.hitPlayer(damage);
                monsterManager.game.addMessage(`The ${this.getDisplayName()} casts magic missile for ${damage} damage!`);
                this.lastSpellTick = monsterManager.game.currentTick;
                return;
            }
        }

        if (dist <= 2) {
            const retreatDirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            for (const [dx, dy] of retreatDirs) {
                const newX = this.x + dx;
                const newY = this.y + dy;
                const newDist = Math.abs(newX - Game.player.x) + Math.abs(newY - Game.player.y);
                if (newDist > dist && monsterManager.isWalkableForMonster(newX, newY, this)) {
                    this.moveTo(newX, newY);
                    return;
                }
            }
        }

        super.performAction(monsterManager);
    }
}

class Minotaur extends Monster {
    static levelRange = [6, 11];

    constructor(id, x, y) {
        super(id, x, y);
        this.charging = false;
        this.description = 'A towering bull-headed terror—steam rises from flared nostrils as it paws for the charge.';
    }

    getType() { return 'minotaur'; }

    setStats() {
        this.hp = 30 + Math.floor(Math.random() * 15);
        this.maxHp = this.hp;
        this.dmg = 16;
        this.size = 130;
        this.speed = 130;
        this.experience = 50;
        this.canOpenDoors = true;
    }

    getSymbol() { return 'M'; }
    getColor() { return '#ff8800'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (!this.charging && dist >= 3 && dist <= 6) {
            const dx = Game.player.x - this.x;
            const dy = Game.player.y - this.y;

            if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
                this.charging = true;
                this.speed = 50;
                monsterManager.game.addMessage(`The ${this.getDisplayName()} begins charging!`);
            }
        }

        if (this.charging && (dist <= 1.5 || Math.random() < 0.3)) {
            this.charging = false;
            this.speed = 130;
        }

        super.performAction(monsterManager);
    }
}

class Basilisk extends Monster {
    static levelRange = [8, 13];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Eyes like death itself; to meet its gaze is to become stone eternal.';
        this.resistances.poison = 0.0;
        this.resistances.physical = 0.7;
        this.poisonChance = 0.5;
        this.poisonDmgPerTick = 3;
        this.poisonDuration = 6;
    }

    getType() { return 'basilisk'; }

    setStats() {
        this.hp = 25 + Math.floor(Math.random() * 8);
        this.maxHp = this.hp;
        this.dmg = 11;
        this.size = 110;
        this.speed = 120;
        this.experience = 55;
    }

    getSymbol() { return 'B'; }
    getColor() { return '#9ACD32'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 4 && Math.random() < 0.3) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()}'s gaze finds you!`);

            if (Math.random() < 0.4) {
                monsterManager.game.addMessage('You feel your body turning to stone! You are paralyzed!');
                Game.player.speed = Math.min(500, Game.player.speed + 200);

                monsterManager.game.timeManager.scheduleEvent(200, () => {
                    Game.player.speed = Math.max(100, Game.player.speed - 200);
                    monsterManager.game.addMessage('You break free from the paralysis!');
                });
            } else {
                monsterManager.game.addMessage('You avert your eyes just in time!');
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

class Beholder extends Monster {
    static levelRange = [10, 15];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'A floating nightmare of eyes and teeth; each gaze brings a different doom.';
        this.eyeRayCooldown = 0;
        this.resistances.poison = 0.5;
        this.resistances.fire = 0.6;
        this.resistances.ice = 0.6;
        this.resistances.lightning = 0.6;
    }

    getType() { return 'beholder'; }

    setStats() {
        this.hp = 32 + Math.floor(Math.random() * 11);
        this.maxHp = this.hp;
        this.dmg = 13;
        this.size = 120;
        this.speed = 110;
        this.armor = 3;
        this.experience = 85;
        this.perception = 80;
    }

    getSymbol() { return 'e'; }
    getColor() { return '#FF00FF'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 2 && dist <= 6 && this.eyeRayCooldown <= 0 && Math.random() < 0.5) {
            const rayType = Math.floor(Math.random() * 4);

            switch (rayType) {
                case 0:
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s disintegration ray strikes!`);
                    const disDamage = Game.player.hitPlayer(15);
                    if (disDamage > 0) {
                        monsterManager.game.addMessage(`You take ${disDamage} disintegration damage!`);
                    }
                    break;

                case 1:
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s slow ray hits you!`);
                    Game.player.speed = Math.min(300, Game.player.speed + 100);
                    monsterManager.game.timeManager.scheduleEvent(150, () => {
                        Game.player.speed = Math.max(100, Game.player.speed - 100);
                        monsterManager.game.addMessage('You recover from the slow effect.');
                    });
                    break;

                case 2:
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s fear ray terrifies you!`);
                    const fearDamage = Game.player.hitPlayer(8);
                    if (fearDamage > 0) {
                        monsterManager.game.addMessage(`Fear racks your body for ${fearDamage} damage!`);
                    }
                    break;

                case 3:
                    monsterManager.game.addMessage(`The ${this.getDisplayName()}'s telekinetic ray batters you!`);
                    const tkDamage = Game.player.hitPlayer(10);
                    if (tkDamage > 0) {
                        monsterManager.game.addMessage(`You take ${tkDamage} force damage!`);
                    }
                    break;
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.eyeRayCooldown = 4;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.eyeRayCooldown = Math.max(0, this.eyeRayCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

class Hydra extends Monster {
    static levelRange = [9, 14];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Seven heads writhe on serpentine necks; sever one and two more shall rise.';
    }

    getType() { return 'hydra'; }

    setStats() {
        this.hp = 45 + Math.floor(Math.random() * 16);
        this.maxHp = this.hp;
        this.dmg = 10;
        this.size = 150;
        this.speed = 130;
        this.armor = 2;
        this.experience = 70;
    }

    getSymbol() { return 'Y'; }
    getColor() { return '#006400'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist < 1.5) {
            monsterManager.game.running = false;

            let totalDamage = 0;
            let hitCount = 0;

            for (let i = 0; i < 3; i++) {
                const chanceToEvade = Game.player.chanceToEvade();
                if ((Math.random() * 100) < chanceToEvade) {
                    continue;
                }

                const dmg = Math.max(1, this.getDamage());
                const actualDamage = Game.player.hitPlayer(dmg);
                totalDamage += actualDamage;
                if (actualDamage > 0) hitCount++;
            }

            if (hitCount > 0) {
                monsterManager.game.addMessage(`The ${this.getDisplayName()}'s ${hitCount} head${hitCount > 1 ? 's' : ''} strike for ${totalDamage} total damage!`);
            } else {
                monsterManager.game.addMessage(`You dodge all of the ${this.getDisplayName()}'s heads!`);
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

class Manticore extends Monster {
    static levelRange = [7, 12];

    constructor(id, x, y) {
        super(id, x, y);
        this.description = 'Lion\'s body, dragon\'s wings, scorpion\'s tail, and human face twisted in eternal hunger.';
        this.spikeCooldown = 0;
    }

    getType() { return 'manticore'; }

    setStats() {
        this.hp = 28 + Math.floor(Math.random() * 9);
        this.maxHp = this.hp;
        this.dmg = 12;
        this.size = 130;
        this.speed = 100;
        this.armor = 2;
        this.experience = 48;
        this.canOpenDoors = true;
    }

    getSymbol() { return 'M'; }
    getColor() { return '#8B4513'; }

    performAction(monsterManager) {
        const dist = this.distanceTo(Game.player.x, Game.player.y);

        if (dist >= 3 && dist <= 6 && this.spikeCooldown <= 0 && Math.random() < 0.4) {
            monsterManager.game.addMessage(`The ${this.getDisplayName()} launches tail spikes!`);

            let totalDamage = 0;
            for (let i = 0; i < 3; i++) {
                if (Math.random() < 0.7) {
                    const spikeDamage = Game.player.hitPlayer(4);
                    totalDamage += spikeDamage;
                }
            }

            if (totalDamage > 0) {
                monsterManager.game.addMessage(`The spikes pierce you for ${totalDamage} total damage!`);
            } else {
                monsterManager.game.addMessage('The spikes miss!');
            }

            if (Game.player.isDead()) {
                monsterManager.game.gameOver = true;
                monsterManager.game.addMessage('You die. Game over.');
            }

            this.spikeCooldown = 5;
            this.scheduleNextAction(monsterManager.game.currentTick);
            return;
        }

        this.spikeCooldown = Math.max(0, this.spikeCooldown - 1);

        if (dist < 1.5) {
            monsterManager.monsterAttackPlayer(this);
            return;
        }

        super.performAction(monsterManager);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {Troll, Wizard, Minotaur, Basilisk, Beholder, Hydra, Manticore};
}
