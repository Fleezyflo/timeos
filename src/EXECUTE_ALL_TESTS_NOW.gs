/**
 * MASTER EXECUTION FUNCTION
 * Runs all test and validation functions immediately
 * Call this from Apps Script editor to execute everything
 */
function EXECUTE_ALL_TESTS_IMMEDIATELY() {
  const startTime = Date.now();
  const results = [];

  Logger.log('='.repeat(80));
  Logger.log('🚀 EXECUTING ALL SYSTEM TESTS AND FUNCTIONS');
  Logger.log('='.repeat(80));

  const testFunctions = [
    // Core System Tests
    { name: 'QUICK_SYSTEM_CHECK', fn: QUICK_SYSTEM_CHECK },
    { name: 'RUN_ALL_TESTS', fn: RUN_ALL_TESTS },
    { name: 'SYSTEM_PERFECTION_TEST', fn: SYSTEM_PERFECTION_TEST },
    { name: 'SYSTEM_TEST_FINAL', fn: SYSTEM_TEST_FINAL },

    // Validation Tests
    { name: 'runQuickSystemValidation', fn: runQuickSystemValidation },
    { name: 'validatePhase3Complete', fn: validatePhase3Complete },
    { name: 'validateAllSystemFixes', fn: validateAllSystemFixes },
    { name: 'validateSystemForDeployment', fn: validateSystemForDeployment },
    { name: 'isSystemReadyForDeployment', fn: isSystemReadyForDeployment },

    // Core Component Tests
    { name: 'test_PersistentStore', fn: test_PersistentStore },
    { name: 'test_CrossExecutionCache', fn: test_CrossExecutionCache },
    { name: 'test_ErrorHandler', fn: test_ErrorHandler },
    { name: 'test_SmartLogger', fn: test_SmartLogger },
    { name: 'runAllCoreTests', fn: runAllCoreTests },
    { name: 'runDependencyManagementTests', fn: runDependencyManagementTests },

    // Verification Tests
    { name: 'verifyConsoleElimination', fn: verifyConsoleElimination },
    { name: 'runValidationTests', fn: runValidationTests },
    { name: 'runCriticalFixesValidation', fn: runCriticalFixesValidation },
    { name: 'runLoggingValidation', fn: runLoggingValidation },

    // Trigger Functions
    { name: 'runEmailProcessing', fn: runEmailProcessing },
    { name: 'runSchedulingCycle', fn: runSchedulingCycle },
    { name: 'runCalendarSync', fn: runCalendarSync },
    { name: 'runHealthCheck', fn: runHealthCheck },
    { name: 'runFoundationBlocks', fn: runFoundationBlocks },

    // System Functions
    { name: 'runSystemHealthCheck', fn: runSystemHealthCheck },
    { name: 'listCurrentTriggers', fn: listCurrentTriggers },
    { name: 'getSystemHealthDashboard', fn: getSystemHealthDashboard },
    { name: 'verifyCriticalServices', fn: verifyCriticalServices },

    // Remote Control Functions
    { name: 'START', fn: START },
    { name: 'GET_STATUS', fn: GET_STATUS },
    { name: 'CHECK', fn: CHECK },
    { name: 'TEST', fn: TEST },
    { name: 'createDailyFoundationBlocks', fn: () => getService(SERVICES.FoundationBlocksManager).createDailyFoundationBlocks(new Date()) }
  ];

  for (let i = 0; i < testFunctions.length; i++) {
    const test = testFunctions[i];
    const progress = `[${i + 1}/${testFunctions.length}]`;

    try {
      Logger.log(`\n${progress} 🏃 Running: ${test.name}`);
      const testStart = Date.now();
      const result = test.fn();
      const duration = Date.now() - testStart;

      Logger.log(`${progress} ✅ ${test.name} completed in ${duration}ms`);
      results.push({
        name: test.name,
        status: 'SUCCESS',
        duration: duration,
        result: typeof result === 'object' ? JSON.stringify(result).substring(0, 200) : result
      });
    } catch (error) {
      const duration = Date.now() - testStart;
      Logger.log(`${progress} ❌ ${test.name} failed: ${error.message}`);
      results.push({
        name: test.name,
        status: 'FAILED',
        duration: duration,
        error: error.message,
        stack: error.stack ? error.stack.substring(0, 500) : ''
      });
    }
  }

  const totalDuration = Date.now() - startTime;
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  Logger.log('\n' + '='.repeat(80));
  Logger.log('🎯 EXECUTION SUMMARY');
  Logger.log('='.repeat(80));
  Logger.log(`Total Functions: ${results.length}`);
  Logger.log(`✅ Successful: ${successful}`);
  Logger.log(`❌ Failed: ${failed}`);
  Logger.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  Logger.log('='.repeat(80));

  if (failed > 0) {
    Logger.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
      Logger.log(`  - ${r.name}: ${r.error}`);
    });
  }

  return {
    summary: {
      total: results.length,
      successful: successful,
      failed: failed,
      duration: totalDuration
    },
    results: results
  };
}