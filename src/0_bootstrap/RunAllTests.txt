/**
 * MOH TIME OS v2.0 - RUN ALL TESTS
 *
 * Master function to execute all system tests
 * Run this from the Google Apps Script editor
 */

/**
 * MAIN TEST RUNNER - Execute this function
 */
function RUN_ALL_TESTS() {
  Logger.log('='.repeat(80));
  Logger.log('MOH TIME OS v2.0 - COMPREHENSIVE SYSTEM TEST');
  Logger.log('Starting at: ' + new Date().toString());
  Logger.log('='.repeat(80));

  const allResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    errors: [],
    summary: null
  };

  // Test 1: Core System Bootstrap
  Logger.log('\n[1/10] Testing System Bootstrap...');
  try {
    completeSetup();
    allResults.tests.push({ name: 'Bootstrap', status: 'PASS' });
    Logger.log('✅ Bootstrap: PASS');
  } catch (e) {
    allResults.errors.push({ test: 'Bootstrap', error: e.toString() });
    Logger.log('❌ Bootstrap: FAIL - ' + e.toString());
  }

  // Test 2: Container Services
  Logger.log('\n[2/10] Testing Container Services...');
  try {
    const hasContainer = typeof container !== 'undefined';
    const hasSmartLogger = hasContainer && container.has(SERVICES.SmartLogger);
    const hasErrorHandler = hasContainer && container.has(SERVICES.ErrorHandler);
    const hasConfigManager = hasContainer && container.has(SERVICES.ConfigManager);

    if (hasContainer && hasSmartLogger && hasErrorHandler && hasConfigManager) {
      allResults.tests.push({ name: 'Container', status: 'PASS' });
      Logger.log('✅ Container: PASS');
    } else {
      throw new Error('Missing container services');
    }
  } catch (e) {
    allResults.errors.push({ test: 'Container', error: e.toString() });
    Logger.log('❌ Container: FAIL - ' + e.toString());
  }

  // Test 3: Logging Infrastructure
  Logger.log('\n[3/10] Testing Logging Infrastructure...');
  try {
    // Test LoggerFacade
    LoggerFacade.info('TEST', 'Testing LoggerFacade');
    LoggerFacade.warn('TEST', 'Warning test');
    LoggerFacade.error('TEST', 'Error test');
    LoggerFacade.debug('TEST', 'Debug test');

    // Test SmartLogger if available
    if (container && container.has(SERVICES.SmartLogger)) {
      const logger = container.get(SERVICES.SmartLogger);
      logger.info('TEST', 'SmartLogger test');
    }

    allResults.tests.push({ name: 'Logging', status: 'PASS' });
    Logger.log('✅ Logging: PASS');
  } catch (e) {
    allResults.errors.push({ test: 'Logging', error: e.toString() });
    Logger.log('❌ Logging: FAIL - ' + e.toString());
  }

  // Test 4: Enum Definitions
  Logger.log('\n[4/10] Testing Enum Definitions...');
  try {
    // Test STATUS enum
    if (!STATUS || !STATUS.ARCHIVED || STATUS.ARCHIVED !== 'ARCHIVED') {
      throw new Error('STATUS.ARCHIVED not defined correctly');
    }

    // Test PRIORITY enum
    if (!PRIORITY || !PRIORITY.CRITICAL) {
      throw new Error('PRIORITY enum not defined');
    }

    // Test LANE enum
    if (!LANE || !LANE.OPERATIONAL) {
      throw new Error('LANE enum not defined');
    }

    allResults.tests.push({ name: 'Enums', status: 'PASS' });
    Logger.log('✅ Enums: PASS - STATUS.ARCHIVED = ' + STATUS.ARCHIVED);
  } catch (e) {
    allResults.errors.push({ test: 'Enums', error: e.toString() });
    Logger.log('❌ Enums: FAIL - ' + e.toString());
  }

  // Test 5: Error Classes
  Logger.log('\n[5/10] Testing Error Classes...');
  try {
    const dbError = new DatabaseError('Test DB error');
    const valError = new ValidationError('Test validation');
    const apiError = new ApiError('Test API error');

    if (dbError instanceof Error && valError instanceof Error && apiError instanceof Error) {
      allResults.tests.push({ name: 'ErrorClasses', status: 'PASS' });
      Logger.log('✅ Error Classes: PASS');
    } else {
      throw new Error('Error classes not properly defined');
    }
  } catch (e) {
    allResults.errors.push({ test: 'ErrorClasses', error: e.toString() });
    Logger.log('❌ Error Classes: FAIL - ' + e.toString());
  }

  // Test 6: TimeZone Functions
  Logger.log('\n[6/10] Testing TimeZone Functions...');
  try {
    const now = TimeZoneAwareDate.now();
    const parsed = TimeZoneAwareDate.parseISO(now);
    const formatted = TimeZoneAwareDate.formatForDisplay(parsed);

    Logger.log('   Current time: ' + now);
    Logger.log('   Formatted: ' + formatted);

    allResults.tests.push({ name: 'TimeZone', status: 'PASS' });
    Logger.log('✅ TimeZone: PASS');
  } catch (e) {
    allResults.errors.push({ test: 'TimeZone', error: e.toString() });
    Logger.log('❌ TimeZone: FAIL - ' + e.toString());
  }

  // Test 7: Utility Functions
  Logger.log('\n[7/10] Testing Utility Functions...');
  try {
    const id = generateId();
    const json = safeJsonParse('{"test": true}');
    const array = ensureArray('test');

    if (id && json && json.test && array && array.length === 1) {
      allResults.tests.push({ name: 'Utilities', status: 'PASS' });
      Logger.log('✅ Utilities: PASS');
    } else {
      throw new Error('Utility functions not working');
    }
  } catch (e) {
    allResults.errors.push({ test: 'Utilities', error: e.toString() });
    Logger.log('❌ Utilities: FAIL - ' + e.toString());
  }

  // Test 8: Console Elimination
  Logger.log('\n[8/10] Testing Console Elimination...');
  try {
    const consoleStatus = getConsoleEliminationStatus();
    Logger.log('   Production ready: ' + consoleStatus.productionReady);
    Logger.log('   Console count: ' + consoleStatus.consoleCount);

    if (consoleStatus.productionReady && consoleStatus.consoleCount === 0) {
      allResults.tests.push({ name: 'ConsoleElimination', status: 'PASS' });
      Logger.log('✅ Console Elimination: PASS');
    } else {
      throw new Error('Console statements still present: ' + consoleStatus.consoleCount);
    }
  } catch (e) {
    allResults.errors.push({ test: 'ConsoleElimination', error: e.toString() });
    Logger.log('❌ Console Elimination: FAIL - ' + e.toString());
  }

  // Test 9: Service Functionality
  Logger.log('\n[9/10] Testing Service Functionality...');
  try {
    // Test ConfigManager
    const configManager = container.get(SERVICES.ConfigManager);
    const testConfig = configManager.get('SCHEDULING_ENABLED', 'true');
    Logger.log('   Config test: SCHEDULING_ENABLED = ' + testConfig);

    // Test PersistentStore
    const store = container.get(SERVICES.PersistentStore);
    store.set('TEST_KEY', 'TEST_VALUE');
    const retrieved = store.get('TEST_KEY');

    if (retrieved === 'TEST_VALUE') {
      allResults.tests.push({ name: 'Services', status: 'PASS' });
      Logger.log('✅ Services: PASS');
    } else {
      throw new Error('Service functionality test failed');
    }
  } catch (e) {
    allResults.errors.push({ test: 'Services', error: e.toString() });
    Logger.log('❌ Services: FAIL - ' + e.toString());
  }

  // Test 10: Final System Health
  Logger.log('\n[10/10] Testing System Health...');
  try {
    const errorHandler = container.get(SERVICES.ErrorHandler);
    const health = errorHandler.getHealth();
    Logger.log('   Health status: ' + JSON.stringify(health));

    allResults.tests.push({ name: 'SystemHealth', status: 'PASS' });
    Logger.log('✅ System Health: PASS');
  } catch (e) {
    allResults.errors.push({ test: 'SystemHealth', error: e.toString() });
    Logger.log('❌ System Health: FAIL - ' + e.toString());
  }

  // Calculate Summary
  const passedCount = allResults.tests.filter(t => t.status === 'PASS').length;
  const totalTests = 10;
  const passRate = Math.round((passedCount / totalTests) * 100);

  allResults.summary = {
    totalTests: totalTests,
    passed: passedCount,
    failed: totalTests - passedCount,
    passRate: passRate + '%',
    verdict: passedCount === totalTests ? 'PRODUCTION READY' : 'ISSUES DETECTED'
  };

  // Log Final Results
  Logger.log('\n' + '='.repeat(80));
  Logger.log('TEST RESULTS SUMMARY');
  Logger.log('='.repeat(80));
  Logger.log('Total Tests: ' + totalTests);
  Logger.log('Passed: ' + passedCount);
  Logger.log('Failed: ' + (totalTests - passedCount));
  Logger.log('Pass Rate: ' + passRate + '%');
  Logger.log('\nFinal Verdict: ' + allResults.summary.verdict);

  if (allResults.errors.length > 0) {
    Logger.log('\nErrors Detected:');
    allResults.errors.forEach(function(err) {
      Logger.log('  - ' + err.test + ': ' + err.error);
    });
  }

  Logger.log('\n' + '='.repeat(80));
  Logger.log('MOH TIME OS v2.0 - TEST COMPLETE');
  Logger.log('Completed at: ' + new Date().toString());
  Logger.log('='.repeat(80));

  // Return results for programmatic access
  return allResults;
}

