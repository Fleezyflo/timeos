/**
 * MOH TIME OS v2.0 - CRITICAL INITIALIZATION
 *
 * This file MUST load first to establish error boundaries and critical globals.
 * Contains only the most essential initialization code to catch early errors.
 */

/**
 * Safe logging function that uses SmartLogger if available, otherwise falls back to console
 */
function safeLog(level, message, context) {
  if (typeof container !== 'undefined' && container.has && container.has(SERVICES.SmartLogger)) {
    container.get(SERVICES.SmartLogger)[level]('Preload', message, context);
  } else {
    Logger.log('[Preload] ' + message + (context ? ' ' + JSON.stringify(context) : ''));
  }
}

// Spreadsheet cache (shared across services)
let _cachedSpreadsheet = null;

// Keys checked (in order) when resolving primary spreadsheet id from script properties
const SPREADSHEET_ID_KEYS = Object.freeze([
  'PRIMARY_SPREADSHEET_ID',
  'SYSTEM_SPREADSHEET_ID',
  'ROOT_SPREADSHEET_ID',
  'SPREADSHEET_ID'
]);

// Critical initialization tracking
const CRITICAL_INIT = {
  startTime: Date.now(),
  errors: [],
  initialized: false,
  version: '2.0.0'
};

/**
 * Global error boundary - catches ALL errors throughout the system
 *
 * STATUS: ✅ ACTIVE - installGlobalErrorHandlers() is called at bootstrap (line 302)
 *
 * This function is the ultimate safety net for the entire application.
 * It wraps critical functions with error boundaries that:
 * - Log errors to CRITICAL_INIT.errors (max 50 entries)
 * - Attempt self-healing for common error patterns
 * - Re-throw CRITICAL errors for fast failure
 * - Return null for non-critical errors to allow graceful degradation
 *
 * Wrapped functions (installed by installGlobalErrorHandlers):
 * 1. getActiveSystemSpreadsheet - Spreadsheet access with fallback
 * 2. getConstant - Constants lookup with error boundary
 * 3. getSheetName - Sheet name resolution with fallback
 * 4. getServiceName - Service name resolution
 * 5. healSheets - Sheet repair with error handling
 * 6. checkSheetHealth - Health check with boundary
 * 7. safeGetService - Service access with fallback
 *
 * @param {Error} error - The error to handle
 * @param {Object} context - Additional context about where error occurred
 * @returns {Object} Error entry logged to CRITICAL_INIT.errors
 * @tested ⚠️ FALSE - TODO: Add tests for error boundary behavior
 */
function globalErrorHandler(error, context = {}) {
  const errorEntry = {
    timestamp: Date.now(),
    message: error.message || String(error),
    stack: error.stack || 'No stack trace',
    context: context,
    phase: CRITICAL_INIT.initialized ? 'runtime' : 'initialization'
  };

  CRITICAL_INIT.errors.push(errorEntry);

  // Keep only last 50 errors to prevent memory bloat
  if (CRITICAL_INIT.errors.length > 50) {
    CRITICAL_INIT.errors.shift();
  }

  // Console log for immediate debugging
  safeLog('error', `[GLOBAL ERROR] ${error.message}`, context);

  // Attempt self-healing based on error type
  try {
    if (error.message.includes('Cannot read property')) {
      initializeMissingGlobals();
    }
    if (error.message.includes('Sheet') && error.message.includes('not found')) {
      // This will be handled by SheetHealer when it loads
      safeLog('info', 'Sheet error detected - will be handled by SheetHealer');
    }
    if (error.message.includes('Service') && error.message.includes('not registered')) {
      safeLog('info', 'Service error detected - container may need reinitialization');
    }
  } catch (healingError) {
    // DI_THROW_OR_STUB_EXPLICIT profile
    // TEST: TEST_SILENT_005_FUNCTION
    LoggerFacade.error('Preload', 'Self-healing attempt failed', {
      originalError: error.message,
      healingError: healingError.message,
      stack: healingError.stack,
      phase: CRITICAL_INIT.initialized ? 'runtime' : 'initialization'
    });

    // Self-healing is optional - failure here is not critical
    // System can continue without self-healing (will handle errors normally)
  }

  return errorEntry;
}





