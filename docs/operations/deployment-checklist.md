# Deployment Checklist

## Overview

This checklist guides the deployment process for MOH Time OS v2.0. Follow each step sequentially and verify completion before proceeding.

**Deployment Workflow**: Pre-Check → Backup → Push → Verify → Monitor

## Pre-Deployment Phase

### Environment Preparation

- [ ] **Verify Current Branch**
  ```bash
  git branch --show-current
  # Should show: feature/phase[N]-[name] or main
  ```

- [ ] **Ensure Clean Working Directory**
  ```bash
  git status
  # Should show: nothing to commit, working tree clean
  ```

- [ ] **Pull Latest Changes**
  ```bash
  git pull origin main
  # Or: git pull origin [feature-branch]
  ```

- [ ] **Verify Node Modules**
  ```bash
  npm install
  # Ensure @google/clasp is installed
  ```

- [ ] **Authenticate with Google Apps Script**
  ```bash
  npm run login
  # Complete OAuth flow if needed
  ```

### Code Quality Checks

- [ ] **Run Local Validation Scripts**
  ```bash
  node validate_load_order.js
  # Should exit with code 0 (success)
  ```

- [ ] **Verify No Syntax Errors**
  - Open key files in editor
  - Check for red squiggly lines
  - Verify JSDoc comments complete

- [ ] **Review Recent Changes**
  ```bash
  git log --oneline -10
  git diff main..HEAD
  # Review all changes since last deployment
  ```

- [ ] **Check File Load Order**
  - Verify numbered prefixes correct (0_, 1_, 2_, etc.)
  - Ensure AA/AZ prefixes for bootstrap files
  - Confirm dependencies loaded before dependents

### Pre-Deployment Validation Tests

- [ ] **Run Pre-Deployment Checks Function**
  1. Open Apps Script: `npm run open`
  2. Navigate to: `src/9_tests/PreDeploymentValidation.gs`
  3. Run function: `runPreDeploymentChecks()`
  4. Check execution logs for results

- [ ] **Verify Pre-Deployment Check Results**
  - `ready: true` (all checks passed)
  - `gitStatus.success: true`
  - `backupsRecent.success: true`
  - `testsPass.success: true`
  - `healthCheck.success: true`
  - `phasesComplete.success: true`
  - `documentation.success: true`

- [ ] **Address Any Failures**
  - If `ready: false`, review `failures` array
  - Fix blocking issues before proceeding
  - Re-run `runPreDeploymentChecks()` after fixes

### Test Suite Execution

- [ ] **Run Complete Test Suite**
  1. In Apps Script editor
  2. Run function: `RUN_EVERYTHING_NOW()`
  3. Monitor execution logs
  4. Wait for completion (may take 2-5 minutes)

- [ ] **Verify Test Results**
  ```javascript
  // Expected output structure:
  {
    summary: {
      total: X,
      success: X,
      errors: 0,  // MUST be 0
      duration: "X.XXs"
    },
    phases: { /* all phases pass */ }
  }
  ```

- [ ] **Check for Zero Errors**
  - `summary.errors` must equal `0`
  - If errors > 0, review ACTIVITY sheet for details
  - Fix errors before proceeding

### System Health Verification

- [ ] **Run System Health Check**
  ```javascript
  // In Apps Script console
  const systemManager = container.get(SERVICES.SystemManager);
  const health = systemManager.runHealthCheck();
  Logger.log(health);
  ```

- [ ] **Verify Health Check Results**
  - `overall_status: 'HEALTHY'`
  - All subsystem checks pass:
    - `database: true`
    - `services: true`
    - `data_integrity: true`
    - `configuration: true`
    - `archives: true`
    - `lock_manager: true`
    - `triggers: true`
    - `bulk_operations: true`
    - `data_sanitization: true`

- [ ] **Review STATUS Sheet**
  - Open main spreadsheet
  - Navigate to STATUS sheet
  - Check `last_health_check_summary`
  - Verify timestamp is recent

### Phase-Specific Validation

- [ ] **Validate Completed Phases**
  ```javascript
  // Run phase validation for completed phases
  validatePhase3Complete();   // Archive management
  validatePhase6Batching();   // Batch operations
  validatePhase8Sanitization(); // Security controls
  validatePhase10Deployment(); // If applicable
  ```

- [ ] **Verify Phase Validation Results**
  - All phase validation functions return `true`
  - Check ACTIVITY logs for validation details
  - Address any phase-specific failures

### Documentation Review

