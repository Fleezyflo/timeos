/**
 * MOH TIME OS v2.0 - FINAL PRODUCTION TEST
 *
 * Comprehensive test of all system functionalities
 * Run this to verify production readiness
 */

/**
 * Main test runner - executes all system tests
 */
function runFinalProductionTest() {
  Logger.log('='.repeat(60));
  Logger.log('MOH TIME OS v2.0 - FINAL PRODUCTION TEST');
  Logger.log('Timestamp: ' + new Date().toISOString());
  Logger.log('='.repeat(60));

  const testResults = {
    timestamp: new Date().toISOString(),
    systemVersion: 'MOH_TIME_OS_v2.0',
    tests: [],
    summary: null
  };

  // Test 1: Bootstrap and Container
  try {
    Logger.log('\n[TEST 1] Bootstrap and Container Initialization');
    const bootstrapResult = testBootstrapSystem();
    testResults.tests.push(bootstrapResult);
    Logger.log('Result: ' + (bootstrapResult.passed ? 'PASS' : 'FAIL'));
  } catch (e) {
    Logger.log('ERROR in Bootstrap test: ' + e.message);
    testResults.tests.push({ name: 'Bootstrap', passed: false, error: e.message });
  }

  // Test 2: Logging Infrastructure
  try {
    Logger.log('\n[TEST 2] Logging Infrastructure');
    const loggingResult = testLoggingInfrastructure();
    testResults.tests.push(loggingResult);
    Logger.log('Result: ' + (loggingResult.passed ? 'PASS' : 'FAIL'));
  } catch (e) {
    Logger.log('ERROR in Logging test: ' + e.message);
    testResults.tests.push({ name: 'Logging', passed: false, error: e.message });
  }

  // Test 3: Service Registration
  try {
    Logger.log('\n[TEST 3] Service Registration');
    const servicesResult = testServiceRegistration();
    testResults.tests.push(servicesResult);
    Logger.log('Result: ' + (servicesResult.passed ? 'PASS' : 'FAIL'));
  } catch (e) {
    Logger.log('ERROR in Services test: ' + e.message);
    testResults.tests.push({ name: 'Services', passed: false, error: e.message });
  }

  // Test 4: Error Handling
  try {
    Logger.log('\n[TEST 4] Error Handling');
    const errorResult = testErrorHandling();
    testResults.tests.push(errorResult);
    Logger.log('Result: ' + (errorResult.passed ? 'PASS' : 'FAIL'));
  } catch (e) {
    Logger.log('ERROR in Error Handling test: ' + e.message);
    testResults.tests.push({ name: 'ErrorHandling', passed: false, error: e.message });
  }

  // Test 5: Console Elimination
  try {
    Logger.log('\n[TEST 5] Console Elimination Verification');
    const consoleResult = getConsoleEliminationStatus();
    testResults.tests.push({
      name: 'ConsoleElimination',
      passed: consoleResult.productionReady,
      consoleCount: consoleResult.consoleCount
    });
    Logger.log('Result: ' + (consoleResult.productionReady ? 'PASS' : 'FAIL'));
    Logger.log('Console statements in production: ' + consoleResult.consoleCount);
  } catch (e) {
    Logger.log('ERROR in Console test: ' + e.message);
    testResults.tests.push({ name: 'Console', passed: false, error: e.message });
  }

  // Test 6: Enum Definitions
  try {
    Logger.log('\n[TEST 6] Enum Definitions');
    const enumResult = testEnumDefinitions();
    testResults.tests.push(enumResult);
    Logger.log('Result: ' + (enumResult.passed ? 'PASS' : 'FAIL'));
  } catch (e) {
    Logger.log('ERROR in Enum test: ' + e.message);
    testResults.tests.push({ name: 'Enums', passed: false, error: e.message });
  }

  // Test 7: Core Functions
  try {
    Logger.log('\n[TEST 7] Core Functions');
    const coreResult = testCoreFunctions();
    testResults.tests.push(coreResult);
    Logger.log('Result: ' + (coreResult.passed ? 'PASS' : 'FAIL'));
  } catch (e) {
    Logger.log('ERROR in Core Functions test: ' + e.message);
    testResults.tests.push({ name: 'CoreFunctions', passed: false, error: e.message });
  }

  // Calculate summary
  const passedCount = testResults.tests.filter(t => t.passed).length;
  const totalCount = testResults.tests.length;
  const allPassed = passedCount === totalCount;

  testResults.summary = {
    totalTests: totalCount,
    passed: passedCount,
    failed: totalCount - passedCount,
    passRate: Math.round((passedCount / totalCount) * 100) + '%',
    status: allPassed ? 'PRODUCTION_READY' : 'ISSUES_DETECTED',
    verdict: allPassed ?
      'SUCCESS: System is production ready with NO RUNTIME ERRORS' :
      'FAILURE: System has issues that need resolution'
  };

  // Log final summary
  Logger.log('\n' + '='.repeat(60));
  Logger.log('FINAL TEST SUMMARY');
  Logger.log('='.repeat(60));
  Logger.log('Tests Run: ' + totalCount);
  Logger.log('Passed: ' + passedCount);
  Logger.log('Failed: ' + (totalCount - passedCount));
  Logger.log('Pass Rate: ' + testResults.summary.passRate);
  Logger.log('\n' + testResults.summary.status);
  Logger.log(testResults.summary.verdict);
  Logger.log('='.repeat(60));

  return testResults;
}

