# MOH TIME OS - COMPLETE CONTAINER-BOUND WEB UI IMPLEMENTATION BRIEF
**Version:** 4.0 - ABSOLUTELY COMPLETE  
**Created:** 2025-01-03  
**Status:** DEFINITIVE SPECIFICATION - INCLUDES EVERYTHING

---

## ⚠️ ABSOLUTE CRITICAL CONSTRAINTS - VIOLATION = IMMEDIATE FAILURE ⚠️

### THIS IS A CONTAINER-BOUND GOOGLE APPS SCRIPT
1. **NEVER** create new spreadsheets (`SpreadsheetApp.create()` is FORBIDDEN)
2. **NEVER** build standalone Node.js/React/Express/Vite applications
3. **NEVER** use REST APIs, Express servers, Replit, or external hosting
4. **NEVER** use OAuth, Google APIs directly, or fetch()
5. **NEVER** create package.json, node_modules, or npm dependencies
6. **NEVER** use TypeScript - only pure JavaScript in HTML
7. **ALWAYS** use `SpreadsheetApp.getActiveSpreadsheet()` for spreadsheet access
8. **ALWAYS** access services via `container.get(SERVICE_NAME)` in backend
9. **ALWAYS** use exact column names from existing sheets (NO VARIATIONS)
10. **ALWAYS** implement as single HTML file served by `doGet()`

### YOU ARE WORKING WITH AN EXISTING SYSTEM
- 31 services are ALREADY registered in the container (see Section 12 for complete list)
- The spreadsheet ALREADY exists with 20+ sheets (see Section 13 for all sheet names)
- All enums and validators ALREADY exist (see Section 14)
- Remote control functions ALREADY exist (see Section 15)
- DO NOT recreate anything that exists

---

## 1. COMPLETE SYSTEM ARCHITECTURE

### 1.1 Container-Bound Structure
```
Google Apps Script Project (BOUND to EXISTING Spreadsheet)
│
├── /src/0_bootstrap/    [Bootstrap Layer - DO NOT MODIFY]
│   ├── AA_Container.gs  (Service container - 31 services registered)
│   ├── AB_Constants.gs  (All system constants)
│   ├── AC_Enums.gs      (All enums and validators)
│   ├── Preload.gs       (Global error handlers)
│   ├── SheetHealer.gs   (Sheet management)
│   └── LoggerFacade.gs  (Logging system)
│
├── /src/3_core/         [Core Services - ACCESS VIA container.get()]
│   ├── BatchOperations.gs
│   ├── ConfigManager.gs
│   ├── CrossExecutionCache.gs
│   ├── DistributedLockManager.gs
│   ├── ErrorHandler.gs
│   ├── PersistentStore.gs
│   └── SmartLogger.gs
│
├── /src/4_services/     [Application Services - ACCESS VIA container.get()]
│   ├── IntelligentScheduler.gs
│   ├── EmailIngestionEngine.gs
│   ├── HumanStateManager.gs
│   ├── CalendarSyncManager.gs
│   ├── FoundationBlocksManager.gs
│   ├── SenderReputationManager.gs
│   ├── ArchiveManager.gs
│   ├── DynamicLaneManager.gs
│   ├── SystemManager.gs
│   ├── ChatEngine.gs
│   ├── TriggerOrchestrator.gs
│   ├── SecureWebAppAuth.gs
│   └── ZeroTrustTriageEngine.gs
│
├── /src/5_web/          [Web Layer - YOUR WORK AREA]
│   ├── AppSheetBridge.gs [EXISTING - Has all backend functions]
│   └── DayPlanner.html   [CREATE THIS - Single HTML file]
│
└── /src/8_setup/        [Setup & Triggers]
    ├── SystemBootstrap.gs (doGet, doPost, completeSetup)
    └── TriggerSetup.gs    (All trigger management)
```

### 1.2 Data Flow - THE ONLY CORRECT WAY
```
User Browser
    ↓
DayPlanner.html (Single HTML file with embedded CSS/JS)
    ↓
google.script.run.appsheet_*() calls
    ↓
AppSheetBridge.gs (Routes to services)
    ↓
container.get(SERVICE_NAME) (Accesses 31 services)
    ↓
SpreadsheetApp.getActiveSpreadsheet() (EXISTING spreadsheet)
    ↓
Returns data via success callbacks
```

---

## 2. ALL EXISTING SHEETS AND THEIR EXACT SCHEMAS

### 2.1 ACTIONS Sheet (Primary task storage)
**✅ VERIFIED - Matches SheetHealer.gs:291-298**

```javascript
const ACTIONS_COLUMNS = {
  'action_id': 0,          // ACT_xxxxx format
  'status': 1,             // NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELED, SCHEDULED, PENDING, PENDING_APPROVAL, ACCEPTED, REJECTED, BLOCKED, DEFERRED, ARCHIVED
  'priority': 2,           // CRITICAL, URGENT, HIGH, MEDIUM, LOW, MINIMAL
  'created_at': 3,         // ISO timestamp
  'updated_at': 4,         // ISO timestamp
  'title': 5,              // Task title (required)
  'context': 6,            // Additional context
  'lane': 7,               // ops, admin, creative, client, growth, deep_focus, batch, communication, learning, maintenance, high_energy, low_energy, social, solo
  'estimated_minutes': 8,  // Integer
  'scheduled_start': 9,    // ISO timestamp - source of truth for calendar
  'scheduled_end': 10,     // ISO timestamp
  'actual_minutes': 11,    // Integer - actual time taken
  'completed_date': 12,    // ISO timestamp
  'source': 13,            // manual, email, calendar, chat, appsheet, api, import, template, recurring, automation
  'source_id': 14,         // Gmail message ID, Calendar event ID, etc.
  'description': 15,       // Detailed task description
  'calendar_event_id': 16, // Google Calendar event ID for two-way sync
  'rollover_count': 17,    // Integer - times deferred
  'scheduling_metadata': 18, // JSON string - algorithm metadata
  'score': 19,             // Calculated priority score (0-100)
  'deadline': 20,          // ISO timestamp or empty
  'energy_required': 21,   // CRITICAL, HIGH, MEDIUM, LOW, RECOVERY
  'focus_required': 22,    // INTENSE, HIGH, MEDIUM, LOW, BACKGROUND
  'estimation_accuracy': 23 // Decimal - actual/estimated ratio
};
// TOTAL: 24 columns (0-23)
```

### 2.2 PROPOSED_TASKS Sheet (Email proposals)
```javascript
const PROPOSED_TASKS_COLUMNS = {
  'proposal_id': 0,      // PROP_xxxxx format
  'sender_email': 1,     // Email address
  'subject': 2,          // Email subject
  'body': 3,             // Email body content
  'extracted_title': 4,  // AI extracted title
  'suggested_priority': 5, // AI suggested priority
  'suggested_lane': 6,   // AI suggested lane
  'suggested_duration': 7, // AI suggested minutes
  'confidence_score': 8, // 0-100 confidence
  'status': 9,           // PENDING, APPROVED, REJECTED
  'processed_at': 10,    // ISO timestamp
  'created_task_id': 11, // Reference to created task
  'rejection_reason': 12, // Why rejected
  'sender_reputation': 13, // Reputation score
  'keywords': 14,        // JSON array of keywords
  'deadline_detected': 15 // Detected deadline from email
};
```

### 2.3 HUMAN_STATE Sheet (Energy tracking)
```javascript
const HUMAN_STATE_COLUMNS = {
  'state_id': 0,         // HS_xxxxx format
  'timestamp': 1,        // ISO timestamp
  'energy_level': 2,     // 1-10 scale
  'focus_level': 3,      // 1-10 scale
  'mood': 4,             // ENERGIZED, FOCUSED, MOTIVATED, NEUTRAL, TIRED, STRESSED, OVERWHELMED
  'stress_level': 5,     // 1-10 scale
  'current_context': 6,  // What user is working on
  'notes': 7,            // Optional notes
  'productivity_score': 8, // Calculated 1-10
  'break_needed': 9,     // Boolean as text
  'optimal_task_type': 10 // Recommended task type
};
```

### 2.4 CALENDAR_PROJECTION Sheet
```javascript
const CALENDAR_PROJECTION_COLUMNS = {
  'projection_id': 0,    // CP_xxxxx format
  'task_id': 1,          // Reference to ACTIONS
  'start_time': 2,       // ISO timestamp
  'end_time': 3,         // ISO timestamp
  'calendar_id': 4,      // Which calendar
  'event_id': 5,         // Google Calendar event ID
  'status': 6,           // PROJECTED, CONFIRMED, SYNCED
  'conflict_status': 7,  // NO_CONFLICT, SOFT_CONFLICT, HARD_CONFLICT
  'buffer_before': 8,    // Minutes
  'buffer_after': 9,     // Minutes
  'location': 10,        // Location if any
  'attendees': 11,       // JSON array
  'recurrence': 12       // Recurrence rule
};
```

### 2.5 APPSHEET_CONFIG Sheet (Settings)
```javascript
const APPSHEET_CONFIG_COLUMNS = {
  'row_id': 0,           // Unique row ID
  'category': 1,         // Setting category
  'subcategory': 2,      // Setting subcategory
  'item': 3,             // Setting item name
  'key': 4,              // Setting key
  'value': 5,            // Setting value
  'description': 6,      // Setting description
  'data_type': 7,        // STRING, NUMBER, BOOLEAN, JSON
  'min_value': 8,        // For numbers
  'max_value': 9,        // For numbers
  'default_value': 10,   // Default if not set
  'last_updated': 11,    // ISO timestamp
  'updated_by': 12       // Who changed it
};
```

### 2.6 SENDER_REPUTATION Sheet
```javascript
const SENDER_REPUTATION_COLUMNS = {
  'sender_email': 0,     // Email address
  'approved_count': 1,   // Tasks approved
  'rejected_count': 2,   // Tasks rejected
  'reputation_score': 3, // 0-100 score
  'last_seen': 4,        // ISO timestamp
  'first_seen': 5,       // ISO timestamp
  'total_proposals': 6,  // Total submitted
  'auto_approve': 7,     // Boolean as text
  'notes': 8,            // Admin notes
  'tags': 9              // JSON array
};
```

### 2.7 ACTIVITY Sheet (Audit log)
```javascript
const ACTIVITY_COLUMNS = {
  'activity_id': 0,      // LOG_xxxxx format
  'timestamp': 1,        // ISO timestamp
  'user': 2,             // Who did it
  'action': 3,           // What they did
  'entity_type': 4,      // TASK, PROPOSAL, etc.
  'entity_id': 5,        // ID of affected entity
  'old_value': 6,        // Previous value
  'new_value': 7,        // New value
  'ip_address': 8,       // Client IP
  'user_agent': 9,       // Browser info
  'session_id': 10       // Session tracking
};
```

### 2.8 TIME_BLOCKS Sheet
```javascript
const TIME_BLOCKS_COLUMNS = {
  'block_id': 0,         // TB_xxxxx format
  'block_type': 1,       // FOCUS, MEETING, BREAK, LUNCH, PERSONAL
  'start_time': 2,       // Time of day (HH:MM)
  'end_time': 3,         // Time of day (HH:MM)
  'days': 4,             // JSON array of days
  'recurring': 5,        // Boolean as text
  'protected': 6,        // Cannot be scheduled over
  'energy_level': 7,     // Required energy for this block
  'lane_preference': 8   // Preferred lanes for this time
};
```

### 2.9 LANES Sheet (Lane configuration)
```javascript
const LANES_COLUMNS = {
  'lane_id': 0,          // Lane identifier
  'lane_name': 1,        // Display name
  'energy_required': 2,  // Default energy
  'focus_required': 3,   // Default focus
  'time_preference': 4,  // MORNING, AFTERNOON, EVENING, ANYTIME
  'batch_compatible': 5, // Can batch these tasks
  'max_duration': 6,     // Max minutes per session
  'min_duration': 7,     // Min minutes per session
  'color': 8,            // Hex color for UI
  'icon': 9,             // Icon class
  'sort_order': 10       // Display order
};
```

### 2.10 Additional Sheets
- **STATUS**: System health metrics
- **FOUNDATION_BLOCKS**: Recurring commitments
- **DEPENDENCIES**: Task dependencies
- **CHAT_QUEUE**: Chat integration queue
- **ACTIONS_ARCHIVE**: Archived tasks
- **PROPOSED_ARCHIVE**: Archived proposals
- **ACTIVITY_ARCHIVE**: Archived logs
- **ACTIONS_TEMP**: Atomic operations
- **PROPOSED_TEMP**: Atomic operations
- **CALENDAR_TEMP**: Atomic operations

---

## 2.11 HTML SERVING IMPLEMENTATION

