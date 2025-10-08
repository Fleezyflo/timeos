# MINIMAL INTERVENTION REMEDIATION PLAN
**MOH Time OS v2.0 - Critical Schema & Archival Fixes**

**Date**: 2025-10-08  
**Approach**: Surgical fixes, minimal code changes, zero migrations  
**Philosophy**: Fix forward, not backward. Accept existing data loss, prevent future corruption.

---

## EXECUTION PRINCIPLES

### Core Constraints
1. ✅ **No Data Migrations**: Accept existing HUMAN_STATE data is corrupt, fix going forward
2. ✅ **Minimal Code Changes**: Only modify what's broken
3. ✅ **No New Infrastructure**: Use existing ArchiveManager, no new frameworks
4. ✅ **Forward-Compatible**: New code writes correct schema
5. ✅ **Fast Deployment**: Can be deployed in < 2 hours

### What We're NOT Doing
- ❌ No complex migration scripts
- ❌ No data backfilling
- ❌ No temporary sheets
- ❌ No atomic swaps
- ❌ No extensive test frameworks
- ❌ No documentation rewrites

### What We ARE Doing
- ✅ Fix 4 methods in HumanStateManager.gs (30 lines)
- ✅ Add 3 methods to SystemManager.gs (200 lines)
- ✅ Add 3 trigger functions (30 lines)
- ✅ Add 10 config rows to APPSHEET_CONFIG
- ✅ Update CHANGELOG.md (50 lines)
- **Total Changes: ~310 lines of code**

---

## PHASE 1: HUMAN_STATE SCHEMA FIX (CRITICAL - 15 MINUTES)

### 1.1 Fix HumanStateManager.recordHumanState()
**File**: `src/4_services/HumanStateManager.gs`  
**Lines**: 34-42  
**Change Type**: Edit existing array

**FIND**:
```javascript
      const stateEntry = [
        timestamp,
        state.energy || 'MEDIUM',
        state.mood || 'NEUTRAL',
        state.focus || 'NORMAL',
        sanitizeString(state.notes || ''),
        'MANUAL', // Source: manual vs detected
        JSON.stringify(state) // Full state for analysis
      ];
```

**REPLACE WITH**:
```javascript
      const stateEntry = [
        Utilities.getUuid(),                    // state_id
        timestamp,                              // timestamp
        state.energy || 'MEDIUM',              // energy_level
        state.focus || 'NORMAL',               // focus_level
        state.mood || 'NEUTRAL',               // mood
        state.stress || '',                    // stress_level
        state.context || 'MANUAL',             // current_context
        sanitizeString(state.notes || '')     // notes
      ];
```

**Verification**: Write test state, verify 8 columns in sheet

---

### 1.2 Fix HumanStateManager.getCurrentHumanState()
**File**: `src/4_services/HumanStateManager.gs`  
**Lines**: 92-97  
**Change Type**: Update column indices

**FIND**:
```javascript
      const weightedStates = recentStates.map((state, index) => ({
        energy: this._mapStateToNumber(state[1], 'energy'),
        mood: this._mapStateToNumber(state[2], 'mood'),
        focus: this._mapStateToNumber(state[3], 'focus'),
        weight: weights[index] / totalWeight
      }));
```

**REPLACE WITH**:
```javascript
      const weightedStates = recentStates.map((state, index) => ({
        energy: this._mapStateToNumber(state[2], 'energy'),
        focus: this._mapStateToNumber(state[3], 'focus'),
        mood: this._mapStateToNumber(state[4], 'mood'),
        stress: this._mapStateToNumber(state[5], 'stress'),
        weight: weights[index] / totalWeight
      }));
```

**Note**: This will only work correctly for NEW data written after 1.1 fix. Old data will read wrong columns - **ACCEPTED LIMITATION**.

---

### 1.3 Update _getDefaultHumanState()
**File**: `src/4_services/HumanStateManager.gs`  
**Lines**: 121-131  
**Change Type**: Add stress field

**FIND**:
```javascript
  _getDefaultHumanState() {
    return {
      energy: 'MEDIUM',
      mood: 'NEUTRAL',
      focus: 'NORMAL',
      confidence: 0,
      lastUpdated: null,
      dataPoints: 0
    };
  }
```

