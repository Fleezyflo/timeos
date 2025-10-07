/**
 * MOH TIME OS v2.0 - SYSTEM BOOTSTRAP
 *
 * Master system initialization and bootstrap sequence.
 * Single, predictable initialization path with proper phase tracking.
 * Entry point for system startup and configuration.
 */

// --- DIAGNOSTIC: Ensure getContainer and registerAllServices are defined ---
// This is a temporary measure to debug 'getContainer is not defined' errors.
// In a correctly configured Apps Script project, these should be globally available.
if (typeof getContainer === 'undefined') {
  function getContainer() {
    // Placeholder: In a real scenario, this would be loaded from AA_Container.gs
    // For now, we'll return a minimal mock or throw an error if not properly loaded.
    Logger.log('ERROR: getContainer is not defined. Using placeholder.');
    throw new Error('getContainer is not defined. Check AA_Container.gs load order.');
  }
}

if (typeof registerAllServices === 'undefined') {
  function registerAllServices() {
    // Placeholder: In a real scenario, this would be loaded from AZ_ServiceRegistration.gs
    Logger.log('ERROR: registerAllServices is not defined. Using placeholder.');
    throw new Error('registerAllServices is not defined. Check AZ_ServiceRegistration.gs load order.');
  }
}
// --- END DIAGNOSTIC ---

/**
 * Single entry point for complete system setup
 * Executes a predictable 5-phase initialization sequence
 */
function isSystemInitialized() {
  return PropertiesService.getScriptProperties().getProperty('SYSTEM_INITIALIZED') === 'true';
}

function setSystemInitialized(status) {
  PropertiesService.getScriptProperties().setProperty('SYSTEM_INITIALIZED', status ? 'true' : 'false');
}

function isSystemSetupInProgress() {
  return PropertiesService.getScriptProperties().getProperty('SYSTEM_SETUP_IN_PROGRESS') === 'true';
}

function setSystemSetupInProgress(status) {
  PropertiesService.getScriptProperties().setProperty('SYSTEM_SETUP_IN_PROGRESS', status ? 'true' : 'false');
}

