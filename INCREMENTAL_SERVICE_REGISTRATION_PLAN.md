# INCREMENTAL SERVICE REGISTRATION IMPLEMENTATION PLAN
**Project:** MOH TIME OS v2.0
**Feature:** Incremental Service Registration with Smart Validation
**Goal:** Reduce `removeAllTriggers()` execution time from 15+ seconds to ~1 second
**Method:** Replace all-or-nothing service registration with incremental dependency-aware registration

---

## OVERVIEW

### Current Problem
- `removeAllTriggers()` only needs **SmartLogger** (1 service)
- But triggers registration of **all 31 services** via `ensureServicesRegistered()`
- Then validates all 31 services via `validateServiceRegistrations()` (line 287: eagerly instantiates every service)
- Result: **15+ second cold start** for 1-line operation

### Solution Architecture
1. **Container Enhancement:** Add registration sessions, incremental validation, transitive dependency resolution
2. **Dependency Map:** Create `SERVICE_DEPENDENCIES` constant mapping each service to its direct dependencies
3. **Smart Registration:** New function `registerMinimalServices()` that only registers requested service + dependencies
4. **Dual Validation:** Full validation for setup, incremental validation for runtime operations
5. **Backward Compatible:** Keep `registerAllServices()` unchanged for full system setup

### Files Modified
1. `src/0_bootstrap/AA_Container.gs` (529 lines) → Add ~320 lines
2. `src/0_bootstrap/AB_Constants.gs` (356 lines) → Add ~180 lines
3. `src/8_setup/ServiceRegistration.gs` (522 lines) → Add ~220 lines, modify ~15 lines
4. `src/8_setup/TriggerSetup.gs` (267 lines) → Modify ~40 lines

### Expected Results
- `removeAllTriggers()`: 15s → **~1s** (93% faster)
- `installAllTriggers()`: 20s → **~2s** (90% faster)
- `completeSetup()`: No change (still validates everything once)
- Safety: ALL validation checks preserved (circular deps, interfaces, constructors)

---

## BRIEF 1: CONTAINER ENHANCEMENT - REGISTRATION SESSIONS

**Agent:** Surgical Code Editor
**File:** `/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/0_bootstrap/AA_Container.gs`
**Current Line Count:** 529 lines
**Changes:** Add new properties to constructor, add 4 new methods

### TASK 1A: Add Registration Session Properties to Constructor

**Location:** Line 9 (constructor method)
**Action:** Add properties after line 24 (after `criticalServices` Set)

**EXACT CODE TO INSERT AFTER LINE 24:**
```javascript
    this.registrationSessions = [];         // Track registration history
    this.currentSession = null;             // Active registration session
    this.validatedServices = new Set();     // Services that passed validation
    this.validationMode = 'FULL';           // 'FULL' | 'INCREMENTAL' | 'NONE'
```

**VERIFICATION:**
- Line 25 should now be: `this.registrationSessions = [];`
- Constructor should have 13 properties total (was 9, added 4)
- No syntax errors when file is read

---

### TASK 1B: Add `beginRegistrationSession()` Method

**Location:** After line 490 (after `getHealthStatus()` method, before closing brace of class)
**Action:** Insert new method

**EXACT CODE TO INSERT AFTER LINE 490:**
```javascript

  /**
   * Start a new registration session for incremental registration
   * Tracks what services are registered in this session for targeted validation
   *
   * @param {string} sessionName - Descriptive name for this registration session
   * @param {string} mode - Validation mode: 'FULL' (validate all) | 'INCREMENTAL' (new only) | 'NONE'
   * @returns {Object} Session object with name, mode, registeredServices[], startTime
   */
  beginRegistrationSession(sessionName, mode = 'INCREMENTAL') {
    if (this.currentSession !== null) {
      this._log('warn', `Registration session '${this.currentSession.name}' already active, will be replaced`);
    }

    this.currentSession = {
      name: sessionName,
      mode: mode,
      registeredServices: [],
      startTime: Date.now(),
      endTime: null
    };

    this.validationMode = mode;

    this._log('info', `Started registration session: ${sessionName} (mode: ${mode})`);
    return this.currentSession;
  }
```

**VERIFICATION:**
- Method starts at line 492
- `this.currentSession` is assigned an object with 5 properties
- Returns `this.currentSession`

---

### TASK 1C: Add `endRegistrationSession()` Method

**Location:** After the `beginRegistrationSession()` method just added
**Action:** Insert new method

**EXACT CODE TO INSERT:**
```javascript

  /**
   * End active registration session and perform validation based on session mode
   * - FULL: Validate all registered services (existing behavior)
   * - INCREMENTAL: Validate only services registered in this session
   * - NONE: Skip validation
   *
   * @throws {Error} If no active session or validation fails
   * @returns {Object} Session summary with servicesRegistered, duration, validationResults
   */
  endRegistrationSession() {
    if (this.currentSession === null) {
      throw new Error('Container.endRegistrationSession: No active registration session to end');
    }

    const session = this.currentSession;
    session.endTime = Date.now();
    const duration = session.endTime - session.startTime;

    this._log('info', `Ending registration session: ${session.name} (${session.registeredServices.length} services, ${duration}ms)`);

    // Perform validation based on mode
    let validationResults = null;
    try {
      if (session.mode === 'FULL') {
        this._log('info', 'Performing FULL validation of all services');
        validationResults = this._validateAllServices();
      } else if (session.mode === 'INCREMENTAL') {
        this._log('info', `Performing INCREMENTAL validation of ${session.registeredServices.length} services`);
        validationResults = this._validateIncrementalServices(session.registeredServices);
      } else if (session.mode === 'NONE') {
        this._log('info', 'Skipping validation (mode: NONE)');
        validationResults = { skipped: true, mode: 'NONE' };
      } else {
        throw new Error(`Invalid validation mode: ${session.mode}`);
      }
    } catch (error) {
      this._log('error', `Registration session validation failed: ${error.message}`);
      this.currentSession = null;
      throw error;
    }

    // Store session in history
    const sessionSummary = {
      name: session.name,
      mode: session.mode,
      servicesRegistered: session.registeredServices.length,
      servicesList: session.registeredServices,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: duration,
      validationResults: validationResults
    };

    this.registrationSessions.push(sessionSummary);
    this.currentSession = null;

    this._log('info', `Registration session '${session.name}' completed successfully`);

    return sessionSummary;
  }
```

