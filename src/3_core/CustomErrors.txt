/**
 * MOH TIME OS v2.0 - CUSTOM ERROR CLASSES
 *
 * Structured error classes for enhanced error handling and debugging.
 * Each error type includes context and categorization for better monitoring.
 *
 * Original lines: 3501-3650 from scriptA.js
 *
 * NOTE: BaseError is now in 0_BaseError.gs to ensure it loads first
 */

/**
 * Database and sheet operation errors
 */
class DatabaseError extends BaseError {
  constructor(message, context = {}) {
    super(message, {
      ...context,
      errorType: 'DATABASE',
      retryable: context.retryable !== false // Default to retryable
    });
  }

  getErrorType() {
    return ERROR_TYPES.DATABASE;
  }

  isRetryable() {
    return this.context.retryable === true;
  }

  static sheetNotFound(sheetName) {
    return new DatabaseError(`Sheet not found: ${sheetName}`, {
      sheetName,
      retryable: false,
      action: 'create_sheet'
    });
  }

  static columnNotFound(columnName, sheetName) {
    return new DatabaseError(`Column not found: ${columnName} in ${sheetName}`, {
      columnName,
      sheetName,
      retryable: false,
      action: 'add_column'
    });
  }

  static invalidData(data, reason) {
    return new DatabaseError(`Invalid data: ${reason}`, {
      data,
      reason,
      retryable: false,
      action: 'validate_data'
    });
  }

  static atomicOperationFailed(operation, reason) {
    return new DatabaseError(`Atomic operation failed: ${operation} - ${reason}`, {
      operation,
      reason,
      retryable: true,
      action: 'retry_operation'
    });
  }
}

/**
 * Validation and input errors
 */
class ValidationError extends BaseError {
  constructor(message, context = {}) {
    super(message, {
      ...context,
      errorType: 'VALIDATION',
      retryable: false
    });

    this.field = context.field;
    this.value = context.value;
    this.constraint = context.constraint;
  }

  getErrorType() {
    return ERROR_TYPES.VALIDATION;
  }

  static required(field) {
    return new ValidationError(`Required field missing: ${field}`, {
      field,
      constraint: 'required'
    });
  }

  static invalid(field, value, constraint) {
    return new ValidationError(`Invalid value for ${field}: ${value}`, {
      field,
      value,
      constraint
    });
  }

  static outOfRange(field, value, min, max) {
    return new ValidationError(`Value ${value} for ${field} must be between ${min} and ${max}`, {
      field,
      value,
      constraint: 'range',
      min,
      max
    });
  }

  static invalidEnum(field, value, validValues) {
    return new ValidationError(`Invalid enum value for ${field}: ${value}`, {
      field,
      value,
      constraint: 'enum',
      validValues
    });
  }

  static invalidFormat(field, value, expectedFormat) {
    return new ValidationError(`Invalid format for ${field}: ${value}`, {
      field,
      value,
      constraint: 'format',
      expectedFormat
    });
  }
}

/**
 * API and external service errors
 */
class ApiError extends BaseError {
  constructor(message, context = {}) {
    super(message, {
      ...context,
      errorType: 'API',
      retryable: context.retryable !== false // Default to retryable
    });

    this.service = context.service;
    this.endpoint = context.endpoint;
    this.statusCode = context.statusCode;
    this.responseBody = context.responseBody;
  }

  getErrorType() {
    return ERROR_TYPES.API;
  }

  isRetryable() {
    // Don't retry 4xx errors (client errors) except 429 (rate limit)
    if (this.statusCode >= 400 && this.statusCode < 500) {
      return this.statusCode === 429; // Rate limit
    }

    // Retry 5xx errors (server errors)
    if (this.statusCode >= 500) {
      return true;
    }

    return this.context.retryable === true;
  }

  static quotaExceeded(service, quotaType) {
    return new ApiError(`Quota exceeded for ${service}: ${quotaType}`, {
      service,
      quotaType,
      statusCode: 429,
      retryable: true,
      retryAfter: 60000 // 1 minute
    });
  }

  static unauthorized(service, operation) {
    return new ApiError(`Unauthorized access to ${service} for ${operation}`, {
      service,
      operation,
      statusCode: 401,
      retryable: false
    });
  }

  static serviceUnavailable(service) {
    return new ApiError(`Service unavailable: ${service}`, {
      service,
      statusCode: 503,
      retryable: true
    });
  }

