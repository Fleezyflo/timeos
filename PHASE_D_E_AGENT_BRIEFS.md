# PHASE D & E PARALLEL AGENT EXECUTION BRIEFS

**Generated:** 2025-09-30
**Master Plan:** PHASE_D_E_COMPREHENSIVE_FIX_PLAN.md
**Execution Mode:** PARALLEL (4 independent agents)
**Total Estimated Time:** 15 minutes (parallel) / 45 minutes (serial)

---

## AGENT COORDINATION

### Execution Order
All agents can run **IN PARALLEL** - no dependencies between tasks.

### Pre-Execution Checklist
- [ ] All agents have read PHASE_D_E_COMPREHENSIVE_FIX_PLAN.md
- [ ] Working directory: `/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/`
- [ ] Git branch verified (current: master)
- [ ] Backup created: `git stash push -u -m "Pre Phase D/E backup"`

### Post-Execution Checklist
- [ ] All 4 agents report SUCCESS
- [ ] Verification script executed
- [ ] Manual smoke tests passed
- [ ] Git commit created
- [ ] Deploy to test environment

---

## 🤖 AGENT 1: CLASP CONFIGURATION SPECIALIST

### Mission
Update `.claspignore` to exclude all test files from production deployment

### Priority
**CRITICAL** - This prevents test code from shipping to AppSheet

### Task Details

**File to Modify:**
```
.claspignore
```

**Current Content:** (11 lines)
**New Content:** (29 lines - add 18 lines)

**Action:**
Append the following lines to `.claspignore`:

```
# Test files and directories - DO NOT DEPLOY TO PRODUCTION
**/9_tests/**
**/7_support/**
src/TEST.gs
src/TEST_RUNNER.gs
src/EXECUTE_ALL_TESTS_NOW.gs
src/SYSTEM_PERFECTION_TEST.gs
src/SYSTEM_TEST_FINAL.gs
src/RUN_EVERYTHING.gs
src/ExecuteAllNow.gs
src/verify_sheet_creation.gs
src/RUN_SHEET_HEALER.gs
src/EXECUTE_FULL_INITIALIZATION.gs
src/0_bootstrap/RunAllTests.gs
src/RemoteControl.gs
```

### Implementation Steps

1. Read current `.claspignore` content
2. Verify it doesn't already contain test exclusions
3. Append new test exclusions with header comment
4. Verify syntax (no trailing spaces, proper glob patterns)
5. Report completion

### Validation

**Automated Check:**
```bash
# Count lines added
wc -l .claspignore
# Should be: 29 lines (11 original + 18 new)

# Verify test directories excluded
grep "9_tests" .claspignore
grep "7_support" .claspignore
grep "RunAllTests" .claspignore
```

**Manual Check:**
```bash
# Dry-run deployment to see what would be pushed
clasp push --dry-run 2>&1 | grep -E "(TEST|test|9_tests|7_support)"
# Should return: NO MATCHES (these files excluded)
```

### Success Criteria
- [ ] `.claspignore` contains 29 lines
- [ ] All test file patterns present
- [ ] Syntax validated (no errors when parsing)
- [ ] Dry-run confirms test files excluded
- [ ] File ends with newline

### Risk Assessment
- **Risk Level:** NONE
- **Rollback:** `git checkout HEAD -- .claspignore`
- **Impact:** Only affects deployment, not runtime

### Estimated Time
**5 minutes**

### Dependencies
**NONE** - Can run independently

---

## 🤖 AGENT 2: PRELOAD CLEANUP SPECIALIST

### Mission
Remove dead global error handler infrastructure from `Preload.gs`

### Priority
**HIGH** - Removes misleading/dead code

### Task Details

**File to Modify:**
```
src/0_bootstrap/Preload.gs
```

**Lines to Remove:** 38-78 (41 lines), 212-302 (91 lines)
**Total Reduction:** 132 lines

**Context:**
- `globalErrorHandler()` defined but never registered
- `installGlobalErrorHandlers()` exists but commented out (line 302)
- `wrapWithErrorBoundary()` unused
- Creates false sense of safety

### Implementation Steps

