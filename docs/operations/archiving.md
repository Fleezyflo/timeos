# Archive Management Operations

## Overview

ArchiveManager handles archiving of completed tasks and processed proposals to either the current spreadsheet or an external archive spreadsheet.

## Phase 3 Fixes

### 1. PROPOSED Header Usage Fix
- **Issue**: `archiveProcessedProposals` passed sourceHeaders without appending `archived_at`
- **Fix**: Added explicit header transformation:
  ```javascript
  const sourceHeaders = this.batchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
  const archiveHeaders = [...sourceHeaders, 'archived_at'];
  ```
- **Critical**: PROPOSED_TASKS schema doesn't include `archived_at` (unlike ACTIONS which has it), so it must be appended programmatically
- **Location**: `src/4_services/ArchiveManager.gs:240-252`

### 2. Append Routing Logic
- **Issue**: `appendToArchive` called wrong API signature
- **Fix**: Routes to correct method based on spreadsheet ID:
  - External: `batchOperations.appendRowsToExternalSheet(spreadsheetId, sheetName, rows)`
  - Current: `batchOperations.appendRows(sheetName, rows)`
- **Returns**: `{ success, archived_count, external, spreadsheet_id, message }`
- **Location**: `src/4_services/ArchiveManager.gs:265-307`

### 3. Retry Logic
- **Implementation**: Both `archiveCompletedTasks` and `archiveProcessedProposals` now wrap `appendToArchive` in retry loop
- **Constants**:
  - `CONSTANTS.MAX_RETRIES` = 3 attempts
  - `CONSTANTS.BASE_RETRY_DELAY` = 1000ms (increases per attempt)
- **Behavior**:
  - Attempt 1: immediate
  - Attempt 2: 1000ms delay
  - Attempt 3: 2000ms delay
- **Logs**: Warns on each failure, logs success if retry needed
- **Location**: `src/4_services/ArchiveManager.gs:181-204, 259-282`

### 4. Enhanced SelfTest
- **New behavior**:
  - Builds dummy row using current ACTIONS headers + `archived_at`
  - Calls `appendToArchive` with retry logic
  - Cleans up test row in try/finally pattern
  - Returns `{ success, archive_sheet, rows_appended, target_spreadsheet_id }`
- **Location**: `src/4_services/ArchiveManager.gs:564-646`

## Expected Logs

### Successful Archive (first attempt)
```
[ArchiveManager] Appended 5 rows to ACTIONS_ARCHIVE
[ArchiveManager] Archived 5 completed tasks
```

### Successful Archive (with retry)
```
[ArchiveManager] Archive append attempt 1 failed: Service unavailable
[ArchiveManager] Archive append attempt 2 failed: Timeout
[ArchiveManager] Appended 5 rows to ACTIONS_ARCHIVE
[ArchiveManager] Archive append succeeded on attempt 3
[ArchiveManager] Archived 5 completed tasks
```

### Failed Archive (all retries exhausted)
```
[ArchiveManager] Archive append attempt 1 failed: Service unavailable
[ArchiveManager] Archive append attempt 2 failed: Service unavailable
[ArchiveManager] Archive append attempt 3 failed: Service unavailable
[ArchiveManager] Failed to archive completed tasks: Archive append failed after 3 attempts
```

## Self-Test Usage

Run from Apps Script IDE:
```javascript
const archiveManager = container.get(SERVICES.ArchiveManager);
const result = archiveManager.selfTest();
Logger.log(result);
// Expected: { success: true, archive_sheet: 'ACTIONS_ARCHIVE', rows_appended: 1, target_spreadsheet_id: '...' }
```

## Health Check Integration

Archive status now included in `SystemManager.runHealthCheck()`:
```javascript
healthResults.checks.archives = {
  status: 'HEALTHY' | 'DEGRADED' | 'ERROR',
  details: {
    location: 'current' | 'external',
    external_configured: true/false,
    external_accessible: true/false,
    total_archived_records: <number>,
    archive_sheets: { ACTIONS_ARCHIVE: {...}, PROPOSED_ARCHIVE: {...} }
  }
}
```

## Verification Steps

1. Deploy to Apps Script: `clasp push`
2. Run self-test: `archiveManager.selfTest()`
3. Run full test suite: `RUN_EVERYTHING_NOW()`
4. Manual archive test:
   ```javascript
   // Archive a completed task
   const tasks = [{ action_id: 'test123', status: 'COMPLETED', ... }];
   const result = archiveManager.archiveCompletedTasks(tasks);
   Logger.log(result);
   ```
5. Check logs for proper retry behavior and target spreadsheet ID

## Rollback

If issues occur:
1. Revert commit: `git revert <commit-hash>`
2. Redeploy: `clasp push`
3. Archive sheets preserve data - no data loss expected

## Phase 5: Range Calculation Safety

### Problem Solved
Manual `String.fromCharCode(65 + headers.length - 1)` calculations fail beyond 26 columns:
- Column 26 → 'Z' ✓
- Column 27 → '[' ✗ (should be 'AA')
- Column 53 → 't' ✗ (should be 'BA')

