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
