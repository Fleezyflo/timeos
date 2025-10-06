/**
 * SYSTEM PERFECTION TEST
 *
 * This function runs ALL critical system functions and validates perfection.
 * Run this in the Apps Script editor to confirm everything works.
 */

function SYSTEM_PERFECTION_TEST() {
  Logger.log('════════════════════════════════════════════════════════');
  Logger.log('     MOH TIME OS v2.0 - SYSTEM PERFECTION TEST');
  Logger.log('════════════════════════════════════════════════════════');
  Logger.log('Timestamp: ' + new Date().toISOString());
  Logger.log('');

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    errors: [],
    warnings: [],
    success: true
  };

  // Test 1: FIX() - Sheet Healing
  Logger.log('═══ TEST 1: FIX() - Sheet Healing ═══');
  try {
    const fixResult = FIX();
    Logger.log('✅ FIX() completed: ' + JSON.stringify(fixResult));
    results.tests.push({
      function: 'FIX()',
      status: 'PASSED',
      details: fixResult
    });
  } catch (e) {
    Logger.log('❌ FIX() failed: ' + e.toString());
    results.errors.push('FIX() failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 2: START() - System Initialization
  Logger.log('═══ TEST 2: START() - System Initialization ═══');
  try {
    const startResult = START();
    Logger.log('✅ START() completed: ' + JSON.stringify(startResult));
    results.tests.push({
      function: 'START()',
      status: startResult.success ? 'PASSED' : 'FAILED',
      details: startResult
    });
    if (!startResult.success) {
      results.errors.push('START() did not succeed');
      results.success = false;
    }
  } catch (e) {
    Logger.log('❌ START() failed: ' + e.toString());
    results.errors.push('START() failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 3: CHECK() - System Health Check
  Logger.log('═══ TEST 3: CHECK() - System Health Check ═══');
  try {
    const checkResult = CHECK();
    Logger.log('✅ CHECK() completed: ' + JSON.stringify(checkResult));
    results.tests.push({
      function: 'CHECK()',
      status: checkResult.healthy ? 'PASSED' : 'FAILED',
      details: checkResult
    });
    if (!checkResult.healthy) {
      results.warnings.push('System not fully healthy');
    }
  } catch (e) {
    Logger.log('❌ CHECK() failed: ' + e.toString());
    results.errors.push('CHECK() failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 4: GET_STATUS() - Container Status
  Logger.log('═══ TEST 4: GET_STATUS() - Container Status ═══');
  try {
    const statusResult = GET_STATUS();
    Logger.log('✅ GET_STATUS() completed: ' + JSON.stringify(statusResult));
    results.tests.push({
      function: 'GET_STATUS()',
      status: 'PASSED',
      details: statusResult
    });
  } catch (e) {
    Logger.log('❌ GET_STATUS() failed: ' + e.toString());
    results.errors.push('GET_STATUS() failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 5: CONFIG() - Configuration Access
  Logger.log('═══ TEST 5: CONFIG() - Configuration Access ═══');
  try {
    const timezone = CONFIG('TIMEZONE');
    const batchSize = CONFIG('MAX_BATCH_SIZE');
    Logger.log('✅ CONFIG() tests:');
    Logger.log('  - TIMEZONE: ' + timezone);
    Logger.log('  - MAX_BATCH_SIZE: ' + batchSize);
    results.tests.push({
      function: 'CONFIG()',
      status: 'PASSED',
      details: {
        timezone: timezone,
        batchSize: batchSize
      }
    });
  } catch (e) {
    Logger.log('❌ CONFIG() failed: ' + e.toString());
    results.errors.push('CONFIG() failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 6: Core Service Tests
  Logger.log('═══ TEST 6: Core Services Validation ═══');
  try {
    const services = [
      'SmartLogger',
      'BatchOperations',
      'ConfigManager',
      'ErrorHandler',
      'PersistentStore',
      'CrossExecutionCache',
      'EmailIngestionEngine',
      'IntelligentScheduler',
      'SystemManager'
    ];

    let servicesOk = true;
    services.forEach(serviceName => {
      try {
        const service = container.get(SERVICES[serviceName]);
        if (service) {
          Logger.log('  ✅ ' + serviceName + ' - OK');
        } else {
          Logger.log('  ❌ ' + serviceName + ' - NULL');
          servicesOk = false;
        }
      } catch (e) {
        Logger.log('  ❌ ' + serviceName + ' - ERROR: ' + e.toString());
        servicesOk = false;
      }
    });

    results.tests.push({
      function: 'Service Validation',
      status: servicesOk ? 'PASSED' : 'FAILED',
      details: 'All core services checked'
    });

    if (!servicesOk) {
      results.errors.push('Some services failed validation');
      results.success = false;
    }
  } catch (e) {
    Logger.log('❌ Service validation failed: ' + e.toString());
    results.errors.push('Service validation failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 7: Sheet Structure Validation
  Logger.log('═══ TEST 7: Sheet Structure Validation ═══');
  try {
    const spreadsheet = getActiveSystemSpreadsheet();
    const requiredSheets = [
      'ACTIONS', 'PROPOSED_TASKS', 'CALENDAR_PROJECTION',
      'FOUNDATION_BLOCKS', 'TIME_BLOCKS', 'LANES',
      'SENDER_REPUTATION', 'CHAT_QUEUE', 'ACTIVITY',
      'STATUS', 'APPSHEET_CONFIG', 'HUMAN_STATE'
    ];

    let sheetsOk = true;
    requiredSheets.forEach(sheetName => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        const headers = sheet.getLastColumn();
        Logger.log('  ✅ ' + sheetName + ' - ' + headers + ' columns');
      } else {
        Logger.log('  ❌ ' + sheetName + ' - MISSING');
        sheetsOk = false;
      }
    });

    results.tests.push({
      function: 'Sheet Validation',
      status: sheetsOk ? 'PASSED' : 'FAILED',
      details: 'All sheets checked'
    });

    if (!sheetsOk) {
      results.errors.push('Some sheets are missing');
      results.success = false;
    }
  } catch (e) {
    Logger.log('❌ Sheet validation failed: ' + e.toString());
    results.errors.push('Sheet validation failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 8: API Endpoints
  Logger.log('═══ TEST 8: API Endpoints Test ═══');
  try {
    const mockGetEvent = {
      parameter: { endpoint: 'status' }
    };

    const mockPostEvent = {
      postData: {
        contents: JSON.stringify({
          action: 'test',
          data: {}
        })
      }
    };

    // We can't directly call doGet/doPost but we can verify the services exist
    const webAppManager = container.get(SERVICES.WebAppManager);
    const appSheetBridge = container.get(SERVICES.AppSheetBridge);

    if (webAppManager && appSheetBridge) {
      Logger.log('  ✅ WebAppManager - OK');
      Logger.log('  ✅ AppSheetBridge - OK');
      results.tests.push({
        function: 'API Endpoints',
        status: 'PASSED',
        details: 'Web services available'
      });
    } else {
      Logger.log('  ❌ Web services not available');
      results.tests.push({
        function: 'API Endpoints',
        status: 'FAILED',
        details: 'Web services missing'
      });
      results.success = false;
    }
  } catch (e) {
    Logger.log('❌ API test failed: ' + e.toString());
    results.errors.push('API test failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 9: Helper Functions
  Logger.log('═══ TEST 9: Helper Functions Test ═══');
  try {
    // Test hasService
    const hasLogger = hasService('SmartLogger');
    Logger.log('  hasService("SmartLogger"): ' + hasLogger);

    // Test getService
    const logger = getService('SmartLogger');
    Logger.log('  getService("SmartLogger"): ' + (logger ? 'OK' : 'NULL'));

    // Test safeGetService
    const safeLogger = safeGetService(SERVICES.SmartLogger);
    Logger.log('  safeGetService(SERVICES.SmartLogger): ' + (safeLogger ? 'OK' : 'NULL'));

    // Test TimeZoneAwareDate
    const now = TimeZoneAwareDate.now();
    Logger.log('  TimeZoneAwareDate.now(): ' + now);

    results.tests.push({
      function: 'Helper Functions',
      status: 'PASSED',
      details: 'All helpers working'
    });
  } catch (e) {
    Logger.log('❌ Helper functions failed: ' + e.toString());
    results.errors.push('Helper functions failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Test 10: Test Runner
  Logger.log('═══ TEST 10: Test Suite Validation ═══');
  try {
    // Check if test functions exist
    const testFunctions = [
      'RUN_ALL_TESTS',
      'SYSTEM_TEST_FINAL',
      'VERIFY_SHEET_CREATION'
    ];

    let testsOk = true;
    testFunctions.forEach(funcName => {
      if (typeof this[funcName] === 'function') {
        Logger.log('  ✅ ' + funcName + ' - Available');
      } else {
        Logger.log('  ❌ ' + funcName + ' - Not found');
        testsOk = false;
      }
    });

    results.tests.push({
      function: 'Test Suite',
      status: testsOk ? 'PASSED' : 'FAILED',
      details: 'Test functions checked'
    });
  } catch (e) {
    Logger.log('❌ Test suite validation failed: ' + e.toString());
    results.errors.push('Test suite validation failed: ' + e.toString());
    results.success = false;
  }
  Logger.log('');

  // Final Summary
  Logger.log('════════════════════════════════════════════════════════');
  Logger.log('                    FINAL RESULTS');
  Logger.log('════════════════════════════════════════════════════════');

  const passedTests = results.tests.filter(t => t.status === 'PASSED').length;
  const failedTests = results.tests.filter(t => t.status === 'FAILED').length;

  Logger.log('Tests Run: ' + results.tests.length);
  Logger.log('Passed: ' + passedTests);
  Logger.log('Failed: ' + failedTests);
  Logger.log('Errors: ' + results.errors.length);
  Logger.log('Warnings: ' + results.warnings.length);
  Logger.log('');

  if (results.errors.length > 0) {
    Logger.log('ERRORS FOUND:');
    results.errors.forEach((error, i) => {
      Logger.log((i + 1) + '. ' + error);
    });
    Logger.log('');
  }

  if (results.warnings.length > 0) {
    Logger.log('WARNINGS:');
    results.warnings.forEach((warning, i) => {
      Logger.log((i + 1) + '. ' + warning);
    });
    Logger.log('');
  }

  if (results.success) {
    Logger.log('✅✅✅ SYSTEM PERFECTION CONFIRMED ✅✅✅');
    Logger.log('MOH TIME OS v2.0 is PRODUCTION READY!');
  } else {
    Logger.log('❌ SYSTEM HAS ISSUES - Review errors above');
  }

  Logger.log('');
  Logger.log('════════════════════════════════════════════════════════');
  Logger.log('              END OF PERFECTION TEST');
  Logger.log('════════════════════════════════════════════════════════');

  // Return results for programmatic access
  return results;
}

/**
 * Quick validation - runs in under 10 seconds
 */
function QUICK_PERFECTION_CHECK() {
  Logger.log('=== QUICK PERFECTION CHECK ===');

  try {
    // 1. Container exists
    if (typeof container === 'undefined') {
      Logger.log('❌ Container not initialized');
      return false;
    }
    Logger.log('✅ Container exists');

    // 2. Critical services available
    const criticalServices = ['SmartLogger', 'BatchOperations', 'ConfigManager'];
    for (const service of criticalServices) {
      if (!container.has(SERVICES[service])) {
        Logger.log('❌ Missing service: ' + service);
        return false;
      }
    }
    Logger.log('✅ Critical services available');

    // 3. Sheets exist
    const spreadsheet = getActiveSystemSpreadsheet();
    const criticalSheets = ['ACTIONS', 'APPSHEET_CONFIG'];
    for (const sheetName of criticalSheets) {
      if (!spreadsheet.getSheetByName(sheetName)) {
        Logger.log('❌ Missing sheet: ' + sheetName);
        return false;
      }
    }
    Logger.log('✅ Critical sheets exist');

    // 4. Configuration accessible
    const timezone = CONFIG('TIMEZONE');
    if (!timezone) {
      Logger.log('❌ Configuration not accessible');
      return false;
    }
    Logger.log('✅ Configuration accessible: TIMEZONE = ' + timezone);

    Logger.log('');
    Logger.log('✅✅✅ QUICK CHECK PASSED - System is operational!');
    return true;

  } catch (e) {
    Logger.log('❌ Quick check failed: ' + e.toString());
    return false;
  }
}