**VERIFICATION:**
- Method validates session exists (throws if null)
- Calls validation method based on mode
- Stores session in `this.registrationSessions` array
- Clears `this.currentSession`
- Returns summary object

---

### TASK 1D: Add `registerWithDependencies()` Method

**Location:** After the `endRegistrationSession()` method just added
**Action:** Insert new method

**EXACT CODE TO INSERT:**
```javascript

  /**
   * Register a service and all its transitive dependencies
   * Uses SERVICE_DEPENDENCIES constant to resolve full dependency tree
   * Only registers services not already registered and validated
   *
   * @param {string} serviceName - Service name from SERVICES enum
   * @throws {Error} If SERVICE_DEPENDENCIES not defined or service unknown
   */
  registerWithDependencies(serviceName) {
    // Check if already registered and validated
    if (this.has(serviceName) && this.validatedServices.has(serviceName)) {
      this._log('debug', `Service ${serviceName} already registered and validated, skipping`);
      return;
    }

    // Check if SERVICE_DEPENDENCIES is defined
    if (typeof SERVICE_DEPENDENCIES === 'undefined') {
      throw new Error('Container.registerWithDependencies: SERVICE_DEPENDENCIES constant not defined');
    }

    // Get transitive dependency list (dependencies before dependents)
    const depsToRegister = this._getTransitiveDependencies(serviceName);

    this._log('info', `Registering ${serviceName} with ${depsToRegister.length - 1} transitive dependencies`);

    // Register each service in dependency order
    for (const depName of depsToRegister) {
      if (!this.has(depName)) {
        this._log('debug', `Registering dependency: ${depName}`);

        // Call global registerService() function from ServiceRegistration.gs
        if (typeof registerService !== 'function') {
          throw new Error(`Container.registerWithDependencies: registerService() function not available`);
        }

        registerService(depName);

        // Track in current session if active
        if (this.currentSession !== null) {
          this.currentSession.registeredServices.push(depName);
        }
      } else {
        this._log('debug', `Dependency ${depName} already registered`);
      }
    }

    this._log('info', `Service ${serviceName} and all dependencies registered`);
  }
```

**VERIFICATION:**
- Checks `SERVICE_DEPENDENCIES` exists
- Calls `this._getTransitiveDependencies(serviceName)`
- Calls `registerService(depName)` for each dependency
- Tracks services in `currentSession.registeredServices` if session active

---

### TASK 1E: Add `_getTransitiveDependencies()` Helper Method

**Location:** After the `registerWithDependencies()` method just added
**Action:** Insert new private method

**EXACT CODE TO INSERT:**
```javascript

  /**
   * Get list of transitive dependencies in registration order (dependencies first)
   * Uses depth-first traversal with cycle detection
   *
   * @param {string} serviceName - Service to get dependencies for
   * @returns {Array<string>} List of service names in registration order
   * @private
   */
  _getTransitiveDependencies(serviceName) {
    const deps = SERVICE_DEPENDENCIES[serviceName];

    // If no dependencies defined, return just the service itself
    if (!deps || deps.length === 0) {
      return [serviceName];
    }

    const visited = new Set();
    const result = [];
    const currentPath = new Set(); // For cycle detection

    const visit = (name) => {
      // Cycle detection
      if (currentPath.has(name)) {
        const cycle = Array.from(currentPath).join(' -> ') + ' -> ' + name;
        throw new Error(`Circular dependency detected in SERVICE_DEPENDENCIES: ${cycle}`);
      }

      // Already visited this service
      if (visited.has(name)) {
        return;
      }

      visited.add(name);
      currentPath.add(name);

      // Get dependencies for this service
      const serviceDeps = SERVICE_DEPENDENCIES[name] || [];

      // Recursively visit dependencies first (depth-first)
      for (const dep of serviceDeps) {
        visit(dep);
      }

      currentPath.delete(name);

      // Add service after its dependencies (post-order)
      result.push(name);
    };

    visit(serviceName);
    return result;
  }
```

**VERIFICATION:**
- Returns array of strings (service names)
- Uses Set for cycle detection
- Throws error if circular dependency found
- Post-order traversal (dependencies added before dependents)

---

### TASK 1F: Add `_validateIncrementalServices()` Method

**Location:** After the `_getTransitiveDependencies()` method just added
**Action:** Insert new private validation method

**EXACT CODE TO INSERT:**
```javascript

  /**
   * Validate only specified services (used for incremental validation)
   * Checks: registration, dependencies, instantiation, interface (if defined)
   * Updates validatedServices Set for services that pass
   *
   * @param {Array<string>} serviceNames - Services to validate
   * @throws {Error} If any validation fails
   * @returns {Object} Validation report with servicesValidated, errors, circularDepsChecked
   * @private
   */
  _validateIncrementalServices(serviceNames) {
    const logger = this.services.has(SERVICES.SmartLogger) ?
      this.services.get(SERVICES.SmartLogger) :
      LoggerFacade;

    logger.info('ServiceValidation', `Starting incremental validation of ${serviceNames.length} services`);

    const errors = [];
    const validated = [];

    for (const serviceName of serviceNames) {
      // Skip if already validated in previous session
      if (this.validatedServices.has(serviceName)) {
        logger.debug('ServiceValidation', `Service ${serviceName} already validated, skipping`);
        continue;
      }

      try {
        // Step 1: Check registration
        if (!this.has(serviceName)) {
          throw new Error('Service not registered in container');
        }

        // Step 2: Check dependencies are registered
        const deps = SERVICE_DEPENDENCIES[serviceName] || [];
        for (const dep of deps) {
          if (!this.has(dep)) {
            throw new Error(`Missing dependency: ${dep}`);
          }
        }

        // Step 3: Try to instantiate the service
        const instance = this.get(serviceName);
        if (!instance) {
          throw new Error('Service instantiated as null/undefined');
        }

        // Step 4: Validate interface if SERVICE_INTERFACES defined
        if (typeof SERVICE_INTERFACES !== 'undefined' && SERVICE_INTERFACES[serviceName]) {
          const requiredMethods = SERVICE_INTERFACES[serviceName];
          for (const method of requiredMethods) {
            if (typeof instance[method] !== 'function') {
              throw new Error(`Missing required method: ${method}`);
            }
          }
        }

        // Mark as validated
        this.validatedServices.add(serviceName);
        validated.push(serviceName);

        logger.info('ServiceValidation', `✅ ${serviceName} validated successfully`);

      } catch (error) {
        errors.push({
          service: serviceName,
          error: error.message,
          stack: error.stack
        });
        logger.error('ServiceValidation', `❌ ${serviceName} validation failed: ${error.message}`);
      }
    }

    // Check circular dependency resolution if both circular services were registered
    let circularDepsChecked = false;
    if (serviceNames.includes(SERVICES.EmailIngestionEngine) &&
        serviceNames.includes(SERVICES.ZeroTrustTriageEngine)) {
      try {
        logger.info('ServiceValidation', 'Checking circular dependency resolution (EmailIngestionEngine ↔ ZeroTrustTriageEngine)');
        this._validateCircularDependency();
        circularDepsChecked = true;
        logger.info('ServiceValidation', '✅ Circular dependency resolution validated');
      } catch (error) {
        errors.push({
          service: 'CircularDependency',
          error: error.message,
          stack: error.stack
        });
        logger.error('ServiceValidation', `❌ Circular dependency validation failed: ${error.message}`);
      }
    }

    // Throw if any errors occurred
    if (errors.length > 0) {
      const errorMsg = `Incremental validation failed for ${errors.length} service(s): ${errors.map(e => e.service).join(', ')}`;
      throw new Error(errorMsg);
    }

    logger.info('ServiceValidation', `Incremental validation complete: ${validated.length} services validated`);

    return {
      servicesValidated: validated.length,
      validatedList: validated,
      errors: errors,
      circularDepsChecked: circularDepsChecked
    };
  }
```

