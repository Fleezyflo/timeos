# Maintenance Schedule

## Overview

This document defines the maintenance schedule for MOH Time OS v2.0, including routine tasks, monitoring activities, and preventive maintenance procedures.

**Maintenance Philosophy**: Proactive monitoring and preventive maintenance to ensure system reliability, performance, and data integrity.

## Daily Maintenance

### Morning System Check (5-10 minutes)

**Time**: 9:00 AM Asia/Dubai

**Tasks**:

1. **Health Check**
   ```javascript
   // In Apps Script console
   const systemManager = container.get(SERVICES.SystemManager);
   const health = systemManager.runHealthCheck();
   Logger.log(health);
   ```
   - **Expected**: `overall_status: 'HEALTHY'`
   - **Action if Failed**: Investigate failed subsystem, check ACTIVITY logs

2. **Error Log Review**
   ```javascript
   const batchOps = container.get(SERVICES.BatchOperations);
   const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
   const recentErrors = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
     log_level: 'ERROR'
   }).filter(log => new Date(log.timestamp) > yesterday);

   Logger.log(`Errors in last 24h: ${recentErrors.length}`);
   if (recentErrors.length > 0) {
     Logger.log('Recent errors:', recentErrors);
   }
   ```
   - **Expected**: 0-5 errors (mostly transient network issues)
   - **Action if >10**: Investigate error patterns, check for systemic issues

3. **Backup Verification**
   - Check Google Drive → `MOH_Time_OS_Backups/[YYYY-MM-DD]/`
   - Verify folder for current date exists (if scheduled backup enabled)
   - Spot-check `backup_metadata.json` for integrity

4. **Trigger Status Check**
   - Apps Script Editor → Triggers tab
   - Verify all expected triggers present:
     - Email ingestion (if enabled)
     - Calendar sync (if enabled)
     - Scheduled backups (if configured)
   - Check for failed executions (red icons)
   - **Action if Failed**: Review execution logs, re-run manually if needed

### End-of-Day Check (5 minutes)

**Time**: 6:00 PM Asia/Dubai

**Tasks**:

1. **Final Error Scan**
   ```javascript
   // Check errors since morning
   const todayStart = new Date();
   todayStart.setHours(9, 0, 0, 0);

   const todayErrors = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
     log_level: 'ERROR'
   }).filter(log => new Date(log.timestamp) > todayStart);

   Logger.log(`Errors today: ${todayErrors.length}`);
   ```

2. **Data Integrity Spot Check**
   ```javascript
   // Quick row count check
   const actionCount = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {}).length;
   const proposalCount = batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, {}).length;
   Logger.log(`ACTIONS: ${actionCount}, PROPOSED_TASKS: ${proposalCount}`);
   // Compare to morning counts - should be similar or gradually increasing
   ```

3. **System Performance**
   - Check Apps Script Quotas page
   - Verify no quota warnings
   - Note execution time trends

## Weekly Maintenance

### Monday Morning (30-45 minutes)

**Time**: 9:00 AM Asia/Dubai

**Tasks**:

1. **Full Test Suite Execution**
   ```javascript
   // In Apps Script console
   const testResult = RUN_EVERYTHING_NOW();
   Logger.log(testResult);
   ```
   - **Expected**: `errors: 0`, all phases pass
   - **Duration**: 2-5 minutes
   - **Action if Failed**: Investigate failed tests, check ACTIVITY logs for details

2. **Schema Validation**
   ```javascript
   const sheetHealer = new SheetHealer();
   const validation = sheetHealer.validateAllSheets();
   Logger.log(validation);
   ```
   - **Expected**: All sheets valid, no missing headers
   - **Action if Failed**: Run `sheetHealer.healSheets()` to repair

