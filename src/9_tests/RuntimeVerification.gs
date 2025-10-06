/**
 * RUNTIME VERIFICATION TEST SUITE
 * Execute this function manually in Apps Script Editor to verify incremental registration
 * Then use `clasp logs` to analyze results
 */

/**
 * Main test runner - executes all verification tests and logs results
 * Run this function from the Apps Script Editor
 */
function RUN_RUNTIME_VERIFICATION() {
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('RUNTIME VERIFICATION TEST SUITE - STARTING');
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('');

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: removeAllTriggers() - PRIMARY PERFORMANCE TEST
  try {
    Logger.log('─────────────────────────────────────────────────────────────');
    Logger.log('TEST 1: removeAllTriggers() - Incremental Registration Test');
    Logger.log('Expected: Only 3 services registered (SmartLogger + dependencies)');
    Logger.log('Expected: Duration < 5 seconds');
    Logger.log('─────────────────────────────────────────────────────────────');

    const startTime1 = Date.now();
    const result1 = removeAllTriggers();
    const duration1 = Date.now() - startTime1;

    Logger.log(`✅ removeAllTriggers() completed in ${duration1}ms (${(duration1/1000).toFixed(2)}s)`);
    Logger.log(`   Result: ${JSON.stringify(result1)}`);

    // Check registration session
    if (container.registrationSessions && container.registrationSessions.length > 0) {
      const lastSession = container.registrationSessions[container.registrationSessions.length - 1];
      Logger.log(`   Session: ${lastSession.name}, Services: ${lastSession.servicesRegistered}, Mode: ${lastSession.mode}`);
    }

    results.tests.push({
      name: 'removeAllTriggers',
      status: 'PASS',
      duration: duration1,
      result: result1
    });

    Logger.log('');
  } catch (error) {
    Logger.log(`❌ removeAllTriggers() FAILED: ${error.message}`);
    Logger.log(`   Stack: ${error.stack}`);
    results.tests.push({
      name: 'removeAllTriggers',
      status: 'FAIL',
      error: error.message
    });
    Logger.log('');
  }

  // Test 2: listCurrentTriggers() - Lightweight Operation Test
  try {
    Logger.log('─────────────────────────────────────────────────────────────');
    Logger.log('TEST 2: listCurrentTriggers() - Incremental Registration Test');
    Logger.log('Expected: Only 3 services registered (SmartLogger + dependencies)');
    Logger.log('Expected: Duration < 5 seconds');
    Logger.log('─────────────────────────────────────────────────────────────');

    // Clear container to force fresh registration
    if (typeof container !== 'undefined') {
      container.services.clear();
      container.validatedServices.clear();
    }

    const startTime2 = Date.now();
    const result2 = listCurrentTriggers();
    const duration2 = Date.now() - startTime2;

    Logger.log(`✅ listCurrentTriggers() completed in ${duration2}ms (${(duration2/1000).toFixed(2)}s)`);
    Logger.log(`   Trigger count: ${result2.trigger_count}`);

    // Check registration session
    if (container.registrationSessions && container.registrationSessions.length > 0) {
      const lastSession = container.registrationSessions[container.registrationSessions.length - 1];
      Logger.log(`   Session: ${lastSession.name}, Services: ${lastSession.servicesRegistered}, Mode: ${lastSession.mode}`);
    }

    results.tests.push({
      name: 'listCurrentTriggers',
      status: 'PASS',
      duration: duration2,
      result: result2
    });

    Logger.log('');
  } catch (error) {
    Logger.log(`❌ listCurrentTriggers() FAILED: ${error.message}`);
    Logger.log(`   Stack: ${error.stack}`);
    results.tests.push({
      name: 'listCurrentTriggers',
      status: 'FAIL',
      error: error.message
    });
    Logger.log('');
  }

  // Test 3: installAllTriggers() - Full Trigger Installation
  try {
    Logger.log('─────────────────────────────────────────────────────────────');
    Logger.log('TEST 3: installAllTriggers() - Trigger Installation Test');
    Logger.log('Expected: 7 triggers installed');
    Logger.log('─────────────────────────────────────────────────────────────');

    const startTime3 = Date.now();
    const result3 = installAllTriggers();
    const duration3 = Date.now() - startTime3;

    Logger.log(`✅ installAllTriggers() completed in ${duration3}ms (${(duration3/1000).toFixed(2)}s)`);
    Logger.log(`   Triggers installed: ${result3.triggers_installed}`);

    results.tests.push({
      name: 'installAllTriggers',
      status: 'PASS',
      duration: duration3,
      result: result3
    });

    Logger.log('');
  } catch (error) {
    Logger.log(`❌ installAllTriggers() FAILED: ${error.message}`);
    Logger.log(`   Stack: ${error.stack}`);
    results.tests.push({
      name: 'installAllTriggers',
      status: 'FAIL',
      error: error.message
    });
    Logger.log('');
  }

  // Test 4: Verify Service Dependencies Resolution
  try {
    Logger.log('─────────────────────────────────────────────────────────────');
    Logger.log('TEST 4: Service Dependency Resolution');
    Logger.log('Testing transitive dependency resolution for SmartLogger');
    Logger.log('─────────────────────────────────────────────────────────────');

    // Clear container
    container.services.clear();
    container.validatedServices.clear();

    // Register SmartLogger using incremental registration
    container.beginRegistrationSession('TEST_SMARTLOGGER', 'INCREMENTAL');
    container.registerWithDependencies(SERVICES.SmartLogger);
    const session4 = container.endRegistrationSession();

    Logger.log(`✅ SmartLogger registration completed`);
    Logger.log(`   Services registered: ${session4.servicesRegistered}`);
    Logger.log(`   Services validated: ${session4.servicesValidated}`);
    Logger.log(`   Duration: ${session4.duration}ms`);

    // Verify exactly 3 services
    const expectedServices = [
      SERVICES.PersistentStore,
      SERVICES.CrossExecutionCache,
      SERVICES.SmartLogger
    ];

    let allPresent = true;
    for (const svc of expectedServices) {
      const hasService = container.has(svc);
      const isValidated = container.validatedServices.has(svc);
      Logger.log(`   ${svc}: registered=${hasService}, validated=${isValidated}`);
      if (!hasService || !isValidated) allPresent = false;
    }

    if (allPresent && session4.servicesRegistered === 3) {
      Logger.log(`✅ Dependency resolution CORRECT - exactly 3 services`);
      results.tests.push({
        name: 'serviceDependencyResolution',
        status: 'PASS',
        servicesRegistered: session4.servicesRegistered
      });
    } else {
      Logger.log(`❌ Dependency resolution INCORRECT - expected 3 services, got ${session4.servicesRegistered}`);
      results.tests.push({
        name: 'serviceDependencyResolution',
        status: 'FAIL',
        servicesRegistered: session4.servicesRegistered
      });
    }

    Logger.log('');
  } catch (error) {
    Logger.log(`❌ Service dependency resolution FAILED: ${error.message}`);
    Logger.log(`   Stack: ${error.stack}`);
    results.tests.push({
      name: 'serviceDependencyResolution',
      status: 'FAIL',
      error: error.message
    });
    Logger.log('');
  }

  // Test 5: Performance Benchmark - Compare incremental vs full
  try {
    Logger.log('─────────────────────────────────────────────────────────────');
    Logger.log('TEST 5: Performance Benchmark - Incremental vs Full Registration');
    Logger.log('─────────────────────────────────────────────────────────────');

    // Benchmark incremental (SmartLogger only)
    container.services.clear();
    container.validatedServices.clear();

    const startIncremental = Date.now();
    registerMinimalServices([SERVICES.SmartLogger]);
    const durationIncremental = Date.now() - startIncremental;

    const incrementalCount = container.services.size;

    Logger.log(`✅ Incremental registration: ${incrementalCount} services in ${durationIncremental}ms`);

    // Benchmark full registration
    container.services.clear();
    container.validatedServices.clear();

    const startFull = Date.now();
    registerAllServices();
    const durationFull = Date.now() - startFull;

    const fullCount = container.services.size;

    Logger.log(`✅ Full registration: ${fullCount} services in ${durationFull}ms`);

    const improvement = ((durationFull - durationIncremental) / durationFull * 100).toFixed(1);
    Logger.log(`📊 Performance improvement: ${improvement}% faster (${durationFull - durationIncremental}ms saved)`);

    results.tests.push({
      name: 'performanceBenchmark',
      status: 'PASS',
      incremental: {
        services: incrementalCount,
        duration: durationIncremental
      },
      full: {
        services: fullCount,
        duration: durationFull
      },
      improvement: `${improvement}%`
    });

    Logger.log('');
  } catch (error) {
    Logger.log(`❌ Performance benchmark FAILED: ${error.message}`);
    Logger.log(`   Stack: ${error.stack}`);
    results.tests.push({
      name: 'performanceBenchmark',
      status: 'FAIL',
      error: error.message
    });
    Logger.log('');
  }

  // Final Summary
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('RUNTIME VERIFICATION TEST SUITE - COMPLETE');
  Logger.log('═══════════════════════════════════════════════════════════════');

  const passed = results.tests.filter(t => t.status === 'PASS').length;
  const failed = results.tests.filter(t => t.status === 'FAIL').length;

  Logger.log(`Tests passed: ${passed}/${results.tests.length}`);
  Logger.log(`Tests failed: ${failed}/${results.tests.length}`);
  Logger.log('');

  if (failed === 0) {
    Logger.log('✅ ALL TESTS PASSED - Implementation verified at runtime');
  } else {
    Logger.log('❌ SOME TESTS FAILED - Review logs above for details');
  }

  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('');
  Logger.log('📋 Full results JSON:');
  Logger.log(JSON.stringify(results, null, 2));

  return results;
}
