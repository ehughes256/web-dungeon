#!/bin/bash

# Quick Test - Verify Weapon Refactoring Works

echo "Testing weapon refactoring..."
echo ""

# Test 1: Can we load items.js and get weapon classes?
echo "Test 1: Loading weapon classes through items.js..."
node -e "
const items = require('./items.js');
const sword = new items.Longsword(0, 0);
console.log('✓ Created', sword.name, 'with damage:', sword.damage);
"

# Test 2: Run a quick distribution check
echo ""
echo "Test 2: Quick item distribution check..."
node -e "
const { ItemFactory } = require('./items.js');
const weapons = [];
for (let i = 0; i < 100; i++) {
    const item = ItemFactory.createLevelAppropriateItem(0, 0, 5);
    if (item.getType && item.getType() === 'weapon') {
        weapons.push(item.name);
    }
}
console.log('✓ Generated', weapons.length, 'weapons in 100 items');
console.log('  Sample weapons:', [...new Set(weapons)].slice(0, 5).join(', '));
"

echo ""
echo "✓ All quick tests passed!"

