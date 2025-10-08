# Knowledge Transfer Guide

## Overview

This document provides comprehensive knowledge transfer for maintaining and extending MOH Time OS v2.0. It covers system architecture, key concepts, common tasks, troubleshooting, and operational procedures.

**Target Audience**: New developers, operations staff, and system administrators

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Google Apps Script                      │
│                         (V8 Runtime)                         │
├─────────────────────────────────────────────────────────────┤
│  Web Layer (5_web/)                                          │
│  ├── WebAppManager - HTTP request routing                   │
│  ├── ChatEngine - Chat interface                            │
│  └── AppSheetBridge - AppSheet integration                  │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (4_services/)                                 │
│  ├── SystemManager - Health & maintenance                   │
│  ├── EmailIngestionEngine - Email processing                │
│  ├── CalendarEngine - Calendar sync                         │
│  ├── TimeBlockEngine - Time blocking logic                  │
│  └── SchedulingEngine - Task scheduling                     │
├─────────────────────────────────────────────────────────────┤
│  Core Layer (3_core/)                                        │
│  ├── BatchOperations - Database operations                  │
│  ├── SmartLogger - Structured logging                       │
│  ├── ErrorHandler - Error management                        │
│  ├── ConfigManager - Configuration                          │
│  ├── CrossExecutionCache - Caching                          │
│  └── PersistentStore - Key-value persistence                │
├─────────────────────────────────────────────────────────────┤
│  Bootstrap Layer (0_bootstrap/)                              │
│  ├── AA_Container - Dependency injection                    │
│  ├── LoggerFacade - Basic logging                           │
│  ├── SheetHealer - Schema management                        │
│  └── AZ_ServiceRegistration - Service registry              │
├─────────────────────────────────────────────────────────────┤
│  Globals Layer (1_globals/)                                  │
│  ├── Constants - System constants                           │
│  ├── Version - Version management                           │
│  ├── TimeZoneUtils - Timezone handling                      │
│  └── Utilities - General utilities                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Google Sheets Database                   │
│  ├── ACTIONS - Main task records                            │
│  ├── PROPOSED_TASKS - Task proposals                        │
│  ├── CALENDAR_PROJECTION - Calendar state                   │
│  ├── TIME_BLOCKS - Time allocations                         │
│  ├── ACTIVITY - System logs                                 │
│  ├── STATUS - Health metrics                                │
│  ├── PLAN_EXECUTION_LOG - Deployment tracking               │
│  └── [12 other operational sheets]                          │
└─────────────────────────────────────────────────────────────┘
```

### Load Order System

**Critical Concept**: Files load in strict numerical order (0_ → 1_ → 2_ → ... → 9_)

**Load Sequence**:
1. **0_bootstrap/** - Core infrastructure (AA_ loads first, AZ_ loads last)
2. **1_globals/** - Constants and utilities
3. **2_models/** - Data models
4. **3_core/** - Core services
5. **4_services/** - Business services
6. **5_web/** - Web application layer
7. **7_support/** - Support utilities
8. **8_setup/** - Initialization
9. **9_tests/** - Test suites

**Why This Matters**:
- Dependencies must be defined before use
- Container must load before services
- Constants must exist before service registration
- Violating load order causes "undefined" errors

### Dependency Injection Container

**Key Concept**: All services accessed via global `container` singleton

**Service Registration** (in AZ_ServiceRegistration.gs):
```javascript
// 1. Eager registration (loads at startup)
container.register(SERVICES.SmartLogger, () => new SmartLogger());

// 2. Lazy registration (loads on first use)
container.registerLazy(SERVICES.EmailEngine, () => {
  return new EmailIngestionEngine(
    container.get(SERVICES.BatchOperations),
    container.get(SERVICES.SmartLogger)
  );
});

// 3. Dependency map (for validation)
dependencyMap[SERVICES.EmailEngine] = [
  SERVICES.BatchOperations,
  SERVICES.SmartLogger
];
```

**Service Retrieval**:
```javascript
// Standard pattern
const logger = container.get(SERVICES.SmartLogger);
const batchOps = container.get(SERVICES.BatchOperations);

