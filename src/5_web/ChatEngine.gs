/**
 * MOH TIME OS v2.0 - CHAT ENGINE
 *
 * Google Chat integration engine with comprehensive command processing.
 * Handles task creation, status queries, and interactive command patterns.
 * Provides disambiguation cards and follow-up commands for enhanced UX.
 *
 * Original lines: 9316-10064 from scriptA.js
 */

class ChatEngine {
  constructor(configManager, batchOperations, logger, cache, errorHandler, archiveManager) {
    this.configManager = configManager;
    this.batchOperations = batchOperations;
    this.logger = logger;
    this.cache = cache;
    this.errorHandler = errorHandler;
    this.archiveManager = archiveManager;
    this.COMMAND_PATTERNS = [
      { pattern: /^\/add\s+(.{1,1024})/i, handler: '_handleCreateTask', type: 'slash_command' },
      { pattern: /^\/status$/i, handler: '_handleStatusQuery', type: 'slash_command' },
      { pattern: /^\/help$/i, handler: '_handleHelp', type: 'slash_command' },
      { pattern: /^\/cancel\s+(.{1,256})/i, handler: '_handleCancelTask', type: 'slash_command' },
      { pattern: /^\/done\s+(.{1,256})/i, handler: '_handleCompleteTask', type: 'slash_command' },
      { pattern: /^\/start\s+(.{1,256})/i, handler: '_handleStartTask', type: 'slash_command' },
      { pattern: /^\/depend\s+(.{1,256})\s+on\s+(.{1,256})/i, handler: '_handleCreateDependency', type: 'slash_command' },
      { pattern: /^\/why\s+(.{1,256})/i, handler: '_handleExplainScheduling', type: 'slash_command' },
      { pattern: /^\/priority\s+(high|medium|low|h|m|l)/i, handler: '_handleFollowUpPriority', type: 'followup_command' },
      { pattern: /^\/lane\s+([a-zA-Z_]+)/i, handler: '_handleFollowUpLane', type: 'followup_command' },
      { pattern: /^\/minutes\s+(\d+)/i, handler: '_handleFollowUpDuration', type: 'followup_command' }
    ];
  }

