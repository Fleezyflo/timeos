# TIME-OS-1.0 - BACKEND FUNCTIONS 

**Part 2 of Final Implementation Brief**

---

# 5. BACKEND FUNCTIONS (NEW)

## 5.1 Function List

Add these 12 new functions to `/moh-time-os-v2/src/5_web/AppSheetBridge.gs`

**Insert location:** After the existing `appsheet_resolveConflict` function (around line ~630)

---

## 5.2 Complete Backend Code

Copy all functions below into AppSheetBridge.gs:

```javascript
// ==================== NEW FUNCTIONS FOR WEB APP ====================

/**
 * Get tasks for day planner (today or all scheduled)
 * @param {Object} params - { view: 'today'|'scheduled' }
 * @return {Object} { success: true, tasks: [], count: number, timestamp: ISO }
 */
function appsheet_getMyDay(params) {
  ensureSystemInitialized();

  try {
    params = params || {};
    const view = params.view || 'today';

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    // Get all tasks (headers at index 0, data starts at 1)
    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1); // Skip header row

    // Find column indices
    const statusIdx = headers.indexOf('status');
    const titleIdx = headers.indexOf('title');
    const priorityIdx = headers.indexOf('priority');
    const laneIdx = headers.indexOf('lane');
    const estimatedMinIdx = headers.indexOf('estimated_minutes');
    const scheduledStartIdx = headers.indexOf('scheduled_start');
    const scheduledEndIdx = headers.indexOf('scheduled_end');
    const energyIdx = headers.indexOf('energy_required');
    const actionIdIdx = headers.indexOf('action_id');
    const descriptionIdx = headers.indexOf('description');

    // Filter based on view
    let filteredRows = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    if (view === 'today') {
      // Today's tasks: SCHEDULED status with scheduled_start today
      filteredRows = dataRows.filter(function(row) {
        const status = row[statusIdx];
        const scheduledStart = row[scheduledStartIdx];

        if (status !== 'SCHEDULED') return false;
        if (!scheduledStart) return false;

        const startDate = new Date(scheduledStart);
        return startDate >= todayStart && startDate < todayEnd;
      });
    } else if (view === 'scheduled') {
      // All scheduled tasks (any date)
      filteredRows = dataRows.filter(function(row) {
        return row[statusIdx] === 'SCHEDULED';
      });
    } else {
      throw new Error('Invalid view parameter. Use "today" or "scheduled"');
    }

    // Sort by scheduled_start
    filteredRows.sort(function(a, b) {
      const timeA = a[scheduledStartIdx] ? new Date(a[scheduledStartIdx]).getTime() : 0;
      const timeB = b[scheduledStartIdx] ? new Date(b[scheduledStartIdx]).getTime() : 0;
      return timeA - timeB;
    });

    // Build task objects
    const tasks = filteredRows.map(function(row) {
      return {
        action_id: row[actionIdIdx],
        title: row[titleIdx],
        description: row[descriptionIdx],
        status: row[statusIdx],
        priority: row[priorityIdx],
        lane: row[laneIdx],
        estimated_minutes: row[estimatedMinIdx],
        scheduled_start: row[scheduledStartIdx],
        scheduled_end: row[scheduledEndIdx],
        energy_required: row[energyIdx]
      };
    });

    return {
      success: true,
      tasks: tasks,
      count: tasks.length,
      view: view,
      timestamp: TimeZoneAwareDate.toISOString(new Date())
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getMyDay failed: ' + error.message);
    throw error;
  }
}

/**
 * Get all tasks with optional filtering
 * @param {Object} params - { filters: {status, priority, lane}, search: string, limit: number, offset: number }
 * @return {Object} { success: true, tasks: [], total: number, timestamp: ISO }
 */
function appsheet_getAllTasks(params) {
  ensureSystemInitialized();

  try {
    params = params || {};
    const filters = params.filters || {};
    const searchTerm = params.search || '';
    const limit = params.limit || 100;
    const offset = params.offset || 0;

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    // Get all tasks
    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1); // Skip header row

    // Find column indices
    const statusIdx = headers.indexOf('status');
    const titleIdx = headers.indexOf('title');
    const priorityIdx = headers.indexOf('priority');
    const laneIdx = headers.indexOf('lane');
    const estimatedMinIdx = headers.indexOf('estimated_minutes');
    const scheduledStartIdx = headers.indexOf('scheduled_start');
    const scheduledEndIdx = headers.indexOf('scheduled_end');
    const energyIdx = headers.indexOf('energy_required');
    const actionIdIdx = headers.indexOf('action_id');
    const descriptionIdx = headers.indexOf('description');

    // Filter: exclude archived and canceled by default
    let filteredRows = dataRows.filter(function(row) {
      const status = row[statusIdx];
      return status !== 'ARCHIVED' && status !== 'CANCELED';
    });

    // Apply status filter
    if (filters.status) {
      filteredRows = filteredRows.filter(function(row) {
        return row[statusIdx] === filters.status;
      });
    }

    // Apply priority filter
    if (filters.priority) {
      filteredRows = filteredRows.filter(function(row) {
        return row[priorityIdx] === filters.priority;
      });
    }

    // Apply lane filter
    if (filters.lane) {
      filteredRows = filteredRows.filter(function(row) {
        return row[laneIdx] === filters.lane;
      });
    }

    // Apply search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredRows = filteredRows.filter(function(row) {
        const title = (row[titleIdx] || '').toLowerCase();
        const description = (row[descriptionIdx] || '').toLowerCase();
        return title.indexOf(search) !== -1 || description.indexOf(search) !== -1;
      });
    }

    // Sort by priority DESC, then scheduled_start ASC
    const priorityOrder = { CRITICAL: 6, URGENT: 5, HIGH: 4, MEDIUM: 3, LOW: 2, MINIMAL: 1 };
    filteredRows.sort(function(a, b) {
      const priorityA = priorityOrder[a[priorityIdx]] || 3;
      const priorityB = priorityOrder[b[priorityIdx]] || 3;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      const timeA = a[scheduledStartIdx] ? new Date(a[scheduledStartIdx]).getTime() : 0;
      const timeB = b[scheduledStartIdx] ? new Date(b[scheduledStartIdx]).getTime() : 0;
      return timeA - timeB;
    });

    const total = filteredRows.length;

    // Apply pagination
    const paginatedRows = filteredRows.slice(offset, offset + limit);

    // Build task objects
    const tasks = paginatedRows.map(function(row) {
      return {
        action_id: row[actionIdIdx],
        title: row[titleIdx],
        description: row[descriptionIdx],
        status: row[statusIdx],
        priority: row[priorityIdx],
        lane: row[laneIdx],
        estimated_minutes: row[estimatedMinIdx],
        scheduled_start: row[scheduledStartIdx],
        scheduled_end: row[scheduledEndIdx],
        energy_required: row[energyIdx]
      };
    });

    return {
      success: true,
      tasks: tasks,
      total: total,
      offset: offset,
      limit: limit,
      timestamp: TimeZoneAwareDate.toISOString(new Date())
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getAllTasks failed: ' + error.message);
    throw error;
  }
}

/**
 * Get high priority tasks for dashboard
 * @param {Object} params - { limit: number }
 * @return {Object} { success: true, tasks: [], timestamp: ISO }
 */
function appsheet_getHighPriorityTasks(params) {
  ensureSystemInitialized();

  try {
    params = params || {};
    const limit = params.limit || 5;

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const statusIdx = headers.indexOf('status');
    const titleIdx = headers.indexOf('title');
    const priorityIdx = headers.indexOf('priority');
    const laneIdx = headers.indexOf('lane');
    const estimatedMinIdx = headers.indexOf('estimated_minutes');
    const scheduledStartIdx = headers.indexOf('scheduled_start');
    const scheduledEndIdx = headers.indexOf('scheduled_end');
    const energyIdx = headers.indexOf('energy_required');
    const actionIdIdx = headers.indexOf('action_id');
    const descriptionIdx = headers.indexOf('description');

    // Filter: high priority, not completed/archived/canceled
    const highPriorityRows = dataRows.filter(function(row) {
      const status = row[statusIdx];
      const priority = row[priorityIdx];
      return (priority === 'CRITICAL' || priority === 'URGENT' || priority === 'HIGH') &&
             (status !== 'COMPLETED' && status !== 'ARCHIVED' && status !== 'CANCELED');
    });

    // Sort by priority
    const priorityOrder = { CRITICAL: 3, URGENT: 2, HIGH: 1 };
    highPriorityRows.sort(function(a, b) {
      const priorityA = priorityOrder[a[priorityIdx]] || 0;
      const priorityB = priorityOrder[b[priorityIdx]] || 0;
      return priorityB - priorityA;
    });

    // Take top N
    const topRows = highPriorityRows.slice(0, limit);

    // Build task objects
    const tasks = topRows.map(function(row) {
      return {
        action_id: row[actionIdIdx],
        title: row[titleIdx],
        description: row[descriptionIdx],
        status: row[statusIdx],
        priority: row[priorityIdx],
        lane: row[laneIdx],
        estimated_minutes: row[estimatedMinIdx],
        scheduled_start: row[scheduledStartIdx],
        scheduled_end: row[scheduledEndIdx],
        energy_required: row[energyIdx]
      };
    });

    return {
      success: true,
      tasks: tasks,
      count: tasks.length,
      timestamp: TimeZoneAwareDate.toISOString(new Date())
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getHighPriorityTasks failed: ' + error.message);
    throw error;
  }
}

/**
 * Get calendar events for date range
 * @param {Object} params - { startDate: ISO, endDate: ISO }
 * @return {Object} { success: true, events: [], timestamp: ISO }
 */
function appsheet_getCalendarEvents(params) {
  ensureSystemInitialized();

  try {
    params = params || {};
    const startDate = params.startDate ? new Date(params.startDate) : new Date();
    const endDate = params.endDate ? new Date(params.endDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const statusIdx = headers.indexOf('status');
    const titleIdx = headers.indexOf('title');
    const priorityIdx = headers.indexOf('priority');
    const scheduledStartIdx = headers.indexOf('scheduled_start');
    const scheduledEndIdx = headers.indexOf('scheduled_end');
    const actionIdIdx = headers.indexOf('action_id');

    // Filter: scheduled tasks within date range
    const eventRows = dataRows.filter(function(row) {
      const status = row[statusIdx];
      const scheduledStart = row[scheduledStartIdx];

      if (!scheduledStart) return false;
      if (status === 'ARCHIVED' || status === 'CANCELED') return false;

      const eventDate = new Date(scheduledStart);
      return eventDate >= startDate && eventDate <= endDate;
    });

    // Build event objects
    const events = eventRows.map(function(row) {
      return {
        id: row[actionIdIdx],
        title: row[titleIdx],
        start: row[scheduledStartIdx],
        end: row[scheduledEndIdx] || row[scheduledStartIdx],
        type: 'task',
        priority: row[priorityIdx]
      };
    });

    return {
      success: true,
      events: events,
      count: events.length,
      timestamp: TimeZoneAwareDate.toISOString(new Date())
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getCalendarEvents failed: ' + error.message);
    throw error;
  }
}

/**
 * Start a task (change status to IN_PROGRESS)
 * @param {Object} params - { taskId: string }
 * @return {Object} { success: true, startedAt: ISO, timestamp: ISO }
 */
function appsheet_startTask(params) {
  ensureSystemInitialized();

  try {
    if (!params || !params.taskId) {
      throw new Error('taskId is required');
    }

    const taskId = params.taskId;
    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    // Find task by action_id
    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const actionIdIdx = headers.indexOf('action_id');
    const statusIdx = headers.indexOf('status');
    const updatedAtIdx = headers.indexOf('updated_at');

    let taskRowIndex = -1;
    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][actionIdIdx] === taskId) {
        taskRowIndex = i + 2; // +2 because sheet is 1-indexed and we skipped header
        break;
      }
    }

    if (taskRowIndex === -1) {
      throw new Error('Task not found: ' + taskId);
    }

    const now = new Date();
    const nowISO = TimeZoneAwareDate.toISOString(now);

    // Update status and updated_at
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
    sheet.getRange(taskRowIndex, statusIdx + 1).setValue('IN_PROGRESS');
    sheet.getRange(taskRowIndex, updatedAtIdx + 1).setValue(nowISO);

    LoggerFacade.info('AppSheetBridge', 'Task started: ' + taskId);

    return {
      success: true,
      taskId: taskId,
      startedAt: nowISO,
      timestamp: nowISO
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_startTask failed: ' + error.message);
    throw error;
  }
}

/**
 * Complete a task
 * @param {Object} params - { taskId: string, actualMinutes: number }
 * @return {Object} { success: true, completedAt: ISO, estimationAccuracy: number, timestamp: ISO }
 */
function appsheet_completeTask(params) {
  ensureSystemInitialized();

  try {
    if (!params || !params.taskId) {
      throw new Error('taskId is required');
    }

    const taskId = params.taskId;
    const actualMinutes = params.actualMinutes || 0;

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const actionIdIdx = headers.indexOf('action_id');
    const statusIdx = headers.indexOf('status');
    const completedDateIdx = headers.indexOf('completed_date');
    const actualMinutesIdx = headers.indexOf('actual_minutes');
    const estimatedMinutesIdx = headers.indexOf('estimated_minutes');
    const estimationAccuracyIdx = headers.indexOf('estimation_accuracy');
    const updatedAtIdx = headers.indexOf('updated_at');

    let taskRowIndex = -1;
    let estimatedMinutes = 0;

    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][actionIdIdx] === taskId) {
        taskRowIndex = i + 2;
        estimatedMinutes = dataRows[i][estimatedMinutesIdx] || 0;
        break;
      }
    }

    if (taskRowIndex === -1) {
      throw new Error('Task not found: ' + taskId);
    }

    const now = new Date();
    const nowISO = TimeZoneAwareDate.toISOString(now);

    // Calculate estimation accuracy
    let accuracy = 0;
    if (estimatedMinutes > 0 && actualMinutes > 0) {
      accuracy = actualMinutes / estimatedMinutes;
    }

    // Update task
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
    sheet.getRange(taskRowIndex, statusIdx + 1).setValue('COMPLETED');
    sheet.getRange(taskRowIndex, completedDateIdx + 1).setValue(nowISO);
    sheet.getRange(taskRowIndex, actualMinutesIdx + 1).setValue(actualMinutes);
    sheet.getRange(taskRowIndex, estimationAccuracyIdx + 1).setValue(accuracy);
    sheet.getRange(taskRowIndex, updatedAtIdx + 1).setValue(nowISO);

    LoggerFacade.info('AppSheetBridge', 'Task completed: ' + taskId);

    return {
      success: true,
      taskId: taskId,
      completedAt: nowISO,
      actualMinutes: actualMinutes,
      estimationAccuracy: accuracy,
      timestamp: nowISO
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_completeTask failed: ' + error.message);
    throw error;
  }
}

/**
 * Cancel a task
 * @param {Object} params - { taskId: string }
 * @return {Object} { success: true, timestamp: ISO }
 */
function appsheet_cancelTask(params) {
  ensureSystemInitialized();

  try {
    if (!params || !params.taskId) {
      throw new Error('taskId is required');
    }

    const taskId = params.taskId;
    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const actionIdIdx = headers.indexOf('action_id');
    const statusIdx = headers.indexOf('status');
    const updatedAtIdx = headers.indexOf('updated_at');

    let taskRowIndex = -1;
    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][actionIdIdx] === taskId) {
        taskRowIndex = i + 2;
        break;
      }
    }

    if (taskRowIndex === -1) {
      throw new Error('Task not found: ' + taskId);
    }

    const now = new Date();
    const nowISO = TimeZoneAwareDate.toISOString(now);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
    sheet.getRange(taskRowIndex, statusIdx + 1).setValue('CANCELED');
    sheet.getRange(taskRowIndex, updatedAtIdx + 1).setValue(nowISO);

    LoggerFacade.info('AppSheetBridge', 'Task canceled: ' + taskId);

    return {
      success: true,
      taskId: taskId,
      timestamp: nowISO
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_cancelTask failed: ' + error.message);
    throw error;
  }
}

/**
 * Archive a completed task
 * @param {Object} params - { taskId: string }
 * @return {Object} { success: true, timestamp: ISO }
 */
function appsheet_archiveTask(params) {
  ensureSystemInitialized();

  try {
    if (!params || !params.taskId) {
      throw new Error('taskId is required');
    }

    const taskId = params.taskId;
    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const actionIdIdx = headers.indexOf('action_id');
    const statusIdx = headers.indexOf('status');
    const updatedAtIdx = headers.indexOf('updated_at');

    let taskRowIndex = -1;
    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][actionIdIdx] === taskId) {
        taskRowIndex = i + 2;
        break;
      }
    }

    if (taskRowIndex === -1) {
      throw new Error('Task not found: ' + taskId);
    }

    const now = new Date();
    const nowISO = TimeZoneAwareDate.toISOString(now);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
    sheet.getRange(taskRowIndex, statusIdx + 1).setValue('ARCHIVED');
    sheet.getRange(taskRowIndex, updatedAtIdx + 1).setValue(nowISO);

    LoggerFacade.info('AppSheetBridge', 'Task archived: ' + taskId);

    return {
      success: true,
      taskId: taskId,
      timestamp: nowISO
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_archiveTask failed: ' + error.message);
    throw error;
  }
}

/**
 * Snooze a task by specified minutes
 * @param {Object} params - { taskId: string, minutes: number }
 * @return {Object} { success: true, newScheduledStart: ISO, timestamp: ISO }
 */
function appsheet_snoozeTask(params) {
  ensureSystemInitialized();

  try {
    if (!params || !params.taskId || !params.minutes) {
      throw new Error('taskId and minutes are required');
    }

    const taskId = params.taskId;
    const minutesToAdd = params.minutes;

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const actionIdIdx = headers.indexOf('action_id');
    const statusIdx = headers.indexOf('status');
    const scheduledStartIdx = headers.indexOf('scheduled_start');
    const scheduledEndIdx = headers.indexOf('scheduled_end');
    const rolloverCountIdx = headers.indexOf('rollover_count');
    const updatedAtIdx = headers.indexOf('updated_at');
    const estimatedMinutesIdx = headers.indexOf('estimated_minutes');

    let taskRowIndex = -1;
    let currentRolloverCount = 0;
    let estimatedMinutes = 30;

    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][actionIdIdx] === taskId) {
        taskRowIndex = i + 2;
        currentRolloverCount = dataRows[i][rolloverCountIdx] || 0;
        estimatedMinutes = dataRows[i][estimatedMinutesIdx] || 30;
        break;
      }
    }

    if (taskRowIndex === -1) {
      throw new Error('Task not found: ' + taskId);
    }

    const now = new Date();
    const newScheduledStart = new Date(now.getTime() + minutesToAdd * 60 * 1000);
    const newScheduledEnd = new Date(newScheduledStart.getTime() + estimatedMinutes * 60 * 1000);

    const newScheduledStartISO = TimeZoneAwareDate.toISOString(newScheduledStart);
    const newScheduledEndISO = TimeZoneAwareDate.toISOString(newScheduledEnd);
    const nowISO = TimeZoneAwareDate.toISOString(now);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
    sheet.getRange(taskRowIndex, statusIdx + 1).setValue('DEFERRED');
    sheet.getRange(taskRowIndex, scheduledStartIdx + 1).setValue(newScheduledStartISO);
    sheet.getRange(taskRowIndex, scheduledEndIdx + 1).setValue(newScheduledEndISO);
    sheet.getRange(taskRowIndex, rolloverCountIdx + 1).setValue(currentRolloverCount + 1);
    sheet.getRange(taskRowIndex, updatedAtIdx + 1).setValue(nowISO);

    LoggerFacade.info('AppSheetBridge', 'Task snoozed: ' + taskId + ' for ' + minutesToAdd + ' minutes');

    return {
      success: true,
      taskId: taskId,
      newScheduledStart: newScheduledStartISO,
      newScheduledEnd: newScheduledEndISO,
      rolloverCount: currentRolloverCount + 1,
      timestamp: nowISO
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_snoozeTask failed: ' + error.message);
    throw error;
  }
}

/**
 * Reschedule a task to new time
 * @param {Object} params - { taskId: string, newStart: ISO, newEnd: ISO }
 * @return {Object} { success: true, timestamp: ISO }
 */
function appsheet_rescheduleTask(params) {
  ensureSystemInitialized();

  try {
    if (!params || !params.taskId || !params.newStart || !params.newEnd) {
      throw new Error('taskId, newStart, and newEnd are required');
    }

    const taskId = params.taskId;
    const newStart = params.newStart;
    const newEnd = params.newEnd;

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    const allData = batchOps.getAllSheetData(SHEET_NAMES.ACTIONS);
    const dataRows = allData.slice(1);

    const actionIdIdx = headers.indexOf('action_id');
    const scheduledStartIdx = headers.indexOf('scheduled_start');
    const scheduledEndIdx = headers.indexOf('scheduled_end');
    const updatedAtIdx = headers.indexOf('updated_at');

    let taskRowIndex = -1;
    for (let i = 0; i < dataRows.length; i++) {
      if (dataRows[i][actionIdIdx] === taskId) {
        taskRowIndex = i + 2;
        break;
      }
    }

    if (taskRowIndex === -1) {
      throw new Error('Task not found: ' + taskId);
    }

    const now = new Date();
    const nowISO = TimeZoneAwareDate.toISOString(now);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
    sheet.getRange(taskRowIndex, scheduledStartIdx + 1).setValue(newStart);
    sheet.getRange(taskRowIndex, scheduledEndIdx + 1).setValue(newEnd);
    sheet.getRange(taskRowIndex, updatedAtIdx + 1).setValue(nowISO);

    LoggerFacade.info('AppSheetBridge', 'Task rescheduled: ' + taskId);

    return {
      success: true,
      taskId: taskId,
      newScheduledStart: newStart,
      newScheduledEnd: newEnd,
      timestamp: nowISO
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_rescheduleTask failed: ' + error.message);
    throw error;
  }
}

/**
 * Create a new task and schedule it
 * @param {Object} params - Task data object
 * @return {Object} { success: true, taskId: string, scheduled: boolean, timestamp: ISO }
 */
function appsheet_createTask(params) {
  ensureSystemInitialized();

  try {
    if (!params || !params.title) {
      throw new Error('title is required');
    }

    const now = new Date();
    const nowISO = TimeZoneAwareDate.toISOString(now);

    // Generate unique task ID
    const taskId = 'ACT_' + Utilities.getUuid().substring(0, 8);

    const taskData = {
      action_id: taskId,
      status: 'PENDING',
      priority: params.priority || 'MEDIUM',
      created_at: nowISO,
      updated_at: nowISO,
      title: params.title,
      context: params.context || '',
      lane: params.lane || 'ops',
      estimated_minutes: params.estimated_minutes || 30,
      description: params.description || '',
      source: 'webapp',
      energy_required: params.energy_required || 'MEDIUM',
      focus_required: params.focus_required || 'MEDIUM',
      rollover_count: 0
    };

    // Write to sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.ACTIONS);
    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);

    // Build row array in correct column order
    const rowData = headers.map(function(header) {
      return taskData[header] || '';
    });

    sheet.appendRow(rowData);

    LoggerFacade.info('AppSheetBridge', 'Task created: ' + taskId);

    // Try to schedule it
    let scheduled = false;
    try {
      const scheduleResult = appsheet_runScheduling({ taskId: taskId, dryRun: false });
      scheduled = scheduleResult.success && scheduleResult.scheduled > 0;
    } catch (scheduleError) {
      LoggerFacade.warn('AppSheetBridge', 'Failed to auto-schedule new task: ' + scheduleError.message);
    }

    return {
      success: true,
      taskId: taskId,
      scheduled: scheduled,
      timestamp: nowISO
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_createTask failed: ' + error.message);
    throw error;
  }
}

/**
 * Get count of pending proposals (for dashboard badge)
 * @return {Object} { success: true, count: number, timestamp: ISO }
 */
function appsheet_getPendingProposalsCount() {
  ensureSystemInitialized();

  try {
    const batchOps = container.get(SERVICES.BatchOperations);

    // Check if PROPOSED_TASKS sheet exists
    try {
      const headers = batchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
      const allData = batchOps.getAllSheetData(SHEET_NAMES.PROPOSED_TASKS);
      const dataRows = allData.slice(1);

      const statusIdx = headers.indexOf('status');

      const pendingCount = dataRows.filter(function(row) {
        return row[statusIdx] === 'PENDING';
      }).length;

      return {
        success: true,
        count: pendingCount,
        timestamp: TimeZoneAwareDate.toISOString(new Date())
      };
    } catch (sheetError) {
      // Sheet doesn't exist, return 0
      return {
        success: true,
        count: 0,
        timestamp: TimeZoneAwareDate.toISOString(new Date())
      };
    }

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getPendingProposalsCount failed: ' + error.message);
    throw error;
  }
}
```

