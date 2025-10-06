# PHASE 1: CORE SERVICES - SUBAGENT BRIEF

## OBJECTIVE
Fix core service implementations to enable basic system functionality.

## TASKS

### TASK 1: Complete SafeColumnAccess Implementation
**File**: `src/7_support/SafeColumnAccess.gs`
**Current State**: Class exists but is incomplete
**Required Actions**:
1. Open the file and review current implementation
2. Add the following methods:
   - `buildColumnMap()` - Create map of column names to indices
   - `getColumnIndex(columnName)` - Get index for column name
   - `getValue(row, columnName)` - Safe column value retrieval
   - `setValue(row, columnName, value)` - Safe column value setting
   - `createEmptyRow()` - Create properly sized empty row
   - `validateRow(row)` - Validate row structure
   - `mapRowToObject(row)` - Convert row array to object
   - `mapObjectToRow(obj)` - Convert object to row array

**Implementation Code**:
```javascript
class SafeColumnAccess {
  constructor(headers) {
    this.headers = headers || [];
    this.columnMap = new Map();
    this.buildColumnMap();
  }

  buildColumnMap() {
    this.headers.forEach((header, index) => {
      if (header) {
        this.columnMap.set(header.toLowerCase().trim(), index);
      }
    });
  }

  getColumnIndex(columnName) {
    if (!columnName) return -1;
    return this.columnMap.get(columnName.toLowerCase().trim()) || -1;
  }

  getValue(row, columnName) {
    const index = this.getColumnIndex(columnName);
    return index >= 0 && index < row.length ? row[index] : null;
  }

  setValue(row, columnName, value) {
    const index = this.getColumnIndex(columnName);
    if (index >= 0) {
      while (row.length <= index) {
        row.push('');
      }
      row[index] = value;
    }
    return row;
  }

  createEmptyRow() {
    return new Array(this.headers.length).fill('');
  }

  validateRow(row) {
    if (!Array.isArray(row)) return false;
    return row.length === this.headers.length;
  }

  mapRowToObject(row) {
    const obj = {};
    this.headers.forEach((header, index) => {
      if (header && index < row.length) {
        obj[header] = row[index];
      }
    });
    return obj;
  }

  mapObjectToRow(obj) {
    const row = this.createEmptyRow();
    Object.keys(obj).forEach(key => {
      this.setValue(row, key, obj[key]);
    });
    return row;
  }
}
```

### TASK 2: Fix IntelligentScheduler STUB Method
**File**: `src/4_services/IntelligentScheduler.gs`
**Line**: 328
**Current Code**: Contains a STUB warning for `_calculateSchedulingEfficiency`
**Required Actions**:
1. Locate line 328 with the STUB method
2. Replace the entire `_calculateSchedulingEfficiency()` method with proper implementation
3. Add helper methods `_calculateActiveHours()` and `_calculateTotalAvailableHours()`

**Replacement Code**:
```javascript
_calculateSchedulingEfficiency() {
  try {
    const allTasks = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {});
    if (!allTasks || allTasks.length === 0) return 1.0;

    let completedOnTime = 0;
    let totalCompleted = 0;
    let totalDelayed = 0;
    let utilizationScore = 0;

    for (const task of allTasks) {
      if (task.status === STATUS.COMPLETED) {
        totalCompleted++;
        if (task.scheduled_end && task.actual_end) {
          const scheduled = new Date(task.scheduled_end);
          const actual = new Date(task.actual_end);
          if (actual <= scheduled) {
            completedOnTime++;
          } else {
            totalDelayed++;
          }
        }
      }
    }

    const onTimeRate = totalCompleted > 0 ? completedOnTime / totalCompleted : 1.0;
    const delayImpact = totalCompleted > 0 ? 1 - (totalDelayed / totalCompleted) * 0.5 : 1.0;
    const activeHours = this._calculateActiveHours();
    const totalHours = this._calculateTotalAvailableHours();
    utilizationScore = totalHours > 0 ? activeHours / totalHours : 0.5;

    const efficiency = (onTimeRate * 0.4) + (delayImpact * 0.3) + (utilizationScore * 0.3);

    this.logger.info('IntelligentScheduler', 'Calculated scheduling efficiency', {
      onTimeRate,
      delayImpact,
      utilizationScore,
      efficiency
    });

    return Math.max(0, Math.min(1, efficiency));
  } catch (error) {
    this.logger.error('IntelligentScheduler', 'Failed to calculate efficiency', { error: error.message });
    return 0.75;
  }
}

_calculateActiveHours() {
  const activeTasks = this.batchOperations.getRowsByFilter(SHEET_NAMES.ACTIONS, {
    status: STATUS.IN_PROGRESS
  });

  let totalMinutes = 0;
  for (const task of activeTasks) {
    totalMinutes += task.estimated_minutes || 30;
  }

  return totalMinutes / 60;
}

_calculateTotalAvailableHours() {
  return 8; // Standard 8 hour work day
}
```

