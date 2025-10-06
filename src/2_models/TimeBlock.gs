/**
 * MOH TIME OS v2.0 - TIME BLOCK MODEL
 *
 * Time block entity for calendar projection and scheduling.
 * Represents available time slots and scheduled activities.
 *
 * Original lines: 1081-1250 from scriptA.js
 */

class TimeBlock {

  constructor(data = {}) {
    TimeBlock.instanceCount++;

    // Validate required fields
    if (!data.start_time && !data.end_time) {
      throw new ValidationError('TimeBlock requires start_time and end_time');
    }

    // Core properties
    this.block_id = data.block_id || this._generateBlockId();
    this.start_time = this._parseTime(data.start_time);
    this.end_time = this._parseTime(data.end_time);
    this.duration_minutes = data.duration_minutes || this._calculateDuration();
    this.block_type = data.block_type || BLOCK_TYPE.WORK;
    this.energy_level = data.energy_level || ENERGY_LEVEL.MEDIUM;
    this.context = data.context || CONTEXT.OFFICE;
    this.available = data.available !== false; // Default to true
    this.busy = data.busy === true; // Default to false
    this.title = data.title || '';
    this.description = data.description || '';
    this.task_id = data.task_id || null; // Associated task
    this.created_at = data.created_at || TimeZoneAwareDate.now();

    // Validate and normalize
    this._validate();
  }

