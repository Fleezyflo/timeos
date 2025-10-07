/**
 * MOH TIME OS v2.0 - Dependency Management Tests
 *
 * Comprehensive test suite for SystemManager.backfillDependenciesSheet
 * and IntelligentScheduler._identifyDependencyChains functionality.
 */

function runDependencyManagementTests() {
  const testRunner = new TestRunner();
  testRunner.runAll(new DependencyManagementTestSuite());
}

class DependencyManagementTestSuite extends TestSuite {
  constructor() {
    super("Dependency Management Tests");
  }

  setup() {
    // Mock dependencies
    this.mockConfigManager = new MockConfigManagerDependencyTests();
    this.mockErrorHandler = new MockErrorHandler();
    this.mockLogger = new MockSmartLogger();
    this.mockPersistentStore = new MockPersistentStore();
    this.mockCache = new MockCrossExecutionCache(this.mockPersistentStore);
    this.mockBatchOperations = new MockBatchOperations(this.mockCache, this.mockLogger);
    this.mockArchiveManager = new MockArchiveManager(); // For SystemManager

    // Clear mock sheets before each test
    this.mockBatchOperations.clearTestData();

    // Register mocks in the container
    container.register(SERVICES.ConfigManager, this.mockConfigManager);
    container.register(SERVICES.ErrorHandler, this.mockErrorHandler);
    container.register(SERVICES.SmartLogger, this.mockLogger);
    container.register(SERVICES.PersistentStore, this.mockPersistentStore);
    container.register(SERVICES.CrossExecutionCache, this.mockCache);
    container.register(SERVICES.BatchOperations, this.mockBatchOperations);
    container.register(SERVICES.ArchiveManager, this.mockArchiveManager);

    // Instantiate services under test
    this.systemManager = new SystemManager(
      this.mockBatchOperations,
      this.mockLogger,
      this.mockConfigManager,
      this.mockErrorHandler,
      this.mockArchiveManager
    );

    // IntelligentScheduler also needs its dependencies mocked
    this.mockFoundationManager = new MockFoundationManager();
    this.mockCalendarManager = new MockCalendarManager();
    this.mockHumanStateManager = new MockHumanStateManager();
    this.mockDynamicLaneManager = new MockDynamicLaneManager();

    this.intelligentScheduler = new IntelligentScheduler(
      this.mockFoundationManager,
      this.mockCalendarManager,
      this.mockErrorHandler,
      this.mockLogger,
      this.mockConfigManager,
      this.mockHumanStateManager,
      this.mockBatchOperations,
      this.mockCache,
      this.mockDynamicLaneManager
    );

    container.register(SERVICES.SystemManager, this.systemManager);
    container.register(SERVICES.IntelligentScheduler, this.intelligentScheduler);

    // Ensure DEPENDENCIES sheet headers are set up in mockBatchOperations
    this.mockBatchOperations.initializeMockSheets();
  }

  teardown() {
    this.mockBatchOperations.clearTestData();
    this.mockCache.clear();
    container.reset();
  }

  testBackfillDependenciesSheet_success() {
    // Seed ACTIONS sheet with tasks having inline dependencies
    const actionHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const actionSafeAccess = new SafeColumnAccess(actionHeaders);

    const taskA = new MohTask({
      action_id: "task-A",
      title: "Task A",
      dependencies: []
    });
    const taskB = new MohTask({
      action_id: "task-B",
      title: "Task B",
      dependencies: ["task-A"]
    });
    const taskC = new MohTask({
      action_id: "task-C",
      title: "Task C",
      dependencies: ["task-A", "task-B"]
    });
    const taskD = new MohTask({
      action_id: "task-D",
      title: "Task D",
      dependencies: ["task-C"]
    });

    this.mockBatchOperations.addTestData(SHEET_NAMES.ACTIONS, [
      taskA.toSheetRow(actionHeaders),
      taskB.toSheetRow(actionHeaders),
      taskC.toSheetRow(actionHeaders),
      taskD.toSheetRow(actionHeaders)
    ]);

    // Set the guard flag to false initially
    this.mockConfigManager.set(CONSTANTS.BACKFILL_DEPENDENCIES_GUARD, false);

    const result = this.systemManager.backfillDependenciesSheet();

    this.assertTrue(result.success, "Backfill should be successful.");
    this.assertEquals(result.backfilled_count, 4, "Should backfill 4 unique dependencies.");

    // Verify DEPENDENCIES sheet content
    const dependenciesData = this.mockBatchOperations.mockSheets.get(SHEET_NAMES.DEPENDENCIES).data;
    this.assertEquals(dependenciesData.length, 4, "DEPENDENCIES sheet should have 4 rows.");

    const depHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.DEPENDENCIES);
    const depSafeAccess = new SafeColumnAccess(depHeaders);

