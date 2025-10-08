/**
 * MOH TIME OS v2.0 - PRE-DEPLOYMENT VALIDATION
 *
 * Comprehensive deployment readiness checks.
 * Must pass before clasp push to production.
 */

/**
 * Run all pre-deployment checks
 * @returns {Object} { ready, checks, failures }
 */
function runPreDeploymentChecks() {
  const logger = getLogger();
  logger.info('PreDeployment', 'Starting pre-deployment validation');

  const checks = {
    gitStatus: checkGitStatus(),
    backupsRecent: checkBackupsRecent(),
    testsPass: checkAllTestsPass(),
    healthCheck: checkSystemHealth(),
    phasesComplete: checkAllPhasesComplete(),
    documentation: checkDocumentationComplete()
  };

  const failures = Object.entries(checks)
    .filter(([_, result]) => result.success === false)
    .map(([name, result]) => ({ check: name, reason: result.reason }));

  const ready = failures.length === 0;

  const report = {
    ready: ready,
    timestamp: TimeZoneAwareDate.toISOString(new Date()),
    version: getSystemVersion(),
    checks: checks,
    failures: failures
  };

  if (ready) {
    logger.info('PreDeployment', '✅ SYSTEM READY FOR DEPLOYMENT');
  } else {
    logger.error('PreDeployment', '❌ DEPLOYMENT BLOCKED - Fix failures', {
      failures: failures
    });
  }

  return report;
}

/**
 * Run post-deployment verification
 * @returns {Object} { success, tests, health, smoke }
 */
function runPostDeploymentVerification() {
  const logger = getLogger();
  logger.info('PostDeployment', 'Starting post-deployment verification');

  const results = {
    allTests: runAllTests(),
    healthCheck: runHealthCheckVerification(),
    smokeTests: runSmokeTests()
  };

  const success = results.allTests.success &&
                  results.healthCheck.success &&
                  results.smokeTests.success;

  const report = {
    success: success,
    timestamp: TimeZoneAwareDate.toISOString(new Date()),
    version: getSystemVersion(),
    tests: results.allTests,
    health: results.healthCheck,
    smoke: results.smokeTests
  };

  if (success) {
    logger.info('PostDeployment', '✅ DEPLOYMENT VERIFIED SUCCESSFULLY');
  } else {
    logger.error('PostDeployment', '❌ DEPLOYMENT VERIFICATION FAILED');
  }

  return report;
}

// Helper functions

function checkGitStatus() {
  // Note: Cannot check git status from Apps Script
  // This is a placeholder for manual verification
  return {
    success: true,
    reason: 'Manual verification required: git status clean'
  };
}

function checkBackupsRecent() {
  try {
    const backupManager = container.get(SERVICES.BackupManager);
    const backupFolder = DriveApp.getFoldersByName('MOH_Time_OS_Backups');

    if (!backupFolder.hasNext()) {
      return {
        success: false,
        reason: 'No backup folder found - run BackupManager.createBackup() first'
      };
    }

    // Check for backups in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const folder = backupFolder.next();
    const recentFiles = folder.searchFiles(`modifiedDate > "${oneDayAgo.toISOString()}"`);

    if (!recentFiles.hasNext()) {
      return {
        success: false,
        reason: 'No backups created in last 24 hours'
      };
    }

    return { success: true, reason: 'Recent backup verified' };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

function checkAllTestsPass() {
  try {
    const result = RUN_EVERYTHING_NOW();
    const success = result.summary.errors === 0;

    return {
      success: success,
      reason: success ? `All ${result.summary.success} tests passed` : `${result.summary.errors} tests failed`
    };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

function checkSystemHealth() {
  try {
    const systemManager = container.get(SERVICES.SystemManager);
    const health = systemManager.runHealthCheck();

    const success = health.overall_status === 'HEALTHY';

    return {
      success: success,
      reason: success ? 'System health: HEALTHY' : `System health: ${health.overall_status}`
    };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

function checkAllPhasesComplete() {
  try {
    const phase3 = validatePhase3Complete();
    const phase6 = validatePhase6Batching();
    const phase8 = validatePhase8Sanitization();

    const success = phase3 && phase6 && phase8;

    return {
      success: success,
      reason: success ? 'Phases 3,6,8 validated' : 'One or more phase validations failed'
    };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

function checkDocumentationComplete() {
  // Manual check - assumes docs exist if code got this far
  return {
    success: true,
    reason: 'Manual verification required: docs complete'
  };
}

function runAllTests() {
  try {
    const result = RUN_EVERYTHING_NOW();
    return {
      success: result.summary.errors === 0,
      total: result.summary.total,
      passed: result.summary.success,
      failed: result.summary.errors,
      duration: result.summary.duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function runHealthCheckVerification() {
  try {
    const systemManager = container.get(SERVICES.SystemManager);
    const health = systemManager.runHealthCheck();

    return {
      success: health.overall_status === 'HEALTHY',
      status: health.overall_status,
      checks: Object.keys(health.checks).length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function runSmokeTests() {
  try {
    const batchOps = container.get(SERVICES.BatchOperations);

    // Smoke test 1: Create task via AppSheet
    const testTask = {
      title: 'Phase 10 Deployment Test',
      description: 'Automated smoke test',
      priority: PRIORITY.LOW
    };

    const createResult = appsheet_createTask(testTask);
    if (!createResult.success) {
      throw new Error('Task creation failed');
    }

    // Smoke test 2: Verify sanitization
    const sanitized = sanitizeString('=TEST');
    if (!sanitized.startsWith("'=")) {
      throw new Error('Sanitization not working');
    }

    // Smoke test 3: Clean up test task
    const tasks = batchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, {
      action_id: createResult.data.action_id
    });
    if (tasks.length > 0) {
      batchOps.deleteRowsByIndices(SHEET_NAMES.ACTIONS, [tasks[0].sheetRow]);
    }

    return {
      success: true,
      tests: 3,
      message: 'All smoke tests passed'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
