# Backup and Restore Procedures

## Overview

MOH Time OS v2.0 includes comprehensive backup and restore capabilities via the **BackupManager** service. This document covers backup strategies, execution procedures, verification methods, and restore operations.

**Critical**: Always create and verify backups before deployments, schema changes, or bulk data operations.

## Backup Architecture

### Backup Storage

- **Location**: Google Drive folder `MOH_Time_OS_Backups/`
- **Organization**: Date-based subfolders (`YYYY-MM-DD/`)
- **Format**: CSV files + JSON metadata
- **Retention**: Manual (no automatic deletion)

### Backup Scope

**Default Backup Sheets** (8 critical sheets):
1. `ACTIONS` - Main task/action records
2. `PROPOSED_TASKS` - Task proposals awaiting approval
3. `DEPENDENCIES` - Task dependency relationships
4. `TIME_BLOCKS` - Scheduled time blocks
5. `ACTIVITY` - System activity logs
6. `STATUS` - System health metrics
7. `ACTIONS_ARCHIVE` - Archived action records
8. `PROPOSED_ARCHIVE` - Archived proposal records

**Custom Backups**: Can specify subset of sheets or additional sheets as needed.

### Backup Metadata

Each backup includes `backup_metadata.json` containing:
- `backupId` - Unique UUID identifier
- `timestamp` - ISO 8601 creation time
- `version` - System version at backup time
- `sheets` - Array of backed-up sheets with row counts
- `operator` - Email of user who created backup

## Creating Backups

### Standard Backup (All Default Sheets)

```javascript
// In Apps Script console
const backupManager = container.get(SERVICES.BackupManager);
const result = backupManager.createBackup();
Logger.log(result);
```

**Expected Output**:
```javascript
{
  success: true,
  backupId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  timestamp: "2025-10-08T14:30:00.000Z",
  sheets: [
    { name: "ACTIONS", rows: 1523 },
    { name: "PROPOSED_TASKS", rows: 89 },
    // ... other sheets
  ],
  verification: {
    metadataExists: true,
    allSheetsPresent: true,
    rowCountsMatch: true,
    filesReadable: true
  },
  duration: 4523  // milliseconds
}
```

**Important**: Record the `backupId` - you'll need it for verification and restore operations.

### Selective Backup (Specific Sheets)

```javascript
// Backup only specific sheets
const backupManager = container.get(SERVICES.BackupManager);
const result = backupManager.createBackup([
  SHEET_NAMES.ACTIONS,
  SHEET_NAMES.PROPOSED_TASKS,
  SHEET_NAMES.TIME_BLOCKS
]);
Logger.log(result);
```

### Pre-Deployment Backup

Before any deployment, create a verified backup:

```javascript
// 1. Create backup
const backupManager = container.get(SERVICES.BackupManager);
const backupResult = backupManager.createBackup();

// 2. Verify backup immediately
const verification = backupManager.verifyBackup(backupResult.backupId);

// 3. Check verification passed
if (!verification.success) {
  throw new Error('Backup verification failed - DO NOT PROCEED with deployment');
}

// 4. Record backup ID for rollback
Logger.log(`✅ Backup verified. Backup ID: ${backupResult.backupId}`);
// COPY THIS ID to your release notes
```

### Scheduled Backups

To set up automatic daily backups:

```javascript
// Create time-based trigger (run once to set up)
function setupDailyBackup() {
  // Delete existing backup triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'executeDailyBackup') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger for 2 AM daily
  ScriptApp.newTrigger('executeDailyBackup')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();

  Logger.log('Daily backup trigger created for 2 AM');
}

function executeDailyBackup() {
  const logger = getLogger();
  try {
    const backupManager = container.get(SERVICES.BackupManager);
    const result = backupManager.createBackup();

    if (result.success) {
      logger.info('DailyBackup', 'Scheduled backup completed', {
        backupId: result.backupId,
        sheets: result.sheets.length,
        duration: result.duration
      });
    } else {
      logger.error('DailyBackup', 'Scheduled backup failed', {
        error: 'Backup creation returned success: false'
      });
    }
  } catch (error) {
    logger.error('DailyBackup', 'Scheduled backup error', {
      error: error.message,
      stack: error.stack
    });
  }
}
```