ACTIONS sheet has 53 columns. Manual ASCII calculations produced invalid ranges.

### Solution: SafeColumnAccess.getRowRange()
```javascript
const headers = batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
const safeAccess = new SafeColumnAccess(headers);
const rangeA1 = safeAccess.getRowRange(5);  // Returns "A5:BA5" for 53 columns
```

### Migration Completed
- ✅ SafeColumnAccess: Added 4 methods (+72 lines)
- ✅ IntelligentScheduler.gs:95 refactored
- ✅ SenderReputationManager.gs:322 refactored
- ✅ TestSeeder.gs: 7 instances refactored
- ✅ DeploymentValidation.gs: Inline tests added
- ✅ All 9 manual String.fromCharCode instances eliminated

### Verification
```bash
grep -rn "String\.fromCharCode.*headers\.length" src/ --include="*.gs"
# Should return 0 results
```

---

## Phase 7: Chunked Maintenance & Lock Metrics

### Chunked Archive Operations

`SystemManager.runSystemMaintenance()` now processes completed tasks in chunks to prevent timeout and rate limit issues.

#### Configuration
- **Chunk Size**: `ARCHIVE_BATCH_LIMIT` (default: 50, min: 10, max: 200)
- **Max Chunks**: 5 per maintenance run (hardcoded)
- **Max Tasks**: 250 per run (5 × 50)
- **Inter-Chunk Delay**: 200ms

#### Algorithm
```javascript
for (let i = 0; i < maxTasks; i += chunkSize) {
  const chunk = completedTasks.slice(i, Math.min(i + chunkSize, maxTasks));
  archiveManager.archiveCompletedTasks(chunk);
  Utilities.sleep(200);  // Rate limit protection
}
```

#### Results Structure
```javascript
{
  operations: {
    archive_tasks: {
      success: true,
      archived_count: 150,       // Actually archived
      chunks_processed: 3,       // Chunks executed
      total_candidates: 487,     // Total available
      chunk_size: 50             // Configured size
    }
  }
}
```

#### Expected Logs
```
[SystemManager] Chunked archive: 487 candidates, max 250 in 50-task chunks
[SystemManager] Maintenance completed: SUCCESS
```

### Lock Manager Metrics

Lock contention and timeout metrics are tracked automatically and exposed via health checks.

#### Accessing Metrics
```javascript
const health = systemManager.runHealthCheck();
Logger.log(health.checks.lock_manager.details);
// {
//   acquireAttempts: 156,
//   timeouts: 1,
//   successRate: "99%",
//   contentionRate: "1%",
//   timeoutRate: "0%"
// }
```

#### Interpreting Rates
- **Success Rate** >90%: Healthy
- **Contention Rate** <10%: Normal
- **Timeout Rate** <5%: Acceptable

### Trigger Idempotency

Triggers track state in STATUS sheet to prevent concurrent execution. SystemManager methods:
- `shouldSkipTrigger(name)`: Check if trigger in progress
- `markTriggerStarted(name)`: Set IN_PROGRESS state
- `markTriggerCompleted(name, status)`: Set IDLE state

STATUS rows are updated in-place (not appended) using `_updateStatusRow` helper.

### Troubleshooting

#### Partial Archiving
Normal with large backlogs. Each run processes max 250 tasks. Subsequent runs handle remainder.

#### Timeout Issues
- Reduce `ARCHIVE_BATCH_LIMIT` to 30-40
- Check archive destination accessibility
- Increase inter-chunk sleep in SystemManager.gs

#### High Contention
- Review trigger schedule for overlaps
- Increase lock timeout values in TriggerOrchestrator

---

## Phase 6: Batching, Bulk Operations & Time-Block Lifecycle

### SmartLogger Batching

**Implementation**: All logs now route through batched queue for efficiency

**Behavior**:
- Logs accumulate in `batchedLogs` array
- Auto-flush on batch size threshold (default: 50 logs)
- Auto-flush on ERROR severity (immediate persistence)
- Manual flush via `smartLogger.flush()` method
- Preserves logs on write failure for retry

**Usage**:
```javascript
const logger = container.get(SERVICES.SmartLogger);
logger.info('Component', 'Message', { context: 'data' });
// Auto-batches until threshold or ERROR

// Manual flush before long operation:
logger.flush();
```

### Bulk Task Operations

**API Pattern**: Existing endpoints now accept `taskIds` array for bulk operations

**Single Task**:
```javascript
appsheet_completeTask({ taskId: 'task123' })
// Returns: { success: true, data: { action_id, status } }
```

**Bulk Tasks**:
```javascript
appsheet_completeTask({ taskIds: ['task1', 'task2', 'task3'] })
// Returns: { success: false, results: { completed: [...], conflicts: [...] } }
```

**Response Format**:
- `success`: false if any conflicts occurred
- `results.completed`: Array of `{ taskId, status, ...extraFields }`
- `results.conflicts`: Array of `{ taskId, versionConflict, error }`

