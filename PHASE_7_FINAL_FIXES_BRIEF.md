# PHASE 7: FINAL FIXES & COMPLETENESS - SUBAGENT BRIEF

## OBJECTIVE
Complete remaining fixes including switch statements, additional validation, and final system integrity checks.

## TASKS

### TASK 1: Complete Switch Statements
**File**: `src/4_services/IntelligentScheduler.gs`
**Location**: Lines ~318-325

**Find and Replace Priority Switch**:
```javascript
// FIND (around line 318-325):
priorityToScore(priority) {
  switch(priority) {
    case PRIORITY.HIGH: return 1.0;
    case PRIORITY.NORMAL: return 0.5;
    case PRIORITY.LOW: return 0.25;
    default: return 0.5;
  }
}

// REPLACE WITH:
priorityToScore(priority) {
  switch(priority) {
    case PRIORITY.CRITICAL: return 1.5;  // ADD THIS
    case PRIORITY.HIGH: return 1.0;
    case PRIORITY.NORMAL: return 0.5;
    case PRIORITY.LOW: return 0.25;
    case PRIORITY.BACKLOG: return 0.1;   // ADD THIS
    default: return 0.5;
  }
}
```

**Add Energy Distance Bounds Checking** (around line 434-440):
```javascript
// FIND:
_calculateEnergyDistance(currentEnergy, requiredEnergy) {
  return Math.abs(currentEnergy - requiredEnergy);
}

// REPLACE WITH:
_calculateEnergyDistance(currentEnergy, requiredEnergy) {
  // Validate inputs
  const validCurrent = Math.max(0, Math.min(1, currentEnergy || 0.5));
  const validRequired = Math.max(0, Math.min(1, requiredEnergy || 0.5));

  const distance = Math.abs(validCurrent - validRequired);

  // Ensure distance is within valid range
  return Math.max(0, Math.min(1, distance));
}
```

### TASK 2: Complete Status Transition Validation
**File**: `src/1_globals/Enums.gs`
**Location**: Lines ~291-329

**Add Complete Transition Matrix**:
```javascript
// ADD this function after the STATUS enum definition:

/**
 * Validate status transitions
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {boolean} Whether transition is valid
 */
function isValidStatusTransition(from, to) {
  const transitions = {
    [STATUS.PENDING]: [STATUS.IN_PROGRESS, STATUS.CANCELED, STATUS.BLOCKED],
    [STATUS.IN_PROGRESS]: [STATUS.COMPLETED, STATUS.BLOCKED, STATUS.CANCELED, STATUS.PENDING],
    [STATUS.BLOCKED]: [STATUS.IN_PROGRESS, STATUS.CANCELED, STATUS.PENDING],
    [STATUS.COMPLETED]: [STATUS.ARCHIVED],
    [STATUS.CANCELED]: [STATUS.PENDING], // Allow reactivation
    [STATUS.ARCHIVED]: [], // No transitions from archived
    [STATUS.SCHEDULED]: [STATUS.IN_PROGRESS, STATUS.CANCELED, STATUS.BLOCKED]
  };

  const allowedTransitions = transitions[from] || [];
  return allowedTransitions.includes(to);
}

// Export for global use
if (typeof globalThis !== 'undefined') {
  globalThis.isValidStatusTransition = isValidStatusTransition;
}
```

### TASK 3: Add Missing Helper Functions
**File**: `src/1_globals/Utilities.gs`
**Location**: Add at end of file

