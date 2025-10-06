# Revised Remediation Plan for Backend Failures

**Date:** 2025-10-06
**Status:** Proposed for Review (Revision 2)

## 1.0 Introduction

This document provides a revised, code-level, and actionable plan to rectify the critical bugs and architectural deficiencies identified in previous reports. This revision incorporates specific feedback regarding the preservation of function return contracts and a more robust re-evaluation of the system bootstrap logic to prevent regressions.

This plan is designed to be executed sequentially.

---

## 2.0 Phase 1: Critical Bug Fixes

**Objective:** Restore baseline functionality to the Dashboard and Conflict Resolution features by fixing the most severe, function-breaking bugs.

*(This phase is unchanged from the previous plan.)*

### Task 1.1: Fix `appsheet_getMyDay` Filter Logic

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

### Task 1.2: Fix `appsheet_findAvailableSlots` ReferenceError

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

## 3.0 Phase 2: Architectural Improvement - Error Propagation

**Objective:** Improve system debuggability by propagating detailed error information to the frontend **while preserving the unique return contract of each function**.

### Task 2.1: Modify `appsheet_getSettings` Catch Block

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

### Task 2.2: Modify `appsheet_getConstants` Catch Block

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

### Task 2.3: Modify `appsheet_getDailySchedule` Catch Block

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

### Task 2.4: Modify `appsheet_getAllTasks` Catch Block

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

### Task 2.5: Modify `appsheet_findAvailableSlots` Catch Block

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

### Task 2.6: Modify `appsheet_getPendingProposalsCount` Catch Block

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

### Task 2.7: Modify `appsheet_getSystemStatus` Catch Block

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

---

## 4.0 Phase 3: Systemic Overhaul - Bootstrap Simplification

**Objective:** Address the root cause of systemic application failure by replacing the fragile bootstrap sequence with a robust, reliable initialization method that is both safe and efficient.

### Task 3.1: Re-evaluate and Refactor `ensureBootstrapServices`

*   **Justification:** The original replacement logic was too simplistic and did not account for the important role of `isSystemInitialized()`, creating a risk of regression and inefficiency. This revised implementation is safer and more intelligent. It handles three distinct states:
    1.  **Container Already Hydrated:** If, within a single execution, the container is already valid, it does nothing. This is efficient.
    2.  **System Never Initialized:** If the `SYSTEM_INITIALIZED` flag is false, it runs the full, one-time `completeSetup()` process. This is safe.
    3.  **Stateless Execution:** If the system *has* been initialized before but the container is now empty (the web app case), it performs a lightweight re-hydration by calling `registerAllServices()` only, avoiding the overhead of a full setup. This is both safe and efficient.
*   **File:** `src/8_setup/SystemBootstrap.gs`
*   **Action:** A `replace` operation with the following parameters:

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

**`new_string`:**
```javascript
function ensureBootstrapServices() {
  // If the container is already hydrated for this specific execution, we're done.
  if (typeof container !== 'undefined' && container.has && container.has(SERVICES.WebAppManager)) {
    return; // Already hydrated, skip.
  }

  // Check if the system has ever been successfully set up.
  if (!isSystemInitialized()) {
    // If not, this is a first-time run or a broken state. Run the full setup.
    Logger.log('ensureBootstrapServices: System not initialized. Executing completeSetup() for the first time.');
    completeSetup();
    // After a full setup, the container MUST be valid.
    if (typeof container === 'undefined' || !container.has || !container.has(SERVICES.WebAppManager)) {
      throw new Error('FATAL: System remains uninitialized even after completeSetup().');
    }
    return;
  }

  // If the system IS initialized, but the container is empty (due to stateless execution),
  // we don't need to run the full setup again. We just need to re-register the services.
  if (typeof container === 'undefined' || !container.has || !container.has(SERVICES.SmartLogger)) {
    Logger.log('ensureBootstrapServices: Stateless execution detected. Re-hydrating service container.');
    registerAllServices();
  }
}
```
