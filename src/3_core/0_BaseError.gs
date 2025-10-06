/**
 * MOH TIME OS v2.0 - BASE ERROR CLASS
 *
 * Base error class that all custom errors extend from.
 * Must be loaded before any other error classes.
 *
 * Prefixed with 0_ to ensure it loads first alphabetically.
 */

/**
 * Base error class for all custom errors in the system
 */
class BaseError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = typeof TimeZoneAwareDate !== 'undefined' ? TimeZoneAwareDate.now() : new Date().toISOString();
    this.stackTrace = this.stack;

    // Ensure stack trace is captured
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Additional metadata
    this.details = context.details || {};
    this.errorCode = context.errorCode || 'UNKNOWN_ERROR';
    this.isRetryable = context.isRetryable || false;
    this.severity = context.severity || 'ERROR';
  }

  /**
   * Convert error to structured format for logging
   * @returns {Object} Structured error object
   */
  toObject() {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      timestamp: this.timestamp,
      context: this.context,
      details: this.details,
      isRetryable: this.isRetryable,
      severity: this.severity,
      stackTrace: this.stackTrace
    };
  }

  /**
   * Convert error to JSON string
   * @returns {string} JSON representation
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Log the error using available logging mechanism
   */
  log() {
    const errorObj = this.toObject();
    const logMessage = `${this.severity} [${this.name}]: ${this.message} - ${JSON.stringify(errorObj)}`;

    // Use Logger.log as fallback (always available in GAS)
    Logger.log(logMessage);

    // Try to use LoggerFacade if available
    if (typeof LoggerFacade !== 'undefined' && LoggerFacade.error) {
      LoggerFacade.error(this.name, this.message, errorObj);
    }
  }
}