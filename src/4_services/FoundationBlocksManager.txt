/**
 * MOH TIME OS v2.0 - FOUNDATION BLOCKS MANAGER
 *
 * Energy-based time management system that creates foundation blocks for task allocation.
 * Generates daily blocks based on energy levels, work schedules, and optimal contexts.
 * Supports Dubai business hours and intelligent capacity planning.
 *
 * Original lines: 3442-4232 from scriptA.js
 */

class FoundationBlocksManager {

  constructor(configManager, errorHandler, logger) {
    this.configManager = configManager;
    this.errorHandler = errorHandler;
    this.logger = logger;
    this.timezone = this.configManager.getString('TIMEZONE', 'Asia/Dubai');
  }

  /**
   * Generate all daily blocks for a given date
   */
  generateDailyBlocks(date) {
    try {
      this.logEvent('foundation_blocks_generation_started', `Generating blocks for ${this.formatDate(date)}`);

      // Validate date
      if (!this.isValidWorkDay(date)) {
        this.logEvent('foundation_blocks_skipped', `Skipping non-work day: ${this.formatDate(date)}`);
        return [];
      }

      // Generate energy-based foundation blocks
      const energyBlocks = this.generateEnergyBlocks(date);

      // Generate buffer blocks
      const bufferBlocks = this.generateBufferBlocks(date);

      // Combine all blocks
      const allBlocks = [...energyBlocks, ...bufferBlocks];

      // Validate the complete set
      const validation = this.validateBlocks(allBlocks);
      if (!validation.isValid) {
        throw new Error(`Block validation failed: ${validation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        this.logEvent('foundation_blocks_warnings', 'Block generation completed with warnings', {
          warnings: validation.warnings
        });
      }

      this.logEvent('foundation_blocks_generated', `Generated ${allBlocks.length} foundation blocks`, {
        energyBlocks: energyBlocks.length,
        bufferBlocks: bufferBlocks.length,
        totalCapacity: allBlocks.reduce((sum, block) => sum + block.capacity_minutes, 0)
      });

      return allBlocks;

    } catch (error) {
      this.logger.error('FoundationBlocksManager', 'Failed to generate daily blocks', {
        error: error.message,
        operation: 'generateDailyBlocks',
        date: this.formatDate(date)
      });
      return [];
    }
  }

  /**
   * Generate energy-based blocks according to Dubai work schedule
   */
  generateEnergyBlocks(date) {
    const blocks = [];
    const energyWindows = this.getEnergyWindows();

    for (const window of energyWindows) {
      const startTime = this.parseTimeInDate(date, window.start);
      const endTime = this.parseTimeInDate(date, window.end);

      if (!startTime || !endTime || startTime >= endTime) {
        this.logEvent('energy_block_error', `Invalid time window for ${window.level}`, {
          start: window.start,
          end: window.end
        });
        continue;
      }

      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const capacityMinutes = Math.floor(durationMinutes * window.capacity_multiplier);

      // Create main energy block
      const block = {
        block_id: this._generateBlockId(),
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        type: 'energy_based',
        start: startTime,
        end: endTime,
        duration_minutes: durationMinutes,
        energy_level: window.level,
        context_type: this.getOptimalContextForEnergy(window.level),
        capacity_minutes: capacityMinutes,
        allocated_minutes: 0,
        utilization_rate: 0,
        lane: '',
        restrictions_json: JSON.stringify({
          allowedContextTypes: window.preferred_context,
          minimumTaskComplexity: window.min_complexity,
          maximumTaskComplexity: window.max_complexity
        }),
        created_at: TimeZoneAwareDate.now(),
        updated_at: TimeZoneAwareDate.now()
      };

      blocks.push(block);
    }

    return blocks;
  }

  /**
   * Generate buffer blocks for transitions and breaks
   */
  generateBufferBlocks(date) {
    const blocks = [];
    const bufferConfig = this.getBufferConfiguration();

    for (const buffer of bufferConfig) {
      const startTime = this.parseTimeInDate(date, buffer.start);
      const endTime = this.parseTimeInDate(date, buffer.end);

      if (!startTime || !endTime || startTime >= endTime) {
        continue;
      }

      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      const block = {
        block_id: this._generateBlockId(),
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        type: 'buffer',
        start: startTime,
        end: endTime,
        duration_minutes: durationMinutes,
        energy_level: 'LOW',
        context_type: buffer.context || 'transition',
        capacity_minutes: Math.floor(durationMinutes * 0.8), // 80% capacity for buffers
        allocated_minutes: 0,
        utilization_rate: 0,
        lane: '',
        restrictions_json: JSON.stringify({
          allowedTaskTypes: buffer.allowed_tasks || ['quick_tasks', 'admin'],
          isBuffer: true
        }),
        created_at: TimeZoneAwareDate.now(),
        updated_at: TimeZoneAwareDate.now()
      };

      blocks.push(block);
    }

    return blocks;
  }

  /**
   * Get energy windows configuration for Dubai business hours
   */
  getEnergyWindows() {
    // Default energy windows optimized for Dubai timezone
    const defaultWindows = [
      {
        level: 'HIGH',
        start: '09:00',
        end: '11:30',
        capacity_multiplier: 0.9,
        preferred_context: ['deep_work', 'creative', 'strategic'],
        min_complexity: 7,
        max_complexity: 10
      },
      {
        level: 'MEDIUM',
        start: '11:30',
        end: '13:00',
        capacity_multiplier: 0.8,
        preferred_context: ['collaborative', 'meetings', 'communication'],
        min_complexity: 4,
        max_complexity: 7
      },
      {
        level: 'MEDIUM',
        start: '14:00',
        end: '16:00',
        capacity_multiplier: 0.75,
        preferred_context: ['operational', 'processing', 'review'],
        min_complexity: 3,
        max_complexity: 6
      },
      {
        level: 'LOW',
        start: '16:00',
        end: '17:30',
        capacity_multiplier: 0.6,
        preferred_context: ['admin', 'email', 'planning'],
        min_complexity: 1,
        max_complexity: 4
      }
    ];

    // Try to get custom configuration
    try {
      const customWindows = this.configManager.getJSON('ENERGY_WINDOWS', defaultWindows);
      return Array.isArray(customWindows) ? customWindows : defaultWindows;
    } catch (error) {
      this.logger.warn('FoundationBlocksManager', 'Using default energy windows', {
        error: error.message
      });
      return defaultWindows;
    }
  }

  /**
   * Get buffer configuration
   */
  getBufferConfiguration() {
    const defaultBuffers = [
      {
        start: '08:30',
        end: '09:00',
        context: 'morning_prep',
        allowed_tasks: ['email_check', 'planning', 'quick_admin']
      },
      {
        start: '13:00',
        end: '14:00',
        context: 'lunch_break',
        allowed_tasks: ['personal', 'rest', 'light_admin']
      },
      {
        start: '17:30',
        end: '18:00',
        context: 'day_wrap',
        allowed_tasks: ['review', 'planning', 'wrap_up']
      }
    ];

    try {
      const customBuffers = this.configManager.getJSON('BUFFER_BLOCKS', defaultBuffers);
      return Array.isArray(customBuffers) ? customBuffers : defaultBuffers;
    } catch (error) {
      return defaultBuffers;
    }
  }

  /**
   * Get optimal context for energy level
   */
  getOptimalContextForEnergy(energyLevel) {
    const contextMap = {
      'HIGH': 'deep_work',
      'MEDIUM': 'collaborative',
      'LOW': 'admin'
    };

    return contextMap[energyLevel] || 'general';
  }

  /**
   * Validate generated blocks
   */
  validateBlocks(blocks) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!blocks || blocks.length === 0) {
      validation.errors.push('No blocks generated');
      validation.isValid = false;
      return validation;
    }

    // Check for overlapping blocks
    const sortedBlocks = blocks.sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 0; i < sortedBlocks.length - 1; i++) {
      const current = sortedBlocks[i];
      const next = sortedBlocks[i + 1];

      if (current.end > next.start) {
        validation.errors.push(`Overlapping blocks: ${current.block_id} and ${next.block_id}`);
        validation.isValid = false;
      }
    }

    // Check total capacity
    const totalCapacity = blocks.reduce((sum, block) => sum + block.capacity_minutes, 0);
    const minExpectedCapacity = 300; // 5 hours minimum
    const maxExpectedCapacity = 600; // 10 hours maximum

    if (totalCapacity < minExpectedCapacity) {
      validation.warnings.push(`Low total capacity: ${totalCapacity} minutes`);
    }

    if (totalCapacity > maxExpectedCapacity) {
      validation.warnings.push(`High total capacity: ${totalCapacity} minutes`);
    }

    // Check each block validity
    for (const block of blocks) {
      if (!block.block_id) {
        validation.errors.push('Block missing ID');
        validation.isValid = false;
      }

      if (!block.start || !block.end) {
        validation.errors.push(`Block ${block.block_id} missing start/end times`);
        validation.isValid = false;
      }

      if (block.start >= block.end) {
        validation.errors.push(`Block ${block.block_id} has invalid time range`);
        validation.isValid = false;
      }

      if (block.capacity_minutes < 0 || block.capacity_minutes > block.duration_minutes) {
        validation.errors.push(`Block ${block.block_id} has invalid capacity`);
        validation.isValid = false;
      }
    }

    return validation;
  }

  /**
   * Check if date is a valid work day
   */
  isValidWorkDay(date) {
    if (!date || !(date instanceof Date)) {
      return false;
    }

    const dayOfWeek = date.getDay();

    // In Dubai, work week is typically Sunday-Thursday
    const workDays = this.configManager.getArray('WORK_DAYS', [0, 1, 2, 3, 4]); // Sunday=0, Monday=1, etc.

    return workDays.includes(dayOfWeek);
  }

  /**
   * Parse time string in context of date
   */
  parseTimeInDate(date, timeString) {
    try {
      if (!timeString || typeof timeString !== 'string') {
        return null;
      }

      const [hours, minutes] = timeString.split(':').map(s => parseInt(s, 10));

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }

      const result = new Date(date);
      result.setHours(hours, minutes, 0, 0);

      return result;

    } catch (error) {
      this.logger.warn('FoundationBlocksManager', `Failed to parse time: ${timeString}`, {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Format date for logging
   */
  formatDate(date) {
    if (!date) return 'invalid-date';
    return TimeZoneAwareDate.toISOString(date).split('T')[0];
  }

  /**
   * Generate unique block ID
   */
  _generateBlockId() {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get foundation blocks for a specific date
   */
  getBlocksForDate(date) {
    try {
      const formattedDate = this.formatDate(date);

      // Try to get from cache first
      const cacheKey = `foundation_blocks_${formattedDate}`;
      const cached = this.configManager.cache ? this.configManager.cache.get(cacheKey) : null;

      if (cached) {
        this.logger.debug('FoundationBlocksManager', `Retrieved cached blocks for ${formattedDate}`);
        return cached;
      }

      // Generate fresh blocks
      const blocks = this.generateDailyBlocks(date);

      // Cache for performance
      if (this.configManager.cache && blocks.length > 0) {
        this.configManager.cache.set(cacheKey, blocks, 3600); // 1 hour cache
      }

      return blocks;

    } catch (error) {
      this.logger.error('FoundationBlocksManager', `Failed to get blocks for date: ${error.message}`, {
        date: this.formatDate(date)
      });
      return [];
    }
  }

  /**
   * Find available capacity in blocks for task allocation
   */
  findAvailableCapacity(blocks, requiredMinutes, energyLevel = null, contextType = null) {
    const availableBlocks = blocks.filter(block => {
      // Check remaining capacity
      const remainingCapacity = block.capacity_minutes - block.allocated_minutes;
      if (remainingCapacity < requiredMinutes) {
        return false;
      }

      // Check energy level match if specified
      if (energyLevel && block.energy_level !== energyLevel) {
        return false;
      }

      // Check context type match if specified
      if (contextType && block.context_type !== contextType) {
        return false;
      }

      return true;
    });

    // Sort by energy level priority and remaining capacity
    return availableBlocks.sort((a, b) => {
      const energyPriority = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aPriority = energyPriority[a.energy_level] || 0;
      const bPriority = energyPriority[b.energy_level] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher energy first
      }

      // If same energy, prefer more capacity
      const aCapacity = a.capacity_minutes - a.allocated_minutes;
      const bCapacity = b.capacity_minutes - b.allocated_minutes;
      return bCapacity - aCapacity;
    });
  }

  /**
   * Allocate time in a block
   */
  allocateTimeInBlock(block, minutes, taskId = null) {
    try {
      const remainingCapacity = block.capacity_minutes - block.allocated_minutes;

      if (minutes > remainingCapacity) {
        throw new Error(`Insufficient capacity: requested ${minutes}, available ${remainingCapacity}`);
      }

      // Update allocation
      block.allocated_minutes += minutes;
      block.utilization_rate = block.allocated_minutes / block.capacity_minutes;
      block.updated_at = TimeZoneAwareDate.now();

      if (taskId) {
        // Track allocated tasks
        if (!block.allocated_tasks) {
          block.allocated_tasks = [];
        }
        block.allocated_tasks.push({
          task_id: taskId,
          minutes: minutes,
          allocated_at: TimeZoneAwareDate.now()
        });
      }

      this.logger.debug('FoundationBlocksManager', `Allocated ${minutes} minutes in block ${block.block_id}`, {
        block_id: block.block_id,
        allocated_minutes: block.allocated_minutes,
        capacity_minutes: block.capacity_minutes,
        utilization_rate: block.utilization_rate,
        task_id: taskId
      });

      return true;

    } catch (error) {
      this.logger.error('FoundationBlocksManager', `Failed to allocate time in block: ${error.message}`, {
        block_id: block.block_id,
        requested_minutes: minutes,
        task_id: taskId
      });
      return false;
    }
  }

  /**
   * Get foundation blocks statistics
   */
  getBlocksStatistics(blocks) {
    if (!blocks || blocks.length === 0) {
      return {
        total_blocks: 0,
        total_capacity: 0,
        total_allocated: 0,
        utilization_rate: 0,
        energy_distribution: {},
        context_distribution: {}
      };
    }

    const stats = {
      total_blocks: blocks.length,
      total_capacity: blocks.reduce((sum, b) => sum + b.capacity_minutes, 0),
      total_allocated: blocks.reduce((sum, b) => sum + b.allocated_minutes, 0),
      utilization_rate: 0,
      energy_distribution: {},
      context_distribution: {}
    };

    stats.utilization_rate = stats.total_capacity > 0 ?
      Math.round((stats.total_allocated / stats.total_capacity) * 100) / 100 : 0;

    // Energy level distribution
    blocks.forEach(block => {
      const energy = block.energy_level || 'UNKNOWN';
      stats.energy_distribution[energy] = (stats.energy_distribution[energy] || 0) + 1;
    });

    // Context type distribution
    blocks.forEach(block => {
      const context = block.context_type || 'UNKNOWN';
      stats.context_distribution[context] = (stats.context_distribution[context] || 0) + 1;
    });

    return stats;
  }

  /**
   * Self-test foundation blocks manager
   */
  selfTest() {
    try {
      this.logger.info('FoundationBlocksManager', 'Running self-test');

      // Test 1: Generate blocks for today
      const today = new Date();
      const blocks = this.generateDailyBlocks(today);

      if (!Array.isArray(blocks)) {
        throw new Error('generateDailyBlocks should return an array');
      }

      // Test 2: Validate energy windows
      const energyWindows = this.getEnergyWindows();
      if (!Array.isArray(energyWindows) || energyWindows.length === 0) {
        throw new Error('Energy windows configuration invalid');
      }

      // Test 3: Test time parsing
      const testTime = this.parseTimeInDate(today, '09:00');
      if (!testTime || !(testTime instanceof Date)) {
        throw new Error('Time parsing failed');
      }

      // Test 4: Test block validation
      if (blocks.length > 0) {
        const validation = this.validateBlocks(blocks);
        if (!validation.isValid) {
          throw new Error(`Block validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Test 5: Test capacity finding
      if (blocks.length > 0) {
        const available = this.findAvailableCapacity(blocks, 30);
        if (!Array.isArray(available)) {
          throw new Error('findAvailableCapacity should return an array');
        }
      }

      this.logger.info('FoundationBlocksManager', 'Self-test passed', {
        blocks_generated: blocks.length,
        energy_windows: energyWindows.length,
        total_capacity: blocks.reduce((sum, b) => sum + b.capacity_minutes, 0)
      });

      return true;

    } catch (error) {
      this.logger.error('FoundationBlocksManager', `Self-test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Log events to activity sheet
   */
  logEvent(event, message, details = null) {
    try {
      if (this.logger) {
        this.logger.info('FoundationBlocksManager', message, details);
      }

      // Also log to spreadsheet if available
      try {
        const spreadsheet = getActiveSystemSpreadsheet();
        const activitySheet = spreadsheet.getSheetByName(SHEET_NAMES.ACTIVITY);

        if (activitySheet) {
          const logRow = [
            TimeZoneAwareDate.now(),
            event,
            message,
            details ? JSON.stringify(details).slice(0, 10000) : '',
            'info',
            'FoundationBlocksManager',
            false
          ];
          activitySheet.appendRow(logRow);
        }
      } catch (sheetError) {
        // Don't throw on sheet logging errors
      }

    } catch (error) {
      Logger.log(`Failed to log event: ${error.message || error}`);
    }
  }

  /**
   * Check if foundation blocks exist for a given date
   * @param {Date} date - Date to check
   * @returns {boolean} True if blocks exist for the date
   */
  hasFoundationBlocksForDate(date) {
    try {
      const blocks = this.getBlocksForDate(date);
      return blocks.length > 0;
    } catch (error) {
      this.logger.warn('FoundationBlocksManager', `Failed to check blocks for date: ${error.message}`, {
        date: this.formatDate(date)
      });
      return false;
    }
  }

  /**
   * Create and persist daily foundation blocks to FOUNDATION_BLOCKS sheet
   * @param {Date} date - Date to create blocks for
   * @returns {number} Number of blocks created
   */
  createDailyFoundationBlocks(date) {
    try {
      this.logger.info('FoundationBlocksManager', `Creating foundation blocks for ${this.formatDate(date)}`);

      // Generate blocks
      const blocks = this.generateDailyBlocks(date);

      if (blocks.length === 0) {
        this.logger.warn('FoundationBlocksManager', 'No blocks generated - skipping creation');
        return 0;
      }

      // Get headers from FOUNDATION_BLOCKS sheet
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.FOUNDATION_BLOCKS);

      // Convert blocks to sheet rows
      const rows = blocks.map(block => this._blockToRow(block, headers));

      // Append to sheet
      this.batchOperations.appendRows(SHEET_NAMES.FOUNDATION_BLOCKS, rows);

      this.logger.info('FoundationBlocksManager', `Successfully created ${blocks.length} foundation blocks`, {
        date: this.formatDate(date),
        totalCapacity: blocks.reduce((sum, b) => sum + b.capacity_minutes, 0)
      });

      return blocks.length;

    } catch (error) {
      this.logger.error('FoundationBlocksManager', `Failed to create daily foundation blocks: ${error.message}`, {
        date: this.formatDate(date),
        error: error.message,
        stack: error.stack
      });
      return 0;
    }
  }

  /**
   * Convert block object to sheet row
   * @param {Object} block - Block object
   * @param {Array} headers - Sheet headers
   * @returns {Array} Row data
   * @private
   */
  _blockToRow(block, headers) {
    return headers.map(header => {
      const value = block[header];

      // Handle date fields
      if ((header === 'start' || header === 'end' || header === 'date' || header === 'created_at' || header === 'updated_at') && value) {
        return value instanceof Date ? value.toISOString() : value;
      }

      // Handle numeric fields
      if ((header === 'duration_minutes' || header === 'capacity_minutes' || header === 'allocated_minutes' || header === 'utilization_rate') && typeof value === 'number') {
        return value;
      }

      // Handle undefined/null
      if (value === undefined || value === null) {
        return '';
      }

      return value;
    });
  }
}