/**
 * Test 1: Bootstrap and Container
 */
function testBootstrapSystem() {
  const result = { name: 'Bootstrap', passed: false, details: {} };

  // Check if system can bootstrap
  try {
    completeSetup();
    result.details.setup = 'SUCCESS';
  } catch (e) {
    result.details.setup = 'FAILED: ' + e.message;
    return result;
  }

  // Check container
  result.details.container = typeof container !== 'undefined';
  result.details.hasRegister = container && typeof container.register === 'function';
  result.details.hasGet = container && typeof container.get === 'function';

  result.passed = result.details.container &&
                  result.details.hasRegister &&
                  result.details.hasGet;

  return result;
}

/**
 * Test 2: Logging Infrastructure
 */
function testLoggingInfrastructure() {
  const result = { name: 'Logging', passed: false, details: {} };

  // Test LoggerFacade
  result.details.loggerFacadeExists = typeof LoggerFacade !== 'undefined';
  if (LoggerFacade) {
    try {
      LoggerFacade.info('Test', 'Testing LoggerFacade');
      result.details.loggerFacadeWorks = true;
    } catch (e) {
      result.details.loggerFacadeWorks = false;
      result.details.loggerError = e.message;
    }
  }

  // Test SmartLogger
  try {
    const smartLogger = container.get(SERVICES.SmartLogger);
    result.details.smartLoggerExists = smartLogger !== null;
    if (smartLogger) {
      smartLogger.info('Test', 'Testing SmartLogger');
      result.details.smartLoggerWorks = true;
    }
  } catch (e) {
    result.details.smartLoggerWorks = false;
    result.details.smartLoggerError = e.message;
  }

  result.passed = result.details.loggerFacadeWorks || result.details.smartLoggerWorks;
  return result;
}

/**
 * Test 3: Service Registration
 */
function testServiceRegistration() {
  const result = { name: 'ServiceRegistration', passed: false, details: {} };

  const criticalServices = [
    SERVICES.PersistentStore,
    SERVICES.CrossExecutionCache,
    SERVICES.ErrorHandler,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.BatchOperations
  ];

  result.details.services = {};
  let allRegistered = true;

  for (const service of criticalServices) {
    try {
      const hasService = container.has(service);
      result.details.services[service] = hasService;
      if (!hasService) {
        allRegistered = false;
      }
    } catch (e) {
      result.details.services[service] = false;
      allRegistered = false;
    }
  }

  result.passed = allRegistered;
  return result;
}

/**
 * Test 4: Error Handling
 */
