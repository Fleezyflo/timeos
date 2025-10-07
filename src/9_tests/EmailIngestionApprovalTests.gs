/**
 * MOH TIME OS v2.0 - Email Ingestion and Approval Tests
 *
 * Comprehensive test suite for EmailIngestionEngine's proposal creation
 * and AppSheetBridge's proposal approval functionality.
 */

function runEmailIngestionApprovalTests() {
  const testRunner = new TestRunner();
  testRunner.runAll(new EmailIngestionApprovalTestSuite());
}

class EmailIngestionApprovalTestSuite extends TestSuite {
  constructor() {
    super("Email Ingestion and Approval Tests");
  }

  setup() {
    // Mock dependencies for EmailIngestionEngine and AppSheetBridge
    this.mockConfigManager = new MockConfigManager();
    this.mockErrorHandler = new MockErrorHandler();
    this.mockLogger = new MockSmartLogger();
    this.mockPersistentStore = new MockPersistentStore();
    this.mockCache = new MockCrossExecutionCache(this.mockPersistentStore);
    this.mockBatchOperations = new MockBatchOperations(this.mockCache, this.mockLogger);
    this.mockSystemManager = new MockSystemManager(); // For AppSheetBridge

    // Clear mock sheets before each test
    this.mockBatchOperations.clearTestData();

    // Register mocks in the container for functions that use getService()
    // This is crucial for integration tests like appsheet_approveProposal
    container.register(SERVICES.ConfigManager, this.mockConfigManager);
    container.register(SERVICES.ErrorHandler, this.mockErrorHandler);
    container.register(SERVICES.SmartLogger, this.mockLogger);
    container.register(SERVICES.PersistentStore, this.mockPersistentStore);
    container.register(SERVICES.CrossExecutionCache, this.mockCache);
    container.register(SERVICES.BatchOperations, this.mockBatchOperations);
    container.register(SERVICES.SystemManager, this.mockSystemManager);
    container.register(SERVICES.EmailIngestionEngine, new EmailIngestionEngine(
      this.mockConfigManager,
      this.mockErrorHandler,
      this.mockBatchOperations,
      this.mockLogger,
      this.mockPersistentStore
    ));
    // AppSheetBridge is not directly injected into the container, but its dependencies are.
    // Global functions like appsheet_approveProposal will use getService() to retrieve dependencies.
  }

  teardown() {
    this.mockBatchOperations.clearTestData();
    container.reset(); // Clear container registrations
  }

  // --- Unit: Email ingestion -> PROPOSED_TASKS ---
  testCreateTaskProposals_validData() {
    const engine = container.get(SERVICES.EmailIngestionEngine);
    const now = TimeZoneAwareDate.now();

    const proposalDataArray = [{
      sender: "test@example.com",
      subject: "Test Subject",
      parsed_title: "Parsed Title",
      suggested_lane: LANE.OPERATIONAL,
      suggested_priority: PRIORITY.HIGH,
      suggested_duration: 60,
      confidence_score: 0.9,
      raw_content_preview: "This is a raw content preview.",
      source: SOURCE.EMAIL,
      source_id: "email_123",
      status: STATUS.PENDING,
      created_at: now,
      processed_at: ""
    }];

    engine._createTaskProposals(proposalDataArray, now);

    const proposedTasksData = this.mockBatchOperations.mockSheets.get(SHEET_NAMES.PROPOSED_TASKS).data;
    this.assertEquals(proposedTasksData.length, 1, "Should create one proposal row.");

    const headers = this.mockBatchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const safeAccess = new SafeColumnAccess(headers);
    const createdProposal = safeAccess.mapRowToObject(proposedTasksData[0]);

    this.assertNotNull(createdProposal.proposal_id, "proposal_id should be populated.");
    this.assertEquals(createdProposal.status, STATUS.PENDING, "Status should be PENDING.");
    this.assertEquals(createdProposal.sender, "test@example.com", "Sender should match.");
    this.assertEquals(createdProposal.subject, "Test Subject", "Subject should match.");
    this.assertEquals(createdProposal.parsed_title, "Parsed Title", "Parsed title should match.");
    this.assertEquals(createdProposal.suggested_lane, LANE.OPERATIONAL, "Suggested lane should match.");
    this.assertEquals(createdProposal.suggested_priority, PRIORITY.HIGH, "Suggested priority should match.");
    this.assertEquals(parseInt(createdProposal.suggested_duration), 60, "Suggested duration should match.");
    this.assertEquals(parseFloat(createdProposal.confidence_score), 0.9, "Confidence score should match.");
    this.assertEquals(createdProposal.raw_content_preview, "This is a raw content preview.", "Raw content preview should match.");
    this.assertEquals(createdProposal.source, SOURCE.EMAIL, "Source should match.");
    this.assertEquals(createdProposal.source_id, "email_123", "Source ID should match.");
    this.assertEquals(createdProposal.created_task_id, "", "created_task_id should be blank.");
    this.assertNotNull(createdProposal.created_at, "created_at should be populated.");
    this.assertEquals(createdProposal.processed_at, "", "processed_at should be blank.");

    // Verify all header columns are populated (no undefined/null)
    headers.forEach(header => {
      this.assertNotNull(createdProposal[header], `Column '${header}' should be populated (not null/undefined).`);
      this.assertNotEquals(createdProposal[header], undefined, `Column '${header}' should be populated (not undefined).`);
    });
  }

