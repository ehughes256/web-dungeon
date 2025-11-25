#!/bin/bash
# Verification script for potion refactoring

echo "=== Potion Refactoring Verification ==="
echo ""

echo "1. Checking that potions.js exists and contains potion classes..."
if [ -f "potions.js" ]; then
    echo "   ✓ potions.js exists"

    if grep -q "class Potion extends Item" potions.js; then
        echo "   ✓ Potion class found"
    else
        echo "   ✗ Potion class NOT found"
    fi

    if grep -q "class HealthPotion extends Potion" potions.js; then
        echo "   ✓ HealthPotion class found"
    else
        echo "   ✗ HealthPotion class NOT found"
    fi

    if grep -q "class SpeedPotion extends Potion" potions.js; then
        echo "   ✓ SpeedPotion class found"
    else
        echo "   ✗ SpeedPotion class NOT found"
    fi

    if grep -q "POTION_COLORS" potions.js; then
        echo "   ✓ POTION_COLORS constant found"
    else
        echo "   ✗ POTION_COLORS constant NOT found"
    fi

    if grep -q "initializePotionColors" potions.js; then
        echo "   ✓ initializePotionColors function found"
    else
        echo "   ✗ initializePotionColors function NOT found"
    fi
else
    echo "   ✗ potions.js does NOT exist"
fi

echo ""
echo "2. Checking that items.js no longer contains potion class definitions..."
if grep -q "^class Potion extends Item" items.js; then
    echo "   ✗ Potion class still in items.js (should be removed)"
else
    echo "   ✓ Potion class removed from items.js"
fi

if grep -q "^class HealthPotion extends Potion" items.js; then
    echo "   ✗ HealthPotion class still in items.js (should be removed)"
else
    echo "   ✓ HealthPotion class removed from items.js"
fi

if grep -q "^class SpeedPotion extends Potion" items.js; then
    echo "   ✗ SpeedPotion class still in items.js (should be removed)"
else
    echo "   ✓ SpeedPotion class removed from items.js"
fi

echo ""
echo "3. Checking that HTML files include potions.js..."
if grep -q 'src="potions.js"' roguelike.html; then
    echo "   ✓ roguelike.html includes potions.js"
else
    echo "   ✗ roguelike.html does NOT include potions.js"
fi

if grep -q 'src="potions.js"' test_potion_colors_demo.html; then
    echo "   ✓ test_potion_colors_demo.html includes potions.js"
else
    echo "   ✗ test_potion_colors_demo.html does NOT include potions.js"
fi

if grep -q 'src="potions.js"' test_browser_load.html; then
    echo "   ✓ test_browser_load.html includes potions.js"
else
    echo "   ✗ test_browser_load.html does NOT include potions.js"
fi

echo ""
echo "4. Checking script load order in roguelike.html..."
if grep -A5 'src="items.js"' roguelike.html | grep -q 'src="potions.js"'; then
    echo "   ✓ potions.js loaded after items.js"
else
    echo "   ✗ potions.js NOT loaded after items.js"
fi

if grep -A5 'src="potions.js"' roguelike.html | grep -q 'src="game.js"'; then
    echo "   ✓ potions.js loaded before game.js"
else
    echo "   ✗ potions.js NOT loaded before game.js"
fi

echo ""
echo "5. Running Node.js test..."
if node test_potion_colors.js > /dev/null 2>&1; then
    echo "   ✓ test_potion_colors.js passes"
else
    echo "   ✗ test_potion_colors.js fails"
fi

echo ""
echo "=== Verification Complete ==="

