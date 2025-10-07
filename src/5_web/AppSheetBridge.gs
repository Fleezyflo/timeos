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
      return { success: true, data: {
        SCAN_MODE: 'LABEL_ONLY', // Default as defined in SystemBootstrap
        EMAIL_LABEL: 'MOH-Time-OS',
        DEFAULT_DURATION_MINUTES: 30,
        CALENDAR_ID: 'primary'
      }};
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
      return { success: true, data: [] };
    }
    
    const batchOps = container.get('BatchOperations');
    if (!batchOps || !batchOps.getAllActions) {
      Logger.log('[ClientAPI] BatchOperations missing getAllActions method');
      return { success: true, data: [] };
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
  } catch (error) {
    // RETHROW_WITH_LOG profile
    // TEST: TEST_SILENT_066_APPSHEET_RUNSCHEDULING
    LoggerFacade.error('AppSheetBridge', 'appsheet_runScheduling failed', {
      error: error.message,
      stack: error.stack,
      context: 'appsheet_runScheduling'
    });

    return { success: false, error: error.message, stack: error.stack };
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

    const events = allTasks
      .filter(task => task.scheduled_start)
      .map(task => ({
        id: task.action_id,
        title: task.title,
        start: task.scheduled_start,
        end: task.scheduled_end || task.scheduled_start,
        allDay: false,
        extendedProps: {
          taskId: task.action_id,
          status: task.status
        }
      }));
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
    if (!data || data.length <= 1) {
      return { success: true, data: [] };
    }

    const headers = data[0];
    const safeAccess = new SafeColumnAccess(headers);
    const proposals = [];

    for (let i = 1; i < data.length && proposals.length < limit; i++) {
      const row = data[i];
      const status = safeAccess.getCellValue(row, 'status', '');

      if (!filterStatus || status === filterStatus) {
        const confidenceText = safeAccess.getCellValue(row, 'confidence_score', 0);
        const confidence = typeof confidenceText === 'number'
          ? confidenceText
          : parseFloat(confidenceText) || 0;

        proposals.push({
          proposal_id: safeAccess.getCellValue(row, 'proposal_id', ''),
          sender_email: safeAccess.getCellValue(row, 'sender', ''),
          subject: safeAccess.getCellValue(row, 'subject', ''),
          body: safeAccess.getCellValue(row, 'raw_content_preview', ''),
          extracted_title: safeAccess.getCellValue(row, 'parsed_title', ''),
          suggested_lane: safeAccess.getCellValue(row, 'suggested_lane', ''),
          suggested_priority: safeAccess.getCellValue(row, 'suggested_priority', ''),
          suggested_duration: safeAccess.getCellValue(row, 'suggested_duration', ''),
          confidence_score: confidence,
          status: status,
          processed_at: safeAccess.getCellValue(row, 'processed_at', ''),
          created_at: safeAccess.getCellValue(row, 'created_at', ''),
          source: safeAccess.getCellValue(row, 'source', ''),
          source_id: safeAccess.getCellValue(row, 'source_id', ''),
          raw_content_preview: safeAccess.getCellValue(row, 'raw_content_preview', ''),
          created_task_id: safeAccess.getCellValue(row, 'created_task_id', '')
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
    const data = batchOps.getAllSheetData(SHEET_NAMES.PROPOSED_TASKS);
    if (!data || data.length <= 1) {
      return { success: true, count: 0 };
    }

    const headers = data[0];
    const safeAccess = new SafeColumnAccess(headers);
    let count = 0;

    for (let i = 1; i < data.length; i++) {
      if (safeAccess.getCellValue(data[i], 'status', '') === PROPOSAL_STATUS.PENDING) {
        count++;
      }
    }

    return { success: true, count: count };
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getPendingProposalsCount failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message, count: 0, stack: error.stack };
  }
}

/**
 * Process a proposal action (currently supports rejection and manual status updates).
 * @param {Object} params Parameters containing proposalId and action.
 * @returns {Object} Result with success flag and action performed.
 */
function appsheet_processProposal(params) {
  ensureBootstrapServices();
  try {
    const logger = getService(SERVICES.SmartLogger);
    const { proposalId, action } = params || {};

    if (!proposalId || !action) {
      throw new ValidationError('proposalId and action are required.');
    }

    const batchOps = getService(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const safeAccess = new SafeColumnAccess(headers);
    const matches = batchOps.getRowsWithPosition(SHEET_NAMES.PROPOSED_TASKS, { proposal_id: proposalId });

    if (!matches || matches.length === 0) {
      return { success: false, error: `Proposal not found: ${proposalId}` };
    }

    const { row, sheetRowIndex } = matches[0];
    const lowerAction = action.toString().toLowerCase();

    if (lowerAction === 'approve' || lowerAction === 'accept') {
      // Delegate to the dedicated approval handler to ensure created_task_id is persisted.
      return appsheet_approveProposal({ proposalId: proposalId, overrides: params && params.overrides ? params.overrides : {} });
    }

    const updatedRow = [...row];
    let newStatus;

    switch (lowerAction) {
    case 'reject':
      newStatus = PROPOSAL_STATUS.REJECTED;
      safeAccess.setCellValue(updatedRow, 'created_task_id', '');
      break;
    case 'process':
      newStatus = PROPOSAL_STATUS.PROCESSED;
      break;
    default:
      return { success: false, error: `Unsupported action: ${action}` };
    }

    safeAccess.setCellValue(updatedRow, 'status', newStatus);
    safeAccess.setCellValue(updatedRow, 'processed_at', TimeZoneAwareDate.now());

    const rangeA1 = _calculateRowRange(headers.length, sheetRowIndex);
    batchOps.batchUpdate(SHEET_NAMES.PROPOSED_TASKS, [{
      rangeA1: rangeA1,
      values: [updatedRow]
    }]);

    if (logger && logger.info) {
      logger.info('AppSheetBridge', `Proposal ${proposalId} updated via ${lowerAction}`, { status: newStatus });
    }

    return { success: true, action: newStatus, proposalId: proposalId };
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_processProposal failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
  }
}

/**
 * Approve a proposal and create a corresponding task.
 * @param {Object} params Parameters containing proposalId and optional overrides.
 * @returns {Object} Result with success flag and created task identifier.
 */
function appsheet_approveProposal(params) {
  ensureBootstrapServices();
  try {
    const logger = getService(SERVICES.SmartLogger);
    const batchOps = getService(SERVICES.BatchOperations);
    const { proposalId, overrides = {} } = params || {};

    if (!proposalId) {
      throw new ValidationError('proposalId is required.');
    }

    const headers = batchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
    const safeAccess = new SafeColumnAccess(headers);
    const matches = batchOps.getRowsWithPosition(SHEET_NAMES.PROPOSED_TASKS, { proposal_id: proposalId });

    if (!matches || matches.length === 0) {
      return { success: false, error: `Proposal not found: ${proposalId}` };
    }

    const { row, sheetRowIndex } = matches[0];
    const nowIso = TimeZoneAwareDate.now();

    let userEmail = '';
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (sessionError) {
      if (logger && logger.warn) {
        logger.warn('AppSheetBridge', 'Failed to resolve active user email, using fallback', { error: sessionError.message });
      }
    }

    const suggestedDurationRaw = overrides.estimated_minutes !== undefined
      ? overrides.estimated_minutes
      : safeAccess.getCellValue(row, 'suggested_duration', '');
    const parsedDuration = parseInt(suggestedDurationRaw, 10);
    const estimatedMinutes = Number.isFinite(parsedDuration) && parsedDuration > 0
      ? parsedDuration
      : CONSTANTS.DEFAULT_ESTIMATED_MINUTES;

    const priorityValue = overrides.priority || safeAccess.getCellValue(row, 'suggested_priority', PRIORITY.MEDIUM) || PRIORITY.MEDIUM;
    const normalizedPriority = normalizePriority(priorityValue);

    const laneValue = overrides.lane || safeAccess.getCellValue(row, 'suggested_lane', LANE.OPERATIONAL) || LANE.OPERATIONAL;
    const normalizedLane = normalizeLane(laneValue);

    const titleValue = overrides.title
      || safeAccess.getCellValue(row, 'parsed_title', '')
      || safeAccess.getCellValue(row, 'subject', '')
      || 'Untitled Proposal';

    const rawPreview = safeAccess.getCellValue(row, 'raw_content_preview', '');
    const subject = safeAccess.getCellValue(row, 'subject', '');
    const descriptionOverride = overrides.description || '';
    const description = descriptionOverride ||
      [subject && subject !== titleValue ? `Subject: ${subject}` : '', rawPreview]
        .filter(Boolean)
        .join('\n\n');

    const confidenceScoreRaw = safeAccess.getCellValue(row, 'confidence_score', '');
    const confidenceScore = typeof confidenceScoreRaw === 'number'
      ? confidenceScoreRaw
      : parseFloat(confidenceScoreRaw) || null;

    const proposalSource = safeAccess.getCellValue(row, 'source', SOURCE.EMAIL);
    const senderEmail = safeAccess.getCellValue(row, 'sender', '');

    const metadata = {
      proposal_id: proposalId,
      proposal_source: proposalSource,
      confidence_score: confidenceScore,
      sender: senderEmail
    };

    const taskData = {
      title: titleValue,
      description: description || '',
      status: STATUS.PENDING,
      priority: normalizedPriority,
      lane: normalizedLane,
      estimated_minutes: estimatedMinutes,
      created_at: nowIso,
      updated_at: nowIso,
      source: SOURCE.EMAIL,
      source_id: proposalId,
      created_by: userEmail || 'appsheet@example.com',
      assigned_to: overrides.assigned_to || userEmail || '',
      completion_notes: '',
      dependencies: [],
      tags: ['email_proposal'],
      metadata: metadata
    };

    const newTask = new MohTask(taskData);
    if (!newTask.isValid()) {
      const validationErrors = newTask.getValidationErrors();
      throw new ValidationError(`Task validation failed: ${validationErrors.join(', ')}`);
    }

    const actionHeaders = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const taskRow = newTask.toSheetRow(actionHeaders);
    batchOps.appendRows(SHEET_NAMES.ACTIONS, [taskRow]);

    const updatedRow = [...row];
    safeAccess.setCellValue(updatedRow, 'status', PROPOSAL_STATUS.ACCEPTED);
    safeAccess.setCellValue(updatedRow, 'processed_at', nowIso);
    safeAccess.setCellValue(updatedRow, 'created_task_id', newTask.action_id);

    const rangeA1 = _calculateRowRange(headers.length, sheetRowIndex);
    batchOps.batchUpdate(SHEET_NAMES.PROPOSED_TASKS, [{
      rangeA1: rangeA1,
      values: [updatedRow]
    }]);
    CacheService.getScriptCache().remove(CACHE_ALL_TASKS_KEY);

    if (logger && logger.info) {
      logger.info('AppSheetBridge', `Approved proposal ${proposalId}`, {
        action_id: newTask.action_id,
        priority: normalizedPriority,
        lane: normalizedLane
      });
    }

    return {
      success: true,
      action: 'approved',
      action_id: newTask.action_id,
      proposal_id: proposalId
    };
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_approveProposal failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: error.message, stack: error.stack };
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
 * Convert a sheet row length and row index into an A1 range string.
 * @param {number} columnCount Number of columns in the sheet.
 * @param {number} rowIndex 1-based sheet row index.
 * @returns {string} Range in A1 notation covering the full row.
 */
function _calculateRowRange(columnCount, rowIndex) {
  if (!columnCount || columnCount < 1) {
    throw new Error('_calculateRowRange requires a positive column count');
  }
  const toColumnLetter = (index) => {
    let column = '';
    let dividend = index;
    while (dividend > 0) {
      let modulo = (dividend - 1) % 26;
      column = String.fromCharCode(65 + modulo) + column;
      dividend = Math.floor((dividend - modulo) / 26);
    }
    return column || 'A';
  };

  const endColumn = toColumnLetter(columnCount);
  return `A${rowIndex}:${endColumn}${rowIndex}`;
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
 * Creates a new task from AppSheet.
 * @param {Object} params - Task parameters from AppSheet.
 * @param {string} params.title - The title of the task.
 * @param {string} [params.description] - The description of the task.
 * @param {string} [params.priority] - The priority of the task (e.g., 'HIGH', 'MEDIUM').
 * @param {string} [params.lane] - The lane of the task.
 * @param {number} [params.estimated_minutes] - Estimated minutes for the task.
 * @param {string} [params.due_date] - Due date in ISO format.
 * @param {string} [params.completion_notes] - Notes about task completion.
 * @param {string} [params.assigned_to] - Email of the assigned user.
 * @param {string} [params.parent_id] - ID of the parent task.
 * @param {string} [params.dependencies] - JSON array string of dependency IDs.
 * @param {string} [params.tags] - JSON array string of tags.
 * @returns {Object} Result with success status and task details.
 */
function appsheet_createTask(params) {
  ensureBootstrapServices();
  try {
    const logger = getService(SERVICES.SmartLogger);
    const batchOps = getService(SERVICES.BatchOperations);

    if (!params || !params.title) {
      throw new ValidationError('Task title is required.');
    }

    let userEmail = '';
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (sessionError) {
      logger.warn('AppSheetBridge', 'Failed to resolve active user email, using fallback', { error: sessionError.message });
    }

    const dependenciesValue = Array.isArray(params.dependencies)
      ? JSON.stringify(params.dependencies)
      : (typeof params.dependencies === 'string' && params.dependencies.trim() ? params.dependencies : '[]');

    const tagsValue = Array.isArray(params.tags)
      ? JSON.stringify(params.tags)
      : (typeof params.tags === 'string' && params.tags.trim() ? params.tags : '[]');

    const taskData = {
      title: params.title,
      description: params.description || '',
      priority: params.priority || PRIORITY.MEDIUM,
      lane: params.lane || LANE.OPERATIONAL,
      estimated_minutes: params.estimated_minutes || CONSTANTS.DEFAULT_ESTIMATED_MINUTES,
      due_date: params.due_date || null,
      completion_notes: params.completion_notes || '',
      created_by: userEmail || 'appsheet@example.com', // Use session email
      assigned_to: params.assigned_to || userEmail || '', // Use session email if assigned_to not provided
      parent_id: params.parent_id || '',
      dependencies: dependenciesValue,
      tags: tagsValue,
      source: SOURCE.APPSHEET // Mark source as AppSheet
    };

    const newTask = new MohTask(taskData);

    if (!newTask.isValid()) {
      logger.error('AppSheetBridge', 'Task validation failed during creation', { errors: newTask.getValidationErrors(), taskData: taskData });
      throw new ValidationError('Task validation failed: ' + newTask.getValidationErrors().join(', '));
    }

    const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const taskRow = newTask.toSheetRow(headers);
    batchOps.appendRows(SHEET_NAMES.ACTIONS, [taskRow]);
    CacheService.getScriptCache().remove(CACHE_ALL_TASKS_KEY);

    logger.info('AppSheetBridge', `Task created via AppSheet: ${newTask.title} (ID: ${newTask.action_id})`);

    return {
      success: true,
      action_id: newTask.action_id,
      title: newTask.title,
      status: newTask.status,
      created_by: newTask.created_by
    };

  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_createTask failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: `Failed to create task: ${error.message}`, stack: error.stack };
  }
}
