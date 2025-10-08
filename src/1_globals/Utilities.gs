/**
 * MOH TIME OS v2.0 - UTILITY FUNCTIONS
 *
 * Global utility functions extracted from the original monolithic script.
 * These support models, services, and general system operations.
 *
 * Original lines: 18070-18525 from scriptA.js (utility functions)
 */

/**
 * Generate unique ID for tasks and operations
 * @returns {string} Unique identifier
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * Safely parse JSON with error handling and validation
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    // Validate input is a string before attempting parse
    if (!jsonString || typeof jsonString !== 'string') {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (error) {
    // Use SmartLogger if available, fallback to console
    const logger = safeGetService(SERVICES.SmartLogger, console);
    if (logger.warn) {
      logger.warn('Utilities', `JSON parse failed: ${error.message}`);
    } else {
      Logger.log('WARN [Utilities] JSON parse failed: ' + error.message);
    }
    return defaultValue;
  }
}

/**
 * Ensure value is an array
 * @param {*} value - Value to ensure is array
 * @returns {Array} Array value
 */
function ensureArray(value) {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Calculate aging multiplier using configurable curve type
 * @param {number} rolloverCount - Number of times task was rolled over
 * @param {Object} config - Configuration manager instance
 * @returns {number} Aging multiplier
 */
function calculateConfigurableAgingMultiplier(rolloverCount, config) {
  if (!rolloverCount || rolloverCount === 0) return 1.0;

  const curveType = config ? config.get('AGING_CURVE_TYPE', 'LINEAR') : 'LINEAR';
  const baseRate = config ? config.getNumber('AGING_BASE_RATE', 0.2) : 0.2;
  const maxMultiplier = config ? config.getNumber('AGING_MAX_MULTIPLIER', 3.0) : 3.0;

  let multiplier;

  switch (curveType.toUpperCase()) {
    case 'EXPONENTIAL': {
      const expBase = config ? config.getNumber('AGING_EXP_BASE', 1.5) : 1.5;
      multiplier = 1 + Math.pow(expBase, rolloverCount) * baseRate;
      break;
    }

    case 'LOGARITHMIC': {
      const logBase = config ? config.getNumber('AGING_LOG_BASE', 0.5) : 0.5;
      multiplier = 1 + logBase * Math.log(rolloverCount + 1);
      break;
    }

    case 'QUADRATIC': {
      multiplier = 1 + baseRate * Math.pow(rolloverCount, 2);
      break;
    }

    default: { // LINEAR
      multiplier = 1 + (rolloverCount * baseRate);
    }
  }

  return Math.min(multiplier, maxMultiplier);
}

/**
 * Sanitize string input to prevent injection attacks and ensure data safety
 * Phase 8: Enhanced with formula injection prevention and XSS hardening
 * @param {any} input - Input to sanitize (will be converted to string)
 * @returns {string} Sanitized string safe for processing
 */
function sanitizeString(input) {
  // Handle null, undefined, and non-string inputs gracefully
  if (input === null || input === undefined || typeof input !== 'string') {
    return '';
  }

  // Convert to string and trim whitespace
  let sanitized = String(input).trim();

  // Phase 8: Prevent formula injection attacks (CSV/spreadsheet formula execution)
  // Prefix dangerous formula characters with single quote to escape them
  if (sanitized.length > 0) {
    const firstChar = sanitized.charAt(0);
    if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@') {
      sanitized = "'" + sanitized;
    }
  }

  // Strip potentially dangerous HTML/script characters
  // Remove < and > characters that could be used for HTML/script injection
  sanitized = sanitized.replace(/[<>]/g, '');

  // Remove any remaining script-like patterns for additional safety
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
  sanitized = sanitized.replace(/&lt;|&gt;/g, ''); // Remove HTML entities for < and >
  sanitized = sanitized.replace(/&amp;/g, ''); // Remove encoded ampersands
  sanitized = sanitized.replace(/&quot;/g, ''); // Remove encoded quotes

  // Limit maximum length to prevent abuse
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Calculate priority decay using configurable curve and parameters
 * @param {number} daysSinceCreation - Days since task creation
 * @param {number} basePriority - Original priority score
 * @param {Object} config - Configuration manager instance
 * @returns {number} Decayed priority score
 */
function calculateConfigurablePriorityDecay(daysSinceCreation, basePriority, config) {
  if (daysSinceCreation <= 0) return basePriority;

  const decayType = config ? config.get('PRIORITY_DECAY_TYPE', 'LINEAR') : 'LINEAR';
  const decayRate = config ? config.getNumber('PRIORITY_DECAY_RATE', 0.02) : 0.02;
  const minPriority = config ? config.getNumber('PRIORITY_DECAY_MIN', 0.1) : 0.1;
  const decayThreshold = config ? config.getNumber('PRIORITY_DECAY_THRESHOLD', 0) : 0;

  if (daysSinceCreation <= decayThreshold) return basePriority;

  const effectiveDays = daysSinceCreation - decayThreshold;
  let decayFactor;

  switch (decayType.toUpperCase()) {
    case 'EXPONENTIAL': {
      const expRate = config ? config.getNumber('PRIORITY_DECAY_EXP_RATE', 0.95) : 0.95;
      decayFactor = Math.pow(expRate, effectiveDays);
      break;
    }

    case 'LOGARITHMIC': {
      const logRate = config ? config.getNumber('PRIORITY_DECAY_LOG_RATE', 0.1) : 0.1;
      decayFactor = Math.max(0.1, 1 - logRate * Math.log(effectiveDays + 1));
      break;
    }

    case 'STEP': {
      const stepSize = config ? config.getNumber('PRIORITY_DECAY_STEP_SIZE', 7) : 7;
      const stepAmount = config ? config.getNumber('PRIORITY_DECAY_STEP_AMOUNT', 0.2) : 0.2;
      const steps = Math.floor(effectiveDays / stepSize);
      decayFactor = Math.max(minPriority / basePriority, 1 - (steps * stepAmount));
      break;
    }

    default: { // LINEAR
      decayFactor = Math.max(minPriority / basePriority, 1 - (effectiveDays * decayRate));
    }
  }

  return basePriority * decayFactor;
}

/**
 * Calculate urgency score using configurable algorithms
 * @param {Date} deadline - Task deadline
 * @param {Date} scheduledTime - When task is scheduled
 * @param {Date} currentTime - Current time
 * @param {Object} config - Configuration manager
 * @returns {number} Urgency score (0-1)
 */
function calculateConfigurableUrgencyScore(deadline, scheduledTime, currentTime, config) {
  if (!deadline) {
    return config ? config.getNumber('URGENCY_NO_DEADLINE_SCORE', 0.5) : 0.5;
  }

  const timeToDeadline = deadline.getTime() - scheduledTime.getTime();
  const totalTimeAvailable = deadline.getTime() - currentTime.getTime();

  if (timeToDeadline <= 0) return 0; // Past deadline
  if (totalTimeAvailable <= 0) return 1; // Already past deadline

  const urgencyAlgorithm = config ? config.get('URGENCY_ALGORITHM', 'LINEAR') : 'LINEAR';
  const timeRatio = timeToDeadline / totalTimeAvailable;

  let urgencyScore;

  switch (urgencyAlgorithm.toUpperCase()) {
    case 'EXPONENTIAL': {
      const expSteepness = config ? config.getNumber('URGENCY_EXP_STEEPNESS', 2.0) : 2.0;
      urgencyScore = 1 - Math.pow(timeRatio, expSteepness);
      break;
    }

    case 'LOGARITHMIC': {
      urgencyScore = Math.log(2 - timeRatio) / Math.log(2);
      break;
    }

    case 'SIGMOID': {
      const sigmoidMidpoint = config ? config.getNumber('URGENCY_SIGMOID_MIDPOINT', 0.5) : 0.5;
      const sigmoidSteepness = config ? config.getNumber('URGENCY_SIGMOID_STEEPNESS', 10) : 10;
      const x = (timeRatio - sigmoidMidpoint) * sigmoidSteepness;
      urgencyScore = 1 - (1 / (1 + Math.exp(-x)));
      break;
    }

    default: { // LINEAR
      urgencyScore = 1 - timeRatio;
    }
  }

  return Math.max(0, Math.min(1, urgencyScore));
}

/**
 * THE SIREN AUDIT: Cascade Recalculation for Delayed Tasks
 *
 * When a task is running late, this function performs a ripple effect
 * recalculation for all subsequent scheduled tasks for the rest of the day.
 */
function triggerCascadeRecalculation(delayedTask, currentTime, headers, updates) {
  try {
    const logger = hasService('SmartLogger') ? getService('SmartLogger') : console;
    const batchOps = hasService('BatchOperations') ? getService('BatchOperations') : null;
    const configManager = hasService('ConfigManager') ? getService('ConfigManager') : null;

    if (!batchOps) {
      logger.error('Utilities', 'triggerCascadeRecalculation failed: BatchOperations service not available');
      return;
    }

    const todayEnd = TimeZoneAwareDate.endOfDay();

    // Step 1: Calculate the projected completion time of the delayed task
    const remainingMinutes = delayedTask.estimated_minutes || 30;
    const projectedCompletion = new Date(currentTime.getTime() + (remainingMinutes * 60 * 1000));

    logger.info('CascadeRecalculation', 'Starting cascade recalculation', {
      delayed_task: delayedTask.action_id,
      projected_completion: TimeZoneAwareDate.toISOString(projectedCompletion),
      remaining_minutes: remainingMinutes
    });

    // Step 2: Get all subsequent SCHEDULED tasks for today
    const allScheduledTasks = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, {
      status: STATUS.SCHEDULED
    });

    const subsequentTasks = [];
    for (const {data: row, sheetRow} of allScheduledTasks) {
      const action = MohTask.fromSheetRow(row, headers);

      if (!action || !action.scheduled_start) continue;

      const scheduledStart = new Date(action.scheduled_start);

      // Only include tasks scheduled to start after the delayed task's original end time
      if (scheduledStart > new Date(delayedTask.scheduled_end)) {
        subsequentTasks.push({
          action: action,
          sheetRow: sheetRow,
          originalStart: scheduledStart,
          originalEnd: new Date(action.scheduled_end)
        });
      }
    }

    // Sort by original scheduled start time
    subsequentTasks.sort((a, b) => a.originalStart.getTime() - b.originalStart.getTime());

    logger.info('CascadeRecalculation', 'Found subsequent tasks to reschedule', {
      count: subsequentTasks.length,
      tasks: subsequentTasks.map(t => ({ id: t.action.action_id, title: t.action.title }))
    });

    // Step 3: Get calendar projection to check for conflicts
    const calendarData = batchOps.getRowsByFilter(SHEET_NAMES.CALENDAR_PROJECTION, {});
    const calendarEvents = calendarData.slice(1) // Skip header
      .map(row => ({
        start: new Date(row[1]),
        end: new Date(row[2]),
        type: row[3],
        busy: row[4] === 'true'
      }))
      .filter(event => event.start >= currentTime && event.start <= todayEnd);

    // Step 4: Recalculate schedule starting from projected completion time
    let currentSlotStart = projectedCompletion;
    const rescheduledTasks = [];
    const overflowTasks = [];

    for (const taskInfo of subsequentTasks) {
      const task = taskInfo.action;
      const duration = task.estimated_minutes || 30;
      const taskEndTime = new Date(currentSlotStart.getTime() + (duration * 60 * 1000));

      // Check if this task still fits within the day
      if (taskEndTime > todayEnd) {
        // Task overflows beyond today - revert to PENDING
        task.status = STATUS.PENDING;
        task.scheduled_start = null;
        task.scheduled_end = null;
        task.rollover_count = (task.rollover_count || 0) + 1;

        overflowTasks.push({
          action_id: task.action_id,
          title: task.title,
          reason: 'Overflows beyond end of day due to cascade delay'
        });

        updates.push({
          rangeA1: `A${taskInfo.sheetRow}:Z${taskInfo.sheetRow}`,
          values: [task.toSheetRow(headers)]
        });

        continue;
      }

      // Check for conflicts with calendar events
      const hasConflict = calendarEvents.some(event =>
        event.busy &&
        !(taskEndTime <= event.start || currentSlotStart >= event.end)
      );

      if (hasConflict) {
        // Find next available slot after the conflict
        const conflictingEvents = calendarEvents
          .filter(event => event.busy && !(taskEndTime <= event.start || currentSlotStart >= event.end))
          .sort((a, b) => b.end.getTime() - a.end.getTime()); // Sort by end time descending

        if (conflictingEvents.length > 0) {
          const latestConflictEnd = conflictingEvents[0].end;
          currentSlotStart = latestConflictEnd;

          // Recalculate end time
          const newEndTime = new Date(currentSlotStart.getTime() + (duration * 60 * 1000));

          if (newEndTime > todayEnd) {
            // Still overflows - revert to PENDING
            task.status = STATUS.PENDING;
            task.scheduled_start = null;
            task.scheduled_end = null;
            task.rollover_count = (task.rollover_count || 0) + 1;

            overflowTasks.push({
              action_id: task.action_id,
              title: task.title,
              reason: 'No available slot after calendar conflicts'
            });

            updates.push({
              rangeA1: `A${taskInfo.sheetRow}:Z${taskInfo.sheetRow}`,
              values: [task.toSheetRow(headers)]
            });

            continue;
          }
        }
      }

      // Successfully rescheduled - update the task
      task.scheduled_start = TimeZoneAwareDate.toISOString(currentSlotStart);
      task.scheduled_end = TimeZoneAwareDate.toISOString(new Date(currentSlotStart.getTime() + (duration * 60 * 1000)));

      rescheduledTasks.push({
        action_id: task.action_id,
        title: task.title,
        old_start: TimeZoneAwareDate.toISOString(taskInfo.originalStart),
        new_start: task.scheduled_start,
        delay_minutes: Math.ceil((currentSlotStart.getTime() - taskInfo.originalStart.getTime()) / (1000 * 60))
      });

      updates.push({
        rangeA1: `A${taskInfo.sheetRow}:Z${taskInfo.sheetRow}`,
        values: [task.toSheetRow(headers)]
      });

      // Move to next slot
      currentSlotStart = new Date(task.scheduled_end);
    }

    // Log the cascade results
    if (rescheduledTasks.length > 0 || overflowTasks.length > 0) {
      logger.info('CascadeRecalculation', 'Cascade recalculation completed', {
        rescheduled_count: rescheduledTasks.length,
        overflow_count: overflowTasks.length,
        rescheduled_tasks: rescheduledTasks,
        overflow_tasks: overflowTasks
      });
    }

    return {
      rescheduledTasks: rescheduledTasks,
      overflowTasks: overflowTasks
    };

  } catch (error) {
    const logger = hasService('SmartLogger') ? getService('SmartLogger') : console;
    logger.error('CascadeRecalculation', 'Failed to perform cascade recalculation', {
      error: error.message,
      delayed_task: delayedTask.action_id
    });
    throw error;
  }
}