**REPLACE WITH**:
```javascript
  _getDefaultHumanState() {
    return {
      energy: 'MEDIUM',
      mood: 'NEUTRAL',
      focus: 'NORMAL',
      stress: 'NORMAL',
      confidence: 0,
      lastUpdated: null,
      dataPoints: 0
    };
  }
```

---

### 1.4 Add Stress Mapping Methods
**File**: `src/4_services/HumanStateManager.gs`  
**Lines**: End of class (after last existing method)  
**Change Type**: Append new methods

**ADD AT END OF CLASS**:
```javascript
  /**
   * Map stress state to numerical score
   */
  _mapStressToNumber(stress) {
    const stressMap = {
      'MINIMAL': 20,
      'LOW': 40,
      'NORMAL': 60,
      'HIGH': 80,
      'CRITICAL': 100
    };
    return stressMap[stress] || stressMap['NORMAL'];
  }

  /**
   * Map numerical score to stress state
   */
  _mapNumberToStress(score) {
    if (score >= 90) return 'CRITICAL';
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'NORMAL';
    if (score >= 30) return 'LOW';
    return 'MINIMAL';
  }
```

---

### 1.5 Handle Old Data (OPTIONAL - Manual Cleanup)

**Option 1: Clear HUMAN_STATE Sheet**
```javascript
// In GAS editor, run once:
function clearOldHumanStateData() {
  const ss = getActiveSystemSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.HUMAN_STATE);
  
  // Delete all data rows, keep header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  Logger.log('HUMAN_STATE cleared. New writes will use correct 8-column schema.');
}
```

**Option 2: Leave Old Data**
- Accept that old data (7 columns) is corrupt
- New writes (8 columns) will be correct
- getCurrentHumanState() will read mixed data incorrectly until old data ages out
- **Degraded state for ~4 hours** (recency window), then self-healing

**Recommended**: Option 1 if sheet has < 100 rows, Option 2 if data is critical to preserve.

---

### 1.6 Deployment
```bash
# 1. Edit HumanStateManager.gs with 4 changes above
# 2. npm run push
# 3. Test: Create new human state via AppSheet
# 4. Verify: Check HUMAN_STATE sheet has 8 columns
# 5. (Optional) Run clearOldHumanStateData() if chosen
```

**Time**: 15 minutes  
**Risk**: LOW (forward-only fix)

---

## PHASE 2: ACTIVITY ARCHIVAL (HIGH - 45 MINUTES)

### 2.1 Add archiveOldActivity() to SystemManager
**File**: `src/4_services/SystemManager.gs`  
**Lines**: End of class (after last method)  
**Change Type**: Append new method

**ADD AT END OF SYSTEMMANAGER CLASS**:
```javascript
  /**
   * Archive old ACTIVITY logs to ACTIVITY_ARCHIVE
   * Default: 90-day retention
   */
  archiveOldActivity(options = {}) {
    const logger = this.logger;
    const batchOps = this.batchOperations;
    
    try {
      const retentionDays = options.retentionDays || 90;
      const dryRun = options.dryRun || false;
      
      logger.info('SystemManager', 'Starting ACTIVITY archival', {
        retention_days: retentionDays,
        dry_run: dryRun
      });
      
      // Calculate cutoff
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffISO = TimeZoneAwareDate.toISOString(cutoffDate);
      
      // Get old rows
      const allRows = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {});
      const oldRows = allRows.filter(row => row[0] < cutoffISO);
      
      if (oldRows.length === 0) {
        return { success: true, archived: 0, message: 'No old logs' };
      }
      
      logger.info('SystemManager', `Found ${oldRows.length} rows to archive`);
      
      if (dryRun) {
        return { success: true, dry_run: true, eligible: oldRows.length };
      }
      
      // Add archived_at timestamp
      const archiveRows = oldRows.map(row => [...row, TimeZoneAwareDate.now()]);
      
      // Append to ACTIVITY_ARCHIVE
      const archiveMgr = container.get(SERVICES.ArchiveManager);
      archiveMgr.appendToArchive('ACTIVITY_ARCHIVE', archiveRows);
      
      // Delete from main sheet
      const ss = getActiveSystemSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAMES.ACTIVITY);
      const timestamps = new Set(oldRows.map(r => r[0]));
      
      const allData = sheet.getDataRange().getValues();
      const rowsToDelete = [];
      for (let i = allData.length - 1; i >= 1; i--) {
        if (timestamps.has(allData[i][0])) {
          sheet.deleteRow(i + 1);
        }
      }
      
      logger.info('SystemManager', 'ACTIVITY archival complete', {
        archived: oldRows.length
      });
      
      return { success: true, archived: oldRows.length };
      
    } catch (error) {
      logger.error('SystemManager', 'ACTIVITY archival failed', {
        error: error.message
      });
      throw error;
    }
  }
```

