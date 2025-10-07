/**
 * MOH TIME OS v2.0 - APPSHEET BRIDGE
 *
 * Handles GET requests for AppSheet integration and external API access.
 * Provides configuration and status endpoints for external systems.
 * Returns structured JSON responses with proper error handling.
 *
 * Original lines: 7943-7994 from scriptA.js
 */

const CACHE_KEYS = Object.freeze({
  FoundationBlocks: 'foundation_blocks',
  DashboardStats: 'dashboard_stats'
});


const CACHE_ALL_TASKS_KEY = 'all_tasks_payload';
const CACHE_ALL_TASKS_TTL_SECONDS = 300;

function getCachedAllTasksPayload() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CACHE_ALL_TASKS_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch (error) {
    cache.remove(CACHE_ALL_TASKS_KEY);
    return null;
  }
}

function storeCachedAllTasksPayload(payload) {
  const cache = CacheService.getScriptCache();
  try {
    cache.put(
      CACHE_ALL_TASKS_KEY,
      JSON.stringify(payload),
      CACHE_ALL_TASKS_TTL_SECONDS
    );
  } catch (error) {
    Logger.log('[ClientAPI] cache put failed: ' + error.message);
  }
}

class AppSheetBridge {
  constructor(configManager, systemManager) {
    this.configManager = configManager;
    this.systemManager = systemManager;
  }