**VERIFICATION:**
- Loops through `serviceNames` array
- For each service: checks registration, dependencies, instantiates, validates interface
- Adds service to `this.validatedServices` Set if passes
- Checks circular dependency if both services present
- Throws Error if any validation fails
- Returns validation report object

---

### TASK 1G: Add `_validateCircularDependency()` Helper Method

**Location:** After the `_validateIncrementalServices()` method just added
**Action:** Insert new private method

**EXACT CODE TO INSERT:**
```javascript

  /**
   * Validate circular dependency resolution between EmailIngestionEngine and ZeroTrustTriageEngine
   * Tests that lazy getters work correctly in both directions
   *
   * @throws {Error} If circular dependency resolution fails
   * @private
   */
  _validateCircularDependency() {
    const emailEngine = this.get(SERVICES.EmailIngestionEngine);
    const triageEngine = this.get(SERVICES.ZeroTrustTriageEngine);

    if (!emailEngine) {
      throw new Error('EmailIngestionEngine not instantiated');
    }
    if (!triageEngine) {
      throw new Error('ZeroTrustTriageEngine not instantiated');
    }

    // Test EmailIngestionEngine → ZeroTrustTriageEngine reference
    let triageFromEmail;
    try {
      triageFromEmail = emailEngine.triageEngine;
      if (!triageFromEmail) {
        throw new Error('EmailIngestionEngine.triageEngine getter returned null/undefined');
      }
    } catch (e) {
      throw new Error('EmailIngestionEngine missing working triageEngine getter: ' + e.message);
    }

    // Test ZeroTrustTriageEngine → EmailIngestionEngine reference
    let emailFromTriage;
    try {
      emailFromTriage = triageEngine.emailIngestionEngine;
      if (!emailFromTriage) {
        throw new Error('ZeroTrustTriageEngine.emailIngestionEngine getter returned null/undefined');
      }
    } catch (e) {
      throw new Error('ZeroTrustTriageEngine missing working emailIngestionEngine getter: ' + e.message);
    }

    // Verify references point to correct instances
    if (triageFromEmail !== triageEngine) {
      throw new Error('EmailIngestionEngine.triageEngine does not reference ZeroTrustTriageEngine instance');
    }
    if (emailFromTriage !== emailEngine) {
      throw new Error('ZeroTrustTriageEngine.emailIngestionEngine does not reference EmailIngestionEngine instance');
    }
  }
```

**VERIFICATION:**
- Gets both services via `this.get()`
- Tests `emailEngine.triageEngine` getter
- Tests `triageEngine.emailIngestionEngine` getter
- Verifies references point to correct instances
- Throws detailed error messages if any check fails

---

### TASK 1H: Add `_validateAllServices()` Method

**Location:** After the `_validateCircularDependency()` method just added
**Action:** Insert new private method (wrapper for existing validation logic)

**EXACT CODE TO INSERT:**
```javascript

  /**
   * Validate ALL registered services (existing full validation behavior)
   * This is called by endRegistrationSession() when mode is 'FULL'
   * Delegates to validateServiceRegistrations() in ServiceRegistration.gs
   *
   * @throws {Error} If validation fails
   * @returns {Object} Full validation report
   * @private
   */
  _validateAllServices() {
    // Delegate to existing validateServiceRegistrations() function
    if (typeof validateServiceRegistrations !== 'function') {
      throw new Error('Container._validateAllServices: validateServiceRegistrations() function not available');
    }

    return validateServiceRegistrations();
  }
```

**VERIFICATION:**
- Checks `validateServiceRegistrations` function exists
- Calls and returns result from `validateServiceRegistrations()`
- Throws if function not available

---

### TASK 1I: Update `register()` Method to Track Session

**Location:** Line 46-128 (existing `register()` method)
**Action:** Add session tracking after successful registration

**FIND THIS CODE (around line 124):**
```javascript
      this._log('info', `✅ Service registered successfully: ${name} (singleton: ${singleton})`);
    }

    return this; // Allow chaining
  }
```

**REPLACE WITH:**
```javascript
      this._log('info', `✅ Service registered successfully: ${name} (singleton: ${singleton})`);
    }

    // Track in current session if active
    if (this.currentSession !== null && !this.currentSession.registeredServices.includes(name)) {
      this.currentSession.registeredServices.push(name);
    }

    return this; // Allow chaining
  }
```

**VERIFICATION:**
- New code inserted between line 124 and 126
- Checks if `currentSession` is not null
- Adds service name to `registeredServices` array if not already present
- Original return statement unchanged

---

### VERIFICATION CHECKLIST FOR BRIEF 1