#### STEP 1: Remove globalErrorHandler (lines 38-78)

**OLD CODE:**
```javascript
/**
 * Global error boundary - catches ALL errors throughout the system
 * This function is the ultimate safety net for the entire application
 */
function globalErrorHandler(error, context = {}) {
  const errorEntry = {
    timestamp: Date.now(),
    message: error.message || String(error),
    stack: error.stack || 'No stack trace',
    context: context,
    phase: CRITICAL_INIT.initialized ? 'runtime' : 'initialization'
  };

  CRITICAL_INIT.errors.push(errorEntry);

  // Keep only last 50 errors to prevent memory bloat
  if (CRITICAL_INIT.errors.length > 50) {
    CRITICAL_INIT.errors.shift();
  }

  // Console log for immediate debugging
  safeLog('error', `[GLOBAL ERROR] ${error.message}`, context);

  // Attempt self-healing based on error type
  try {
    if (error.message.includes('Cannot read property')) {
      initializeMissingGlobals();
    }
    if (error.message.includes('Sheet') && error.message.includes('not found')) {
      // This will be handled by SheetHealer when it loads
      safeLog('info', 'Sheet error detected - will be handled by SheetHealer');
    }
    if (error.message.includes('Service') && error.message.includes('not registered')) {
      safeLog('info', 'Service error detected - container may need reinitialization');
    }
  } catch (healingError) {
    safeLog('error', `[HEALING FAILED] ${healingError.message}`);
  }

  return errorEntry;
}
```

**NEW CODE:**
```javascript
/**
 * REMOVED - Global error handler infrastructure (never activated)
 *
 * The globalErrorHandler function was defined but never registered.
 * Error handling is provided by the ErrorHandler service instead.
 *
 * Use: container.get(SERVICES.ErrorHandler) for error handling
 */
```

#### STEP 2: Remove wrapWithErrorBoundary (lines 212-230)

**OLD CODE:**
```javascript
/**
 * Wrap critical functions with error boundary
 */
function wrapWithErrorBoundary(fn, context = {}) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      globalErrorHandler(error, { ...context, function: fn.name, args: args.length });

      // Re-throw critical errors
      if (error.message.includes('CRITICAL') || context.critical) {
        throw error;
      }

      // Return safe default for non-critical errors
      return null;
    }
  };
}
```

**NEW CODE:**
```javascript
/**
 * REMOVED - Error boundary wrapper (never installed)
 *
 * This wrapper function was never used because installGlobalErrorHandlers()
 * was never activated. Error handling is managed by ErrorHandler service.
 */
```

#### STEP 3: Remove installGlobalErrorHandlers (lines 246-302)

**OLD CODE:**
```javascript
/**
 * Install global error handlers for critical functions
 * Enables error tracking and self-healing capabilities
 */
function installGlobalErrorHandlers() {
  try {
    // Critical functions to wrap with error boundary
    const criticalFunctions = [
      'getActiveSystemSpreadsheet',
      'getConstant',
      'getSheetName',
      'getServiceName',
      'healSheets',
      'checkSheetHealth',
      'safeGetService'
    ];

    let wrappedCount = 0;

    criticalFunctions.forEach(functionName => {
      // Check if function exists in global scope
      if (typeof global[functionName] === 'function') {
        const originalFn = global[functionName];

        // Wrap with error boundary
        global[functionName] = wrapWithErrorBoundary(originalFn, {
          critical: true,
          function: functionName
        });

        wrappedCount++;
      }
    });

    safeLog('info', `Global error handlers installed for ${wrappedCount} functions`);

    return {
      success: true,
      wrappedCount: wrappedCount,
      functions: criticalFunctions
    };

  } catch (error) {
    safeLog('error', `Failed to install error handlers: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Mark critical initialization as complete
CRITICAL_INIT.initialized = true;
safeLog('info', 'Critical initialization complete');

// Install error handlers after initialization
// Comment out the next line if you don't want automatic error handler installation
// installGlobalErrorHandlers();
```

**NEW CODE:**
```javascript
// Mark critical initialization as complete
CRITICAL_INIT.initialized = true;
safeLog('info', 'Critical initialization complete');