/**
 * Validate email address format
 */
function isValidEmail(email) {
  return validatePattern(email, 'EMAIL');
}

/**
 * Validate ISO date string format
 */
function isValidISODate(dateString) {
  return validatePattern(dateString, 'ISO_DATE');
}

/**
 * Validate positive integer
 */
function isValidPositiveInteger(value) {
  return validatePattern(value.toString(), 'POSITIVE_INTEGER');
}

/**
 * Validate decimal number
 */
function isValidDecimal(value) {
  return validatePattern(value.toString(), 'DECIMAL');
}

/**
 * Validate 24-hour time format (HH:mm)
 */
function isValidTime24H(timeString) {
  return validatePattern(timeString, 'TIME_24H');
}

/**
 * Safe JSON stringify with error handling
 */
function safeJSONStringify(obj, fallback = '{}') {
  try {
    if (obj === null || obj === undefined) {
      return fallback;
    }
    return JSON.stringify(obj);
  } catch (error) {
    const logger = safeGetService(SERVICES.SmartLogger, console);
    if (logger.warn) {
      logger.warn('Utilities', `JSON stringify failed: ${error.message}`);
    } else {
      Logger.log('WARN [Utilities] JSON stringify failed: ' + error.message);
    }
    return fallback;
  }
}

/**
 * Truncate string to specified length with ellipsis
 */
