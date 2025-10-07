# Security Operations Guide

## Overview

This document outlines operational security procedures for MOH Time OS v2.0, including Phase 8 sanitization controls, privacy masking, and incident response procedures.

## Phase 8: Sanitization & Privacy Controls

### Security Features

Phase 8 implements defense-in-depth security controls across all user input entry points:

1. **Formula Injection Prevention**
2. **XSS (Cross-Site Scripting) Hardening**
3. **Privacy Masking** (optional, config-driven)
4. **Length Limiting**

### Enabling Privacy Masking

Privacy masking is **disabled by default** to ensure backward compatibility. Enable when handling sensitive data:

#### Via ConfigManager

```javascript
const configManager = container.get(SERVICES.ConfigManager);

// Enable content masking
configManager.set('MASK_PROPOSAL_CONTENT', 'true');

// Enable sender email masking
configManager.set('MASK_SENDER_EMAIL', 'true');

// Verify settings
const maskContent = configManager.getBoolean('MASK_PROPOSAL_CONTENT');
const maskSender = configManager.getBoolean('MASK_SENDER_EMAIL');
Logger.log({ maskContent, maskSender });
```

#### Via APPSHEET_CONFIG Sheet

1. Open the main spreadsheet
2. Navigate to APPSHEET_CONFIG sheet
3. Find row with `config_key` = 'cfg_mask_proposal_content'
4. Update `config_value` column to `'true'`
5. Update `updated_at` column to current timestamp (optional)
6. Repeat for 'cfg_mask_sender_email'

**Changes take effect** on next email processing cycle (no restart required due to 5-minute cache TTL).

### Disabling Privacy Masking

To disable privacy masking (e.g., for troubleshooting):

```javascript
const configManager = container.get(SERVICES.ConfigManager);
configManager.set('MASK_PROPOSAL_CONTENT', 'false');
configManager.set('MASK_SENDER_EMAIL', 'false');
```

Or manually update APPSHEET_CONFIG sheet values to `'false'`.

### Testing Procedures

#### Unit Tests

Run sanitization validation to verify security controls:

```javascript
// Run from Apps Script IDE
const result = validatePhase8Sanitization();
Logger.log(result); // Expected: true

// View detailed test results
// Check ACTIVITY sheet for Phase8Validation logs
```

Expected test coverage:
- ✓ Formula injection prevention (5 test cases)
- ✓ HTML/Script sanitization (4 test cases)
- ✓ HTML entity removal (1 test case)
- ✓ Privacy config flags exist (2 flags)
- ✓ Length limiting (1 test case)
- ✓ Null/undefined handling (3 test cases)

#### Integration Tests

Test end-to-end sanitization in real workflows:

```javascript
// Test 1: Create task with malicious input via AppSheet
const maliciousTask = {
  title: '=SUM(A1:A10)',
  description: '<script>alert(1)</script>',
  created_by: 'test@example.com'
};

const result = appsheet_createTask(maliciousTask);
Logger.log(result);
// Expected: { success: true, data: { action_id: '...', title: "'=SUM(A1:A10)" } }

// Verify in ACTIONS sheet:
const batchOps = container.get(SERVICES.BatchOperations);
const tasks = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, { action_id: result.data.action_id });
Logger.log(tasks[0]); // Title should be "'=SUM(A1:A10)", description should be "scriptalert(1)/script"
```

```javascript
// Test 2: Privacy masking with email ingestion
const configManager = container.get(SERVICES.ConfigManager);
configManager.set('MASK_PROPOSAL_CONTENT', 'true');
configManager.set('MASK_SENDER_EMAIL', 'true');

// Trigger email processing (or wait for scheduled trigger)
const emailEngine = container.get(SERVICES.EmailIngestionEngine);
// Process test email...

// Verify in PROPOSED_TASKS sheet:
const proposals = batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, {});
const latestProposal = proposals[proposals.length - 1];
Logger.log({
  sender: latestProposal.sender,  // Expected: "j***@example.com"
  content: latestProposal.raw_content_preview  // Expected: truncated with "[...masked]"
});
```

#### Manual Testing Checklist