  static timeout(service, operation, timeoutMs) {
    return new ApiError(`Timeout in ${service} for ${operation} after ${timeoutMs}ms`, {
      service,
      operation,
      timeoutMs,
      retryable: true
    });
  }

  static rateLimitExceeded(service, limit, window) {
    return new ApiError(`Rate limit exceeded for ${service}: ${limit} requests per ${window}`, {
      service,
      limit,
      window,
      statusCode: 429,
      retryable: true
    });
  }
}

/**
 * Configuration and setup errors
 */
class ConfigurationError extends BaseError {
  constructor(message, context = {}) {
    super(message, {
      ...context,
      errorType: 'CONFIGURATION',
      retryable: false
    });

    this.configKey = context.configKey;
    this.configValue = context.configValue;
    this.configSource = context.configSource;
  }

  getErrorType() {
    return ERROR_TYPES.CONFIGURATION;
  }

  static missing(key, source = 'unknown') {
    return new ConfigurationError(`Missing configuration: ${key}`, {
      configKey: key,
      configSource: source,
      action: 'set_default'
    });
  }

  static invalid(key, value, reason) {
    return new ConfigurationError(`Invalid configuration for ${key}: ${reason}`, {
      configKey: key,
      configValue: value,
      reason,
      action: 'fix_value'
    });
  }

  static parseError(key, value, format) {
    return new ConfigurationError(`Failed to parse configuration ${key} as ${format}`, {
      configKey: key,
      configValue: value,
      expectedFormat: format,
      action: 'fix_format'
    });
  }
}

/**
 * Authentication and authorization errors
 */
class AuthenticationError extends BaseError {
  constructor(message, context = {}) {
    super(message, {
      ...context,
      errorType: 'AUTHENTICATION',
      retryable: false
    });

    this.user = context.user;
    this.action = context.action;
    this.resource = context.resource;
  }

  getErrorType() {
    return ERROR_TYPES.AUTHENTICATION;
  }

  static accessDenied(user, resource) {
    return new AuthenticationError(`Access denied for user ${user} to resource ${resource}`, {
      user,
      resource,
      action: 'check_permissions'
    });
  }

  static sessionExpired(user) {
    return new AuthenticationError(`Session expired for user ${user}`, {
      user,
      action: 'reauth_required'
    });
  }

  static invalidCredentials(user) {
    return new AuthenticationError(`Invalid credentials for user ${user}`, {
      user,
      action: 'verify_credentials'
    });
  }
}

/**
 * Network and connectivity errors
 */
class NetworkError extends BaseError {
  constructor(message, context = {}) {
    super(message, {
      ...context,
      errorType: 'NETWORK',
      retryable: true
    });

    this.url = context.url;
    this.method = context.method;
    this.timeout = context.timeout;
  }

  getErrorType() {
    return ERROR_TYPES.NETWORK;
  }

  static connectionFailed(url, reason) {
    return new NetworkError(`Connection failed to ${url}: ${reason}`, {
      url,
      reason,
      retryable: true
    });
  }

  static timeout(url, method, timeoutMs) {
    return new NetworkError(`Network timeout for ${method} ${url} after ${timeoutMs}ms`, {
      url,
      method,
      timeout: timeoutMs,
      retryable: true
    });
  }
}

/**
 * Timeout errors
 */
class TimeoutError extends BaseError {
  constructor(message, context = {}) {
    super(message, {
      ...context,
      errorType: 'TIMEOUT',
      retryable: true
    });

    this.operation = context.operation;
    this.timeoutMs = context.timeoutMs;
  }

  getErrorType() {
    return ERROR_TYPES.TIMEOUT;
  }

  static operationTimeout(operation, timeoutMs) {
    return new TimeoutError(`Operation ${operation} timed out after ${timeoutMs}ms`, {
      operation,
      timeoutMs
    });
  }

  static executionTimeout(timeoutMs) {
    return new TimeoutError(`Script execution timeout after ${timeoutMs}ms`, {
      operation: 'script_execution',
      timeoutMs,
      action: 'reduce_batch_size'
    });
  }
}

/**
 * Error factory for creating appropriate error types
 */