### **Current doGet() Flow**
```
User requests Web App URL
    ↓
SystemBootstrap.doGet(e) [line 563]
    ↓
WebAppManager.handleDoGet(e) [line 17]
    ↓
SecureWebAppAuth.verifyWebAppToken(e) [REQUIRES TOKEN]
    ↓
AppSheetBridge.doGet(e) [Returns JSON only]
```

### **Problem**
- ❌ No HTML is being served
- ❌ Authentication required before any routing logic
- ❌ AppSheetBridge only handles `?endpoint=config` or `?endpoint=status` (JSON)

### **Solution: Modify WebAppManager.handleDoGet()**

**File:** `moh-time-os-v2/src/5_web/WebAppManager.gs`
**Function:** `handleDoGet(e)` (lines 17-36)
**Action:** Insert UI request detection BEFORE authentication check

**BEFORE (Current - JSON Only):**
```javascript
handleDoGet(e) {
  const verificationId = Utilities.getUuid();

  // Authentication required for ALL requests
  if (!this.secureAuth.verifyWebAppToken(e)) {
    this.logger.warn('WebAppManager', 'doGet auth failed', { verification_id: verificationId });
    return ContentService.createTextOutput(JSON.stringify({
      status: 401, error: 'Unauthorized', request_id: verificationId
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Routes to AppSheetBridge (JSON only)
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    this.logger.warn('WebAppManager', 'doGet lock contention', { verification_id: verificationId });
    return ContentService.createTextOutput(JSON.stringify({
      status: 503, error: 'Service busy', request_id: verificationId
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    this.logger.info('WebAppManager', 'Processing doGet', { verification_id: verificationId });
    return this.appSheetBridge.doGet(e);
  } catch (error) {
    this.logger.error('WebAppManager', 'doGet failed', {
      verification_id: verificationId, error: error.message
    });
    return ContentService.createTextOutput(JSON.stringify({
      status: 500, error: 'Internal server error', request_id: verificationId
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

**AFTER (HTML + JSON):**
```javascript
handleDoGet(e) {
  const verificationId = Utilities.getUuid();

  // ========== NEW: DETECT UI REQUEST (NO ENDPOINT PARAMETER) ==========
  const isUIRequest = !e || !e.parameter || !e.parameter.endpoint;

  if (isUIRequest) {
    // Serve HTML - no authentication required at this stage
    // Authentication happens automatically via google.script.run (user context)
    try {
      this.logger.info('WebAppManager', 'Serving DayPlanner UI', {
        verification_id: verificationId
      });

      return HtmlService.createHtmlOutputFromFile('DayPlanner')
        .setTitle('MOH Time OS - Day Planner')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');

    } catch (error) {
      this.logger.error('WebAppManager', 'Failed to serve DayPlanner UI', {
        verification_id: verificationId,
        error: error.message
      });

      // Friendly error message when DayPlanner.html doesn't exist yet
      const errorHtml = '<!DOCTYPE html><html><head><title>UI Not Found</title></head><body>' +
        '<h1>DayPlanner UI Not Created Yet</h1>' +
        '<p>The file <code>moh-time-os-v2/src/5_web/DayPlanner.html</code> does not exist.</p>' +
        '<p><strong>Error:</strong> ' + error.message + '</p>' +
        '<p><strong>Expected Location:</strong> <code>src/5_web/DayPlanner.html</code></p>' +
        '<p><strong>Next Step:</strong> Create DayPlanner.html in the web layer.</p>' +
        '<p><strong>Request ID:</strong> ' + verificationId + '</p>' +
        '</body></html>';

      return HtmlService.createHtmlOutput(errorHtml).setTitle('UI Not Found');
    }
  }
  // ========== END NEW CODE ==========

  // EXISTING: API endpoints (config/status) require token authentication
  if (!this.secureAuth.verifyWebAppToken(e)) {
    this.logger.warn('WebAppManager', 'doGet auth failed', { verification_id: verificationId });
    return ContentService.createTextOutput(JSON.stringify({
      status: 401, error: 'Unauthorized', request_id: verificationId
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // EXISTING: Lock and route to AppSheetBridge for JSON
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    this.logger.warn('WebAppManager', 'doGet lock contention', { verification_id: verificationId });
    return ContentService.createTextOutput(JSON.stringify({
      status: 503, error: 'Service busy', request_id: verificationId
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    this.logger.info('WebAppManager', 'Processing doGet API request', {
      verification_id: verificationId,
      endpoint: e.parameter.endpoint
    });
    return this.appSheetBridge.doGet(e);
  } catch (error) {
    this.logger.error('WebAppManager', 'doGet failed', {
      verification_id: verificationId, error: error.message
    });
    return ContentService.createTextOutput(JSON.stringify({
      status: 500, error: 'Internal server error', request_id: verificationId
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

### **New Routing Behavior**
| Request URL | Parameter | Serves | Auth Required |
|-------------|-----------|--------|---------------|
| `https://script.google.com/.../exec` | (none) | DayPlanner.html | No (HTML loads, then google.script.run uses user context) |
| `https://script.google.com/.../exec?endpoint=config` | `endpoint=config` | JSON config | Yes (token required) |
| `https://script.google.com/.../exec?endpoint=status` | `endpoint=status` | JSON status | Yes (token required) |

### **Authentication Flow**
1. **HTML Delivery:** No auth required - anyone with the URL can load the HTML shell
2. **google.script.run Calls:** Automatic auth - functions execute in the user's context (user must be logged into Google)
3. **JSON Endpoints:** Token auth required - for AppSheet machine-to-machine communication

### **File Locations**
- **Modify:** `moh-time-os-v2/src/5_web/WebAppManager.gs` (lines 17-36)
- **Create (Later):** `moh-time-os-v2/src/5_web/DayPlanner.html` (not in this task)

---

## 3. ALL BACKEND FUNCTIONS (USE THESE EXACTLY VIA google.script.run)

### ✅ VERIFIED: All Functions Implemented
**ALL 28 appsheet_* functions are IMPLEMENTED** in `AppSheetBridge.gs`
**READY TO USE:** All functions include auto-initialization via `ensureSystemInitialized()`
**CONSISTENT RESPONSES:** All functions return `{ success: true/false, data: {}, error: '' }`

### 3.1 Task Management Functions
```javascript
// ✅ EXISTS: Get dashboard data
google.script.run
  .withSuccessHandler(handleDashboard)
  .withFailureHandler(handleError)
  .appsheet_getMyDay({ view: 'today' }); // or 'scheduled'

// ✅ EXISTS: Get all tasks with filtering
google.script.run
  .withSuccessHandler(handleTasks)
  .appsheet_getAllTasks({ 
    filters: { 
      status: 'SCHEDULED',  // PENDING, IN_PROGRESS, COMPLETED, etc.
      priority: 'HIGH',     // CRITICAL, URGENT, MEDIUM, LOW, MINIMAL
      lane: 'ops'          // admin, creative, client, etc.
    },
    search: 'keyword',
    limit: 50,
    offset: 0
  });

// ✅ EXISTS: Get high priority tasks
google.script.run
  .withSuccessHandler(handlePriority)
  .appsheet_getHighPriorityTasks({ limit: 5 });

// ✅ EXISTS: Create new task
google.script.run
  .withSuccessHandler(handleCreated)
  .appsheet_createTask({
    title: 'Task Title',        // REQUIRED
    priority: 'MEDIUM',         // CRITICAL, URGENT, HIGH, MEDIUM, LOW, MINIMAL
    lane: 'ops',               // ops, admin, creative, client, etc.
    estimated_minutes: 30,      // Integer
    description: 'Details',
    energy_required: 'MEDIUM',  // CRITICAL, HIGH, MEDIUM, LOW, RECOVERY
    focus_required: 'MODERATE', // DEEP, MODERATE, LIGHT
    deadline: '2025-01-10T17:00:00Z', // ISO string or null
    tags: ['tag1', 'tag2']     // Array of strings
  });

// ✅ EXISTS: Start a task (change to IN_PROGRESS)
google.script.run
  .withSuccessHandler(handleStarted)
  .appsheet_startTask({ 
    taskId: 'ACT_12345' 
  });

// ✅ EXISTS: Complete a task
google.script.run
  .withSuccessHandler(handleCompleted)
  .appsheet_completeTask({ 
    taskId: 'ACT_12345',
    actualMinutes: 45,
    notes: 'Completion notes'
  });

// Snooze a task
google.script.run
  .withSuccessHandler(handleSnoozed)
  .appsheet_snoozeTask({ 
    taskId: 'ACT_12345',
    minutes: 60  // Snooze for 60 minutes
  });

// Cancel a task
google.script.run
  .withSuccessHandler(handleCanceled)
  .appsheet_cancelTask({ 
    taskId: 'ACT_12345',
    reason: 'No longer needed'
  });

// Archive a task
google.script.run
  .withSuccessHandler(handleArchived)
  .appsheet_archiveTask({ 
    taskId: 'ACT_12345'
  });

// Reschedule a task
google.script.run
  .withSuccessHandler(handleRescheduled)
  .appsheet_rescheduleTask({ 
    taskId: 'ACT_12345',
    newStart: '2025-01-05T14:00:00Z',
    newEnd: '2025-01-05T15:00:00Z'
  });

// ✅ EXISTS: Handle task updates from AppSheet
google.script.run
  .withSuccessHandler(handleUpdated)
  .appsheet_handleUpdate({
    table: 'ACTIONS',
    action_id: 'ACT_12345',
    updates: { status: 'IN_PROGRESS' }
  });

// ✅ EXISTS: Handle new records from AppSheet
google.script.run
  .withSuccessHandler(handleNewRecord)
  .appsheet_handleNewRecord({
    table: 'ACTIONS',
    data: { /* task data */ }
  });

// ✅ EXISTS: Resolve conflicts
google.script.run
  .withSuccessHandler(handleConflict)
  .appsheet_resolveConflict({
    taskId: 'ACT_12345',
    conflictType: 'TIME_OVERLAP',
    resolution: 'MOVE_LATER'
  });
```

### 3.2 Proposal/Triage Functions
```javascript
// Get pending proposals
google.script.run
  .withSuccessHandler(handleProposals)
  .appsheet_getProposals({
    status: 'PENDING',  // or APPROVED, REJECTED
    limit: 20
  });

// Get proposal count (for badge)
google.script.run
  .withSuccessHandler(handleCount)
  .appsheet_getPendingProposalsCount();

// ✅ EXISTS: Process a proposal (approve/reject)
google.script.run
  .withSuccessHandler(handleProcessed)
  .appsheet_processProposal({
    proposalId: 'PROP_123',
    action: 'approve',  // or 'reject'
    taskData: {         // If approving, optional overrides
      priority: 'HIGH',
      lane: 'client',
      estimated_minutes: 60
    }
  });

// ✅ EXISTS: Approve proposal (alternative)
google.script.run
  .withSuccessHandler(handleApproved)
  .appsheet_approveProposal({
    proposalId: 'PROP_123',
    overrides: {
      title: 'Modified Title',
      priority: 'URGENT'
    }
  });

// ✅ EXISTS: Process emails to generate proposals
google.script.run
  .withSuccessHandler(handleEmailsProcessed)
  .appsheet_processEmails({
    maxEmails: 20,
    autoApprove: true,
    confidenceThreshold: 0.8
  });
```

### 3.3 Energy/Human State Functions
```javascript
// Log current energy state
google.script.run
  .withSuccessHandler(handleEnergyLogged)
  .appsheet_logEnergyState({
    energy_level: 7,      // 1-10
    focus_level: 8,       // 1-10
    stress_level: 3,      // 1-10
    mood: 'FOCUSED',      // ENERGIZED, FOCUSED, MOTIVATED, NEUTRAL, TIRED, STRESSED, OVERWHELMED
    notes: 'Feeling good after coffee'
  });

// Get energy history
google.script.run
  .withSuccessHandler(handleEnergyHistory)
  .appsheet_getEnergyHistory({
    limit: 50,
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-03T23:59:59Z'
  });

// ✅ EXISTS: Update human state (alternative)
google.script.run
  .withSuccessHandler(handleStateUpdated)
  .appsheet_updateHumanState({
    energy: 6,
    focus: 7,
    currentContext: 'Working on UI implementation',
    breakNeeded: false
  });
```

### 3.4 Calendar Functions
```javascript
// Get calendar events
google.script.run
  .withSuccessHandler(handleEvents)
  .appsheet_getCalendarEvents({
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-31T23:59:59Z',
    includeProjections: true
  });
```

### 3.5 Settings Functions
```javascript
// Get user settings
google.script.run
  .withSuccessHandler(handleSettings)
  .appsheet_getSettings({
    userId: 'default'  // or specific user ID
  });

// Update settings
google.script.run
  .withSuccessHandler(handleSettingsUpdated)
  .appsheet_updateSettings({
    userId: 'default',
    settings: {
      autoApproveThreshold: 0.9,
      emailProcessingFrequency: 15,
      defaultTaskDuration: 45,
      workHoursStart: '09:00',
      workHoursEnd: '17:00',
      syncToGoogleCalendar: true,
      blockFocusTime: true,
      notifyTaskStart: true,
      notifyTriageQueue: true,
      notifyDailySummary: false
    }
  });
```

### 3.6 Batch/Optimization Functions
```javascript
// Get batch data (efficient loading)
google.script.run
  .withSuccessHandler(handleBatchData)
  .appsheet_getBatchData({
    userId: 'default',
    includeTasks: true,
    includeProposals: true,
    includeEnergy: true,
    includeCalendar: true,
    includeSettings: true
  });

// Validate authentication token
google.script.run
  .withSuccessHandler(handleAuth)
  .appsheet_validateToken({
    token: 'auth_token_here'
  });
```

### 3.7 Scheduling & Intelligence Functions
```javascript
// ✅ EXISTS: Run intelligent scheduling
google.script.run
  .withSuccessHandler(handleScheduled)
  .appsheet_runScheduling({
    taskId: 'ACT_12345',  // Optional specific task
    dryRun: false,        // Test without saving
    mode: 'OPTIMIZE'      // or 'QUICK', 'FULL'
  });
```

### 3.8 System Functions
```javascript
// ✅ EXISTS: Get system status
google.script.run
  .withSuccessHandler(handleStatus)
  .appsheet_getSystemStatus();
```

### 3.9 Additional System Functions (Available via Remote Control)
```javascript
// These are available but typically called via RemoteControl
START()           // Start all triggers
STOP()            // Stop all triggers
RESET()           // Reset system state
EMAIL()           // Process emails
SCHEDULE()        // Run scheduling
SYNC()            // Sync calendars
FIX()             // Run sheet healer
CHECK()           // Health check
TEST()            // Run tests
GET_STATUS()      // Get status
CONFIG(key, val)  // Update config
BACKUP()          // Backup data
INSTALL()         // Install triggers
UNINSTALL()       // Remove triggers
LIST()            // List services
```

---

## 4. HTML IMPLEMENTATION REQUIREMENTS

### 4.1 File Structure
```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#667eea">
  
  <title>MOH TIME OS</title>
  
  <!-- External CSS Libraries -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@event-calendar/build@4.6.0/event-calendar.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
  
  <style>
    /* ALL CSS MUST BE INLINE HERE */
  </style>
</head>
<body>
  <div id="app">
    <!-- ALL HTML HERE -->
  </div>
  
  <!-- External JS Libraries -->
  <script src="https://cdn.jsdelivr.net/npm/@event-calendar/build@4.6.0/event-calendar.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  
  <script>
    // ALL JAVASCRIPT MUST BE INLINE HERE
    // NO EXTERNAL FILES, NO MODULES, NO IMPORTS
  </script>
</body>
</html>
```

### 4.2 Required Views

#### 4.2.1 Dashboard View
- Current energy gauges (circular progress)
- Today's task count with breakdown
- High priority task cards
- Completion probability calculation
- Today's schedule timeline
- Quick actions (Start Day, Process Emails, Run Scheduler)

#### 4.2.2 Task List View
- Search box with debouncing
- Filter chips (Status, Priority, Lane)
- Task cards with all actions
- Infinite scroll or pagination
- Bulk actions (select multiple)
- Sort options (Priority, Deadline, Created)
- FAB for creating new task

#### 4.2.3 Calendar View
- Month/Week/Day views
- Drag and drop rescheduling
- Color coding by priority/lane
- Conflict indicators
- Time block visualization
- Click to view/edit task

#### 4.2.4 Triage Queue View
- Swipeable cards (Swiper.js)
- Proposal details display
- Confidence score visualization
- Sender reputation indicator
- Quick edit before approve
- Swipe left = reject, right = approve
- Tap for more options

#### 4.2.5 Energy Log View
- Sliders for energy/focus/stress (1-10)
- Mood selector (radio buttons)
- Notes textarea
- Historical chart (Chart.js)
- Recent logs list
- Productivity insights

#### 4.2.6 Settings View
- General settings section
- Scheduling preferences
- Email triage settings
- Notification preferences
- Work hours configuration
- System information
- Data management (export, clear cache)

### 4.3 Required UI Components

#### 4.3.1 Task Card Component
```html
<div class="task-card priority-HIGH status-SCHEDULED" data-task-id="ACT_12345">
  <div class="task-header">
    <h3 class="task-title">Task Title Here</h3>
    <span class="task-time">30 min</span>
  </div>
  <div class="task-meta">
    <span class="task-lane"><i class="fas fa-folder"></i> ops</span>
    <span class="task-deadline"><i class="fas fa-clock"></i> Due in 2 hours</span>
    <span class="task-energy"><i class="fas fa-battery-half"></i> Medium</span>
  </div>
  <div class="task-actions">
    <button onclick="startTask('ACT_12345')" class="btn-start">
      <i class="fas fa-play"></i> Start
    </button>
    <button onclick="completeTask('ACT_12345')" class="btn-complete">
      <i class="fas fa-check"></i> Complete
    </button>
    <button onclick="snoozeTask('ACT_12345')" class="btn-snooze">
      <i class="fas fa-clock"></i> Snooze
    </button>
    <button onclick="showTaskMenu('ACT_12345')" class="btn-more">
      <i class="fas fa-ellipsis-v"></i>
    </button>
  </div>
</div>
```

#### 4.3.2 Energy Gauge Component
```javascript
function createEnergyGauge(containerId, value, max = 10) {
  const percentage = (value / max) * 100;
  const color = value > 7 ? '#48bb78' : value > 4 ? '#ed8936' : '#f56565';
  
  document.getElementById(containerId).innerHTML = `
    <svg viewBox="0 0 100 60" style="width: 100%; height: 100%;">
      <path d="M 10 50 A 40 40 0 0 1 90 50" 
            stroke="#e2e8f0" stroke-width="8" fill="none"/>
      <path d="M 10 50 A 40 40 0 0 1 90 50" 
            stroke="${color}" stroke-width="8" fill="none"
            stroke-dasharray="${percentage * 1.26} 126"/>
    </svg>
    <div class="gauge-text">
      <div class="gauge-value">${value}</div>
      <div class="gauge-label">/ ${max}</div>
    </div>
  `;
}
```

#### 4.3.3 Triage Card Component
```javascript
function createTriageCard(proposal) {
  return `
    <div class="swiper-slide">
      <div class="proposal-card" data-proposal-id="${proposal.proposal_id}">
        <div class="proposal-sender">
          <i class="fas fa-user"></i> ${proposal.sender_email}
          <span class="reputation-badge">${proposal.sender_reputation}%</span>
        </div>
        <h3 class="proposal-title">${proposal.extracted_title}</h3>
        <p class="proposal-body">${proposal.body.substring(0, 200)}...</p>
        <div class="proposal-meta">
          <span class="confidence">
            <i class="fas fa-chart-line"></i> 
            Confidence: ${proposal.confidence_score}%
          </span>
          <span class="suggested-priority priority-${proposal.suggested_priority}">
            ${proposal.suggested_priority}
          </span>
        </div>
        <div class="proposal-actions">
          <button onclick="editProposal('${proposal.proposal_id}')" class="btn-edit">
            <i class="fas fa-edit"></i> Edit
          </button>
        </div>
      </div>
    </div>
  `;
}
```

### 4.4 Required Modals

#### 4.4.1 Create Task Modal
```html
<div id="modal-create-task" class="modal">
  <div class="modal-background" onclick="closeModal('modal-create-task')"></div>
  <div class="modal-content">
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Create New Task</p>
        <button class="delete" onclick="closeModal('modal-create-task')"></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">Title *</label>
          <input class="input" type="text" id="new-task-title" required>
        </div>
        <div class="field">
          <label class="label">Description</label>
          <textarea class="textarea" id="new-task-description"></textarea>
        </div>
        <div class="field">
          <label class="label">Priority</label>
          <select class="select" id="new-task-priority">
            <option value="MEDIUM">Medium</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="LOW">Low</option>
            <option value="MINIMAL">Minimal</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Lane</label>
          <select class="select" id="new-task-lane">
            <option value="ops">Operations</option>
            <option value="admin">Admin</option>
            <option value="creative">Creative</option>
            <option value="client">Client</option>
            <option value="growth">Growth</option>
            <option value="deep_focus">Deep Focus</option>
            <option value="batch">Batch</option>
            <option value="communication">Communication</option>
            <option value="learning">Learning</option>
            <option value="maintenance">Maintenance</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Estimated Minutes</label>
          <input class="input" type="number" id="new-task-duration" value="30" min="5" step="5">
        </div>
        <div class="field">
          <label class="label">Energy Required</label>
          <select class="select" id="new-task-energy">
            <option value="MEDIUM">Medium</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="LOW">Low</option>
            <option value="RECOVERY">Recovery</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Deadline</label>
          <input class="input" type="datetime-local" id="new-task-deadline">
        </div>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-primary" onclick="submitNewTask()">Create Task</button>
        <button class="button" onclick="closeModal('modal-create-task')">Cancel</button>
      </footer>
    </div>
  </div>
</div>
```

#### 4.4.2 Complete Task Modal
#### 4.4.3 Snooze Options Modal
#### 4.4.4 Edit Proposal Modal
#### 4.4.5 Task Details Modal

### 4.5 State Management

```javascript
const APP = {
  // State
  state: {
    currentView: 'dashboard',
    tasks: [],
    proposals: [],
    energyHistory: [],
    settings: {},
    filters: {
      status: null,
      priority: null,
      lane: null,
      search: ''
    },
    isLoading: false,
    isOnline: navigator.onLine,
    lastSync: null,
    pendingActions: []
  },
  
  // Cache
  cache: {
    tasks: new Map(),
    proposals: new Map(),
    energyStates: new Map()
  },
  
  // Polling
  pollingInterval: null,
  pollingFrequency: 30000, // 30 seconds
  
  // Methods
  init() {
    this.loadInitialData();
    this.setupEventListeners();
    this.startPolling();
    this.setupOfflineHandling();
  },
  
  loadInitialData() {
    // Load batch data for efficiency
    google.script.run
      .withSuccessHandler(data => {
        this.state.tasks = data.tasks;
        this.state.proposals = data.proposals;
        this.state.energyHistory = data.energyHistory;
        this.state.settings = data.settings;
        this.renderCurrentView();
      })
      .withFailureHandler(this.handleError)
      .appsheet_getBatchData({
        userId: 'default',
        includeTasks: true,
        includeProposals: true,
        includeEnergy: true,
        includeSettings: true
      });
  },
  
  startPolling() {
    this.pollingInterval = setInterval(() => {
      if (this.state.isOnline && !this.state.isLoading) {
        this.syncData();
      }
    }, this.pollingFrequency);
  },
  
  syncData() {
    // Sync any pending actions first
    this.processPendingActions();
    
    // Then fetch latest data
    this.loadInitialData();
  },
  
  processPendingActions() {
    while (this.state.pendingActions.length > 0) {
      const action = this.state.pendingActions.shift();
      this.executeAction(action);
    }
  }
};
```

### 4.6 Error Handling

```javascript
const ErrorHandler = {
  handleError(error) {
    console.error('Error:', error);
    
    // Show user-friendly message
    this.showToast(this.getUserMessage(error), 'error');
    
    // Log to backend
    this.logError(error);
    
    // Handle specific error types
    if (error.message && error.message.includes('ScriptError')) {
      this.handleScriptError(error);
    } else if (!navigator.onLine) {
      this.handleOfflineError(error);
    }
  },
  
  getUserMessage(error) {
    const errorMap = {
      'Task not found': 'This task no longer exists',
      'Permission denied': 'You don\'t have permission to do this',
      'Network error': 'Connection lost. Changes will sync when online',
      'Invalid data': 'Please check your input and try again'
    };
    
    for (const [key, message] of Object.entries(errorMap)) {
      if (error.toString().includes(key)) {
        return message;
      }
    }
    
    return 'Something went wrong. Please try again.';
  },
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${this.getToastIcon(type)}"></i>
      <span>${message}</span>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || icons.info;
  },
  
  logError(error) {
    if (navigator.onLine) {
      google.script.run.appsheet_logError({
        error: error.toString(),
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        view: APP.state.currentView
      });
    }
  }
};
```

### 4.7 Offline Support

```javascript
const OfflineManager = {
  init() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Check initial state
    if (!navigator.onLine) {
      this.handleOffline();
    }
  },
  
  handleOnline() {
    APP.state.isOnline = true;
    document.body.classList.remove('offline');
    this.showToast('Back online! Syncing changes...', 'success');
    
    // Process any queued actions
    this.syncQueuedActions();
  },
  
  handleOffline() {
    APP.state.isOnline = false;
    document.body.classList.add('offline');
    this.showToast('You\'re offline. Changes will sync when connected.', 'warning');
  },
  
  queueAction(action) {
    // Store in localStorage
    const queue = JSON.parse(localStorage.getItem('actionQueue') || '[]');
    queue.push({
      ...action,
      timestamp: Date.now(),
      id: this.generateId()
    });
    localStorage.setItem('actionQueue', JSON.stringify(queue));
    
    // Also keep in memory
    APP.state.pendingActions.push(action);
  },
  
  syncQueuedActions() {
    const queue = JSON.parse(localStorage.getItem('actionQueue') || '[]');
    
    queue.forEach(action => {
      google.script.run
        .withSuccessHandler(() => {
          this.removeFromQueue(action.id);
        })
        .withFailureHandler(() => {
          // Keep in queue for retry
        })
        [action.method](action.params);
    });
  },
  
  removeFromQueue(actionId) {
    const queue = JSON.parse(localStorage.getItem('actionQueue') || '[]');
    const filtered = queue.filter(a => a.id !== actionId);
    localStorage.setItem('actionQueue', JSON.stringify(filtered));
  }
};
```

### 4.8 Performance Optimizations

```javascript
// Debounce search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const searchTasks = debounce((query) => {
  APP.state.filters.search = query;
  APP.filterTasks();
}, 300);

// Virtual scrolling for large lists
class VirtualScroller {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight);
    this.scrollTop = 0;
    this.startIndex = 0;
    
    this.init();
  }
  
  init() {
    this.container.addEventListener('scroll', this.onScroll.bind(this));
    this.render();
  }
  
  onScroll() {
    this.scrollTop = this.container.scrollTop;
    this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
    this.render();
  }
  
  render() {
    const endIndex = this.startIndex + this.visibleItems + 1;
    const visibleItems = this.items.slice(this.startIndex, endIndex);
    
    // Clear and render only visible items
    this.container.innerHTML = '';
    
    // Add spacer for scrolled items
    const spacer = document.createElement('div');
    spacer.style.height = `${this.startIndex * this.itemHeight}px`;
    this.container.appendChild(spacer);
    
    // Render visible items
    visibleItems.forEach(item => {
      const element = this.renderItem(item);
      this.container.appendChild(element);
    });
  }
}

// Request batching
class RequestBatcher {
  constructor(batchSize = 10, delay = 100) {
    this.queue = [];
    this.batchSize = batchSize;
    this.delay = delay;
    this.timeout = null;
  }
  
  add(request) {
    this.queue.push(request);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }
  
  scheduleFlush() {
    if (this.timeout) return;
    
    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }
  
  flush() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    google.script.run
      .withSuccessHandler(this.handleBatchResponse.bind(this))
      .withFailureHandler(this.handleBatchError.bind(this))
      .appsheet_processBatch(batch);
    
    clearTimeout(this.timeout);
    this.timeout = null;
  }
}
```

---

## 5. BUSINESS LOGIC IMPLEMENTATION

### 5.1 Completion Probability Calculation
```javascript
function calculateCompletionProbability(tasks, currentEnergy) {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(17, 0, 0, 0); // 5 PM
  
  const remainingHours = (endOfDay - now) / (1000 * 60 * 60);
  const remainingMinutes = remainingHours * 60;
  
  // Calculate total required minutes
  const totalRequired = tasks
    .filter(t => t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS')
    .reduce((sum, task) => sum + (task.estimated_minutes || 30), 0);
  
  // Calculate energy factor
  const energyFactor = currentEnergy ? (currentEnergy.energy_level / 10) : 0.5;
  
  // Calculate focus factor
  const focusFactor = currentEnergy ? (currentEnergy.focus_level / 10) : 0.5;
  
  // Calculate stress penalty
  const stressPenalty = currentEnergy ? (1 - (currentEnergy.stress_level / 20)) : 0.8;
  
  // Calculate probability
  const timeRatio = Math.min(remainingMinutes / totalRequired, 1);
  const probability = timeRatio * energyFactor * focusFactor * stressPenalty;
  
  return Math.round(probability * 100);
}
```

### 5.2 Energy-Based Task Filtering
```javascript
function filterTasksByEnergy(tasks, energyLevel) {
  const energyMap = {
    CRITICAL: 9,
    HIGH: 7,
    MEDIUM: 5,
    LOW: 3,
    RECOVERY: 1
  };
  
  return tasks.filter(task => {
    const required = energyMap[task.energy_required] || 5;
    return energyLevel >= required;
  });
}
```

### 5.3 Smart Snooze Duration
```javascript
function calculateSnoozeDuration(task) {
  const now = new Date();
  const hour = now.getHours();
  
  // If morning and low energy task, snooze to afternoon
  if (hour < 12 && task.energy_required === 'LOW') {
    return 240; // 4 hours
  }
  
  // If late afternoon and high energy, snooze to tomorrow
  if (hour > 15 && task.energy_required === 'HIGH') {
    return 960; // 16 hours (next morning)
  }
  
  // Default based on priority
  const snoozeMap = {
    CRITICAL: 15,
    URGENT: 30,
    HIGH: 60,
    MEDIUM: 120,
    LOW: 240,
    MINIMAL: 1440 // Next day
  };
  
  return snoozeMap[task.priority] || 60;
}
```

### 5.4 Confidence Score Interpretation
```javascript
function getConfidenceInterpretation(score) {
  if (score >= 90) return { text: 'Very High', color: '#48bb78', action: 'auto-approve' };
  if (score >= 75) return { text: 'High', color: '#68d391', action: 'likely-approve' };
  if (score >= 60) return { text: 'Moderate', color: '#f6e05e', action: 'review' };
  if (score >= 40) return { text: 'Low', color: '#f6ad55', action: 'likely-reject' };
  return { text: 'Very Low', color: '#fc8181', action: 'auto-reject' };
}
```

---

## 6. CSS STYLING REQUIREMENTS

### 6.1 CSS Variables (Place in <style> tag)
```css
:root {
  /* Colors */
  --primary: #667eea;
  --primary-dark: #5a67d8;
  --success: #48bb78;
  --warning: #ed8936;
  --danger: #f56565;
  --info: #4299e1;
  --dark: #2d3748;
  --light: #f7fafc;
  --muted: #a0aec0;
  
  /* Priority Colors */
  --priority-critical: #f56565;
  --priority-urgent: #fc8181;
  --priority-high: #ed8936;
  --priority-medium: #667eea;
  --priority-low: #48bb78;
  --priority-minimal: #68d391;
  
  /* Lane Colors */
  --lane-ops: #667eea;
  --lane-admin: #4299e1;
  --lane-creative: #9f7aea;
  --lane-client: #f6ad55;
  --lane-growth: #48bb78;
  --lane-deep-focus: #2b6cb0;
  --lane-batch: #38b2ac;
  --lane-communication: #ed64a6;
  --lane-learning: #f687b3;
  --lane-maintenance: #a0aec0;
  --lane-personal: #b794f4;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### 6.2 Mobile-First Responsive Design
```css
/* Mobile First - Base styles */
.container {
  width: 100%;
  padding: var(--spacing-md);
  max-width: 100%;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    max-width: 750px;
    margin: 0 auto;
  }
  
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    max-width: 980px;
  }
  
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-lg);
  }
  
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-lg);
  }
}

/* Large desktop */
@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
  }
}
```

### 6.3 Critical Component Styles
```css
/* Bottom Navigation - Fixed */
#bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  color: var(--muted);
  transition: var(--transition);
  cursor: pointer;
  position: relative;
  border: none;
  background: none;
  font-size: var(--font-size-xs);
}

.nav-tab.active {
  color: var(--primary);
}

.nav-tab i {
  font-size: 20px;
  margin-bottom: 4px;
}

.nav-tab .badge {
  position: absolute;
  top: 2px;
  right: 50%;
  transform: translateX(12px);
  background: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: var(--radius-full);
  min-width: 16px;
  text-align: center;
}

/* Task Cards */
.task-card {
  background: white;
  border-radius: var(--radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow);
  border-left: 4px solid var(--primary);
  transition: var(--transition);
  cursor: pointer;
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.task-card:active {
  transform: scale(0.98);
}

/* Priority-based borders */
.task-card.priority-CRITICAL { border-left-color: var(--priority-critical); }
.task-card.priority-URGENT { border-left-color: var(--priority-urgent); }
.task-card.priority-HIGH { border-left-color: var(--priority-high); }
.task-card.priority-MEDIUM { border-left-color: var(--priority-medium); }
.task-card.priority-LOW { border-left-color: var(--priority-low); }
.task-card.priority-MINIMAL { border-left-color: var(--priority-minimal); }

/* Status states */
.task-card.status-IN_PROGRESS {
  background: linear-gradient(90deg, white 0%, #fef5e7 100%);
  position: relative;
}

.task-card.status-IN_PROGRESS::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--warning) 0%, transparent 100%);
  animation: progress-pulse 2s ease-in-out infinite;
}

@keyframes progress-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.task-card.status-COMPLETED {
  opacity: 0.6;
}

.task-card.status-COMPLETED .task-title {
  text-decoration: line-through;
}

/* Loading States */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 14px;
  margin-bottom: 8px;
}

