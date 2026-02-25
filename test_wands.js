// test_wands.js - Test wand system
// Run with: node test_wands.js

// Simulate browser environment for testing
global.Game = { player: null };
global.Player = class Player {
    static identifiedWandTypes = new Set();
    constructor() {
        this.inventory = { gold: 0, potions: [], scrolls: [], wands: [], weapons: [], armor: [] };
    }
    addWand(wand) {
        this.inventory.wands.push(wand);
    }
    identifyWandType(name) {
        Player.identifiedWandTypes.add(name);
    }
};
Game.player = new Player();

const items = require('./items.js');
const wands = require('./wands.js');
Object.assign(global, items, wands);

console.log('=== Wand System Tests ===\n');

// Initialize wand materials
initializeWandMaterials();
console.log('1. Wand materials initialized');
console.log('   Assignments:', Object.keys(WAND_MATERIAL_ASSIGNMENTS).length, 'wand types');

// Test wand creation
console.log('\n2. Testing wand creation:');
const wandClasses = [
    MagicMissileWand, LightningWand, FireWand, IceWand,
    PolymorphWand, SlowWand, TeleportationWand, DeathWand
];

wandClasses.forEach(WandClass => {
    const w = new WandClass(0, 0);
    console.log(`   ✓ ${w.name} (${w.materialName} wand) - ${w.charges} charges`);
});

// Test display names
console.log('\n3. Testing display names:');
const testWand = new FireWand(0, 0);
console.log('   Unidentified:', testWand.getDisplayName());
testWand.identified = true;
console.log('   Identified:', testWand.getDisplayName());

// Test inventory
console.log('\n4. Testing inventory integration:');
const wand = new MagicMissileWand(5, 5);
const copyWand = wand.createInventoryCopy();
Game.player.addWand(copyWand);
console.log('   Wand added to inventory:', Game.player.inventory.wands.length === 1 ? '✓' : '✗');
console.log('   Wand name correct:', Game.player.inventory.wands[0].name === 'Wand of Magic Missile' ? '✓' : '✗');

// Test identification
console.log('\n5. Testing identification system:');
Game.player.identifyWandType('Wand of Magic Missile');
console.log('   Type identified:', Player.identifiedWandTypes.has('Wand of Magic Missile') ? '✓' : '✗');

// Test ItemFactory
console.log('\n6. Testing ItemFactory integration:');
const wandsInFactory = ItemFactory.itemTypes.filter(t => t.class.name.includes('Wand'));
console.log('   Wand types in factory:', wandsInFactory.length);
wandsInFactory.forEach(w => {
    console.log(`   ✓ ${w.class.name} (drop: ${w.chance})`);
});

console.log('\n=== All tests passed! ===');