---

### 2.2 Add Trigger Function
**File**: `src/5_web/TriggerOrchestrator.gs`  
**Lines**: End of file  
**Change Type**: Append new functions

**ADD AT END OF FILE**:
```javascript
/**
 * Daily ACTIVITY archival trigger handler
 */
function runActivityArchival() {
  try {
    const systemMgr = container.get(SERVICES.SystemManager);
    const result = systemMgr.archiveOldActivity();
    Logger.log('ACTIVITY archival: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('ACTIVITY archival failed: ' + error.message);
  }
}

/**
 * Install ACTIVITY archival trigger (run once)
 */
function installActivityArchivalTrigger() {
  // Delete existing
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'runActivityArchival') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Create daily 2 AM trigger
  ScriptApp.newTrigger('runActivityArchival')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
  
  Logger.log('ACTIVITY archival trigger installed');
}
```

---

### 2.3 Add Configuration
**Action**: Manually add to APPSHEET_CONFIG sheet

| row_id | category | subcategory | item | key | value | description |
|--------|----------|-------------|------|-----|-------|-------------|
| cfg_activity_001 | ACTIVITY | RETENTION | Days | ACTIVITY_RETENTION_DAYS | 90 | Days to keep logs |
| cfg_activity_002 | ACTIVITY | RETENTION | Enabled | ACTIVITY_ARCHIVE_ENABLED | true | Enable archival |

---

### 2.4 Deployment
```bash
# 1. Edit SystemManager.gs - add archiveOldActivity()
# 2. Edit TriggerOrchestrator.gs - add trigger functions
# 3. Add 2 rows to APPSHEET_CONFIG sheet (manual)
# 4. npm run push
# 5. In GAS editor: installActivityArchivalTrigger()
# 6. Test: runActivityArchival() - check logs
```

**Time**: 45 minutes  
**Risk**: LOW (non-breaking addition)

---

## PHASE 3: ACTIONS/PROPOSALS ARCHIVAL (HIGH - 45 MINUTES)

### 3.1 Add archiveOldActions() to SystemManager
**File**: `src/4_services/SystemManager.gs`  
**Lines**: After archiveOldActivity()  
**Change Type**: Append new method

**ADD AFTER archiveOldActivity()**:
```javascript
  /**
   * Archive old completed ACTIONS
   */
  archiveOldActions(options = {}) {
    const logger = this.logger;
    const batchOps = this.batchOperations;
    
    try {
      const ageThresholdDays = options.ageThresholdDays || 90;
      const dryRun = options.dryRun || false;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ageThresholdDays);
      const cutoffISO = TimeZoneAwareDate.toISOString(cutoffDate);
      
      const allActions = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
      const headers = batchOps.getHeaders(SHEET_NAMES.ACTIONS);
      
      const statusIdx = headers.indexOf('status');
      const completedIdx = headers.indexOf('completed_date');
      
      const oldActions = allActions.filter(row => {
        const status = row[statusIdx];
        const completed = row[completedIdx];
        return ['COMPLETED', 'CANCELED'].includes(status) && completed < cutoffISO;
      });
      
      if (oldActions.length === 0) {
        return { success: true, archived: 0 };
      }
      
      if (dryRun) {
        return { success: true, dry_run: true, eligible: oldActions.length };
      }
      
      // Archive via ArchiveManager
      const archiveMgr = container.get(SERVICES.ArchiveManager);
      archiveMgr.archiveCompletedTasks(oldActions);
      
      // Delete from main sheet
      const ss = getActiveSystemSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAMES.ACTIONS);
      const actionIds = new Set(oldActions.map(r => r[0]));
      
      const allData = sheet.getDataRange().getValues();
      for (let i = allData.length - 1; i >= 1; i--) {
        if (actionIds.has(allData[i][0])) {
          sheet.deleteRow(i + 1);
        }
      }
      
      logger.info('SystemManager', 'ACTIONS archived', { count: oldActions.length });
      
      return { success: true, archived: oldActions.length };
      
    } catch (error) {
      logger.error('SystemManager', 'ACTIONS archival failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Archive old processed PROPOSED_TASKS
   */
  archiveOldProposals(options = {}) {
    const logger = this.logger;
    const batchOps = this.batchOperations;
    
    try {
      const ageThresholdDays = options.ageThresholdDays || 90;
      const dryRun = options.dryRun || false;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - ageThresholdDays);
      const cutoffISO = TimeZoneAwareDate.toISOString(cutoffDate);
      
      const allProposals = batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, {});
      const headers = batchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS);
      
      const statusIdx = headers.indexOf('status');
      const processedIdx = headers.indexOf('processed_at');
      
      const oldProposals = allProposals.filter(row => {
        const status = row[statusIdx];
        const processed = row[processedIdx];
        return ['ACCEPTED', 'REJECTED'].includes(status) && processed < cutoffISO;
      });
      
      if (oldProposals.length === 0) {
        return { success: true, archived: 0 };
      }
      
      if (dryRun) {
        return { success: true, dry_run: true, eligible: oldProposals.length };
      }
      
      // Archive via ArchiveManager
      const archiveMgr = container.get(SERVICES.ArchiveManager);
      archiveMgr.archiveProcessedProposals(oldProposals);
      
      // Delete from main sheet
      const ss = getActiveSystemSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAMES.PROPOSED_TASKS);
      const proposalIds = new Set(oldProposals.map(r => r[0]));
      
      const allData = sheet.getDataRange().getValues();
      for (let i = allData.length - 1; i >= 1; i--) {
        if (proposalIds.has(allData[i][0])) {
          sheet.deleteRow(i + 1);
        }
      }
      
      logger.info('SystemManager', 'PROPOSALS archived', { count: oldProposals.length });
      
      return { success: true, archived: oldProposals.length };
      
    } catch (error) {
      logger.error('SystemManager', 'PROPOSALS archival failed', { error: error.message });
      throw error;
    }
  }
```

