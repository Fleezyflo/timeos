/**
 * MOH TIME OS v2.0 - AUDIT PROTOCOL SERVICE
 *
 * Provides comprehensive system auditing and compliance logging.
 * Tracks all significant system events for security and debugging.
 */

class AuditProtocol {
  constructor(batchOperations, logger, persistentStore) {
    this.batchOperations = batchOperations;
    this.logger = logger;
    this.persistentStore = persistentStore;
    this.auditCache = [];
    this.flushInterval = 5000; // 5 seconds
  }

  /**
   * Log an audit event
   * @param {string} eventType - Type of event
   * @param {Object} details - Event details
   * @returns {string} Audit entry ID
   */
  logAuditEvent(eventType, details) {
    try {
      const auditEntry = {
        timestamp: TimeZoneAwareDate.now(),
        eventType,
        user: Session.getActiveUser().getEmail(),
        details: JSON.stringify(details),
        id: Utilities.getUuid(),
        severity: this._determineSeverity(eventType)
      };

      // Add to cache for batch writing
      this.auditCache.push([
        auditEntry.id,
        auditEntry.timestamp,
        auditEntry.eventType,
        auditEntry.user,
        auditEntry.details,
        auditEntry.severity
      ]);

      // Flush cache if needed
      if (this.auditCache.length >= 10) {
        this._flushAuditCache();
      }

      this.logger.info('AuditProtocol', 'Audit event logged', {
        eventType,
        id: auditEntry.id
      });

      return auditEntry.id;
    } catch (error) {
      this.logger.error('AuditProtocol', 'Failed to log audit event', {
        eventType,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Flush audit cache to sheet
   * @private
   */
  _flushAuditCache() {
    if (this.auditCache.length === 0) return;

    try {
      this.batchOperations.appendRows(SHEET_NAMES.ACTIVITY, this.auditCache);
      this.auditCache = [];
    } catch (error) {
      this.logger.error('AuditProtocol', 'Failed to flush audit cache', {
        error: error.message,
        cacheSize: this.auditCache.length
      });
    }
  }

  /**
   * Determine event severity
   * @private
   */
  _determineSeverity(eventType) {
    const severityMap = {
      'ERROR': 'HIGH',
      'SECURITY': 'HIGH',
      'DELETE': 'MEDIUM',
      'UPDATE': 'LOW',
      'CREATE': 'LOW',
      'VIEW': 'INFO'
    };

    for (const [key, severity] of Object.entries(severityMap)) {
      if (eventType.toUpperCase().includes(key)) {
        return severity;
      }
    }
    return 'INFO';
  }

  /**
   * Get audit trail with filters
   * @param {Object} filters - Filter criteria
   * @returns {Array} Audit entries
   */
  getAuditTrail(filters = {}) {
    try {
      // Flush any pending entries first
      this._flushAuditCache();

      const logs = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIVITY, filters);
      return logs.map(log => ({
        id: log[0],
        timestamp: log[1],
        eventType: log[2],
        user: log[3],
        details: JSON.parse(log[4] || '{}'),
        severity: log[5] || 'INFO'
      }));
    } catch (error) {
      this.logger.error('AuditProtocol', 'Failed to retrieve audit trail', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Generate audit report
   * @param {Date} startDate - Report start date
   * @param {Date} endDate - Report end date
   * @returns {Object} Audit report summary
   */
  generateAuditReport(startDate, endDate) {
    const logs = this.getAuditTrail();
    const filtered = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });

    const summary = {
      totalEvents: filtered.length,
      byType: {},
      byUser: {},
      bySeverity: {},
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      criticalEvents: []
    };

    filtered.forEach(log => {
      summary.byType[log.eventType] = (summary.byType[log.eventType] || 0) + 1;
      summary.byUser[log.user] = (summary.byUser[log.user] || 0) + 1;
      summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;

      if (log.severity === 'HIGH') {
        summary.criticalEvents.push({
          timestamp: log.timestamp,
          type: log.eventType,
          user: log.user
        });
      }
    });

    return summary;
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if service works correctly
   */
  selfTest() {
    try {
      // Test audit logging
      const testId = this.logAuditEvent('TEST_EVENT', { test: true });
      if (!testId) return false;

      // Test severity determination
      const severity = this._determineSeverity('ERROR_TEST');
      if (severity !== 'HIGH') return false;

      return true;
    } catch (error) {
      this.logger.error('AuditProtocol', 'Self-test failed', { error: error.message });
      return false;
    }
  }
}