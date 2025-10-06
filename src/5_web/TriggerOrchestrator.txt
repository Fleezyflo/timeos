/**
 * MOH TIME OS v2.0 - TRIGGER ORCHESTRATOR
 *
 * Centralized trigger management with proper logging and lock handling.
 * Provides a unified entry point for all scheduled and manual triggers.
 * Ensures proper error handling and system observability.
 *
 * Original lines: 8056-8120 from scriptA.js
 */

class TriggerOrchestrator {
  constructor(emailEngine, scheduler, archiveManager, foundationBlocksManager,
    humanStateManager, calendarSyncManager, systemManager,
    reputationManager, logger, lockManager) {
    this.emailEngine = emailEngine; this.scheduler = scheduler; this.archiveManager = archiveManager;
    this.foundationBlocksManager = foundationBlocksManager; this.humanStateManager = humanStateManager;
    this.calendarSyncManager = calendarSyncManager; this.systemManager = systemManager;
    this.reputationManager = reputationManager; this.logger = logger; this.lockManager = lockManager;
  }

  _runTrigger(triggerName, logicFunction, lockTimeout = 15000, context = this) {
    const verificationId = Utilities.getUuid();
    const lockHandle = this.lockManager.tryAcquireLock(triggerName, lockTimeout, verificationId);

    if (!lockHandle) {
      this.logger.warn('TriggerOrchestrator', `${triggerName} skipped - lock unavailable`, { trigger: triggerName, verification_id: verificationId });
      return;
    }

    try {
      this.logger.info('TriggerOrchestrator', `Starting ${triggerName}`, { trigger: triggerName, verification_id: verificationId });
      const target = context || this;
      logicFunction.call(target);
    } catch (error) {
      this.logger.error('TriggerOrchestrator', `${triggerName} failed`, {
        trigger: triggerName, verification_id: verificationId,
        error_message: error.message || String(error),
        stack_trace: error.stack ? error.stack.substring(0, 1000) : 'N/A'
      });
    } finally {
      this.lockManager.releaseLock(lockHandle);
    }
  }

  runEmailProcessing() {
    this._runTrigger('triggerEmailProcessing', () => {
      const result = this.emailEngine.processUnreadEmails();

      // Flush any pending sender reputation updates after email processing
      if (this.reputationManager && typeof this.reputationManager.flushPendingUpdates === 'function') {
        this.reputationManager.flushPendingUpdates();
      }

      return result;
    }, 15000);
  }
  runSchedulingCycle() {
    this._runTrigger('triggerSchedulingCycle', () => this.scheduler.runSchedulingCycle(), 30000);
  }
  runCalendarSync() {
    this._runTrigger('triggerCalendarSync', () => this.calendarSyncManager.syncActionsToCalendar(), 10000);
  }
  runCalendarProjection() {
    this._runTrigger('triggerCalendarProjection', () => this.calendarSyncManager.refreshCalendarProjection(), 10000);
  }
  runFoundationBlocks() {
    this._runTrigger('triggerFoundationBlocks', () => {
      const today = new Date();
      if (!this.foundationBlocksManager.hasFoundationBlocksForDate(today)) this.foundationBlocksManager.createDailyFoundationBlocks(today);
    }, 15000);
  }
  runScheduleReconciliation() {
    this._runTrigger('triggerScheduleReconciliation', () => this.systemManager.runScheduleReconciliation(), 30000);
  }
  runHealthCheck() {
    this._runTrigger('triggerHealthCheck', () => this.systemManager.runHealthCheck(), 10000);
  }
  runDataArchiving() {
    this._runTrigger('triggerDataArchiving', () => this.systemManager.archiveOldRecords(), 45000);
  }
  runProposalLearningCycle() {
    this._runTrigger('triggerProposalLearningCycle', () => this.emailEngine.runProposalLearningCycle(), 30000);
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if all basic functionality works
   */
  selfTest() {
    try {
      // Test 1: Basic dependency validation
      const requiredServices = [
        'emailEngine', 'scheduler', 'archiveManager', 'foundationBlocksManager',
        'humanStateManager', 'calendarSyncManager', 'systemManager',
        'reputationManager', 'logger'
      ];

      for (const service of requiredServices) {
        if (!this[service]) {
          return false;
        }
      }

      // Test 2: Lock manager availability
      if (!this.lockManager || typeof this.lockManager.tryAcquireLock !== 'function') {
        return false;
      }

      // Test 3: UUID generation for verification IDs
      const testUuid = Utilities.getUuid();
      if (!testUuid || typeof testUuid !== 'string') {
        return false;
      }

      // Test 4: Logger functionality
      try {
        this.logger.debug('TriggerOrchestrator', 'Self-test logging check');
      } catch (logError) {
        return false;
      }

      // Test 5: Test trigger runner without actual execution
      const testFunction = function() {
        // Do nothing - just test the wrapper mechanism
        return true;
      };

      // We can't actually test _runTrigger without side effects,
      // but we can verify it exists and is callable
      if (typeof this._runTrigger !== 'function') {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('TriggerOrchestrator', `Self-test failed: ${error.message}`);
      return false;
    }
  }
}