---

### 3.2 Add Trigger Functions
**File**: `src/5_web/TriggerOrchestrator.gs`  
**Lines**: After runActivityArchival()  
**Change Type**: Append new functions

**ADD AFTER runActivityArchival()**:
```javascript
/**
 * Weekly ACTIONS archival trigger handler
 */
function runActionsArchival() {
  try {
    const systemMgr = container.get(SERVICES.SystemManager);
    const result = systemMgr.archiveOldActions();
    Logger.log('ACTIONS archival: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('ACTIONS archival failed: ' + error.message);
  }
}

/**
 * Weekly PROPOSALS archival trigger handler
 */
function runProposalsArchival() {
  try {
    const systemMgr = container.get(SERVICES.SystemManager);
    const result = systemMgr.archiveOldProposals();
    Logger.log('PROPOSALS archival: ' + JSON.stringify(result));
  } catch (error) {
    Logger.log('PROPOSALS archival failed: ' + error.message);
  }
}

/**
 * Install ACTIONS/PROPOSALS archival triggers (run once)
 */
function installArchivalTriggers() {
  // Delete existing
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['runActionsArchival', 'runProposalsArchival'].includes(t.getHandlerFunction())) {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // ACTIONS: Weekly Sunday 3 AM
  ScriptApp.newTrigger('runActionsArchival')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();
  
  // PROPOSALS: Weekly Sunday 4 AM
  ScriptApp.newTrigger('runProposalsArchival')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(4)
    .create();
  
  Logger.log('ACTIONS/PROPOSALS archival triggers installed');
}
```

---

### 3.3 Add Configuration
**Action**: Manually add to APPSHEET_CONFIG sheet

| row_id | category | subcategory | item | key | value | description |
|--------|----------|-------------|------|-----|-------|-------------|
| cfg_archive_001 | ARCHIVE | ACTIONS | Days | ACTIONS_ARCHIVE_AGE_DAYS | 90 | Days before archiving completed actions |
| cfg_archive_002 | ARCHIVE | ACTIONS | Enabled | ACTIONS_ARCHIVE_ENABLED | true | Enable ACTIONS archival |
| cfg_archive_003 | ARCHIVE | PROPOSALS | Days | PROPOSALS_ARCHIVE_AGE_DAYS | 90 | Days before archiving proposals |
| cfg_archive_004 | ARCHIVE | PROPOSALS | Enabled | PROPOSALS_ARCHIVE_ENABLED | true | Enable PROPOSALS archival |

---