**Supported Operations**:
- `appsheet_startTask` → STATUS.IN_PROGRESS
- `appsheet_completeTask` → STATUS.COMPLETED
- `appsheet_snoozeTask` → STATUS.DEFERRED (returns `snoozed_until`)
- `appsheet_cancelTask` → STATUS.CANCELED

**Critical Details**:
- Snooze uses `STATUS.DEFERRED` (not PENDING)
- Timestamps use `TimeZoneAwareDate.toISOString()` (ISO format)
- Conflicts handled via optimistic locking

### DayPlanner Bulk UI

**Before Phase 6**: N sequential RPC calls per bulk operation

**After Phase 6**: Single bulk call with conflict retry

**Implementation**:
```javascript
bulkCompleteSelected() {
  const selectedIds = Array.from(this.state.selectedTasks);

  this.retryWithBackoff(() => {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(response => {
          const { completed, conflicts } = response.results;

          if (conflicts.length > 0) {
            const conflictIds = conflicts.filter(c => c.versionConflict).map(c => c.taskId);
            this.retryConflictedTasks(conflictIds, 'complete'); // Per-task retry
          }
          resolve();
        })
        .appsheet_completeTask({ taskIds: selectedIds }); // Single bulk call
    });
  });
}
```

**Retry Logic**:
- Bulk call wrapped in `retryWithBackoff()` (3 retries, exponential backoff)
- Version conflicts retry individually via `retryConflictedTasks()`
- Supports all 4 operations: start, complete, snooze, cancel

### Time-Block Lifecycle

**Problem**: Scheduler appended blocks without cleanup, causing duplicates

**Solution**: Cleanup-before-append pattern in `IntelligentScheduler._persistTimeBlocks()`

**Algorithm**:
1. Extract unique days from blocks to persist
2. Fetch existing blocks via `getRowsByFilter()`
3. Identify rows to delete (matching days)
4. Delete via `deleteRowsByIndices()` (reverse-order)
5. Append new blocks via `appendRows()`

**Implementation**:
```javascript
const uniqueDays = new Set();
blocks.forEach(block => {
  const dayStr = TimeZoneAwareDate.toISOString(block.start_time).split('T')[0];
  uniqueDays.add(dayStr);
});

const existingBlocks = this.batchOperations.getRowsByFilter(SHEET_NAMES.TIME_BLOCKS, {});
const rowsToDelete = [];
existingBlocks.forEach((row, index) => {
  const rowDayStr = TimeZoneAwareDate.toISOString(new Date(row[startTimeIndex])).split('T')[0];
  if (uniqueDays.has(rowDayStr)) {
    rowsToDelete.push(index + 2); // +2 for header and 0-based to 1-based
  }
});

if (rowsToDelete.length > 0) {
  this.batchOperations.deleteRowsByIndices(SHEET_NAMES.TIME_BLOCKS, rowsToDelete);
}
this.batchOperations.appendRows(SHEET_NAMES.TIME_BLOCKS, rows);
```

**Logs**:
```
[IntelligentScheduler] Deleted 15 existing time blocks before append
[IntelligentScheduler] Persisted 12 time blocks to TIME_BLOCKS sheet
{ daysUpdated: 3, deletedBlocks: 15, addedBlocks: 12 }
```

### deleteRowsByIndices() API

**Purpose**: Bulk row deletion with index stability

**Signature**:
```javascript
deleteRowsByIndices(sheetName, rowIndices)
```

**Parameters**:
- `sheetName`: Sheet name (e.g., SHEET_NAMES.TIME_BLOCKS)
- `rowIndices`: Array of 1-based row indices to delete

**Behavior**:
- Sorts indices in descending order (reverse)
- Deletes from bottom up (prevents index shifting)
- Returns count of deleted rows

**Example**:
```javascript
const rowsToDelete = [2, 5, 8];
const deletedCount = batchOps.deleteRowsByIndices(SHEET_NAMES.TIME_BLOCKS, rowsToDelete);
// Deletes in order: row 8, row 5, row 2 (reverse)
// Returns: 3
```

### Read Pagination

**Purpose**: Efficient large dataset scans

**Signature**:
```javascript
getRowsByFilter(sheetName, filterObject, options)
```

**New Options**:
- `limit`: Number of rows to fetch (default: null = all rows)
- `offset`: Starting row offset (default: 0)

**Usage**:
```javascript
// Fetch 100 rows starting from row 50
const tasks = batchOps.getRowsByFilter(
  SHEET_NAMES.ACTIONS,
  { status: 'PENDING' },
  { limit: 100, offset: 50 }
);
```

**Optimization**: Uses `sheet.getRange()` for range-based loading when limit specified

### Validation Test

**Function**: `validatePhase6Batching()` in DeploymentValidation.gs

**Tests**:
1. `SmartLogger.flush()` method exists
2. `BatchOperations.deleteRowsByIndices()` method exists
3. `MockBatchOperations.appendRows()` instrumentation
4. `MockBatchOperations.updateActionWithOptimisticLocking()` instrumentation
5. `MockBatchOperations.deleteRowsByIndices()` instrumentation
6. Data integrity after deletions