### TASK 3: Complete EmailIngestionEngine Learning System
**File**: `src/4_services/EmailIngestionEngine.gs`
**Lines**: 411-417
**Current Issue**: `_initializeLearningSystem()` returns empty object
**Required Actions**:
1. Find the `_initializeLearningSystem()` method (around line 411)
2. Replace with full implementation
3. Add helper methods: `_persistLearningData()` and `_generateRecommendation()`

**Replacement Code**:
```javascript
_initializeLearningSystem() {
  try {
    const storedPatterns = this.persistentStore.get('email_learning_patterns');
    const storedConfidence = this.persistentStore.get('email_learning_confidence');

    const patterns = storedPatterns ? JSON.parse(storedPatterns) : {
      senderPatterns: {},
      subjectPatterns: {},
      contentPatterns: {},
      timePatterns: {},
      priorityPatterns: {}
    };

    const confidence = storedConfidence ? JSON.parse(storedConfidence) : {
      overall: 0.5,
      byCategory: {
        sender: 0.5,
        subject: 0.5,
        content: 0.5,
        timing: 0.5
      }
    };

    return {
      patterns,
      confidence,
      updatePattern: (category, key, value) => {
        if (!patterns[category]) patterns[category] = {};
        patterns[category][key] = value;
        this._persistLearningData(patterns, confidence);
      },
      updateConfidence: (category, delta) => {
        if (confidence.byCategory[category]) {
          confidence.byCategory[category] = Math.max(0, Math.min(1,
            confidence.byCategory[category] + delta
          ));
          confidence.overall = Object.values(confidence.byCategory)
            .reduce((sum, val) => sum + val, 0) / Object.keys(confidence.byCategory).length;
          this._persistLearningData(patterns, confidence);
        }
      },
      getRecommendation: (email) => {
        return this._generateRecommendation(email, patterns, confidence);
      }
    };
  } catch (error) {
    this.logger.error('EmailIngestionEngine', 'Failed to initialize learning system', {
      error: error.message
    });
    return {
      patterns: {},
      confidence: { overall: 0.5, byCategory: {} },
      updatePattern: () => {},
      updateConfidence: () => {},
      getRecommendation: () => null
    };
  }
}

_persistLearningData(patterns, confidence) {
  try {
    this.persistentStore.set('email_learning_patterns', JSON.stringify(patterns));
    this.persistentStore.set('email_learning_confidence', JSON.stringify(confidence));
  } catch (error) {
    this.logger.error('EmailIngestionEngine', 'Failed to persist learning data', {
      error: error.message
    });
  }
}

_generateRecommendation(email, patterns, confidence) {
  const recommendations = {
    priority: null,
    category: null,
    estimatedTime: null,
    confidence: confidence.overall
  };

  if (patterns.senderPatterns && patterns.senderPatterns[email.from]) {
    const senderHistory = patterns.senderPatterns[email.from];
    recommendations.priority = senderHistory.averagePriority || PRIORITY.NORMAL;
  }

  if (patterns.subjectPatterns) {
    for (const [pattern, data] of Object.entries(patterns.subjectPatterns)) {
      if (email.subject && email.subject.includes(pattern)) {
        recommendations.category = data.category;
        recommendations.estimatedTime = data.averageTime;
        break;
      }
    }
  }

  return recommendations;
}
```

### TASK 4: Add DEPENDENCIES Sheet to Constants
**File**: `src/1_constants/Constants.gs`
**Location**: SHEET_NAMES constant definition
**Required Actions**:
1. Find the SHEET_NAMES constant
2. Add `DEPENDENCIES: 'Dependencies'` to the object

**Code to Add**:
```javascript
const SHEET_NAMES = Object.freeze({
  ACTIONS: 'Actions',
  FOUNDATION_BLOCKS: 'FoundationBlocks',
  APPSHEET_CONFIG: 'APPsheet.CONFIG',
  TIME_BLOCKS: 'TimeBlocks',
  HUMAN_STATE: 'HumanState',
  SENDERS: 'Senders',
  STATUS: 'Status',
  LOG: 'Log',
  EMAIL_PROCESSING: 'EmailProcessing',
  CACHE: 'Cache',
  ZERO_TRUST_TRIAGE: 'ZeroTrustTriage',
  PROPOSALS: 'Proposals',
  ARCHIVE: 'Archive',
  DEPENDENCIES: 'Dependencies'  // ADD THIS LINE
});
```

## VALIDATION CRITERIA
1. SafeColumnAccess class has all 8 required methods
2. IntelligentScheduler no longer has STUB warning
3. EmailIngestionEngine learning system persists data
4. DEPENDENCIES sheet appears in SHEET_NAMES constant

## EXPECTED OUTCOME
Core services will be complete and functional, enabling basic system operations.