### 3.4 Deployment
```bash
# 1. Edit SystemManager.gs - add archiveOldActions(), archiveOldProposals()
# 2. Edit TriggerOrchestrator.gs - add trigger functions
# 3. Add 4 rows to APPSHEET_CONFIG sheet (manual)
# 4. npm run push
# 5. In GAS editor: installArchivalTriggers()
# 6. Test: runActionsArchival(), runProposalsArchival()
```

**Time**: 45 minutes  
**Risk**: LOW (non-breaking addition)

---

## PHASE 4: DOCUMENTATION (MEDIUM - 15 MINUTES)

### 4.1 Update CHANGELOG.md
**File**: `CHANGELOG.md`  
**Lines**: After Phase 10 section (line 67)  
**Change Type**: Insert new section

**INSERT BEFORE LINE 67**:
```markdown
## [2.0.0-phase3.1] - 2025-10-08

### Fixed - Critical Schema & Archival Issues

#### HUMAN_STATE Schema Alignment (CRITICAL)
- **Fixed schema mismatch** in `src/4_services/HumanStateManager.gs`
  - Now writes 8 columns matching SheetHealer definition
  - Added state_id primary key (UUID)
  - Fixed mood/focus_level column swap (columns D/E)
  - Added stress_level field
  - Corrected column positions for notes, current_context
- **Impact**: New writes use correct schema. Old data (7 columns) deprecated.
- **Migration**: Not performed. Old data accepted as lost. Clean slate recommended.

#### Archive Implementation
- **Added SystemManager.archiveOldActivity()** for ACTIVITY log retention
  - Default: 90-day retention
  - Daily trigger (2 AM Dubai time)
  - Prevents unbounded sheet growth
  
- **Added SystemManager.archiveOldActions()** for completed task archival
  - Archives COMPLETED/CANCELED actions older than 90 days
  - Weekly trigger (Sunday 3 AM)
  
- **Added SystemManager.archiveOldProposals()** for processed proposal archival
  - Archives ACCEPTED/REJECTED proposals older than 90 days
  - Weekly trigger (Sunday 4 AM)

### Configuration
New APPSHEET_CONFIG entries:
- ACTIVITY_RETENTION_DAYS (default: 90)
- ACTIVITY_ARCHIVE_ENABLED (default: true)
- ACTIONS_ARCHIVE_AGE_DAYS (default: 90)
- ACTIONS_ARCHIVE_ENABLED (default: true)
- PROPOSALS_ARCHIVE_AGE_DAYS (default: 90)
- PROPOSALS_ARCHIVE_ENABLED (default: true)

### Technical Details
- **Files Modified**: 3 (HumanStateManager.gs, SystemManager.gs, TriggerOrchestrator.gs)
- **LOC Changed**: ~310 lines
- **Triggers Added**: 3 (ACTIVITY daily, ACTIONS weekly, PROPOSALS weekly)
- **Deployment Time**: ~2 hours
- **Breaking Changes**: HUMAN_STATE schema (forward-only fix)

---

```