.skeleton-title {
  height: 20px;
  width: 60%;
  margin-bottom: 12px;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom, 20px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast {
  background: var(--dark);
  color: white;
  padding: 12px 20px;
  border-radius: var(--radius);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slide-up 0.3s ease;
  pointer-events: auto;
  box-shadow: var(--shadow-lg);
}

.toast.toast-success { background: var(--success); }
.toast.toast-error { background: var(--danger); }
.toast.toast-warning { background: var(--warning); }
.toast.toast-info { background: var(--info); }

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast.fade-out {
  animation: fade-out 0.3s ease forwards;
}

@keyframes fade-out {
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* Offline Mode */
body.offline {
  position: relative;
}

body.offline::before {
  content: 'Offline Mode';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--warning);
  color: white;
  text-align: center;
  padding: 4px;
  font-size: var(--font-size-sm);
  z-index: 9999;
}

/* Swipeable Cards */
.swiper-container {
  width: 100%;
  height: 400px;
  padding: 20px 0;
}

.proposal-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Energy Gauges */
.energy-gauge {
  width: 100%;
  height: 80px;
  position: relative;
}

.gauge-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.gauge-value {
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--dark);
}

.gauge-label {
  font-size: var(--font-size-xs);
  color: var(--muted);
}

/* Floating Action Button */
.fab {
  position: fixed;
  bottom: calc(80px + 16px + env(safe-area-inset-bottom, 0px));
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  font-size: 24px;
  z-index: 999;
  transition: var(--transition);
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.fab:active {
  transform: scale(0.95);
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  :root {
    --dark: #f7fafc;
    --light: #1a202c;
    --muted: #718096;
  }
  
  body {
    background: var(--light);
    color: var(--dark);
  }
  
  .task-card,
  .proposal-card,
  #bottom-nav {
    background: #2d3748;
    color: #f7fafc;
  }
}

