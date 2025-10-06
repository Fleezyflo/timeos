# COMPREHENSIVE AUDIT OF TRULY HARDCODED VALUES IN MOH TIME OS v2

## Investigation Date: 2025-10-02

**DEFINITION CLARIFICATION:**
- **HARDCODED**: Values that bypass the configuration system entirely and cannot be changed without code modification
- **NOT HARDCODED**: Values that use `configManager.get('KEY', defaultValue)` - these are configurable with reasonable defaults

## CRITICAL FINDINGS - TRULY HARDCODED VALUES

### 1. CRITICAL RACE CONDITION IN SERVICE REGISTRATION
**File**: `AA_Container.gs` lines 894-908
**Issue**: Uses `Utilities.sleep(10)` hoping `registerAllServices` will be available after AZ_ServiceRegistration.gs loads
```javascript
Utilities.sleep(10); // Brief pause to ensure file load order
if (typeof registerAllServices === 'function') {
  registerAllServices();
```
**Problem**: This is a timing-based hack that's completely unreliable. Google Apps Script does NOT guarantee file load order timing.
**Severity**: CRITICAL - Can cause complete system failure

### 2. SERVICES DON'T PERSIST BETWEEN EXECUTIONS
**Issue**: Google Apps Script resets all global variables (including the container) between function executions from different contexts (e.g., UI calls via google.script.run)
**Impact**: Services registered during script load are LOST when functions are called from the UI
**Evidence**: Logs show services ARE registered (31 services) but later ZeroTrustTriageEngine "not available in container"
**Severity**: CRITICAL - Core functionality broken

### 3. HARDCODED SCAN_MODE DEFAULTS (MULTIPLE CONFLICTING VALUES)
Multiple files hardcode `SCAN_MODE` to `'LABEL_ONLY'`:
- **SystemBootstrap.gs** lines 362, 413: Seeds APPSHEET_CONFIG with `'LABEL_ONLY'`
- **ClientAPI.gs** lines 47, 93, 103: Hardcodes fallback to `'LABEL_ONLY'`  
- **EmailIngestionEngine.gs** line 44: Defaults to `'LABEL_ONLY'` if not found
- **ConfigManager.gs** lines 11-28: DEFAULT_CONFIG_DATA does NOT include SCAN_MODE at all!
**Problem**: No single source of truth for SCAN_MODE default
**Severity**: HIGH - Inconsistent behavior

### 4. DUPLICATED SEED DATA IN SYSTEMBOOTSTRAP
**File**: `SystemBootstrap.gs` lines 354-451 AND 405-451
**Issue**: The EXACT SAME config rows are defined TWICE (copy-paste error)
```javascript
// Lines 354-451: First definition of configRows
const configRows = [
  ['cfg_timezone', 'SYSTEM', 'CORE', 'Timezone', 'TIMEZONE', 'Asia/Dubai', 'Default timezone'],
  // ... 28 more rows
];

// Lines 405-451: EXACT DUPLICATE of configRows
const configRows = [
  ['cfg_timezone', 'SYSTEM', 'CORE', 'Timezone', 'TIMEZONE', 'Asia/Dubai', 'Default timezone'],
  // ... 28 more rows
];
```
**Impact**: Maintenance nightmare, potential for divergence
**Severity**: MEDIUM - Code quality issue

### 5. MULTIPLE LAYERS OF HARDCODED FALLBACKS IN CLIENTAPI
**File**: `ClientAPI.gs`
- Lines 46-51: First fallback with hardcoded values
- Lines 92-97: Second fallback with DIFFERENT hardcoded values (SCAN_MODE differs!)
- Lines 102-107: Third fallback on error
- Line 222-227: `testSimpleReturn()` function returns hardcoded test data
**Problem**: Different fallback values at each layer
**Severity**: HIGH - Unpredictable behavior

### 6. MISSING SCAN_MODE IN CONFIGMANAGER DEFAULTS
**File**: `ConfigManager.gs` lines 11-28
**Issue**: DEFAULT_CONFIG_DATA doesn't include SCAN_MODE but the system expects it
**Impact**: ConfigManager can't provide SCAN_MODE as a default when APPSHEET_CONFIG is missing
**Severity**: HIGH - Missing critical configuration

