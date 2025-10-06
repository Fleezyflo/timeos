/**
 * MOH TIME OS v2.0 - BACKEND FUNCTION TESTS
 *
 * Comprehensive automated tests for all 28 appsheet_* backend functions.
 * Tests request/response contracts, error handling, and auto-initialization.
 * Can be executed via clasp run or manually in Apps Script IDE.
 */

/**
 * Main test runner - Execute this function to test all backend functions
 * @returns {Object} Test results with pass/fail counts
 */
function RUN_ALL_BACKEND_TESTS() {
  const startTime = new Date();
  Logger.log('='.repeat(80));
  Logger.log('MOH TIME OS v2.0 - BACKEND FUNCTION TESTS');
  Logger.log('Starting at: ' + startTime.toISOString());
  Logger.log('='.repeat(80));

  const results = {
    timestamp: startTime.toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
    errors: []
  };

  // Ensure system is initialized before testing
  try {
    Logger.log('\n[INIT] Initializing system...');
    completeSetup();
    Logger.log('[INIT] ✅ System initialized');
  } catch (e) {
    Logger.log('[INIT] ❌ System initialization failed: ' + e.message);
    results.errors.push({ phase: 'initialization', error: e.message });
  }

  // Test Category 1: Task Management (10 functions)
  Logger.log('\n' + '='.repeat(80));
  Logger.log('CATEGORY 1: TASK MANAGEMENT FUNCTIONS (10 tests)');
  Logger.log('='.repeat(80));

  testFunction(results, 'appsheet_getMyDay', function() {
    const response = appsheet_getMyDay({ view: 'today' });
    validateResponse(response);
    if (!response.data || !response.data.todaySchedule) {
      throw new Error('Missing todaySchedule in response');
    }
  });

  testFunction(results, 'appsheet_getAllTasks', function() {
    const response = appsheet_getAllTasks({ limit: 10, offset: 0 });
    validateResponse(response);
    if (!response.data || !response.data.tasks) {
      throw new Error('Missing tasks array in response');
    }
  });

  testFunction(results, 'appsheet_getHighPriorityTasks', function() {
    const response = appsheet_getHighPriorityTasks({ limit: 5 });
    validateResponse(response);
    if (!response.data || !response.data.tasks) {
      throw new Error('Missing tasks array in response');
    }
  });

  testFunction(results, 'appsheet_createTask', function() {
    const response = appsheet_createTask({
      title: 'Test Task - Backend Function Test',
      priority: 'MEDIUM',
      lane: 'ops',
      estimated_minutes: 30
    });
    validateResponse(response);
    if (!response.data || !response.data.task_id) {
      throw new Error('Missing task_id in response');
    }
    return response.data.task_id;
  });

  testFunction(results, 'appsheet_startTask', function() {
    const createResponse = appsheet_createTask({
      title: 'Test Task for startTask',
      priority: 'MEDIUM',
      lane: 'ops',
      estimated_minutes: 15
    });
    const taskId = createResponse.data.task_id;
    const response = appsheet_startTask({ taskId: taskId });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_completeTask', function() {
    const createResponse = appsheet_createTask({
      title: 'Test Task for completeTask',
      priority: 'LOW',
      lane: 'admin',
      estimated_minutes: 10
    });
    const taskId = createResponse.data.task_id;
    appsheet_startTask({ taskId: taskId });
    const response = appsheet_completeTask({
      taskId: taskId,
      actualMinutes: 12,
      notes: 'Automated test completion'
    });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_snoozeTask', function() {
    const createResponse = appsheet_createTask({
      title: 'Test Task for snoozeTask',
      priority: 'HIGH',
      lane: 'ops',
      estimated_minutes: 20
    });
    const taskId = createResponse.data.task_id;
    const response = appsheet_snoozeTask({
      taskId: taskId,
      minutes: 30
    });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_cancelTask', function() {
    const createResponse = appsheet_createTask({
      title: 'Test Task for cancelTask',
      priority: 'LOW',
      lane: 'admin',
      estimated_minutes: 5
    });
    const taskId = createResponse.data.task_id;
    const response = appsheet_cancelTask({
      taskId: taskId,
      reason: 'Automated test cancellation'
    });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_archiveTask', function() {
    const createResponse = appsheet_createTask({
      title: 'Test Task for archiveTask',
      priority: 'MINIMAL',
      lane: 'admin',
      estimated_minutes: 5
    });
    const taskId = createResponse.data.task_id;
    appsheet_startTask({ taskId: taskId });
    appsheet_completeTask({ taskId: taskId, actualMinutes: 5 });
    const response = appsheet_archiveTask({ taskId: taskId });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_rescheduleTask', function() {
    const createResponse = appsheet_createTask({
      title: 'Test Task for rescheduleTask',
      priority: 'MEDIUM',
      lane: 'ops',
      estimated_minutes: 45
    });
    const taskId = createResponse.data.task_id;
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);
    const response = appsheet_rescheduleTask({
      taskId: taskId,
      newStart: futureTime.toISOString()
    });
    validateResponse(response);
  });

  // Test Category 2: Proposals (4 functions)
  Logger.log('\n' + '='.repeat(80));
  Logger.log('CATEGORY 2: PROPOSAL FUNCTIONS (4 tests)');
  Logger.log('='.repeat(80));

  testFunction(results, 'appsheet_getProposals', function() {
    const response = appsheet_getProposals({ status: 'PENDING', limit: 10 });
    validateResponse(response);
    if (!response.data || !response.data.proposals) {
      throw new Error('Missing proposals array in response');
    }
  });

  testFunction(results, 'appsheet_getPendingProposalsCount', function() {
    const response = appsheet_getPendingProposalsCount();
    validateResponse(response);
    if (typeof response.data.count !== 'number') {
      throw new Error('Missing or invalid count in response');
    }
  });

  testFunction(results, 'appsheet_processProposal', function() {
    const response = appsheet_processProposal({
      proposalId: 'TEST_PROPOSAL_001',
      action: 'accept',
      adjustments: {}
    });
    if (!response.success && !response.error) {
      throw new Error('Invalid response structure');
    }
  });

  testFunction(results, 'appsheet_approveProposal', function() {
    const response = appsheet_approveProposal({
      proposalId: 'TEST_PROPOSAL_002'
    });
    if (!response.success && !response.error) {
      throw new Error('Invalid response structure');
    }
  });

  // Test Category 3: System Operations (5 functions)
  Logger.log('\n' + '='.repeat(80));
  Logger.log('CATEGORY 3: SYSTEM OPERATIONS (5 tests)');
  Logger.log('='.repeat(80));

  testFunction(results, 'appsheet_runScheduling', function() {
    const response = appsheet_runScheduling({ dryRun: true });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_processEmails', function() {
    const response = appsheet_processEmails({ limit: 5 });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_updateHumanState', function() {
    const response = appsheet_updateHumanState({
      energy: 'MEDIUM',
      focus: 'HIGH',
      mood: 'MOTIVATED',
      stress: 'LOW'
    });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_getSystemStatus', function() {
    const response = appsheet_getSystemStatus();
    validateResponse(response);
    if (!response.data || !response.data.status) {
      throw new Error('Missing status in response');
    }
  });

  testFunction(results, 'appsheet_handleNewRecord', function() {
    const response = appsheet_handleNewRecord({
      table: 'ACTIONS',
      record: { title: 'Test Record' }
    });
    if (!response.success && !response.error) {
      throw new Error('Invalid response structure');
    }
  });

  // Test Category 4: Miscellaneous (5 functions)
  Logger.log('\n' + '='.repeat(80));
  Logger.log('CATEGORY 4: MISCELLANEOUS FUNCTIONS (5 tests)');
  Logger.log('='.repeat(80));

  testFunction(results, 'appsheet_handleUpdate', function() {
    const response = appsheet_handleUpdate({
      table: 'ACTIONS',
      recordId: 'TEST_ID',
      changes: {}
    });
    if (!response.success && !response.error) {
      throw new Error('Invalid response structure');
    }
  });

  testFunction(results, 'appsheet_resolveConflict', function() {
    const response = appsheet_resolveConflict({
      conflictId: 'TEST_CONFLICT',
      resolution: 'accept_local'
    });
    if (!response.success && !response.error) {
      throw new Error('Invalid response structure');
    }
  });

  testFunction(results, 'appsheet_validateToken', function() {
    const response = appsheet_validateToken({
      token: 'TEST_TOKEN_12345'
    });
    if (!response.success && !response.error) {
      throw new Error('Invalid response structure');
    }
  });

  testFunction(results, 'appsheet_logEnergyState', function() {
    const response = appsheet_logEnergyState({
      energy: 'HIGH',
      focus: 'INTENSE',
      mood: 'ENERGETIC',
      context: 'OFFICE'
    });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_getEnergyHistory', function() {
    const response = appsheet_getEnergyHistory({ days: 7 });
    validateResponse(response);
    if (!response.data || !response.data.history) {
      throw new Error('Missing history array in response');
    }
  });

  // Test Category 5: Calendar & Settings (4 functions)
  Logger.log('\n' + '='.repeat(80));
  Logger.log('CATEGORY 5: CALENDAR & SETTINGS (4 tests)');
  Logger.log('='.repeat(80));

  testFunction(results, 'appsheet_getCalendarEvents', function() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const response = appsheet_getCalendarEvents({
      startDate: new Date().toISOString(),
      endDate: tomorrow.toISOString()
    });
    validateResponse(response);
    if (!response.data || !response.data.events) {
      throw new Error('Missing events array in response');
    }
  });

  testFunction(results, 'appsheet_getSettings', function() {
    const response = appsheet_getSettings();
    validateResponse(response);
    if (!response.data || !response.data.settings) {
      throw new Error('Missing settings object in response');
    }
  });

  testFunction(results, 'appsheet_updateSettings', function() {
    const response = appsheet_updateSettings({
      settings: {
        SCHEDULING_ENABLED: 'true',
        EMAIL_INGESTION_ENABLED: 'true'
      }
    });
    validateResponse(response);
  });

  testFunction(results, 'appsheet_getBatchData', function() {
    const response = appsheet_getBatchData({
      requests: [
        { endpoint: 'getMyDay', params: { view: 'today' } }
      ]
    });
    validateResponse(response);
    if (!response.data || !response.data.responses) {
      throw new Error('Missing responses array in response');
    }
  });

  // Final Summary
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;

  Logger.log('\n' + '='.repeat(80));
  Logger.log('TEST RESULTS SUMMARY');
  Logger.log('='.repeat(80));
  Logger.log('Total Tests:   ' + results.totalTests);
  Logger.log('Passed:        ' + results.passed + ' (' + Math.round((results.passed / results.totalTests) * 100) + '%)');
  Logger.log('Failed:        ' + results.failed);
  Logger.log('Skipped:       ' + results.skipped);
  Logger.log('Duration:      ' + duration.toFixed(2) + 's');
  Logger.log('Completed at:  ' + endTime.toISOString());

  if (results.failed > 0) {
    Logger.log('\n❌ FAILED TESTS:');
    results.tests.filter(function(t) { return t.status === 'FAIL'; }).forEach(function(t) {
      Logger.log('  - ' + t.name + ': ' + t.error);
    });
  }

  if (results.errors.length > 0) {
    Logger.log('\n⚠️  ERRORS:');
    results.errors.forEach(function(e) {
      Logger.log('  - ' + e.phase + ': ' + e.error);
    });
  }

  const verdict = (results.failed === 0 && results.errors.length === 0)
    ? '✅ ALL TESTS PASSED'
    : '❌ SOME TESTS FAILED';

  Logger.log('\n' + '='.repeat(80));
  Logger.log(verdict);
  Logger.log('='.repeat(80));

  return results;
}