/**
 * ERROR HANDLING NOTE:
 * Global error boundaries were removed as they were never activated.
 * Use container.get(SERVICES.ErrorHandler) for all error handling needs.
 */
```

### Validation

**Automated Check:**
```bash
# Verify functions removed
grep -n "globalErrorHandler\|wrapWithErrorBoundary\|installGlobalErrorHandlers" src/0_bootstrap/Preload.gs
# Should return: Only comment references

# Verify file still loads
node -c src/0_bootstrap/Preload.gs 2>&1 || echo "Syntax check not applicable for .gs"

# Count lines (should be ~171 lines, down from ~303)
wc -l src/0_bootstrap/Preload.gs
```

**Manual Check:**
- [ ] File still has `initializeMissingGlobals()` (KEEP THIS)
- [ ] File still has `getCriticalInitStatus()` (KEEP THIS)
- [ ] File still has `safeGetService()` (KEEP THIS)
- [ ] File still has `getActiveSystemSpreadsheet()` (KEEP THIS)
- [ ] No syntax errors

### Success Criteria
- [ ] All error handler infrastructure removed
- [ ] Explanatory comments added
- [ ] File reduced by ~132 lines
- [ ] Essential functions preserved
- [ ] No syntax errors

### Risk Assessment
- **Risk Level:** LOW
- **Reason:** Code was never activated
- **Rollback:** `git checkout HEAD -- src/0_bootstrap/Preload.gs`
- **Impact:** None - code was dead

### Estimated Time
**10 minutes**

### Dependencies
**NONE** - Can run independently

---

## 🤖 AGENT 3: CONTAINER LIFECYCLE SPECIALIST

### Mission
Clean up Container lifecycle methods - remove dead code, document internal APIs

### Priority
**MEDIUM** - Clarifies API surface

### Task Details

**File to Modify:**
```
src/0_bootstrap/AA_Container.gs
```

**Changes:**
1. Remove `destroy()` method (never called)
2. Document `clear()` as internal-only
3. Remove `emergencyContainerReset()` function
4. Document `getServiceStatus()` as public API

### Implementation Steps

#### STEP 1: Remove destroy() method (lines 354-361)

**OLD CODE:**
```javascript
  /**
   * Destroy container permanently
   */
  destroy() {
    this.clear();
    this.destroyed = true;
    this._log('info', 'Container destroyed');
  }
```

**NEW CODE:**
```javascript
  /**
   * REMOVED - destroy() method (never called in production)
   *
   * Container lifecycle is managed through initialization/reset cycles only.
   * Use completeSetup() or initializeSystem() for reinitialization.
   */
