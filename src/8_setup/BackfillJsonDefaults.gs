/**
 * MOH TIME OS v2.0 - JSON COLUMNS BACKFILL UTILITY
 *
 * Phase 2: Data Backfill & Integrity Guard Rails
 * Sanitizes JSON columns by replacing empty/invalid values with proper defaults
 *
 * IDEMPOTENT: Safe to run multiple times
 * BATCHED: Processes rows in chunks to avoid timeout
 */

/**
 * JSON column default values mapping
 * Defines which columns store JSON and their default values
 */
const JSON_DEFAULTS = {
  'scheduling_metadata': '{}',
  'dependencies': '[]',
  'tags': '[]',
  'last_scheduled_attachments': '[]',
  'last_scheduled_metadata': '{}'
};

/**
 * Preview how many rows have invalid JSON in specified columns
 * READ-ONLY operation - no data modifications
 *
 * @param {string} sheetName - Name of sheet to check (default 'ACTIONS')
 * @param {Array<string>} columnNames - Optional array of column names to check (defaults to JSON_DEFAULTS keys)
 * @returns {Object} Preview report with issue counts per column
 */
function previewJsonIssues(sheetName, columnNames) {
  sheetName = sheetName || 'ACTIONS';
  columnNames = columnNames || Object.keys(JSON_DEFAULTS);

  Logger.log('=== JSON ISSUES PREVIEW ===');
  Logger.log('Timestamp: ' + new Date().toISOString());
  Logger.log('Sheet: ' + sheetName);
  Logger.log('Columns: ' + columnNames.join(', '));

  const report = {
    timestamp: new Date().toISOString(),
    sheet: sheetName,
    columns_checked: columnNames,
    total_rows: 0,
    issues_by_column: {},
    sample_issues: []
  };

  try {
    const spreadsheet = getActiveSystemSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Sheet ' + sheetName + ' not found');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No data rows in ' + sheetName + ' sheet');
      return report;
    }

    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const actionIdIdx = headers.indexOf('action_id');

    // Build column index map
    const columnIndices = {};
    for (let i = 0; i < columnNames.length; i++) {
      const colName = columnNames[i];
      const idx = headers.indexOf(colName);
      if (idx === -1) {
        Logger.log('WARNING: Column ' + colName + ' not found in sheet headers');
      } else {
        columnIndices[colName] = idx;
        report.issues_by_column[colName] = {
          empty_count: 0,
          invalid_json_count: 0,
          total_issues: 0
        };
      }
    }

    // Read all data
    const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const data = dataRange.getValues();
    report.total_rows = data.length;

    // Check each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const actionId = actionIdIdx !== -1 ? row[actionIdIdx] : 'row_' + (i + 2);

      for (const colName in columnIndices) {
        const idx = columnIndices[colName];
        const value = row[idx];
        const expectedDefault = JSON_DEFAULTS[colName] || '{}';

        let hasIssue = false;
        let issueType = '';

        // Check if empty
        if (value === '' || value === null || value === undefined) {
          report.issues_by_column[colName].empty_count++;
          hasIssue = true;
          issueType = 'empty';
        }
        // Check if invalid JSON
        else if (typeof value === 'string') {
          try {
            JSON.parse(value);
          } catch (e) {
            report.issues_by_column[colName].invalid_json_count++;
            hasIssue = true;
            issueType = 'invalid_json';
          }
        }

        if (hasIssue) {
          report.issues_by_column[colName].total_issues++;

          // Collect sample (max 5 per column)
          const columnSamples = report.sample_issues.filter(function(s) { return s.column === colName; });
          if (columnSamples.length < 5) {
            report.sample_issues.push({
              column: colName,
              action_id: actionId,
              row_number: i + 2,
              issue_type: issueType,
              current_value: value,
              will_be_set_to: expectedDefault
            });
          }
        }
      }
    }

    Logger.log('\\n=== PREVIEW SUMMARY ===');
    Logger.log('Total rows: ' + report.total_rows);
    for (const colName in report.issues_by_column) {
      const colReport = report.issues_by_column[colName];
      Logger.log('[' + colName + '] Total issues: ' + colReport.total_issues +
                 ' (empty: ' + colReport.empty_count + ', invalid: ' + colReport.invalid_json_count + ')');
    }

    const totalIssues = Object.keys(report.issues_by_column).reduce(function(sum, col) {
      return sum + report.issues_by_column[col].total_issues;
    }, 0);

    if (totalIssues === 0) {
      Logger.log('✓ All JSON columns are valid - no backfill needed');
    } else {
      Logger.log('⚠ ' + totalIssues + ' total JSON issues found');
      Logger.log('Sample issues: ' + JSON.stringify(report.sample_issues, null, 2));
    }

    return report;

  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    report.error = error.message;
    return report;
  }
}