- [ ] **Verify Documentation Updates**
  - [ ] CHANGELOG.md updated with new version
  - [ ] README.md reflects current state
  - [ ] CLAUDE.md updated if architecture changed
  - [ ] Phase-specific docs complete
  - [ ] API documentation current

- [ ] **Review Release Notes**
  - Fill out `docs/releases/release-template.md`
  - Document breaking changes
  - List new features and fixes
  - Include migration notes if needed

## Backup Phase

### Create System Backup

- [ ] **Execute Backup Creation**
  ```javascript
  // In Apps Script console
  const backupManager = container.get(SERVICES.BackupManager);
  const backupResult = backupManager.createBackup();
  Logger.log(backupResult);
  ```

- [ ] **Record Backup Details**
  - **Backup ID**: [Copy UUID from result]
  - **Timestamp**: [Copy ISO timestamp]
  - **Sheets Backed Up**: [Count]
  - **Duration**: [ms]

- [ ] **Verify Backup Success**
  - `backupResult.success: true`
  - `verification.metadataExists: true`
  - `verification.allSheetsPresent: true`
  - `verification.rowCountsMatch: true`
  - `verification.filesReadable: true`

### Validate Backup Integrity

- [ ] **Run Backup Verification**
  ```javascript
  // In Apps Script console (use Backup ID from above)
  const verification = backupManager.verifyBackup('[BACKUP_ID]');
  Logger.log(verification);
  ```

- [ ] **Verify Backup Location**
  1. Open Google Drive
  2. Navigate to: `MOH_Time_OS_Backups/[YYYY-MM-DD]/`
  3. Confirm folder exists with backup files
  4. Check file timestamps match backup time

- [ ] **Spot-Check Backup Files**
  - Open `backup_metadata.json` - verify structure
  - Open `ACTIONS_backup.csv` - verify headers and sample data
  - Confirm file sizes are reasonable (not 0 bytes)

### Document Backup

- [ ] **Record Backup Information**
  - Add backup ID to release template
  - Note backup location
  - Document backup verification status
  - Store backup ID securely for rollback

## Deployment Phase

### Execute Code Push

- [ ] **Push Code to Apps Script**
  ```bash
  npm run deploy:push
  # Or: npm run push
  ```

- [ ] **Monitor Push Output**
  - Verify no errors during push
  - Confirm file count matches local
  - Check for any warnings
  - Note deployment timestamp

- [ ] **Verify Files in Apps Script Editor**
  ```bash
  npm run open
  ```
  - Confirm all files present
  - Verify file organization (folders)
  - Check no files missing
  - Confirm load order preserved

### Log Deployment Action

- [ ] **Create Deployment Log Entry**
  ```javascript
  // In Apps Script console
  const systemManager = container.get(SERVICES.SystemManager);
  const logResult = systemManager.logDeploymentAction(
    'Phase 10',           // or current phase
    'DEPLOY',
    'SUCCESS',
    {
      version: getSystemVersion(),
      backup_id: '[BACKUP_ID]',
      files_pushed: [count],
      duration_ms: [milliseconds]
    },
    null  // verification results added later
  );
  Logger.log(logResult);
  ```

- [ ] **Verify Deployment Log**
  - Open PLAN_EXECUTION_LOG sheet
  - Confirm new row added
  - Verify all fields populated
  - Record `log_id` for reference

## Post-Deployment Verification Phase

### Automated Verification

- [ ] **Run Post-Deployment Verification**
  ```javascript
  // In Apps Script console
  const verificationResult = runPostDeploymentVerification();
  Logger.log(verificationResult);
  ```

- [ ] **Verify Verification Results**
  - `success: true`
  - `tests.success: true` (all tests pass)
  - `health.success: true` (system healthy)
  - `smoke.success: true` (smoke tests pass)

- [ ] **Update Deployment Log with Verification**
  - Locate deployment log entry in PLAN_EXECUTION_LOG
  - Update `verification_results` column with results JSON
  - Update `status` to 'SUCCESS' or 'FAILURE'

### Manual Smoke Tests

- [ ] **Test Web Interface (DayPlanner.html)**
  - Open web app URL
  - Verify page loads without errors
  - Check console for JavaScript errors
  - Test basic interactions (button clicks, form fills)

- [ ] **Test AppSheet Integration**
  ```javascript
  // Create test task via AppSheet
  const testTask = {
    title: 'Deployment Test Task',
    description: 'Created to verify deployment',
    priority: PRIORITY.LOW
  };
  const result = appsheet_createTask(testTask);
  Logger.log(result);
  // Verify success: true
  // Clean up: delete test task from ACTIONS sheet
  ```

