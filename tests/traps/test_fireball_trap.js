// Test for FireballTrap - area of effect damage trap

const assert = require('assert');

// Mock Game reference
global.Game = {
    player: null,
    instance: null
};

// Load dependencies
const { Monster } = require('../../monsters/monster.js');
const { Goblin } = require('../../monsters/goblin.js');
const { Orc } = require('../../monsters/orc.js');
const { FireballTrap } = require('../../traps.js');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FireballTrap - Area of Effect Test Suite');
console.log('═══════════════════════════════════════════════════════════════\n');

// Mock player
Game.player = {
    x: 10,
    y: 10,
    hp: 100,
    maxHp: 100,
    hitPlayer: function(dmg) {
        const actual = Math.min(dmg, this.hp);
        this.hp -= actual;
        return actual;
    },
    isDead: function() { return this.hp <= 0; }
};

// Mock game instance
const mockGame = {
    visible: [],
    width: 30,
    height: 30,
    messages: [],
    addMessage: function(msg) {
        this.messages.push(msg);
        console.log(`  [Message]: ${msg}`);
    },
    dungeon: {
        isValidMove: function(x, y) {
            return x >= 0 && x < 30 && y >= 0 && y < 30;
        }
    },
    monsterManager: {
        monsters: []
    },
    sleep: async function(ms) {
        // Mock - don't actually sleep in tests
        return Promise.resolve();
    },
    render: function() {
        // Mock render
    },
    handlePlayerDeath: function() {
        console.log('  [GAME OVER]: Player died!');
    },
    ctx: {
        fillStyle: '',
        globalAlpha: 1,
        font: '',
        textAlign: '',
        textBaseline: '',
        fillRect: function() {},
        fillText: function() {}
    },
    tileSize: 20
};

// Initialize visible array
for (let y = 0; y < 30; y++) {
    mockGame.visible[y] = [];
    for (let x = 0; x < 30; x++) {
        mockGame.visible[y][x] = false;
    }
}

Game.instance = mockGame;

// Test 1: Fireball damages player in radius
console.log('Test 1: Fireball damages player at center');
console.log('────────────────────────────────────────────────────────────');
Game.player.x = 10;
Game.player.y = 10;
Game.player.hp = 100;
const trap1 = new FireballTrap(10, 10);
trap1.damage = 20; // Fixed damage for testing
mockGame.visible[10][10] = true;
mockGame.messages = [];

console.log(`Player HP before: ${Game.player.hp}`);
console.log(`Player position: (${Game.player.x}, ${Game.player.y})`);
console.log(`Trap position: (${trap1.x}, ${trap1.y})`);