- [ ] Create task via AppSheetBridge with formula injection attempt
- [ ] Verify task title prefixed with single quote in ACTIONS sheet
- [ ] Create task via ChatEngine with HTML tags
- [ ] Verify HTML tags removed in stored task
- [ ] Enable MASK_SENDER_EMAIL, process email
- [ ] Verify sender email masked in PROPOSED_TASKS
- [ ] Enable MASK_PROPOSAL_CONTENT, process email
- [ ] Verify content truncated to 100 chars + "[...masked]"
- [ ] Record human state with malicious notes
- [ ] Verify notes sanitized in HUMAN_STATE sheet

### Rollback Procedures

If sanitization causes data corruption or breaks legitimate workflows:

#### Immediate Rollback

```bash
# Revert Phase 8 commit
git revert <phase-8-commit-hash>

# Push to Apps Script
clasp push

# Verify in editor
clasp open
RUN_EVERYTHING_NOW()
```

#### Partial Rollback (Disable Privacy Masking Only)

```javascript
// Disable masking without reverting code
const configManager = container.get(SERVICES.ConfigManager);
configManager.set('MASK_PROPOSAL_CONTENT', 'false');
configManager.set('MASK_SENDER_EMAIL', 'false');
```

**Note**: Sanitization (formula injection prevention, XSS hardening) **cannot be disabled** without code rollback, as these are critical security controls.

#### Data Recovery

If existing data was incorrectly sanitized:

1. **Identify affected records**: Search ACTIONS/PROPOSED_TASKS for entries created after Phase 8 deployment
2. **Manual correction**: Edit individual rows in spreadsheet if critical data was truncated
3. **Bulk correction**: Export to CSV, edit externally, re-import (dangerous - use with caution)

**Prevention**: Sanitization only applies to new inputs after Phase 8 deployment. Existing data is not modified.

### Security Monitoring

#### Logging

All sanitization operations are logged via SmartLogger:

```javascript
// Query sanitization logs
const logger = container.get(SERVICES.SmartLogger);
const logs = batchOps.getRowsByFilter(SHEET_NAMES.ACTIVITY, {});

const sanitizationLogs = logs.filter(log =>
  log.component === 'AppSheetBridge' ||
  log.component === 'ChatEngine' ||
  log.component === 'EmailIngestionEngine' ||
  log.component === 'ZeroTrustTriageEngine' ||
  log.component === 'HumanStateManager'
);

Logger.log(sanitizationLogs);
```

#### Alerts

Set up monitoring for potential attack attempts:

```javascript
// Detect formula injection attempts
function detectFormulaInjectionAttempts() {
  const recentTasks = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
  const recentProposals = batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, {});

  const suspiciousTasks = recentTasks.filter(task =>
    task.title && task.title.startsWith("'") && /^[=+\-@]/.test(task.title.substring(1))
  );

  const suspiciousProposals = recentProposals.filter(proposal =>
    proposal.parsed_title && proposal.parsed_title.startsWith("'") && /^[=+\-@]/.test(proposal.parsed_title.substring(1))
  );

  if (suspiciousTasks.length > 0 || suspiciousProposals.length > 0) {
    logger.warn('SecurityMonitoring', 'Formula injection attempts detected', {
      tasks: suspiciousTasks.length,
      proposals: suspiciousProposals.length
    });
  }

  return { tasks: suspiciousTasks, proposals: suspiciousProposals };
}
```

Run this function weekly or integrate into health check.

#### Metrics

Track sanitization effectiveness:

```javascript
// Count sanitized entries per day
function getSanitizationMetrics() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentTasks = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {})
    .filter(task => new Date(task.created_at) > oneDayAgo);

  const sanitizedTitles = recentTasks.filter(task =>
    task.title && task.title.startsWith("'")
  ).length;

  const totalTasks = recentTasks.length;

  return {
    total_tasks: totalTasks,
    sanitized_titles: sanitizedTitles,
    sanitization_rate: totalTasks > 0 ? (sanitizedTitles / totalTasks * 100).toFixed(2) + '%' : '0%'
  };
}
```

### Common Issues and Troubleshooting

#### Issue: Legitimate Data Being Sanitized

**Symptom**: User reports task titles or descriptions being modified unexpectedly.

**Diagnosis**:
```javascript
// Check specific task
const task = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, { action_id: 'task123' })[0];
Logger.log({
  original_title: task.title,
  starts_with_quote: task.title.startsWith("'"),
  first_char: task.title.charAt(0)
});
```

