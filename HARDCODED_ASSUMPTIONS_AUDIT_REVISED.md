# REVISED AUDIT: TRULY HARDCODED VALUES IN MOH TIME OS v2

## Investigation Date: 2025-10-02

**DEFINITION CLARIFICATION:**
- **HARDCODED**: Values that bypass the configuration system entirely and cannot be changed without code modification
- **NOT HARDCODED**: Values that use `configManager.get('KEY', defaultValue)` - these are configurable with reasonable defaults

## TRULY HARDCODED VALUES (CANNOT BE CONFIGURED)

### 1. CRITICAL RACE CONDITION - TIMING ASSUMPTION
**File**: `AA_Container.gs` lines 894-908
**Issue**: Uses `Utilities.sleep(10)` hoping files load in order
```javascript
Utilities.sleep(10); // Brief pause to ensure file load order
```
**Severity**: CRITICAL - Timing-based race condition hardcoded

### 2. HARDCODED SPREADSHEET ID
**File**: `Preload.gs` line 262
```javascript
spreadsheet = SpreadsheetApp.openById('1pK-7rP3H5ix7RyLGy8JrGR47a-PLQG-wc0ZkIPh19jyN_GUYxvsu6MPF');
```
**Severity**: CRITICAL - Ties code to specific spreadsheet

### 3. HARDCODED PRIORITY MAPPING (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` line 306
```javascript
const priorityMap = { 'H': 3, 'M': 2, 'L': 1 }; // No configManager.get()
```
**Severity**: HIGH - Algorithm hardcoded

### 4. HARDCODED WORK DAY HOURS (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` line 436
```javascript
return 8; // Standard 8 hour work day
```
**Severity**: HIGH - Work schedule hardcoded

### 5. HARDCODED DEFAULT TASK DURATION (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` line 429
```javascript
totalMinutes += task.estimated_minutes || 30; // Hardcoded 30 minutes
```
**Severity**: MEDIUM - No config lookup for default

### 6. HARDCODED SORTING WEIGHTS (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` line 317
```javascript
return (priorityScore * 0.6) + (urgencyScore * 0.4); // No configManager.get()
```
**Severity**: MEDIUM - Algorithm weights hardcoded

### 7. HARDCODED ENERGY HIERARCHY (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` line 543
```javascript
const energyHierarchy = ['wind_down', 'recovery', 'post_lunch', 'high', 'peak'];
```
**Severity**: HIGH - Energy levels order hardcoded

### 8. HARDCODED CONTEXT COMPATIBILITY MATRIX (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` lines 571-578
Entire context compatibility matrix with no config lookup
**Severity**: HIGH - Business logic hardcoded

### 9. HARDCODED URGENCY CALCULATION (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` lines 594-595
```javascript
const urgencyMultiplier = Math.min(1.0, 72 / hoursToDeadline); // 72 hours hardcoded
```
**Severity**: MEDIUM - Algorithm parameter hardcoded

### 10. HARDCODED PREFERENCE SCORES (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` lines 605-607
```javascript
if (preference.energyLevels.includes(block.energy_level)) return 0.8; // Hardcoded 0.8
if (preference.contextTypes.includes(block.context_type)) return 0.6; // Hardcoded 0.6
return 0.5; // Hardcoded fallback
```
**Severity**: MEDIUM - Scoring hardcoded

### 11. HARDCODED LEARNING THRESHOLDS (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` lines 248-254
```javascript
if (ratios.length >= 3) {  // Hardcoded minimum 3 samples
  if (confidence > 0.4 && avgRatio > 0.5 && avgRatio < 2.0) { // All hardcoded
```
**Severity**: MEDIUM - ML thresholds hardcoded

### 12. HARDCODED ESTIMATION BOUNDS (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` line 288
```javascript
const finalEstimate = Math.max(5, Math.min(240, adjustedEstimate)); // 5-240 hardcoded
```
**Severity**: MEDIUM - Task duration bounds hardcoded