3. **Performance Metrics Review**
   ```javascript
   // Check cache performance
   const cache = container.get(SERVICES.CrossExecutionCache);
   const cacheStats = cache.getStats();
   Logger.log('Cache stats:', cacheStats);

   // Check logger batch size
   const logger = container.get(SERVICES.SmartLogger);
   const logStats = logger.getStats();
   Logger.log('Logger stats:', logStats);

   // Check batch operation efficiency
   const batchOps = container.get(SERVICES.BatchOperations);
   // Review recent operation times in ACTIVITY logs
   ```
   - Track trends over time
   - Note any performance degradation

4. **Error Pattern Analysis**
   ```javascript
   // Get all errors from last 7 days
   const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
   const weekErrors = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
     log_level: 'ERROR'
   }).filter(log => new Date(log.timestamp) > weekAgo);

   // Group by component
   const errorsByComponent = {};
   weekErrors.forEach(error => {
     errorsByComponent[error.component] = (errorsByComponent[error.component] || 0) + 1;
   });

   Logger.log('Errors by component (last 7 days):', errorsByComponent);
   ```
   - Identify recurring issues
   - Plan fixes for high-frequency errors

5. **Backup Cleanup**
   ```javascript
   // Review old backups (keep last 7 days of daily backups)
   // Optional: Run cleanup function (see backup-procedures.md)
   // cleanupOldBackups(7);
   ```
   - Manually review Drive folder
   - Move important backups (pre-deployment) to separate folder
   - Delete backups older than retention policy

6. **Archive Review**
   ```javascript
   // Check archive sizes
   const archivedActions = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS_ARCHIVE, {}).length;
   const archivedProposals = batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_ARCHIVE, {}).length;

   Logger.log(`Archived: ${archivedActions} actions, ${archivedProposals} proposals`);

   // If external archive configured, verify accessibility
   const config = container.get(SERVICES.ConfigManager);
   const externalArchiveId = config.getString('EXTERNAL_ARCHIVE_ID');
   if (externalArchiveId) {
     try {
       const externalSs = SpreadsheetApp.openById(externalArchiveId);
       Logger.log('✅ External archive accessible');
     } catch (error) {
       Logger.log('❌ External archive not accessible:', error.message);
     }
   }
   ```

## Monthly Maintenance

### First Monday of Month (1-2 hours)

**Time**: 9:00 AM Asia/Dubai

**Tasks**:

1. **Comprehensive Health Assessment**
   ```javascript
   // Run extended health check
   const systemManager = container.get(SERVICES.SystemManager);
   const health = systemManager.runHealthCheck();

   // Run all phase validations
   const phase3 = validatePhase3Complete();
   const phase6 = validatePhase6Batching();
   const phase8 = validatePhase8Sanitization();
   const phase10 = validatePhase10Deployment();

   Logger.log('Monthly health report:', {
     overall: health.overall_status,
     phase3: phase3,
     phase6: phase6,
     phase8: phase8,
     phase10: phase10
   });
   ```

2. **Security Audit**
   ```javascript
   // Review sanitization effectiveness
   const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
   const recentTasks = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {})
     .filter(task => new Date(task.created_at) > lastMonth);

   // Count sanitized entries (start with single quote)
   const sanitizedTitles = recentTasks.filter(task =>
     task.title && task.title.startsWith("'")
   ).length;

   Logger.log(`Sanitization rate: ${sanitizedTitles}/${recentTasks.length} (${(sanitizedTitles/recentTasks.length*100).toFixed(2)}%)`);

   // Check for formula injection attempts
   const suspiciousTasks = recentTasks.filter(task =>
     task.title && task.title.startsWith("'") && /^[=+\-@]/.test(task.title.substring(1))
   );

   Logger.log(`Formula injection attempts detected: ${suspiciousTasks.length}`);
   if (suspiciousTasks.length > 0) {
     Logger.log('Suspicious tasks:', suspiciousTasks.map(t => ({
       id: t.action_id,
       title: t.title,
       created_at: t.created_at
     })));
   }
   ```
   - Review injection attempt patterns
   - Document any sophisticated attack attempts
   - Update security documentation if needed

