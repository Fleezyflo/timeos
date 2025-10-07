# MOH TIME OS v2.0 - Migration Execution Log

## Phase 1: Schema Alignment

### Execution Date: 2025-01-XX (Pending Production Execution)

**Executor**: Development Team
**Environment**: Production

#### Pre-Execution State
```javascript
// Run this to check current state:
const preview = previewSchemaDiff();
Logger.log(JSON.stringify(preview, null, 2));
```

**Expected Output**: Report of schema misalignments between live sheets and canonical SheetHealer definitions

#### Execution Steps

1. **Preview Schema Differences** (READ-ONLY)
   ```javascript
   const preview = previewSchemaDiff();
   // Document: preview.sheets_with_differences
   // Document: preview.differences (list of all misalignments)
   ```

2. **Apply Schema Fixes** (WRITE)
   ```javascript
   const result = applySchemaFixes();
   // Document: result.sheets_modified
   // Document: result.columns_added
   // Document: result.headers_realigned
   ```

3. **Verify Alignment** (READ-ONLY)
   ```javascript
   const verification = previewSchemaDiff();
   // Expected: verification.sheets_with_differences === 0
   ```

#### Post-Execution Verification
- [ ] Run `previewSchemaDiff()` - should return 0 differences
- [ ] Run `RUN_SCHEMA_INTEGRITY_TESTS()` - all tests should pass
- [ ] Verify SystemManager health check includes schema validation

#### Status
**NOT YET EXECUTED** - Script ready, awaiting production execution approval

#### Notes
- Schema migration utilities available in `src/8_setup/MigrateSheetSchemas.gs`
- Rollback commands can be generated via `generateRollbackCommands()`

---

## Phase 2: Data Backfill & Integrity

### Execution Date: 2025-01-XX (Pending Production Execution)

**Executor**: Development Team
**Environment**: Production

### 2.1 Version Column Backfill

#### Pre-Execution State
```javascript
const versionPreview = previewMissingVersions();
// Document: versionPreview.missing_version_count
// Document: versionPreview.sample_action_ids
```

#### Execution Steps

1. **Preview Missing Versions** (READ-ONLY)
   ```javascript
   const versionPreview = previewMissingVersions();
   Logger.log('Rows needing version backfill: ' + versionPreview.missing_version_count);
   Logger.log('Sample issues: ' + JSON.stringify(versionPreview.sample_action_ids, null, 2));
   ```

2. **Apply Version Backfill** (WRITE)
   ```javascript
   const versionResult = backfillActionVersions(200);  // 200 rows per batch
   Logger.log('Rows patched: ' + versionResult.rows_patched);
   Logger.log('Chunks processed: ' + versionResult.chunks_processed);
   ```

3. **Verify Backfill** (READ-ONLY)
   ```javascript
   const versionVerify = previewMissingVersions();
   // Expected: versionVerify.missing_version_count === 0
   ```

#### Status
**NOT YET EXECUTED** - Script ready, awaiting production execution approval

### 2.2 JSON Column Sanitization

#### Pre-Execution State
```javascript
const jsonPreview = previewJsonIssues('ACTIONS');
// Document: jsonPreview.total_issues (sum of all issues_by_column)
// Document: jsonPreview.issues_by_column (breakdown by column name)
```

#### Execution Steps

1. **Preview JSON Issues** (READ-ONLY)
   ```javascript
   const jsonPreview = previewJsonIssues('ACTIONS');
   const totalIssues = Object.values(jsonPreview.issues_by_column)
     .reduce((sum, col) => sum + col.total_issues, 0);
   Logger.log('Total JSON issues: ' + totalIssues);
   Logger.log('Issues by column: ' + JSON.stringify(jsonPreview.issues_by_column, null, 2));
   ```

2. **Apply JSON Backfill** (WRITE)
   ```javascript
   const jsonResult = backfillJsonDefaults('ACTIONS', null, 200);
   Logger.log('Total patches: ' + JSON.stringify(jsonResult.patches_by_column));
   ```

3. **Verify Sanitization** (READ-ONLY)
   ```javascript
   const jsonVerify = previewJsonIssues('ACTIONS');
   const totalIssues = Object.values(jsonVerify.issues_by_column)
     .reduce((sum, col) => sum + col.total_issues, 0);
   // Expected: totalIssues === 0
   ```

#### Status
**NOT YET EXECUTED** - Script ready, awaiting production execution approval

---

## Automated Verification

### Quick Verification Command
```javascript
// Run this single command to check all Phase 2 migration status
const results = verifyPhase2MigrationsComplete();
Logger.log(JSON.stringify(results, null, 2));
```