/* Print Styles */
@media print {
  #bottom-nav,
  .fab,
  .toast-container,
  .task-actions,
  .filters {
    display: none !important;
  }
  
  .task-card {
    page-break-inside: avoid;
  }
}
```

---

## 7. COMPLETE JAVASCRIPT IMPLEMENTATION STRUCTURE

```javascript
// Global App Object
const APP = {
  // Configuration
  config: {
    pollingInterval: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    debounceDelay: 300,
    batchSize: 10,
    cacheExpiry: 300000, // 5 minutes
    autoSaveInterval: 30000
  },
  
  // State Management
  state: {
    currentView: 'dashboard',
    currentUser: 'default',
    isLoading: false,
    isOnline: navigator.onLine,
    lastSync: null,
    lastError: null,
    
    // Data
    tasks: [],
    proposals: [],
    energyHistory: [],
    calendarEvents: [],
    settings: {},
    
    // UI State
    filters: {
      status: null,
      priority: null,
      lane: null,
      search: '',
      dateRange: null
    },
    
    selectedTasks: new Set(),
    openModals: new Set(),
    activeToasts: new Map(),
    
    // Pending Operations
    pendingActions: [],
    optimisticUpdates: new Map()
  },
  
  // Cache Layer
  cache: {
    data: new Map(),
    
    set(key, value, ttl = APP.config.cacheExpiry) {
      this.data.set(key, {
        value: value,
        expires: Date.now() + ttl
      });
    },
    
    get(key) {
      const item = this.data.get(key);
      if (!item) return null;
      
      if (Date.now() > item.expires) {
        this.data.delete(key);
        return null;
      }
      
      return item.value;
    },
    
    clear() {
      this.data.clear();
    }
  },
  
  // Initialization
  init() {
    console.log('Initializing MOH TIME OS...');
    
    // Check authentication
    this.checkAuth();
    
    // Setup core components
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.setupTouchGestures();
    this.setupOfflineHandling();
    
    // Initialize UI components
    this.initializeCalendar();
    this.initializeSwiper();
    this.initializeCharts();
    
    // Load initial data
    this.loadInitialData();
    
    // Start background processes
    this.startPolling();
    this.startAutoSave();
    
    // Show initial view
    this.showView('dashboard');
    
    console.log('Initialization complete');
  },
  
  // View Management
  showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(view => {
      view.classList.remove('active');
    });
    
    // Show selected view
    const view = document.getElementById(`${viewName}-view`);
    if (view) {
      view.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const tab = document.querySelector(`.nav-tab[data-view="${viewName}"]`);
    if (tab) {
      tab.classList.add('active');
    }
    
    // Update state
    this.state.currentView = viewName;
    
    // Load view-specific data
    this[`load${viewName.charAt(0).toUpperCase() + viewName.slice(1)}View`]();
    
    // Track view change
    this.trackEvent('view_change', { view: viewName });
  },
  
  // Data Loading Methods
  loadDashboardView() {
    google.script.run
      .withSuccessHandler(data => {
        this.renderDashboard(data);
      })
      .withFailureHandler(this.handleError)
      .appsheet_getMyDay({ view: 'today' });
  },
  
  loadTasksView() {
    google.script.run
      .withSuccessHandler(data => {
        this.state.tasks = data.tasks;
        this.renderTaskList();
      })
      .withFailureHandler(this.handleError)
      .appsheet_getAllTasks({
        filters: this.state.filters,
        limit: 100
      });
  },
  
  loadCalendarView() {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    
    google.script.run
      .withSuccessHandler(data => {
        this.state.calendarEvents = data.events;
        this.renderCalendar();
      })
      .withFailureHandler(this.handleError)
      .appsheet_getCalendarEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
  },
  
  loadTriageView() {
    google.script.run
      .withSuccessHandler(data => {
        this.state.proposals = data.proposals;
        this.renderTriageQueue();
      })
      .withFailureHandler(this.handleError)
      .appsheet_getProposals({
        status: 'PENDING',
        limit: 20
      });
  },
  
  loadEnergyView() {
    google.script.run
      .withSuccessHandler(data => {
        this.state.energyHistory = data.history;
        this.renderEnergyLog();
      })
      .withFailureHandler(this.handleError)
      .appsheet_getEnergyHistory({
        limit: 30
      });
  },
  
  loadSettingsView() {
    google.script.run
      .withSuccessHandler(data => {
        this.state.settings = data;
        this.renderSettings();
      })
      .withFailureHandler(this.handleError)
      .appsheet_getSettings({
        userId: this.state.currentUser
      });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  APP.init();
});

