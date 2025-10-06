# PHASE 4: CONFIGURATION VALUES - SUBAGENT BRIEF

## OBJECTIVE
Replace all hardcoded values with configurable parameters from ConfigManager.

## TASKS

### TASK 1: Fix SystemManager Hardcoded Values
**File**: `src/4_services/SystemManager.gs`

**Fix 1 - Line ~538 (Archive Limit)**:
```javascript
// FIND:
const tasksToArchive = completedTasks.slice(0, 100);

// REPLACE WITH:
const archiveLimit = this.configManager.getNumber('ARCHIVE_BATCH_LIMIT', 100, {
  min: 10,
  max: 500
});
const tasksToArchive = completedTasks.slice(0, archiveLimit);
```

**Fix 2 - Line ~565 (Activity Log Limit)**:
```javascript
// FIND:
if (activityLogs.length > 1000) {

// REPLACE WITH:
const logRetentionLimit = this.configManager.getNumber('ACTIVITY_LOG_LIMIT', 1000, {
  min: 100,
  max: 10000
});
if (activityLogs.length > logRetentionLimit) {
```

### TASK 2: Fix EmailIngestionEngine Hardcoded Values
**File**: `src/4_services/EmailIngestionEngine.gs`

**Fix 1 - Lines ~307-312 (System Fingerprints)**:
```javascript
// FIND:
const systemFingerprints = [
  'noreply',
  'no-reply',
  'donotreply',
  'notification'
];

// REPLACE WITH:
const systemFingerprints = this.configManager.getArray('SYSTEM_EMAIL_FINGERPRINTS', [
  'noreply',
  'no-reply',
  'donotreply',
  'notification',
  'automated',
  'system',
  'bot',
  'mailer-daemon',
  'postmaster'
]);
```

**Fix 2 - Lines ~503-504 (Action Keywords)**:
```javascript
// FIND:
const actionKeywords = ['review', 'approve', 'sign', 'submit'];

// REPLACE WITH:
const actionKeywords = this.configManager.getArray('ACTION_KEYWORDS', [
  'review', 'approve', 'sign', 'submit', 'complete',
  'finish', 'check', 'verify', 'confirm', 'respond',
  'update', 'prepare', 'analyze', 'investigate'
]);
```

**Fix 3 - Lines ~663-667 (Time Estimation Rules)**:
```javascript
// FIND hardcoded time estimation rules and REPLACE WITH:
const timeEstimationRules = this.configManager.getJSON('TIME_ESTIMATION_RULES', {
  keywords: {
    'quick': 15,
    'brief': 15,
    'short': 20,
    'review': 30,
    'meeting': 60,
    'analysis': 90,
    'research': 120,
    'comprehensive': 180
  },
  defaults: {
    noEstimate: 30,
    maxEstimate: 480,
    minEstimate: 5
  }
});
```

### TASK 3: Fix IntelligentScheduler Hardcoded Values
**File**: `src/4_services/IntelligentScheduler.gs`

**Fix 1 - Lines ~31-42 (Scoring Weights)**:
```javascript
// FIND the SCORING_WEIGHTS constant and REPLACE WITH a method:

getScoringWeights() {
  return {
    priority: this.configManager.getNumber('WEIGHT_PRIORITY', 0.3),
    deadline: this.configManager.getNumber('WEIGHT_DEADLINE', 0.25),
    rollover: this.configManager.getNumber('WEIGHT_ROLLOVER', 0.15),
    duration: this.configManager.getNumber('WEIGHT_DURATION', 0.1),
    dependencies: this.configManager.getNumber('WEIGHT_DEPENDENCIES', 0.1),
    energy: this.configManager.getNumber('WEIGHT_ENERGY', 0.05),
    context: this.configManager.getNumber('WEIGHT_CONTEXT', 0.05)
  };
}

// Then UPDATE all references from SCORING_WEIGHTS to this.getScoringWeights()
```

**Fix 2 - Lines ~334-347 (Lane-Energy Mapping)**:
```javascript
// FIND hardcoded lane energy mapping and REPLACE WITH:

getLaneEnergyMapping() {
  return this.configManager.getJSON('LANE_ENERGY_MAP', {
    [LANE.FIRE]: { min: 0.7, max: 1.0, optimal: 0.85 },
    [LANE.DEEP_FOCUS]: { min: 0.5, max: 0.9, optimal: 0.7 },
    [LANE.CRUISING]: { min: 0.3, max: 0.7, optimal: 0.5 },
    [LANE.FLOATING]: { min: 0.1, max: 0.5, optimal: 0.3 }
  });
}
```

