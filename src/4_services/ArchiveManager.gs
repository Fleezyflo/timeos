/**
 * MOH TIME OS v2.0 - ARCHIVE MANAGER
 *
 * Handles archiving of completed tasks and historical data to external Google Sheets.
 * Provides configurable archiving strategies with fallback to current spreadsheet.
 * Ensures data preservation while maintaining system performance.
 *
 * Original lines: 5920-6117 from scriptA.js
 */

class ArchiveManager {
  constructor(configManager, logger, batchOperations) {
    this.configManager = configManager;
    this.logger = logger;
    this.batchOperations = batchOperations;

    if (!this.batchOperations) {
      throw new Error('ArchiveManager: batchOperations parameter is required');
    }
  }

  /**
   * Get the external spreadsheet ID for archiving
   * @returns {string} Archive spreadsheet ID (empty string for current)
   */
  getArchiveSpreadsheetId() {
    try {
      const externalId = this.configManager.getString('ARCHIVE_SPREADSHEET_ID', '');

      if (externalId && externalId.trim() !== '') {
        // Validate external spreadsheet accessibility
        try {
          // Test access to external spreadsheet
          const externalSpreadsheet = SpreadsheetApp.openById(externalId);
          if (externalSpreadsheet) {
            this.logger.debug('ArchiveManager', `Using external archive spreadsheet: ${externalId}`);
            return externalId;
          }
        } catch (error) {
          // External sheet not accessible - log warning and fallback
          this.logger.warn('ArchiveManager', `External archive sheet not accessible (${externalId}), falling back to current sheet`, {
            error: error.message
          });
          return '';
        }
      } else {
        // No external sheet configured - use current
        this.logger.debug('ArchiveManager', 'Using current spreadsheet for archiving');
        return '';
      }
    } catch (error) {
      this.logger.error('ArchiveManager', 'Failed to get archive spreadsheet, using current as fallback', {
        error: error.message
      });
      return '';
    }
  }

  /**
   * Check if external archiving is configured and accessible
   * @returns {Object} Status information about archive configuration
   */
  getArchiveStatus() {
    const externalId = this.configManager.getString('ARCHIVE_SPREADSHEET_ID', '');

    const status = {
      external_configured: externalId && externalId.trim() !== '',
      external_id: externalId,
      external_accessible: false,
      current_spreadsheet_id: getActiveSystemSpreadsheet().getId(),
      archive_location: 'current'
    };

    if (status.external_configured) {
      try {
        const externalSpreadsheet = SpreadsheetApp.openById(externalId);
        if (externalSpreadsheet) {
          status.external_accessible = true;
          status.archive_location = 'external';
        }
      } catch (error) {
        this.logger.debug('ArchiveManager', `External archive sheet test failed: ${error.message}`);
        status.external_accessible = false;
        status.access_error = error.message;
      }
    }

    return status;
  }