**Resolution**:
- If title starts with `'=`, `'+`, `'-`, or `'@`: This is expected behavior (formula injection prevention)
- If user requires formula-like text: Instruct user to avoid starting titles with these characters
- If critical: Manually edit in spreadsheet to add space before character (e.g., " =Meeting notes")

#### Issue: Privacy Masking Not Working

**Symptom**: Sender emails or content still visible despite config enabled.

**Diagnosis**:
```javascript
// Verify config
const configManager = container.get(SERVICES.ConfigManager);
const maskContent = configManager.getBoolean('MASK_PROPOSAL_CONTENT');
const maskSender = configManager.getBoolean('MASK_SENDER_EMAIL');
Logger.log({ maskContent, maskSender });

// Check cache
const cache = container.get(SERVICES.CrossExecutionCache);
const cachedMaskContent = cache.get('config_MASK_PROPOSAL_CONTENT');
const cachedMaskSender = cache.get('config_MASK_SENDER_EMAIL');
Logger.log({ cachedMaskContent, cachedMaskSender });
```

**Resolution**:
1. Verify APPSHEET_CONFIG sheet values are `'true'` (not `true` boolean)
2. Wait 5 minutes for cache to expire
3. Manually clear cache: `cache.delete('config_MASK_PROPOSAL_CONTENT')`
4. Trigger new email processing to test

#### Issue: Length Limiting Truncating Important Data

**Symptom**: Task descriptions or notes cut off at 10,000 characters.

**Diagnosis**:
```javascript
const task = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, { action_id: 'task123' })[0];
Logger.log({
  description_length: task.description.length,
  truncated: task.description.length === 10000
});
```

**Resolution**:
- **Not configurable**: 10,000 character limit is hardcoded for security
- Workaround: Split large content across multiple tasks
- Permanent fix: Increase MAX_LENGTH in Utilities.gs:120 (requires code change)

**Prevention**: Inform users of character limits in documentation.

### Security Best Practices

1. **Never Disable Sanitization**: Formula injection and XSS prevention are critical
2. **Review Logs Regularly**: Check ACTIVITY sheet for suspicious patterns
3. **Test After Updates**: Run `validatePhase8Sanitization()` after any code changes
4. **Monitor Performance**: Sanitization should add <1ms per operation
5. **Document Exceptions**: If users require special characters, document workarounds
6. **Privacy by Default**: Enable masking for production environments handling sensitive data
7. **Least Privilege**: Restrict spreadsheet editing to essential users only

### Compliance Reporting

#### GDPR Right to Erasure

When a user requests data deletion:

```javascript
function eraseUserData(userEmail) {
  const batchOps = container.get(SERVICES.BatchOperations);

  // Delete from SENDER_REPUTATION
  const senderRows = batchOps.getRowsWithPosition(SHEET_NAMES.SENDER_REPUTATION, { sender: userEmail });
  const senderIndices = senderRows.map(row => row.sheetRow);
  if (senderIndices.length > 0) {
    batchOps.deleteRowsByIndices(SHEET_NAMES.SENDER_REPUTATION, senderIndices);
  }

  // Anonymize in PROPOSED_TASKS
  const proposals = batchOps.getRowsWithPosition(SHEET_NAMES.PROPOSED_TASKS, { sender: userEmail });
  proposals.forEach(proposalRow => {
    const updated = [...proposalRow.row];
    const senderIndex = batchOps.getHeaders(SHEET_NAMES.PROPOSED_TASKS).indexOf('sender');
    updated[senderIndex] = 'anonymized@example.com';
    batchOps.batchUpdate(SHEET_NAMES.PROPOSED_TASKS, [{
      row: proposalRow.sheetRow,
      values: updated
    }]);
  });

  Logger.log(`Erased data for user: ${userEmail}`);
}
```

#### Data Portability

Export user data for portability requests:

```javascript
function exportUserData(userEmail) {
  const batchOps = container.get(SERVICES.BatchOperations);

  // Export tasks created by user
  const tasks = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, { created_by: userEmail });

  // Export proposals from user
  const proposals = batchOps.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, { sender: userEmail });

  // Export as JSON
  const exportData = {
    export_date: new Date().toISOString(),
    user_email: userEmail,
    tasks: tasks,
    proposals: proposals
  };

  Logger.log(JSON.stringify(exportData, null, 2));
  return exportData;
}
```

### Incident Response

