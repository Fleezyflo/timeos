# Proof Code for Systemic Runtime Error Analysis

This file contains code snippets that serve as proof for the analysis presented in `runtime_error_analysis.md`.

---

### 1. Proof of State Initialization Failure

**File**: `src/RemoteControl.gs`
**Issue**: The `EMAIL()` function calls `ensureInitialized()`, which is an insufficient check, and then immediately tries to use a service. This will fail if `START()` was not run in the same execution.

```javascript
// From: src/RemoteControl.gs

function EMAIL() {
  try {
    ensureInitialized(); // This check is not sufficient in a stateless environment.
    return runEmailProcessing(); // This function relies on a fully initialized container.
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ...

function ensureInitialized() {
  if (typeof container === 'undefined') {
    throw new Error('System not initialized. Run START() first.');
  }
  // This check is flawed. The container can exist but be empty.
  if (!container.has(SERVICES.SystemManager)) {
    throw new Error('Services not registered. Run START() first.');
  }
}
```

**File**: `src/8_setup/SystemBootstrap.gs`
**Issue**: The `doGet(e)` function does not call the full `completeSetup()` function, leading to an empty container.

```javascript
// From: src/8_setup/SystemBootstrap.gs

function doGet(e) {
  try {
    ensureBootstrapServices(); // This only registers a subset of services, not the full set required.
    const webAppManager = container.get(SERVICES.WebAppManager); // This will fail as WebAppManager is not registered.
    return webAppManager.handleDoGet(e);
  } catch (error) {
    // ...
  }
}
```

---

### 2. Proof of Fragile Circular Dependency

**File**: `src/4_services/EmailIngestionEngine.gs`
**Issue**: Uses a lazy getter to access `ZeroTrustTriageEngine`.

```javascript
// From: src/4_services/EmailIngestionEngine.gs

class EmailIngestionEngine {
  // ...
  get triageEngine() {
    if (!this._triageEngine) {
      if (typeof container !== 'undefined' && container.has && container.has(SERVICES.ZeroTrustTriageEngine)) {
        this._triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);
      } else {
        throw new Error('ZeroTrustTriageEngine not available in container');
      }
    }
    return this._triageEngine;
  }
  // ...
}
```

**File**: `src/4_services/ZeroTrustTriageEngine.gs`
**Issue**: Uses a lazy getter to access `EmailIngestionEngine`, creating the circular dependency.

```javascript
// From: src/4_services/ZeroTrustTriageEngine.gs

class ZeroTrustTriageEngine {
  // ...
  get emailIngestionEngine() {
    if (!this._emailIngestionEngine) {
      if (typeof container !== 'undefined' && container.has && container.has(SERVICES.EmailIngestionEngine)) {
        this._emailIngestionEngine = container.get(SERVICES.EmailIngestionEngine);
      } else {
        throw new Error('EmailIngestionEngine not available in container');
      }
    }
    return this._emailIngestionEngine;
  }
  // ...
}
```

---

### 3. Proof of Inconsistent and Unsafe Error Handling

**File**: `src/5_web/WebAppManager.gs`
**Issue**: An error in `handleDoGet` is caught and logged, but not re-thrown. The caller (`doGet`) receives `undefined` instead of an error response, leading to a cryptic failure.

```javascript
// From: src/5_web/WebAppManager.gs

  handleDoGet(e) {
    // ...
    try {
      // ... logic that might fail ...
      return this.appSheetBridge.doGet(e);
    } catch (error) {
      this.logger.error('WebAppManager', 'doGet failed', { verification_id: verificationId, error: error.message });
      // The error is swallowed here. The function returns undefined.
    } finally {
      lock.releaseLock();
    }
  }
```

**File**: `src/4_services/SystemManager.gs`
**Issue**: The `runCompleteSetup` function acquires a lock but does not release it in a `finally` block. If an error occurs after the lock is acquired but before it's released, the lock will be held indefinitely.

```javascript
// From: src/4_services/SystemManager.gs

  runCompleteSetup() {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(30000); // Lock is acquired here.
      // ...
      // If an error happens anywhere in this block, releaseLock() is never called.
      // ...
      lock.releaseLock(); // This line might not be reached.
      return { status: 'success' };
    } catch (error) {
      // ...
    }
    // NO finally block to release the lock.
  }
```

---

### 4. Proof of Unmanaged Google Apps Script API Calls

**File**: `src/0_bootstrap/SheetHealer.gs`
**Issue**: `SheetHealer` directly calls `SpreadsheetApp.getActiveSpreadsheet()` and other `SpreadsheetApp` methods, bypassing the `BatchOperations` service which is designed to manage API quotas and provide resilience.

```javascript
// From: src/0_bootstrap/SheetHealer.gs

class SheetHealer {
  static validateAndRepair() {
    // ...
    try {
      const spreadsheet = getActiveSystemSpreadsheet(); // Uses SpreadsheetApp directly
      // ...
      for (const [sheetName, schema] of Object.entries(requiredSheets)) {
          // ...
          let sheet = spreadsheet.getSheetByName(sheetName); // Direct API call
          if (!sheet) {
            sheet = this.createSheet(spreadsheet, sheetName, schema); // Direct API call
          }
          // ...
      }
      // ...
    }
  }
}
```

**File**: `src/3_core/PersistentStore.gs`
**Issue**: `PersistentStore` directly calls `PropertiesService` on every `get` and `set` operation. This service has strict quotas and can cause runtime errors if called too frequently. It is not wrapped by the `ErrorHandler`'s circuit breaker.

```javascript
// From: src/3_core/PersistentStore.gs

class PersistentStore {
  constructor() {
    this.scriptProperties = PropertiesService.getScriptProperties(); // Direct API call
  }

  set(key, value, ttl = null) {
    // ...
    this.scriptProperties.setProperty(safeKey, serialized); // Direct API call
    // ...
  }

  get(key) {
    // ...
    const stored = this.scriptProperties.getProperty(safeKey); // Direct API call
    // ...
  }
}
```