- [ ] Constructor has 4 new properties (lines 25-28)
- [ ] `beginRegistrationSession()` method added (~25 lines)
- [ ] `endRegistrationSession()` method added (~60 lines)
- [ ] `registerWithDependencies()` method added (~50 lines)
- [ ] `_getTransitiveDependencies()` method added (~50 lines)
- [ ] `_validateIncrementalServices()` method added (~110 lines)
- [ ] `_validateCircularDependency()` method added (~50 lines)
- [ ] `_validateAllServices()` method added (~15 lines)
- [ ] `register()` method updated to track session (~4 lines added)
- [ ] Total lines added: ~320 lines
- [ ] No syntax errors when file parsed
- [ ] All methods have proper JSDoc comments
- [ ] File still loads in GAS environment (test with `clasp push`)

---

## BRIEF 2: CONSTANTS - SERVICE DEPENDENCIES MAP

**Agent:** Surgical Code Editor
**File:** `/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/0_bootstrap/AB_Constants.gs`
**Current Line Count:** 356 lines
**Changes:** Add SERVICE_DEPENDENCIES constant after SERVICES enum

### TASK 2A: Add SERVICE_DEPENDENCIES Constant

**Location:** After line 165 (after SERVICES enum definition, before HTTP_STATUS)
**Action:** Insert new constant with complete dependency map

**EXACT CODE TO INSERT AFTER LINE 165:**
```javascript

/**
 * Service dependency map for incremental registration
 * Maps each service to its DIRECT dependencies (transitive dependencies auto-resolved by container)
 *
 * CRITICAL: This map must be kept in sync with service constructors in ServiceRegistration.gs
 * When adding/removing services or changing constructors, update this map immediately
 *
 * Format: [SERVICES.ServiceName]: [array of SERVICES.* that this service depends on]
 */
const SERVICE_DEPENDENCIES = Object.freeze({
  // Layer 1: No dependencies (foundation services)
  [SERVICES.PersistentStore]: [],

  // Layer 2: Single dependency on Layer 1
  [SERVICES.CrossExecutionCache]: [SERVICES.PersistentStore],
  [SERVICES.SmartLogger]: [SERVICES.CrossExecutionCache],
  [SERVICES.ErrorHandler]: [SERVICES.SmartLogger],

  // Layer 3: Multiple dependencies on Layers 1-2
  [SERVICES.BatchOperations]: [
    SERVICES.CrossExecutionCache,
    SERVICES.SmartLogger
  ],
  [SERVICES.DistributedLockManager]: [
    SERVICES.PersistentStore,
    SERVICES.SmartLogger
  ],
  [SERVICES.ConfigManager]: [
    SERVICES.CrossExecutionCache,
    SERVICES.PersistentStore,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger
  ],

  // Layer 4: Application-specific managers
  [SERVICES.FoundationBlocksManager]: [
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.SmartLogger
  ],
  [SERVICES.DynamicLaneManager]: [
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.BatchOperations,
    SERVICES.FoundationBlocksManager,
    SERVICES.SmartLogger,
    SERVICES.CrossExecutionCache
  ],

  // Layer 5: Human state and calendar services
  [SERVICES.HumanStateManager]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager
  ],
  [SERVICES.CalendarSyncManager]: [
    SERVICES.BatchOperations,
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.SmartLogger
  ],

  // Layer 6: Scheduler (depends on many foundation services)
  [SERVICES.IntelligentScheduler]: [
    SERVICES.FoundationBlocksManager,
    SERVICES.CalendarSyncManager,
    SERVICES.ErrorHandler,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.HumanStateManager,
    SERVICES.BatchOperations,
    SERVICES.CrossExecutionCache,
    SERVICES.DynamicLaneManager
  ],

  // Layer 6A: Email processing (CIRCULAR DEPENDENCY - resolved with lazy getters)
  // Note: EmailIngestionEngine ↔ ZeroTrustTriageEngine circular dependency
  // Both services use lazy getters to reference each other after instantiation
  [SERVICES.SenderReputationManager]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.CrossExecutionCache
  ],
  [SERVICES.EmailIngestionEngine]: [
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.PersistentStore
    // ZeroTrustTriageEngine NOT listed (circular - resolved via lazy getter)
  ],
  [SERVICES.ZeroTrustTriageEngine]: [
    SERVICES.SenderReputationManager,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler
    // EmailIngestionEngine NOT listed (circular - resolved via lazy getter)
  ],
  [SERVICES.ChatEngine]: [
    SERVICES.ConfigManager,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.CrossExecutionCache,
    SERVICES.ErrorHandler,
    SERVICES.ArchiveManager
  ],

  // Layer 7: Archive and system management
  [SERVICES.ArchiveManager]: [
    SERVICES.ConfigManager,
    SERVICES.SmartLogger,
    SERVICES.BatchOperations
  ],
  [SERVICES.SystemManager]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.ArchiveManager
  ],

  // Layer 8: Web services
  [SERVICES.SecureWebAppAuth]: [
    SERVICES.SmartLogger
  ],
  [SERVICES.WebAppManager]: [
    SERVICES.AppSheetBridge,
    SERVICES.ChatEngine,
    SERVICES.SystemManager,
    SERVICES.SecureWebAppAuth,
    SERVICES.SmartLogger
  ],
  [SERVICES.AppSheetBridge]: [
    SERVICES.ConfigManager,
    SERVICES.SystemManager
  ],

  // Layer 9: Orchestration (depends on most services)
  [SERVICES.TriggerOrchestrator]: [
    SERVICES.EmailIngestionEngine,
    SERVICES.IntelligentScheduler,
    SERVICES.ArchiveManager,
    SERVICES.FoundationBlocksManager,
    SERVICES.HumanStateManager,
    SERVICES.CalendarSyncManager,
    SERVICES.SystemManager,
    SERVICES.SenderReputationManager,
    SERVICES.SmartLogger,
    SERVICES.DistributedLockManager
  ],

  // Layer 10: Business logic services
  [SERVICES.BusinessLogicValidation]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ErrorHandler
  ],
  [SERVICES.AuditProtocol]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.PersistentStore
  ],

  // Testing services
  [SERVICES.MockService]: [],
  [SERVICES.TestSeeder]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger
  ],
  [SERVICES.MockBatchOperations]: [
    SERVICES.CrossExecutionCache
  ]

  // External services (EXTERNAL_*) not included - these are aliases to GAS APIs
});
```

