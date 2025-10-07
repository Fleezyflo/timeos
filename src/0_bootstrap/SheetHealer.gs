/**
 * MOH TIME OS v2.0 - SHEET HEALER
 *
 * Automatic sheet structure validation and repair system.
 * Ensures all required sheets exist with correct headers and formatting.
 */

class SheetHealer {

  /**
   * Validate and repair all sheet structures
   */
  static validateAndRepair() {
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      sheetsChecked: 0,
      sheetsCreated: 0,
      sheetsRepaired: 0,
      errors: []
    };

    try {
      let spreadsheet;
      try {
        spreadsheet = getActiveSystemSpreadsheet();
      } catch (e) {
        LoggerFacade.error('SheetHealer', `Failed to get active spreadsheet: ${e.message}`, { stack: e.stack });
        throw new Error('SheetHealer: Critical error - could not access active spreadsheet.');
      }
      
      const requiredSheets = this.getRequiredSheets();

      for (const [sheetName, schema] of Object.entries(requiredSheets)) {
        results.sheetsChecked++;

        try {
          let sheet;
          try {
            sheet = spreadsheet.getSheetByName(sheetName);
          } catch (e) {
            LoggerFacade.warn('SheetHealer', `Failed to get sheet by name ${sheetName}: ${e.message}. Assuming sheet is missing.`, { stack: e.stack });
            sheet = null; // Ensure sheet is null if an error occurs during retrieval
          }

          if (!sheet) {
            sheet = this.createSheet(spreadsheet, sheetName, schema);
            results.sheetsCreated++;
            LoggerFacade.info('SheetHealer', `Created missing sheet: ${sheetName}`);
          } else {
            const repaired = this.validateSheetStructure(sheet, schema);
            if (repaired) {
              results.sheetsRepaired++;
              LoggerFacade.info('SheetHealer', `Repaired sheet structure: ${sheetName}`);
            }
          }
        } catch (sheetError) {
          const error = `Failed to process sheet ${sheetName}: ${sheetError.message}`;
          results.errors.push(error);
          LoggerFacade.error('SheetHealer', error);
        }
      }

      this.lastValidation = results;
      const duration = Date.now() - startTime;

      LoggerFacade.info('SheetHealer', `Validation complete in ${duration}ms`, { created: results.sheetsCreated, repaired: results.sheetsRepaired, errors: results.errors.length });

      if (results.sheetsCreated > 0 || results.sheetsRepaired > 0) {
        resetSpreadsheetCacheFull();
      }

      return results;

    } catch (error) {
      const criticalError = `Sheet healing failed critically: ${error.message}`;
      results.errors.push(criticalError);
      LoggerFacade.error('SheetHealer', criticalError, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Create a new sheet with proper structure
   */
  static createSheet(spreadsheet, sheetName, schema) {
    try {
      const sheet = spreadsheet.insertSheet(sheetName);

      if (schema.headers && schema.headers.length > 0) {
        try {
          const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
          headerRange.setValues([schema.headers]);
          headerRange.setFontWeight('bold').setBackground('#e8f0fe').setBorder(true, true, true, true, true, true);
          sheet.setFrozenRows(1);
        } catch (e) { LoggerFacade.error('SheetHealer', `Failed to set headers for ${sheetName}: ${e.message}`); }
      }

      if (schema.columnWidths) {
        schema.columnWidths.forEach((width, index) => {
          try {
            if (width > 0) sheet.setColumnWidth(index + 1, width);
          } catch (e) { LoggerFacade.error('SheetHealer', `Failed to set column width for ${sheetName}, col ${index + 1}: ${e.message}`); }
        });
      }

      if (schema.validations) {
        try {
          this.applyDataValidations(sheet, schema.validations);
        } catch (e) { LoggerFacade.error('SheetHealer', `Failed to apply validations for ${sheetName}: ${e.message}`); }
      }

      return sheet;
    } catch (error) {
      LoggerFacade.error('SheetHealer', `Failed to create sheet ${sheetName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate and repair existing sheet structure
   */
  static validateSheetStructure(sheet, schema) {
    let repaired = false;
    try {
      let lastColumn = 1;
      try {
        lastColumn = sheet.getLastColumn() || 1;
      } catch(e) { LoggerFacade.warn('SheetHealer', `Could not getLastColumn for ${sheet.getName()}: ${e.message}`); }

      let currentHeaders = [];
      try {
        currentHeaders = sheet.getRange(1, 1, 1, Math.max(lastColumn, schema.headers.length)).getValues()[0];
      } catch(e) { LoggerFacade.error('SheetHealer', `Could not get headers for ${sheet.getName()}: ${e.message}`); }
      
      let headersNeedUpdate = false;
      for (let i = 0; i < schema.headers.length; i++) {
        if (currentHeaders[i] !== schema.headers[i]) {
          headersNeedUpdate = true;
          break;
        }
      }

      if (headersNeedUpdate) {
        try {
          const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
          headerRange.setValues([schema.headers]);
          headerRange.setFontWeight('bold').setBackground('#e8f0fe').setBorder(true, true, true, true, true, true);
          repaired = true;
        } catch (e) { LoggerFacade.error('SheetHealer', `Failed to update headers for ${sheet.getName()}: ${e.message}`); }
      }

      try {
        if (sheet.getFrozenRows() < 1) {
          sheet.setFrozenRows(1);
          repaired = true;
        }
      } catch (e) { LoggerFacade.error('SheetHealer', `Failed to set frozen rows for ${sheet.getName()}: ${e.message}`); }
      
      if (currentHeaders.length < schema.headers.length) {
        try {
          const missingHeaders = schema.headers.slice(currentHeaders.length);
          const startCol = currentHeaders.length + 1;
          sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
          repaired = true;
        } catch (e) { LoggerFacade.error('SheetHealer', `Failed to add missing columns for ${sheet.getName()}: ${e.message}`); }
      }

      if (schema.validations) {
        try {
          const currentValidationVersion = this._getValidationVersion(sheet);
          if (currentValidationVersion !== this.validationVersion) {
            this.applyDataValidations(sheet, schema.validations);
            this._setValidationVersion(sheet, this.validationVersion);
            repaired = true;
          }
        } catch (e) { LoggerFacade.error('SheetHealer', `Failed to update validations for ${sheet.getName()}: ${e.message}`); }
      }

      return repaired;
    } catch (error) {
      LoggerFacade.error('SheetHealer', 'Sheet structure validation failed', { sheetName: sheet.getName(), error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Apply data validations to sheet
   */
  static applyDataValidations(sheet, validations) {
    validations.forEach(validation => {
      try {
        const range = sheet.getRange(validation.range);
        const rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(validation.values, validation.showDropdown !== false)
          .setAllowInvalid(validation.allowInvalid === true)
          .setHelpText(validation.helpText || '')
          .build();
        range.setDataValidation(rule);
      } catch (error) {
        LoggerFacade.error('SheetHealer', `Failed to apply validation to ${validation.range} on sheet ${sheet.getName()}: ${error.message}`);
      }
    });
  }

  /**
   * Get validation version from sheet metadata
   */
  static _getValidationVersion(sheet) {
    try {
      const metadata = sheet.getDeveloperMetadata();
      for (let i = 0; i < metadata.length; i++) {
        if (metadata[i].getKey() === 'validation_version') {
          return metadata[i].getValue();
        }
      }
      return null;
    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_012_STATIC
      LoggerFacade.error('SheetHealer', 'Failed to get validation version', {
        error: error.message,
        stack: error.stack,
        context: '_getValidationVersion'
      });

      throw error;
    }
  }

  /**
   * Set validation version in sheet metadata
   */
  static _setValidationVersion(sheet, version) {
    try{
      // Remove existing version metadata if present
      const metadata = sheet.getDeveloperMetadata();
      for (let i = 0; i < metadata.length; i++) {
        if (metadata[i].getKey() === 'validation_version') {
          metadata[i].remove();
        }
      }
      // Add new version
      sheet.addDeveloperMetadata('validation_version', version);
    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_013_STATIC
      LoggerFacade.error('SheetHealer', 'Failed to set validation version', {
        version: version,
        error: error.message,
        stack: error.stack,
        context: '_setValidationVersion'
      });

      throw error;
    }
  }

  /**
   * Get required sheet schemas (refactored for maintainability)
   */
  static getRequiredSheets() {
    return {
      'ACTIONS': this._getActionsSchema(),
      'PROPOSED_TASKS': this._getProposedTasksSchema(),
      'ACTIONS_ARCHIVE': this._getActionsArchiveSchema(),
      'PROPOSED_ARCHIVE': this._getProposedArchiveSchema(),
      'DEPENDENCIES': this._getDependenciesSchema(),
      'CALENDAR_PROJECTION': this._getCalendarProjectionSchema(),
      'FOUNDATION_BLOCKS': this._getFoundationBlocksSchema(),
      'TIME_BLOCKS': this._getTimeBlocksSchema(),
      'LANES': this._getLanesSchema(),
      'SENDER_REPUTATION': this._getSenderReputationSchema(),
      'CHAT_QUEUE': this._getChatQueueSchema(),
      'ACTIVITY': this._getActivitySchema(),
      'STATUS': this._getStatusSchema(),
      'APPSHEET_CONFIG': this._getAppSheetConfigSchema(),
      'HUMAN_STATE': this._getHumanStateSchema()
    };
  }

  /**
   * ACTIONS sheet schema
   */
  static _getActionsSchema() {
    return {
        headers: [
          'action_id', 'status', 'priority', 'created_at', 'updated_at',
          'title', 'context', 'lane', 'estimated_minutes', 'scheduled_start',
          'scheduled_end', 'actual_minutes', 'completed_date', 'source',
          'source_id', 'description', 'calendar_event_id', 'rollover_count',
          'scheduling_metadata', 'score', 'deadline', 'energy_required',
          'focus_required', 'estimation_accuracy', 'version',
          'last_scheduled_score', 'last_scheduled_block_type', 'last_scheduled_energy_level',
          'last_scheduled_context_type', 'last_scheduled_lane', 'last_scheduled_duration',
          'last_scheduled_priority', 'last_scheduled_impact', 'last_scheduled_urgency',
          'last_scheduled_effort_minutes', 'last_scheduled_estimation_accuracy',
          'last_scheduled_rollover_count', 'last_scheduled_last_rollover_date',
          'last_scheduled_notes', 'last_scheduled_source', 'last_scheduled_source_id',
          'last_scheduled_external_url', 'last_scheduled_attachments', 'last_scheduled_metadata',
          'last_scheduled_dependency', 'last_scheduled_estimated_completion',
          'completion_notes', 'created_by', 'assigned_to', 'parent_id',
          'dependencies', 'tags', 'archived_at'
        ],
        columnWidths: [
          150, 100, 80, 150, 150, 200, 100, 80, 80, 150,
          150, 80, 150, 150, 150, 300, 150, 80, 250, 80,
          150, 100, 100, 120, 80,
          80, 120, 120, 120, 100, 80,
          100, 100, 100, 80, 120,
          80, 150, 200, 150, 150,
          200, 250, 250, 150, 150,
          200, 150, 150, 150, 250, 250, 150
        ],
        validations: [
          {
            range: 'B2:B1000',
            values: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'SCHEDULED', 'PENDING',
                     'PENDING_APPROVAL', 'ACCEPTED', 'REJECTED', 'BLOCKED', 'DEFERRED', 'ARCHIVED'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Select task status - complete STATUS enum coverage'
          },
          {
            range: 'C2:C1000',
            values: ['CRITICAL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Select task priority - complete PRIORITY enum coverage'
          },
          {
            range: 'H2:H1000',
            values: ['ops', 'admin', 'creative', 'client', 'growth', 'deep_focus', 'batch',
                     'communication', 'learning', 'maintenance', 'high_energy', 'low_energy',
                     'social', 'solo', 'personal'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Select task lane/context - complete LANE enum coverage'
          },
          {
            range: 'V2:V1000',
            values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'RECOVERY'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Energy level required for task - complete ENERGY_LEVEL enum coverage'
          },
          {
            range: 'W2:W1000',
            values: ['INTENSE', 'HIGH', 'MEDIUM', 'LOW', 'BACKGROUND'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Focus level required for task - complete FOCUS_LEVEL enum coverage'
          }
        ]
    };
  }

  /**
   * PROPOSED_TASKS sheet schema
   */
  static _getProposedTasksSchema() {
    return {
        headers: [
          'proposal_id', 'status', 'created_at', 'processed_at', 'source',
          'source_id', 'sender', 'subject', 'parsed_title', 'suggested_lane',
          'suggested_priority', 'suggested_duration',
          'confidence_score', 'raw_content_preview', 'created_task_id', 'archived_at'
        ],
        columnWidths: [150, 120, 150, 150, 100, 150, 200, 250, 200, 100, 80, 80, 120, 400, 150, 150],
        validations: [
          {
            range: 'B2:B1000',
            values: ['PENDING', 'PROCESSED', 'ACCEPTED', 'REJECTED', 'DUPLICATE', 'INVALID', 'EXPIRED'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Proposal status - complete PROPOSAL_STATUS enum coverage'
          }
        ]
    };
  }

  /**
   * ACTIONS_ARCHIVE sheet schema
   * Identical to ACTIONS schema - stores archived tasks
   */
  static _getActionsArchiveSchema() {
    return this._getActionsSchema();
  }

  /**
   * PROPOSED_ARCHIVE sheet schema
   * Identical to PROPOSED_TASKS schema - stores archived proposals
   */
  static _getProposedArchiveSchema() {
    return this._getProposedTasksSchema();
  }

  /**
   * DEPENDENCIES sheet schema
   */
  static _getDependenciesSchema() {
    return {
        headers: [
          'blocking_action_id', 'blocked_action_id', 'relationship_type', 'created_at', 'updated_at'
        ],
        columnWidths: [200, 200, 160, 160, 160]
    };
  }

  /**
   * CALENDAR_PROJECTION sheet schema
   */
  static _getCalendarProjectionSchema() {
    return {
        headers: [
          'event_id', 'start', 'end', 'type', 'busy', 'title', 'description'
        ],
        columnWidths: [200, 150, 150, 100, 60, 250, 300]
    };
  }

  /**
   * FOUNDATION_BLOCKS sheet schema
   */
  static _getFoundationBlocksSchema() {
    return {
        headers: [
          'block_id', 'day', 'start_time', 'end_time', 'block_type',
          'energy_level', 'context', 'active'
        ],
        columnWidths: [150, 100, 100, 100, 120, 100, 150, 60],
        validations: [
          {
            range: 'F2:F1000',
            values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'RECOVERY'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Energy level for this block - complete ENERGY_LEVEL enum coverage'
          },
          {
            range: 'H2:H1000',
            values: ['true', 'false'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Whether block is active'
          }
        ]
    };
  }

  /**
   * TIME_BLOCKS sheet schema
   */
  static _getTimeBlocksSchema() {
    return {
        headers: [
          'block_id', 'start_time', 'end_time', 'duration_minutes', 'block_type',
          'energy_level', 'context', 'available', 'busy', 'title', 'description',
          'task_id', 'created_at'
        ],
        columnWidths: [150, 180, 180, 120, 140, 140, 180, 80, 80, 200, 220, 160, 180]
    };
  }

  /**
   * LANES sheet schema
   */
  static _getLanesSchema() {
    return {
        headers: [
          'lane', 'description', 'weight', 'min_block_minutes', 'max_daily_minutes',
          'priority_multiplier', 'context_type', 'energy_preference', 'is_active',
          'created_at', 'updated_at'
        ],
        columnWidths: [150, 250, 80, 140, 140, 140, 140, 140, 80, 160, 160],
        validations: [
          {
            range: 'H2:H1000',
            values: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'RECOVERY'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Preferred energy level for this lane - complete ENERGY_LEVEL enum coverage'
          },
          {
            range: 'I2:I1000',
            values: ['true', 'false'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Whether lane is active'
          }
        ]
    };
  }

  /**
   * SENDER_REPUTATION sheet schema
   */
  static _getSenderReputationSchema() {
    return {
        headers: [
          'sender_email', 'approved_count', 'rejected_count', 'reputation_score',
          'total_interactions', 'first_seen', 'last_updated', 'status',
          'block_reason', 'blocked_at', 'trustScore'
        ],
        columnWidths: [220, 140, 140, 160, 160, 180, 180, 120, 220, 180, 140],
        validations: [
          {
            range: 'H2:H1000',
            values: ['TRUSTED', 'NEUTRAL', 'SUSPICIOUS', 'BLOCKED'],
            showDropdown: true,
            allowInvalid: true,
            helpText: 'Sender reputation status'
          }
        ]
    };
  }

  /**
   * CHAT_QUEUE sheet schema
   */
  static _getChatQueueSchema() {
    return {
        headers: [
          'message_id', 'timestamp', 'user', 'context', 'payload', 'status', 'last_updated'
        ],
        columnWidths: [220, 180, 180, 200, 320, 120, 180]
    };
  }

  /**
   * ACTIVITY sheet schema
   */
  static _getActivitySchema() {
    return {
        headers: [
          'timestamp', 'level', 'component', 'action', 'data', 'user'
        ],
        columnWidths: [150, 80, 150, 200, 400, 200]
    };
  }

  /**
   * STATUS sheet schema
   */
  static _getStatusSchema() {
    return {
        headers: [
          'key', 'value', 'updated_at', 'description'
        ],
        columnWidths: [200, 200, 150, 300]
    };
  }

  /**
   * APPSHEET_CONFIG sheet schema
   */
  static _getAppSheetConfigSchema() {
    return {
        headers: [
          'row_id', 'category', 'subcategory', 'item', 'key', 'value', 'description'
        ],
        columnWidths: [100, 150, 150, 150, 200, 200, 300],
        validations: [
          {
            range: 'F2:F1000',
            values: ['true', 'false', 'LABEL_ONLY', 'ZERO_TRUST_TRIAGE', 'LINEAR', 'EXPONENTIAL', 'LOGARITHMIC'],
            showDropdown: false,  // Don't show dropdown to avoid confusion
            allowInvalid: true,   // Allow any custom value
            helpText: 'Common values shown for guidance only. You can enter ANY value: numbers, strings, JSON objects, JSON arrays, etc.'
          }
        ]
    };
  }

  /**
   * HUMAN_STATE sheet schema
   */
  static _getHumanStateSchema() {
    return {
        headers: [
          'state_id', 'timestamp', 'energy_level', 'focus_level', 'mood',
          'stress_level', 'current_context', 'notes'
        ],
        columnWidths: [160, 160, 120, 120, 120, 140, 200, 300]
    };
  }

  /**
   * Get validation status
   */
  static getValidationStatus() {
    return this.lastValidation || { status: 'Not run yet' };
  }

  /**
   * Quick health check - just verify critical sheets exist
   */
  static quickHealthCheck() {
    try {
      const spreadsheet = getActiveSystemSpreadsheet();
      const criticalSheets = ['ACTIONS', 'PROPOSED_TASKS', 'CALENDAR_PROJECTION'];
      const missing = [];

      criticalSheets.forEach(sheetName => {
        if (!spreadsheet.getSheetByName(sheetName)) {
          missing.push(sheetName);
        }
      });

      return {
        healthy: missing.length === 0,
        missingSheets: missing,
        lastValidation: this.lastValidation
      };

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_014_STATIC
      LoggerFacade.error('SheetHealer', 'Sheet health check failed', {
        error: error.message,
        stack: error.stack,
        context: 'quickHealthCheck',
        lastValidation: this.lastValidation
      });

      throw error;
    }
  }
}

SheetHealer.schemaVersion = '2.0';
SheetHealer.validationVersion = '3.3'; // APPSHEET_CONFIG: Dropdown hidden, allowInvalid=true for guidance without enforcement + LANES/ACTIONS/etc allowInvalid=true
SheetHealer.lastValidation = null;

/**
 * Global function for manual sheet healing
 */
function healSheets() {
  return SheetHealer.validateAndRepair();
}

/**
 * Quick check function
 */
function checkSheetHealth() {
  return SheetHealer.quickHealthCheck();
}

/**
 * Reset spreadsheet cache with full system flush
 * Includes SpreadsheetApp.flush() and validation cache clear
 */
function resetSpreadsheetCacheFull() {
  try {
    // Clear Preload.gs cached spreadsheet reference
    if (typeof resetSpreadsheetCache === 'function') {
      resetSpreadsheetCache();
    }

    // Flush Google Apps Script API buffers
    SpreadsheetApp.flush();

    // Reset validation cache
    SheetHealer.lastValidation = null;

    // Log directly without service dependency
    Logger.log('[SheetHealer] Full spreadsheet cache reset successfully');
    return { success: true, message: 'Full cache reset completed' };
  } catch (error) {
    // RETHROW_WITH_LOG profile
    // TEST: TEST_SILENT_015_FUNCTION
    LoggerFacade.error('SheetHealer', 'Spreadsheet cache reset failed', {
      error: error.message,
      stack: error.stack,
      context: 'resetSpreadsheetCacheFull'
    });

    throw error;
  }
}
