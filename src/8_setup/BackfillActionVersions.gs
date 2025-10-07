/**
 * MOH TIME OS v2.0 - VERSION COLUMN BACKFILL UTILITY
 *
 * Phase 2: Data Backfill & Integrity Guard Rails
 * Backfills missing version column values in ACTIONS sheet for optimistic locking
 *
 * IDEMPOTENT: Safe to run multiple times
 * BATCHED: Processes rows in chunks to avoid timeout
 */

/**
 * Preview how many ACTIONS rows have missing/invalid version values
 * READ-ONLY operation - no data modifications
 *
 * @returns {Object} Preview report with counts and sample action_ids
 */
function previewMissingVersions() {
  Logger.log('=== VERSION BACKFILL PREVIEW ===');
  Logger.log('Timestamp: ' + new Date().toISOString());

  const report = {
    timestamp: new Date().toISOString(),
    total_rows: 0,
    missing_version_count: 0,
    invalid_version_count: 0,
    sample_action_ids: []
  };

  try {
    const spreadsheet = getActiveSystemSpreadsheet();
    const actionsSheet = spreadsheet.getSheetByName('ACTIONS');

    if (!actionsSheet) {
      throw new Error('ACTIONS sheet not found');
    }

    const lastRow = actionsSheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No data rows in ACTIONS sheet');
      return report;
    }

    // Get headers to find version column index
    const headers = actionsSheet.getRange(1, 1, 1, actionsSheet.getLastColumn()).getValues()[0];
    const versionIdx = headers.indexOf('version');
    const actionIdIdx = headers.indexOf('action_id');

    if (versionIdx === -1) {
      throw new Error('version column not found in ACTIONS sheet headers');
    }

    if (actionIdIdx === -1) {
      throw new Error('action_id column not found in ACTIONS sheet headers');
    }

    // Read all data (headers + data rows)
    const dataRange = actionsSheet.getRange(2, 1, lastRow - 1, actionsSheet.getLastColumn());
    const data = dataRange.getValues();

    report.total_rows = data.length;

    // Check each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const versionValue = row[versionIdx];
      const actionId = row[actionIdIdx];

      // Check if missing (empty, null, undefined)
      if (versionValue === '' || versionValue === null || versionValue === undefined) {
        report.missing_version_count++;
        if (report.sample_action_ids.length < 10) {
          report.sample_action_ids.push({
            action_id: actionId,
            row_number: i + 2,
            issue: 'empty'
          });
        }
      }
      // Check if invalid (not a positive integer)
      else if (typeof versionValue !== 'number' || versionValue < 1 || !Number.isInteger(versionValue)) {
        report.invalid_version_count++;
        if (report.sample_action_ids.length < 10) {
          report.sample_action_ids.push({
            action_id: actionId,
            row_number: i + 2,
            issue: 'invalid',
            current_value: versionValue
          });
        }
      }
    }

    const totalIssues = report.missing_version_count + report.invalid_version_count;

    Logger.log('\\n=== PREVIEW SUMMARY ===');
    Logger.log('Total rows: ' + report.total_rows);
    Logger.log('Missing version: ' + report.missing_version_count);
    Logger.log('Invalid version: ' + report.invalid_version_count);
    Logger.log('Total issues: ' + totalIssues);
    Logger.log('Sample issues: ' + JSON.stringify(report.sample_action_ids, null, 2));

    if (totalIssues === 0) {
      Logger.log('✓ All version values are valid - no backfill needed');
    } else {
      Logger.log('⚠ ' + totalIssues + ' rows need version backfill');
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
 * Backfill version column in ACTIONS sheet
 * Sets all empty/null/invalid version values to 1
 * Uses chunked batch updates for performance
 *
 * @param {number} chunkSize - Number of rows to process per batch (default 200)
 * @returns {Object} Backfill result with rows_patched count
 */
function backfillActionVersions(chunkSize) {
  chunkSize = chunkSize || 200;

  Logger.log('=== BACKFILLING ACTION VERSIONS ===');
  Logger.log('Timestamp: ' + new Date().toISOString());
  Logger.log('Chunk size: ' + chunkSize);

  const results = {
    timestamp: new Date().toISOString(),
    total_rows: 0,
    rows_patched: 0,
    chunks_processed: 0,
    errors: []
  };

  try {
    const spreadsheet = getActiveSystemSpreadsheet();
    const actionsSheet = spreadsheet.getSheetByName('ACTIONS');

    if (!actionsSheet) {
      throw new Error('ACTIONS sheet not found');
    }

    const lastRow = actionsSheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No data rows in ACTIONS sheet');
      return results;
    }

    // Get headers to find version column index
    const headers = actionsSheet.getRange(1, 1, 1, actionsSheet.getLastColumn()).getValues()[0];
    const versionIdx = headers.indexOf('version');

    if (versionIdx === -1) {
      throw new Error('version column not found in ACTIONS sheet headers');
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
        const chunkRange = actionsSheet.getRange(startRow, 1, rowsInChunk, actionsSheet.getLastColumn());
        const chunkData = chunkRange.getValues();

        // Build update payload
        let chunkModified = false;
        for (let i = 0; i < chunkData.length; i++) {
          const row = chunkData[i];
          const versionValue = row[versionIdx];

          // Check if needs fixing
          if (versionValue === '' || versionValue === null || versionValue === undefined ||
              typeof versionValue !== 'number' || versionValue < 1 || !Number.isInteger(versionValue)) {
            chunkData[i][versionIdx] = 1;
            results.rows_patched++;
            chunkModified = true;
          }
        }

        // Write back if modified
        if (chunkModified) {
          chunkRange.setValues(chunkData);
          Logger.log('  Patched ' + results.rows_patched + ' rows so far');
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

    Logger.log('\\n=== BACKFILL COMPLETE ===');
    Logger.log('Total rows: ' + results.total_rows);
    Logger.log('Rows patched: ' + results.rows_patched);
    Logger.log('Chunks processed: ' + results.chunks_processed);
    Logger.log('Errors: ' + results.errors.length);

    // Log to ACTIVITY sheet if available
    try {
      const activitySheet = spreadsheet.getSheetByName('ACTIVITY');
      if (activitySheet) {
        const logEntry = [
          new Date().toISOString(),
          'INFO',
          'BackfillActionVersions',
          'backfillActionVersions',
          JSON.stringify({
            rows_patched: results.rows_patched,
            chunks_processed: results.chunks_processed
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
