// Test for monsters triggering traps
// Verifies that monsters can trigger traps and that traps are only discovered when visible

const assert = require('assert');

// Mock Game reference
global.Game = {
    player: null,
    instance: null
};

// Load dependencies
const { Monster } = require('../../monsters/monster.js');
const { Goblin } = require('../../monsters/goblin.js');
const { SpikeTrap, PoisonDartTrap, PitTrap, TeleportTrap, AlarmTrap } = require('../../traps.js');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Monster Trap Triggering - Test Suite');
console.log('═══════════════════════════════════════════════════════════════\n');

// Mock player
Game.player = {
    x: 0,
    y: 0,
    hp: 100,
    hitPlayer: function(dmg) { this.hp -= dmg; return dmg; },
    isDead: function() { return this.hp <= 0; }
};

// Mock game instance
const mockGame = {
    visible: [],
    width: 20,
    height: 20,
    addMessage: function(msg) {
        console.log(`  [Message]: ${msg}`);
    },
    dungeon: {
        isValidMove: function(x, y) {
            return x >= 0 && x < 20 && y >= 0 && y < 20;
        },
        getTile: function(x, y) {
            return { type: '.' };
        }
    },
    monsterManager: {
        monsters: []
    },
    timeManager: {
        scheduleEvent: function(time, trap, callback) {
            // Mock - don't actually schedule
        }
    }
};

// Initialize visible array
for (let y = 0; y < 20; y++) {
    mockGame.visible[y] = [];
    for (let x = 0; x < 20; x++) {
        mockGame.visible[y][x] = false;
    }
}

Game.instance = mockGame;

// Test 1: Monster triggers spike trap in player's sight
console.log('Test 1: Monster triggers spike trap VISIBLE to player');
console.log('────────────────────────────────────────────────────────────');
const monster1 = new Goblin(1, 10, 10);
monster1.hp = 20;
const trap1 = new SpikeTrap(10, 10);
mockGame.visible[10][10] = true; // Trap location is visible

console.log(`Monster HP before: ${monster1.hp}`);
console.log(`Trap discovered before: ${trap1.discovered}`);
console.log(`Trap triggered before: ${trap1.triggered}`);

trap1.trigger(mockGame, monster1);

console.log(`Monster HP after: ${monster1.hp}`);
console.log(`Trap discovered after: ${trap1.discovered}`);
console.log(`Trap triggered after: ${trap1.triggered}`);

assert.strictEqual(trap1.triggered, true, 'Trap should be triggered');
assert.strictEqual(trap1.discovered, true, 'Trap should be discovered when visible');
assert(monster1.hp < 20, 'Monster should take damage');
console.log('✓ Pass\n');

// Test 2: Monster triggers spike trap OUT of player's sight
console.log('Test 2: Monster triggers spike trap NOT VISIBLE to player');
console.log('────────────────────────────────────────────────────────────');
const monster2 = new Goblin(2, 15, 15);
monster2.hp = 20;
const trap2 = new SpikeTrap(15, 15);
mockGame.visible[15][15] = false; // Trap location is NOT visible

console.log(`Monster HP before: ${monster2.hp}`);
console.log(`Trap discovered before: ${trap2.discovered}`);
console.log(`Trap triggered before: ${trap2.triggered}`);

trap2.trigger(mockGame, monster2);

console.log(`Monster HP after: ${monster2.hp}`);
console.log(`Trap discovered after: ${trap2.discovered}`);
console.log(`Trap triggered after: ${trap2.triggered}`);

assert.strictEqual(trap2.triggered, true, 'Trap should be triggered');
assert.strictEqual(trap2.discovered, false, 'Trap should NOT be discovered when not visible');
assert(monster2.hp < 20, 'Monster should take damage');
console.log('✓ Pass\n');

// Test 3: Player triggers trap (should always discover it)
console.log('Test 3: Player triggers trap (should always discover)');
console.log('────────────────────────────────────────────────────────────');
Game.player.hp = 100;
const trap3 = new SpikeTrap(5, 5);
mockGame.visible[5][5] = true;

console.log(`Player HP before: ${Game.player.hp}`);
console.log(`Trap discovered before: ${trap3.discovered}`);

trap3.trigger(mockGame, Game.player);

console.log(`Player HP after: ${Game.player.hp}`);
console.log(`Trap discovered after: ${trap3.discovered}`);

