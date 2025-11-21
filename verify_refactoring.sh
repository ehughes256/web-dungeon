#!/bin/bash
# Quick verification script to check if the refactoring is working correctly

echo "=== Checking File Modifications ==="
echo ""

echo "1. Checking items.js for lazy getter..."
if grep -q "static get itemTypes()" items.js; then
    echo "   ✓ items.js has lazy-initialized itemTypes getter"
else
    echo "   ✗ ERROR: items.js missing lazy getter"
    exit 1
fi

echo ""
echo "2. Checking scrolls.js exists..."
if [ -f "scrolls.js" ]; then
    echo "   ✓ scrolls.js exists"
    SCROLL_CLASSES=$(grep -c "^class.*Scroll extends" scrolls.js)
    echo "   ✓ Found $SCROLL_CLASSES scroll classes"
else
    echo "   ✗ ERROR: scrolls.js not found"
    exit 1
fi

echo ""
echo "3. Running Node.js test..."
node << 'NODESCRIPT'
const items = require('./items.js');
const scrolls = require('./scrolls.js');
Object.assign(global, items, scrolls);

try {
    initializeScrollMagicPhrases();
    const types = ItemFactory.itemTypes;
    const scrollCount = types.filter(t => t.class.name.includes('Scroll')).length;
    const scroll = new PsionicScroll(0, 0);

    if (scrollCount === 7 && scroll.name === 'Psionic Scroll') {
        console.log('   ✓ All scroll classes load correctly');
        console.log('   ✓ ItemFactory can access scroll classes');
        console.log('   ✓ Scroll instances can be created');
        process.exit(0);
    } else {
        console.log('   ✗ ERROR: Unexpected results');
        process.exit(1);
    }
} catch (e) {
    console.log('   ✗ ERROR:', e.message);
    process.exit(1);
}
NODESCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "=== All Checks Passed! ==="
    echo ""
    echo "If you're still seeing errors in the browser:"
    echo "1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
    echo "2. Or open test_browser_load.html to verify"
    echo ""
else
    echo ""
    echo "=== Tests Failed ==="
    exit 1
fi

