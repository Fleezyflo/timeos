/**
 * MOH TIME OS v2.0 - SERVICE REGISTRATION
 *
 * Complete dependency injection service registry.
 * Registers all system services in proper dependency order.
 * Handles circular dependencies with lazy loading patterns.
 *
 * Original lines: 8122-8367 from scriptA.js
 */

/**
 * Register all system services in dependency order
 * This function sets up the entire service registry
 */
function registerAllServices() {
  Logger.log('[ServiceRegistration] Starting FULL service registration...');

  // Begin registration session with FULL validation mode
  container.beginRegistrationSession('FULL_SYSTEM_REGISTRATION', 'FULL');

  Logger.log('[ServiceRegistration] Container state - services: ' + container.services.size +
             ', factories: ' + container.factories.size +
             ', lazy: ' + container.lazyFactories.size);

  // DIRECTIVE #2: STATIC REFERENCE MANDATE - All service names use SERVICES enum

  // Layer 1: No dependencies (but bootstrap-safe)
  container.register(SERVICES.PersistentStore, () => new PersistentStore());
  container.register(SERVICES.CrossExecutionCache, () => new CrossExecutionCache(
    container.get(SERVICES.PersistentStore)
  ));

  // Layer 2: Depends on Layer 1 services
  container.register(SERVICES.SmartLogger, () => new SmartLogger(container.get(SERVICES.CrossExecutionCache)));
  container.register(SERVICES.ErrorHandler, () => new ErrorHandler(container.get(SERVICES.SmartLogger)));
  container.register(SERVICES.BatchOperations, () => new BatchOperations(
    container.get(SERVICES.CrossExecutionCache),
    container.get(SERVICES.SmartLogger)
  ));
  container.register(SERVICES.DistributedLockManager, () => new DistributedLockManager(
    container.get(SERVICES.PersistentStore),
    container.get(SERVICES.SmartLogger)
  ));

  // Layer 3: Depends on multiple Layer 1 services (HARDENED VERSION)
  container.register(
    SERVICES.ConfigManager,
    () => new HardenedConfigManager(
      container.get(SERVICES.CrossExecutionCache),
      container.get(SERVICES.PersistentStore),
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.SmartLogger)
    )
  );

  // Layer 4: Application-specific managers
  container.register(
    SERVICES.FoundationBlocksManager,
    () => new FoundationBlocksManager(
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.ErrorHandler),
      container.get(SERVICES.SmartLogger)
    )
  );

  container.register(
    SERVICES.DynamicLaneManager,
    () => new DynamicLaneManager(
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.ErrorHandler),
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.FoundationBlocksManager),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.CrossExecutionCache)
    )
  );

  // Layer 5: Human state management and calendar services
  container.register(
    SERVICES.HumanStateManager,
    () => new HumanStateManager(
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.ConfigManager)
    )
  );

  container.register(
    SERVICES.CalendarSyncManager,
    () => new CalendarSyncManager(
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.ErrorHandler),
      container.get(SERVICES.SmartLogger)
    )
  );

  // Layer 6: The scheduling brain - depends on all foundation services
  container.register(
    SERVICES.IntelligentScheduler,
    () => new IntelligentScheduler(
      container.get(SERVICES.FoundationBlocksManager),
      container.get(SERVICES.CalendarSyncManager),
      container.get(SERVICES.ErrorHandler),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.HumanStateManager),
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.CrossExecutionCache),
      container.get(SERVICES.DynamicLaneManager)
    )
  );

  // Layer 6A: ZERO-TRUST TRIAGE ENGINE - New email processing components
  container.register(
    SERVICES.SenderReputationManager,
    () => new SenderReputationManager(
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.CrossExecutionCache)
    )
  );

  // EmailIngestionEngine with lazy circular dependency resolution
  container.register(
    SERVICES.EmailIngestionEngine,
    () => new EmailIngestionEngine(
      container.get(SERVICES.ConfigManager),      // configManager (1st param)
      container.get(SERVICES.ErrorHandler),       // errorHandler (2nd param)
      container.get(SERVICES.BatchOperations),    // batchOperations (3rd param)
      container.get(SERVICES.SmartLogger),        // logger (4th param)
      container.get(SERVICES.PersistentStore)     // persistentStore (5th param)
    )
  );

  container.register(
    SERVICES.ZeroTrustTriageEngine,
    () => new ZeroTrustTriageEngine(
      container.get(SERVICES.SenderReputationManager), // 1st param
      container.get(SERVICES.BatchOperations),         // 2nd param
      container.get(SERVICES.SmartLogger),            // 3rd param
      container.get(SERVICES.ConfigManager),          // 4th param
      container.get(SERVICES.ErrorHandler)            // 5th param
    )
  );

  // Layer 7: Archive Management for external spreadsheet archiving
  container.register(
    SERVICES.ArchiveManager,
    () => new ArchiveManager(
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.BatchOperations)
    )
  );

  container.register(
    SERVICES.ChatEngine,
    () => new ChatEngine(
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.CrossExecutionCache),
      container.get(SERVICES.ErrorHandler),
      container.get(SERVICES.ArchiveManager)
    )
  );

  // Layer 8: Output and synchronization services
  container.register(
    SERVICES.SystemManager,
    () => new SystemManager(
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.ErrorHandler),
      container.get(SERVICES.ArchiveManager)
    )
  );

  // Web App Services
  container.register(
    SERVICES.SecureWebAppAuth,
    () => new SecureWebAppAuth(container.get(SERVICES.SmartLogger))
  );

  container.register(
    SERVICES.AppSheetBridge,
    () => new AppSheetBridge(
      container.get(SERVICES.ConfigManager),
      container.get(SERVICES.SystemManager)
    )
  );

  container.register(
    SERVICES.WebAppManager,
    () => new WebAppManager(
      container.get(SERVICES.AppSheetBridge),
      container.get(SERVICES.ChatEngine),
      container.get(SERVICES.SystemManager),
      container.get(SERVICES.SecureWebAppAuth),
      container.get(SERVICES.SmartLogger)
    )
  );

  container.register(
    SERVICES.TriggerOrchestrator,
    () => new TriggerOrchestrator(
      container.get(SERVICES.EmailIngestionEngine),
      container.get(SERVICES.IntelligentScheduler),
      container.get(SERVICES.ArchiveManager),
      container.get(SERVICES.FoundationBlocksManager),
      container.get(SERVICES.HumanStateManager),
      container.get(SERVICES.CalendarSyncManager),
      container.get(SERVICES.SystemManager),
      container.get(SERVICES.SenderReputationManager),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.DistributedLockManager)
    )
  );

  // Business Logic Services
  container.register(
    SERVICES.BusinessLogicValidation,
    () => new BusinessLogicValidation(
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.ErrorHandler)
    )
  );

  container.register(
    SERVICES.AuditProtocol,
    () => new AuditProtocol(
      container.get(SERVICES.BatchOperations),
      container.get(SERVICES.SmartLogger),
      container.get(SERVICES.PersistentStore)
    )
  );

  // THE STRATEGIC AUDIT: Testing and Development Support Services
  container.register(SERVICES.MockService, () => new MockService());
  container.register(SERVICES.TestSeeder, () => new TestSeeder(
    container.get(SERVICES.BatchOperations),
    container.get(SERVICES.SmartLogger)
  ));
  container.register(SERVICES.MockBatchOperations, () => new MockBatchOperations(container.get(SERVICES.CrossExecutionCache)));

  // External Google Services (for circuit breaker management)
  container.register(SERVICES.EXTERNAL_CALENDAR, () => CalendarApp);
  container.register(SERVICES.EXTERNAL_GMAIL, () => GmailApp);
  container.register(SERVICES.EXTERNAL_SHEETS, () => SpreadsheetApp);
  container.register(SERVICES.EXTERNAL_DRIVE, () => DriveApp);

  Logger.log('[ServiceRegistration] ✅ Service registration completed');
  Logger.log('[ServiceRegistration] Final state - services: ' + container.services.size +
             ', factories: ' + container.factories.size +
             ', lazy: ' + container.lazyFactories.size);

  // End registration session (triggers FULL validation via validateServiceRegistrations)
  const sessionSummary = container.endRegistrationSession();

  // Resolve circular dependency AFTER all services are registered
  const emailEngine = container.get(SERVICES.EmailIngestionEngine);
  const triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);
  emailEngine.triageEngine = triageEngine;
  triageEngine.emailIngestionEngine = emailEngine;
  Logger.log('[ServiceRegistration] ✅ Circular dependencies resolved.');

  Logger.log(`[ServiceRegistration] ✅ Full registration completed: ${sessionSummary.servicesRegistered} services registered and validated in ${sessionSummary.duration}ms`);

  return sessionSummary;
}

