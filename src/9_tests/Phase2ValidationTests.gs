/**
 * MOH TIME OS v2.0 - PHASE 2 VALIDATION TESTS
 *
 * Tests for Phase 2 data backfill and integrity features:
 * - Version column backfill
 * - JSON column sanitization
 * - Schema integrity validation
 */

/**
 * Run all Phase 2 validation tests
 * @returns {Object} Test results
 */
function RUN_PHASE2_VALIDATION_TESTS() {
  const results = {
    timestamp: new Date().toISOString(),
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    tests: []
  };

  Logger.log('=== Starting Phase 2 Validation Tests ===');

  // Test 1: Version Backfill with Mock Data
  runTest(results, 'Version Backfill', function() {
    const cache = {
      get: function() { return null; },
      set: function() {},
      delete: function() {},
      clear: function() {}
    };
    const logger = {
      info: function() {},
      debug: function() {},
      warn: function() {},
      error: function() {}
    };

    const mockBatchOps = new MockBatchOperations(cache, logger);
    mockBatchOps.seedPhase2TestData();

    const actionsHeaders = mockBatchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const versionColIndex = actionsHeaders.indexOf('version');
    const allRows = mockBatchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, {});

    // Count rows with missing versions
    let missingVersionCount = 0;
    for (const rowData of allRows) {
      const versionValue = rowData.row[versionColIndex];
      if (!versionValue || versionValue === '') {
        missingVersionCount++;
      }
    }

    // Should have 2 rows with missing versions (test_action_1 and test_action_2)
    if (missingVersionCount !== 2) {
      throw new Error('Expected 2 rows with missing versions, found: ' + missingVersionCount);
    }

    return { success: true, missingVersions: missingVersionCount };
  });

  // Test 2: JSON Sanitization Detection (Arrays vs Objects)
  runTest(results, 'JSON Sanitization Detection', function() {
    const cache = {
      get: function() { return null; },
      set: function() {},
      delete: function() {},
      clear: function() {}
    };
    const logger = {
      info: function() {},
      debug: function() {},
      warn: function() {},
      error: function() {}
    };

    const mockBatchOps = new MockBatchOperations(cache, logger);
    mockBatchOps.seedPhase2TestData();

    const actionsHeaders = mockBatchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const dependenciesColIndex = actionsHeaders.indexOf('dependencies');
    const tagsColIndex = actionsHeaders.indexOf('tags');
    const schedulingMetadataColIndex = actionsHeaders.indexOf('scheduling_metadata');
    const lastScheduledMetadataColIndex = actionsHeaders.indexOf('last_scheduled_metadata');
    const allRows = mockBatchOps.getRowsWithPosition(SHEET_NAMES.ACTIONS, {});

    let arrayFieldsNeedingSanitization = 0;
    let objectFieldsNeedingSanitization = 0;

    for (const rowData of allRows) {
      // Check array columns
      const arrayColumns = [
        { index: dependenciesColIndex, value: rowData.row[dependenciesColIndex] },
        { index: tagsColIndex, value: rowData.row[tagsColIndex] }
      ];

      for (const col of arrayColumns) {
        if (col.index !== -1) {
          if (!col.value || col.value === '' || col.value === null) {
            arrayFieldsNeedingSanitization++;
          } else if (typeof col.value === 'string') {
            try {
              JSON.parse(col.value);
            } catch (e) {
              arrayFieldsNeedingSanitization++;
            }
          }
        }
      }

      // Check object columns
      const objectColumns = [
        { index: schedulingMetadataColIndex, value: rowData.row[schedulingMetadataColIndex] },
        { index: lastScheduledMetadataColIndex, value: rowData.row[lastScheduledMetadataColIndex] }
      ];

      for (const col of objectColumns) {
        if (col.index !== -1) {
          if (!col.value || col.value === '' || col.value === null) {
            objectFieldsNeedingSanitization++;
          } else if (typeof col.value === 'string') {
            try {
              JSON.parse(col.value);
            } catch (e) {
              objectFieldsNeedingSanitization++;
            }
          }
        }
      }
    }

    // Should have at least 2 array fields and 1 object field needing sanitization
    if (arrayFieldsNeedingSanitization < 2) {
      throw new Error('Expected at least 2 array fields needing sanitization, found: ' + arrayFieldsNeedingSanitization);
    }

    if (objectFieldsNeedingSanitization < 1) {
      throw new Error('Expected at least 1 object field needing sanitization, found: ' + objectFieldsNeedingSanitization);
    }

    return {
      success: true,
      arrayFieldsNeedingSanitization: arrayFieldsNeedingSanitization,
      objectFieldsNeedingSanitization: objectFieldsNeedingSanitization
    };
  });

  // Test 3: Schema Integrity Validation
  runTest(results, 'Schema Integrity Validation', function() {
    if (typeof container === 'undefined') {
      throw new Error('Container not available for schema validation test');
    }

    const systemManager = container.get(SERVICES.SystemManager);
    if (!systemManager) {
      throw new Error('SystemManager not available');
    }

    const schemaValidation = systemManager.validateSchemaIntegrity();

    if (!schemaValidation) {
      throw new Error('Schema validation returned null');
    }

    if (typeof schemaValidation.allValid !== 'boolean') {
      throw new Error('Schema validation result missing allValid property');
    }

    if (typeof schemaValidation.schemasChecked !== 'number') {
      throw new Error('Schema validation result missing schemasChecked property');
    }

    return {
      success: true,
      allValid: schemaValidation.allValid,
      schemasChecked: schemaValidation.schemasChecked,
      discrepancies: schemaValidation.discrepancies.length
    };
  });

  // Test 4: Guard Flags Check
  runTest(results, 'Phase 2 Guard Flags', function() {
    if (typeof container === 'undefined') {
      throw new Error('Container not available for guard flag test');
    }

    const configManager = container.get(SERVICES.ConfigManager);
    if (!configManager) {
      throw new Error('ConfigManager not available');
    }

    // Check if guard flags exist (they may or may not be set yet)
    const versionBackfillGuard = configManager.getBoolean('PHASE2_VERSION_BACKFILL_COMPLETE', false);
    const jsonSanitizationGuard = configManager.getBoolean('PHASE2_JSON_SANITIZATION_COMPLETE', false);

    // Both should be booleans
    if (typeof versionBackfillGuard !== 'boolean') {
      throw new Error('Version backfill guard is not a boolean');
    }

    if (typeof jsonSanitizationGuard !== 'boolean') {
      throw new Error('JSON sanitization guard is not a boolean');
    }

    return {
      success: true,
      versionBackfillComplete: versionBackfillGuard,
      jsonSanitizationComplete: jsonSanitizationGuard
    };
  });

  // Test 5: Batch Update Safety (Mock)
  runTest(results, 'Batch Update Safety', function() {
    const cache = {
      get: function() { return null; },
      set: function() {},
      delete: function() {},
      clear: function() {}
    };
    const logger = {
      info: function() {},
      debug: function() {},
      warn: function() {},
      error: function() {}
    };

    const mockBatchOps = new MockBatchOperations(cache, logger);
    mockBatchOps.seedPhase2TestData();

    // Simulate a batch update of > 200 rows (test batch limit logic)
    const actionsHeaders = mockBatchOps.getHeaders(SHEET_NAMES.ACTIONS);
    const versionColIndex = actionsHeaders.indexOf('version');

    // Create 250 update requests
    const updates = [];
    for (let i = 0; i < 250; i++) {
      const colLetter = String.fromCharCode(65 + versionColIndex);
      updates.push({
        rangeA1: colLetter + (i + 2) + ':' + colLetter + (i + 2),
        values: [[1]]
      });
    }

    // Should not throw even with > 200 updates
    // (Real implementation batches them; mock just applies all)
    try {
      mockBatchOps.batchUpdate(SHEET_NAMES.ACTIONS, updates);
    } catch (e) {
      throw new Error('Batch update failed with 250 updates: ' + e.message);
    }

    return { success: true, updatesApplied: 250 };
  });

  // Summary
  Logger.log('\n=== Phase 2 Validation Test Summary ===');
  Logger.log('Tests Run: ' + results.testsRun);
  Logger.log('Tests Passed: ' + results.testsPassed);
  Logger.log('Tests Failed: ' + results.testsFailed);
  Logger.log('======================================\n');

  return results;
}

/**
 * Helper to run a single test
 * @private
 */
function runTest(results, testName, testFn) {
  results.testsRun++;

  try {
    Logger.log('\nRunning test: ' + testName);
    const testResult = testFn();

    results.testsPassed++;
    results.tests.push({
      name: testName,
      status: 'PASSED',
      result: testResult
    });

    Logger.log('✅ ' + testName + ' PASSED');
    if (testResult.success) {
      Logger.log('   Result: ' + JSON.stringify(testResult));
    }
  } catch (error) {
    results.testsFailed++;
    results.tests.push({
      name: testName,
      status: 'FAILED',
      error: error.message,
      stack: error.stack
    });

    Logger.log('❌ ' + testName + ' FAILED');
    Logger.log('   Error: ' + error.message);
  }
}