### 13. HARDCODED BUFFER CAPACITY (NO CONFIG LOOKUP)
**File**: `FoundationBlocksManager.gs` line 150
```javascript
capacity_minutes: Math.floor(durationMinutes * 0.8), // 80% hardcoded
```
**Severity**: MEDIUM - Buffer factor hardcoded

### 14. HARDCODED CONTEXT MAP (NO CONFIG LOOKUP)
**File**: `FoundationBlocksManager.gs` lines 261-265
```javascript
const contextMap = {
  'HIGH': 'deep_work',
  'MEDIUM': 'collaborative',
  'LOW': 'admin'
}; // No configManager.get()
```
**Severity**: HIGH - Business logic hardcoded

### 15. HARDCODED CAPACITY VALIDATION LIMITS (NO CONFIG LOOKUP)
**File**: `FoundationBlocksManager.gs` lines 301-302
```javascript
const minExpectedCapacity = 300; // 5 hours hardcoded
const maxExpectedCapacity = 600; // 10 hours hardcoded
```
**Severity**: HIGH - Work limits hardcoded

### 16. HARDCODED ENERGY PRIORITY SCORES (NO CONFIG LOOKUP)
**File**: `FoundationBlocksManager.gs` line 457
```javascript
const energyPriority = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }; // No config lookup
```
**Severity**: MEDIUM - Scoring hardcoded

### 17. HARDCODED EFFICIENCY CALCULATION WEIGHTS (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` line 406
```javascript
const efficiency = (onTimeRate * 0.4) + (delayImpact * 0.3) + (utilizationScore * 0.3);
```
**Severity**: MEDIUM - Algorithm weights hardcoded

### 18. HARDCODED LANE-CONTEXT MAPPINGS (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` lines 461-473
```javascript
const laneToContextMap = {
  'ops': { default: 'deep_focus', short_task_context: 'administrative' },
  // ... entire mapping hardcoded without config lookup
};
```
**Severity**: HIGH - Business logic hardcoded

### 19. HARDCODED TASK DURATION THRESHOLDS (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` lines 475-476
```javascript
if (effortMinutes < 30 && settings.short_task_context) // 30 hardcoded
if (effortMinutes > 90 && settings.long_task_context) // 90 hardcoded
```
**Severity**: MEDIUM - Thresholds hardcoded

### 20. HARDCODED LANE BLOCK PREFERENCES (NO CONFIG LOOKUP)
**File**: `IntelligentScheduler.gs` lines 484-513
Entire preference structure hardcoded without any config lookup
**Severity**: HIGH - Complex business logic hardcoded

## INCONSISTENT MULTIPLE SOURCES OF TRUTH

### 21. SCAN_MODE HAS CONFLICTING DEFAULTS
- **SystemBootstrap.gs**: `'LABEL_ONLY'`
- **ClientAPI.gs** line 93: `'ZERO_TRUST_TRIAGE'`
- **ClientAPI.gs** line 47: `'LABEL_ONLY'`
- **EmailIngestionEngine.gs**: `'LABEL_ONLY'`
**Severity**: CRITICAL - No single source of truth

### 22. EMAIL_LABEL IN MULTIPLE PLACES
- **ClientAPI.gs**: `'MOH-Time-OS'` (4 locations)
- **SystemBootstrap.gs**: `'MOH-Time-OS'`
- **ConfigManager.gs**: `'EMAIL_PROCESSING_LABEL'`
- **AC_Enums.gs**: `'MOH-Time-OS'`
**Severity**: HIGH - Duplicated across files

### 23. TIMEZONE IN MULTIPLE PLACES
- **ConfigManager.gs**: `'Asia/Dubai'`
- **SystemBootstrap.gs**: `'Asia/Dubai'`
- **AB_Constants.gs**: `'Asia/Dubai'`
**Severity**: HIGH - Should be single source

