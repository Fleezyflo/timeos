/**
 * MOH TIME OS v2.0 - BACKUP MANAGER
 *
 * Automated backup and restore for critical sheets.
 * Stores backups in Google Drive with verification and integrity checks.
 */

class BackupManager {
  constructor(batchOperations, smartLogger) {
    this.batchOperations = batchOperations;
    this.logger = smartLogger;
    this.backupFolderId = this._getOrCreateBackupFolder();
  }

  /**
   * Create backup of critical sheets
   * @param {Array<string>} sheetNames - Sheet names to backup (defaults to all critical)
   * @returns {Object} { success, backupId, timestamp, sheets, verification }
   */
  createBackup(sheetNames = null) {
    const startTime = Date.now();
    const backupId = `backup_${Date.now()}_${Utilities.getUuid().substring(0, 8)}`;

    try {
      // Default to critical sheets if not specified
      const sheetsToBackup = sheetNames || [
        SHEET_NAMES.ACTIONS,
        SHEET_NAMES.PROPOSED_TASKS,
        SHEET_NAMES.DEPENDENCIES,
        SHEET_NAMES.TIME_BLOCKS,
        SHEET_NAMES.ACTIVITY,
        SHEET_NAMES.STATUS,
        SHEET_NAMES.ACTIONS_ARCHIVE,
        SHEET_NAMES.PROPOSED_ARCHIVE
      ];

      const timestamp = TimeZoneAwareDate.toISOString(new Date());
      const backupFolder = DriveApp.getFolderById(this.backupFolderId);
      const dateFolder = this._getOrCreateDateFolder(backupFolder);

      const backupMetadata = {
        backupId: backupId,
        timestamp: timestamp,
        version: getSystemVersion(),
        operator: Session.getActiveUser().getEmail(),
        sheets: []
      };

      // Backup each sheet
      for (const sheetName of sheetsToBackup) {
        try {
          const sheetData = this.batchOperations.getAllSheetData(sheetName);
          const rowCount = sheetData.length - 1; // Exclude header

          // Create CSV file
          const csvContent = this._convertToCSV(sheetData);
          const fileName = `${sheetName}_${backupId}.csv`;
          const file = dateFolder.createFile(fileName, csvContent, MimeType.CSV);

          backupMetadata.sheets.push({
            name: sheetName,
            rowCount: rowCount,
            fileId: file.getId(),
            size: csvContent.length
          });

          this.logger.info('BackupManager', `Backed up ${sheetName}`, {
            backupId: backupId,
            rowCount: rowCount,
            fileId: file.getId()
          });

        } catch (sheetError) {
          this.logger.error('BackupManager', `Failed to backup ${sheetName}`, {
            error: sheetError.message,
            backupId: backupId
          });
          throw sheetError;
        }
      }

      // Create metadata file
      const metadataFileName = `${backupId}_metadata.json`;
      dateFolder.createFile(metadataFileName, JSON.stringify(backupMetadata, null, 2), MimeType.JSON);

      // Verify backup integrity
      const verification = this.verifyBackup(backupId);

      const duration = Date.now() - startTime;

      this.logger.info('BackupManager', 'Backup completed successfully', {
        backupId: backupId,
        sheets: backupMetadata.sheets.length,
        duration: duration,
        verified: verification.success
      });

      return {
        success: true,
        backupId: backupId,
        timestamp: timestamp,
        sheets: backupMetadata.sheets,
        verification: verification,
        duration: duration
      };

    } catch (error) {
      this.logger.error('BackupManager', 'Backup failed', {
        error: error.message,
        backupId: backupId,
        stack: error.stack
      });
      return {
        success: false,
        backupId: backupId,
        error: error.message
      };
    }
  }

