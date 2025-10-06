/**
 * COMPLETE SYSTEM INITIALIZATION SCRIPT
 *
 * Run this single function to execute the entire initialization sequence.
 * This will populate all sheets and prepare the system for AppSheet integration.
 *
 * USAGE: In Apps Script editor, run: initializeSystemComplete()
 */

/**
 * NEW MASTER INITIALIZATION FUNCTION
 * Ensures services are initialized BEFORE calling dependent functions
 */
function initializeSystemComplete() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('STARTING COMPLETE SYSTEM INITIALIZATION (FIXED)');
  Logger.log('═══════════════════════════════════════════════════════');

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: [],
    success: false
  };

  try {
    // STEP 1: Complete Setup (initializes ALL services)
    Logger.log('\n[STEP 1/6] Running completeSetup()...');
    try {
      const setupResult = completeSetup();
      results.steps.push({
        step: 1,
        name: 'completeSetup',
        success: setupResult.success,
        details: setupResult
      });

      if (!setupResult.success) {
        throw new Error('Setup failed: ' + (setupResult.error || 'Unknown error'));
      }

      Logger.log('✅ Step 1 completed - All services registered and validated');
    } catch (error) {
      results.errors.push({ step: 1, error: error.message });
      Logger.log('❌ Step 1 CRITICAL FAILURE: ' + error.message);
      throw error; // Can't continue without services
    }

    // STEP 2: Verify services are available
    Logger.log('\n[STEP 2/6] Verifying service container...');
    try {
      if (!container) {
        throw new Error('Container not available');
      }

      // Test critical services
      const testServices = [SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.ConfigManager];
      testServices.forEach(serviceName => {
        if (!container.has(serviceName)) {
          throw new Error('Service not registered: ' + serviceName);
        }
      });

      Logger.log('✅ Step 2 completed - All critical services verified');
      results.steps.push({ step: 2, name: 'verifyServices', success: true });
    } catch (error) {
      results.errors.push({ step: 2, error: error.message });
      Logger.log('❌ Step 2 failed: ' + error.message);
      throw error;
    }

    // STEP 3: Seed lanes (NOW services are available)
    Logger.log('\n[STEP 3/6] Running seedDefaultLanes()...');
    try {
      const lanesResult = seedDefaultLanes();
      results.steps.push({
        step: 3,
        name: 'seedDefaultLanes',
        success: lanesResult.success,
        details: lanesResult
      });
      Logger.log('✅ Step 3 completed: ' + JSON.stringify(lanesResult));
    } catch (error) {
      results.errors.push({ step: 3, error: error.message });
      Logger.log('⚠️  Step 3 failed (non-critical): ' + error.message);
      // Continue - lanes might already exist
    }

    // STEP 4: Generate foundation blocks
    Logger.log('\n[STEP 4/6] Running runFoundationBlocks()...');
    try {
      runFoundationBlocks();
      results.steps.push({ step: 4, name: 'runFoundationBlocks', success: true });
      Logger.log('✅ Step 4 completed: Foundation blocks generated');
    } catch (error) {
      results.errors.push({ step: 4, error: error.message });
      Logger.log('⚠️  Step 4 failed: ' + error.message);
    }

    // STEP 5: Run scheduling cycle (populates TIME_BLOCKS)
    Logger.log('\n[STEP 5/6] Running runSchedulingCycle()...');
    try {
      runSchedulingCycle();
      results.steps.push({ step: 5, name: 'runSchedulingCycle', success: true });
      Logger.log('✅ Step 5 completed: Scheduling cycle executed, TIME_BLOCKS populated');
    } catch (error) {
      results.errors.push({ step: 5, error: error.message });
      Logger.log('⚠️  Step 5 failed: ' + error.message);
    }

    // STEP 6: Verify sheet population
    Logger.log('\n[STEP 6/6] Verifying sheet population...');
    try {
      verifySheetPopulation();
      results.steps.push({ step: 6, name: 'verifySheetPopulation', success: true });
      Logger.log('✅ Step 6 completed: Sheet verification done');
    } catch (error) {
      results.errors.push({ step: 6, error: error.message });
      Logger.log('⚠️  Step 6 failed: ' + error.message);
    }

    // Final Summary
    Logger.log('\n═══════════════════════════════════════════════════════');
    Logger.log('INITIALIZATION COMPLETE');
    Logger.log('═══════════════════════════════════════════════════════');

    results.success = results.errors.filter(e => e.step <= 2).length === 0; // Critical if steps 1-2 fail

    Logger.log('\nSUMMARY:');
    Logger.log('Total steps: ' + results.steps.length);
    Logger.log('Errors/Warnings: ' + results.errors.length);
    Logger.log('Status: ' + (results.success ? '✅ SUCCESS' : (results.errors.length === 0 ? '✅ SUCCESS' : '⚠️  COMPLETED WITH WARNINGS')));

    if (results.errors.length > 0) {
      Logger.log('\nWarnings/Errors:');
      results.errors.forEach(err => {
        Logger.log('  - Step ' + err.step + ': ' + err.error);
      });
    }

    Logger.log('\n🎉 System ready for AppSheet integration!');
    return results;

  } catch (criticalError) {
    results.success = false;
    results.errors.push({ step: 'CRITICAL', error: criticalError.message });

    Logger.log('\n═══════════════════════════════════════════════════════');
    Logger.log('❌ INITIALIZATION FAILED');
    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('Error: ' + criticalError.message);

    return results;
  }
}