### 7. HARDCODED EMAIL LABEL
Multiple files hardcode `'MOH-Time-OS'`:
- **ClientAPI.gs**: lines 48, 94, 104, 224
- **SystemBootstrap.gs**: lines 363, 414
- **ConfigManager.gs**: line 19 (as 'EMAIL_PROCESSING_LABEL')
- **EmailIngestionEngine.gs**: line 71
**Severity**: MEDIUM - Should be configurable

### 8. HARDCODED DEFAULT_DURATION_MINUTES
**File**: `ClientAPI.gs` 
Hardcoded to `30` in lines 49, 95, 105, 224
**Severity**: LOW - Reasonable default but should be centralized

### 9. HARDCODED CALENDAR_ID
**File**: `ClientAPI.gs`
Hardcoded to `'primary'` in lines 50, 96, 106, 225
**Severity**: LOW - Standard Google Calendar default

### 10. HARDCODED BATCH SIZES
- **ConfigManager.gs** line 16: MAX_BATCH_SIZE defaults to `CONSTANTS.DEFAULT_BATCH_SIZE`
- **ConfigManager.gs** line 18: EMAIL_BATCH_SIZE defaults to `CONSTANTS.EMAIL_BATCH_SIZE`
- **SystemBootstrap.gs** lines 359, 410: Uses `String(CONSTANTS.DEFAULT_BATCH_SIZE)`
**Severity**: LOW - At least uses constants

### 11. HARDCODED TIMEZONE
- **ConfigManager.gs** line 12: `'Asia/Dubai'`
- **SystemBootstrap.gs** lines 355, 406: `'Asia/Dubai'`
**Severity**: MEDIUM - Should be user-configurable

### 12. HARDCODED FEATURE FLAGS
- **ConfigManager.gs** lines 13-15: ENABLE_EMAIL_PROCESSING='true', ENABLE_CALENDAR_SYNC='false', ENABLE_AUTO_SCHEDULING='false'
- **SystemBootstrap.gs** lines 356-358, 407-409: Same hardcoded values
**Severity**: MEDIUM - Feature flags should be easily configurable

### 13. HARDCODED APPSHEET DEFAULTS
**File**: `AppSheetBridge.gs` lines 48-52
```javascript
circuit_breaker_threshold: this.configManager.getNumber('CIRCUIT_BREAKER_THRESHOLD', 5),
scheduler_interval_minutes: this.configManager.getNumber('SCHEDULER_INTERVAL_MINUTES', 15),
email_batch_size: this.configManager.getNumber('EMAIL_INGESTION_BATCH_SIZE', 50),
work_hours: this.configManager.getJSON('WORK_HOURS', { start: '10:00', end: '18:00' }),
score_weights: this.configManager.getJSON('SCORE_WEIGHTS', { deadline: 0.5, priority: 0.3, context: 0.2 })
```
**Severity**: MEDIUM - Complex defaults embedded in code

### 14. HARDCODED SPREADSHEET ID
**File**: `Preload.gs` line 262
```javascript
spreadsheet = SpreadsheetApp.openById('1pK-7rP3H5ix7RyLGy8JrGR47a-PLQG-wc0ZkIPh19jyN_GUYxvsu6MPF');
```
**Severity**: HIGH - Ties code to specific spreadsheet

### 15. INCONSISTENT ERROR HANDLING
- Some places use `LoggerFacade`, others use `Logger.log`, others use `safeLog`
- No consistent pattern for when to throw vs return null vs use fallback
**Severity**: MEDIUM - Makes debugging difficult

### 16. ASSUMPTION THAT ensureServicesRegistered() WORKS
**File**: `AA_Container.gs` lines 872-890
The `ensureServicesRegistered()` function assumes `registerAllServices` will be available but doesn't handle the case where it's not
**Severity**: HIGH - Can cause silent failures

## MORE HARDCODED VALUES FOUND IN AB_Constants.gs

### 17. MASSIVE AMOUNT OF HARDCODED CONSTANTS
**File**: `AB_Constants.gs` lines 9-83
```javascript
const CONSTANTS = Object.freeze({
  VERSION: 'MOH_TIME_OS_v2.0',
  NAMESPACE: 'MTO',
  SCHEMA_VERSION: '2.0',
  TIMEZONE: 'Asia/Dubai',  // HARDCODED!
  LOCALE: 'en-US',
  CACHE_DURATION: 300000,  // 5 minutes hardcoded
  HOT_CACHE_SIZE: 100,
  PERSISTENT_CACHE_TTL: 3600000,  // 1 hour hardcoded
  // ... and 50+ more hardcoded values
});
```
**Severity**: HIGH - All system constants hardcoded