**Run**:
```javascript
const result = validatePhase6Batching();
Logger.log(result); // true if all tests pass
```

### Verification Checklist

- [ ] `clasp push` completes without errors
- [ ] `validatePhase6Batching()` returns true
- [ ] `RUN_EVERYTHING_NOW()` passes all tests
- [ ] Bulk complete 10 tasks in DayPlanner UI
- [ ] Check ACTIVITY sheet for batched log entries
- [ ] Verify TIME_BLOCKS cleanup (no duplicates)
- [ ] Confirm optimistic lock conflicts retry correctly

---

## Phase 9: Testing & Validation Guide

### Comprehensive Test Execution

**Primary Test Entry Point**: `RUN_EVERYTHING_NOW()` in `src/RUN_EVERYTHING.gs`

This master test function runs all system validation in sequence, including:
- Core infrastructure tests (PersistentStore, CrossExecutionCache, ErrorHandler, SmartLogger)
- Red Flag validation (RF-3 through RF-6)
- Phase-specific tests (Phase 3, 6, 7)
- Master Test Orchestrator comprehensive suite
- Trigger functions
- System health checks

**Usage**:
```javascript
// In Apps Script editor
const result = RUN_EVERYTHING_NOW();
Logger.log(result);

// Expected output:
// {
//   summary: { total: 45, success: 44, errors: 1, duration: 120 },
//   details: [...]
// }
```

**Interpreting Results**:
- `success: 45` → All critical tests passed
- `errors: 1+` → Check FAILURES section for specific test names
- Duration >300s → Potential performance degradation

### Phase-Specific Validation Tests

#### Phase 3: Archive Reliability
**Function**: `validatePhase3Complete()` in `src/9_tests/DeploymentValidation.gs:432-498`

**Tests**:
- Retry logic with exponential backoff
- archived_at column header handling
- External vs. current spreadsheet routing
- Self-test cleanup pattern

**Run**:
```javascript
const result = validatePhase3Complete();
// Expected: true
```

#### Phase 6: Batching & Bulk Operations
**Function**: `validatePhase6Batching()` in `src/9_tests/DeploymentValidation.gs`

**Tests**:
- SmartLogger.flush() availability
- BatchOperations.deleteRowsByIndices() API
- MockBatchOperations instrumentation
- Optimistic locking callbacks
- Data integrity after bulk deletions

**Run**:
```javascript
const result = validatePhase6Batching();
// Expected: true
```

#### Phase 7: Chunked Maintenance & Lock Metrics
**Function**: `test_ChunkedMaintenance()` in `src/9_tests/ComprehensiveTests.gs:139-166`

**Tests**:
- Chunked archive operation metadata (chunks_processed, chunk_size)
- Archive count tracking (archived_count vs. total_candidates)
- Success flags for chunked operations

**Run**:
```javascript
const result = test_ChunkedMaintenance();
// Expected: true
```

**Additional Lock Validation**:
```javascript
// Check lock manager metrics
const lockManager = container.get(SERVICES.DistributedLockManager);
const metrics = lockManager.getMetrics();
Logger.log(metrics);
// Expected fields: acquireAttempts, timeouts, timeoutRate, successRate, contentionRate, staleLockAge
```

### Master Test Orchestrator

**Class**: `MasterTestOrchestrator` in `src/9_tests/MasterTestOrchestrator.gs`

**Comprehensive Suite**:
```javascript
const orchestrator = new MasterTestOrchestrator();
const report = orchestrator.runComprehensiveSuite({
  includeUnit: true,
  includeIntegration: true,
  includePerformance: true,
  includeSecurity: true,
  includeStress: false,  // Disable for CI/CD
  includeRegression: true
});

Logger.log(report);
// Expected: { authenticityVerified: true, summary: { passed: X, failed: 0 }, ... }
```

**Quick Validation** (for deployment readiness):
```javascript
const quickResult = orchestrator.runQuickValidation();
// Expected: { success: true, duration: <60000 }
```

### Test Result Interpretation

**Success Criteria**:
- All boolean test functions return `true`
- Master orchestrator `authenticityVerified: true`
- Zero failures in `RUN_EVERYTHING_NOW()` summary
- Health check `overall_status: "HEALTHY"`

**Common Failure Patterns**:

| Failure Type | Likely Cause | Fix |
|-------------|--------------|-----|
| Lock timeout test fails | Lock contention >5% | Increase lock timeout in TriggerOrchestrator |
| Chunked maintenance metadata missing | SystemManager.runSystemMaintenance() not updated | Verify Phase 7 changes applied |
| Schema validation fails | Missing headers | Run `healSheets()` via SystemManager |
| Optimistic lock test fails | Version conflict handling broken | Check BatchOperations.updateActionWithOptimisticLocking() |

---

## Health Monitoring Reference

### Health Check Execution

**Primary Function**: `SystemManager.runHealthCheck()` in `src/4_services/SystemManager.gs:68-244`

**Execution**:
```javascript
const systemManager = container.get(SERVICES.SystemManager);
const health = systemManager.runHealthCheck();
Logger.log(health);
```