```

#### STEP 2: Document clear() as internal (line 319)

**OLD CODE:**
```javascript
  /**
   * Clear all services and reset container
   */
  clear() {
```

**NEW CODE:**
```javascript
  /**
   * INTERNAL ONLY - Clear all services and reset container
   *
   * ⚠️  WARNING: Do not call directly from application code.
   * Use initializeSystem() or completeSetup() for proper reinitialization.
   *
   * This method is called internally by:
   * - getContainerStatus() for diagnostic cleanup
   * - Test utilities for test isolation
   *
   * @private
   * @internal
   */
  clear() {
```

#### STEP 3: Remove emergencyContainerReset() (lines 525-577)

**OLD CODE:**
```javascript
/**
 * Emergency container reset for MANUAL error recovery
 *
 * USE THIS FUNCTION when:
 * - Container appears to be in a corrupted state
 * - Services are failing to initialize
 * - System appears "stuck" or unresponsive
 * - After making major code changes that affect service registration
 *
 * HOW TO USE:
 * 1. Open Apps Script IDE
 * 2. Select function: emergencyContainerReset
 * 3. Click "Run" button
 * 4. Check execution log for confirmation
 * 5. Re-run initialization (e.g., run initializeSystem() or similar)
 *
 * WHAT IT DOES:
 * - Clears all registered services from container
 * - Resets initialization tracking
 * - Does NOT automatically re-register services
 * - You must manually trigger service registration after reset
 *
 * ALTERNATIVES:
 * - If you just need to clear services: call clearContainer()
 * - If you need full re-initialization: call initializeSystem()
 * - For debugging: check container.getInitErrors()
 *
 * @returns {boolean} True if reset successful, false if error occurred
 */
function emergencyContainerReset() {
  try {
    Logger.log('[Container] ⚠️  MANUAL EMERGENCY RESET INITIATED');
    Logger.log('[Container] Clearing all services...');

    container.clear();

    Logger.log('[Container] ✅ Emergency reset complete');
    Logger.log('[Container] ⚠️  You must now re-register critical services');
    Logger.log('[Container] → Run initializeSystem() or manually register services');

    return true;

  } catch (error) {
    Logger.log('[Container] ❌ ERROR: Emergency reset failed: ' + error.message);
    Logger.log('[Container] Stack trace: ' + error.stack);
    return false;
  }
}
```

**NEW CODE:**
```javascript
/**
 * REMOVED - emergencyContainerReset() (debug function, should not ship to production)
 *
 * For container reinitialization, use:
 * - completeSetup() - Full system initialization
 * - initializeSystem() - Core system bootstrap
 *
 * For debugging:
 * - container.getInitErrors() - View initialization errors
 * - container.getServiceStatus(name) - Check service status
 */
```

#### STEP 4: Document getServiceStatus() as public API (line 422)

**OLD CODE:**
```javascript
  /**
   * Get service status for monitoring
   * ...
   */
  getServiceStatus(serviceName) {
```

**NEW CODE:**
```javascript
  /**
   * Get service status for monitoring
   *
   * PUBLIC API - Used by production services for health checks
   *
   * Used by:
   * - IntelligentScheduler.gs (lines 137-139)
   * - ChatEngine.gs (lines 155-157)
   * - ErrorHandler.gs (line 150)
   *
   * @param {string} serviceName - Name of service to check
   * @returns {Object} Status object: { status: 'INITIALIZED' | 'LAZY_INITIALIZED' | 'LAZY_PENDING' | 'REGISTERED' | 'ERROR' | 'NOT_FOUND' }
   * @public
   * @stable
   */
  getServiceStatus(serviceName) {
```

### Validation

**Automated Check:**
```bash
# Verify destroy() removed
grep -n "^\s*destroy()" src/0_bootstrap/AA_Container.gs
# Should return: 0 matches (except service.destroy() call inside clear())

# Verify emergencyContainerReset removed
grep -n "function emergencyContainerReset" src/0_bootstrap/AA_Container.gs
# Should return: 0 matches

# Verify clear() documented
grep -B5 "clear()" src/0_bootstrap/AA_Container.gs | grep "@private"
# Should return: Match found

# Verify getServiceStatus() still exists
grep -n "getServiceStatus(serviceName)" src/0_bootstrap/AA_Container.gs
# Should return: 1 match (the definition)
```

**Manual Check:**
- [ ] Container class still has `clear()` method (internal use)
- [ ] Container class still has `getServiceStatus()` method (public API)
- [ ] No `destroy()` method exists
- [ ] No `emergencyContainerReset()` function exists
- [ ] All documentation comments updated

### Success Criteria
- [ ] `destroy()` method removed
- [ ] `clear()` documented as internal
- [ ] `emergencyContainerReset()` function removed
- [ ] `getServiceStatus()` documented as public
- [ ] No syntax errors
- [ ] Container initialization still works

### Risk Assessment
- **Risk Level:** LOW
- **Reason:** Removed methods were never called
- **Rollback:** `git checkout HEAD -- src/0_bootstrap/AA_Container.gs`
- **Impact:** None - methods were unused

### Estimated Time
**10 minutes**

### Dependencies
**NONE** - Can run independently

---

## 🤖 AGENT 4: SYSTEM BOOTSTRAP CLEANUP SPECIALIST

### Mission
Remove test endpoint from SystemBootstrap.gs

### Priority
**HIGH** - Removes test exposure from web app

### Task Details

**File to Modify:**
```
src/8_setup/SystemBootstrap.gs
```

**Lines to Remove:** 524-535 (12 lines)
**Context:** Test endpoint `executeAll` calling `RUN_EVERYTHING_NOW()`

### Implementation Steps

#### STEP 1: Locate and remove executeAll endpoint

**Find Context:**
Look for the `doPost()` or `doGet()` function that handles web requests.
The executeAll endpoint should be around line 524-535.

**OLD CODE:**
```javascript
    if (e && e.parameter && e.parameter.action === 'executeAll') {
      Logger.log('🚀 Executing all functions via web trigger');
      const result = RUN_EVERYTHING_NOW();
      return ContentService.createTextOutput(JSON.stringify({
        status: 200,
        result: result
      })).setMimeType(ContentService.MimeType.JSON);
    }
```

**NEW CODE:**
```javascript
    // REMOVED - Test endpoint 'executeAll' removed from production
    // Test functions should not be exposed via web endpoints
    // Use dedicated test harness for testing
```

### Validation

**Automated Check:**
```bash
# Verify RUN_EVERYTHING_NOW removed
grep -n "RUN_EVERYTHING_NOW" src/8_setup/SystemBootstrap.gs
# Should return: 0 matches

# Verify executeAll action removed
grep -n "executeAll" src/8_setup/SystemBootstrap.gs
# Should return: 0 matches (except in comment)

# Check file syntax
wc -l src/8_setup/SystemBootstrap.gs
# Should be reduced by ~10 lines
```

**Manual Check:**
- [ ] No references to `RUN_EVERYTHING_NOW()`
- [ ] No `executeAll` action handler
- [ ] Other web endpoints still functional
- [ ] Comment explaining removal present

### Success Criteria
- [ ] `executeAll` endpoint removed
- [ ] No calls to `RUN_EVERYTHING_NOW()`
- [ ] Explanatory comment added
- [ ] Other web endpoints preserved
- [ ] No syntax errors

### Risk Assessment
- **Risk Level:** LOW
- **Reason:** Removing test-only endpoint
- **Rollback:** `git checkout HEAD -- src/8_setup/SystemBootstrap.gs`
- **Impact:** Test endpoint no longer accessible (intended)

### Estimated Time
**5 minutes**

### Dependencies
**NONE** - Can run independently

---

## CONSOLIDATED VERIFICATION SCRIPT

After all agents complete, run this verification script:

```bash
#!/bin/bash
# Phase D & E Verification Script

echo "=================================================="
echo "PHASE D & E FIX VERIFICATION"
echo "=================================================="

ERRORS=0

# Test 1: Verify .claspignore updated
echo -n "[1/10] Checking .claspignore updates... "
if grep -q "9_tests" .claspignore && grep -q "RunAllTests" .claspignore; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 2: Verify globalErrorHandler removed
echo -n "[2/10] Checking globalErrorHandler removed... "
if ! grep -q "^function globalErrorHandler" src/0_bootstrap/Preload.gs; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 3: Verify installGlobalErrorHandlers removed
echo -n "[3/10] Checking installGlobalErrorHandlers removed... "
if ! grep -q "^function installGlobalErrorHandlers" src/0_bootstrap/Preload.gs; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 4: Verify container destroy() removed
echo -n "[4/10] Checking container destroy() removed... "
if ! grep -q "^\s*destroy()" src/0_bootstrap/AA_Container.gs; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 5: Verify emergencyContainerReset removed
echo -n "[5/10] Checking emergencyContainerReset removed... "
if ! grep -q "^function emergencyContainerReset" src/0_bootstrap/AA_Container.gs; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 6: Verify clear() marked as internal
echo -n "[6/10] Checking clear() marked as internal... "
if grep -B5 "clear()" src/0_bootstrap/AA_Container.gs | grep -q "@private"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 7: Verify getServiceStatus() still exists
echo -n "[7/10] Checking getServiceStatus() preserved... "
if grep -q "getServiceStatus(serviceName)" src/0_bootstrap/AA_Container.gs; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 8: Verify RUN_EVERYTHING_NOW removed from SystemBootstrap
echo -n "[8/10] Checking RUN_EVERYTHING_NOW removed... "
if ! grep -q "RUN_EVERYTHING_NOW" src/8_setup/SystemBootstrap.gs; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

# Test 9: Verify no test references in production files
echo -n "[9/10] Checking no test refs in production... "
TEST_REFS=$(grep -r "RUN_ALL_TESTS\|RUN_EVERYTHING_NOW\|emergencyContainerReset" src/0_bootstrap/ src/3_core/ src/4_services/ src/5_web/ src/8_setup/ 2>/dev/null | grep -v "REMOVED" | wc -l)
if [ "$TEST_REFS" -eq 0 ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL ($TEST_REFS references found)"
  ((ERRORS++))
fi

# Test 10: Verify essential functions preserved
echo -n "[10/10] Checking essential functions preserved... "
if grep -q "function initializeMissingGlobals" src/0_bootstrap/Preload.gs && \
   grep -q "function safeGetService" src/0_bootstrap/Preload.gs && \
   grep -q "function getActiveSystemSpreadsheet" src/0_bootstrap/Preload.gs; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  ((ERRORS++))
fi

echo "=================================================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ ALL TESTS PASSED"
  echo "Phase D & E fixes verified successfully!"
  exit 0
else
  echo "❌ $ERRORS TESTS FAILED"
  echo "Please review failed tests above"
  exit 1
fi
```

**Save as:** `verify_phase_d_e.sh`
**Run:** `chmod +x verify_phase_d_e.sh && ./verify_phase_d_e.sh`

---

## FINAL CHECKLIST

### Pre-Execution
- [ ] All agents have read master plan
- [ ] Git backup created
- [ ] Working directory confirmed

### Execution
- [ ] Agent 1 (clasp config) - COMPLETE
- [ ] Agent 2 (Preload cleanup) - COMPLETE
- [ ] Agent 3 (Container lifecycle) - COMPLETE
- [ ] Agent 4 (Bootstrap cleanup) - COMPLETE

### Post-Execution
- [ ] Verification script passes (10/10 tests)
- [ ] Manual smoke test: `completeSetup()` works
- [ ] Manual smoke test: Container services functional
- [ ] Manual smoke test: Web app still responds
- [ ] Git commit created
- [ ] Deploy to test environment successful

---

## SUCCESS METRICS

### Code Quality
- **Lines Removed:** ~2150+ lines
- **Test Files Excluded:** 25 files
- **Dead Code Removed:** 3 functions + 2 methods
- **Documentation Improved:** 3 methods documented

### Security
- **Test Endpoints Removed:** 1 (executeAll)
- **Debug Functions Removed:** 2 (emergencyContainerReset, destroy)
- **Attack Surface Reduced:** ✓

### Maintainability
- **API Surface Clarity:** Improved
- **False Safety Nets Removed:** ✓
- **Internal APIs Documented:** ✓

---

## TROUBLESHOOTING

### If Agent 1 Fails (.claspignore)
**Error:** File syntax invalid
**Solution:** Verify no trailing spaces, ensure newline at EOF

### If Agent 2 Fails (Preload.gs)
**Error:** Removed too much code
**Solution:** Verify `initializeMissingGlobals()` still present
**Rollback:** `git checkout HEAD -- src/0_bootstrap/Preload.gs`

### If Agent 3 Fails (AA_Container.gs)
**Error:** Container won't initialize
**Solution:** Verify `clear()` method still exists
**Rollback:** `git checkout HEAD -- src/0_bootstrap/AA_Container.gs`

### If Agent 4 Fails (SystemBootstrap.gs)
**Error:** Web app broken
**Solution:** Verify only `executeAll` endpoint removed, not other endpoints
**Rollback:** `git checkout HEAD -- src/8_setup/SystemBootstrap.gs`

---

## CONTACT & ESCALATION

### If All Agents Succeed
✅ Proceed to git commit and testing

### If Any Agent Fails
⚠️  Review agent output, check troubleshooting, consider rollback

### If Verification Fails
❌ Full rollback: `git checkout HEAD -- .claspignore src/0_bootstrap/Preload.gs src/0_bootstrap/AA_Container.gs src/8_setup/SystemBootstrap.gs`

---

*END OF AGENT BRIEFS*