/**
 * Quick system check - run this for a rapid test
 */
function QUICK_SYSTEM_CHECK() {
  Logger.log('MOH TIME OS v2.0 - Quick System Check');
  Logger.log('=====================================');

  try {
    // 1. Bootstrap
    completeSetup();
    Logger.log('✅ Bootstrap successful');

    // 2. Container
    Logger.log('✅ Container available: ' + (typeof container !== 'undefined'));

    // 3. Logging
    LoggerFacade.info('QuickCheck', 'System operational');
    Logger.log('✅ Logging functional');

    // 4. Critical enum
    Logger.log('✅ STATUS.ARCHIVED = ' + STATUS.ARCHIVED);

    // 5. Console check
    const consoleStatus = getConsoleEliminationStatus();
    Logger.log('✅ Console statements: ' + consoleStatus.consoleCount);

    Logger.log('\nSYSTEM STATUS: OPERATIONAL');

  } catch (e) {
    Logger.log('❌ SYSTEM ERROR: ' + e.toString());
    Logger.log('\nSYSTEM STATUS: FAILED');
  }
}

/**
 * Entry point for manual testing
 */
function MANUAL_TEST_ENTRY() {
  Logger.log('Choose a test to run:');
  Logger.log('1. RUN_ALL_TESTS() - Comprehensive test');
  Logger.log('2. QUICK_SYSTEM_CHECK() - Quick verification');
  Logger.log('3. runConsoleEliminationVerification() - Console check');
  Logger.log('4. testAllFunctions() - Function availability');
  Logger.log('\nRun the desired function from the Apps Script editor.');
}