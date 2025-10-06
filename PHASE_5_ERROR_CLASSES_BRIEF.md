# PHASE 5: ERROR CLASSES - SUBAGENT BRIEF

## OBJECTIVE
Create missing error classes for proper error handling and categorization.

## TASKS

### TASK 1: Create BusinessLogicError Class
**File**: `src/3_core/BusinessLogicError.gs` (CREATE NEW FILE)
**Required Actions**:
1. Create new file in src/3_core directory
2. Implement complete error class

**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - BUSINESS LOGIC ERROR
 *
 * Error class for business rule violations and domain-specific failures.
 * Used when operations fail due to business constraints rather than technical issues.
 */

class BusinessLogicError extends BaseError {
  constructor(message, details = {}) {
    super(message, 'BUSINESS_LOGIC_ERROR', details);
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
```

### TASK 2: Create SchedulingError Class
**File**: `src/3_core/SchedulingError.gs` (CREATE NEW FILE)
**Required Actions**:
1. Create new file in src/3_core directory
2. Implement complete error class

**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - SCHEDULING ERROR
 *
 * Error class for scheduling-specific failures.
 * Used when scheduling operations fail due to conflicts, constraints, or resource issues.
 */

class SchedulingError extends BaseError {
  constructor(message, details = {}) {
    super(message, 'SCHEDULING_ERROR', details);
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
```

### TASK 3: Create TriageError Class
**File**: `src/3_core/TriageError.gs` (CREATE NEW FILE)
**Required Actions**:
1. Create new file in src/3_core directory
2. Implement complete error class

**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - TRIAGE ERROR
 *
 * Error class for email triage and processing failures.
 * Used when email processing, classification, or triage operations fail.
 */

class TriageError extends BaseError {
  constructor(message, details = {}) {
    super(message, 'TRIAGE_ERROR', details);
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
```

### TASK 4: Update Error Imports
**File**: `src/3_core/CustomErrors.gs`
**Location**: At the end of the file
**Required Actions**:
Add export references for the new error classes:

```javascript
// Add at the end of CustomErrors.gs:

// Export error classes for global access
const Errors = {
  BaseError,
  DatabaseError,
  ValidationError,
  ApiError,
  ConfigurationError,
  AuthenticationError,
  NetworkError,
  TimeoutError,
  BusinessLogicError,  // ADD THIS
  SchedulingError,     // ADD THIS
  TriageError,        // ADD THIS
  ErrorFactory
};

// Make errors globally available
if (typeof globalThis !== 'undefined') {
  globalThis.Errors = Errors;
}
```

## VALIDATION CRITERIA
1. All three error class files created
2. Each error class extends BaseError
3. Static factory methods for common error scenarios
4. Proper JSON serialization
5. Error classes available globally

## EXPECTED OUTCOME
Complete error hierarchy for proper error categorization and handling throughout the system.