  /**
   * Generate unique block ID
   */
  _generateBlockId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `block_${timestamp}_${random}`;
  }

  /**
   * Parse time input (Date object, ISO string, or create from components)
   */
  _parseTime(timeInput) {
    if (!timeInput) {
      throw new ValidationError('Time input is required');
    }

    if (timeInput instanceof Date) {
      return timeInput;
    }

    if (typeof timeInput === 'string') {
      if (timeInput === 'email') {
        if (hasService('SmartLogger')) {
          getService('SmartLogger').warn('TimeBlock', `Invalid timeInput value 'email'. Throwing ValidationError.`);
        }
        throw new ValidationError(`Invalid time format: ${timeInput}`);
      }
      try {
        return TimeZoneAwareDate.parseISO(timeInput);
      } catch (error) {
        throw new ValidationError(`Invalid time format: ${timeInput}`);
      }
    }

    throw new ValidationError('Time must be Date object or ISO string');
  }

  /**
   * Calculate duration in minutes
   */
  _calculateDuration() {
    if (!this.start_time || !this.end_time) {
      return 0;
    }

    const diffMs = this.end_time.getTime() - this.start_time.getTime();
    return Math.floor(diffMs / CONSTANTS.MILLISECONDS_PER_MINUTE);
  }

  /**
   * Validate time block properties
   */
  _validate() {
    const errors = [];

    // Validate times
    if (this.end_time <= this.start_time) {
      throw new ValidationError('End time must be after start time');
    }

    // Validate duration
    if (this.duration_minutes <= 0) {
      this.duration_minutes = this._calculateDuration();
    }

    // Validate block type
    if (!isValidEnumValue(BLOCK_TYPE, this.block_type)) {
      this.block_type = getValidEnumValue(BLOCK_TYPE, this.block_type, BLOCK_TYPE.WORK);
      errors.push(`Invalid block_type, normalized to: ${this.block_type}`);
    }

    // Validate energy level
    if (!isValidEnumValue(ENERGY_LEVEL, this.energy_level)) {
      this.energy_level = normalizeEnergyLevel(this.energy_level);
      errors.push(`Invalid energy_level, normalized to: ${this.energy_level}`);
    }

    // Validate context
    if (!isValidEnumValue(CONTEXT, this.context)) {
      this.context = getValidEnumValue(CONTEXT, this.context, CONTEXT.OFFICE);
      errors.push(`Invalid context, normalized to: ${this.context}`);
    }

    // Log validation errors if any
    if (errors.length > 0 && hasService('SmartLogger')) {
      getService('SmartLogger').debug('TimeBlock', 'Validation errors auto-corrected', {
        block_id: this.block_id,
        errors: errors
      });
    }
  }

  /**
   * Check if this block overlaps with another
   */
  overlaps(otherBlock) {
    if (!otherBlock || !otherBlock.start_time || !otherBlock.end_time) {
      return false;
    }

    return !(this.end_time <= otherBlock.start_time ||
             this.start_time >= otherBlock.end_time);
  }

  /**
   * Check if this block contains a specific timestamp
   */
  contains(timestamp) {
    if (!timestamp) return false;

    if (typeof timestamp === 'string' && timestamp === 'email') {
      if (hasService('SmartLogger')) {
        getService('SmartLogger').warn('TimeBlock', `Invalid timestamp value 'email' in contains method. Returning false.`);
      }
      return false;
    }

    const time = timestamp instanceof Date ? timestamp : TimeZoneAwareDate.parseISO(timestamp);
    return time >= this.start_time && time <= this.end_time;
  }

  /**
   * Get overlap duration with another block in minutes
   */
  getOverlapDuration(otherBlock) {
    if (!this.overlaps(otherBlock)) {
      return 0;
    }

    const overlapStart = new Date(Math.max(this.start_time.getTime(), otherBlock.start_time.getTime()));
    const overlapEnd = new Date(Math.min(this.end_time.getTime(), otherBlock.end_time.getTime()));

    return TimeZoneAwareDate.minutesBetween(overlapStart, overlapEnd);
  }

  /**
   * Split block into two blocks at specified duration
   */
  split(durationMinutes) {
    if (durationMinutes >= this.duration_minutes || durationMinutes <= 0) {
      return [this]; // Cannot split
    }

    const splitPoint = TimeZoneAwareDate.addMinutes(this.start_time, durationMinutes);

    const firstBlock = new TimeBlock({
      ...this._getCloneData(),
      block_id: `${this.block_id}_1`,
      end_time: splitPoint,
      duration_minutes: durationMinutes
    });

    const secondBlock = new TimeBlock({
      ...this._getCloneData(),
      block_id: `${this.block_id}_2`,
      start_time: splitPoint,
      duration_minutes: this.duration_minutes - durationMinutes
    });

    return [firstBlock, secondBlock];
  }

  /**
   * Merge with another adjacent block
   */
  merge(otherBlock) {
    if (!this.isAdjacent(otherBlock)) {
      throw new ValidationError('Blocks must be adjacent to merge');
    }

    // Determine order
    const isOtherAfter = otherBlock.start_time >= this.end_time;
    const start = isOtherAfter ? this.start_time : otherBlock.start_time;
    const end = isOtherAfter ? otherBlock.end_time : this.end_time;

    return new TimeBlock({
      ...this._getCloneData(),
      block_id: `merged_${Date.now()}`,
      start_time: start,
      end_time: end,
      title: `${this.title} + ${otherBlock.title}`.trim(),
      description: `Merged: ${this.description} | ${otherBlock.description}`.trim()
    });
  }

  /**
   * Check if blocks are adjacent (touching but not overlapping)
   */
  isAdjacent(otherBlock) {
    if (!otherBlock) return false;

    // Adjacent if one ends where the other starts
    return (this.end_time.getTime() === otherBlock.start_time.getTime()) ||
           (otherBlock.end_time.getTime() === this.start_time.getTime());
  }

  /**
   * Shrink block by specified minutes from start, end, or both
   */
  shrink(minutes, fromStart = false, fromEnd = false) {
    if (!fromStart && !fromEnd) {
      fromEnd = true; // Default to shrinking from end
    }

    if (minutes >= this.duration_minutes) {
      throw new ValidationError('Cannot shrink block to zero or negative duration');
    }

    let newStart = new Date(this.start_time);
    let newEnd = new Date(this.end_time);

    if (fromStart) {
      newStart = TimeZoneAwareDate.addMinutes(newStart, minutes);
    }

    if (fromEnd) {
      newEnd = TimeZoneAwareDate.addMinutes(newEnd, -minutes);
    }

    return new TimeBlock({
      ...this._getCloneData(),
      block_id: `shrunk_${this.block_id}`,
      start_time: newStart,
      end_time: newEnd
    });
  }

  /**
   * Extend block by specified minutes to start, end, or both
   */
  extend(minutes, toStart = false, toEnd = false) {
    if (!toStart && !toEnd) {
      toEnd = true; // Default to extending end
    }

    let newStart = new Date(this.start_time);
    let newEnd = new Date(this.end_time);

    if (toStart) {
      newStart = TimeZoneAwareDate.addMinutes(newStart, -minutes);
    }

    if (toEnd) {
      newEnd = TimeZoneAwareDate.addMinutes(newEnd, minutes);
    }

    return new TimeBlock({
      ...this._getCloneData(),
      block_id: `extended_${this.block_id}`,
      start_time: newStart,
      end_time: newEnd
    });
  }

  /**
   * Check if block is suitable for a task based on energy and duration
   */
  isSuitableFor(task) {
    if (!task) return false;

    // Check duration
    if (this.duration_minutes < task.estimated_minutes) {
      return false;
    }

    // Check availability
    if (!this.available || this.busy) {
      return false;
    }

    // Check energy level compatibility
    const taskEnergyScore = getEnergyScore(task.energy_required);
    const blockEnergyScore = getEnergyScore(this.energy_level);

    // Block should have at least as much energy as task requires
    if (blockEnergyScore < taskEnergyScore) {
      return false;
    }

    // Additional context matching could be added here
    return true;
  }

  /**
   * Calculate suitability score for a task (0-100)
   */
  calculateSuitabilityScore(task) {
    if (!this.isSuitableFor(task)) {
      return 0;
    }

    let score = 50; // Base score

    // Duration matching (prefer close matches)
    const durationRatio = task.estimated_minutes / this.duration_minutes;
    if (durationRatio >= 0.8 && durationRatio <= 1.0) {
      score += 20; // Perfect fit
    } else if (durationRatio >= 0.5) {
      score += 10; // Good fit
    }

    // Energy level matching
    const taskEnergyScore = getEnergyScore(task.energy_required);
    const blockEnergyScore = getEnergyScore(this.energy_level);
    const energyMatch = Math.min(blockEnergyScore / taskEnergyScore, 1.0);
    score += energyMatch * 20;

    // Time of day preferences (could be enhanced)
    const hour = this.start_time.getHours();
    if (task.lane === LANE.DEEP_FOCUS && hour >= 9 && hour <= 11) {
      score += 10; // Morning focus bonus
    }

    if (task.lane === LANE.ADMIN && hour >= 14 && hour <= 16) {
      score += 5; // Afternoon admin bonus
    }

    return Math.min(score, 100);
  }

  /**
   * Create calendar event representation
   */
  toCalendarEvent() {
    return {
      title: this.title || `${this.block_type} Block`,
      description: this.description,
      start: this.start_time,
      end: this.end_time,
      location: this.context,
      busy: this.busy,
      block_id: this.block_id,
      energy_level: this.energy_level
    };
  }

  /**
   * Convert to sheet row format
   */
  toSheetRow(headers) {
    if (!headers) {
      headers = ['block_id', 'start_time', 'end_time', 'duration_minutes',
                 'block_type', 'energy_level', 'context', 'available', 'busy',
                 'title', 'description', 'task_id', 'created_at'];
    }

    const row = new Array(headers.length).fill('');
    const headerMap = new Map(headers.map((h, i) => [h, i]));

    const propertyMap = {
      'block_id': this.block_id,
      'start_time': TimeZoneAwareDate.toISOString(this.start_time),
      'end_time': TimeZoneAwareDate.toISOString(this.end_time),
      'duration_minutes': this.duration_minutes,
      'block_type': this.block_type,
      'energy_level': this.energy_level,
      'context': this.context,
      'available': this.available,
      'busy': this.busy,
      'title': this.title,
      'description': this.description,
      'task_id': this.task_id || '',
      'created_at': this.created_at
    };

    for (const [prop, value] of Object.entries(propertyMap)) {
      const index = headerMap.get(prop);
      if (index !== undefined) {
        row[index] = value;
      }
    }

    return row;
  }

  /**
   * Create from sheet row
   */
  static fromSheetRow(row, headers) {
    if (!row || row.length === 0) return null;

    const data = {};
    headers.forEach((header, index) => {
      if (header && row[index] !== undefined && row[index] !== '') {
        data[header] = row[index];
      }
    });

    // Convert boolean fields
    if (data.available !== undefined) {
      data.available = data.available === true || data.available === 'true';
    }
    if (data.busy !== undefined) {
      data.busy = data.busy === true || data.busy === 'true';
    }

    // Convert numeric fields
    if (data.duration_minutes) {
      data.duration_minutes = parseInt(data.duration_minutes, 10) || 0;
    }

    try {
      return new TimeBlock(data);
    } catch (error) {
      if (hasService('SmartLogger')) {
        getService('SmartLogger').error('TimeBlock', 'Failed to create from sheet row', {
          error: error.message,
          data: data
        });
      }
      return null;
    }
  }

  /**
   * Get clone data for creating new instances
   */
  _getCloneData() {
    return {
      block_type: this.block_type,
      energy_level: this.energy_level,
      context: this.context,
      available: this.available,
      busy: this.busy,
      title: this.title,
      description: this.description,
      task_id: this.task_id
    };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      block_id: this.block_id,
      start_time: TimeZoneAwareDate.toISOString(this.start_time),
      end_time: TimeZoneAwareDate.toISOString(this.end_time),
      duration_minutes: this.duration_minutes,
      block_type: this.block_type,
      energy_level: this.energy_level,
      context: this.context,
      available: this.available,
      busy: this.busy,
      title: this.title,
      task_id: this.task_id
    };
  }

  /**
   * Static utility methods
   */
  static getInstanceCount() {
    return this.instanceCount;
  }

  /**
   * Create block from time components
   */
  static fromTimeComponents(date, startHour, startMinute, durationMinutes, options = {}) {
    const startTime = TimeZoneAwareDate.combineDateTime(
      date,
      `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
    );
    const endTime = TimeZoneAwareDate.addMinutes(startTime, durationMinutes);

    return new TimeBlock({
      start_time: startTime,
      end_time: endTime,
      duration_minutes: durationMinutes,
      ...options
    });
  }

  /**
   * Create work day blocks from schedule
   */
  static createWorkDayBlocks(date, schedule = null) {
    const defaultSchedule = [
      { start: '09:00', duration: 120, type: BLOCK_TYPE.WORK, energy: ENERGY_LEVEL.HIGH },
      { start: '11:00', duration: 15, type: BLOCK_TYPE.BREAK, energy: ENERGY_LEVEL.LOW },
      { start: '11:15', duration: 105, type: BLOCK_TYPE.WORK, energy: ENERGY_LEVEL.MEDIUM },
      { start: '13:00', duration: 60, type: BLOCK_TYPE.LUNCH, energy: ENERGY_LEVEL.LOW },
      { start: '14:00', duration: 120, type: BLOCK_TYPE.WORK, energy: ENERGY_LEVEL.MEDIUM },
      { start: '16:00', duration: 15, type: BLOCK_TYPE.BREAK, energy: ENERGY_LEVEL.LOW },
      { start: '16:15', duration: 105, type: BLOCK_TYPE.WORK, energy: ENERGY_LEVEL.MEDIUM }
    ];

    const blocks = [];
    const scheduleToUse = schedule || defaultSchedule;

    for (const item of scheduleToUse) {
      try {
        const [hour, minute] = item.start.split(':').map(Number);
        const block = TimeBlock.fromTimeComponents(date, hour, minute, item.duration, {
          block_type: item.type,
          energy_level: item.energy,
          title: `${item.type} Block`,
          available: item.type === BLOCK_TYPE.WORK
        });
        blocks.push(block);
      } catch (error) {
        const logger = container.get(SERVICES.SmartLogger);
        logger.warn('TimeBlock', `Failed to create block for ${item.start}: ${error.message}`);
      }
    }

    return blocks;
  }
}

TimeBlock.instanceCount = 0;
