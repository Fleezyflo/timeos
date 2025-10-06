# Audit Report: Systemic Runtime Error Analysis

This report details the systemic architectural flaws identified in the MOH Time OS v2.0 codebase that lead to widespread runtime errors.

### 1. State Initialization Failure in Multiple Entry Points

*   **Analysis**: The core issue identified in `doGet(e)` is present in other entry points. Any function called directly by a trigger or from the Apps Script editor (e.g., functions in `RemoteControl.gs`, `TriggerSetup.gs`) runs in a new, stateless environment. Many of these functions directly call `container.get()` without first ensuring the container has been populated by `completeSetup()`.
*   **Resulting Error**: `"TypeError: container.get is not a function"`, `"TypeError: Cannot read properties of undefined (reading 'get')"`, or services being `null`, leading to crashes.

### 2. Fragile Circular Dependency Resolution

*   **Analysis**: There is a direct circular dependency between `EmailIngestionEngine` and `ZeroTrustTriageEngine`. The code attempts to resolve this using lazy getters (e.g., `get triageEngine()`). This is a notoriously fragile pattern. If `Service A`'s constructor indirectly calls a method that requires `Service B`, while `Service B` is still in the process of being constructed and requires `Service A`, a "Maximum call stack size exceeded" runtime error will occur.

### 3. Inconsistent and Unsafe Error Handling

*   **Analysis**: Error handling is inconsistent across the codebase, leading to unpredictable behavior and silent failures. This includes mixed logger usage, swallowed exceptions that prevent callers from knowing an operation failed, and a lack of `finally` blocks for critical resource cleanup like releasing locks.
*   **Resulting Error**: Silent failures, corrupted state, and subsequent runtime errors. Lock-related issues will cause timeout errors for all future operations.

### 4. Unmanaged Google Apps Script API Calls

*   **Analysis**: The system has services like `BatchOperations` and `ErrorHandler` (with a circuit breaker) specifically to manage the strict quotas and potential slowness of Google's APIs (`SpreadsheetApp`, `GmailApp`). However, several core components bypass these wrappers and call the APIs directly.
*   **Resulting Error**: Unpredictable runtime errors like `"Service invoked too many times"`, `"Exceeded maximum execution time"`, or timeouts when the system is under load.
