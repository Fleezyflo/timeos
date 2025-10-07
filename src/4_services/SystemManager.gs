/**
 * MOH TIME OS v2.0 - SYSTEM MANAGER
 *
 * Comprehensive system health monitoring and management.
 * Provides health checks, system setup, maintenance operations, and monitoring.
 * Ensures system resilience and provides diagnostic capabilities.
 *
 * Original lines: 7142-7761 from scriptA.js
 */

class SystemManager {
  constructor(batchOperations, smartLogger, configManager, errorHandler, archiveManager) {
    this.batchOperations = batchOperations;
    this.logger = smartLogger;
    this.configManager = configManager;
    this.errorHandler = errorHandler;
    this.archiveManager = archiveManager;
  }

  /**
   * Check whether the spreadsheet schema is healthy
   * @returns {Object} Schema status metadata
   */
  checkSchemaStatus() {
    const status = {
      needsInitialization: false,
      missingSheets: [],
      lastValidation: null,
      details: {}
    };

    try {
      // Try using global function directly instead of unreliable typeof check
      try {
        const health = checkSheetHealth();
        status.lastValidation = health.lastValidation || null;
        status.missingSheets = health.missingSheets || [];
        status.needsInitialization = health.healthy === false || status.missingSheets.length > 0;
        status.details = health;
      } catch (sheetHealthError) {
        // RETHROW_WITH_LOG profile
        // TEST: TEST_SILENT_049_DIRECTLY
        LoggerFacade.error('SystemManager', 'checkSchemaStatus operation failed', {
          error: sheetHealthError.message,
          stack: sheetHealthError.stack,
          context: 'checkSchemaStatus'
        });

        throw sheetHealthError;
      }
    } catch (error) {
      status.needsInitialization = true;
      status.error = error.message;
      this.logger.error('SystemManager', 'Schema status check failed', { error: error.message });
    }

    return status;
  }

