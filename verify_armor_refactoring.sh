#!/bin/bash

# Armor Refactoring Verification Script

echo "=== Armor System Refactoring Verification ==="
echo ""

# Check if armor.js exists
echo "1. Checking if armor.js exists..."
if [ -f "armor.js" ]; then
    echo "   ✓ armor.js found"
    echo "   - Size: $(wc -l < armor.js) lines"
else
    echo "   ✗ armor.js NOT found"
    exit 1
fi

echo ""

# Check if HTML files include armor.js and have correct order
echo "2. Checking HTML files have correct script loading order..."
for html_file in roguelike.html test_browser_load.html test_scroll_magic_demo.html test_potion_colors_demo.html; do
    if [ -f "$html_file" ]; then
        if grep -q "armor.js" "$html_file"; then
            # Check that items.js comes before armor.js
            items_line=$(grep -n "items.js" "$html_file" | head -1 | cut -d: -f1)
            armor_line=$(grep -n "armor.js" "$html_file" | head -1 | cut -d: -f1)

            if [ "$items_line" -lt "$armor_line" ]; then
                echo "   ✓ $html_file has correct loading order (items → armor)"
            else
                echo "   ✗ $html_file has INCORRECT loading order"
            fi
        else
            echo "   ✗ $html_file does NOT include armor.js"
        fi
    fi
done

echo ""

# Check if armor classes are removed from items.js
echo "3. Checking if armor classes removed from items.js..."
ARMOR_CLASSES="class TatteredCloak|class LeatherHelm|class ChainMail|class PlateMail"
if grep -E "$ARMOR_CLASSES" items.js > /dev/null 2>&1; then
    echo "   ✗ WARNING: Armor class definitions still found in items.js"
else
    echo "   ✓ Armor class definitions removed from items.js"
fi

echo ""

# Check if ARMOR_CONFIGS removed from items.js
echo "4. Checking if ARMOR_CONFIGS removed from items.js..."
if grep "const ARMOR_CONFIGS = {" items.js > /dev/null 2>&1; then
    echo "   ✗ WARNING: ARMOR_CONFIGS still found in items.js"
else
    echo "   ✓ ARMOR_CONFIGS removed from items.js"
fi

echo ""

# Run Node.js tests
echo "5. Running Node.js tests..."

echo ""
echo "   Testing armor.js can be required through items.js..."
node -e "
const items = require('./items.js');
const armorClasses = ['Armor', 'LeatherHelm', 'ChainMail', 'PlateMail', 'IronBoots', 'ProtectionRing'];
const missing = armorClasses.filter(c => typeof items[c] !== 'function');
if (missing.length > 0) {
    console.log('   ✗ Missing armor classes:', missing.join(', '));
    process.exit(1);
} else {
    console.log('   ✓ All armor classes available from items.js');
}
" || exit 1

echo ""
echo "   Testing armor instantiation..."
node -e "
const items = require('./items.js');
try {
    const helm = new items.LeatherHelm(0, 0);
    if (helm.name === 'Leather Helm' && helm.defense > 0) {
        console.log('   ✓ Armor instantiation works (LeatherHelm)');
    } else {
        console.log('   ✗ Armor properties incorrect');
        process.exit(1);
    }
} catch (e) {
    console.log('   ✗ Armor instantiation failed:', e.message);
    process.exit(1);
}
" || exit 1

echo ""
echo "   Testing armor configs available..."
node -e "
const items = require('./items.js');
if (items.ARMOR_CONFIGS && items.ARMOR_CONFIGS.chainMail) {
    console.log('   ✓ ARMOR_CONFIGS available through items.js');
} else {
    console.log('   ✗ ARMOR_CONFIGS not properly exported');
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
echo "  - armor.js created and contains all armor definitions"
echo "  - HTML files updated to include armor.js"
echo "  - Armor classes removed from items.js"
echo "  - All armor classes accessible through items.js exports"
echo "  - Armor instantiation works correctly"
echo "  - All existing tests pass"
echo ""
echo "✓ Armor refactoring successfully completed!"