class ErrorFactory {
  /**
   * Create error from generic error object
   */
  static fromError(error, context = {}) {
    if (error instanceof BaseError) {
      return error;
    }

    const message = error.message || String(error);
    const errorType = this.categorizeError(message);

    switch (errorType) {
      case ERROR_TYPES.DATABASE:
        return new DatabaseError(message, context);
      case ERROR_TYPES.VALIDATION:
        return new ValidationError(message, context);
      case ERROR_TYPES.API:
        return new ApiError(message, context);
      case ERROR_TYPES.CONFIGURATION:
        return new ConfigurationError(message, context);
      case ERROR_TYPES.AUTHENTICATION:
        return new AuthenticationError(message, context);
      case ERROR_TYPES.NETWORK:
        return new NetworkError(message, context);
      case ERROR_TYPES.TIMEOUT:
        return new TimeoutError(message, context);
      default:
        return new BaseError(message, { ...context, originalError: error });
    }
  }

  /**
   * Categorize error by message content
   */
  static categorizeError(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('sheet') || lowerMessage.includes('range') || lowerMessage.includes('cell')) {
      return ERROR_TYPES.DATABASE;
    }

    if (lowerMessage.includes('quota') || lowerMessage.includes('limit')) {
      return ERROR_TYPES.QUOTA;
    }

    if (lowerMessage.includes('permission') || lowerMessage.includes('authorized') || lowerMessage.includes('access')) {
      return ERROR_TYPES.AUTHENTICATION;
    }

    if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('fetch')) {
      return ERROR_TYPES.NETWORK;
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('time out')) {
      return ERROR_TYPES.TIMEOUT;
    }

    if (lowerMessage.includes('config') || lowerMessage.includes('setting')) {
      return ERROR_TYPES.CONFIGURATION;
    }

    if (lowerMessage.includes('invalid') || lowerMessage.includes('required') || lowerMessage.includes('missing')) {
      return ERROR_TYPES.VALIDATION;
    }

    return ERROR_TYPES.UNKNOWN;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error) {
    if (error instanceof BaseError) {
      return error.isRetryable && error.isRetryable();
    }

    // Default retryability based on error type
    const errorType = this.categorizeError(error.message || String(error));
    const retryableTypes = [ERROR_TYPES.API, ERROR_TYPES.NETWORK, ERROR_TYPES.TIMEOUT];
    return retryableTypes.includes(errorType);
  }

  /**
   * Get suggested retry delay for error
   */
  static getRetryDelay(error, attempt = 1) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    if (error instanceof ApiError && error.context.retryAfter) {
      return Math.min(error.context.retryAfter, maxDelay);
    }

    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, maxDelay);
  }
}

/**
 * Global error handler registration
 */