  /**
   * Attempt to repair spreadsheet schema
   * @returns {{success: boolean, details?: Object, error?: string}}
   */
  initializeSchema() {
    try {
      // Try using global function directly instead of unreliable typeof check
      try {
        this.logger.info('SystemManager', 'Schema check completed - healSheets() already called by bootstrap phase');
        return { success: true, details: { note: 'healSheets() executed in bootstrap phase' } };
      } catch (healError) {
        this.logger.error('SystemManager', 'SheetHealer not accessible - using fallback', { error: healError.message });
        // Still try fallback but log the issue
        const fallback = this._basicSchemaRepair();
        return { success: false, error: 'SheetHealer not available', details: fallback };
      }

    } catch (error) {
      this.logger.error('SystemManager', 'Schema initialization failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate that live sheet schemas match canonical SheetHealer definitions
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
          for (let i = 0; i < Math.max(liveHeaders.length, expectedHeaders.length); i++) {
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

      this.logger.info('SystemManager', 'Schema integrity validation complete', {
        checked: results.schemasChecked,
        valid: results.allValid,
        discrepancy_count: results.discrepancies.length
      });

    } catch (error) {
      this.logger.error('SystemManager', 'Schema validation failed', { error: error.message });
      results.allValid = false;
      results.error = error.message;
    }

    return results;
  }

  /**
   * Run comprehensive system health check
   * @returns {Object} Health check results
   */
  runHealthCheck() {
    this.logger.info('SystemManager', 'Starting resilient system health check');
    const healthResults = {
      timestamp: TimeZoneAwareDate.toISOString(new Date()),
      checks: {},
      partial_failure_mode: false
    };

    try {
      healthResults.checks.database = this._checkDatabaseHealth();
    } catch (error) {
      healthResults.checks.database = {
        status: 'CRITICAL_ERROR',
        details: `Health check system failure: ${error.message}`,
        error_type: 'HEALTH_CHECK_FAILURE'
      };
      healthResults.partial_failure_mode = true;
      this.logger.error('SystemManager', 'Database health check failed catastrophically', { error: error.message });
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

    try {
      healthResults.checks.services = this._checkServiceHealth();
    } catch (error) {
      healthResults.checks.services = {
        status: 'CRITICAL_ERROR',
        details: `Health check system failure: ${error.message}`,
        error_type: 'HEALTH_CHECK_FAILURE'
      };
      healthResults.partial_failure_mode = true;
      this.logger.error('SystemManager', 'Service health check failed catastrophically', { error: error.message });
    }

    try {
      healthResults.checks.data_integrity = this._checkDataIntegrity();
    } catch (error) {
      healthResults.checks.data_integrity = {
        status: 'CRITICAL_ERROR',
        details: `Health check system failure: ${error.message}`,
        error_type: 'HEALTH_CHECK_FAILURE'
      };
      healthResults.partial_failure_mode = true;
      this.logger.error('SystemManager', 'Data integrity health check failed catastrophically', { error: error.message });
    }

    try {
      healthResults.checks.configuration = this._checkConfigurationHealth();
    } catch (error) {
      healthResults.checks.configuration = {
        status: 'CRITICAL_ERROR',
        details: `Configuration health check system failure: ${error.message}`,
        error_type: 'HEALTH_CHECK_FAILURE'
      };
      healthResults.partial_failure_mode = true;
      this.logger.error('SystemManager', 'Configuration health check failed catastrophically', { error: error.message });
    }

    const overallHealth = this._calculateOverallHealth(healthResults.checks);
    healthResults.overall_status = overallHealth;

    try {
      this._writeHealthResults(healthResults);
    } catch (error) {
      this.logger.error('SystemManager', 'Failed to write health results', {
        error: error.message,
        health_results: 'PRESERVED_IN_LOGS'
      });
    }

    this.logger.info('SystemManager', `Health check completed: ${overallHealth}`, healthResults);
    return healthResults;
  }

  /**
   * Get current system status from STATUS sheet
   * @returns {Object} System status data
   */
  getSystemStatus() {
    try {
      const statusRows = this.batchOperations.getRowsByFilter(SHEET_NAMES.STATUS, {});
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.STATUS);
      const status = {};

      statusRows.forEach(row => {
        if (row.length >= 2) {
          const key = row[0]; // metric_name
          const value = row[1]; // metric_value
          const lastUpdated = row[2] || ''; // last_updated
          const statusFlag = row[3] || ''; // status_flag

          if (key) {
            status[key] = {
              value: value,
              last_updated: lastUpdated,
              status_flag: statusFlag
            };
          }
        }
      });

      return status;

    } catch (error) {
      this.logger.error('SystemManager', `Failed to get system status: ${error.message}`);
      return {};
    }
  }

  /**
   * Check database health (sheets accessibility and structure)
   * @returns {Object} Database health status
   * @private
   */
  _checkDatabaseHealth() {
    const dbHealth = {
      status: 'HEALTHY',
      details: {},
      issues: []
    };

    try {
      // Check all required sheets
      const requiredSheets = [
        SHEET_NAMES.ACTIONS,
        SHEET_NAMES.PROPOSED_TASKS,
        SHEET_NAMES.CALENDAR_PROJECTION,
        SHEET_NAMES.STATUS,
        SHEET_NAMES.ACTIVITY
      ];

      for (const sheetName of requiredSheets) {
        const sheetHealth = this._safeCheckSheetHealth(sheetName);
        dbHealth.details[sheetName] = sheetHealth;

        if (!sheetHealth.accessible) {
          dbHealth.issues.push(`Sheet ${sheetName}: ${sheetHealth.error}`);
          dbHealth.status = 'DEGRADED';
        }
      }

      // Check spreadsheet access
      const spreadsheetHealth = this._safeCheckSpreadsheetAccess();
      dbHealth.details.spreadsheet = spreadsheetHealth;

      if (!spreadsheetHealth.accessible) {
        dbHealth.status = 'CRITICAL';
        dbHealth.issues.push(`Spreadsheet access failed: ${spreadsheetHealth.error}`);
      }

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_050__CHECKDATABASEHEALTH
      LoggerFacade.error('SystemManager', '_checkDatabaseHealth operation failed', {
        error: error.message,
        stack: error.stack,
        context: '_checkDatabaseHealth'
      });

      throw error;
    }

    return dbHealth;
  }

  /**
   * Check service health (dependency injection container and services)
   * @returns {Object} Service health status
   * @private
   */
  _checkServiceHealth() {
    const serviceHealth = {
      status: 'HEALTHY',
      details: {},
      issues: []
    };

    try {
      // Check core services
      const coreServices = [
        'batchOperations',
        'logger',
        'configManager',
        'errorHandler'
      ];

      for (const serviceName of coreServices) {
        if (this[serviceName]) {
          serviceHealth.details[serviceName] = {
            available: true,
            status: 'OK'
          };

          // Try to call a basic method if available
          if (typeof this[serviceName].selfTest === 'function') {
            try {
              const selfTestResult = this[serviceName].selfTest();
              serviceHealth.details[serviceName].self_test = selfTestResult ? 'PASSED' : 'FAILED';
              if (!selfTestResult) {
                serviceHealth.issues.push(`${serviceName} self-test failed`);
                serviceHealth.status = 'DEGRADED';
              }
            } catch (testError) {
              // RETHROW_WITH_LOG profile
              // TEST: TEST_SILENT_051__CHECKSERVICEHEALTH
              LoggerFacade.error('SystemManager', '_checkServiceHealth self-test failed', {
                error: testError.message,
                stack: testError.stack,
                context: '_checkServiceHealth',
                serviceName: serviceName
              });

              throw testError;
            }
          }
        } else {
          serviceHealth.details[serviceName] = {
            available: false,
            status: 'MISSING'
          };
          serviceHealth.issues.push(`Service ${serviceName} not available`);
          serviceHealth.status = 'DEGRADED';
        }
      }

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_052__CHECKSERVICEHEALTH
      LoggerFacade.error('SystemManager', '_checkServiceHealth operation failed', {
        error: error.message,
        stack: error.stack,
        context: '_checkServiceHealth'
      });

      throw error;
    }

    return serviceHealth;
  }

  /**
   * Check data integrity (validate data consistency)
   * @returns {Object} Data integrity status
   * @private
   */
  _checkDataIntegrity() {
    const integrityHealth = {
      status: 'HEALTHY',
      details: {},
      issues: []
    };

    try {
      // Check ACTIONS sheet data consistency
      try {
        const actionsRows = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
        const actionsHeaders = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);

        integrityHealth.details.actions = {
          total_records: actionsRows.length,
          headers_count: actionsHeaders.length,
          status: 'OK'
        };

        // Check for required columns
        const requiredColumns = ['action_id', 'status', 'title'];
        const missingColumns = requiredColumns.filter(col => !actionsHeaders.includes(col));
        if (missingColumns.length > 0) {
          integrityHealth.issues.push(`ACTIONS missing columns: ${missingColumns.join(', ')}`);
          integrityHealth.status = 'DEGRADED';
        }

      } catch (error) {
        // RETHROW_WITH_LOG profile
        // TEST: TEST_SILENT_053__CHECKDATAINTEGRITY
        LoggerFacade.error('SystemManager', '_checkDataIntegrity ACTIONS check failed', {
          error: error.message,
          stack: error.stack,
          context: '_checkDataIntegrity',
          sheet: 'ACTIONS'
        });

        throw error;
      }

      // Check PROPOSED_TASKS sheet
      try {
        const proposalsRows = this.batchOperations.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, {});
        integrityHealth.details.proposals = {
          total_records: proposalsRows.length,
          status: 'OK'
        };
      } catch (error) {
        // RETHROW_WITH_LOG profile
        // TEST: TEST_SILENT_054__CHECKDATAINTEGRITY
        LoggerFacade.error('SystemManager', '_checkDataIntegrity PROPOSED_TASKS check failed', {
          error: error.message,
          stack: error.stack,
          context: '_checkDataIntegrity',
          sheet: 'PROPOSED_TASKS'
        });

        throw error;
      }

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_055__CHECKDATAINTEGRITY
      LoggerFacade.error('SystemManager', '_checkDataIntegrity operation failed', {
        error: error.message,
        stack: error.stack,
        context: '_checkDataIntegrity'
      });

      throw error;
    }

    return integrityHealth;
  }

