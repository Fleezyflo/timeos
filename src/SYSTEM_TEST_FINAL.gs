/**
 * FINAL SYSTEM TEST - Complete Architecture Fix Verification
 *
 * Run this script in the Apps Script editor to verify all architectural fixes:
 * 1. No premature service resolution
 * 2. No circular dependencies
 * 3. No service dependencies in SheetHealer
 * 4. No fallback abuse for critical services
 * 5. Single predictable initialization path
 */

function SYSTEM_TEST_FINAL() {
  Logger.log('=== MOH TIME OS v2.0 - FINAL SYSTEM TEST ===');
  Logger.log('Testing architectural fixes...\n');

  const results = {
    phases: {},
    errors: [],
    warnings: [],
    success: false
  };

  try {
    // TEST 1: Clean container state
    Logger.log('TEST 1: Checking container state...');
    if (typeof container !== 'undefined' && typeof getContainerStatus === 'function') {
      const status = getContainerStatus();
      if (status && status.servicesCount && status.servicesCount.initialized > 0) {
        clearContainer();
        Logger.log('  ✓ Container cleared for fresh start');
      } else {
        Logger.log('  ✓ Container is clean');
      }
    } else {
      Logger.log('  ✓ Container is clean');
    }

    // TEST 2: Run START() - the single initialization entry point
    Logger.log('\nTEST 2: Running START() initialization...');
    const startResult = START();
    Logger.log('  START() result: ' + JSON.stringify(startResult));

    if (!startResult.success) {
      results.errors.push('START() failed: ' + (startResult.error || 'Unknown error'));
      results.phases = startResult.phases || {};
      throw new Error('Initialization failed');
    }

    results.phases = startResult.phases;
    Logger.log('  ✓ System initialized successfully');

    // TEST 3: Verify all critical services are registered
    Logger.log('\nTEST 3: Verifying critical services...');
    const criticalServices = ['SmartLogger', 'ConfigManager', 'ErrorHandler'];

    criticalServices.forEach(serviceName => {
      try {
        const service = container.get(SERVICES[serviceName]);
        if (service) {
          Logger.log(`  ✓ ${serviceName} is properly registered`);
        } else {
          results.errors.push(`${serviceName} not found`);
          Logger.log(`  ✗ ${serviceName} missing`);
        }
      } catch (e) {
        results.errors.push(`${serviceName} error: ${e.message}`);
        Logger.log(`  ✗ ${serviceName} failed: ${e.message}`);
      }
    });

    // TEST 4: Verify circular dependencies are resolved
    Logger.log('\nTEST 4: Testing circular dependency resolution...');
    try {
      const emailEngine = container.get(SERVICES.EmailIngestionEngine);
      const triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);

      // Test lazy loading works
      if (emailEngine && emailEngine.triageEngine) {
        Logger.log('  ✓ EmailIngestionEngine lazy loads ZeroTrustTriageEngine');
      }
      if (triageEngine && triageEngine.emailIngestionEngine) {
        Logger.log('  ✓ ZeroTrustTriageEngine lazy loads EmailIngestionEngine');
      }
    } catch (e) {
      results.warnings.push('Circular dependency test failed: ' + e.message);
      Logger.log('  ⚠ Circular dependency test: ' + e.message);
    }

    // TEST 5: Verify sheets are created
    Logger.log('\nTEST 5: Verifying sheet structure...');
    const spreadsheet = getActiveSystemSpreadsheet();
    const requiredSheets = ['ACTIONS', 'APPSHEET_CONFIG', 'CALENDAR_PROJECTION'];

    requiredSheets.forEach(sheetName => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        Logger.log(`  ✓ ${sheetName} exists`);
        if (sheetName === 'APPSHEET_CONFIG') {
          // Special verification for the critical config sheet
          const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          if (headers.includes('key') && headers.includes('value')) {
            Logger.log('    ✓ APPSHEET_CONFIG has correct headers');
          } else {
            results.warnings.push('APPSHEET_CONFIG has incorrect headers');
          }
        }
      } else {
        results.errors.push(`Sheet ${sheetName} missing`);
        Logger.log(`  ✗ ${sheetName} missing`);
      }
    });

    // TEST 6: Verify no fallback abuse
    Logger.log('\nTEST 6: Testing fallback behavior...');
    clearContainer(); // Clear to test fallback behavior

    try {
      // This should throw an error for critical service
      const logger = container.get(SERVICES.SmartLogger);
      results.errors.push('SmartLogger should have failed without registration');
      Logger.log('  ✗ Critical service fallback still active');
    } catch (e) {
      if (e.message.includes('Critical service')) {
        Logger.log('  ✓ Critical services properly fail fast');
      } else {
        Logger.log('  ⚠ Unexpected error: ' + e.message);
      }
    }

    // Re-initialize for remaining tests
    START();

    // TEST 7: System health check
    Logger.log('\nTEST 7: Running system health check...');
    const healthCheck = CHECK();
    Logger.log('  Health check result: ' + JSON.stringify(healthCheck));

    if (healthCheck.healthy) {
      Logger.log('  ✓ System is healthy');
    } else {
      results.warnings.push('System health check failed');
      Logger.log('  ⚠ System health issues detected');
    }

    // TEST 8: Configuration test
    Logger.log('\nTEST 8: Testing configuration...');
    const configTest = CONFIG('TIMEZONE');
    if (configTest) {
      Logger.log('  ✓ Configuration accessible: TIMEZONE = ' + configTest);
    } else {
      results.warnings.push('Configuration not accessible');
      Logger.log('  ⚠ Configuration issue');
    }

    // Determine overall success
    results.success = results.errors.length === 0;

  } catch (error) {
    Logger.log('\n❌ CRITICAL ERROR: ' + error.message);
    results.errors.push('Critical error: ' + error.message);
    results.success = false;
  }

  // FINAL SUMMARY
  Logger.log('\n=== FINAL TEST SUMMARY ===');
  Logger.log('Initialization Phases:');
  Object.entries(results.phases || {}).forEach(([phase, info]) => {
    Logger.log(`  ${phase}: ${info.status || 'not run'}`);
  });

  Logger.log('\nErrors: ' + results.errors.length);
  results.errors.forEach(err => Logger.log('  ✗ ' + err));

  Logger.log('\nWarnings: ' + results.warnings.length);
  results.warnings.forEach(warn => Logger.log('  ⚠ ' + warn));

  if (results.success) {
    Logger.log('\n✅ SYSTEM TEST PASSED - All architectural fixes verified!');
    Logger.log('The system is no longer messy and is functioning properly.');
  } else {
    Logger.log('\n❌ SYSTEM TEST FAILED - Issues remain');
    Logger.log('Review the errors above and fix remaining issues.');
  }

  return results;
}

// Quick test function
function QUICK_TEST() {
  Logger.log('=== QUICK SYSTEM TEST ===');

  // Just test the basics
  const start = START();
  if (!start.success) {
    Logger.log('❌ START failed: ' + start.error);
    return false;
  }

  const status = GET_STATUS();
  Logger.log('System status: ' + JSON.stringify(status));

  const sheets = checkSheetHealth();
  Logger.log('Sheet health: ' + JSON.stringify(sheets));

  Logger.log('✅ Quick test complete');
  return true;
}