**VERIFICATION:**
- All 28 services from SERVICES enum mapped (excluding 4 EXTERNAL_* services)
- Each service maps to array of SERVICES.* constants
- Circular dependency between EmailIngestionEngine and ZeroTrustTriageEngine documented
- Object is frozen
- No syntax errors

---

### TASK 2B: Add SERVICE_INTERFACES Constant (Optional Method Validation)

**Location:** After the SERVICE_DEPENDENCIES constant just added
**Action:** Insert new constant for interface validation

**EXACT CODE TO INSERT:**
```javascript

/**
 * Service interface definitions for validation
 * Maps service names to required public methods
 * Used by container._validateIncrementalServices() to ensure services have expected interface
 *
 * OPTIONAL: Only services listed here will have interface validation
 * Add entries as needed for critical services
 */
const SERVICE_INTERFACES = Object.freeze({
  [SERVICES.SmartLogger]: ['info', 'error', 'warn', 'debug', 'critical'],
  [SERVICES.BatchOperations]: ['batchWrite', 'batchRead', 'batchUpdate', 'batchDelete'],
  [SERVICES.ConfigManager]: ['getConfig', 'updateConfig', 'getAllConfig'],
  [SERVICES.SystemManager]: ['runHealthCheck', 'getSystemStatus'],
  [SERVICES.IntelligentScheduler]: ['runSchedulingCycle'],
  [SERVICES.EmailIngestionEngine]: ['processNewEmails'],
  [SERVICES.TriggerOrchestrator]: [
    'runEmailProcessing',
    'runSchedulingCycle',
    'runCalendarSync',
    'runFoundationBlocks',
    'runHealthCheck',
    'runDataArchiving',
    'runScheduleReconciliation',
    'runProposalLearningCycle'
  ]
});
```

**VERIFICATION:**
- Maps 7 critical services to their public methods
- Each method name is a string in an array
- Object is frozen
- No syntax errors

---

### VERIFICATION CHECKLIST FOR BRIEF 2

- [ ] SERVICE_DEPENDENCIES constant added (~180 lines)
- [ ] SERVICE_INTERFACES constant added (~25 lines)
- [ ] All 28 services mapped in SERVICE_DEPENDENCIES
- [ ] Circular dependency documented in comments
- [ ] No syntax errors when file parsed
- [ ] File still loads in GAS environment

---

## BRIEF 3: SERVICE REGISTRATION - INCREMENTAL FUNCTIONS

**Agent:** Surgical Code Editor
**File:** `/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/8_setup/ServiceRegistration.gs`
**Current Line Count:** 522 lines
**Changes:** Add new registration functions, modify validateServiceRegistrations call

### TASK 3A: Add `registerService()` Function (Single Service Registration)

**Location:** After line 259 (after registerAllServices() function, before validateServiceRegistrations())
**Action:** Insert new function that registers a single service by name

**EXACT CODE TO INSERT AFTER LINE 259:**
```javascript

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

    case SERVICES.AppSheetBridge:
      container.register(
        SERVICES.AppSheetBridge,
        () => new AppSheetBridge(
          container.get(SERVICES.ConfigManager),
          container.get(SERVICES.SystemManager)
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
```

**VERIFICATION:**
- Switch statement covers all 32 services (28 app services + 4 external)
- Each case matches service registration in registerAllServices() exactly
- Default case throws error for unknown service
- No syntax errors

---

### TASK 3B: Add `registerMinimalServices()` Function

**Location:** After the `registerService()` function just added
**Action:** Insert new function for incremental registration

**EXACT CODE TO INSERT:**
```javascript

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
```

**VERIFICATION:**
- Validates `requiredServices` is non-empty array
- Calls `container.beginRegistrationSession()` with 'INCREMENTAL' mode
- Loops through services and calls `container.registerWithDependencies()`
- Calls `container.endRegistrationSession()` which triggers validation
- Handles errors and cleans up session
- Returns session summary

---

### TASK 3C: Modify `registerAllServices()` to Use Registration Session

**Location:** Lines 15-259 (existing registerAllServices function)
**Action:** Wrap with registration session for FULL validation

**FIND THIS CODE (line 16):**
```javascript
  Logger.log('[ServiceRegistration] Starting service registration...');
```

**REPLACE WITH:**
```javascript
  Logger.log('[ServiceRegistration] Starting FULL service registration...');

  // Begin registration session with FULL validation mode
  container.beginRegistrationSession('FULL_SYSTEM_REGISTRATION', 'FULL');
```

**FIND THIS CODE (line 258):**
```javascript
  // Registration complete - system ready
  validateServiceRegistrations();
}
```

**REPLACE WITH:**
```javascript
  // End registration session (triggers FULL validation via validateServiceRegistrations)
  const sessionSummary = container.endRegistrationSession();

  Logger.log(`[ServiceRegistration] ✅ Full registration completed: ${sessionSummary.servicesRegistered} services registered and validated in ${sessionSummary.duration}ms`);

  return sessionSummary;
}
```

**VERIFICATION:**
- Line 16 adds session begin call
- Line 258 replaces direct validation call with session end
- Session end triggers validation via `container._validateAllServices()`
- Function now returns session summary instead of undefined

---

### VERIFICATION CHECKLIST FOR BRIEF 3

- [ ] `registerService()` function added (~320 lines)
- [ ] All 32 services covered in switch statement
- [ ] `registerMinimalServices()` function added (~45 lines)
- [ ] `registerAllServices()` modified to use sessions (~3 lines changed)
- [ ] No syntax errors when file parsed
- [ ] File still loads in GAS environment

---

## BRIEF 4: TRIGGER SETUP - FIX SERVICE DEPENDENCIES

**Agent:** Surgical Code Editor
**File:** `/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/8_setup/TriggerSetup.gs`
**Current Line Count:** 267 lines
**Changes:** Replace ensureServicesRegistered(), fix service dependencies for each function

### TASK 4A: Replace `ensureServicesRegistered()` with Two Specialized Functions

**Location:** Lines 9-17 (existing ensureServicesRegistered function)
**Action:** Replace entire function with two new functions

**DELETE LINES 9-17:**
```javascript
function ensureServicesRegistered() {
  if (typeof container === 'undefined' || typeof container.has !== 'function') {
    throw new Error('Dependency injection container not available');
  }

  if (!container.has(SERVICES.TriggerOrchestrator)) {
    registerAllServices();
  }
}
```

