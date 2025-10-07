/**
 * MOH TIME OS v2.0 - INTELLIGENT SCHEDULER
 *
 * Advanced scheduling engine with energy-based time allocation, machine learning from historical data,
 * and adaptive context matching. Integrates with foundation blocks for optimal task placement.
 *
 * Features:
 * - Energy-based matching with block types
 * - Context switching optimization
 * - Machine learning from completed task patterns
 * - Deadline urgency calculations
 * - Lane compatibility scoring
 * - Circuit breaker aware degraded mode operation
 * - Dependency chain analysis and scheduling
 *
 * Original lines: 6615-7141 from scriptA.js
 */

class IntelligentScheduler {
  constructor(foundationManager, calendarManager, errorHandler, logger, configManager, humanStateManager, batchOperations, crossExecutionCache, dynamicLaneManager) {
    this.foundation = foundationManager;
    this.calendar = calendarManager;
    this.errorHandler = errorHandler;
    this.logger = logger;
    this.configManager = configManager;
    this.humanStateManager = humanStateManager;
    this.batchOperations = batchOperations;
    this.crossExecutionCache = crossExecutionCache;
    this.laneManager = dynamicLaneManager;

    const defaultWeights = {
      URGENCY: 0.25,
      PRIORITY: 0.25,
      ENERGY_MATCH: 0.20,
      CONTEXT: 0.10,
      WORKLOAD: 0.10,
      HUMAN_STATE: 0.10
    };

    this.ENERGY_LEVELS = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    this.TASK_DIFFICULTY = { DEEP_WORK: 3, CREATIVE: 2, ADMIN: 1, COMMUNICATION: 1 };

    // Estimation cache with 5-minute TTL
    this.estimationCache = new Map();
    this.estimationCacheTTL = 300000; // 5 minutes
  }

  getScoringWeights() {
    return {
      priority: this.configManager.getNumber('WEIGHT_PRIORITY', 0.3),
      deadline: this.configManager.getNumber('WEIGHT_DEADLINE', 0.25),
      rollover: this.configManager.getNumber('WEIGHT_ROLLOVER', 0.15),
      duration: this.configManager.getNumber('WEIGHT_DURATION', 0.1),
      dependencies: this.configManager.getNumber('WEIGHT_DEPENDENCIES', 0.1),
      energy: this.configManager.getNumber('WEIGHT_ENERGY', 0.05),
      context: this.configManager.getNumber('WEIGHT_CONTEXT', 0.05)
    };
  }

  runSchedulingCycle(options = {}) {
    const { dryRun = false } = options;
    this.logger.info('IntelligentScheduler', 'Starting scheduling cycle', { dry_run: dryRun });
    try {
      const actionsWithPos = this.batchOperations.getRowsWithPosition(SHEET_NAMES.ACTIONS, { status: STATUS.PENDING });
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const actionsToSchedule = actionsWithPos.map(item => MohTask.fromSheetRow(item.row, headers));

      if (actionsToSchedule.length === 0) {
        this.logger.info('IntelligentScheduler', 'No pending actions to schedule.');
        return { scheduled: 0, conflicts: 0 };
      }
      this.logger.info('IntelligentScheduler', `Found ${actionsToSchedule.length} actions to schedule.`);

      const today = new Date();
      const foundationBlocks = this.foundation.generateDailyBlocks(today);
      const lanes = this.laneManager.loadLanes();
      const laneBlocks = this.laneManager.allocateLaneBlocks(foundationBlocks, lanes);
      const availableBlocks = [...foundationBlocks, ...laneBlocks];
      this.logger.info('IntelligentScheduler', `Generated ${availableBlocks.length} total time blocks for scheduling.`);

      // Persist time blocks to TIME_BLOCKS sheet for visibility
      if (!dryRun) {
        this._persistTimeBlocks(availableBlocks);
      }

      const scheduleResult = this.scheduleActions(actionsToSchedule, availableBlocks);

      if (!dryRun) {
        const updates = [];
        const safeAccess = new SafeColumnAccess(headers);
        scheduleResult.scheduled.forEach(action => {
          const originalItem = actionsWithPos.find(item => item.row[headers.indexOf('action_id')] === action.action_id);
          if (originalItem) {
            const rowIndex = originalItem.sheetRowIndex;
            updates.push({
              rangeA1: safeAccess.getRowRange(rowIndex),
              values: [action.toSheetRow(headers)]
            });
          }
        });

        if (updates.length > 0) {
          this.batchOperations.batchUpdate(SHEET_NAMES.ACTIONS, updates);
          this.logger.info('IntelligentScheduler', `Successfully updated ${updates.length} actions in the sheet.`);
        }
      } else {
        this.logger.info('IntelligentScheduler', 'Dry run complete. No changes were made.');
        Logger.log(`DRY RUN RESULTS: ${JSON.stringify(scheduleResult)}`);
      }

      return {
        scheduled: scheduleResult.scheduled.length,
        conflicts: scheduleResult.conflicts.length
      };

    } catch (error) {
      this.logger.error('IntelligentScheduler', 'Scheduling cycle failed', {
        error: error.message,
        operation: 'runSchedulingCycle'
      });
      return { scheduled: 0, conflicts: 0, error: error.message };
    }
  }