**Add Advanced Date Parsing**:
```javascript
/**
 * Parse complex date expressions
 * @param {string} expression - Date expression like "next Friday", "in 2 days"
 * @returns {Date} Parsed date
 */
function parseComplexDate(expression) {
  if (!expression || typeof expression !== 'string') {
    return new Date();
  }

  const expr = expression.toLowerCase().trim();
  const now = new Date();

  // Handle relative dates
  if (expr.includes('today')) {
    return now;
  }

  if (expr.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  if (expr.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Handle "in X days/hours/minutes"
  const inPattern = /in\s+(\d+)\s+(day|hour|minute|week|month)s?/i;
  const inMatch = expr.match(inPattern);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2].toLowerCase();
    const result = new Date(now);

    switch(unit) {
      case 'minute':
        result.setMinutes(result.getMinutes() + amount);
        break;
      case 'hour':
        result.setHours(result.getHours() + amount);
        break;
      case 'day':
        result.setDate(result.getDate() + amount);
        break;
      case 'week':
        result.setDate(result.getDate() + (amount * 7));
        break;
      case 'month':
        result.setMonth(result.getMonth() + amount);
        break;
    }
    return result;
  }

  // Handle "next weekday"
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nextPattern = /next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
  const nextMatch = expr.match(nextPattern);
  if (nextMatch) {
    const targetDay = weekdays.indexOf(nextMatch[1].toLowerCase());
    const result = new Date(now);
    const currentDay = result.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  // Fall back to parseDateValue
  return parseDateValue(expression);
}

/**
 * Extract time estimates from text
 * @param {string} text - Text to analyze
 * @returns {number} Estimated minutes
 */
function extractTimeEstimate(text) {
  if (!text || typeof text !== 'string') {
    return 30; // Default estimate
  }

  const lower = text.toLowerCase();

  // Look for explicit time mentions
  const patterns = [
    { regex: /(\d+)\s*hours?/i, multiplier: 60 },
    { regex: /(\d+)\s*minutes?/i, multiplier: 1 },
    { regex: /(\d+)\s*mins?/i, multiplier: 1 },
    { regex: /(\d+)\s*hrs?/i, multiplier: 60 }
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern.regex);
    if (match) {
      return parseInt(match[1]) * pattern.multiplier;
    }
  }

  // Keyword-based estimates
  const keywords = {
    'quick': 15,
    'brief': 15,
    'short': 20,
    'detailed': 60,
    'comprehensive': 90,
    'extensive': 120,
    'urgent': 30,
    'asap': 30
  };

  for (const [keyword, minutes] of Object.entries(keywords)) {
    if (lower.includes(keyword)) {
      return minutes;
    }
  }

  return 30; // Default
}
```

### TASK 4: Add Missing Validation Methods
**File**: `src/3_core/BatchOperations.gs`
**Location**: Add these validation methods

**Add Data Validation Methods**:
```javascript
/**
 * Validate row data before operations
 * @param {string} sheetName - Target sheet
 * @param {Array} row - Row data to validate
 * @returns {Object} Validation result
 */
validateRowData(sheetName, row) {
  try {
    const headers = this.getHeaders(sheetName);

    if (!Array.isArray(row)) {
      return { valid: false, error: 'Row must be an array' };
    }

    if (row.length !== headers.length) {
      return {
        valid: false,
        error: `Row length (${row.length}) doesn't match headers (${headers.length})`
      };
    }

    // Validate specific sheets
    switch(sheetName) {
      case SHEET_NAMES.ACTIONS:
        // Check required fields for Actions sheet
        if (!row[headers.indexOf('title')] || row[headers.indexOf('title')].trim() === '') {
          return { valid: false, error: 'Title is required for Actions' };
        }
        break;

      case SHEET_NAMES.TIME_BLOCKS:
        // Check time block validation
        const startIdx = headers.indexOf('start_time');
        const endIdx = headers.indexOf('end_time');
        if (startIdx >= 0 && endIdx >= 0) {
          const start = new Date(row[startIdx]);
          const end = new Date(row[endIdx]);
          if (end <= start) {
            return { valid: false, error: 'End time must be after start time' };
          }
        }
        break;
    }

    return { valid: true };
  } catch (error) {
    this.logger.error('BatchOperations', 'Row validation failed', {
      sheetName,
      error: error.message
    });
    return { valid: false, error: error.message };
  }
}

/**
 * Sanitize row data before writing
 * @param {Array} row - Row to sanitize
 * @returns {Array} Sanitized row
 */
sanitizeRow(row) {
  return row.map(cell => {
    if (cell === null || cell === undefined) {
      return '';
    }
    if (typeof cell === 'string') {
      // Remove control characters and limit length
      return cell.replace(/[\x00-\x1F\x7F]/g, '').substring(0, 50000);
    }
    if (cell instanceof Date) {
      return TimeZoneAwareDate.toISOString(cell);
    }
    return String(cell);
  });
}
```

### TASK 5: Add Sheet Structure Validation
**File**: `src/0_bootstrap/SheetHealer.gs`
**Location**: Add to the SheetHealer class

**Add Structure Validation Method**:
```javascript
/**
 * Validate all sheet structures match schema
 * @static
 * @returns {Object} Validation result
 */