**INSERT REPLACEMENT CODE:**
```javascript
/**
 * Ensure required services for trigger MANAGEMENT operations
 * Management operations (install/remove/list triggers) only need SmartLogger
 * Uses incremental registration to avoid loading all 31 services
 */
function ensureServicesForTriggerManagement() {
  if (typeof container === 'undefined' || typeof container.has !== 'function') {
    throw new Error('TriggerSetup: Dependency injection container not available');
  }

  const requiredServices = [SERVICES.SmartLogger];

  // Check if services are registered AND validated
  const missing = requiredServices.filter(s =>
    !container.has(s) || !container.validatedServices.has(s)
  );

  if (missing.length > 0) {
    // Use incremental registration (only registers SmartLogger + its 2 dependencies)
    registerMinimalServices(requiredServices);
  }
}

/**
 * Ensure required services for trigger EXECUTION operations
 * Execution operations (runEmailProcessing, runSchedulingCycle, etc.) need TriggerOrchestrator
 * Uses incremental registration to register TriggerOrchestrator + its ~25 dependencies
 */
function ensureServicesForTriggerExecution() {
  if (typeof container === 'undefined' || typeof container.has !== 'function') {
    throw new Error('TriggerSetup: Dependency injection container not available');
  }

  const requiredServices = [SERVICES.TriggerOrchestrator];

  // Check if services are registered AND validated
  const missing = requiredServices.filter(s =>
    !container.has(s) || !container.validatedServices.has(s)
  );

  if (missing.length > 0) {
    // Use incremental registration (registers TriggerOrchestrator + dependencies)
    registerMinimalServices(requiredServices);
  }
}
```

**VERIFICATION:**
- Old function deleted (9 lines removed)
- Two new functions added (~45 lines)
- `ensureServicesForTriggerManagement()` checks for SmartLogger only
- `ensureServicesForTriggerExecution()` checks for TriggerOrchestrator
- Both check `container.validatedServices` Set

---

### TASK 4B: Update `installAllTriggers()` to Use Management Function

**Location:** Line 25 (inside installAllTriggers function)
**Action:** Replace function call

**FIND THIS CODE:**
```javascript
    ensureServicesRegistered();
```

**REPLACE WITH:**
```javascript
    ensureServicesForTriggerManagement();
```

**VERIFICATION:**
- Only management services loaded (SmartLogger)
- Function still works correctly

---

### TASK 4C: Update `removeAllTriggers()` to Use Management Function

**Location:** Line 139 (inside removeAllTriggers function)
**Action:** Replace function call

**FIND THIS CODE:**
```javascript
    ensureServicesRegistered();
```

**REPLACE WITH:**
```javascript
    ensureServicesForTriggerManagement();
```

**VERIFICATION:**
- Only management services loaded (SmartLogger)
- This is the KEY fix - reduces 15s → 1s

---

### TASK 4D: Update `listCurrentTriggers()` to Use Management Function

**Location:** Line 184 (inside listCurrentTriggers function)
**Action:** Replace function call

**FIND THIS CODE:**
```javascript
    ensureServicesRegistered();
```

**REPLACE WITH:**
```javascript
    ensureServicesForTriggerManagement();
```

**VERIFICATION:**
- Only management services loaded (SmartLogger)
- Function still works correctly

---

### TASK 4E: Update All Trigger Handler Functions to Use Execution Function

**Location:** Lines 216, 222, 228, 234, 240, 246, 252, 258, 264 (all trigger handler functions)
**Action:** Replace all function calls in trigger handlers

**FIND AND REPLACE ALL OCCURRENCES OF:**
```javascript
  ensureServicesRegistered();
```

**WITH:**
```javascript
  ensureServicesForTriggerExecution();
```

**Affected functions (9 total):**
- `runEmailProcessing()` (line 216)
- `runSchedulingCycle()` (line 222)
- `runCalendarSync()` (line 228)
- `runCalendarProjection()` (line 234)
- `runFoundationBlocks()` (line 240)
- `runScheduleReconciliation()` (line 246)
- `runHealthCheck()` (line 252)
- `runDataArchiving()` (line 258)
- `runProposalLearningCycle()` (line 264)

**VERIFICATION:**
- All 9 trigger handlers updated
- All use `ensureServicesForTriggerExecution()`
- This loads TriggerOrchestrator + dependencies (~25 services)
- Still faster than loading all 31 services

---

### VERIFICATION CHECKLIST FOR BRIEF 4

- [ ] Old `ensureServicesRegistered()` deleted
- [ ] `ensureServicesForTriggerManagement()` added
- [ ] `ensureServicesForTriggerExecution()` added
- [ ] `installAllTriggers()` updated (1 change)
- [ ] `removeAllTriggers()` updated (1 change)
- [ ] `listCurrentTriggers()` updated (1 change)
- [ ] All 9 trigger handlers updated (9 changes)
- [ ] No syntax errors when file parsed
- [ ] File still loads in GAS environment

---

## BRIEF 5: INTEGRATION TESTING AND VERIFICATION

**Agent:** QA Verification Gate
**Task:** Validate entire implementation before deployment

### TEST 5A: Unit Tests for Container Methods

**Test File:** Create `/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/tests/test_incremental_registration.gs`

**Test Cases:**
1. **Test `beginRegistrationSession()`**
   - Verify `currentSession` is set
   - Verify session has correct properties
   - Verify mode is set correctly

2. **Test `endRegistrationSession()`**
   - Verify session is cleared
   - Verify validation is called
   - Verify session added to history
   - Verify throws if no active session

3. **Test `registerWithDependencies()`**
   - Register service with no dependencies → verify 1 service registered
   - Register service with dependencies → verify all dependencies registered
   - Register service already registered → verify no duplicate registration

4. **Test `_getTransitiveDependencies()`**
   - Test service with no deps → returns [serviceName]
   - Test service with 1 dep → returns [dep, serviceName]
   - Test service with transitive deps → returns correct order
   - Test circular dependency → throws error

5. **Test `_validateIncrementalServices()`**
   - Validate registered service → success
   - Validate unregistered service → failure
   - Validate service missing dependency → failure
   - Validate service with null constructor → failure