  testCreateTaskProposals_missingOptionalFields() {
    const engine = container.get(SERVICES.EmailIngestionEngine);
    const now = TimeZoneAwareDate.now();

    const proposalDataArray = [{
      sender: "minimal@example.com",
      subject: "Minimal Subject",
      parsed_title: "Minimal Title",
      // Missing suggested_lane, suggested_priority, suggested_duration, confidence_score, raw_content_preview
      source: SOURCE.EMAIL,
      source_id: "email_456",
      status: STATUS.PENDING,
      created_at: now,
      processed_at: ""
    }];

    engine._createTaskProposals(proposalDataArray, now);

    const proposedTasksData = this.mockBatchOperations.mockSheets.get(SHEET_NAMES.PROPOSED_TASKS).data;
    this.assertEquals(proposedTasksData.length, 1, "Should create one proposal row.");

    const headers = this.mockBatchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const safeAccess = new SafeColumnAccess(headers);
    const createdProposal = safeAccess.mapRowToObject(proposedTasksData[0]);

    this.assertNotNull(createdProposal.proposal_id, "proposal_id should be populated.");
    this.assertEquals(createdProposal.status, STATUS.PENDING, "Status should be PENDING.");
    this.assertEquals(createdProposal.sender, "minimal@example.com", "Sender should match.");
    this.assertEquals(createdProposal.subject, "Minimal Subject", "Subject should match.");
    this.assertEquals(createdProposal.parsed_title, "Minimal Title", "Parsed title should match.");

    // Assert that missing optional fields are blank strings
    this.assertEquals(createdProposal.suggested_lane, "", "Missing suggested_lane should be blank.");
    this.assertEquals(createdProposal.suggested_priority, "", "Missing suggested_priority should be blank.");
    this.assertEquals(createdProposal.suggested_duration, "", "Missing suggested_duration should be blank.");
    this.assertEquals(createdProposal.confidence_score, "", "Missing confidence_score should be blank.");
    this.assertEquals(createdProposal.raw_content_preview, "", "Missing raw_content_preview should be blank.");
    this.assertEquals(createdProposal.created_task_id, "", "created_task_id should be blank.");
  }