- [ ] **Test Chat Engine**
  ```javascript
  // Submit test chat message
  const chatResult = processChatMessage('Test message: deployment verification');
  Logger.log(chatResult);
  // Verify response generated
  // Check CHAT_QUEUE sheet
  ```

- [ ] **Test Email Ingestion**
  - Send test email to ingestion address
  - Wait for trigger execution (or manually trigger)
  - Verify proposal created in PROPOSED_TASKS
  - Check sanitization applied correctly

- [ ] **Test Calendar Sync**
  ```javascript
  // Trigger calendar sync
  const calendarEngine = container.get(SERVICES.CalendarEngine);
  const syncResult = calendarEngine.syncCalendar();
  Logger.log(syncResult);
  // Verify no errors
  ```

- [ ] **Test Time Blocking**
  ```javascript
  // Create test time block
  const timeBlockEngine = container.get(SERVICES.TimeBlockEngine);
  // Execute time blocking logic
  // Verify blocks created correctly
  ```

### Data Integrity Checks

- [ ] **Verify Schema Integrity**
  ```javascript
  // Run schema validation
  const sheetHealer = new SheetHealer();
  const schemaReport = sheetHealer.validateAllSheets();
  Logger.log(schemaReport);
  // Expect: all sheets valid
  ```

- [ ] **Check Critical Sheets**
  - [ ] ACTIONS - verify row count unchanged
  - [ ] PROPOSED_TASKS - verify structure intact
  - [ ] CALENDAR_PROJECTION - verify no data loss
  - [ ] TIME_BLOCKS - verify blocks preserved
  - [ ] ACTIVITY - verify new logs appending
  - [ ] STATUS - verify health metrics updating
  - [ ] PLAN_EXECUTION_LOG - verify deployment logged

- [ ] **Validate Archive Access**
  ```javascript
  // Test archive read
  const batchOps = container.get(SERVICES.BatchOperations);
  const archivedActions = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS_ARCHIVE, {});
  Logger.log(`Archive row count: ${archivedActions.length}`);
  // Verify external archive accessible
  ```

### Performance Validation

- [ ] **Measure Response Times**
  - Run `RUN_EVERYTHING_NOW()` and note duration
  - Compare to baseline (should be similar)
  - Check execution transcript for slow operations

- [ ] **Check Memory Usage**
  - Review Apps Script quotas page
  - Verify no quota warnings
  - Check for memory leak indicators

- [ ] **Test Under Load**
  - Create multiple tasks in quick succession
  - Process multiple chat messages
  - Verify batch operations complete
  - Check for race conditions

### Error Log Review

- [ ] **Check ACTIVITY Sheet for Errors**
  - Filter by `log_level: 'ERROR'`
  - Review errors from last 24 hours
  - Verify no new critical errors post-deployment
  - Investigate any unexpected errors

- [ ] **Review Apps Script Execution Logs**
  ```bash
  npm run logs
  ```
  - Look for stack traces
  - Check for uncaught exceptions
  - Verify no permission errors

- [ ] **Monitor Trigger Execution**
  - Open Apps Script editor → Triggers
  - Check recent trigger executions
  - Verify no failures
  - Review execution times

## Observation Phase

### Immediate Monitoring (0-24 Hours)

- [ ] **Hour 1 Check**
  - Run health check
  - Check error logs
  - Verify triggers executing
  - Test critical user flows

- [ ] **Hour 4 Check**
  - Review ACTIVITY sheet for errors
  - Check system performance
  - Verify data integrity
  - Test email ingestion

- [ ] **Hour 8 Check**
  - Run full test suite: `RUN_EVERYTHING_NOW()`
  - Compare results to deployment baseline
  - Check for any anomalies

- [ ] **Hour 24 Check**
  - Comprehensive health check
  - Review all error logs
  - Validate data consistency
  - Check backup folder for scheduled backups

### Extended Monitoring (1-7 Days)

- [ ] **Day 2 Monitoring**
  - Daily health check
  - Review ACTIVITY logs
  - User feedback review
  - Performance metrics

- [ ] **Day 3 Monitoring**
  - Repeat Day 2 checks
  - Check for patterns in errors
  - Validate long-running operations

- [ ] **Day 7 Monitoring**
  - Full system validation
  - Run complete test suite
  - Performance comparison
  - Decision: sign off or extend monitoring

