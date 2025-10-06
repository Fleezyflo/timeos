# PHASE 2: SERVICE CONTAINER - SUBAGENT BRIEF

## OBJECTIVE
Fix service container registrations, add missing services, and resolve circular dependencies.

## TASKS

### TASK 1: Add SERVICES Enum Entries
**File**: `src/1_constants/Constants.gs`
**Location**: SERVICES constant definition
**Required Actions**:
1. Find the SERVICES constant
2. Add two new service entries

**Code to Add**:
```javascript
const SERVICES = Object.freeze({
  // ... existing services (keep all existing)
  BusinessLogicValidation: 'BusinessLogicValidation',
  AuditProtocol: 'AuditProtocol'
});
```

### TASK 2: Create BusinessLogicValidation Service
**File**: `src/4_services/BusinessLogicValidation.gs` (CREATE NEW FILE)
**Required Actions**:
1. Create new file in src/4_services directory
2. Implement complete service class

**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - BUSINESS LOGIC VALIDATION SERVICE
 *
 * Provides validation for business rules and constraints.
 * Ensures data integrity and enforces domain-specific logic.
 */

class BusinessLogicValidation {
  constructor(batchOperations, logger, errorHandler) {
    this.batchOperations = batchOperations;
    this.logger = logger;
    this.errorHandler = errorHandler;
  }

