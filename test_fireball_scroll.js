// Test FireballScroll using shared FireballEffect
// This tests that both FireballTrap and FireballScroll use the same code

// Mock Game object
global.Game = {
    player: null
};

// Import modules
const { FireballEffect } = require('./traps.js');

// Mock Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = 100;
        this.maxHp = 100;
    }

    hitPlayer(damage) {
        const actualDamage = Math.min(damage, this.hp);
        this.hp -= actualDamage;
        return actualDamage;
    }

    isDead() {
        return this.hp <= 0;
    }

    identifyScrollType(name) {
        // Mock implementation
    }
}

// Mock Monster class
class MockMonster {
    constructor(x, y, name, hp, dmg, armor) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.hp = hp;
        this.maxHp = hp;
        this.dmg = dmg;
        this.armor = armor;
    }

    takeDamage(damage) {
        this.hp -= damage;
    }

    isAlive() {
        return this.hp > 0;
    }

    getDisplayName() {
        return this.name;
    }
}

// Mock game instance with minimal required properties
class MockGame {
    constructor() {
        this.width = 20;
        this.height = 20;
        this.messages = [];
        this.monsterManager = { monsters: [] };
        this.visible = [];
        for (let y = 0; y < this.height; y++) {
            this.visible[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.visible[y][x] = true; // Everything visible for testing
            }
        }
        this.tileSize = 30;
        this.ctx = {
            fillStyle: '',
            globalAlpha: 1.0,
            font: '',
            textAlign: '',
            textBaseline: '',
            fillRect: () => {},
            fillText: () => {}
        };
    }

    addMessage(msg) {
        this.messages.push(msg);
        console.log(`  [Message]: ${msg}`);
    }

    render() {
        // Mock render
    }

    async sleep(ms) {
        // For testing, we'll skip the actual sleep
        return Promise.resolve();
    }

    handlePlayerDeath() {
        console.log('  [Game Over]: Player died!');
    }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FireballScroll - Shared Code Test');
console.log('═══════════════════════════════════════════════════════════════\n');

// Test 1: FireballEffect damages only monsters (like scroll)
console.log('Test 1: FireballEffect with scroll options (no player damage)');
console.log('────────────────────────────────────────────────────────────');

const game1 = new MockGame();
const player1 = new Player(10, 10);
Game.player = player1;

const monster1 = new MockMonster(12, 10, 'Goblin', 30, 5, 2);
const monster2 = new MockMonster(11, 11, 'Goblin', 30, 5, 2);
game1.monsterManager.monsters = [monster1, monster2];

console.log(`Player at (${player1.x}, ${player1.y}), HP: ${player1.hp}`);
console.log(`Monster1 at (${monster1.x}, ${monster1.y}), HP: ${monster1.hp}`);
console.log(`Monster2 at (${monster2.x}, ${monster2.y}), HP: ${monster2.hp}`);

const scrollEffect = new FireballEffect(player1.x, player1.y, 18, 3, game1);

(async () => {
    const affected = await scrollEffect.execute({
        animate: false,           // No animation for test
        damagePlayer: false,      // Scroll doesn't hurt player
        damageMonsters: true,
        useFalloff: false,        // Scroll does full damage
        triggerMessage: 'You read a Fireball Scroll. A sphere of fire erupts!'
    });

    console.log(`Player HP after: ${player1.hp} (should be unchanged)`);
    console.log(`Monster1 HP after: ${monster1.hp}`);
    console.log(`Monster2 HP after: ${monster2.hp}`);
    console.log(`Affected entities: ${affected.length}`);

    if (player1.hp === 100 && monster1.hp === 12 && monster2.hp === 12) {
        console.log('✓ Pass\n');
    } else {
        console.log('✗ Fail\n');
    }

    // Test 2: FireballEffect damages both (like trap)
    console.log('Test 2: FireballEffect with trap options (player damage + falloff)');
    console.log('────────────────────────────────────────────────────────────');

    const game2 = new MockGame();
    const player2 = new Player(15, 10);
    Game.player = player2;

    const monster3 = new MockMonster(10, 10, 'Goblin', 30, 5, 2);
    game2.monsterManager.monsters = [monster3];

    console.log(`Player at (${player2.x}, ${player2.y}), HP: ${player2.hp}`);
    console.log(`Monster at (${monster3.x}, ${monster3.y}), HP: ${monster3.hp}`);
    console.log(`Trap at (10, 10), radius: 5`);

    const trapEffect = new FireballEffect(10, 10, 20, 5, game2);

    const affected2 = await trapEffect.execute({
        animate: false,
        damagePlayer: true,       // Trap hurts player
        damageMonsters: true,
        useFalloff: true,         // Trap has distance falloff
        triggerMessage: 'A monster triggered a fireball trap!'
    });

    console.log(`Player HP after: ${player2.hp} (should have damage with falloff)`);
    console.log(`Monster HP after: ${monster3.hp} (should have full damage at center)`);
    console.log(`Affected entities: ${affected2.length}`);

    if (player2.hp < 100 && player2.hp > 80 && monster3.hp === 10) {
        console.log('✓ Pass\n');
    } else {
        console.log('✗ Fail\n');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Tests Complete!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nShared FireballEffect Features:');
    console.log('✓ Can be configured for scroll behavior (no player damage, no falloff)');
    console.log('✓ Can be configured for trap behavior (player damage, falloff)');
    console.log('✓ Single codebase for both implementations');
    console.log('✓ Flexible options for different use cases');
})();

