/**
 * MOH TIME OS v2.0 - DYNAMIC LANE MANAGER
 *
 * Advanced lane management system that dynamically allocates time blocks across different work lanes.
 * Supports weighted allocation, priority management, and adaptive scheduling.
 * Integrates with foundation blocks for optimal time distribution.
 *
 * Original lines: 4235-4903 from scriptA.js
 */

class DynamicLaneManager {
  constructor(configManager, errorHandler, batchOperations, foundationBlocksManager, logger, crossExecutionCache) {
    this.configManager = configManager;
    this.errorHandler = errorHandler;
    this.batchOperations = batchOperations;
    this.foundationBlocksManager = foundationBlocksManager;
    this.logger = logger;
    this.crossExecutionCache = crossExecutionCache || { get: () => null, set: () => {} };
    this.calendarService = 'calendar';
  }

  /**
   * Load lanes configuration from sheet
   * @returns {Array} Array of lane objects
   */
  loadLanes() {
    try {
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.LANES);
      const rows = this.batchOperations.getRowsByFilter(SHEET_NAMES.LANES, {});

      const lanes = rows.map(row => this.parseRowToLane(row, headers)).filter(lane => lane !== null);

      const validation = this.validateLanes(lanes);
      if (!validation.isValid) {
        throw new Error(`Lane validation failed: ${validation.errors.join(', ')}`);
      }

      this.logEvent('lanes_loaded', `Loaded ${lanes.length} lanes`, {
        activeCount: lanes.filter(l => l.is_active).length,
        totalWeight: lanes.reduce((sum, l) => sum + l.weight, 0)
      });

      return lanes;

    } catch (error) {
      this.logger.error('DynamicLaneManager', 'Failed to load lanes', {
        error: error.message,
        operation: 'loadLanes'
      });
      return [];
    }
  }

  /**
   * Parse sheet row to lane object
   * @param {Array} row - Sheet row data
   * @param {Array} headers - Sheet headers
   * @returns {Object|null} Lane object or null if invalid
   */
  parseRowToLane(row, headers) {
    try {
      if (!row || row.length === 0) return null;

      const lane = {};
      headers.forEach((header, index) => {
        if (index < row.length) {
          lane[header] = row[index];
        }
      });

      // Convert and validate data types
      lane.lane = String(lane.lane || '').trim();
      lane.weight = parseFloat(lane.weight) || 0;
      lane.min_block_minutes = parseInt(lane.min_block_minutes, 10) || 30;
      lane.max_daily_minutes = parseInt(lane.max_daily_minutes, 10) || 480;
      lane.priority_multiplier = parseFloat(lane.priority_multiplier) || 1.0;
      lane.is_active = Boolean(lane.is_active === true || lane.is_active === 'TRUE' || lane.is_active === 1);

      // Skip empty or invalid lanes
      if (!lane.lane || lane.lane.length === 0) {
        return null;
      }

      // Set defaults for missing fields
      lane.description = lane.description || '';
      lane.context_type = lane.context_type || 'general';
      lane.energy_preference = lane.energy_preference || 'MEDIUM';
      lane.created_at = lane.created_at || TimeZoneAwareDate.now();
      lane.updated_at = TimeZoneAwareDate.now();

      return lane;

    } catch (error) {
      this.logger.warn('DynamicLaneManager', `Failed to parse lane row: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate lanes configuration
   * @param {Array} lanes - Array of lane objects
   * @returns {Object} Validation result
   */
  validateLanes(lanes) {
    const result = { isValid: true, errors: [], warnings: [] };

    if (lanes.length === 0) {
      result.errors.push('No lanes found');
      result.isValid = false;
      return result;
    }

    // Check for duplicate lane names
    const laneNames = lanes.map(l => l.lane);
    const duplicates = laneNames.filter((name, idx) => laneNames.indexOf(name) !== idx);
    if (duplicates.length > 0) {
      result.errors.push(`Duplicate lane names: ${[...new Set(duplicates)].join(', ')}`);
      result.isValid = false;
    }

    // Check weight distribution
    const activeLanes = lanes.filter(l => l.is_active);
    const totalWeight = activeLanes.reduce((sum, l) => sum + l.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      result.errors.push(`Lane weights do not sum to 1.0: ${totalWeight}`);
      result.isValid = false;
    }

    // Validate individual lane properties
    for (const lane of lanes) {
      if (lane.weight < 0 || lane.weight > 1) {
        result.errors.push(`Invalid weight for lane ${lane.lane}: ${lane.weight}`);
        result.isValid = false;
      }

      if (lane.min_block_minutes < 5 || lane.min_block_minutes > 240) {
        result.warnings.push(`Unusual min_block_minutes for ${lane.lane}: ${lane.min_block_minutes}`);
      }

      if (lane.max_daily_minutes < lane.min_block_minutes) {
        result.errors.push(`max_daily_minutes (${lane.max_daily_minutes}) < min_block_minutes (${lane.min_block_minutes}) for ${lane.lane}`);
        result.isValid = false;
      }

      if (lane.priority_multiplier < 0.1 || lane.priority_multiplier > 3.0) {
        result.warnings.push(`Extreme priority_multiplier for ${lane.lane}: ${lane.priority_multiplier}`);
      }
    }

    // Strategic warnings
    const highWeightLanes = activeLanes.filter(l => l.weight > 0.3);
    if (highWeightLanes.length > 3) {
      result.warnings.push(`Many high-weight lanes (${highWeightLanes.length}): may reduce focus`);
    }

    const veryLowWeightLanes = activeLanes.filter(l => l.weight < 0.05);
    if (veryLowWeightLanes.length > 0) {
      result.warnings.push(`Very low weight lanes: ${veryLowWeightLanes.map(l => l.lane).join(', ')}`);
    }

    return result;
  }

  /**
   * Normalize lane weights to sum to 1.0
   * @param {Array} lanes - Array of lane objects
   * @returns {Array} Lanes with normalized weights
   */
  normalizeLaneWeights(lanes) {
    const activeLanes = lanes.filter(l => l.is_active);
    const inactiveLanes = lanes.filter(l => !l.is_active);

    if (activeLanes.length === 0) return lanes;

    const totalWeight = activeLanes.reduce((sum, lane) => sum + lane.weight, 0);

    if (totalWeight === 0) {
      // Equal distribution if no weights specified
      const equalWeight = 1.0 / activeLanes.length;
      activeLanes.forEach(lane => lane.weight = equalWeight);
    } else {
      // Normalize to sum to 1.0
      activeLanes.forEach(lane => lane.weight = lane.weight / totalWeight);
    }

    // Ensure inactive lanes have zero weight
    inactiveLanes.forEach(lane => lane.weight = 0);

    this.logEvent('lanes_normalized', `Normalized weights for ${activeLanes.length} active lanes`);

    return [...activeLanes, ...inactiveLanes];
  }

  /**
   * Allocate foundation blocks to lanes based on weights
   * @param {Array} foundationBlocks - Available foundation blocks
   * @param {Array} lanes - Lane configurations
   * @returns {Array} Lane blocks with allocations
   */
  allocateLaneBlocks(foundationBlocks, lanes) {
    try {
      const activeLanes = lanes.filter(l => l.is_active);
      const normalizedLanes = this.normalizeLaneWeights(activeLanes);

      const totalCapacity = foundationBlocks.reduce((sum, block) => sum + block.capacity_minutes, 0);
      const laneBlocks = [];

      for (const lane of normalizedLanes) {
        const laneCapacity = Math.floor(totalCapacity * lane.weight);
        const laneBlock = this.createLaneBlock(lane, laneCapacity, foundationBlocks);

        if (laneBlock) {
          laneBlocks.push(laneBlock);
        }
      }

      this.logEvent('lane_blocks_allocated', `Allocated ${laneBlocks.length} lane blocks`, {
        total_capacity: totalCapacity,
        allocated_capacity: laneBlocks.reduce((sum, lb) => sum + lb.allocated_capacity, 0)
      });

      return laneBlocks;

    } catch (error) {
      this.logger.error('DynamicLaneManager', 'Failed to allocate lane blocks', {
        error: error.message,
        operation: 'allocateLaneBlocks'
      });
      return [];
    }
  }

  /**
   * Create a lane block with allocated capacity
   * @param {Object} lane - Lane configuration
   * @param {number} capacity - Allocated capacity in minutes
   * @param {Array} foundationBlocks - Available foundation blocks
   * @returns {Object|null} Lane block object
   */
  createLaneBlock(lane, capacity, foundationBlocks) {
    try {
      if (capacity < lane.min_block_minutes) {
        this.logger.warn('DynamicLaneManager', `Insufficient capacity for lane ${lane.lane}`, {
          required: lane.min_block_minutes,
          available: capacity
        });
        return null;
      }

      // Find suitable foundation blocks for this lane
      const suitableBlocks = this.findSuitableFoundationBlocks(lane, foundationBlocks);

      const laneBlock = {
        lane_id: `lane_${lane.lane}_${Date.now()}`,
        lane: lane.lane,
        allocated_capacity: Math.min(capacity, lane.max_daily_minutes),
        used_capacity: 0,
        utilization_rate: 0,
        foundation_blocks: suitableBlocks.slice(0, Math.ceil(capacity / 120)), // Limit to reasonable number
        priority_multiplier: lane.priority_multiplier,
        context_type: lane.context_type,
        energy_preference: lane.energy_preference,
        min_block_minutes: lane.min_block_minutes,
        max_daily_minutes: lane.max_daily_minutes,
        is_active: lane.is_active,
        created_at: TimeZoneAwareDate.now(),
        updated_at: TimeZoneAwareDate.now(),
        scheduled_tasks: []
      };

      return laneBlock;

    } catch (error) {
      this.logger.error('DynamicLaneManager', `Failed to create lane block: ${error.message}`, {
        lane: lane.lane,
        capacity: capacity
      });
      return null;
    }
  }

  /**
   * Find foundation blocks suitable for a lane
   * @param {Object} lane - Lane configuration
   * @param {Array} foundationBlocks - Available foundation blocks
   * @returns {Array} Suitable foundation blocks
   */
  findSuitableFoundationBlocks(lane, foundationBlocks) {
    return foundationBlocks.filter(block => {
      // Match energy preference if specified
      if (lane.energy_preference && lane.energy_preference !== 'ANY') {
        if (block.energy_level !== lane.energy_preference) {
          return false;
        }
      }

      // Match context type if specified
      if (lane.context_type && lane.context_type !== 'general') {
        if (block.context_type !== lane.context_type) {
          return false;
        }
      }

      // Check minimum block duration
      if (block.duration_minutes < lane.min_block_minutes) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Prefer higher energy blocks first
      const energyPriority = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aPriority = energyPriority[a.energy_level] || 0;
      const bPriority = energyPriority[b.energy_level] || 0;

      return bPriority - aPriority;
    });
  }

  /**
   * Allocate task to lane block
   * @param {Object} laneBlock - Lane block to allocate to
   * @param {Object} task - Task to allocate
   * @param {number} estimatedMinutes - Estimated duration
   * @returns {boolean} Success status
   */
  allocateTaskToLane(laneBlock, task, estimatedMinutes) {
    try {
      if (!laneBlock || !task) {
        throw new Error('Invalid laneBlock or task provided');
      }

      const remainingCapacity = laneBlock.allocated_capacity - laneBlock.used_capacity;

      if (estimatedMinutes > remainingCapacity) {
        this.logger.debug('DynamicLaneManager', `Insufficient capacity in lane ${laneBlock.lane}`, {
          required: estimatedMinutes,
          available: remainingCapacity
        });
        return false;
      }

      if (estimatedMinutes < laneBlock.min_block_minutes) {
        this.logger.debug('DynamicLaneManager', `Task too small for lane ${laneBlock.lane}`, {
          task_duration: estimatedMinutes,
          min_required: laneBlock.min_block_minutes
        });
        return false;
      }

      // Allocate the task
      laneBlock.used_capacity += estimatedMinutes;
      laneBlock.utilization_rate = laneBlock.used_capacity / laneBlock.allocated_capacity;
      laneBlock.updated_at = TimeZoneAwareDate.now();

      // Track the allocation
      laneBlock.scheduled_tasks.push({
        task_id: task.action_id,
        estimated_minutes: estimatedMinutes,
        allocated_at: TimeZoneAwareDate.now(),
        priority: task.priority,
        title: task.title
      });

      this.logger.debug('DynamicLaneManager', `Allocated task to lane ${laneBlock.lane}`, {
        task_id: task.action_id,
        minutes: estimatedMinutes,
        utilization: laneBlock.utilization_rate
      });

      return true;

    } catch (error) {
      this.logger.error('DynamicLaneManager', `Failed to allocate task to lane: ${error.message}`, {
        lane: laneBlock ? laneBlock.lane : 'unknown',
        task_id: task ? task.action_id : 'unknown'
      });
      return false;
    }
  }

  /**
   * Get lane utilization statistics
   * @param {Array} laneBlocks - Array of lane blocks
   * @returns {Object} Utilization statistics
   */
  getLaneUtilization(laneBlocks) {
    if (!laneBlocks || laneBlocks.length === 0) {
      return {
        total_lanes: 0,
        total_capacity: 0,
        total_used: 0,
        average_utilization: 0,
        lane_details: []
      };
    }

    const stats = {
      total_lanes: laneBlocks.length,
      total_capacity: laneBlocks.reduce((sum, lb) => sum + lb.allocated_capacity, 0),
      total_used: laneBlocks.reduce((sum, lb) => sum + lb.used_capacity, 0),
      average_utilization: 0,
      lane_details: []
    };

    stats.average_utilization = stats.total_capacity > 0 ?
      Math.round((stats.total_used / stats.total_capacity) * 100) / 100 : 0;

    // Lane-specific details
    stats.lane_details = laneBlocks.map(lb => ({
      lane: lb.lane,
      allocated_capacity: lb.allocated_capacity,
      used_capacity: lb.used_capacity,
      utilization_rate: lb.utilization_rate,
      task_count: lb.scheduled_tasks ? lb.scheduled_tasks.length : 0,
      energy_preference: lb.energy_preference,
      context_type: lb.context_type
    }));

    return stats;
  }

  /**
   * Rebalance lane allocations based on actual usage
   * @param {Array} laneBlocks - Current lane blocks
   * @param {Array} lanes - Lane configurations
   * @returns {Array} Rebalanced lane blocks
   */
  rebalanceLanes(laneBlocks, lanes) {
    try {
      const rebalancedBlocks = [];

      for (const laneBlock of laneBlocks) {
        const laneConfig = lanes.find(l => l.lane === laneBlock.lane);
        if (!laneConfig || !laneConfig.is_active) {
          continue; // Skip inactive lanes
        }

        // Calculate adjustment based on utilization
        let adjustmentFactor = 1.0;

        if (laneBlock.utilization_rate > 0.9) {
          // Over-utilized - increase capacity
          adjustmentFactor = 1.2;
        } else if (laneBlock.utilization_rate < 0.3) {
          // Under-utilized - decrease capacity
          adjustmentFactor = 0.8;
        }

        const newCapacity = Math.max(
          laneConfig.min_block_minutes,
          Math.min(
            laneConfig.max_daily_minutes,
            Math.floor(laneBlock.allocated_capacity * adjustmentFactor)
          )
        );

        const rebalancedBlock = {
          ...laneBlock,
          allocated_capacity: newCapacity,
          utilization_rate: laneBlock.used_capacity / newCapacity,
          updated_at: TimeZoneAwareDate.now(),
          rebalanced: true,
          adjustment_factor: adjustmentFactor
        };

        rebalancedBlocks.push(rebalancedBlock);
      }

      this.logEvent('lanes_rebalanced', `Rebalanced ${rebalancedBlocks.length} lane blocks`);

      return rebalancedBlocks;

    } catch (error) {
      this.logger.error('DynamicLaneManager', `Failed to rebalance lanes: ${error.message}`);
      return laneBlocks; // Return original on error
    }
  }

  /**
   * Get lane recommendations based on task analysis
   * @param {Array} tasks - Array of tasks
   * @param {Array} lanes - Lane configurations
   * @returns {Object} Recommendations for lane optimization
   */
  getLaneRecommendations(tasks, lanes) {
    try {
      const recommendations = {
        lane_adjustments: [],
        new_lanes_suggested: [],
        weight_adjustments: [],
        warnings: []
      };

      // Analyze task distribution by lane
      const tasksByLane = {};
      tasks.forEach(task => {
        const lane = task.lane || 'unassigned';
        if (!tasksByLane[lane]) {
          tasksByLane[lane] = [];
        }
        tasksByLane[lane].push(task);
      });

      // Check for overloaded lanes
      for (const [laneName, laneTasks] of Object.entries(tasksByLane)) {
        const laneConfig = lanes.find(l => l.lane === laneName);
        if (!laneConfig) continue;

        const totalEstimatedTime = laneTasks.reduce((sum, task) => sum + (task.estimated_minutes || 30), 0);

        if (totalEstimatedTime > laneConfig.max_daily_minutes * 1.5) {
          recommendations.lane_adjustments.push({
            lane: laneName,
            issue: 'overloaded',
            current_load: totalEstimatedTime,
            max_capacity: laneConfig.max_daily_minutes,
            suggestion: 'Increase max_daily_minutes or redistribute tasks'
          });
        }
      }

      // Check for unused lanes
      const activeLanes = lanes.filter(l => l.is_active);
      for (const lane of activeLanes) {
        if (!tasksByLane[lane.lane] || tasksByLane[lane.lane].length === 0) {
          recommendations.warnings.push(`Lane "${lane.lane}" has no assigned tasks`);
        }
      }

      // Suggest weight adjustments based on task volume
      const totalTasks = tasks.length;
      if (totalTasks > 0) {
        for (const [laneName, laneTasks] of Object.entries(tasksByLane)) {
          const laneConfig = lanes.find(l => l.lane === laneName);
          if (!laneConfig) continue;

          const actualRatio = laneTasks.length / totalTasks;
          const configuredWeight = laneConfig.weight;

          if (Math.abs(actualRatio - configuredWeight) > 0.2) {
            recommendations.weight_adjustments.push({
              lane: laneName,
              current_weight: configuredWeight,
              suggested_weight: Math.round(actualRatio * 100) / 100,
              task_ratio: actualRatio,
              rationale: `Task distribution suggests different weight allocation`
            });
          }
        }
      }

      return recommendations;

    } catch (error) {
      this.logger.error('DynamicLaneManager', `Failed to generate recommendations: ${error.message}`);
      return {
        lane_adjustments: [],
        new_lanes_suggested: [],
        weight_adjustments: [],
        warnings: [`Error generating recommendations: ${error.message}`]
      };
    }
  }

  /**
   * Self-test lane manager functionality
   * @returns {boolean} True if all tests pass
   */
  selfTest() {
    try {
      this.logger.info('DynamicLaneManager', 'Running self-test');

      // Test 1: Load lanes
      const lanes = this.loadLanes();
      if (!Array.isArray(lanes)) {
        throw new Error('loadLanes should return an array');
      }

      // Test 2: Validate lanes if any exist
      if (lanes.length > 0) {
        const validation = this.validateLanes(lanes);
        if (!validation.hasOwnProperty('isValid')) {
          throw new Error('validateLanes should return validation object');
        }
      }

      // Test 3: Test normalization
      const testLanes = [
        { lane: 'test1', weight: 0.3, is_active: true },
        { lane: 'test2', weight: 0.7, is_active: true }
      ];
      const normalized = this.normalizeLaneWeights(testLanes);
      const totalWeight = normalized.filter(l => l.is_active).reduce((sum, l) => sum + l.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        throw new Error('Weight normalization failed');
      }

      // Test 4: Test lane block creation
      const testFoundationBlocks = [
        {
          energy_level: 'HIGH',
          context_type: 'deep_work',
          duration_minutes: 90,
          capacity_minutes: 80
        }
      ];

      const testLane = {
        lane: 'test',
        weight: 0.5,
        min_block_minutes: 30,
        max_daily_minutes: 240,
        priority_multiplier: 1.0,
        energy_preference: 'HIGH',
        context_type: 'deep_work',
        is_active: true
      };

      const laneBlock = this.createLaneBlock(testLane, 120, testFoundationBlocks);
      if (!laneBlock || !laneBlock.lane_id) {
        throw new Error('createLaneBlock failed');
      }

      this.logger.info('DynamicLaneManager', 'Self-test passed', {
        lanes_loaded: lanes.length,
        test_lane_created: !!laneBlock
      });

      return true;

    } catch (error) {
      this.logger.error('DynamicLaneManager', `Self-test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Log events for debugging and monitoring
   * @param {string} event - Event name
   * @param {string} message - Event message
   * @param {Object} details - Additional details
   */
  logEvent(event, message, details = null) {
    try {
      if (this.logger) {
        this.logger.info('DynamicLaneManager', message, details);
      }
    } catch (error) {
      Logger.log(`Failed to log event: ${error.message || error}`);
    }
  }

  /**
   * Get default lane metrics for reporting
   * @param {string} lane - Lane name
   * @returns {Object} Default metrics object
   */
  getDefaultLaneMetrics(lane) {
    return {
      lane,
      totalTasks: 0,
      completedTasks: 0,
      averageCompletionTime: 0,
      utilizationRate: 0,
      satisfactionScore: 0.5,
      trend: 'stable'
    };
  }
}