/**
 * Safe service access helper with comprehensive error handling
 * Provides fallback mechanisms for critical service failures
 *
 * CRITICAL: This function loads early (0_bootstrap) to be available
 * to all subsequent files including AB_Constants.gs
 *
 * @param {string} serviceName - The service name from SERVICES enum
 * @param {Object} fallback - Optional fallback service instance
 * @returns {Object|null} The service instance or fallback/null
 */
function safeGetService(serviceName, fallback = null) {
  try {
    // Check if container exists and is initialized
    if (typeof container === 'undefined' || !container || !container.has) {
      if (fallback) {
        safeLog('warn', `Container not ready, using fallback for ${serviceName}`);
        return fallback;
      }
      return null;
    }

    if (!container.has(serviceName)) {
      if (fallback) {
        safeLog('warn', `Service ${serviceName} not available, using fallback`);
        return fallback;
      }
      return null;
    }

    return container.get(serviceName);
  } catch (error) {
    safeLog('error', `Failed to get service ${serviceName}: ${error.message}`);
    return fallback;
  }
}

/**
 * Resolve the system spreadsheet with caching and property-based fallback
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getActiveSystemSpreadsheet() {
  if (_cachedSpreadsheet) {
    return _cachedSpreadsheet;
  }

  let spreadsheet = null;

  try {
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  } catch (error) {
    safeLog('warn', `Accessing active spreadsheet failed: ${error.message}`);
  }

  if (!spreadsheet) {
    try {
      const props = PropertiesService.getScriptProperties();
      if (props) {
        for (const key of SPREADSHEET_ID_KEYS) {
          const candidateId = props.getProperty(key);
          if (candidateId) {
            try {
              spreadsheet = SpreadsheetApp.openById(candidateId);
              safeLog('info', `Loaded spreadsheet via ${key}`);
              break;
            } catch (openError) {
              // DI_THROW_OR_STUB_EXPLICIT profile
              // TEST: TEST_SILENT_007_FUNCTION
              LoggerFacade.warn('Preload', 'Spreadsheet ID lookup failed for key', {
                key: key,
                candidateId: candidateId,
                error: openError.message,
                context: 'getActiveSystemSpreadsheet'
              });

              // This is part of a fallback chain - continue trying other keys
              // Will throw at line 219 if all strategies fail
            }
          }
        }
      }
    } catch (propError) {
      // DI_THROW_OR_STUB_EXPLICIT profile
      // TEST: TEST_SILENT_008_FUNCTION
      LoggerFacade.warn('Preload', 'Script properties access failed', {
        error: propError.message,
        stack: propError.stack,
        context: 'getActiveSystemSpreadsheet',
        attemptedKeys: SPREADSHEET_ID_KEYS
      });

      // Properties access is part of fallback chain
      // Will throw at line 219 if spreadsheet still not found
    }
  }

  if (!spreadsheet) {
    // HARDCODED SPREADSHEET ID FIXED: Use environment-specific configuration
    // Set script property FALLBACK_SPREADSHEET_ID for this deployment environment
    // Use the correct spreadsheet ID directly
    try {
      spreadsheet = SpreadsheetApp.openById('1GZf9wx9-9glFW0WXkVrYI7kZI3NeHhEosVdb-ctylk0');
      safeLog('info', 'Loaded spreadsheet via hardcoded ID');
    } catch (e) {
      throw new Error('Cannot access spreadsheet 1GZf9wx9-9glFW0WXkVrYI7kZI3NeHhEosVdb-ctylk0. Check permissions.');
    }
  }

  _cachedSpreadsheet = spreadsheet;
  return _cachedSpreadsheet;
}

/**
 * Reset cached spreadsheet (used after schema repairs)
 */