/**
 * Register a single service by name
 * Called by container.registerWithDependencies() for incremental registration
 *
 * CRITICAL: This function must match the factory logic in registerAllServices()
 * When service constructors change, update both functions
 *
 * @param {string} serviceName - Service name from SERVICES enum
 * @throws {Error} If service name is unknown
 */
function registerService(serviceName) {
  // Use switch statement for all services
  switch (serviceName) {
    // Layer 1: No dependencies
    case SERVICES.PersistentStore:
      container.register(SERVICES.PersistentStore, () => new PersistentStore());
      break;

    // Layer 2: Single dependency
    case SERVICES.CrossExecutionCache:
      container.register(SERVICES.CrossExecutionCache, () => new CrossExecutionCache(
        container.get(SERVICES.PersistentStore)
      ));
      break;

    case SERVICES.SmartLogger:
      container.register(SERVICES.SmartLogger, () => new SmartLogger(
        container.get(SERVICES.CrossExecutionCache)
      ));
      break;

    case SERVICES.ErrorHandler:
      container.register(SERVICES.ErrorHandler, () => new ErrorHandler(
        container.get(SERVICES.SmartLogger)
      ));
      break;

    // Layer 3: Multiple dependencies
    case SERVICES.BatchOperations:
      container.register(SERVICES.BatchOperations, () => new BatchOperations(
        container.get(SERVICES.CrossExecutionCache),
        container.get(SERVICES.SmartLogger)
      ));
      break;

    case SERVICES.DistributedLockManager:
      container.register(SERVICES.DistributedLockManager, () => new DistributedLockManager(
        container.get(SERVICES.PersistentStore),
        container.get(SERVICES.SmartLogger)
      ));
      break;

    case SERVICES.ConfigManager:
      container.register(
        SERVICES.ConfigManager,
        () => new HardenedConfigManager(
          container.get(SERVICES.CrossExecutionCache),
          container.get(SERVICES.PersistentStore),
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger)
        )
      );
      break;

    // Layer 4: Application managers
    case SERVICES.FoundationBlocksManager:
      container.register(
        SERVICES.FoundationBlocksManager,
        () => new FoundationBlocksManager(
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.ErrorHandler),
          container.get(SERVICES.SmartLogger)
        )
      );
      break;

    case SERVICES.DynamicLaneManager:
      container.register(
        SERVICES.DynamicLaneManager,
        () => new DynamicLaneManager(
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.ErrorHandler),
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.FoundationBlocksManager),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.CrossExecutionCache)
        )
      );
      break;

    // Layer 5: Human state and calendar
    case SERVICES.HumanStateManager:
      container.register(
        SERVICES.HumanStateManager,
        () => new HumanStateManager(
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.ConfigManager)
        )
      );
      break;

    case SERVICES.CalendarSyncManager:
      container.register(
        SERVICES.CalendarSyncManager,
        () => new CalendarSyncManager(
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.ErrorHandler),
          container.get(SERVICES.SmartLogger)
        )
      );
      break;

    // Layer 6: Scheduler
    case SERVICES.IntelligentScheduler:
      container.register(
        SERVICES.IntelligentScheduler,
        () => new IntelligentScheduler(
          container.get(SERVICES.FoundationBlocksManager),
          container.get(SERVICES.CalendarSyncManager),
          container.get(SERVICES.ErrorHandler),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.HumanStateManager),
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.CrossExecutionCache),
          container.get(SERVICES.DynamicLaneManager)
        )
      );
      break;

    // Layer 6A: Email processing
    case SERVICES.SenderReputationManager:
      container.register(
        SERVICES.SenderReputationManager,
        () => new SenderReputationManager(
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.CrossExecutionCache)
        )
      );
      break;

    case SERVICES.EmailIngestionEngine:
      container.register(
        SERVICES.EmailIngestionEngine,
        () => new EmailIngestionEngine(
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.ErrorHandler),
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.PersistentStore)
        )
      );
      break;

    case SERVICES.ZeroTrustTriageEngine:
      container.register(
        SERVICES.ZeroTrustTriageEngine,
        () => new ZeroTrustTriageEngine(
          container.get(SERVICES.SenderReputationManager),
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.ErrorHandler)
        )
      );
      break;

    // Layer 7: Archive and system management
    case SERVICES.ArchiveManager:
      container.register(
        SERVICES.ArchiveManager,
        () => new ArchiveManager(
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.BatchOperations)
        )
      );
      break;

    case SERVICES.ChatEngine:
      container.register(
        SERVICES.ChatEngine,
        () => new ChatEngine(
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.CrossExecutionCache),
          container.get(SERVICES.ErrorHandler),
          container.get(SERVICES.ArchiveManager)
        )
      );
      break;

    case SERVICES.SystemManager:
      container.register(
        SERVICES.SystemManager,
        () => new SystemManager(
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.ErrorHandler),
          container.get(SERVICES.ArchiveManager)
        )
      );
      break;

    // Layer 8: Web services
    case SERVICES.SecureWebAppAuth:
      container.register(
        SERVICES.SecureWebAppAuth,
        () => new SecureWebAppAuth(container.get(SERVICES.SmartLogger))
      );
      break;

    case SERVICES.AppSheetBridge:
      container.register(
        SERVICES.AppSheetBridge,
        () => new AppSheetBridge(
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.SystemManager)
        )
      );
      break;

    case SERVICES.WebAppManager:
      container.register(
        SERVICES.WebAppManager,
        () => new WebAppManager(
          container.get(SERVICES.AppSheetBridge),
          container.get(SERVICES.ChatEngine),
          container.get(SERVICES.SystemManager),
          container.get(SERVICES.SecureWebAppAuth),
          container.get(SERVICES.SmartLogger)
        )
      );
      break;

    // Layer 9: Orchestration
    case SERVICES.TriggerOrchestrator:
      container.register(
        SERVICES.TriggerOrchestrator,
        () => new TriggerOrchestrator(
          container.get(SERVICES.EmailIngestionEngine),
          container.get(SERVICES.IntelligentScheduler),
          container.get(SERVICES.ArchiveManager),
          container.get(SERVICES.FoundationBlocksManager),
          container.get(SERVICES.HumanStateManager),
          container.get(SERVICES.CalendarSyncManager),
          container.get(SERVICES.SystemManager),
          container.get(SERVICES.SenderReputationManager),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.DistributedLockManager)
        )
      );
      break;

    // Layer 10: Business logic
    case SERVICES.BusinessLogicValidation:
      container.register(
        SERVICES.BusinessLogicValidation,
        () => new BusinessLogicValidation(
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.ErrorHandler)
        )
      );
      break;

    case SERVICES.AuditProtocol:
      container.register(
        SERVICES.AuditProtocol,
        () => new AuditProtocol(
          container.get(SERVICES.BatchOperations),
          container.get(SERVICES.SmartLogger),
          container.get(SERVICES.PersistentStore)
        )
      );
      break;

    // Testing services
    case SERVICES.MockService:
      container.register(SERVICES.MockService, () => new MockService());
      break;

    case SERVICES.TestSeeder:
      container.register(SERVICES.TestSeeder, () => new TestSeeder(
        container.get(SERVICES.BatchOperations),
        container.get(SERVICES.SmartLogger)
      ));
      break;

    case SERVICES.MockBatchOperations:
      container.register(SERVICES.MockBatchOperations, () => new MockBatchOperations(
        container.get(SERVICES.CrossExecutionCache)
      ));
      break;

    // External services
    case SERVICES.EXTERNAL_CALENDAR:
      container.register(SERVICES.EXTERNAL_CALENDAR, () => CalendarApp);
      break;

    case SERVICES.EXTERNAL_GMAIL:
      container.register(SERVICES.EXTERNAL_GMAIL, () => GmailApp);
      break;

    case SERVICES.EXTERNAL_SHEETS:
      container.register(SERVICES.EXTERNAL_SHEETS, () => SpreadsheetApp);
      break;

    case SERVICES.EXTERNAL_DRIVE:
      container.register(SERVICES.EXTERNAL_DRIVE, () => DriveApp);
      break;

    default:
      throw new Error(`registerService: Unknown service name: ${serviceName}`);
  }
}