## Verifying Backups

### Manual Verification

After creating a backup, always verify integrity:

```javascript
const backupManager = container.get(SERVICES.BackupManager);
const verification = backupManager.verifyBackup('[BACKUP_ID]');
Logger.log(verification);
```

**Expected Output**:
```javascript
{
  success: true,
  backupId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  checks: {
    metadataExists: true,      // backup_metadata.json found
    allSheetsPresent: true,    // All CSV files exist
    rowCountsMatch: true,      // Row counts match metadata
    filesReadable: true        // All files can be read
  },
  metadata: {
    backupId: "...",
    timestamp: "...",
    version: "v2.0.0-phase10",
    sheets: [ /* sheet info */ ],
    operator: "user@example.com"
  }
}
```

**Verification Failure Handling**:

```javascript
const verification = backupManager.verifyBackup('[BACKUP_ID]');

if (!verification.success) {
  Logger.log('❌ BACKUP VERIFICATION FAILED');
  Logger.log('Failed checks:', verification.checks);

  // Specific failure diagnostics
  if (!verification.checks.metadataExists) {
    Logger.log('→ Metadata file missing - backup may be incomplete');
  }
  if (!verification.checks.allSheetsPresent) {
    Logger.log('→ One or more CSV files missing');
  }
  if (!verification.checks.rowCountsMatch) {
    Logger.log('→ Row count mismatch - possible data corruption');
  }
  if (!verification.checks.filesReadable) {
    Logger.log('→ File read error - check Drive permissions');
  }

  // DO NOT use this backup for restore
  // Create a new backup
}
```

### Viewing Backup Files in Drive

1. Open Google Drive
2. Navigate to folder: `MOH_Time_OS_Backups/`
3. Open date-based subfolder (e.g., `2025-10-08/`)
4. Verify files present:
   - `ACTIONS_backup.csv`
   - `PROPOSED_TASKS_backup.csv`
   - `DEPENDENCIES_backup.csv`
   - `TIME_BLOCKS_backup.csv`
   - `ACTIVITY_backup.csv`
   - `STATUS_backup.csv`
   - `ACTIONS_ARCHIVE_backup.csv`
   - `PROPOSED_ARCHIVE_backup.csv`
   - `backup_metadata.json`

5. Spot-check file contents:
   - Open `backup_metadata.json` - verify JSON structure
   - Open any CSV file - verify headers present
   - Check file sizes are reasonable (not 0 bytes)

### Listing Available Backups

```javascript
// List all backups in Drive folder
function listAvailableBackups() {
  const backupFolderName = 'MOH_Time_OS_Backups';
  const folders = DriveApp.getFoldersByName(backupFolderName);

  if (!folders.hasNext()) {
    Logger.log('No backup folder found');
    return [];
  }

  const backupFolder = folders.next();
  const dateFolders = backupFolder.getFolders();
  const backups = [];

  while (dateFolders.hasNext()) {
    const dateFolder = dateFolders.next();
    const metadataFiles = dateFolder.getFilesByName('backup_metadata.json');

    if (metadataFiles.hasNext()) {
      const metadataFile = metadataFiles.next();
      const metadata = JSON.parse(metadataFile.getBlob().getDataAsString());
      backups.push({
        date: dateFolder.getName(),
        backupId: metadata.backupId,
        timestamp: metadata.timestamp,
        sheets: metadata.sheets.length,
        version: metadata.version
      });
    }
  }

  // Sort by timestamp descending (newest first)
  backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  Logger.log(`Found ${backups.length} backups:`);
  backups.forEach(backup => {
    Logger.log(`  ${backup.timestamp} - ${backup.backupId} (${backup.sheets} sheets)`);
  });

  return backups;
}
```

## Restoring from Backup

### Critical Warning

**DANGER**: Restore operations **overwrite current data**. Always:
1. Create a backup of current state before restoring
2. Verify the backup you're restoring from
3. Understand what data will be lost
4. Have rollback plan ready

### Single Sheet Restore