**Response Structure**:
```javascript
{
  timestamp: "2025-10-08T14:35:22.000Z",
  overall_status: "HEALTHY",  // or "DEGRADED" or "ERROR"
  partial_failure_mode: false,
  checks: {
    database: { status: "HEALTHY", details: {...} },
    services: { status: "HEALTHY", details: {...} },
    data_integrity: {
      status: "HEALTHY",
      schema_validation: {
        passed: true,
        sheets_validated: 12,
        issues: []
      },
      details: {...}
    },
    configuration: { status: "HEALTHY", details: {...} },
    archives: {
      status: "HEALTHY",
      details: {
        location: "current",
        external_configured: false,
        total_archived_records: 487
      }
    },
    lock_manager: {
      status: "HEALTHY",
      details: {
        successRate: "98%",
        contentionRate: "2%",
        timeoutRate: "0%",
        timeouts: 0,
        staleLockAge: "300s"
      }
    },
    triggers: {
      status: "HEALTHY",
      details: {
        trigger_emailProcessing_state: "IDLE",
        trigger_schedulingCycle_last_run: "2025-10-08T14:30:00.000Z"
      }
    }
  }
}
```

### Health Check Persistence

Health check summaries are automatically persisted to STATUS sheet:

**STATUS Row**:
- `config_key`: "health_check_last_run"
- `config_value`: JSON summary with `{ status, timestamp, checks_count, partial_failure }`
- `updated_at`: ISO timestamp
- `status_flag`: "AUTO"

**Querying Historical Health**:
```javascript
const systemManager = container.get(SERVICES.SystemManager);
const status = systemManager.getSystemStatus();
const lastHealthCheck = JSON.parse(status['health_check_last_run'] || '{}');
Logger.log(lastHealthCheck);
```

### Health Status Interpretation

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| HEALTHY | All checks passed | None - routine monitoring |
| DEGRADED | Non-critical issues detected | Review `issues` array, schedule maintenance |
| ERROR | Critical failure in one or more checks | Immediate investigation required |
| CRITICAL_ERROR | Health check system itself failed | Check logs, verify container initialization |

**Partial Failure Mode**: When `partial_failure_mode: true`, some checks failed but health check continued. Review individual check statuses.

### Monitoring Metrics

**Lock Manager Metrics** (accessed via health check or directly):
```javascript
const lockManager = container.get(SERVICES.DistributedLockManager);
const metrics = lockManager.getMetrics();

// Alerting thresholds:
// - successRate <90% → DEGRADED
// - successRate <50% → ERROR
// - timeoutRate >5% → Investigate lock contention
// - contentionRate >10% → Consider trigger schedule adjustment
```

**Trigger State Tracking** (STATUS sheet rows):
- `trigger_{name}_state`: "IDLE" | "IN_PROGRESS"
- `trigger_{name}_last_start`: ISO timestamp
- `trigger_{name}_last_status`: "SUCCESS" | "FAILURE"

**Archive Statistics**:
```javascript
const archiveManager = container.get(SERVICES.ArchiveManager);
const stats = archiveManager.getArchiveStatistics();
// Returns: { total_archived_records, archive_sheets: { ACTIONS_ARCHIVE: {...}, PROPOSED_ARCHIVE: {...} } }
```

---

## Deployment Checklist

Pre-deployment validation steps to ensure system integrity before pushing to production.

### 1. Code Validation

- [ ] Run `node validate_load_order.js` (verify file load dependencies)
- [ ] Run `clasp push --dry-run` (syntax validation)
- [ ] Check for `BUILD:REMOVE` markers in production code (should only be in test files)
- [ ] Verify all Phase 1-9 changes committed to feature branch

### 2. Local Test Execution

- [ ] Run `RUN_EVERYTHING_NOW()` in Apps Script editor
- [ ] Verify all tests pass (errors: 0)
- [ ] Check execution duration <300s
- [ ] Review ACTIVITY sheet for ERROR-level logs

### 3. Schema Validation

- [ ] Run `healSheets()` via SystemManager
- [ ] Verify schema validation passes in health check
- [ ] Confirm all 12 required sheets exist
- [ ] Check headers match canonical definitions

### 4. Archive Health

- [ ] Run `archiveManager.selfTest()`
- [ ] Verify `{ success: true, rows_appended: 1 }`
- [ ] Check ACTIONS_ARCHIVE and PROPOSED_ARCHIVE sheets populated
- [ ] Confirm archived_at column present in both archive sheets

### 5. Lock Manager

- [ ] Run health check: `systemManager.runHealthCheck()`
- [ ] Verify lock_manager status: HEALTHY
- [ ] Check successRate >95%
- [ ] Confirm timeoutRate <1%

### 6. Trigger Validation

- [ ] Verify all trigger state rows exist in STATUS sheet
- [ ] Confirm last run timestamps within expected intervals
- [ ] Check trigger idempotency guards functional (run same trigger twice)
- [ ] Validate no trigger state stuck in IN_PROGRESS >10 minutes

### 7. Performance Baselines