### 18. HARDCODED DEFAULT_CONFIG IN AB_Constants.gs
**File**: `AB_Constants.gs` lines 444-487
ANOTHER set of default configs, DIFFERENT from ConfigManager's defaults!
```javascript
const DEFAULT_CONFIG = Object.freeze({
  'SCHEDULING_ENABLED': 'true',
  'EMAIL_PROCESSING_ENABLED': 'true',
  'CALENDAR_SYNC_ENABLED': 'true',
  'HUMAN_STATE_TRACKING_ENABLED': 'true',
  'ARCHIVE_ENABLED': 'true',
  'SCHEDULER_INTERVAL_MINUTES': '15',
  'EMAIL_CHECK_INTERVAL_MINUTES': '30',
  'CALENDAR_SYNC_INTERVAL_MINUTES': '60',
  // ... 30+ more hardcoded values
});
```
**Problem**: THIRD different set of defaults (ConfigManager, SystemBootstrap, now Constants)
**Severity**: CRITICAL - Multiple sources of truth

### 19. HARDCODED EMAIL LABELS IN AC_Enums.gs
**File**: `AC_Enums.gs` lines 235-248
```javascript
const GMAIL_LABELS = Object.freeze({
  TRIAGE_APPROVED: 'TimeOS/Triage-Approved',
  TRIAGE_IGNORED: 'TimeOS/Triage-Ignored',
  TRIAGE_PROCESSING: 'TimeOS/Triage-Processing',
  PROCESSED: 'TimeOS/Processed',
  ACTION_BLOCK: 'TimeOS/ActionBlock',
  QUARANTINED: 'MOH-Quarantined',
  EMAIL_PROCESSING: 'MOH-Time-OS'  // FOURTH place this is hardcoded!
});
```
**Severity**: HIGH - Labels should be configurable

### 20. HARDCODED DEFAULT ENUM VALUES
**File**: `AC_Enums.gs` lines 280-303
```javascript
function normalizeStatus(status) {
  return getValidEnumValue(STATUS, status, STATUS.NOT_STARTED);
}
function normalizePriority(priority) {
  return getValidEnumValue(PRIORITY, priority, PRIORITY.MEDIUM);
}
function normalizeLane(lane) {
  return getValidEnumValue(LANE, lane, LANE.OPERATIONAL);
}
function normalizeEnergyLevel(energyLevel) {
  return getValidEnumValue(ENERGY_LEVEL, energyLevel, ENERGY_LEVEL.MEDIUM);
}
```
**Severity**: MEDIUM - Default values hardcoded in normalization functions

### 21. HARDCODED PRIORITY SCORES
**File**: `AC_Enums.gs` lines 353-362
```javascript
const scores = {
  [PRIORITY.CRITICAL]: 100,
  [PRIORITY.URGENT]: 80,
  [PRIORITY.HIGH]: 60,
  [PRIORITY.MEDIUM]: 40,
  [PRIORITY.LOW]: 20,
  [PRIORITY.MINIMAL]: 10
};
```
**Severity**: MEDIUM - Scoring algorithm hardcoded

### 22. HARDCODED ENERGY SCORES
**File**: `AC_Enums.gs` lines 368-377
```javascript
const scores = {
  [ENERGY_LEVEL.CRITICAL]: 100,
  [ENERGY_LEVEL.HIGH]: 80,
  [ENERGY_LEVEL.MEDIUM]: 60,
  [ENERGY_LEVEL.LOW]: 40,
  [ENERGY_LEVEL.RECOVERY]: 20
};
```
**Severity**: MEDIUM - Energy scoring hardcoded

### 23. HARDCODED HTML TITLE AND META TAGS
**File**: `WebAppManager.gs` lines 29-32
```javascript
.setTitle('MOH Time OS - Day Planner')
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
.addMetaTag('viewport', 'width=device-width, initial-scale=1');
```
**Severity**: LOW - UI titles hardcoded

### 24. HARDCODED ERROR HTML TEMPLATE
**File**: `WebAppManager.gs` lines 46-61
Entire HTML error page hardcoded with styles and text
**Severity**: LOW - Error messages should be configurable

