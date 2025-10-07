/**
 * VERIFICATION SCRIPT - Run this in Apps Script Editor
 *
 * This script will:
 * 1. Run FIX() to create all sheets with correct names
 * 2. Verify APPSHEET_CONFIG sheet is created
 * 3. Initialize the system with START()
 * 4. Check system health
 */

function VERIFY_SHEET_CREATION() {
  Logger.log('=== SHEET CREATION VERIFICATION ===');

  // Step 1: Run FIX() to create/repair all sheets
  Logger.log('Step 1: Running FIX() to create all required sheets...');
  const fixResult = FIX();
  Logger.log('FIX() result: ' + JSON.stringify(fixResult));

  // Step 2: Check if APPSHEET_CONFIG sheet exists
  Logger.log('\nStep 2: Verifying APPSHEET_CONFIG sheet...');
  const spreadsheet = getActiveSystemSpreadsheet();
  const appsheetConfig = spreadsheet.getSheetByName('APPSHEET_CONFIG');

  if (appsheetConfig) {
    Logger.log('✓ APPSHEET_CONFIG sheet exists!');
    const lastRow = appsheetConfig.getLastRow();
    const lastCol = appsheetConfig.getLastColumn();
    Logger.log(`  - Dimensions: ${lastRow} rows x ${lastCol} columns`);

    if (lastRow > 0) {
      const headers = appsheetConfig.getRange(1, 1, 1, lastCol).getValues()[0];
      Logger.log('  - Headers: ' + JSON.stringify(headers));
    }
  } else {
    Logger.log('✗ APPSHEET_CONFIG sheet NOT FOUND - CRITICAL ERROR!');
    return { success: false, error: 'APPSHEET_CONFIG sheet missing after FIX()' };
  }

  // NEW: Verify ACTIONS sheet header count
  Logger.log('\nStep 2b: Verifying ACTIONS schema integrity...');
  const actionsSheet = spreadsheet.getSheetByName('ACTIONS');
  if (actionsSheet) {
    const actionsHeaders = actionsSheet.getRange(1, 1, 1, actionsSheet.getLastColumn()).getValues()[0];
    const expectedActionsCount = 52;
    if (actionsHeaders.length !== expectedActionsCount) {
      Logger.log('✗ ACTIONS header count mismatch: expected ' + expectedActionsCount + ', got ' + actionsHeaders.length);
      Logger.log('  Missing: ' + (expectedActionsCount - actionsHeaders.length) + ' columns');
      Logger.log('  Current headers: ' + JSON.stringify(actionsHeaders));
      return { success: false, error: 'ACTIONS schema incomplete: ' + actionsHeaders.length + '/' + expectedActionsCount + ' columns' };
    } else {
      Logger.log('✓ ACTIONS schema validated: ' + actionsHeaders.length + ' columns');
    }
  } else {
    Logger.log('✗ ACTIONS sheet NOT FOUND');
    return { success: false, error: 'ACTIONS sheet missing' };
  }

  // Step 3: Check all other required sheets
  Logger.log('\nStep 3: Verifying all required sheets...');
  const requiredSheets = [
    'ACTIONS', 'PROPOSED_TASKS', 'CALENDAR_PROJECTION',
    'FOUNDATION_BLOCKS', 'TIME_BLOCKS', 'LANES',
    'SENDER_REPUTATION', 'CHAT_QUEUE', 'ACTIVITY',
    'STATUS', 'APPSHEET_CONFIG', 'HUMAN_STATE'
  ];

  const missingSheets = [];
  requiredSheets.forEach(sheetName => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      Logger.log(`  ✓ ${sheetName} exists`);
    } else {
      Logger.log(`  ✗ ${sheetName} MISSING`);
      missingSheets.push(sheetName);
    }
  });

  if (missingSheets.length > 0) {
    Logger.log('\n⚠️ Warning: Some sheets are still missing: ' + missingSheets.join(', '));
  }

  // Step 4: Initialize the system
  Logger.log('\nStep 4: Starting system with START()...');
  const startResult = START();
  Logger.log('START() result: ' + JSON.stringify(startResult));

  // Step 5: Check system health
  Logger.log('\nStep 5: Checking system health with CHECK()...');
  const checkResult = CHECK();
  Logger.log('CHECK() result: ' + JSON.stringify(checkResult));

  // Final summary
  Logger.log('\n=== VERIFICATION COMPLETE ===');
  const summary = {
    sheets_created: fixResult.results ? fixResult.results.sheetsCreated : 0,
    sheets_repaired: fixResult.results ? fixResult.results.sheetsRepaired : 0,
    appsheet_config_exists: !!appsheetConfig,
    missing_sheets: missingSheets,
    system_initialized: startResult.success === true,
    system_healthy: checkResult.healthy === true
  };

  Logger.log('Summary: ' + JSON.stringify(summary, null, 2));

  return summary;
}

// Run this function directly from the Apps Script editor
function RUN_VERIFICATION() {
  const result = VERIFY_SHEET_CREATION();

  if (result.appsheet_config_exists && result.system_initialized) {
    Logger.log('\n🎉 SUCCESS: APPSHEET_CONFIG exists and system is initialized!');
    Logger.log('The critical sheet that "WE ARE NOT SUPPOSED TO MISS" has been created!');
  } else {
    Logger.log('\n❌ FAILURE: System is not fully operational');
    if (!result.appsheet_config_exists) {
      Logger.log('CRITICAL: APPSHEET_CONFIG sheet is still missing!');
    }
    if (!result.system_initialized) {
      Logger.log('ERROR: System failed to initialize');
    }
  }

  return result;
}