### Expected Output (When Complete)
```json
{
  "overall_status": "PASSED",
  "checks": {
    "version_backfill": {
      "status": "COMPLETE",
      "missing_count": 0
    },
    "json_sanitization": {
      "status": "COMPLETE",
      "total_issues": 0
    },
    "schema_integrity": {
      "status": "ALIGNED",
      "sheets_with_differences": 0
    }
  },
  "recommendations": []
}
```

### Generate Execution Log for Documentation
```javascript
// After running migrations, generate formatted log
const logResult = VERIFY_PHASE2_AND_LOG();
// Copy logResult.execution_log to this file
```

---

## Migration Utilities Reference

### Available Functions

**Schema Migration** (`src/8_setup/MigrateSheetSchemas.gs`):
- `previewSchemaDiff()` - Read-only check of schema alignment
- `applySchemaFixes()` - Apply header corrections
- `generateRollbackCommands()` - Generate manual rollback scripts

**Version Backfill** (`src/8_setup/BackfillActionVersions.gs`):
- `previewMissingVersions()` - Read-only check of missing versions
- `backfillActionVersions(chunkSize=200)` - Populate missing versions with value `1`

**JSON Sanitization** (`src/8_setup/BackfillJsonDefaults.gs`):
- `previewJsonIssues(sheetName, columnNames)` - Read-only check of JSON issues
- `backfillJsonDefaults(sheetName, columnNames, chunkSize=200)` - Replace empty/invalid JSON with defaults

**Verification** (`src/8_setup/VerifyPhase2Migrations.gs`):
- `verifyPhase2MigrationsComplete()` - Overall migration status check
- `VERIFY_PHASE2_AND_LOG()` - Run verification and generate execution log

---

## Test Suite Integration

### Schema Integrity Tests
**File**: `src/9_tests/SchemaIntegrityTests.gs`
**Command**: `RUN_SCHEMA_INTEGRITY_TESTS()`

**Tests**:
1. `testSchemaHeadersMatchCanonical()` - Verify SheetHealer schemas match expected structure
2. `testBatchOperationsJsonSanitization()` - Test JSON sanitization with mock data
3. `testVersionBackfill()` - Validate version backfill logic
4. `testSystemManagerSchemaValidation()` - Test schema validation with valid/invalid inputs

**Integration**: Now included in `RUN_EVERYTHING_NOW()` test suite (line 48)

---

## Rollback Procedures

### Phase 1 Rollback (Schema Changes)
- **If issues occur**: Run `previewSchemaDiff()` to identify discrepancies
- **Manual fix**: Run `applySchemaFixes()` to realign with canonical schemas
- **CSV restore**: Restore from backups in `backups/YYYY-MM-DD/` if data corruption occurred

### Phase 2 Rollback (Data Changes)
⚠️ **WARNING**: Version and JSON backfills are IRREVERSIBLE
- Original empty values are not preserved
- **Mitigation**: Create manual backup before running backfill scripts
- **Recommendation**: Run preview functions first to document what will change

---

## Execution Checklist

### Pre-Execution
- [ ] Verify all migration utility files are deployed (`clasp push`)
- [ ] Run all preview/verification functions (read-only) to document current state
- [ ] Create manual backup of critical sheets (ACTIONS, PROPOSED_TASKS)
- [ ] Confirm executor has necessary permissions

### Execution
- [ ] Run Phase 1: Schema alignment (`applySchemaFixes()`)
- [ ] Verify Phase 1: Check schema diff is zero
- [ ] Run Phase 2.1: Version backfill (`backfillActionVersions()`)
- [ ] Verify Phase 2.1: Check missing versions is zero
- [ ] Run Phase 2.2: JSON sanitization (`backfillJsonDefaults()`)
- [ ] Verify Phase 2.2: Check JSON issues is zero

### Post-Execution
- [ ] Run `verifyPhase2MigrationsComplete()` - overall verification
- [ ] Run `RUN_SCHEMA_INTEGRITY_TESTS()` - test suite validation
- [ ] Run `SystemManager.runHealthCheck()` - system health check
- [ ] Document results in this log
- [ ] Update status to "EXECUTED" with timestamp and findings

---

## Current Status Summary

**Phase 1 (Schema Alignment)**: NOT YET EXECUTED
- Scripts deployed: ✅
- Tests available: ✅
- Awaiting: Production execution approval

**Phase 2 (Data Backfill)**: NOT YET EXECUTED
- Scripts deployed: ✅
- Tests available: ✅
- Awaiting: Production execution approval

**Verification Utilities**: READY
- `verifyPhase2MigrationsComplete()` available
- `RUN_SCHEMA_INTEGRITY_TESTS()` integrated into test suite
- Execution log generator available

---

## Next Steps

1. **Review this execution plan** with stakeholders
2. **Schedule migration window** for production execution
3. **Run preview functions** to document current state
4. **Execute migrations** following checklist above
5. **Update this log** with execution results and timestamp
6. **Verify completion** using automated verification utilities
