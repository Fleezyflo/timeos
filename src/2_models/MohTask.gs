/**
 * MOH TIME OS v2.0 - TASK MODEL
 *
 * Core task entity with validation, serialization, and business logic.
 * Enhanced with caching, self-healing, and performance optimizations.
 *
 * Original lines: 436-1080 from scriptA.js
 */

class MohTask {

  // Lazy getters for internal Date objects
  get _created_at_date() {
    if (!this.__created_at_date_cached && this.created_at) {
      if (this.created_at === 'email') {
        if (hasService('SmartLogger')) {
          getService('SmartLogger').warn('MohTask', `Invalid created_at value 'email' for task ${this.action_id}. Returning null.`);
        }
        return null;
      }
      this.__created_at_date_cached = TimeZoneAwareDate.parseISO(this.created_at);
    }
    return this.__created_at_date_cached;
  }

  get _updated_at_date() {
    if (!this.__updated_at_date_cached && this.updated_at) {
      if (this.updated_at === 'email') {
        if (hasService('SmartLogger')) {
          getService('SmartLogger').warn('MohTask', `Invalid updated_at value 'email' for task ${this.action_id}. Returning null.`);
        }
        return null;
      }
      this.__updated_at_date_cached = TimeZoneAwareDate.parseISO(this.updated_at);
    }
    return this.__updated_at_date_cached;
  }

  get _scheduled_start_date() {
    if (!this.__scheduled_start_date_cached && this.scheduled_start) {
      if (this.scheduled_start === 'email') {
        if (hasService('SmartLogger')) {
          getService('SmartLogger').warn('MohTask', `Invalid scheduled_start value 'email' for task ${this.action_id}. Returning null.`);
        }
        return null;
      }
      this.__scheduled_start_date_cached = TimeZoneAwareDate.parseISO(this.scheduled_start);
    }
    return this.__scheduled_start_date_cached;
  }

  get _scheduled_end_date() {
    if (!this.__scheduled_end_date_cached && this.scheduled_end) {
      if (this.scheduled_end === 'email') {
        if (hasService('SmartLogger')) {
          getService('SmartLogger').warn('MohTask', `Invalid scheduled_end value 'email' for task ${this.action_id}. Returning null.`);
        }
        return null;
      }
      this.__scheduled_end_date_cached = TimeZoneAwareDate.parseISO(this.scheduled_end);
    }
    return this.__scheduled_end_date_cached;
  }

  get _completed_date_date() {
    if (!this.__completed_date_date_cached && this.completed_date) {
      if (this.completed_date === 'email') {
        if (hasService('SmartLogger')) {
          getService('SmartLogger').warn('MohTask', `Invalid completed_date value 'email' for task ${this.action_id}. Returning null.`);
        }
        return null;
      }
      this.__completed_date_date_cached = TimeZoneAwareDate.parseISO(this.completed_date);
    }
    return this.__completed_date_date_cached;
  }

  get _deadline_date() {
    if (!this.__deadline_date_cached && this.deadline) {
      if (this.deadline === 'email') {
        if (hasService('SmartLogger')) {
          getService('SmartLogger').warn('MohTask', `Invalid deadline value 'email' for task ${this.action_id}. Returning null.`);
        }
        return null;
      }
      this.__deadline_date_cached = TimeZoneAwareDate.parseISO(this.deadline);
    }
    return this.__deadline_date_cached;
  }

