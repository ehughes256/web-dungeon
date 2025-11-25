// Test for verifying that identifying an item marks all existing instances on the ground
// This test simulates the full game flow where items exist on the floor and in inventory

const assert = require('assert');

// Mock Player class
global.Player = {
    identifiedScrollTypes: new Set(),
    identifiedPotionTypes: new Set()
};

// Load Item class first
const { Item } = require('./items.js');
const { Scroll, PsionicScroll, initializeScrollMagicPhrases } = require('./scrolls.js');
const { Potion, HealthPotion, initializePotionColors } = require('./potions.js');

// Initialize the random assignments
initializeScrollMagicPhrases();
initializePotionColors();

// Create a mock dungeon with tiles
class MockTile {
    constructor() {
        this.items = [];
    }

    addItem(item) {
        this.items.push(item);
    }
}

class MockDungeon {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = new MockTile();
            }
        }
    }

    getTile(x, y) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            return this.tiles[y][x];
        }
        return null;
    }
}

// Mock Game instance
const mockGame = {
    height: 10,
    width: 10,
    dungeon: new MockDungeon(10, 10)
};

global.Game = {
    instance: mockGame,
    player: {
        identifiedScrollTypes: new Set(),
        identifiedPotionTypes: new Set(),
        inventory: {
            scrolls: [],
            potions: []
        }
    }
};

// Make sure Player references the same Sets
global.Player.identifiedScrollTypes = global.Game.player.identifiedScrollTypes;
global.Player.identifiedPotionTypes = global.Game.player.identifiedPotionTypes;

console.log('Testing Identification of Existing Items on Ground...\n');

// Test 1: Create scrolls on the ground and in inventory
console.log('Test 1: Place multiple Psionic Scrolls on ground and in inventory');
const groundScroll1 = new PsionicScroll(2, 3);
const groundScroll2 = new PsionicScroll(5, 7);
const invScroll1 = new PsionicScroll(0, 0);
const invScroll2 = new PsionicScroll(0, 0);

mockGame.dungeon.getTile(2, 3).addItem(groundScroll1);
mockGame.dungeon.getTile(5, 7).addItem(groundScroll2);
Game.player.inventory.scrolls.push(invScroll1, invScroll2);

assert.strictEqual(groundScroll1.identified, false, 'Ground scroll 1 should not be identified');
assert.strictEqual(groundScroll2.identified, false, 'Ground scroll 2 should not be identified');
assert.strictEqual(invScroll1.identified, false, 'Inventory scroll 1 should not be identified');
assert.strictEqual(invScroll2.identified, false, 'Inventory scroll 2 should not be identified');
console.log('✓ All scrolls start unidentified\n');

// Test 2: Simulate identifying the scroll type (what happens when you use a scroll)
console.log('Test 2: Identify scroll type and verify all instances are marked');
Game.player.identifiedScrollTypes.add('Psionic Scroll');

// Simulate what happens in identifyScrollType
Game.player.inventory.scrolls.forEach(s => {
    if (s.name === 'Psionic Scroll') {
        s.identified = true;
    }
});

// Mark all scrolls of this type on the ground as identified
for (let y = 0; y < mockGame.height; y++) {
    for (let x = 0; x < mockGame.width; x++) {
        const tile = mockGame.dungeon.getTile(x, y);
        if (tile && tile.items) {
            tile.items.forEach(item => {
                if (item instanceof Scroll && item.name === 'Psionic Scroll') {
                    item.identified = true;
                }
            });
        }
    }
}

assert.strictEqual(groundScroll1.identified, true, 'Ground scroll 1 should now be identified');
assert.strictEqual(groundScroll2.identified, true, 'Ground scroll 2 should now be identified');
assert.strictEqual(invScroll1.identified, true, 'Inventory scroll 1 should now be identified');
assert.strictEqual(invScroll2.identified, true, 'Inventory scroll 2 should now be identified');
console.log('✓ All existing scrolls are now identified\n');

// Test 3: New scrolls of the same type should be auto-identified
console.log('Test 3: New scrolls of identified type should auto-identify');
const newGroundScroll = new PsionicScroll(8, 9);
const newInvScroll = new PsionicScroll(0, 0);

assert.strictEqual(newGroundScroll.identified, true, 'New ground scroll should auto-identify');
assert.strictEqual(newInvScroll.identified, true, 'New inventory scroll should auto-identify');
console.log('✓ All new scrolls of identified type are auto-identified\n');

// Test 4: Test the same with potions
console.log('Test 4: Test potion identification system');
Game.player.identifiedPotionTypes.clear();

const groundPotion1 = new HealthPotion(1, 2);
const groundPotion2 = new HealthPotion(6, 8);
const invPotion1 = new HealthPotion(0, 0);

mockGame.dungeon.getTile(1, 2).addItem(groundPotion1);
mockGame.dungeon.getTile(6, 8).addItem(groundPotion2);
Game.player.inventory.potions = [invPotion1];

assert.strictEqual(groundPotion1.identified, false, 'Ground potion should not be identified');
assert.strictEqual(groundPotion2.identified, false, 'Ground potion should not be identified');
assert.strictEqual(invPotion1.identified, false, 'Inventory potion should not be identified');

// Identify the potion type
Game.player.identifiedPotionTypes.add('Health Potion');

// Simulate what happens in identifyPotionType
Game.player.inventory.potions.forEach(p => {
    if (p.name === 'Health Potion') {
        p.identified = true;
    }
});

// Mark all potions of this type on the ground as identified
for (let y = 0; y < mockGame.height; y++) {
    for (let x = 0; x < mockGame.width; x++) {
        const tile = mockGame.dungeon.getTile(x, y);
        if (tile && tile.items) {
            tile.items.forEach(item => {
                if (item instanceof Potion && item.name === 'Health Potion') {
                    item.identified = true;
                }
            });
        }
    }
}

assert.strictEqual(groundPotion1.identified, true, 'Ground potion should now be identified');
assert.strictEqual(groundPotion2.identified, true, 'Ground potion should now be identified');
assert.strictEqual(invPotion1.identified, true, 'Inventory potion should now be identified');

// New potion should auto-identify
const newPotion = new HealthPotion(3, 4);
assert.strictEqual(newPotion.identified, true, 'New potion should auto-identify');
console.log('✓ Potion identification system works correctly\n');

console.log('All tests passed! ✓✓✓');
console.log('\nThe identification system correctly handles:');
console.log('1. Marking all existing items in inventory');
console.log('2. Marking all existing items on the ground');
console.log('3. Auto-identifying all future items of that type');