### 25. HARDCODED LOCK TIMEOUT
**File**: `WebAppManager.gs` lines 74, 100
```javascript
if (!lock.tryLock(10000)) {  // 10 seconds hardcoded
```
**Severity**: MEDIUM - Timeout should be configurable

### 26. HARDCODED API RATE LIMITS
**File**: `AB_Constants.gs` lines 74-77
```javascript
SHEETS_API_CALLS_PER_MINUTE: 300,
GMAIL_API_CALLS_PER_MINUTE: 250,
CALENDAR_API_CALLS_PER_MINUTE: 200,
```
**Severity**: MEDIUM - Rate limits should be configurable based on quota

### 27. HARDCODED STOP WORDS
**File**: `AB_Constants.gs` lines 79-82
```javascript
STOP_WORDS: ['from', 'with', 'that', 'this', 'there', 'which', 'would',
             'should', 'could', 'about', 'your', 'subject', 'please',
             'thank', 'regards']
```
**Severity**: LOW - Language-specific stopwords hardcoded

### 28. HARDCODED PERFORMANCE THRESHOLDS
**File**: `AB_Constants.gs` lines 501-509
```javascript
const PERFORMANCE_THRESHOLDS = Object.freeze({
  COLD_START_MS: 1500,
  WARM_START_MS: 500,
  API_CALL_MS: 2000,
  CACHE_HIT_RATE: 0.8,
  ERROR_RATE: 0.1,
  MEMORY_LIMIT_MB: 30,
  EXECUTION_TIME_MS: 25000  // Leave 5s buffer before 30s limit
});
```
**Severity**: MEDIUM - Performance expectations hardcoded

### 29. HARDCODED ERROR MESSAGE TEMPLATES
**File**: `AB_Constants.gs` lines 512-547
Over 20 error message templates hardcoded
**Severity**: LOW - Error messages should support i18n

### 30. HARDCODED DEFAULT ARCHIVE DAYS
**File**: `AB_Constants.gs` lines 59-62
```javascript
DEFAULT_ARCHIVE_DAYS: 90,
MAX_ARCHIVE_DAYS: 365,
MIN_ARCHIVE_DAYS: 30,
```
**Severity**: MEDIUM - Archive policy hardcoded

### 31. HARDCODED EMAIL PROCESSING THRESHOLDS
**File**: `AB_Constants.gs` lines 64-67
```javascript
EMAIL_BATCH_SIZE: 20,
MAX_EMAIL_CONTENT_LENGTH: 5000,
EMAIL_CONFIDENCE_THRESHOLD: 0.7,
```
**Severity**: HIGH - Email processing limits hardcoded

### 32. HARDCODED HUMAN STATE FACTORS
**File**: `AB_Constants.gs` lines 69-72
```javascript
HUMAN_STATE_TTL: 3600000,      // 1 hour
ENERGY_ADJUSTMENT_FACTOR: 0.2,
FOCUS_ADJUSTMENT_FACTOR: 0.3,
```
**Severity**: MEDIUM - Human factors should be personalizable

### 33. INCONSISTENT SCAN_MODE DEFAULTS
Found THREE different defaults for SCAN_MODE:
1. SystemBootstrap.gs: `'LABEL_ONLY'`
2. ClientAPI.gs sometimes: `'LABEL_ONLY'`
3. ClientAPI.gs other times: `'ZERO_TRUST_TRIAGE'`
4. ConfigManager.gs: NOT INCLUDED AT ALL
**Severity**: CRITICAL - No single source of truth

### 34. INCONSISTENT TIMEZONE DEFAULTS
Found in multiple places:
1. ConfigManager.gs line 12: `'Asia/Dubai'`
2. SystemBootstrap.gs lines 355, 406: `'Asia/Dubai'`
3. AB_Constants.gs line 16: `'Asia/Dubai'`
**Severity**: HIGH - Should be user-configurable, single source

### 35. HARDCODED CONTEXT MAPPINGS
**File**: `AC_Enums.gs` lines 113-119
```javascript
DEEP_WORK: 'deep_focus',
CREATIVE: 'creative',
COMMUNICATION: 'communication',
LEARNING: 'analysis',  // Note: inconsistent mapping!
ADMIN: 'administrative',
BUFFER: 'buffer'
```
**Problem**: 'LEARNING' maps to 'analysis' not 'learning'
**Severity**: HIGH - Mapping inconsistency