---

# 6. BACKEND MODIFICATIONS

## 6.1 Modify AppSheetBridge.doGet()

**Location:** `/moh-time-os-v2/src/5_web/AppSheetBridge.gs` around line ~70

**Find this block:**
```javascript
doGet(e) {
  try {
    const endpoint = e.parameter.endpoint || 'status';

    if (endpoint === 'config') {
      return this._serveConfig();
    }

    return this._serveStatus();
  } catch (error) {
    return this._errorResponse(error);
  }
}
```

**Replace with:**
```javascript
doGet(e) {
  try {
    const endpoint = e.parameter.endpoint || 'status';

    // Serve HTML web app
    if (endpoint === 'planner') {
      return HtmlService.createHtmlOutputFromFile('5_web/DayPlanner')
        .setTitle('MOH TIME OS')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // Existing JSON endpoints
    if (endpoint === 'config') {
      return this._serveConfig();
    }

    return this._serveStatus();
  } catch (error) {
    return this._errorResponse(error);
  }
}
```

---

## 6.2 Modify SystemBootstrap.doGet()

**Location:** `/moh-time-os-v2/src/8_setup/SystemBootstrap.gs` around line ~565

**Find this block:**
```javascript
function doGet(e) {
  try {
    const webAppManager = container.get(SERVICES.WebAppManager);
    return webAppManager.handleDoGet(e);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 500,
      error: 'Internal server error',
      details: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Replace with:**
```javascript
function doGet(e) {
  try {
    // Ensure services are initialized before handling request
    ensureSystemInitialized();

    const webAppManager = container.get(SERVICES.WebAppManager);
    return webAppManager.handleDoGet(e);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 500,
      error: 'Internal server error',
      details: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

**Add this helper function** after doGet() if it doesn't already exist:

```javascript
/**
 * Ensure system is initialized before handling requests
 */
function ensureSystemInitialized() {
  // Check if core services are registered
  if (!hasService(SERVICES.BatchOperations)) {
    LoggerFacade.info('SystemBootstrap', 'Auto-initializing system for web request');
    registerAllServices();
    LoggerFacade.info('SystemBootstrap', 'System auto-initialization completed');
  }
}
```

---

# 7. DEPLOYMENT INSTRUCTIONS

## 7.1 Pre-Deployment Checklist

- [ ] All 3 files ready:
  - `DayPlanner.html` (NEW)
  - `AppSheetBridge.gs` (MODIFIED)
  - `SystemBootstrap.gs` (MODIFIED)

## 7.2 Step-by-Step Deployment

### Step 1: Create HTML File
```bash
# Navigate to project directory
cd /Users/molhamhomsi/Downloads/Time\ OS/moh-time-os-v2

# Create the HTML file (already created if you copied from brief)
# File location: /moh-time-os-v2/src/5_web/DayPlanner.html
```

### Step 2: Add Backend Functions

1. Open `/moh-time-os-v2/src/5_web/AppSheetBridge.gs`
2. Scroll to end of file (after `appsheet_resolveConflict` function)
3. Copy-paste all 12 new functions from Section 5.2 above
4. Save file

### Step 3: Modify AppSheetBridge.doGet()

1. Still in `AppSheetBridge.gs`
2. Find `doGet(e)` method (around line ~70)
3. Replace with code from Section 6.1
4. Save file

### Step 4: Modify SystemBootstrap.doGet()

1. Open `/moh-time-os-v2/src/8_setup/SystemBootstrap.gs`
2. Find `doGet(e)` function (around line ~565)
3. Replace with code from Section 6.2
4. Add `ensureSystemInitialized()` helper if not present
5. Save file

### Step 5: Configure Auth Token

1. Generate secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Copy the 64-character output

3. Open Apps Script project in browser:
   - File → Project Properties → Script Properties
   - Click "+ Add row"
   - Property: `WEB_APP_TOKEN`
   - Value: [paste your token]
   - Click "Save"

### Step 6: Deploy to Apps Script

```bash
# Push all changes
clasp push

# Verify files pushed
# Expected output: "Pushed 68 files" (67 existing + 1 new HTML)
```

### Step 7: Deploy Web App

1. In Apps Script editor, click **Deploy → New deployment**
2. Configuration:
   - Type: Web app
   - Description: "MOH TIME OS Web Interface"
   - Execute as: Me
   - Who has access: Anyone
3. Click **Deploy**
4. Copy the **Web app URL**

### Step 8: Test Access

1. Construct your URL:
```
[WEB_APP_URL]?endpoint=planner&auth=[YOUR_TOKEN]
```

Example:
```
https://script.google.com/macros/s/ABC123.../exec?endpoint=planner&auth=abc123def456...
```

2. Open URL in mobile browser
3. Should see "MOH TIME OS" dashboard

---

# 8. TESTING PROTOCOL

## 8.1 Smoke Tests (5 minutes)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **1. Page Load** | Visit URL with auth token | Dashboard loads, no 401/500 errors |
| **2. Navigation** | Tap all 3 bottom tabs | All views load without errors |
| **3. Data Load** | Check Dashboard | Stats show numbers, tasks appear |
| **4. Task Action** | Tap "Start" on a task | Button shows loading, then updates |
| **5. Modal** | Tap FAB on Tasks view | Create task modal opens |

## 8.2 Feature Tests (15 minutes)

### Dashboard View
- [ ] Today's tasks load
- [ ] Stats show correct counts
- [ ] High priority tasks appear
- [ ] Polling updates data every 30s

### Task List View
- [ ] All tasks load
- [ ] Search works (type in search box)
- [ ] Filters work (tap filter chips)
- [ ] FAB opens create modal
- [ ] Create task works (fill form, submit)

### Calendar View
- [ ] Calendar renders
- [ ] Events appear
- [ ] Can drag event to new time
- [ ] Tap event shows info

### Task Actions
- [ ] Start task: Status changes to IN_PROGRESS
- [ ] Complete task: Modal appears, submit works
- [ ] Snooze task: Modal appears, options work
- [ ] Cancel task: Confirmation, then status changes
- [ ] Archive task: Task disappears from list

## 8.3 Error Tests (5 minutes)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **1. Wrong Token** | Change auth token in URL | 401 Unauthorized |
| **2. No Token** | Remove ?auth= from URL | 401 Unauthorized |
| **3. Network Fail** | Turn off wifi, tap button | Error toast appears |
| **4. Invalid Input** | Create task with no title | Validation error |

## 8.4 Mobile Tests (10 minutes)

- [ ] Portrait orientation works
- [ ] Landscape orientation works
- [ ] Touch targets large enough
- [ ] Scrolling smooth
- [ ] Bottom nav doesn't cover content
- [ ] Modals don't break on small screens
- [ ] Long task titles don't overflow

## 8.5 Performance Tests (5 minutes)

- [ ] Initial page load < 3 seconds
- [ ] Tab switches instant
- [ ] Task actions respond < 1 second
- [ ] Polling doesn't cause lag
- [ ] No JavaScript errors in console

---

# 9. TROUBLESHOOTING

## 9.1 Common Issues

### Issue: 401 Unauthorized
**Cause:** Auth token mismatch
**Fix:**
1. Check Script Properties has `WEB_APP_TOKEN`
2. Verify token in URL matches exactly
3. No spaces or extra characters

### Issue: 500 Internal Server Error
**Cause:** Service not registered or code error
**Fix:**
1. Check Apps Script logs: View → Logs
2. Look for error message
3. Verify `ensureSystemInitialized()` added to SystemBootstrap.doGet()
4. Run `completeSetup()` manually in script editor

### Issue: Blank Page
**Cause:** HTML file not deployed
**Fix:**
1. Verify `DayPlanner.html` exists in `src/5_web/`
2. Run `clasp push` again
3. Check file count (should be 68)
4. Redeploy web app

### Issue: "Function not found" Error
**Cause:** Backend function not deployed
**Fix:**
1. Verify all 12 functions added to AppSheetBridge.gs
2. Run `clasp push`
3. Wait 10 seconds for deployment
4. Try again

### Issue: Data Not Loading
**Cause:** Spreadsheet access or data format issue
**Fix:**
1. Check Apps Script logs for errors
2. Verify ACTIONS sheet exists and has data
3. Verify column names match exactly (especially `estimated_minutes`)
4. Check BatchOperations service is registered

### Issue: Polling Stops
**Cause:** Tab became hidden or error in polling
**Fix:**
1. Check browser console for JavaScript errors
2. Bring tab to foreground
3. Switch to different view and back
4. Refresh page

### Issue: Calendar Won't Load
**Cause:** Event Calendar library CDN blocked or date format issue
**Fix:**
1. Check browser console for CDN errors
2. Verify internet connection
3. Check Apps Script logs for date parsing errors
4. Verify `scheduled_start` and `scheduled_end` are valid ISO dates

### Issue: Modal Won't Close
**Cause:** JavaScript error in modal handler
**Fix:**
1. Check browser console for errors
2. Refresh page
3. Try clicking overlay (outside modal)
4. Check if modal-related JavaScript code intact

## 9.2 Debug Mode

To enable debug logging:

```javascript
// Add to top of DayPlanner.html <script> section
const DEBUG = true;

// Add this helper
function debugLog(message, data) {
  if (DEBUG) {
    console.log('[TimeOS]', message, data || '');
  }
}

// Use throughout code
debugLog('Loading tasks...', { view: 'today' });
```

## 9.3 Rollback Plan

If deployment fails catastrophically:

```bash
# Revert to last working commit
cd /Users/molhamhomsi/Downloads/Time\ OS/moh-time-os-v2
git log --oneline -5  # Find last good commit
git checkout [COMMIT_HASH] src/5_web/AppSheetBridge.gs
git checkout [COMMIT_HASH] src/8_setup/SystemBootstrap.gs
rm src/5_web/DayPlanner.html
clasp push
```

---

# 10. NEXT STEPS AFTER DEPLOYMENT

## 10.1 Immediate (Day 1)
- [ ] Bookmark the web app URL on phone
- [ ] Add to home screen (iOS: Share → Add to Home Screen)
- [ ] Test all core actions with real tasks
- [ ] Monitor Apps Script logs for errors

## 10.2 Short Term (Week 1)
- [ ] Gather usage feedback
- [ ] Identify most-used features
- [ ] Note any UI/UX pain points
- [ ] Check performance on real data volume

## 10.3 Future Enhancements
- Triage Queue view (swipe cards for email proposals)
- Energy Log view (form + chart)
- Settings view
- Push notifications (if possible with Service Workers)
- Offline mode enhancements
- Dark mode
- Multiple user support (Google OAuth)