  doGet(e) {
    try {
      Logger.log(`[WebApp] request from ${Session.getEffectiveUser().getEmail() || 'unknown'} params=${JSON.stringify(e.parameter)}`);
      const endpoint = e.parameter.endpoint || SHEET_NAMES.STATUS;

      switch (endpoint) {
      case 'config':
        return this._handleConfigRequest();
      case 'status':
        return this._handleStatusRequest();
      default:
        return this._createResponse({ error: 'Unknown endpoint' }, 400);
      }
    } catch (error) {
      // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
      // TEST: TEST_SILENT_065_DOGET
      LoggerFacade.error('AppSheetBridge', 'doGet failed', {
        error: error.message,
        stack: error.stack,
        context: 'doGet'
      });

      if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
        throw error;
      }

      return null;
    }
  }

  _handleConfigRequest() {
    const config = {
      circuit_breaker_threshold: this.configManager.getNumber('CIRCUIT_BREAKER_THRESHOLD', 5),
      scheduler_interval_minutes: this.configManager.getNumber('SCHEDULER_INTERVAL_MINUTES', 15),
      email_batch_size: this.configManager.getNumber('EMAIL_INGESTION_BATCH_SIZE', 50),
      work_hours: this.configManager.getJSON('WORK_HOURS', { start: '10:00', end: '18:00' }),
      score_weights: this.configManager.getJSON('SCORE_WEIGHTS', { deadline: 0.5, priority: 0.3, context: 0.2 })
    };

    return this._createResponse(config, 200);
  }

  _handleStatusRequest() {
    const status = this.systemManager.getSystemStatus();
    return this._createResponse(status, 200);
  }

  _createResponse(data, statusCode = 200) {
    const response = {
      status: statusCode,
      data: data,
      timestamp: TimeZoneAwareDate.toISOString(new Date())
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function appsheet_getSettings() {
  ensureBootstrapServices();
  try {
    
    // Get ConfigManager to read from CONFIG sheet
    const configManager = container.get('ConfigManager');
    if (!configManager) {
      Logger.log('[ClientAPI] ConfigManager not available, attempting direct sheet read');
      
      // Fallback: Try to read directly from APPSHEET_CONFIG sheet
      try {
        const spreadsheet = getActiveSystemSpreadsheet();
        const configSheet = spreadsheet.getSheetByName('APPSHEET_CONFIG');
        if (configSheet) {
          const data = configSheet.getDataRange().getValues();
          const result = {};
          
          // Parse APPSHEET_CONFIG sheet (skip header row)
          for (let i = 1; i < data.length; i++) {
            const key = data[i][4]; // Column E is the key
            const value = data[i][5]; // Column F is the value
            if (key) {
              result[key] = value;
            }
          }
          
          // Return config data if we got any
          if (Object.keys(result).length > 0) {
            return { success: true, data: result };
          }
        }
      } catch (e) {
        Logger.log('[ClientAPI] Direct sheet read failed: ' + e.toString());
      }
      
      // Last resort: return minimal defaults
      return {
        SCAN_MODE: 'LABEL_ONLY', // Default as defined in SystemBootstrap
        EMAIL_LABEL: 'MOH-Time-OS',
        DEFAULT_DURATION_MINUTES: 30,
        CALENDAR_ID: 'primary'
      };
    }
    
    // Get all config values from ConfigManager
    const result = {};
    
    // Read all important config keys
    const configKeys = [
      'SCAN_MODE',
      'EMAIL_LABEL', 
      'DEFAULT_DURATION_MINUTES',
      'CALENDAR_ID',
      'MAX_DAILY_EVENTS',
      'WORK_START_HOUR',
      'WORK_END_HOUR',
      'TIMEZONE',
      'AUTO_CREATE_EVENTS'
    ];
    
    for (const key of configKeys) {
      const value = configManager.getString(key);
      if (value !== null && value !== undefined) {
        result[key] = value;
      }
    }
    
    // If we have config data, return it
    if (Object.keys(result).length > 0) {
      return { success: true, data: result };
    }
    
    // Use PersistentStore as fallback
    const store = container.get('PersistentStore');
    if (store && store.getAll) {
      const storeResult = store.getAll();
      if (storeResult && Object.keys(storeResult).length > 0) {
        return { success: true, data: storeResult };
      }
    }
    
    Logger.log('[ClientAPI] No config data found, returning minimal defaults');
    return { success: true, data: {
      SCAN_MODE: 'LABEL_ONLY', // CONSISTENCY FIX: Match SystemBootstrap default
      EMAIL_LABEL: 'MOH-Time-OS',
      DEFAULT_DURATION_MINUTES: 30,
      CALENDAR_ID: 'primary'
    } };
    
  } catch (error) {
    Logger.log('[ClientAPI] Error in getAll: ' + error.toString());
    // Return minimal defaults on error
    return { success: false, error: error.toString(), stack: error.stack, data: {
      SCAN_MODE: 'ZERO_TRUST_TRIAGE',
      EMAIL_LABEL: 'MOH-Time-OS',
      DEFAULT_DURATION_MINUTES: 30,
      CALENDAR_ID: 'primary'
    } };
  }
}

function appsheet_getConstants() {
  ensureBootstrapServices();
  try {
    // Return system constants that are defined in AB_Constants.gs
        return { success: true, data: {
          VERSION: CONSTANTS.VERSION,
          TIMEZONE: CONSTANTS.TIMEZONE,
          CACHE_DURATION: CONSTANTS.CACHE_DURATION,
          MAX_RETRIES: CONSTANTS.MAX_RETRIES,
          CIRCUIT_BREAKER_THRESHOLD: CONSTANTS.CIRCUIT_BREAKER_THRESHOLD,
          DEFAULT_BATCH_SIZE: CONSTANTS.DEFAULT_BATCH_SIZE,
          MAX_SCORE: CONSTANTS.MAX_SCORE,
          MIN_SCORE: CONSTANTS.MIN_SCORE,
          DEFAULT_ESTIMATED_MINUTES: CONSTANTS.DEFAULT_ESTIMATED_MINUTES,
    
          // Include SERVICES for UI reference
          SERVICES: SERVICES,
    
          // Include PRIORITY enums
          PRIORITY: PRIORITY,
    
          // Include sheet names
          SHEET_NAMES: SHEET_NAMES,
    
          // Include error types
          ERROR_TYPES: ERROR_TYPES
        } };  } catch (error) {
    Logger.log('[ClientAPI] Error in getConstants: ' + error.toString());
    // Return minimal constants on error
    return { success: false, error: error.toString(), stack: error.stack, data: {
      VERSION: 'MOH_TIME_OS_v2.0',
      TIMEZONE: 'Asia/Dubai',
      CACHE_DURATION: 300000,
      MAX_RETRIES: 3
    } };
  }
}

function appsheet_getDailySchedule() {
  ensureBootstrapServices();
  try {
    
    // Check if services exist before using them
    if (!container.has('BatchOperations')) {
      Logger.log('[ClientAPI] BatchOperations not available');
      return [];
    }
    
    const batchOps = container.get('BatchOperations');
    if (!batchOps || !batchOps.getAllActions) {
      Logger.log('[ClientAPI] BatchOperations missing getAllActions method');
      return [];
    }
    
    // Get today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    // Get all tasks from ACTIONS sheet
    const allTasks = batchOps.getAllActions();
    
    // Filter for today's scheduled tasks
    const todayTasks = allTasks.filter(task => {
      if (!task.scheduled_start) return false;
      const scheduledDate = new Date(task.scheduled_start);
      return scheduledDate >= todayStart && scheduledDate <= todayEnd;
    });
    
    // Sort by scheduled time
    todayTasks.sort((a, b) => {
      const dateA = new Date(a.scheduled_start);
      const dateB = new Date(b.scheduled_start);
      return dateA - dateB;
    });
    
    const plainTasks = todayTasks.map(task => task.toDetailedJSON());
    return { success: true, data: plainTasks };
  } catch (error) {
    return { success: false, error: error.toString(), stack: error.stack };
  }
}

function appsheet_getAllTasks() {
  ensureBootstrapServices();
  const start = Date.now();
  try {
    const cached = getCachedAllTasksPayload();
    if (cached) {
      Logger.log(`[ClientAPI] getAllTasks served from cache in ${Date.now() - start}ms`);
      return cached;
    }

    if (!container.has('BatchOperations')) {
      Logger.log('[ClientAPI] BatchOperations not available');
      return { success: false, error: 'BatchOperations service unavailable' };
    }

    const batchOps = container.get('BatchOperations');
    if (!batchOps || typeof batchOps.getAllActions !== 'function') {
      Logger.log('[ClientAPI] BatchOperations missing getAllActions method');
      return { success: false, error: 'BatchOperations service misconfigured' };
    }

    const allTasks = batchOps.getAllActions();
    const plainTasks = allTasks.map(task => task.toDetailedJSON());

    Logger.log(`[ClientAPI] getAllTasks: Retrieved ${plainTasks.length} tasks from BatchOperations.`);

    const payload = {
      success: true,
      data: {
        tasks: plainTasks,
        count: plainTasks.length
      }
    };

    const payloadBytes = Utilities.newBlob(JSON.stringify(payload), 'application/json').getBytes().length;
    Logger.log(`[ClientAPI] getAllTasks returning ${payloadBytes} bytes`);

    storeCachedAllTasksPayload(payload);

    Logger.log(`[ClientAPI] getAllTasks fresh fetch in ${Date.now() - start}ms`);
    return payload;
  } catch (error) {
    return { success: false, error: error.toString(), stack: error.stack };
  }
}

/**
 * ========================================================================
 * APPSHEET WRAPPER FUNCTIONS
 * Global functions callable via Apps Script API from AppSheet
 * ========================================================================
 */

/**
 * Wrapper 1: Run scheduling cycle
 * Triggers intelligent scheduling with optional task filtering
 *
 * @param {Object} params - Scheduling parameters
 * @param {string} params.taskId - Optional specific task ID to schedule
 * @param {string} params.priority - Optional priority filter
 * @param {boolean} params.dryRun - Test mode without writing (default: false)
 * @param {string} params.mode - "immediate" | "batch" | "weekly_optimization"
 * @param {string} params.startDate - For weekly optimization (ISO date)
 * @param {string} params.endDate - For weekly optimization (ISO date)
 * @param {boolean} params.optimize - Extra optimization pass (default: false)
 * @returns {Object} Result with scheduled count, conflicts, etc.
 */
function appsheet_runScheduling(params) {
  ensureBootstrapServices();
  try {
    // ensureSystemInitialized();

    params = params || {};
    const scheduler = getService(SERVICES.IntelligentScheduler);

    const result = scheduler.runSchedulingCycle({
      dryRun: params.dryRun || false,
      taskId: params.taskId,
      priority: params.priority
    });

    return {
      success: true,
      scheduled: result.scheduled || 0,
      conflicts: result.conflicts || 0,
      rescheduled: result.rescheduled || 0,
      skipped: result.skipped || [],
      timestamp: TimeZoneAwareDate.toISOString(new Date())
    };

  } catch (error) {
    // RETHROW_WITH_LOG profile
    // TEST: TEST_SILENT_066_APPSHEET_RUNSCHEDULING
    LoggerFacade.error('AppSheetBridge', 'appsheet_runScheduling failed', {
      error: error.message,
      stack: error.stack,
      context: 'appsheet_runScheduling'
    });

    throw error;
  }
}

/**
 * Finds available time slots in the near future for a given task.
 * @param {Object} params - Parameters.
 * @param {string} params.taskId - The ID of the task that needs rescheduling.
 * @returns {Object} A response object with a list of available time slots.
 */
function appsheet_findAvailableSlots(params) {
  try {
    ensureSystemInitialized();
    if (!params || !params.taskId) {
      throw new ValidationError('taskId is required to find available slots.');
    }

    const scheduler = getService(SERVICES.IntelligentScheduler);
    const batchOps = getService(SERVICES.BatchOperations);
    
    // Find the task to get its duration
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const taskRows = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, { 'action_id': params.taskId });

    if (taskRows.length === 0) {
      throw new Error('Task not found: ' + params.taskId);
    }
    
    const task = MohTask.fromSheetRow(taskRows[0], headers);
    if (!task) {
      throw new Error('Failed to instantiate task object for: ' + params.taskId);
    }

    // Get all scheduled tasks and calendar events to determine busy times
    const allTasks = batchOps.getAllActions();
    const scheduledTasks = allTasks.filter(a => a.status === STATUS.SCHEDULED && a.action_id !== params.taskId);
    const calendarProjection = batchOps.getRowsByFilter(SHEET_NAMES.CALENDAR_PROJECTION, {});
    const calendarHeaders = batchOps.getHeaders(SHEET_NAMES.CALENDAR_PROJECTION);

    const busyTimes = [];
    scheduledTasks.forEach(t => busyTimes.push({ start: new Date(t.scheduled_start), end: new Date(t.scheduled_end) }));
    calendarProjection.forEach(row => {
      const startIdx = calendarHeaders.indexOf('start');
      const endIdx = calendarHeaders.indexOf('end');
      if (startIdx > -1 && endIdx > -1) {
        busyTimes.push({ start: new Date(row[startIdx]), end: new Date(row[endIdx]) });
      }
    });

    // Find available slots over the next 3 days
    const availableSlots = [];
    let searchStart = new Date();
    const searchEnd = new Date(searchStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    while (searchStart < searchEnd && availableSlots.length < 5) {
      const slotEnd = new Date(searchStart.getTime() + task.estimated_minutes * 60000);

      // Check for conflicts
      const hasConflict = busyTimes.some(busy => (searchStart < busy.end && slotEnd > busy.start));
      
      // Check if within typical work hours (e.g., 9 AM to 6 PM)
      const isWorkHour = searchStart.getHours() >= 9 && searchStart.getHours() < 18;

      if (!hasConflict && isWorkHour) {
        availableSlots.push({
          iso: searchStart.toISOString(),
          duration: task.estimated_minutes
        });
      }
      
      // Move to the next 15-minute interval
      searchStart.setTime(searchStart.getTime() + 15 * 60 * 1000); 
    }

    return { success: true, data: availableSlots };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_findAvailableSlots failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: `Server error finding slots: ${error.message}`, stack: error.stack };
  }
}

function appsheet_getCalendarEvents(params) {
  ensureBootstrapServices();
  try {
    const batchOps = getService(SERVICES.BatchOperations);
    const startDate = params && params.startDate ? new Date(params.startDate) : new Date();
    const endDate = params && params.endDate ? new Date(params.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const allTasks = batchOps.getAllActions();

    const events = allTasks.filter(task => {
      if (!task.scheduled_start) return false;
      const start = new Date(task.scheduled_start);
      return start >= startDate && start <= endDate;
    }).map(task => task.toDetailedJSON());

    return { success: true, data: { events } };
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getCalendarEvents failed', {
      error: error.message,
      stack: error.stack,
      params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

function appsheet_getProposals(params) {
  ensureBootstrapServices();
  try {
    
    params = params || {};
    const filterStatus = params.status || 'PENDING';
    const limit = Math.min(params.limit || 500, 500);    
    const spreadsheet = getActiveSystemSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAMES.PROPOSED_TASKS);
    
    if (!sheet) {
      throw new Error('PROPOSED_TASKS sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    const proposals = [];
    
    // Skip header row
    for (let i = 1; i < data.length && proposals.length < limit; i++) {
      const row = data[i];
      const status = row[1];  // status column
      
      if (!filterStatus || status === filterStatus) {
        proposals.push({
          proposal_id: row[0],
          sender_email: row[6],
          subject: row[7],
          body: row[11], // Using raw_content_preview as body
          extracted_title: row[8],
          suggested_lane: row[9],
          confidence_score: row[10],
          status: row[1],
          processed_at: row[3],
          // suggested_priority and suggested_duration are not in the new schema
          // created_task_id is not in the new schema
          created_at: row[2], // New field
          source: row[4], // New field
          source_id: row[5], // New field
          raw_content_preview: row[11] // New field
        });
      }
    }
    
    const logger = getService(SERVICES.SmartLogger);
    logger.log('AppSheetBridge', 'Retrieved ' + proposals.length + ' proposals with status ' + filterStatus);
    
    return {
      success: true,
      data: proposals
    };
    
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'Function error', {
      function: 'appsheet_getProposals',
      error: error.toString(),
      params: params
    });
    
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

/**
 * Get the count of pending email proposals.
 * @returns {Object} An object with success status and the count.
 */
function appsheet_getPendingProposalsCount() {
  ensureBootstrapServices();
  try {
    const batchOps = getService(SERVICES.BatchOperations);
    const pendingProposals = batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, { status: PROPOSAL_STATUS.PENDING });
    return { success: true, count: pendingProposals.length };
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getPendingProposalsCount failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message, count: 0, stack: error.stack };
  }
}

/**
 * Retrieves data for the 'My Day' dashboard view.
 * @param {Object} params - Parameters for the dashboard view (e.g., view: 'today').
 * @returns {Object} A response object with dashboard data.
 */
function appsheet_getMyDay(params) {
  ensureBootstrapServices();
  try {
    const systemManager = getService(SERVICES.SystemManager);
    const intelligentScheduler = getService(SERVICES.IntelligentScheduler);
    const humanStateManager = getService(SERVICES.HumanStateManager);
    const batchOps = getService(SERVICES.BatchOperations);

    const dashboardData = {};

    // Get current human state
    dashboardData.currentEnergy = humanStateManager.getCurrentHumanState();

    // Get today's schedule
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const allTasks = batchOps.getAllActions();
    dashboardData.todaySchedule = allTasks.filter(task => {
      if (!task.scheduled_start) return false;
      const scheduledDate = new Date(task.scheduled_start);
      return scheduledDate >= todayStart && scheduledDate <= todayEnd;
    }).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
    .map(task => task.toDetailedJSON());

    // Get high priority tasks (e.g., PENDING or SCHEDULED with HIGH/URGENT/CRITICAL priority)
    dashboardData.highPriorityTasks = allTasks.filter(task =>
      (task.status === STATUS.PENDING || task.status === STATUS.SCHEDULED) &&
      (task.priority === PRIORITY.HIGH || task.priority === PRIORITY.URGENT || task.priority === PRIORITY.CRITICAL)
    ).sort((a, b) => getPriorityScore(a.priority) - getPriorityScore(b.priority))
    .map(task => task.toDetailedJSON());

    // Get completion probability (mock for now)
    dashboardData.completionProbability = 75; // Placeholder

    return { success: true, data: dashboardData };
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getMyDay failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: `Server error getting dashboard data: ${error.message}`, stack: error.stack };
  }
}

/**
 * Retrieves the current system status.
 * @returns {Object} An object with success status and system status data.
 */
function appsheet_getSystemStatus() {
  ensureBootstrapServices();
  try {
    const systemManager = getService(SERVICES.SystemManager);
    const status = systemManager.getSystemStatus();
    return { success: true, data: status };
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getSystemStatus failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

function bootstrapClient() {
  const result = {
    success: true,
    data: {
      settings: null,
      tasks: null,
      constants: null,
      dashboard: null,
      triage: null,
      schedulerStatus: null,
      generatedAt: {
        settings: null,
        tasks: null,
        constants: null,
        dashboard: null,
        triage: null,
        schedulerStatus: null
      }
    }
  };

  try {
    const settings = appsheet_getSettings();
    if (settings && settings.success) {
      result.data.settings = settings.data;
      result.data.generatedAt.settings = new Date().toISOString();
    }

    const tasks = appsheet_getAllTasks();
    if (tasks && tasks.success) {
      result.data.tasks = tasks.data.tasks || [];
      result.data.generatedAt.tasks = new Date().toISOString();
    }

    const constants = appsheet_getConstants();
    if (constants && constants.success) {
      result.data.constants = constants.data;
      result.data.generatedAt.constants = new Date().toISOString();
    }

    const dashboard = appsheet_getMyDay({ view: 'today' });
    if (dashboard && dashboard.success) {
      result.data.dashboard = dashboard.data;
      result.data.generatedAt.dashboard = new Date().toISOString();
    }

    const triageCount = appsheet_getPendingProposalsCount();
    const triagePayload = {
      count: triageCount && triageCount.success ? triageCount.count : 0,
      proposals: []
    };
    const triageList = appsheet_getProposals({ status: 'PENDING', limit: 500 });
    if (triageList && triageList.success && Array.isArray(triageList.data)) {
      triagePayload.proposals = triageList.data;
    }
    result.data.triage = triagePayload;
    result.data.generatedAt.triage = new Date().toISOString();

    const scheduler = appsheet_getSystemStatus();
    if (scheduler && scheduler.success) {
      result.data.schedulerStatus = scheduler.data;
      result.data.generatedAt.schedulerStatus = new Date().toISOString();
    }

  } catch (error) {
    return { success: false, error: error.message, stack: error.stack };
  }

  return result;
}

/**
 * ========================================================================
 * APPSHEET MUTATION ENDPOINTS - OPTIMISTIC LOCKING
 * All mutation endpoints use BatchOperations.updateActionWithOptimisticLocking()
 * Returns {success, versionConflict?, error?} for proper conflict detection
 * ========================================================================
 */

/**
 * Start a task - change status to IN_PROGRESS
 * @param {Object} params - Parameters
 * @param {string} params.taskId - Task ID to start
 * @return {Object} Result with success/conflict status
 */
function appsheet_startTask(params) {
  ensureBootstrapServices();
  try {
    if (!params || !params.taskId) {
      return { success: false, error: 'taskId is required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: params.taskId });

    if (rows.length === 0) {
      return { success: false, error: 'Task not found: ' + params.taskId };
    }

    const { row } = rows[0];
    const task = MohTask.fromSheetRow(row, headers);

    if (!task) {
      return { success: false, error: 'Failed to instantiate task' };
    }

    task.status = STATUS.IN_PROGRESS;

    const result = batchOps.updateActionWithOptimisticLocking(
      SHEET_NAMES.ACTIONS,
      params.taskId,
      task
    );

    if (!result.success) {
      return {
        success: false,
        versionConflict: result.versionConflict || false,
        error: result.error || 'Update failed'
      };
    }

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Started task ' + params.taskId);

    return { success: true, data: { action_id: params.taskId, status: STATUS.IN_PROGRESS } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_startTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Complete a task - change status to COMPLETED with metrics
 * @param {Object} params - Parameters
 * @param {string} params.taskId - Task ID to complete
 * @param {number} params.actualMinutes - Actual minutes taken (optional)
 * @param {string} params.notes - Completion notes (optional)
 * @return {Object} Result with success/conflict status
 */
function appsheet_completeTask(params) {
  ensureBootstrapServices();
  try {
    if (!params || !params.taskId) {
      return { success: false, error: 'taskId is required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: params.taskId });

    if (rows.length === 0) {
      return { success: false, error: 'Task not found: ' + params.taskId };
    }

    const { row } = rows[0];
    const task = MohTask.fromSheetRow(row, headers);

    if (!task) {
      return { success: false, error: 'Failed to instantiate task' };
    }

    task.status = STATUS.COMPLETED;
    task.completed_date = TimeZoneAwareDate.now();
    task.actual_minutes = params.actualMinutes || task.estimated_minutes || 30;
    task.estimation_accuracy = task.estimated_minutes > 0 ? (task.actual_minutes / task.estimated_minutes) : 1;

    if (params.notes) {
      task.completion_notes = params.notes;
    }

    const result = batchOps.updateActionWithOptimisticLocking(
      SHEET_NAMES.ACTIONS,
      params.taskId,
      task
    );

    if (!result.success) {
      return {
        success: false,
        versionConflict: result.versionConflict || false,
        error: result.error || 'Update failed'
      };
    }

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Completed task ' + params.taskId + ' in ' + task.actual_minutes + ' minutes');

    return { success: true, data: { action_id: params.taskId, status: STATUS.COMPLETED } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_completeTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Snooze a task - defer to later time
 * @param {Object} params - Parameters
 * @param {string} params.taskId - Task ID to snooze
 * @param {number} params.minutes - Minutes to snooze (default: 60)
 * @return {Object} Result with success/conflict status
 */
function appsheet_snoozeTask(params) {
  ensureBootstrapServices();
  try {
    if (!params || !params.taskId) {
      return { success: false, error: 'taskId is required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: params.taskId });

    if (rows.length === 0) {
      return { success: false, error: 'Task not found: ' + params.taskId };
    }

    const { row } = rows[0];
    const task = MohTask.fromSheetRow(row, headers);

    if (!task) {
      return { success: false, error: 'Failed to instantiate task' };
    }

    const snoozeMinutes = params.minutes || 60;
    const newStart = new Date(Date.now() + snoozeMinutes * 60000);

    task.status = STATUS.DEFERRED;
    task.scheduled_start = TimeZoneAwareDate.toISOString(newStart);
    task.rollover_count = (task.rollover_count || 0) + 1;

    const result = batchOps.updateActionWithOptimisticLocking(
      SHEET_NAMES.ACTIONS,
      params.taskId,
      task
    );

    if (!result.success) {
      return {
        success: false,
        versionConflict: result.versionConflict || false,
        error: result.error || 'Update failed'
      };
    }

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Snoozed task ' + params.taskId + ' for ' + snoozeMinutes + ' minutes');

    return { success: true, data: { action_id: params.taskId, snoozed_until: task.scheduled_start } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_snoozeTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Cancel a task - change status to CANCELED
 * @param {Object} params - Parameters
 * @param {string} params.taskId - Task ID to cancel
 * @param {string} params.reason - Cancellation reason (optional)
 * @return {Object} Result with success/conflict status
 */
function appsheet_cancelTask(params) {
  ensureBootstrapServices();
  try {
    if (!params || !params.taskId) {
      return { success: false, error: 'taskId is required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: params.taskId });

    if (rows.length === 0) {
      return { success: false, error: 'Task not found: ' + params.taskId };
    }

    const { row } = rows[0];
    const task = MohTask.fromSheetRow(row, headers);

    if (!task) {
      return { success: false, error: 'Failed to instantiate task' };
    }

    task.status = STATUS.CANCELED;

    if (params.reason) {
      task.completion_notes = 'CANCELED: ' + params.reason;
    }

    const result = batchOps.updateActionWithOptimisticLocking(
      SHEET_NAMES.ACTIONS,
      params.taskId,
      task
    );

    if (!result.success) {
      return {
        success: false,
        versionConflict: result.versionConflict || false,
        error: result.error || 'Update failed'
      };
    }

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Canceled task ' + params.taskId);

    return { success: true, data: { action_id: params.taskId, status: STATUS.CANCELED } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_cancelTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Reschedule a task - update scheduled times
 * @param {Object} params - Parameters
 * @param {string} params.taskId - Task ID to reschedule
 * @param {string} params.newStart - New start time (ISO string)
 * @param {string} params.newEnd - New end time (ISO string, optional)
 * @return {Object} Result with success/conflict status
 */
function appsheet_rescheduleTask(params) {
  ensureBootstrapServices();
  try {
    if (!params || !params.taskId || !params.newStart) {
      return { success: false, error: 'taskId and newStart are required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: params.taskId });

    if (rows.length === 0) {
      return { success: false, error: 'Task not found: ' + params.taskId };
    }

    const { row } = rows[0];
    const task = MohTask.fromSheetRow(row, headers);

    if (!task) {
      return { success: false, error: 'Failed to instantiate task' };
    }

    task.scheduled_start = params.newStart;

    if (params.newEnd) {
      task.scheduled_end = params.newEnd;
    } else {
      const startTime = new Date(params.newStart);
      const duration = task.estimated_minutes || 30;
      task.scheduled_end = TimeZoneAwareDate.toISOString(new Date(startTime.getTime() + duration * 60000));
    }

    const result = batchOps.updateActionWithOptimisticLocking(
      SHEET_NAMES.ACTIONS,
      params.taskId,
      task
    );

    if (!result.success) {
      return {
        success: false,
        versionConflict: result.versionConflict || false,
        error: result.error || 'Update failed'
      };
    }

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Rescheduled task ' + params.taskId + ' to ' + params.newStart);

    return { success: true, data: { action_id: params.taskId, scheduled_start: task.scheduled_start } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_rescheduleTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Update a task - generic field updates
 * @param {Object} params - Parameters with taskId and updates object
 * @return {Object} Result with success/conflict status
 */
function appsheet_updateTask(params) {
  ensureBootstrapServices();
  try {
    if (!params || !params.taskId) {
      return { success: false, error: 'taskId is required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: params.taskId });

    if (rows.length === 0) {
      return { success: false, error: 'Task not found: ' + params.taskId };
    }

    const { row } = rows[0];
    const task = MohTask.fromSheetRow(row, headers);

    if (!task) {
      return { success: false, error: 'Failed to instantiate task' };
    }

    // Apply updates from params.updates object or direct params
    const updates = params.updates || params;
    const allowedFields = ['title', 'description', 'priority', 'lane', 'status', 'estimated_minutes',
                          'energy_required', 'focus_required', 'deadline', 'scheduled_start', 'scheduled_end'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined && updates[field] !== null) {
        task[field] = updates[field];
      }
    }

    const result = batchOps.updateActionWithOptimisticLocking(
      SHEET_NAMES.ACTIONS,
      params.taskId,
      task
    );

    if (!result.success) {
      return {
        success: false,
        versionConflict: result.versionConflict || false,
        error: result.error || 'Update failed'
      };
    }

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Updated task ' + params.taskId);

    return { success: true, data: { action_id: params.taskId } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_updateTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @return {Object} Result with new task ID or conflict status
 */
function appsheet_createTask(taskData) {
  ensureBootstrapServices();
  try {
    if (!taskData || !taskData.title) {
      return { success: false, error: 'title is required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);

    const newTask = new MohTask({
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || PRIORITY.MEDIUM,
      lane: taskData.lane || LANE.OPERATIONAL,
      status: taskData.status || STATUS.PENDING,
      estimated_minutes: taskData.estimated_minutes || 30,
      energy_required: taskData.energy_required || 'MEDIUM',
      focus_required: taskData.focus_required || 'MEDIUM',
      deadline: taskData.deadline || null,
      scheduled_start: taskData.scheduled_start || null,
      scheduled_end: taskData.scheduled_end || null,
      source: taskData.source || 'appsheet',
      created_by: taskData.created_by || 'appsheet_api'
    });

    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rowData = newTask.toSheetRow(headers);

    batchOps.appendRows(SHEET_NAMES.ACTIONS, [rowData]);

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Created task ' + newTask.action_id);

    return { success: true, data: { action_id: newTask.action_id, title: newTask.title } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_createTask failed', {
      error: error.message,
      stack: error.stack,
      taskData: taskData
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Delete a task (mark as DELETED status for soft delete)
 * @param {Object} params - Parameters
 * @param {string} params.taskId - Task ID to delete
 * @return {Object} Result with success/conflict status
 */
function appsheet_deleteTask(params) {
  ensureBootstrapServices();
  try {
    if (!params || !params.taskId) {
      return { success: false, error: 'taskId is required' };
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const rows = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, { action_id: params.taskId });

    if (rows.length === 0) {
      return { success: false, error: 'Task not found: ' + params.taskId };
    }

    const { row } = rows[0];
    const task = MohTask.fromSheetRow(row, headers);

    if (!task) {
      return { success: false, error: 'Failed to instantiate task' };
    }

    // Soft delete - mark as DELETED status
    task.status = 'DELETED';

    const result = batchOps.updateActionWithOptimisticLocking(
      SHEET_NAMES.ACTIONS,
      params.taskId,
      task
    );

    if (!result.success) {
      return {
        success: false,
        versionConflict: result.versionConflict || false,
        error: result.error || 'Update failed'
      };
    }

    const logger = getService(SERVICES.SmartLogger);
    logger.info('AppSheetBridge', 'Deleted (soft) task ' + params.taskId);

    return { success: true, data: { action_id: params.taskId, status: 'DELETED' } };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_deleteTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}