**Fix 3 - Lines ~412-424 (Compatibility Matrix)**:
```javascript
// FIND hardcoded compatibility matrix and REPLACE WITH:

getCompatibilityMatrix() {
  return this.configManager.getJSON('LANE_COMPATIBILITY', {
    [LANE.FIRE]: {
      [LANE.FIRE]: 1.0,
      [LANE.DEEP_FOCUS]: 0.3,
      [LANE.CRUISING]: 0.1,
      [LANE.FLOATING]: 0.0
    },
    [LANE.DEEP_FOCUS]: {
      [LANE.FIRE]: 0.3,
      [LANE.DEEP_FOCUS]: 1.0,
      [LANE.CRUISING]: 0.5,
      [LANE.FLOATING]: 0.2
    },
    [LANE.CRUISING]: {
      [LANE.FIRE]: 0.1,
      [LANE.DEEP_FOCUS]: 0.5,
      [LANE.CRUISING]: 1.0,
      [LANE.FLOATING]: 0.7
    },
    [LANE.FLOATING]: {
      [LANE.FIRE]: 0.0,
      [LANE.DEEP_FOCUS]: 0.2,
      [LANE.CRUISING]: 0.7,
      [LANE.FLOATING]: 1.0
    }
  });
}
```

### TASK 4: Add Default Configuration Values
**File**: `src/8_setup/SystemBootstrap.gs`
**Location**: In the `seedInitialData()` function
**Required Actions**:
Add these configuration rows to the config seeding:

```javascript
// ADD these rows to the configRows array:
['cfg_archive_batch_limit', 'SYSTEM', 'PERFORMANCE', 'Archive Batch Limit', 'ARCHIVE_BATCH_LIMIT', '100', 'Max tasks to archive per batch'],
['cfg_activity_log_limit', 'SYSTEM', 'MAINTENANCE', 'Activity Log Limit', 'ACTIVITY_LOG_LIMIT', '1000', 'Max activity log entries to retain'],

// Email configuration
['cfg_system_fingerprints', 'EMAIL', 'FILTERING', 'System Email Fingerprints', 'SYSTEM_EMAIL_FINGERPRINTS', '["noreply","no-reply","donotreply","notification","automated","system","bot"]', 'Patterns identifying system emails'],
['cfg_action_keywords', 'EMAIL', 'PARSING', 'Action Keywords', 'ACTION_KEYWORDS', '["review","approve","sign","submit","complete","finish","check","verify","confirm","respond"]', 'Keywords indicating required actions'],

// Time estimation
['cfg_time_rules', 'SCHEDULING', 'ESTIMATION', 'Time Estimation Rules', 'TIME_ESTIMATION_RULES', '{"keywords":{"quick":15,"brief":15,"review":30,"meeting":60},"defaults":{"noEstimate":30}}', 'Rules for estimating task duration'],

// Scheduling weights
['cfg_weight_priority', 'SCHEDULING', 'SCORING', 'Priority Weight', 'WEIGHT_PRIORITY', '0.3', 'Weight for priority in scoring'],
['cfg_weight_deadline', 'SCHEDULING', 'SCORING', 'Deadline Weight', 'WEIGHT_DEADLINE', '0.25', 'Weight for deadline urgency'],
['cfg_weight_rollover', 'SCHEDULING', 'SCORING', 'Rollover Weight', 'WEIGHT_ROLLOVER', '0.15', 'Weight for rollover count'],
['cfg_weight_duration', 'SCHEDULING', 'SCORING', 'Duration Weight', 'WEIGHT_DURATION', '0.1', 'Weight for task duration'],
['cfg_weight_dependencies', 'SCHEDULING', 'SCORING', 'Dependencies Weight', 'WEIGHT_DEPENDENCIES', '0.1', 'Weight for task dependencies'],
['cfg_weight_energy', 'SCHEDULING', 'SCORING', 'Energy Weight', 'WEIGHT_ENERGY', '0.05', 'Weight for energy matching'],
['cfg_weight_context', 'SCHEDULING', 'SCORING', 'Context Weight', 'WEIGHT_CONTEXT', '0.05', 'Weight for context switching'],

// Lane configuration
['cfg_lane_energy_map', 'SCHEDULING', 'LANES', 'Lane Energy Mapping', 'LANE_ENERGY_MAP', '{"FIRE":{"min":0.7,"max":1.0},"DEEP_FOCUS":{"min":0.5,"max":0.9}}', 'Energy requirements per lane'],
['cfg_lane_compatibility', 'SCHEDULING', 'LANES', 'Lane Compatibility Matrix', 'LANE_COMPATIBILITY', '{"FIRE":{"FIRE":1.0,"DEEP_FOCUS":0.3}}', 'Compatibility scores between lanes']
```

## VALIDATION CRITERIA
1. No hardcoded numeric limits remain in SystemManager
2. Email fingerprints and keywords are configurable
3. All scheduling weights come from ConfigManager
4. Lane mappings are externalized
5. Default values are seeded in APPsheet.CONFIG

## EXPECTED OUTCOME
System behavior can be modified through configuration without code changes.