3. **Data Archive Operation**
   ```javascript
   // Archive old completed actions (>90 days old)
   const systemManager = container.get(SERVICES.SystemManager);
   const archiveResult = systemManager.archiveOldActions({
     daysOld: 90,
     status: STATUS.COMPLETED
   });

   Logger.log('Archive operation:', archiveResult);
   ```
   - **Expected**: Successful archive, no errors
   - Verify archived data in ACTIONS_ARCHIVE sheet
   - Check main ACTIONS sheet row count decreased

4. **Performance Benchmark**
   ```javascript
   // Baseline performance test
   const start = Date.now();
   const testResult = RUN_EVERYTHING_NOW();
   const duration = Date.now() - start;

   Logger.log(`Full test suite duration: ${duration}ms`);
   Logger.log(`Tests: ${testResult.summary.total}, Success: ${testResult.summary.success}, Errors: ${testResult.summary.errors}`);

   // Compare to previous month's baseline
   // Document in maintenance log
   ```

5. **Quota Review**
   - Open Apps Script Dashboard
   - Review quota usage trends:
     - Execution time
     - Trigger runs
     - URL fetches
     - Gmail operations
     - Drive operations
   - Check for approaching limits
   - Plan optimizations if needed

6. **Backup Verification Deep Dive**
   ```javascript
   // List all backups from last month
   // (Use listAvailableBackups() from backup-procedures.md)

   // Spot-check 3-4 random backups
   const backupsToVerify = ['backup_id_1', 'backup_id_2', 'backup_id_3'];
   backupsToVerify.forEach(backupId => {
     const verification = backupManager.verifyBackup(backupId);
     Logger.log(`Backup ${backupId}:`, verification.success ? '✅' : '❌');
   });
   ```

7. **Documentation Review**
   - Review CHANGELOG.md - ensure all changes documented
   - Update README.md if system capabilities changed
   - Review and update operational docs if procedures changed
   - Check for outdated screenshots or examples

8. **Configuration Audit**
   ```javascript
   // Review all config settings
   const config = container.get(SERVICES.ConfigManager);
   const allConfigs = batchOps.getRowsByFilter(SHEET_NAMES.APPSHEET_CONFIG, {});

   Logger.log(`Total config entries: ${allConfigs.length}`);

   // Check critical settings
   const criticalConfigs = [
     'EMAIL_INGESTION_ENABLED',
     'MASK_SENDER_EMAIL',
     'MASK_PROPOSAL_CONTENT',
     'EXTERNAL_ARCHIVE_ID',
     'MAX_RETRY_ATTEMPTS'
   ];

   criticalConfigs.forEach(key => {
     const value = config.getString(key);
     Logger.log(`${key}: ${value}`);
   });
   ```

## Quarterly Maintenance

### First Monday of Quarter (2-4 hours)

**Time**: 9:00 AM Asia/Dubai

**Tasks**:

1. **Full System Audit**
   - Review all 19 sheets for data integrity
   - Validate schema consistency
   - Check for orphaned records
   - Verify referential integrity (dependencies, foreign keys)

2. **Capacity Planning**
   ```javascript
   // Project data growth
   const currentActions = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {}).length;
   const archivedActions = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS_ARCHIVE, {}).length;

   Logger.log(`Total actions (active + archived): ${currentActions + archivedActions}`);

   // Estimate quarterly growth rate
   // Plan external archive migration if needed
   ```

3. **Dependency Updates**
   - Check for clasp updates: `npm outdated`
   - Review Google Apps Script platform changes
   - Test on latest Apps Script runtime
   - Update dependencies if needed