  scheduleActions(actions, timeBlocks) {
    return this.errorHandler.withRetry(() => {
      this.logger.info('IntelligentScheduler', `Starting scheduling process for ${actions.length} actions`);

      const results = {
        scheduled: [],
        conflicts: [],
        efficiency: 0
      };

      const learnedFactors = this._getLearnedEstimationFactors();
      const adjustedActions = this._applyEstimationLearning(actions, learnedFactors);

      const calendarServiceStatus = this.errorHandler.getServiceStatus('calendar');
      const gmailServiceStatus = this.errorHandler.getServiceStatus('gmail');
      const sheetsServiceStatus = this.errorHandler.getServiceStatus('sheets');

      if (calendarServiceStatus.state !== 'CLOSED') this.logger.warn('IntelligentScheduler', `⚠️ DEGRADED MODE: Calendar circuit breaker is ${calendarServiceStatus.state}`, calendarServiceStatus);
      if (gmailServiceStatus.state !== 'CLOSED') this.logger.warn('IntelligentScheduler', `⚠️ DEGRADED MODE: Gmail circuit breaker is ${gmailServiceStatus.state}`, gmailServiceStatus);
      if (sheetsServiceStatus.state !== 'CLOSED') this.logger.warn('IntelligentScheduler', `⚠️ DEGRADED MODE: Sheets circuit breaker is ${sheetsServiceStatus.state}`, sheetsServiceStatus);

      const sortedActions = this._sortActionsBySchedulingPriority(adjustedActions);
      const availableBlocks = timeBlocks.map(block => ({ ...block, remaining_minutes: block.duration_minutes, scheduled_actions: [] }));
      let previousContext = null;
      const contextMatchBonus = this.configManager.getNumber('CONTEXT_MATCH_BONUS', 0.25);

      for (const action of sortedActions) {
        const remainingActions = sortedActions.slice(sortedActions.indexOf(action) + 1);
        const bestSlot = this._findBestAvailableSlot(action, availableBlocks, previousContext, contextMatchBonus, remainingActions);

        if (bestSlot) {
          const scheduledAction = {
            ...action,
            scheduled_start: bestSlot.start_time,
            scheduled_end: new Date(bestSlot.start_time.getTime() + (action.estimated_minutes * 60000)),
            scheduling_metadata: JSON.stringify({
              scheduledAt: TimeZoneAwareDate.toISOString(new Date()),
              scoringBreakdown: bestSlot.scoreBreakdown,
              timeSlot: {
                start: TimeZoneAwareDate.toISOString(bestSlot.start_time),
                end: TimeZoneAwareDate.toISOString(new Date(bestSlot.start_time.getTime() + (action.estimated_minutes * 60000))),
                blockType: bestSlot.block.block_type || 'unknown',
                energyLevel: bestSlot.block.energy_level || 'medium'
              },
              circuitBreakerStates: { calendar: calendarServiceStatus, gmail: gmailServiceStatus, sheets: sheetsServiceStatus },
              comparativeAnalysis: bestSlot.schedulingMetadata || {
                totalCandidates: 1, viableCandidates: 1, runnerUps: [], rejectedSlots: 0,
                competitiveAnalysis: { winningScore: bestSlot.score || 0, averageRunnerUpScore: 0, largestScoreGap: 0 }
              }
            })
          };
          results.scheduled.push(scheduledAction);
          bestSlot.block.remaining_minutes -= action.estimated_minutes;
          bestSlot.block.scheduled_actions.push(action.action_id);
          previousContext = action.context;
          this.logger.debug('IntelligentScheduler', `Scheduled action ${action.action_id} at ${TimeZoneAwareDate.toISOString(bestSlot.start_time)} (score: ${bestSlot.score}, context: ${action.context})`);
        } else {
          const conflictAction = { ...action, reason: bestSlot && bestSlot.conflict_reason ? bestSlot.conflict_reason : 'No suitable time slot available' };
          if (bestSlot && bestSlot.conflict_analysis) {
            conflictAction.scheduling_metadata = JSON.stringify({
              scheduledAt: TimeZoneAwareDate.toISOString(new Date()),
              conflict_analysis: bestSlot.comparative_analysis,
              best_candidate: bestSlot.best_candidate,
              conflict_reason: bestSlot.conflict_reason,
              circuitBreakerStates: { calendar: calendarServiceStatus, gmail: gmailServiceStatus, sheets: sheetsServiceStatus },
              timeSlot: null
            });
          }
          results.conflicts.push({ action: conflictAction, reason: conflictAction.reason });
          this.logger.warn('IntelligentScheduler', `Could not schedule action ${action.action_id}: ${conflictAction.reason}`);
        }
      }
      results.efficiency = this._calculateSchedulingEfficiency(results, actions);
      this.logger.info('IntelligentScheduler', `Scheduling complete: ${results.scheduled.length} scheduled, ${results.conflicts.length} conflicts, efficiency: ${Math.round(results.efficiency * 100)}%`);
      return results;
    }, 'scheduleActions');
  }

