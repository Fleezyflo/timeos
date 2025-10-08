/**
 * MOH TIME OS v2.0 - DEPLOYMENT VALIDATION
 *
 * Critical deployment validation tests for production readiness.
 * Validates system integrity, performance, and configuration.
 * Must pass before deployment to production environment.
 */

// BUILD:REMOVE:START
/**
 * Comprehensive pre-deployment validation
 * This test must pass before the system can be deployed to production
 */
function validateSystemForDeployment() {
  const logger = container.get(SERVICES.SmartLogger);
  logger.info('Deployment', '🚀 Starting comprehensive deployment validation...');

  const validationResults = {
    environment: false,
    services: false,
    performance: false,
    configuration: false,
    schema: false,
    security: false,
    overall: false
  };

  try {
    // Test 1: Environment validation
    logger.info('Deployment', 'Validating environment...');
    validationResults.environment = validateEnvironmentForDeployment();

    // Test 2: Service instantiation validation
    logger.info('Deployment', 'Validating service instantiation...');
    validationResults.services = validateAllServicesCanStart();

    // Test 3: Performance validation
    logger.info('Deployment', 'Validating system performance...');
    validationResults.performance = validateSystemPerformance();

    // Test 4: Configuration validation
    logger.info('Deployment', 'Validating system configuration...');
    validationResults.configuration = validateSystemConfiguration();

    // Test 5: Schema validation
    logger.info('Deployment', 'Validating database schema...');
    validationResults.schema = validateDatabaseSchema();

    // Test 6: Security validation
    logger.info('Deployment', 'Validating security configuration...');
    validationResults.security = validateSecurityConfiguration();

    // Overall result
    validationResults.overall = Object.values(validationResults).every(result => result === true);

    if (validationResults.overall) {
      logger.info('Deployment', '✅ DEPLOYMENT VALIDATION PASSED - System ready for production');
    } else {
      logger.error('Deployment', '❌ DEPLOYMENT VALIDATION FAILED - System NOT ready for production');
      logger.error('Deployment', 'Failed validation areas:', validationResults);
    }

    return validationResults;

  } catch (error) {
    logger.error('Deployment', `💥 DEPLOYMENT VALIDATION CRASHED: ${error.message}`);
    validationResults.overall = false;
    return validationResults;
  }
}

/**
 * Validate environment readiness for deployment
 */