**Run Command:**
```bash
cd "/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2"
clasp push
clasp run test_incremental_registration
```

**Expected Results:**
- All tests pass
- No errors or exceptions

---

### TEST 5B: Integration Test - removeAllTriggers Performance

**Test:** Measure execution time of `removeAllTriggers()`

**Setup:**
1. Clear container: `container.clear()`
2. Call `removeAllTriggers()`
3. Measure execution time

**Verification Steps:**
```javascript
function testRemoveAllTriggersPerformance() {
  const startTime = Date.now();

  const result = removeAllTriggers();

  const duration = Date.now() - startTime;

  Logger.log(`removeAllTriggers() duration: ${duration}ms`);
  Logger.log(`Services registered: ${container.services.size}`);
  Logger.log(`Services validated: ${container.validatedServices.size}`);

  // Assertions
  if (duration > 3000) {
    throw new Error(`PERFORMANCE REGRESSION: removeAllTriggers took ${duration}ms (expected < 3000ms)`);
  }

  if (container.services.size > 5) {
    throw new Error(`TOO MANY SERVICES: Expected ≤5 services, got ${container.services.size}`);
  }

  if (!result.success) {
    throw new Error(`removeAllTriggers failed: ${result.error}`);
  }

  Logger.log('✅ Performance test PASSED');
}
```

**Expected Results:**
- Duration: < 3 seconds (target: ~1 second)
- Services registered: ≤ 5 (SmartLogger + dependencies)
- Result: success = true

---

### TEST 5C: Integration Test - Full System Setup Still Works

**Test:** Verify `completeSetup()` still registers and validates all services

**Verification Steps:**
```javascript
function testCompleteSetupStillWorks() {
  // Clear container
  container.clear();

  // Run full setup
  const result = completeSetup();

  // Verify all services registered
  const allServices = Object.values(SERVICES).filter(s => !s.startsWith('EXTERNAL_'));

  for (const serviceName of allServices) {
    if (!container.has(serviceName)) {
      throw new Error(`Service ${serviceName} not registered after completeSetup`);
    }

    if (!container.validatedServices.has(serviceName)) {
      throw new Error(`Service ${serviceName} not validated after completeSetup`);
    }
  }

  Logger.log(`✅ completeSetup() registered and validated all ${allServices.length} services`);
}
```

**Expected Results:**
- All 28 services registered
- All 28 services validated
- No errors

---

### TEST 5D: Integration Test - Circular Dependency Resolution

**Test:** Verify EmailIngestionEngine ↔ ZeroTrustTriageEngine circular dependency works

**Verification Steps:**
```javascript
function testCircularDependencyResolution() {
  container.clear();

  // Register both services via incremental registration
  registerMinimalServices([SERVICES.EmailIngestionEngine, SERVICES.ZeroTrustTriageEngine]);

  // Get instances
  const emailEngine = container.get(SERVICES.EmailIngestionEngine);
  const triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);

  // Test circular references
  const triageFromEmail = emailEngine.triageEngine;
  const emailFromTriage = triageEngine.emailIngestionEngine;

  if (triageFromEmail !== triageEngine) {
    throw new Error('EmailIngestionEngine.triageEngine does not reference correct instance');
  }

  if (emailFromTriage !== emailEngine) {
    throw new Error('ZeroTrustTriageEngine.emailIngestionEngine does not reference correct instance');
  }

  Logger.log('✅ Circular dependency resolution works correctly');
}
```

**Expected Results:**
- Both services instantiate successfully
- Circular references resolve correctly
- No infinite loops or stack overflows

---

### TEST 5E: Integration Test - Trigger Handlers Work

**Test:** Verify all trigger handler functions can load and execute

**Verification Steps:**
```javascript
function testTriggerHandlersWork() {
  container.clear();

  const handlers = [
    'runEmailProcessing',
    'runSchedulingCycle',
    'runCalendarSync',
    'runFoundationBlocks',
    'runHealthCheck',
    'runDataArchiving',
    'runScheduleReconciliation',
    'runProposalLearningCycle'
  ];

  for (const handlerName of handlers) {
    Logger.log(`Testing ${handlerName}...`);

    // Clear container before each test
    container.clear();

    // Call handler (should auto-register services)
    try {
      globalThis[handlerName]();
      Logger.log(`✅ ${handlerName} loaded services successfully`);
    } catch (error) {
      // Some handlers may fail due to missing spreadsheet data - that's OK
      // We're just testing that services load correctly
      if (error.message.includes('not registered') || error.message.includes('not available')) {
        throw error; // This is a registration error - FAIL
      }
      Logger.log(`⚠️ ${handlerName} failed with non-registration error (OK): ${error.message}`);
    }
  }

  Logger.log('✅ All trigger handlers can load services');
}
```

**Expected Results:**
- All handlers can load TriggerOrchestrator
- No "service not registered" errors
- Runtime errors (missing data) are acceptable

---

### VERIFICATION CHECKLIST FOR BRIEF 5

- [ ] Unit tests written and pass
- [ ] `removeAllTriggers()` performance test passes (< 3s)
- [ ] `completeSetup()` still works (all services registered)
- [ ] Circular dependency resolution test passes
- [ ] Trigger handlers test passes
- [ ] No regressions in existing functionality
- [ ] All error messages are clear and actionable

---

## BRIEF 6: DEPLOYMENT AND ROLLBACK PLAN

**Agent:** Knowledge Extractor
**Task:** Document deployment steps and rollback procedures

### DEPLOYMENT STEPS

**Pre-Deployment Checklist:**
- [ ] All briefs 1-4 completed successfully
- [ ] All tests in brief 5 passing
- [ ] Code reviewed by human
- [ ] Backup created: `git commit -m "Backup before incremental registration deployment"`

**Deployment Sequence:**
1. **Deploy Brief 1 (Container):**
   ```bash
   cd "/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2"
   clasp push src/0_bootstrap/AA_Container.gs
   ```
   - Verify: No syntax errors
   - Test: `container.beginRegistrationSession('test', 'NONE')`
   - Test: `container.endRegistrationSession()`

2. **Deploy Brief 2 (Constants):**
   ```bash
   clasp push src/0_bootstrap/AB_Constants.gs
   ```
   - Verify: `SERVICE_DEPENDENCIES` is defined
   - Test: `SERVICE_DEPENDENCIES[SERVICES.SmartLogger]`

