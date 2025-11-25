#!/bin/bash
# Integration test for the global identification system

echo "════════════════════════════════════════════════════════════════"
echo "  Global Identification System - Integration Test Suite"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Run basic functionality test
echo "Test 1: Basic Auto-Identification"
echo "------------------------------------"
node test_global_identification.js
TEST1=$?
echo ""

# Run existing items test
echo "Test 2: Identifying Existing Items on Ground"
echo "----------------------------------------------"
node test_identification_existing_items.js
TEST2=$?
echo ""

# Run demonstration
echo "Test 3: Visual Demonstration"
echo "-----------------------------"
node test_identification_demo.js
TEST3=$?
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "  Test Results"
echo "════════════════════════════════════════════════════════════════"

if [ $TEST1 -eq 0 ] && [ $TEST2 -eq 0 ] && [ $TEST3 -eq 0 ]; then
    echo "✓ All tests passed!"
    echo ""
    echo "The global identification system is working correctly:"
    echo "  • New items auto-identify when type is known"
    echo "  • Existing items in inventory get identified"
    echo "  • Existing items on the ground get identified"
    echo "  • Different item types remain separate"
    echo ""
    exit 0
else
    echo "✗ Some tests failed"
    echo "  Test 1 (Basic): $([ $TEST1 -eq 0 ] && echo 'PASS' || echo 'FAIL')"
    echo "  Test 2 (Existing Items): $([ $TEST2 -eq 0 ] && echo 'PASS' || echo 'FAIL')"
    echo "  Test 3 (Demo): $([ $TEST3 -eq 0 ] && echo 'PASS' || echo 'FAIL')"
    exit 1
fi