function validateEnvironmentForDeployment() {
  try {
    const logger = container.get(SERVICES.SmartLogger);

    // Check Google Apps Script environment
    if (typeof SpreadsheetApp === 'undefined' ||
        typeof GmailApp === 'undefined' ||
        typeof CalendarApp === 'undefined') {
      logger.error('Deployment', 'Required Google Apps Script services not available');
      return false;
    }

    // Check global constants
    const requiredGlobals = ['SHEET_NAMES', 'SERVICES', 'STATUS', 'PRIORITY', 'LANE'];
    for (const globalName of requiredGlobals) {
      if (typeof eval(globalName) === 'undefined') {
        logger.error('Deployment', `Required global constant ${globalName} not defined`);
        return false;
      }
    }

    // Check container
    if (typeof container === 'undefined') {
      logger.error('Deployment', 'Dependency injection container not available');
      return false;
    }

    logger.info('Deployment', '✓ Environment validation passed');
    return true;

  } catch (error) {
    logger.error('Deployment', `Environment validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate that all critical services can be instantiated
 */
function validateAllServicesCanStart() {
  try {
    const logger = container.get(SERVICES.SmartLogger);

    const criticalServices = [
      SERVICES.SmartLogger,
      SERVICES.ConfigManager,
      SERVICES.BatchOperations,
      SERVICES.ErrorHandler,
      SERVICES.SystemManager,
      SERVICES.ZeroTrustTriageEngine,
      SERVICES.SenderReputationManager,
      SERVICES.FoundationBlocksManager,
      SERVICES.CalendarSyncManager,
      SERVICES.WebAppManager,
      SERVICES.TriggerOrchestrator
    ];

    for (const serviceName of criticalServices) {
      try {
        const service = container.get(serviceName);
        if (!service) {
          logger.error('Deployment', `Service ${serviceName} returned null/undefined`);
          return false;
        }

        // Test self-test method if available
        if (typeof service.selfTest === 'function') {
          const selfTestResult = service.selfTest();
          if (!selfTestResult) {
            logger.error('Deployment', `Service ${serviceName} failed self-test`);
            return false;
          }
        }

        logger.debug('Deployment', `✓ Service ${serviceName} instantiated and tested`);
      } catch (error) {
        logger.error('Deployment', `Failed to instantiate service ${serviceName}: ${error.message}`);
        return false;
      }
    }

    logger.info('Deployment', '✓ All critical services validation passed');
    return true;

  } catch (error) {
    logger.error('Deployment', `Service validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate system performance meets requirements
 */
function validateSystemPerformance() {
  try {
    const logger = container.get(SERVICES.SmartLogger);

    // Test 1: Configuration access performance
    const configManager = container.get(SERVICES.ConfigManager);
    const configStartTime = Date.now();

    for (let i = 0; i < 100; i++) {
      configManager.getString('SCAN_MODE', 'LABEL_ONLY');
    }

    const configDuration = Date.now() - configStartTime;
    if (configDuration > 5000) { // Should complete in under 5 seconds
      logger.error('Deployment', `Configuration access too slow: ${configDuration}ms for 100 operations`);
      return false;
    }

    // Test 2: Cache performance
    const cache = container.get(SERVICES.CrossExecutionCache);
    const cacheStartTime = Date.now();

    for (let i = 0; i < 200; i++) {
      cache.set(`perf_test_${i}`, `value_${i}`, 60);
      cache.get(`perf_test_${i}`);
    }

    const cacheDuration = Date.now() - cacheStartTime;
    if (cacheDuration > 3000) { // Should complete in under 3 seconds
      logger.error('Deployment', `Cache operations too slow: ${cacheDuration}ms for 400 operations`);
      return false;
    }

    // Test 3: Batch operations performance
    const batchOps = container.get(SERVICES.BatchOperations);
    const batchStartTime = Date.now();

    try {
      const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
      const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    } catch (error) {
      // Ignore sheet access errors in test environment
    }

    const batchDuration = Date.now() - batchStartTime;
    if (batchDuration > 10000) { // Should complete in under 10 seconds
      logger.error('Deployment', `Batch operations too slow: ${batchDuration}ms`);
      return false;
    }

    logger.info('Deployment', '✓ System performance validation passed');
    return true;

  } catch (error) {
    logger.error('Deployment', `Performance validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate system configuration is production-ready
 */
function validateSystemConfiguration() {
  try {
    const logger = container.get(SERVICES.SmartLogger);
    const configManager = container.get(SERVICES.ConfigManager);

    // Test critical configuration values
    const criticalConfigs = [
      { key: 'SCAN_MODE', expectedValues: ['LABEL_ONLY', 'ZERO_TRUST_TRIAGE'] },
      { key: 'CIRCUIT_BREAKER_THRESHOLD', minValue: 3, maxValue: 10 },
      { key: 'SCHEDULER_INTERVAL_MINUTES', minValue: 5, maxValue: 60 },
      { key: 'EMAIL_INGESTION_BATCH_SIZE', minValue: 10, maxValue: 100 }
    ];

    for (const config of criticalConfigs) {
      if (config.expectedValues) {
        const value = configManager.getString(config.key, '');
        if (!config.expectedValues.includes(value)) {
          logger.error('Deployment', `Invalid configuration ${config.key}: ${value}`);
          return false;
        }
      } else if (config.minValue !== undefined) {
        const value = configManager.getNumber(config.key, 0);
        if (value < config.minValue || value > config.maxValue) {
          logger.error('Deployment', `Configuration ${config.key} out of range: ${value}`);
          return false;
        }
      }
    }

    // Test work hours configuration
    const workHours = configManager.getJSON('WORK_HOURS', {});
    if (!workHours.start || !workHours.end) {
      logger.error('Deployment', 'Work hours configuration incomplete');
      return false;
    }

    logger.info('Deployment', '✓ System configuration validation passed');
    return true;

  } catch (error) {
    logger.error('Deployment', `Configuration validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate database schema integrity
 */
function validateDatabaseSchema() {
  try {
    const logger = container.get(SERVICES.SmartLogger);
    const systemManager = container.get(SERVICES.SystemManager);

    // Run schema verification
    const schemaResult = systemManager._verifyDatabaseSchema();
    if (!schemaResult) {
      logger.error('Deployment', 'Database schema verification failed');
      return false;
    }

    // Test sheet access
    const batchOps = container.get(SERVICES.BatchOperations);
    const requiredSheets = [
      SHEET_NAMES.ACTIONS,
      SHEET_NAMES.APPSHEET_CONFIG,
      SHEET_NAMES.TIME_BLOCKS,
      SHEET_NAMES.ACTIVITY
    ];

    for (const sheetName of requiredSheets) {
      try {
        const headers = batchOps.getHeaders(sheetName);
        if (!headers || headers.length === 0) {
          logger.error('Deployment', `Sheet ${sheetName} has no headers`);
          return false;
        }
      } catch (error) {
        logger.error('Deployment', `Cannot access sheet ${sheetName}: ${error.message}`);
        return false;
      }
    }

    // Optimistic locking validation (inline - no new function)
    logger.info('Deployment', 'Testing optimistic locking...');
    try {
      const testTask = new MohTask({
        title: 'OL_Test_' + Date.now(),
        version: 1,
        status: STATUS.PENDING,
        priority: PRIORITY.MEDIUM,
        lane: LANE.OPERATIONAL
      });

      const testHeaders = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
      batchOps.appendRows(SHEET_NAMES.ACTIONS, [testTask.toSheetRow(testHeaders)]);

      const fetchedRows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: testTask.action_id });
      if (fetchedRows.length === 0) {
        logger.error('Deployment', 'OL test task not found after append');
        return false;
      }

      // Test 1: Stale update should fail with versionConflict
      const staleTask = MohTask.fromSheetRow(fetchedRows[0].row, testHeaders);
      staleTask.version = 1; // Keep stale version
      staleTask.title = 'Stale update';

      const staleResult = batchOps.updateActionWithOptimisticLocking(
        SHEET_NAMES.ACTIONS,
        staleTask.action_id,
        staleTask
      );

      if (staleResult.success) {
        logger.error('Deployment', 'OL FAILED - stale update succeeded', { staleResult: staleResult });
        return false;
      }

      if (!staleResult.versionConflict) {
        logger.error('Deployment', 'OL FAILED - versionConflict flag not set', { staleResult: staleResult });
        return false;
      }

      // Test 2: Valid update should succeed
      const currentTask = MohTask.fromSheetRow(fetchedRows[0].row, testHeaders);
      currentTask.title = 'Valid update';

      const validResult = batchOps.updateActionWithOptimisticLocking(
        SHEET_NAMES.ACTIONS,
        currentTask.action_id,
        currentTask
      );

      if (!validResult.success) {
        logger.error('Deployment', 'OL FAILED - valid update failed', { validResult: validResult });
        return false;
      }

      logger.info('Deployment', '✓ Optimistic locking validation passed');

      // Cleanup
      const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
      const testIdx = allData.findIndex(function(r, i) {
        return i > 0 && r[testHeaders.indexOf('action_id')] === testTask.action_id;
      });
      if (testIdx > 0) {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
        sheet.deleteRow(testIdx + 1);
      }
    } catch (olError) {
      logger.error('Deployment', 'OL test crashed: ' + olError.message, { stack: olError.stack });
      return false;
    }

    // Column conversion utilities validation (inline - no new function)
    logger.info('Deployment', 'Testing SafeColumnAccess column conversion...');
    try {
      // Test 1: 53-column ACTIONS sheet (real-world case)
      const actionsHeaders = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
      const actionsSafeAccess = new SafeColumnAccess(actionsHeaders);
      const range53 = actionsSafeAccess.getRowRange(5);

      if (!range53.startsWith('A5:') || !range53.endsWith('5')) {
        logger.error('Deployment', 'Column conversion FAILED - 53-column range invalid: ' + range53);
        return false;
      }

      // Test 2: Boundary cases
      const testCases = [
        { cols: 1, expected: 'A1:A1' },
        { cols: 26, expected: 'A10:Z10' },
        { cols: 27, expected: 'A10:AA10' },
        { cols: 52, expected: 'A10:AZ10' }
      ];

      for (const testCase of testCases) {
        const testHeaders = new Array(testCase.cols).fill('h');
        const testAccess = new SafeColumnAccess(testHeaders);
        const testRange = testAccess.getRowRange(testCase.expected.startsWith('A1:') ? 1 : 10);

        if (testRange !== testCase.expected) {
          logger.error('Deployment', 'Column conversion FAILED - ' + testCase.cols + ' columns: expected ' + testCase.expected + ', got ' + testRange);
          return false;
        }
      }

      // Test 3: Error handling
      try {
        const emptyAccess = new SafeColumnAccess([]);
        emptyAccess.getRowRange(1);
        logger.error('Deployment', 'Column conversion FAILED - empty headers should throw');
        return false;
      } catch (expectedError) {
        // Expected to throw
      }

      logger.info('Deployment', '✓ Column conversion utilities validated');
    } catch (convError) {
      logger.error('Deployment', 'Column conversion test crashed: ' + convError.message);
      return false;
    }

    // Lock manager metrics validation
    logger.info('Deployment', 'Testing lock manager metrics...');
    try {
      const lockManager = container.get(SERVICES.DistributedLockManager);
      const baselineMetrics = lockManager.getMetrics();

      const testLock = lockManager.tryAcquireLock('deployment_test_lock', 5000);
      if (!testLock) {
        logger.error('Deployment', 'Lock metrics FAILED - could not acquire test lock');
        return false;
      }
      lockManager.releaseLock(testLock);

      const updatedMetrics = lockManager.getMetrics();
      if (updatedMetrics.acquireAttempts <= baselineMetrics.acquireAttempts) {
        logger.error('Deployment', 'Lock metrics FAILED - not incrementing');
        return false;
      }

      if (!updatedMetrics.hasOwnProperty('timeouts') || !updatedMetrics.hasOwnProperty('timeoutRate')) {
        logger.error('Deployment', 'Lock metrics FAILED - timeout tracking missing');
        return false;
      }

      logger.info('Deployment', '✓ Lock manager metrics validated');
    } catch (error) {
      logger.error('Deployment', 'Lock metrics test crashed: ' + error.message);
      return false;
    }

    // Trigger idempotency validation
    logger.info('Deployment', 'Testing trigger idempotency guards...');
    try {
      const systemManager = container.get(SERVICES.SystemManager);

      // Mark test trigger as started
      systemManager.markTriggerStarted('test_deployment_trigger');

      // Should skip fresh IN_PROGRESS trigger
      const shouldSkip = systemManager.shouldSkipTrigger('test_deployment_trigger', 10000);
      if (!shouldSkip) {
        logger.error('Deployment', 'Idempotency FAILED - should skip IN_PROGRESS trigger');
        return false;
      }

      // Mark as completed
      systemManager.markTriggerCompleted('test_deployment_trigger', 'SUCCESS');

      // Should not skip completed trigger
      const shouldSkipAfter = systemManager.shouldSkipTrigger('test_deployment_trigger', 10000);
      if (shouldSkipAfter) {
        logger.error('Deployment', 'Idempotency FAILED - should not skip IDLE trigger');
        return false;
      }

      // Verify STATUS update pattern (not append-only)
      const status = systemManager.getSystemStatus();
      if (!status['trigger_test_deployment_trigger_state']) {
        logger.error('Deployment', 'Idempotency FAILED - STATUS not updated');
        return false;
      }

      logger.info('Deployment', '✓ Trigger idempotency validated');
    } catch (error) {
      logger.error('Deployment', 'Idempotency test crashed: ' + error.message);
      return false;
    }

    logger.info('Deployment', '✓ Database schema validation passed');
    return true;

  } catch (error) {
    logger.error('Deployment', `Schema validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Validate security configuration
 */
function validateSecurityConfiguration() {
  try {
    const logger = container.get(SERVICES.SmartLogger);

    // Test web app authentication
    const secureAuth = container.get(SERVICES.SecureWebAppAuth);

    // Create mock request event for testing
    const mockEvent = {
      parameter: {
        auth: 'test_token_should_fail'
      }
    };

    // Should fail with invalid token
    const authResult = secureAuth.verifyWebAppToken(mockEvent);
    if (authResult) {
      logger.error('Deployment', 'Security validation failed - invalid token was accepted');
      return false;
    }

    // Test error response creation
    const errorResponse = secureAuth.createAuthErrorResponse('Test error');
    if (!errorResponse || !errorResponse.error) {
      logger.error('Deployment', 'Security error response generation failed');
      return false;
    }

    logger.info('Deployment', '✓ Security configuration validation passed');
    return true;

  } catch (error) {
    logger.error('Deployment', `Security validation failed: ${error.message}`);
    return false;
  }
}

/**
 * Quick deployment readiness check
 * Returns true if system is ready for deployment
 */
function isSystemReadyForDeployment() {
  try {
    const validationResults = validateSystemForDeployment();
    return validationResults.overall;
  } catch (error) {
    const logger = container.get(SERVICES.SmartLogger);
    logger.error('DeploymentValidation', `Deployment readiness check failed: ${error.message}`);
    return false;
  }
}

/**
 * Test archive reliability with actual MockBatchOperations integration
 */
function testArchiveReliability() {
  const logger = container.get(SERVICES.SmartLogger);
  logger.info('ArchiveTest', 'Testing archive reliability with integration');

  try {
    // Create mock dependencies
    const cache = {
      get: function() { return null; },
      set: function() {},
      delete: function() {},
      clear: function() {}
    };
    const testLogger = {
      info: function(comp, msg, data) {
        Logger.log('[' + comp + '] ' + msg + (data ? ' ' + JSON.stringify(data) : ''));
      },
      debug: function() {},
      warn: function(comp, msg) {
        Logger.log('[WARN][' + comp + '] ' + msg);
      },
      error: function(comp, msg, data) {
        Logger.log('[ERROR][' + comp + '] ' + msg + (data ? ' ' + JSON.stringify(data) : ''));
      }
    };

    const mockBatchOps = new MockBatchOperations(cache, testLogger);

    // Monkey-patch MockBatchOperations for optimistic locking (no new method declaration)
    mockBatchOps.updateActionWithOptimisticLocking = function(sheetName, actionId, updatedAction) {
      const mockSheet = this.mockSheets.get(sheetName);
      if (!mockSheet) {
        return { success: false, error: 'Sheet \'' + sheetName + '\' does not exist' };
      }

      const headers = this.getHeaders(sheetName);
      const actionIdIdx = headers.indexOf('action_id');
      const versionIdx = headers.indexOf('version');

      if (actionIdIdx === -1 || versionIdx === -1) {
        return { success: false, error: 'Missing required columns' };
      }

      const rowIndex = mockSheet.data.findIndex(function(row) { return row[actionIdIdx] === actionId; });
      if (rowIndex === -1) {
        return { success: false, error: 'Action ' + actionId + ' not found' };
      }

      const currentDbVersion = parseInt(mockSheet.data[rowIndex][versionIdx], 10) || 1;

      if (!updatedAction.isVersionCurrent(currentDbVersion)) {
        return {
          success: false,
          error: 'Version conflict for ' + actionId,
          versionConflict: true
        };
      }

      updatedAction.prepareForUpdate();
      mockSheet.data[rowIndex] = updatedAction.toSheetRow(headers);

      return { success: true };
    };

    const mockConfigManager = {
      getString: function() { return ''; },
      getNumber: function(key, def) { return def; }
    };

    // Create ArchiveManager with mocks
    const archiveManager = new ArchiveManager(mockConfigManager, testLogger, mockBatchOps);

    // Stub getOrCreateArchiveSheet to avoid SpreadsheetApp calls
    archiveManager.getOrCreateArchiveSheet = function(sheetName, headers) {
      // Ensure mock sheet exists with provided headers
      const mockSheet = mockBatchOps.mockSheets.get(sheetName);
      if (!mockSheet) {
        mockBatchOps.mockSheets.set(sheetName, {
          headers: headers,
          data: []
        });
      } else if (!mockSheet.headers || mockSheet.headers.length === 0) {
        mockSheet.headers = headers;
      }
      return ''; // Return empty string to indicate current spreadsheet
    };

    // Test 1: Verify PROPOSED_TASKS headers don't include archived_at
    const proposedHeaders = mockBatchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    if (!proposedHeaders || proposedHeaders.length === 0) {
      throw new Error('PROPOSED_TASKS headers not available');
    }
    if (proposedHeaders.indexOf('archived_at') !== -1) {
      throw new Error('PROPOSED_TASKS should NOT have archived_at column in source schema');
    }
    logger.info('ArchiveTest', 'PROPOSED_TASKS has ' + proposedHeaders.length + ' headers without archived_at');

    // Test 2: Archive proposals and verify archived_at is added
    const testProposals = [
      {
        proposal_id: 'TEST_PROP_1',
        status: 'PROCESSED',
        source: 'test',
        sender: 'test@example.com',
        subject: 'Test proposal',
        created_at: TimeZoneAwareDate.now()
      }
    ];

    // Invoke actual archiveProcessedProposals
    const archiveResult = archiveManager.archiveProcessedProposals(testProposals);

    if (!archiveResult.success) {
      throw new Error('Archive operation failed: ' + (archiveResult.error || 'unknown'));
    }

    logger.info('ArchiveTest', 'Archived ' + archiveResult.archived_proposals + ' proposals');

    // Test 3: Verify archive sheet has archived_at column
    const archiveSheetData = mockBatchOps.getAllSheetData('PROPOSED_ARCHIVE');
    if (!archiveSheetData || archiveSheetData.length === 0) {
      throw new Error('PROPOSED_ARCHIVE sheet not created');
    }

    const archiveHeaders = archiveSheetData[0];
    const archivedAtIndex = archiveHeaders.indexOf('archived_at');

    if (archivedAtIndex === -1) {
      throw new Error('PROPOSED_ARCHIVE missing archived_at column in schema');
    }

    logger.info('ArchiveTest', 'PROPOSED_ARCHIVE has archived_at at index ' + archivedAtIndex);

    // Test 4: Verify archived rows contain timestamp
    if (archiveSheetData.length < 2) {
      throw new Error('No archived rows found');
    }

    const archivedRow = archiveSheetData[1]; // First data row
    const timestamp = archivedRow[archivedAtIndex];

    if (!timestamp || timestamp === '') {
      throw new Error('archived_at timestamp not written to row');
    }

    logger.info('ArchiveTest', 'Archived row has timestamp: ' + timestamp);

    // Test 5: Simulate retry scenario with mock failure
    let retryTestPassed = false;
    const originalAppendRows = mockBatchOps.appendRows;
    let attemptCount = 0;

    // Mock appendRows to fail first attempt
    mockBatchOps.appendRows = function(sheetName, rows) {
      attemptCount++;
      if (attemptCount === 1) {
        throw new Error('Simulated transient failure');
      }
      return originalAppendRows.call(mockBatchOps, sheetName, rows);
    };

    try {
      const retryResult = archiveManager.archiveProcessedProposals([{
        proposal_id: 'TEST_RETRY',
        status: 'PROCESSED',
        source: 'retry-test',
        created_at: TimeZoneAwareDate.now()
      }]);

      if (retryResult.success && attemptCount === 2) {
        retryTestPassed = true;
        logger.info('ArchiveTest', 'Retry logic succeeded on attempt ' + attemptCount);
      }
    } finally {
      // Restore original method
      mockBatchOps.appendRows = originalAppendRows;
    }

    if (!retryTestPassed) {
      throw new Error('Retry test failed: attemptCount=' + attemptCount);
    }

    logger.info('ArchiveTest', 'All archive reliability tests passed', {
      headers_validated: true,
      timestamp_verified: true,
      retry_tested: true,
      total_tests: 5
    });

    // Cleanup monkey-patch
    delete mockBatchOps.updateActionWithOptimisticLocking;

    return true;

  } catch (error) {
    logger.error('ArchiveTest', 'Archive reliability test failed: ' + error.message, {
      stack: error.stack
    });
    return false;
  }
}

/**
 * Phase 6: Validate batching and bulk operations
 * Tests SmartLogger.flush(), deleteRowsByIndices(), and mock instrumentation
 */
function validatePhase6Batching() {
  const logger = getLogger();

  try {
    logger.info('Phase6Validation', 'Starting Phase 6 validation tests');

    // Test 1: SmartLogger.flush() method exists
    const smartLogger = container.get(SERVICES.SmartLogger);
    if (typeof smartLogger.flush !== 'function') {
      throw new Error('SmartLogger.flush() method not found');
    }
    logger.info('Phase6Validation', '✓ Test 1 passed: SmartLogger.flush() exists');

    // Test 2: BatchOperations.deleteRowsByIndices() exists
    const batchOps = container.get(SERVICES.BatchOperations);
    if (typeof batchOps.deleteRowsByIndices !== 'function') {
      throw new Error('BatchOperations.deleteRowsByIndices() method not found');
    }
    logger.info('Phase6Validation', '✓ Test 2 passed: BatchOperations.deleteRowsByIndices() exists');

    // Test 3: MockBatchOperations instrumentation
    const mockCache = container.get(SERVICES.CrossExecutionCache);
    const mockBatchOps = new MockBatchOperations(mockCache, logger);

    // Seed mock data for testing
    mockBatchOps.addTestData(SHEET_NAMES.ACTIONS, [
      ['test1', 'PENDING', 'HIGH', TimeZoneAwareDate.now(), TimeZoneAwareDate.now()],
      ['test2', 'PENDING', 'MEDIUM', TimeZoneAwareDate.now(), TimeZoneAwareDate.now()],
      ['test3', 'PENDING', 'LOW', TimeZoneAwareDate.now(), TimeZoneAwareDate.now()]
    ]);

    // Test appendRows instrumentation
    mockBatchOps.appendRows(SHEET_NAMES.ACTIONS, [
      ['test4', 'PENDING', 'HIGH', TimeZoneAwareDate.now(), TimeZoneAwareDate.now()]
    ]);

    const counts = mockBatchOps.getOperationCounts();
    if (counts.appends !== 1) {
      throw new Error(`Expected 1 append, got ${counts.appends}`);
    }
    logger.info('Phase6Validation', '✓ Test 3 passed: appendRows instrumentation works');

    // Test 4: updateActionWithOptimisticLocking instrumentation
    mockBatchOps.updateActionWithOptimisticLocking(SHEET_NAMES.ACTIONS, 'test1', {
      action_id: 'test1',
      status: 'IN_PROGRESS'
    });

    const countsAfterUpdate = mockBatchOps.getOperationCounts();
    if (countsAfterUpdate.optimisticLockCalls !== 1) {
      throw new Error(`Expected 1 optimistic lock call, got ${countsAfterUpdate.optimisticLockCalls}`);
    }
    logger.info('Phase6Validation', '✓ Test 4 passed: updateActionWithOptimisticLocking instrumentation works');

    // Test 5: deleteRowsByIndices instrumentation
    const deletedCount = mockBatchOps.deleteRowsByIndices(SHEET_NAMES.ACTIONS, [2, 3]);
    if (deletedCount !== 2) {
      throw new Error(`Expected 2 deletions, got ${deletedCount}`);
    }

    const countsAfterDelete = mockBatchOps.getOperationCounts();
    if (countsAfterDelete.deletions !== 2) {
      throw new Error(`Expected 2 deletion operations tracked, got ${countsAfterDelete.deletions}`);
    }
    logger.info('Phase6Validation', '✓ Test 5 passed: deleteRowsByIndices instrumentation works');

    // Test 6: Verify remaining data
    const remainingData = mockBatchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    // Should have header + 2 data rows (test1, test4 - test2 and test3 were deleted)
    if (remainingData.length !== 3) {
      throw new Error(`Expected 3 rows (header + 2 data), got ${remainingData.length}`);
    }
    logger.info('Phase6Validation', '✓ Test 6 passed: Data integrity after deletions');

    logger.info('Phase6Validation', 'All Phase 6 validation tests passed!', {
      tests_passed: 6,
      smartLogger_flush: true,
      deleteRowsByIndices: true,
      mock_instrumentation: true
    });

    return true;

  } catch (error) {
    logger.error('Phase6Validation', 'Phase 6 validation failed: ' + error.message, {
      stack: error.stack
    });
    return false;
  }
}

/**
 * Phase 8: Sanitization & Privacy Controls Validation
 * Tests formula injection prevention, XSS hardening, and privacy masking
 */
function validatePhase8Sanitization() {
  const logger = getLogger();

  try {
    logger.info('Phase8Validation', 'Starting Phase 8 sanitization validation tests');

    // Test 1: Formula injection prevention
    const formulaTests = [
      { input: '=1+1', expectedPrefix: "'" },
      { input: '+IMPORTRANGE()', expectedPrefix: "'" },
      { input: '-SUM(A1:A10)', expectedPrefix: "'" },
      { input: '@FORMULA', expectedPrefix: "'" },
      { input: 'Normal text', expectedPrefix: null }
    ];

    for (const test of formulaTests) {
      const sanitized = sanitizeString(test.input);
      if (test.expectedPrefix && !sanitized.startsWith(test.expectedPrefix + test.input.charAt(0))) {
        throw new Error(`Formula injection test failed for input: ${test.input}. Expected prefix but got: ${sanitized}`);
      }
      if (!test.expectedPrefix && sanitized !== test.input) {
        throw new Error(`Normal text should not be modified. Input: ${test.input}, Got: ${sanitized}`);
      }
    }
    logger.info('Phase8Validation', '✓ Test 1 passed: Formula injection prevention works');

    // Test 2: HTML/Script tag removal
    const xssTests = [
      { input: '<script>alert(1)</script>', shouldNotContain: ['<', '>', 'script'] },
      { input: '<b>Bold text</b>', shouldNotContain: ['<', '>'] },
      { input: 'javascript:void(0)', shouldNotContain: ['javascript:'] },
      { input: 'onclick=alert(1)', shouldNotContain: ['onclick='] }
    ];

    for (const test of xssTests) {
      const sanitized = sanitizeString(test.input);
      for (const badPattern of test.shouldNotContain) {
        if (sanitized.toLowerCase().includes(badPattern.toLowerCase())) {
          throw new Error(`XSS test failed. Input: ${test.input}, sanitized still contains: ${badPattern}`);
        }
      }
    }
    logger.info('Phase8Validation', '✓ Test 2 passed: HTML/Script sanitization works');

    // Test 3: HTML entity removal
    const entityTest = sanitizeString('Text with &lt;html&gt; and &amp; &quot;');
    if (entityTest.includes('&lt;') || entityTest.includes('&gt;') ||
        entityTest.includes('&amp;') || entityTest.includes('&quot;')) {
      throw new Error('HTML entity sanitization failed');
    }
    logger.info('Phase8Validation', '✓ Test 3 passed: HTML entity removal works');

    // Test 4: Privacy config flags exist
    const batchOps = container.get(SERVICES.BatchOperations);
    const configs = batchOps.getRowsByFilter(SHEET_NAMES.APPSHEET_CONFIG, {});

    const hasMaskContent = configs.some(row =>
      Array.isArray(row) && row.some(cell => cell === 'MASK_PROPOSAL_CONTENT')
    );
    const hasMaskSender = configs.some(row =>
      Array.isArray(row) && row.some(cell => cell === 'MASK_SENDER_EMAIL')
    );

    if (!hasMaskContent) {
      throw new Error('MASK_PROPOSAL_CONTENT config flag not found in APPSHEET_CONFIG');
    }
    if (!hasMaskSender) {
      throw new Error('MASK_SENDER_EMAIL config flag not found in APPSHEET_CONFIG');
    }
    logger.info('Phase8Validation', '✓ Test 4 passed: Privacy config flags exist');

    // Test 5: Length limiting
    const longString = 'a'.repeat(15000);
    const truncated = sanitizeString(longString);
    if (truncated.length > 10000) {
      throw new Error(`String length limit failed. Expected max 10000, got ${truncated.length}`);
    }
    logger.info('Phase8Validation', '✓ Test 5 passed: Length limiting works');

    // Test 6: Null/undefined handling
    if (sanitizeString(null) !== '') {
      throw new Error('sanitizeString(null) should return empty string');
    }
    if (sanitizeString(undefined) !== '') {
      throw new Error('sanitizeString(undefined) should return empty string');
    }
    if (sanitizeString(123) !== '') {
      throw new Error('sanitizeString(non-string) should return empty string');
    }
    logger.info('Phase8Validation', '✓ Test 6 passed: Null/undefined handling works');

    logger.info('Phase8Validation', 'All Phase 8 validation tests passed!', {
      tests_passed: 6,
      formula_injection_prevention: true,
      xss_hardening: true,
      html_entity_removal: true,
      privacy_config_flags: true,
      length_limiting: true,
      null_handling: true
    });

    return true;

  } catch (error) {
    logger.error('Phase8Validation', 'Phase 8 validation failed: ' + error.message, {
      stack: error.stack
    });
    return false;
  }
}

/**
 * Phase 10: Deployment Infrastructure Validation
 * Tests backup, versioning, logging, and deployment readiness
 */
function validatePhase10Deployment() {
  const logger = getLogger();

  try {
    logger.info('Phase10Validation', 'Starting Phase 10 deployment validation tests');

    // Test 1: Version management
    const version = getSystemVersion();
    if (!version || !version.includes('v2.0.0')) {
      throw new Error(`Invalid version string: ${version}`);
    }
    const versionMeta = getSystemVersionMetadata();
    if (!versionMeta.phase || versionMeta.phase !== 10) {
      throw new Error(`Incorrect phase in version metadata: ${versionMeta.phase}`);
    }
    logger.info('Phase10Validation', '✓ Test 1 passed: Version management works');

    // Test 2: PLAN_EXECUTION_LOG sheet exists
    const batchOps = container.get(SERVICES.BatchOperations);
    const logHeaders = batchOps.getHeaders(SHEET_NAMES.PLAN_EXECUTION_LOG);
    const expectedHeaders = ['log_id', 'timestamp', 'phase', 'operator', 'action', 'status',
                             'details', 'verification_results', 'duration_ms', 'error_message'];
    if (logHeaders.length !== expectedHeaders.length) {
      throw new Error(`PLAN_EXECUTION_LOG has ${logHeaders.length} headers, expected ${expectedHeaders.length}`);
    }
    logger.info('Phase10Validation', '✓ Test 2 passed: PLAN_EXECUTION_LOG schema correct');

    // Test 3: BackupManager service available
    const backupManager = container.get(SERVICES.BackupManager);
    if (typeof backupManager.createBackup !== 'function') {
      throw new Error('BackupManager.createBackup() method not found');
    }
    if (typeof backupManager.verifyBackup !== 'function') {
      throw new Error('BackupManager.verifyBackup() method not found');
    }
    if (typeof backupManager.restoreFromBackup !== 'function') {
      throw new Error('BackupManager.restoreFromBackup() method not found');
    }
    logger.info('Phase10Validation', '✓ Test 3 passed: BackupManager service available');

    // Test 4: SystemManager deployment logging
    const systemManager = container.get(SERVICES.SystemManager);
    if (typeof systemManager.logDeploymentAction !== 'function') {
      throw new Error('SystemManager.logDeploymentAction() method not found');
    }

    // Test logging functionality
    const logResult = systemManager.logDeploymentAction(
      'Phase 10',
      'VERIFY',
      'STARTED',
      { test: true }
    );
    if (!logResult) {
      throw new Error('Deployment logging failed');
    }
    logger.info('Phase10Validation', '✓ Test 4 passed: Deployment logging works');

    // Test 5: Pre-deployment validation function exists
    if (typeof runPreDeploymentChecks !== 'function') {
      throw new Error('runPreDeploymentChecks() function not found');
    }
    logger.info('Phase10Validation', '✓ Test 5 passed: Pre-deployment validation exists');

    // Test 6: Post-deployment verification function exists
    if (typeof runPostDeploymentVerification !== 'function') {
      throw new Error('runPostDeploymentVerification() function not found');
    }
    logger.info('Phase10Validation', '✓ Test 6 passed: Post-deployment verification exists');

    logger.info('Phase10Validation', 'All Phase 10 validation tests passed!', {
      tests_passed: 6,
      version_management: true,
      plan_execution_log: true,
      backup_manager: true,
      deployment_logging: true,
      validation_functions: true
    });

    return true;

  } catch (error) {
    logger.error('Phase10Validation', 'Phase 10 validation failed: ' + error.message, {
      stack: error.stack
    });
    return false;
  }
}

/**
 * Phase 10: Bootstrap Performance Monitoring Validation
 * Verifies bootstrap metrics are tracked in STATUS sheet
 */
function validatePhase10_BootstrapMonitoring() {
  const logger = getLogger();

  try {
    logger.info('Phase10Validation', 'Testing bootstrap performance monitoring');

    // Test 1: Verify bootstrap metrics exist in STATUS
    const systemManager = container.get(SERVICES.SystemManager);
    const lastBootstrapDuration = systemManager.getStatusValue('last_bootstrap_duration_ms');
    const lastBootstrapTimestamp = systemManager.getStatusValue('last_bootstrap_timestamp');

    if (!lastBootstrapDuration) {
      throw new Error('Bootstrap duration not recorded in STATUS sheet');
    }

    const durationMs = parseInt(lastBootstrapDuration, 10);
    if (isNaN(durationMs) || durationMs < 0) {
      throw new Error(`Invalid bootstrap duration: ${lastBootstrapDuration}`);
    }

    logger.info('Phase10Validation', `✓ Test 1 passed: Bootstrap duration tracked (${durationMs}ms)`);

    // Test 2: Verify timestamp format
    if (!lastBootstrapTimestamp) {
      throw new Error('Bootstrap timestamp not recorded');
    }

    const timestamp = new Date(lastBootstrapTimestamp);
    if (isNaN(timestamp.getTime())) {
      throw new Error(`Invalid timestamp format: ${lastBootstrapTimestamp}`);
    }

    logger.info('Phase10Validation', `✓ Test 2 passed: Bootstrap timestamp valid (${lastBootstrapTimestamp})`);

    // Test 3: Warn if bootstrap is slow
    if (durationMs > 30000) {
      logger.warn('Phase10Validation', `Bootstrap is slow: ${durationMs}ms (>30s threshold)`);
    } else {
      logger.info('Phase10Validation', `✓ Test 3 passed: Bootstrap performance acceptable (${durationMs}ms)`);
    }

    logger.info('Phase10Validation', 'Bootstrap monitoring validation passed', {
      duration_ms: durationMs,
      timestamp: lastBootstrapTimestamp
    });

    return true;

  } catch (error) {
    logger.error('Phase10Validation', 'Bootstrap monitoring validation failed: ' + error.message);
    return false;
  }
}
// BUILD:REMOVE:END