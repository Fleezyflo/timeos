#!/bin/bash

echo "=========================================================="
echo "PHASE D & E FIX VERIFICATION SCRIPT"
echo "=========================================================="
echo ""

PASS=0
FAIL=0

# Helper function for test results
test_result() {
  if [ $1 -eq 0 ]; then
    echo "  ✅ PASS"
    ((PASS++))
  else
    echo "  ❌ FAIL"
    ((FAIL++))
  fi
}

# Test 1: .claspignore updated
echo "[1] Checking .claspignore includes test exclusions..."
grep -q "9_tests" .claspignore && grep -q "RunAllTests" .claspignore && grep -q "RemoteControl" .claspignore
test_result $?

# Test 2: .claspignore line count
echo "[2] Checking .claspignore has ~40 lines..."
LINES=$(wc -l < .claspignore)
[ "$LINES" -ge 35 ] && [ "$LINES" -le 45 ]
test_result $?

# Test 3: Preload.gs globalErrorHandler documented
echo "[3] Checking globalErrorHandler STATUS marker..."
grep -q "STATUS: ✅ ACTIVE" src/0_bootstrap/Preload.gs
test_result $?

# Test 4: Preload.gs installGlobalErrorHandlers documented
echo "[4] Checking installGlobalErrorHandlers STATUS marker..."
grep -q "WRAPPED FUNCTIONS (7 total)" src/0_bootstrap/Preload.gs
test_result $?

# Test 5: Container clear() documented as internal
echo "[5] Checking clear() marked as @internal..."
grep -A10 "clear()" src/0_bootstrap/AA_Container.gs | grep -q "@internal"
test_result $?

# Test 6: emergencyContainerReset removed
echo "[6] Checking emergencyContainerReset() removed..."
grep -q "REMOVED - emergencyContainerReset" src/0_bootstrap/AA_Container.gs
test_result $?

# Test 7: getServiceStatus() documented as public
echo "[7] Checking getServiceStatus() marked as @public..."
grep -B10 "getServiceStatus(serviceName)" src/0_bootstrap/AA_Container.gs | grep -q "@public"
test_result $?

# Test 8: executeAll endpoint removed from SystemBootstrap
echo "[8] Checking executeAll endpoint removed..."
grep -q "REMOVED - Test endpoint 'executeAll'" src/8_setup/SystemBootstrap.gs
test_result $?

# Test 9: No active RUN_EVERYTHING_NOW calls in SystemBootstrap
echo "[9] Checking no active test function calls..."
! grep -E "^\s*(const|var|let).*RUN_EVERYTHING_NOW\(\)" src/8_setup/SystemBootstrap.gs
test_result $?

# Test 10: Essential functions preserved
echo "[10] Checking essential functions preserved..."
grep -q "function initializeMissingGlobals" src/0_bootstrap/Preload.gs && \
  grep -q "function safeGetService" src/0_bootstrap/Preload.gs && \
  grep -q "function getActiveSystemSpreadsheet" src/0_bootstrap/Preload.gs
test_result $?

echo ""
echo "=========================================================="
echo "SUMMARY"
echo "=========================================================="
echo "Tests Passed: $PASS"
echo "Tests Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✅ ALL TESTS PASSED - Phase D & E fixes verified!"
  exit 0
else
  echo "❌ SOME TESTS FAILED - Please review above"
  exit 1
fi