  _parseCommand(text, context) {
    try {
      for (const commandPattern of this.COMMAND_PATTERNS) {
        const match = text.match(commandPattern.pattern);
        if (match) {
          this.logger.debug('ChatEngine', `Matched ${commandPattern.type} pattern: ${commandPattern.pattern.source}`);
          return this[commandPattern.handler](match, context);
        }
      }
      return {
        success: true,
        response: this._createHelpResponse()
      };
    } catch (error) {
      this.logger.error('ChatEngine', `Command parsing error: ${error.message}`);
      return {
        success: false,
        error: 'Failed to parse command'
      };
    }
  }
  _handleCreateTask(match, context) {
    try {
      const taskDescription = match[1] ? match[1].trim() : '';
      if (!taskDescription) {
        return {
          success: true,
          response: this._createSimpleResponse('Please provide a task description.\nExample: `/add Review quarterly reports`')
        };
      }
      const taskData = this._parseTaskParameters(taskDescription, context);
      const MohTaskInstance = new MohTask(taskData);
      if (!MohTaskInstance.isValid()) {
        return {
          success: true,
          response: this._createSimpleResponse('Task validation failed. Please check your task description.')
        };
      }
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const taskRow = MohTaskInstance.toSheetRow(headers);
      this.batchOperations.batchAppend(SHEET_NAMES.ACTIONS, [taskRow]);
      this._storeRecentTaskContext(MohTaskInstance, context);
      this.logger.info('ChatEngine', `Created task: ${MohTaskInstance.title} (ID: ${MohTaskInstance.action_id})`);
      return {
        success: true,
        response: this._createTaskCreatedResponse(MohTaskInstance)
      };
    } catch (error) {
      this.logger.error('ChatEngine', `Task creation error: ${error.message}`);
      return {
        success: false,
        error: 'Failed to create task'
      };
    }
  }
  _handleStatusQuery() {
    try {
      this.logger.debug('ChatEngine', 'Processing strategic status analysis');
      const actionData = this.batchOperations.getAllSheetData(SHEET_NAMES.ACTIONS);
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const safeAccess = new SafeColumnAccess(headers);
      const dataRows = actionData.length > 1 ? actionData.slice(1) : [];
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const statusCounts = { PENDING: 0, SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELED: 0 };
      const highPriorityTasks = [];
      const urgentTasks = [];
      const todayScheduled = [];
      let completedThisWeek = 0;

      dataRows.forEach(row => {
        const status = safeAccess.getCellValue(row, 'status', '');
        const impact = safeAccess.getCellValue(row, 'impact', '');
        const estimatedCompletion = safeAccess.getCellValue(row, 'estimated_completion', '');
        const title = safeAccess.getCellValue(row, 'title', 'Untitled Task');
        const scheduledStart = safeAccess.getCellValue(row, 'scheduled_start', '');
        const updatedAt = safeAccess.getCellValue(row, 'updated_at', '');

        if (status && Object.prototype.hasOwnProperty.call(statusCounts, status)) {
          statusCounts[status]++;
        }
        if (impact === PRIORITY.HIGH && status === STATUS.PENDING) {
          highPriorityTasks.push(title.substring(0, 40));
        }
        if (estimatedCompletion && status !== STATUS.COMPLETED && status !== STATUS.CANCELED) {
          const deadlineDate = new Date(estimatedCompletion);
          if (deadlineDate <= threeDaysFromNow && deadlineDate > now) {
            urgentTasks.push({
              title: title.substring(0, 40),
              deadline: deadlineDate.toLocaleDateString(),
              status: status
            });
          }
        }
        if (scheduledStart && status === STATUS.SCHEDULED) {
          if (scheduledStart === 'email') {
            this.logger.warn('ChatEngine', `Skipping scheduled_start parsing for task due to invalid 'email' string: ${title}`);
            return; // Skip this entry or handle as appropriate
          }
          const scheduledDateObj = parseDateValue(scheduledStart);
          if (scheduledDateObj) {
            const todayStart = TimeZoneAwareDate.startOfDay();
            const todayEnd = TimeZoneAwareDate.endOfDay();
            if (scheduledDateObj >= todayStart && scheduledDateObj <= todayEnd) {
              todayScheduled.push({
                title: title.substring(0, 40),
                time: Utilities.formatDate(scheduledDateObj, CONSTANTS.TIMEZONE, 'HH:mm')
              });
            }
          }
        }
        if (status === STATUS.COMPLETED && updatedAt) {
          const updatedDate = new Date(updatedAt);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (updatedDate >= weekAgo) {
            completedThisWeek++;
          }
        }
      });

      const totalActiveTasks = statusCounts.PENDING + statusCounts.SCHEDULED + statusCounts.IN_PROGRESS;
      const workloadPressure = this._calculateWorkloadPressure(highPriorityTasks.length, urgentTasks.length, statusCounts.PENDING);
      const availabilityInsight = this._calculateAvailabilityInsight();
      const circuitBreakerStatus = {
        calendar: this.errorHandler.getServiceStatus('calendar'),
        gmail: this.errorHandler.getServiceStatus('gmail'),
        sheets: this.errorHandler.getServiceStatus('sheets')
      };

      return {
        success: true,
        response: this._createStrategicStatusResponse({
          statusCounts,
          highPriorityTasks,
          urgentTasks,
          todayScheduled,
          completedThisWeek,
          totalActiveTasks,
          workloadPressure,
          availabilityInsight,
          circuitBreakerStatus
        })
      };
    } catch (error) {
      this.logger.error('ChatEngine', `Strategic status query error: ${error.message}`);
      return {
        success: false,
        error: 'Failed to retrieve strategic status'
      };
    }
  }

  _handleHelp() {
    return {
      success: true,
      response: this._createHelpResponse()
    };
  }

  _parseTaskParameters(text, context) {
    const paramMatches = this._extractKeyValueParameters(text);
    const rawPriority = paramMatches.priority;
    const rawLane = paramMatches.lane;

    return {
      title: paramMatches.title || text,
      description: paramMatches.description || '',
      deadline: paramMatches.deadline || '',
      priority: normalizePriority(rawPriority || PRIORITY.MEDIUM),
      lane: normalizeLane(rawLane || LANE.OPERATIONAL),
      created_by: context && context.user ? context.user : 'unknown',
      created_at: new Date().toISOString()
    };
  }