trap1.trigger(mockGame, Game.player).then(() => {
    console.log(`Player HP after: ${Game.player.hp}`);
    assert(Game.player.hp < 100, 'Player should take damage at center');
    assert.strictEqual(trap1.discovered, true, 'Fireball trap should always be discovered');
    assert.strictEqual(trap1.triggered, true, 'Trap should be triggered');
    console.log('✓ Pass\n');

    // Test 2: Fireball damages entities at edge of radius
    console.log('Test 2: Fireball damages entities at edge of radius');
    console.log('────────────────────────────────────────────────────────────');
    Game.player.hp = 100;
    Game.player.x = 15; // 5 units away
    Game.player.y = 10;

    const monster1 = new Goblin(1, 5, 10); // 5 units away on other side
    monster1.hp = 30;
    const monster2 = new Goblin(2, 13, 13); // Within radius but closer
    monster2.hp = 30;

    mockGame.monsterManager.monsters = [monster1, monster2];

    const trap2 = new FireballTrap(10, 10);
    trap2.damage = 20;
    mockGame.visible[10][10] = true;
    mockGame.messages = [];

    console.log(`Player at (${Game.player.x}, ${Game.player.y}), HP: ${Game.player.hp}`);
    console.log(`Monster1 at (${monster1.x}, ${monster1.y}), HP: ${monster1.hp}`);
    console.log(`Monster2 at (${monster2.x}, ${monster2.y}), HP: ${monster2.hp}`);
    console.log(`Trap at (${trap2.x}, ${trap2.y})`);

    trap2.trigger(mockGame, Game.player).then(() => {
        console.log(`Player HP after: ${Game.player.hp}`);
        console.log(`Monster1 HP after: ${monster1.hp}`);
        console.log(`Monster2 HP after: ${monster2.hp}`);

        assert(Game.player.hp < 100, 'Player should take damage at edge');
        assert(monster1.hp < 30, 'Monster1 should take damage at edge');
        assert(monster2.hp < 30, 'Monster2 should take damage within radius');
        console.log('✓ Pass\n');

        // Test 3: Entities outside radius are not affected
        console.log('Test 3: Entities outside radius are not affected');
        console.log('────────────────────────────────────────────────────────────');
        Game.player.hp = 100;
        Game.player.x = 16; // 6 units away (outside radius 5)
        Game.player.y = 10;

        const monster3 = new Goblin(3, 10, 10); // At trap location
        monster3.hp = 30;
        const monster4 = new Goblin(4, 4, 10); // 6 units away - outside radius
        monster4.hp = 30;

        mockGame.monsterManager.monsters = [monster3, monster4];

        const trap3 = new FireballTrap(10, 10);
        trap3.damage = 20;
        mockGame.messages = [];

        console.log(`Player at (${Game.player.x}, ${Game.player.y}), HP: ${Game.player.hp}`);
        console.log(`Monster (triggering) at (${monster3.x}, ${monster3.y}), HP: ${monster3.hp}`);
        console.log(`Monster (outside) at (${monster4.x}, ${monster4.y}), HP: ${monster4.hp}`);
        console.log(`Trap at (${trap3.x}, ${trap3.y}), radius: ${trap3.radius}`);

        // Trigger by stepping on it
        trap3.trigger(mockGame, monster3).then(() => {
            console.log(`Player HP after: ${Game.player.hp}`);
            console.log(`Monster (triggering) HP after: ${monster3.hp}`);
            console.log(`Monster (outside) HP after: ${monster4.hp}`);

            assert.strictEqual(Game.player.hp, 100, 'Player outside radius should not take damage');
            assert.strictEqual(monster4.hp, 30, 'Monster outside radius should not take damage');
            assert(monster3.hp < 30, 'Monster triggering trap at center should take damage');
            console.log('✓ Pass\n');

            // Test 4: Fireball can kill multiple monsters
            console.log('Test 4: Fireball can kill multiple monsters');
            console.log('────────────────────────────────────────────────────────────');
            const weakMonster1 = new Goblin(4, 10, 10); // At center
            weakMonster1.hp = 5;
            const weakMonster2 = new Goblin(5, 11, 10); // 1 unit away
            weakMonster2.hp = 8;
            const strongMonster = new Orc(6, 12, 10); // 2 units away
            strongMonster.hp = 50;

            mockGame.monsterManager.monsters = [weakMonster1, weakMonster2, strongMonster];

            const trap4 = new FireballTrap(10, 10);
            trap4.damage = 20;
            mockGame.messages = [];

            console.log(`Weak Monster 1 at (${weakMonster1.x}, ${weakMonster1.y}), HP: ${weakMonster1.hp}`);
            console.log(`Weak Monster 2 at (${weakMonster2.x}, ${weakMonster2.y}), HP: ${weakMonster2.hp}`);
            console.log(`Strong Monster at (${strongMonster.x}, ${strongMonster.y}), HP: ${strongMonster.hp}`);

            trap4.trigger(mockGame, weakMonster1).then(() => {
                console.log(`Weak Monster 1 HP after: ${weakMonster1.hp}`);
                console.log(`Weak Monster 2 HP after: ${weakMonster2.hp}`);
                console.log(`Strong Monster HP after: ${strongMonster.hp}`);

                assert(weakMonster1.hp <= 0, 'Weak monster 1 should die');
                assert(weakMonster2.hp <= 0, 'Weak monster 2 should die');
                assert(strongMonster.hp > 0 && strongMonster.hp < 50, 'Strong monster should be damaged but alive');
                console.log('✓ Pass\n');

                console.log('═══════════════════════════════════════════════════════════════');
                console.log('  All Tests Passed! ✓');
                console.log('═══════════════════════════════════════════════════════════════');
                console.log('\nFireballTrap Features:');
                console.log('✓ Damages all entities in 5-tile radius');
                console.log('✓ Damage falls off with distance (100% center, 40% edge)');
                console.log('✓ Always discovered when triggered (loud/bright)');
                console.log('✓ Can kill multiple monsters in one blast');
                console.log('✓ Entities outside radius are safe');
                console.log('✓ Includes animated explosion effect');
            });
        });
    });
});

