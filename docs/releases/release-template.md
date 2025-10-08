# Release Template

## Release Information

- **Version**: [e.g., v2.0.0-phase10]
- **Release Date**: [YYYY-MM-DD]
- **Release Manager**: [Name/Email]
- **Release Type**: [Major | Minor | Patch | Phase]
- **Branch**: [e.g., feature/phase10-deployment]
- **Deployment Target**: [Production | Staging | Development]

## Pre-Deployment Status

### Pre-Deployment Checks

Run `runPreDeploymentChecks()` in Apps Script console and record results:

- [ ] **Git Status**: Clean working directory
- [ ] **Recent Backups**: Backup created within last 24 hours
- [ ] **All Tests Pass**: `RUN_EVERYTHING_NOW()` returns 0 errors
- [ ] **System Health**: `runHealthCheck()` returns HEALTHY
- [ ] **Phases Complete**: All prerequisite phases validated
- [ ] **Documentation**: All docs updated and reviewed

### Pre-Deployment Check Results

```javascript
// Paste output of runPreDeploymentChecks() here
{
  ready: true/false,
  timestamp: "...",
  version: "...",
  checks: { ... },
  failures: [ ... ]
}
```

**Status**: ✅ READY / ❌ BLOCKED

**Failures (if any)**:
- [List any blocking issues]

## Backup Information

### Backup Creation

Run `BackupManager.createBackup()` in Apps Script console:

- **Backup ID**: [UUID from backup result]
- **Timestamp**: [ISO 8601 timestamp]
- **Sheets Backed Up**: [Number of sheets]
- **Backup Location**: Google Drive > MOH_Time_OS_Backups/[YYYY-MM-DD]/
- **Verification Status**: ✅ VERIFIED / ❌ FAILED

### Backup Verification Results

```javascript
// Paste output of BackupManager.verifyBackup(backupId) here
{
  success: true/false,
  backupId: "...",
  checks: {
    metadataExists: true/false,
    allSheetsPresent: true/false,
    rowCountsMatch: true/false,
    filesReadable: true/false
  },
  metadata: { ... }
}
```

**Backup Files**:
- `ACTIONS_backup.csv` ([row count])
- `PROPOSED_TASKS_backup.csv` ([row count])
- `DEPENDENCIES_backup.csv` ([row count])
- `TIME_BLOCKS_backup.csv` ([row count])
- `ACTIVITY_backup.csv` ([row count])
- `STATUS_backup.csv` ([row count])
- `ACTIONS_ARCHIVE_backup.csv` ([row count])
- `PROPOSED_ARCHIVE_backup.csv` ([row count])
- `backup_metadata.json`

## Changes Included

### New Features

- [Feature 1]: [Brief description]
- [Feature 2]: [Brief description]

### Bug Fixes

- [Fix 1]: [Issue description and resolution]
- [Fix 2]: [Issue description and resolution]

### Improvements

- [Improvement 1]: [Description]
- [Improvement 2]: [Description]

### Breaking Changes

- [Breaking change 1]: [Description and migration path]
- [Breaking change 2]: [Description and migration path]

### Dependencies

- **New Dependencies**: [List new services or libraries]
- **Dependency Updates**: [List updated versions]
- **Removed Dependencies**: [List removed services]

## Deployment Execution

### Deployment Steps

1. **Pre-Deployment Validation**
   - Executed: [Timestamp]
   - Result: ✅ PASS / ❌ FAIL
   - Duration: [ms]

2. **Backup Creation**
   - Executed: [Timestamp]
   - Backup ID: [UUID]
   - Result: ✅ SUCCESS / ❌ FAILED
   - Duration: [ms]

3. **Code Push (clasp push)**
   - Executed: [Timestamp]
   - Command: `npm run deploy:push`
   - Result: ✅ SUCCESS / ❌ FAILED
   - Files Pushed: [count]
   - Duration: [seconds]

4. **Post-Deployment Verification**
   - Executed: [Timestamp]
   - Result: ✅ PASS / ❌ FAIL
   - Duration: [ms]

### Deployment Log ID

Record the deployment action log ID from PLAN_EXECUTION_LOG sheet:

- **Log ID**: [UUID from SystemManager.logDeploymentAction()]
- **Phase**: [Phase number]
- **Action**: DEPLOY
- **Status**: SUCCESS / FAILURE
- **Operator**: [Email]

## Post-Deployment Verification

### Test Results

Run `runPostDeploymentVerification()` in Apps Script console:

```javascript
// Paste output here
{
  success: true/false,
  timestamp: "...",
  version: "...",
  tests: {
    success: true/false,
    total: X,
    passed: Y,
    failed: Z,
    duration: "..."
  },
  health: {
    success: true/false,
    status: "HEALTHY",
    checks: X
  },
  smoke: {
    success: true/false,
    tests: 3,
    message: "..."
  }
}
```