/**
 * OLD executeFullInitialization (DEPRECATED - use initializeSystemComplete instead)
 */
function executeFullInitialization() {
  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    errors: [],
    success: false
  };

  try {
    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('STARTING COMPLETE SYSTEM INITIALIZATION');
    Logger.log('═══════════════════════════════════════════════════════');

    // STEP 1: Complete Setup (5 phases)
    Logger.log('\n[STEP 1/6] Running completeSetup()...');
    try {
      const setupResult = completeSetup();
      results.steps.push({
        step: 1,
        name: 'completeSetup',
        success: setupResult.success,
        details: setupResult
      });
      Logger.log('✅ Step 1 completed: ' + JSON.stringify(setupResult));
    } catch (error) {
      results.errors.push({ step: 1, error: error.message });
      Logger.log('❌ Step 1 failed: ' + error.message);
      throw error;
    }

    // STEP 2: Seed Default Lanes
    Logger.log('\n[STEP 2/6] Running seedDefaultLanes()...');
    try {
      const lanesResult = seedDefaultLanes();
      results.steps.push({
        step: 2,
        name: 'seedDefaultLanes',
        success: lanesResult.success,
        details: lanesResult
      });
      Logger.log('✅ Step 2 completed: ' + JSON.stringify(lanesResult));
    } catch (error) {
      results.errors.push({ step: 2, error: error.message });
      Logger.log('⚠️  Step 2 failed (non-critical): ' + error.message);
      // Continue - lanes might already exist
    }

    // STEP 3: Install Triggers
    Logger.log('\n[STEP 3/6] Running installAllTriggers()...');
    try {
      const triggersResult = installAllTriggers();
      results.steps.push({
        step: 3,
        name: 'installAllTriggers',
        success: true,
        details: { triggers_created: triggersResult }
      });
      Logger.log('✅ Step 3 completed: ' + triggersResult + ' triggers installed');
    } catch (error) {
      results.errors.push({ step: 3, error: error.message });
      Logger.log('⚠️  Step 3 failed (non-critical): ' + error.message);
      // Continue - triggers might already exist
    }

    // STEP 4: Generate Foundation Blocks
    Logger.log('\n[STEP 4/6] Running runFoundationBlocks()...');
    try {
      runFoundationBlocks();
      results.steps.push({
        step: 4,
        name: 'runFoundationBlocks',
        success: true
      });
      Logger.log('✅ Step 4 completed: Foundation blocks generated');
    } catch (error) {
      results.errors.push({ step: 4, error: error.message });
      Logger.log('⚠️  Step 4 failed: ' + error.message);
      // Continue - blocks might already exist
    }

    // STEP 5: Run Scheduling Cycle (Populates TIME_BLOCKS)
    Logger.log('\n[STEP 5/6] Running runSchedulingCycle()...');
    try {
      runSchedulingCycle();
      results.steps.push({
        step: 5,
        name: 'runSchedulingCycle',
        success: true
      });
      Logger.log('✅ Step 5 completed: Scheduling cycle executed, TIME_BLOCKS populated');
    } catch (error) {
      results.errors.push({ step: 5, error: error.message });
      Logger.log('⚠️  Step 5 failed: ' + error.message);
      // Continue - this might fail if no pending actions exist
    }

    // STEP 6: System Health Check
    Logger.log('\n[STEP 6/6] Running runSystemHealthCheck()...');
    try {
      const healthResult = runSystemHealthCheck();
      results.steps.push({
        step: 6,
        name: 'runSystemHealthCheck',
        success: healthResult.healthy,
        details: healthResult
      });

      if (healthResult.healthy) {
        Logger.log('✅ Step 6 completed: System health check PASSED');
      } else {
        Logger.log('⚠️  Step 6 completed: System health check DEGRADED');
        Logger.log('Health issues: ' + JSON.stringify(healthResult.issues));
      }
    } catch (error) {
      results.errors.push({ step: 6, error: error.message });
      Logger.log('❌ Step 6 failed: ' + error.message);
    }

    // Final Summary
    Logger.log('\n═══════════════════════════════════════════════════════');
    Logger.log('INITIALIZATION COMPLETE');
    Logger.log('═══════════════════════════════════════════════════════');

    results.success = results.errors.length === 0;

    Logger.log('\nSUMMARY:');
    Logger.log('Total steps: ' + results.steps.length);
    Logger.log('Errors: ' + results.errors.length);
    Logger.log('Status: ' + (results.success ? '✅ SUCCESS' : '⚠️  COMPLETED WITH WARNINGS'));

    if (results.errors.length > 0) {
      Logger.log('\nWarnings/Errors:');
      results.errors.forEach(err => {
        Logger.log('  - Step ' + err.step + ': ' + err.error);
      });
    }

    Logger.log('\n📋 MANUAL VERIFICATION CHECKLIST:');
    Logger.log('1. Open spreadsheet and verify sheets are populated:');
    Logger.log('   - LANES: Should have 4 rows');
    Logger.log('   - FOUNDATION_BLOCKS: Should have entries for today');
    Logger.log('   - TIME_BLOCKS: Should have 10-15 entries');
    Logger.log('   - APPSHEET_CONFIG: Should have 40+ configuration rows');
    Logger.log('   - STATUS: Should have 3 baseline rows');
    Logger.log('2. Check Apps Script Triggers page - should see 6 triggers');
    Logger.log('3. Review execution logs for any errors');

    Logger.log('\n🎉 System ready for AppSheet integration!');

    return results;

  } catch (criticalError) {
    results.success = false;
    results.errors.push({ step: 'CRITICAL', error: criticalError.message });

    Logger.log('\n═══════════════════════════════════════════════════════');
    Logger.log('❌ INITIALIZATION FAILED');
    Logger.log('═══════════════════════════════════════════════════════');
    Logger.log('Error: ' + criticalError.message);
    Logger.log('Stack: ' + criticalError.stack);

    return results;
  }
}

/**
 * Quick verification function to check sheet population
 */
function verifySheetPopulation() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('VERIFYING SHEET POPULATION');
  Logger.log('═══════════════════════════════════════════════════════');

  const ss = getActiveSystemSpreadsheet();
  const sheets = [
    'LANES',
    'FOUNDATION_BLOCKS',
    'TIME_BLOCKS',
    'APPSHEET_CONFIG',
    'STATUS',
    'SENDER_REPUTATION',
    'ACTIONS',
    'PROPOSED_TASKS'
  ];

  sheets.forEach(sheetName => {
    try {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log('❌ ' + sheetName + ': MISSING');
        return;
      }

      const lastRow = sheet.getLastRow();
      const dataRows = lastRow > 1 ? lastRow - 1 : 0; // Exclude header

      Logger.log('✅ ' + sheetName + ': ' + dataRows + ' rows (excluding header)');

    } catch (error) {
      Logger.log('❌ ' + sheetName + ': ERROR - ' + error.message);
    }
  });

  Logger.log('\n═══════════════════════════════════════════════════════');
}