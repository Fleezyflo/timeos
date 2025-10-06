/**
 * Simple wrapper to run sheet healing
 * This will apply validation v3.1 and remove APPSHEET_CONFIG validation
 */
function runSheetHealing() {
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('RUNNING SHEET HEALING - APPLYING v3.1 VALIDATION CHANGES');
  Logger.log('═══════════════════════════════════════════════════════');

  try {
    const result = healSheets();

    Logger.log('\nSheet healing completed:');
    Logger.log('  Sheets checked: ' + result.sheetsChecked);
    Logger.log('  Sheets repaired: ' + result.sheetsRepaired);
    Logger.log('  Errors: ' + result.errors.length);

    if (result.sheetsRepaired > 0) {
      Logger.log('\n✅ SUCCESS: Validation changes applied to ' + result.sheetsRepaired + ' sheet(s)');
      Logger.log('   APPSHEET_CONFIG validation has been removed - no more warnings!');
    } else {
      Logger.log('\nℹ️  No repairs needed - validation already up to date');
    }

    return result;
  } catch (error) {
    Logger.log('\n❌ ERROR: Sheet healing failed');
    Logger.log('   ' + error.message);
    Logger.log('   Stack: ' + error.stack);
    return { success: false, error: error.message };
  }
}