4. **Disaster Recovery Test**
   ```javascript
   // Full backup → restore → verify cycle (on test copy)

   // 1. Create full backup
   const backupResult = backupManager.createBackup();

   // 2. Document current state
   const preRestoreState = {
     actions: batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {}).length,
     proposals: batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, {}).length
   };

   // 3. Simulate data loss (on TEST copy only)
   // 4. Restore from backup
   // 5. Verify data integrity matches pre-restore state
   // 6. Document procedure and timing
   ```

5. **Performance Optimization**
   - Review slow operations from ACTIVITY logs
   - Identify bottlenecks
   - Implement caching improvements
   - Optimize frequently-run queries

6. **Security Review**
   - Review OAuth scopes - ensure minimal permissions
   - Check spreadsheet sharing settings
   - Audit user access logs
   - Review sanitization effectiveness
   - Update security documentation

7. **Training & Knowledge Transfer**
   - Review knowledge-transfer.md for accuracy
   - Update based on lessons learned
   - Conduct training session for new team members (if applicable)
   - Document new procedures discovered

## Annual Maintenance

### First Monday of Year (Full Day)

**Time**: 9:00 AM - 5:00 PM Asia/Dubai

**Tasks**:

1. **Complete System Review**
   - Architecture review - identify technical debt
   - Security audit - full penetration testing
   - Performance analysis - year-over-year trends
   - Capacity planning - 12-month projection

2. **Major Version Planning**
   - Review feature requests accumulated over year
   - Plan next major version (v3.0.0)
   - Identify breaking changes needed
   - Create roadmap

3. **Documentation Overhaul**
   - Review all documentation for accuracy
   - Update screenshots and examples
   - Refresh knowledge transfer materials
   - Archive old version documentation

4. **Backup Archive**
   - Create annual backup archive
   - Move to long-term storage
   - Document archive location
   - Test restore procedure

5. **Compliance Review**
   - GDPR compliance check (if applicable)
   - Data retention policy review
   - Privacy policy update
   - Security certification renewal

## Ad-Hoc Maintenance

### Pre-Deployment Maintenance

**Trigger**: Before any code deployment

**Tasks**:
1. Run `runPreDeploymentChecks()`
2. Create verified backup
3. Document current system state
4. Review deployment checklist
5. Ensure rollback plan ready

See [Deployment Checklist](../operations/deployment-checklist.md) for full procedure.

### Post-Incident Maintenance

**Trigger**: After any system incident or outage

**Tasks**:
1. **Immediate**:
   - Restore service
   - Verify data integrity
   - Run health check
   - Document incident timeline

2. **Within 24 Hours**:
   - Root cause analysis
   - Create incident report
   - Identify preventive measures
   - Update runbooks

3. **Within 1 Week**:
   - Implement preventive fixes
   - Update monitoring/alerts
   - Conduct post-mortem review
   - Update documentation

### Performance Degradation Response

**Trigger**: Response times >2x baseline, quota warnings, user complaints

**Tasks**:
1. **Immediate Diagnosis**:
   ```javascript
   // Check system load
   const health = systemManager.runHealthCheck();

   // Check cache effectiveness
   const cacheStats = cache.getStats();

   // Review recent operations
   const recentLogs = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {})
     .slice(-100);

   // Identify slow operations
   const slowOps = recentLogs.filter(log => log.duration_ms && log.duration_ms > 5000);
   Logger.log('Slow operations (>5s):', slowOps);
   ```

2. **Mitigation**:
   - Enable aggressive caching
   - Reduce log verbosity temporarily
   - Disable non-critical features
   - Throttle batch operations

3. **Optimization**:
   - Profile slow operations
   - Optimize database queries
   - Implement pagination
   - Add indexes (via caching)

## Monitoring & Alerting

### Automated Monitoring (if configured)