// Always use SERVICES constants, never hardcode strings
```

### Data Layer (Google Sheets)

**Key Concept**: Google Sheets acts as database, BatchOperations is the ORM

**Sheet Structure**:
- Each sheet has canonical headers (defined in SheetHealer)
- Row 1 = headers, Row 2+ = data
- Headers use snake_case (e.g., `action_id`, `created_at`)

**Data Operations**:
```javascript
const batchOps = container.get(SERVICES.BatchOperations);

// Read operations
const allActions = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
const specificAction = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {
  action_id: 'act_12345'
});

// Write operations
const newRow = [
  Utilities.getUuid(),           // action_id
  'Task title',                  // title
  'Description',                 // description
  PRIORITY.MEDIUM,               // priority
  // ... other columns
];
batchOps.appendRows(SHEET_NAMES.ACTIONS, [newRow]);

// Update operations
const updatedRows = batchOps.batchUpdate(SHEET_NAMES.ACTIONS, [
  { row: 5, values: [/* new row data */] }
]);

// Delete operations
batchOps.deleteRowsByIndices(SHEET_NAMES.ACTIONS, [5, 10, 15]);
```

**Important**: Always use BatchOperations, never direct `sheet.getRange()` operations.

### Logging System

**Three-Tier Logging**:

1. **LoggerFacade** (always available, no dependencies)
   ```javascript
   LoggerFacade.info('Component', 'Message', { data });
   LoggerFacade.error('Component', 'Error message', { error });
   ```

2. **SmartLogger** (advanced logging with sheet persistence)
   ```javascript
   const logger = container.get(SERVICES.SmartLogger);
   logger.info('Component', 'Message', { context });
   logger.error('Component', 'Error', { error: e.message });
   ```

3. **getLogger()** (smart helper - uses SmartLogger if available, falls back to LoggerFacade)
   ```javascript
   const logger = getLogger();
   logger.info('Component', 'Operation completed');
   ```

**When to Use Each**:
- **Bootstrap/early init**: LoggerFacade
- **After container ready**: getLogger() or SmartLogger
- **Web endpoints**: getLogger() (handles container unavailability)

## Key Concepts

### 1. Timezone-Aware Date Handling

**Critical**: System operates in Asia/Dubai timezone

```javascript
// WRONG - Uses user's local timezone
const now = new Date();

// CORRECT - Uses system timezone (Asia/Dubai)
const now = TimeZoneAwareDate.now();
const isoString = TimeZoneAwareDate.toISOString(now);
const fromString = TimeZoneAwareDate.fromString('2025-10-08T14:30:00Z');
```

**Always use TimeZoneAwareDate** for:
- Creating timestamps
- Parsing date strings
- Date comparisons
- Calendar operations

### 2. Data Sanitization (Phase 8)

**Security Layer**: All user input sanitized via `sanitizeString()` and `sanitizeForJSON()`

**Formula Injection Prevention**:
```javascript
const userInput = '=SUM(A1:A10)';
const sanitized = sanitizeString(userInput);
// Result: "'=SUM(A1:A10)" (prefixed with single quote)
```

**HTML/XSS Prevention**:
```javascript
const userInput = '<script>alert(1)</script>';
const sanitized = sanitizeString(userInput);
// Result: "scriptalert(1)/script" (tags removed)
```

**Privacy Masking** (config-driven):
```javascript
// Enable via ConfigManager
const config = container.get(SERVICES.ConfigManager);
config.set('MASK_SENDER_EMAIL', 'true');    // Masks emails: j***@example.com
config.set('MASK_PROPOSAL_CONTENT', 'true'); // Truncates to 100 chars
```

**Where Sanitization Applies**:
- AppSheetBridge (all user inputs)
- ChatEngine (messages)
- EmailIngestionEngine (sender, content)
- ZeroTrustTriageEngine (proposals)
- HumanStateManager (notes)

### 3. Optimistic Locking (Phase 6)

**Prevents Race Conditions** in concurrent operations

```javascript
// Batch operations with version tracking
const result = batchOps.batchUpdate(SHEET_NAMES.ACTIONS, [
  {
    row: 5,
    values: [/* updated data */],
    expectedVersion: 3  // Fails if version doesn't match
  }
]);