// Prevent accidental navigation
window.addEventListener('beforeunload', (e) => {
  if (APP.state.pendingActions.length > 0) {
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  }
});
```

---

## 8. TESTING CHECKLIST

### 8.1 Pre-Deployment Verification
- [ ] File created at `/moh-time-os-v2/src/5_web/DayPlanner.html`
- [ ] No TypeScript, React, or Node.js code
- [ ] No package.json or node_modules
- [ ] Single HTML file with embedded CSS/JS
- [ ] All google.script.run calls use exact function names

### 8.2 Functionality Testing
- [ ] Dashboard loads with current data
- [ ] Task creation works
- [ ] Task actions (start, complete, snooze) work
- [ ] Proposals display and can be processed
- [ ] Energy logging saves correctly
- [ ] Settings update successfully
- [ ] Calendar shows events
- [ ] Search and filters work
- [ ] Polling updates data every 30 seconds
- [ ] Offline mode queues actions

### 8.3 Column Name Verification
- [ ] Uses `action_id` NOT `id`
- [ ] Uses `estimated_minutes` NOT `durationMinutes`
- [ ] Uses `scheduled_start` NOT `scheduledStart`
- [ ] Uses `energy_required` NOT `energyRequired`
- [ ] Uses `completed_date` NOT `completedAt`
- [ ] Uses `created_by` NOT `sourceEmail`

### 8.4 Mobile Testing
- [ ] Touch events work
- [ ] Swipe gestures function
- [ ] Viewport scales correctly
- [ ] Bottom nav doesn't overlap content
- [ ] Modals are accessible
- [ ] Keyboard doesn't break layout

### 8.5 Performance Verification
- [ ] Initial load < 3 seconds
- [ ] No memory leaks after 30 minutes
- [ ] Smooth scrolling with 100+ tasks
- [ ] Charts render without lag
- [ ] No console errors

---

## 9. DEPLOYMENT STEPS

1. **Verify Container-Bound Setup**
   ```
   - Open Google Apps Script editor
   - Confirm script is bound to existing spreadsheet
   - Verify AppSheetBridge.gs exists
   ```

2. **Create HTML File**
   ```
   - Create new HTML file: /src/5_web/DayPlanner.html
   - Copy complete HTML structure
   - Save file
   ```

3. **Update doGet Function**
   ```javascript
   function doGet(e) {
     const token = e.parameter.auth;
     
     // Validate token
     if (!appsheet_validateToken({ token: token })) {
       return HtmlService.createHtmlOutput('Unauthorized');
     }
     
     // Serve HTML
     return HtmlService.createHtmlOutputFromFile('5_web/DayPlanner')
       .setTitle('MOH TIME OS')
       .setSandboxMode(HtmlService.SandboxMode.IFRAME)
       .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
   }
   ```

4. **Deploy Web App**
   ```
   - Deploy > New Deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Deploy
   ```

5. **Test URL**
   ```
   https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec?auth=[TOKEN]
   ```

---

## 10. FINAL VERIFICATION

### THIS IMPLEMENTATION IS CORRECT IF:
✅ Only ONE file created: `DayPlanner.html`  
✅ NO new spreadsheets created  
✅ All data from EXISTING spreadsheet  
✅ All calls use `google.script.run`  
✅ Column names match EXACTLY  
✅ Works immediately when deployed  
✅ All 31 services accessible via backend  
✅ All 20+ backend functions callable  

### THIS IMPLEMENTATION IS WRONG IF:
❌ Created React/Node.js app  
❌ Created package.json  
❌ Used fetch() or REST APIs  
❌ Created new spreadsheet  
❌ Used wrong column names  
❌ Required npm install  
❌ Needs external hosting  
❌ Bypassed existing services  

---

## 11. STUB FUNCTIONS FOR UI TESTING

**IMPORTANT:** Add these stub functions to AppSheetBridge.gs temporarily while building the UI. They return mock data matching the expected schemas.

```javascript
// TEMPORARY STUB FUNCTIONS - Replace with real implementations later
// These allow the UI to be built and tested immediately

// Stub: Get dashboard data
function appsheet_getMyDay(params) {
  return {
    counts: {
      todayTasks: 8,
      completedToday: 3,
      inProgress: 1,
      proposals: 5
    },
    currentEnergy: {
      energy_level: 7,
      focus_level: 8,
      stress_level: 3,
      mood: 'FOCUSED'
    },
    highPriorityTasks: [
      {
        action_id: 'ACT_001',
        title: 'Review Q4 Budget',
        priority: 'HIGH',
        status: 'SCHEDULED',
        estimated_minutes: 45,
        lane: 'admin',
        scheduled_start: new Date().toISOString()
      }
    ],
    todaySchedule: [],
    completionProbability: 75
  };
}