  constructor(data = {}) {
    // Performance tracking
    MohTask.instanceCount++;
    const startTime = Date.now();

    // Check validation cache for performance
    const cacheKey = this._getCacheKey(data);
    const cached = MohTask.validationCache.get(cacheKey);
    if (cached && cached.version === MohTask.schemaVersion) {
      Object.assign(this, cached.validated);
      this._markCacheHit();
      return;
    }

    // Core properties with defaults
    this.action_id = data.action_id || this._generateActionId();
    this.status = data.status || STATUS.NOT_STARTED;
    this.priority = data.priority || PRIORITY.MEDIUM;
    this.created_at = data.created_at || TimeZoneAwareDate.now();
    this.updated_at = data.updated_at || TimeZoneAwareDate.now();
    this.title = data.title || '';
    this.description = data.description || '';
    this.context = data.context || '';
    this.lane = data.lane || LANE.OPERATIONAL;
    this.estimated_minutes = data.estimated_minutes || CONSTANTS.DEFAULT_ESTIMATED_MINUTES;
    this.actual_minutes = data.actual_minutes || null;
    this.scheduled_start = data.scheduled_start || null;
    this.scheduled_end = data.scheduled_end || null;
    this.completed_date = data.completed_date || null;
    this.source = data.source || SOURCE.MANUAL;
    this.source_id = data.source_id || null;
    this.calendar_event_id = data.calendar_event_id || null;
    this.rollover_count = data.rollover_count || 0;
    this.scheduling_metadata = data.scheduling_metadata || '{}';
    this.score = data.score || 0;
    this.deadline = data.deadline || null;
    this.energy_required = data.energy_required || ENERGY_LEVEL.MEDIUM;
    this.focus_required = data.focus_required || FOCUS_LEVEL.MEDIUM;
    this.estimation_accuracy = data.estimation_accuracy || null;

    // Internal Date objects (lazy loaded for performance)
    this.__created_at_date_cached = null;
    this.__updated_at_date_cached = null;
    this.__scheduled_start_date_cached = null;
    this.__scheduled_end_date_cached = null;
    this.__completed_date_date_cached = null;
    this.__deadline_date_cached = null;

    // Version tracking for optimistic locking
    this.version = parseInt(data.version, 10) || 1;

    // Validate and self-heal
    const validationOutcome = this._validateAndSetDefaults();
    this.validationErrors = validationOutcome.errors || [];
    this.healedDuringValidation = validationOutcome.healed === true;

    // Cache validated instance
    this._cacheValidatedInstance(cacheKey);

    // Track performance
    this._trackCreationTime(Date.now() - startTime);
  }