### 36. HARDCODED LOG MESSAGE PREFIXES
**File**: `LoggerFacade.gs` lines 142-159
```javascript
Logger.log('CONSOLE: ' + args.map(String).join(' '));
Logger.log('CONSOLE ERROR: ' + args.map(String).join(' '));
Logger.log('CONSOLE WARN: ' + args.map(String).join(' '));
```
**Severity**: LOW - Logging formats hardcoded

### 37. HARDCODED VERSION IN LOGGERFACADE
**File**: `LoggerFacade.gs` line 171
```javascript
version: '2.0.0',
```
**Severity**: LOW - Version should come from constants

### 38. HARDCODED SCHEDULING WEIGHTS IN IntelligentScheduler
**File**: `IntelligentScheduler.gs` lines 31-38
```javascript
const defaultWeights = {
  URGENCY: 0.25,
  PRIORITY: 0.25,
  ENERGY_MATCH: 0.20,
  CONTEXT: 0.10,
  WORKLOAD: 0.10,
  HUMAN_STATE: 0.10
};
```
**Problem**: These default weights are defined but NEVER USED!
**Severity**: HIGH - Dead code with hardcoded values

### 39. HARDCODED ENERGY AND DIFFICULTY LEVELS
**File**: `IntelligentScheduler.gs` lines 40-41
```javascript
this.ENERGY_LEVELS = { HIGH: 3, MEDIUM: 2, LOW: 1 };
this.TASK_DIFFICULTY = { DEEP_WORK: 3, CREATIVE: 2, ADMIN: 1, COMMUNICATION: 1 };
```
**Severity**: MEDIUM - Scoring factors hardcoded

### 40. HARDCODED CACHE TTL IN IntelligentScheduler
**File**: `IntelligentScheduler.gs` line 45
```javascript
this.estimationCacheTTL = 300000; // 5 minutes
```
**Severity**: MEDIUM - Cache duration hardcoded

### 41. MORE HARDCODED WEIGHTS IN IntelligentScheduler
**File**: `IntelligentScheduler.gs` lines 50-56
```javascript
priority: this.configManager.getNumber('WEIGHT_PRIORITY', 0.3),
deadline: this.configManager.getNumber('WEIGHT_DEADLINE', 0.25),
rollover: this.configManager.getNumber('WEIGHT_ROLLOVER', 0.15),
duration: this.configManager.getNumber('WEIGHT_DURATION', 0.1),
dependencies: this.configManager.getNumber('WEIGHT_DEPENDENCIES', 0.1),
energy: this.configManager.getNumber('WEIGHT_ENERGY', 0.05),
context: this.configManager.getNumber('WEIGHT_CONTEXT', 0.05)
```
**Problem**: Defaults here differ from the unused defaultWeights object!
**Severity**: HIGH - Inconsistent defaults

### 42. HARDCODED CONTEXT MATCH BONUS
**File**: `IntelligentScheduler.gs` line 148
```javascript
const contextMatchBonus = this.configManager.getNumber('CONTEXT_MATCH_BONUS', 0.25);
```
**Severity**: MEDIUM - Algorithm parameter hardcoded

### 43. HARDCODED PRIORITY MAPPING
**File**: `IntelligentScheduler.gs` line 306
```javascript
const priorityMap = { 'H': 3, 'M': 2, 'L': 1 };
```
**Severity**: HIGH - Scoring algorithm hardcoded

### 44. HARDCODED PRIORITY SCORES (DIFFERENT FROM ENUMS!)
**File**: `IntelligentScheduler.gs` lines 360-372
```javascript
case PRIORITY.CRITICAL: return 1.5;
case PRIORITY.URGENT: return 1.2;
case PRIORITY.HIGH: return 1.0;
case PRIORITY.MEDIUM: return 0.5;
case PRIORITY.LOW: return 0.25;
case PRIORITY.MINIMAL: return 0.1;
// Support legacy single-letter codes
case 'H': return 1.0;
case 'M': return 0.5;
case 'L': return 0.25;
```
**Problem**: Different scoring than AC_Enums.gs getPriorityScore()!
**Severity**: CRITICAL - Inconsistent priority scoring across system