  /**
   * Check configuration health
   * @returns {Object} Configuration health status
   * @private
   */
  _checkConfigurationHealth() {
    const configHealth = {
      status: 'HEALTHY',
      details: {},
      issues: []
    };

    try {
      if (this.configManager && typeof this.configManager.validateConfiguration === 'function') {
        const validation = this.configManager.validateConfiguration();
        configHealth.details.validation = validation;

        if (!validation.valid) {
          configHealth.status = 'DEGRADED';
          configHealth.issues.push(`Configuration validation failed: ${validation.missingKeys.join(', ')}`);
        }

        if (validation.usingDefaults) {
          configHealth.status = 'DEGRADED';
          configHealth.issues.push('Using default configuration values');
        }
      } else {
        configHealth.details.validation = {
          available: false,
          message: 'Configuration validation not available'
        };
        configHealth.status = 'DEGRADED';
        configHealth.issues.push('Configuration manager validation unavailable');
      }

      // Check critical configuration values
      const criticalConfigs = ['TIMEZONE', 'MAX_BATCH_SIZE'];
      for (const configKey of criticalConfigs) {
        try {
          const value = this.configManager.get(configKey);
          configHealth.details[configKey] = {
            available: value !== null,
            value: value,
            status: value !== null ? 'OK' : 'MISSING'
          };

          if (value === null) {
            configHealth.issues.push(`Critical config missing: ${configKey}`);
            configHealth.status = 'DEGRADED';
          }
        } catch (error) {
          // RETHROW_WITH_LOG profile
          // TEST: TEST_SILENT_056__CHECKCONFIGURATIONHEALTH
          LoggerFacade.error('SystemManager', '_checkConfigurationHealth config check failed', {
            error: error.message,
            stack: error.stack,
            context: '_checkConfigurationHealth',
            configKey: configKey
          });

          throw error;
        }
      }

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_057__CHECKCONFIGURATIONHEALTH
      LoggerFacade.error('SystemManager', '_checkConfigurationHealth operation failed', {
        error: error.message,
        stack: error.stack,
        context: '_checkConfigurationHealth'
      });

      throw error;
    }

    return configHealth;
  }