**Daily Trigger** (2 AM Asia/Dubai):
```javascript
function dailyAutomatedMonitoring() {
  const logger = getLogger();
  const systemManager = container.get(SERVICES.SystemManager);

  try {
    // 1. Health check
    const health = systemManager.runHealthCheck();
    if (health.overall_status !== 'HEALTHY') {
      logger.error('DailyMonitoring', 'Health check failed', { health });
      // Send alert (email, etc.)
    }

    // 2. Error count check
    const batchOps = container.get(SERVICES.BatchOperations);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const errorCount = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {
      log_level: 'ERROR'
    }).filter(log => new Date(log.timestamp) > yesterday).length;

    if (errorCount > 10) {
      logger.warn('DailyMonitoring', 'High error count', { errorCount });
      // Send alert
    }

    // 3. Backup verification
    const backupManager = container.get(SERVICES.BackupManager);
    // Check if backup exists for today

    logger.info('DailyMonitoring', 'Daily monitoring completed', {
      health: health.overall_status,
      errors: errorCount
    });

  } catch (error) {
    logger.error('DailyMonitoring', 'Monitoring failed', {
      error: error.message,
      stack: error.stack
    });
    // Send critical alert
  }
}
```

### Alert Thresholds

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|------------------|-------------------|--------|
| Error Rate | >10/day | >50/day | Investigate logs, check for systemic issues |
| Health Status | DEGRADED | CRITICAL | Run diagnostics, review subsystems |
| Backup Failure | 1 failure | 2 consecutive | Check Drive permissions, verify quota |
| Test Failures | >5% fail rate | >10% fail rate | Review failed tests, restore from backup if needed |
| Response Time | >2x baseline | >5x baseline | Performance optimization, check quotas |
| Quota Usage | >80% | >95% | Optimize operations, request quota increase |

## Maintenance Log

**Location**: Google Sheet or separate document

**Template**:
```
Date: YYYY-MM-DD
Performed By: [Name]
Type: [Daily | Weekly | Monthly | Quarterly | Annual | Ad-Hoc]
Duration: [minutes/hours]

Tasks Completed:
- [ ] Task 1
- [ ] Task 2

Findings:
- Finding 1: [Description]
- Finding 2: [Description]

Actions Taken:
- Action 1: [Description]
- Action 2: [Description]

Follow-Up Required:
- [ ] Follow-up 1
- [ ] Follow-up 2

Notes:
[Additional observations]
```

## Maintenance Calendar

### Recurring Schedule

| Frequency | Day/Time | Duration | Tasks |
|-----------|----------|----------|-------|
| Daily AM | 9:00 AM Dubai | 5-10 min | Health check, error review, backup verification |
| Daily PM | 6:00 PM Dubai | 5 min | Final error scan, data integrity check |
| Weekly | Monday 9:00 AM | 30-45 min | Test suite, schema validation, performance review, backup cleanup |
| Monthly | 1st Monday 9:00 AM | 1-2 hours | Comprehensive health, security audit, archive operation, quota review |
| Quarterly | 1st Monday of Q | 2-4 hours | Full audit, capacity planning, DR test, optimization |
| Annual | 1st Monday of Year | Full day | Complete review, major version planning, documentation overhaul |

### Upcoming Maintenance Windows

**October 2025**:
- Weekly: Every Monday 9:00 AM
- Monthly: Monday October 7, 9:00 AM - 11:00 AM

**Q4 2025**:
- Quarterly: Monday October 7, 9:00 AM - 1:00 PM

**2026**:
- Annual: Monday January 5, 9:00 AM - 5:00 PM

## Emergency Contacts

**Maintenance Issues**:
- System Administrator: [Contact]
- Technical Lead: [Contact]
- Backup Administrator: [Contact]

**Escalation**:
- Critical system failure: [Emergency contact]
- Data loss incident: [Emergency contact]

## Related Documentation

- [Deployment Checklist](../operations/deployment-checklist.md)
- [Backup Procedures](../operations/backup-procedures.md)
- [Security Operations](../operations/security.md)
- [Knowledge Transfer](./knowledge-transfer.md)

---

**Last Updated**: 2025-10-08 (Phase 10)
**Next Review**: 2026-01-05 (Annual Maintenance)