### 45. HARDCODED EFFICIENCY CALCULATION WEIGHTS
**File**: `IntelligentScheduler.gs` line 406
```javascript
const efficiency = (onTimeRate * 0.4) + (delayImpact * 0.3) + (utilizationScore * 0.3);
```
**Severity**: MEDIUM - Algorithm weights hardcoded

### 46. HARDCODED DEFAULT TASK DURATION
**File**: `IntelligentScheduler.gs` line 429
```javascript
totalMinutes += task.estimated_minutes || 30;
```
**Severity**: MEDIUM - Default 30 minutes hardcoded

### 47. HARDCODED WORK DAY HOURS
**File**: `IntelligentScheduler.gs` line 436
```javascript
return 8; // Standard 8 hour work day
```
**Severity**: HIGH - Work day duration should be configurable

### 48. MASSIVE HARDCODED LANE-ENERGY MAPPINGS
**File**: `IntelligentScheduler.gs` lines 440-452
```javascript
return this.configManager.getJSON('LANE_ENERGY_MAP', {
  'ops': 'peak',
  'client': 'high',
  'growth': 'high',
  'admin': 'post_lunch',
  'personal': 'low',
  'deep_work': 'peak',
  'creative': 'high',
  'communication': 'medium',
  'learning': 'high',
  'strategic': 'peak',
  'default': 'medium'
});
```
**Severity**: HIGH - Complex business logic hardcoded

### 49. HARDCODED LANE-CONTEXT MAPPINGS
**File**: `IntelligentScheduler.gs` lines 461-473
```javascript
const laneToContextMap = {
  'ops': { default: 'deep_focus', short_task_context: 'administrative' },
  'client': { default: 'communication', long_task_context: 'deep_focus' },
  'growth': { default: 'creative' },
  'admin': { default: 'administrative' },
  'personal': { default: 'buffer' },
  'deep_work': { default: 'deep_focus' },
  'creative': { default: 'creative' },
  'communication': { default: 'communication' },
  'learning': { default: 'analysis' },
  'strategic': { default: 'deep_focus' },
  'default': { default: 'administrative' }
};
```
**Severity**: HIGH - Business logic hardcoded

### 50. HARDCODED TASK DURATION THRESHOLDS
**File**: `IntelligentScheduler.gs` lines 475-476
```javascript
if (effortMinutes < 30 && settings.short_task_context) return settings.short_task_context;
if (effortMinutes > 90 && settings.long_task_context) return settings.long_task_context;
```
**Severity**: MEDIUM - 30 and 90 minute thresholds hardcoded

### 51. HARDCODED LANE BLOCK PREFERENCES
**File**: `IntelligentScheduler.gs` lines 484-513
Entire preference structure hardcoded with energy levels and context types for each lane
**Severity**: HIGH - Complex preferences hardcoded

### 52. HARDCODED CACHE TTL FOR PREFERENCES
**File**: `IntelligentScheduler.gs` line 514
```javascript
this.crossExecutionCache.set(cacheKey, preferences, 3600);
```
**Severity**: MEDIUM - 1 hour cache TTL hardcoded

### 53. MASSIVE HARDCODED COMPATIBILITY MATRIX
**File**: `IntelligentScheduler.gs` lines 519-529
Entire lane compatibility matrix with scores hardcoded
**Severity**: HIGH - Business logic hardcoded

### 54. HARDCODED ENERGY HIERARCHY
**File**: `IntelligentScheduler.gs` line 543
```javascript
const energyHierarchy = ['wind_down', 'recovery', 'post_lunch', 'high', 'peak'];
```
**Severity**: HIGH - Energy levels ordered differently than enums

### 55. HARDCODED CONTEXT COMPATIBILITY SCORES
**File**: `IntelligentScheduler.gs` lines 571-578
Entire context compatibility matrix hardcoded
**Severity**: HIGH - Algorithm parameters hardcoded

### 56. HARDCODED URGENCY CALCULATIONS
**File**: `IntelligentScheduler.gs` lines 594-595
```javascript
const urgencyMultiplier = Math.min(1.0, 72 / hoursToDeadline);
```
**Severity**: MEDIUM - 72 hour threshold hardcoded