assert.strictEqual(trap3.triggered, true, 'Trap should be triggered');
assert.strictEqual(trap3.discovered, true, 'Trap should be discovered by player');
assert(Game.player.hp < 100, 'Player should take damage');
console.log('✓ Pass\n');

// Test 4: Monster dies from trap damage
console.log('Test 4: Monster with low HP dies from trap');
console.log('────────────────────────────────────────────────────────────');
const monster3 = new Goblin(3, 7, 7);
monster3.hp = 3; // Low HP
const trap4 = new SpikeTrap(7, 7);
trap4.damage = 10; // High damage
mockGame.visible[7][7] = true;

console.log(`Monster HP before: ${monster3.hp}`);
console.log(`Monster alive before: ${monster3.isAlive()}`);

trap4.trigger(mockGame, monster3);

console.log(`Monster HP after: ${monster3.hp}`);
console.log(`Monster alive after: ${monster3.isAlive()}`);

assert.strictEqual(monster3.isAlive(), false, 'Monster should be dead');
assert.strictEqual(trap4.discovered, true, 'Trap should be discovered');
console.log('✓ Pass\n');

// Test 5: Teleport trap moves monster (visible)
console.log('Test 5: Teleport trap moves monster (visible)');
console.log('────────────────────────────────────────────────────────────');
const monster4 = new Goblin(4, 8, 8);
const originalX = monster4.x;
const originalY = monster4.y;
const trap5 = new TeleportTrap(8, 8);
mockGame.visible[8][8] = true;

console.log(`Monster position before: (${monster4.x}, ${monster4.y})`);
console.log(`Trap discovered before: ${trap5.discovered}`);

trap5.trigger(mockGame, monster4);

console.log(`Monster position after: (${monster4.x}, ${monster4.y})`);
console.log(`Trap discovered after: ${trap5.discovered}`);

assert.strictEqual(trap5.triggered, true, 'Trap should be triggered');
assert.strictEqual(trap5.discovered, true, 'Trap should be discovered when visible');
assert(monster4.x !== originalX || monster4.y !== originalY, 'Monster should be teleported');
console.log('✓ Pass\n');

// Test 6: Teleport trap moves monster (not visible)
console.log('Test 6: Teleport trap moves monster (not visible)');
console.log('────────────────────────────────────────────────────────────');
const monster5 = new Goblin(5, 12, 12);
const originalX2 = monster5.x;
const originalY2 = monster5.y;
const trap6 = new TeleportTrap(12, 12);
mockGame.visible[12][12] = false;

console.log(`Monster position before: (${monster5.x}, ${monster5.y})`);
console.log(`Trap discovered before: ${trap6.discovered}`);

trap6.trigger(mockGame, monster5);

console.log(`Monster position after: (${monster5.x}, ${monster5.y})`);
console.log(`Trap discovered after: ${trap6.discovered}`);

assert.strictEqual(trap6.triggered, true, 'Trap should be triggered');
assert.strictEqual(trap6.discovered, false, 'Trap should NOT be discovered when not visible');
assert(monster5.x !== originalX2 || monster5.y !== originalY2, 'Monster should be teleported');
console.log('✓ Pass\n');

// Test 7: Alarm trap only affects player
console.log('Test 7: Alarm trap triggered by monster (no effect)');
console.log('────────────────────────────────────────────────────────────');
const monster6 = new Goblin(6, 3, 3);
const trap7 = new AlarmTrap(3, 3);
mockGame.visible[3][3] = true;
mockGame.monsterManager.monsters = [monster6];

console.log(`Trap discovered before: ${trap7.discovered}`);

trap7.trigger(mockGame, monster6);

console.log(`Trap discovered after: ${trap7.discovered}`);

assert.strictEqual(trap7.triggered, true, 'Trap should be triggered');
assert.strictEqual(trap7.discovered, true, 'Trap should be discovered when visible');
console.log('✓ Pass\n');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  All Tests Passed! ✓');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\nSummary:');
console.log('✓ Monsters can trigger traps');
console.log('✓ Traps are discovered when triggered in sight');
console.log('✓ Traps are NOT discovered when triggered out of sight');
console.log('✓ Monsters take damage from traps');
console.log('✓ Monsters can die from trap damage');
console.log('✓ Teleport traps work on monsters');
console.log('✓ Different trap types behave correctly');

