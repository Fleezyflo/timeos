/**
 * MOH TIME OS v2.0 - PHASE 2 MIGRATION VERIFICATION
 *
 * Verifies that Phase 2 data backfill migrations have been executed correctly.
 * This script checks:
 * 1. Version column backfill status
 * 2. JSON column sanitization status
 * 3. Schema integrity alignment
 */

/**
 * Main verification function - run this to check Phase 2 migration status
 * @returns {Object} Verification results with status and details
 */
function verifyPhase2MigrationsComplete() {
  const results = {
    timestamp: TimeZoneAwareDate.now(),
    overall_status: 'CHECKING',
    checks: {},
    recommendations: []
  };

  Logger.log('=== PHASE 2 MIGRATION VERIFICATION ===\n');

  try {
    // Check 1: Version Column Backfill
    Logger.log('Check 1: Version Column Backfill Status...');
    const versionCheck = checkVersionBackfillStatus();
    results.checks.version_backfill = versionCheck;
    Logger.log(`✓ Version backfill: ${versionCheck.status}`);
    Logger.log(`  - Missing versions: ${versionCheck.missing_count}`);
    if (versionCheck.missing_count > 0) {
      results.recommendations.push('Run backfillActionVersions() to populate missing version values');
    }

    // Check 2: JSON Column Sanitization
    Logger.log('\nCheck 2: JSON Column Sanitization Status...');
    const jsonCheck = checkJsonSanitizationStatus();
    results.checks.json_sanitization = jsonCheck;
    Logger.log(`✓ JSON sanitization: ${jsonCheck.status}`);
    Logger.log(`  - Total issues: ${jsonCheck.total_issues}`);
    if (jsonCheck.total_issues > 0) {
      results.recommendations.push('Run backfillJsonDefaults() to sanitize JSON columns');
    }

    // Check 3: Schema Integrity
    Logger.log('\nCheck 3: Schema Integrity Alignment...');
    const schemaCheck = checkSchemaIntegrity();
    results.checks.schema_integrity = schemaCheck;
    Logger.log(`✓ Schema integrity: ${schemaCheck.status}`);
    Logger.log(`  - Sheets with differences: ${schemaCheck.sheets_with_differences}`);
    if (schemaCheck.sheets_with_differences > 0) {
      results.recommendations.push('Run applySchemaFixes() to align sheet headers with canonical schemas');
    }

    // Overall status
    const allPassed =
      versionCheck.missing_count === 0 &&
      jsonCheck.total_issues === 0 &&
      schemaCheck.sheets_with_differences === 0;

    results.overall_status = allPassed ? 'PASSED' : 'ACTION_REQUIRED';

    Logger.log('\n=== VERIFICATION SUMMARY ===');
    Logger.log(`Overall Status: ${results.overall_status}`);
    if (results.recommendations.length > 0) {
      Logger.log('\nRecommendations:');
      results.recommendations.forEach((rec, idx) => {
        Logger.log(`  ${idx + 1}. ${rec}`);
      });
    } else {
      Logger.log('✅ All Phase 2 migrations complete and verified!');
    }

    return results;

  } catch (error) {
    Logger.log(`❌ Verification failed: ${error.message}`);
    results.overall_status = 'ERROR';
    results.error = error.message;
    return results;
  }
}

/**
 * Check version backfill status
 * @returns {Object} Version backfill check results
 */