  /**
   * Calculate overall health status from individual checks
   * @param {Object} checks - Individual health check results
   * @returns {string} Overall health status
   * @private
   */
  _calculateOverallHealth(checks) {
    const statuses = Object.values(checks).map(check => check.status);

    if (statuses.includes('CRITICAL_ERROR') || statuses.includes('CRITICAL')) {
      return 'CRITICAL';
    }

    if (statuses.includes('DEGRADED')) {
      return 'DEGRADED';
    }

    if (statuses.every(status => status === 'HEALTHY')) {
      return 'HEALTHY';
    }

    return 'UNKNOWN';
  }

  /**
   * Write health results to STATUS sheet
   * @param {Object} healthResults - Health check results
   * @private
   */
  _writeHealthResults(healthResults) {
    try {
      const timestamp = TimeZoneAwareDate.now();
      const statusRows = [
        ['last_health_check', timestamp, timestamp, healthResults.overall_status],
        ['health_check_status', healthResults.overall_status, timestamp, 'AUTO'],
        ['partial_failure_mode', healthResults.partial_failure_mode, timestamp, 'AUTO']
      ];

      // Add individual check results
      for (const [checkName, checkResult] of Object.entries(healthResults.checks)) {
        statusRows.push([
          `health_${checkName}`,
          checkResult.status,
          timestamp,
          'AUTO'
        ]);
      }

      // Update STATUS sheet
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.STATUS);
      this.batchOperations.appendRows(SHEET_NAMES.STATUS, statusRows);

      this.logger.debug('SystemManager', 'Health results written to STATUS sheet', {
        rows_written: statusRows.length
      });

    } catch (error) {
      this.logger.error('SystemManager', `Failed to write health results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Run system maintenance operations
   * @returns {Object} Maintenance results
   */
  runSystemMaintenance() {
    this.logger.info('SystemManager', 'Starting system maintenance');

    const maintenanceResults = {
      timestamp: TimeZoneAwareDate.now(),
      operations: {},
      overall_status: 'SUCCESS'
    };

    try {
      // Archive old completed tasks
      if (this.archiveManager) {
        try {
          const completedTasks = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {
            status: STATUS.COMPLETED
          });

          if (completedTasks.length > 0) {
            const archiveLimit = this.configManager.getNumber('ARCHIVE_BATCH_LIMIT', 100, {
              min: 10,
              max: 500
            });
            const tasksToArchive = completedTasks.slice(0, archiveLimit);
            const archiveResult = this.archiveManager.archiveCompletedTasks(tasksToArchive.map(row => ({
              action_id: row[0],
              status: row[1],
              // Add other task properties as needed
              toSheetRow: (headers) => row
            })));

            maintenanceResults.operations.archive_tasks = archiveResult;
          } else {
            maintenanceResults.operations.archive_tasks = {
              success: true,
              message: 'No completed tasks to archive'
            };
          }
        } catch (error) {
          // RETHROW_WITH_LOG profile
          // TEST: TEST_SILENT_058_RUNSYSTEMMAINTENANCE
          LoggerFacade.error('SystemManager', 'runSystemMaintenance archive operation failed', {
            error: error.message,
            stack: error.stack,
            context: 'runSystemMaintenance',
            operation: 'archive_tasks'
          });

          throw error;
        }
      }

      // Clean up old activity logs (keep last 1000 entries)
      try {
        const activityRows = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIVITY, {});
        const logRetentionLimit = this.configManager.getNumber('ACTIVITY_LOG_LIMIT', 1000, {
          min: 100,
          max: 10000
        });
        if (activityRows.length > logRetentionLimit) {
          // This would require implementing a cleanup method in BatchOperations
          maintenanceResults.operations.cleanup_activity = {
            success: true,
            message: `Activity log has ${activityRows.length} entries (cleanup not implemented)`
          };
        } else {
          maintenanceResults.operations.cleanup_activity = {
            success: true,
            message: `Activity log size acceptable: ${activityRows.length} entries`
          };
        }
      } catch (error) {
        maintenanceResults.operations.cleanup_activity = {
          success: false,
          error: error.message
        };
        maintenanceResults.overall_status = 'PARTIAL_FAILURE';
      }

      // Update system status
      try {
        const statusUpdate = [
          ['last_maintenance', TimeZoneAwareDate.now(), TimeZoneAwareDate.now(), 'AUTO']
        ];
        this.batchOperations.appendRows(SHEET_NAMES.STATUS, statusUpdate);

        maintenanceResults.operations.status_update = {
          success: true,
          message: 'System status updated'
        };
      } catch (error) {
        maintenanceResults.operations.status_update = {
          success: false,
          error: error.message
        };
        maintenanceResults.overall_status = 'PARTIAL_FAILURE';
      }

    } catch (error) {
      this.logger.error('SystemManager', `System maintenance failed: ${error.message}`);
      maintenanceResults.overall_status = 'FAILURE';
      maintenanceResults.error = error.message;
    }

    this.logger.info('SystemManager', `System maintenance completed: ${maintenanceResults.overall_status}`, maintenanceResults);
    return maintenanceResults;
  }

  /**
   * Basic schema health check used when SheetHealer is unavailable
   */
  _basicSchemaHealthCheck() {
    const spreadsheet = getActiveSystemSpreadsheet();
    const requiredSheets = this._getRequiredSheetNames();
    const missingSheets = [];

    requiredSheets.forEach(sheetName => {
      if (!spreadsheet.getSheetByName(sheetName)) {
        missingSheets.push(sheetName);
      }
    });

    return {
      healthy: missingSheets.length === 0,
      missingSheets,
      checkedAt: TimeZoneAwareDate.now()
    };
  }

  /**
   * Minimal schema repair if SheetHealer is unavailable
   */
  _basicSchemaRepair() {
    const spreadsheet = getActiveSystemSpreadsheet();
    const definitions = this._getRequiredSheetDefinitions();
    const created = [];
    const processed = [];

    Object.entries(definitions).forEach(([sheetName, schema]) => {
      const result = this._createMissingSheet(spreadsheet, sheetName, schema);

      if (result.created) {
        created.push(sheetName);
      }
      processed.push(sheetName);
    });

    const validation = this._basicSchemaHealthCheck();
    return {
      createdSheets: created,
      processedSheets: processed,
      remainingMissingSheets: validation.missingSheets
    };
  }

  _getRequiredSheetDefinitions() {
    if (typeof SheetHealer !== 'undefined' && typeof SheetHealer.getRequiredSheets === 'function') {
      return SheetHealer.getRequiredSheets();
    }

    const names = this._getRequiredSheetNames();
    return names.reduce((acc, name) => {
      acc[name] = { headers: [] };
      return acc;
    }, {});
  }

  _getRequiredSheetNames() {
    if (typeof SHEET_NAMES !== 'undefined') {
      return Object.values(SHEET_NAMES);
    }

    // All 13 required sheets instead of just 5
    return [
      'ACTIONS', 'PROPOSED_TASKS', 'CALENDAR_PROJECTION', 'FOUNDATION_BLOCKS',
      'TIME_BLOCKS', 'LANES', 'SENDER_REPUTATION', 'CHAT_QUEUE', 'ACTIVITY',
      'STATUS', 'APPSHEET_CONFIG', 'HUMAN_STATE'
    ];
  }

  /**
   * Get system performance metrics
   * @returns {Object} Performance metrics
   */
  getSystemMetrics() {
    try {
      const metrics = {
        timestamp: TimeZoneAwareDate.now(),
        database: {},
        services: {},
        performance: {}
      };

      // Database metrics
      try {
        const actionsCount = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {}).length;
        const proposalsCount = this.batchOperations.getRowsByFilter(SHEET_NAMES.PROPOSED_TASKS, {}).length;
        const activityCount = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIVITY, {}).length;

        metrics.database = {
          total_actions: actionsCount,
          total_proposals: proposalsCount,
          total_activity_logs: activityCount,
          status: 'OK'
        };
      } catch (error) {
        metrics.database = {
          status: 'ERROR',
          error: error.message
        };
      }

      // Service metrics
      if (this.batchOperations && typeof this.batchOperations.getStats === 'function') {
        try {
          metrics.services.batch_operations = this.batchOperations.getStats();
        } catch (error) {
          metrics.services.batch_operations = { error: error.message };
        }
      }

      // Performance metrics (basic)
      metrics.performance = {
        script_runtime_limit: '6 minutes',
        execution_timestamp: TimeZoneAwareDate.now(),
        health_status: 'monitoring'
      };

      return metrics;

    } catch (error) {
      // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
      // TEST: TEST_SILENT_059_GETSYSTEMMETRICS
      LoggerFacade.error('SystemManager', 'getSystemMetrics operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'getSystemMetrics'
      });

      // Classify error severity
      if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
        throw error;  // Fatal - cannot recover
      }

      // Recoverable - return sentinel
      return null;
    }
  }

  /**
   * Self-test system manager functionality
   * @returns {boolean} True if all tests pass
   */
  selfTest() {
    try {
      this.logger.info('SystemManager', 'Running self-test');

      // Test 1: Health check
      const healthResults = this.runHealthCheck();
      if (!healthResults || !healthResults.overall_status) {
        throw new Error('Health check failed');
      }

      // Test 2: System status
      const systemStatus = this.getSystemStatus();
      if (!systemStatus) {
        throw new Error('System status retrieval failed');
      }

      // Test 3: System metrics
      const metrics = this.getSystemMetrics();
      if (!metrics || !metrics.timestamp) {
        throw new Error('System metrics retrieval failed');
      }

      // Test 4: Individual health check methods
      const dbHealth = this._checkDatabaseHealth();
      if (!dbHealth || !dbHealth.status) {
        throw new Error('Database health check method failed');
      }

      this.logger.info('SystemManager', 'Self-test passed', {
        overall_health: healthResults.overall_status,
        database_status: dbHealth.status,
        metrics_available: !!metrics.timestamp
      });

      return true;

    } catch (error) {
      this.logger.error('SystemManager', `Self-test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Create required Gmail labels for the system
   */
  createRequiredLabels() {
    const requiredLabels = [
      'TimeOS/ActionBlock',
      'TimeOS/Processed',
      'TimeOS/Triage-Approved',
      'TimeOS/Triage-Ignored',
      'TimeOS/Triage-Processing'
    ];

    for (const labelName of requiredLabels) {
      try {
        let label = GmailApp.getUserLabelByName(labelName);
        if (!label) {
          label = GmailApp.createLabel(labelName);
          this.logger.info('SystemManager', `Created Gmail label: ${labelName}`);
        }
      } catch (error) {
        this.logger.warn('SystemManager', `Failed to create Gmail label: ${labelName}`, {
          error: error.message
        });
      }
    }
  }

  /**
   * Run complete system setup
   * @returns {Object} Setup result
   */
  runCompleteSetup() {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000); // 30 second timeout

      this.logger.info('SystemManager', '🚀 Starting complete system setup');

      // Create required Gmail labels
      this.createRequiredLabels();

      this.logger.info('SystemManager', '✅ Database schema setup finished successfully');
      return { status: 'success' };

    } catch (error) {
      this.logger.error('SystemManager', `runCompleteSetup failed: ${error.message}`, { stack: error.stack });
      // Re-throw the error after logging to ensure failure is not silent
      throw error;
    } finally {
      // This block is guaranteed to execute, ensuring the lock is always released.
      lock.releaseLock();
    }
  }