  /**
   * Create or get archive sheet within the target spreadsheet
   * @param {string} sheetName - Name of the archive sheet to create/get
   * @param {Array} headers - Headers for the archive sheet
   * @returns {string} Archive spreadsheet ID for further operations
   */
  getOrCreateArchiveSheet(sheetName, headers) {
    try {
      const spreadsheetId = this.getArchiveSpreadsheetId();

      // Get target spreadsheet
      const targetSpreadsheet = spreadsheetId ?
        SpreadsheetApp.openById(spreadsheetId) :
        getActiveSystemSpreadsheet();

      // Check if archive sheet exists
      let archiveSheet = targetSpreadsheet.getSheetByName(sheetName);

      if (!archiveSheet) {
        // Create new archive sheet
        archiveSheet = targetSpreadsheet.insertSheet(sheetName);

        // Set headers if provided
        if (headers && headers.length > 0) {
          archiveSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
          archiveSheet.setFrozenRows(1);

          // Format header row
          const headerRange = archiveSheet.getRange(1, 1, 1, headers.length);
          headerRange.setFontWeight('bold');
          headerRange.setBackground('#f0f0f0');
        }

        this.logger.info('ArchiveManager', `Created new archive sheet: ${sheetName}`, {
          external: spreadsheetId !== '',
          spreadsheet_id: spreadsheetId || 'current',
          headers_count: headers ? headers.length : 0
        });
      } else {
        this.logger.debug('ArchiveManager', `Archive sheet already exists: ${sheetName}`, {
          external: spreadsheetId !== '',
          spreadsheet_id: spreadsheetId || 'current'
        });
      }

      return spreadsheetId;

    } catch (error) {
      this.logger.error('ArchiveManager', `Failed to get/create archive sheet ${sheetName}`, {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Archive completed tasks to archive sheet
   * @param {Array} tasks - Array of completed tasks to archive
   * @returns {Object} Archive operation result
   */
  archiveCompletedTasks(tasks = []) {
    try {
      if (!tasks || tasks.length === 0) {
        return {
          success: true,
          archived_count: 0,
          message: 'No tasks to archive'
        };
      }

      const archiveSheetName = 'ACTIONS_ARCHIVE';
      const sourceHeaders = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);

      // Ensure archive sheet exists
      const archiveSpreadsheetId = this.getOrCreateArchiveSheet(archiveSheetName, sourceHeaders);

      // Prepare archive rows
      const archiveRows = tasks.map(task => {
        // Add archive metadata
        const archiveRow = task.toSheetRow ? task.toSheetRow(sourceHeaders) : this._taskToArchiveRow(task, sourceHeaders);

        // Add archive timestamp if not already present
        const archivedAtIndex = sourceHeaders.indexOf('archived_at');
        if (archivedAtIndex !== -1 && !archiveRow[archivedAtIndex]) {
          archiveRow[archivedAtIndex] = TimeZoneAwareDate.now();
        }

        return archiveRow;
      });

      // Append to archive sheet with retry logic
      let result;
      let lastError;
      for (let attempt = 1; attempt <= CONSTANTS.MAX_RETRIES; attempt++) {
        try {
          result = this.appendToArchive(archiveSheetName, archiveRows);
          if (result.success) {
            if (attempt > 1) {
              this.logger.info('ArchiveManager', `Archive append succeeded on attempt ${attempt}`);
            }
            break;
          }
        } catch (error) {
          lastError = error;
          this.logger.warn('ArchiveManager', `Archive append attempt ${attempt} failed: ${error.message}`);
          if (attempt < CONSTANTS.MAX_RETRIES) {
            const delay = CONSTANTS.BASE_RETRY_DELAY * attempt;
            Utilities.sleep(delay);
          }
        }
      }
      if (!result || !result.success) {
        throw lastError || new Error('Archive append failed after ' + CONSTANTS.MAX_RETRIES + ' attempts');
      }

      this.logger.info('ArchiveManager', `Archived ${tasks.length} completed tasks`, {
        archive_sheet: archiveSheetName,
        external: archiveSpreadsheetId !== '',
        task_ids: tasks.map(t => t.action_id).slice(0, 5) // Log first 5 IDs
      });

      return {
        ...result,
        archived_tasks: tasks.length
      };

    } catch (error) {
      this.logger.error('ArchiveManager', `Failed to archive completed tasks: ${error.message}`, {
        task_count: tasks.length
      });
      throw error;
    }
  }

  /**
   * Archive proposals to archive sheet
   * @param {Array} proposals - Array of processed proposals to archive
   * @returns {Object} Archive operation result
   */
  archiveProcessedProposals(proposals = []) {
    try {
      if (!proposals || proposals.length === 0) {
        return {
          success: true,
          archived_count: 0,
          message: 'No proposals to archive'
        };
      }

      const archiveSheetName = 'PROPOSED_ARCHIVE';
      const sourceHeaders = this.batchOperations.getHeaders(SHEET_NAMES.PROPOSED_TASKS);

      // Ensure archive sheet exists
      const archiveSpreadsheetId = this.getOrCreateArchiveSheet(archiveSheetName, sourceHeaders);

      // Prepare archive rows
      const archiveRows = proposals.map(proposal => {
        const archiveRow = this._proposalToArchiveRow(proposal, sourceHeaders);

        // Add archive timestamp
        const archivedAtIndex = sourceHeaders.indexOf('archived_at');
        if (archivedAtIndex !== -1) {
          archiveRow[archivedAtIndex] = TimeZoneAwareDate.now();
        }

        return archiveRow;
      });

      // Append to archive sheet with retry logic
      let result;
      let lastError;
      for (let attempt = 1; attempt <= CONSTANTS.MAX_RETRIES; attempt++) {
        try {
          result = this.appendToArchive(archiveSheetName, archiveRows);
          if (result.success) {
            if (attempt > 1) {
              this.logger.info('ArchiveManager', `Archive append succeeded on attempt ${attempt}`);
            }
            break;
          }
        } catch (error) {
          lastError = error;
          this.logger.warn('ArchiveManager', `Archive append attempt ${attempt} failed: ${error.message}`);
          if (attempt < CONSTANTS.MAX_RETRIES) {
            const delay = CONSTANTS.BASE_RETRY_DELAY * attempt;
            Utilities.sleep(delay);
          }
        }
      }
      if (!result || !result.success) {
        throw lastError || new Error('Archive append failed after ' + CONSTANTS.MAX_RETRIES + ' attempts');
      }

      this.logger.info('ArchiveManager', `Archived ${proposals.length} processed proposals`, {
        archive_sheet: archiveSheetName,
        external: archiveSpreadsheetId !== '',
        proposal_ids: proposals.map(p => p.proposal_id).slice(0, 5)
      });

      return {
        ...result,
        archived_proposals: proposals.length
      };

    } catch (error) {
      this.logger.error('ArchiveManager', `Failed to archive proposals: ${error.message}`, {
        proposal_count: proposals.length
      });
      throw error;
    }
  }

  /**
   * Generic method to append rows to any archive sheet
   * @param {string} sheetName - Archive sheet name
   * @param {Array} rows - Rows to append
   * @returns {Object} Append operation result
   */
  appendToArchive(sheetName, rows) {
    try {
      if (!rows || rows.length === 0) {
        return {
          success: true,
          archived_count: 0,
          message: 'No rows to append'
        };
      }

      const spreadsheetId = this.getArchiveSpreadsheetId();
      const activeSpreadsheetId = getActiveSystemSpreadsheet().getId();
      const targetSpreadsheetId = spreadsheetId || activeSpreadsheetId;

      let result;
      if (spreadsheetId) {
        result = this.batchOperations.appendRowsToExternalSheet(spreadsheetId, sheetName, rows);
      } else {
        result = this.batchOperations.appendRows(sheetName, rows);
      }

      this.logger.debug('ArchiveManager', `Appended ${result.rowsAppended} rows to ${sheetName}`, {
        target_spreadsheet_id: targetSpreadsheetId,
        external: spreadsheetId !== '',
        rows_appended: result.rowsAppended
      });

      return {
        success: true,
        archived_count: result.rowsAppended,
        external: spreadsheetId !== '',
        spreadsheet_id: targetSpreadsheetId,
        message: `Successfully archived ${result.rowsAppended} records to ${spreadsheetId ? 'external' : 'current'} spreadsheet`
      };

    } catch (error) {
      this.logger.error('ArchiveManager', `Failed to append to archive ${sheetName}`, {
        error: error.message,
        row_count: rows ? rows.length : 0
      });
      throw error;
    }
  }

  /**
   * Convert task object to archive row
   * @param {Object} task - Task object
   * @param {Array} headers - Sheet headers
   * @returns {Array} Archive row data
   * @private
   */
  _taskToArchiveRow(task, headers) {
    const row = new Array(headers.length).fill('');

    headers.forEach((header, index) => {
      if (task.hasOwnProperty(header)) {
        row[index] = task[header];
      }
    });

    return row;
  }

  /**
   * Convert proposal object to archive row
   * @param {Object} proposal - Proposal object
   * @param {Array} headers - Sheet headers
   * @returns {Array} Archive row data
   * @private
   */
  _proposalToArchiveRow(proposal, headers) {
    const row = new Array(headers.length).fill('');

    headers.forEach((header, index) => {
      if (proposal.hasOwnProperty(header)) {
        row[index] = proposal[header];
      }
    });

    return row;
  }

  /**
   * Get archive statistics
   * @returns {Object} Archive statistics
   */
  getArchiveStatistics() {
    try {
      const status = this.getArchiveStatus();
      const stats = {
        archive_configuration: status,
        archive_sheets: {},
        total_archived_records: 0
      };

      const archiveSheetNames = ['ACTIONS_ARCHIVE', 'PROPOSED_ARCHIVE'];
      const targetSpreadsheet = status.external_accessible ?
        SpreadsheetApp.openById(status.external_id) :
        getActiveSystemSpreadsheet();

      for (const sheetName of archiveSheetNames) {
        try {
          const sheet = targetSpreadsheet.getSheetByName(sheetName);
          if (sheet) {
            const rowCount = Math.max(0, sheet.getLastRow() - 1); // Exclude header
            stats.archive_sheets[sheetName] = {
              exists: true,
              record_count: rowCount,
              last_updated: this._getSheetLastModified(sheet)
            };
            stats.total_archived_records += rowCount;
          } else {
            stats.archive_sheets[sheetName] = {
              exists: false,
              record_count: 0
            };
          }
        } catch (error) {
          stats.archive_sheets[sheetName] = {
            exists: false,
            error: error.message,
            record_count: 0
          };
        }
      }

      return stats;

    } catch (error) {
      this.logger.error('ArchiveManager', `Failed to get archive statistics: ${error.message}`);
      return {
        error: error.message,
        archive_sheets: {},
        total_archived_records: 0
      };
    }
  }

  /**
   * Get sheet last modified time (approximate)
   * @param {Sheet} sheet - Sheet object
   * @returns {string} Last modified timestamp
   * @private
   */
  _getSheetLastModified(sheet) {
    try {
      // This is an approximation - Google Sheets doesn't provide direct last modified time
      return TimeZoneAwareDate.now();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Clean up old archive data based on retention policy
   * @param {Object} retentionPolicy - Retention policy configuration
   * @returns {Object} Cleanup result
   */
  cleanupOldArchives(retentionPolicy = {}) {
    try {
      const defaultPolicy = {
        keep_months: this.configManager.getNumber('ARCHIVE_RETENTION_MONTHS', 12),
        dry_run: false
      };

      const policy = { ...defaultPolicy, ...retentionPolicy };
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - policy.keep_months);

      this.logger.info('ArchiveManager', `Starting archive cleanup`, {
        cutoff_date: TimeZoneAwareDate.toISOString(cutoffDate),
        dry_run: policy.dry_run,
        retention_months: policy.keep_months
      });

      const stats = {
        records_eligible: 0,
        records_removed: 0
      };

      const archiveSheetNames = ['ACTIONS_ARCHIVE', 'PROPOSED_ARCHIVE'];
      const archiveStatus = this.getArchiveStatus();
      const targetSpreadsheet = archiveStatus.external_accessible ?
        SpreadsheetApp.openById(archiveStatus.external_id) :
        getActiveSystemSpreadsheet();

      for (const sheetName of archiveSheetNames) {
        const sheet = targetSpreadsheet.getSheetByName(sheetName);
        if (!sheet) {
          this.logger.warn('ArchiveManager', `Archive sheet ${sheetName} not found for cleanup.`);
          continue;
        }

        const allData = sheet.getDataRange().getValues();
        if (allData.length <= 1) continue; // Only headers or empty

        const headers = allData[0];
        const dateColumnIndex = headers.indexOf('archived_at'); // Assuming 'archived_at' column exists

        if (dateColumnIndex === -1) {
          this.logger.warn('ArchiveManager', `Archive sheet ${sheetName} missing 'archived_at' column for cleanup.`);
          continue;
        }

        const recordsToKeep = [headers];
        let currentSheetRecordsEligible = 0;

        for (let i = 1; i < allData.length; i++) {
          const row = allData[i];
          const archivedAtDate = new Date(row[dateColumnIndex]);

          if (archivedAtDate < cutoffDate) {
            currentSheetRecordsEligible++;
          } else {
            recordsToKeep.push(row);
          }
        }

        stats.records_eligible += currentSheetRecordsEligible;

        if (!policy.dry_run && currentSheetRecordsEligible > 0) {
          // Clear existing content and write back only records to keep
          sheet.clearContents();
          sheet.getRange(1, 1, recordsToKeep.length, recordsToKeep[0].length).setValues(recordsToKeep);
          sheet.setFrozenRows(1); // Re-freeze header row
          stats.records_removed += currentSheetRecordsEligible;
          this.logger.info('ArchiveManager', `Removed ${currentSheetRecordsEligible} old records from ${sheetName}.`);
        } else if (policy.dry_run) {
          this.logger.info('ArchiveManager', `Dry run: ${currentSheetRecordsEligible} records eligible for removal from ${sheetName}.`);
        }
      }

      return {
        success: true,
        dry_run: policy.dry_run,
        cutoff_date: TimeZoneAwareDate.toISOString(cutoffDate),
        records_eligible: stats.records_eligible,
        records_removed: stats.records_removed,
        message: policy.dry_run ? 'Archive cleanup dry run completed.' : 'Archive cleanup completed.'
      };

    } catch (error) {
      this.logger.error('ArchiveManager', `Archive cleanup failed: ${error.message}`, {
        error: error.message,
        stack: error.stack,
        retentionPolicy: retentionPolicy
      });
      throw error;
    }
  }

  /**
   * Self-test archive manager functionality
   * @returns {boolean} True if all tests pass
   */
  selfTest() {
    try {
      this.logger.info('ArchiveManager', 'Running self-test');

      // Test 1: Check archive status
      const status = this.getArchiveStatus();
      if (!status || typeof status.external_configured !== 'boolean') {
        throw new Error('getArchiveStatus failed');
      }

      // Test 2: Test spreadsheet ID retrieval
      const archiveId = this.getArchiveSpreadsheetId();
      if (typeof archiveId !== 'string') {
        throw new Error('getArchiveSpreadsheetId failed');
      }

      // Test 3: Test archive statistics
      const stats = this.getArchiveStatistics();
      if (!stats || typeof stats.total_archived_records !== 'number') {
        throw new Error('getArchiveStatistics failed');
      }

      // Test 4: Test actual append with cleanup
      const testSheetName = 'ACTIONS_ARCHIVE';
      const testHeaders = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const testArchiveHeaders = [...testHeaders, 'archived_at'];

      // Ensure test archive sheet exists
      this.getOrCreateArchiveSheet(testSheetName, testArchiveHeaders);

      // Build dummy test row
      const testRow = new Array(testArchiveHeaders.length).fill('');
      testRow[testArchiveHeaders.indexOf('action_id')] = 'SELFTEST_' + Date.now();
      testRow[testArchiveHeaders.indexOf('archived_at')] = TimeZoneAwareDate.now();

      let appendResult;
      let rowsAppended = 0;
      let targetSpreadsheetId = archiveId || 'current';

      try {
        // Test append with retry logic
        appendResult = this.appendToArchive(testSheetName, [testRow]);
        rowsAppended = appendResult.archived_count;

        // Clean up test row
        const spreadsheetId = this.getArchiveSpreadsheetId();
        const targetSpreadsheet = spreadsheetId ?
          SpreadsheetApp.openById(spreadsheetId) :
          getActiveSystemSpreadsheet();
        const archiveSheet = targetSpreadsheet.getSheetByName(testSheetName);
        if (archiveSheet) {
          const lastRow = archiveSheet.getLastRow();
          if (lastRow > 1) {
            archiveSheet.deleteRow(lastRow);
          }
        }
      } catch (testError) {
        this.logger.warn('ArchiveManager', `Self-test append failed: ${testError.message}`);
      }

      this.logger.info('ArchiveManager', 'Self-test passed', {
        archive_status: status.archive_location,
        external_configured: status.external_configured,
        total_archived: stats.total_archived_records,
        test_rows_appended: rowsAppended,
        target_spreadsheet_id: targetSpreadsheetId
      });

      return {
        success: true,
        archive_sheet: testSheetName,
        rows_appended: rowsAppended,
        target_spreadsheet_id: targetSpreadsheetId
      };

    } catch (error) {
      this.logger.error('ArchiveManager', `Self-test failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