if (result.conflicts.length > 0) {
  // Handle conflict - data changed by another process
  logger.warn('Update', 'Optimistic lock conflict', {
    conflicts: result.conflicts
  });
}
```

### 4. Archive Management (Phase 3)

**Two-Tier Archive**:
1. **Internal Archive**: Sheets in main spreadsheet (ACTIONS_ARCHIVE, PROPOSED_ARCHIVE)
2. **External Archive**: Separate spreadsheet for long-term storage

**Archive Workflow**:
```javascript
// Archive old completed actions (auto or manual)
const systemManager = container.get(SERVICES.SystemManager);
const archiveResult = systemManager.archiveOldActions({
  daysOld: 90,              // Archive actions older than 90 days
  status: STATUS.COMPLETED  // Only completed actions
});

// Access archived data
const batchOps = container.get(SERVICES.BatchOperations);
const archivedActions = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS_ARCHIVE, {
  action_id: 'act_12345'
});
```

### 5. Configuration Management

**Centralized Config**: All settings in APPSHEET_CONFIG sheet

```javascript
const config = container.get(SERVICES.ConfigManager);

// Read settings
const emailEnabled = config.getBoolean('EMAIL_INGESTION_ENABLED');
const maxRetries = config.getNumber('MAX_RETRY_ATTEMPTS');
const apiKey = config.getString('EXTERNAL_API_KEY');

// Write settings
config.set('EMAIL_INGESTION_ENABLED', 'false');

// Cache: 5-minute TTL, auto-refresh
```

**Config Keys** (defined in APPSHEET_CONFIG sheet):
- `cfg_email_ingestion_enabled` - Enable/disable email processing
- `cfg_mask_sender_email` - Privacy masking for emails
- `cfg_mask_proposal_content` - Privacy masking for content
- `cfg_external_archive_id` - External archive spreadsheet ID
- `cfg_max_retry_attempts` - Retry limit for failed operations

### 6. Error Handling

**Custom Error Hierarchy**:
```javascript
// Base class
class BaseError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.context = context;
    this.timestamp = new Date();
  }
}