  _extractKeyValueParameters(text) {
    const result = {};
    const regex = /(\w+):\s*([^\s]+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      result[match[1].toLowerCase()] = match[2];
    }
    return result;
  }

  _handleFollowUpPriority(match, context) {
    const priorityValue = match[1] ? match[1].toUpperCase() : '';
    if (!Object.values(PRIORITY).includes(priorityValue)) {
      return {
        success: true,
        response: this._createSimpleResponse('Invalid priority. Use: LOW, NORMAL, or HIGH.')
      };
    }
    const recentTask = this._getRecentTaskContext(context);
    if (!recentTask) {
      return {
        success: true,
        response: this._createSimpleResponse('No recent task found to update.')
      };
    }
    recentTask.priority = priorityValue;
    const success = this._updateTaskInSheet(recentTask.action_id, { priority: priorityValue });
    if (!success) {
      return {
        success: true,
        response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.')
      };
    }
    this._storeRecentTaskContext(recentTask, context);
    return {
      success: true,
      response: this._createSimpleResponse(`Priority for "${recentTask.title}" set to ${priorityValue}.`)
    };
  }

  _handleFollowUpLane(match, context) {
    const laneValue = match[1] ? match[1].toUpperCase() : '';
    if (!Object.values(LANE).includes(laneValue)) {
      return {
        success: true,
        response: this._createSimpleResponse('Invalid lane. Please use a valid lane value.')
      };
    }
    const recentTask = this._getRecentTaskContext(context);
    if (!recentTask) {
      return {
        success: true,
        response: this._createSimpleResponse('No recent task found to update.')
      };
    }
    recentTask.lane = laneValue;
    const success = this._updateTaskInSheet(recentTask.action_id, { lane: laneValue });
    if (!success) {
      return {
        success: true,
        response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.')
      };
    }
    this._storeRecentTaskContext(recentTask, context);
    return {
      success: true,
      response: this._createSimpleResponse(`Lane for "${recentTask.title}" set to ${laneValue}.`)
    };
  }

  _handleFollowUpDuration(match, context) {
    const durationValue = match[1] ? parseInt(match[1], 10) : null;
    if (!durationValue || isNaN(durationValue) || durationValue <= 0) {
      return {
        success: true,
        response: this._createSimpleResponse('Invalid estimate. Please provide a positive number of minutes.')
      };
    }
    const recentTask = this._getRecentTaskContext(context);
    if (!recentTask) {
      return {
        success: true,
        response: this._createSimpleResponse('No recent task found to update.')
      };
    }
    recentTask.estimated_minutes = durationValue;
    const success = this._updateTaskInSheet(recentTask.action_id, { estimated_minutes: durationValue });
    if (!success) {
      return {
        success: true,
        response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.')
      };
    }
    this._storeRecentTaskContext(recentTask, context);
    return {
      success: true,
      response: this._createSimpleResponse(`Estimated minutes for "${recentTask.title}" set to ${durationValue}.`)
    };
  }

