/**
 * MOH TIME OS v2.0 - LOGGER FACADE
 *
 * Universal logging interface that provides consistent logging
 * throughout the entire application lifecycle, including bootstrap.
 *
 * Uses GAS Logger.log which is ALWAYS available, unlike console or SmartLogger.
 * This eliminates ALL runtime errors related to undefined logging methods.
 */

/**
 * Format a log message with consistent structure
 * @private
 */
function formatLogMessage(level, component, message, data) {
  const timestamp = new Date().toISOString();
  let logMessage = timestamp + ' ' + level + ' [' + component + '] ' + message;

  if (data !== null && data !== undefined) {
    try {
      if (typeof data === 'object') {
        logMessage += ' | Data: ' + JSON.stringify(data);
      } else {
        logMessage += ' | Data: ' + String(data);
      }
    } catch (error) {
      // META-LOG: Logging pipeline failure (LOG_PATH_META_THROW profile)
      // TEST: TEST_SILENT_001_FUNCTION
      Logger.log('[CRITICAL] formatLogMessage: JSON serialization failed');
      Logger.log('[CRITICAL] Component: ' + component + ' | Message: ' + message);
      Logger.log('[CRITICAL] Error: ' + error.message);

      // Include error details in log output
      logMessage += ' | Data: [Serialization Error: ' + error.message + ']';

      // Throw to prevent silent data loss in logs
      throw new Error('LoggerFacade.formatLogMessage: Failed to serialize log data: ' + error.message);
    }
  }

  return logMessage;
}

/**
 * Global Logger Facade - Safe logging for all contexts
 */
const LoggerFacade = {
  /**
   * Log info level message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} [data] - Optional data to log
   */
  info: function(component, message, data) {
    Logger.log(formatLogMessage('INFO', component, message, data));
  },

  /**
   * Log error level message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} [data] - Optional data to log
   */
  error: function(component, message, data) {
    Logger.log(formatLogMessage('ERROR', component, message, data));
  },

  /**
   * Log warning level message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} [data] - Optional data to log
   */
  warn: function(component, message, data) {
    Logger.log(formatLogMessage('WARN', component, message, data));
  },

  /**
   * Log debug level message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} [data] - Optional data to log
   */
  debug: function(component, message, data) {
    Logger.log(formatLogMessage('DEBUG', component, message, data));
  },

  /**
   * Log critical level message
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {*} [data] - Optional data to log
   */
  critical: function(component, message, data) {
    Logger.log(formatLogMessage('CRITICAL', component, message, data));
  }
};

/**
 * Get appropriate logger for current context
 * Tries SmartLogger first, falls back to LoggerFacade
 *
 * @returns {Object} Logger instance (SmartLogger or LoggerFacade)
 */
function getLogger() {
  // Try to get SmartLogger if container exists and is initialized
  if (typeof container !== 'undefined' &&
      container !== null &&
      typeof container.has === 'function' &&
      typeof container.get === 'function') {
    try {
      // Check if SmartLogger service is registered
      if (container.has(SERVICES.SmartLogger)) {
        const smartLogger = container.get(SERVICES.SmartLogger);
        if (smartLogger) {
          return smartLogger;
        }
      }
    } catch (error) {
      // META-LOG: Logger retrieval failure (LOG_PATH_META_THROW profile)
      // TEST: TEST_SILENT_002_FUNCTION
      Logger.log('[CRITICAL] getLogger: Failed to retrieve SmartLogger from container');
      Logger.log('[CRITICAL] Error: ' + error.message);
      Logger.log('[CRITICAL] Falling back to LoggerFacade');

      // For logger retrieval, fallback is acceptable - don't throw
      // Return LoggerFacade below (fall through)
    }
  }

  // Return LoggerFacade as fallback (always safe)
  return LoggerFacade;
}

/**
 * Safe console replacement for legacy code
 * Provides console-like interface using Logger
 */
if (typeof console === 'undefined' || (console && !console.log)) {
  globalThis.console = {
    log: function() {
      var args = Array.prototype.slice.call(arguments);
      Logger.log('CONSOLE: ' + args.map(String).join(' '));
    },
    error: function() {
      var args = Array.prototype.slice.call(arguments);
      Logger.log('CONSOLE ERROR: ' + args.map(String).join(' '));
    },
    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      Logger.log('CONSOLE WARN: ' + args.map(String).join(' '));
    },
    info: function() {
      var args = Array.prototype.slice.call(arguments);
      Logger.log('CONSOLE INFO: ' + args.map(String).join(' '));
    },
    debug: function() {
      var args = Array.prototype.slice.call(arguments);
      Logger.log('CONSOLE DEBUG: ' + args.map(String).join(' '));
    }
  };
}

/**
 * Initialize LoggerFacade
 * This runs immediately when file loads
 */
(function initializeLoggerFacade() {
  try {
    LoggerFacade.info('LoggerFacade', 'Logger Facade initialized successfully', {
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // META-LOG: Initialization failure (LOG_PATH_META_THROW profile)
    // TEST: TEST_SILENT_003_FUNCTION
    Logger.log('[CRITICAL] initializeLoggerFacade: Initialization failed');
    Logger.log('[CRITICAL] Error: ' + error.message);
    Logger.log('[CRITICAL] Stack: ' + (error.stack || 'No stack trace'));

    // Throw to prevent system from running with broken logging
    throw new Error('LoggerFacade initialization failed - system cannot operate without logging: ' + error.message);
  }
})();
