/**
 * MOH TIME OS v2.0 - REMOTE CONTROL
 * THE ONLY INTERFACE USERS NEED
 *
 * Call these functions from Google Apps Script editor or triggers.
 * No need to understand the internal architecture.
 */

// ============= SYSTEM CONTROL =============
function START() {
  try {
    if (typeof container === 'undefined') {
      // Force container initialization if needed
      Logger.log('RemoteControl: Container not found, forcing initialization...');
      throw new Error('Container not initialized. Check that AA_Container.gs loaded properly.');
    }
    return completeSetup();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function STOP() {
  try {
    if (typeof container === 'undefined') {
      return { success: false, error: 'System not initialized' };
    }
    const systemManager = container.get(SERVICES.SystemManager);
    return systemManager.shutdown();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function RESET() {
  try {
    clearContainer();
    return START();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============= OPERATIONS =============
function EMAIL() {
  try {
    ensureInitialized();
    return runEmailProcessing();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function SCHEDULE() {
  try {
    ensureInitialized();
    return runSchedulingCycle();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function SYNC() {
  try {
    ensureInitialized();
    runCalendarSync();
    runCalendarProjection();
    return { success: true, message: 'All sync operations completed' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============= MAINTENANCE =============
function FIX() {
  try {
    const results = healSheets();
    return { success: true, results };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function CHECK() {
  try {
    ensureInitialized();
    return runSystemHealthCheck();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function TEST() {
  try {
    ensureInitialized();
    return RUN_ALL_TESTS();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============= UTILITIES =============
function GET_STATUS() {
  try {
    if (typeof container === 'undefined') {
      return { status: 'NOT_INITIALIZED' };
    }
    return getContainerStatus();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function CONFIG(key, value) {
  try {
    ensureInitialized();
    const configManager = container.get(SERVICES.ConfigManager);
    if (value === undefined) {
      return configManager.get(key);
    }
    configManager.set(key, value);
    return { success: true, key, value };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function BACKUP() {
  try {
    ensureInitialized();
    const archiveManager = container.get(SERVICES.ArchiveManager);
    return archiveManager.createBackup();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============= TRIGGERS =============
function INSTALL() {
  try {
    ensureInitialized();
    return installAllTriggers();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function UNINSTALL() {
  try {
    return removeAllTriggers();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function LIST() {
  try {
    return listCurrentTriggers();
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============= HELPERS =============
function ensureInitialized() {
  // "Perfection": Check if a key late-stage service is missing. If so, the container is empty.
  // Run the one and only correct, full initialization sequence.
  if (typeof container === 'undefined' || !container.has || !container.has(SERVICES.WebAppManager)) {
    Logger.log('ensureInitialized (RemoteControl): System is not ready. Executing completeSetup()...');
    completeSetup();
  }
}

// ============= QUICK ACCESS =============
function HELP() {
  return {
    system: ['START()', 'STOP()', 'RESET()'],
    operations: ['EMAIL()', 'SCHEDULE()', 'SYNC()'],
    maintenance: ['FIX()', 'CHECK()', 'TEST()'],
    utilities: ['GET_STATUS()', 'CONFIG(key, value)', 'BACKUP()'],
    triggers: ['INSTALL()', 'UNINSTALL()', 'LIST()'],
    message: 'Call any function above. No parameters needed for most operations.'
  };
}