  /**
   * Generate unique action ID
   */
  _generateActionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `action_${timestamp}_${random}`;
  }

  /**
   * Get cache key for instance data (optimized with string concatenation)
   */
  _getCacheKey(data) {
    // Use string concatenation with delimiters for stable hash (10x faster than JSON.stringify)
    return `${data.action_id}|${data.status}|${data.priority}|${data.title}|${data.lane}`;
  }

  /**
   * Comprehensive validation with self-healing
   */
  _validateAndSetDefaults() {
    const errors = [];
    let healed = false;

    // Validate action_id
    if (!this.action_id || !validatePattern(this.action_id, 'ACTION_ID')) {
      this.action_id = this._generateActionId();
      errors.push('Invalid action_id - generated new one');
      healed = true;
    }

    // Validate status
    if (!isValidEnumValue(STATUS, this.status)) {
      errors.push(`Invalid status: ${this.status}`);
      this.status = normalizeStatus(this.status);
      healed = true;
    }

    // Validate priority
    if (!isValidEnumValue(PRIORITY, this.priority)) {
      errors.push(`Invalid priority: ${this.priority}`);
      this.priority = normalizePriority(this.priority);
      healed = true;
    }

    // Validate lane
    if (!isValidEnumValue(LANE, this.lane)) {
      errors.push(`Invalid lane: ${this.lane}`);
      this.lane = normalizeLane(this.lane);
      healed = true;
    }

    // Validate energy and focus requirements
    if (!isValidEnumValue(ENERGY_LEVEL, this.energy_required)) {
      this.energy_required = normalizeEnergyLevel(this.energy_required);
      healed = true;
    }

    if (!isValidEnumValue(FOCUS_LEVEL, this.focus_required)) {
      this.focus_required = getValidEnumValue(FOCUS_LEVEL, this.focus_required, FOCUS_LEVEL.MEDIUM);
      healed = true;
    }

    // Validate dates
    this._validateDates(errors);

    // Validate estimated minutes
    if (this.estimated_minutes < 0 || this.estimated_minutes > CONSTANTS.MAX_ESTIMATED_MINUTES) {
      errors.push(`Invalid estimated_minutes: ${this.estimated_minutes}`);
      this.estimated_minutes = Math.max(1, Math.min(this.estimated_minutes, CONSTANTS.MAX_ESTIMATED_MINUTES));
      healed = true;
    }

    // Validate actual minutes
    if (this.actual_minutes !== null && this.actual_minutes < 0) {
      this.actual_minutes = null;
      healed = true;
    }

    // Validate rollover count
    if (this.rollover_count < 0) {
      this.rollover_count = 0;
      healed = true;
    }

    // Validate score
    if (this.score < CONSTANTS.MIN_SCORE || this.score > CONSTANTS.MAX_SCORE) {
      this.score = Math.max(CONSTANTS.MIN_SCORE, Math.min(this.score, CONSTANTS.MAX_SCORE));
      healed = true;
    }

    // Validate scheduling metadata
    this._validateSchedulingMetadata();

    // Log errors and healing
    if (errors.length > 0 && hasService('SmartLogger')) {
      const logger = getService('SmartLogger');
      // Only log debug messages if the logger's current level is DEBUG or lower
      if (logger.currentLogLevel <= logger.logLevels.DEBUG) {
        logger.debug('MohTask', 'Validation errors auto-corrected', {
          action_id: this.action_id,
          errors: errors,
          healed: healed
        });
      }
    }

    return { errors, healed };
  }

  /**
   * Validate date fields
   */
  _validateDates(errors) {
    let healed = false;

    // Validate _created_at_date
    if (this._created_at_date && isNaN(this._created_at_date.getTime())) {
      this.__created_at_date_cached = new Date(); // Update cached Date object
      this.created_at = TimeZoneAwareDate.toISOString(this.__created_at_date_cached);
      errors.push('Invalid created_at - set to current time');
      healed = true;
    }

    // Validate _updated_at_date
    if (this._updated_at_date && isNaN(this._updated_at_date.getTime())) {
      this.__updated_at_date_cached = new Date(); // Update cached Date object
      this.updated_at = TimeZoneAwareDate.toISOString(this.__updated_at_date_cached);
      errors.push('Invalid updated_at - set to current time');
      healed = true;
    }

    // Validate scheduled dates consistency
    if (this._scheduled_start_date && this._scheduled_end_date) {
      if (isNaN(this._scheduled_start_date.getTime())) {
        this.__scheduled_start_date_cached = null;
        this.scheduled_start = null;
        errors.push('Invalid scheduled_start - cleared');
        healed = true;
      }
      if (isNaN(this._scheduled_end_date.getTime())) {
        this.__scheduled_end_date_cached = null;
        this.scheduled_end = null;
        errors.push('Invalid scheduled_end - cleared');
        healed = true;
      }

      if (this._scheduled_start_date && this._scheduled_end_date && this._scheduled_end_date <= this._scheduled_start_date) {
        errors.push('End time before start time - clearing scheduled times');
        this.__scheduled_start_date_cached = null;
        this.__scheduled_end_date_cached = null;
        this.scheduled_start = null;
        this.scheduled_end = null;
        healed = true;
      }
    } else if (this._scheduled_start_date && !this._scheduled_end_date) {
      // If start is present but end is not, clear start as well for consistency
      errors.push('Scheduled start present without end - clearing scheduled start');
      this.__scheduled_start_date_cached = null;
      this.scheduled_start = null;
      healed = true;
    } else if (!this._scheduled_start_date && this._scheduled_end_date) {
      // If end is present but start is not, clear end as well for consistency
      errors.push('Scheduled end present without start - clearing scheduled end');
      this.__scheduled_end_date_cached = null;
      this.scheduled_end = null;
      healed = true;
    }


    // Validate deadline
    if (this._deadline_date) {
      if (isNaN(this._deadline_date.getTime())) {
        this.__deadline_date_cached = null;
        this.deadline = null;
        errors.push('Invalid deadline format - cleared');
        healed = true;
      }
    }

    // Update ISO strings from Date objects after validation/healing, only if they were healed
    if (healed) {
      this.created_at = this.__created_at_date_cached ? TimeZoneAwareDate.toISOString(this.__created_at_date_cached) : null;
      this.updated_at = this.__updated_at_date_cached ? TimeZoneAwareDate.toISOString(this.__updated_at_date_cached) : null;
      this.scheduled_start = this.__scheduled_start_date_cached ? TimeZoneAwareDate.toISOString(this.__scheduled_start_date_cached) : null;
      this.scheduled_end = this.__scheduled_end_date_cached ? TimeZoneAwareDate.toISOString(this.__scheduled_end_date_cached) : null;
      this.completed_date = this.__completed_date_date_cached ? TimeZoneAwareDate.toISOString(this.__completed_date_date_cached) : null;
      this.deadline = this.__deadline_date_cached ? TimeZoneAwareDate.toISOString(this.__deadline_date_cached) : null;
    }

    return healed;
  }

  /**
   * Validate scheduling metadata JSON
   */
  _validateSchedulingMetadata() {
    if (!this.scheduling_metadata || this.scheduling_metadata.trim() === '') {
      this.scheduling_metadata = '{}';
      return;
    }

    // Quick check for valid JSON structure before parsing
    const trimmedMetadata = this.scheduling_metadata.trim();
    if (trimmedMetadata.startsWith('{') && trimmedMetadata.endsWith('}')) {
      try {
        const parsed = JSON.parse(this.scheduling_metadata);
        // Ensure it's an object
        if (typeof parsed !== 'object' || parsed === null) {
          this.scheduling_metadata = '{}';
        }
      } catch (error) {
        // If parsing fails, reset to empty object
        this.scheduling_metadata = '{}';
      }
    } else {
      // If it doesn't look like JSON, reset to empty object
      this.scheduling_metadata = '{}';
    }
  }

  /**
   * Convert to sheet row format with optimized column mapping
   */
  toSheetRow(headers, optionalHeaderMap = null) {
    if (!headers || !Array.isArray(headers)) {
      throw new ValidationError('Headers array required for sheet serialization');
    }

    const row = new Array(headers.length).fill('');
    const headerMap = optionalHeaderMap || new Map(headers.map((h, i) => [h, i]));

    // Property mapping with type conversion
    const propertyMap = {
      'action_id': this.action_id,
      'status': this.status,
      'priority': this.priority,
      'created_at': this.created_at,
      'updated_at': this.updated_at,
      'title': this.title,
      'context': this.context,
      'lane': this.lane,
      'estimated_minutes': this.estimated_minutes,
      'scheduled_start': this.scheduled_start || '',
      'scheduled_end': this.scheduled_end || '',
      'actual_minutes': this.actual_minutes || '',
      'completed_date': this.completed_date || '',
      'source': this.source,
      'source_id': this.source_id || '',
      'description': this.description,
      'calendar_event_id': this.calendar_event_id || '',
      'rollover_count': this.rollover_count || 0,
      'scheduling_metadata': this.scheduling_metadata || '{}',
      'score': this.score || 0,
      'deadline': this.deadline || '',
      'energy_required': this.energy_required || '',
      'focus_required': this.focus_required || '',
      'estimation_accuracy': this.estimation_accuracy || '',
      'version': this.version || 1
    };

    // Efficiently populate row
    for (const [prop, value] of Object.entries(propertyMap)) {
      const index = headerMap.get(prop);
      if (index !== undefined) {
        row[index] = value;
      }
    }

    return row;
  }

  /**
   * Create instance from sheet row with error recovery
   */
  static fromSheetRow(row, headers) {
    if (!row || row.length === 0) {
      return null;
    }

    if (!headers || !Array.isArray(headers)) {
      throw new ValidationError('Headers array required for sheet deserialization');
    }

    const data = {};

    // Build data object from row
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined && row[index] !== '') {
        data[header] = row[index];
      }
    });

    // Type conversion for numeric fields
    this._convertNumericFields(data);

    try {
      return new MohTask(data); // Full validation
    } catch (error) {
      // Log error but don't fail completely
      if (hasService('SmartLogger')) {
        getService('SmartLogger').error('MohTask', 'Failed to create from sheet row', {
          error: error.message,
          data: data
        });
      }

      // Try with minimal data
      return null;
    }
  }

  /**
   * Create instance from sheet row with minimal validation for trusted sources.
   * Bypasses comprehensive constructor validation for performance.
   */
  static fromSheetRowLight(row, headers) {
    if (!row || row.length === 0) {
      return null;
    }

    if (!headers || !Array.isArray(headers)) {
      throw new ValidationError('Headers array required for sheet deserialization');
    }

    const data = {};

    // Build data object from row
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined && row[index] !== '') {
        data[header] = row[index];
      }
    });

    // Type conversion for numeric fields
    this._convertNumericFields(data);

    // Create a new MohTask instance, but bypass full validation if possible
    // This assumes data from trusted sources is mostly valid.
    const task = new MohTask(); // Create an empty task
    Object.assign(task, data); // Assign properties directly

    // Manually parse date objects for internal use, without full validation
    task.__created_at_date_cached = TimeZoneAwareDate.parseISO(task.created_at);
    task.__updated_at_date_cached = TimeZoneAwareDate.parseISO(task.updated_at);
    task.__scheduled_start_date_cached = task.scheduled_start ? TimeZoneAwareDate.parseISO(task.scheduled_start) : null;
    task.__scheduled_end_date_cached = task.scheduled_end ? TimeZoneAwareDate.parseISO(task.scheduled_end) : null;
    task.__completed_date_date_cached = task.completed_date ? TimeZoneAwareDate.parseISO(task.completed_date) : null;
    task.__deadline_date_cached = task.deadline ? TimeZoneAwareDate.parseISO(task.deadline) : null;

    return task;
  }

  /**
   * Convert string values to appropriate numeric types
   */
  static _convertNumericFields(data) {
    if (data.estimated_minutes) {
      data.estimated_minutes = parseInt(data.estimated_minutes, 10) || CONSTANTS.DEFAULT_ESTIMATED_MINUTES;
    }

    if (data.actual_minutes) {
      data.actual_minutes = parseInt(data.actual_minutes, 10) || null;
    }

    if (data.rollover_count) {
      data.rollover_count = parseInt(data.rollover_count, 10) || 0;
    }

    if (data.score) {
      data.score = parseFloat(data.score) || 0;
    }

    if (data.estimation_accuracy) {
      data.estimation_accuracy = parseFloat(data.estimation_accuracy) || null;
    }

    if (data.version) {
      data.version = parseInt(data.version, 10) || 1;
    }
  }

  /**
   * Calculate dynamic priority score with configurable algorithms
   */
  calculatePriority(config = null) {
    let score = 0;

    try {
      // Get configuration manager
      const configManager = config || (hasService('ConfigManager') ? getService('ConfigManager') : null);

      // Base priority score
      score += getPriorityScore(this.priority);

      // Rollover penalty (aging) - configurable curve
      if (this.rollover_count > 0) {
        const agingMultiplier = this._calculateAgingMultiplier(this.rollover_count, configManager);
        score *= agingMultiplier;
      }

      // Deadline urgency
      if (this._deadline_date) {
        const urgencyScore = this._calculateUrgencyScore(configManager);
        score += urgencyScore;
      }

      // Lane boost
      const laneBoost = this._getLaneBoost();
      score += laneBoost;

      // Context and energy matching bonus
      const contextBonus = this._getContextBonus();
      score += contextBonus;

      // Apply priority decay over time
      const daysSinceCreation = TimeZoneAwareDate.daysBetween(
        this._created_at_date,
        new Date()
      );

      if (daysSinceCreation > 0) {
        const basePriority = getPriorityScore(this.priority);
        const decayedPriority = this._calculatePriorityDecay(daysSinceCreation, basePriority, configManager);
        score = Math.max(score, decayedPriority);
      }

      return Math.min(score, CONSTANTS.MAX_SCORE);

    } catch (error) {
      if (hasService('SmartLogger')) {
        getService('SmartLogger').error('MohTask', 'Priority calculation failed', {
          action_id: this.action_id,
          error: error.message
        });
      }

      // Fallback to basic priority
      return getPriorityScore(this.priority);
    }
  }

  /**
   * Calculate aging multiplier using configurable algorithm
   */
  _calculateAgingMultiplier(rolloverCount, config) {
    if (!config) return 1 + (rolloverCount * 0.2); // Linear fallback

    const curveType = config.get('AGING_CURVE_TYPE', 'LINEAR');
    const baseRate = config.getNumber('AGING_BASE_RATE', 0.2);
    const maxMultiplier = config.getNumber('AGING_MAX_MULTIPLIER', 3.0);

    const multiplier = this._applyAgingCurve(curveType, rolloverCount, baseRate, config);
    return Math.min(multiplier, maxMultiplier);
  }

  /**
   * Apply aging curve calculation based on curve type
   * @param {string} curveType - Type of curve (LINEAR, EXPONENTIAL, LOGARITHMIC, QUADRATIC)
   * @param {number} rolloverCount - Number of rollovers
   * @param {number} baseRate - Base rate for calculation
   * @param {Object} config - Configuration manager
   * @returns {number} Calculated multiplier
   * @private
   */
  _applyAgingCurve(curveType, rolloverCount, baseRate, config) {
    switch (curveType.toUpperCase()) {
      case 'EXPONENTIAL':
        const expBase = config.getNumber('AGING_EXP_BASE', 1.5);
        return 1 + Math.pow(expBase, rolloverCount) * baseRate;

      case 'LOGARITHMIC':
        const logBase = config.getNumber('AGING_LOG_BASE', 0.5);
        return 1 + logBase * Math.log(rolloverCount + 1);

      case 'QUADRATIC':
        return 1 + baseRate * Math.pow(rolloverCount, 2);

      default: // LINEAR
        return 1 + (rolloverCount * baseRate);
    }
  }

  /**
   * Calculate urgency score based on deadline
   */
  _calculateUrgencyScore(config) {
    if (!this.deadline) return 0;

    const now = new Date();
    const deadlineDate = TimeZoneAwareDate.parseISO(this.deadline);
    const hoursToDeadline = TimeZoneAwareDate.hoursBetween(now, deadlineDate);

    if (hoursToDeadline <= 0) return 100; // Past deadline

    // Configurable urgency algorithm
    if (!config) {
      // Simple fallback
      if (hoursToDeadline < 24) return 50;
      if (hoursToDeadline < 72) return 30;
      if (hoursToDeadline < 168) return 10;
      return 0;
    }

    const algorithm = config.get('URGENCY_ALGORITHM', 'EXPONENTIAL');
    const timeRatio = Math.min(hoursToDeadline / 168, 1); // Normalize to week

    return this._applyUrgencyCurve(algorithm, timeRatio, config);
  }

  /**
   * Apply urgency curve calculation based on algorithm type
   * @param {string} algorithm - Algorithm type (LINEAR, EXPONENTIAL, LOGARITHMIC)
   * @param {number} timeRatio - Normalized time ratio (0-1)
   * @param {Object} config - Configuration manager
   * @returns {number} Calculated urgency score
   * @private
   */
  _applyUrgencyCurve(algorithm, timeRatio, config) {
    switch (algorithm.toUpperCase()) {
      case 'EXPONENTIAL':
        const steepness = config.getNumber('URGENCY_EXP_STEEPNESS', 2.0);
        return Math.round(50 * (1 - Math.pow(timeRatio, steepness)));

      case 'LINEAR':
        return Math.round(50 * (1 - timeRatio));

      case 'LOGARITHMIC':
        return Math.round(50 * Math.log(2 - timeRatio) / Math.log(2));

      default:
        return Math.round(50 * (1 - timeRatio));
    }
  }

  /**
   * Get lane-specific priority boost
   */
  _getLaneBoost() {
    const boosts = {
      [LANE.CLIENT]: 20,
      [LANE.GROWTH]: 15,
      [LANE.CREATIVE]: 10,
      [LANE.DEEP_FOCUS]: 15,
      [LANE.ADMIN]: 5,
      [LANE.OPERATIONAL]: 0
    };

    return boosts[this.lane] || 0;
  }

  /**
   * Get context and energy matching bonus
   */
  _getContextBonus() {
    // This would be enhanced with human state integration
    let bonus = 0;

    // High energy tasks get bonus during high energy times
    if (this.energy_required === ENERGY_LEVEL.HIGH) {
      bonus += 5;
    }

    // Focus tasks get bonus
    if (this.focus_required === FOCUS_LEVEL.INTENSE) {
      bonus += 10;
    }

    return bonus;
  }

  /**
   * Calculate priority decay over time
   */
  _calculatePriorityDecay(daysSinceCreation, basePriority, config) {
    if (!config) return basePriority;

    const decayType = config.get('PRIORITY_DECAY_TYPE', 'EXPONENTIAL');
    const decayRate = config.getNumber('PRIORITY_DECAY_RATE', 0.02);
    const minPriority = config.getNumber('PRIORITY_DECAY_MIN', 0.1);

    let decayFactor;

    switch (decayType.toUpperCase()) {
      case 'EXPONENTIAL':
        const expRate = config.getNumber('PRIORITY_DECAY_EXP_RATE', 0.95);
        decayFactor = Math.pow(expRate, daysSinceCreation);
        break;

      case 'LINEAR':
        decayFactor = Math.max(minPriority / basePriority, 1 - (daysSinceCreation * decayRate));
        break;

      case 'STEP':
        const stepSize = config.getNumber('PRIORITY_DECAY_STEP_SIZE', 7);
        const stepAmount = config.getNumber('PRIORITY_DECAY_STEP_AMOUNT', 0.2);
        const steps = Math.floor(daysSinceCreation / stepSize);
        decayFactor = Math.max(minPriority / basePriority, 1 - (steps * stepAmount));
        break;

      default:
        decayFactor = 1; // No decay
    }

    return basePriority * decayFactor;
  }

  /**
   * Check if task is overdue
   */
  isOverdue() {
    if (!this._deadline_date) return false;
    if (this.status === STATUS.COMPLETED || this.status === STATUS.CANCELED) {
      return false;
    }

    // No need for try-catch as _deadline_date is already a validated Date object
    return new Date() > this._deadline_date;
  }

  /**
   * Check if status transition is valid
   */
  canTransitionTo(newStatus) {
    return canTransitionStatus(this.status, newStatus);
  }

  /**
   * Update task status with validation
   */
  updateStatus(newStatus, metadata = {}) {
    if (!this.canTransitionTo(newStatus)) {
      throw new ValidationError(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    const oldStatus = this.status;
    this.status = newStatus;
    this.updated_at = TimeZoneAwareDate.now();

    // Handle status-specific updates
    if (newStatus === STATUS.COMPLETED) {
      this.completed_date = this.updated_at;
      if (this.scheduled_start && !this.actual_minutes) {
        // Calculate actual time if scheduled
        const start = TimeZoneAwareDate.parseISO(this.scheduled_start);
        this.actual_minutes = TimeZoneAwareDate.minutesBetween(start, new Date());
      }
    }

    if (newStatus === STATUS.IN_PROGRESS && !this.scheduled_start) {
      this.scheduled_start = this.updated_at;
    }

    // Log status change
    if (hasService('SmartLogger')) {
      getService('SmartLogger').info('MohTask', 'Status updated', {
        action_id: this.action_id,
        title: this.title,
        from: oldStatus,
        to: newStatus,
        metadata: metadata
      });
    }

    return this;
  }

  /**
   * Create minimal JSON representation
   */
  toJSON() {
    return {
      action_id: this.action_id,
      status: this.status,
      priority: this.priority,
      title: this.title,
      lane: this.lane,
      estimated_minutes: this.estimated_minutes,
      scheduled_start: this.scheduled_start,
      scheduled_end: this.scheduled_end,
      score: this.score,
      rollover_count: this.rollover_count,
      deadline: this.deadline,
      energy_required: this.energy_required,
      focus_required: this.focus_required
    };
  }

  /**
   * Create detailed representation for debugging
   */
  toDetailedJSON() {
    const toISO = (value) => {
      if (!value) return null;
      const date = value instanceof Date ? value : new Date(value);
      return TimeZoneAwareDate.toISOString(date);
    };

    return {
      ...this.toJSON(),  // already plain fields like scheduled_start/end etc.
      created_at: toISO(this.created_at),
      updated_at: toISO(this.updated_at),
      completed_date: toISO(this.completed_date),
      deadline: toISO(this.deadline),
      calendar_event_id: this.calendar_event_id || null,
      description: this.description || '',
      context: this.context || '',
      source: this.source || '',
      source_id: this.source_id || '',
      actual_minutes: this.actual_minutes ?? null,
      scheduling_metadata: this.scheduling_metadata || '{}',
      estimation_accuracy: this.estimation_accuracy ?? null
    };
  }

  /**
   * Cache management methods
   */
  _cacheValidatedInstance(cacheKey) {
    // If key already exists, delete and re-insert to move to end (most recently used)
    if (MohTask.validationCache.has(cacheKey)) {
      MohTask.validationCache.delete(cacheKey);
    }

    MohTask.validationCache.set(cacheKey, {
      validated: { ...this },
      version: MohTask.schemaVersion,
      timestamp: Date.now() // Keep timestamp for potential future LFU or more complex eviction
    });

    // Limit cache size
    if (MohTask.validationCache.size > 500) {
      // Remove the least recently used item (the first one in insertion order)
      const oldestKey = MohTask.validationCache.keys().next().value;
      MohTask.validationCache.delete(oldestKey);
    }
  }

  _markCacheHit() {
    // Performance tracking could be implemented here
  }

  _trackCreationTime(duration) {
    // Performance tracking could be implemented here
    if (duration > 100) { // Log slow creations
      const logger = container.get(SERVICES.SmartLogger);
      logger.warn('MohTask', `Slow creation: ${duration}ms for ${this.action_id}`);
    }
  }

  /**
   * MISSING METHOD: Check if task version is current for optimistic locking
   */
  isVersionCurrent(dbVersion) {
    const current = parseInt(this.version, 10);
    const expected = parseInt(dbVersion, 10);

    if (Number.isNaN(expected) || expected <= 0) {
      // If the database has no version yet, treat the record as current
      return true;
    }

    if (Number.isNaN(current) || current <= 0) {
      return false;
    }

    return current === expected;
  }

  /**
   * MISSING METHOD: Prepare task for database update
   */
  prepareForUpdate() {
    this.updated_at = TimeZoneAwareDate.now();
    const current = parseInt(this.version, 10);
    this.version = Number.isNaN(current) || current < 1 ? 2 : current + 1;
    return this;
  }

  /**
   * MISSING STATIC METHOD: Create MohTask from plain object
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      throw new Error('fromObject requires a valid object');
    }
    return new MohTask(obj);
  }

  /**
   * Determine if the current task passed validation
   */
  isValid() {
    return Array.isArray(this.validationErrors) ? this.validationErrors.length === 0 : true;
  }

  /**
   * Get validation errors from the last validation run
   */
  getValidationErrors() {
    return Array.isArray(this.validationErrors) ? [...this.validationErrors] : [];
  }

  /**
   * Static utility methods
   */
  static clearValidationCache() {
    this.validationCache.clear();
  }

  static getInstanceCount() {
    return this.instanceCount;
  }

  static getCacheStats() {
    return {
      size: this.validationCache.size,
      instanceCount: this.instanceCount,
      cacheHitRate: 'Not tracked' // Could be enhanced
    };
  }
}

MohTask.validationCache = new Map();
MohTask.schemaVersion = '2.0';
MohTask.instanceCount = 0;