### 57. HARDCODED PREFERENCE SCORES
**File**: `IntelligentScheduler.gs` lines 605-607
```javascript
if (preference.energyLevels.includes(block.energy_level)) return 0.8;
if (preference.contextTypes.includes(block.context_type)) return 0.6;
return 0.5;
```
**Severity**: MEDIUM - Preference scores hardcoded

### 58. HARDCODED LEARNING THRESHOLDS
**File**: `IntelligentScheduler.gs` lines 248-254
```javascript
if (ratios.length >= 3) {  // Minimum 3 samples
  // ...
  if (confidence > 0.4 && avgRatio > 0.5 && avgRatio < 2.0) {
```
**Severity**: MEDIUM - Learning algorithm thresholds hardcoded

### 59. HARDCODED ESTIMATION BOUNDS
**File**: `IntelligentScheduler.gs` line 288
```javascript
const finalEstimate = Math.max(5, Math.min(240, adjustedEstimate));
```
**Severity**: MEDIUM - 5-240 minute bounds hardcoded

### 60. HARDCODED CACHE TTL FOR LEARNING
**File**: `IntelligentScheduler.gs` line 261
```javascript
this.crossExecutionCache.set(cacheKey, learnedFactors, 10800);
```
**Severity**: MEDIUM - 3 hour cache TTL hardcoded

### 61. HARDCODED SORTING WEIGHTS
**File**: `IntelligentScheduler.gs` line 317
```javascript
return (priorityScore * 0.6) + (urgencyScore * 0.4);
```
**Severity**: MEDIUM - Sorting weights hardcoded

## MORE FINDINGS FROM FoundationBlocksManager.gs

### 62. HARDCODED DUBAI TIMEZONE ASSUMPTION
**File**: `FoundationBlocksManager.gs` line 17
```javascript
this.timezone = this.configManager.getString('TIMEZONE', 'Asia/Dubai');
```
**Severity**: HIGH - Dubai timezone hardcoded as default

### 63. HARDCODED BUFFER CAPACITY
**File**: `FoundationBlocksManager.gs` line 150
```javascript
capacity_minutes: Math.floor(durationMinutes * 0.8), // 80% capacity for buffers
```
**Severity**: MEDIUM - 80% buffer capacity hardcoded

### 64. MASSIVE HARDCODED ENERGY WINDOWS
**File**: `FoundationBlocksManager.gs` lines 173-210
```javascript
const defaultWindows = [
  {
    level: 'HIGH',
    start: '09:00',
    end: '11:30',
    capacity_multiplier: 0.9,
    preferred_context: ['deep_work', 'creative', 'strategic'],
    min_complexity: 7,
    max_complexity: 10
  },
  // ... more hardcoded time windows
];
```
**Severity**: CRITICAL - Entire daily schedule hardcoded

### 65. HARDCODED BUFFER TIMES
**File**: `FoundationBlocksManager.gs` lines 228-247
```javascript
const defaultBuffers = [
  {
    start: '08:30',
    end: '09:00',
    context: 'morning_prep',
    allowed_tasks: ['email_check', 'planning', 'quick_admin']
  },
  {
    start: '13:00',
    end: '14:00',
    context: 'lunch_break',
    allowed_tasks: ['personal', 'rest', 'light_admin']
  },
  // ...
];
```
**Severity**: HIGH - Daily schedule hardcoded

### 66. HARDCODED CONTEXT MAP FOR ENERGY
**File**: `FoundationBlocksManager.gs` lines 261-265
```javascript
const contextMap = {
  'HIGH': 'deep_work',
  'MEDIUM': 'collaborative',
  'LOW': 'admin'
};
```
**Severity**: HIGH - Context mappings hardcoded

### 67. HARDCODED CAPACITY VALIDATION LIMITS
**File**: `FoundationBlocksManager.gs` lines 301-302
```javascript
const minExpectedCapacity = 300; // 5 hours minimum
const maxExpectedCapacity = 600; // 10 hours maximum
```
**Severity**: HIGH - Work capacity limits hardcoded

### 68. HARDCODED DUBAI WORK WEEK
**File**: `FoundationBlocksManager.gs` line 349
```javascript
const workDays = this.configManager.getArray('WORK_DAYS', [0, 1, 2, 3, 4]); // Sunday-Thursday
```
**Comment**: "In Dubai, work week is typically Sunday-Thursday"
**Severity**: HIGH - Dubai-specific work week assumption

