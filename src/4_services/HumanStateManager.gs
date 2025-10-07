/**
 * MOH TIME OS v2.0 - HUMAN STATE MANAGER
 *
 * Tracks and analyzes human state (energy, mood, focus) for adaptive scheduling.
 * Provides state-aware task recommendations and scheduling optimizations.
 * Integrates with foundation blocks and intelligent scheduler for personalized workflows.
 *
 * Original lines: 4951-5268 from scriptA.js
 */

class HumanStateManager {
  constructor(batchOperations, smartLogger, configManager) {
    this.batchOperations = batchOperations;
    this.logger = smartLogger;
    this.configManager = configManager;

    // Initialize human state tracking sheet if needed
    this._ensureHumanStateSheet();
  }

  /**
   * Record current human state (mood, energy, focus)
   * @param {Object} state - Current human state
   * @param {string} state.energy - 'HIGH' | 'MEDIUM' | 'LOW' | 'DEPLETED'
   * @param {string} state.mood - 'POSITIVE' | 'NEUTRAL' | 'STRESSED' | 'OVERWHELMED'
   * @param {string} state.focus - 'SHARP' | 'NORMAL' | 'SCATTERED' | 'DISTRACTED'
   * @param {string} [state.notes] - Optional context notes
   * @returns {boolean} Success status
   */
  recordHumanState(state) {
    try {
      const timestamp = TimeZoneAwareDate.toISOString(new Date());
      const stateId = 'STATE_' + Utilities.getUuid(); // Generate UUID for state_id
      const stateEntry = [
        stateId,
        timestamp,
        state.energy || 'MEDIUM',
        state.focus || 'NORMAL',
        state.mood || 'NEUTRAL',
        state.stress_level || null,
        state.current_context || null,
        state.notes || ''
      ];

      // Use HUMAN_STATE sheet name from constants
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.HUMAN_STATE);
      this.batchOperations.appendRows(SHEET_NAMES.HUMAN_STATE, [stateEntry]);

      this.logger.info('HumanStateManager', 'Human state recorded', {
        energy: state.energy,
        mood: state.mood,
        focus: state.focus,
        timestamp: timestamp
      });

      return true;
    } catch (error) {
      this.logger.error('HumanStateManager', 'Failed to record human state', {
        error: error.message,
        state: state
      });
      return false;
    }
  }

  /**
   * Get current human state based on recent entries
   * @returns {Object} Current estimated human state
  */
  getCurrentHumanState() {
    try {
      // Get recent state entries (last 4 hours)
      const recentThreshold = new Date(Date.now() - (4 * 60 * 60 * 1000));
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.HUMAN_STATE);
      const safeAccess = new SafeColumnAccess(headers);
      const stateEntries = this.batchOperations.getRowsByFilter(SHEET_NAMES.HUMAN_STATE, {})
        .map(row => {
          const timestampStr = safeAccess.getCellValue(row, 'timestamp', null);
          const timestamp = timestampStr ? new Date(timestampStr) : null;
          return { row, timestamp, timestampStr };
        })
        .filter(entry => entry.timestamp && !isNaN(entry.timestamp.getTime()) && entry.timestamp >= recentThreshold)
        .sort((a, b) => b.timestamp - a.timestamp); // Most recent first

      if (stateEntries.length === 0) {
        return this._getDefaultHumanState();
      }

      // Use weighted average of recent states (most recent has highest weight)
      const weights = stateEntries.map((_, index) => Math.pow(0.7, index)); // Exponential decay
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);

      const weightedStates = stateEntries.map((entry, index) => ({
        energy: this._mapStateToNumber(safeAccess.getCellValue(entry.row, 'energy_level', 'MEDIUM'), 'energy'),
        mood: this._mapStateToNumber(safeAccess.getCellValue(entry.row, 'mood', 'NEUTRAL'), 'mood'),
        focus: this._mapStateToNumber(safeAccess.getCellValue(entry.row, 'focus_level', 'NORMAL'), 'focus'),
        weight: weights[index] / totalWeight
      }));

      const aggregated = weightedStates.reduce((acc, state) => ({
        energy: acc.energy + (state.energy * state.weight),
        mood: acc.mood + (state.mood * state.weight),
        focus: acc.focus + (state.focus * state.weight)
      }), { energy: 0, mood: 0, focus: 0 });

      return {
        energy: this._mapNumberToState(aggregated.energy, 'energy'),
        mood: this._mapNumberToState(aggregated.mood, 'mood'),
        focus: this._mapNumberToState(aggregated.focus, 'focus'),
        confidence: Math.min(1.0, stateEntries.length / 3), // Higher confidence with more data points
        lastUpdated: stateEntries[0].timestampStr || TimeZoneAwareDate.now(),
        dataPoints: stateEntries.length
      };
    } catch (error) {
      this.logger.error('HumanStateManager', 'Failed to get current human state', {
        error: error.message
      });
      return this._getDefaultHumanState();
    }
  }

  /**
   * Get default human state when no data available
   * @returns {Object} Default human state
   * @private
   */
  _getDefaultHumanState() {
    return {
      energy: 'MEDIUM',
      mood: 'NEUTRAL',
      focus: 'NORMAL',
      confidence: 0.3, // Low confidence for default state
      lastUpdated: TimeZoneAwareDate.now(),
      dataPoints: 0
    };
  }

  /**
   * Map state string to numeric value for calculations
   * @param {string} state - State string
   * @param {string} type - State type (energy, mood, focus)
   * @returns {number} Numeric value between 0 and 1
   * @private
   */
  _mapStateToNumber(state, type) {
    const mappings = {
      energy: {
        'DEPLETED': 0.1,
        'LOW': 0.3,
        'MEDIUM': 0.6,
        'HIGH': 0.9
      },
      mood: {
        'OVERWHELMED': 0.1,
        'STRESSED': 0.3,
        'NEUTRAL': 0.6,
        'POSITIVE': 0.9
      },
      focus: {
        'DISTRACTED': 0.1,
        'SCATTERED': 0.3,
        'NORMAL': 0.6,
        'SHARP': 0.9
      }
    };

    return mappings[type][state] || 0.5; // Default to middle value
  }

  /**
   * Map numeric value back to state string
   * @param {number} value - Numeric value between 0 and 1
   * @param {string} type - State type
   * @returns {string} State string
   * @private
   */
  _mapNumberToState(value, type) {
    const thresholds = {
      energy: [
        { threshold: 0.2, state: 'DEPLETED' },
        { threshold: 0.45, state: 'LOW' },
        { threshold: 0.75, state: 'MEDIUM' },
        { threshold: 1.0, state: 'HIGH' }
      ],
      mood: [
        { threshold: 0.2, state: 'OVERWHELMED' },
        { threshold: 0.45, state: 'STRESSED' },
        { threshold: 0.75, state: 'NEUTRAL' },
        { threshold: 1.0, state: 'POSITIVE' }
      ],
      focus: [
        { threshold: 0.2, state: 'DISTRACTED' },
        { threshold: 0.45, state: 'SCATTERED' },
        { threshold: 0.75, state: 'NORMAL' },
        { threshold: 1.0, state: 'SHARP' }
      ]
    };

    const stateThresholds = thresholds[type];
    for (const { threshold, state } of stateThresholds) {
      if (value <= threshold) {
        return state;
      }
    }

    return stateThresholds[stateThresholds.length - 1].state; // Fallback to highest state
  }

  /**
   * Ensure HUMAN_STATE sheet exists with proper headers
   * @private
   */
  _ensureHumanStateSheet() {
    try {
      // Check if sheet exists by trying to get headers
      this.batchOperations.getHeaders(SHEET_NAMES.HUMAN_STATE);
    } catch (error) {
      // Sheet doesn't exist, will be created by BatchOperations when first accessed
      this.logger.info('HumanStateManager', 'HUMAN_STATE sheet will be auto-created on first use');
    }
  }

  /**
   * Calculate task suitability score based on human state
   * @param {Object} task - Task to evaluate
   * @param {Object} humanState - Current human state
   * @returns {Object} Suitability analysis
   */
  calculateTaskSuitability(task, humanState = null) {
    try {
      const currentState = humanState || this.getCurrentHumanState();

      // Get task requirements (with defaults)
      const taskEnergyRequired = task.energy_required || 'MEDIUM';
      const taskFocusRequired = task.focus_required || 'NORMAL';
      const taskComplexity = parseInt(task.complexity_level) || 5;
      const taskPriority = task.priority || PRIORITY.MEDIUM;

      // Calculate energy match score
      const energyScore = this._calculateEnergyMatch(currentState.energy, taskEnergyRequired);

      // Calculate focus match score
      const focusScore = this._calculateFocusMatch(currentState.focus, taskFocusRequired);

      // Calculate mood impact
      const moodImpact = this._calculateMoodImpact(currentState.mood, taskComplexity);

      // Overall suitability score (weighted average)
      const suitabilityScore = (energyScore * 0.4) + (focusScore * 0.4) + (moodImpact * 0.2);

      const result = {
        score: Math.round(suitabilityScore * 100) / 100,
        energyMatch: energyScore,
        focusMatch: focusScore,
        moodImpact: moodImpact,
        recommendation: this._getTaskRecommendation(suitabilityScore),
        reason: this._getTaskSuitabilityReason(task, currentState, suitabilityScore),
        humanState: currentState,
        confidence: currentState.confidence
      };

      return result;

    } catch (error) {
      this.logger.error('HumanStateManager', 'Failed to calculate task suitability', {
        error: error.message,
        task_id: task.action_id
      });

      return {
        score: 0.5,
        recommendation: 'NEUTRAL',
        reason: 'Unable to analyze due to error',
        confidence: 0.1
      };
    }
  }

  /**
   * Calculate energy match between current state and task requirements
   * @param {string} currentEnergy - Current energy level
   * @param {string} requiredEnergy - Required energy level
   * @returns {number} Match score (0-1)
   * @private
   */
  _calculateEnergyMatch(currentEnergy, requiredEnergy) {
    const energyLevels = ['DEPLETED', 'LOW', 'MEDIUM', 'HIGH'];
    const currentLevel = energyLevels.indexOf(currentEnergy);
    const requiredLevel = energyLevels.indexOf(requiredEnergy);

    if (currentLevel === -1 || requiredLevel === -1) {
      return 0.5; // Default if invalid states
    }

    // Perfect match gets 1.0, each level difference reduces score
    const difference = Math.abs(currentLevel - requiredLevel);
    return Math.max(0, 1 - (difference * 0.25));
  }

  /**
   * Calculate focus match between current state and task requirements
   * @param {string} currentFocus - Current focus level
   * @param {string} requiredFocus - Required focus level
   * @returns {number} Match score (0-1)
   * @private
   */
  _calculateFocusMatch(currentFocus, requiredFocus) {
    const focusLevels = ['DISTRACTED', 'SCATTERED', 'NORMAL', 'SHARP'];
    const currentLevel = focusLevels.indexOf(currentFocus);
    const requiredLevel = focusLevels.indexOf(requiredFocus);

    if (currentLevel === -1 || requiredLevel === -1) {
      return 0.5;
    }

    const difference = Math.abs(currentLevel - requiredLevel);
    return Math.max(0, 1 - (difference * 0.25));
  }

  /**
   * Calculate mood impact on task performance
   * @param {string} currentMood - Current mood
   * @param {number} taskComplexity - Task complexity (1-10)
   * @returns {number} Impact score (0-1)
   * @private
   */
  _calculateMoodImpact(currentMood, taskComplexity) {
    const moodMultipliers = {
      'OVERWHELMED': 0.3,
      'STRESSED': 0.6,
      'NEUTRAL': 0.8,
      'POSITIVE': 1.0
    };

    const baseMoodScore = moodMultipliers[currentMood] || 0.5;

    // Complex tasks are more affected by negative moods
    const complexityFactor = 1 - ((taskComplexity - 5) * 0.05); // Reduce score for complex tasks

    return Math.max(0.1, Math.min(1.0, baseMoodScore * complexityFactor));
  }

  /**
   * Get task recommendation based on suitability score
   * @param {number} score - Suitability score
   * @returns {string} Recommendation
   * @private
   */
  _getTaskRecommendation(score) {
    if (score >= 0.8) return 'HIGHLY_RECOMMENDED';
    if (score >= 0.6) return 'RECOMMENDED';
    if (score >= 0.4) return 'NEUTRAL';
    if (score >= 0.2) return 'NOT_RECOMMENDED';
    return 'AVOID';
  }

  /**
   * Generate explanation for task suitability score
   * @param {Object} task - Task object
   * @param {Object} humanState - Current human state
   * @param {number} score - Suitability score
   * @returns {string} Explanation
   * @private
   */
  _getTaskSuitabilityReason(task, humanState, score) {
    if (score > 0.7) {
      return `Good match for current ${humanState.energy} energy and ${humanState.focus} focus`;
    } else if (score < 0.3) {
      return `May be challenging with current ${humanState.energy} energy and ${humanState.mood} mood`;
    } else {
      return 'Moderate fit for current state';
    }
  }

  /**
   * Get optimal task scheduling recommendations based on human state patterns
   * @param {Array} tasks - Array of tasks to schedule
   * @returns {Object} Scheduling recommendations
   */
  getSchedulingRecommendations(tasks) {
    try {
      const currentState = this.getCurrentHumanState();
      const recommendations = {
        immediate: [],
        later: [],
        postpone: [],
        state_guidance: this._getStateGuidance(currentState)
      };

      for (const task of tasks) {
        const suitability = this.calculateTaskSuitability(task, currentState);

        if (suitability.score >= 0.7) {
          recommendations.immediate.push({
            task: task,
            suitability: suitability,
            reason: 'High compatibility with current state'
          });
        } else if (suitability.score >= 0.4) {
          recommendations.later.push({
            task: task,
            suitability: suitability,
            reason: 'Consider when state improves'
          });
        } else {
          recommendations.postpone.push({
            task: task,
            suitability: suitability,
            reason: 'Wait for better state alignment'
          });
        }
      }

      // Sort each category by suitability score
      recommendations.immediate.sort((a, b) => b.suitability.score - a.suitability.score);
      recommendations.later.sort((a, b) => b.suitability.score - a.suitability.score);

      return recommendations;

    } catch (error) {
      this.logger.error('HumanStateManager', 'Failed to get scheduling recommendations', {
        error: error.message
      });
      return {
        immediate: [],
        later: [],
        postpone: [],
        state_guidance: 'Unable to provide guidance due to error'
      };
    }
  }

  /**
   * Get guidance based on current human state
   * @param {Object} state - Current human state
   * @returns {string} State-specific guidance
   * @private
   */
  _getStateGuidance(state) {
    const guidance = [];

    // Energy-based guidance
    if (state.energy === 'HIGH') {
      guidance.push('Great time for complex, high-priority tasks');
    } else if (state.energy === 'LOW') {
      guidance.push('Focus on simple administrative tasks');
    } else if (state.energy === 'DEPLETED') {
      guidance.push('Consider taking a break or doing very light tasks');
    }

    // Focus-based guidance
    if (state.focus === 'SHARP') {
      guidance.push('Perfect for deep work and detailed analysis');
    } else if (state.focus === 'SCATTERED') {
      guidance.push('Good time for quick tasks and communication');
    } else if (state.focus === 'DISTRACTED') {
      guidance.push('Try organizing or light planning tasks');
    }

    // Mood-based guidance
    if (state.mood === 'POSITIVE') {
      guidance.push('Excellent for creative work and collaboration');
    } else if (state.mood === 'STRESSED') {
      guidance.push('Focus on routine tasks to reduce cognitive load');
    } else if (state.mood === 'OVERWHELMED') {
      guidance.push('Consider breaking down large tasks into smaller pieces');
    }

    return guidance.join('. ') || 'Maintain current productivity approach';
  }

  /**
   * Self-test human state manager functionality
   * @returns {boolean} True if all tests pass
   */
  selfTest() {
    try {
      this.logger.info('HumanStateManager', 'Running self-test');

      // Test 1: Record a test state
      const testState = {
        energy: 'MEDIUM',
        mood: 'NEUTRAL',
        focus: 'NORMAL',
        notes: 'Self-test entry'
      };

      const recordSuccess = this.recordHumanState(testState);
      if (!recordSuccess) {
        throw new Error('Failed to record test state');
      }

      // Test 2: Get current state
      const currentState = this.getCurrentHumanState();
      if (!currentState || !currentState.energy) {
        throw new Error('Failed to get current human state');
      }

      // Test 3: Test task suitability calculation
      const testTask = {
        action_id: 'test_task',
        title: 'Test Task',
        energy_required: 'MEDIUM',
        focus_required: 'NORMAL',
        complexity_level: 5,
        priority: PRIORITY.MEDIUM
      };

      const suitability = this.calculateTaskSuitability(testTask, currentState);
      if (!suitability || typeof suitability.score !== 'number') {
        throw new Error('Failed to calculate task suitability');
      }

      // Test 4: Test state mapping functions
      const energyNumber = this._mapStateToNumber('HIGH', 'energy');
      const energyState = this._mapNumberToState(0.9, 'energy');
      if (typeof energyNumber !== 'number' || typeof energyState !== 'string') {
        throw new Error('State mapping functions failed');
      }

      this.logger.info('HumanStateManager', 'Self-test passed', {
        current_state: currentState,
        suitability_score: suitability.score,
        confidence: currentState.confidence
      });

      return true;

    } catch (error) {
      this.logger.error('HumanStateManager', `Self-test failed: ${error.message}`);
      return false; // Self-test failed
    }
  }
  /**
   * One-off maintenance function to normalize the HUMAN_STATE sheet.
   * Reads existing rows, inserts generated state_id, realigns columns, and re-writes.
   */
  normalizeHumanStateSheet() {
    try {
      this.logger.info('HumanStateManager', 'Starting HUMAN_STATE sheet normalization.');

      const oldHeaders = this.batchOperations.getHeaders(SHEET_NAMES.HUMAN_STATE);
      const allRows = this.batchOperations.getAllSheetData(SHEET_NAMES.HUMAN_STATE);

      // Define the new expected headers (8 columns)
      const newHeaders = [
        'state_id', 'timestamp', 'energy_level', 'focus_level', 'mood',
        'stress_level', 'current_context', 'notes'
      ];

      if (allRows.length <= 1) { // Only headers or empty sheet
        this.logger.info('HumanStateManager', 'HUMAN_STATE sheet is empty or only has headers. Writing new headers.');
        this.batchOperations.clearSheet(SHEET_NAMES.HUMAN_STATE);
        this.batchOperations.appendRows(SHEET_NAMES.HUMAN_STATE, [newHeaders]);
        return { success: true, message: 'Sheet initialized with new headers.' };
      }

      const oldSafeAccess = new SafeColumnAccess(oldHeaders);
      const newSafeAccess = new SafeColumnAccess(newHeaders);
      const normalizedRows = [];

      // Skip the header row from allRows
      for (let i = 1; i < allRows.length; i++) {
        const oldRow = allRows[i];
        const newRow = newSafeAccess.createEmptyRow();

        // Map old data to new structure, only including the 8 specified columns
        const stateId = oldSafeAccess.getCellValue(oldRow, 'state_id') || ('STATE_' + Utilities.getUuid());
        newSafeAccess.setCellValue(newRow, 'state_id', stateId);
        newSafeAccess.setCellValue(newRow, 'timestamp', oldSafeAccess.getCellValue(oldRow, 'timestamp'));
        newSafeAccess.setCellValue(newRow, 'energy_level', oldSafeAccess.getCellValue(oldRow, 'energy_level') || oldSafeAccess.getCellValue(oldRow, 'energy') || 'MEDIUM');
        newSafeAccess.setCellValue(newRow, 'focus_level', oldSafeAccess.getCellValue(oldRow, 'focus_level') || oldSafeAccess.getCellValue(oldRow, 'focus') || 'NORMAL');
        newSafeAccess.setCellValue(newRow, 'mood', oldSafeAccess.getCellValue(oldRow, 'mood') || 'NEUTRAL');
        newSafeAccess.setCellValue(newRow, 'stress_level', oldSafeAccess.getCellValue(oldRow, 'stress_level') || null);
        newSafeAccess.setCellValue(newRow, 'current_context', oldSafeAccess.getCellValue(oldRow, 'current_context') || null);
        newSafeAccess.setCellValue(newRow, 'notes', oldSafeAccess.getCellValue(oldRow, 'notes'));

        normalizedRows.push(newRow);
      }

      // Clear the sheet and write new headers and data
      this.batchOperations.clearSheet(SHEET_NAMES.HUMAN_STATE);
      this.batchOperations.appendRows(SHEET_NAMES.HUMAN_STATE, [newHeaders]);
      if (normalizedRows.length > 0) {
        this.batchOperations.appendRows(SHEET_NAMES.HUMAN_STATE, normalizedRows);
      }

      this.logger.info('HumanStateManager', `HUMAN_STATE sheet normalization complete. ${normalizedRows.length} rows processed.`);
      return { success: true, message: `Sheet normalized. ${normalizedRows.length} rows processed.` };

    } catch (error) {
      this.logger.error('HumanStateManager', 'Failed to normalize HUMAN_STATE sheet', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}