  _handleCancelTask(match, context) {
    const taskIdentifier = match[1] ? match[1].trim() : '';
    const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const allActions = this.batchOperations.getRowsWithPosition(SHEET_NAMES.ACTIONS, {});

    const matches = [];
    for (const { row, sheetRowIndex } of allActions) {
      const action = MohTask.fromSheetRow(row, headers);
      if (action.action_id === taskIdentifier || action.title.toLowerCase().includes(taskIdentifier.toLowerCase())) {
        matches.push({ action: action, rowIndex: sheetRowIndex });
      }
    }

    if (matches.length === 0) {
      return { success: true, response: this._createSimpleResponse(`❌ Task not found: "${taskIdentifier}".`) };
    }

    if (matches.length > 1) {
      return { success: true, response: this._createDisambiguationCard(matches, 'cancel', taskIdentifier) };
    }

    const targetAction = matches[0].action;
    const validation = targetAction.validateStatusTransition(STATUS.CANCELED);
    if (!validation.valid) {
      return { success: false, response: this._createSimpleResponse(`❌ Cannot cancel task: ${validation.error}. Current status: ${targetAction.status}`) };
    }

    const success = this._updateTaskInSheet(targetAction.action_id, { status: STATUS.CANCELED });
    if (!success) {
      return { success: true, response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.') };
    }
    return { success: true, response: this._createSimpleResponse(`✅ Task canceled: "${targetAction.title}"`) };
  }

  _handleCompleteTask(match, context) {
    const taskIdentifier = match[1] ? match[1].trim() : '';
    const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const allActions = this.batchOperations.getRowsWithPosition(SHEET_NAMES.ACTIONS, {});

    const matches = [];
    for (const { row, sheetRowIndex } of allActions) {
      const action = MohTask.fromSheetRow(row, headers);
      if (action.action_id === taskIdentifier || action.title.toLowerCase().includes(taskIdentifier.toLowerCase())) {
        matches.push({ action: action, rowIndex: sheetRowIndex });
      }
    }

    if (matches.length === 0) {
      return { success: true, response: this._createSimpleResponse(`❌ Task not found: "${taskIdentifier}".`) };
    }

    if (matches.length > 1) {
      return { success: true, response: this._createDisambiguationCard(matches, 'complete', taskIdentifier) };
    }

    const targetAction = matches[0].action;
    targetAction.markCompleted(new Date());

    const success = this._updateTaskInSheet(targetAction.action_id, {
      status: STATUS.COMPLETED,
      completed_date: targetAction.completed_date,
      updated_at: targetAction.updated_at,
      actual_minutes: targetAction.actual_minutes,
      estimation_accuracy: targetAction.estimation_accuracy
    });

    if (!success) {
      return { success: true, response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.') };
    }

    return { success: true, response: this._createSimpleResponse(`🎉 Task completed: "${targetAction.title}"`) };
  }

  _handleStartTask(match, context) {
    const taskTitle = match[1] ? match[1].trim() : '';
    const task = this._findTaskByTitle(taskTitle);
    if (!task) {
      return {
        success: true,
        response: this._createSimpleResponse('Task not found to start.')
      };
    }
    const success = this._updateTaskInSheet(task.action_id, { status: STATUS.IN_PROGRESS });
    if (!success) {
      return {
        success: true,
        response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.')
      };
    }
    return {
      success: true,
      response: this._createSimpleResponse(`Task "${task.title}" started.`)
    };
  }

  _handleCreateDependency(match, context) {
    const dependentTitle = match[1] ? match[1].trim() : '';
    const dependencyTitle = match[2] ? match[2].trim() : '';
    const dependentTask = this._findTaskByTitle(dependentTitle);
    const dependencyTask = this._findTaskByTitle(dependencyTitle);

    if (!dependentTask || !dependencyTask) {
      return {
        success: true,
        response: this._createSimpleResponse('One or both tasks not found to establish dependency.')
      };
    }
    this._updateTaskInSheet(dependentTask.action_id, { dependency: dependencyTask.action_id });
    return {
      success: true,
      response: this._createSimpleResponse(
        `Task "${dependentTask.title}" will now depend on "${dependencyTask.title}".`
      )
    };
  }

  _handleExplainScheduling(match, context) {
    const taskIdentifier = match[1] ? match[1].trim() : '';
    const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const matches = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, { 'title': taskIdentifier });

    if (matches.length === 0) {
        return { success: true, response: this._createSimpleResponse(`Task not found: "${taskIdentifier}".`) };
    }
    
    const task = MohTask.fromSheetRow(matches[0], headers);
    
    if (!task) {
        return { success: true, response: this._createSimpleResponse(`Could not load details for task: "${taskIdentifier}".`) };
    }

    let explanation = `Scheduling status for "${task.title}":\n`;
    if (task.status === STATUS.SCHEDULED) {
        explanation += `  - Status: SCHEDULED\n`;
        explanation += `  - Time: ${new Date(task.scheduled_start).toLocaleString()}\n`;
    } else {
        explanation += `  - Status: ${task.status}\n`;
        explanation += `  - Not currently scheduled.\n`;
    }
    explanation += `\n(Note: Detailed "why" analysis is a feature in development.)`;

    return {
        success: true,
        response: this._createSimpleResponse(explanation)
    };
}

  _createDisambiguationCard(matches, operation, identifier) {
    const maxDisplay = 5;
    const widgets = [{
      textParagraph: {
        text: `⚠️ <b>Multiple tasks found for "${identifier}"</b><br>Please select the correct task to ${operation}:`
      }
    }];

    matches.slice(0, maxDisplay).forEach(match => {
      const action = match.action;
      const truncatedTitle = action.title.length > 50 ? action.title.substring(0, 47) + '...' : action.title;
      widgets.push({
        buttonList: {
          buttons: [{
            text: `${truncatedTitle} (ID: ...${action.action_id.slice(-6)})`,
            onClick: {
              action: {
                function: 'handleDisambiguation',
                parameters: [
                  { key: 'operation', value: operation },
                  { key: 'action_id', value: action.action_id }
                ]
              }
            }
          }]
        }
      });
    });

    if (matches.length > maxDisplay) {
      widgets.push({ textParagraph: { text: `<i>...and ${matches.length - maxDisplay} more.</i>` }});
    }

    return {
      cardsV2: [{
        card: {
          header: {
            title: `Confirm Task to ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
            subtitle: `${matches.length} matches found`
          },
          sections: [{ widgets: widgets }]
        }
      }]
    };
  }

  _executeDisambiguationOperation(operation, actionId) {
    const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
    const matches = this.batchOperations.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: actionId });

    if (!matches || matches.length === 0) {
      return { success: false, response: this._createSimpleResponse(`❌ Task not found: "${actionId}".`) };
    }

    const match = matches[0];
    const targetAction = MohTask.fromSheetRow(match.row, headers);

    switch (operation) {
    case 'cancel': {
      const validation = targetAction.validateStatusTransition(STATUS.CANCELED);
      if (!validation.valid) {
        return { success: false, response: this._createSimpleResponse(`❌ Cannot cancel task: ${validation.error}. Current status: ${targetAction.status}`) };
      }
      const success = this._updateTaskInSheet(targetAction.action_id, { status: STATUS.CANCELED });
      if (!success) {
        return { success: true, response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.') };
      }
      return { success: true, response: this._createSimpleResponse(`✅ Task canceled: "${targetAction.title}"`) };
    }
    case 'complete': {
      targetAction.markCompleted(new Date());
      const success = this._updateTaskInSheet(targetAction.action_id, {
        status: STATUS.COMPLETED,
        completed_date: targetAction.completed_date,
        updated_at: targetAction.updated_at,
        actual_minutes: targetAction.actual_minutes,
        estimation_accuracy: targetAction.estimation_accuracy
      });
      if (!success) {
        return { success: true, response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.') };
      }
      return { success: true, response: this._createSimpleResponse(`🎉 Task completed: "${targetAction.title}"`) };
    }
    case 'start': {
      const validation = targetAction.validateStatusTransition(STATUS.IN_PROGRESS);
      if (!validation.valid) {
        return { success: false, response: this._createSimpleResponse(`❌ Cannot start task: ${validation.error}. Current status: ${targetAction.status}`) };
      }
      const success = this._updateTaskInSheet(targetAction.action_id, { status: STATUS.IN_PROGRESS });
      if (!success) {
        return { success: true, response: this._createSimpleResponse('⚠️ Task modified elsewhere. Refresh and retry.') };
      }
      return { success: true, response: this._createSimpleResponse(`▶️ Task started: "${targetAction.title}"`) };
    }
    default:
      return { success: false, response: this._createSimpleResponse('Unsupported operation for disambiguation.') };
    }
  }

  _findTaskByTitle(title) {
    const rows = this.batchOperations.getAllSheetData(SHEET_NAMES.ACTIONS);
    if (!rows || rows.length === 0) {
      return null;
    }
    const headers = rows[0];
    const safeAccess = new SafeColumnAccess(headers);
    for (let i = 1; i < rows.length; i++) {
      const rowTitle = safeAccess.getCellValue(rows[i], 'title', '');
      if (rowTitle && rowTitle.toLowerCase().indexOf(title.toLowerCase()) !== -1) {
        const action_id = safeAccess.getCellValue(rows[i], 'action_id', '');
        return {
          action_id: action_id,
          title: rowTitle,
          priority: safeAccess.getCellValue(rows[i], 'priority', ''),
          lane: safeAccess.getCellValue(rows[i], 'lane', ''),
          duration: safeAccess.getCellValue(rows[i], 'duration', ''),
          scheduled_start: safeAccess.getCellValue(rows[i], 'scheduled_start', '')
        };
      }
    }
    return null;
  }

  _updateTaskInSheet(actionId, updates) {
    if (!actionId || !updates || typeof updates !== 'object') {
      this.logger.warn('ChatEngine', 'Invalid arguments to _updateTaskInSheet');
      return false;
    }

    try {
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const matches = this.batchOperations.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: actionId });

      if (!matches || matches.length === 0) {
        this.logger.warn('ChatEngine', `No task found with action_id ${actionId}`);
        return false;
      }

      const { row } = matches[0];
      const task = MohTask.fromSheetRow(row, headers);

      if (!task) {
        this.logger.error('ChatEngine', `Failed to instantiate MohTask for ${actionId}`);
        return false;
      }

      // Apply mutations
      Object.keys(updates).forEach(key => {
        if (task.hasOwnProperty(key)) {
          task[key] = updates[key];
        }
      });

      // Call optimistic locking (returns { success, versionConflict?, error? })
      const result = this.batchOperations.updateActionWithOptimisticLocking(
        SHEET_NAMES.ACTIONS,
        actionId,
        task
      );

      if (!result.success) {
        if (result.versionConflict) {
          this.logger.warn('ChatEngine', `Version conflict updating ${actionId}`, { result });
        } else {
          this.logger.error('ChatEngine', `Update failed for ${actionId}`, { result });
        }
        return false;
      }

      return true;

    } catch (error) {
      this.logger.error('ChatEngine', `Fatal error in _updateTaskInSheet: ${error.message}`, {
        actionId,
        stack: error.stack
      });
      throw error;
    }
  }

  _storeRecentTaskContext(task, context) {
    if (!context || !context.user) return;
    this.cache.put(`recentTask_${context.user}`, JSON.stringify(task), 3600);
  }

  _getRecentTaskContext(context) {
    if (!context || !context.user) return null;
    const data = this.cache.get(`recentTask_${context.user}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  _createSimpleResponse(message) {
    return {
      type: 'text',
      message: message
    };
  }

  _createTaskCreatedResponse(task) {
    return {
      type: 'card',
      title: 'Task Created',
      content: `Task "${task.title}" was created successfully.`
    };
  }

  _createHelpResponse() {
    return {
      type: 'text',
      message:
        'Commands:\n' +
        '/add [task description]\n' +
        '/status\n' +
        '/help\n' +
        '/cancel [task id or title]\n' +
        '/done [task id or title]\n' +
        '/start [task id or title]\n' +
        '/depend [task A] on [task B]\n' +
        '/why [task id or title]\n' +
        '/priority [HIGH|MEDIUM|LOW]\n' +
        '/lane [lane]\n' +
        '/minutes [estimate]\n'
    };
  }

  _calculateWorkloadPressure(highPriorityCount, urgentCount, pendingCount) {
    if (highPriorityCount > 5 || urgentCount > 5) return 'HIGH';
    if (highPriorityCount > 2 || urgentCount > 2 || pendingCount > 10) return 'MEDIUM';
    return 'LOW';
  }

  _calculateAvailabilityInsight() {
  try {
    const calendarSync = container.get(SERVICES.CalendarSyncManager);
    if (!calendarSync || typeof calendarSync.findFreeTimeSlots !== 'function') {
      this.logger.warn('ChatEngine', 'CalendarSyncManager not available for availability insight.');
      return { today: 'Availability check unavailable.', tomorrow: 'N/A' };
    }

    const now = new Date();
    const endOfToday = TimeZoneAwareDate.endOfDay(now);
    
    // Find all free slots of at least 15 minutes duration
    const freeSlotsToday = calendarSync.findFreeTimeSlots(now, endOfToday, 15);
    const totalFreeMinutes = freeSlotsToday.reduce((sum, slot) => sum + slot.duration, 0);

    const hours = Math.floor(totalFreeMinutes / 60);
    const minutes = totalFreeMinutes % 60;

    return {
      today: `Available: ${hours}h ${minutes}m free`,
      tomorrow: 'Use /schedule for tomorrow details.' // Keep it simple for chat
    };
  } catch (error) {
    this.logger.error('ChatEngine', 'Failed to calculate availability insight', { error: error.message });
    return { today: 'Availability check failed.', tomorrow: 'N/A' };
  }
}

  _createStrategicStatusResponse(data) {
    let message = `Active Tasks: ${data.totalActiveTasks}\n` +
      `High-priority: ${data.highPriorityTasks.length}\n` +
      `Urgent: ${data.urgentTasks.length}\n` +
      `Completed this week: ${data.completedThisWeek}\n` +
      `Workload Pressure: ${data.workloadPressure}\n\n`;

    if (data.highPriorityTasks.length) {
      message += `High-priority tasks:\n${data.highPriorityTasks.join('\n')}\n\n`;
    }
    if (data.urgentTasks.length) {
      message += 'Urgent tasks:\n' +
        data.urgentTasks.map(t => `${t.title} (by ${t.deadline})`).join('\n') + '\n\n';
    }
    if (data.todayScheduled.length) {
      message += 'Today\'s scheduled tasks:\n' +
        data.todayScheduled.map(t => `${t.title} at ${t.time}`).join('\n') + '\n\n';
    }
    message += `Availability:\nToday: ${data.availabilityInsight.today}\nTomorrow: ${data.availabilityInsight.tomorrow}\n\n`;
    message += 'Service Health:\n' +
      Object.entries(data.circuitBreakerStatus)
        .map(([k, v]) => `${k}: ${v ? 'OK' : 'ERROR'}`).join('\n');

    return {
      type: 'text',
      message: message
    };
  }

  doPost(e) {
    try {
      if (!e.postData || !e.postData.contents) {
        return ContentService.createTextOutput(JSON.stringify({ text: 'No request data received' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const payload = JSON.parse(e.postData.contents);
      const messageText = (payload.message && payload.message.text) || '';
      const context = {
        user: (payload.user && payload.user.displayName) || 'Unknown User'
      };

      const result = this._parseCommand(messageText, context);

      if (result && result.response) {
        return ContentService.createTextOutput(JSON.stringify(result.response))
          .setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({ text: 'Command processed' }))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
      this.logger.error('ChatEngine', 'doPost failed', { error: error.message });
      return ContentService.createTextOutput(JSON.stringify({ text: 'Internal error occurred' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

function processChatHumanStateCommand(command, parameters) {
  const humanStateManager = container.get(SERVICES.HumanStateManager);

  if (!humanStateManager) {
    return { success: false, message: 'Human state tracking not available' };
  }

  const state = {};
  const notes = [];

  for (const param of parameters) {
    const [key, value] = param.split(' ', 2);
    switch (key.toLowerCase()) {
    case '/energy':
      state.energy = value.toUpperCase();
      break;
    case '/mood':
      state.mood = value.toUpperCase();
      break;
    case '/focus':
      state.focus = value.toUpperCase();
      break;
    case '/note':
      notes.push(param.substring(6)); // Remove "/note "
      break;
    }
  }

  if (notes.length > 0) {
    state.notes = notes.join(' ');
  }

  const success = humanStateManager.recordHumanState(state);

  if (success) {
    const currentState = humanStateManager.getCurrentHumanState();
    return {
      success: true,
      message: `Human state updated. Current state: Energy ${currentState.energy}, Mood ${currentState.mood}, Focus ${currentState.focus}`,
      state: currentState
    };
  } else {
    return {
      success: false,
      message: 'Failed to update human state'
    };
  }
}

function handleDisambiguation(e) {
  const logger = container.get(SERVICES.SmartLogger);
  try {
    const params = {};

    if (e && e.parameters) {
      if (Array.isArray(e.parameters)) {
        e.parameters.forEach(param => {
          if (param && param.key) {
            params[param.key] = param.value;
          }
        });
      } else {
        Object.keys(e.parameters).forEach(key => {
          params[key] = e.parameters[key];
        });
      }
    } else if (e && e.common && e.common.parameters) {
      e.common.parameters.forEach(param => {
        if (param && param.key) {
          params[param.key] = param.value;
        }
      });
    }

    const operation = params.operation;
    const actionId = params.action_id;

    if (!operation || !actionId) {
      logger.warn('ChatEngine', 'Disambiguation handler missing parameters', { params });
      return { type: 'text', message: 'Unable to process selection. Missing information.' };
    }

    const chatEngine = container.get(SERVICES.ChatEngine);
    const result = chatEngine._executeDisambiguationOperation(operation, actionId);

    if (result && result.response) {
      return result.response;
    }

    return { type: 'text', message: 'Selection processed.' };

  } catch (error) {
    logger.error('ChatEngine', 'Failed to handle disambiguation selection', { error: error.message });
    return { type: 'text', message: 'An error occurred while processing your selection.' };
  }
}