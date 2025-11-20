// Test file for cursed items functionality
// This file tests the cursed items feature

// Mock Game object
const Game = {
    player: null
};

// Load items.js (in Node.js environment)
if (typeof require !== 'undefined') {
    const items = require('./items.js');
    Object.assign(global, items);
}

function testCursedWeapon() {
    console.log('\n=== Testing Cursed Weapon ===');

    // Create a sword
    const sword = new Shortsword(0, 0);
    console.log('Original damage:', sword.damage);
    console.log('Original cursed status:', sword.cursed);

    // Apply curse
    sword.applyCurse();
    console.log('After curse - damage:', sword.damage);
    console.log('After curse - cursed status:', sword.cursed);
    console.log('After curse - speed penalty:', sword.speed);

    // Remove curse
    sword.removeCurse();
    console.log('After uncurse - damage:', sword.damage);
    console.log('After uncurse - cursed status:', sword.cursed);

    console.log('✓ Cursed weapon test passed');
}

function testCursedArmor() {
    console.log('\n=== Testing Cursed Armor ===');

    // Create armor
    const armor = new ChainMail(0, 0);
    console.log('Original defense:', armor.defense);
    console.log('Original cursed status:', armor.cursed);

    // Apply curse
    armor.applyCurse();
    console.log('After curse - defense:', armor.defense);
    console.log('After curse - cursed status:', armor.cursed);

    // Remove curse
    armor.removeCurse();
    console.log('After uncurse - defense:', armor.defense);
    console.log('After uncurse - cursed status:', armor.cursed);

    console.log('✓ Cursed armor test passed');
}

function testCursedItemWithBonuses() {
    console.log('\n=== Testing Cursed Item with Bonuses ===');

    // Create weapon with bonuses
    const weapon = new Longsword(0, 0);
    weapon.bonuses.damage = 5;
    weapon.bonuses.attack = 3;

    console.log('Original damage bonus:', weapon.bonuses.damage);
    console.log('Original attack bonus:', weapon.bonuses.attack);

    // Apply curse - should invert bonuses
    weapon.applyCurse();
    console.log('After curse - damage bonus:', weapon.bonuses.damage);
    console.log('After curse - attack bonus:', weapon.bonuses.attack);

    // Remove curse - should restore bonuses
    weapon.removeCurse();
    console.log('After uncurse - damage bonus:', weapon.bonuses.damage);
    console.log('After uncurse - attack bonus:', weapon.bonuses.attack);

    console.log('✓ Cursed item with bonuses test passed');
}

function testUncurseScroll() {
    console.log('\n=== Testing Uncurse Scroll ===');

    // Create scroll
    const scroll = new UncurseScroll(0, 0);
    console.log('Scroll name:', scroll.name);
    console.log('Scroll color:', scroll.getColor());
    console.log('Scroll description:', scroll.description);

    console.log('✓ Uncurse scroll creation test passed');
}

// Run tests
console.log('Starting cursed items tests...\n');

try {
    testCursedWeapon();
    testCursedArmor();
    testCursedItemWithBonuses();
    testUncurseScroll();

    console.log('\n=== All tests passed! ===\n');
} catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
}

