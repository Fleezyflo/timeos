# MOH TIME OS v2.0 - Schema Migrations & Data Backfill

## Overview

This document describes the schema migration and data backfill procedures for MOH TIME OS v2.0, ensuring data integrity and schema alignment across Google Sheets backend.

## Phase 1: Authoritative Schema Alignment

### Objective
Align ACTIONS and PROPOSED_TASKS sheet schemas with canonical definitions in `SheetHealer.gs`, ensuring MohTask model serialization matches sheet structure.

### Changes
1. **ACTIONS Schema**: Corrected column order
   - Moved `completion_notes`, `created_by`, `assigned_to`, `parent_id` to positions 14-17 (immediately after `completed_date`)
   - Maintained 53 total columns
   - Added 20 `last_scheduled_*` fields for optimistic locking context preservation

2. **PROPOSED_TASKS Schema**: Added `archived_at` column (position 16)

3. **Archive Schemas**: Added `ACTIONS_ARCHIVE` and `PROPOSED_ARCHIVE` definitions

### Files Modified
- `src/0_bootstrap/SheetHealer.gs` - Canonical schema definitions
- `src/2_models/MohTask.gs` - Model serialization (toSheetRow)
- `src/7_support/MockBatchOperations.gs` - Test infrastructure
- `src/verify_sheet_creation.gs` - Column count validation

### Migration Utility
**File**: `src/8_setup/MigrateSheetSchemas.gs`

**Functions**:
- `previewSchemaDiff()` - Dry-run analysis of schema differences
- `applySchemaFixes()` - Applies header corrections idempotently
- `generateRollbackCommands()` - Generates manual rollback scripts

### Execution
```javascript
// 1. Preview changes (read-only)
const preview = previewSchemaDiff();
Logger.log(JSON.stringify(preview, null, 2));

// 2. Apply fixes if needed
if (preview.sheets_with_differences > 0) {
  const result = applySchemaFixes();
  Logger.log(JSON.stringify(result, null, 2));
}

// 3. Verify alignment
const verification = previewSchemaDiff();
if (verification.sheets_with_differences === 0) {
  Logger.log('✓ Schema alignment complete');
}
```

---

## Phase 2: Data Backfill & Integrity Guard Rails

### Objective
Backfill missing `version` column values and sanitize JSON columns to ensure data integrity and prevent downstream parsing errors.

### 2.1 Version Column Backfill

**Purpose**: Enable optimistic locking for concurrent task updates

**File**: `src/8_setup/BackfillActionVersions.gs`

**Functions**:
- `previewMissingVersions()` - Returns count and sample IDs of rows with missing/invalid versions
- `backfillActionVersions(chunkSize=200)` - Sets all empty/invalid version values to `1`

**Execution**:
```javascript
// 1. Preview (required first step)
const versionPreview = previewMissingVersions();
Logger.log('Rows needing version backfill: ' + versionPreview.missing_version_count);
Logger.log('Sample issues: ' + JSON.stringify(versionPreview.sample_action_ids, null, 2));

// 2. Apply backfill
const versionResult = backfillActionVersions(200);  // Process 200 rows per batch
Logger.log('Rows patched: ' + versionResult.rows_patched);
Logger.log('Chunks processed: ' + versionResult.chunks_processed);

// 3. Verify (should return 0)
const versionVerify = previewMissingVersions();
if (versionVerify.missing_version_count === 0) {
  Logger.log('✓ Version backfill complete');
}
```

**Chunk Size**: Default 200 rows per batch to avoid execution timeout on large datasets.

### 2.2 JSON Column Sanitization

**Purpose**: Ensure all JSON columns contain valid JSON strings to prevent parsing errors in application code

**File**: `src/8_setup/BackfillJsonDefaults.gs`

**JSON Defaults Mapping**:
```javascript
const JSON_DEFAULTS = {
  'scheduling_metadata': '{}',
  'dependencies': '[]',
  'tags': '[]',
  'last_scheduled_attachments': '[]',
  'last_scheduled_metadata': '{}'
};
```

**Functions**:
- `previewJsonIssues(sheetName='ACTIONS', columnNames=null)` - Returns per-column issue counts
- `backfillJsonDefaults(sheetName='ACTIONS', columnNames=null, chunkSize=200)` - Replaces empty/invalid JSON with defaults

**Execution**:
```javascript
// 1. Preview
const jsonPreview = previewJsonIssues('ACTIONS');
Logger.log('Total JSON issues: ' + Object.values(jsonPreview.issues_by_column).reduce((sum, col) => sum + col.total_issues, 0));
Logger.log('Issues by column: ' + JSON.stringify(jsonPreview.issues_by_column, null, 2));

// 2. Apply backfill
const jsonResult = backfillJsonDefaults('ACTIONS', null, 200);
Logger.log('Total patches: ' + jsonResult.patches_by_column);

// 3. Verify
const jsonVerify = previewJsonIssues('ACTIONS');
const totalIssues = Object.values(jsonVerify.issues_by_column).reduce((sum, col) => sum + col.total_issues, 0);
if (totalIssues === 0) {
  Logger.log('✓ JSON sanitization complete');
}
```

### 2.3 BatchOperations JSON Sanitization

**Enhancement**: `src/0_bootstrap/AA_Container.gs` (BatchOperations class)

