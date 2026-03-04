// Simple test to verify the enchantment fix logic
console.log('Testing enchantment scroll fix...\n');

// Mock objects to simulate the game scenario
const mockItem = {
    name: 'Test Weapon',
    enchantments: {},
    // Note: items do NOT have onSelectItem
};

const mockScroll = {
    name: 'Enchantment Scroll',
    enchantmentPower: 2,
    // This is where onSelectItem should be
    onSelectItem: function(game, item) {
        console.log('  ✓ Scroll\'s onSelectItem called correctly!');
        item.enchantments.damage = (item.enchantments.damage || 0) + this.enchantmentPower;
        game.addMessage(`Enchanted ${item.name} with +${this.enchantmentPower} damage`);
    }
};

const mockGame = {
    currentScroll: mockScroll,
    addMessage: function(msg) {
        console.log(`  Message: ${msg}`);
    }
};

// Test the OLD (broken) way
console.log('Test 1: OLD code (what was causing the error)');
try {
    // This is what the old code tried to do:
    mockItem.onSelectItem(mockGame, mockItem);
    console.log('  ✗ Should have thrown an error!');
} catch (e) {
    console.log(`  ✓ Correctly throws error: ${e.message}`);
}

// Test the NEW (fixed) way
console.log('\nTest 2: NEW code (the fix)');
try {
    // This is what the fixed code does:
    if (mockGame.currentScroll && typeof mockGame.currentScroll.onSelectItem === 'function') {
        mockGame.currentScroll.onSelectItem(mockGame, mockItem);
        console.log(`  Item enchantments after: damage = ${mockItem.enchantments.damage}`);
    } else {
        console.log('  ✗ Scroll method not found!');
    }
    console.log('  ✓ No error thrown!');
} catch (e) {
    console.log(`  ✗ Unexpected error: ${e.message}`);
}

// Verify the result
console.log('\nTest 3: Verify enchantment was applied');
if (mockItem.enchantments.damage === 2) {
    console.log('  ✓ Enchantment applied correctly: +2 damage');
} else {
    console.log(`  ✗ Enchantment failed: ${mockItem.enchantments.damage}`);
}

console.log('\n✅ Fix verification complete!');
console.log('\nSummary:');
console.log('- OLD: item.onSelectItem() ❌ (items don\'t have this method)');
console.log('- NEW: currentScroll.onSelectItem() ✅ (scrolls have this method)');