// Specialized errors
class DatabaseError extends BaseError {}
class ValidationError extends BaseError {}
class ConfigurationError extends BaseError {}
class NetworkError extends BaseError {}
```

**Error Handling Pattern**:
```javascript
try {
  // Operation
  const result = performOperation();
} catch (error) {
  const logger = getLogger();

  if (error instanceof ValidationError) {
    logger.warn('Component', 'Validation failed', {
      error: error.message,
      context: error.context
    });
    return { success: false, reason: 'validation_failed' };
  } else if (error instanceof DatabaseError) {
    logger.error('Component', 'Database error', {
      error: error.message,
      stack: error.stack
    });
    throw error; // Propagate critical errors
  } else {
    logger.error('Component', 'Unexpected error', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

## Common Tasks

### Task 1: Adding a New Service

**Steps**:

1. **Create Service Class** (in appropriate tier directory)
   ```javascript
   // src/4_services/MyNewService.gs
   class MyNewService {
     constructor(batchOperations, smartLogger) {
       this.batchOperations = batchOperations;
       this.logger = smartLogger;
     }

     doSomething() {
       this.logger.info('MyNewService', 'Operation started');
       // ... implementation
     }
   }
   ```

2. **Add to SERVICES Constant** (src/1_globals/Constants.gs)
   ```javascript
   const SERVICES = {
     // ... existing services
     MyNewService: 'MyNewService'
   };
   ```

3. **Register in Container** (src/0_bootstrap/AZ_ServiceRegistration.gs)
   ```javascript
   // Eager registration (loads at startup)
   container.register(
     SERVICES.MyNewService,
     () => new MyNewService(
       container.get(SERVICES.BatchOperations),
       container.get(SERVICES.SmartLogger)
     )
   );

   // Lazy registration (inside registerCoreServices or registerBusinessServices)
   case SERVICES.MyNewService:
     container.register(
       SERVICES.MyNewService,
       () => new MyNewService(
         container.get(SERVICES.BatchOperations),
         container.get(SERVICES.SmartLogger)
       )
     );
     break;

   // Dependency map (inside getDependencyMap)
   dependencyMap[SERVICES.MyNewService] = [
     SERVICES.BatchOperations,
     SERVICES.SmartLogger
   ];
   ```

4. **Write Tests** (src/9_tests/)
   ```javascript
   function testMyNewService() {
     const logger = getLogger();
     try {
       const service = container.get(SERVICES.MyNewService);
       service.doSomething();
       logger.info('Test', 'MyNewService test passed');
       return true;
     } catch (error) {
       logger.error('Test', 'MyNewService test failed', {
         error: error.message
       });
       return false;
     }
   }
   ```

5. **Deploy and Verify**
   ```bash
   npm run push
   # In Apps Script console: testMyNewService()
   ```

### Task 2: Adding a New Sheet

**Steps**:

1. **Add to SHEET_NAMES** (src/0_bootstrap/AA_Container.gs)
   ```javascript
   const SHEET_NAMES = {
     // ... existing sheets
     MY_NEW_SHEET: 'MY_NEW_SHEET'
   };
   ```

2. **Define Schema** (src/0_bootstrap/SheetHealer.gs)
   ```javascript
   // In getCanonicalSchemas() method
   static getCanonicalSchemas() {
     return {
       // ... existing schemas
       'MY_NEW_SHEET': this._getMyNewSheetSchema()
     };
   }

   // Add schema definition method
   static _getMyNewSheetSchema() {
     return {
       headers: [
         'record_id',      // Primary key (UUID)
         'created_at',     // Timestamp
         'updated_at',     // Timestamp
         'status',         // Status field
         'data'            // JSON data field
       ],
       columnWidths: [200, 150, 150, 100, 300]
     };
   }
   ```

3. **Run SheetHealer** to create sheet
   ```javascript
   // In Apps Script console
   const sheetHealer = new SheetHealer();
   sheetHealer.healSheets(); // Creates MY_NEW_SHEET if missing
   ```

4. **Use in Code**
   ```javascript
   const batchOps = container.get(SERVICES.BatchOperations);
   const data = batchOps.getRowsByFilter(SHEET_NAMES.MY_NEW_SHEET, {});
   ```

### Task 3: Modifying an Existing Sheet Schema

**Steps**:

1. **Create Backup First**
   ```javascript
   const backupManager = container.get(SERVICES.BackupManager);
   const backup = backupManager.createBackup([SHEET_NAMES.MY_SHEET]);
   Logger.log(`Backup ID: ${backup.backupId}`);
   ```

2. **Update Schema Definition** (src/0_bootstrap/SheetHealer.gs)
   ```javascript
   static _getMySheetSchema() {
     return {
       headers: [
         'existing_field',
         'new_field',      // ADD NEW FIELD
         'another_existing_field'
       ],
       columnWidths: [200, 150, 200]
     };
   }
   ```

3. **Run SheetHealer**
   ```javascript
   const sheetHealer = new SheetHealer();
   sheetHealer.healSheets(); // Adds missing column
   ```

4. **Backfill Data for New Column** (if needed)
   ```javascript
   const batchOps = container.get(SERVICES.BatchOperations);
   const rows = batchOps.getRowsWithPosition(SHEET_NAMES.MY_SHEET, {});

   const updates = rows.map(rowData => ({
     row: rowData.sheetRow,
     values: [
       ...rowData.row,
       'default_value_for_new_field'  // Add default value
     ]
   }));

   batchOps.batchUpdate(SHEET_NAMES.MY_SHEET, updates);
   ```

5. **Verify Schema**
   ```javascript
   const headers = batchOps.getHeaders(SHEET_NAMES.MY_SHEET);
   Logger.log(headers); // Should include new_field
   ```

### Task 4: Running Tests

**Full Test Suite**:
```javascript
// In Apps Script console
RUN_EVERYTHING_NOW();
// Expected: { summary: { total: X, success: X, errors: 0 } }
```

**Individual Test Suites**:
```javascript
// Phase validation tests
validatePhase3Complete();        // Archive management
validatePhase6Batching();        // Batch operations
validatePhase8Sanitization();    // Security controls
validatePhase10Deployment();     // Deployment infrastructure

// Component tests
testBatchOperations();
testSmartLogger();
testConfigManager();
```

**Check Test Results**:
```javascript
// View execution logs
// Apps Script editor → Executions → View logs

// Or check ACTIVITY sheet for test logs
const batchOps = container.get(SERVICES.BatchOperations);
const testLogs = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
  component: 'Test'
});
```

### Task 5: Deploying Changes

**Pre-Deployment**:
```bash
# 1. Validate code locally
node validate_load_order.js

# 2. Authenticate
npm run login

# 3. Open Apps Script console
npm run open

# 4. Run pre-deployment checks
# In console: runPreDeploymentChecks()
# Expected: { ready: true, failures: [] }

# 5. Create backup
# In console: BackupManager.createBackup()
# Record backup ID
```

**Deployment**:
```bash
# Push code
npm run push

# Or use deployment script
npm run deploy:push
```

**Post-Deployment**:
```javascript
// In Apps Script console

// 1. Run verification
runPostDeploymentVerification();
// Expected: { success: true }

// 2. Run full test suite
RUN_EVERYTHING_NOW();
// Expected: errors: 0

// 3. Health check
const systemManager = container.get(SERVICES.SystemManager);
const health = systemManager.runHealthCheck();
Logger.log(health);
// Expected: overall_status: 'HEALTHY'
```

## Troubleshooting

### Issue: "Container is not defined" Error

**Cause**: File loaded before container bootstrapped

**Diagnosis**:
```javascript
// Check if container exists
if (typeof container === 'undefined') {
  Logger.log('Container not yet loaded');
} else {
  Logger.log('Container available');
}
```

**Solution**:
- Use `getLogger()` instead of `container.get(SERVICES.SmartLogger)`
- Or ensure file loads after 0_bootstrap/ (check numeric prefix)

### Issue: "Service not registered" Error

**Cause**: Service not in AZ_ServiceRegistration.gs

**Diagnosis**:
```javascript
// Check service registration
try {
  const service = container.get(SERVICES.MyService);
  Logger.log('Service registered');
} catch (error) {
  Logger.log('Service not found:', error.message);
}
```

**Solution**:
- Add service to AZ_ServiceRegistration.gs (3 locations: eager, lazy, dependency map)
- Ensure SERVICES constant defined in Constants.gs
- Redeploy code

### Issue: Test Suite Failures

**Diagnosis**:
```javascript
// Run individual tests to isolate failure
validatePhase3Complete();
validatePhase6Batching();
validatePhase8Sanitization();

// Check ACTIVITY sheet for error details
const batchOps = container.get(SERVICES.BatchOperations);
const errors = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
  log_level: 'ERROR'
});
Logger.log('Recent errors:', errors.slice(-10));
```

**Common Causes**:
- Schema mismatch (run `sheetHealer.healSheets()`)
- Missing dependencies (check AZ_ServiceRegistration.gs)
- Data corruption (restore from backup)
- Quota exceeded (check Apps Script quotas)

### Issue: Performance Degradation

**Diagnosis**:
```javascript
// Measure execution time
const start = Date.now();
const result = someOperation();
const duration = Date.now() - start;
Logger.log(`Operation took ${duration}ms`);

// Check cache performance
const cache = container.get(SERVICES.CrossExecutionCache);
const stats = cache.getStats();
Logger.log('Cache stats:', stats);

// Check batch operation counts
const logger = container.get(SERVICES.SmartLogger);
const logStats = logger.getStats();
Logger.log('Log batch size:', logStats.batchedLogsCount);
```

**Solutions**:
- Enable caching for frequently accessed data
- Use batch operations instead of individual row operations
- Reduce log verbosity
- Archive old data

### Issue: Data Not Appearing in Sheet

**Diagnosis**:
```javascript
// Check if data written
const batchOps = container.get(SERVICES.BatchOperations);
const allData = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
Logger.log(`Total rows: ${allData.length}`);

// Check specific record
const specific = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {
  action_id: 'act_12345'
});
Logger.log('Found:', specific);

// Check for errors in ACTIVITY logs
const errors = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
  log_level: 'ERROR',
  component: 'BatchOperations'
});
Logger.log('Write errors:', errors);
```

**Common Causes**:
- Wrong sheet name (check SHEET_NAMES constant)
- Missing headers (run `sheetHealer.healSheets()`)
- Permission issues (check spreadsheet sharing)
- Sanitization removed data (check `sanitizeString()` behavior)

## Operational Procedures

### Daily Operations

**Morning Check** (5 minutes):
```javascript
// 1. Run health check
const systemManager = container.get(SERVICES.SystemManager);
const health = systemManager.runHealthCheck();
Logger.log(health);

// 2. Check for errors overnight
const batchOps = container.get(SERVICES.BatchOperations);
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentErrors = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
  log_level: 'ERROR'
}).filter(log => new Date(log.timestamp) > yesterday);

Logger.log(`Errors in last 24h: ${recentErrors.length}`);

// 3. Verify backups ran
// Check Drive folder MOH_Time_OS_Backups/ for today's folder
```

### Weekly Maintenance

**Tasks**:
1. Run full test suite: `RUN_EVERYTHING_NOW()`
2. Review error trends in ACTIVITY sheet
3. Check system performance metrics
4. Archive old data (if >90 days old)
5. Review and clean up old backups (keep last 7 days)

### Monthly Maintenance

**Tasks**:
1. Schema validation: `sheetHealer.validateAllSheets()`
2. Performance review: Check execution times, quota usage
3. Security audit: Review sanitization logs, check for injection attempts
4. Backup verification: Spot-check monthly backup integrity
5. Documentation updates: Update CHANGELOG.md, release notes

## Reference Materials

### Key File Locations

**Bootstrap**:
- `src/0_bootstrap/AA_Container.gs` - Constants (SHEET_NAMES, SERVICES)
- `src/0_bootstrap/SheetHealer.gs` - Schema definitions
- `src/0_bootstrap/AZ_ServiceRegistration.gs` - Service registry

**Core Services**:
- `src/3_core/BatchOperations.gs` - Database operations
- `src/3_core/SmartLogger.gs` - Logging system
- `src/3_core/ConfigManager.gs` - Configuration management
- `src/3_core/ErrorHandler.gs` - Error handling

**Business Services**:
- `src/4_services/SystemManager.gs` - System management
- `src/4_services/EmailIngestionEngine.gs` - Email processing
- `src/4_services/CalendarEngine.gs` - Calendar sync

**Testing**:
- `src/9_tests/RUN_EVERYTHING.gs` - Master test runner
- `src/9_tests/DeploymentValidation.gs` - Phase validation
- `src/9_tests/PreDeploymentValidation.gs` - Pre/post deployment checks

**Setup**:
- `src/8_setup/BackupManager.gs` - Backup/restore operations

### Command Reference

```bash
# Local validation
node validate_load_order.js

# Authentication
npm run login

# Deployment
npm run push                  # Push code to Apps Script
npm run deploy                # Deploy as web app
npm run open                  # Open Apps Script editor
npm run logs                  # View execution logs

# Deployment workflow
npm run deploy:pre-check      # Reminder to run pre-checks
npm run deploy:backup         # Reminder to create backup
npm run deploy:push           # Push code
npm run deploy:verify         # Reminder to run verification
```

### Apps Script Console Commands

```javascript
// Health & Status
runHealthCheck()
runPreDeploymentChecks()
runPostDeploymentVerification()

// Testing
RUN_EVERYTHING_NOW()
validatePhase3Complete()
validatePhase6Batching()
validatePhase8Sanitization()
validatePhase10Deployment()

// Maintenance
const sheetHealer = new SheetHealer();
sheetHealer.healSheets()

// Backup
const backupManager = container.get(SERVICES.BackupManager);
backupManager.createBackup()
backupManager.verifyBackup('[BACKUP_ID]')
backupManager.restoreFromBackup('[BACKUP_ID]', 'ACTIONS')

// Logging
const systemManager = container.get(SERVICES.SystemManager);
systemManager.logDeploymentAction('Phase X', 'ACTION', 'STATUS', {})
```

### Documentation Links

- [CLAUDE.md](../../CLAUDE.md) - System execution intelligence guidelines
- [README.md](../../README.md) - Project overview
- [CHANGELOG.md](../../CHANGELOG.md) - Version history
- [Deployment Checklist](../operations/deployment-checklist.md)
- [Backup Procedures](../operations/backup-procedures.md)
- [Security Operations](../operations/security.md)
- [Maintenance Schedule](./maintenance-schedule.md)

## Support Contacts

**Technical Issues**:
- System Architecture: [Technical Lead]
- Deployment: [Release Manager]
- Data/Backup: [Data Administrator]

**Escalation Path**:
1. Check documentation (this file, CLAUDE.md, operation docs)
2. Review ACTIVITY logs for error details
3. Run health check and diagnostics
4. Contact technical lead with findings

## Revision History

- **v2.0.0-phase10** (2025-10-08): Initial knowledge transfer document
- Future revisions track major system changes
