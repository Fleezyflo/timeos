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
// BUILD:REMOVE:END