- [ ] Run `MasterTestOrchestrator.runComprehensiveSuite()` with performance tests
- [ ] Verify no >20% performance regression from baselines
- [ ] Check memory delta <5MB after test suite
- [ ] Confirm no memory leaks detected

### 8. Production Readiness

- [ ] Run `isSystemReadyForDeployment()` (must return true)
- [ ] Review logs for any WARNING or ERROR entries
- [ ] Verify container initialization completes <2s
- [ ] Confirm all services registered and available

### 9. Deployment Execution

```bash
# Push to production
clasp push

# Open Apps Script editor
clasp open

# Run post-deployment validation
RUN_EVERYTHING_NOW()
systemManager.runHealthCheck()

# Monitor for 15 minutes
# Check logs: clasp logs
```

### 10. Post-Deployment Verification

- [ ] Health check overall_status: HEALTHY
- [ ] No ERROR logs in ACTIVITY sheet (last 30 minutes)
- [ ] Trigger execution successful (check STATUS rows updated)
- [ ] User-facing features functional (DayPlanner, ChatEngine)
- [ ] Archive operations writing to correct spreadsheet

### Rollback Procedure

If critical issues detected post-deployment:

```bash
# Revert to previous version
git revert <commit-hash>
clasp push

# Verify rollback successful
clasp open
RUN_EVERYTHING_NOW()

# Check health
systemManager.runHealthCheck()
```

---

## Maintenance Schedule

Recommended periodic maintenance operations to ensure system health and performance.

### Daily Operations

**Automated** (via TriggerOrchestrator):
- Email processing (`runEmailProcessing`) - Every 15 minutes
- Scheduling cycle (`runSchedulingCycle`) - Every hour
- Calendar sync (`runCalendarSync`) - Every 30 minutes
- Foundation blocks creation (`runFoundationBlocks`) - Daily at 6 AM

**Manual** (optional):
- Review ACTIVITY sheet for ERROR/WARN logs
- Check STATUS sheet trigger states (all should be IDLE)

### Weekly Operations

- [ ] Run `systemManager.runHealthCheck()` manually
- [ ] Review health check details for DEGRADED statuses
- [ ] Check archive statistics for growth trends
- [ ] Verify lock manager metrics (successRate >95%)
- [ ] Run `RUN_EVERYTHING_NOW()` to catch regressions
- [ ] Review SENDER_REPUTATION for spam trends

### Monthly Operations

- [ ] Run comprehensive test suite: `MasterTestOrchestrator.runComprehensiveSuite({ includeStress: true })`
- [ ] Analyze performance benchmarks vs. baselines
- [ ] Archive old ACTIVITY logs (>90 days) manually
- [ ] Review external archive spreadsheet accessibility (if configured)
- [ ] Validate all trigger schedules still appropriate
- [ ] Check for Google Apps Script runtime updates

### Quarterly Operations

- [ ] Full schema validation: `healSheets()` with force repair
- [ ] Review and optimize APPSHEET_CONFIG settings
- [ ] Audit SENDER_REPUTATION data quality
- [ ] Performance regression testing (compare with Q-1)
- [ ] Security validation: `SecurityValidationHarness`
- [ ] Update performance baselines if needed

### Maintenance Thresholds

Trigger manual intervention when:
- ACTIVITY sheet >10,000 rows (archive old logs)
- ACTIONS sheet >5,000 rows (review completion rates)
- Lock manager timeoutRate >3%
- Health check DEGRADED status persists >24h
- Archive operations consistently exceed 50-task chunks
- Any trigger execution duration >2 minutes

---

## Incident Response Runbook

Emergency procedures for common production issues.

### Issue: System Health Check Fails

**Symptoms**:
- `runHealthCheck()` returns `overall_status: "ERROR"`
- Multiple checks in CRITICAL_ERROR state
- Partial failure mode enabled

**Diagnosis**:
```javascript
const health = systemManager.runHealthCheck();
Logger.log(health.checks);  // Review each check status
```

**Resolution Steps**:
1. Identify failing check (database, services, data_integrity, etc.)
2. If database check fails:
   - Verify spreadsheet accessible: `getActiveSystemSpreadsheet()`
   - Check sheet permissions (not in read-only mode)
   - Run `healSheets()` to repair missing sheets
3. If services check fails:
   - Verify container initialization: `container.has(SERVICES.SmartLogger)`
   - Check for missing dependencies in service registration
   - Review ACTIVITY logs for bootstrap errors
4. If data_integrity fails:
   - Run schema validation: `SheetHealer.validateSchemas()`
   - Check for missing required columns
   - Review ACTIONS/PROPOSED_TASKS for data corruption

**Escalation**: If all steps fail, revert to last known good deployment.

### Issue: Archive Operations Timeout

**Symptoms**:
- `archiveCompletedTasks()` exceeds 5 minutes
- Maintenance operations fail with timeout errors
- Health check shows archive status: ERROR

**Diagnosis**:
```javascript
const archiveManager = container.get(SERVICES.ArchiveManager);
const stats = archiveManager.getArchiveStatistics();
Logger.log(stats);  // Check total_archived_records growth
```

