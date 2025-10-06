/**
 * IMMEDIATE EXECUTION TRIGGER
 * This will execute when deployed as a time-based trigger
 */
function EXECUTE_ALL_FUNCTIONS_VIA_TRIGGER() {
  Logger.log('🚀 STARTING COMPLETE FUNCTION EXECUTION');

  try {
    // Execute the master function
    var result = RUN_EVERYTHING_NOW();
    Logger.log('✅ ALL FUNCTIONS COMPLETED');
    Logger.log(JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    Logger.log('❌ EXECUTION FAILED: ' + e.message);
    Logger.log(e.stack);
    throw e;
  }
}

/**
 * Install a trigger to run immediately
 */
function INSTALL_IMMEDIATE_TRIGGER() {
  // Remove any existing triggers for this function
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'EXECUTE_ALL_FUNCTIONS_VIA_TRIGGER') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create trigger that runs in 1 minute
  ScriptApp.newTrigger('EXECUTE_ALL_FUNCTIONS_VIA_TRIGGER')
    .timeBased()
    .after(60 * 1000) // 1 minute
    .create();

  Logger.log('✅ Trigger installed - will execute in 1 minute');
  return 'Trigger installed successfully';
}