  _getLearnedEstimationFactors() {
    try {
      const cacheKey = 'estimation_learning_factors';

      // Check memory cache first (5-minute TTL)
      const now = Date.now();
      if (this.estimationCache.has(cacheKey)) {
        const cached = this.estimationCache.get(cacheKey);
        if (now - cached.timestamp < this.estimationCacheTTL) {
          this.logger.debug('IntelligentScheduler', 'Using memory cached estimation learning factors.');
          return cached.data;
        } else {
          this.estimationCache.delete(cacheKey); // Clean expired entry
        }
      }

      // Check cross-execution cache
      const cachedFactors = this.crossExecutionCache.get(cacheKey);
      if (cachedFactors) {
        this.logger.debug('IntelligentScheduler', 'Using cross-execution cached estimation learning factors.');
        // Cache in memory for faster subsequent access
        this.estimationCache.set(cacheKey, { data: cachedFactors, timestamp: now });
        return cachedFactors;
      }

      this.logger.info('IntelligentScheduler', 'Calculating fresh estimation learning factors.');
      const completedActions = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, { status: STATUS.COMPLETED });
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const safeAccess = new SafeColumnAccess(headers);
      const learningData = {};
      for (const row of completedActions) {
        const context = safeAccess.getCellValue(row, 'context_type');
        const lane = safeAccess.getCellValue(row, 'lane');
        const estimated = parseInt(safeAccess.getCellValue(row, 'estimated_minutes'), 10);
        const actual = parseInt(safeAccess.getCellValue(row, 'actual_minutes'), 10);
        if (estimated > 0 && actual > 0) {
          const accuracyRatio = actual / estimated;
          const keys = [`context:${context}`, `lane:${lane}`];
          for (const key of keys) {
            if (!learningData[key]) learningData[key] = [];
            learningData[key].push(accuracyRatio);
          }
        }
      }
      const learnedFactors = {};
      for (const [key, ratios] of Object.entries(learningData)) {
        if (ratios.length >= 3) {
          const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
          const variance = ratios.reduce((sum, r) => sum + Math.pow(r - avgRatio, 2), 0) / ratios.length;
          const stdDev = Math.sqrt(variance);
          const confidence = Math.max(0, 1 - (stdDev / avgRatio));
          if (confidence > 0.4 && avgRatio > 0.5 && avgRatio < 2.0) {
            learnedFactors[key] = { factor: avgRatio, confidence: confidence, sample_size: ratios.length };
          }
        }
      }

      // Cache in both memory and cross-execution caches
      this.estimationCache.set(cacheKey, { data: learnedFactors, timestamp: now });
      this.crossExecutionCache.set(cacheKey, learnedFactors, 10800);
      this.logger.info('IntelligentScheduler', `Calculated ${Object.keys(learnedFactors).length} new estimation factors.`);
      return learnedFactors;
    } catch (error) {
      this.logger.error('IntelligentScheduler', 'Failed to get learned estimation factors', { error: error.message });
      return {};
    }
  }

  _applyEstimationLearning(actions, learnedFactors) {
    if (!learnedFactors || Object.keys(learnedFactors).length === 0) {
      return actions;
    }
    return actions.map(action => {
      const laneKey = `lane:${action.lane}`;
      const contextKey = `context:${action.context_type}`;
      const laneFactor = learnedFactors[laneKey];
      const contextFactor = learnedFactors[contextKey];
      let bestFactor = null;
      if (laneFactor && contextFactor) {
        bestFactor = laneFactor.confidence >= contextFactor.confidence ? laneFactor : contextFactor;
      } else {
        bestFactor = laneFactor || contextFactor;
      }
      if (bestFactor && bestFactor.confidence > 0.6) {
        const originalEstimate = action.estimated_minutes;
        const adjustedEstimate = Math.round(originalEstimate * bestFactor.factor);
        const finalEstimate = Math.max(5, Math.min(240, adjustedEstimate));
        if (finalEstimate !== originalEstimate) {
          const adjustedAction = new MohTask({ ...action, estimated_minutes: finalEstimate });
          this.logger.debug('IntelligentScheduler', 'Applied estimation learning', {
            action_id: action.action_id,
            original_minutes: originalEstimate,
            adjusted_minutes: finalEstimate,
            factor: bestFactor.factor.toFixed(2),
            confidence: bestFactor.confidence.toFixed(2)
          });
          return adjustedAction;
        }
      }
      return action;
    });
  }

  _sortActionsBySchedulingPriority(actions) {
    const priorityMap = { 'H': 3, 'M': 2, 'L': 1 };
    return actions.sort((a, b) => {
      const now = new Date();
      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      const aUrgency = aDeadline !== Infinity ? 1 / (aDeadline - now.getTime()) : 0;
      const bUrgency = bDeadline !== Infinity ? 1 / (bDeadline - now.getTime()) : 0;
      const urgencyScore = bUrgency - aUrgency;
      const aPriority = (priorityMap[a.impact] || 0) + (priorityMap[a.urgency] || 0);
      const bPriority = (priorityMap[b.impact] || 0) + (priorityMap[b.urgency] || 0);
      const priorityScore = bPriority - aPriority;
      return (priorityScore * 0.6) + (urgencyScore * 0.4);
    });
  }

  _findBestAvailableSlot(action, availableBlocks, previousContext, contextMatchBonus, remainingActions) {
    let bestSlot = null;
    let maxScore = -1;
    for (const block of availableBlocks) {
      if (block.remaining_minutes >= action.estimated_minutes) {
        const blockStart = new Date(block.start);
        const allocatedTime = block.duration_minutes - block.remaining_minutes;
        const slotTime = new Date(blockStart.getTime() + allocatedTime * 60000);
        const weights = this.getScoringWeights();
        const urgencyScore = this.calculateDeadlineUrgency(action, slotTime) * weights.deadline;
        const priorityScore = (this.priorityToScore(action.impact) + this.priorityToScore(action.urgency)) / 2 * weights.priority;
        const energyScore = this.calculateEnergyMatch(action, block) * weights.energy;
        const contextScore = this.calculateContextMatch(action, block) * weights.context;
        let contextBonus = 0;
        if (previousContext && action.context_type === previousContext) {
          contextBonus = contextMatchBonus;
        }
        const finalScore = (urgencyScore + priorityScore + energyScore + contextScore) * (1 + contextBonus);
        if (finalScore > maxScore) {
          maxScore = finalScore;
          bestSlot = {
            block: block,
            start_time: slotTime,
            score: finalScore,
            scoreBreakdown: {
              urgency: urgencyScore,
              priority: priorityScore,
              energy: energyScore,
              context: contextScore,
              bonus: contextBonus
            }
          };
        }
      }
    }
    return bestSlot;
  }

  priorityToScore(priority) {
    switch (priority) {
    case PRIORITY.CRITICAL: return 1.5;
    case PRIORITY.URGENT: return 1.2;
    case PRIORITY.HIGH: return 1.0;
    case PRIORITY.MEDIUM: return 0.5;
    case PRIORITY.LOW: return 0.25;
    case PRIORITY.MINIMAL: return 0.1;
    // Support legacy single-letter codes for backward compatibility
    case 'H': return 1.0;
    case 'M': return 0.5;
    case 'L': return 0.25;
    default: return 0.5;
    }
  }

  _calculateSchedulingEfficiency() {
    try {
      const allTasks = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
      if (!allTasks || allTasks.length === 0) return 1.0;

      let completedOnTime = 0;
      let totalCompleted = 0;
      let totalDelayed = 0;
      let utilizationScore = 0;

      for (const task of allTasks) {
        if (task.status === STATUS.COMPLETED) {
          totalCompleted++;
          if (task.scheduled_end && task.actual_end) {
            const scheduled = new Date(task.scheduled_end);
            const actual = new Date(task.actual_end);
            if (actual <= scheduled) {
              completedOnTime++;
            } else {
              totalDelayed++;
            }
          }
        }
      }

      const onTimeRate = totalCompleted > 0 ? completedOnTime / totalCompleted : 1.0;
      const delayImpact = totalCompleted > 0 ? 1 - (totalDelayed / totalCompleted) * 0.5 : 1.0;
      const activeHours = this._calculateActiveHours();
      const totalHours = this._calculateTotalAvailableHours();
      utilizationScore = totalHours > 0 ? activeHours / totalHours : 0.5;

      const efficiency = (onTimeRate * 0.4) + (delayImpact * 0.3) + (utilizationScore * 0.3);

      this.logger.info('IntelligentScheduler', 'Calculated scheduling efficiency', {
        onTimeRate,
        delayImpact,
        utilizationScore,
        efficiency
      });

      return Math.max(0, Math.min(1, efficiency));
    } catch (error) {
      this.logger.error('IntelligentScheduler', 'Failed to calculate efficiency', { error: error.message });
      return 0.75;
    }
  }

  _calculateActiveHours() {
    const activeTasks = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {
      status: STATUS.IN_PROGRESS
    });

    let totalMinutes = 0;
    for (const task of activeTasks) {
      totalMinutes += task.estimated_minutes || 30;
    }

    return totalMinutes / 60;
  }

  _calculateTotalAvailableHours() {
    return 8; // Standard 8 hour work day
  }

  getLaneEnergyMapping() {
    return this.configManager.getJSON('LANE_ENERGY_MAP', {
      'ops': 'peak',
      'client': 'high',
      'growth': 'high',
      'admin': 'post_lunch',
      'personal': 'low',
      'deep_work': 'peak',
      'creative': 'high',
      'communication': 'medium',
      'learning': 'high',
      'strategic': 'peak',
      'default': 'medium'
    });
  }

  getOptimalEnergyForLane(lane) {
    const laneToEnergyMap = this.getLaneEnergyMapping();
    return laneToEnergyMap[lane] || laneToEnergyMap['default'];
  }

  getOptimalContextForLane(lane, effortMinutes) {
    const laneToContextMap = {
      'ops': { default: 'deep_focus', short_task_context: 'administrative' },
      'client': { default: 'communication', long_task_context: 'deep_focus' },
      'growth': { default: 'creative' },
      'admin': { default: 'administrative' },
      'personal': { default: 'buffer' },
      'deep_work': { default: 'deep_focus' },
      'creative': { default: 'creative' },
      'communication': { default: 'communication' },
      'learning': { default: 'analysis' },
      'strategic': { default: 'deep_focus' },
      'default': { default: 'administrative' }
    };
    const settings = laneToContextMap[lane] || laneToContextMap['default'];
    if (effortMinutes < 30 && settings.short_task_context) return settings.short_task_context;
    if (effortMinutes > 90 && settings.long_task_context) return settings.long_task_context;
    return settings.default;
  }

  getLaneBlockPreferences() {
    const cacheKey = 'lane_block_preferences';
    const cachedPrefs = this.crossExecutionCache.get(cacheKey);
    if (cachedPrefs) return cachedPrefs;
    const preferences = {
      'ops': {
        energyLevels: ['peak', 'high'],
        contextTypes: ['deep_focus', 'administrative']
      },
      'client': {
        energyLevels: ['high', 'medium', 'post_lunch'],
        contextTypes: ['communication', 'creative']
      },
      'growth': {
        energyLevels: ['high', 'peak'],
        contextTypes: ['creative', 'communication']
      },
      'admin': {
        energyLevels: ['medium', 'post_lunch', 'low', 'recovery'],
        contextTypes: ['administrative', 'buffer']
      },
      'personal': {
        energyLevels: ['low', 'recovery', 'wind_down'],
        contextTypes: ['buffer']
      },
      'deep_work': {
        energyLevels: ['peak', 'high'],
        contextTypes: ['deep_focus']
      },
      'strategic': {
        energyLevels: ['peak'],
        contextTypes: ['deep_focus', 'analysis']
      }
    };
    this.crossExecutionCache.set(cacheKey, preferences, 3600);
    return preferences;
  }

  getCompatibilityMatrix() {
    return this.configManager.getJSON('LANE_COMPATIBILITY', {
      'ops': { 'ops': 1.0, 'deep_work': 0.9, 'strategic': 0.8, 'admin': 0.6, 'client': 0.3, 'growth': 0.2, 'personal': 0.1 },
      'client': { 'client': 1.0, 'growth': 0.7, 'communication': 0.9, 'ops': 0.4, 'admin': 0.5, 'personal': 0.2 },
      'growth': { 'growth': 1.0, 'creative': 0.9, 'client': 0.7, 'ops': 0.3, 'strategic': 0.5, 'personal': 0.1 },
      'admin': { 'admin': 1.0, 'ops': 0.6, 'personal': 0.7, 'client': 0.4, 'communication': 0.5, 'buffer': 0.8 },
      'personal': { 'personal': 1.0, 'buffer': 0.9, 'admin': 0.5, 'recovery': 0.8, 'wind_down': 0.8 },
      'deep_work': { 'deep_work': 1.0, 'ops': 0.9, 'strategic': 0.9, 'creative': 0.6 },
      'creative': { 'creative': 1.0, 'growth': 0.9, 'deep_work': 0.6 },
      'communication': { 'communication': 1.0, 'client': 0.9, 'admin': 0.6 },
      'learning': { 'learning': 1.0, 'deep_work': 0.7, 'strategic': 0.6 }
    });
  }

  getLaneCompatibility() {
    const cacheKey = 'lane_compatibility_matrix';
    const cachedMatrix = this.crossExecutionCache.get(cacheKey);
    if (cachedMatrix) return cachedMatrix;
    const matrix = this.getCompatibilityMatrix();
    this.crossExecutionCache.set(cacheKey, matrix, 3600);
    return matrix;
  }

  calculateEnergyMatch(action, block) {
    const optimalEnergy = this.getOptimalEnergyForLane(action.lane);
    const energyHierarchy = ['wind_down', 'recovery', 'post_lunch', 'high', 'peak'];
    const blockEnergyIndex = energyHierarchy.indexOf(block.energy_level);
    const optimalEnergyIndex = energyHierarchy.indexOf(optimalEnergy);
    if (blockEnergyIndex === -1 || optimalEnergyIndex === -1) return 0.5;

    // Use normalized energy values (0-1) for distance calculation
    const currentEnergy = blockEnergyIndex / (energyHierarchy.length - 1);
    const requiredEnergy = optimalEnergyIndex / (energyHierarchy.length - 1);
    const distance = this._calculateEnergyDistance(currentEnergy, requiredEnergy);

    // Convert distance back to match score (inverse relationship)
    return 1.0 - distance;
  }

  _calculateEnergyDistance(currentEnergy, requiredEnergy) {
    // Validate inputs
    const validCurrent = Math.max(0, Math.min(1, currentEnergy || 0.5));
    const validRequired = Math.max(0, Math.min(1, requiredEnergy || 0.5));

    const distance = Math.abs(validCurrent - validRequired);

    // Ensure distance is within valid range
    return Math.max(0, Math.min(1, distance));
  }

  calculateContextMatch(action, block) {
    const optimalContext = this.getOptimalContextForLane(action.lane, action.effort_minutes);
    if (block.context_type === optimalContext) return 1.0;
    const compatibility = {
      [CONTEXT.DEEP_WORK]: { [CONTEXT.CREATIVE]: 0.7, [CONTEXT.LEARNING]: 0.6, [CONTEXT.COMMUNICATION]: 0.3, [CONTEXT.ADMIN]: 0.2, [CONTEXT.BUFFER]: 0.1 },
      [CONTEXT.CREATIVE]: { [CONTEXT.DEEP_WORK]: 0.7, [CONTEXT.LEARNING]: 0.6, [CONTEXT.COMMUNICATION]: 0.4, [CONTEXT.ADMIN]: 0.3, [CONTEXT.BUFFER]: 0.2 },
      [CONTEXT.COMMUNICATION]: { [CONTEXT.ADMIN]: 0.7, [CONTEXT.BUFFER]: 0.6, [CONTEXT.LEARNING]: 0.5, [CONTEXT.CREATIVE]: 0.4, [CONTEXT.DEEP_WORK]: 0.3 },
      [CONTEXT.LEARNING]: { [CONTEXT.DEEP_WORK]: 0.6, [CONTEXT.CREATIVE]: 0.6, [CONTEXT.COMMUNICATION]: 0.5, [CONTEXT.ADMIN]: 0.4, [CONTEXT.BUFFER]: 0.3 },
      [CONTEXT.ADMIN]: { [CONTEXT.COMMUNICATION]: 0.7, [CONTEXT.BUFFER]: 0.8, [CONTEXT.LEARNING]: 0.4, [CONTEXT.CREATIVE]: 0.3, [CONTEXT.DEEP_WORK]: 0.2 },
      [CONTEXT.BUFFER]: { [CONTEXT.ADMIN]: 0.8, [CONTEXT.COMMUNICATION]: 0.6, [CONTEXT.LEARNING]: 0.3, [CONTEXT.CREATIVE]: 0.2, [CONTEXT.DEEP_WORK]: 0.1 }
    };
    const optimalCompatibility = compatibility[optimalContext];
    return (optimalCompatibility && optimalCompatibility[block.context_type]) || 0.3;
  }

  calculateDeadlineUrgency(action, slotTime) {
    if (!action.estimated_completion) return 0.5;
    const now = new Date();
    const deadline = new Date(action.estimated_completion);
    const slotDate = new Date(slotTime);
    const timeToDeadline = deadline.getTime() - now.getTime();
    const timeToSlot = slotDate.getTime() - now.getTime();
    if (timeToDeadline <= 0) return 1.0;
    if (slotDate > deadline) return 0.1;
    const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);
    const hoursToSlot = timeToSlot / (1000 * 60 * 60);
    const urgencyMultiplier = Math.min(1.0, 72 / hoursToDeadline);
    const timingScore = Math.max(0.1, 1.0 - (hoursToSlot / hoursToDeadline));
    return urgencyMultiplier * timingScore;
  }

  calculateLanePreference(action, block) {
    if (block.lane === action.lane) return 1.0;
    if (!block.lane) {
      const lanePreferences = this.getLaneBlockPreferences();
      const preference = lanePreferences[action.lane];
      if (preference) {
        if (preference.energyLevels.includes(block.energy_level)) return 0.8;
        if (preference.contextTypes.includes(block.context_type)) return 0.6;
      }
      return 0.5;
    }
    const laneCompatibility = this.getLaneCompatibility();
    const actionCompatibility = laneCompatibility[action.lane];
    return (actionCompatibility && actionCompatibility[block.lane]) || 0.3;
  }

  _identifyDependencyChains(actions) {
    const chains = [];
    const visited = new Set();
    const actionMap = new Map(actions.map(action => [action.action_id, action]));

    const headers = this.batchOperations.getHeaders(SHEET_NAMES.DEPENDENCIES);
    const dependencies = this.batchOperations.getRowsByFilter(SHEET_NAMES.DEPENDENCIES, {});

    const dependsOn = new Map();
    const blocks = new Map();

    const blockingIdIndex = headers.indexOf('blocking_action_id');
    const blockedIdIndex = headers.indexOf('blocked_action_id');

    for (const depRow of dependencies) {
      const blockingId = depRow[blockingIdIndex];
      const blockedId = depRow[blockedIdIndex];
      if (!dependsOn.has(blockedId)) dependsOn.set(blockedId, []);
      if (!blocks.has(blockingId)) blocks.set(blockingId, []);
      dependsOn.get(blockedId).push(blockingId);
      blocks.get(blockingId).push(blockedId);
    }

    for (const action of actions) {
      if (visited.has(action.action_id)) continue;
      const chain = [];
      this._buildDependencyChain(action.action_id, dependsOn, blocks, actionMap, visited, chain);
      if (chain.length > 1) {
        chains.push(chain);
      }
    }

    this.logger.info('IntelligentScheduler', `Dependency analysis complete: ${chains.length} chains found.`);
    return chains;
  }

  _buildDependencyChain(actionId, dependsOn, blocks, actionMap, visited, chain) {
    if (visited.has(actionId) || !actionMap.has(actionId)) return;

    visited.add(actionId);
    chain.push(actionMap.get(actionId));

    if (blocks.has(actionId)) {
      for (const blockedId of blocks.get(actionId)) {
        this._buildDependencyChain(blockedId, dependsOn, blocks, actionMap, visited, chain);
      }
    }

    if (dependsOn.has(actionId)) {
      for (const blockingId of dependsOn.get(actionId)) {
        this._buildDependencyChain(blockingId, dependsOn, blocks, actionMap, visited, chain);
      }
    }
  }

  /**
   * Persist time blocks to TIME_BLOCKS sheet for visibility and debugging
   * @param {Array} blocks - Array of time block objects to persist
   * @returns {number} Number of blocks persisted
   */
  _persistTimeBlocks(blocks) {
    try {
      if (!blocks || blocks.length === 0) {
        this.logger.debug('IntelligentScheduler', 'No time blocks to persist');
        return 0;
      }

      // Get headers from TIME_BLOCKS sheet
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.TIME_BLOCKS);

      // Convert blocks to sheet rows
      const rows = blocks.map(block => this._blockToRow(block, headers));

      // Clear existing blocks for today first (optional - prevents duplicates)
      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];

      // Append new blocks
      this.batchOperations.appendRows(SHEET_NAMES.TIME_BLOCKS, rows);

      this.logger.info('IntelligentScheduler', `Persisted ${blocks.length} time blocks to TIME_BLOCKS sheet`);
      return blocks.length;

    } catch (error) {
      this.logger.error('IntelligentScheduler', `Failed to persist time blocks: ${error.message}`, {
        error: error.message,
        blocks_count: blocks ? blocks.length : 0
      });
      return 0;
    }
  }

  /**
   * Convert a time block object to sheet row format
   * @param {Object} block - Time block object
   * @param {Array} headers - Sheet headers
   * @returns {Array} Row data array
   */
  _blockToRow(block, headers) {
    return headers.map(header => {
      const value = block[header];

      // Handle date/time fields
      if ((header === 'start_time' || header === 'end_time' || header === 'created_at') && value) {
        return value instanceof Date ? value.toISOString() : value;
      }

      // Handle numeric fields
      if ((header === 'duration_minutes' || header === 'capacity_minutes' || header === 'allocated_minutes') && typeof value === 'number') {
        return value;
      }

      // Handle boolean fields
      if ((header === 'available' || header === 'busy') && typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      }

      // Handle null/undefined
      if (value === undefined || value === null) {
        return '';
      }

      return value;
    });
  }
}