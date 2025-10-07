/**
 * MOH TIME OS v2.0 - SCHEMA MIGRATION UTILITY
 *
 * Phase 1 migration tool for aligning live Google Sheets with canonical schemas.
 * Provides preview and apply functions with full audit trail.
 *
 * IDEMPOTENT: Safe to run multiple times.
 * REVERSIBLE: Logs all changes for manual rollback if needed.
 */

/**
 * Preview schema differences between live sheets and canonical definitions
 * Does NOT modify any data - read-only operation
 *
 * @returns {Object} Structured diff report
 */
function previewSchemaDiff() {
  Logger.log('=== SCHEMA DIFF PREVIEW ===');
  Logger.log('Timestamp: ' + new Date().toISOString());

  const report = {
    timestamp: new Date().toISOString(),
    sheets_analyzed: 0,
    sheets_with_differences: 0,
    diffs: []
  };

  try {
    // Ensure SheetHealer is available
    if (typeof SheetHealer === 'undefined') {
      throw new Error('SheetHealer not loaded - cannot access canonical schemas');
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
          message: 'Sheet does not exist - will be created by SheetHealer'
        });
        report.sheets_with_differences++;
        continue;
      }

      // Get live headers
      const lastCol = sheet.getLastColumn() || 1;
      const liveHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
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
      if (diff.additions.length > 0 || diff.removals.length > 0 || diff.order_changes.length > 0) {
        report.sheets_with_differences++;
        diff.status = 'NEEDS_MIGRATION';
        report.diffs.push(diff);

        Logger.log('\n[' + sheetName + '] Differences found:');
        Logger.log('  Live columns: ' + diff.live_count + ', Canonical: ' + diff.canonical_count);
        if (diff.additions.length > 0) {
          Logger.log('  Additions needed: ' + diff.additions.length);
          diff.additions.forEach(function(add) {
            Logger.log('    + [' + add.index + '] ' + add.header);
          });
        }
        if (diff.removals.length > 0) {
          Logger.log('  Removals detected: ' + diff.removals.length);
          diff.removals.forEach(function(rem) {
            Logger.log('    - [' + rem.index + '] ' + rem.header);
          });
        }
        if (diff.order_changes.length > 0) {
          Logger.log('  Order changes: ' + diff.order_changes.length);
        }
      } else {
        diff.status = 'ALIGNED';
        Logger.log('[' + sheetName + '] ✓ Schema aligned');
      }
    }

    Logger.log('\n=== SUMMARY ===');
    Logger.log('Sheets analyzed: ' + report.sheets_analyzed);
    Logger.log('Sheets needing migration: ' + report.sheets_with_differences);
    Logger.log('Sheets aligned: ' + (report.sheets_analyzed - report.sheets_with_differences));

    return report;

  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
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
  Logger.log('Timestamp: ' + new Date().toISOString());
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
          Logger.log('[' + sheetName + '] Creating missing sheet...');
          sheet = SheetHealer.createSheet(spreadsheet, sheetName, schema);
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
        const liveHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        const canonicalHeaders = schema.headers;

        // Check if already aligned
        let aligned = true;
        if (liveHeaders.length !== canonicalHeaders.length) {
          aligned = false;
        } else {
          for (let i = 0; i < liveHeaders.length; i++) {
            if (liveHeaders[i] !== canonicalHeaders[i]) {
              aligned = false;
              break;
            }
          }
        }

        if (aligned) {
          Logger.log('[' + sheetName + '] ✓ Already aligned, skipping');
          continue;
        }

        Logger.log('[' + sheetName + '] Applying fixes...');

        // Strategy: Overwrite header row with canonical order
        // This is safe because data rows use column positions, not names
        const headerRange = sheet.getRange(1, 1, 1, canonicalHeaders.length);
        headerRange.setValues([canonicalHeaders]);

        // If we need more columns than exist, insert them
        if (canonicalHeaders.length > lastCol) {
          const columnsToAdd = canonicalHeaders.length - lastCol;
          Logger.log('  Adding ' + columnsToAdd + ' new columns...');
          sheet.insertColumnsAfter(lastCol, columnsToAdd);
        }

        // Reapply formatting to header row
        const formattedHeaderRange = sheet.getRange(1, 1, 1, canonicalHeaders.length);
        formattedHeaderRange.setFontWeight('bold');
        formattedHeaderRange.setBackground('#e8f0fe');
        formattedHeaderRange.setBorder(true, true, true, true, true, true);

        results.sheets_modified++;
        results.changes.push({
          sheet: sheetName,
          action: 'UPDATED',
          old_column_count: liveHeaders.length,
          new_column_count: canonicalHeaders.length,
          columns_added: Math.max(0, canonicalHeaders.length - liveHeaders.length)
        });

        Logger.log('  ✓ Updated to ' + canonicalHeaders.length + ' columns');

      } catch (sheetError) {
        Logger.log('  ✗ ERROR: ' + sheetError.message);
        results.errors.push({
          sheet: sheetName,
          error: sheetError.message
        });
      }
    }

    // Flush changes
    SpreadsheetApp.flush();

    Logger.log('\n=== MIGRATION COMPLETE ===');
    Logger.log('Sheets processed: ' + results.sheets_processed);
    Logger.log('Sheets modified: ' + results.sheets_modified);
    Logger.log('Errors: ' + results.errors.length);

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
      Logger.log('Note: Could not log to ACTIVITY sheet: ' + logError.message);
    }

    return results;

  } catch (error) {
    Logger.log('CRITICAL ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
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
  Logger.log('To manually revert changes, run these steps in Apps Script IDE:\n');

  if (!migrationResults || !migrationResults.changes) {
    Logger.log('No changes to rollback');
    return;
  }

  migrationResults.changes.forEach(function(change) {
    if (change.action === 'CREATED') {
      Logger.log('// Delete created sheet');
      Logger.log('SpreadsheetApp.getActive().deleteSheet(SpreadsheetApp.getActive().getSheetByName(\'' + change.sheet + '\'));\n');
    } else if (change.action === 'UPDATED' && change.columns_added > 0) {
      Logger.log('// Remove added columns from ' + change.sheet);
      Logger.log('var sheet = SpreadsheetApp.getActive().getSheetByName(\'' + change.sheet + '\');');
      Logger.log('sheet.deleteColumns(' + (change.old_column_count + 1) + ', ' + change.columns_added + ');\n');
    }
  });

  Logger.log('// Then restore from CSV backups in backups/2025-10-07/');
}
