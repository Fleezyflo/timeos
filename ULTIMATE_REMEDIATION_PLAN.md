# Ultimate Remediation Plan for Backend Failures

**Date:** 2025-10-06
**Status:** Proposed for Execution (Revision 3)

## 1.0 Introduction

This document provides the final, verified, and code-specific plan to rectify the application's backend failures. It incorporates critical feedback on the previous revision, addressing a subtle flaw in the bootstrap logic and closing a gap in the error propagation phase.

The execution phases are ordered to address the foundational bootstrap failure first, then critical bugs, and finally architectural improvements.

---

## 2.0 Phase 1: Systemic Overhaul - Bootstrap Simplification

**Objective:** Address the root cause of the systemic application failure by replacing the fragile bootstrap sequence with a robust, reliable initialization method that is both safe and efficient.

### Task 1.1: Refactor `ensureBootstrapServices`

*   **Justification:** This revision corrects a flaw in the previous proposal. The new logic is safer and more robust, correctly handling three distinct states:
    1.  **System Never Initialized:** If the `SYSTEM_INITIALIZED` flag is false, it runs the full, one-time `completeSetup()` process.
    2.  **Stateless Execution:** If the system *has* been initialized before but the container is now incomplete (the web app case), it performs a lightweight re-hydration by calling `registerAllServices()` only. The check for an incomplete container is now correctly performed against a late-stage service (`WebAppManager`) to prevent the risk of a partial hydration being missed.
    3.  **Container Already Hydrated:** If the container is already valid for the current execution, it does nothing.
*   **File:** `src/8_setup/SystemBootstrap.gs`
*   **Action:** A `replace` operation with the following parameters (retain the `_containerHydratedThisExecution` flag and the `completed/skipped` telemetry so the DayPlanner verification flow can still assert single-bootstraps):

**`old_string`:**
```javascript
let _containerHydratedThisExecution = false;

function ensureBootstrapServices() {
  const start = Date.now();
  const containerUnavailable = () =>
    typeof container === 'undefined' || typeof container.has !== 'function';

  const hydrateContainer = (reason) => {
    Logger.log(`ensureBootstrapServices: ${reason} Hydrating dependency container...`);
    registerAllServices();
  };

  if (_containerHydratedThisExecution &&
      !containerUnavailable() &&
      container.has(SERVICES.SmartLogger) &&
      container.has(SERVICES.WebAppManager)) {
    Logger.log(`ensureBootstrapServices: skipped rehydration in ${Date.now() - start}ms`);
    return;
  }

  if (containerUnavailable()) {
    Logger.log('ensureBootstrapServices: Dependency container unavailable. Executing completeSetup()...');
    completeSetup();
  }

  if (!isSystemInitialized()) {
    Logger.log('ensureBootstrapServices: System not initialized. Executing completeSetup()...');
    completeSetup();
  }

  const ensureService = (serviceName) => {
    if (containerUnavailable()) {
      throw new Error('ensureBootstrapServices: Dependency container unavailable after setup');
    }

    if (!container.has(serviceName)) {
      hydrateContainer(`'${serviceName}' missing from registry.`);
    }

    try {
      return container.get(serviceName);
    } catch (error) {
      hydrateContainer(`'${serviceName}' retrieval failed (${error.message}).`);
      return container.get(serviceName);
    }
  };

  ensureService(SERVICES.SmartLogger);
  ensureService(SERVICES.WebAppManager);

  _containerHydratedThisExecution = true;

  Logger.log(`ensureBootstrapServices: completed in ${Date.now() - start}ms`);
}
```

> **Integration note:** The preserved log lines (`completed` / `skipped rehydration`) are required for the six-phase DayPlanner caching plan so that the Phase 6 verification can continue to assert that only a single container bootstrap occurs per session. Any further edits must keep those telemetry hooks intact.

**`new_string`:**
```javascript
let _containerHydratedThisExecution = false;

function ensureBootstrapServices() {
  const start = Date.now();

  const containerUnavailable = () =>
    typeof container === 'undefined' || typeof container.has !== 'function';

  const hasWebAppManager = () => !containerUnavailable() && container.has(SERVICES.WebAppManager);

  // If the system has never been initialized, a full setup is non-negotiable.
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
```

---

## 3.0 Phase 2: Critical Bug Fixes

**Objective:** Restore baseline functionality to the Dashboard and Conflict Resolution features while keeping payload shapes consistent with the DayPlanner bootstrap/cache rollout.

### Task 2.1: Fix `appsheet_getMyDay` Filter Logic

*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Action:** Correct the filter logic to properly identify tasks scheduled for the current day.