// Stub: Get all tasks
function appsheet_getAllTasks(params) {
  return {
    tasks: [
      {
        action_id: 'ACT_001',
        title: 'Sample Task 1',
        priority: 'HIGH',
        status: 'SCHEDULED',
        lane: 'ops',
        estimated_minutes: 30,
        energy_required: 'MEDIUM',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        action_id: 'ACT_002',
        title: 'Sample Task 2',
        priority: 'MEDIUM',
        status: 'PENDING',
        lane: 'admin',
        estimated_minutes: 60,
        energy_required: 'HIGH',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    total: 2
  };
}

// Stub: Create new task
function appsheet_createTask(taskData) {
  return {
    action_id: 'ACT_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    status: 'PENDING',
    priority: taskData.priority || 'MEDIUM',
    title: taskData.title,
    lane: taskData.lane || 'ops',
    estimated_minutes: taskData.estimated_minutes || 30,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'webapp'
  };
}

// Stub: Start a task
function appsheet_startTask(params) {
  return {
    success: true,
    task: {
      action_id: params.taskId,
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString()
    }
  };
}

// Stub: Complete a task
function appsheet_completeTask(params) {
  return {
    success: true,
    task: {
      action_id: params.taskId,
      status: 'COMPLETED',
      completed_date: new Date().toISOString(),
      actual_minutes: params.actualMinutes
    }
  };
}

// Stub: Snooze a task
function appsheet_snoozeTask(params) {
  return {
    success: true,
    task: {
      action_id: params.taskId,
      snoozed_until: new Date(Date.now() + params.minutes * 60000).toISOString()
    }
  };
}

// Stub: Cancel a task
function appsheet_cancelTask(params) {
  return {
    success: true,
    task: {
      action_id: params.taskId,
      status: 'CANCELLED'
    }
  };
}

// Stub: Archive a task
function appsheet_archiveTask(params) {
  return {
    success: true,
    task: {
      action_id: params.taskId,
      status: 'ARCHIVED'
    }
  };
}

// Stub: Reschedule a task
function appsheet_rescheduleTask(params) {
  return {
    success: true,
    task: {
      action_id: params.taskId,
      scheduled_start: params.newStart,
      scheduled_end: params.newEnd
    }
  };
}

// Stub: Get high priority tasks
function appsheet_getHighPriorityTasks(params) {
  return {
    tasks: [
      {
        action_id: 'ACT_HP1',
        title: 'Critical Task',
        priority: 'CRITICAL',
        status: 'SCHEDULED',
        estimated_minutes: 60,
        lane: 'ops'
      }
    ]
  };
}

// Stub: Get proposals
function appsheet_getProposals(params) {
  return {
    proposals: [
      {
        proposal_id: 'PROP_001',
        sender_email: 'client@example.com',
        extracted_title: 'Update project status report',
        suggested_priority: 'HIGH',
        suggested_lane: 'client',
        suggested_duration: 30,
        confidence_score: 85,
        status: 'PENDING'
      }
    ]
  };
}

// Stub: Get pending proposals count
function appsheet_getPendingProposalsCount() {
  return 5;
}

// Stub: Process proposal
function appsheet_processProposal(params) {
  return {
    success: true,
    action: params.action,
    proposal_id: params.proposalId,
    created_task_id: params.action === 'approve' ? 'ACT_NEW_001' : null
  };
}

// Stub: Log energy state
function appsheet_logEnergyState(params) {
  return {
    success: true,
    state_id: 'HS_' + Date.now(),
    timestamp: new Date().toISOString(),
    energy_level: params.energy_level,
    focus_level: params.focus_level,
    stress_level: params.stress_level,
    mood: params.mood
  };
}

// Stub: Get energy history
function appsheet_getEnergyHistory(params) {
  return {
    history: [
      {
        state_id: 'HS_001',
        timestamp: new Date().toISOString(),
        energy_level: 7,
        focus_level: 8,
        stress_level: 3,
        mood: 'FOCUSED'
      }
    ]
  };
}

// Stub: Get calendar events
function appsheet_getCalendarEvents(params) {
  return {
    events: [
      {
        projection_id: 'CP_001',
        task_id: 'ACT_001',
        start_time: params.startDate,
        end_time: params.endDate,
        title: 'Sample Calendar Event'
      }
    ]
  };
}

// Stub: Get settings
function appsheet_getSettings(params) {
  return {
    autoApproveThreshold: 90,
    emailProcessingFrequency: 15,
    defaultTaskDuration: 45,
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    syncToGoogleCalendar: true,
    blockFocusTime: true,
    notifyTaskStart: true,
    notifyTriageQueue: true,
    notifyDailySummary: false
  };
}

// Stub: Update settings
function appsheet_updateSettings(params) {
  return {
    success: true,
    settings: params.settings
  };
}

// Stub: Get batch data for efficient loading
function appsheet_getBatchData(params) {
  return {
    tasks: appsheet_getAllTasks({}).tasks,
    proposals: appsheet_getProposals({}).proposals,
    energyHistory: appsheet_getEnergyHistory({}).history,
    calendarEvents: [],
    settings: appsheet_getSettings({}),
    lastSync: new Date().toISOString()
  };
}

// Stub: Validate token
function appsheet_validateToken(params) {
  return true;
}
```

---

## 12. COMPLETE LIST OF ALL 31 REGISTERED SERVICES

**These services are ALREADY registered in container. Access via: `container.get(SERVICES.ServiceName)`**

```javascript
const SERVICES = Object.freeze({
  // Core infrastructure (7 services)
  PersistentStore: 'PersistentStore',           // Key-value storage across executions
  CrossExecutionCache: 'CrossExecutionCache',   // Cache that survives between runs
  ErrorHandler: 'ErrorHandler',                 // Centralized error handling
  SmartLogger: 'SmartLogger',                   // Intelligent logging with levels
  ConfigManager: 'ConfigManager',               // System configuration management
  BatchOperations: 'BatchOperations',           // Batch read/write to sheets
  DistributedLockManager: 'DistributedLockManager', // Prevent concurrent modifications
  
  // Application services (10 services)
  IntelligentScheduler: 'IntelligentScheduler', // AI-powered task scheduling
  EmailIngestionEngine: 'EmailIngestionEngine', // Process emails to tasks
  ChatEngine: 'ChatEngine',                     // Chat-based task creation
  CalendarSyncManager: 'CalendarSyncManager',   // Google Calendar integration
  FoundationBlocksManager: 'FoundationBlocksManager', // Recurring commitments
  HumanStateManager: 'HumanStateManager',       // Track energy/mood states
  SenderReputationManager: 'SenderReputationManager', // Email sender trust
  ArchiveManager: 'ArchiveManager',             // Archive old tasks/proposals
  DynamicLaneManager: 'DynamicLaneManager',     // Manage task lanes
  SystemManager: 'SystemManager',               // System health monitoring
  
  // Web and external interfaces (5 services)
  WebAppManager: 'WebAppManager',               // Web app request handling
  AppSheetBridge: 'AppSheetBridge',             // AppSheet integration
  TriggerOrchestrator: 'TriggerOrchestrator',   // Manage time triggers
  SecureWebAppAuth: 'SecureWebAppAuth',         // Token authentication
  ZeroTrustTriageEngine: 'ZeroTrustTriageEngine', // Email triage engine
  
  // Business Logic Services (2 services)
  BusinessLogicValidation: 'BusinessLogicValidation', // Validate business rules
  AuditProtocol: 'AuditProtocol',               // Audit trail management
  
  // Testing services (3 services - DO NOT USE IN PRODUCTION)
  MockService: 'MockService',                   // Mock service for testing
  TestSeeder: 'TestSeeder',                     // Seed test data
  MockBatchOperations: 'MockBatchOperations',   // Mock batch operations
  
  // External circuit breakers (4 services)
  EXTERNAL_CALENDAR: 'calendar',                // Google Calendar circuit breaker
  EXTERNAL_GMAIL: 'gmail',                       // Gmail circuit breaker
  EXTERNAL_SHEETS: 'sheets',                     // Sheets circuit breaker
  EXTERNAL_DRIVE: 'drive'                        // Drive circuit breaker
});
```

---

## 13. COMPLETE LIST OF ALL SHEET NAMES

**These sheets ALREADY exist in the spreadsheet. Access via: `SHEET_NAMES.SheetName`**

```javascript
const SHEET_NAMES = Object.freeze({
  // Primary operational sheets
  ACTIONS: 'ACTIONS',                           // Main task storage
  PROPOSED_TASKS: 'PROPOSED_TASKS',             // Email proposals queue
  CALENDAR_PROJECTION: 'CALENDAR_PROJECTION',   // Calendar sync data
  
  // Configuration and settings
  FOUNDATION_BLOCKS: 'FOUNDATION_BLOCKS',       // Recurring commitments
  APPSHEET_CONFIG: 'APPSHEET_CONFIG',           // System configuration
  HUMAN_STATE: 'HUMAN_STATE',                   // Energy/mood tracking
  
  // Support sheets
  SENDER_REPUTATION: 'SENDER_REPUTATION',       // Email sender scores
  TIME_BLOCKS: 'TIME_BLOCKS',                   // Time block definitions
  LANES: 'LANES',                                // Lane configurations
  CHAT_QUEUE: 'CHAT_QUEUE',                     // Chat integration queue
  
  // Logging and monitoring
  ACTIVITY: 'ACTIVITY',                         // Audit log
  STATUS: 'STATUS',                              // System status metrics
  
  // Archive sheets (auto-created)
  ACTIONS_ARCHIVE: 'ACTIONS_ARCHIVE',           // Archived tasks
  PROPOSED_ARCHIVE: 'PROPOSED_ARCHIVE',         // Archived proposals
  ACTIVITY_ARCHIVE: 'ACTIVITY_ARCHIVE',         // Archived logs
  
  // Dependencies and relationships
  DEPENDENCIES: 'Dependencies',                  // Task dependencies
  
  // Temporary sheets (for atomic operations)
  ACTIONS_TEMP: 'ACTIONS_TEMP',                 // Atomic task operations
  PROPOSED_TEMP: 'PROPOSED_TEMP',               // Atomic proposal operations
  CALENDAR_TEMP: 'CALENDAR_TEMP'                // Atomic calendar operations
});
```

---

## 14. COMPLETE LIST OF ALL ENUMS

**These enums are ALREADY defined. Use these exact values in the UI:**

```javascript
// Task Status - Complete lifecycle
const STATUS = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS', 
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
  SCHEDULED: 'SCHEDULED',
  PENDING: 'PENDING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
  DEFERRED: 'DEFERRED',
  ARCHIVED: 'ARCHIVED'
});

// Priority Levels
const PRIORITY = Object.freeze({
  CRITICAL: 'CRITICAL',    // Urgent + Important, blocking
  URGENT: 'URGENT',        // Time-sensitive
  HIGH: 'HIGH',            // Important but not urgent
  MEDIUM: 'MEDIUM',        // Standard priority
  LOW: 'LOW',              // Nice to have
  MINIMAL: 'MINIMAL'       // Background tasks
});

// Task Lanes
const LANE = Object.freeze({
  // Core business lanes
  OPERATIONAL: 'ops',
  ADMIN: 'admin',
  CREATIVE: 'creative',
  CLIENT: 'client',
  GROWTH: 'growth',
  
  // Specialized work modes
  DEEP_FOCUS: 'deep_focus',
  BATCH: 'batch',
  COMMUNICATION: 'communication',
  LEARNING: 'learning',
  MAINTENANCE: 'maintenance',
  
  // Energy-based lanes
  HIGH_ENERGY: 'high_energy',
  LOW_ENERGY: 'low_energy',
  SOCIAL: 'social',
  SOLO: 'solo'
});

// Energy Levels
const ENERGY_LEVEL = Object.freeze({
  CRITICAL: 'CRITICAL',    // Maximum energy required
  HIGH: 'HIGH',            // High energy/focus needed
  MEDIUM: 'MEDIUM',        // Moderate energy
  LOW: 'LOW',              // Minimal energy required
  RECOVERY: 'RECOVERY'     // Restorative activities
});

// Focus Requirements
const FOCUS_LEVEL = Object.freeze({
  INTENSE: 'INTENSE',      // Deep, uninterrupted focus
  HIGH: 'HIGH',            // Concentrated attention
  MEDIUM: 'MEDIUM',        // Standard focus
  LOW: 'LOW',              // Light attention
  BACKGROUND: 'BACKGROUND' // Can be done while distracted
});

// Mood States
const MOOD = Object.freeze({
  ENERGETIC: 'ENERGETIC',
  MOTIVATED: 'MOTIVATED',
  FOCUSED: 'FOCUSED',
  CALM: 'CALM',
  NEUTRAL: 'NEUTRAL',
  TIRED: 'TIRED',
  STRESSED: 'STRESSED',
  DISTRACTED: 'DISTRACTED',
  OVERWHELMED: 'OVERWHELMED',
  FRUSTRATED: 'FRUSTRATED'
});

// Stress Levels
const STRESS_LEVEL = Object.freeze({
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  VERY_HIGH: 'VERY_HIGH',
  CRITICAL: 'CRITICAL'
});

// Task Sources
const SOURCE = Object.freeze({
  WEBAPP: 'webapp',
  EMAIL: 'email',
  MANUAL: 'manual',
  CHAT: 'chat',
  API: 'api',
  APPSHEET: 'appsheet',
  RECURRING: 'recurring'
});
```

---

## 15. REMOTE CONTROL FUNCTIONS

**These functions are available via RemoteControl.gs for system management:**

```javascript
// Remote control commands - callable via URL parameters
START()           // Start all triggers
STOP()            // Stop all triggers  
RESET()           // Reset system state
EMAIL()           // Process emails manually
SCHEDULE()        // Run scheduling manually
SYNC()            // Sync calendars manually
FIX()             // Run sheet healer
CHECK()           // Health check
TEST()            // Run test suite
GET_STATUS()      // Get system status
CONFIG(key, val)  // Update configuration
BACKUP()          // Backup data
INSTALL()         // Install triggers
UNINSTALL()       // Remove triggers
LIST()            // List all services

// Example usage in doGet:
// ?action=START - starts all triggers
// ?action=CONFIG&key=autoApprove&value=true - updates config
```

---

## 16. EXACT doGet FUNCTION IMPLEMENTATION

**This is the EXACT doGet function that serves the HTML:**

```javascript
function doGet(e) {
  try {
    // Check if this is a remote control command
    if (e.parameter.action) {
      return handleRemoteControl(e);
    }
    
    // Check for auth token
    const token = e.parameter.auth;
    
    if (!token) {
      return HtmlService.createHtmlOutput(`
        <div style="font-family: monospace; padding: 20px;">
          <h2>MOH TIME OS - Authentication Required</h2>
          <p>Missing authentication token.</p>
          <p>Access URL format: ${ScriptApp.getService().getUrl()}?auth=YOUR_TOKEN</p>
          <p>To generate a token, run generateAuthToken() in Apps Script console.</p>
        </div>
      `);
    }
    
    // Validate token using SecureWebAppAuth service
    try {
      const auth = container.get(SERVICES.SecureWebAppAuth);
      const isValid = auth.validateToken(token);
      
      if (!isValid) {
        return HtmlService.createHtmlOutput(`
          <div style="font-family: monospace; padding: 20px; color: red;">
            <h2>Authentication Failed</h2>
            <p>Invalid or expired token.</p>
          </div>
        `);
      }
    } catch (authError) {
      // If SecureWebAppAuth not available, check basic token
      if (token !== PropertiesService.getScriptProperties().getProperty('WEB_AUTH_TOKEN')) {
        return HtmlService.createHtmlOutput('Invalid token');
      }
    }
    
    // Serve the HTML file
    const htmlOutput = HtmlService.createHtmlOutputFromFile('5_web/DayPlanner')
      .setTitle('MOH TIME OS')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    
    return htmlOutput;
    
  } catch (error) {
    console.error('doGet error:', error);
    return HtmlService.createHtmlOutput(`
      <div style="font-family: monospace; padding: 20px; color: red;">
        <h2>System Error</h2>
        <p>${error.toString()}</p>
        <p>Check logs for details.</p>
      </div>
    `);
  }
}

// Generate authentication token (run manually in Apps Script)
function generateAuthToken() {
  const token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('WEB_AUTH_TOKEN', token);
  
  const url = ScriptApp.getService().getUrl();
  console.log('==========================================');
  console.log('MOH TIME OS - Authentication Token Generated');
  console.log('==========================================');
  console.log('Token:', token);
  console.log('Access URL:', url + '?auth=' + token);
  console.log('==========================================');
  
  return {
    token: token,
    url: url + '?auth=' + token
  };
}
```

---

## 17. CRITICAL ERROR CLASSES

**These error classes are used throughout the system:**

```javascript
// Base error class
class BaseError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Specific error types
class BusinessLogicError extends BaseError {
  constructor(message, code = 'BUSINESS_LOGIC_ERROR', details = {}) {
    super(message, code, details);
  }
}

class SchedulingError extends BaseError {
  constructor(message, code = 'SCHEDULING_ERROR', details = {}) {
    super(message, code, details);
  }
}

class TriageError extends BaseError {
  constructor(message, code = 'TRIAGE_ERROR', details = {}) {
    super(message, code, details);
  }
}

class ValidationError extends BaseError {
  constructor(message, code = 'VALIDATION_ERROR', details = {}) {
    super(message, code, details);
  }
}

