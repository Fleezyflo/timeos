# Phase 2 Data Backfill & Integrity Migrations

## Overview

This document describes the Phase 2 data integrity migrations implemented in `SystemBootstrap.seedInitialData()`. These migrations run automatically during system initialization and are idempotent (safe to run multiple times).

## Migrations Included

### 1. Version Column Backfill
**Purpose:** Ensure all rows in ACTIONS sheet have a version number for optimistic locking.

**Guard Flag:** `PHASE2_VERSION_BACKFILL_COMPLETE` (stored in ConfigManager)

**What It Does:**
- Scans all rows in ACTIONS sheet
- Identifies rows with missing/blank `version` column
- Sets `version = 1` for all rows missing a version
- Updates in batches of 200 rows maximum

**Performance:**
- Batch size: 200 rows per update
- Uses `BatchOperations.batchUpdate()` for efficiency
- Non-blocking: Won't fail system initialization if migration fails

### 2. JSON Column Sanitization
**Purpose:** Ensure all JSON columns contain valid JSON to prevent parse errors.

**Guard Flag:** `PHASE2_JSON_SANITIZATION_COMPLETE` (stored in ConfigManager)

**Columns Sanitized:**
- `dependencies` - Task dependency array → defaults to `'[]'`
- `tags` - Task tags array → defaults to `'[]'`
- `last_scheduled_attachments` - Attachments array → defaults to `'[]'`
- `scheduling_metadata` - Scheduling metadata object → defaults to `'{}'`
- `last_scheduled_metadata` - Metadata object → defaults to `'{}'`

**What It Does:**
- Scans all rows in ACTIONS sheet
- For each JSON column:
  - If blank/null: Sets to `'[]'` (arrays) or `'{}'` (objects)
  - If invalid JSON: Sets to `'[]'` (arrays) or `'{}'` (objects)
  - If valid JSON: No change
- Updates in batches of 200 cell updates maximum
- Uses rangeA1 format for precise cell targeting

**Performance:**
- Batch size: 200 rows per update
- Uses `BatchOperations.batchUpdate()` for efficiency
- Non-blocking: Won't fail system initialization if migration fails

## Preconditions

Before running migrations:
1. ✓ Phase 1 schema merged (all sheets exist with correct headers)
2. ✓ `SheetHealer.previewSchemaDiff()` returns empty
3. ✓ Working tree clean (`git status`)
4. ✓ Time-driven triggers paused (if running against production)

## Execution Steps

### Automatic Execution

Migrations run automatically when:
1. `START()` is called from RemoteControl
2. `completeSetup()` runs during system initialization
3. `seedInitialData()` executes as part of bootstrap Phase 3

### Manual Execution

To run migrations manually (for testing or re-execution):

```javascript
// In Apps Script IDE, run:
seedInitialData()
```

The guard flags will prevent re-execution unless you clear them:

```javascript
// To force re-execution (use with caution):
const configManager = container.get(SERVICES.ConfigManager);
configManager.set('PHASE2_VERSION_BACKFILL_COMPLETE', false);
configManager.set('PHASE2_JSON_SANITIZATION_COMPLETE', false);
seedInitialData(); // Will now re-run migrations
```

### Verification

After migration execution, check logs for:
```
[SystemBootstrap] Starting Phase 2 version column backfill...
[SystemBootstrap] Found X rows needing version backfill
[SystemBootstrap] Backfilled version for batch 1
[SystemBootstrap] Version backfill completed: X rows updated
[SystemBootstrap] Phase 2 version backfill guard flag set

[SystemBootstrap] Starting Phase 2 JSON column sanitization...
[SystemBootstrap] Found X rows needing JSON sanitization
[SystemBootstrap] Sanitized JSON for batch 1
[SystemBootstrap] JSON sanitization completed: X rows updated
[SystemBootstrap] Phase 2 JSON sanitization guard flag set
```

If guard flags are already set:
```
[SystemBootstrap] Phase 2 version backfill already completed (guard flag set)
[SystemBootstrap] Phase 2 JSON sanitization already completed (guard flag set)
```

## Rollback Guidance

### If Migrations Fail
Migrations are designed to be non-fatal. If they fail:
1. System initialization continues
2. Error is logged with full context
3. Warning message appears in logs

### If Data Issues Occur
If migrations cause data issues (unlikely but possible):

1. **Restore from Backup:**
   ```javascript
   // Use BACKUP() function before migrations if concerned
   BACKUP()
   ```

2. **Clear Guard Flags and Re-run:**
   ```javascript
   const configManager = container.get(SERVICES.ConfigManager);
   configManager.set('PHASE2_VERSION_BACKFILL_COMPLETE', false);
   configManager.set('PHASE2_JSON_SANITIZATION_COMPLETE', false);
   seedInitialData();
   ```

3. **Manual Data Fix:**
   - For version issues: Manually set version column to 1 for affected rows
   - For JSON issues: Manually fix invalid JSON or set to `[]` for arrays

## Safety Features

### Idempotency
- Guard flags prevent duplicate execution
- Safe to run multiple times
- No data loss on re-execution

### Batch Processing
- Maximum 200 rows per batch write
- Prevents timeout on large datasets
- Progress logged per batch

### No PII Exposure
- Logs do not contain sensitive data
- Only row counts and column names logged
- Error messages sanitized

### Non-Blocking
- Migrations won't crash system initialization
- Errors logged but don't propagate
- System continues even if migrations fail

## Schema Integrity Guards

Phase 2 also includes schema validation:

### SystemManager.validateSchemaIntegrity()
- Compares live headers to canonical SheetHealer schemas
- Reports discrepancies per sheet
- Integrated into health check

### SystemManager._validateHeadersOrThrow()
- Called during sheet health checks
- Throws on schema mismatch
- Prevents operations on misaligned sheets

### verify_sheet_creation.gs
- Validates schema before system operations
- Uses `previewSchemaDiff()` to detect drift
- Fails fast if schemas don't match

## Testing

### Unit Tests
Mock data with Phase 2 issues available via:
```javascript
const mockBatchOps = new MockBatchOperations(cache, logger);
mockBatchOps.seedPhase2TestData(); // Seeds 4 rows with various issues
```

Test scenarios:
- Row 1: Missing version, valid JSON
- Row 2: Missing version, invalid JSON
- Row 3: Has version, blank JSON fields
- Row 4: Has version, all valid (control)

### Integration Tests
Run comprehensive test suite:
```javascript
RUN_EVERYTHING_NOW() // Includes Phase 2 validations
```

## Performance Metrics

Expected performance for typical datasets:

| Rows | Version Backfill | JSON Sanitization | Total |
|------|-----------------|-------------------|-------|
| 100  | < 1s            | < 2s              | < 3s  |
| 500  | < 3s            | < 5s              | < 8s  |
| 1000 | < 5s            | < 10s             | < 15s |

Note: Times depend on Google Apps Script execution environment.

## Related Files

- `src/8_setup/SystemBootstrap.gs` - Migration implementation
- `src/4_services/SystemManager.gs` - Schema validation
- `src/0_bootstrap/SheetHealer.gs` - Canonical schema definitions
- `src/verify_sheet_creation.gs` - Pre-migration validation
- `src/7_support/MockBatchOperations.gs` - Test data seeding

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-01-07 | 1.0 | Initial Phase 2 migrations implementation |