**New Method**:
```javascript
/**
 * Sanitize JSON columns by replacing empty/invalid values with defaults
 * @param {string} sheetName - Name of sheet to sanitize
 * @param {Array<string>} columnNames - Array of column names to sanitize
 * @param {Object} defaultsMap - Map of column names to default JSON strings
 * @returns {Object} Result with patches_applied count
 */
sanitizeJsonColumns(sheetName, columnNames, defaultsMap)
```

**Usage**:
```javascript
const batchOps = container.get(SERVICES.BatchOperations);
const result = batchOps.sanitizeJsonColumns('ACTIONS', ['dependencies', 'tags'], {
  'dependencies': '[]',
  'tags': '[]'
});
```

### 2.4 Schema Integrity Guards

**File**: `src/4_services/SystemManager.gs`

**New Method**: `_validateHeadersOrThrow(sheetName, actualHeaders)`
- Validates sheet headers against canonical SheetHealer schemas
- Throws descriptive error on count or order mismatch
- Integrated into `_safeCheckSheetHealth()` for continuous monitoring

**Integration**: `runHealthCheck()` now includes schema validation status

**File**: `src/verify_sheet_creation.gs`
- Added `previewSchemaDiff()` call at start of verification
- Fails test immediately if schema misalignment detected

---

## Testing

### Unit & Integration Tests

**File**: `src/9_tests/SchemaIntegrityTests.gs`

**Test Suite**: `RUN_SCHEMA_INTEGRITY_TESTS()`

**Tests**:
1. `testSchemaHeadersMatchCanonical()` - Verifies SheetHealer schemas have correct structure and column positions
2. `testBatchOperationsJsonSanitization()` - Tests JSON sanitization with mock malformed data
3. `testVersionBackfill()` - Validates version backfill logic with test scenarios
4. `testSystemManagerSchemaValidation()` - Tests `_validateHeadersOrThrow()` with valid and invalid inputs

**Execution**:
```javascript
// From Apps Script IDE
const testResults = RUN_SCHEMA_INTEGRITY_TESTS();
Logger.log('Tests passed: ' + testResults.passed + '/' + testResults.total);
```

### Regression Suite
```bash
# Local validation (load order)
node validate_load_order.js

# Unit tests (if configured)
npm test

# Apps Script comprehensive tests
# Run RUN_EVERYTHING.gs in Apps Script IDE
```

---

## Rollback Procedures

### Phase 1 Rollback

**If schema changes cause issues**:

1. **Immediate**: Run `previewSchemaDiff()` to identify discrepancies
2. **Manual Fix**: Use `applySchemaFixes()` to realign with canonical
3. **CSV Restore**: If data corruption occurred, restore from backups in `backups/YYYY-MM-DD/`

**Rollback Commands** (generated by `generateRollbackCommands()`):
```javascript
// Example: Remove added columns
var sheet = SpreadsheetApp.getActive().getSheetByName('ACTIONS');
sheet.deleteColumns(51, 3);  // Remove last 3 columns if needed
```

### Phase 2 Rollback

**Version Backfill**:
- Cannot be rolled back (data change is permanent)
- Original empty values not preserved
- **Mitigation**: Backup sheet before running `backfillActionVersions()`

**JSON Sanitization**:
- Cannot be rolled back (overwrites original values)
- **Mitigation**: Run `previewJsonIssues()` first to document what will change
- **CSV Backup**: Create manual backup before running `backfillJsonDefaults()`

---

## Execution Log Template

Document each migration execution:

```markdown
## Migration Execution: Phase 2 Data Backfill

**Date**: YYYY-MM-DD HH:MM:SS
**Executor**: [Your Name]
**Environment**: [Production/Staging/Dev]

### Pre-Execution State
- Version preview: X rows needing backfill
- JSON preview: Y total issues across Z columns

### Execution Steps
1. `backfillActionVersions()` - Started HH:MM:SS, Completed HH:MM:SS
   - Rows patched: X
   - Chunks processed: Y
   - Errors: None

2. `backfillJsonDefaults()` - Started HH:MM:SS, Completed HH:MM:SS
   - Patches by column: {...}
   - Total patches: Z
   - Errors: None

### Post-Execution Verification
- Version preview: 0 rows needing backfill ✓
- JSON preview: 0 total issues ✓
- SystemManager health check: PASSED ✓
- Schema integrity tests: 4/4 PASSED ✓

### Issues Encountered
- None

### Notes
- [Any observations or recommendations]
```

---

## Maintenance

### Ongoing Monitoring

**Health Check**: `SystemManager.runHealthCheck()` now includes schema validation
```javascript
const health = container.get(SERVICES.SystemManager).runHealthCheck();
if (health.checks.schema_integrity.status !== 'HEALTHY') {
  Logger.log('⚠️ Schema integrity issue detected');
  Logger.log(JSON.stringify(health.checks.schema_integrity.details));
}
```

**Scheduled Validation**: Consider adding time-driven trigger to run `previewSchemaDiff()` daily

### Future Migrations

When adding new columns:
1. Update `SheetHealer._getActionsSchema()` (or appropriate schema method)
2. Update `MohTask.toSheetRow()` propertyMap
3. Update `MockBatchOperations.initializeMockSheets()`
4. Run `previewSchemaDiff()` to verify changes
5. Run `applySchemaFixes()` to apply to live sheets
6. Update tests and documentation

---

## References

- Phase 1 Plan: Repository branch `feature/phase1-schema-alignment`
- Phase 2 Plan: Repository branch `feature/phase2-data-backfill`
- SheetHealer Documentation: `src/0_bootstrap/SheetHealer.gs`
- SystemManager API: `src/4_services/SystemManager.gs`