function truncateString(str, maxLength, suffix = '...') {
  if (!str || typeof str !== 'string') {
    return '';
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Generate random string of specified length
 */
function generateRandomString(length = 8, charset = 'abcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Deep clone object (limited implementation for GAS)
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Calculate percentage with safe division
 */
function safePercentage(numerator, denominator, decimals = 1) {
  if (!denominator || denominator === 0) {
    return 0;
  }

  const percentage = (numerator / denominator) * 100;
  return Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) {
    return '0 min';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  return `${mins}m`;
}

/**
 * Calculate moving average for array of numbers
 */
function calculateMovingAverage(values, windowSize = 5) {
  if (!values || values.length === 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }

  return result;
}


/**
 * Debounce function execution
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Get performance threshold status
 */
function getPerformanceStatus(metric, value) {
  const thresholds = PERFORMANCE_THRESHOLDS;

  switch (metric) {
    case 'cold_start':
      return value <= thresholds.COLD_START_MS ? 'GOOD' : 'SLOW';
    case 'cache_hit_rate':
      return value >= thresholds.CACHE_HIT_RATE ? 'GOOD' : 'LOW';
    case 'error_rate':
      return value <= thresholds.ERROR_RATE ? 'GOOD' : 'HIGH';
    case 'memory_usage':
      return value <= thresholds.MEMORY_LIMIT_MB ? 'GOOD' : 'HIGH';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Parse date value from various input formats
 * @param {string|Date} dateInput - Date input to parse
 * @returns {Date} Parsed date object
 */
function parseDateValue(dateInput) {
  if (!dateInput) {
    return new Date();
  }

  if (dateInput instanceof Date) {
    return dateInput;
  }

  if (typeof dateInput === 'string') {
    // Try TimeZoneAwareDate parsing first
    try {
      return TimeZoneAwareDate.parseISO(dateInput);
    } catch (error) {
      // Fall back to native parsing
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  // Return current date if parsing fails
  return new Date();
}