function completeSetup() {
  // Acquire a distributed lock to prevent concurrent setup executions
  let setupLock = null;
  try { // Outer try block for lock acquisition and initial checks
    setupLock = LockService.getScriptLock();
    setupLock.waitLock(30000); // Wait up to 30 seconds for the lock

    if (isSystemSetupInProgress()) {
      Logger.log('WARN [SystemBootstrap] Setup already in progress. Aborting recursive call.');
      return;
    }

    if (isSystemInitialized()) {
      Logger.log('INFO [SystemBootstrap] System already initialized. Skipping setup.');
      return;
    }

    setSystemSetupInProgress(true);

    const initState = {
      phase: 0,
      phases: [
        'Container Setup',
        'Sheet Healing',
        'Service Registration',
        'Service Validation',
        'Trigger Installation'
      ],
      errors: [],
      startTime: new Date()
    };

    try { // Inner try block for the main setup logic
      Logger.log('[SystemBootstrap] Starting MOH TIME OS v2.0 system setup...');

      // PHASE 1: Container Setup (no services)
      initState.phase = 1;
      Logger.log(`[SystemBootstrap] Phase ${initState.phase}: ${initState.phases[0]}...`);

      if (!validateEnvironment()) {
        throw new Error('Environment validation failed');
      }

      if (typeof container === 'undefined') {
        throw new Error('Dependency injection container not available');
      }

      Logger.log(`[SystemBootstrap] ✓ Phase ${initState.phase} completed`);

      // PHASE 2: Sheet Healing (no service dependencies)
      initState.phase = 2;
      Logger.log(`[SystemBootstrap] Phase ${initState.phase}: ${initState.phases[1]}...`);

      try {
        const healResult = healSheets();
        Logger.log('[SystemBootstrap] Sheet healing completed: ' + JSON.stringify(healResult));
      } catch (healError) {
        initState.errors.push(`Sheet healing failed: ${healError.message}`);
        Logger.log('WARN [SystemBootstrap] Sheet healing failed but continuing: ' + healError.message);
      }

      Logger.log(`[SystemBootstrap] ✓ Phase ${initState.phase} completed`);

      // PHASE 3: Service Registration
      initState.phase = 3;
      Logger.log(`[SystemBootstrap] Phase ${initState.phase}: ${initState.phases[2]}...`);

      registerAllServices();
      // Set MohTask static logger after SmartLogger is registered
      MohTask.setLogger(container.get(SERVICES.SmartLogger)); // NEW
      Logger.log('[SystemBootstrap] All services registered successfully');

      Logger.log(`[SystemBootstrap] ✓ Phase ${initState.phase} completed`);

      // CRITICAL: Force-verify services before data seeding
      Logger.log('[SystemBootstrap] Verifying service registration before data seeding...');
      const criticalServicesForSeeding = [SERVICES.BatchOperations, SERVICES.SmartLogger];
      

      // Verify registration succeeded
      for (const serviceName of criticalServicesForSeeding) {
        if (!container.has(serviceName)) {
          throw new Error(`FATAL: ${serviceName} still not registered after forced registration - cannot proceed with data seeding`);
        }
      }
      Logger.log('[SystemBootstrap] ✅ Service registration verified - proceeding with data seeding');

      // Seed initial data AFTER service registration, BEFORE service instantiation
      // This ensures BatchOperations/SmartLogger are available, but ConfigManager hasn't loaded APPSHEET_CONFIG yet
      try {
        seedInitialData();
        Logger.log('[SystemBootstrap] Initial data seeding completed');
      } catch (seedError) {
        initState.errors.push(`Data seeding failed: ${seedError.message}`);
        Logger.log('WARN [SystemBootstrap] Data seeding failed but continuing: ' + seedError.message);
      }

      // PHASE 4: Service Validation
      initState.phase = 4;
      Logger.log(`[SystemBootstrap] Phase ${initState.phase}: ${initState.phases[3]}...`);

      verifyCriticalServices();
      Logger.log('[SystemBootstrap] Critical services verification passed');

      // Initialize schema if needed
      // REMOVED: initializeSchema() internally calls healSheets() - redundant with line 49
      // initializeSchema();
      // Logger.log('[SystemBootstrap] Schema initialization completed');

      // Run system health check
      const healthCheck = runSystemHealthCheck();
      if (!healthCheck.healthy) {
        initState.errors.push('System health check detected issues: ' + JSON.stringify(healthCheck.issues));
        Logger.log('WARN [SystemBootstrap] System health check detected issues: ' + JSON.stringify(healthCheck.issues));
      } else {
        Logger.log('[SystemBootstrap] System health check passed');
      }

      Logger.log(`[SystemBootstrap] ✓ Phase ${initState.phase} completed`);

      // PHASE 5: Trigger Installation (if needed)
      initState.phase = 5;
      Logger.log(`[SystemBootstrap] Phase ${initState.phase}: ${initState.phases[4]}...`);

      // Note: Trigger installation is manual/optional - no auto-execution
      Logger.log('[SystemBootstrap] Trigger installation phase - manual intervention required if needed');

      Logger.log(`[SystemBootstrap] ✓ Phase ${initState.phase} completed`);

      const endTime = new Date();
      const duration = endTime.getTime() - initState.startTime.getTime();

      Logger.log(`[SystemBootstrap] 🎉 MOH TIME OS v2.0 setup completed successfully in ${duration}ms`);

      setSystemInitialized(true);
      PropertiesService.getScriptProperties().setProperty('CONTAINER_HYDRATED', 'true');

      return {
        success: true,
        message: 'System setup completed successfully',
        phases: initState.phases.length,
        errors: initState.errors,
        duration: duration,
        health: healthCheck
      };

    } catch (error) { // Inner catch block for setup errors
      const endTime = new Date();
      const duration = endTime.getTime() - initState.startTime.getTime();

      Logger.log(`ERROR [SystemBootstrap] ❌ System setup failed at Phase ${initState.phase} (${initState.phases[initState.phase - 1]}): ${error.message}`);

      setSystemInitialized(false); // Mark as not initialized on failure

      return {
        success: false,
        phase: initState.phase,
        phaseName: initState.phases[initState.phase - 1],
        error: error.message,
        stack: error.stack,
        errors: initState.errors,
        duration: duration
      };
    }
  } catch (outerError) { // Outer catch block for errors during lock acquisition or initial checks
    const endTime = new Date();
    const duration = endTime.getTime() - (initState ? initState.startTime.getTime() : new Date().getTime()); // Handle initState possibly not being defined

    Logger.log(`ERROR [SystemBootstrap] ❌ System setup failed during lock acquisition or initial checks: ${outerError.message}`);

    setSystemInitialized(false); // Mark as not initialized on failure

    return {
      success: false,
      phase: initState ? initState.phase : 0,
      phaseName: initState ? initState.phases[initState.phase - 1] : 'Pre-Setup',
      error: outerError.message,
      stack: outerError.stack,
      errors: initState ? initState.errors : [],
      duration: duration
    };
  } finally { // Outermost finally block to ensure lock release and status reset
    if (setupLock) {
      setupLock.releaseLock(); // Release the lock
    }
    setSystemSetupInProgress(false); // Ensure this is always called
  }
}