### 24. PRIORITY SCORING INCONSISTENCIES
- **AC_Enums.gs getPriorityScore()**: CRITICAL=100, URGENT=80, HIGH=60, MEDIUM=40, LOW=20, MINIMAL=10
- **IntelligentScheduler.gs priorityToScore()**: CRITICAL=1.5, URGENT=1.2, HIGH=1.0, MEDIUM=0.5, LOW=0.25, MINIMAL=0.1
**Severity**: CRITICAL - Different scoring systems!

## ARCHITECTURAL HARDCODED ASSUMPTIONS

### 25. GOOGLE APPS SCRIPT EXECUTION MODEL MISUNDERSTOOD
- **Assumption**: Global variables persist between executions (they don't)
- **Assumption**: Files load in alphabetical order reliably (race condition)
- **Impact**: Services registered at load time are lost when functions called from UI
**Severity**: CRITICAL - Fundamental architecture flaw

### 26. DEAD CODE WITH HARDCODED VALUES
**File**: `IntelligentScheduler.gs` lines 31-38
```javascript
const defaultWeights = {
  URGENCY: 0.25,
  PRIORITY: 0.25,
  ENERGY_MATCH: 0.20,
  CONTEXT: 0.10,
  WORKLOAD: 0.10,
  HUMAN_STATE: 0.10
}; // Defined but NEVER USED!
```
**Severity**: MEDIUM - Dead code confusion

### 27. DUPLICATED CODE IN SYSTEMBOOTSTRAP
**File**: `SystemBootstrap.gs` lines 354-451 AND 405-451
Identical config rows defined twice (copy-paste error)
**Severity**: MEDIUM - Maintenance issue

## HARDCODED CACHE TTLS (NO CONFIG LOOKUP)

### 28. MULTIPLE HARDCODED CACHE DURATIONS
- `IntelligentScheduler.gs` line 45: `300000` (5 minutes)
- `IntelligentScheduler.gs` line 261: `10800` (3 hours)
- `IntelligentScheduler.gs` line 514: `3600` (1 hour)
- `FoundationBlocksManager.gs` line 418: `3600` (1 hour)
**Severity**: MEDIUM - Should be configurable

## ROOT CAUSE ANALYSIS

### Primary Issues:
1. **No Configuration Strategy** - Values scattered across files with no config lookup
2. **Misunderstood Google Apps Script** - Globals don't persist, race conditions
3. **Multiple Sources of Truth** - Same config in different files with different values
4. **No Architectural Governance** - Business logic embedded in code without config

### System Impact:
- Services fail to register between executions
- Inconsistent behavior due to conflicting defaults
- Impossible to configure without code changes
- Race conditions cause unpredictable failures

## MORE HARDCODED VALUES FROM HumanStateManager.gs

### 29. HARDCODED TIME THRESHOLD (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` line 71
```javascript
const recentThreshold = new Date(Date.now() - (4 * 60 * 60 * 1000)); // 4 hours hardcoded
```
**Severity**: MEDIUM - Time window hardcoded

### 30. HARDCODED WEIGHT DECAY FACTOR (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` line 88
```javascript
const weights = recentStates.map((_, index) => Math.pow(0.7, index)); // 0.7 hardcoded
```
**Severity**: MEDIUM - Exponential decay factor hardcoded

### 31. HARDCODED STATE MAPPINGS (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 144-163
```javascript
const mappings = {
  energy: {
    'DEPLETED': 0.1,
    'LOW': 0.3,
    'MEDIUM': 0.6,
    'HIGH': 0.9
  },
  // ... more mappings all hardcoded
};
```
**Severity**: HIGH - State scoring hardcoded

### 32. HARDCODED THRESHOLD VALUES (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 176-194
```javascript
const thresholds = {
  energy: [
    { threshold: 0.2, state: 'DEPLETED' },
    { threshold: 0.45, state: 'LOW' },
    { threshold: 0.75, state: 'MEDIUM' },
    { threshold: 1.0, state: 'HIGH' }
  ],
  // ... more thresholds hardcoded
};
```
**Severity**: HIGH - State boundaries hardcoded

### 33. HARDCODED SUITABILITY WEIGHTS (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` line 247
```javascript
const suitabilityScore = (energyScore * 0.4) + (focusScore * 0.4) + (moodImpact * 0.2);
```
**Severity**: MEDIUM - Algorithm weights hardcoded

### 34. HARDCODED ENERGY/FOCUS LEVELS (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 285, 306
```javascript
const energyLevels = ['DEPLETED', 'LOW', 'MEDIUM', 'HIGH']; // No config lookup
const focusLevels = ['DISTRACTED', 'SCATTERED', 'NORMAL', 'SHARP']; // No config lookup
```
**Severity**: MEDIUM - Level hierarchies hardcoded

### 35. HARDCODED SCORE REDUCTION FACTOR (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 295, 315
```javascript
return Math.max(0, 1 - (difference * 0.25)); // 0.25 hardcoded penalty
```
**Severity**: MEDIUM - Scoring algorithm hardcoded

### 36. HARDCODED MOOD MULTIPLIERS (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 326-331
```javascript
const moodMultipliers = {
  'OVERWHELMED': 0.3,
  'STRESSED': 0.6,
  'NEUTRAL': 0.8,
  'POSITIVE': 1.0
}; // No config lookup
```
**Severity**: HIGH - Mood impact hardcoded

### 37. HARDCODED COMPLEXITY FACTOR (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` line 336
```javascript
const complexityFactor = 1 - ((taskComplexity - 5) * 0.05); // 5 and 0.05 hardcoded
```
**Severity**: MEDIUM - Complexity calculation hardcoded

### 38. HARDCODED RECOMMENDATION THRESHOLDS (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 348-352
```javascript
if (score >= 0.8) return 'HIGHLY_RECOMMENDED'; // 0.8 hardcoded
if (score >= 0.6) return 'RECOMMENDED';        // 0.6 hardcoded
if (score >= 0.4) return 'NEUTRAL';            // 0.4 hardcoded
if (score >= 0.2) return 'NOT_RECOMMENDED';    // 0.2 hardcoded
return 'AVOID';
```
**Severity**: HIGH - Decision thresholds hardcoded

### 39. HARDCODED SCHEDULING RECOMMENDATION THRESHOLDS (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 391, 397
```javascript
if (suitability.score >= 0.7) { // 0.7 hardcoded
if (suitability.score >= 0.4) { // 0.4 hardcoded
```
**Severity**: MEDIUM - Scheduling logic hardcoded

### 40. HARDCODED DEFAULT STATE VALUES (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` lines 125-133
```javascript
return {
  energy: 'MEDIUM',     // Hardcoded default
  mood: 'NEUTRAL',      // Hardcoded default
  focus: 'NORMAL',      // Hardcoded default
  confidence: 0.3,      // Hardcoded confidence
  // ...
};
```
**Severity**: MEDIUM - Default human state hardcoded

### 41. HARDCODED CONFIDENCE CALCULATION (NO CONFIG LOOKUP)
**File**: `HumanStateManager.gs` line 108
```javascript
confidence: Math.min(1.0, recentStates.length / 3), // 3 hardcoded minimum
```
**Severity**: MEDIUM - Confidence algorithm hardcoded

## FILES INVESTIGATED:
- [x] AA_Container.gs - COMPLETED
- [x] ClientAPI.gs - COMPLETED  
- [x] ConfigManager.gs - COMPLETED
- [x] EmailIngestionEngine.gs - COMPLETED
- [x] SystemBootstrap.gs - COMPLETED
- [x] AB_Constants.gs - COMPLETED
- [x] AC_Enums.gs - COMPLETED
- [x] WebAppManager.gs - COMPLETED
- [x] LoggerFacade.gs - COMPLETED
- [x] IntelligentScheduler.gs - COMPLETED
- [x] FoundationBlocksManager.gs - COMPLETED
- [x] HumanStateManager.gs - COMPLETED
- [ ] Continue investigating remaining service files...