## Rollback Procedures

### Rollback Decision Criteria

Execute rollback if:
- [ ] Critical tests fail (>5% failure rate)
- [ ] System health status: CRITICAL
- [ ] Data corruption detected
- [ ] Core user flows broken
- [ ] Performance degradation >50%
- [ ] Security vulnerability introduced

### Rollback Execution

- [ ] **Stop Active Operations**
  ```javascript
  // Disable triggers to prevent data changes during rollback
  const systemManager = container.get(SERVICES.SystemManager);
  // Manually delete triggers via UI if needed
  ```

- [ ] **Restore from Backup**
  ```javascript
  const backupManager = container.get(SERVICES.BackupManager);

  // Restore critical sheets (use backup ID from deployment)
  backupManager.restoreFromBackup('[BACKUP_ID]', 'ACTIONS');
  backupManager.restoreFromBackup('[BACKUP_ID]', 'PROPOSED_TASKS');
  backupManager.restoreFromBackup('[BACKUP_ID]', 'DEPENDENCIES');
  backupManager.restoreFromBackup('[BACKUP_ID]', 'TIME_BLOCKS');
  backupManager.restoreFromBackup('[BACKUP_ID]', 'ACTIVITY');
  backupManager.restoreFromBackup('[BACKUP_ID]', 'STATUS');
  // Add other critical sheets as needed
  ```

- [ ] **Revert Code Changes**
  ```bash
  # Find commit hash of deployment
  git log --oneline -5

  # Revert the deployment commit
  git revert [COMMIT_HASH]

  # Push reverted code
  npm run push
  ```

- [ ] **Verify Rollback Success**
  ```javascript
  // Run post-rollback verification
  runPostDeploymentVerification();

  // Check health
  const systemManager = container.get(SERVICES.SystemManager);
  const health = systemManager.runHealthCheck();
  Logger.log(health);
  ```

- [ ] **Log Rollback Action**
  ```javascript
  systemManager.logDeploymentAction(
    '[Phase]',
    'ROLLBACK',
    'SUCCESS',
    {
      reason: '[Description of why rollback was needed]',
      backup_id: '[BACKUP_ID]',
      original_deployment_log_id: '[LOG_ID]'
    }
  );
  ```

- [ ] **Communicate Rollback**
  - Notify stakeholders
  - Document root cause
  - Create incident report
  - Plan remediation

## Sign-Off

### Deployment Sign-Off

- [ ] **All Checks Passed**
  - Pre-deployment validation: ✅
  - Backup created and verified: ✅
  - Code push successful: ✅
  - Post-deployment verification: ✅
  - Smoke tests passed: ✅
  - No critical errors: ✅

- [ ] **Documentation Complete**
  - Release template filled out
  - Deployment logged in PLAN_EXECUTION_LOG
  - CHANGELOG.md updated
  - Backup ID recorded

- [ ] **Stakeholder Approval**
  - Release Manager: ________________ Date: ______
  - Technical Lead: _________________ Date: ______
  - Product Owner: __________________ Date: ______

### Post-Deployment Tasks

- [ ] **Update Version in Documentation**
  - README.md version badge
  - package.json version field
  - CHANGELOG.md new entry

- [ ] **Tag Release in Git**
  ```bash
  git tag -a v2.0.0-phase10 -m "Phase 10: Deployment & Governance"
  git push origin v2.0.0-phase10
  ```

- [ ] **Archive Deployment Artifacts**
  - Store backup ID
  - Save deployment logs
  - Archive release notes
  - Document lessons learned

- [ ] **Schedule Post-Deployment Review**
  - Set reminder for 7-day review
  - Plan retrospective meeting
  - Document lessons learned
  - Update deployment procedures

## Reference

### Related Documentation

- [Release Template](../releases/release-template.md)
- [Backup Procedures](./backup-procedures.md)
- [Maintenance Schedule](../governance/maintenance-schedule.md)
- [Security Operations](./security.md)

### Emergency Contacts

- **Release Manager**: [Contact]
- **Technical Lead**: [Contact]
- **On-Call Engineer**: [Contact]

### Quick Commands

```bash
# Pre-deployment
npm run deploy:pre-check
node validate_load_order.js

# Backup
# (Execute BackupManager.createBackup() in Apps Script console)

# Deploy
npm run deploy:push

# Verify
# (Execute runPostDeploymentVerification() in Apps Script console)

# Monitor
npm run logs
npm run open
```
