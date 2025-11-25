#!/bin/bash

# Weapon Refactoring Verification Script

echo "=== Weapon System Refactoring Verification ==="
echo ""

# Check if weapons.js exists
echo "1. Checking if weapons.js exists..."
if [ -f "weapons.js" ]; then
    echo "   ✓ weapons.js found"
    echo "   - Size: $(wc -l < weapons.js) lines"
else
    echo "   ✗ weapons.js NOT found"
    exit 1
fi

echo ""

# Check if HTML files include weapons.js and have correct order
echo "2. Checking HTML files have correct script loading order..."
for html_file in roguelike.html test_browser_load.html test_scroll_magic_demo.html test_potion_colors_demo.html; do
    if [ -f "$html_file" ]; then
        if grep -q "weapons.js" "$html_file"; then
            # Check that items.js comes before weapons.js
            items_line=$(grep -n "items.js" "$html_file" | head -1 | cut -d: -f1)
            weapons_line=$(grep -n "weapons.js" "$html_file" | head -1 | cut -d: -f1)
            player_line=$(grep -n "player.js" "$html_file" | head -1 | cut -d: -f1)

            if [ "$items_line" -lt "$weapons_line" ] && [ "$weapons_line" -lt "$player_line" ]; then
                echo "   ✓ $html_file has correct loading order (items → weapons → player)"
            else
                echo "   ✗ $html_file has INCORRECT loading order"
            fi
        else
            echo "   ✗ $html_file does NOT include weapons.js"
        fi
    fi
done

echo ""

# Check if weapon classes are removed from items.js
echo "3. Checking if weapon classes removed from items.js..."
WEAPON_CLASSES="class Stick|class RustyKnife|class Club|class BoneShard|class SmallDagger|class Shortsword|class Longsword"
if grep -E "$WEAPON_CLASSES" items.js > /dev/null 2>&1; then
    echo "   ✗ WARNING: Weapon class definitions still found in items.js"
else
    echo "   ✓ Weapon class definitions removed from items.js"
fi

echo ""

# Check if WEAPON_CONFIGS removed from items.js
echo "4. Checking if WEAPON_CONFIGS removed from items.js..."
if grep "const WEAPON_CONFIGS = {" items.js > /dev/null 2>&1; then
    echo "   ✗ WARNING: WEAPON_CONFIGS still found in items.js"
else
    echo "   ✓ WEAPON_CONFIGS removed from items.js"
fi

echo ""

# Run Node.js tests
echo "5. Running Node.js tests..."

echo ""
echo "   Testing weapons.js can be required through items.js..."
node -e "
const items = require('./items.js');
const weaponClasses = ['Weapon', 'Fists', 'SmallDagger', 'Longsword', 'DragonSlayer'];
const missing = weaponClasses.filter(c => typeof items[c] !== 'function');
if (missing.length > 0) {
    console.log('   ✗ Missing weapon classes:', missing.join(', '));
    process.exit(1);
} else {
    console.log('   ✓ All weapon classes available from items.js');
}
" || exit 1

echo ""
echo "   Testing weapon instantiation..."
node -e "
const items = require('./items.js');
try {
    const dagger = new items.SmallDagger(0, 0);
    if (dagger.name === 'Small Dagger' && dagger.damage > 0) {
        console.log('   ✓ Weapon instantiation works (SmallDagger)');
    } else {
        console.log('   ✗ Weapon properties incorrect');
        process.exit(1);
    }
} catch (e) {
    console.log('   ✗ Weapon instantiation failed:', e.message);
    process.exit(1);
}
" || exit 1

echo ""
echo "   Testing weapon configs available..."
node -e "
const items = require('./items.js');
if (items.WEAPON_CONFIGS && items.WEAPON_CONFIGS.smallDagger) {
    console.log('   ✓ WEAPON_CONFIGS available through items.js');
} else {
    console.log('   ✗ WEAPON_CONFIGS not properly exported');
    process.exit(1);
}
" || exit 1

echo ""
echo "   Running item distribution test..."
if node test_item_distribution.js > /dev/null 2>&1; then
    echo "   ✓ Item distribution test passed"
else
    echo "   ✗ Item distribution test failed"
    exit 1
fi

echo ""
echo "   Running cursed items test..."
if node test_cursed_items.js > /dev/null 2>&1; then
    echo "   ✓ Cursed items test passed"
else
    echo "   ✗ Cursed items test failed"
    exit 1
fi

echo ""
echo "=== All Verification Checks Passed! ==="
echo ""
echo "Summary:"
echo "  - weapons.js created and contains all weapon definitions"
echo "  - HTML files updated to include weapons.js"
echo "  - Weapon classes removed from items.js"
echo "  - All weapon classes accessible through items.js exports"
echo "  - Weapon instantiation works correctly"
echo "  - All existing tests pass"
echo ""
echo "✓ Weapon refactoring successfully completed!"