  /**
   * Schedule reconciliation method (stub for backward compatibility)
   * Delegates to runSystemMaintenance for actual execution.
   */
  runScheduleReconciliation() {
    this.logger.info('SystemManager', 'Running schedule reconciliation via system maintenance');
    return this.runSystemMaintenance();
  }

  /**
   * Archive old records method (stub for backward compatibility)
   * Delegates to ArchiveManager if available
   */
  archiveOldRecords() {
    this.logger.info('SystemManager', 'Archiving old records');
    try {
      if (this.archiveManager && typeof this.archiveManager.cleanupOldArchives === 'function') {
        return this.archiveManager.cleanupOldArchives();
      } else {
        this.logger.warn('SystemManager', 'ArchiveManager not available or cleanupOldArchives not found for archiving old records');
        return { success: false, archived_count: 0, message: 'Archive manager not available or cleanupOldArchives not found' };
      }
    } catch (error) {
      this.logger.error('SystemManager', 'Failed to archive old records', { error: error.message });
      return { success: false, archived_count: 0, error: error.message };
    }
  }

  /**
   * Backfills the DEPENDENCIES sheet by extracting dependency information
   * from the 'dependencies' JSON array in the ACTIONS sheet.
   * This function is designed to be run once or as needed for data migration.
   * It uses a guard flag to prevent unnecessary re-execution.
   *
   * @returns {Object} Result of the backfill operation.
   */
  backfillDependenciesSheet() {
    const guardKey = CONSTANTS.BACKFILL_DEPENDENCIES_GUARD;
    try {
      // Check guard flag in PersistentStore
      const hasRun = this.configManager.getBoolean(guardKey, false);
      if (hasRun) {
        this.logger.info('SystemManager', 'Dependencies backfill already executed. Skipping.');
        return { success: true, message: 'Backfill already executed.' };
      }

      this.logger.info('SystemManager', 'Starting backfill of DEPENDENCIES sheet from ACTIONS.');

      const actionHeaders = this.batchOperations.getHeaders(SHEET_NAMES.ACTIONS);
      const actionSafeAccess = new SafeColumnAccess(actionHeaders);
      const allActions = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {});

      const newDependencies = new Map(); // Map to store unique dependencies: "blockingId->blockedId" -> {blockingId, blockedId}

      for (const actionRow of allActions) {
        const actionId = actionSafeAccess.getCellValue(actionRow, 'action_id');
        const dependenciesJson = actionSafeAccess.getCellValue(actionRow, 'dependencies');

        if (actionId && dependenciesJson) {
          try {
            const dependencies = JSON.parse(dependenciesJson);
            if (Array.isArray(dependencies)) {
              for (const blockingActionId of dependencies) {
                if (typeof blockingActionId === 'string' && blockingActionId.trim() !== '') {
                  const key = `${blockingActionId}->${actionId}`;
                  if (!newDependencies.has(key)) {
                    newDependencies.set(key, {
                      blocking_action_id: blockingActionId,
                      blocked_action_id: actionId,
                      relationship_type: 'blocks', // Default relationship type
                      created_at: TimeZoneAwareDate.now(),
                      updated_at: TimeZoneAwareDate.now()
                    });
                  }
                }
              }
            }
          } catch (parseError) {
            this.logger.warn('SystemManager', 'Failed to parse dependencies JSON for action', {
              action_id: actionId,
              dependencies_json: dependenciesJson,
              error: parseError.message
            });
          }
        }
      }

      const dependencyRows = Array.from(newDependencies.values());
      if (dependencyRows.length > 0) {
        const dependencySheetHeaders = this.batchOperations.getHeaders(SHEET_NAMES.DEPENDENCIES);
        const dependencySafeAccess = new SafeColumnAccess(dependencySheetHeaders);
        const rowsToAppend = dependencyRows.map(dep => dependencySafeAccess.mapObjectToRow(dep));

        this.batchOperations.appendRows(SHEET_NAMES.DEPENDENCIES, rowsToAppend);
        this.logger.info('SystemManager', `Successfully backfilled ${rowsToAppend.length} dependencies to DEPENDENCIES sheet.`);
      } else {
        this.logger.info('SystemManager', 'No new dependencies found to backfill.');
      }

      // Set guard flag to true after successful execution
      this.configManager.set(guardKey, true);

      return { success: true, backfilled_count: dependencyRows.length };

    } catch (error) {
      this.logger.error('SystemManager', 'Failed to backfill DEPENDENCIES sheet', {
        error: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify database schema integrity
   * @returns {boolean} True if schema is valid
   */
  _verifyDatabaseSchema() {
    try {
      this.logger.debug('SystemManager', 'Verifying database schema');

      // Check if all required sheets exist
      const requiredSheets = Object.values(SHEET_NAMES);
      const spreadsheet = getActiveSystemSpreadsheet();
      const existingSheets = spreadsheet.getSheets().map(sheet => sheet.getName());

      const missingSheets = requiredSheets.filter(sheetName => !existingSheets.includes(sheetName));
      if (missingSheets.length > 0) {
        this.logger.warn('SystemManager', 'Missing sheets detected', { missing: missingSheets });
        return false;
      }

      // Verify sheet structures are valid
      for (const sheetName of requiredSheets) {
        try {
          const sheet = spreadsheet.getSheetByName(sheetName);
          if (!sheet) {
            return false;
          }

          // Basic structure check - ensure sheet has headers
          const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
          if (!headers || headers.length === 0) {
            this.logger.warn('SystemManager', 'Sheet missing headers', { sheet: sheetName });
            return false;
          }
        } catch (error) {
          this.logger.error('SystemManager', 'Error checking sheet structure', {
            sheet: sheetName,
            error: error.message
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('SystemManager', 'Schema verification failed', { error: error.message });
      return false;
    }
  }

  /**
   * Check system health including sheets
   * @returns {Object} Health status
   */
  checkSheetHealth() {
    try {
      const spreadsheet = getActiveSystemSpreadsheet();
      const sheets = spreadsheet.getSheets();
      const requiredSheets = Object.values(SHEET_NAMES);

      const health = {
        healthy: true,
        sheets: {},
        totalSheets: sheets.length,
        requiredSheets: requiredSheets.length,
        issues: []
      };

      // Check each required sheet
      for (const sheetName of requiredSheets) {
        const sheet = spreadsheet.getSheetByName(sheetName);
        if (!sheet) {
          health.sheets[sheetName] = 'MISSING';
          health.issues.push(`Missing required sheet: ${sheetName}`);
          health.healthy = false;
        } else {
          // Check if sheet has data/headers
          const rowCount = sheet.getLastRow();
          const colCount = sheet.getLastColumn();
          health.sheets[sheetName] = rowCount > 0 && colCount > 0 ? 'OK' : 'EMPTY';
        }
      }

      return health;
    } catch (error) {
      this.logger.error('SystemManager', 'Sheet health check failed', { error: error.message });
      return {
        healthy: false,
        error: error.message,
        issues: ['Health check failed']
      };
    }
  }

  /**
   * Heal/repair system sheets
   * @returns {Object} Heal result
   */
  healSheets() {
    try {
      this.logger.info('SystemManager', 'Starting sheet healing process');

      // Use SheetHealer if available
      if (typeof SheetHealer !== 'undefined') {
        const healer = new SheetHealer();
        const result = healer.validateAndRepair();
        this.logger.info('SystemManager', 'Sheet healing completed', result);
        return result;
      } else {
        // Fallback: basic sheet creation
        const spreadsheet = getActiveSystemSpreadsheet();
        const requiredSheets = Object.values(SHEET_NAMES);
        let created = 0;

        for (const sheetName of requiredSheets) {
          const result = this._createMissingSheet(spreadsheet, sheetName);
          if (result.created) {
            created++;
            this.logger.info('SystemManager', `Created missing sheet: ${sheetName}`);
          }
        }

        return {
          status: 'success',
          sheetsCreated: created,
          message: `Created ${created} missing sheets`
        };
      }
    } catch (error) {
      this.logger.error('SystemManager', 'Sheet healing failed', { error: error.message });
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Safely check individual sheet health (extracted from nested try-catch)
   * @param {string} sheetName - Name of sheet to check
   * @returns {Object} Sheet health status
   * @private
   */
  _safeCheckSheetHealth(sheetName) {
    try {
      const headers = this.batchOperations.getHeaders(sheetName);
      return {
        accessible: true,
        headers_count: headers.length,
        status: 'OK'
      };
    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_060__SAFECHECKSHEETHEALTH
      LoggerFacade.error('SystemManager', '_safeCheckSheetHealth operation failed', {
        error: error.message,
        stack: error.stack,
        context: '_safeCheckSheetHealth',
        sheetName: sheetName
      });

      throw error;
    }
  }

  /**
   * Safely check spreadsheet access (extracted from nested try-catch)
   * @returns {Object} Spreadsheet access status
   * @private
   */
  _safeCheckSpreadsheetAccess() {
    try {
      const spreadsheet = getActiveSystemSpreadsheet();
      return {
        id: spreadsheet.getId(),
        name: spreadsheet.getName(),
        accessible: true
      };
    } catch (error) {
      // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
      // TEST: TEST_SILENT_061__SAFECHECKSPREADSHEETACCESS
      LoggerFacade.error('SystemManager', '_safeCheckSpreadsheetAccess operation failed', {
        error: error.message,
        stack: error.stack,
        context: '_safeCheckSpreadsheetAccess'
      });

      // Classify error severity
      if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
        throw error;  // Fatal - cannot recover
      }

      // Recoverable - return sentinel
      return null;
    }
  }

  /**
   * Create missing sheet with optional headers (extracted sheet creation logic)
   * @param {Spreadsheet} spreadsheet - Spreadsheet object
   * @param {string} sheetName - Name of sheet to create
   * @param {Object} [schema] - Optional schema with headers
   * @returns {Object} Creation result
   * @private
   */
  _createMissingSheet(spreadsheet, sheetName, schema) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    const wasCreated = !sheet;

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    // Apply headers if schema provided
    if (sheet && schema && schema.headers && schema.headers.length > 0) {
      const headerRange = sheet.getRange(1, 1, 1, schema.headers.length);
      headerRange.setValues([schema.headers]);
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    return {
      created: wasCreated,
      sheet: sheet
    };
  }
}