#### Security Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **CRITICAL** | Formula injection successfully executed, data exfiltrated | Immediate (<1 hour) |
| **HIGH** | XSS attempt detected, privacy masking bypassed | <4 hours |
| **MEDIUM** | Suspicious pattern detected, length limits exceeded frequently | <24 hours |
| **LOW** | Informational, sanitization working as expected | Weekly review |

#### Response Procedures

**CRITICAL Incident**:
1. **Contain**: Immediately disable affected entry points (comment out in code)
2. **Investigate**: Review ACTIVITY logs for attack timeline
3. **Remediate**: Apply emergency hotfix to strengthen sanitization
4. **Communicate**: Notify system owner and affected users
5. **Document**: Create post-mortem report with root cause analysis

**HIGH Incident**:
1. **Verify**: Confirm bypass with reproduction steps
2. **Patch**: Implement fix in sanitization logic
3. **Test**: Run full validation suite
4. **Deploy**: Push hotfix to production
5. **Monitor**: Watch logs for 24 hours post-fix

**MEDIUM/LOW Incidents**:
- Log in incident tracking sheet
- Review during weekly security review
- Batch fixes in next scheduled release

### Security Checklist

Use this checklist for periodic security audits:

- [ ] Privacy masking enabled for production environment
- [ ] All test accounts removed from production spreadsheet
- [ ] APPSHEET_CONFIG sheet protected from unauthorized edits
- [ ] Apps Script execution logs reviewed for anomalies
- [ ] No ERROR logs related to sanitization in ACTIVITY sheet
- [ ] `validatePhase8Sanitization()` returns true
- [ ] No manual edits to sanitized data detected
- [ ] OAuth scopes in appsscript.json minimized
- [ ] PropertiesService credentials rotated (if applicable)
- [ ] External archive spreadsheet (if used) has restricted permissions

Run this checklist monthly.

### Support and Escalation

For security-related questions or incidents:

1. **Documentation**: Consult docs/data-handling.md for sanitization policy
2. **Testing**: Run `validatePhase8Sanitization()` to verify system integrity
3. **Logs**: Review ACTIVITY sheet for sanitization warnings or errors
4. **Code Review**: Examine Utilities.gs:101-138 for sanitization logic
5. **Escalation**: If suspected breach, follow incident response procedures above

---

## Health Check Monitoring

### Health Check Execution

The system performs comprehensive health checks via `SystemManager.runHealthCheck()`, tracking 9 critical subsystems.

**Execution**:
```javascript
const systemManager = container.get(SERVICES.SystemManager);
const health = systemManager.runHealthCheck();
Logger.log(health);
```

**Response Structure** (9 checks):
- `database`: Spreadsheet connectivity and permissions
- `services`: Core service availability (batchOperations, logger, configManager, errorHandler)
- `data_integrity`: Schema validation via SheetHealer, required columns check
- `configuration`: Config manager health and setting validation
- `archives`: Archive location, external accessibility, record counts
- `lock_manager`: Lock success rate, contention, timeout metrics
- `triggers`: Trigger state (IDLE/IN_PROGRESS), last run timestamps
- `bulk_operations`: Batched logs, cache items, persistent store operations
- `data_sanitization`: Email masking capability, JSON sanitization readiness

### STATUS Persistence

Health check results persist to 3 STATUS sheet rows:

1. **last_health_check_summary**: `{ status, checks_count, partial_failure }`
2. **last_health_check_details**: Full healthResults JSON
3. **last_health_check_timestamp**: ISO timestamp

**Querying**:
```javascript
const status = systemManager.getSystemStatus();
const summary = JSON.parse(status['last_health_check_summary'] || '{}');
const timestamp = status['last_health_check_timestamp'];
```

### Bulk Operations Metrics

Tracks operational load across core services:
- `batched_logs`: SmartLogger queue depth (via `getStats().batchedLogsCount`)
- `cache_items`: CrossExecutionCache active items (via `getStats().accessOrderLength`)
- `store_operations`: PersistentStore total ops (via `getStats().totalOperations`)

### Sanitization Readiness

Validates data privacy capabilities:
- Email regex pattern matching functional
- JSON stringify available for context sanitization
- No runtime counters (capability check only)

---

**Last Updated**: Phase 9 Completion
**Version**: 2.0
**Status**: Production
**Security Classification**: Internal Use Only