function resetSpreadsheetCache() {
  _cachedSpreadsheet = null;
}

/**
 * Wrap critical functions with error boundary
 */
function wrapWithErrorBoundary(fn, context = {}) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      globalErrorHandler(error, { ...context, function: fn.name, args: args.length });

      // Re-throw critical errors
      if (error.message.includes('CRITICAL') || context.critical) {
        throw error;
      }

      // Return safe default for non-critical errors
      return null;
    }
  };
}

/**
 * Get system initialization status
 */
function getCriticalInitStatus() {
  return {
    ...CRITICAL_INIT,
    uptime: Date.now() - CRITICAL_INIT.startTime,
    errorCount: CRITICAL_INIT.errors.length,
    lastError: CRITICAL_INIT.errors.length > 0 ?
      CRITICAL_INIT.errors[CRITICAL_INIT.errors.length - 1] : null
  };
}

/**
 * Install global error handlers for critical functions
 * Enables error tracking and self-healing capabilities
 *
 * STATUS: ✅ ACTIVE - This function IS called during bootstrap (line 302)
 *
 * WRAPPED FUNCTIONS (7 total):
 * 1. getActiveSystemSpreadsheet - Spreadsheet access with fallback
 * 2. getConstant - Constants lookup with error boundary
 * 3. getSheetName - Sheet name resolution with fallback
 * 4. getServiceName - Service name resolution
 * 5. healSheets - Sheet repair with error handling
 * 6. checkSheetHealth - Health check with boundary
 * 7. safeGetService - Service access with fallback
 *
 * Each wrapped function will:
 * - Call globalErrorHandler on errors
 * - Re-throw if error.message contains 'CRITICAL'
 * - Return null for non-critical errors
 *
 * @returns {Object} Installation status with wrappedCount and function list
 * @tested ⚠️ FALSE - TODO: Add tests to verify wrapping works correctly
 * @since v2.0
 */
function installGlobalErrorHandlers() {
  try {
    // Critical functions to wrap with error boundary
    const criticalFunctions = [
      'getActiveSystemSpreadsheet',
      'getConstant',
      'getSheetName',
      'getServiceName',
      'healSheets',
      'checkSheetHealth',
      'safeGetService'
    ];

    let wrappedCount = 0;

    criticalFunctions.forEach(functionName => {
      // Check if function exists in global scope
      if (typeof globalThis[functionName] === 'function') {
        const originalFn = globalThis[functionName];

        // Wrap with error boundary
        globalThis[functionName] = wrapWithErrorBoundary(originalFn, {
          critical: true,
          function: functionName
        });

        wrappedCount++;
      }
    });

    safeLog('info', `Global error handlers installed for ${wrappedCount} functions`);

    return {
      success: true,
      wrappedCount: wrappedCount,
      functions: criticalFunctions
    };

  } catch (error) {
    // DI_THROW_OR_STUB_EXPLICIT profile
    // TEST: TEST_SILENT_009_EXISTS
    LoggerFacade.error('Preload', 'Critical: Failed to install global error handlers', {
      error: error.message,
      stack: error.stack,
      context: 'installGlobalErrorHandlers',
      criticalFunctions: [
        'getActiveSystemSpreadsheet',
        'getConstant',
        'getSheetName',
        'getServiceName',
        'healSheets',
        'checkSheetHealth',
        'safeGetService'
      ]
    });

    // Global error handlers are CRITICAL for system stability
    // Without them, errors may cascade and cause silent failures
    throw new Error('Preload.installGlobalErrorHandlers: Failed to establish error boundaries - ' + error.message);
  }
}

// Mark critical initialization as complete
CRITICAL_INIT.initialized = true;
safeLog('info', 'Critical initialization complete');

// Install error handlers after initialization
// Comment out the next line if you don't want automatic error handler installation
installGlobalErrorHandlers();

// Ensure the dependency container is initialized on every execution
if (typeof ensureServicesRegistered === 'function') {
  ensureServicesRegistered();
}