/**
 * MOH TIME OS v2.0 - SCHEMA INTEGRITY TESTS
 *
 * Phase 2: Data Backfill & Integrity Guard Rails
 * Tests schema validation, JSON sanitization, and version backfill utilities
 */

/**
 * Test that SheetHealer canonical schemas match expected ACTIONS structure
 */
function testSchemaHeadersMatchCanonical() {
  const testName = 'testSchemaHeadersMatchCanonical';
  Logger.log(`\n=== ${testName} ===`);

  try {
    // Get canonical schema from SheetHealer
    const requiredSheets = SheetHealer.getRequiredSheets();
    const actionsSchema = requiredSheets['ACTIONS'];

    if (!actionsSchema || !actionsSchema.headers) {
      throw new Error('ACTIONS schema not found in SheetHealer');
    }

    // Verify expected structure
    const headers = actionsSchema.headers;

    // Test 1: Column count
    const expectedCount = 53;
    if (headers.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} columns, got ${headers.length}`);
    }

    // Test 2: Key columns in correct positions
    const keyPositions = {
      'action_id': 0,
      'status': 1,
      'completed_date': 12,
      'completion_notes': 13,  // Phase 1 fix - after completed_date
      'created_by': 14,
      'assigned_to': 15,
      'parent_id': 16,
      'source': 17,
      'version': 28,
      'last_scheduled_score': 29,
      'dependencies': 50,
      'tags': 51,
      'archived_at': 52
    };

    for (const [fieldName, expectedIndex] of Object.entries(keyPositions)) {
      if (headers[expectedIndex] !== fieldName) {
        throw new Error(
          `Expected '${fieldName}' at position ${expectedIndex}, found '${headers[expectedIndex]}'`
        );
      }
    }

    // Test 3: All last_scheduled_* fields present
    const lastScheduledFields = headers.filter(h => h.startsWith('last_scheduled_'));
    if (lastScheduledFields.length !== 20) {
      throw new Error(`Expected 20 last_scheduled_* fields, found ${lastScheduledFields.length}`);
    }

    Logger.log(`✓ ${testName} PASSED`);
    return { success: true, test: testName };

  } catch (error) {
    Logger.log(`✗ ${testName} FAILED: ${error.message}`);
    return { success: false, test: testName, error: error.message };
  }
}

/**
 * Test BatchOperations.sanitizeJsonColumns with mock data
 */
function testBatchOperationsJsonSanitization() {
  const testName = 'testBatchOperationsJsonSanitization';
  Logger.log(`\n=== ${testName} ===`);

  try {
    // Create mock BatchOperations with test data
    const mockCache = {
      get: function() { return null; },
      set: function() {}
    };
    const mockLogger = {
      info: function(module, msg, data) {
        Logger.log(`[INFO] ${module}: ${msg} ${JSON.stringify(data || {})}`);
      },
      warn: function(module, msg) {
        Logger.log(`[WARN] ${module}: ${msg}`);
      },
      error: function(module, msg, data) {
        Logger.log(`[ERROR] ${module}: ${msg} ${JSON.stringify(data || {})}`);
      }
    };

    const batchOps = new MockBatchOperations(mockCache, mockLogger);

    // Seed test data with malformed JSON
    const testData = [
      ['task1', 'NOT_STARTED', 'MEDIUM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '{}', '[]', ''],  // Valid JSON
      ['task2', 'IN_PROGRESS', 'HIGH', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'invalid-json', 'not-array', ''],  // Invalid JSON
      ['task3', 'COMPLETED', 'LOW', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']  // Empty JSON
    ];

    batchOps.appendRows('ACTIONS', testData);

    // Run sanitization
    const columnNames = ['scheduling_metadata', 'dependencies'];
    const defaultsMap = {
      'scheduling_metadata': '{}',
      'dependencies': '[]'
    };

    const result = batchOps.sanitizeJsonColumns('ACTIONS', columnNames, defaultsMap);

    // Verify results
    if (result.patches_applied !== 3) {
      throw new Error(`Expected 3 patches, got ${result.patches_applied}`);
    }

    if (result.patches_by_column['scheduling_metadata'] !== 2) {
      throw new Error('Expected 2 scheduling_metadata patches');
    }

    if (result.patches_by_column['dependencies'] !== 1) {
      throw new Error('Expected 1 dependencies patch');
    }

    // Verify data was actually fixed
    const fixedData = batchOps.getAllSheetData('ACTIONS');
    const row2 = fixedData[1];
    const schedulingMetadataIdx = 22;
    const dependenciesIdx = 50;

    if (row2[schedulingMetadataIdx] !== '{}') {
      throw new Error('scheduling_metadata not fixed for task2');
    }

    if (row2[dependenciesIdx] !== '[]') {
      throw new Error('dependencies not fixed for task2');
    }

    Logger.log(`✓ ${testName} PASSED`);
    return { success: true, test: testName, patches_applied: result.patches_applied };

  } catch (error) {
    Logger.log(`✗ ${testName} FAILED: ${error.message}`);
    return { success: false, test: testName, error: error.message };
  }
}

/**
 * Test version backfill logic with mock data
 */
function testVersionBackfill() {
  const testName = 'testVersionBackfill';
  Logger.log(`\n=== ${testName} ===`);

  try {
    // This test verifies the logic, not the actual backfill function
    // (which requires real spreadsheet access)

    // Test data: version column at index 28
    const testRows = [
      { action_id: 'task1', version: 1 },      // Already has version
      { action_id: 'task2', version: '' },     // Empty
      { action_id: 'task3', version: null },   // Null
      { action_id: 'task4', version: NaN },    // NaN
      { action_id: 'task5', version: 0 },      // Invalid (< 1)
      { action_id: 'task6', version: 2.5 }     // Invalid (not integer)
    ];

    // Simulate backfill logic
    let patchCount = 0;
    for (const row of testRows) {
      const version = row.version;
      const needsFix = version === '' || version === null || isNaN(version) ||
                       typeof version !== 'number' || version < 1 || !Number.isInteger(version);

      if (needsFix) {
        row.version = 1;
        patchCount++;
      }
    }

    // Verify expected patch count
    const expectedPatches = 5;  // task2, task3, task4, task5, task6
    if (patchCount !== expectedPatches) {
      throw new Error(`Expected ${expectedPatches} patches, got ${patchCount}`);
    }

    // Verify all versions are now valid
    for (const row of testRows) {
      if (row.version !== 1 && row.version !== 2) {
        throw new Error(`Invalid version after patch: ${row.version} for ${row.action_id}`);
      }
    }

    Logger.log(`✓ ${testName} PASSED - ${patchCount} rows would be patched`);
    return { success: true, test: testName, patches_simulated: patchCount };

  } catch (error) {
    Logger.log(`✗ ${testName} FAILED: ${error.message}`);
    return { success: false, test: testName, error: error.message };
  }
}

/**
 * Test SystemManager._validateHeadersOrThrow
 */
function testSystemManagerSchemaValidation() {
  const testName = 'testSystemManagerSchemaValidation';
  Logger.log(`\n=== ${testName} ===`);

  try {
    // Get container and SystemManager
    if (typeof container === 'undefined') {
      throw new Error('Container not initialized - cannot test SystemManager');
    }

    const systemManager = container.get(SERVICES.SystemManager);
    if (!systemManager) {
      throw new Error('SystemManager service not available');
    }

    // Test 1: Valid headers should not throw
    const actionsSchema = SheetHealer.getRequiredSheets()['ACTIONS'];
    const validHeaders = actionsSchema.headers;

    try {
      systemManager._validateHeadersOrThrow('ACTIONS', validHeaders);
      Logger.log('✓ Valid headers passed validation');
    } catch (error) {
      throw new Error('Valid headers failed validation: ' + error.message);
    }

    // Test 2: Wrong count should throw
    const invalidCountHeaders = validHeaders.slice(0, 50);  // Missing 3 columns
    try {
      systemManager._validateHeadersOrThrow('ACTIONS', invalidCountHeaders);
      throw new Error('Should have thrown on wrong header count');
    } catch (error) {
      if (!error.message.includes('Header count mismatch')) {
        throw new Error('Wrong error for header count: ' + error.message);
      }
      Logger.log('✓ Wrong count correctly detected');
    }

    // Test 3: Wrong order should throw
    const invalidOrderHeaders = validHeaders.slice();
    invalidOrderHeaders[13] = 'wrong_field';  // Corrupt completion_notes position
    try {
      systemManager._validateHeadersOrThrow('ACTIONS', invalidOrderHeaders);
      throw new Error('Should have thrown on wrong header order');
    } catch (error) {
      if (!error.message.includes('Header mismatch at position')) {
        throw new Error('Wrong error for header order: ' + error.message);
      }
      Logger.log('✓ Wrong order correctly detected');
    }

    Logger.log(`✓ ${testName} PASSED`);
    return { success: true, test: testName };

  } catch (error) {
    Logger.log(`✗ ${testName} FAILED: ${error.message}`);
    return { success: false, test: testName, error: error.message };
  }
}

/**
 * Run all schema integrity tests
 */
function RUN_SCHEMA_INTEGRITY_TESTS() {
  Logger.log('\n╔════════════════════════════════════════╗');
  Logger.log('║  SCHEMA INTEGRITY TEST SUITE (Phase 2) ║');
  Logger.log('╚════════════════════════════════════════╝\n');

  const results = [];

  // Run all tests
  results.push(testSchemaHeadersMatchCanonical());
  results.push(testBatchOperationsJsonSanitization());
  results.push(testVersionBackfill());
  results.push(testSystemManagerSchemaValidation());

  // Summary
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  Logger.log('\n╔════════════════════════════════════════╗');
  Logger.log('║           TEST SUMMARY                  ║');
  Logger.log('╚════════════════════════════════════════╝');
  Logger.log(`Total: ${results.length}`);
  Logger.log(`Passed: ${passed}`);
  Logger.log(`Failed: ${failed}`);
  Logger.log(`Success Rate: ${Math.round((passed / results.length) * 100)}%`);

  if (failed > 0) {
    Logger.log('\n❌ SOME TESTS FAILED');
    results.filter(r => !r.success).forEach(r => {
      Logger.log(`  - ${r.test}: ${r.error}`);
    });
  } else {
    Logger.log('\n✅ ALL TESTS PASSED');
  }

  return {
    total: results.length,
    passed: passed,
    failed: failed,
    success_rate: Math.round((passed / results.length) * 100),
    results: results
  };
}