```javascript
// Restore a single sheet from backup
const backupManager = container.get(SERVICES.BackupManager);

// IMPORTANT: Create safety backup first
const safetyBackup = backupManager.createBackup([SHEET_NAMES.ACTIONS]);
Logger.log(`Safety backup created: ${safetyBackup.backupId}`);

// Restore from specific backup
const restoreResult = backupManager.restoreFromBackup(
  '[BACKUP_ID]',           // Backup to restore from
  SHEET_NAMES.ACTIONS      // Sheet to restore
);

Logger.log(restoreResult);
```

**Expected Output**:
```javascript
{
  success: true,
  sheetName: "ACTIONS",
  rowsRestored: 1523,
  backupId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  previousRowCount: 1587  // Rows before restore
}
```

### Multiple Sheet Restore

```javascript
// Restore multiple sheets from same backup
const backupManager = container.get(SERVICES.BackupManager);
const backupId = '[BACKUP_ID]';

// Create safety backup first
const safetyBackup = backupManager.createBackup();
Logger.log(`Safety backup: ${safetyBackup.backupId}`);

// Restore each sheet
const sheetsToRestore = [
  SHEET_NAMES.ACTIONS,
  SHEET_NAMES.PROPOSED_TASKS,
  SHEET_NAMES.TIME_BLOCKS
];

const results = [];
for (const sheetName of sheetsToRestore) {
  try {
    const result = backupManager.restoreFromBackup(backupId, sheetName);
    results.push({ sheet: sheetName, success: result.success, rows: result.rowsRestored });
    Logger.log(`✅ Restored ${sheetName}: ${result.rowsRestored} rows`);
  } catch (error) {
    results.push({ sheet: sheetName, success: false, error: error.message });
    Logger.log(`❌ Failed to restore ${sheetName}: ${error.message}`);
  }
}

Logger.log('Restore summary:', results);
```

### Full System Restore

```javascript
// Restore all default sheets (use with extreme caution)
function restoreFullSystem(backupId) {
  const logger = getLogger();
  const backupManager = container.get(SERVICES.BackupManager);

  // STEP 1: Verify source backup exists and is valid
  logger.info('FullRestore', 'Verifying source backup', { backupId });
  const verification = backupManager.verifyBackup(backupId);

  if (!verification.success) {
    throw new Error('Source backup verification failed - ABORTING restore');
  }

  // STEP 2: Create emergency safety backup
  logger.info('FullRestore', 'Creating safety backup before restore');
  const safetyBackup = backupManager.createBackup();

  if (!safetyBackup.success) {
    throw new Error('Safety backup failed - ABORTING restore');
  }

  logger.info('FullRestore', 'Safety backup created', {
    backupId: safetyBackup.backupId
  });

  // STEP 3: Restore all sheets from verified backup
  const defaultSheets = [
    SHEET_NAMES.ACTIONS,
    SHEET_NAMES.PROPOSED_TASKS,
    SHEET_NAMES.DEPENDENCIES,
    SHEET_NAMES.TIME_BLOCKS,
    SHEET_NAMES.ACTIVITY,
    SHEET_NAMES.STATUS,
    SHEET_NAMES.ACTIONS_ARCHIVE,
    SHEET_NAMES.PROPOSED_ARCHIVE
  ];

  const results = {
    sourceBackupId: backupId,
    safetyBackupId: safetyBackup.backupId,
    restored: [],
    failed: []
  };

  for (const sheetName of defaultSheets) {
    try {
      const restoreResult = backupManager.restoreFromBackup(backupId, sheetName);
      results.restored.push({
        sheet: sheetName,
        rows: restoreResult.rowsRestored
      });
      logger.info('FullRestore', `Restored ${sheetName}`, {
        rows: restoreResult.rowsRestored
      });
    } catch (error) {
      results.failed.push({
        sheet: sheetName,
        error: error.message
      });
      logger.error('FullRestore', `Failed to restore ${sheetName}`, {
        error: error.message
      });
    }
  }

  // STEP 4: Report results
  logger.info('FullRestore', 'Full system restore completed', results);

  if (results.failed.length > 0) {
    logger.warn('FullRestore', 'Some sheets failed to restore', {
      failedCount: results.failed.length,
      failed: results.failed
    });
  }

  return results;
}

// Execute full restore (USE WITH CAUTION)
// restoreFullSystem('[BACKUP_ID]');
```

