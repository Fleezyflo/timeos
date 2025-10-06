/**
 * MOH TIME OS v2.0 - TEST RUNNER
 *
 * Simple test runner to verify system functionality
 * Execute this from Google Apps Script editor to test the system
 */

/**
 * Main test entry point - Run this function
 */
function TEST_SYSTEM() {
  Logger.log('='.repeat(80));
  Logger.log('MOH TIME OS v2.0 - SYSTEM TEST');
  Logger.log('Testing Date: ' + new Date().toString());
  Logger.log('='.repeat(80));

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0
  };

  // Test 1: Check if RUN_ALL_TESTS exists
  Logger.log('\n[TEST 1] Checking RUN_ALL_TESTS function...');
  try {
    if (typeof RUN_ALL_TESTS === 'function') {
      Logger.log('✅ RUN_ALL_TESTS function exists');
      results.tests.push({ name: 'RUN_ALL_TESTS exists', status: 'PASS' });
      results.passed++;
    } else {
      throw new Error('RUN_ALL_TESTS function not found');
    }
  } catch (e) {
    Logger.log('❌ FAIL: ' + e.toString());
    results.tests.push({ name: 'RUN_ALL_TESTS exists', status: 'FAIL', error: e.toString() });
    results.failed++;
  }

  // Test 2: Check core functions
  Logger.log('\n[TEST 2] Checking core functions...');
  const coreFunctions = [
    'completeSetup',
    'getConsoleEliminationStatus',
    'runAllCoreTests',
    'validateSystemForDeployment',
    'isSystemReadyForDeployment',
    'runSystemHealthCheck'
  ];

  for (const funcName of coreFunctions) {
    try {
      if (typeof eval(funcName) === 'function') {
        Logger.log(`✅ ${funcName} exists`);
        results.tests.push({ name: `${funcName} exists`, status: 'PASS' });
        results.passed++;
      } else {
        throw new Error(`${funcName} is not a function`);
      }
    } catch (e) {
      Logger.log(`❌ ${funcName}: ${e.toString()}`);
      results.tests.push({ name: `${funcName} exists`, status: 'FAIL', error: e.toString() });
      results.failed++;
    }
  }

  // Test 3: Check critical globals
  Logger.log('\n[TEST 3] Checking critical globals...');
  const criticalGlobals = [
    'STATUS',
    'PRIORITY',
    'LANE',
    'SERVICES',
    'LoggerFacade'
  ];

  for (const globalName of criticalGlobals) {
    try {
      if (typeof eval(globalName) !== 'undefined') {
        Logger.log(`✅ ${globalName} exists`);
        results.tests.push({ name: `${globalName} exists`, status: 'PASS' });
        results.passed++;
      } else {
        throw new Error(`${globalName} is undefined`);
      }
    } catch (e) {
      Logger.log(`❌ ${globalName}: ${e.toString()}`);
      results.tests.push({ name: `${globalName} exists`, status: 'FAIL', error: e.toString() });
      results.failed++;
    }
  }

  // Test 4: Try running a simple test
  Logger.log('\n[TEST 4] Running console elimination status check...');
  try {
    const consoleStatus = getConsoleEliminationStatus();
    if (consoleStatus && consoleStatus.productionReady !== undefined) {
      Logger.log(`✅ Console status: Production ready = ${consoleStatus.productionReady}`);
      Logger.log(`   Console count: ${consoleStatus.consoleCount}`);
      results.tests.push({ name: 'Console elimination check', status: 'PASS' });
      results.passed++;
    } else {
      throw new Error('Invalid console status response');
    }
  } catch (e) {
    Logger.log('❌ Console check failed: ' + e.toString());
    results.tests.push({ name: 'Console elimination check', status: 'FAIL', error: e.toString() });
    results.failed++;
  }

  // Summary
  Logger.log('\n' + '='.repeat(80));
  Logger.log('TEST SUMMARY');
  Logger.log('='.repeat(80));
  Logger.log(`Total Tests: ${results.passed + results.failed}`);
  Logger.log(`Passed: ${results.passed}`);
  Logger.log(`Failed: ${results.failed}`);
  Logger.log(`Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  if (results.failed === 0) {
    Logger.log('\n✅ SYSTEM IS READY FOR FULL TEST RUN');
    Logger.log('You can now run RUN_ALL_TESTS() function');
  } else {
    Logger.log('\n❌ SYSTEM HAS ISSUES - FIX BEFORE RUNNING FULL TESTS');
  }

  Logger.log('='.repeat(80));

  return results;
}

/**
 * Quick check function
 */
function QUICK_CHECK() {
  Logger.log('MOH TIME OS v2.0 - Quick Check');
  Logger.log('=====================================');

  try {
    // Check if main test function exists
    const hasMainTest = typeof RUN_ALL_TESTS === 'function';
    Logger.log('RUN_ALL_TESTS exists: ' + hasMainTest);

    // Check if setup function exists
    const hasSetup = typeof completeSetup === 'function';
    Logger.log('completeSetup exists: ' + hasSetup);

    // Check if container will be available
    const hasContainer = typeof Container === 'function';
    Logger.log('Container class exists: ' + hasContainer);

    // Check if LoggerFacade is available
    const hasLogger = typeof LoggerFacade !== 'undefined';
    Logger.log('LoggerFacade exists: ' + hasLogger);

    if (hasMainTest && hasSetup) {
      Logger.log('\n✅ READY: You can run RUN_ALL_TESTS()');
    } else {
      Logger.log('\n❌ NOT READY: Missing required functions');
    }

  } catch (e) {
    Logger.log('❌ ERROR: ' + e.toString());
  }
}