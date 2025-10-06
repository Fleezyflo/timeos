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
          return PRIORITY.MEDIUM;
        } else {
          return PRIORITY.LOW;
        }
      }
      return PRIORITY.MEDIUM;
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
      const validTask = { title: 'Test Task', priority: PRIORITY.MEDIUM };
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