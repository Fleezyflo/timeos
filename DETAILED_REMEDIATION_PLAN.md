# Detailed Remediation Plan for Backend Failures

**Date:** 2025-10-06
**Status:** Proposed for Review

## 1.0 Introduction

This document provides a specific, code-level, and actionable plan to rectify the critical bugs and architectural deficiencies identified in the `COMPREHENSIVE_DISCREPANCY_REPORT.md` and `INVESTIGATION_REPORT_20251006.md`. 

Each task includes the target file, the exact code to be replaced, the new code, and a justification for the change. This plan is designed to be executed sequentially.

---

## 2.0 Phase 1: Critical Bug Fixes

**Objective:** Restore baseline functionality to the Dashboard and Conflict Resolution features by fixing the most severe, function-breaking bugs.

### Task 1.1: Fix `appsheet_getMyDay` Filter Logic

*   **Justification:** This will correct the "Empty Dashboard" bug. The fix ensures the function correctly filters for tasks scheduled for the current day, allowing the "Today's Schedule" UI component to populate as expected.
*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Action:** A `replace` operation with the following parameters:

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

*   **Justification:** This will fix the `ReferenceError` that crashes the conflict resolution feature. By correcting the variable name, the function will be able to correctly identify busy time slots and suggest alternatives.
*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Action:** A `replace` operation with the following parameters:

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

**Objective:** Improve system debuggability by propagating detailed error information from the backend to the frontend.

### Task 2.1: Modify `appsheet_getMyDay` Catch Block

*   **Justification:** This change will serve as the template for all other backend functions. By including the `error.stack` in the returned JSON payload, frontend developers will be able to see the full stack trace in the browser console, dramatically reducing the time required to diagnose backend errors.
*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Action:** A `replace` operation with the following parameters:

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
      stack: error.stack // Propagate stack trace for easier debugging
    };
  }
```

### Task 2.2: Apply Error Propagation to All Bridge Functions

*   **Justification:** To ensure consistent and effective debugging across the entire application.
*   **Files:** `src/5_web/AppSheetBridge.gs`
*   **Action:** Apply the same `catch` block modification from Task 2.1 to the following functions:
    *   `appsheet_getSettings()`
    *   `appsheet_getConstants()`
    *   `appsheet_getDailySchedule()`
    *   `appsheet_getAllTasks()`
    *   `appsheet_runScheduling()`
    *   `appsheet_findAvailableSlots()`
    *   `appsheet_getPendingProposalsCount()`
    *   `appsheet_getSystemStatus()`

---

## 4.0 Phase 3: Systemic Overhaul - Bootstrap Simplification

**Objective:** Address the root cause of the systemic application failure by replacing the fragile bootstrap sequence with a robust, reliable initialization method suitable for a stateless web app environment.

### Task 3.1: Refactor `ensureBootstrapServices`

*   **Justification:** The current implementation of `ensureBootstrapServices` is overly complex and fails to reliably initialize the system in a stateless context. This leads to cascading failures where services are unavailable. The proposed replacement is a simpler, more robust function that guarantees a full and correct initialization (`completeSetup()`) for every web app execution, thus eliminating the primary source of system-wide failure.
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
  // For a stateless web app execution, we must ensure the container is valid on every single call.
  // The most reliable check is for a late-stage service that would only exist after a full setup.
  // If it's missing, we can be certain that this is a new execution requiring a full bootstrap.
  if (typeof container === 'undefined' || !container.has || !container.has(SERVICES.WebAppManager)) {
    Logger.log('ensureBootstrapServices: Container invalid or missing key services. Executing full setup for this stateless execution.');
    
    // Run the one, true initialization sequence.
    completeSetup();

    // After setup, if the container is still invalid, it's a fatal, unrecoverable error.
    if (typeof container === 'undefined' || !container.has || !container.has(SERVICES.WebAppManager)) {
      throw new Error('FATAL: System initialization failed. Container is still invalid after running completeSetup().');
    }

    Logger.log('ensureBootstrapServices: Full setup completed for this execution.');
  } else {
    Logger.log('ensureBootstrapServices: Container already valid for this execution. Skipping setup.');
  }
}
```
