# Investigation Report: Backend Discrepancies

**Date:** 2025-10-06
**Status:** For Review

## 1.0 Introduction

This report presents a detailed technical investigation into specific discrepancies within the backend codebase as requested. The focus of this investigation is to analyze and document the root cause of failures, not to propose or implement solutions. The following items from the `COMPREHENSIVE_DISCREPANCY_REPORT.md` were investigated:

1.  **Summary Item #2:** Incorrect Filter Logic (`appsheet_getMyDay`)
2.  **Summary Item #3:** Incorrect Variable Name (`appsheet_findAvailableSlots`)
3.  **Summary Item #5:** Error Obfuscation (`AppSheetBridge.gs`)

This investigation also covers Remediation Path Item #2, which is the analysis of the bugs from Summary Items #2 and #3.

---

## 2.0 Investigation of Incorrect Filter Logic (`appsheet_getMyDay`)

*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Function:** `appsheet_getMyDay(params)`
*   **Severity:** Critical

### Code Under Review

```javascript
// Get today's schedule
const today = new Date();
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

const allTasks = batchOps.getAllActions();
dashboardData.todaySchedule = allTasks.filter(task => {
  if (!task.scheduled_start) return false;
  const scheduledDate = new Date(task.scheduled_start);
}).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
.map(task => task.toDetailedJSON());
```

### Analysis

The JavaScript `Array.prototype.filter()` method creates a new array with all elements that pass the test implemented by the provided callback function. The callback function must return a truthy value to keep the element, or a falsy value to discard it.

In the code under review, the callback function for the filter is:

```javascript
(task) => {
  if (!task.scheduled_start) return false; // Explicitly returns false for tasks with no start date.
  const scheduledDate = new Date(task.scheduled_start); // This line executes for tasks with a start date.
}
```

For any task that has a `scheduled_start` property, the `if` condition is false, and the function proceeds to the next line. However, it never explicitly returns a value. In JavaScript, a function that does not have an explicit `return` statement implicitly returns `undefined`.

Since `undefined` is a falsy value, the filter test fails for **every single task** that has a `scheduled_start` date. The only case where it returns an explicit value is `false`.

### Observed Impact

As a direct result of this logic flaw, the `dashboardData.todaySchedule` array is guaranteed to be empty. The frontend UI receives this empty array and, behaving correctly, displays the "No tasks scheduled for today" message. This occurs even if the `allTasks` variable contains numerous tasks scheduled for the current day.

---

## 3.0 Investigation of Incorrect Variable Name (`appsheet_findAvailableSlots`)

*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Function:** `appsheet_findAvailableSlots(params)`
*   **Severity:** High

### Code Under Review

```javascript
// Get all scheduled tasks and calendar events to determine busy times
const allTasks = batchOps.getAllActions();
const scheduledTasks = allActions.filter(a => a.status === STATUS.SCHEDULED && a.action_id !== params.taskId);
```

### Analysis

The code executes line by line. 
1.  The first line successfully calls `batchOps.getAllActions()` and assigns the resulting array of task objects to the constant `allTasks`.
2.  The second line immediately attempts to call the `.filter()` method on a variable named `allActions`.

At this point in the execution, no variable named `allActions` has been defined in this scope. The intended variable is `allTasks`, which was defined on the preceding line. This constitutes a `ReferenceError`.

### Observed Impact

The `try...catch` block surrounding this code will catch the `ReferenceError`. The `catch` block's logic is as follows:

```javascript
} catch (error) {
  LoggerFacade.error('AppSheetBridge', 'appsheet_findAvailableSlots failed', { ... });
  return { success: false, error: `Server error finding slots: ${error.message}` };
}
```

The function will cease execution of the `try` block and immediately return an object to the frontend where `success` is `false` and the `error` message contains the `ReferenceError` text (e.g., "allActions is not defined"). The UI, upon receiving this error, will be unable to display any alternative scheduling slots, breaking the conflict resolution workflow.

---

## 4.0 Investigation of Error Obfuscation (`AppSheetBridge.gs`)

*   **File:** `src/5_web/AppSheetBridge.gs`
*   **Functions:** Applies to all `appsheet_*` functions with `try...catch` blocks.
*   **Severity:** Medium

### Code Under Review (Example from `appsheet_getMyDay`)

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

### Analysis

The current error-handling pattern demonstrates a significant discrepancy between the information logged on the server and the information returned to the client (the `DayPlanner.html` web app).

1.  **Server-Side Log:** The `LoggerFacade.error()` call correctly logs a rich error object containing the `error.message` and, most importantly, the `error.stack` (the stack trace).
2.  **Client-Side Response:** The `return` statement constructs a new, simplified error object that is sent to the frontend. This object *only* includes the `error.message`.

For a developer debugging the web app, the stack trace is the single most valuable piece of information for pinpointing the exact line and sequence of calls that caused an error. By intentionally omitting the `error.stack` from the returned payload, the backend is hiding this critical diagnostic information from the frontend.

### Observed Impact

When a backend failure occurs, the developer sees only a high-level error message in the browser's console (e.g., "Server error getting dashboard data: ..."), without any indication of where in the backend code the error originated. This forces the developer to manually search through server-side logs, cross-referencing timestamps to find the corresponding error report. This dramatically increases the time and effort required to diagnose and fix bugs, indicating a poor architectural practice for system maintainability.

---

## 5.0 Conclusion

The investigation confirms the existence of critical, function-breaking bugs in the `AppSheetBridge.gs` file. It also confirms an architectural pattern of error obfuscation that hinders effective debugging. These issues are not in the frontend UI but are entirely within the backend script, which explains the observed application-wide failures.