/**
 * Backfill JSON columns with proper defaults
 * Replaces empty/invalid JSON with appropriate defaults
 *
 * @param {string} sheetName - Name of sheet to fix (default 'ACTIONS')
 * @param {Array<string>} columnNames - Optional array of column names to fix (defaults to JSON_DEFAULTS keys)
 * @param {number} chunkSize - Number of rows to process per batch (default 200)
 * @returns {Object} Backfill result with patches_applied count
 */
function backfillJsonDefaults(sheetName, columnNames, chunkSize) {
  sheetName = sheetName || 'ACTIONS';
  columnNames = columnNames || Object.keys(JSON_DEFAULTS);
  chunkSize = chunkSize || 200;

  Logger.log('=== BACKFILLING JSON DEFAULTS ===');
  Logger.log('Timestamp: ' + new Date().toISOString());
  Logger.log('Sheet: ' + sheetName);
  Logger.log('Columns: ' + columnNames.join(', '));
  Logger.log('Chunk size: ' + chunkSize);

  const results = {
    timestamp: new Date().toISOString(),
    sheet: sheetName,
    columns_processed: columnNames,
    total_rows: 0,
    patches_by_column: {},
    chunks_processed: 0,
    errors: []
  };

  try {
    const spreadsheet = getActiveSystemSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error('Sheet ' + sheetName + ' not found');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No data rows in ' + sheetName + ' sheet');
      return results;
    }

    // Get headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build column index map
    const columnIndices = {};
    for (let i = 0; i < columnNames.length; i++) {
      const colName = columnNames[i];
      const idx = headers.indexOf(colName);
      if (idx === -1) {
        Logger.log('WARNING: Column ' + colName + ' not found - skipping');
      } else {
        columnIndices[colName] = idx;
        results.patches_by_column[colName] = 0;
      }
    }

    // Process in chunks
    const dataStartRow = 2;
    const totalDataRows = lastRow - 1;
    results.total_rows = totalDataRows;

    for (let startRow = dataStartRow; startRow <= lastRow; startRow += chunkSize) {
      const rowsInChunk = Math.min(chunkSize, lastRow - startRow + 1);
      results.chunks_processed++;

      Logger.log('Processing chunk ' + results.chunks_processed + ': rows ' + startRow + '-' + (startRow + rowsInChunk - 1));

      try {
        // Read chunk
        const chunkRange = sheet.getRange(startRow, 1, rowsInChunk, sheet.getLastColumn());
        const chunkData = chunkRange.getValues();

        // Fix issues in chunk
        let chunkModified = false;

        for (let i = 0; i < chunkData.length; i++) {
          const row = chunkData[i];

          for (const colName in columnIndices) {
            const idx = columnIndices[colName];
            const value = row[idx];
            const defaultValue = JSON_DEFAULTS[colName] || '{}';

            let needsFix = false;

            // Check if empty
            if (value === '' || value === null || value === undefined) {
              needsFix = true;
            }
            // Check if invalid JSON
            else if (typeof value === 'string') {
              try {
                JSON.parse(value);
              } catch (e) {
                needsFix = true;
              }
            }

            if (needsFix) {
              chunkData[i][idx] = defaultValue;
              results.patches_by_column[colName]++;
              chunkModified = true;
            }
          }
        }

        // Write back if modified
        if (chunkModified) {
          chunkRange.setValues(chunkData);
          const totalPatches = Object.keys(results.patches_by_column).reduce(function(sum, col) {
            return sum + results.patches_by_column[col];
          }, 0);
          Logger.log('  Applied ' + totalPatches + ' patches so far');
        } else {
          Logger.log('  No changes needed in this chunk');
        }

      } catch (chunkError) {
        Logger.log('  ERROR in chunk: ' + chunkError.message);
        results.errors.push({
          chunk: results.chunks_processed,
          start_row: startRow,
          error: chunkError.message
        });
      }
    }

    // Flush all changes
    SpreadsheetApp.flush();

    const totalPatches = Object.keys(results.patches_by_column).reduce(function(sum, col) {
      return sum + results.patches_by_column[col];
    }, 0);

    Logger.log('\\n=== BACKFILL COMPLETE ===');
    Logger.log('Total rows: ' + results.total_rows);
    Logger.log('Total patches: ' + totalPatches);
    for (const colName in results.patches_by_column) {
      Logger.log('  [' + colName + '] ' + results.patches_by_column[colName] + ' patches');
    }
    Logger.log('Chunks processed: ' + results.chunks_processed);
    Logger.log('Errors: ' + results.errors.length);

    // Log to ACTIVITY sheet if available
    try {
      const activitySheet = spreadsheet.getSheetByName('ACTIVITY');
      if (activitySheet) {
        const logEntry = [
          new Date().toISOString(),
          'INFO',
          'BackfillJsonDefaults',
          'backfillJsonDefaults',
          JSON.stringify({
            sheet: sheetName,
            total_patches: totalPatches,
            patches_by_column: results.patches_by_column
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