3. **Deploy Brief 3 (ServiceRegistration):**
   ```bash
   clasp push src/8_setup/ServiceRegistration.gs
   ```
   - Verify: `registerService` function exists
   - Test: `registerMinimalServices([SERVICES.SmartLogger])`

4. **Deploy Brief 4 (TriggerSetup):**
   ```bash
   clasp push src/8_setup/TriggerSetup.gs
   ```
   - Verify: `ensureServicesForTriggerManagement` exists
   - Test: `removeAllTriggers()`

5. **Deploy All (Final):**
   ```bash
   clasp push
   ```
   - Run all tests from Brief 5
   - Monitor execution logs
   - Verify performance improvements

**Post-Deployment Verification:**
- [ ] Run `removeAllTriggers()` → verify < 3s
- [ ] Run `installAllTriggers()` → verify < 5s
- [ ] Run `completeSetup()` → verify all services registered
- [ ] Check logs for errors
- [ ] Monitor for 24 hours

---

### ROLLBACK PLAN

**If deployment fails or causes issues:**

**Immediate Rollback (Git):**
```bash
cd "/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2"
git reset --hard HEAD~1
clasp push
```

**Partial Rollback (File-by-File):**

1. **Rollback TriggerSetup.gs:**
   ```bash
   git checkout HEAD~1 -- src/8_setup/TriggerSetup.gs
   clasp push src/8_setup/TriggerSetup.gs
   ```

2. **Rollback ServiceRegistration.gs:**
   ```bash
   git checkout HEAD~1 -- src/8_setup/ServiceRegistration.gs
   clasp push src/8_setup/ServiceRegistration.gs
   ```

3. **Rollback Constants:**
   ```bash
   git checkout HEAD~1 -- src/0_bootstrap/AB_Constants.gs
   clasp push src/0_bootstrap/AB_Constants.gs
   ```

4. **Rollback Container:**
   ```bash
   git checkout HEAD~1 -- src/0_bootstrap/AA_Container.gs
   clasp push src/0_bootstrap/AA_Container.gs
   ```

**Verify Rollback:**
- [ ] `removeAllTriggers()` works (even if slow)
- [ ] `completeSetup()` works
- [ ] No new errors in logs

---

### KNOWN ISSUES AND MITIGATION

**Issue 1: SERVICE_DEPENDENCIES Out of Sync**
- **Symptom:** Service fails to load with "Missing dependency" error
- **Root Cause:** Service constructor changed but SERVICE_DEPENDENCIES not updated
- **Mitigation:** Compare constructor parameters in `registerService()` with SERVICE_DEPENDENCIES map
- **Fix:** Update SERVICE_DEPENDENCIES[serviceName] array to match constructor

**Issue 2: Circular Dependency Not Resolved**
- **Symptom:** "Circular dependency detected" error or infinite loop
- **Root Cause:** SERVICE_DEPENDENCIES includes both directions of circular dependency
- **Mitigation:** Only include one direction in map, rely on lazy getters for other direction
- **Fix:** Remove circular reference from SERVICE_DEPENDENCIES (keep comment documenting it)

**Issue 3: Validation Too Strict**
- **Symptom:** Services fail validation but work in production
- **Root Cause:** SERVICE_INTERFACES requires methods that don't exist
- **Mitigation:** Make interface validation optional
- **Fix:** Remove entries from SERVICE_INTERFACES or update service to implement methods

---

### MONITORING AND METRICS

**Key Metrics to Track:**
1. **Performance:**
   - `removeAllTriggers()` execution time (target: < 1s)
   - `installAllTriggers()` execution time (target: < 2s)
   - `completeSetup()` execution time (should be unchanged)

2. **Service Registration:**
   - Services registered per operation
   - Validation time per service
   - Total services in container after operation

3. **Errors:**
   - "Service not registered" errors (should be 0)
   - "Missing dependency" errors (should be 0)
   - Validation failures

**Logging:**
- All registration sessions logged with duration
- All service registrations logged
- All validation results logged

**Alerting:**
- If `removeAllTriggers()` > 5s → investigate regression
- If any "Service not registered" errors → investigate missing registration
- If validation failures → investigate service constructors

---

## EXECUTION SUMMARY

**Total Changes:**
- **Files Modified:** 4
- **Lines Added:** ~745 lines
- **Lines Modified:** ~20 lines
- **Lines Deleted:** ~10 lines

**Implementation Time Estimate:**
- Brief 1 (Container): 2-3 hours
- Brief 2 (Constants): 1 hour
- Brief 3 (ServiceRegistration): 2-3 hours
- Brief 4 (TriggerSetup): 30 minutes
- Brief 5 (Testing): 2-3 hours
- Brief 6 (Deployment): 1 hour
- **Total:** 8-11 hours

**Risk Assessment:**
- **Technical Risk:** Medium (container is critical infrastructure)
- **Rollback Risk:** Low (Git rollback straightforward)
- **Data Risk:** None (no data structure changes)
- **User Impact:** Positive (93% performance improvement)

**Success Criteria:**
- ✅ `removeAllTriggers()` executes in < 3 seconds (currently 15+ seconds)
- ✅ All existing functionality preserved
- ✅ All tests pass
- ✅ No increase in errors
- ✅ Code maintainability improved (explicit dependency map)

---

## APPENDIX A: SERVICE DEPENDENCY COUNTS

Reference for understanding which services trigger how many registrations:

| Service | Direct Deps | Transitive Deps | Total Services |
|---------|-------------|-----------------|----------------|
| PersistentStore | 0 | 0 | 1 |
| SmartLogger | 2 | 2 | 3 |
| ConfigManager | 4 | 4 | 5 |
| TriggerOrchestrator | 10 | ~25 | ~26 |

**Key Insight:** `removeAllTriggers()` only needs SmartLogger (3 services total), not TriggerOrchestrator (26 services total).

---

## APPENDIX B: VALIDATION MODE COMPARISON

| Mode | When Used | Services Validated | Time |
|------|-----------|-------------------|------|
| FULL | `completeSetup()`, `registerAllServices()` | All 28 services | ~18s |
| INCREMENTAL | `registerMinimalServices()` | Only newly registered | ~1-3s |
| NONE | Testing, emergency bypass | 0 (skip validation) | ~0.1s |

---

**END OF IMPLEMENTATION PLAN**