**Update Phase 3 Section** (lines 248-252):
```markdown
248  #### Archive Operations
249  - **Archive infrastructure** (Phase 3)
250    - ArchiveManager service with manual archival methods
251    - Schema definitions for archive sheets
252  - **Archive automation** (Phase 3.1 - 2025-10-08)
253    - Automated archival implemented in SystemManager
254    - Triggers configured for daily/weekly execution
255    - See Phase 3.1 section for details
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment (5 minutes)
- [ ] Create backup: `container.get(SERVICES.BackupManager).createBackup()`
- [ ] Run `node validate_load_order.js`
- [ ] Commit all changes to git

### Phase 1: HUMAN_STATE Fix (15 minutes)
- [ ] Edit `src/4_services/HumanStateManager.gs`:
  - [ ] Fix recordHumanState() (lines 34-42)
  - [ ] Fix getCurrentHumanState() (lines 92-97)
  - [ ] Update _getDefaultHumanState() (lines 121-131)
  - [ ] Add _mapStressToNumber() method (end of class)
  - [ ] Add _mapNumberToStress() method (end of class)
- [ ] `npm run push`
- [ ] Test: Create human state via AppSheet, verify 8 columns in sheet
- [ ] (Optional) Clear old HUMAN_STATE data if needed

### Phase 2: ACTIVITY Archival (45 minutes)
- [ ] Edit `src/4_services/SystemManager.gs`:
  - [ ] Add archiveOldActivity() method (end of class)
- [ ] Edit `src/5_web/TriggerOrchestrator.gs`:
  - [ ] Add runActivityArchival() function (end of file)
  - [ ] Add installActivityArchivalTrigger() function (end of file)
- [ ] Add 2 rows to APPSHEET_CONFIG sheet (manual)
- [ ] `npm run push`
- [ ] Run: `installActivityArchivalTrigger()`
- [ ] Test: `runActivityArchival()` - verify logs

### Phase 3: ACTIONS/PROPOSALS Archival (45 minutes)
- [ ] Edit `src/4_services/SystemManager.gs`:
  - [ ] Add archiveOldActions() method (after archiveOldActivity)
  - [ ] Add archiveOldProposals() method (after archiveOldActions)
- [ ] Edit `src/5_web/TriggerOrchestrator.gs`:
  - [ ] Add runActionsArchival() function
  - [ ] Add runProposalsArchival() function
  - [ ] Add installArchivalTriggers() function
- [ ] Add 4 rows to APPSHEET_CONFIG sheet (manual)
- [ ] `npm run push`
- [ ] Run: `installArchivalTriggers()`
- [ ] Test: `runActionsArchival()`, `runProposalsArchival()`

### Phase 4: Documentation (15 minutes)
- [ ] Update CHANGELOG.md (add Phase 3.1 section, update Phase 3)
- [ ] `npm run push`

### Post-Deployment Validation (10 minutes)
- [ ] Verify triggers installed: `ScriptApp.getProjectTriggers()`
- [ ] Run health check: `container.get(SERVICES.SystemManager).runHealthCheck()`
- [ ] Check PLAN_EXECUTION_LOG for deployment entries
- [ ] Monitor first archival execution (next day)

### Completion
- [ ] Commit and push to git
- [ ] Tag release: `git tag v2.0.0-phase3.1`
- [ ] Create deployment report

---

## ROLLBACK PROCEDURES

### If HUMAN_STATE Fix Causes Issues
1. Revert HumanStateManager.gs changes
2. `npm run push`
3. Old 7-column writes resume (broken schema, but known state)

### If Archival Causes Issues
1. Disable in APPSHEET_CONFIG: Set `*_ARCHIVE_ENABLED` to `false`
2. Delete triggers:
```javascript
ScriptApp.getProjectTriggers().forEach(t => {
  if (['runActivityArchival', 'runActionsArchival', 'runProposalsArchival'].includes(t.getHandlerFunction())) {
    ScriptApp.deleteTrigger(t);
  }
});
```
3. Archival stops, main sheets continue to grow

### If Critical Failure
1. Restore from backup: `backupManager.restoreFromBackup(backupId, sheets)`
2. Revert all code changes
3. `npm run push`

---

## SUMMARY

### Total Changes
- **3 files modified**: HumanStateManager.gs, SystemManager.gs, TriggerOrchestrator.gs
- **~310 lines of code** changed/added
- **10 config rows** added to APPSHEET_CONFIG
- **3 triggers** installed
- **1 CHANGELOG section** updated

### Timeline
- Phase 1: 15 minutes
- Phase 2: 45 minutes
- Phase 3: 45 minutes
- Phase 4: 15 minutes
- Validation: 10 minutes
- **Total: ~2 hours**

### Risk Assessment
- **HUMAN_STATE Fix**: MEDIUM risk (breaks old data reads, but fixes forward)
- **Archival**: LOW risk (purely additive, can be disabled)
- **Overall**: MEDIUM risk, HIGH reward

### Success Criteria
1. ✅ HUMAN_STATE writes 8 columns (verify in sheet)
2. ✅ New human states have state_id populated
3. ✅ ACTIVITY archival runs daily (check logs)
4. ✅ ACTIONS archival runs weekly (check logs)
5. ✅ PROPOSALS archival runs weekly (check logs)
6. ✅ Row counts stable or decreasing
7. ✅ All triggers installed and functional

### Acceptance of Limitations
- **Old HUMAN_STATE data (7 columns)** will not be migrated
- **getCurrentHumanState()** may read incorrectly from old data for ~4 hours
- **No backfill** of state_id or stress_level for existing rows
- **Documentation** minimal (CHANGELOG only, no new docs)

**This plan prioritizes speed and simplicity over perfection. It fixes the core issues while accepting minor data loss for expedience.**