/**
 * Register minimal set of services (incremental registration)
 * Only registers requested services + their transitive dependencies
 * Uses INCREMENTAL validation mode (validates only newly registered services)
 *
 * Used by: TriggerSetup.gs for lightweight operations
 * For full system setup, use registerAllServices() instead
 *
 * @param {Array<string>} requiredServices - Array of service names from SERVICES enum
 * @throws {Error} If registration or validation fails
 * @returns {Object} Session summary with servicesRegistered, duration, validationResults
 */
function registerMinimalServices(requiredServices) {
  if (!Array.isArray(requiredServices) || requiredServices.length === 0) {
    throw new Error('registerMinimalServices: requiredServices must be a non-empty array');
  }

  Logger.log(`[ServiceRegistration] Starting INCREMENTAL registration for ${requiredServices.length} service(s): ${requiredServices.join(', ')}`);

  // Begin registration session with INCREMENTAL validation
  container.beginRegistrationSession('INCREMENTAL_REGISTRATION', 'INCREMENTAL');

  try {
    // Register each requested service + dependencies
    for (const serviceName of requiredServices) {
      Logger.log(`[ServiceRegistration] Registering ${serviceName} with dependencies...`);
      container.registerWithDependencies(serviceName);
    }

    // End session (triggers INCREMENTAL validation)
    const sessionSummary = container.endRegistrationSession();

    Logger.log(`[ServiceRegistration] ✅ Incremental registration completed: ${sessionSummary.servicesRegistered} services registered and validated in ${sessionSummary.duration}ms`);

    return sessionSummary;

  } catch (error) {
    Logger.log(`[ServiceRegistration] ❌ Incremental registration failed: ${error.message}`);

    // If session still active, end it (cleanup)
    if (container.currentSession !== null) {
      try {
        container.currentSession = null; // Force cleanup without validation
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    throw error;
  }
}

/**
 * Comprehensive service registration validation
 * Validates all services in SERVICES enum are registered and functional
 * Tests circular dependency resolution for critical service pairs
 * Provides detailed diagnostics for service wiring issues
 */
function validateServiceRegistrations() {
  const logger = container.has(SERVICES.SmartLogger) ?
    container.get(SERVICES.SmartLogger) :
    { info: function(c, m) { Logger.log('[' + c + '] ' + m); }, error: function(c, m) { Logger.log('ERROR [' + c + '] ' + m); }, warn: function(c, m) { Logger.log('WARN [' + c + '] ' + m); } };

  logger.info('ServiceValidation', 'Starting comprehensive service registration validation');

  // 1. Check all services in SERVICES enum are registered
  const requiredServices = Object.values(SERVICES).filter(serviceName =>
    !serviceName.startsWith('EXTERNAL_') // Exclude external service identifiers
  );
  const missing = [];
  const registrationErrors = [];

  requiredServices.forEach(serviceName => {
    try {
      if (!container.has(serviceName)) {
        missing.push(serviceName);
      } else {
        // Try to instantiate the service to catch constructor issues
        const service = container.get(serviceName);
        if (!service) {
          registrationErrors.push({ service: serviceName, error: 'Service instantiated as null/undefined' });
        }
      }
    } catch (error) {
      registrationErrors.push({ service: serviceName, error: error.message });
    }
  });

  if (missing.length > 0) {
    const errorMsg = `Missing service registrations: ${missing.join(', ')}`;
    logger.error('ServiceValidation', errorMsg);
    throw new Error(errorMsg);
  }

  if (registrationErrors.length > 0) {
    const errorDetails = registrationErrors.map(e => `${e.service}: ${e.error}`).join('; ');
    const errorMsg = `Service instantiation failures: ${errorDetails}`;
    logger.error('ServiceValidation', errorMsg);
    throw new Error(errorMsg);
  }

  // 2. Validate circular dependency resolution (EmailIngestionEngine ↔ ZeroTrustTriageEngine)
  logger.info('ServiceValidation', 'Testing critical circular dependency resolution');

  try {
    const emailEngine = container.get(SERVICES.EmailIngestionEngine);
    const triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);

    if (!emailEngine || !triageEngine) {
      throw new Error('Critical services failed to instantiate during circular dependency test');
    }

    // Verify the circular dependency lazy getters exist and work
    // These are now getter properties, not methods
    // Simply try to access them - they're lazy getters
    let triageFromEmail, emailFromTriage;

    try {
      triageFromEmail = emailEngine.triageEngine;
      if (!triageFromEmail) {
        throw new Error('EmailIngestionEngine.triageEngine getter returned null/undefined');
      }
    } catch (e) {
      throw new Error('EmailIngestionEngine missing working triageEngine getter: ' + e.message);
    }

    try {
      emailFromTriage = triageEngine.emailIngestionEngine;
      if (!emailFromTriage) {
        throw new Error('ZeroTrustTriageEngine.emailIngestionEngine getter returned null/undefined');
      }
    } catch (e) {
      throw new Error('ZeroTrustTriageEngine missing working emailIngestionEngine getter: ' + e.message);
    }

    if (!triageFromEmail || !emailFromTriage) {
      throw new Error('Circular dependency resolution failed - lazy getters returned null/undefined');
    }

    logger.info('ServiceValidation', 'Circular dependency resolution validated successfully');

  } catch (circularError) {
    const errorMsg = `Circular dependency validation failed: ${circularError.message}`;
    logger.error('ServiceValidation', errorMsg);
    throw new Error(errorMsg);
  }

  // 3. Service health validation - test core service methods are accessible
  const coreServiceHealthChecks = [
    { service: SERVICES.SmartLogger, methods: ['info', 'error', 'warn'] },
    { service: SERVICES.BatchOperations, methods: ['batchWrite', 'batchRead'] },
    { service: SERVICES.ConfigManager, methods: ['getConfig', 'updateConfig'] },
    { service: SERVICES.SystemManager, methods: ['runHealthCheck'] },
    { service: SERVICES.IntelligentScheduler, methods: ['runSchedulingCycle'] }
  ];

  const healthFailures = [];
  coreServiceHealthChecks.forEach(check => {
    try {
      const service = container.get(check.service);
      check.methods.forEach(methodName => {
        if (typeof service[methodName] !== 'function') {
          healthFailures.push(`${check.service}.${methodName} is not a function`);
        }
      });
    } catch (error) {
      healthFailures.push(`${check.service} health check failed: ${error.message}`);
    }
  });

  if (healthFailures.length > 0) {
    const errorMsg = `Service health validation failures: ${healthFailures.join('; ')}`;
    logger.error('ServiceValidation', errorMsg);
    throw new Error(errorMsg);
  }

  // 4. Create service dependency map for debugging
  const dependencyMap = createServiceDependencyMap();
  logger.info('ServiceValidation', 'Service dependency map created', {
    totalServices: requiredServices.length,
    dependencyMap: dependencyMap
  });

  // 5. Validate service call patterns across the codebase
  const serviceCallValidation = validateServiceCallPatterns();

  logger.info('ServiceValidation', `All ${requiredServices.length} services validated successfully`);
  return {
    success: true,
    servicesValidated: requiredServices.length,
    circularDependencyResolved: true,
    healthChecksPasssed: coreServiceHealthChecks.length,
    serviceCallValidation: serviceCallValidation,
    dependencyMap: dependencyMap
  };
}

/**
 * Creates a service dependency map for debugging and validation
 * Maps each service to its direct dependencies
 */
function createServiceDependencyMap() {
  const dependencyMap = {};

  // Core infrastructure layer
  dependencyMap[SERVICES.PersistentStore] = [];
  dependencyMap[SERVICES.CrossExecutionCache] = [SERVICES.PersistentStore];
  dependencyMap[SERVICES.SmartLogger] = [SERVICES.CrossExecutionCache];
  dependencyMap[SERVICES.ErrorHandler] = [SERVICES.SmartLogger];
  dependencyMap[SERVICES.BatchOperations] = [SERVICES.CrossExecutionCache, SERVICES.SmartLogger];
  dependencyMap[SERVICES.DistributedLockManager] = [SERVICES.PersistentStore, SERVICES.SmartLogger];

  // Configuration and foundation
  dependencyMap[SERVICES.ConfigManager] = [SERVICES.CrossExecutionCache, SERVICES.PersistentStore, SERVICES.BatchOperations, SERVICES.SmartLogger];
  dependencyMap[SERVICES.FoundationBlocksManager] = [SERVICES.ConfigManager, SERVICES.ErrorHandler, SERVICES.SmartLogger];
  dependencyMap[SERVICES.DynamicLaneManager] = [SERVICES.ConfigManager, SERVICES.ErrorHandler, SERVICES.BatchOperations, SERVICES.FoundationBlocksManager, SERVICES.SmartLogger, SERVICES.CrossExecutionCache];

  // Application services
  dependencyMap[SERVICES.CalendarSyncManager] = [SERVICES.BatchOperations, SERVICES.ConfigManager, SERVICES.ErrorHandler, SERVICES.SmartLogger];
  dependencyMap[SERVICES.HumanStateManager] = [SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.ConfigManager];
  dependencyMap[SERVICES.ArchiveManager] = [SERVICES.ConfigManager, SERVICES.SmartLogger, SERVICES.BatchOperations];
  dependencyMap[SERVICES.SystemManager] = [SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.ConfigManager, SERVICES.ErrorHandler, SERVICES.ArchiveManager];

  // Email processing (with circular dependency)
  dependencyMap[SERVICES.SenderReputationManager] = [SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.ConfigManager, SERVICES.CrossExecutionCache];
  dependencyMap[SERVICES.EmailIngestionEngine] = [SERVICES.ConfigManager, SERVICES.ErrorHandler, SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.PersistentStore, 'LAZY:ZeroTrustTriageEngine'];
  dependencyMap[SERVICES.ZeroTrustTriageEngine] = [SERVICES.SenderReputationManager, SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.ConfigManager, SERVICES.ErrorHandler, 'LAZY:EmailIngestionEngine'];

  // Scheduling
  dependencyMap[SERVICES.IntelligentScheduler] = [SERVICES.FoundationBlocksManager, SERVICES.CalendarSyncManager, SERVICES.ErrorHandler, SERVICES.SmartLogger, SERVICES.ConfigManager, SERVICES.HumanStateManager, SERVICES.BatchOperations, SERVICES.CrossExecutionCache, SERVICES.DynamicLaneManager];

  // Other application services
  dependencyMap[SERVICES.ChatEngine] = [SERVICES.ConfigManager, SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.CrossExecutionCache, SERVICES.ErrorHandler, SERVICES.ArchiveManager];
  dependencyMap[SERVICES.TriggerOrchestrator] = [SERVICES.EmailIngestionEngine, SERVICES.IntelligentScheduler, SERVICES.ArchiveManager, SERVICES.FoundationBlocksManager, SERVICES.HumanStateManager, SERVICES.CalendarSyncManager, SERVICES.SystemManager, SERVICES.SenderReputationManager, SERVICES.SmartLogger, SERVICES.DistributedLockManager];

  // Web services
  dependencyMap[SERVICES.SecureWebAppAuth] = [SERVICES.SmartLogger];
  dependencyMap[SERVICES.AppSheetBridge] = [SERVICES.ConfigManager, SERVICES.SystemManager];
  dependencyMap[SERVICES.WebAppManager] = [SERVICES.AppSheetBridge, SERVICES.ChatEngine, SERVICES.SystemManager, SERVICES.SecureWebAppAuth, SERVICES.SmartLogger];

  // Business logic
  dependencyMap[SERVICES.BusinessLogicValidation] = [SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.ErrorHandler];
  dependencyMap[SERVICES.AuditProtocol] = [SERVICES.BatchOperations, SERVICES.SmartLogger, SERVICES.PersistentStore];

  // Test services
  dependencyMap[SERVICES.MockService] = [];
  dependencyMap[SERVICES.TestSeeder] = [SERVICES.BatchOperations, SERVICES.SmartLogger];
  dependencyMap[SERVICES.MockBatchOperations] = [SERVICES.CrossExecutionCache];

  return dependencyMap;
}

/**
 * NOTE: safeGetService has been moved to Preload.gs for early availability
 * This ensures it's accessible to AB_Constants.gs and other early-loading files
 */

/**
 * Validates that all getService calls in the codebase have proper error handling
 * Scans critical files for potential service access issues
 */
function validateServiceCallPatterns() {
  const logger = container.has(SERVICES.SmartLogger) ?
    container.get(SERVICES.SmartLogger) : console;

  const criticalServiceChecks = [
    { service: SERVICES.SmartLogger, required: false, fallback: 'console' },
    { service: SERVICES.BatchOperations, required: true, fallback: null },
    { service: SERVICES.ConfigManager, required: true, fallback: null },
    { service: SERVICES.ErrorHandler, required: true, fallback: null },
    { service: SERVICES.SystemManager, required: false, fallback: null }
  ];

  const validationResults = [];

  criticalServiceChecks.forEach(check => {
    try {
      const service = safeGetService(check.service);

      validationResults.push({
        service: check.service,
        available: service !== null,
        required: check.required,
        status: service !== null ? 'OK' : (check.required ? 'CRITICAL_MISSING' : 'OPTIONAL_MISSING')
      });

      if (check.required && !service) {
        throw new Error(`Critical service ${check.service} is not available and is required for system operation`);
      }

    } catch (error) {
      validationResults.push({
        service: check.service,
        available: false,
        required: check.required,
        status: 'ERROR',
        error: error.message
      });

      if (check.required) {
        throw error;
      }
    }
  });

  if (logger.info) {
    logger.info('ServiceValidation', 'Service call pattern validation completed', {
      results: validationResults,
      criticalIssues: validationResults.filter(r => r.status === 'CRITICAL_MISSING' || r.status === 'ERROR').length
    });
  }

  return validationResults;
}
