/**
 * MOH TIME OS v2.0 - SIMPLE TEST FILE
 *
 * RUN THE FUNCTION: test()
 */

/**
 * MAIN TEST FUNCTION - RUN THIS
 */
function test() {
  Logger.log('========================================');
  Logger.log('MOH TIME OS v2.0 - SYSTEM TEST');
  Logger.log('========================================');

  try {
    // Test 1: Bootstrap
    Logger.log('\nTest 1: Bootstrap...');
    completeSetup();
    Logger.log('✅ Bootstrap: PASS');
  } catch (e) {
    Logger.log('❌ Bootstrap: FAIL - ' + e.toString());
    return;
  }

  // Test 2: Container
  Logger.log('\nTest 2: Container...');
  if (typeof container !== 'undefined') {
    Logger.log('✅ Container: PASS');
  } else {
    Logger.log('❌ Container: FAIL');
    return;
  }

  // Test 3: Logging
  Logger.log('\nTest 3: Logging...');
  try {
    LoggerFacade.info('TEST', 'Test message');
    Logger.log('✅ Logging: PASS');
  } catch (e) {
    Logger.log('❌ Logging: FAIL - ' + e.toString());
  }

  // Test 4: STATUS.ARCHIVED
  Logger.log('\nTest 4: STATUS.ARCHIVED...');
  if (STATUS && STATUS.ARCHIVED === 'ARCHIVED') {
    Logger.log('✅ STATUS.ARCHIVED: PASS (value = ' + STATUS.ARCHIVED + ')');
  } else {
    Logger.log('❌ STATUS.ARCHIVED: FAIL');
  }

  // Test 5: Console Elimination
  Logger.log('\nTest 5: Console Elimination...');
  try {
    const status = getConsoleEliminationStatus();
    Logger.log('Console statements: ' + status.consoleCount);
    if (status.productionReady) {
      Logger.log('✅ Console Elimination: PASS');
    } else {
      Logger.log('❌ Console Elimination: FAIL');
    }
  } catch (e) {
    Logger.log('❌ Console test error: ' + e.toString());
  }

  // Test 6: Error Classes
  Logger.log('\nTest 6: Error Classes...');
  try {
    const err = new DatabaseError('Test');
    Logger.log('✅ Error Classes: PASS');
  } catch (e) {
    Logger.log('❌ Error Classes: FAIL - ' + e.toString());
  }

  // Test 7: TimeZone
  Logger.log('\nTest 7: TimeZone Functions...');
  try {
    const now = TimeZoneAwareDate.now();
    Logger.log('Current time: ' + now);
    Logger.log('✅ TimeZone: PASS');
  } catch (e) {
    Logger.log('❌ TimeZone: FAIL - ' + e.toString());
  }

  // Test 8: Services
  Logger.log('\nTest 8: Services...');
  try {
    const hasSmartLogger = container.has(SERVICES.SmartLogger);
    const hasConfigManager = container.has(SERVICES.ConfigManager);
    if (hasSmartLogger && hasConfigManager) {
      Logger.log('✅ Services: PASS');
    } else {
      Logger.log('❌ Services: Some missing');
    }
  } catch (e) {
    Logger.log('❌ Services: FAIL - ' + e.toString());
  }

  Logger.log('\n========================================');
  Logger.log('TEST COMPLETE');
  Logger.log('========================================');
  Logger.log('Check the log for any ❌ FAIL marks');
  Logger.log('All ✅ PASS = System is production ready');
}

/**
 * Alternative test function names
 */
function runTest() {
  test();
}

function testSystem() {
  test();
}

function RUN_ALL_TESTS_SIMPLE() {
  test();
}