**`old_string`:**
```javascript
    dashboardData.todaySchedule = allTasks.filter(task => {
      if (!task.scheduled_start) return false;
      const scheduledDate = new Date(task.scheduled_start);
    }).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
    .map(task => task.toDetailedJSON());
```

**`new_string`:**
```javascript
    dashboardData.todaySchedule = allTasks.filter(task => {
      if (!task.scheduled_start) return false;
      const scheduledDate = new Date(task.scheduled_start);
      return scheduledDate >= todayStart && scheduledDate <= todayEnd;
    }).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
    .map(task => task.toDetailedJSON());
```

### Task 2.2: Fix `appsheet_findAvailableSlots` ReferenceError

*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Action:** Correct the misspelled variable name from `allActions` to `allTasks`.

**`old_string`:**
```javascript
    const scheduledTasks = allActions.filter(a => a.status === STATUS.SCHEDULED && a.action_id !== params.taskId);
```

**`new_string`:**
```javascript
    const scheduledTasks = allTasks.filter(a => a.status === STATUS.SCHEDULED && a.action_id !== params.taskId);
```

---

## 4.0 Phase 3: Architectural Improvement - Error Propagation

**Objective:** Improve system debuggability by propagating detailed error information to the frontend, making sure the additional fields remain compatible with the unified bootstrap payload consumed by the redesigned DayPlanner client.

### Task 3.1: Modify `appsheet_getMyDay` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getMyDay failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: `Server error getting dashboard data: ${error.message}` };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getMyDay failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { 
      success: false, 
      error: `Server error getting dashboard data: ${error.message}`,
      stack: error.stack // Propagate stack trace
    };
  }
```

### Task 3.2: Modify `appsheet_getSettings` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    Logger.log('[ClientAPI] Error in getAll: ' + error.toString());
    // Return minimal defaults on error
    return { success: false, error: error.toString(), data: {
      SCAN_MODE: 'ZERO_TRUST_TRIAGE',
      EMAIL_LABEL: 'MOH-Time-OS',
      DEFAULT_DURATION_MINUTES: 30,
      CALENDAR_ID: 'primary'
    } };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    Logger.log('[ClientAPI] Error in getAll: ' + error.toString());
    // Return minimal defaults on error
    return { 
      success: false, 
      error: error.toString(), 
      stack: error.stack, // Propagate stack trace
      data: {
        SCAN_MODE: 'ZERO_TRUST_TRIAGE',
        EMAIL_LABEL: 'MOH-Time-OS',
        DEFAULT_DURATION_MINUTES: 30,
        CALENDAR_ID: 'primary'
      } 
    };
  }
```

### Task 3.3: Modify `appsheet_getConstants` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    Logger.log('[ClientAPI] Error in getConstants: ' + error.toString());
    // Return minimal constants on error
    return { success: false, error: error.toString(), data: {
      VERSION: 'MOH_TIME_OS_v2.0',
      TIMEZONE: 'Asia/Dubai',
      CACHE_DURATION: 300000,
      MAX_RETRIES: 3
    } };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    Logger.log('[ClientAPI] Error in getConstants: ' + error.toString());
    // Return minimal constants on error
    return { 
      success: false, 
      error: error.toString(), 
      stack: error.stack, // Propagate stack trace
      data: {
        VERSION: 'MOH_TIME_OS_v2.0',
        TIMEZONE: 'Asia/Dubai',
        CACHE_DURATION: 300000,
        MAX_RETRIES: 3
      } 
    };
  }
```

### Task 3.4: Modify `appsheet_getDailySchedule` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    return { success: false, error: error.toString() };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    return { success: false, error: error.toString(), stack: error.stack };
  }
```

### Task 3.5: Modify `appsheet_getAllTasks` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    return { success: false, error: error.toString() };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    return { success: false, error: error.toString(), stack: error.stack };
  }
```

### Task 3.6: Modify `appsheet_findAvailableSlots` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_findAvailableSlots failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { success: false, error: `Server error finding slots: ${error.message}` };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_findAvailableSlots failed', {
      error: error.message,
      stack: error.stack,
      params: params
    });
    return { 
      success: false, 
      error: `Server error finding slots: ${error.message}`,
      stack: error.stack // Propagate stack trace
    };
  }
```

### Task 3.7: Modify `appsheet_getPendingProposalsCount` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getPendingProposalsCount failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message, count: 0 };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getPendingProposalsCount failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message, count: 0, stack: error.stack };
  }
```

### Task 3.8: Modify `appsheet_getSystemStatus` Catch Block

*   **File:** `src/5_web/AppSheetBridge.gs`

**`old_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getSystemStatus failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
```

**`new_string`:**
```javascript
  } catch (error) {
    LoggerFacade.error('AppSheetBridge', 'appsheet_getSystemStatus failed', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message, stack: error.stack };
  }
```