### Post-Restore Verification

After any restore operation:

```javascript
// 1. Run health check
const systemManager = container.get(SERVICES.SystemManager);
const health = systemManager.runHealthCheck();
Logger.log('Post-restore health:', health);

// 2. Verify schema integrity
const sheetHealer = new SheetHealer();
const schemaReport = sheetHealer.validateAllSheets();
Logger.log('Schema validation:', schemaReport);

// 3. Run test suite
const testResult = RUN_EVERYTHING_NOW();
Logger.log('Test results:', testResult);

// 4. Check specific data
const batchOps = container.get(SERVICES.BatchOperations);
const actionCount = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {}).length;
Logger.log(`Actions count: ${actionCount}`);
```

## Backup Best Practices

### Before Deployments

```javascript
// Standard pre-deployment backup workflow
function preDeploymentBackup() {
  const backupManager = container.get(SERVICES.BackupManager);

  // 1. Create backup
  Logger.log('Creating pre-deployment backup...');
  const backup = backupManager.createBackup();

  if (!backup.success) {
    throw new Error('Backup creation failed - DO NOT DEPLOY');
  }

  // 2. Verify backup
  Logger.log('Verifying backup integrity...');
  const verification = backupManager.verifyBackup(backup.backupId);

  if (!verification.success) {
    throw new Error('Backup verification failed - DO NOT DEPLOY');
  }

  // 3. Log to deployment tracking
  const systemManager = container.get(SERVICES.SystemManager);
  systemManager.logDeploymentAction(
    'Pre-Deployment',
    'BACKUP',
    'SUCCESS',
    {
      backup_id: backup.backupId,
      sheets: backup.sheets.length,
      duration_ms: backup.duration
    }
  );

  Logger.log('✅ PRE-DEPLOYMENT BACKUP COMPLETE');
  Logger.log(`Backup ID: ${backup.backupId}`);
  Logger.log('📋 COPY THIS ID to your release notes');

  return backup.backupId;
}
```

### Regular Maintenance Backups

- **Frequency**: Daily at 2 AM (via scheduled trigger)
- **Retention**: Keep last 7 days, archive weekly backups
- **Verification**: Automated verification after each backup
- **Monitoring**: Check ACTIVITY logs for backup failures

### Before Schema Changes

```javascript
// Before running SheetHealer or schema modifications
function preSchemaChangeBackup() {
  const backupManager = container.get(SERVICES.BackupManager);

  Logger.log('Creating backup before schema change...');
  const backup = backupManager.createBackup();

  if (!backup.success || !backupManager.verifyBackup(backup.backupId).success) {
    throw new Error('Backup failed - DO NOT modify schema');
  }

  Logger.log(`✅ Schema change backup: ${backup.backupId}`);
  return backup.backupId;
}
```

### Before Bulk Operations

```javascript
// Before mass updates, deletions, or data migrations
function preBulkOperationBackup(affectedSheets) {
  const backupManager = container.get(SERVICES.BackupManager);

  Logger.log('Creating backup before bulk operation...');
  const backup = backupManager.createBackup(affectedSheets);

  if (!backup.success || !backupManager.verifyBackup(backup.backupId).success) {
    throw new Error('Backup failed - DO NOT proceed with bulk operation');
  }

  Logger.log(`✅ Bulk operation backup: ${backup.backupId}`);
  return backup.backupId;
}

// Example usage
const backupId = preBulkOperationBackup([
  SHEET_NAMES.ACTIONS,
  SHEET_NAMES.PROPOSED_TASKS
]);

// Now safe to proceed with bulk operation
```

## Backup Retention Policy

### Recommended Retention Schedule

- **Daily Backups**: Keep for 7 days
- **Weekly Backups** (Sunday): Keep for 4 weeks
- **Monthly Backups** (1st of month): Keep for 12 months
- **Pre-Deployment Backups**: Keep indefinitely (or until next deployment)
- **Emergency Backups**: Mark and keep indefinitely

### Manual Cleanup