### 69. HARDCODED CACHE TTL
**File**: `FoundationBlocksManager.gs` line 418
```javascript
this.configManager.cache.set(cacheKey, blocks, 3600); // 1 hour cache
```
**Severity**: MEDIUM - Cache duration hardcoded

### 70. HARDCODED ENERGY PRIORITY SCORES
**File**: `FoundationBlocksManager.gs` line 457
```javascript
const energyPriority = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
```
**Severity**: MEDIUM - Energy scoring hardcoded

### 71. HARDCODED COMPLEXITY RANGES
**File**: `FoundationBlocksManager.gs` lines 179-181, 189-191, 198-200, 207-209
```javascript
min_complexity: 7,
max_complexity: 10
// ... different ranges for each energy level
```
**Severity**: MEDIUM - Task complexity bounds hardcoded

### 72. HARDCODED CAPACITY MULTIPLIERS
**File**: `FoundationBlocksManager.gs` lines 178, 187, 196, 205
```javascript
capacity_multiplier: 0.9,  // HIGH
capacity_multiplier: 0.8,  // MEDIUM morning
capacity_multiplier: 0.75, // MEDIUM afternoon
capacity_multiplier: 0.6,  // LOW
```
**Severity**: HIGH - Capacity calculation factors hardcoded

### 73. HARDCODED PREFERRED CONTEXTS
**File**: `FoundationBlocksManager.gs` lines 179, 188, 197, 206
Different context arrays for each energy window hardcoded
**Severity**: HIGH - Business logic hardcoded

## CRITICAL PATTERNS IDENTIFIED

### Pattern 1: Multiple Sources of Truth
- SCAN_MODE has 3-4 different defaults across files
- TIMEZONE appears in 3+ places
- EMAIL_LABEL appears in 4+ places
- Configuration defaults in ConfigManager, SystemBootstrap, AB_Constants (all different!)

### Pattern 2: Dead Code with Hardcoded Values
- IntelligentScheduler defines `defaultWeights` but never uses them
- Instead uses different hardcoded defaults in `getScoringWeights()`

### Pattern 3: Timing-Based Race Conditions
- AA_Container uses `Utilities.sleep(10)` hoping files load in order
- No guarantee this works reliably

### Pattern 4: Google Apps Script Execution Model Issues
- Global variables don't persist between executions
- Services registered at load time are lost when UI calls functions
- No proper initialization strategy for cross-execution persistence

### Pattern 5: Inconsistent Error Handling
- Some places use LoggerFacade
- Some use Logger.log
- Some use safeLog
- Some use console (which may not exist)

### Pattern 6: Hardcoded Algorithm Parameters
- Priority scores (100, 80, 60, 40, 20, 10)
- Energy scores (100, 80, 60, 40, 20)
- Weight distributions for scheduling
- Cache TTLs scattered everywhere

### Pattern 7: Copy-Paste Errors
- SystemBootstrap has identical config rows defined twice (lines 354-451 and 405-451)
- Likely result of copy-paste without cleanup

## ROOT CAUSE ANALYSIS

1. **No Configuration Management Strategy**
   - No single source of truth for defaults
   - Configuration scattered across multiple files
   - No clear hierarchy of config sources

2. **Misunderstanding of Google Apps Script**
   - Assumption that global code executes reliably
   - Assumption that globals persist between executions
   - Race conditions with file load order

3. **No Architectural Governance**
   - Services can be added without updating dependencies
   - No validation that all required config keys exist
   - No enforcement of configuration patterns

4. **Technical Debt Accumulation**
   - Dead code not removed
   - Copy-paste programming
   - No refactoring when patterns emerge

## INVESTIGATION CONTINUING...
More files need to be examined for additional hardcoded assumptions.

## FILES TO INVESTIGATE NEXT:
- [x] Constants files - COMPLETED
- [x] Enums file - COMPLETED
- [x] WebAppManager - COMPLETED
- [x] LoggerFacade - COMPLETED
- [ ] IntelligentScheduler - IN PROGRESS
- [ ] Other service files in /src/4_services/
- [ ] All test files in /src/9_tests/
- [ ] Support files in /src/7_support/
- [ ] Global files in /src/1_globals/
- [ ] Model files in /src/2_models/
- [ ] Other web files in /src/5_web/