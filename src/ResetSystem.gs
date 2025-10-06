/**
 * Temporary utility to reset system initialization status and re-run setup.
 * This is used to recover from states where SYSTEM_INITIALIZED is true but services are not fully registered.
 */

function resetAndSetup() {
  Logger.log('[ResetSystem] Forcing SYSTEM_INITIALIZED to false...');
  // Directly set the property to false to ensure completeSetup runs fully.
  PropertiesService.getScriptProperties().setProperty('SYSTEM_INITIALIZED', 'false');
  Logger.log('[ResetSystem] SYSTEM_INITIALIZED set to false. Now calling completeSetup()...');
  // Call the main setup function, which will now execute fully.
  completeSetup();
  Logger.log('[ResetSystem] completeSetup() finished. System should now be fully initialized.');
}