    const expectedDependencies = [
      { blocking_action_id: "task-A", blocked_action_id: "task-B" },
      { blocking_action_id: "task-A", blocked_action_id: "task-C" },
      { blocking_action_id: "task-B", blocked_action_id: "task-C" },
      { blocking_action_id: "task-C", blocked_action_id: "task-D" }
    ];

    for (const expectedDep of expectedDependencies) {
      const found = dependenciesData.some(row =>
        depSafeAccess.getCellValue(row, 'blocking_action_id') === expectedDep.blocking_action_id &&
        depSafeAccess.getCellValue(row, 'blocked_action_id') === expectedDep.blocked_action_id
      );
      this.assertTrue(found, `Expected dependency ${expectedDep.blocking_action_id} -> ${expectedDep.blocked_action_id} not found.`);
    }

    // Verify guard flag is set
    this.assertTrue(this.mockConfigManager.getBoolean(CONSTANTS.BACKFILL_DEPENDENCIES_GUARD, false), "Guard flag should be set to true.");
  }

  testBackfillDependenciesSheet_alreadyRun() {
    // Set the guard flag to true initially
    this.mockConfigManager.set(CONSTANTS.BACKFILL_DEPENDENCIES_GUARD, true);

    const result = this.systemManager.backfillDependenciesSheet();

    this.assertTrue(result.success, "Backfill should report success even if skipped.");
    this.assertStringContains(result.message, "already executed", "Should indicate backfill was skipped.");
    this.assertEquals(this.mockBatchOperations.mockSheets.get(SHEET_NAMES.DEPENDENCIES).data.length, 0, "DEPENDENCIES sheet should remain empty.");
  }

  testIdentifyDependencyChains_mixedSources() {
    // Seed ACTIONS sheet with inline dependencies
    const actionHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const actionSafeAccess = new SafeColumnAccess(actionHeaders);

    const task1 = new MohTask({
      action_id: "task-1",
      title: "Task 1",
      dependencies: []
    });
    const task2 = new MohTask({
      action_id: "task-2",
      title: "Task 2",
      dependencies: ["task-1"]
    });
    const task3 = new MohTask({
      action_id: "task-3",
      title: "Task 3",
      dependencies: [] // Will have sheet dependency on task-2
    });
    const task4 = new MohTask({
      action_id: "task-4",
      title: "Task 4",
      dependencies: ["task-3"]
    });

    this.mockBatchOperations.addTestData(SHEET_NAMES.ACTIONS, [
      task1.toSheetRow(actionHeaders),
      task2.toSheetRow(actionHeaders),
      task3.toSheetRow(actionHeaders),
      task4.toSheetRow(actionHeaders)
    ]);

    // Seed DEPENDENCIES sheet with a dependency not in ACTIONS JSON
    const depHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.DEPENDENCIES);
    const depSafeAccess = new SafeColumnAccess(depHeaders);
    const sheetDepRow = depSafeAccess.mapObjectToRow({
      blocking_action_id: "task-2",
      blocked_action_id: "task-3",
      relationship_type: 'blocks',
      created_at: TimeZoneAwareDate.now(),
      updated_at: TimeZoneAwareDate.now()
    });
    this.mockBatchOperations.addTestData(SHEET_NAMES.DEPENDENCIES, [sheetDepRow]);

    const allActions = [
      task1,
      task2,
      task3,
      task4
    ];

    const chains = this.intelligentScheduler._identifyDependencyChains(allActions);

    this.assertEquals(chains.length, 1, "Should identify one main dependency chain.");
    const mainChain = chains[0].map(t => t.action_id);

    // Expected chain: task-1 -> task-2 -> task-3 -> task-4
    this.assertEquals(mainChain.length, 4, "Chain should have 4 tasks.");
    this.assertTrue(mainChain.includes("task-1"), "Chain should include task-1.");
    this.assertTrue(mainChain.includes("task-2"), "Chain should include task-2.");
    this.assertTrue(mainChain.includes("task-3"), "Chain should include task-3.");
    this.assertTrue(mainChain.includes("task-4"), "Chain should include task-4.");

    // Verify the order (this is a simple check, a more robust one would verify topological sort)
    this.assertTrue(mainChain.indexOf("task-1") < mainChain.indexOf("task-2"), "task-1 should precede task-2.");
    this.assertTrue(mainChain.indexOf("task-2") < mainChain.indexOf("task-3"), "task-2 should precede task-3.");
    this.assertTrue(mainChain.indexOf("task-3") < mainChain.indexOf("task-4"), "task-3 should precede task-4.");
  }

  testIdentifyDependencyChains_noDependencies() {
    const actionHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const actionSafeAccess = new SafeColumnAccess(actionHeaders);

    const taskA = new MohTask({
      action_id: "task-A",
      title: "Task A",
      dependencies: []
    });
    const taskB = new MohTask({
      action_id: "task-B",
      title: "Task B",
      dependencies: []
    });

    this.mockBatchOperations.addTestData(SHEET_NAMES.ACTIONS, [
      taskA.toSheetRow(actionHeaders),
      taskB.toSheetRow(actionHeaders)
    ]);

    const allActions = [taskA, taskB];
    const chains = this.intelligentScheduler._identifyDependencyChains(allActions);

    this.assertEquals(chains.length, 0, "Should find no dependency chains.");
  }

  testIdentifyDependencyChains_circularDependency() {
    // Seed ACTIONS sheet with a circular dependency
    const actionHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const actionSafeAccess = new SafeColumnAccess(actionHeaders);

    const taskX = new MohTask({
      action_id: "task-X",
      title: "Task X",
      dependencies: ["task-Y"]
    });
    const taskY = new MohTask({
      action_id: "task-Y",
      title: "Task Y",
      dependencies: ["task-X"]
    });

    this.mockBatchOperations.addTestData(SHEET_NAMES.ACTIONS, [
      taskX.toSheetRow(actionHeaders),
      taskY.toSheetRow(actionHeaders)
    ]);

    const allActions = [taskX, taskY];
    const chains = this.intelligentScheduler._identifyDependencyChains(allActions);

    // Depending on the implementation of _buildDependencyChain, it might detect a chain
    // or handle it as two separate tasks if the cycle is not explicitly broken.
    // For this test, we expect it to find a chain involving both tasks.
    this.assertEquals(chains.length, 1, "Should identify one chain for circular dependency.");
    const circularChain = chains[0].map(t => t.action_id);
    this.assertTrue(circularChain.includes("task-X") && circularChain.includes("task-Y"), "Circular chain should include both tasks.");
  }
  testIdentifyDependencyChains_invalidDependency() {
    // Seed ACTIONS sheet with a task having an invalid dependency
    const actionHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const taskWithInvalidDep = new MohTask({
      action_id: "task-invalid",
      title: "Task with Invalid Dependency",
      dependencies: ["non-existent-task"]
    });

    this.mockBatchOperations.addTestData(SHEET_NAMES.ACTIONS, [
      taskWithInvalidDep.toSheetRow(actionHeaders)
    ]);

    const allActions = [taskWithInvalidDep];
    const chains = this.intelligentScheduler._identifyDependencyChains(allActions);

    this.assertEquals(chains.length, 0, "Should not create any chains for a task with only invalid dependencies.");

    // Verify that a warning was logged
    const logs = this.mockLogger.getLogs();
    const warningLog = logs.find(log => log.level === 'warn' && log.message.includes('Failed to parse inline dependencies JSON for action'));
    this.assertNotNull(warningLog, "Should log a warning for invalid dependencies.");
  }

  testBackfillAndChainIdentification() {
    // 1. Backfill dependencies
    this.testBackfillDependenciesSheet_success();

    // 2. Identify chains
    const actionHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const taskA = new MohTask({ action_id: "task-A", title: "Task A", dependencies: [] });
    const taskB = new MohTask({ action_id: "task-B", title: "Task B", dependencies: ["task-A"] });
    const taskC = new MohTask({ action_id: "task-C", title: "Task C", dependencies: ["task-A", "task-B"] });
    const taskD = new MohTask({ action_id: "task-D", title: "Task D", dependencies: ["task-C"] });

    const allActions = [taskA, taskB, taskC, taskD];
    const chains = this.intelligentScheduler._identifyDependencyChains(allActions);

    this.assertEquals(chains.length, 1, "Should identify one main dependency chain after backfill.");
    const mainChain = chains[0].map(t => t.action_id);

    this.assertEquals(mainChain.length, 4, "Chain should have 4 tasks.");
    this.assertTrue(mainChain.indexOf("task-A") < mainChain.indexOf("task-B"), "task-A should precede task-B.");
    this.assertTrue(mainChain.indexOf("task-B") < mainChain.indexOf("task-C"), "task-B should precede task-C.");
    this.assertTrue(mainChain.indexOf("task-C") < mainChain.indexOf("task-D"), "task-C should precede task-D.");
  }
}