**Resolution Steps**:
1. Reduce chunk size: Update APPSHEET_CONFIG `ARCHIVE_BATCH_LIMIT` to 30 (from 50)
2. Verify external archive accessible (if configured):
   ```javascript
   const status = archiveManager.getArchiveStatus();
   Logger.log(status.external_accessible);
   ```
3. Check for rate limiting: Review logs for "Service unavailable" errors
4. Increase inter-chunk delay in SystemManager.gs (200ms → 500ms)
5. Temporarily disable automatic archiving, run manual chunked archiving:
   ```javascript
   const completedTasks = batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, { status: 'COMPLETED' });
   const chunks = [];
   for (let i = 0; i < Math.min(completedTasks.length, 100); i += 20) {
     chunks.push(completedTasks.slice(i, i + 20));
   }
   chunks.forEach((chunk, i) => {
     archiveManager.archiveCompletedTasks(chunk);
     Utilities.sleep(1000);
   });
   ```

**Prevention**: Monitor archive candidates weekly, adjust ARCHIVE_BATCH_LIMIT proactively.

### Issue: Lock Manager High Contention

**Symptoms**:
- Lock manager contentionRate >10%
- Triggers frequently skipped with "lock unavailable"
- timeoutRate >5%

**Diagnosis**:
```javascript
const lockManager = container.get(SERVICES.DistributedLockManager);
const metrics = lockManager.getMetrics();
Logger.log(metrics);

// Check active locks
const activeLocks = lockManager.getActiveLocks();
Logger.log(activeLocks);  // Look for stale locks
```

**Resolution Steps**:
1. Identify stale locks (age >300s):
   ```javascript
   activeLocks.forEach(lock => {
     const age = Date.now() - new Date(lock.acquired_at).getTime();
     if (age > 300000) {
       Logger.log(`Stale lock: ${lock.resource_name}, age: ${age}ms`);
     }
   });
   ```
2. Clear stale locks: `lockManager._cleanupStaleLocks()` (runs automatically, but can force)
3. Review trigger schedule for overlaps:
   ```javascript
   const triggers = ScriptApp.getProjectTriggers();
   triggers.forEach(t => Logger.log(`${t.getHandlerFunction()}: ${t.getTriggerSource()}`));
   ```
4. Increase lock timeout for long-running operations:
   - Edit TriggerOrchestrator._runTrigger calls
   - Increase lockTimeout from 15000ms to 30000ms for specific triggers
5. Implement trigger staggering (offset schedules by 5 minutes)

**Escalation**: If contention persists, consider disabling non-critical triggers temporarily.

### Issue: Trigger Stuck in IN_PROGRESS

**Symptoms**:
- STATUS row shows trigger state: IN_PROGRESS for >10 minutes
- Subsequent trigger executions skipped
- No recent logs from affected trigger

**Diagnosis**:
```javascript
const status = systemManager.getSystemStatus();
for (const key in status) {
  if (key.includes('_state') && status[key] === 'IN_PROGRESS') {
    Logger.log(`Stuck trigger: ${key}, last_start: ${status[key.replace('_state', '_last_start')]}`);
  }
}
```

**Resolution Steps**:
1. Verify trigger not actually running (check Apps Script executions dashboard)
2. Manually reset trigger state:
   ```javascript
   systemManager.markTriggerCompleted('triggerName', 'RESET');
   ```
3. Check for unhandled exceptions in trigger logic (review logs)
4. Verify lock was released (check active locks)
5. If recurring, increase 5-minute idempotency window in `shouldSkipTrigger()`

**Prevention**: Ensure all trigger logic wrapped in try/finally with lock release.

### Issue: Schema Validation Failures

**Symptoms**:
- Health check data_integrity shows schema_validation.passed: false
- Missing or mismatched headers in critical sheets
- BatchOperations throws "Column not found" errors

**Diagnosis**:
```javascript
const schemaResults = SheetHealer.validateSchemas();
Logger.log(schemaResults);  // Review results.invalid sheets
```

**Resolution Steps**:
1. Run schema repair: `healSheets()`
2. Check for manual header edits (revert if found)
3. Verify canonical schema definitions in SheetHealer match SHEET_NAMES
4. For critical failures, restore from backup:
   - Export current sheet as CSV
   - Delete corrupted sheet
   - Run `healSheets()` to recreate
   - Re-import data (excluding header row)

**Prevention**: Restrict sheet editing permissions, document all schema changes.

---

## Security & Data Handling

Security best practices and data handling guidelines.

### Access Control

**Spreadsheet Permissions**:
- Production spreadsheet: Owner + specific editors only
- External archive (if used): Same owner, restricted sharing
- Never share with "Anyone with link"

**Apps Script Permissions**:
- Review OAuth scopes in appsscript.json (minimize permissions)
- Audit authorized users regularly
- Revoke access for departed team members

### Sensitive Data Handling

**Email Content**:
- Raw email bodies stored in PROPOSED_TASKS.raw_content_preview (truncated)
- Full content not persisted beyond LLM processing
- Archive PROPOSED_TASKS after 90 days

