/**
 * MOH TIME OS v2.0 - Calendar Projection Regression Tests
 *
 * Comprehensive test suite for CalendarSyncManager's calendar projection functionality.
 */

// Provide minimal TestSuite/TestRunner shims when the global versions aren’t preloaded.
if (typeof TestSuite === 'undefined') {
  this.TestSuite = class TestSuite {
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
  };
}

if (typeof TestRunner === 'undefined') {
  this.TestRunner = class TestRunner {
    constructor() {
      this.results = { passed: 0, failed: 0, errors: [] };
    }

    log(message) {
      console.log(message);
    }

    pass(suiteName, testName) {
      this.results.passed++;
      this.log(`PASS: ${suiteName} -> ${testName}`);
    }

    fail(suiteName, testName, error) {
      this.results.failed++;
      const errorMessage = `FAIL: ${suiteName} -> ${testName}: ${error.message}`;
      this.results.errors.push(errorMessage);
      console.error(errorMessage, error.stack);
    }

    runAll(testSuite) {
      testSuite.run(this);
      this.log(`Tests completed. Passed: ${this.results.passed}, Failed: ${this.results.failed}`);
      if (this.results.failed > 0) {
        throw new Error(`Test suite "${testSuite.name}" had ${this.results.failed} failure(s).`);
      }
    }
  };
}

function runCalendarProjectionTests() {
  const testRunner = new TestRunner();
  testRunner.runAll(new CalendarProjectionTestSuite());
}

class CalendarProjectionTestSuite extends TestSuite {
  constructor() {
    super("Calendar Projection Regression Tests");
  }

  setup() {
    // Mock dependencies
    this.mockConfigManager = new MockConfigManagerCalendarTests();
    this.mockErrorHandler = new MockErrorHandler();
    this.mockLogger = new MockSmartLogger();
    this.mockBatchOperations = new MockBatchOperations(new MockCrossExecutionCache(new MockPersistentStore()), this.mockLogger);

    // Register mocks in the container
    container.register(SERVICES.ConfigManager, this.mockConfigManager);
    container.register(SERVICES.ErrorHandler, this.mockErrorHandler);
    container.register(SERVICES.SmartLogger, this.mockLogger);
    container.register(SERVICES.BatchOperations, this.mockBatchOperations);

    // Instantiate service under test
    this.calendarSyncManager = new CalendarSyncManager(
      this.mockBatchOperations,
      this.mockConfigManager,
      this.mockErrorHandler,
      this.mockLogger
    );

    // Ensure CALENDAR_PROJECTION sheet headers are set up in mockBatchOperations
    this.mockBatchOperations.initializeMockSheets();

    // Mock global CalendarApp and TimeZoneAwareDate
    global.CalendarApp = new MockCalendarApp();
    global.TimeZoneAwareDate = new MockTimeZoneAwareDate();
  }

  teardown() {
    this.mockBatchOperations.clearTestData();
    container.reset();
    delete global.CalendarApp;
    delete global.TimeZoneAwareDate;
  }

  // --- Smoke Test: _eventToProjectionRow ---
  testEventToProjectionRow_smokeTest() {
    const mockEvent = new MockCalendarEvent({
      id: "event123",
      title: "Team Meeting",
      description: "Discuss Q3 results.",
      start: new Date("2025-10-07T09:00:00Z"),
      end: new Date("2025-10-07T10:00:00Z"),
      location: "Conference Room A",
      isAllDay: false,
      guestList: [{ getEmail: () => "john@example.com" }, { getEmail: () => "jane@example.com" }],
      creators: ["admin@example.com"],
      visibility: "PUBLIC"
    });

    const expectedHeaders = [
      'event_id', 'start', 'end', 'type', 'busy', 'title', 'description'
    ];
    // Manually set headers for CALENDAR_PROJECTION in mockBatchOperations
    this.mockBatchOperations.mockSheets.get(SHEET_NAMES.CALENDAR_PROJECTION).headers = expectedHeaders;

    const projectionRow = this.calendarSyncManager._eventToProjectionRow(mockEvent, expectedHeaders);

    this.assertEquals(projectionRow.length, expectedHeaders.length, "Projection row should have 7 columns.");

    const safeAccess = new SafeColumnAccess(expectedHeaders);
    const projectedEvent = safeAccess.mapRowToObject(projectionRow);

    this.assertEquals(projectedEvent.event_id, "event123", "event_id should match.");
    this.assertEquals(projectedEvent.start, "2025-10-07T09:00:00.000Z", "Start time should be ISO string.");
    this.assertEquals(projectedEvent.end, "2025-10-07T10:00:00.000Z", "End time should be ISO string.");
    this.assertEquals(projectedEvent.type, "meeting", "Event type should be 'meeting'.");
    this.assertEquals(projectedEvent.busy, "true", "Busy status should be 'true' string.");
    this.assertEquals(projectedEvent.title, "Team Meeting", "Title should match.");
    this.assertEquals(projectedEvent.description, "Discuss Q3 results.", "Description should match.");

    // Test with a different event type
    const mockWorkBlockEvent = new MockCalendarEvent({
      id: "event456",
      title: "Focus Block",
      description: "Deep work session.",
      start: new Date("2025-10-07T11:00:00Z"),
      end: new Date("2025-10-07T12:00:00Z"),
      isAllDay: false,
      guestList: [],
      creators: ["self@example.com"],
      visibility: "PRIVATE"
    });
    const workBlockProjectionRow = this.calendarSyncManager._eventToProjectionRow(mockWorkBlockEvent, expectedHeaders);
    const projectedWorkBlock = safeAccess.mapRowToObject(workBlockProjectionRow);
    this.assertEquals(projectedWorkBlock.type, "work_block", "Event type should be 'work_block'.");
    this.assertEquals(projectedWorkBlock.busy, "true", "Busy status should be 'true' string for work block.");
  }