function registerGlobalErrorHandlers() {
  // Global error logging - avoid console usage for production
  function logGlobalError() {
    var args = Array.prototype.slice.call(arguments);
    try {
      Logger.log('ERROR [Console Override]: ' + args.map(function(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '));
    } catch (logError) {
      // Silently fail if logging fails
    }
    // Try to log to system if available
    if (hasService('SmartLogger')) {
      try {
        const logger = getService('SmartLogger');
        logger.error('GlobalError', 'Uncaught error', {
          args: args.map(arg => String(arg)),
          timestamp: TimeZoneAwareDate.now()
        });
      } catch (logError) {
        Logger.log('ERROR: Failed to log error: ' + logError.message);
      }
    }
  }

  // Register the global error logging function
  // Note: Global error handling is now done via Logger.log for production stability
}

/**
 * Utility functions for error handling
 */
function wrapWithErrorHandling(fn, errorHandler) {
  return function(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      const structuredError = ErrorFactory.fromError(error, {
        function: fn.name,
        args: args.length
      });

      if (errorHandler) {
        errorHandler(structuredError);
      }

      throw structuredError;
    }
  };
}

function safeExecute(fn, fallback = null, context = {}) {
  try {
    return fn();
  } catch (error) {
    const structuredError = ErrorFactory.fromError(error, context);

    if (hasService('SmartLogger')) {
      getService('SmartLogger').error('SafeExecute', 'Operation failed, using fallback', {
        error: structuredError.toLogObject(),
        hasFallback: fallback !== null
      });
    }

    if (typeof fallback === 'function') {
      return fallback(structuredError);
    }

    return fallback;
  }
}

// Register global error handlers on load
try {
  registerGlobalErrorHandlers();
} catch (error) {
  const logger = container.get(SERVICES.SmartLogger);
  logger.warn('CustomErrors', `Failed to register global error handlers: ${error.message}`);
}

/**
 * Business logic errors for domain-specific failures
 */
class BusinessLogicError extends BaseError {
  constructor(message, details = {}) {
    super(message, { ...details, errorType: 'BUSINESS_LOGIC_ERROR' });
    this.name = 'BusinessLogicError';
    this.isRetryable = false; // Business logic errors typically shouldn't be retried
    this.userMessage = details.userMessage || message;
    this.validationErrors = details.validationErrors || [];
    this.businessRule = details.businessRule || null;
  }

  /**
   * Create error for validation failures
   * @static
   */
  static validation(errors, entity = 'entity') {
    return new BusinessLogicError(
      `Validation failed for ${entity}`,
      {
        validationErrors: errors,
        userMessage: `The ${entity} contains invalid data: ${errors.join(', ')}`
      }
    );
  }

  /**
   * Create error for state transition violations
   * @static
   */
  static invalidStateTransition(currentState, targetState, entity = 'entity') {
    return new BusinessLogicError(
      `Invalid state transition from ${currentState} to ${targetState}`,
      {
        currentState,
        targetState,
        businessRule: 'STATE_TRANSITION',
        userMessage: `Cannot change ${entity} from ${currentState} to ${targetState}`
      }
    );
  }

  /**
   * Create error for constraint violations
   * @static
   */
  static constraintViolation(constraint, value, entity = 'entity') {
    return new BusinessLogicError(
      `Constraint violation: ${constraint}`,
      {
        constraint,
        value,
        businessRule: 'CONSTRAINT',
        userMessage: `The ${entity} violates constraint: ${constraint}`
      }
    );
  }

  /**
   * Format error for user display
   */
  toUserString() {
    if (this.validationErrors.length > 0) {
      return `${this.userMessage}\n• ${this.validationErrors.join('\n• ')}`;
    }
    return this.userMessage;
  }

  /**
   * Get structured error response
   */
  toJSON() {
    return {
      type: this.name,
      message: this.message,
      userMessage: this.userMessage,
      businessRule: this.businessRule,
      validationErrors: this.validationErrors,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Scheduling errors for scheduling-specific failures
 */
class SchedulingError extends BaseError {
  constructor(message, details = {}) {
    super(message, { ...details, errorType: 'SCHEDULING_ERROR' });
    this.name = 'SchedulingError';
    this.isRetryable = details.isRetryable !== false;
    this.conflictingTasks = details.conflictingTasks || [];
    this.availableSlots = details.availableSlots || [];
    this.constraint = details.constraint || null;
    this.suggestedTime = details.suggestedTime || null;
  }

  /**
   * Create error for time conflicts
   * @static
   */
  static timeConflict(task, conflictingTasks) {
    return new SchedulingError(
      `Task "${task.title}" conflicts with ${conflictingTasks.length} other task(s)`,
      {
        task,
        conflictingTasks,
        isRetryable: false,
        userMessage: `Cannot schedule "${task.title}" due to time conflicts`
      }
    );
  }

  /**
   * Create error for resource unavailability
   * @static
   */
  static resourceUnavailable(resource, requestedTime) {
    return new SchedulingError(
      `Resource "${resource}" is not available at ${requestedTime}`,
      {
        resource,
        requestedTime,
        isRetryable: true,
        userMessage: `The requested time slot is not available`
      }
    );
  }

  /**
   * Create error for constraint violations
   * @static
   */
  static constraintViolation(constraint, details) {
    return new SchedulingError(
      `Scheduling constraint violation: ${constraint}`,
      {
        constraint,
        details,
        isRetryable: false,
        userMessage: `Cannot schedule due to constraint: ${constraint}`
      }
    );
  }

  /**
   * Create error for capacity exceeded
   * @static
   */
  static capacityExceeded(date, currentLoad, maxCapacity) {
    return new SchedulingError(
      `Capacity exceeded for ${date}: ${currentLoad}/${maxCapacity}`,
      {
        date,
        currentLoad,
        maxCapacity,
        isRetryable: false,
        userMessage: `No more tasks can be scheduled for ${date}`
      }
    );
  }

  /**
   * Suggest alternative scheduling options
   */
  getSuggestions() {
    const suggestions = [];

    if (this.availableSlots.length > 0) {
      suggestions.push(`Available time slots: ${this.availableSlots.join(', ')}`);
    }

    if (this.suggestedTime) {
      suggestions.push(`Suggested alternative: ${this.suggestedTime}`);
    }

    if (this.conflictingTasks.length > 0) {
      suggestions.push(`Conflicting tasks: ${this.conflictingTasks.map(t => t.title).join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Get structured error response
   */
  toJSON() {
    return {
      type: this.name,
      message: this.message,
      isRetryable: this.isRetryable,
      conflictingTasks: this.conflictingTasks,
      availableSlots: this.availableSlots,
      constraint: this.constraint,
      suggestedTime: this.suggestedTime,
      suggestions: this.getSuggestions(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Triage errors for email processing failures
 */
class TriageError extends BaseError {
  constructor(message, details = {}) {
    super(message, { ...details, errorType: 'TRIAGE_ERROR' });
    this.name = 'TriageError';
    this.emailId = details.emailId || null;
    this.sender = details.sender || null;
    this.subject = details.subject || null;
    this.triageStage = details.triageStage || 'UNKNOWN';
    this.isRecoverable = details.isRecoverable !== false;
    this.shouldQuarantine = details.shouldQuarantine || false;
  }

  /**
   * Create error for parsing failures
   * @static
   */
  static parsingFailed(email, reason) {
    return new TriageError(
      `Failed to parse email from ${email.sender}: ${reason}`,
      {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
        triageStage: 'PARSING',
        isRecoverable: false,
        userMessage: `Could not process email: ${reason}`
      }
    );
  }

  /**
   * Create error for classification failures
   * @static
   */
  static classificationFailed(email, reason) {
    return new TriageError(
      `Failed to classify email from ${email.sender}`,
      {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
        triageStage: 'CLASSIFICATION',
        isRecoverable: true,
        reason,
        userMessage: `Could not determine email type or priority`
      }
    );
  }

  /**
   * Create error for suspicious content
   * @static
   */
  static suspiciousContent(email, suspicionReasons) {
    return new TriageError(
      `Suspicious content detected in email from ${email.sender}`,
      {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
        triageStage: 'SECURITY',
        isRecoverable: false,
        shouldQuarantine: true,
        suspicionReasons,
        userMessage: `Email quarantined for security review`
      }
    );
  }

  /**
   * Create error for sender reputation issues
   * @static
   */
  static lowSenderReputation(email, reputationScore) {
    return new TriageError(
      `Sender ${email.sender} has low reputation score: ${reputationScore}`,
      {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
        triageStage: 'REPUTATION',
        reputationScore,
        isRecoverable: false,
        shouldQuarantine: true,
        userMessage: `Email from untrusted sender`
      }
    );
  }

  /**
   * Create error for processing timeout
   * @static
   */
  static processingTimeout(email, timeoutMs) {
    return new TriageError(
      `Email processing timed out after ${timeoutMs}ms`,
      {
        emailId: email.id,
        sender: email.sender,
        subject: email.subject,
        triageStage: 'PROCESSING',
        timeoutMs,
        isRecoverable: true,
        userMessage: `Email processing took too long and was stopped`
      }
    );
  }

  /**
   * Determine if email should be retried
   */
  shouldRetry() {
    return this.isRecoverable && !this.shouldQuarantine;
  }

  /**
   * Get triage action recommendation
   */
  getRecommendedAction() {
    if (this.shouldQuarantine) {
      return 'QUARANTINE';
    }
    if (this.isRecoverable) {
      return 'RETRY';
    }
    return 'SKIP';
  }

  /**
   * Get structured error response
   */
  toJSON() {
    return {
      type: this.name,
      message: this.message,
      emailId: this.emailId,
      sender: this.sender,
      subject: this.subject,
      triageStage: this.triageStage,
      isRecoverable: this.isRecoverable,
      shouldQuarantine: this.shouldQuarantine,
      recommendedAction: this.getRecommendedAction(),
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

// Export error classes for global access
const Errors = {
  DatabaseError,
  ValidationError,
  ApiError,
  ConfigurationError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  BusinessLogicError,
  SchedulingError,
  TriageError,
  ErrorFactory
};

// Make errors globally available
if (typeof globalThis !== 'undefined') {
  globalThis.Errors = Errors;
}