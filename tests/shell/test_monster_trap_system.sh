#!/bin/bash
# Run the monster trap triggering test suite

echo "════════════════════════════════════════════════════════════════"
echo "  Monster Trap Triggering - Test Suite"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Testing the implementation where:"
echo "  • Monsters can trigger traps when they move"
echo "  • Traps are discovered only when triggered in player's sight"
echo "  • Different trap types affect monsters appropriately"
echo ""
echo "Running tests..."
echo ""

node tests/monsters/test_monster_traps.js

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  ✓ All Tests Passed!"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Implementation verified:"
    echo "  ✓ Monsters trigger traps when moving"
    echo "  ✓ Traps discovered only when visible"
    echo "  ✓ Monsters take damage and can die from traps"
    echo "  ✓ Teleport traps move monsters"
    echo "  ✓ Player always discovers traps when triggering"
    echo ""
    exit 0
else
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  ✗ Tests Failed"
    echo "════════════════════════════════════════════════════════════════"
    exit 1
fi