  // --- End-to-End Test: refreshCalendarProjection ---
  testRefreshCalendarProjection_endToEnd() {
    const daysAhead = 2;
    const now = new Date("2025-10-07T00:00:00Z"); // Fixed date for consistent testing
    global.TimeZoneAwareDate.now = () => now.toISOString();

    // Mock CalendarApp to return specific events
    const mockEvents = [
      new MockCalendarEvent({
        id: "e1", title: "Event 1", start: new Date(now.getTime() + 3600000), end: new Date(now.getTime() + 7200000),
        guestList: [{ getEmail: () => "a@b.com" }], creators: ["c@d.com"], visibility: "PUBLIC"
      }),
      new MockCalendarEvent({
        id: "e2", title: "Event 2", start: new Date(now.getTime() + 86400000), end: new Date(now.getTime() + 90000000),
        guestList: [], creators: ["e@f.com"], visibility: "PRIVATE"
      })
    ];
    global.CalendarApp.mockEvents = mockEvents;

    // Capture calls to performAtomicSwapOrFallback
    let atomicSwapCalled = false;
    let swappedSheetName = null;
    let swappedData = null;
    this.mockBatchOperations.performAtomicSwapOrFallback = (sheetName, newData, configManager, logger) => {
      atomicSwapCalled = true;
      swappedSheetName = sheetName;
      swappedData = newData;
      // Simulate the actual behavior of replacing data
      const mockSheet = this.mockBatchOperations.mockSheets.get(sheetName);
      if (mockSheet) {
        mockSheet.headers = newData[0];
        mockSheet.data = newData.slice(1);
      }
      return true;
    };

    const processedCount = this.calendarSyncManager.refreshCalendarProjection(daysAhead);

    this.assertEquals(processedCount, mockEvents.length, "Should process all mock events.");
    this.assertTrue(atomicSwapCalled, "performAtomicSwapOrFallback should have been called.");
    this.assertEquals(swappedSheetName, SHEET_NAMES.CALENDAR_PROJECTION, "Should update CALENDAR_PROJECTION sheet.");

    // Verify headers in the swapped data
    const expectedHeaders = [
      'event_id', 'start', 'end', 'type', 'busy', 'title', 'description'
    ];
    this.assertEquals(swappedData[0].length, expectedHeaders.length, "Swapped data should have 7 headers.");
    expectedHeaders.forEach((header, index) => {
      this.assertEquals(swappedData[0][index], header, `Header at index ${index} should be ${header}.`);
    });

    // Verify content of the swapped data
    this.assertEquals(swappedData.length, mockEvents.length + 1, "Swapped data should contain headers + 2 event rows.");
    const safeAccess = new SafeColumnAccess(expectedHeaders);

    const projectedEvent1 = safeAccess.mapRowToObject(swappedData[1]);
    this.assertEquals(projectedEvent1.event_id, "e1");
    this.assertEquals(projectedEvent1.type, "meeting"); // Because of guestList

    const projectedEvent2 = safeAccess.mapRowToObject(swappedData[2]);
    this.assertEquals(projectedEvent2.event_id, "e2");
    this.assertEquals(projectedEvent2.type, "general");
  }
}

// --- Mock Implementations (simplified for testing purposes) ---

class MockConfigManagerCalendarTests {
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
      [CONSTANTS.BACKFILL_DEPENDENCIES_GUARD]: false,
      'ENABLE_CALENDAR_SYNC': true // Enable calendar sync for tests
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

// Mock CalendarApp and CalendarEvent
class MockCalendarApp {
  constructor() {
    this.mockEvents = [];
  }
  getDefaultCalendar() {
    return {
      getEvents: (start, end) => {
        return this.mockEvents.filter(event => event.start >= start && event.end <= end);
      }
    };
  }
}

class MockCalendarEvent {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.start = data.start;
    this.end = data.end;
    this.location = data.location;
    this.isAllDay = data.isAllDay;
    this.guestList = data.guestList || [];
    this.creators = data.creators || [];
    this.visibility = data.visibility;
  }
  getId() { return this.id; }
  getTitle() { return this.title; }
  getDescription() { return this.description; }
  getStartTime() { return this.start; }
  getEndTime() { return this.end; }
  getLocation() { return this.location; }
  isAllDayEvent() { return this.isAllDay; }
  getGuestList() { return this.guestList; }
  getCreators() { return this.creators; }
  getVisibility() { return this.visibility; }
}

// Simplified TimeZoneAwareDate for testing
class MockTimeZoneAwareDate {
  constructor() {
    this._now = new Date();
  }
  now() { return this._now.toISOString(); }
  toISOString(date) { return date.toISOString(); }
  isRecent(isoString, seconds) {
    const date = new Date(isoString);
    const now = new Date();
    return (now.getTime() - date.getTime()) < (seconds * 1000);
  }
}

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

// Simplified LoggerFacade for testing (only if not already provided by production code)
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