// Usage in UI error handling
function handleError(error) {
  if (error instanceof BusinessLogicError) {
    // Handle business logic errors
    showToast('Business rule violation: ' + error.message, 'warning');
  } else if (error instanceof SchedulingError) {
    // Handle scheduling errors
    showToast('Scheduling failed: ' + error.message, 'error');
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    showFormErrors(error.details);
  } else {
    // Generic error
    showToast('An error occurred: ' + error.message, 'error');
  }
}
```

---

## 18. TRIGGER CONFIGURATION

**The system uses these triggers (managed by TriggerOrchestrator):**

```javascript
const TRIGGERS = {
  // Email processing - every 15 minutes
  emailProcessor: {
    function: 'processEmailsTrigger',
    type: 'time',
    interval: 15,  // minutes
    enabled: true
  },
  
  // Scheduling - every 30 minutes
  scheduler: {
    function: 'runSchedulingTrigger',
    type: 'time',
    interval: 30,  // minutes
    enabled: true
  },
  
  // Calendar sync - every hour
  calendarSync: {
    function: 'syncCalendarTrigger',
    type: 'time',
    interval: 60,  // minutes
    enabled: true
  },
  
  // Daily summary - at 6 PM
  dailySummary: {
    function: 'sendDailySummaryTrigger',
    type: 'daily',
    hour: 18,      // 6 PM
    enabled: true
  },
  
  // Archive old data - weekly on Sunday at 2 AM
  archiver: {
    function: 'archiveOldDataTrigger',
    type: 'weekly',
    dayOfWeek: 1,  // Sunday
    hour: 2,       // 2 AM
    enabled: true
  }
};
```

---

## 19. COMPLETE SYSTEM INITIALIZATION

**The system initializes in this exact sequence:**

```javascript
function completeSetup() {
  const phases = [
    'Container Setup',        // Phase 1
    'Sheet Healing',          // Phase 2
    'Service Registration',   // Phase 3
    'Service Validation',     // Phase 4
    'Trigger Installation'    // Phase 5
  ];
  
  // The system will:
  // 1. Validate environment
  // 2. Heal/create missing sheets
  // 3. Register all 31 services
  // 4. Validate service dependencies
  // 5. Install time-based triggers
  
  // This is called once during initial setup
  // DO NOT call this from the UI
}
```

---

## 20. MISSING CRITICAL DETAILS - MUST READ

### 20.1 EXACT FILE PATH
**CREATE THIS EXACT FILE:**
```
/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/5_web/DayPlanner.html
```
- Full absolute path from root
- Must be in src/5_web/ folder
- Must be named exactly "DayPlanner.html"
- Case sensitive

### 20.2 DATE/TIME HANDLING
```javascript
// ALWAYS use ISO 8601 format for storage
const isoString = new Date().toISOString(); // 2025-01-03T12:34:56.789Z

// Display formatting
function formatDateTime(isoString) {
  const date = new Date(isoString);
  // Use user's local timezone for display
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Get script timezone
const scriptTimezone = Session.getScriptTimeZone(); // e.g., "America/New_York"

// Working hours should use script timezone
const workStart = new Date();
workStart.setHours(9, 0, 0, 0); // 9 AM in script timezone

// IMPORTANT: All date comparisons use UTC milliseconds
const isOverdue = new Date(task.deadline).getTime() < Date.now();
```

### 20.3 JSON COLUMN PARSING
```javascript
// READING JSON columns
const task = getAllTasks()[0];
const dependencies = JSON.parse(task.dependencies || '[]'); // Array of task IDs
const tags = JSON.parse(task.tags || '[]'); // Array of strings

// WRITING JSON columns
const newTask = {
  dependencies: JSON.stringify(['ACT_001', 'ACT_002']),
  tags: JSON.stringify(['urgent', 'client-work'])
};

// Calendar attendees
const event = {
  attendees: JSON.stringify([
    { email: 'user@example.com', name: 'User Name' }
  ])
};
```

### 20.4 USER CONTEXT HANDLING
```javascript
// Backend (in AppSheetBridge.gs)
function getCurrentUser() {
  return {
    email: Session.getActiveUser().getEmail(),
    timezone: Session.getScriptTimeZone(),
    locale: Session.getActiveUserLocale()
  };
}

// Frontend (in DayPlanner.html)
let currentUser = null;

function loadUserContext() {
  google.script.run
    .withSuccessHandler(function(user) {
      currentUser = user;
      document.getElementById('user-email').textContent = user.email;
    })
    .getCurrentUser();
}
```

### 20.5 PROPERTIESSERVICE KEYS
```javascript
// System Properties (ScriptProperties)
const SCRIPT_PROPS = {
  'WEB_AUTH_TOKEN': 'uuid-token-here',
  'SYSTEM_EMAIL': 'system@domain.com',
  'AUTO_APPROVE_THRESHOLD': '0.9',
  'EMAIL_PROCESSING_ENABLED': 'true',
  'SCHEDULING_ENABLED': 'true',
  'CALENDAR_SYNC_ENABLED': 'true',
  'MAX_TASKS_PER_DAY': '20',
  'DEFAULT_TASK_DURATION': '45',
  'WORK_START_HOUR': '9',
  'WORK_END_HOUR': '17',
  'OPENAI_API_KEY': 'sk-...',
  'ANTHROPIC_API_KEY': 'sk-ant-...'
};

// User Properties (UserProperties)
const USER_PROPS = {
  'preferred_lane': 'ops',
  'default_priority': 'MEDIUM',
  'notification_email': 'user@example.com',
  'theme': 'light',
  'polling_interval': '30000'
};

// Document Properties (DocumentProperties)
const DOC_PROPS = {
  'last_email_check': '2025-01-03T12:00:00Z',
  'last_schedule_run': '2025-01-03T11:30:00Z',
  'last_calendar_sync': '2025-01-03T11:00:00Z',
  'system_version': '2.0',
  'installation_date': '2025-01-01T00:00:00Z'
};
```

### 20.6 GOOGLE APPS SCRIPT LIMITS
```javascript
// Critical Limits to Respect
const GAS_LIMITS = {
  EXECUTION_TIME: 360000, // 6 minutes max per execution
  URL_FETCH_SIZE: 50 * 1024 * 1024, // 50MB
  PROPERTIES_VALUE_SIZE: 9216, // 9KB per value
  PROPERTIES_TOTAL_SIZE: 512000, // 500KB total
  CACHE_VALUE_SIZE: 100 * 1024, // 100KB per cached item
  CACHE_EXPIRY_MAX: 21600, // 6 hours max
  HTML_SERVICE_SIZE: 50 * 1024 * 1024, // 50MB for HTML output
  SPREADSHEET_CELLS: 10000000, // 10 million cells per spreadsheet
  SHEET_ROWS: 1000000, // 1 million rows per sheet
  BATCH_SIZE: 500, // Recommended batch size for operations
  TRIGGERS_MAX: 20, // Maximum installable triggers
  CONCURRENT_USERS: 30 // For web apps
};

// Implement pagination for large datasets
function getPaginatedTasks(offset = 0, limit = 100) {
  const allTasks = batchOps.getAllActions();
  return {
    tasks: allTasks.slice(offset, offset + limit),
    total: allTasks.length,
    hasMore: (offset + limit) < allTasks.length
  };
}
```

### 20.7 MISSING SHEET COLUMNS DETAIL

#### TIME_BLOCKS Sheet
```javascript
const TIME_BLOCKS_COLUMNS = {
  'block_id': 0,         // TB_xxxxx format
  'block_name': 1,       // Display name
  'block_type': 2,       // FOCUS, MEETING, BREAK, LUNCH, PERSONAL
  'start_time': 3,       // HH:MM format (e.g., "09:00")
  'end_time': 4,         // HH:MM format (e.g., "10:30")
  'days_of_week': 5,     // JSON array ["MON", "TUE", "WED"]
  'recurring': 6,        // TRUE/FALSE
  'protected': 7,        // Cannot be scheduled over
  'energy_required': 8,  // CRITICAL, HIGH, MEDIUM, LOW
  'lane_preference': 9,  // Preferred lane for this time
  'max_tasks': 10,       // Maximum tasks in this block
  'color': 11            // Hex color for display
};
```

#### LANES Sheet
```javascript
const LANES_COLUMNS = {
  'lane_id': 0,          // Lane identifier (matches LANE enum)
  'lane_name': 1,        // Display name
  'display_name': 2,     // UI friendly name
  'energy_required': 3,  // Default energy level
  'focus_required': 4,   // Default focus level
  'time_preference': 5,  // MORNING, AFTERNOON, EVENING, ANYTIME
  'batch_compatible': 6, // TRUE/FALSE - can batch these tasks
  'max_duration': 7,     // Max minutes per session
  'min_duration': 8,     // Min minutes per session
  'color': 9,            // Hex color for UI (#667eea)
  'icon': 10,            // Font Awesome icon class (fa-folder)
  'sort_order': 11,      // Display order (1, 2, 3...)
  'active': 12           // TRUE/FALSE
};
```

#### CHAT_QUEUE Sheet
```javascript
const CHAT_QUEUE_COLUMNS = {
  'message_id': 0,       // CHAT_xxxxx format
  'timestamp': 1,        // ISO timestamp
  'sender': 2,           // Sender identifier
  'message': 3,          // Chat message text
  'parsed_intent': 4,    // CREATE_TASK, UPDATE_TASK, QUERY, etc.
  'extracted_data': 5,   // JSON with extracted task data
  'confidence': 6,       // 0-100 confidence score
  'status': 7,           // PENDING, PROCESSED, FAILED
  'created_task_id': 8,  // If task was created
  'error': 9             // Error message if failed
};
```

#### STATUS Sheet (System Metrics)
```javascript
const STATUS_COLUMNS = {
  'metric_id': 0,        // Unique metric ID
  'metric_name': 1,      // Name of metric
  'metric_value': 2,     // Current value
  'metric_type': 3,      // COUNTER, GAUGE, HISTOGRAM
  'updated_at': 4,       // Last updated
  'description': 5       // Metric description
};

// Common metrics stored
const SYSTEM_METRICS = {
  'tasks_created_today': 0,
  'tasks_completed_today': 0,
  'emails_processed': 0,
  'proposals_pending': 0,
  'active_users': 0,
  'system_uptime': 0,
  'last_error_time': '',
  'trigger_success_rate': 100,
  'average_task_duration': 45,
  'cache_hit_rate': 0
};
```

### 20.8 EMPTY STATE MESSAGES
```javascript
const EMPTY_STATES = {
  dashboard: {
    icon: 'fa-coffee',
    title: 'Ready to start your day!',
    message: 'No tasks scheduled for today. Create your first task or process emails to get started.',
    action: 'Create Task'
  },
  tasks: {
    icon: 'fa-inbox',
    title: 'No tasks yet',
    message: 'Your task list is empty. Create a task or import from email.',
    action: 'Create First Task'
  },
  calendar: {
    icon: 'fa-calendar',
    title: 'Calendar is clear',
    message: 'No scheduled tasks this week. Tasks will appear here once scheduled.',
    action: null
  },
  triage: {
    icon: 'fa-check-circle',
    title: 'Inbox Zero!',
    message: 'No proposals to review. Check back after email processing runs.',
    action: 'Process Emails Now'
  },
  energy: {
    icon: 'fa-battery-full',
    title: 'No energy logs',
    message: 'Start tracking your energy to get personalized scheduling.',
    action: 'Log Energy Now'
  }
};
```

### 20.9 ERROR MESSAGES FOR USER
```javascript
const USER_ERRORS = {
  'TASK_NOT_FOUND': 'This task no longer exists. It may have been deleted.',
  'PERMISSION_DENIED': 'You don\'t have permission to perform this action.',
  'NETWORK_ERROR': 'Connection lost. Your changes will sync when back online.',
  'INVALID_INPUT': 'Please check your input and try again.',
  'QUOTA_EXCEEDED': 'System limit reached. Please try again later.',
  'SESSION_EXPIRED': 'Your session has expired. Please refresh the page.',
  'SPREADSHEET_LOCKED': 'The data is currently being updated. Please try again.',
  'TRIGGER_FAILED': 'Automated process failed. Manual intervention required.',
  'SYNC_CONFLICT': 'This item was modified elsewhere. Refreshing...',
  'VALIDATION_FAILED': 'Please fix the highlighted errors and try again.'
};
```

### 20.10 LOADING STATES
```html
<!-- Skeleton Loading for Task Card -->
<div class="task-card skeleton-loading">
  <div class="skeleton skeleton-title"></div>
  <div class="skeleton skeleton-text"></div>
  <div class="skeleton skeleton-text" style="width: 60%"></div>
  <div class="skeleton skeleton-actions">
    <span class="skeleton skeleton-button"></span>
    <span class="skeleton skeleton-button"></span>
  </div>
</div>

<!-- Loading Overlay -->
<div id="loading-overlay" class="loading-overlay" style="display: none;">
  <div class="spinner">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
  <p class="loading-message">Loading tasks...</p>
</div>
```

### 20.11 SESSION AND CONCURRENCY
```javascript
// Handle concurrent edits
const ConcurrencyManager = {
  locks: new Map(),
  
  acquireLock(resourceId) {
    if (this.locks.has(resourceId)) {
      throw new Error('Resource is locked by another operation');
    }
    this.locks.set(resourceId, Date.now());
    
    // Auto-release after 30 seconds
    setTimeout(() => this.releaseLock(resourceId), 30000);
  },
  
  releaseLock(resourceId) {
    this.locks.delete(resourceId);
  },
  
  isLocked(resourceId) {
    return this.locks.has(resourceId);
  }
};

// Session timeout handling
let sessionTimeout = null;
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function resetSessionTimeout() {
  clearTimeout(sessionTimeout);
  sessionTimeout = setTimeout(() => {
    alert('Session expired. Please refresh the page.');
    window.location.reload();
  }, SESSION_DURATION);
}

// Reset on any user activity
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);
```

### 20.12 RATE LIMITING
```javascript
const RateLimiter = {
  calls: new Map(),
  limits: {
    'appsheet_getAllTasks': { max: 10, window: 60000 }, // 10 per minute
    'appsheet_createTask': { max: 30, window: 60000 },  // 30 per minute
    'appsheet_processEmails': { max: 2, window: 60000 }, // 2 per minute
    'appsheet_runScheduling': { max: 2, window: 60000 }  // 2 per minute
  },
  
  canCall(functionName) {
    const limit = this.limits[functionName];
    if (!limit) return true;
    
    const now = Date.now();
    const calls = this.calls.get(functionName) || [];
    
    // Remove old calls outside window
    const recentCalls = calls.filter(time => now - time < limit.window);
    
    if (recentCalls.length >= limit.max) {
      return false;
    }
    
    recentCalls.push(now);
    this.calls.set(functionName, recentCalls);
    return true;
  },
  
  getRemainingTime(functionName) {
    const limit = this.limits[functionName];
    const calls = this.calls.get(functionName) || [];
    if (calls.length === 0) return 0;
    
    const oldestCall = Math.min(...calls);
    const resetTime = oldestCall + limit.window;
    return Math.max(0, resetTime - Date.now());
  }
};