  // --- Integration: Proposal approval ---
  testAppsheetApproveProposal_success() {
    const proposalId = "prop_123";
    const now = TimeZoneAwareDate.now();

    // Seed PROPOSED_TASKS with a pending row
    const proposedTaskHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const proposedTaskSafeAccess = new SafeColumnAccess(proposedTaskHeaders);
    const pendingProposalRow = proposedTaskSafeAccess.mapObjectToRow({
      proposal_id: proposalId,
      status: PROPOSAL_STATUS.PENDING,
      created_at: now,
      processed_at: "",
      source: SOURCE.EMAIL,
      source_id: "email_abc",
      sender: "approver@example.com",
      subject: "Approve Me",
      parsed_title: "Task to Approve",
      suggested_lane: LANE.OPERATIONAL,
      suggested_priority: PRIORITY.MEDIUM,
      suggested_duration: 30,
      confidence_score: 0.8,
      raw_content_preview: "Please approve this task.",
      created_task_id: ""
    });
    this.mockBatchOperations.addTestData(SHEET_NAMES.PROPOSED_TASKS, [pendingProposalRow]);

    // Mock Session.getActiveUser().getEmail()
    global.Session = {
      getActiveUser: () => ({
        getEmail: () => "testuser@example.com"
      })
    };

    const result = appsheet_approveProposal({ proposalId: proposalId, overrides: { suggested_duration: 45, priority: PRIORITY.HIGH } });

    this.assertTrue(result.success, "Approval should be successful.");
    this.assertEquals(result.action, "approved", "Action should be 'approved'.");
    this.assertNotNull(result.action_id, "Action ID should be populated.");
    this.assertEquals(result.proposal_id, proposalId, "Proposal ID should match.");

    // Verify PROPOSED_TASKS sheet update
    const updatedProposedTasks = this.mockBatchOperations.mockSheets.get(SHEET_NAMES.PROPOSED_TASKS).data;
    this.assertEquals(updatedProposedTasks.length, 1, "PROPOSED_TASKS should still have one row.");
    const updatedProposal = proposedTaskSafeAccess.mapRowToObject(updatedProposedTasks[0]);

    this.assertEquals(updatedProposal.status, PROPOSAL_STATUS.ACCEPTED, "Proposal status should be ACCEPTED.");
    this.assertNotNull(updatedProposal.processed_at, "processed_at should be populated.");
    this.assertTrue(TimeZoneAwareDate.isRecent(updatedProposal.processed_at, 5), "processed_at should be within 5 seconds of now.");
    this.assertEquals(updatedProposal.created_task_id, result.action_id, "created_task_id should match the new action_id.");

    // Verify ACTIONS sheet creation
    const actionsData = this.mockBatchOperations.mockSheets.get(SHEET_NAMES.ACTIONS).data;
    this.assertEquals(actionsData.length, 1, "ACTIONS should have one new task row.");

    const actionHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const actionSafeAccess = new SafeColumnAccess(actionHeaders);
    const createdTask = actionSafeAccess.mapRowToObject(actionsData[0]);

    this.assertEquals(createdTask.action_id, result.action_id, "Created task's action_id should match.");
    this.assertEquals(createdTask.title, "Task to Approve", "Created task title should match.");
    this.assertEquals(createdTask.priority, PRIORITY.HIGH, "Created task priority should reflect override.");
    this.assertEquals(parseInt(createdTask.estimated_minutes), 45, "Created task duration should reflect override.");
    this.assertEquals(createdTask.status, STATUS.PENDING, "Created task status should be PENDING.");
    this.assertEquals(createdTask.source, SOURCE.EMAIL, "Created task source should be EMAIL.");
    this.assertEquals(createdTask.source_id, proposalId, "Created task source_id should be proposalId.");
    this.assertEquals(createdTask.created_by, "testuser@example.com", "Created task created_by should be test user email.");
  }