function testFunction(results, functionName, testFn) {
  results.totalTests++;
  Logger.log('\n[' + results.totalTests + '] Testing: ' + functionName);
  try {
    testFn();
    results.passed++;
    results.tests.push({ name: functionName, status: 'PASS' });
    Logger.log('    ✅ PASS');
  } catch (e) {
    results.failed++;
    results.tests.push({ name: functionName, status: 'FAIL', error: e.message });
    Logger.log('    ❌ FAIL: ' + e.message);
  }
}

function validateResponse(response) {
  if (!response) {
    throw new Error('Response is null or undefined');
  }
  if (typeof response.success !== 'boolean') {
    throw new Error('Response missing "success" boolean field');
  }
  if (!response.data && !response.error) {
    throw new Error('Response must have either "data" or "error" field');
  }
  if (response.success && !response.data) {
    throw new Error('Successful response must have "data" field');
  }
  if (!response.success && !response.error) {
    throw new Error('Failed response must have "error" field');
  }
}

function QUICK_BACKEND_SMOKE_TEST() {
  Logger.log('MOH TIME OS v2.0 - Backend Function Smoke Test');
  Logger.log('='.repeat(80));
  const functions = [
    'appsheet_getMyDay', 'appsheet_getAllTasks', 'appsheet_getHighPriorityTasks',
    'appsheet_createTask', 'appsheet_startTask', 'appsheet_completeTask',
    'appsheet_snoozeTask', 'appsheet_cancelTask', 'appsheet_archiveTask',
    'appsheet_rescheduleTask', 'appsheet_getProposals', 'appsheet_getPendingProposalsCount',
    'appsheet_processProposal', 'appsheet_approveProposal', 'appsheet_runScheduling',
    'appsheet_processEmails', 'appsheet_updateHumanState', 'appsheet_getSystemStatus',
    'appsheet_handleNewRecord', 'appsheet_handleUpdate', 'appsheet_resolveConflict',
    'appsheet_validateToken', 'appsheet_logEnergyState', 'appsheet_getEnergyHistory',
    'appsheet_getCalendarEvents', 'appsheet_getSettings', 'appsheet_updateSettings',
    'appsheet_getBatchData'
  ];
  let allExist = true;
  functions.forEach(function(fnName) {
    const exists = typeof eval(fnName) === 'function';
    Logger.log((exists ? '✅' : '❌') + ' ' + fnName);
    if (!exists) allExist = false;
  });
  Logger.log('\n' + (allExist ? '✅ All 28 functions exist' : '❌ Some functions missing'));
  Logger.log('='.repeat(80));
  return allExist;
}