```javascript
// Delete backups older than N days
function cleanupOldBackups(daysToKeep = 7) {
  const logger = getLogger();
  const backupFolderName = 'MOH_Time_OS_Backups';
  const folders = DriveApp.getFoldersByName(backupFolderName);

  if (!folders.hasNext()) {
    logger.warn('BackupCleanup', 'No backup folder found');
    return;
  }

  const backupFolder = folders.next();
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  const dateFolders = backupFolder.getFolders();

  let deletedCount = 0;

  while (dateFolders.hasNext()) {
    const dateFolder = dateFolders.next();
    const folderDate = new Date(dateFolder.getName()); // Assumes YYYY-MM-DD format

    if (folderDate < cutoffDate) {
      logger.info('BackupCleanup', `Deleting old backup folder: ${dateFolder.getName()}`);
      dateFolder.setTrashed(true);
      deletedCount++;
    }
  }

  logger.info('BackupCleanup', `Cleanup complete: ${deletedCount} folders deleted`);
}

// Run cleanup (deletes backups older than 7 days)
// cleanupOldBackups(7);
```

## Troubleshooting

### Backup Creation Fails

**Symptom**: `createBackup()` returns `success: false` or throws error

**Diagnosis**:
```javascript
// Check Drive permissions
try {
  const testFolder = DriveApp.createFolder('test_backup_permissions');
  testFolder.setTrashed(true);
  Logger.log('✅ Drive write permission OK');
} catch (error) {
  Logger.log('❌ Drive permission error:', error.message);
}

// Check sheet access
try {
  const batchOps = container.get(SERVICES.BatchOperations);
  const testData = batchOps.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
  Logger.log(`✅ Sheet read permission OK (${testData.length} rows)`);
} catch (error) {
  Logger.log('❌ Sheet access error:', error.message);
}
```

**Solutions**:
- Verify OAuth scopes include Drive API
- Check spreadsheet sharing permissions
- Ensure user has edit access to spreadsheet
- Verify no quotas exceeded (Drive storage, Apps Script execution time)

### Backup Verification Fails

**Symptom**: `verifyBackup()` returns failed checks

**Row Count Mismatch**:
- May indicate backup interrupted mid-write
- Create new backup, do not use failed backup

**Files Not Readable**:
- Check Drive folder permissions
- Verify backup folder not deleted/moved
- Check CSV file format not corrupted

**Missing Metadata**:
- Backup incomplete or interrupted
- Do not use for restore operations
- Create fresh backup

### Restore Operation Fails

**Symptom**: `restoreFromBackup()` throws error or returns `success: false`

**Diagnosis**:
```javascript
// Check backup file exists
const backupId = '[BACKUP_ID]';
const verification = backupManager.verifyBackup(backupId);
Logger.log(verification);

// Check sheet exists
const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet = ss.getSheetByName(SHEET_NAMES.ACTIONS);
Logger.log(`Sheet exists: ${sheet !== null}`);
```

**Solutions**:
- Verify backup ID is correct (UUID format)
- Ensure sheet name matches exactly (case-sensitive)
- Check target sheet is not protected
- Verify sufficient spreadsheet quota remaining

### CSV Parsing Errors

**Symptom**: Restore succeeds but data looks incorrect

**Causes**:
- Commas within data fields
- Unescaped quotes
- Malformed CSV structure

**Solution**:
- Inspect CSV file in Drive
- Check for manual edits to backup files (never edit backups manually)
- Re-create backup from known-good source

## Reference

### BackupManager API

```javascript
// Create backup (all default sheets)
backupManager.createBackup()

// Create backup (specific sheets)
backupManager.createBackup([SHEET_NAMES.ACTIONS, SHEET_NAMES.PROPOSED_TASKS])

// Verify backup
backupManager.verifyBackup(backupId)

// Restore single sheet
backupManager.restoreFromBackup(backupId, sheetName)

// Get backup folder ID
backupManager._getOrCreateBackupFolder() // Internal method
```

### Related Documentation

- [Deployment Checklist](./deployment-checklist.md)
- [Release Template](../releases/release-template.md)
- [Maintenance Schedule](../governance/maintenance-schedule.md)
- [Data Handling Policy](../data-handling.md)

### Emergency Contacts

- **Backup Issues**: [Technical Lead contact]
- **Drive Permission Issues**: [Google Workspace Admin contact]
- **Data Recovery**: [Backup Administrator contact]