  testAppsheetApproveProposal_alreadyProcessed() {
    const proposalId = "prop_456";
    const now = TimeZoneAwareDate.now();

    // Seed PROPOSED_TASKS with an already ACCEPTED row
    const proposedTaskHeaders = this.mockBatchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const proposedTaskSafeAccess = new SafeColumnAccess(proposedTaskHeaders);
    const acceptedProposalRow = proposedTaskSafeAccess.mapObjectToRow({
      proposal_id: proposalId,
      status: PROPOSAL_STATUS.ACCEPTED,
      created_at: now,
      processed_at: now,
      source: SOURCE.EMAIL,
      source_id: "email_def",
      sender: "processed@example.com",
      subject: "Already Approved",
      parsed_title: "Processed Task",
      suggested_lane: LANE.OPERATIONAL,
      suggested_priority: PRIORITY.MEDIUM,
      suggested_duration: 30,
      confidence_score: 0.8,
      raw_content_preview: "This task was already approved.",
      created_task_id: "action_xyz"
    });
    this.mockBatchOperations.addTestData(SHEET_NAMES.PROPOSED_TASKS, [acceptedProposalRow]);

    // Mock Session.getActiveUser().getEmail()
    global.Session = {
      getActiveUser: () => ({
        getEmail: () => "testuser@example.com"
      })
    };

    const result = appsheet_approveProposal({ proposalId: proposalId });

    this.assertFalse(result.success, "Approval should fail for an already processed proposal.");
    this.assertStringContains(result.error, "Proposal not found", "Error message should indicate proposal not found or already processed.");
    this.assertUndefined(result.action_id, "Action ID should not be returned on failure.");

    // Verify no changes to PROPOSED_TASKS or ACTIONS
    const updatedProposedTasks = this.mockBatchOperations.mockSheets.get(SHEET_NAMES.PROPOSED_TASKS).data;
    this.assertEquals(updatedProposedTasks.length, 1, "PROPOSED_TASKS should remain unchanged.");
    const updatedProposal = proposedTaskSafeAccess.mapRowToObject(updatedProposedTasks[0]);
    this.assertEquals(updatedProposal.status, PROPOSAL_STATUS.ACCEPTED, "Proposal status should remain ACCEPTED.");

    const actionsData = this.mockBatchOperations.mockSheets.get(SHEET_NAMES.ACTIONS).data;
    this.assertEquals(actionsData.length, 0, "ACTIONS sheet should remain empty.");
  }
}

// --- Mock Implementations (simplified for testing purposes) ---

class MockConfigManager {
  constructor() {
    this.config = {
      'DEFAULT_ESTIMATED_MINUTES': 30,
      'MIN_ACTIONABILITY_THRESHOLD': 0.6,
      'SCAN_MODE': 'ZERO_TRUST_TRIAGE',
      'EMAIL_BATCH_SIZE': 50,
      'EMAIL_PROCESSING_LABEL': 'MOH-Time-OS',
      'SYSTEM_EMAIL': 'noreply@script.google.com',
      'SYSTEM_EMAIL_FINGERPRINTS': ['noreply', 'no-reply'],
      'EMAIL_ACTION_KEYWORDS': ['action required', 'please']
    };
  }
  getString(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  getNumber(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  getJSON(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
  getArray(key, defaultValue) { return this.config[key] !== undefined ? this.config[key] : defaultValue; }
}

class MockErrorHandler {
  withRetry(func, context) { return func(); }
  executeWithCircuitBreaker(service, func) { return func(); }
}

class MockSmartLogger {
  info(component, message, context) { /* console.log(`INFO: [${component}] ${message}`, context); */ }
  error(component, message, context) { console.error(`ERROR: [${component}] ${message}`, context); }
  warn(component, message, context) { console.warn(`WARN: [${component}] ${message}`, context); }
  debug(component, message, context) { /* console.log(`DEBUG: [${component}] ${message}`, context); */ }
  log(component, message, context) { /* console.log(`LOG: [${component}] ${message}`, context); */ }
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
  delete(key) { this.memoryCache.delete(key); this.persistentStore.delete(key); }
  deletePattern(pattern) { /* not implemented for mock */ }
  clear() { this.memoryCache.clear(); this.persistentStore.clear(); }
}

class MockSystemManager {
  getSystemStatus() {
    return {
      status: 'HEALTHY',
      message: 'System is operational',
      timestamp: TimeZoneAwareDate.now()
    };
  }
}

// Global utility functions and classes needed by the tests and services
// These would typically be in other files but are included here for self-containment in the test file.

// Simplified MohTask for testing
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

// Simplified LoggerFacade for testing (only create if the real implementation is unavailable)
if (typeof LoggerFacade === 'undefined') {
  var LoggerFacade = {
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
