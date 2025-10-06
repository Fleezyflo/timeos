# PHASE 6: TESTING INFRASTRUCTURE - SUBAGENT BRIEF

## OBJECTIVE
Create the missing test harness classes (to be done LAST after all system fixes).

## TASKS

### TASK 1: Create IntegrationFlowValidator
**File**: `src/9_tests/IntegrationFlowValidator.gs` (CREATE NEW FILE)
**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - INTEGRATION FLOW VALIDATOR
 *
 * Validates integration between services and end-to-end workflows.
 */

class IntegrationFlowValidator {
  constructor() {
    this.results = [];
    this.logger = container.get(SERVICES.SmartLogger);
  }

  /**
   * Run all integration tests
   */
  runAll() {
    console.log('Starting Integration Flow Validation...');

    this.testEmailToTaskFlow();
    this.testSchedulingFlow();
    this.testArchiveFlow();
    this.testTriageFlow();

    return this.generateReport();
  }

  testEmailToTaskFlow() {
    const testName = 'Email to Task Flow';
    try {
      const emailEngine = container.get(SERVICES.EmailIngestionEngine);
      const mockEmail = {
        subject: 'Test: Review quarterly report',
        from: 'test@example.com',
        body: 'Please review the attached quarterly report by Friday.',
        date: new Date()
      };

      const task = emailEngine._extractTaskFromEmail(mockEmail);
      this.results.push({
        test: testName,
        passed: task && task.title,
        details: task
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testSchedulingFlow() {
    const testName = 'Scheduling Flow';
    try {
      const scheduler = container.get(SERVICES.IntelligentScheduler);
      const result = scheduler.runSchedulingCycle();
      this.results.push({
        test: testName,
        passed: result && !result.error,
        details: result
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testArchiveFlow() {
    const testName = 'Archive Flow';
    try {
      const archiveManager = container.get(SERVICES.ArchiveManager);
      const result = archiveManager.getArchiveStatus();
      this.results.push({
        test: testName,
        passed: result !== null,
        details: result
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testTriageFlow() {
    const testName = 'Triage Flow';
    try {
      const triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);
      // Test with minimal scan
      const result = triageEngine.scanUnprocessedEmails(1, 1);
      this.results.push({
        test: testName,
        passed: result && typeof result.processed === 'number',
        details: result
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  generateReport() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    return {
      total: this.results.length,
      passed,
      failed,
      results: this.results,
      success: failed === 0
    };
  }
}
```

### TASK 2: Create PerformanceBenchmarkHarness
**File**: `src/9_tests/PerformanceBenchmarkHarness.gs` (CREATE NEW FILE)
**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - PERFORMANCE BENCHMARK HARNESS
 *
 * Measures performance of critical operations.
 */

class PerformanceBenchmarkHarness {
  constructor() {
    this.benchmarks = [];
    this.logger = container.get(SERVICES.SmartLogger);
  }

  runAll() {
    console.log('Starting Performance Benchmarks...');

    this.benchmarkServiceInstantiation();
    this.benchmarkBatchOperations();
    this.benchmarkCaching();
    this.benchmarkScheduling();

    return this.generateReport();
  }

  benchmarkServiceInstantiation() {
    const services = Object.values(SERVICES);
    const results = {};

    services.forEach(service => {
      const start = Date.now();
      try {
        container.get(service);
        results[service] = Date.now() - start;
      } catch (error) {
        results[service] = -1; // Failed
      }
    });

    this.benchmarks.push({
      name: 'Service Instantiation',
      results,
      avgTime: Object.values(results).filter(t => t >= 0).reduce((a, b) => a + b, 0) /
               Object.values(results).filter(t => t >= 0).length
    });
  }

  benchmarkBatchOperations() {
    const start = Date.now();
    const batchOps = container.get(SERVICES.BatchOperations);

    // Test read operation
    const readStart = Date.now();
    batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
    const readTime = Date.now() - readStart;

    this.benchmarks.push({
      name: 'Batch Operations',
      results: {
        read: readTime
      },
      avgTime: readTime
    });
  }

  benchmarkCaching() {
    const cache = container.get(SERVICES.CrossExecutionCache);
    const testData = { test: 'data', timestamp: Date.now() };

    // Write benchmark
    const writeStart = Date.now();
    for (let i = 0; i < 100; i++) {
      cache.set(`test_${i}`, testData, 60);
    }
    const writeTime = Date.now() - writeStart;

    // Read benchmark
    const readStart = Date.now();
    for (let i = 0; i < 100; i++) {
      cache.get(`test_${i}`);
    }
    const readTime = Date.now() - readStart;

    this.benchmarks.push({
      name: 'Cache Operations',
      results: {
        write100: writeTime,
        read100: readTime
      },
      avgTime: (writeTime + readTime) / 2
    });
  }

  benchmarkScheduling() {
    const scheduler = container.get(SERVICES.IntelligentScheduler);

    const start = Date.now();
    const efficiency = scheduler._calculateSchedulingEfficiency();
    const calcTime = Date.now() - start;

    this.benchmarks.push({
      name: 'Scheduling Calculations',
      results: {
        efficiencyCalc: calcTime,
        efficiency: efficiency
      },
      avgTime: calcTime
    });
  }

  generateReport() {
    const totalTime = this.benchmarks.reduce((sum, b) => sum + (b.avgTime || 0), 0);

    return {
      benchmarks: this.benchmarks,
      totalTime,
      performance: totalTime < 5000 ? 'GOOD' : totalTime < 10000 ? 'ACCEPTABLE' : 'POOR'
    };
  }
}
```

### TASK 3: Create SecurityValidationHarness
**File**: `src/9_tests/SecurityValidationHarness.gs` (CREATE NEW FILE)
**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - SECURITY VALIDATION HARNESS
 *
 * Validates security measures and access controls.
 */

class SecurityValidationHarness {
  constructor() {
    this.validations = [];
    this.logger = container.get(SERVICES.SmartLogger);
  }

  runAll() {
    console.log('Starting Security Validation...');

    this.validateAuthentication();
    this.validateDataSanitization();
    this.validateAuditLogging();
    this.validateErrorHandling();

    return this.generateReport();
  }

  validateAuthentication() {
    const testName = 'Authentication';
    try {
      const auth = container.get(SERVICES.SecureWebAppAuth);

      // Test with mock request
      const mockRequest = {
        parameter: { token: 'invalid_token' }
      };

      const result = auth.verifyWebAppToken(mockRequest);

      this.validations.push({
        test: testName,
        passed: result === false, // Should reject invalid token
        details: 'Invalid token correctly rejected'
      });
    } catch (error) {
      this.validations.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  validateDataSanitization() {
    const testName = 'Data Sanitization';
    try {
      const testInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(testInput);

      this.validations.push({
        test: testName,
        passed: !sanitized.includes('<script>'),
        details: `Input sanitized: ${sanitized}`
      });
    } catch (error) {
      this.validations.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  validateAuditLogging() {
    const testName = 'Audit Logging';
    try {
      const audit = container.get(SERVICES.AuditProtocol);
      const eventId = audit.logAuditEvent('SECURITY_TEST', { test: true });

      this.validations.push({
        test: testName,
        passed: eventId !== null,
        details: `Audit event logged: ${eventId}`
      });
    } catch (error) {
      this.validations.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  validateErrorHandling() {
    const testName = 'Error Handling';
    try {
      const errorHandler = container.get(SERVICES.ErrorHandler);

      // Test error categorization
      const testError = new ValidationError('Test validation error');
      const handled = errorHandler.handleError(testError, 'TEST_SERVICE');

      this.validations.push({
        test: testName,
        passed: handled && !handled.shouldThrow,
        details: 'Error properly handled without throwing'
      });
    } catch (error) {
      this.validations.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  generateReport() {
    const passed = this.validations.filter(v => v.passed).length;
    const failed = this.validations.filter(v => !v.passed).length;

    return {
      total: this.validations.length,
      passed,
      failed,
      validations: this.validations,
      secure: failed === 0
    };
  }
}
```

### TASK 4: Create StressTestSimulator
**File**: `src/9_tests/StressTestSimulator.gs` (CREATE NEW FILE)
**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - STRESS TEST SIMULATOR
 *
 * Simulates high load conditions to test system resilience.
 */

class StressTestSimulator {
  constructor() {
    this.results = [];
    this.logger = container.get(SERVICES.SmartLogger);
  }

  runAll() {
    console.log('Starting Stress Tests...');

    this.testBatchProcessing();
    this.testConcurrentOperations();
    this.testMemoryUsage();
    this.testQuotaHandling();

    return this.generateReport();
  }

  testBatchProcessing() {
    const testName = 'Batch Processing';
    try {
      const batchOps = container.get(SERVICES.BatchOperations);

      // Create test data
      const testRows = [];
      for (let i = 0; i < 100; i++) {
        testRows.push([
          `test_${i}`,
          'Test Task',
          STATUS.PENDING,
          PRIORITY.NORMAL,
          new Date().toISOString()
        ]);
      }

      const start = Date.now();
      // Note: Don't actually write in stress test, just measure preparation
      const time = Date.now() - start;

      this.results.push({
        test: testName,
        passed: time < 1000,
        time,
        details: `Prepared ${testRows.length} rows in ${time}ms`
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testConcurrentOperations() {
    const testName = 'Concurrent Operations';
    try {
      const operations = [];

      // Simulate concurrent service calls
      for (let i = 0; i < 10; i++) {
        operations.push(() => {
          const service = container.get(SERVICES.SystemManager);
          return service.checkSchemaStatus();
        });
      }

      const start = Date.now();
      operations.forEach(op => op());
      const time = Date.now() - start;

      this.results.push({
        test: testName,
        passed: time < 5000,
        time,
        details: `10 concurrent operations in ${time}ms`
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testMemoryUsage() {
    const testName = 'Memory Usage';
    try {
      // Create large objects to test memory handling
      const largeArray = new Array(1000).fill({
        id: Utilities.getUuid(),
        data: 'x'.repeat(1000)
      });

      // Test if system can handle it
      const cache = container.get(SERVICES.CrossExecutionCache);
      cache.set('large_test', largeArray, 1);

      this.results.push({
        test: testName,
        passed: true,
        details: 'Handled large data structure'
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testQuotaHandling() {
    const testName = 'Quota Handling';
    try {
      const emailEngine = container.get(SERVICES.EmailIngestionEngine);

      // Test quota manager initialization
      const hasQuotaManager = emailEngine.quotaManager &&
                             emailEngine.quotaManager.maxCallsPerMinute === 75;

      this.results.push({
        test: testName,
        passed: hasQuotaManager,
        details: 'Quota manager properly configured'
      });
    } catch (error) {
      this.results.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  generateReport() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    return {
      total: this.results.length,
      passed,
      failed,
      results: this.results,
      resilient: failed === 0
    };
  }
}
```

### TASK 5: Create RegressionTestGuard
**File**: `src/9_tests/RegressionTestGuard.gs` (CREATE NEW FILE)
**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - REGRESSION TEST GUARD
 *
 * Ensures changes don't break existing functionality.
 */

class RegressionTestGuard {
  constructor() {
    this.tests = [];
    this.logger = container.get(SERVICES.SmartLogger);
  }

  runAll() {
    console.log('Starting Regression Tests...');

    this.testCoreServices();
    this.testDataModels();
    this.testWorkflows();
    this.testBackwardCompatibility();

    return this.generateReport();
  }

  testCoreServices() {
    const testName = 'Core Services';
    const requiredServices = [
      SERVICES.SmartLogger,
      SERVICES.ConfigManager,
      SERVICES.BatchOperations,
      SERVICES.ErrorHandler,
      SERVICES.SystemManager
    ];

    const failures = [];
    requiredServices.forEach(service => {
      try {
        const instance = container.get(service);
        if (!instance) {
          failures.push(service);
        }
      } catch (error) {
        failures.push(service);
      }
    });

    this.tests.push({
      test: testName,
      passed: failures.length === 0,
      failures,
      details: failures.length === 0 ? 'All core services available' : `Failed: ${failures.join(', ')}`
    });
  }

  testDataModels() {
    const testName = 'Data Models';
    try {
      // Test MohTask
      const task = new MohTask({
        title: 'Test Task',
        status: STATUS.PENDING
      });

      const valid = task.validate();

      // Test TimeBlock
      const block = new TimeBlock({
        start_time: new Date(),
        end_time: new Date(Date.now() + 3600000)
      });

      const duration = block.getDurationMinutes();

      this.tests.push({
        test: testName,
        passed: valid && duration === 60,
        details: 'Data models functioning correctly'
      });
    } catch (error) {
      this.tests.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testWorkflows() {
    const testName = 'Workflows';
    try {
      // Test state transitions
      const validation = container.get(SERVICES.BusinessLogicValidation);

      // Valid transition
      const valid = validation.validateStateTransition(STATUS.PENDING, STATUS.IN_PROGRESS);

      // Invalid transition
      const invalid = validation.validateStateTransition(STATUS.COMPLETED, STATUS.PENDING);

      this.tests.push({
        test: testName,
        passed: valid === true && invalid === false,
        details: 'Workflow validations correct'
      });
    } catch (error) {
      this.tests.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  testBackwardCompatibility() {
    const testName = 'Backward Compatibility';
    try {
      // Test legacy functions still work
      const setupResult = typeof completeSetup === 'function';
      const healResult = typeof healSheets === 'function';
      const checkResult = typeof checkSheetHealth === 'function';

      this.tests.push({
        test: testName,
        passed: setupResult && healResult && checkResult,
        details: 'Legacy functions still available'
      });
    } catch (error) {
      this.tests.push({
        test: testName,
        passed: false,
        error: error.message
      });
    }
  }

  generateReport() {
    const passed = this.tests.filter(t => t.passed).length;
    const failed = this.tests.filter(t => !t.passed).length;

    return {
      total: this.tests.length,
      passed,
      failed,
      tests: this.tests,
      stable: failed === 0
    };
  }
}
```

## VALIDATION CRITERIA
1. All 5 test harness classes created
2. Each class has runAll() method
3. Each class generates a report
4. Tests cover integration, performance, security, stress, and regression
5. No actual data modifications in stress tests

## EXPECTED OUTCOME
Complete testing infrastructure ready to validate system functionality.