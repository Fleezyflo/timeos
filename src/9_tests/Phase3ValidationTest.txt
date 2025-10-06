/**
 * PHASE 3 VALIDATION TEST
 * Comprehensive testing of service wiring validation and circular dependency resolution
 * Testing implementation against FINAL_SYSTEM_FIX_PLAN.md requirements
 */

/**
 * Main validation function for PHASE 3 requirements
 */
function validatePhase3Implementation() {
  const results = {
    timestamp: new Date().toISOString(),
    phase3_requirements: {
      validateServiceRegistrations_exists: false,
      service_registration_validation_comprehensive: false,
      circular_dependency_resolution_tested: false,
      getService_calls_error_handling: false,
      service_dependency_map_created: false,
      service_health_checks_implemented: false
    },
    detailed_tests: [],
    errors: [],
    summary: {
      total_tests: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  try {
    // Test 1: Verify validateServiceRegistrations function exists and is called
    const test1 = testValidateServiceRegistrationsExists();
    results.detailed_tests.push(test1);
    results.phase3_requirements.validateServiceRegistrations_exists = test1.result === 'pass';

    // Test 2: Verify comprehensive service registration validation
    const test2 = testServiceRegistrationValidation();
    results.detailed_tests.push(test2);
    results.phase3_requirements.service_registration_validation_comprehensive = test2.result === 'pass';

    // Test 3: Test circular dependency resolution
    const test3 = testCircularDependencyResolution();
    results.detailed_tests.push(test3);
    results.phase3_requirements.circular_dependency_resolution_tested = test3.result === 'pass';

    // Test 4: Validate getService calls have error handling
    const test4 = testGetServiceErrorHandling();
    results.detailed_tests.push(test4);
    results.phase3_requirements.getService_calls_error_handling = test4.result === 'pass';

    // Test 5: Verify service dependency map creation
    const test5 = testServiceDependencyMap();
    results.detailed_tests.push(test5);
    results.phase3_requirements.service_dependency_map_created = test5.result === 'pass';

    // Test 6: Validate service health checks
    const test6 = testServiceHealthChecks();
    results.detailed_tests.push(test6);
    results.phase3_requirements.service_health_checks_implemented = test6.result === 'pass';

    // Calculate summary
    results.summary.total_tests = results.detailed_tests.length;
    results.summary.passed = results.detailed_tests.filter(t => t.result === 'pass').length;
    results.summary.failed = results.detailed_tests.filter(t => t.result === 'fail').length;
    results.summary.warnings = results.detailed_tests.filter(t => t.result === 'warning').length;

    // Overall pass/fail
    const allRequirementsMet = Object.values(results.phase3_requirements).every(req => req === true);
    results.overall_status = allRequirementsMet ? 'PASS' : 'FAIL';

    return results;

  } catch (error) {
    results.errors.push({
      test: 'validatePhase3Implementation',
      error: error.message,
      stack: error.stack
    });
    results.overall_status = 'CRITICAL_FAILURE';
    return results;
  }
}

/**
 * Test 1: Verify validateServiceRegistrations function exists
 */
function testValidateServiceRegistrationsExists() {
  const test = {
    case_id: 'PHASE3_REQ_1',
    name: 'validateServiceRegistrations function exists and is called',
    result: 'fail',
    notes: []
  };

  try {
    // Check if function exists
    if (typeof validateServiceRegistrations !== 'function') {
      test.notes.push('validateServiceRegistrations function does not exist');
      return test;
    }

    // Check if it's called in registerAllServices
    const registerAllServicesStr = registerAllServices.toString();
    if (!registerAllServicesStr.includes('validateServiceRegistrations()')) {
      test.notes.push('validateServiceRegistrations is not called in registerAllServices');
      return test;
    }

    test.result = 'pass';
    test.notes.push('validateServiceRegistrations function exists and is properly called');

  } catch (error) {
    test.result = 'fail';
    test.notes.push(`Error testing validateServiceRegistrations existence: ${error.message}`);
  }

  return test;
}

/**
 * Test 2: Comprehensive service registration validation
 */
function testServiceRegistrationValidation() {
  const test = {
    case_id: 'PHASE3_REQ_2',
    name: 'Comprehensive service registration validation',
    result: 'fail',
    notes: []
  };

  try {
    // Check if all services in SERVICES enum are validated
    const requiredServices = Object.values(SERVICES).filter(serviceName =>
      !serviceName.startsWith('EXTERNAL_')
    );

    // Test the validation function
    if (typeof validateServiceRegistrations === 'function') {
      // Try to call validation and see if it works
      const validationResult = validateServiceRegistrations();

      if (validationResult && validationResult.success) {
        test.result = 'pass';
        test.notes.push(`Service registration validation successful for ${validationResult.servicesValidated} services`);
        if (validationResult.circularDependencyResolved) {
          test.notes.push('Circular dependency resolution validated');
        }
      } else {
        test.result = 'warning';
        test.notes.push('Service registration validation exists but returned non-success result');
      }
    } else {
      test.notes.push('validateServiceRegistrations function not found');
    }

  } catch (error) {
    test.result = 'fail';
    test.notes.push(`Service registration validation failed: ${error.message}`);
  }

  return test;
}

/**
 * Test 3: Circular dependency resolution testing
 */
function testCircularDependencyResolution() {
  const test = {
    case_id: 'PHASE3_REQ_3',
    name: 'EmailIngestionEngine ↔ ZeroTrustTriageEngine circular dependency resolution',
    result: 'fail',
    notes: []
  };

  try {
    // Test if both services can be instantiated
    const emailEngine = container.get(SERVICES.EmailIngestionEngine);
    const triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);

    if (!emailEngine) {
      test.notes.push('EmailIngestionEngine failed to instantiate');
      return test;
    }

    if (!triageEngine) {
      test.notes.push('ZeroTrustTriageEngine failed to instantiate');
      return test;
    }

    // Test circular dependency setters
    if (typeof emailEngine.setTriageEngine !== 'function') {
      test.notes.push('EmailIngestionEngine missing setTriageEngine method');
      return test;
    }

    if (typeof triageEngine.setEmailEngine !== 'function') {
      test.notes.push('ZeroTrustTriageEngine missing setEmailEngine method');
      return test;
    }

    // Test that setters can be called and return valid references
    const triageFromEmail = emailEngine.setTriageEngine();
    const emailFromTriage = triageEngine.setEmailEngine();

    if (!triageFromEmail) {
      test.notes.push('emailEngine.setTriageEngine() returned null/undefined');
      return test;
    }

    if (!emailFromTriage) {
      test.notes.push('triageEngine.setEmailEngine() returned null/undefined');
      return test;
    }

    test.result = 'pass';
    test.notes.push('Circular dependency resolution working correctly');
    test.notes.push('Both services instantiate and can access each other');

  } catch (error) {
    test.result = 'fail';
    test.notes.push(`Circular dependency test failed: ${error.message}`);
  }

  return test;
}

/**
 * Test 4: getService calls error handling
 */
function testGetServiceErrorHandling() {
  const test = {
    case_id: 'PHASE3_REQ_4',
    name: 'getService calls have proper error handling',
    result: 'fail',
    notes: []
  };

  try {
    // Check if safeGetService helper exists
    if (typeof safeGetService !== 'function') {
      test.notes.push('safeGetService helper function not found');
      return test;
    }

    // Test safeGetService with valid service
    const validService = safeGetService(SERVICES.SmartLogger);
    if (!validService) {
      test.notes.push('safeGetService failed to retrieve valid service');
      return test;
    }

    // Test safeGetService with invalid service
    const invalidService = safeGetService('INVALID_SERVICE_NAME');
    if (invalidService !== null) {
      test.notes.push('safeGetService should return null for invalid service');
      return test;
    }

    // Test safeGetService with fallback
    const fallbackObj = { test: true };
    const serviceWithFallback = safeGetService('INVALID_SERVICE_NAME', fallbackObj);
    if (serviceWithFallback !== fallbackObj) {
      test.notes.push('safeGetService fallback mechanism not working');
      return test;
    }

    test.result = 'pass';
    test.notes.push('safeGetService error handling working correctly');
    test.notes.push('Fallback mechanisms operational');

  } catch (error) {
    test.result = 'fail';
    test.notes.push(`getService error handling test failed: ${error.message}`);
  }

  return test;
}

/**
 * Test 5: Service dependency map creation
 */
function testServiceDependencyMap() {
  const test = {
    case_id: 'PHASE3_REQ_5',
    name: 'Service dependency map creation and validation',
    result: 'fail',
    notes: []
  };

  try {
    // Check if createServiceDependencyMap exists
    if (typeof createServiceDependencyMap !== 'function') {
      test.notes.push('createServiceDependencyMap function not found');
      return test;
    }

    // Test dependency map creation
    const dependencyMap = createServiceDependencyMap();

    if (!dependencyMap || typeof dependencyMap !== 'object') {
      test.notes.push('createServiceDependencyMap returned invalid result');
      return test;
    }

    // Check for key services in the dependency map
    const keyServices = [
      SERVICES.SmartLogger,
      SERVICES.BatchOperations,
      SERVICES.EmailIngestionEngine,
      SERVICES.ZeroTrustTriageEngine
    ];

    const missingServices = keyServices.filter(service => !dependencyMap[service]);
    if (missingServices.length > 0) {
      test.notes.push(`Missing services in dependency map: ${missingServices.join(', ')}`);
      return test;
    }

    // Check circular dependency marking
    const emailDeps = dependencyMap[SERVICES.EmailIngestionEngine];
    const triageDeps = dependencyMap[SERVICES.ZeroTrustTriageEngine];

    const hasCircularMarking =
      (emailDeps && emailDeps.includes('CIRCULAR:ZeroTrustTriageEngine')) ||
      (triageDeps && triageDeps.includes('CIRCULAR:EmailIngestionEngine'));

    if (!hasCircularMarking) {
      test.notes.push('Circular dependencies not properly marked in dependency map');
      return test;
    }

    test.result = 'pass';
    test.notes.push(`Service dependency map created with ${Object.keys(dependencyMap).length} services`);
    test.notes.push('Circular dependencies properly marked');

  } catch (error) {
    test.result = 'fail';
    test.notes.push(`Service dependency map test failed: ${error.message}`);
  }

  return test;
}

/**
 * Test 6: Service health checks
 */
function testServiceHealthChecks() {
  const test = {
    case_id: 'PHASE3_REQ_6',
    name: 'Service health checks implementation',
    result: 'fail',
    notes: []
  };

  try {
    // Check if validateServiceCallPatterns exists
    if (typeof validateServiceCallPatterns !== 'function') {
      test.notes.push('validateServiceCallPatterns function not found');
      return test;
    }

    // Test service call pattern validation
    const validationResults = validateServiceCallPatterns();

    if (!Array.isArray(validationResults)) {
      test.notes.push('validateServiceCallPatterns should return array of results');
      return test;
    }

    // Check for critical service validation
    const criticalServices = validationResults.filter(r => r.required);
    const failedCritical = criticalServices.filter(r => !r.available);

    if (failedCritical.length > 0) {
      test.result = 'warning';
      test.notes.push(`Critical services unavailable: ${failedCritical.map(s => s.service).join(', ')}`);
    } else {
      test.result = 'pass';
      test.notes.push(`Service health validation completed for ${validationResults.length} services`);
      test.notes.push(`All ${criticalServices.length} critical services available`);
    }

  } catch (error) {
    test.result = 'fail';
    test.notes.push(`Service health checks test failed: ${error.message}`);
  }

  return test;
}

/**
 * Run quick validation and return summary
 */
function quickPhase3Validation() {
  const result = validatePhase3Implementation();

  const summary = {
    status: result.overall_status,
    requirements_met: Object.keys(result.phase3_requirements).filter(key => result.phase3_requirements[key]).length,
    total_requirements: Object.keys(result.phase3_requirements).length,
    tests_passed: result.summary.passed,
    tests_failed: result.summary.failed,
    key_issues: result.detailed_tests.filter(t => t.result === 'fail').map(t => t.notes).flat()
  };

  return summary;
}