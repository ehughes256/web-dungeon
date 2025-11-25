// Test enchantment scroll functionality
const { Player } = require('./player.js');
const { Weapon } = require('./weapons.js');
const { Armor } = require('./armor.js');
const { EnchantmentScroll, UncurseScroll } = require('./scrolls.js');
const { Game } = require('./game.js');

console.log('Testing enchantment scroll item selection fix...\n');

// Create a simple test game instance
const testGame = {
    player: null,
    currentScroll: null,
    messages: [],

    addMessage(msg) {
        this.messages.push(msg);
        console.log(`  Message: ${msg}`);
    },

    closeEnchantmentDialog() {
        console.log('  Dialog closed');
    },

    updateUI() {
        // Mock
    },

    render() {
        // Mock
    }
};

// Test 1: EnchantmentScroll on weapon
console.log('Test 1: Applying enchantment to a weapon');
testGame.messages = [];
const weapon = new Weapon(0, 0, 'Dagger');
weapon.enchantments = {};

const enchantScroll = new EnchantmentScroll(0, 0);
enchantScroll.enchantmentPower = 2;

console.log(`  Weapon before: ${weapon.name}, damage enchantment: ${weapon.enchantments.damage || 0}`);
enchantScroll.onSelectItem(testGame, weapon);
console.log(`  Weapon after: ${weapon.name}, damage enchantment: ${weapon.enchantments.damage || 0}`);

if (weapon.enchantments.damage === 2) {
    console.log('  ✓ Enchantment applied correctly!\n');
} else {
    console.log('  ✗ Enchantment failed!\n');
}

// Test 2: EnchantmentScroll on armor
console.log('Test 2: Applying enchantment to armor');
testGame.messages = [];
const armor = new Armor(0, 0, 'Leather Armor');
armor.enchantments = {};

const enchantScroll2 = new EnchantmentScroll(0, 0);
enchantScroll2.enchantmentPower = 1;

console.log(`  Armor before: ${armor.name}, defense enchantment: ${armor.enchantments.defense || 0}`);
enchantScroll2.onSelectItem(testGame, armor);
console.log(`  Armor after: ${armor.name}, defense enchantment: ${armor.enchantments.defense || 0}`);

if (armor.enchantments.defense === 1) {
    console.log('  ✓ Enchantment applied correctly!\n');
} else {
    console.log('  ✗ Enchantment failed!\n');
}

// Test 3: UncurseScroll on cursed item
console.log('Test 3: Applying uncurse to cursed weapon');
testGame.messages = [];
const cursedWeapon = new Weapon(0, 0, 'Cursed Sword');
cursedWeapon.cursed = true;
cursedWeapon.removeCurse = function() {
    this.cursed = false;
};

const uncurseScroll = new UncurseScroll(0, 0);

console.log(`  Weapon before: ${cursedWeapon.name}, cursed: ${cursedWeapon.cursed}`);
uncurseScroll.onSelectItem(testGame, cursedWeapon);
console.log(`  Weapon after: ${cursedWeapon.name}, cursed: ${cursedWeapon.cursed}`);

if (!cursedWeapon.cursed) {
    console.log('  ✓ Curse removed correctly!\n');
} else {
    console.log('  ✗ Uncurse failed!\n');
}

// Test 4: Verify onSelectItem exists on scrolls, not items
console.log('Test 4: Verifying onSelectItem method location');
const testWeapon = new Weapon(0, 0, 'Test Sword');
const testScroll = new EnchantmentScroll(0, 0);

console.log(`  Weapon has onSelectItem: ${typeof testWeapon.onSelectItem === 'function'}`);
console.log(`  Scroll has onSelectItem: ${typeof testScroll.onSelectItem === 'function'}`);

if (typeof testWeapon.onSelectItem !== 'function' && typeof testScroll.onSelectItem === 'function') {
    console.log('  ✓ Correct: onSelectItem is on scroll, not item!\n');
} else {
    console.log('  ✗ Unexpected: method location is wrong!\n');
}

console.log('✅ All enchantment scroll tests completed!');

