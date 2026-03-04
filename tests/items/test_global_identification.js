// Test for global scroll and potion identification system
// This test verifies that when you identify a scroll or potion type,
// all existing and future instances of that type are identified

const assert = require('assert');

// Mock Player class for testing
global.Player = {
    identifiedScrollTypes: new Set(),
    identifiedPotionTypes: new Set()
};

// Mock Game class for testing
global.Game = {
    instance: null,
    player: null
};

// Load the Item class first
const { Item } = require('../../items/items.js');

// Load the modules
const { Scroll, PsionicScroll, SCROLL_MAGIC_ASSIGNMENTS, initializeScrollMagicPhrases } = require('../../items/scrolls.js');
const { Potion, HealthPotion, POTION_COLOR_ASSIGNMENTS, initializePotionColors } = require('../../items/potions.js');

// Initialize the random assignments
initializeScrollMagicPhrases();
initializePotionColors();

console.log('Testing Global Identification System...\n');

// Test 1: New scrolls should not be identified by default
console.log('Test 1: New scrolls should not be identified by default');
const scroll1 = new PsionicScroll(0, 0);
assert.strictEqual(scroll1.identified, false, 'New scroll should not be identified');
console.log('✓ Pass\n');

// Test 2: After identifying a scroll type, new scrolls of that type should be identified
console.log('Test 2: After identifying a scroll type, new scrolls should be identified');
Player.identifiedScrollTypes.add('Psionic Scroll');
const scroll2 = new PsionicScroll(0, 0);
assert.strictEqual(scroll2.identified, true, 'New scroll should be identified after type is known');
console.log('✓ Pass\n');

// Test 3: New potions should not be identified by default (reset first)
console.log('Test 3: New potions should not be identified by default');
Player.identifiedPotionTypes.clear();
const potion1 = new HealthPotion(0, 0);
assert.strictEqual(potion1.identified, false, 'New potion should not be identified');
console.log('✓ Pass\n');

// Test 4: After identifying a potion type, new potions of that type should be identified
console.log('Test 4: After identifying a potion type, new potions should be identified');
Player.identifiedPotionTypes.add('Health Potion');
const potion2 = new HealthPotion(0, 0);
assert.strictEqual(potion2.identified, true, 'New potion should be identified after type is known');
console.log('✓ Pass\n');

// Test 5: Different scroll types should not be affected
console.log('Test 5: Different scroll types should not affect each other');
Player.identifiedScrollTypes.clear();
Player.identifiedScrollTypes.add('Psionic Scroll');
const { TeleportScroll } = require('../../items/scrolls.js');
const teleScroll = new TeleportScroll(0, 0);
assert.strictEqual(teleScroll.identified, false, 'Different scroll type should not be identified');
console.log('✓ Pass\n');

// Test 6: Display names should change based on identification
console.log('Test 6: Display names should reflect identification status');
Player.identifiedScrollTypes.clear();
const scroll3 = new PsionicScroll(0, 0);
const unidentifiedName = scroll3.getDisplayName();
assert.notStrictEqual(unidentifiedName, 'Psionic Scroll', 'Unidentified scroll should show magic phrase');
assert(unidentifiedName.includes('scroll "'), 'Unidentified scroll should have magic phrase format');

Player.identifiedScrollTypes.add('Psionic Scroll');
scroll3.identified = true;
const identifiedName = scroll3.getDisplayName();
assert.strictEqual(identifiedName, 'Psionic Scroll', 'Identified scroll should show actual name');
console.log(`  Unidentified: ${unidentifiedName}`);
console.log(`  Identified: ${identifiedName}`);
console.log('✓ Pass\n');

// Test 7: Potion display names should change based on identification
console.log('Test 7: Potion display names should reflect identification status');
Player.identifiedPotionTypes.clear();
const potion3 = new HealthPotion(0, 0);
const unidentifiedPotionName = potion3.getDisplayName();
assert.notStrictEqual(unidentifiedPotionName, 'Health Potion', 'Unidentified potion should show color');
assert(unidentifiedPotionName.includes('potion'), 'Unidentified potion should have color format');

Player.identifiedPotionTypes.add('Health Potion');
potion3.identified = true;
const identifiedPotionName = potion3.getDisplayName();
assert.strictEqual(identifiedPotionName, 'Health Potion', 'Identified potion should show actual name');
console.log(`  Unidentified: ${unidentifiedPotionName}`);
console.log(`  Identified: ${identifiedPotionName}`);
console.log('✓ Pass\n');

console.log('All tests passed! ✓✓✓');
console.log('\nThe global identification system is working correctly.');
console.log('When you identify a scroll or potion type, all future instances will be automatically identified.');

