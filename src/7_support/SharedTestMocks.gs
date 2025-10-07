/**
 * MOH TIME OS v2.0 - SHARED TEST MOCKS
 *
 * Centralized mock implementations to prevent duplicate class declarations
 * across multiple test files. Apps Script loads all files into global scope,
 * so duplicate class names cause SyntaxError.
 *
 * Usage: Import this file before test files in appsscript.json
 */

/**
 * Mock ErrorHandler for testing
 */
class MockErrorHandler {
  withRetry(func, context) {
    return func();
  }

  executeWithCircuitBreaker(service, func) {
    return func();
  }

  handleError(error, context) {
    Logger.log(`[MockErrorHandler] Error: ${error.message}`);
  }

  getServiceStatus(service) {
    return { state: 'CLOSED' };
  }
}

/**
 * Mock SmartLogger for testing
 */
class MockSmartLogger {
  constructor() {
    this.logs = [];
    this.currentLogLevel = 2; // INFO
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
  }

  error(component, message, context) {
    this.logs.push({ level: 'ERROR', component, message, context });
    Logger.log(`[ERROR] ${component}: ${message}`);
  }

  warn(component, message, context) {
    this.logs.push({ level: 'WARN', component, message, context });
    Logger.log(`[WARN] ${component}: ${message}`);
  }

  info(component, message, context) {
    this.logs.push({ level: 'INFO', component, message, context });
    Logger.log(`[INFO] ${component}: ${message}`);
  }

  debug(component, message, context) {
    this.logs.push({ level: 'DEBUG', component, message, context });
    Logger.log(`[DEBUG] ${component}: ${message}`);
  }

  log(component, message, context) {
    this.logs.push({ level: 'LOG', component, message, context });
    Logger.log(`[LOG] ${component}: ${message}`);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

/**
 * Mock PersistentStore for testing
 */
class MockPersistentStore {
  constructor() {
    this.store = {};
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
  }

  delete(key) {
    delete this.store[key];
  }

  getAll() {
    return Object.assign({}, this.store);
  }

  clear() {
    this.store = {};
  }
}

/**
 * Mock CrossExecutionCache for testing
 */
class MockCrossExecutionCache {
  constructor(persistentStore) {
    this.persistentStore = persistentStore || new MockPersistentStore();
    this.memoryCache = new Map();
  }

  get(key) {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    return this.persistentStore.get(key);
  }

  set(key, value, ttl) {
    this.memoryCache.set(key, value);
    this.persistentStore.set(key, value);
  }

  delete(key) {
    this.memoryCache.delete(key);
    this.persistentStore.delete(key);
  }

  clear() {
    this.memoryCache.clear();
    this.persistentStore.clear();
  }

  deletePattern(pattern) {
    // Not implemented for mock - tests don't rely on this behavior
  }

  getAll() {
    return Object.assign({}, this.memoryCache, this.persistentStore.getAll());
  }
}

/**
 * Mock ConfigManager - Base implementation
 * Test-specific versions should extend this or use composition
 */
class MockConfigManagerBase {
  constructor(customConfig) {
    this.config = Object.assign({
      'DEFAULT_ESTIMATED_MINUTES': 30,
      'MIN_ACTIONABILITY_THRESHOLD': 0.6,
      'SCAN_MODE': 'ZERO_TRUST_TRIAGE',
      'EMAIL_BATCH_SIZE': 50,
      'EMAIL_PROCESSING_LABEL': 'MOH-Time-OS',
      'SYSTEM_EMAIL': 'noreply@script.google.com',
      'SYSTEM_EMAIL_FINGERPRINTS': ['noreply', 'no-reply'],
      'EMAIL_ACTION_KEYWORDS': ['action required', 'please']
    }, customConfig || {});
  }

  get(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  getString(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  getNumber(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  getJSON(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  getArray(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  getBoolean(key, defaultValue) {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }

  set(key, value) {
    this.config[key] = value;
  }
}