function onOpen(e) {
  if (isSystemInitialized()) {
    Logger.log('[SystemBootstrap] onOpen triggered but system already initialized. Skipping setup.');
    return;
  }

  try {
    Logger.log('[SystemBootstrap] onOpen triggered - delegating to completeSetup()');
    return completeSetup();
  } catch (error) {
    Logger.log(`ERROR [SystemBootstrap] onOpen failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      source: 'onOpen'
    };
  }
}

function validateEnvironment() {
  try {

    // Check for critical global objects
    if (typeof SpreadsheetApp === 'undefined') {
      throw new Error('Google Apps Script environment not detected. SpreadsheetApp is undefined.');
    }
    if (typeof PropertiesService === 'undefined') {
      throw new Error('Google Apps Script environment not detected. PropertiesService is undefined.');
    }
    if (typeof CacheService === 'undefined') {
      throw new Error('Google Apps Script environment not detected. CacheService is undefined.');
    }
    if (typeof Utilities === 'undefined') {
      throw new Error('Google Apps Script environment not detected. Utilities is undefined.');
    }

    // Check for critical global functions (e.g., from AA_Container.gs)
    if (typeof getContainer === 'undefined') {
      throw new Error('Core dependency container (getContainer) is not defined. Check AA_Container.gs load order.');
    }
    if (typeof getService === 'undefined') {
      throw new Error('Core dependency service accessor (getService) is not defined. Check AA_Container.gs load order.');
    }
    if (typeof hasService === 'undefined') {
      throw new Error('Core dependency service checker (hasService) is not defined. Check AA_Container.gs load order.');
    }

    // Check for critical constants (e.g., from AB_Constants.gs)
    if (typeof SERVICES === 'undefined') {
      throw new Error('Core system constants (SERVICES) are not defined. Check AB_Constants.gs load order.');
    }
    if (typeof SHEET_NAMES === 'undefined') {
      throw new Error('Core system constants (SHEET_NAMES) are not defined. Check AB_Constants.gs load order.');
    }
    if (typeof CONSTANTS === 'undefined') {
      throw new Error('Core system constants (CONSTANTS) are not defined. Check AB_Constants.gs load order.');
    }

    // Check for critical enums (e.g., from AC_Enums.gs)
    if (typeof STATUS === 'undefined') {
      throw new Error('Core system enums (STATUS) are not defined. Check AC_Enums.gs load order.');
    }
    if (typeof PRIORITY === 'undefined') {
      throw new Error('Core system enums (PRIORITY) are not defined. Check AC_Enums.gs load order.');
    }

    Logger.log('Environment validation successful.');

  } catch (error) {
    Logger.log('Environment validation FAILED: ' + error.message);
    throw error;
  }
}
let _containerHydratedThisExecution = false;

function ensureBootstrapServices() {
  const start = Date.now();

  const containerUnavailable = () =>
    typeof container === 'undefined' || typeof container.has !== 'function';

  const hasWebAppManager = () => !containerUnavailable() && container.has(SERVICES.WebAppManager);

  if (!isSystemInitialized()) {
    Logger.log('ensureBootstrapServices: System not initialized. Executing completeSetup().');
    completeSetup();
    if (!hasWebAppManager()) {
      throw new Error('FATAL: System remains uninitialized even after completeSetup().');
    }
    _containerHydratedThisExecution = true;
    Logger.log(`ensureBootstrapServices: completed in ${Date.now() - start}ms (full setup)`);
    return;
  }

  if (_containerHydratedThisExecution && hasWebAppManager()) {
    Logger.log(`ensureBootstrapServices: skipped rehydration in ${Date.now() - start}ms`);
    return;
  }

  if (!hasWebAppManager()) {
    Logger.log('ensureBootstrapServices: Stateless execution detected or container incomplete. Re-hydrating all services.');
    registerAllServices();
    if (!hasWebAppManager()) {
      throw new Error('FATAL: Service container remains invalid even after re-hydration.');
    }
  }

  const ensureService = (serviceName) => {
    if (containerUnavailable()) {
      throw new Error('ensureBootstrapServices: Dependency container unavailable after setup');
    }

    if (!container.has(serviceName)) {
      Logger.log(`ensureBootstrapServices: '${serviceName}' missing from registry. Hydrating dependency container...`);
      registerAllServices();
    }

    try {
      return container.get(serviceName);
    } catch (error) {
      Logger.log(`ensureBootstrapServices: '${serviceName}' retrieval failed (${error.message}). Hydrating dependency container...`);
      registerAllServices();
      return container.get(serviceName);
    }
  };

  ensureService(SERVICES.SmartLogger);
  ensureService(SERVICES.WebAppManager);

  _containerHydratedThisExecution = true;

  Logger.log(`ensureBootstrapServices: completed in ${Date.now() - start}ms`);
}



/**
 * Verify that critical services can be instantiated
 */
function verifyCriticalServices() {
  ensureBootstrapServices();
  const criticalServices = [
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.BatchOperations,
    SERVICES.ErrorHandler,
    SERVICES.SystemManager
  ];

  for (const serviceName of criticalServices) {
    try {
      const service = container.get(serviceName);
      if (!service) {
        throw new Error(`Service ${serviceName} returned null/undefined`);
      }
      Logger.log('[SystemBootstrap] ✓ ' + serviceName + ' instantiated successfully');
    } catch (error) {
      throw new Error(`Failed to instantiate critical service ${serviceName}: ${error.message}`);
    }
  }
}

/**
 * Initialize database schema if needed
 */
function initializeSchema() {
  try {
    ensureBootstrapServices();
    const systemManager = safeGetService(SERVICES.SystemManager);
    if (!systemManager) {
      throw new Error('SystemManager service is not available for schema initialization');
    }

    // Check if schema initialization is needed
    const schemaStatus = systemManager.checkSchemaStatus();
    if (schemaStatus.needsInitialization) {
      // Container is available after line 176
      const logger = safeGetService(SERVICES.SmartLogger, console);
      if (logger.info) {
        logger.info('SystemBootstrap', 'Schema initialization required...');
      } else {
        Logger.log('[SystemBootstrap] Schema initialization required...');
      }
      const result = systemManager.initializeSchema();
      if (!result.success) {
        throw new Error(`Schema initialization failed: ${result.error}`);
      }
    }

    // Note: seedInitialData() moved to Phase 4 after service validation

    return true;
  } catch (error) {
    // RETHROW_WITH_LOG profile
    // TEST: TEST_SILENT_080_INITIALIZESCHEMA
    LoggerFacade.error('SystemBootstrap', 'Schema initialization failed', {
      error: error.message,
      stack: error.stack,
      context: 'initializeSchema'
    });

    throw error;
  }
}

/**
 * Populate baseline configuration/status rows after schema creation
 */
function seedInitialData() {
  try {
    const batchOps = container.get(SERVICES.BatchOperations);
    if (!batchOps) {
      Logger.log('WARN [SystemBootstrap] Seed skipped: BatchOperations unavailable');
      return;
    }

    // Seed configuration entries if sheet is empty
    try {
      const existingConfigRows = batchOps.getRowsByFilter(SHEET_NAMES.APPSHEET_CONFIG, {});

      // Skip header row and check for actual data
      const dataRows = existingConfigRows.filter((row, index) => {
        if (index === 0 && row[0] === 'row_id') return false; // Skip header
        return row.length > 0 && row[0] && row[0].trim() !== '';
      });

      if (dataRows.length >= 25) { // Properly seeded config has ~29 rows
        Logger.log('[SystemBootstrap] APPSHEET_CONFIG already has ' + dataRows.length + ' rows - skipping seed');
      } else if (dataRows.length > 0 && dataRows.length < 25) {
        // Clear partial/corrupt data before reseeding
        Logger.log('[SystemBootstrap] APPSHEET_CONFIG has partial data (' + dataRows.length + ' rows) - clearing before reseed');
        batchOps.clearSheetData(SHEET_NAMES.APPSHEET_CONFIG);
        const configRows = [
          ['cfg_timezone', 'SYSTEM', 'CORE', 'Timezone', 'TIMEZONE', 'Asia/Dubai', 'Default timezone'],
          ['cfg_email_processing', 'FEATURE_FLAGS', 'EMAIL', 'Email Processing', 'ENABLE_EMAIL_PROCESSING', 'true', 'Enable email ingestion'],
          ['cfg_calendar_sync', 'FEATURE_FLAGS', 'CALENDAR', 'Calendar Sync', 'ENABLE_CALENDAR_SYNC', 'false', 'Enable calendar synchronization'],
          ['cfg_max_batch', 'SYSTEM', 'PERFORMANCE', 'Max Batch Size', 'MAX_BATCH_SIZE', String(CONSTANTS.DEFAULT_BATCH_SIZE), 'Default batch size'],
          ['cfg_cache_ttl', 'SYSTEM', 'CACHE', 'Cache TTL Minutes', 'CACHE_TTL_MINUTES', '5', 'Default cache TTL in minutes'],

          // Email scanning configuration
          ['cfg_scan_mode', 'EMAIL', 'PROCESSING', 'Scan Mode', 'SCAN_MODE', 'LABEL_ONLY', 'Email scanning mode: LABEL_ONLY or ZERO_TRUST_TRIAGE'],
          ['cfg_email_label', 'EMAIL', 'PROCESSING', 'Processing Label', 'EMAIL_PROCESSING_LABEL', 'MOH-Time-OS', 'Gmail label for processing emails'],
          ['cfg_email_batch_size', 'EMAIL', 'PERFORMANCE', 'Batch Size', 'EMAIL_BATCH_SIZE', '50', 'Number of emails to process per batch'],

          // Priority and scoring configuration
          ['cfg_priority_high_threshold', 'SCORING', 'THRESHOLDS', 'High Priority Threshold', 'PROPOSAL_THRESHOLD_HIGH', '0.70', 'Threshold for high priority proposals'],
          ['cfg_priority_low_threshold', 'SCORING', 'THRESHOLDS', 'Low Priority Threshold', 'PROPOSAL_THRESHOLD_LOW', '0.30', 'Threshold for low priority proposals'],

          // Aging and decay configuration
          ['cfg_aging_curve', 'SCORING', 'AGING', 'Aging Curve Type', 'AGING_CURVE_TYPE', 'LINEAR', 'Aging curve algorithm: LINEAR, EXPONENTIAL, LOGARITHMIC'],
          ['cfg_aging_base_rate', 'SCORING', 'AGING', 'Base Aging Rate', 'AGING_BASE_RATE', '0.2', 'Base rate for aging calculations'],
          ['cfg_aging_max_multiplier', 'SCORING', 'AGING', 'Max Multiplier', 'AGING_MAX_MULTIPLIER', '3.0', 'Maximum aging multiplier'],

          // Circuit breaker configuration
          ['cfg_circuit_threshold', 'SYSTEM', 'RELIABILITY', 'Circuit Breaker Threshold', 'CIRCUIT_BREAKER_THRESHOLD', '5', 'Circuit breaker failure threshold (3-10 valid range)'],
          ['cfg_circuit_failure_threshold', 'SYSTEM', 'RELIABILITY', 'Failure Threshold', 'CIRCUIT_BREAKER_FAILURE_THRESHOLD', '5', 'Circuit breaker failure threshold'],
          ['cfg_circuit_recovery_timeout', 'SYSTEM', 'RELIABILITY', 'Recovery Timeout', 'CIRCUIT_BREAKER_RECOVERY_TIMEOUT', '30000', 'Circuit breaker recovery timeout (ms)'],

          // SystemManager configuration
          ['cfg_archive_batch_limit', 'SYSTEM', 'PERFORMANCE', 'Archive Batch Limit', 'ARCHIVE_BATCH_LIMIT', '100', 'Max tasks to archive per batch'],
          ['cfg_activity_log_limit', 'SYSTEM', 'MAINTENANCE', 'Activity Log Limit', 'ACTIVITY_LOG_LIMIT', '1000', 'Max activity log entries to retain'],

          // Email configuration
          ['cfg_system_fingerprints', 'EMAIL', 'FILTERING', 'System Email Fingerprints', 'SYSTEM_EMAIL_FINGERPRINTS', '["noreply","no-reply","donotreply","notification","automated","system","bot","mailer-daemon","postmaster"]', 'Patterns identifying system emails'],
          ['cfg_action_keywords', 'EMAIL', 'PARSING', 'Action Keywords', 'EMAIL_ACTION_KEYWORDS', '["action required","please","reminder","urgent","follow up","todo","request","assign","due","review","approve","sign","submit","complete","finish","check","verify","confirm","respond","update","prepare","analyze","investigate"]', 'Keywords indicating required actions'],

          // Scheduling weights
          ['cfg_weight_priority', 'SCHEDULING', 'SCORING', 'Priority Weight', 'WEIGHT_PRIORITY', '0.3', 'Weight for priority in scoring'],
          ['cfg_weight_deadline', 'SCHEDULING', 'SCORING', 'Deadline Weight', 'WEIGHT_DEADLINE', '0.25', 'Weight for deadline urgency'],
          ['cfg_weight_rollover', 'SCHEDULING', 'SCORING', 'Rollover Weight', 'WEIGHT_ROLLOVER', '0.15', 'Weight for rollover count'],
          ['cfg_weight_duration', 'SCHEDULING', 'SCORING', 'Duration Weight', 'WEIGHT_DURATION', '0.1', 'Weight for task duration'],
          ['cfg_weight_dependencies', 'SCHEDULING', 'SCORING', 'Dependencies Weight', 'WEIGHT_DEPENDENCIES', '0.1', 'Weight for task dependencies'],
          ['cfg_weight_energy', 'SCHEDULING', 'SCORING', 'Energy Weight', 'WEIGHT_ENERGY', '0.05', 'Weight for energy matching'],
          ['cfg_weight_context', 'SCHEDULING', 'SCORING', 'Context Weight', 'WEIGHT_CONTEXT', '0.05', 'Weight for context switching'],

          // Lane configuration
          ['cfg_lane_energy_map', 'SCHEDULING', 'LANES', 'Lane Energy Mapping', 'LANE_ENERGY_MAP', '{"ops":"peak","client":"high","growth":"high","admin":"post_lunch","personal":"low","deep_work":"peak","creative":"high","communication":"medium","learning":"high","strategic":"peak","default":"medium"}', 'Energy requirements per lane'],
          ['cfg_lane_compatibility', 'SCHEDULING', 'LANES', 'Lane Compatibility Matrix', 'LANE_COMPATIBILITY', '{"ops":{"ops":1.0,"deep_work":0.9,"strategic":0.8,"admin":0.6,"client":0.3,"growth":0.2,"personal":0.1},"client":{"client":1.0,"growth":0.7,"communication":0.9,"ops":0.4,"admin":0.5,"personal":0.2},"growth":{"growth":1.0,"creative":0.9,"client":0.7,"ops":0.3,"strategic":0.5,"personal":0.1},"admin":{"admin":1.0,"ops":0.6,"personal":0.7,"client":0.4,"communication":0.5,"buffer":0.8},"personal":{"personal":1.0,"buffer":0.9,"admin":0.5,"recovery":0.8,"wind_down":0.8},"deep_work":{"deep_work":1.0,"ops":0.9,"strategic":0.9,"creative":0.6},"creative":{"creative":1.0,"growth":0.9,"deep_work":0.6},"communication":{"communication":1.0,"client":0.9,"admin":0.6},"learning":{"learning":1.0,"deep_work":0.7,"strategic":0.6}}', 'Compatibility scores between lanes']
        ];
        batchOps.appendRows(SHEET_NAMES.APPSHEET_CONFIG, configRows);
        Logger.log('[SystemBootstrap] Seeded APPSHEET_CONFIG with default configuration rows');
      } else {
        // dataRows.length === 0, fresh seed
        const configRows = [
          ['cfg_timezone', 'SYSTEM', 'CORE', 'Timezone', 'TIMEZONE', 'Asia/Dubai', 'Default timezone'],
          ['cfg_email_processing', 'FEATURE_FLAGS', 'EMAIL', 'Email Processing', 'ENABLE_EMAIL_PROCESSING', 'true', 'Enable email ingestion'],
          ['cfg_calendar_sync', 'FEATURE_FLAGS', 'CALENDAR', 'Calendar Sync', 'ENABLE_CALENDAR_SYNC', 'false', 'Enable calendar synchronization'],
          ['cfg_max_batch', 'SYSTEM', 'PERFORMANCE', 'Max Batch Size', 'MAX_BATCH_SIZE', String(CONSTANTS.DEFAULT_BATCH_SIZE), 'Default batch size'],
          ['cfg_cache_ttl', 'SYSTEM', 'CACHE', 'Cache TTL Minutes', 'CACHE_TTL_MINUTES', '5', 'Default cache TTL in minutes'],

          // Email scanning configuration
          ['cfg_scan_mode', 'EMAIL', 'PROCESSING', 'Scan Mode', 'SCAN_MODE', 'LABEL_ONLY', 'Email scanning mode: LABEL_ONLY or ZERO_TRUST_TRIAGE'],
          ['cfg_email_label', 'EMAIL', 'PROCESSING', 'Processing Label', 'EMAIL_PROCESSING_LABEL', 'MOH-Time-OS', 'Gmail label for processing emails'],
          ['cfg_email_batch_size', 'EMAIL', 'PERFORMANCE', 'Batch Size', 'EMAIL_BATCH_SIZE', '50', 'Number of emails to process per batch'],

          // Priority and scoring configuration
          ['cfg_priority_high_threshold', 'SCORING', 'THRESHOLDS', 'High Priority Threshold', 'PROPOSAL_THRESHOLD_HIGH', '0.70', 'Threshold for high priority proposals'],
          ['cfg_priority_low_threshold', 'SCORING', 'THRESHOLDS', 'Low Priority Threshold', 'PROPOSAL_THRESHOLD_LOW', '0.30', 'Threshold for low priority proposals'],

          // Aging and decay configuration
          ['cfg_aging_curve', 'SCORING', 'AGING', 'Aging Curve Type', 'AGING_CURVE_TYPE', 'LINEAR', 'Aging curve algorithm: LINEAR, EXPONENTIAL, LOGARITHMIC'],
          ['cfg_aging_base_rate', 'SCORING', 'AGING', 'Base Aging Rate', 'AGING_BASE_RATE', '0.2', 'Base rate for aging calculations'],
          ['cfg_aging_max_multiplier', 'SCORING', 'AGING', 'Max Multiplier', 'AGING_MAX_MULTIPLIER', '3.0', 'Maximum aging multiplier'],

          // Circuit breaker configuration
          ['cfg_circuit_threshold', 'SYSTEM', 'RELIABILITY', 'Circuit Breaker Threshold', 'CIRCUIT_BREAKER_THRESHOLD', '5', 'Circuit breaker failure threshold (3-10 valid range)'],
          ['cfg_circuit_failure_threshold', 'SYSTEM', 'RELIABILITY', 'Failure Threshold', 'CIRCUIT_BREAKER_FAILURE_THRESHOLD', '5', 'Circuit breaker failure threshold'],
          ['cfg_circuit_recovery_timeout', 'SYSTEM', 'RELIABILITY', 'Recovery Timeout', 'CIRCUIT_BREAKER_RECOVERY_TIMEOUT', '30000', 'Circuit breaker recovery timeout (ms)'],

          // SystemManager configuration
          ['cfg_archive_batch_limit', 'SYSTEM', 'PERFORMANCE', 'Archive Batch Limit', 'ARCHIVE_BATCH_LIMIT', '100', 'Max tasks to archive per batch'],
          ['cfg_activity_log_limit', 'SYSTEM', 'MAINTENANCE', 'Activity Log Limit', 'ACTIVITY_LOG_LIMIT', '1000', 'Max activity log entries to retain'],

          // Email configuration
          ['cfg_system_fingerprints', 'EMAIL', 'FILTERING', 'System Email Fingerprints', 'SYSTEM_EMAIL_FINGERPRINTS', '["noreply","no-reply","donotreply","notification","automated","system","bot","mailer-daemon","postmaster"]', 'Patterns identifying system emails'],
          ['cfg_action_keywords', 'EMAIL', 'PARSING', 'Action Keywords', 'EMAIL_ACTION_KEYWORDS', '["action required","please","reminder","urgent","follow up","todo","request","assign","due","review","approve","sign","submit","complete","finish","check","verify","confirm","respond","update","prepare","analyze","investigate"]', 'Keywords indicating required actions'],

          // Scheduling weights
          ['cfg_weight_priority', 'SCHEDULING', 'SCORING', 'Priority Weight', 'WEIGHT_PRIORITY', '0.3', 'Weight for priority in scoring'],
          ['cfg_weight_deadline', 'SCHEDULING', 'SCORING', 'Deadline Weight', 'WEIGHT_DEADLINE', '0.25', 'Weight for deadline urgency'],
          ['cfg_weight_rollover', 'SCHEDULING', 'SCORING', 'Rollover Weight', 'WEIGHT_ROLLOVER', '0.15', 'Weight for rollover count'],
          ['cfg_weight_duration', 'SCHEDULING', 'SCORING', 'Duration Weight', 'WEIGHT_DURATION', '0.1', 'Weight for task duration'],
          ['cfg_weight_dependencies', 'SCHEDULING', 'SCORING', 'Dependencies Weight', 'WEIGHT_DEPENDENCIES', '0.1', 'Weight for task dependencies'],
          ['cfg_weight_energy', 'SCHEDULING', 'SCORING', 'Energy Weight', 'WEIGHT_ENERGY', '0.05', 'Weight for energy matching'],
          ['cfg_weight_context', 'SCHEDULING', 'SCORING', 'Context Weight', 'WEIGHT_CONTEXT', '0.05', 'Weight for context switching'],

          // Lane configuration
          ['cfg_lane_energy_map', 'SCHEDULING', 'LANES', 'Lane Energy Mapping', 'LANE_ENERGY_MAP', '{"ops":"peak","client":"high","growth":"high","admin":"post_lunch","personal":"low","deep_work":"peak","creative":"high","communication":"medium","learning":"high","strategic":"peak","default":"medium"}', 'Energy requirements per lane'],
          ['cfg_lane_compatibility', 'SCHEDULING', 'LANES', 'Lane Compatibility Matrix', 'LANE_COMPATIBILITY', '{"ops":{"ops":1.0,"deep_work":0.9,"strategic":0.8,"admin":0.6,"client":0.3,"growth":0.2,"personal":0.1},"client":{"client":1.0,"growth":0.7,"communication":0.9,"ops":0.4,"admin":0.5,"personal":0.2},"growth":{"growth":1.0,"creative":0.9,"client":0.7,"ops":0.3,"strategic":0.5,"personal":0.1},"admin":{"admin":1.0,"ops":0.6,"personal":0.7,"client":0.4,"communication":0.5,"buffer":0.8},"personal":{"personal":1.0,"buffer":0.9,"admin":0.5,"recovery":0.8,"wind_down":0.8},"deep_work":{"deep_work":1.0,"ops":0.9,"strategic":0.9,"creative":0.6},"creative":{"creative":1.0,"growth":0.9,"deep_work":0.6},"communication":{"communication":1.0,"client":0.9,"admin":0.6},"learning":{"learning":1.0,"deep_work":0.7,"strategic":0.6}}', 'Compatibility scores between lanes']
        ];
        batchOps.appendRows(SHEET_NAMES.APPSHEET_CONFIG, configRows);
        Logger.log('[SystemBootstrap] Seeded APPSHEET_CONFIG with default configuration rows');
      }
    } catch (configError) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_081_SEEDINITIALDATA_CONFIG
      LoggerFacade.error('SystemBootstrap', 'Config seeding failed', {
        error: configError.message,
        stack: configError.stack,
        context: 'seedInitialData_configSeeding'
      });

      throw configError;
    }

    // Seed status sheet if empty
    try {
      const existingStatusRows = batchOps.getRowsByFilter(SHEET_NAMES.STATUS, {});

      // Skip header row and check for actual data
      const statusDataRows = existingStatusRows.filter((row, index) => {
        if (index === 0 && row[0] === 'key') return false; // Skip header
        return row.length > 0 && row[0] && row[0].trim() !== '';
      });

      if (statusDataRows.length > 0) {
        Logger.log('[SystemBootstrap] STATUS already has ' + statusDataRows.length + ' rows - skipping seed');
      } else {
        const now = TimeZoneAwareDate.now();
        const statusRows = [
          ['schema_version', CONSTANTS.SCHEMA_VERSION, now, 'Current schema version'],
          ['last_setup_run', now, now, 'Timestamp of last complete setup'],
          ['configuration_mode', 'DEFAULTS', now, 'Configuration source (defaults until sheet populated)']
        ];
        batchOps.appendRows(SHEET_NAMES.STATUS, statusRows);
        Logger.log('[SystemBootstrap] Seeded STATUS sheet with baseline entries');
      }
    } catch (statusError) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_082_SEEDINITIALDATA_STATUS
      LoggerFacade.error('SystemBootstrap', 'Status seeding failed', {
        error: statusError.message,
        stack: statusError.stack,
        context: 'seedInitialData_statusSeeding'
      });

      throw statusError;
    }

    // Seed default lanes if needed
    try {
      const lanesResult = seedDefaultLanes();
      Logger.log('[SystemBootstrap] Lanes seeding result: ' + JSON.stringify(lanesResult));
    } catch (lanesError) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_083_SEEDINITIALDATA_LANES
      LoggerFacade.error('SystemBootstrap', 'Lanes seeding failed', {
        error: lanesError.message,
        stack: lanesError.stack,
        context: 'seedInitialData_lanesSeeding'
      });

      throw lanesError;
    }

  } catch (error) {
    // RETHROW_WITH_LOG profile
    // TEST: TEST_SILENT_084_SEEDINITIALDATA
    LoggerFacade.error('SystemBootstrap', 'Seed initialization failed', {
      error: error.message,
      stack: error.stack,
      context: 'seedInitialData'
    });

    throw error;
  }
}

/**
 * Run comprehensive system health check
 */
function runSystemHealthCheck() {
  try {
    ensureBootstrapServices();
    const systemManager = safeGetService(SERVICES.SystemManager);
    if (!systemManager) {
      throw new Error('SystemManager service is not available for health check');
    }
    const healthCheck = systemManager.runHealthCheck();

    return {
      healthy: healthCheck.overall_status === 'HEALTHY',
      status: healthCheck.overall_status,
      issues: healthCheck.issues || [],
      details: healthCheck
    };
  } catch (error) {
    const logger = container.get(SERVICES.SmartLogger);
    logger.error('SystemBootstrap', `Health check failed: ${error.message}`);
    return {
      healthy: false,
      status: 'ERROR',
      issues: [`Health check failed: ${error.message}`],
      details: null
    };
  }
}

/**
 * Legacy function for backward compatibility
 */
function doGet(e) {
  try {
    ensureBootstrapServices();
    const webAppManager = container.get(SERVICES.WebAppManager);
    return webAppManager.handleDoGet(e);
  } catch (error) {
    // Try to get logger, but fallback to Logger.log if not available
    try {
      const logger = container.get(SERVICES.SmartLogger);
      logger.error('SystemBootstrap', `doGet failed: ${error.message}`);
    } catch (logError) {
      Logger.log('ERROR [SystemBootstrap] doGet failed: ' + error.message);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 500,
      error: 'Internal server error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Legacy function for backward compatibility
 */
function doPost(e) {
  try {
    ensureBootstrapServices();
    const webAppManager = container.get(SERVICES.WebAppManager);
    return webAppManager.handleDoPost(e);
  } catch (error) {
    // Try to get logger, but fallback to Logger.log if not available
    try {
      const logger = container.get(SERVICES.SmartLogger);
      logger.error('SystemBootstrap', `doPost failed: ${error.message}`);
    } catch (logError) {
      Logger.log('ERROR [SystemBootstrap] doPost failed: ' + error.message);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 500,
      error: 'Internal server error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Seed default lanes to LANES sheet
 * Creates a standard set of 4 lanes for initial system operation
 * @returns {Object} Result of seeding operation
 */
function seedDefaultLanes() {
  try {
    Logger.log('[SystemBootstrap] Seeding default lanes...');

    const batchOps = container.get(SERVICES.BatchOperations);
    const headers = batchOps.getHeaders(SHEET_NAMES.LANES);

    // Check which lanes already exist
    const existingRows = batchOps.getRowsByFilter(SHEET_NAMES.LANES, {});
    // Skip header row check and extract lane names
    const existingLaneNames = new Set();
    existingRows.forEach((row, index) => {
      if (index === 0 && row[0] === 'lane') return; // Skip header
      if (row.length > 0 && row[0] && row[0].trim() !== '') {
        existingLaneNames.add(row[0].trim().toLowerCase());
      }
    });

    if (existingLaneNames.size >= 4) {
      Logger.log('[SystemBootstrap] All default lanes already exist - skipping seed');
      return { success: true, skipped: true, existing: existingLaneNames.size };
    }

    Logger.log(`[SystemBootstrap] Found ${existingLaneNames.size} existing lanes: ${Array.from(existingLaneNames).join(', ')}`);

    // Define default lanes
    const defaultLanes = [
      {
        lane: 'client',
        description: 'Client work, deliverables, and commitments',
        weight: 0.35,
        min_block_minutes: 60,
        max_daily_minutes: 300,
        priority_multiplier: 1.3,
        context_type: 'deep_work',
        energy_preference: 'HIGH',
        is_active: true,
        created_at: TimeZoneAwareDate.now(),
        updated_at: TimeZoneAwareDate.now()
      },
      {
        lane: 'ops',
        description: 'Operations, admin, and business management',
        weight: 0.25,
        min_block_minutes: 30,
        max_daily_minutes: 180,
        priority_multiplier: 1.0,
        context_type: 'admin',
        energy_preference: 'MEDIUM',
        is_active: true,
        created_at: TimeZoneAwareDate.now(),
        updated_at: TimeZoneAwareDate.now()
      },
      {
        lane: 'creative',
        description: 'Creative work, strategy, and innovation',
        weight: 0.20,
        min_block_minutes: 45,
        max_daily_minutes: 150,
        priority_multiplier: 0.9,
        context_type: 'creative',
        energy_preference: 'HIGH',
        is_active: true,
        created_at: TimeZoneAwareDate.now(),
        updated_at: TimeZoneAwareDate.now()
      },
      {
        lane: 'personal',
        description: 'Personal development, learning, and growth',
        weight: 0.20,
        min_block_minutes: 30,
        max_daily_minutes: 120,
        priority_multiplier: 0.8,
        context_type: 'learning',
        energy_preference: 'MEDIUM',
        is_active: true,
        created_at: TimeZoneAwareDate.now(),
        updated_at: TimeZoneAwareDate.now()
      }
    ];

    // Filter out lanes that already exist
    const lanesToCreate = defaultLanes.filter(lane => {
      return !existingLaneNames.has(lane.lane.toLowerCase());
    });

    if (lanesToCreate.length === 0) {
      Logger.log('[SystemBootstrap] All default lanes already exist - nothing to seed');
      return { success: true, skipped: true, existing: existingLaneNames.size };
    }

    // Convert lanes to sheet rows
    const rows = lanesToCreate.map(lane => {
      return headers.map(header => {
        const value = lane[header];
        if (value === undefined || value === null) return '';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return value;
      });
    });

    // Append to sheet
    batchOps.appendRows(SHEET_NAMES.LANES, rows);

    Logger.log(`[SystemBootstrap] ✓ Successfully seeded ${lanesToCreate.length} new lanes: ${lanesToCreate.map(l => l.lane).join(', ')}`);

    return {
      success: true,
      lanes_created: lanesToCreate.length,
      lane_names: lanesToCreate.map(l => l.lane),
      skipped_existing: Array.from(existingLaneNames)
    };

  } catch (error) {
    // RETHROW_WITH_LOG profile
    // TEST: TEST_SILENT_085_SEEDDEFAULTLANES
    LoggerFacade.error('SystemBootstrap', 'Seeding default lanes failed', {
      error: error.message,
      stack: error.stack,
      context: 'seedDefaultLanes'
    });

    throw error;
  }
}