  /**
   * Validate task creation data
   * @param {Object} taskData - Task data to validate
   * @returns {Object} Validation result
   */
  validateTaskCreation(taskData) {
    const errors = [];

    if (!taskData.title || taskData.title.trim().length === 0) {
      errors.push('Task title is required');
    }

    if (taskData.title && taskData.title.length > 500) {
      errors.push('Task title exceeds maximum length (500 characters)');
    }

    if (taskData.estimated_minutes && taskData.estimated_minutes < 0) {
      errors.push('Estimated minutes cannot be negative');
    }

    if (taskData.estimated_minutes && taskData.estimated_minutes > 480) {
      errors.push('Estimated minutes exceeds 8 hours (480 minutes)');
    }

    if (taskData.priority && !Object.values(PRIORITY).includes(taskData.priority)) {
      errors.push('Invalid priority value');
    }

    if (taskData.status && !Object.values(STATUS).includes(taskData.status)) {
      errors.push('Invalid status value');
    }

    if (taskData.lane && !Object.values(LANE).includes(taskData.lane)) {
      errors.push('Invalid lane value');
    }

    if (taskData.deadline) {
      const deadline = new Date(taskData.deadline);
      if (isNaN(deadline.getTime())) {
        errors.push('Invalid deadline date');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate status transition
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - Desired new status
   * @returns {boolean} Whether transition is valid
   */
  validateStateTransition(currentStatus, newStatus) {
    const validTransitions = {
      [STATUS.PENDING]: [STATUS.IN_PROGRESS, STATUS.CANCELED],
      [STATUS.IN_PROGRESS]: [STATUS.COMPLETED, STATUS.BLOCKED, STATUS.CANCELED],
      [STATUS.BLOCKED]: [STATUS.IN_PROGRESS, STATUS.CANCELED],
      [STATUS.COMPLETED]: [],
      [STATUS.CANCELED]: []
    };

    const allowed = validTransitions[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Validate schedule conflict
   * @param {Object} task - Task to schedule
   * @param {Array} existingTasks - Existing scheduled tasks
   * @returns {Object} Conflict validation result
   */
  validateScheduleConflict(task, existingTasks) {
    if (!task.scheduled_start || !task.scheduled_end) {
      return { valid: true, conflicts: [] };
    }

    const conflicts = existingTasks.filter(existing => {
      if (!existing.scheduled_start || !existing.scheduled_end) {
        return false;
      }

      const taskStart = new Date(task.scheduled_start);
      const taskEnd = new Date(task.scheduled_end);
      const existingStart = new Date(existing.scheduled_start);
      const existingEnd = new Date(existing.scheduled_end);

      return (taskStart < existingEnd && taskEnd > existingStart);
    });

    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Validate priority assignment
   * @param {Object} task - Task data
   * @returns {string} Validated priority
   */
  validatePriority(task) {
    if (!task.priority || !Object.values(PRIORITY).includes(task.priority)) {
      // Auto-assign based on deadline
      if (task.deadline) {
        const deadline = new Date(task.deadline);
        const now = new Date();
        const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);

        if (hoursUntilDeadline < 24) {
          return PRIORITY.HIGH;
        } else if (hoursUntilDeadline < 72) {
          return PRIORITY.NORMAL;
        } else {
          return PRIORITY.LOW;
        }
      }
      return PRIORITY.NORMAL;
    }
    return task.priority;
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if service works correctly
   */
  selfTest() {
    try {
      // Test task validation
      const validTask = { title: 'Test Task', priority: PRIORITY.NORMAL };
      const validation = this.validateTaskCreation(validTask);
      if (!validation.valid) return false;

      // Test state transition
      const validTransition = this.validateStateTransition(STATUS.PENDING, STATUS.IN_PROGRESS);
      if (!validTransition) return false;

      // Test invalid transition
      const invalidTransition = this.validateStateTransition(STATUS.COMPLETED, STATUS.PENDING);
      if (invalidTransition) return false;

      return true;
    } catch (error) {
      this.logger.error('BusinessLogicValidation', 'Self-test failed', { error: error.message });
      return false;
    }
  }
}
```

### TASK 3: Create AuditProtocol Service
**File**: `src/4_services/AuditProtocol.gs` (CREATE NEW FILE)
**Required Actions**:
1. Create new file in src/4_services directory
2. Implement complete service class

**Complete File Content**:
```javascript
/**
 * MOH TIME OS v2.0 - AUDIT PROTOCOL SERVICE
 *
 * Provides comprehensive system auditing and compliance logging.
 * Tracks all significant system events for security and debugging.
 */

class AuditProtocol {
  constructor(batchOperations, logger, persistentStore) {
    this.batchOperations = batchOperations;
    this.logger = logger;
    this.persistentStore = persistentStore;
    this.auditCache = [];
    this.flushInterval = 5000; // 5 seconds
  }

  /**
   * Log an audit event
   * @param {string} eventType - Type of event
   * @param {Object} details - Event details
   * @returns {string} Audit entry ID
   */
  logAuditEvent(eventType, details) {
    try {
      const auditEntry = {
        timestamp: TimeZoneAwareDate.now(),
        eventType,
        user: Session.getActiveUser().getEmail(),
        details: JSON.stringify(details),
        id: Utilities.getUuid(),
        severity: this._determineSeverity(eventType)
      };

      // Add to cache for batch writing
      this.auditCache.push([
        auditEntry.id,
        auditEntry.timestamp,
        auditEntry.eventType,
        auditEntry.user,
        auditEntry.details,
        auditEntry.severity
      ]);

      // Flush cache if needed
      if (this.auditCache.length >= 10) {
        this._flushAuditCache();
      }

      this.logger.info('AuditProtocol', 'Audit event logged', {
        eventType,
        id: auditEntry.id
      });

      return auditEntry.id;
    } catch (error) {
      this.logger.error('AuditProtocol', 'Failed to log audit event', {
        eventType,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Flush audit cache to sheet
   * @private
   */
  _flushAuditCache() {
    if (this.auditCache.length === 0) return;

    try {
      this.batchOperations.appendRows(SHEET_NAMES.LOG, this.auditCache);
      this.auditCache = [];
    } catch (error) {
      this.logger.error('AuditProtocol', 'Failed to flush audit cache', {
        error: error.message,
        cacheSize: this.auditCache.length
      });
    }
  }

  /**
   * Determine event severity
   * @private
   */
  _determineSeverity(eventType) {
    const severityMap = {
      'ERROR': 'HIGH',
      'SECURITY': 'HIGH',
      'DELETE': 'MEDIUM',
      'UPDATE': 'LOW',
      'CREATE': 'LOW',
      'VIEW': 'INFO'
    };

    for (const [key, severity] of Object.entries(severityMap)) {
      if (eventType.toUpperCase().includes(key)) {
        return severity;
      }
    }
    return 'INFO';
  }

  /**
   * Get audit trail with filters
   * @param {Object} filters - Filter criteria
   * @returns {Array} Audit entries
   */
  getAuditTrail(filters = {}) {
    try {
      // Flush any pending entries first
      this._flushAuditCache();

      const logs = this.batchOperations.getRowsByFilter(SHEET_NAMES.LOG, filters);
      return logs.map(log => ({
        id: log[0],
        timestamp: log[1],
        eventType: log[2],
        user: log[3],
        details: JSON.parse(log[4] || '{}'),
        severity: log[5] || 'INFO'
      }));
    } catch (error) {
      this.logger.error('AuditProtocol', 'Failed to retrieve audit trail', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Generate audit report
   * @param {Date} startDate - Report start date
   * @param {Date} endDate - Report end date
   * @returns {Object} Audit report summary
   */
  generateAuditReport(startDate, endDate) {
    const logs = this.getAuditTrail();
    const filtered = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });

    const summary = {
      totalEvents: filtered.length,
      byType: {},
      byUser: {},
      bySeverity: {},
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      criticalEvents: []
    };

    filtered.forEach(log => {
      summary.byType[log.eventType] = (summary.byType[log.eventType] || 0) + 1;
      summary.byUser[log.user] = (summary.byUser[log.user] || 0) + 1;
      summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;

      if (log.severity === 'HIGH') {
        summary.criticalEvents.push({
          timestamp: log.timestamp,
          type: log.eventType,
          user: log.user
        });
      }
    });

    return summary;
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if service works correctly
   */
  selfTest() {
    try {
      // Test audit logging
      const testId = this.logAuditEvent('TEST_EVENT', { test: true });
      if (!testId) return false;

      // Test severity determination
      const severity = this._determineSeverity('ERROR_TEST');
      if (severity !== 'HIGH') return false;

      return true;
    } catch (error) {
      this.logger.error('AuditProtocol', 'Self-test failed', { error: error.message });
      return false;
    }
  }
}
```

### TASK 4: Fix Service Registrations and Circular Dependencies
**File**: `src/8_setup/ServiceRegistration.gs`
**Required Actions**:
1. Add new service registrations
2. Fix circular dependency between EmailIngestionEngine and ZeroTrustTriageEngine

**Code to Add After Existing Registrations**:
```javascript
// Add these new service registrations:
container.register(
  SERVICES.BusinessLogicValidation,
  () => new BusinessLogicValidation(
    resolve(SERVICES.BatchOperations),
    resolve(SERVICES.SmartLogger),
    resolve(SERVICES.ErrorHandler)
  )
);

container.register(
  SERVICES.AuditProtocol,
  () => new AuditProtocol(
    resolve(SERVICES.BatchOperations),
    resolve(SERVICES.SmartLogger),
    resolve(SERVICES.PersistentStore)
  )
);
```

**Fix Circular Dependency - REPLACE existing registrations**:
Find and replace the EmailIngestionEngine and ZeroTrustTriageEngine registrations with:

```javascript
// Fix circular dependency with lazy loading
container.register(
  SERVICES.EmailIngestionEngine,
  () => {
    const engine = new EmailIngestionEngine(
      resolve(SERVICES.BatchOperations),
      resolve(SERVICES.ConfigManager),
      resolve(SERVICES.SmartLogger),
      resolve(SERVICES.ErrorHandler),
      resolve(SERVICES.SenderReputationManager),
      resolve(SERVICES.DynamicLaneManager)
    );
    // Set triage engine after creation to avoid circular dependency
    engine.setTriageEngine = () => container.get(SERVICES.ZeroTrustTriageEngine);
    return engine;
  }
);

container.register(
  SERVICES.ZeroTrustTriageEngine,
  () => {
    const triage = new ZeroTrustTriageEngine(
      resolve(SERVICES.BatchOperations),
      resolve(SERVICES.ConfigManager),
      resolve(SERVICES.SmartLogger),
      resolve(SERVICES.ErrorHandler),
      resolve(SERVICES.SenderReputationManager)
    );
    // Set email engine after creation to avoid circular dependency
    triage.setEmailEngine = () => container.get(SERVICES.EmailIngestionEngine);
    return triage;
  }
);
```

## VALIDATION CRITERIA
1. SERVICES enum includes BusinessLogicValidation and AuditProtocol
2. Both new service files created and complete
3. Service registrations added to ServiceRegistration.gs
4. Circular dependency resolved with lazy loading pattern

## EXPECTED OUTCOME
Service container will properly instantiate all services without circular dependency errors.