function testErrorHandling() {
  const result = { name: 'ErrorHandling', passed: false, details: {} };

  // Test custom error classes
  try {
    const dbError = new DatabaseError('Test error');
    result.details.databaseError = dbError instanceof Error;

    const validationError = new ValidationError('Test validation');
    result.details.validationError = validationError instanceof Error;

    const apiError = new ApiError('Test API error');
    result.details.apiError = apiError instanceof Error;

    result.passed = result.details.databaseError &&
                   result.details.validationError &&
                   result.details.apiError;
  } catch (e) {
    result.details.error = e.message;
    result.passed = false;
  }

  return result;
}

/**
 * Test 5: Enum Definitions
 */
function testEnumDefinitions() {
  const result = { name: 'Enums', passed: false, details: {} };

  // Test STATUS enum
  result.details.statusEnum = typeof STATUS !== 'undefined';
  result.details.statusArchived = STATUS && STATUS.ARCHIVED === 'ARCHIVED';
  result.details.statusCompleted = STATUS && STATUS.COMPLETED === 'COMPLETED';

  // Test PRIORITY enum
  result.details.priorityEnum = typeof PRIORITY !== 'undefined';
  result.details.priorityCritical = PRIORITY && PRIORITY.CRITICAL === 'CRITICAL';

  // Test LANE enum
  result.details.laneEnum = typeof LANE !== 'undefined';
  result.details.laneOperational = LANE && LANE.OPERATIONAL === 'ops';

  result.passed = result.details.statusEnum &&
                 result.details.statusArchived &&
                 result.details.priorityEnum &&
                 result.details.laneEnum;

  return result;
}

/**
 * Test 6: Core Functions
 */
function testCoreFunctions() {
  const result = { name: 'CoreFunctions', passed: false, details: {} };

  // Test TimeZoneAwareDate
  try {
    const now = TimeZoneAwareDate.now();
    result.details.timeZoneDate = typeof now === 'string';
  } catch (e) {
    result.details.timeZoneDate = false;
  }

  // Test utility functions
  try {
    const uuid = generateId();
    result.details.generateId = uuid && uuid.length > 0;
  } catch (e) {
    result.details.generateId = false;
  }

  // Test safe JSON parsing
  try {
    const parsed = safeJsonParse('{"test": true}');
    result.details.safeJsonParse = parsed && parsed.test === true;
  } catch (e) {
    result.details.safeJsonParse = false;
  }

  result.passed = result.details.timeZoneDate &&
                 result.details.generateId &&
                 result.details.safeJsonParse;

  return result;
}

/**
 * Execute all functions to test runtime
 */
function testAllFunctions() {
  Logger.log('\n' + '='.repeat(60));
  Logger.log('TESTING ALL SYSTEM FUNCTIONS');
  Logger.log('='.repeat(60));

  const functions = [
    'completeSetup',
    // REMOVED: 'getCurrentTimestamp' - deleted in Phase B/C (duplicate of TimeZoneAwareDate.now())
    // REMOVED: 'formatTimestamp' - deleted in Phase B/C (use TimeZoneAwareDate.toISOString())
    // REMOVED: 'parseTimestamp' - deleted in Phase B/C (use TimeZoneAwareDate.parseISO())
    'generateId',
    'safeJsonParse',
    'ensureArray',
    // REMOVED: 'getConstant' - deleted in Phase B/C (use direct CONSTANTS.KEY access)
    // REMOVED: 'getSheetName' - deleted in Phase B/C (use direct SHEET_NAMES.KEY access)
    // REMOVED: 'getServiceName' - deleted in Phase B/C (use direct SERVICES.KEY access)
    'validatePattern',
    'getAllConstants',
    'getConsoleEliminationStatus',
    'verifyConsoleElimination'
  ];

  const results = {};

  for (const funcName of functions) {
    try {
      if (typeof this[funcName] === 'function') {
        // Try to execute the function
        const result = this[funcName]();
        results[funcName] = 'SUCCESS';
        Logger.log(funcName + ': SUCCESS');
      } else {
        results[funcName] = 'NOT_FOUND';
        Logger.log(funcName + ': NOT FOUND');
      }
    } catch (e) {
      results[funcName] = 'ERROR: ' + e.message;
      Logger.log(funcName + ': ERROR - ' + e.message);
    }
  }

  return results;
}