// Wrap google.script.run calls
function callWithRateLimit(functionName, params, onSuccess, onFailure) {
  if (!RateLimiter.canCall(functionName)) {
    const waitTime = RateLimiter.getRemainingTime(functionName);
    showToast(`Rate limit reached. Try again in ${Math.ceil(waitTime/1000)} seconds`, 'warning');
    return;
  }
  
  google.script.run
    .withSuccessHandler(onSuccess)
    .withFailureHandler(onFailure)
    [functionName](params);
}
```

### 20.13 CACHE STRATEGY
```javascript
const CacheManager = {
  cache: new Map(),
  ttls: {
    'tasks': 5 * 60 * 1000,        // 5 minutes
    'proposals': 2 * 60 * 1000,     // 2 minutes
    'settings': 10 * 60 * 1000,     // 10 minutes
    'energy': 5 * 60 * 1000,        // 5 minutes
    'calendar': 15 * 60 * 1000      // 15 minutes
  },
  
  set(key, value, category = 'default') {
    const ttl = this.ttls[category] || 5 * 60 * 1000;
    this.cache.set(key, {
      value: value,
      expires: Date.now() + ttl,
      category: category
    });
  },
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  },
  
  invalidate(category) {
    for (const [key, item] of this.cache.entries()) {
      if (item.category === category) {
        this.cache.delete(key);
      }
    }
  },
  
  clear() {
    this.cache.clear();
  }
};
```

---

## 21. CRITICAL IMPLEMENTATION NOTES

### ⚠️ FOR THE UI DEVELOPER:

1. **NEVER create new spreadsheets** - The spreadsheet already exists
2. **NEVER create new sheets** - All sheets already exist (use SHEET_NAMES)
3. **NEVER register new services** - All 31 services are already registered
4. **NEVER modify enums** - Use the exact enum values provided
5. **ALWAYS use exact column names** - No variations allowed
6. **ALWAYS call functions via google.script.run** - No direct service access from UI
7. **ALWAYS handle both success and failure callbacks** - Users need feedback
8. **ALWAYS use the stub functions for testing** - Real functions will be implemented

### ✅ YOUR TASK IS TO:

1. Create `/src/5_web/DayPlanner.html` with all 6 views
2. Use google.script.run to call ALL functions (even if not yet implemented)
3. Use exact column names and enum values from this document
4. Include all CSS and JavaScript inline in the HTML
5. Make it mobile-responsive with touch gestures
6. Add offline support with action queuing
7. Test with the stub functions provided

### 20.14 DEPENDENCIES SHEET STRUCTURE
```javascript
const DEPENDENCIES_COLUMNS = {
  'dependency_id': 0,    // DEP_xxxxx format
  'parent_task_id': 1,   // Task that depends on another
  'required_task_id': 2, // Task that must complete first
  'dependency_type': 3,  // BLOCKS, REQUIRES, RELATED
  'created_at': 4,       // ISO timestamp
  'notes': 5             // Optional notes
};
```

### 20.15 APPSHEET INTEGRATION HANDOFF
```javascript
// AppSheet uses same spreadsheet but different interface
// Both can work simultaneously with these rules:

const APPSHEET_INTEGRATION = {
  // AppSheet writes to these columns
  appsheet_writes: ['status', 'actual_minutes', 'completed_date'],
  
  // Web UI writes to these columns
  webapp_writes: ['scheduled_start', 'scheduled_end', 'assigned_to'],
  
  // Shared columns (both can write, last write wins)
  shared_columns: ['priority', 'title', 'description', 'tags'],
  
  // Sync strategy
  sync_interval: 30000, // Poll every 30 seconds for changes
  
  // Conflict resolution
  conflict_strategy: 'LAST_WRITE_WINS',
  
  // AppSheet webhook endpoint (if configured)
  webhook_url: ScriptApp.getService().getUrl() + '?webhook=appsheet'
};

// Handle AppSheet webhook notifications
function handleAppSheetWebhook(e) {
  const data = JSON.parse(e.postData.contents);
  
  // Invalidate cache for affected data
  CacheManager.invalidate('tasks');
  
  // Notify connected clients
  broadcastUpdate({
    type: 'appsheet_update',
    data: data
  });
}
```

### 20.16 SECURITY AND SANITIZATION
```javascript
// Input sanitization for XSS prevention
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Validate task input
function validateTaskInput(task) {
  // Required fields
  if (!task.title || task.title.trim().length === 0) {
    throw new ValidationError('Title is required');
  }
  
  // Title length
  if (task.title.length > 200) {
    throw new ValidationError('Title must be less than 200 characters');
  }
  
  // Valid priority
  if (!Object.values(PRIORITY).includes(task.priority)) {
    throw new ValidationError('Invalid priority value');
  }
  
  // Valid lane
  if (!Object.values(LANE).includes(task.lane)) {
    throw new ValidationError('Invalid lane value');
  }
  
  // Duration range
  if (task.estimated_minutes < 5 || task.estimated_minutes > 480) {
    throw new ValidationError('Duration must be between 5 and 480 minutes');
  }
  
  // Deadline in future
  if (task.deadline) {
    const deadline = new Date(task.deadline);
    if (deadline < new Date()) {
      throw new ValidationError('Deadline must be in the future');
    }
  }
  
  return true;
}

// SQL injection prevention for sheet queries
function escapeSheetQuery(value) {
  // Sheets API doesn't use SQL but similar principles apply
  if (typeof value === 'string') {
    return value.replace(/['"\\\n\r\t]/g, '');
  }
  return value;
}
```

### 20.17 BRANDING AND THEMING
```javascript
const BRANDING = {
  appName: 'MOH TIME OS',
  tagline: 'Intelligent Task Management',
  logo: 'https://your-domain.com/logo.png', // Replace with actual logo URL
  favicon: 'https://your-domain.com/favicon.ico',
  
  // Color scheme
  colors: {
    primary: '#667eea',      // Purple
    secondary: '#764ba2',    // Dark purple
    success: '#48bb78',      // Green
    warning: '#ed8936',      // Orange
    danger: '#f56565',       // Red
    info: '#4299e1',         // Blue
    light: '#f7fafc',        // Light gray
    dark: '#2d3748'          // Dark gray
  },
  
  // Fonts
  fonts: {
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace"
  }
};
```

### 20.18 MOBILE-SPECIFIC REQUIREMENTS
```javascript
// Touch event handling
const TouchHandler = {
  startX: 0,
  startY: 0,
  threshold: 50, // Minimum swipe distance
  
  init() {
    // Prevent pull-to-refresh on mobile
    document.body.addEventListener('touchmove', function(e) {
      if (e.touches[0].clientY > 0 && window.scrollY === 0) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Add to home screen prompt
    if ('standalone' in window.navigator && !window.navigator.standalone) {
      this.showInstallPrompt();
    }
  },
  
  showInstallPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'install-prompt';
    prompt.innerHTML = `
      <p>Add to Home Screen for the best experience</p>
      <button onclick="this.parentElement.remove()">Dismiss</button>
    `;
    document.body.appendChild(prompt);
  },
  
  handleSwipe(element, callbacks) {
    element.addEventListener('touchstart', (e) => {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
    });
    
    element.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const diffX = endX - this.startX;
      const diffY = endY - this.startY;
      
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > this.threshold) {
        if (diffX > 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight();
        } else if (diffX < 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft();
        }
      }
    });
  }
};
```

### 20.19 TESTING DATA GENERATORS
```javascript
// Generate test data for development
const TestDataGenerator = {
  generateTask() {
    const priorities = Object.values(PRIORITY);
    const statuses = Object.values(STATUS);
    const lanes = Object.values(LANE);
    
    return {
      action_id: 'ACT_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      title: 'Test Task ' + Math.floor(Math.random() * 1000),
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lane: lanes[Math.floor(Math.random() * lanes.length)],
      estimated_minutes: Math.floor(Math.random() * 120) + 15,
      energy_required: 'MEDIUM',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },
  
  generateProposal() {
    return {
      proposal_id: 'PROP_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      sender_email: 'test' + Math.floor(Math.random() * 100) + '@example.com',
      extracted_title: 'Proposal ' + Math.floor(Math.random() * 1000),
      suggested_priority: 'MEDIUM',
      suggested_lane: 'ops',
      suggested_duration: 30,
      confidence_score: Math.floor(Math.random() * 40) + 60,
      status: 'PENDING'
    };
  },
  
  populateTestData() {
    // Generate 20 test tasks
    const tasks = [];
    for (let i = 0; i < 20; i++) {
      tasks.push(this.generateTask());
    }
    
    // Generate 5 test proposals
    const proposals = [];
    for (let i = 0; i < 5; i++) {
      proposals.push(this.generateProposal());
    }
    
    return { tasks, proposals };
  }
};
```

### 20.20 FINAL DEPLOYMENT CHECKLIST
```
□ File created at exact path: /Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/5_web/DayPlanner.html
□ All 6 views implemented (Dashboard, Tasks, Calendar, Triage, Energy, Settings)
□ All google.script.run calls use exact function names
□ All column names match exactly (action_id not id, estimated_minutes not durationMinutes)
□ All enum values match exactly (CRITICAL not critical, ops not operational)
□ Token authentication implemented
□ Offline support with action queuing
□ Mobile responsive with touch gestures
□ Rate limiting implemented
□ Cache strategy implemented
□ Session timeout handling
□ Error handling for all failure cases
□ Loading states for all async operations
□ Empty states for all views
□ Accessibility (ARIA) labels added
□ Keyboard shortcuts working
□ All stub functions added to AppSheetBridge.gs for testing
□ getCurrentUser() function added to backend
□ doGet() function updated with authentication
□ Generated auth token and tested access URL
□ Performance monitoring added
□ All PropertiesService keys documented
□ Date/time handling uses ISO 8601
□ JSON columns properly parsed/stringified
□ Input validation and sanitization
□ Concurrent edit handling
□ Test with 100+ tasks for performance
□ Test offline mode
□ Test on mobile devices
□ Deploy as Web App
□ Share access URL with token
```

---

## END OF COMPLETE SPECIFICATION

This document now contains ABSOLUTELY EVERYTHING needed to implement the MOH TIME OS Web UI. 
Total: 3,400+ lines of comprehensive specification.
Follow it EXACTLY or the implementation will fail.

This document contains EVERYTHING needed to implement the MOH TIME OS Web UI correctly. Follow it EXACTLY or the implementation will fail.