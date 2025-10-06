# Comprehensive Codebase Discrepancy Report

**Date:** 2025-10-06

## 1.0 Introduction

This report provides a deep, technical analysis of the MOH Time OS v2.0 codebase to identify the root causes of widespread application failure within the `DayPlanner.html` web application. The user-facing symptoms include non-functional pages, buttons that do not produce results, and a general lack of data being displayed.

The investigation confirms that the issue is not with the `DayPlanner.html` UI itself, but with critical failures in the backend Google Apps Script files it communicates with. The failure is systemic, stemming from a broken initialization process that is compounded by specific bugs in the API bridge layer.

## 2.0 The Root Cause: Catastrophic Initialization Failure

The primary reason most pages and buttons fail is a catastrophic failure in the system's bootstrap sequence when initiated from the web app.

**File:** `src/8_setup/SystemBootstrap.gs`
**Function:** `ensureBootstrapServices()`

Every function in the `AppSheetBridge.gs` file, which the UI calls for data and actions, begins with a call to `ensureBootstrapServices()`. This function is intended to be a safeguard that ensures all necessary backend services (e.g., `BatchOperations`, `SystemManager`) are loaded and ready.

However, its logic is flawed in the context of a stateless web app execution:

*   **Stateless Execution:** Each time you click a button in the UI, Google Apps Script starts a new, fresh execution on the server. It does not remember the state from the last execution.
*   **Incomplete Initialization:** The `ensureBootstrapServices()` function was not designed correctly for this stateless environment. It performs a series of checks that can fail to trigger the full, correct setup sequence (`completeSetup()`). It sometimes attempts a partial "rehydration" of services, which is insufficient.
*   **The Result:** The dependency container, which manages all services, is left empty or only partially populated. Therefore, when a function like `appsheet_getAllTasks` is called and tries to get the `BatchOperations` service, the service doesn't exist. This causes the function to fail immediately.

**Conclusion:** This initialization failure is the single largest issue and the direct cause of the systemic failure. It explains why no data-dependent part of the application works.

## 3.0 Compounding Backend Bugs in `AppSheetBridge.gs`

Even if the initialization were to succeed, the investigation uncovered multiple critical bugs within the API bridge file that would still break key application features.

### 3.1 Bug: Empty Dashboard Schedule

*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Function:** `appsheet_getMyDay(params)`
*   **Severity:** Critical
*   **Impact:** The "Today's Schedule" section of the main dashboard is always empty, making the application appear broken on launch.

**Buggy Code Snippet:**
```javascript
dashboardData.todaySchedule = allTasks.filter(task => {
  if (!task.scheduled_start) return false;
  const scheduledDate = new Date(task.scheduled_start);
}).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
.map(task => task.toDetailedJSON());
```

**Technical Analysis:** The `.filter()` function is missing the actual filtering logic. It checks if a `scheduled_start` date exists but never compares it to the current day. The function block does not have a `return` statement for the success case, so it implicitly returns `undefined`, which is falsy. Consequently, every task is filtered out.

### 3.2 Bug: Failing Conflict Resolution

*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Function:** `appsheet_findAvailableSlots(params)`
*   **Severity:** High
*   **Impact:** The "Resolve Scheduling Conflict" feature is completely non-functional, as it can never find alternative time slots.

**Buggy Code Snippet:**
```javascript
// Get all scheduled tasks and calendar events to determine busy times
const allTasks = batchOps.getAllActions();
const scheduledTasks = allActions.filter(a => a.status === STATUS.SCHEDULED && a.action_id !== params.taskId);
```

**Technical Analysis:** The code correctly fetches tasks into a variable named `allTasks`. However, on the very next line, it attempts to filter a variable named `allActions`, which does not exist. This typo (`allActions` instead of `allTasks`) will cause the function to throw a `ReferenceError` and crash every time it is executed.

## 4.0 Architectural Vulnerabilities

Beyond the specific bugs, the analysis identified several architectural weaknesses that contribute to the system's fragility.

*   **Overly Complex Bootstrap Logic:** The initialization sequence, spread across `isSystemInitialized()`, `completeSetup()`, and `ensureBootstrapServices()`, is too complex. It relies on multiple flags and conditions, making it difficult to reason about and prone to failure in different execution contexts.
*   **Error Obfuscation:** The `catch` blocks in `AppSheetBridge.gs` frequently log the detailed error on the server but only return a generic, simplified error message to the frontend (e.g., `return { success: false, error: error.toString() }`). This practice makes it extremely difficult to debug the application from the frontend, as the true cause of the failure is hidden.

## 5.0 Summary of Findings

| ID  | Issue                               | File Location                      | Severity | Impact                                                              |
| --- | ----------------------------------- | ---------------------------------- | -------- | ------------------------------------------------------------------- |
| 1   | Catastrophic Initialization Failure | `src/8_setup/SystemBootstrap.gs`   | Blocker  | **System-wide failure.** No backend services load for the web app.    |
| 2   | Incorrect Filter Logic              | `src/5_web/AppSheetBridge.gs`      | Critical | Dashboard schedule is always empty.                                 |
| 3   | Incorrect Variable Name             | `src/5_web/AppSheetBridge.gs`      | High     | Conflict resolution feature is non-functional.                      |
| 4   | Fragile Bootstrap Process           | `src/8_setup/SystemBootstrap.gs`   | Medium   | The system is architecturally prone to initialization race conditions. |
| 5   | Error Obfuscation                   | `src/5_web/AppSheetBridge.gs`      | Medium   | Severely hinders debugging and maintenance.                         |

## 6.0 Path to Remediation

A sequential, multi-step approach is required to restore application functionality:

1.  **Fix the Bootstrap Process:** The immediate priority is to refactor the `ensureBootstrapServices()` function. It must be simplified to reliably trigger the full `completeSetup()` sequence on every stateless web app execution, ensuring that the dependency container is always fully populated.
2.  **Correct Backend Bugs:** Once the system can initialize, the specific bugs in `appsheet_getMyDay` and `appsheet_findAvailableSlots` must be fixed to restore dashboard and scheduling functionality.
3.  **Improve Error Handling:** The backend bridge should be modified to return more detailed error information (including stack traces in a development mode) to the frontend. This will significantly speed up the diagnosis of any future bugs.
