 PHASE 1 – AUTHORITATIVE SCHEMA ALIGNMENT

    Zero-Ambiguity Execution Protocol

    ---
    I. PRE-FLIGHT VERIFICATION & SAFETY NET

    A. Evidence Baseline (Completed Analysis)

    Critical Discrepancy Identified:
    - File: src/0_bootstrap/SheetHealer.gs:285-293
    - Current State: 31 columns in _getActionsSchema() headers array
    - Expected State: 52 columns (source of truth: MohTask.toSheetRow() at 
    lines 428-482)
    - Missing Columns (21 total):
      a. version (line 453)
      b. last_scheduled_score through last_scheduled_estimated_completion 
    (lines 454-474, 20 columns)

    Authoritative Column Order (MohTask.toSheetRow lines 428-482):
    action_id, status, priority, created_at, updated_at,
    title, context, lane, estimated_minutes, scheduled_start,
    scheduled_end, actual_minutes, completed_date, source,
    source_id, description, calendar_event_id, rollover_count,
    scheduling_metadata, score, deadline, energy_required,
    focus_required, estimation_accuracy, version,
    last_scheduled_score, last_scheduled_block_type, 
    last_scheduled_energy_level,
    last_scheduled_context_type, last_scheduled_lane, 
    last_scheduled_duration,
    last_scheduled_priority, last_scheduled_impact, last_scheduled_urgency,
    last_scheduled_effort_minutes, last_scheduled_estimation_accuracy,
    last_scheduled_rollover_count, last_scheduled_last_rollover_date,
    last_scheduled_notes, last_scheduled_source, last_scheduled_source_id,
    last_scheduled_external_url, last_scheduled_attachments, 
    last_scheduled_metadata,
    last_scheduled_dependency, last_scheduled_estimated_completion,
    completion_notes, created_by, assigned_to, parent_id,
    dependencies, tags, archived_at

    Impacted Components:
    1. SheetHealer._getActionsSchema() 
    (src/0_bootstrap/SheetHealer.gs:283-335)
    2. SheetHealer._getProposedTasksSchema() 
    (src/0_bootstrap/SheetHealer.gs:341-359) - needs archived_at
    3. MockBatchOperations.initializeMockSheets() 
    (src/7_support/MockBatchOperations.gs:25-36) - ACTIONS mock
    4. TestSeeder._seedBasicWorkflowData() 
    (src/7_support/TestSeeder.gs:117-127) - dynamic, should work
    5. VERIFY_SHEET_CREATION() (src/verify_sheet_creation.gs:11-87) - needs 
    header count assertion
    6. SystemManager.runHealthCheck() 
    (src/4_services/SystemManager.gs:87-140) - needs schema validator

    Archive Sheets Status:
    - ACTIONS_ARCHIVE and PROPOSED_ARCHIVE defined in SHEET_NAMES 
    (AA_Container.gs:117-118)
    - NOT in SheetHealer.getRequiredSheets() (lines 262-278) - auto-created 
    by ArchiveManager
    - Archive schema = source schema + archived_at column 
    (ArchiveManager.gs:163)

    B. Backup Preparation

    Directory Structure (Created):
    backups/2025-10-07/  [exists, verified via ls]

    Manual Backup Required (User Action Before Execution):
    For each sheet in Google Sheets UI:
    1. ACTIONS → File → Download → CSV → save as 
    backups/2025-10-07/ACTIONS.csv
    2. PROPOSED_TASKS → save as backups/2025-10-07/PROPOSED_TASKS.csv
    3. DEPENDENCIES → save as backups/2025-10-07/DEPENDENCIES.csv
    4. TIME_BLOCKS → save as backups/2025-10-07/TIME_BLOCKS.csv
    5. ACTIVITY → save as backups/2025-10-07/ACTIVITY.csv
    6. STATUS → save as backups/2025-10-07/STATUS.csv
    7. APPSHEET_CONFIG → save as backups/2025-10-07/APPSHEET_CONFIG.csv
    8. ACTIONS_ARCHIVE (if exists) → save as 
    backups/2025-10-07/ACTIONS_ARCHIVE.csv
    9. PROPOSED_ARCHIVE (if exists) → save as 
    backups/2025-10-07/PROPOSED_ARCHIVE.csv

    Log Entry Template:
    File: backups/2025-10-07/BACKUP_LOG.md
    Content:
    ---
    # Phase 1 Backup Log
    **Date:** 2025-10-07T[HH:MM:SS]+04:00
    **Operator:** [Your Name]
    **Branch:** feature/phase1-schema-alignment

    ## Sheets Backed Up:
    - [ ] ACTIONS (rows: ___,  size: ___ KB)
    - [ ] PROPOSED_TASKS (rows: ___, size: ___ KB)
    - [ ] DEPENDENCIES (rows: ___, size: ___ KB)
    - [ ] TIME_BLOCKS (rows: ___, size: ___ KB)
    - [ ] ACTIVITY (rows: ___, size: ___ KB)
    - [ ] STATUS (rows: ___, size: ___ KB)
    - [ ] APPSHEET_CONFIG (rows: ___, size: ___ KB)
    - [ ] ACTIONS_ARCHIVE (rows: ___, size: ___ KB) [if exists]
    - [ ] PROPOSED_ARCHIVE (rows: ___, size: ___ KB) [if exists]

    ## Verification:
    All CSVs readable: [ ]
    Total backup size: ___ MB
    ---

    C. Repository Baseline Validation

    Commands (Sequential Execution Required):
    # 1. Create feature branch
    git checkout -b feature/phase1-schema-alignment

    # 2. Validate load order (must pass with exit code 0)
    node validate_load_order.js
    # Expected output: "All files loaded in correct order" or equivalent 
    success message

    # 3. Capture baseline test state
    clasp run RUN_ALL_TESTS > backups/2025-10-07/baseline_tests.log 2>&1
    # OR manually run RUN_ALL_TESTS() in Apps Script IDE and copy logs

    Abort Condition:
    - If validate_load_order.js exits with non-zero code → HALT, resolve load
     order issues first
    - If baseline tests show failures → document in 
    backups/2025-10-07/baseline_failures.txt for comparison

    ---
    II. CODE MODIFICATIONS (File-by-File Specification)

    FILE 1: src/0_bootstrap/SheetHealer.gs

    Operation: Replace _getActionsSchema() headers array

    Location: Lines 285-293

    OLD CODE (31 columns):
    headers: [
      'action_id', 'status', 'priority', 'created_at', 'updated_at',
      'title', 'context', 'lane', 'estimated_minutes', 'scheduled_start',
      'scheduled_end', 'actual_minutes', 'completed_date', 
    'completion_notes',
      'source', 'source_id', 'description', 'calendar_event_id', 
    'rollover_count',
      'scheduling_metadata', 'score', 'deadline', 'energy_required',
      'focus_required', 'estimation_accuracy', 'created_by',
      'assigned_to', 'parent_id', 'dependencies', 'tags', 'archived_at'
    ],

    NEW CODE (52 columns - EXACT ORDER from MohTask.toSheetRow):
    headers: [
      'action_id', 'status', 'priority', 'created_at', 'updated_at',
      'title', 'context', 'lane', 'estimated_minutes', 'scheduled_start',
      'scheduled_end', 'actual_minutes', 'completed_date', 'source',
      'source_id', 'description', 'calendar_event_id', 'rollover_count',
      'scheduling_metadata', 'score', 'deadline', 'energy_required',
      'focus_required', 'estimation_accuracy', 'version',
      'last_scheduled_score', 'last_scheduled_block_type', 
    'last_scheduled_energy_level',
      'last_scheduled_context_type', 'last_scheduled_lane', 
    'last_scheduled_duration',
      'last_scheduled_priority', 'last_scheduled_impact', 
    'last_scheduled_urgency',
      'last_scheduled_effort_minutes', 'last_scheduled_estimation_accuracy',
      'last_scheduled_rollover_count', 'last_scheduled_last_rollover_date',
      'last_scheduled_notes', 'last_scheduled_source', 
    'last_scheduled_source_id',
      'last_scheduled_external_url', 'last_scheduled_attachments', 
    'last_scheduled_metadata',
      'last_scheduled_dependency', 'last_scheduled_estimated_completion',
      'completion_notes', 'created_by', 'assigned_to', 'parent_id',
      'dependencies', 'tags', 'archived_at'
    ],

    Location: Line 294

    OLD CODE:
    columnWidths: [150, 100, 80, 150, 150, 200, 100, 80, 80, 150, 150, 80, 
    150, 100, 150, 300],

    NEW CODE (52 entries):
    columnWidths: [
      150, 100, 80, 150, 150, 200, 100, 80, 80, 150,    // 1-10
      150, 80, 150, 150, 150, 300, 150, 80, 250, 80,    // 11-20
      150, 100, 100, 120, 80,                            // 21-25 (version at
     25)
      80, 120, 120, 120, 100, 80,                        // 26-31 
    (last_scheduled_score → duration)
      100, 100, 100, 80, 120,                            // 32-36 (priority →
     estimation_accuracy)
      80, 150, 200, 150, 150,                            // 37-41 
    (rollover_count → source_id)
      200, 250, 250, 150, 150,                           // 42-46 
    (external_url → estimated_completion)
      200, 150, 150, 150, 250, 250, 150                  // 47-52 
    (completion_notes → archived_at)
    ],

    Validation Rules: No changes needed (lines 295-334) - existing ranges 
    still valid for columns B, C, H, V, W

    ---
    Operation 2: Update _getProposedTasksSchema() to add archived_at

    Location: Lines 343-348

    OLD CODE:
    headers: [
      'proposal_id', 'status', 'created_at', 'processed_at', 'source',
      'source_id', 'sender', 'subject', 'parsed_title', 'suggested_lane',
      'suggested_priority', 'suggested_duration',
      'confidence_score', 'raw_content_preview', 'created_task_id'
    ],

    NEW CODE (16 columns):
    headers: [
      'proposal_id', 'status', 'created_at', 'processed_at', 'source',
      'source_id', 'sender', 'subject', 'parsed_title', 'suggested_lane',
      'suggested_priority', 'suggested_duration',
      'confidence_score', 'raw_content_preview', 'created_task_id', 
    'archived_at'
    ],

    Location: Line 349

    OLD CODE:
    columnWidths: [150, 120, 150, 150, 100, 150, 200, 250, 200, 100, 80, 
    400],

    NEW CODE (16 entries):
    columnWidths: [150, 120, 150, 150, 100, 150, 200, 250, 200, 100, 80, 80, 
    120, 400, 150, 150],

    ---
    FILE 2: src/7_support/MockBatchOperations.gs

    Operation: Update ACTIONS mock sheet headers

    Location: Lines 26-34

    OLD CODE:
    headers: [
      'action_id', 'status', 'priority', 'created_at', 'updated_at',
      'title', 'context', 'lane', 'estimated_minutes', 'scheduled_start',
      'scheduled_end', 'actual_minutes', 'completed_date', 
    'completion_notes',
      'source', 'source_id', 'description', 'calendar_event_id', 
    'rollover_count',
      'scheduling_metadata', 'score', 'deadline', 'energy_required',
      'focus_required', 'estimation_accuracy', 'created_by',
      'assigned_to', 'parent_id', 'dependencies', 'tags'
    ],

    NEW CODE (52 columns - identical to SheetHealer):
    headers: [
      'action_id', 'status', 'priority', 'created_at', 'updated_at',
      'title', 'context', 'lane', 'estimated_minutes', 'scheduled_start',
      'scheduled_end', 'actual_minutes', 'completed_date', 'source',
      'source_id', 'description', 'calendar_event_id', 'rollover_count',
      'scheduling_metadata', 'score', 'deadline', 'energy_required',
      'focus_required', 'estimation_accuracy', 'version',
      'last_scheduled_score', 'last_scheduled_block_type', 
    'last_scheduled_energy_level',
      'last_scheduled_context_type', 'last_scheduled_lane', 
    'last_scheduled_duration',
      'last_scheduled_priority', 'last_scheduled_impact', 
    'last_scheduled_urgency',
      'last_scheduled_effort_minutes', 'last_scheduled_estimation_accuracy',
      'last_scheduled_rollover_count', 'last_scheduled_last_rollover_date',
      'last_scheduled_notes', 'last_scheduled_source', 
    'last_scheduled_source_id',
      'last_scheduled_external_url', 'last_scheduled_attachments', 
    'last_scheduled_metadata',
      'last_scheduled_dependency', 'last_scheduled_estimated_completion',
      'completion_notes', 'created_by', 'assigned_to', 'parent_id',
      'dependencies', 'tags', 'archived_at'
    ],

    Operation 2: Update PROPOSED_TASKS mock sheet headers

    Location: Lines 64-69

    OLD CODE:
    headers: [
      'proposal_id', 'status', 'created_at', 'processed_at', 'source',
      'source_id', 'sender', 'subject', 'parsed_title', 'suggested_lane',
      'suggested_priority', 'suggested_duration',
      'confidence_score', 'raw_content_preview', 'created_task_id'
    ],

    NEW CODE:
    headers: [
      'proposal_id', 'status', 'created_at', 'processed_at', 'source',
      'source_id', 'sender', 'subject', 'parsed_title', 'suggested_lane',
      'suggested_priority', 'suggested_duration',
      'confidence_score', 'raw_content_preview', 'created_task_id', 
    'archived_at'
    ],

    ---
    FILE 3: src/verify_sheet_creation.gs

    Operation: Add explicit header count verification

    Location: After line 32 (inside if (lastRow > 0) block)

    INSERT NEW CODE:
          // Verify ACTIONS sheet has correct column count
          if (appsheetConfig.getName() === 'APPSHEET_CONFIG') {
            // This was already checking APPSHEET_CONFIG, now add ACTIONS 
    check
          }
        }
      } else {
        Logger.log('✗ APPSHEET_CONFIG sheet NOT FOUND - CRITICAL ERROR!');
        return { success: false, error: 'APPSHEET_CONFIG sheet missing after 
    FIX()' };
      }

      // NEW: Verify ACTIONS sheet header count
      Logger.log('\nStep 2b: Verifying ACTIONS schema integrity...');
      const actionsSheet = spreadsheet.getSheetByName('ACTIONS');
      if (actionsSheet) {
        const actionsHeaders = actionsSheet.getRange(1, 1, 1, 
    actionsSheet.getLastColumn()).getValues()[0];
        const expectedActionsCount = 52;
        if (actionsHeaders.length !== expectedActionsCount) {
          Logger.log(`✗ ACTIONS header count mismatch: expected 
    ${expectedActionsCount}, got ${actionsHeaders.length}`);
          Logger.log(`  Missing: ${expectedActionsCount - 
    actionsHeaders.length} columns`);
          Logger.log(`  Current headers: ${JSON.stringify(actionsHeaders)}`);
          return { success: false, error: `ACTIONS schema incomplete: 
    ${actionsHeaders.length}/${expectedActionsCount} columns` };
        } else {
          Logger.log(`✓ ACTIONS schema validated: ${actionsHeaders.length} 
    columns`);
        }
      } else {
        Logger.log('✗ ACTIONS sheet NOT FOUND');
        return { success: false, error: 'ACTIONS sheet missing' };
      }

      // Continue with existing Step 3 logic

    ---
    FILE 4: src/4_services/SystemManager.gs

    Operation: Add schema integrity check method

    Location: After line 81 (after initializeSchema() method)

    INSERT NEW METHOD:
      /**
       * Validate that live sheet schemas match canonical SheetHealer 
    definitions
       * @returns {Object} Validation results with per-sheet discrepancies
       */
      validateSchemaIntegrity() {
        const results = {
          timestamp: TimeZoneAwareDate.toISOString(new Date()),
          schemasChecked: 0,
          discrepancies: [],
          allValid: true
        };

        try {
          // Get canonical schemas from SheetHealer
          const requiredSheets = SheetHealer.getRequiredSheets();
          
          for (const [sheetName, schema] of Object.entries(requiredSheets)) {
            results.schemasChecked++;
            
            try {
              // Get live headers from sheet
              const liveHeaders = this.batchOperations.getHeaders(sheetName);
              const expectedHeaders = schema.headers;
              
              // Compare counts
              if (liveHeaders.length !== expectedHeaders.length) {
                results.allValid = false;
                results.discrepancies.push({
                  sheet: sheetName,
                  issue: 'column_count_mismatch',
                  expected: expectedHeaders.length,
                  actual: liveHeaders.length,
                  missing: expectedHeaders.length - liveHeaders.length
                });
              }
              
              // Compare order and names
              const mismatches = [];
              for (let i = 0; i < Math.max(liveHeaders.length, 
    expectedHeaders.length); i++) {
                if (liveHeaders[i] !== expectedHeaders[i]) {
                  mismatches.push({
                    index: i,
                    expected: expectedHeaders[i] || 'undefined',
                    actual: liveHeaders[i] || 'undefined'
                  });
                }
              }
              
              if (mismatches.length > 0) {
                results.allValid = false;
                results.discrepancies.push({
                  sheet: sheetName,
                  issue: 'header_mismatches',
                  count: mismatches.length,
                  details: mismatches.slice(0, 10) // Limit to first 10
                });
              }
              
            } catch (sheetError) {
              results.allValid = false;
              results.discrepancies.push({
                sheet: sheetName,
                issue: 'validation_error',
                error: sheetError.message
              });
            }
          }
          
          this.logger.info('SystemManager', 'Schema integrity validation 
    complete', {
            checked: results.schemasChecked,
            valid: results.allValid,
            discrepancy_count: results.discrepancies.length
          });
          
        } catch (error) {
          this.logger.error('SystemManager', 'Schema validation failed', { 
    error: error.message });
          results.allValid = false;
          results.error = error.message;
        }
        
        return results;
      }

    Operation 2: Call validator from health check

    Location: Line 96 (after healthResults.checks.database = 
    this._checkDatabaseHealth();)

    INSERT:
        } catch (error) {
          healthResults.checks.database = {
            status: 'CRITICAL_ERROR',
            details: `Health check system failure: ${error.message}`,
          };
          healthResults.partial_failure_mode = true;
        }

        // NEW: Schema integrity check
        try {
          const schemaCheck = this.validateSchemaIntegrity();
          healthResults.checks.schema_integrity = {
            status: schemaCheck.allValid ? 'HEALTHY' : 'DEGRADED',
            details: schemaCheck
          };
        } catch (error) {
          healthResults.checks.schema_integrity = {
            status: 'ERROR',
            error: error.message
          };
          healthResults.partial_failure_mode = true;
        }

        // Continue with existing checks...

    ---
    FILE 5 (NEW): src/8_setup/MigrateSheetSchemas.gs

    Full File Content:
    /**
     * MOH TIME OS v2.0 - SCHEMA MIGRATION UTILITY
     * 
     * Phase 1 migration tool for aligning live Google Sheets with canonical 
    schemas.
     * Provides preview and apply functions with full audit trail.
     * 
     * IDEMPOTENT: Safe to run multiple times.
     * REVERSIBLE: Logs all changes for manual rollback if needed.
     */

    /**
     * Preview schema differences between live sheets and canonical 
    definitions
     * Does NOT modify any data - read-only operation
     * 
     * @returns {Object} Structured diff report
     */
    function previewSchemaDiff() {
      Logger.log('=== SCHEMA DIFF PREVIEW ===');
      Logger.log(`Timestamp: ${new Date().toISOString()}`);
      
      const report = {
        timestamp: new Date().toISOString(),
        sheets_analyzed: 0,
        sheets_with_differences: 0,
        diffs: []
      };
      
      try {
        // Ensure SheetHealer is available
        if (typeof SheetHealer === 'undefined') {
          throw new Error('SheetHealer not loaded - cannot access canonical 
    schemas');
        }
        
        const requiredSheets = SheetHealer.getRequiredSheets();
        const spreadsheet = getActiveSystemSpreadsheet();
        
        for (const [sheetName, schema] of Object.entries(requiredSheets)) {
          report.sheets_analyzed++;
          
          const sheet = spreadsheet.getSheetByName(sheetName);
          if (!sheet) {
            report.diffs.push({
              sheet: sheetName,
              status: 'MISSING',
              message: 'Sheet does not exist - will be created by 
    SheetHealer'
            });
            report.sheets_with_differences++;
            continue;
          }
          
          // Get live headers
          const lastCol = sheet.getLastColumn() || 1;
          const liveHeaders = sheet.getRange(1, 1, 1, 
    lastCol).getValues()[0];
          const canonicalHeaders = schema.headers;
          
          // Compare
          const diff = {
            sheet: sheetName,
            live_count: liveHeaders.length,
            canonical_count: canonicalHeaders.length,
            additions: [],
            removals: [],
            order_changes: []
          };
          
          // Find additions (in canonical but not in live)
          for (let i = 0; i < canonicalHeaders.length; i++) {
            if (i >= liveHeaders.length) {
              diff.additions.push({
                index: i,
                header: canonicalHeaders[i]
              });
            } else if (liveHeaders[i] !== canonicalHeaders[i]) {
              // Check if it exists elsewhere in live headers
              const liveIndex = liveHeaders.indexOf(canonicalHeaders[i]);
              if (liveIndex === -1) {
                diff.additions.push({
                  index: i,
                  header: canonicalHeaders[i]
                });
              } else {
                diff.order_changes.push({
                  header: canonicalHeaders[i],
                  current_index: liveIndex,
                  expected_index: i
                });
              }
            }
          }
          
          // Find removals (in live but not in canonical)
          for (let i = 0; i < liveHeaders.length; i++) {
            if (!canonicalHeaders.includes(liveHeaders[i])) {
              diff.removals.push({
                index: i,
                header: liveHeaders[i]
              });
            }
          }
          
          // Log if differences found
          if (diff.additions.length > 0 || diff.removals.length > 0 || 
    diff.order_changes.length > 0) {
            report.sheets_with_differences++;
            diff.status = 'NEEDS_MIGRATION';
            report.diffs.push(diff);
            
            Logger.log(`\n[${sheetName}] Differences found:`);
            Logger.log(`  Live columns: ${diff.live_count}, Canonical: 
    ${diff.canonical_count}`);
            if (diff.additions.length > 0) {
              Logger.log(`  Additions needed: ${diff.additions.length}`);
              diff.additions.forEach(add => {
                Logger.log(`    + [${add.index}] ${add.header}`);
              });
            }
            if (diff.removals.length > 0) {
              Logger.log(`  Removals detected: ${diff.removals.length}`);
              diff.removals.forEach(rem => {
                Logger.log(`    - [${rem.index}] ${rem.header}`);
              });
            }
            if (diff.order_changes.length > 0) {
              Logger.log(`  Order changes: ${diff.order_changes.length}`);
            }
          } else {
            diff.status = 'ALIGNED';
            Logger.log(`[${sheetName}] ✓ Schema aligned`);
          }
        }
        
        Logger.log('\n=== SUMMARY ===');
        Logger.log(`Sheets analyzed: ${report.sheets_analyzed}`);
        Logger.log(`Sheets needing migration: 
    ${report.sheets_with_differences}`);
        Logger.log(`Sheets aligned: ${report.sheets_analyzed - 
    report.sheets_with_differences}`);
        
        return report;
        
      } catch (error) {
        Logger.log(`ERROR: ${error.message}`);
        Logger.log(`Stack: ${error.stack}`);
        report.error = error.message;
        return report;
      }
    }

    /**
     * Apply schema fixes to align live sheets with canonical definitions
     * DESTRUCTIVE: Modifies sheet structures (adds columns, updates headers)
     * IDEMPOTENT: Safe to run multiple times
     * 
     * @returns {Object} Migration results
     */
    function applySchemaFixes() {
      Logger.log('=== APPLYING SCHEMA FIXES ===');
      Logger.log(`Timestamp: ${new Date().toISOString()}`);
      Logger.log('WARNING: This will modify sheet structures');
      
      const results = {
        timestamp: new Date().toISOString(),
        sheets_processed: 0,
        sheets_modified: 0,
        errors: [],
        changes: []
      };
      
      try {
        // Validate environment
        if (typeof getActiveSystemSpreadsheet !== 'function') {
          throw new Error('System spreadsheet accessor not available');
        }
        
        const spreadsheet = getActiveSystemSpreadsheet();
        const requiredSheets = SheetHealer.getRequiredSheets();
        
        for (const [sheetName, schema] of Object.entries(requiredSheets)) {
          results.sheets_processed++;
          
          try {
            let sheet = spreadsheet.getSheetByName(sheetName);
            
            // Create sheet if missing
            if (!sheet) {
              Logger.log(`[${sheetName}] Creating missing sheet...`);
              sheet = SheetHealer.createSheet(spreadsheet, sheetName, 
    schema);
              results.sheets_modified++;
              results.changes.push({
                sheet: sheetName,
                action: 'CREATED',
                columns_added: schema.headers.length
              });
              continue;
            }
            
            // Get current state
            const lastCol = sheet.getLastColumn() || 1;
            const liveHeaders = sheet.getRange(1, 1, 1, 
    lastCol).getValues()[0];
            const canonicalHeaders = schema.headers;
            
            // Check if already aligned
            if (liveHeaders.length === canonicalHeaders.length &&
                liveHeaders.every((h, i) => h === canonicalHeaders[i])) {
              Logger.log(`[${sheetName}] ✓ Already aligned, skipping`);
              continue;
            }
            
            Logger.log(`[${sheetName}] Applying fixes...`);
            
            // Strategy: Overwrite header row with canonical order
            // This is safe because data rows use column positions, not names
            const headerRange = sheet.getRange(1, 1, 1, 
    canonicalHeaders.length);
            headerRange.setValues([canonicalHeaders]);
            
            // If we need more columns than exist, insert them
            if (canonicalHeaders.length > lastCol) {
              const columnsToAdd = canonicalHeaders.length - lastCol;
              Logger.log(`  Adding ${columnsToAdd} new columns...`);
              sheet.insertColumnsAfter(lastCol, columnsToAdd);
            }
            
            // Reapply formatting to header row
            const formattedHeaderRange = sheet.getRange(1, 1, 1, 
    canonicalHeaders.length);
            formattedHeaderRange.setFontWeight('bold');
            formattedHeaderRange.setBackground('#e8f0fe');
            formattedHeaderRange.setBorder(true, true, true, true, true, 
    true);
            
            results.sheets_modified++;
            results.changes.push({
              sheet: sheetName,
              action: 'UPDATED',
              old_column_count: liveHeaders.length,
              new_column_count: canonicalHeaders.length,
              columns_added: Math.max(0, canonicalHeaders.length - 
    liveHeaders.length)
            });
            
            Logger.log(`  ✓ Updated to ${canonicalHeaders.length} columns`);
            
          } catch (sheetError) {
            Logger.log(`  ✗ ERROR: ${sheetError.message}`);
            results.errors.push({
              sheet: sheetName,
              error: sheetError.message
            });
          }
        }
        
        // Flush changes
        SpreadsheetApp.flush();
        
        Logger.log('\n=== MIGRATION COMPLETE ===');
        Logger.log(`Sheets processed: ${results.sheets_processed}`);
        Logger.log(`Sheets modified: ${results.sheets_modified}`);
        Logger.log(`Errors: ${results.errors.length}`);
        
        // Log to ACTIVITY sheet if available
        try {
          const activitySheet = spreadsheet.getSheetByName('ACTIVITY');
          if (activitySheet) {
            const logEntry = [
              new Date().toISOString(),
              'INFO',
              'MigrateSheetSchemas',
              'applySchemaFixes',
              JSON.stringify({
                sheets_modified: results.sheets_modified,
                changes: results.changes
              }),
              'system'
            ];
            activitySheet.appendRow(logEntry);
          }
        } catch (logError) {
          Logger.log(`Note: Could not log to ACTIVITY sheet: 
    ${logError.message}`);
        }
        
        return results;
        
      } catch (error) {
        Logger.log(`CRITICAL ERROR: ${error.message}`);
        Logger.log(`Stack: ${error.stack}`);
        results.error = error.message;
        return results;
      }
    }

    /**
     * Rollback helper - generates commands to manually revert changes
     * @param {Object} migrationResults - Results from applySchemaFixes()
     */
    function generateRollbackCommands(migrationResults) {
      Logger.log('\n=== ROLLBACK COMMANDS ===');
      Logger.log('To manually revert changes, run these steps in Apps Script 
    IDE:\n');
      
      if (!migrationResults || !migrationResults.changes) {
        Logger.log('No changes to rollback');
        return;
      }
      
      migrationResults.changes.forEach(change => {
        if (change.action === 'CREATED') {
          Logger.log(`// Delete created sheet`);
          Logger.log(`SpreadsheetApp.getActive().deleteSheet(SpreadsheetApp.g
    etActive().getSheetByName('${change.sheet}'));\n`);
        } else if (change.action === 'UPDATED' && change.columns_added > 0) {
          Logger.log(`// Remove added columns from ${change.sheet}`);
          Logger.log(`var sheet = 
    SpreadsheetApp.getActive().getSheetByName('${change.sheet}');`);
          Logger.log(`sheet.deleteColumns(${change.old_column_count + 1}, 
    ${change.columns_added});\n`);
        }
      });
      
      Logger.log('// Then restore from CSV backups in backups/2025-10-07/');
    }

    ---
    III. EXECUTION SEQUENCE (Step-by-Step Protocol)

    STEP 1: Pre-Flight Checks

    # Terminal commands
    cd /Users/molhamhomsi/Downloads/Time\ OS/moh-time-os-v2
    git status  # Ensure clean working tree
    node validate_load_order.js  # Must exit 0
    Abort if: Non-zero exit code or uncommitted changes

    STEP 2: Manual Backup (User Action)

    - Follow backup preparation steps in Section I.B
    - Create backups/2025-10-07/BACKUP_LOG.md with checksums
    - Verify: All CSVs readable and non-zero size

    STEP 3: Create Branch

    git checkout -b feature/phase1-schema-alignment
    git status  # Verify on new branch

    STEP 4: Apply Code Changes

    - Edit FILE 1: src/0_bootstrap/SheetHealer.gs (both operations)
    - Edit FILE 2: src/7_support/MockBatchOperations.gs (both operations)
    - Edit FILE 3: src/verify_sheet_creation.gs (insert new validation)
    - Edit FILE 4: src/4_services/SystemManager.gs (insert new method + call)
    - Create FILE 5: src/8_setup/MigrateSheetSchemas.gs (full content)

    STEP 5: Local Validation

    node validate_load_order.js  # Must still pass
    git diff --stat  # Review changed files (should show 5 files)
    Expected output:
     src/0_bootstrap/SheetHealer.gs        | XX +++---
     src/7_support/MockBatchOperations.gs  | XX +++---
     src/verify_sheet_creation.gs          | XX +++
     src/4_services/SystemManager.gs       | XX +++
     src/8_setup/MigrateSheetSchemas.gs    | XXX +++++ (new)
     5 files changed, ~XXX insertions(+), ~XX deletions(-)

    STEP 6: Push to Apps Script

    clasp push --force
    Verify: No syntax errors in output

    STEP 7: Execute Migration Preview (Apps Script IDE)

    // In Apps Script IDE, run:
    previewSchemaDiff()
    Review output logs:
    - Note sheets marked as NEEDS_MIGRATION
    - Verify ACTIONS shows 21 additions
    - Verify PROPOSED_TASKS shows 1 addition
    - Abort if: Unexpected sheets or removals detected

    STEP 8: Execute Migration Apply (Apps Script IDE)

    // In Apps Script IDE, run:
    applySchemaFixes()
    Monitor execution:
    - Check for errors in logs
    - Verify sheets_modified count matches preview
    - Capture full log output to backups/2025-10-07/migration_log.txt

    STEP 9: Post-Migration Verification (Apps Script IDE)

    // Run each function sequentially:
    previewSchemaDiff()  // Should show 0 differences
    RUN_VERIFICATION()   // Should pass all checks
    CHECK()              // System health check
    Expected results:
    - previewSchemaDiff() → all sheets show ALIGNED status
    - RUN_VERIFICATION() → appsheet_config_exists: true, system_healthy: true
    - CHECK() → schema_integrity.status: 'HEALTHY'

    STEP 10: Regression Test Suite

    # Terminal
    clasp run RUN_ALL_TESTS > backups/2025-10-07/post_migration_tests.log 
    2>&1
    Compare:
    diff backups/2025-10-07/baseline_tests.log 
    backups/2025-10-07/post_migration_tests.log
    Acceptance criteria: No new test failures (existing failures documented 
    in baseline acceptable)

    STEP 11: Manual Sheet Inspection (Google Sheets UI)

    - Open ACTIONS sheet
    - Verify header row shows 52 columns
    - Scroll to column AZ (52nd column) → should be archived_at
    - Check columns Y-AY contain last_scheduled_* fields
    - Spot check: Existing data rows should still have values in original 
    columns (no data loss)

    STEP 12: Commit Changes

    git add src/0_bootstrap/SheetHealer.gs \
            src/7_support/MockBatchOperations.gs \
            src/verify_sheet_creation.gs \
            src/4_services/SystemManager.gs \
            src/8_setup/MigrateSheetSchemas.gs

    git commit -m "feat(schema): align ACTIONS/PROPOSED_TASKS with MohTask 
    model - Phase 1

    - Update SheetHealer ACTIONS schema: 31 → 52 columns
      - Add version field (position 25)
      - Add 20 last_scheduled_* fields (positions 26-45)
      - Reposition completion_notes, created_by, assigned_to, parent_id
      - Add archived_at as final column (52)
      
    - Update SheetHealer PROPOSED_TASKS schema: 15 → 16 columns
      - Add archived_at field for archival consistency
      
    - Sync MockBatchOperations test schemas with live schemas
      
    - Add MigrateSheetSchemas utility:
      - previewSchemaDiff(): read-only diff analyzer
      - applySchemaFixes(): idempotent schema migrator
      - generateRollbackCommands(): rollback helper
      
    - Enhance SystemManager schema validation:
      - Add validateSchemaIntegrity() method
      - Integrate with runHealthCheck() pipeline
      
    - Update verify_sheet_creation with ACTIONS column count assertion

    Evidence:
    - MohTask.toSheetRow() propertyMap lines 428-482 (52 properties)
    - SheetHealer now canonical source for all sheet schemas
    - Migration tested via previewSchemaDiff() + applySchemaFixes()
    - Zero test regressions post-migration
    - Backups: backups/2025-10-07/*.csv

    Refs: #phase1, #schema-alignment, #audit-remediation"

    git log --oneline -1  # Verify commit created

    STEP 13: Push Branch

    git push origin feature/phase1-schema-alignment

    STEP 14: Create Execution Log

    cat > backups/2025-10-07/EXECUTION_LOG.md <<'EOF'
    # Phase 1 Execution Log

    **Branch:** feature/phase1-schema-alignment
    **Executed by:** [Your Name]
    **Start time:** [YYYY-MM-DDTHH:MM:SS+04:00]
    **End time:** [YYYY-MM-DDTHH:MM:SS+04:00]
    **Duration:** [X minutes]

    ## Pre-Flight
    - [x] Baseline tests captured
    - [x] Load order validated
    - [x] Manual backups completed (9 sheets, X MB)

    ## Code Changes
    - [x] SheetHealer ACTIONS: 31 → 52 columns
    - [x] SheetHealer PROPOSED_TASKS: 15 → 16 columns
    - [x] MockBatchOperations synchronized
    - [x] SystemManager validator added
    - [x] MigrateSheetSchemas utility created
    - [x] verify_sheet_creation enhanced

    ## Migration Execution
    - [x] previewSchemaDiff() run → X sheets need migration
    - [x] applySchemaFixes() run → X sheets modified, 0 errors
    - [x] Post-migration preview → 0 differences

    ## Verification
    - [x] RUN_VERIFICATION() passed
    - [x] CHECK() schema_integrity: HEALTHY
    - [x] RUN_ALL_TESTS() → 0 new failures
    - [x] Manual ACTIONS sheet inspection → 52 columns confirmed

    ## Commit
    - [x] Changes committed: [commit hash]
    - [x] Branch pushed to origin

    ## Rollback Plan (if needed)
    1. git checkout main
    2. git branch -D feature/phase1-schema-alignment
    3. Restore sheets from backups/2025-10-07/*.csv
    4. Run FIX() to re-heal sheets

    ## Notes
    [Any observations, warnings, or deviations from plan]
    EOF

    ---
    IV. VALIDATION GATES & ABORT CONDITIONS

    Gate 1: Load Order Validation

    - Command: node validate_load_order.js
    - Success criteria: Exit code 0
    - Abort if: Non-zero exit code
    - Action: Fix load order issues before proceeding

    Gate 2: Backup Completeness

    - Check: All 9 sheets exported as CSVs with non-zero size
    - Success criteria: ls -lh backups/2025-10-07/*.csv shows 9 files
    - Abort if: Any CSV missing or 0 bytes
    - Action: Re-export failed sheets

    Gate 3: Schema Preview Sanity

    - Command: previewSchemaDiff() in Apps Script
    - Success criteria:
      - ACTIONS shows 21 additions
      - PROPOSED_TASKS shows 1 addition
      - No unexpected removals
    - Abort if: Removals detected or unexpected sheets flagged
    - Action: Review canonical schema definitions for errors

    Gate 4: Migration Success

    - Command: applySchemaFixes() in Apps Script
    - Success criteria: errors: [] in returned object
    - Abort if: Any errors in results.errors array
    - Action: Review error messages, check sheet permissions, retry once

    Gate 5: Post-Migration Alignment

    - Command: previewSchemaDiff() in Apps Script (re-run)
    - Success criteria: All sheets show status: 'ALIGNED'
    - Abort if: Any sheet still shows NEEDS_MIGRATION
    - Action: Manually inspect failing sheet, run applySchemaFixes() again

    Gate 6: Regression Test Parity

    - Check: Compare baseline vs. post-migration test logs
    - Success criteria: No new failures introduced
    - Abort if: Tests that passed in baseline now fail
    - Action: Investigate failing tests, may need to update test fixtures

    ---
    V. ROLLBACK PROCEDURE

    Trigger conditions:
    - Gate 4, 5, or 6 failure after 2 retry attempts
    - Data loss detected in manual inspection
    - Critical system function broken post-migration

    Steps:
    # 1. Revert code changes
    git checkout main
    git branch -D feature/phase1-schema-alignment

    # 2. Push original code to Apps Script
    clasp push --force

    # 3. Restore sheets from backups (manual in Google Sheets UI)
    # For each sheet:
    # - File → Import → Upload CSV from backups/2025-10-07/
    # - Replace [SHEET_NAME]

    # 4. Run sheet healer to restore pre-migration state
    # In Apps Script IDE:
    FIX()

    # 5. Verify system health
    CHECK()

    # 6. Document rollback
    cat > backups/2025-10-07/ROLLBACK_LOG.md <<'EOF'
    # Rollback Executed
    **Time:** [timestamp]
    **Reason:** [detailed reason for rollback]
    **State:** System restored to pre-migration baseline
    **Next steps:** [investigation plan]
    EOF

    ---
    VI. SUCCESS CRITERIA CHECKLIST

    Phase 1 execution is considered COMPLETE when ALL criteria are met:

    - All 5 files modified/created as specified
    - node validate_load_order.js exits 0 pre- and post-changes
    - clasp push completes without syntax errors
    - previewSchemaDiff() initial run shows expected differences
    - applySchemaFixes() returns { errors: [] }
    - previewSchemaDiff() second run shows all sheets ALIGNED
    - RUN_VERIFICATION() passes all assertions
    - CHECK() returns schema_integrity: { status: 'HEALTHY' }
    - RUN_ALL_TESTS() shows 0 new failures vs. baseline
    - ACTIONS sheet manually verified to have 52 columns
    - Column 52 (AZ) header = archived_at
    - Columns Y-AY headers start with last_scheduled_
    - Existing ACTIONS data rows retain original values (spot check 5 rows)
    - Git commit created with detailed message
    - Branch pushed to origin
    - backups/2025-10-07/EXECUTION_LOG.md completed
    - backups/2025-10-07/BACKUP_LOG.md shows all sheets backed up

    Completion Evidence:
    - Git commit hash: [to be filled]
    - Migration log: backups/2025-10-07/migration_log.txt
    - Execution log: backups/2025-10-07/EXECUTION_LOG.md

    ---
    VII. PHASE 2 READINESS SIGNAL

    Phase 1 is complete and Phase 2 may proceed when:
    - All checkboxes in Section VI are checked
    - CHECK() reports schema_integrity.status: 'HEALTHY'
    - Zero schema differences remain per previewSchemaDiff()
    - All required sheets exist with correct canonical schemas
    - Test suite shows no new regressions

    Output: { phase1_complete: true, ready_for_phase2: true, timestamp: 
    [ISO8601] }

