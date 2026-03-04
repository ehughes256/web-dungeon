// Test file for potion color assignment system
// Run this with: node test_potion_colors.js

// Mock the Game global
global.Game = {
    player: {
        inventory: { potions: [] },
        heal: function(amount) { return amount; },
        speed: 100,
        identifyPotionType: function(name) {
            if (this.inventory.potions) {
                this.inventory.potions.forEach(p => {
                    if (p.name === name) {
                        p.identified = true;
                    }
                });
            }
        }
    }
};

// Load items.js, potions.js and scrolls.js
const fs = require('fs');

// Use require instead of eval to properly load modules
const items = require('../../items/items.js');
const potions = require('../../items/potions.js');
const scrolls = require('../../items/scrolls.js');

// Make items, potions and scrolls available globally
Object.assign(global, items, potions, scrolls);

console.log('=== Testing Potion Color System ===\n');

// Initialize potion colors
initializePotionColors();

console.log('1. Color assignments:');
console.log('   Health Potion color:', POTION_COLOR_ASSIGNMENTS['Health Potion']);
console.log('   Speed Potion color:', POTION_COLOR_ASSIGNMENTS['Speed Potion']);
console.log();

// Create test potions
const healthPotion = new HealthPotion(0, 0);
const speedPotion = new SpeedPotion(0, 0);

console.log('2. Created potions (unidentified):');
console.log('   Health Potion display name:', healthPotion.getDisplayName());
console.log('   Speed Potion display name:', speedPotion.getDisplayName());
console.log('   Health Potion identified:', healthPotion.identified);
console.log('   Speed Potion identified:', speedPotion.identified);
console.log();

// Identify health potion
healthPotion.identified = true;

console.log('3. After identifying health potion:');
console.log('   Health Potion display name:', healthPotion.getDisplayName());
console.log('   Health Potion identified:', healthPotion.identified);
console.log();

// Test that colors are different
console.log('4. Verify colors are different:');
const color1 = POTION_COLOR_ASSIGNMENTS['Health Potion'];
const color2 = POTION_COLOR_ASSIGNMENTS['Speed Potion'];
if (color1 !== color2) {
    console.log('   ✓ Health and Speed potions have different colors');
} else {
    console.log('   ✗ ERROR: Both potions have the same color!');
}
console.log();

// Test that colors are from the list
console.log('5. Verify colors are from predefined list:');
if (POTION_COLORS.includes(color1)) {
    console.log('   ✓ Health potion color is from POTION_COLORS list');
} else {
    console.log('   ✗ ERROR: Health potion color not from list!');
}
if (POTION_COLORS.includes(color2)) {
    console.log('   ✓ Speed potion color is from POTION_COLORS list');
} else {
    console.log('   ✗ ERROR: Speed potion color not from list!');
}
console.log();

// Test randomization - run multiple times
console.log('6. Testing randomization (5 runs):');
for (let i = 0; i < 5; i++) {
    initializePotionColors();
    const hp = new HealthPotion(0, 0);
    const sp = new SpeedPotion(0, 0);
    console.log(`   Run ${i + 1}: ${hp.getDisplayName()} | ${sp.getDisplayName()}`);
}

console.log('\n=== All tests completed ===');