**Sender Reputation**:
- Email addresses stored in SENDER_REPUTATION sheet
- Consider anonymization for compliance (hash emails)
- Retention: 1 year, then archive

**Activity Logs**:
- May contain user-identifiable information (action_id, task titles)
- Archive logs >90 days to external secure storage
- Sanitize logs before external sharing

### Data Sanitization

**Before Exporting Logs**:
```javascript
function sanitizeLogs(logs) {
  return logs.map(log => ({
    ...log,
    component: log.component,
    message: log.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]'),
    context: sanitizeContext(log.context)
  }));
}

function sanitizeContext(context) {
  if (typeof context === 'string') {
    try {
      context = JSON.parse(context);
    } catch (e) {
      return '[REDACTED]';
    }
  }
  // Remove email, action_id, task titles
  const sanitized = { ...context };
  delete sanitized.email;
  delete sanitized.action_id;
  delete sanitized.title;
  return JSON.stringify(sanitized);
}
```

### Encryption

**At Rest**:
- Google Sheets encryption handled by Google (AES-256)
- External archives inherit destination encryption
- No additional encryption required for standard deployments

**In Transit**:
- All API calls use HTTPS (enforced by Apps Script runtime)
- Gmail/Calendar API calls encrypted by Google

**Secrets Management**:
- Store API keys in PropertiesService (Script Properties)
- Never commit secrets to version control
- Rotate credentials quarterly

### Compliance Considerations

**GDPR** (if handling EU user data):
- Right to deletion: Implement manual row deletion in ACTIONS/PROPOSED_TASKS
- Data portability: Export user data to CSV via BatchOperations
- Consent tracking: Add `consent_timestamp` column if needed

**Data Retention**:
- ACTIONS: Indefinite (user task history)
- PROPOSED_TASKS: 90 days (archive then delete)
- ACTIVITY logs: 90 days (archive to external storage)
- SENDER_REPUTATION: 1 year

---

## Release Process Template

Standardized process for deploying new features and fixes.

### Pre-Release

1. **Feature Branch Setup**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/phase-X-description
   ```

2. **Development**:
   - Implement changes per phase specification
   - Update tests (add to ComprehensiveTests.gs or DeploymentValidation.gs)
   - Update documentation (append to archiving.md or create new docs/)

3. **Local Validation**:
   ```bash
   node validate_load_order.js
   clasp push
   # In Apps Script editor:
   RUN_EVERYTHING_NOW()
   ```

4. **Phase Completion Checklist**:
   - [ ] All code changes committed
   - [ ] Tests added and passing
   - [ ] Documentation updated
   - [ ] No BUILD:REMOVE markers in production code
   - [ ] Performance regression <10%

### Release

5. **Create Pull Request**:
   ```bash
   git add .
   git commit -m "Phase X: [Description]

   - Change 1
   - Change 2
   - Change 3

   Tests: [List test functions]
   Docs: [Updated files]"

   git push origin feature/phase-X-description
   ```

6. **Code Review**:
   - Self-review: Check diff for unintended changes
   - Peer review: Request review if team available
   - Automated checks: Verify load order validation passes

7. **Merge to Main**:
   ```bash
   git checkout main
   git merge feature/phase-X-description
   git push origin main
   ```

### Deployment

8. **Production Push**:
   ```bash
   clasp push
   clasp open
   # Run in editor:
   RUN_EVERYTHING_NOW()
   systemManager.runHealthCheck()
   ```

9. **Smoke Testing** (first 15 minutes):
   - Verify health check: HEALTHY
   - Check ACTIVITY logs: No ERROR entries
   - Confirm triggers executing (check STATUS rows updated)
   - Test one user workflow end-to-end (e.g., email → proposal → task)

10. **Monitoring** (first 24 hours):
    - Check health check every 4 hours
    - Review ACTIVITY sheet for anomalies
    - Monitor lock manager metrics
    - Validate archive operations completing successfully

### Post-Release

11. **Release Notes**:
    - Document changes in CHANGELOG.md
    - Update version in package.json (if applicable)
    - Tag release: `git tag phase-X-v1.0.0 && git push --tags`

12. **Retrospective**:
    - Note any issues encountered
    - Update runbook with new troubleshooting steps
    - Adjust phase templates based on lessons learned

### Hotfix Process

For critical production issues:

1. **Create hotfix branch from main**:
   ```bash
   git checkout main
   git checkout -b hotfix/issue-description
   ```

2. **Minimal fix** (no scope creep):
   - Fix only the critical issue
   - Add regression test
   - Update docs if behavior changed

3. **Fast-track validation**:
   ```bash
   clasp push
   # Run affected tests only
   test_SpecificIssue()
   ```

4. **Deploy immediately**:
   ```bash
   git commit -m "Hotfix: [Issue]"
   git checkout main
   git merge hotfix/issue-description
   git push origin main
   clasp push
   ```

5. **Post-hotfix**:
   - Monitor for 1 hour
   - Create post-mortem doc
   - Schedule follow-up fixes if needed