  /**
   * Verify backup integrity
   * @param {string} backupId - Backup identifier
   * @returns {Object} { success, backupId, checks }
   */
  verifyBackup(backupId) {
    try {
      const backupFolder = DriveApp.getFolderById(this.backupFolderId);
      const files = backupFolder.searchFiles(`title contains "${backupId}"`);

      const checks = {
        metadataExists: false,
        allSheetsPresent: false,
        rowCountsMatch: false,
        filesReadable: false
      };

      // Find metadata file
      let metadataFile = null;
      while (files.hasNext()) {
        const file = files.next();
        if (file.getName().endsWith('_metadata.json')) {
          metadataFile = file;
          checks.metadataExists = true;
          break;
        }
      }

      if (!metadataFile) {
        return { success: false, backupId: backupId, checks: checks };
      }

      // Parse metadata
      const metadata = JSON.parse(metadataFile.getBlob().getDataAsString());

      // Verify all sheet files exist
      const expectedFiles = metadata.sheets.length;
      const foundFiles = backupFolder.searchFiles(`title contains "${backupId}.csv"`);
      let fileCount = 0;
      while (foundFiles.hasNext()) {
        foundFiles.next();
        fileCount++;
      }

      checks.allSheetsPresent = (fileCount === expectedFiles);
      checks.filesReadable = true;

      // Verify row counts (sample check on first sheet)
      if (metadata.sheets.length > 0) {
        const firstSheet = metadata.sheets[0];
        const currentData = this.batchOperations.getAllSheetData(firstSheet.name);
        const currentRowCount = currentData.length - 1;
        checks.rowCountsMatch = (Math.abs(currentRowCount - firstSheet.rowCount) < 10); // Allow 10 row variance
      }

      const success = Object.values(checks).every(check => check === true);

      return {
        success: success,
        backupId: backupId,
        checks: checks,
        metadata: metadata
      };

    } catch (error) {
      this.logger.error('BackupManager', 'Backup verification failed', {
        backupId: backupId,
        error: error.message
      });
      return {
        success: false,
        backupId: backupId,
        error: error.message
      };
    }
  }

  /**
   * Restore sheet from backup
   * @param {string} backupId - Backup identifier
   * @param {string} sheetName - Sheet to restore
   * @returns {Object} { success, sheetName, rowsRestored }
   */
  restoreFromBackup(backupId, sheetName) {
    try {
      const backupFolder = DriveApp.getFolderById(this.backupFolderId);
      const fileName = `${sheetName}_${backupId}.csv`;
      const files = backupFolder.searchFiles(`title = "${fileName}"`);

      if (!files.hasNext()) {
        throw new Error(`Backup file not found: ${fileName}`);
      }

      const file = files.next();
      const csvContent = file.getBlob().getDataAsString();
      const rows = this._parseCSV(csvContent);

      // Clear current sheet and restore
      this.batchOperations.clearSheetData(sheetName);

      // First row is header - skip in appendRows
      const headers = rows[0];
      const dataRows = rows.slice(1);

      this.batchOperations.appendRows(sheetName, dataRows);

      this.logger.info('BackupManager', `Restored ${sheetName} from backup`, {
        backupId: backupId,
        rowsRestored: dataRows.length
      });

      return {
        success: true,
        sheetName: sheetName,
        rowsRestored: dataRows.length
      };

    } catch (error) {
      this.logger.error('BackupManager', 'Restore failed', {
        backupId: backupId,
        sheetName: sheetName,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get or create backup root folder in Drive
   * @private
   */
  _getOrCreateBackupFolder() {
    const folderName = 'MOH_Time_OS_Backups';
    const folders = DriveApp.getFoldersByName(folderName);

    if (folders.hasNext()) {
      return folders.next().getId();
    }

    const newFolder = DriveApp.createFolder(folderName);
    return newFolder.getId();
  }

  /**
   * Get or create date-specific subfolder (YYYY-MM-DD)
   * @private
   */
  _getOrCreateDateFolder(parentFolder) {
    const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const folders = parentFolder.getFoldersByName(dateStr);

    if (folders.hasNext()) {
      return folders.next();
    }

    return parentFolder.createFolder(dateStr);
  }

  /**
   * Convert 2D array to CSV string
   * @private
   */
  _convertToCSV(data) {
    return data.map(row => {
      return row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',');
    }).join('\n');
  }

  /**
   * Parse CSV string to 2D array
   * @private
   */
  _parseCSV(csvString) {
    const lines = csvString.split('\n');
    return lines.map(line => {
      const cells = [];
      let currentCell = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentCell += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          cells.push(currentCell);
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell); // Last cell
      return cells;
    });
  }
}