function checkVersionBackfillStatus() {
  try {
    if (typeof previewMissingVersions === 'function') {
      const preview = previewMissingVersions();
      return {
        status: preview.missing_version_count === 0 ? 'COMPLETE' : 'INCOMPLETE',
        missing_count: preview.missing_version_count,
        sample_action_ids: preview.sample_action_ids || []
      };
    } else {
      return {
        status: 'UNKNOWN',
        missing_count: -1,
        note: 'previewMissingVersions() function not found - ensure BackfillActionVersions.gs is loaded'
      };
    }
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}

/**
 * Check JSON sanitization status
 * @returns {Object} JSON sanitization check results
 */
function checkJsonSanitizationStatus() {
  try {
    if (typeof previewJsonIssues === 'function') {
      const preview = previewJsonIssues('ACTIONS');
      const totalIssues = Object.values(preview.issues_by_column || {})
        .reduce((sum, col) => sum + (col.total_issues || 0), 0);

      return {
        status: totalIssues === 0 ? 'COMPLETE' : 'INCOMPLETE',
        total_issues: totalIssues,
        issues_by_column: preview.issues_by_column || {}
      };
    } else {
      return {
        status: 'UNKNOWN',
        total_issues: -1,
        note: 'previewJsonIssues() function not found - ensure BackfillJsonDefaults.gs is loaded'
      };
    }
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}

/**
 * Check schema integrity
 * @returns {Object} Schema integrity check results
 */
function checkSchemaIntegrity() {
  try {
    if (typeof previewSchemaDiff === 'function') {
      const preview = previewSchemaDiff();
      return {
        status: preview.sheets_with_differences === 0 ? 'ALIGNED' : 'MISALIGNED',
        sheets_with_differences: preview.sheets_with_differences,
        differences: preview.differences || []
      };
    } else {
      return {
        status: 'UNKNOWN',
        sheets_with_differences: -1,
        note: 'previewSchemaDiff() function not found - ensure MigrateSheetSchemas.gs is loaded'
      };
    }
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}

/**
 * Generate execution evidence log for documentation
 * @param {Object} verificationResults - Results from verifyPhase2MigrationsComplete()
 * @returns {string} Formatted execution log
 */
function generateExecutionLog(verificationResults) {
  const log = [];

  log.push('## Phase 2 Migration Execution Log');
  log.push('');
  log.push(`**Date**: ${verificationResults.timestamp}`);
  log.push(`**Status**: ${verificationResults.overall_status}`);
  log.push('');

  log.push('### Verification Results');
  log.push('');

  // Version backfill
  const versionCheck = verificationResults.checks.version_backfill || {};
  log.push(`**Version Backfill**: ${versionCheck.status}`);
  log.push(`- Missing versions: ${versionCheck.missing_count || 0}`);
  if (versionCheck.sample_action_ids && versionCheck.sample_action_ids.length > 0) {
    log.push(`- Sample action IDs: ${versionCheck.sample_action_ids.join(', ')}`);
  }
  log.push('');

  // JSON sanitization
  const jsonCheck = verificationResults.checks.json_sanitization || {};
  log.push(`**JSON Sanitization**: ${jsonCheck.status}`);
  log.push(`- Total issues: ${jsonCheck.total_issues || 0}`);
  if (jsonCheck.issues_by_column) {
    log.push('- Issues by column:');
    Object.entries(jsonCheck.issues_by_column).forEach(([col, data]) => {
      if (data.total_issues > 0) {
        log.push(`  - ${col}: ${data.total_issues} issues`);
      }
    });
  }
  log.push('');

  // Schema integrity
  const schemaCheck = verificationResults.checks.schema_integrity || {};
  log.push(`**Schema Integrity**: ${schemaCheck.status}`);
  log.push(`- Sheets with differences: ${schemaCheck.sheets_with_differences || 0}`);
  log.push('');

  // Recommendations
  if (verificationResults.recommendations && verificationResults.recommendations.length > 0) {
    log.push('### Recommendations');
    log.push('');
    verificationResults.recommendations.forEach((rec, idx) => {
      log.push(`${idx + 1}. ${rec}`);
    });
    log.push('');
  }

  return log.join('\n');
}

/**
 * Convenience function - run verification and display execution log
 */
function VERIFY_PHASE2_AND_LOG() {
  const results = verifyPhase2MigrationsComplete();
  const log = generateExecutionLog(results);

  Logger.log('\n=== EXECUTION LOG ===\n');
  Logger.log(log);

  return {
    verification: results,
    execution_log: log
  };
}