**Overall Status**: ✅ VERIFIED / ❌ FAILED

### Manual Verification Checklist

- [ ] Web interface (DayPlanner.html) loads correctly
- [ ] AppSheet integration functional
- [ ] Chat engine processes messages
- [ ] Email ingestion working
- [ ] Calendar sync operational
- [ ] Time blocking functional
- [ ] Task creation/updates working
- [ ] Archive operations successful
- [ ] Logging to ACTIVITY sheet working
- [ ] No ERROR logs in ACTIVITY sheet

### Performance Metrics

- **Average Response Time**: [ms]
- **Peak Memory Usage**: [MB]
- **Trigger Execution Time**: [seconds]
- **Database Query Performance**: [ms/query]

### Smoke Test Results

| Test | Status | Notes |
|------|--------|-------|
| Task Creation via AppSheet | ✅ / ❌ | [Any issues] |
| Sanitization Verification | ✅ / ❌ | [Any issues] |
| Test Data Cleanup | ✅ / ❌ | [Any issues] |

## Rollback Plan

### Rollback Trigger Conditions

Initiate rollback if:
- [ ] Critical test failures (>5% of total tests)
- [ ] System health check returns CRITICAL
- [ ] Data corruption detected
- [ ] User-facing functionality broken
- [ ] Performance degradation >50%

### Rollback Procedure

If rollback is required:

1. **Stop New Operations**
   ```javascript
   // Disable triggers if needed
   const systemManager = container.get(SERVICES.SystemManager);
   systemManager.disableTriggers();
   ```

2. **Restore from Backup**
   ```javascript
   const backupManager = container.get(SERVICES.BackupManager);
   // Restore each affected sheet
   backupManager.restoreFromBackup('[BACKUP_ID]', 'ACTIONS');
   backupManager.restoreFromBackup('[BACKUP_ID]', 'PROPOSED_TASKS');
   // Continue for all critical sheets
   ```

3. **Revert Code**
   ```bash
   git revert [COMMIT_HASH]
   npm run push
   ```

4. **Verify Rollback**
   ```javascript
   runPostDeploymentVerification();
   ```

5. **Log Rollback Action**
   ```javascript
   systemManager.logDeploymentAction(
     '[Phase]',
     'ROLLBACK',
     'SUCCESS',
     { reason: '[reason for rollback]', backup_id: '[BACKUP_ID]' }
   );
   ```

### Rollback Executed

- [ ] Rollback was NOT required
- [ ] Rollback was executed successfully
  - Rollback Timestamp: [timestamp]
  - Reason: [reason]
  - Backup ID Used: [UUID]
  - Verification Result: ✅ / ❌

## Observation Period

### Monitoring Schedule

- **Day 1 (Deployment Day)**: Hourly monitoring
- **Day 2-7**: Daily monitoring
- **Week 2-4**: Weekly monitoring

### Metrics to Monitor

- [ ] Error rate in ACTIVITY logs
- [ ] System health check status
- [ ] User-reported issues
- [ ] Performance metrics
- [ ] Data integrity checks

### Observation Results

**24 Hours Post-Deployment**:
- Error Count: [number]
- Health Status: [HEALTHY/DEGRADED/CRITICAL]
- Issues Reported: [number]
- Notes: [observations]

**7 Days Post-Deployment**:
- Error Count: [number]
- Health Status: [HEALTHY/DEGRADED/CRITICAL]
- Issues Reported: [number]
- Notes: [observations]

## Sign-Off

### Release Manager Sign-Off

- **Name**: [Name]
- **Date**: [YYYY-MM-DD]
- **Signature**: [Initials]
- **Status**: ✅ APPROVED / ❌ REJECTED

### Stakeholder Approval

- **Product Owner**: [Name] - [Date] - ✅ / ❌
- **Technical Lead**: [Name] - [Date] - ✅ / ❌
- **QA Lead**: [Name] - [Date] - ✅ / ❌

## Lessons Learned

### What Went Well

- [Item 1]
- [Item 2]

### What Could Be Improved

- [Item 1]
- [Item 2]

### Action Items for Next Release

- [ ] [Action 1]
- [ ] [Action 2]

## Related Documentation

- [CHANGELOG.md](../../CHANGELOG.md) - Detailed change history
- [docs/operations/deployment-checklist.md](../operations/deployment-checklist.md) - Deployment procedures
- [docs/operations/backup-procedures.md](../operations/backup-procedures.md) - Backup/restore guide
- [docs/governance/maintenance-schedule.md](../governance/maintenance-schedule.md) - Maintenance calendar

## Notes

[Any additional notes, observations, or context about this release]