// --- Mock Implementations (simplified for testing purposes) ---

class MockConfigManagerDependencyTests {
  constructor() {
    this.config = {
      'DEFAULT_ESTIMATED_MINUTES': 30,
      'MIN_ACTIONABILITY_THRESHOLD': 0.6,
      'SCAN_MODE': 'ZERO_TRUST_TRIAGE',
      'EMAIL_BATCH_SIZE': 50,
      'EMAIL_PROCESSING_LABEL': 'MOH-Time-OS',
      'SYSTEM_EMAIL': 'noreply@script.google.com',
      'SYSTEM_EMAIL_FINGERPRINTS': ['noreply', 'no-reply'],
      'EMAIL_ACTION_KEYWORDS': ['action required', 'please'],
      [CONSTANTS.BACKFILL_DEPENDENCIES_GUARD]: false // Default for backfill guard
    };
  }
  getString(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  getNumber(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  getJSON(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  getArray(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  getBoolean(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  set(key, value) { this.config[key] = value; }
}

class MockErrorHandler {
  withRetry(func, context) { return func(); }
  executeWithCircuitBreaker(service, func) { return func(); }
  getServiceStatus(service) { return { state: 'CLOSED' }; }
}

class MockSmartLogger {
  constructor() {
    this.logs = [];
  }
  info(component, message, context) { this.logs.push({ level: 'info', component, message, context }); }
  error(component, message, context) { this.logs.push({ level: 'error', component, message, context }); }
  warn(component, message, context) { this.logs.push({ level: 'warn', component, message, context }); }
  debug(component, message, context) { this.logs.push({ level: 'debug', component, message, context }); }
  log(component, message, context) { this.logs.push({ level: 'log', component, message, context }); }
  getLogs() { return this.logs; }
}

class MockPersistentStore {
  constructor() { this.store = {}; }
  set(key, value) { this.store[key] = value; }
  get(key) { return this.store[key]; }
  delete(key) { delete this.store[key]; }
}

class MockCrossExecutionCache {
  constructor(persistentStore) { this.persistentStore = persistentStore; this.memoryCache = new Map(); }
  get(key) { return this.memoryCache.get(key) || this.persistentStore.get(key); }
  set(key, value, ttl) { this.memoryCache.set(key, value); this.persistentStore.set(key, value, ttl); }
  delete(key) { this.memoryCache.delete(key); }
  deletePattern(pattern) { /* not implemented for mock */ }
  clear() { this.memoryCache.clear(); this.persistentStore.clear(); }
}

class MockArchiveManager {
  archiveCompletedTasks() { return { success: true, archived_count: 0 }; }
}

class MockFoundationManager {
  generateDailyBlocks() { return []; }
}

class MockCalendarManager {
  syncCalendar() { return { success: true }; }
}

class MockHumanStateManager {
  getCurrentHumanState() { return { energy_level: 'MEDIUM' }; }
}

class MockDynamicLaneManager {
  loadLanes() { return []; }
  allocateLaneBlocks() { return []; }
}

// Global utility functions and classes needed by the tests and services
// These would typically be in other files but are included here for self-containment in the test file.

// Simplified MohTask for testing (ensure it matches the actual MohTask structure used by services)
class MohTask {
  constructor(data) {
    this.action_id = data.action_id || Utilities.getUuid();
    this.title = data.title;
    this.description = data.description || '';
    this.status = data.status || STATUS.PENDING;
    this.priority = data.priority || PRIORITY.MEDIUM;
    this.lane = data.lane || LANE.OPERATIONAL;
    this.estimated_minutes = data.estimated_minutes || CONSTANTS.DEFAULT_ESTIMATED_MINUTES;
    this.created_at = data.created_at || TimeZoneAwareDate.now();
    this.updated_at = data.updated_at || TimeZoneAwareDate.now();
    this.source = data.source || SOURCE.MANUAL;
    this.source_id = data.source_id || '';
    this.created_by = data.created_by || '';
    this.assigned_to = data.assigned_to || '';
    this.completion_notes = data.completion_notes || '';
    this.dependencies = data.dependencies || [];
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
  }

  isValid() {
    return !!this.title && !!this.action_id;
  }

  getValidationErrors() {
    const errors = [];
    if (!this.title) errors.push("Title is required.");
    if (!this.action_id) errors.push("Action ID is required.");
    return errors;
  }

  toSheetRow(headers) {
    const safeAccess = new SafeColumnAccess(headers);
    const row = safeAccess.createEmptyRow();
    safeAccess.setCellValue(row, 'action_id', this.action_id);
    safeAccess.setCellValue(row, 'title', this.title);
    safeAccess.setCellValue(row, 'description', this.description);
    safeAccess.setCellValue(row, 'status', this.status);
    safeAccess.setCellValue(row, 'priority', this.priority);
    safeAccess.setCellValue(row, 'lane', this.lane);
    safeAccess.setCellValue(row, 'estimated_minutes', this.estimated_minutes);
    safeAccess.setCellValue(row, 'created_at', this.created_at);
    safeAccess.setCellValue(row, 'updated_at', this.updated_at);
    safeAccess.setCellValue(row, 'source', this.source);
    safeAccess.setCellValue(row, 'source_id', this.source_id);
    safeAccess.setCellValue(row, 'created_by', this.created_by);
    safeAccess.setCellValue(row, 'assigned_to', this.assigned_to);
    safeAccess.setCellValue(row, 'completion_notes', this.completion_notes);
    safeAccess.setCellValue(row, 'dependencies', JSON.stringify(this.dependencies));
    safeAccess.setCellValue(row, 'tags', JSON.stringify(this.tags));
    safeAccess.setCellValue(row, 'scheduling_metadata', JSON.stringify(this.metadata)); // Store metadata here
    return row;
  }
}

// Simplified TimeZoneAwareDate for testing
const TimeZoneAwareDate = {
  now: () => new Date().toISOString(),
  toISOString: (date) => date.toISOString(),
  isRecent: (isoString, seconds) => {
    const date = new Date(isoString);
    const now = new Date();
    return (now.getTime() - date.getTime()) < (seconds * 1000);
  }
};

// Simplified Utilities for testing
const Utilities = {
  getUuid: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  computeDigest: (algorithm, value) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // Mock digest
  newBlob: (data, contentType) => ({
    getBytes: () => new TextEncoder().encode(data),
    getDataAsString: () => data
  }),
  gzip: (blob) => blob, // Mock gzip
  ungzip: (blob) => blob // Mock ungzip
};

// Simplified ContentService for testing
const ContentService = {
  MimeType: {
    JSON: 'application/json'
  },
  createTextOutput: (content) => ({
    _content: content,
    _mimeType: null,
    setMimeType: function(mimeType) {
      this._mimeType = mimeType;
      return this;
    }
  })
};

// Simplified CacheService for testing
const CacheService = {
  getScriptCache: () => ({
    _cache: {},
    get: function(key) { return this._cache[key]; },
    put: function(key, value, ttl) { this._cache[key] = value; },
    remove: function(key) { delete this._cache[key]; }
  })
};

// Simplified LoggerFacade for testing (only define if production LoggerFacade is unavailable)
if (typeof LoggerFacade === 'undefined') {
  this.LoggerFacade = {
    error: (component, message, context) => { console.error(`ERROR: [${component}] ${message}`, context); },
    warn: (component, message, context) => { console.warn(`WARN: [${component}] ${message}`, context); },
    info: (component, message, context) => { console.log(`INFO: [${component}] ${message}`, context); },
    debug: (component, message, context) => { console.log(`DEBUG: [${component}] ${message}`, context); }
  };
}

// Simplified global functions for testing
function getService(serviceName) {
  return container.get(serviceName);
}

function ensureBootstrapServices() {
  // In a test environment, assume services are already registered by setup()
}

function getActiveSystemSpreadsheet() {
  // Mock for testing purposes
  return {
    getSheetByName: (name) => {
      if (name === SHEET_NAMES.PROPOSED_TASKS) {
        return {
          getDataRange: () => ({
            getValues: () => {
              const headers = container.get(SERVICES.BatchOperations).getHeaders(SHEET_NAMES.PROPOSED_TASKS);
              const data = container.get(SERVICES.BatchOperations).mockSheets.get(SHEET_NAMES.PROPOSED_TASKS).data;
              return [headers, ...data];
            }
          })
        };
      }
      return null;
    }
  };
}

// TestSuite and TestRunner (assuming these are available globally or imported)
// For the purpose of this test file, I'll include minimal definitions if they are not
// already part of the project's testing framework.
// Assuming a basic TestSuite and TestRunner structure exists.
// If not, these would need to be provided or adapted.

// Minimal TestSuite and TestRunner for demonstration if not already present
if (typeof TestSuite === 'undefined') {
  class TestSuite {
    constructor(name) {
      this.name = name;
      this.tests = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
        .filter(method => method.startsWith('test') && typeof this[method] === 'function');
    }

    setup() {}
    teardown() {}

    run(testRunner) {
      testRunner.log(`Running Test Suite: ${this.name}`);
      for (const testName of this.tests) {
        try {
          this.setup();
          this[testName]();
          testRunner.pass(this.name, testName);
        } catch (e) {
          testRunner.fail(this.name, testName, e);
        } finally {
          this.teardown();
        }
      }
    }

    // Basic assertions
    assertTrue(condition, message) {
      if (!condition) throw new Error(`Assertion Failed: ${message || 'Expected true, got false'}`);
    }
    assertFalse(condition, message) {
      if (condition) throw new Error(`Assertion Failed: ${message || 'Expected false, got true'}`);
    }
    assertEquals(actual, expected, message) {
      if (actual !== expected) throw new Error(`Assertion Failed: ${message || ''} Expected: ${expected}, Actual: ${actual}`);
    }
    assertNotEquals(actual, unexpected, message) {
      if (actual === unexpected) throw new Error(`Assertion Failed: ${message || ''} Expected not: ${unexpected}, Actual: ${actual}`);
    }
    assertNull(value, message) {
      if (value !== null) throw new Error(`Assertion Failed: ${message || 'Expected null, got ' + value}`);
    }
    assertNotNull(value, message) {
      if (value === null) throw new Error(`Assertion Failed: ${message || 'Expected not null, got null'}`);
    }
    assertUndefined(value, message) {
      if (value !== undefined) throw new Error(`Assertion Failed: ${message || 'Expected undefined, got ' + value}`);
    }
    assertStringContains(haystack, needle, message) {
      if (!haystack.includes(needle)) throw new Error(`Assertion Failed: ${message || ''} Expected string "${haystack}" to contain "${needle}"`);
    }
  }

  class TestRunner {
    constructor() {
      this.results = { passed: 0, failed: 0, errors: [] };
    }

    runAll(testSuite) {
      testSuite.run(this);
      this.logResults();
    }

    pass(suiteName, testName) {
      this.results.passed++;
      console.log(`✅ ${suiteName} - ${testName}`);
    }

    fail(suiteName, testName, error) {
      this.results.failed++;
      this.results.errors.push({ suite: suiteName, test: testName, error: error.message, stack: error.stack });
      console.error(`❌ ${suiteName} - ${testName}: ${error.message}`);
      console.error(error.stack);
    }

    log(message) {
      console.log(message);
    }

    logResults() {
      console.log(`
--- Test Summary ---`);
      console.log(`Passed: ${this.results.passed}`);
      console.log(`Failed: ${this.results.failed}`);
      if (this.results.errors.length > 0) {
        console.log(`
--- Failed Tests Details ---`);
        this.results.errors.forEach(err => {
          console.error(`Suite: ${err.suite}, Test: ${err.test}`);
          console.error(`Error: ${err.error}`);
          console.error(`Stack: ${err.stack}`);
        });
      }
      console.log(`--------------------`);
    }
  }
}

// DependencyContainer (minimal mock for testing)
if (typeof container === 'undefined') {
  const DependencyContainer = function() {
    this.dependencies = {};
    this.instances = {};
  };

  DependencyContainer.prototype.register = function(name, dependency) {
    this.dependencies[name] = dependency;
    this.instances[name] = null; // Clear existing instance
  };

  DependencyContainer.prototype.get = function(name) {
    if (!this.dependencies[name]) {
      throw new Error(`Dependency ${name} not found.`);
    }
    if (!this.instances[name]) {
      // Simple instantiation for mocks, real container would handle constructor injection
      this.instances[name] = this.dependencies[name];
    }
    return this.instances[name];
  };

  DependencyContainer.prototype.has = function(name) {
    return !!this.dependencies[name];
  };

  DependencyContainer.prototype.reset = function() {
    this.dependencies = {};
    this.instances = {};
  };

  global.container = new DependencyContainer();
}