static validateAllSheetStructures() {
  const results = {
    valid: true,
    sheets: {},
    errors: []
  };

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const schemas = this.getRequiredSheets();

    for (const [sheetName, schema] of Object.entries(schemas)) {
      const sheet = spreadsheet.getSheetByName(sheetName);

      if (!sheet) {
        results.sheets[sheetName] = 'MISSING';
        results.errors.push(`Sheet ${sheetName} is missing`);
        results.valid = false;
        continue;
      }

      // Check headers
      const lastCol = sheet.getLastColumn() || 1;
      const actualHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const expectedHeaders = schema.headers;

      // Verify all expected headers exist
      const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));

      if (missingHeaders.length > 0) {
        results.sheets[sheetName] = 'INVALID_STRUCTURE';
        results.errors.push(`Sheet ${sheetName} missing headers: ${missingHeaders.join(', ')}`);
        results.valid = false;
      } else {
        results.sheets[sheetName] = 'VALID';
      }
    }

    return results;
  } catch (error) {
    console.error('Structure validation failed:', error.message);
    return {
      valid: false,
      error: error.message,
      sheets: {},
      errors: [error.message]
    };
  }
}
```

### TASK 6: Add Final System Integrity Checks
**File**: `src/8_setup/SystemBootstrap.gs`
**Location**: Add after runSystemHealthCheck function

**Add System Integrity Check**:
```javascript
/**
 * Run comprehensive system integrity check
 * @returns {Object} Integrity check results
 */
function runSystemIntegrityCheck() {
  const results = {
    timestamp: TimeZoneAwareDate.now(),
    checks: {},
    errors: [],
    warnings: [],
    passed: true
  };

  try {
    // Check 1: All services instantiate
    const services = Object.values(SERVICES);
    let servicesFailed = 0;

    for (const service of services) {
      try {
        const instance = container.get(service);
        if (!instance) {
          servicesFailed++;
          results.errors.push(`Service ${service} returned null`);
        }
      } catch (error) {
        servicesFailed++;
        results.errors.push(`Service ${service} failed: ${error.message}`);
      }
    }

    results.checks.services = {
      total: services.length,
      failed: servicesFailed,
      passed: servicesFailed === 0
    };

    // Check 2: All sheets exist with correct structure
    const sheetValidation = SheetHealer.validateAllSheetStructures();
    results.checks.sheets = sheetValidation;

    if (!sheetValidation.valid) {
      results.errors = results.errors.concat(sheetValidation.errors);
    }

    // Check 3: Configuration loaded
    const configManager = container.get(SERVICES.ConfigManager);
    const configHealth = configManager.getConfigurationHealth();
    results.checks.configuration = configHealth;

    if (configHealth.using_defaults) {
      results.warnings.push('System using default configuration');
    }

    // Check 4: Critical functions exist
    const functions = [
      'completeSetup',
      'healSheets',
      'checkSheetHealth',
      'parseDateValue',
      'sanitizeString',
      'isValidStatusTransition'
    ];

    const missingFunctions = functions.filter(fn => typeof global[fn] !== 'function');

    results.checks.functions = {
      total: functions.length,
      missing: missingFunctions,
      passed: missingFunctions.length === 0
    };

    if (missingFunctions.length > 0) {
      results.errors.push(`Missing functions: ${missingFunctions.join(', ')}`);
    }

    // Check 5: Error classes available
    const errorClasses = [
      'ValidationError',
      'DatabaseError',
      'BusinessLogicError',
      'SchedulingError',
      'TriageError'
    ];

    const missingErrors = errorClasses.filter(cls => {
      try {
        return typeof global[cls] !== 'function';
      } catch {
        return true;
      }
    });

    results.checks.errorClasses = {
      total: errorClasses.length,
      missing: missingErrors,
      passed: missingErrors.length === 0
    };

    // Determine overall status
    results.passed = results.errors.length === 0;
    results.status = results.passed ? 'HEALTHY' : 'FAILED';

    return results;

  } catch (error) {
    console.error('Integrity check failed:', error.message);
    return {
      timestamp: TimeZoneAwareDate.now(),
      checks: {},
      errors: [error.message],
      warnings: [],
      passed: false,
      status: 'ERROR'
    };
  }
}

// Add global function for easy access
function checkSystemIntegrity() {
  return runSystemIntegrityCheck();
}
```

## VALIDATION CRITERIA
1. All switch statements handle all enum values
2. Status transitions fully defined and validated
3. Complex date parsing implemented
4. Row validation before all write operations
5. Sheet structure validation available
6. System integrity check passes all tests

## EXPECTED OUTCOME
System is complete, validated, and ready for production use with all edge cases handled.