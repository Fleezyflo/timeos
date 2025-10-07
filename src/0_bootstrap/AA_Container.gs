/**
 * MOH TIME OS v2.0 - CORE BOOTSTRAP & DEPENDENCY CONTAINER
 *
 * This file consolidates all critical global definitions, the DependencyContainer,
 * and core utility classes to ensure proper loading order and availability.
 * It is designed to be loaded first alphabetically within the 0_bootstrap directory.
 */

// Global recursion guard for SmartLogger (must be defined before SmartLogger class)
let _loggingRecursionGuard = false;

// --- GLOBAL CONSTANTS (from AB_Constants.js) ---
/**
 * MOH TIME OS v2.0 - GLOBAL CONSTANTS
 *
 * Core system constants organized by access frequency for optimal performance.
 * These values are used throughout the system and are frozen for immutability.
 */

// Core system constants (most frequently accessed)
const CONSTANTS = Object.freeze({
  // System identification
  VERSION: 'MOH_TIME_OS_v2.0',
  NAMESPACE: 'MTO',
  SCHEMA_VERSION: '2.0',

  // Timezone and locale
  TIMEZONE: 'Asia/Dubai',
  LOCALE: 'en-US',

  // Cache configuration (hot path)
  CACHE_DURATION: 300000,        // 5 minutes default
  HOT_CACHE_SIZE: 100,           // In-memory cache items
  PERSISTENT_CACHE_TTL: 3600000, // 1 hour
  CACHE_COMPRESSION_THRESHOLD: 1024, // 1KB

  // Performance and retry settings
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY: 1000,        // 1 second
  MAX_RETRY_DELAY: 10000,        // 10 seconds
  DEFAULT_TIMEOUT: 30000,        // 30 seconds

  // Circuit breaker configuration
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_TIMEOUT_MS: 300000, // 5 minutes
  CIRCUIT_BREAKER_HALF_OPEN_LIMIT: 3,

  // Batch operations
  DEFAULT_BATCH_SIZE: 50,
  MAX_BATCH_SIZE: 500,
  MIN_BATCH_SIZE: 1,

  // Scoring and scheduling
  SCORE_THRESHOLD: 0.5,
  MAX_SCORE: 200,
  MIN_SCORE: 0,
  DEFAULT_ESTIMATED_MINUTES: 30,
  MAX_ESTIMATED_MINUTES: 480,    // 8 hours

  // System limits
  MAX_ERROR_HISTORY: 100,
  MAX_LOG_BUFFER_SIZE: 10,
  LOG_FLUSH_INTERVAL: 5000,      // 5 seconds
  AUTO_SAVE_INTERVAL: 30000,     // 30 seconds

  // Date and time
  MILLISECONDS_PER_MINUTE: 60000,
  MILLISECONDS_PER_HOUR: 3600000,
  MILLISECONDS_PER_DAY: 86400000,

  // Archive settings
  DEFAULT_ARCHIVE_DAYS: 90,
  MAX_ARCHIVE_DAYS: 365,
  MIN_ARCHIVE_DAYS: 30,

  // Email processing
  EMAIL_BATCH_SIZE: 20,
  MAX_EMAIL_CONTENT_LENGTH: 5000,
  EMAIL_CONFIDENCE_THRESHOLD: 0.7,

  // Human state
  HUMAN_STATE_TTL: 3600000,      // 1 hour
  ENERGY_ADJUSTMENT_FACTOR: 0.2,
  FOCUS_ADJUSTMENT_FACTOR: 0.3,

  // API rate limits
  SHEETS_API_CALLS_PER_MINUTE: 300,
  GMAIL_API_CALLS_PER_MINUTE: 250,
  CALENDAR_API_CALLS_PER_MINUTE: 200,

  // NLP stop words for email keyword extraction
  STOP_WORDS: ['from', 'with', 'that', 'this', 'there', 'which', 'would',
               'should', 'could', 'about', 'your', 'subject', 'please',
               'thank', 'regards'],

  // Backfill flags
  BACKFILL_DEPENDENCIES_GUARD: 'backfill_dependencies_guard'
});

// Sheet names (validated on access)
const SHEET_NAMES = Object.freeze({
  // Primary operational sheets
  ACTIONS: 'ACTIONS',
  PROPOSED_TASKS: 'PROPOSED_TASKS',
  CALENDAR_PROJECTION: 'CALENDAR_PROJECTION',

  // Configuration and settings
  FOUNDATION_BLOCKS: 'FOUNDATION_BLOCKS',
  APPSHEET_CONFIG: 'APPSHEET_CONFIG',
  HUMAN_STATE: 'HUMAN_STATE',

  // Logging and monitoring
  ACTIVITY: 'ACTIVITY',
  STATUS: 'STATUS',

  // Archive sheets (auto-created)
  ACTIONS_ARCHIVE: 'ACTIONS_ARCHIVE',
  PROPOSED_ARCHIVE: 'PROPOSED_ARCHIVE',
  ACTIVITY_ARCHIVE: 'ACTIVITY_ARCHIVE',

  // Dependencies and relationships
  DEPENDENCIES: 'Dependencies',

  // Temporary sheets (for atomic operations)
  ACTIONS_TEMP: 'ACTIONS_TEMP',
  PROPOSED_TEMP: 'PROPOSED_TEMP',
  CALENDAR_TEMP: 'CALENDAR_TEMP',

  // Additional operational sheets
  TIME_BLOCKS: 'TIME_BLOCKS',
  LANES: 'LANES',
  SENDER_REPUTATION: 'SENDER_REPUTATION',
  CHAT_QUEUE: 'CHAT_QUEUE'
});

// Service identifiers for type safety and circuit breakers
const SERVICES = Object.freeze({
  // Core infrastructure
  PersistentStore: 'PersistentStore',
  CrossExecutionCache: 'CrossExecutionCache',
  ErrorHandler: 'ErrorHandler',
  SmartLogger: 'SmartLogger',
  ConfigManager: 'ConfigManager',
  BatchOperations: 'BatchOperations',
  DistributedLockManager: 'DistributedLockManager',

  // Application services
  IntelligentScheduler: 'IntelligentScheduler',
  EmailIngestionEngine: 'EmailIngestionEngine',
  ChatEngine: 'ChatEngine',
  CalendarSyncManager: 'CalendarSyncManager',
  FoundationBlocksManager: 'FoundationBlocksManager',
  HumanStateManager: 'HumanStateManager',
  SenderReputationManager: 'SenderReputationManager',
  ArchiveManager: 'ArchiveManager',
  DynamicLaneManager: 'DynamicLaneManager',
  SystemManager: 'SystemManager',

  // Web and external interfaces
  WebAppManager: 'WebAppManager',
  AppSheetBridge: 'AppSheetBridge',
  TriggerOrchestrator: 'TriggerOrchestrator',
  SecureWebAppAuth: 'SecureWebAppAuth',
  ZeroTrustTriageEngine: 'ZeroTrustTriageEngine',

  // Business Logic Services
  BusinessLogicValidation: 'BusinessLogicValidation',
  AuditProtocol: 'AuditProtocol',

  // Testing and development services
  MockService: 'MockService',
  TestSeeder: 'TestSeeder',
  MockBatchOperations: 'MockBatchOperations',

  // External services (for circuit breakers)
  EXTERNAL_CALENDAR: 'calendar',
  EXTERNAL_GMAIL: 'gmail',
  EXTERNAL_SHEETS: 'sheets',
  EXTERNAL_DRIVE: 'drive'
});

/**
 * Service dependency map for incremental registration
 * Maps each service to its DIRECT dependencies (transitive dependencies auto-resolved by container)
 * 
 * CRITICAL: This map must be kept in sync with service constructors in ServiceRegistration.gs
 * When adding/removing services or changing constructors, update this map immediately
 * 
 * Format: [SERVICES.ServiceName]: [array of SERVICES.* that this service depends on]
 */
const SERVICE_DEPENDENCIES = Object.freeze({
  // Layer 1: No dependencies (foundation services)
  [SERVICES.PersistentStore]: [],

  // Layer 2: Single dependency on Layer 1
  [SERVICES.CrossExecutionCache]: [SERVICES.PersistentStore],
  [SERVICES.SmartLogger]: [SERVICES.CrossExecutionCache],
  [SERVICES.ErrorHandler]: [SERVICES.SmartLogger],

  // Layer 3: Multiple dependencies on Layers 1-2
  [SERVICES.BatchOperations]: [
    SERVICES.CrossExecutionCache,
    SERVICES.SmartLogger
  ],
  [SERVICES.DistributedLockManager]: [
    SERVICES.PersistentStore,
    SERVICES.SmartLogger
  ],
  [SERVICES.ConfigManager]: [
    SERVICES.CrossExecutionCache,
    SERVICES.PersistentStore,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger
  ],

  // Layer 4: Application-specific managers
  [SERVICES.FoundationBlocksManager]: [
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.SmartLogger
  ],
  [SERVICES.DynamicLaneManager]: [
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.BatchOperations,
    SERVICES.FoundationBlocksManager,
    SERVICES.SmartLogger,
    SERVICES.CrossExecutionCache
  ],

  // Layer 5: Human state and calendar services
  [SERVICES.HumanStateManager]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager
  ],
  [SERVICES.CalendarSyncManager]: [
    SERVICES.BatchOperations,
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.SmartLogger
  ],

  // Layer 6: Scheduler (depends on many foundation services)
  [SERVICES.IntelligentScheduler]: [
    SERVICES.FoundationBlocksManager,
    SERVICES.CalendarSyncManager,
    SERVICES.ErrorHandler,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.HumanStateManager,
    SERVICES.BatchOperations,
    SERVICES.CrossExecutionCache,
    SERVICES.DynamicLaneManager
  ],

  // Layer 6A: Email processing (CIRCULAR DEPENDENCY - resolved with lazy getters)
  // Note: EmailIngestionEngine ↔ ZeroTrustTriageEngine circular dependency
  // Both services use lazy getters to reference each other after instantiation
  [SERVICES.SenderReputationManager]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.CrossExecutionCache
  ],
  [SERVICES.EmailIngestionEngine]: [
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.PersistentStore
    // ZeroTrustTriageEngine NOT listed (circular - resolved via lazy getter)
  ],
  [SERVICES.ZeroTrustTriageEngine]: [
    SERVICES.SenderReputationManager,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler
    // EmailIngestionEngine NOT listed (circular - resolved via lazy getter)
  ],
  [SERVICES.ChatEngine]: [
    SERVICES.ConfigManager,
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.CrossExecutionCache,
    SERVICES.ErrorHandler,
    SERVICES.ArchiveManager
  ],

  // Layer 7: Archive and system management
  [SERVICES.ArchiveManager]: [
    SERVICES.ConfigManager,
    SERVICES.SmartLogger,
    SERVICES.BatchOperations
  ],
  [SERVICES.SystemManager]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ConfigManager,
    SERVICES.ErrorHandler,
    SERVICES.ArchiveManager
  ],

  // Layer 8: Web services
  [SERVICES.SecureWebAppAuth]: [
    SERVICES.SmartLogger
  ],
  [SERVICES.WebAppManager]: [
    SERVICES.AppSheetBridge,
    SERVICES.ChatEngine,
    SERVICES.SystemManager,
    SERVICES.SecureWebAppAuth,
    SERVICES.SmartLogger
  ],
  [SERVICES.AppSheetBridge]: [
    SERVICES.ConfigManager,
    SERVICES.SystemManager
  ],

  // Layer 9: Orchestration (depends on most services)
  [SERVICES.TriggerOrchestrator]: [
    SERVICES.EmailIngestionEngine,
    SERVICES.IntelligentScheduler,
    SERVICES.ArchiveManager,
    SERVICES.FoundationBlocksManager,
    SERVICES.HumanStateManager,
    SERVICES.CalendarSyncManager,
    SERVICES.SystemManager,
    SERVICES.SenderReputationManager,
    SERVICES.SmartLogger,
    SERVICES.DistributedLockManager
  ],

  // Layer 10: Business logic services
  [SERVICES.BusinessLogicValidation]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.ErrorHandler
  ],
  [SERVICES.AuditProtocol]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger,
    SERVICES.PersistentStore
  ],

  // Testing services
  [SERVICES.MockService]: [],
  [SERVICES.TestSeeder]: [
    SERVICES.BatchOperations,
    SERVICES.SmartLogger
  ],
  [SERVICES.MockBatchOperations]: [
    SERVICES.CrossExecutionCache
  ]

  // External services (EXTERNAL_*) not included - these are aliases to GAS APIs
});


/**
 * Service interface definitions for validation
 * Maps service names to required public methods
 * Used by container._validateIncrementalServices() to ensure services have expected interface
 * 
 * OPTIONAL: Only services listed here will have interface validation
 * Add entries as needed for critical services
 */
const SERVICE_INTERFACES = Object.freeze({
  [SERVICES.SmartLogger]: ['info', 'error', 'warn', 'debug'],
  [SERVICES.BatchOperations]: [
    'getHeaders',          // 40 uses - critical for schema discovery
    'getRowsByFilter',     // 24 uses - core query method
    'appendRows',          // 13 uses - primary write method
    'batchUpdate',         // 11 uses - bulk update operations
    'getRowsWithPosition', // 7 uses - position-aware queries
    'getAllSheetData'      // 3 uses - full sheet reads
  ],
  [SERVICES.ConfigManager]: [
    'getNumber',   // 50 uses - most critical config method
    'getString',   // 9 uses - string config values
    'getJSON',     // 7 uses - complex config objects
    'get',         // 3 uses - generic config getter
    'getArray',    // 3 uses - array config values
    'getBoolean'   // 1 use - boolean config values
  ],
  [SERVICES.SystemManager]: ['runHealthCheck', 'getSystemStatus'],
  [SERVICES.IntelligentScheduler]: ['runSchedulingCycle'],
  [SERVICES.EmailIngestionEngine]: [
    'processUnreadEmails',       // Primary email processing entry point
    'runProposalLearningCycle'   // Learning cycle for adaptive triage
  ],
  [SERVICES.TriggerOrchestrator]: [
    'runEmailProcessing',
    'runSchedulingCycle',
    'runCalendarSync',
    'runFoundationBlocks',
    'runHealthCheck',
    'runDataArchiving',
    'runScheduleReconciliation',
    'runProposalLearningCycle'
  ]
});

// HTTP status codes for web app responses
const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
});

// Error types for structured error handling
const ERROR_TYPES = Object.freeze({
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  API: 'API',
  CONFIGURATION: 'CONFIGURATION',
  AUTHENTICATION: 'AUTHENTICATION',
  NETWORK: 'NETWORK',
  QUOTA: 'QUOTA',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
});

// Logging levels
const LOG_LEVELS = Object.freeze({
  ERROR: 3,
  INFO: 2,
  DEBUG: 1
});

// Circuit breaker states
const CIRCUIT_STATES = Object.freeze({
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
});

// Configuration categories for organized settings
const CONFIG_CATEGORIES = Object.freeze({
  SYSTEM: 'SYSTEM',
  SCHEDULING: 'SCHEDULING',
  EMAIL: 'EMAIL',
  CALENDAR: 'CALENDAR',
  PERFORMANCE: 'PERFORMANCE',
  MONITORING: 'MONITORING',
  HUMAN_FACTORS: 'HUMAN_FACTORS'
});

// Default configuration values (hardcoded fallbacks)
const DEFAULT_CONFIG = Object.freeze({
  'SCHEDULING_ENABLED': 'true',
  'EMAIL_PROCESSING_ENABLED': 'true',
  'CALENDAR_SYNC_ENABLED': 'true',
  'HUMAN_STATE_TRACKING_ENABLED': 'true',
  'ARCHIVE_ENABLED': 'true',

  'SCHEDULER_INTERVAL_MINUTES': '15',
  'EMAIL_CHECK_INTERVAL_MINUTES': '30',
  'CALENDAR_SYNC_INTERVAL_MINUTES': '60',
  'HEALTH_CHECK_INTERVAL_MINUTES': '120',

  'SCORE_WEIGHTS': JSON.stringify({
    priority: 0.3,
    urgency: 0.25,
    context_match: 0.2,
    energy_match: 0.15,
    rollover_penalty: 0.1
  }),

  'AGING_CURVE_TYPE': 'LINEAR',
  'AGING_BASE_RATE': '0.2',
  'AGING_MAX_MULTIPLIER': '3.0',

  'PRIORITY_DECAY_TYPE': 'EXPONENTIAL',
  'PRIORITY_DECAY_RATE': '0.02',
  'PRIORITY_DECAY_MIN': '0.1',

  'URGENCY_ALGORITHM': 'EXPONENTIAL',
  'URGENCY_EXP_STEEPNESS': '2.0',

  'LEARNING_ARCHIVE_DEPTH_DAYS': '730',
  'LEARNING_MIN_SAMPLES': '10',
  'LEARNING_CONFIDENCE_THRESHOLD': '0.7',

  'EMAIL_INGESTION_BATCH_SIZE': '20',
  'EMAIL_CONFIDENCE_THRESHOLD': '0.7',
  'EMAIL_MAX_CONTENT_LENGTH': '5000',

  'HUMAN_STATE_ENERGY_WEIGHT': '0.3',
  'HUMAN_STATE_FOCUS_WEIGHT': '0.4',
  'HUMAN_STATE_MOOD_WEIGHT': '0.2',
  'HUMAN_STATE_STRESS_WEIGHT': '0.1'
});

// Regular expressions for validation
const REGEX_PATTERNS = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ACTION_ID: /^[a-zA-Z0-9_-]+$/,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)$/,
  SHEET_NAME: /^[a-zA-Z0-9_. -]+$/,
  TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  POSITIVE_INTEGER: /^\d+$/,
  DECIMAL: /^\d+(\.\d+)?$/
});

// Performance thresholds for monitoring
const PERFORMANCE_THRESHOLDS = Object.freeze({
  COLD_START_MS: 1500,
  WARM_START_MS: 500,
  API_CALL_MS: 2000,
  CACHE_HIT_RATE: 0.8,
  ERROR_RATE: 0.1,
  MEMORY_LIMIT_MB: 30,
  EXECUTION_TIME_MS: 25000  // Leave 5s buffer before 30s limit
});

// Standardized error message templates for consistent error reporting
const ERROR_MSG_TEMPLATES = Object.freeze({
  // Service errors
  SERVICE_NOT_FOUND: (name) => `Service not registered: ${name}`,
  SERVICE_INIT_FAILED: (name, reason) => `Service initialization failed: ${name} - ${reason}`,
  SERVICE_CIRCULAR_DEP: (chain) => `Circular dependency detected: ${chain}`,

  // Database/Sheet errors
  SHEET_NOT_FOUND: (name) => `Sheet not found: ${name}`,
  SHEET_READ_FAILED: (name, reason) => `Failed to read sheet ${name}: ${reason}`,
  SHEET_WRITE_FAILED: (name, reason) => `Failed to write to sheet ${name}: ${reason}`,
  COLUMN_NOT_FOUND: (column, sheet) => `Column '${column}' not found in sheet ${sheet}`,
  INVALID_ROW_DATA: (sheet, row) => `Invalid row data in ${sheet} at row ${row}`,

  // Validation errors
  INVALID_PARAM: (param, method) => `Invalid parameter '${param}' in ${method}()`,
  MISSING_REQUIRED: (field, context) => `Required field '${field}' missing in ${context}`,
  INVALID_ENUM_VALUE: (value, enumName) => `Invalid ${enumName} value: ${value}`,
  VALIDATION_FAILED: (field, constraint) => `Validation failed for '${field}': ${constraint}`,

  // API/External errors
  API_CALL_FAILED: (api, operation) => `${api} API call failed: ${operation}`,
  QUOTA_EXCEEDED: (service) => `Quota exceeded for ${service}`,
  TIMEOUT_ERROR: (operation, duration) => `Operation '${operation}' timed out after ${duration}ms`,

  // Circuit breaker errors
  CIRCUIT_OPEN: (service) => `Circuit breaker is OPEN for service: ${service}`,
  CIRCUIT_HALF_OPEN_LIMIT: (service) => `Circuit breaker HALF_OPEN call limit exceeded for: ${service}`,

  // Configuration errors
  CONFIG_NOT_FOUND: (key) => `Configuration key not found: ${key}`,
  CONFIG_INVALID_TYPE: (key, expected, actual) => `Config '${key}' expected ${expected}, got ${actual}`,

  // Generic errors
  OPERATION_FAILED: (operation, reason) => `Operation failed: ${operation} - ${reason}`,
  UNEXPECTED_ERROR: (context) => `Unexpected error in ${context}`
});


/**
 * Validate string against regex pattern
 */
function validatePattern(value, patternKey) {
  if (!REGEX_PATTERNS.hasOwnProperty(patternKey)) {
    throw new Error(`Regex pattern ${patternKey} not found`);
  }

  return REGEX_PATTERNS[patternKey].test(value);
}

/**
 * Get all constants for debugging
 */
function getAllConstants() {
  return {
    CONSTANTS,
    SHEET_NAMES,
    SERVICES,
    HTTP_STATUS,
    ERROR_TYPES,
    LOG_LEVELS,
    CIRCUIT_STATES,
    CONFIG_CATEGORIES,
    DEFAULT_CONFIG,
    REGEX_PATTERNS,
    PERFORMANCE_THRESHOLDS,
    ERROR_MSG_TEMPLATES
  };
}

// --- GLOBAL ENUMS (from AC_Enums.js) ---
/**
 * MOH TIME OS v2.0 - GLOBAL ENUMS
 *
 * All enumerated values used throughout the system.
 * These are frozen objects to prevent modification and ensure data integrity.
 */

// Task status enumeration with complete lifecycle
const STATUS = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
  SCHEDULED: 'SCHEDULED',
  PENDING: 'PENDING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  BLOCKED: 'BLOCKED',
  DEFERRED: 'DEFERRED',
  ARCHIVED: 'ARCHIVED'        // Task has been archived
});

// Priority levels with clear hierarchy
const PRIORITY = Object.freeze({
  CRITICAL: 'CRITICAL',    // Urgent + Important, blocking others
  URGENT: 'URGENT',        // Time-sensitive
  HIGH: 'HIGH',            // Important but not urgent
  MEDIUM: 'MEDIUM',        // Standard priority
  LOW: 'LOW',              // Nice to have
  MINIMAL: 'MINIMAL'       // Background tasks
});

// Context lanes for task categorization and energy matching
const LANE = Object.freeze({
  // Core business lanes
  OPERATIONAL: 'ops',           // Day-to-day operations
  ADMIN: 'admin',               // Administrative tasks
  CREATIVE: 'creative',         // Creative work requiring inspiration
  CLIENT: 'client',             // Client-facing activities
  GROWTH: 'growth',             // Business development

  // Specialized work modes
  DEEP_FOCUS: 'deep_focus',     // Uninterrupted concentration work
  BATCH: 'batch',               // Repetitive tasks done in batches
  COMMUNICATION: 'communication', // Email, calls, meetings
  LEARNING: 'learning',         // Training, research, education
  MAINTENANCE: 'maintenance',   // System/process maintenance

  // Energy-based lanes
  HIGH_ENERGY: 'high_energy',   // Demanding physical/mental tasks
  LOW_ENERGY: 'low_energy',     // Tasks for tired periods
  SOCIAL: 'social',             // People-facing activities
  SOLO: 'solo'                  // Individual work
});

// Energy levels for tasks and time blocks
const ENERGY_LEVEL = Object.freeze({
  CRITICAL: 'CRITICAL',    // Maximum energy required
  HIGH: 'HIGH',            // High energy/focus needed
  MEDIUM: 'MEDIUM',        // Moderate energy
  LOW: 'LOW',              // Minimal energy required
  RECOVERY: 'RECOVERY'     // Restorative activities
});

// Focus requirements for task-time matching
const FOCUS_LEVEL = Object.freeze({
  INTENSE: 'INTENSE',      // Deep, uninterrupted focus
  HIGH: 'HIGH',            // Concentrated attention
  MEDIUM: 'MEDIUM',        // Standard focus
  LOW: 'LOW',              // Light attention
  BACKGROUND: 'BACKGROUND' // Can be done while distracted
});

// Human emotional and cognitive states
const MOOD = Object.freeze({
  ENERGETIC: 'ENERGETIC',
  MOTIVATED: 'MOTIVATED',
  FOCUSED: 'FOCUSED',
  CALM: 'CALM',
  NEUTRAL: 'NEUTRAL',
  TIRED: 'TIRED',
  STRESSED: 'STRESSED',
  DISTRACTED: 'DISTRACTED',
  OVERWHELMED: 'OVERWHELMED',
  FRUSTRATED: 'FRUSTRATED'
});

// Stress levels for adaptive scheduling
const STRESS_LEVEL = Object.freeze({
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  VERY_HIGH: 'VERY_HIGH',
  CRITICAL: 'CRITICAL'
});

// Work contexts for environment matching
const CONTEXT = Object.freeze({
  // Physical contexts
  OFFICE: 'OFFICE',
  HOME: 'HOME',
  MOBILE: 'MOBILE',
  COFFEE_SHOP: 'COFFEE_SHOP',
  LIBRARY: 'LIBRARY',
  OUTDOORS: 'OUTDOORS',
  COMMUTING: 'COMMUTING',
  MEETING_ROOM: 'MEETING_ROOM',
  PRIVATE_SPACE: 'PRIVATE_SPACE',
  COLLABORATIVE_SPACE: 'COLLABORATIVE_SPACE',

  // Work type contexts (for task-energy matching)
  DEEP_WORK: 'deep_focus',
  CREATIVE: 'creative',
  COMMUNICATION: 'communication',
  LEARNING: 'analysis',
  ADMIN: 'administrative',
  BUFFER: 'buffer'
});

// Time block types for foundation scheduling
const BLOCK_TYPE = Object.freeze({
  WORK: 'WORK',
  FOCUS: 'FOCUS',
  ADMIN: 'ADMIN',
  CREATIVE: 'CREATIVE',
  MEETING: 'MEETING',
  BREAK: 'BREAK',
  LUNCH: 'LUNCH',
  EXERCISE: 'EXERCISE',
  COMMUTE: 'COMMUTE',
  PERSONAL: 'PERSONAL',
  BUFFER: 'BUFFER',
  PLANNING: 'PLANNING'
});

// Task sources for provenance tracking
const SOURCE = Object.freeze({
  MANUAL: 'manual',
  EMAIL: 'email',
  CALENDAR: 'calendar',
  CHAT: 'chat',
  APPSHEET: 'appsheet',
  API: 'api',
  IMPORT: 'import',
  TEMPLATE: 'template',
  RECURRING: 'recurring',
  AUTOMATION: 'automation'
});

// Email processing confidence levels
const CONFIDENCE = Object.freeze({
  VERY_HIGH: 'VERY_HIGH',   // >90% confidence
  HIGH: 'HIGH',             // 70-90% confidence
  MEDIUM: 'MEDIUM',         // 50-70% confidence
  LOW: 'LOW',               // 30-50% confidence
  VERY_LOW: 'VERY_LOW',     // <30% confidence
  UNKNOWN: 'UNKNOWN'
});

// Proposal statuses for email ingestion
const PROPOSAL_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  DUPLICATE: 'DUPLICATE',
  INVALID: 'INVALID',
  EXPIRED: 'EXPIRED'
});

// Calendar event types for sync management
const CALENDAR_EVENT_TYPE = Object.freeze({
  TASK: 'TASK',
  MEETING: 'MEETING',
  APPOINTMENT: 'APPOINTMENT',
  REMINDER: 'REMINDER',
  BLOCK: 'BLOCK',
  BREAK: 'BREAK',
  TRAVEL: 'TRAVEL',
  PERSONAL: 'PERSONAL',
  HOLIDAY: 'HOLIDAY',
  UNAVAILABLE: 'UNAVAILABLE'
});

// System health statuses
const HEALTH_STATUS = Object.freeze({
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN',
  MAINTENANCE: 'MAINTENANCE'
});

// Trigger types for orchestration
const TRIGGER_TYPE = Object.freeze({
  TIME_DRIVEN: 'TIME_DRIVEN',
  EMAIL_RECEIVED: 'EMAIL_RECEIVED',
  SPREADSHEET_EDIT: 'SPREADSHEET_EDIT',
  FORM_SUBMIT: 'FORM_SUBMIT',
  CALENDAR_UPDATE: 'CALENDAR_UPDATE',
  MANUAL: 'MANUAL',
  API_WEBHOOK: 'API_WEBHOOK'
});

// Aging curve types for configurable scoring
const AGING_CURVE = Object.freeze({
  LINEAR: 'LINEAR',
  EXPONENTIAL: 'EXPONENTIAL',
  LOGARITHMIC: 'LOGARITHMIC',
  QUADRATIC: 'QUADRATIC',
  SIGMOID: 'SIGMOID'
});

// Priority decay algorithms
const DECAY_ALGORITHM = Object.freeze({
  LINEAR: 'LINEAR',
  EXPONENTIAL: 'EXPONENTIAL',
  LOGARITHMIC: 'LOGARITHMIC',
  STEP: 'STEP',
  NONE: 'NONE'
});

// Urgency calculation methods
const URGENCY_ALGORITHM = Object.freeze({
  LINEAR: 'LINEAR',
  EXPONENTIAL: 'EXPONENTIAL',
  LOGARITHMIC: 'LOGARITHMIC',
  SIGMOID: 'SIGMOID'
});

// Gmail label names for system operations
const GMAIL_LABELS = Object.freeze({
  // Zero-Trust Triage labels
  TRIAGE_APPROVED: 'TimeOS/Triage-Approved',
  TRIAGE_IGNORED: 'TimeOS/Triage-Ignored',
  TRIAGE_PROCESSING: 'TimeOS/Triage-Processing',

  // Processing labels
  PROCESSED: 'TimeOS/Processed',
  ACTION_BLOCK: 'TimeOS/ActionBlock',
  QUARANTINED: 'MOH-Quarantined',

  // Legacy email processing label
  EMAIL_PROCESSING: 'MOH-Time-OS'
});

/**
 * Validation functions for enums
 */

/**
 * Check if value is valid for given enum
 */
function isValidEnumValue(enumObject, value) {
  return Object.values(enumObject).includes(value);
}

/**
 * Get default value for enum if current value is invalid
 */
function getValidEnumValue(enumObject, value, defaultValue) {
  if (isValidEnumValue(enumObject, value)) {
    return value;
  }

  if (defaultValue && isValidEnumValue(enumObject, defaultValue)) {
    return defaultValue;
  }

  // Return first value as ultimate fallback
  return Object.values(enumObject)[0];
}

/**
 * Validate and normalize status
 */
function normalizeStatus(status) {
  return getValidEnumValue(STATUS, status, STATUS.NOT_STARTED);
}

/**
 * Validate and normalize priority
 */
function normalizePriority(priority) {
  return getValidEnumValue(PRIORITY, priority, PRIORITY.MEDIUM);
}

/**
 * Validate and normalize lane
 */
function normalizeLane(lane) {
  return getValidEnumValue(LANE, lane, LANE.OPERATIONAL);
}

/**
 * Validate and normalize energy level
 */
function normalizeEnergyLevel(energyLevel) {
  return getValidEnumValue(ENERGY_LEVEL, energyLevel, ENERGY_LEVEL.MEDIUM);
}

/**
 * Check if status allows transition to new status
 */
function canTransitionStatus(currentStatus, newStatus) {
  const validTransitions = {
    [STATUS.NOT_STARTED]: [
      STATUS.IN_PROGRESS, STATUS.SCHEDULED, STATUS.CANCELED,
      STATUS.BLOCKED, STATUS.DEFERRED
    ],
    [STATUS.SCHEDULED]: [
      STATUS.IN_PROGRESS, STATUS.NOT_STARTED, STATUS.CANCELED,
      STATUS.BLOCKED, STATUS.DEFERRED
    ],
    [STATUS.IN_PROGRESS]: [
      STATUS.COMPLETED, STATUS.NOT_STARTED, STATUS.CANCELED,
      STATUS.BLOCKED, STATUS.DEFERRED, STATUS.SCHEDULED
    ],
    [STATUS.BLOCKED]: [
      STATUS.NOT_STARTED, STATUS.SCHEDULED, STATUS.IN_PROGRESS,
      STATUS.CANCELED, STATUS.DEFERRED
    ],
    [STATUS.DEFERRED]: [
      STATUS.NOT_STARTED, STATUS.SCHEDULED, STATUS.CANCELED
    ],
    [STATUS.PENDING_APPROVAL]: [
      STATUS.ACCEPTED, STATUS.REJECTED, STATUS.CANCELED
    ],
    [STATUS.ACCEPTED]: [
      STATUS.NOT_STARTED, STATUS.SCHEDULED, STATUS.IN_PROGRESS
    ],
    [STATUS.REJECTED]: [
      STATUS.NOT_STARTED, STATUS.CANCELED
    ],
    [STATUS.COMPLETED]: [STATUS.ARCHIVED],
    [STATUS.CANCELED]: [
      STATUS.NOT_STARTED, STATUS.SCHEDULED, STATUS.ARCHIVED
    ],
    [STATUS.ARCHIVED]: []   // Terminal state
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get priority score for numerical comparisons
 */
function getPriorityScore(priority) {
  const scores = {
    [PRIORITY.CRITICAL]: 100,
    [PRIORITY.URGENT]: 80,
    [PRIORITY.HIGH]: 60,
    [PRIORITY.MEDIUM]: 40,
    [PRIORITY.LOW]: 20,
    [PRIORITY.MINIMAL]: 10
  };

  return scores[priority] || scores[PRIORITY.MEDIUM];
}

/**
 * Get energy level score for matching calculations
 */
function getEnergyScore(energyLevel) {
  const scores = {
    [ENERGY_LEVEL.CRITICAL]: 100,
    [ENERGY_LEVEL.HIGH]: 80,
    [ENERGY_LEVEL.MEDIUM]: 60,
    [ENERGY_LEVEL.LOW]: 40,
    [ENERGY_LEVEL.RECOVERY]: 20
  };

  return scores[energyLevel] || scores[ENERGY_LEVEL.MEDIUM];
}

/**
 * Get all enum definitions for debugging
 */
function getAllEnums() {
  return {
    STATUS,
    PRIORITY,
    LANE,
    ENERGY_LEVEL,
    FOCUS_LEVEL,
    MOOD,
    STRESS_LEVEL,
    CONTEXT,
    BLOCK_TYPE,
    SOURCE,
    CONFIDENCE,
    PROPOSAL_STATUS,
    CALENDAR_EVENT_TYPE,
    HEALTH_STATUS,
    TRIGGER_TYPE,
    AGING_CURVE,
    DECAY_ALGORITHM,
    URGENCY_ALGORITHM,
    GMAIL_LABELS
  };
}

// --- CORE UTILITY CLASSES ---

/**
 * MOH TIME OS v2.0 - PERSISTENT STORE
 *
 * High-performance persistent storage with compression, TTL, and automatic cleanup.
 * Wraps Google Apps Script PropertiesService with enhanced features.
 */
class PersistentStore {
  constructor() {
    try {
      this.scriptProperties = PropertiesService.getScriptProperties();
    } catch (e) {
      // Assuming a logger is available or will be injected later
      // For now, we'll just re-throw as DatabaseError
      throw new DatabaseError('Failed to initialize PersistentStore: Could not get ScriptProperties.', { originalError: e.message });
    }
    this.compressionThreshold = 1024; // Compress if > 1KB
    this.maxKeyLength = 50;
    this.maxValueLength = 9000; // Safe limit for script properties
    this.stats = {
      reads: 0,
      writes: 0,
      compressions: 0,
      decompressions: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      errors: 0
    };
    this.keyPrefix = 'mto_'; // Namespace prefix
  }

  /**
   * Store value with optional TTL and compression
   */
  set(key, value, ttl = null) {
    this.stats.writes++;

    try {
      const safeKey = this._sanitizeKey(key);
      const entry = {
        value: value,
        timestamp: Date.now(),
        expires: ttl ? Date.now() + ttl : null,
        version: '2.0'
      };

      let serialized = JSON.stringify(entry);

      // Check if value is too large
      if (serialized.length > this.maxValueLength) {
        // Try compression first
        if (serialized.length > this.compressionThreshold) {
          try {
            serialized = this._compress(serialized);
            entry.compressed = true;
            this.stats.compressions++;

            // Re-serialize with compression flag
            serialized = JSON.stringify(entry);
          } catch (compressionError) {
            throw new DatabaseError('Failed to compress large value', {
              key: safeKey,
              size: serialized.length,
              maxSize: this.maxValueLength
            });
          }
        }

        // Still too large after compression
        if (serialized.length > this.maxValueLength) {
          throw new DatabaseError('Value too large for storage', {
            key: safeKey,
            size: serialized.length,
            maxSize: this.maxValueLength,
            compressed: entry.compressed || false
          });
        }
      }

      // Attempt to store
      try {
        this.scriptProperties.setProperty(safeKey, serialized);
      } catch (error) {
        if (error.message.includes('exceeds maximum')) {
          // Try to free space by evicting old entries
          this._evictOldEntries();

          // Retry once
          try {
            this.scriptProperties.setProperty(safeKey, serialized);
          } catch (retryError) {
            throw new DatabaseError('Storage quota exceeded and cleanup failed', {
              key: safeKey,
              originalError: retryError.message
            });
          }
        } else {
          throw new DatabaseError('Failed to store property', {
            key: safeKey,
            error: error.message
          });
        }
      }

    } catch (error) {
      this.stats.errors++;
      if (error instanceof BaseError) {
        throw error;
      }
      throw new DatabaseError('PersistentStore.set failed', {
        key,
        error: error.message
      });
    }
  }

  /**
   * Retrieve value with automatic decompression and TTL checking
   */
  get(key) {
    this.stats.reads++;

    try {
      const safeKey = this._sanitizeKey(key);
      const stored = this.scriptProperties.getProperty(safeKey);

      if (!stored) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      // Parse stored entry
      let entry;
      try {
        entry = JSON.parse(stored);
      } catch (parseError) {
        // Corrupted entry - delete it
        this.delete(key);
        this.stats.errors++;
        return null;
      }

      // Handle legacy format (direct values without metadata)
      if (typeof entry !== 'object' || !entry.hasOwnProperty('value')) {
        // Legacy value, return as-is but with warning
        if (hasService('SmartLogger')) {
          getService('SmartLogger').debug('PersistentStore', 'Legacy value format detected', {
            key: safeKey
          });
        }
        return entry;
      }

      // Check expiration
      if (entry.expires && Date.now() > entry.expires) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      // Handle compressed values
      if (entry.compressed) {
        try {
          const decompressed = this._decompress(entry.value);
          this.stats.decompressions++;
          return JSON.parse(decompressed);
        } catch (decompressionError) {
          // Corrupted compressed data
          this.delete(key);
          this.stats.errors++;
          throw new DatabaseError('Failed to decompress stored value', {
            key: safeKey,
            error: decompressionError.message
          });
        }
      }

      return entry.value;

    } catch (error) {
      // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
      // TEST: TEST_SILENT_016_GET
      LoggerFacade.error('PersistentStore', 'Get operation failed', {
        key: key,
        error: error.message,
        stack: error.stack,
        context: 'get'
      });

      // Classify error severity
      if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
        throw error;  // Fatal - cannot recover
      }

      // Recoverable - return sentinel
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Check if key exists (without retrieving value)
   */
  has(key) {
    try {
      const safeKey = this._sanitizeKey(key);
      const stored = this.scriptProperties.getProperty(safeKey);

      if (!stored) {
        return false;
      }

      // Quick TTL check without full parsing
      try {
        const entry = JSON.parse(stored);
        if (entry.expires && Date.now() > entry.expires) {
          this.delete(key);
          return false;
        }
      } catch (parseError) {
        // BOOL_SENTINEL_FALSE_RETHROW_FATAL profile
        // TEST: TEST_SILENT_017_HAS
        LoggerFacade.error('PersistentStore', 'Has operation parse error', {
          key: key,
          error: parseError.message,
          stack: parseError.stack,
          context: 'has_parse'
        });

        // Fatal condition check
        if (!parseError.recoverable || parseError.name === 'DatabaseError') {
          throw parseError;
        }

        // Recoverable - assume it exists but might be legacy
        return true;
      }

      return true;

    } catch (error) {
      // BOOL_SENTINEL_FALSE_RETHROW_FATAL profile
      // TEST: TEST_SILENT_018_HAS
      LoggerFacade.error('PersistentStore', 'Has operation failed', {
        key: key,
        error: error.message,
        stack: error.stack,
        context: 'has'
      });

      // Fatal condition check
      if (!error.recoverable || error.name === 'DatabaseError') {
        throw error;
      }

      // Recoverable - return sentinel
      return false;
    }
  }

  /**
   * Delete key from storage
   */
  delete(key) {
    try {
      const safeKey = this._sanitizeKey(key);
      this.scriptProperties.deleteProperty(safeKey);
      return true;
    } catch (error) {
      // MUTATE_RETHROW profile
      // TEST: TEST_SILENT_019_DELETE
      LoggerFacade.error('PersistentStore', 'Delete operation failed', {
        key: key,
        error: error.message,
        stack: error.stack,
        context: 'delete'
      });

      this.stats.errors++;
      throw error;  // Mutations never fail silently
    }
  }

  /**
   * Clear all keys with our prefix
   */
  clear() {
    try {
      const allProperties = this.scriptProperties.getProperties();
      const keysToDelete = Object.keys(allProperties)
        .filter(key => key.startsWith(this.keyPrefix));

      keysToDelete.forEach(key => {
        this.scriptProperties.deleteProperty(key);
      });

      // Reset stats
      this.stats.evictions += keysToDelete.length;

      if (hasService('SmartLogger')) {
        getService('SmartLogger').info('PersistentStore', 'Storage cleared', {
          deletedKeys: keysToDelete.length
        });
      }

      return keysToDelete.length;

    } catch (error) {
      this.stats.errors++;
      throw new DatabaseError('Failed to clear storage', {
        error: error.message
      });
    }
  }

  /**
   * Get multiple values efficiently
   */
  getMultiple(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return {};
    }

    const results = {};
    const safeKeys = keys.map(key => this._sanitizeKey(key));

    try {
      // Get all properties at once for efficiency
      const allProperties = this.scriptProperties.getProperties();

      safeKeys.forEach((safeKey, index) => {
        const originalKey = keys[index];
        const stored = allProperties[safeKey];

        if (stored) {
          try {
            // Use same logic as get() but without individual API calls
            let entry = JSON.parse(stored);

            // Handle legacy format
            if (typeof entry !== 'object' || !entry.hasOwnProperty('value')) {
              results[originalKey] = entry;
              return;
            }

            // Check expiration
            if (entry.expires && Date.now() > entry.expires) {
              this.delete(originalKey);
              return;
            }

            // Handle compression
            if (entry.compressed) {
              const decompressed = this._decompress(entry.value);
              results[originalKey] = JSON.parse(decompressed);
              this.stats.decompressions++;
            } else {
              results[originalKey] = entry.value;
            }

            this.stats.hits++;

          } catch (error) {
            // RETHROW_WITH_LOG profile
            // TEST: TEST_SILENT_020_SAFEKEYS
            LoggerFacade.error('PersistentStore', 'Operation failed', {
              error: error.message,
              stack: error.stack,
              context: 'safeKeys'
            });

            this.stats.errors++;
            throw error;
          }
        } else {
          this.stats.misses++;
        }
      });

      this.stats.reads += keys.length;
      return results;

    } catch (error) {
      this.stats.errors++;
      throw new DatabaseError('Failed to get multiple values', {
        keys: keys.length,
        error: error.message
      });
    }
  }

  /**
   * Set multiple values efficiently
   */
  setMultiple(keyValuePairs, ttl = null) {
    if (!keyValuePairs || typeof keyValuePairs !== 'object') {
      throw new ValidationError('keyValuePairs must be an object');
    }

    const entries = Object.entries(keyValuePairs);
    if (entries.length === 0) {
      return;
    }

    try {
      const properties = {};

      entries.forEach(([key, value]) => {
        const safeKey = this._sanitizeKey(key);
        const entry = {
          value: value,
          timestamp: Date.now(),
          expires: ttl ? Date.now() + ttl : null,
          version: '2.0'
        };

        let serialized = JSON.stringify(entry);

        // Apply compression if needed
        if (serialized.length > this.compressionThreshold) {
          try {
            serialized = this._compress(serialized);
            entry.compressed = true;
            serialized = JSON.stringify(entry);
            this.stats.compressions++;
          } catch (compressionError) {
            // RETHROW_WITH_LOG profile
            // TEST: TEST_SILENT_021_ENTRIES
            LoggerFacade.error('PersistentStore', 'Operation failed', {
              error: compressionError.message,
              stack: compressionError.stack,
              context: 'entries'
            });

            throw compressionError;
          }
        }

        if (serialized.length <= this.maxValueLength) {
          properties[safeKey] = serialized;
        } else {
          if (hasService('SmartLogger')) {
            getService('SmartLogger').warn('PersistentStore', 'Skipping oversized value', {
              key: safeKey,
              size: serialized.length
            });
          }
        }
      });

      // Set all properties at once
      this.scriptProperties.setProperties(properties);
      this.stats.writes += Object.keys(properties).length;

    } catch (error) {
      this.stats.errors++;
      throw new DatabaseError('Failed to set multiple values', {
        pairs: entries.length,
        error: error.message
      });
    }
  }

  /**
   * Sanitize and prefix key
   */
  _sanitizeKey(key) {
    if (!key || typeof key !== 'string') {
      throw new ValidationError('Key must be a non-empty string', { key });
    }

    // Remove invalid characters and apply prefix
    let safe = this.keyPrefix + key.replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Hash if too long
    if (safe.length > this.maxKeyLength) {
      const hash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.MD5,
        key
      ).map(b => (b & 0xFF).toString(16).padStart(2, '0')).join('');
      safe = this.keyPrefix + hash;
    }

    return safe;
  }

  /**
   * Compress string using gzip
   */
  _compress(str) {
    try {
      const blob = Utilities.newBlob(str, 'text/plain');
      const compressed = Utilities.gzip(blob);
      return Utilities.base64Encode(compressed.getBytes());
    } catch (error) {
      throw new DatabaseError('Compression failed', {
        size: str.length,
        error: error.message
      });
    }
  }

  /**
   * Decompress gzip string
   */
  _decompress(compressedStr) {
    try {
      const bytes = Utilities.base64Decode(compressedStr);
      const compressed = Utilities.newBlob(bytes);
      const decompressed = Utilities.ungzip(compressed);
      return decompressed.getDataAsString();
    } catch (error) {
      throw new DatabaseError('Decompression failed', {
        error: error.message
      });
    }
  }

  /**
   * Evict old entries to free space
   */
  _evictOldEntries() {
    try {
      const allProperties = this.scriptProperties.getProperties();
      const ourKeys = Object.keys(allProperties)
        .filter(key => key.startsWith(this.keyPrefix));

      if (ourKeys.length === 0) {
        return;
      }

      // Parse entries to get timestamps
      const entries = [];
      ourKeys.forEach(key => {
        try {
          const entry = JSON.parse(allProperties[key]);
          if (entry.timestamp) {
            entries.push({
              key: key,
              timestamp: entry.timestamp,
              expires: entry.expires
            });
          }
        } catch (error) {
          // RETHROW_WITH_LOG profile
          // TEST: TEST_SILENT_022_EVICTOLDENTRIES
          LoggerFacade.error('PersistentStore', 'Operation failed', {
            error: error.message,
            stack: error.stack,
            context: '_evictOldEntries'
          });

          throw error;
        }
      });

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove expired entries first
      const now = Date.now();
      const expiredKeys = entries
        .filter(entry => entry.expires && now > entry.expires)
        .map(entry => entry.key);

      // If not enough expired, remove oldest 20%
      let keysToRemove = expiredKeys;
      if (keysToRemove.length < entries.length * 0.1) {
        const oldestCount = Math.ceil(entries.length * 0.2);
        keysToRemove = entries.slice(0, oldestCount).map(entry => entry.key);
      }

      // Delete selected keys
      keysToRemove.forEach(key => {
        this.scriptProperties.deleteProperty(key);
      });

      this.stats.evictions += keysToRemove.length;

      if (hasService('SmartLogger')) {
        getService('SmartLogger').info('PersistentStore', 'Evicted old entries', {
          evicted: keysToRemove.length,
          expired: expiredKeys.length,
          total: entries.length
        });
      }

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_023_EVICTOLDENTRIES
      LoggerFacade.error('PersistentStore', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: '_evictOldEntries'
      });

      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) : 0;
    const compressionRate = this.stats.writes > 0 ? (this.stats.compressions / this.stats.writes) : 0;
    const errorRate = this.stats.reads + this.stats.writes > 0 ?
      (this.stats.errors / (this.stats.reads + this.stats.writes)) : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) + '%',
      compressionRate: Math.round(compressionRate * 100) + '%',
      errorRate: Math.round(errorRate * 100) + '%',
      totalOperations: this.stats.reads + this.stats.writes
    };
  }

  /**
   * Get storage usage information
   */
  getUsageInfo() {
    try {
      const allProperties = this.scriptProperties.getProperties();
      const ourKeys = Object.keys(allProperties)
        .filter(key => key.startsWith(this.keyPrefix));

      const usage = {
        totalKeys: ourKeys.length,
        totalSize: 0,
        compressedKeys: 0,
        expiredKeys: 0,
        averageSize: 0
      };

      const now = Date.now();
      ourKeys.forEach(key => {
        const value = allProperties[key];
        usage.totalSize += value.length;

        try {
          const entry = JSON.parse(value);
          if (entry.compressed) {
            usage.compressedKeys++;
          }
          if (entry.expires && now > entry.expires) {
            usage.expiredKeys++;
          }
        } catch (error) {
          // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
          // TEST: TEST_SILENT_024_GETUSAGEINFO
          LoggerFacade.error('PersistentStore', 'Operation failed', {
            error: error.message,
            stack: error.stack,
            context: 'getUsageInfo'
          });

          // Classify error severity
          if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
            throw error;  // Fatal - cannot recover
          }

          // Recoverable - count unparseable entries as potential cleanup targets
        }
      });

      usage.averageSize = usage.totalKeys > 0 ?
        Math.round(usage.totalSize / usage.totalKeys) : 0;

      return usage;

    } catch (error) {
      // OBJ_SENTINEL_NULL_RETHROW_FATAL profile
      // TEST: TEST_SILENT_025_GETUSAGEINFO
      LoggerFacade.error('PersistentStore', 'GetUsageInfo operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'getUsageInfo'
      });

      // Classify error severity
      if (error.name === 'DatabaseError' || error.name === 'ConfigurationError') {
        throw error;  // Fatal - cannot recover
      }

      // Recoverable - return sentinel
      return null;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    let cleanedCount = 0;

    try {
      const allProperties = this.scriptProperties.getProperties();
      const ourKeys = Object.keys(allProperties)
        .filter(key => key.startsWith(this.keyPrefix));

      const now = Date.now();

      ourKeys.forEach(key => {
        try {
          const entry = JSON.parse(allProperties[key]);
          if (entry.expires && now > entry.expires) {
            this.scriptProperties.deleteProperty(key);
            cleanedCount++;
          }
        } catch (error) {
          // RETHROW_WITH_LOG profile
          // TEST: TEST_SILENT_026_CLEANUP
          LoggerFacade.error('PersistentStore', 'Operation failed', {
            error: error.message,
            stack: error.stack,
            context: 'cleanup'
          });

          throw error;
        }
      });

      if (cleanedCount > 0 && hasService('SmartLogger')) {
        getService('SmartLogger').info('PersistentStore', 'Cleanup completed', {
          removed: cleanedCount
        });
      }

      return cleanedCount;

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_027_CLEANUP
      LoggerFacade.error('PersistentStore', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'cleanup'
      });

      throw error;
    }
  }

  /**
   * Health check
   */
  healthCheck() {
    try {
      const testKey = 'health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };

      this.set(testKey, testValue, 5000); // 5 second TTL
      const retrieved = this.get(testKey);
      this.delete(testKey);

      const isHealthy = retrieved && retrieved.test === true;

      return {
        healthy: isHealthy,
        stats: this.getStats(),
        usage: this.getUsageInfo(),
        timestamp: TimeZoneAwareDate.now()
      };

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_028_HEALTHCHECK
      LoggerFacade.error('PersistentStore', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'healthCheck'
      });

      throw error;
    }
  }

  /**
   * Set key expiration time
   * @param {string} key - Key to set expiration for
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} True if expiration was set successfully
   */
  expire(key, ttl) {
    try {
      if (!key || typeof key !== 'string') {
        throw new ValidationError('Key must be a non-empty string', { key });
      }

      if (!ttl || typeof ttl !== 'number' || ttl <= 0) {
        throw new ValidationError('TTL must be a positive number', { ttl });
      }

      // Get existing value
      const currentValue = this.get(key);
      if (currentValue === null) {
        return false; // Key doesn't exist
      }

      // Re-store with new expiration
      this.set(key, currentValue, ttl * 1000); // Convert to milliseconds
      return true;

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_029_EXPIRE
      LoggerFacade.error('PersistentStore', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'expire'
      });

      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Get time to live for a key
   * @param {string} key - Key to check TTL for
   * @returns {number} Time to live in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  ttl(key) {
    try {
      const safeKey = this._sanitizeKey(key);
      const stored = this.scriptProperties.getProperty(safeKey);

      if (!stored) {
        return -2; // Key doesn't exist
      }

      let entry;
      try {
        entry = JSON.parse(stored);
      } catch (parseError) {
        // RETHROW_WITH_LOG profile
        // TEST: TEST_SILENT_030_TTL
        LoggerFacade.error('PersistentStore', 'Operation failed', {
          error: parseError.message,
          stack: parseError.stack,
          context: 'ttl'
        });

        throw parseError;
      }

      // Handle legacy format
      if (typeof entry !== 'object' || !entry.hasOwnProperty('expires')) {
        return -1; // No expiration set
      }

      if (!entry.expires) {
        return -1; // No expiration set
      }

      const now = Date.now();
      const expiresAt = entry.expires;

      if (now > expiresAt) {
        // Already expired
        this.delete(key);
        return -2;
      }

      return Math.floor((expiresAt - now) / 1000); // Return seconds

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_031_TTL
      LoggerFacade.error('PersistentStore', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'ttl'
      });

      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Scan for keys matching a pattern
   * @param {string} pattern - Pattern to match (supports * as wildcard)
   * @returns {Array} Array of matching keys
   */
  scan(pattern) {
    try {
      if (!pattern || typeof pattern !== 'string') {
        throw new ValidationError('Pattern must be a non-empty string', { pattern });
      }

      const allProperties = this.scriptProperties.getProperties();
      const ourKeys = Object.keys(allProperties)
        .filter(key => key.startsWith(this.keyPrefix));

      const matchingKeys = [];

      // Convert pattern to regex
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\\]/g, '\\$&') // Escape special regex chars
        .replace(/\* /g, '.*'); // Convert * to .*

      const regex = new RegExp(`^${regexPattern}$`, 'i');

      ourKeys.forEach(safeKey => {
        // Remove prefix to get original key
        const originalKey = safeKey.substring(this.keyPrefix.length);

        // Check if key matches pattern
        if (regex.test(originalKey)) {
          // Verify key is not expired
          try {
            const stored = allProperties[safeKey];
            const entry = JSON.parse(stored);

            if (typeof entry === 'object' && entry.expires) {
              if (Date.now() > entry.expires) {
                // Skip expired keys and clean them up
                this.delete(originalKey);
                return;
              }
            }

            matchingKeys.push(originalKey);
          } catch (parseError) {
            // RETHROW_WITH_LOG profile
            // TEST: TEST_SILENT_032_SCAN
            LoggerFacade.error('PersistentStore', 'Operation failed', {
              error: parseError.message,
              stack: parseError.stack,
              context: 'scan'
            });

            throw parseError;
          }
        }
      });

      return matchingKeys;

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_033_SCAN
      LoggerFacade.error('PersistentStore', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'scan'
      });

      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Destroy store (for cleanup)
   */
  destroy() {
    this.clear();
  }
}

/**
 * MOH TIME OS v2.0 - CROSS EXECUTION CACHE
 *
 * Two-tier caching system with memory cache for current execution
 * and persistent cache for cross-execution storage.
 */
class CrossExecutionCache {
  constructor(persistentStore) {
    this.persistentStore = persistentStore;
    this.memoryCache = new Map(); // Hot cache for current execution
    this.weakCache = new WeakMap(); // For object references
    this.maxMemoryItems = 100;
    this.defaultTTL = 300000; // 5 minutes
    this.stats = {
      memoryHits: 0,
      persistentHits: 0,
      misses: 0,
      evictions: 0,
      memorySize: 0,
      totalOperations: 0
    };

    // LRU tracking for memory cache with pre-calculated sizes
    this.accessOrder = new Map(); // Changed from array to Map for O(1) operations
    this.accessCounter = 0; // Add counter for ordering
    this.sizes = new Map(); // Track sizes separately for performance
  }

  /**
   * Get value from cache with two-tier lookup
   */
  get(key) {
    this.stats.totalOperations++;

    // Level 1: Memory cache (fastest - current execution only)
    if (this.memoryCache.has(key)) {
      this._updateAccessOrder(key);
      const entry = this.memoryCache.get(key);

      // Check TTL
      if (entry.expires && Date.now() > entry.expires) {
        this.memoryCache.delete(key);
        this._removeFromAccessOrder(key);
        this.stats.memorySize--;
        return this._checkPersistent(key);
      }

      this.stats.memoryHits++;
      return entry.value;
    }

    // Level 2: Persistent cache (slower - cross-execution)
    return this._checkPersistent(key);
  }

  /**
   * Check persistent cache
   */
  _checkPersistent(key) {
    try {
      const value = this.persistentStore.get(key);
      if (value !== null) {
        this.stats.persistentHits++;

        // Promote to memory cache for future access
        this._addToMemory(key, value);

        return value;
      }
    } catch (error) {
      // BOOL_SENTINEL_FALSE_RETHROW_FATAL profile
      // TEST: TEST_SILENT_034__CHECKPERSISTENT
      LoggerFacade.error('CrossExecutionCache', 'Persistent check failed', {
        error: error.message,
        stack: error.stack,
        context: '_checkPersistent',
        key: key
      });

      // Fatal condition check
      if (!error.recoverable || error.name === 'DatabaseError') {
        throw error;
      }

      // Recoverable - return sentinel handled below
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Set value in both memory and persistent cache
   */
  set(key, value, ttl = null) {
    const effectiveTTL = ttl || this.defaultTTL;

    // Add to memory cache
    this._addToMemory(key, value, effectiveTTL);

    // Persist if TTL is long enough (> 1 minute)
    if (effectiveTTL > 60000) {
      try {
        this.persistentStore.set(key, value, effectiveTTL);
      } catch (error) {
        // MUTATE_RETHROW profile
        // TEST: TEST_SILENT_035_SET
        LoggerFacade.error('CrossExecutionCache', 'Set operation failed', {
          key: key,
          error: error.message,
          stack: error.stack,
          context: 'set'
        });

        throw error;  // Mutations never fail silently
      }
    }
  }

  /**
   * Get or compute value with caching
   */
  getOrCompute(key, computeFn, ttl = null) {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    try {
      const value = computeFn();
      if (value !== null && value !== undefined) {
        this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      // Log error but don't cache it
      if (hasService('SmartLogger')) {
        getService('SmartLogger').error('CrossExecutionCache', 'Compute function failed', {
          key,
          error: error.message
        });
      }
      throw error;
    }
  }

  /**
   * Add to memory cache with LRU eviction
   */
  _addToMemory(key, value, ttl = null) {
    const entry = {
      value: value,
      expires: ttl ? Date.now() + ttl : null,
      created: Date.now()
    };

    // Pre-calculate size during set() for performance
    const entrySize = JSON.stringify(entry.value).length;
    this.sizes.set(key, entrySize);

    // Remove existing entry if present
    if (this.memoryCache.has(key)) {
      this._removeFromAccessOrder(key);
      this.stats.memorySize--;
    }

    // Enforce memory limit with LRU eviction and infinite loop protection
    let maxIterations = 100;
    while (this.memoryCache.size >= this.maxMemoryItems && maxIterations > 0) {
      this._evictLRU();
      maxIterations--;
    }

    // Emergency cache clearing if infinite loop protection triggered
    if (maxIterations === 0) {
      if (hasService('SmartLogger')) {
        getService('SmartLogger').error('CrossExecutionCache', 'Infinite loop protection triggered - emergency cache clear', {
          cacheSize: this.memoryCache.size,
          maxItems: this.maxMemoryItems
        });
      }
      this.clear(); // Emergency clear
    }

    // Add new entry
    this.memoryCache.set(key, entry);
    this._addToAccessOrder(key);
    this.stats.memorySize++;
  }

  /**
   * Update access order for LRU
   */
  _updateAccessOrder(key) {
    this._removeFromAccessOrder(key);
    this._addToAccessOrder(key);
  }

  /**
   * Add to access order tracking
   */
  _addToAccessOrder(key) {
    this.accessOrder.set(key, ++this.accessCounter);
  }

  /**
   * Remove from access order tracking
   */
  _removeFromAccessOrder(key) {
    this.accessOrder.delete(key);
  }

  /**
   * Evict least recently used item
   */
  _evictLRU() {
    if (this.accessOrder.size === 0) return;

    // Find LRU key using Map values
    let lruKey = null;
    let minOrder = Infinity;
    for (const [key, order] of this.accessOrder.entries()) {
      if (order < minOrder) {
        minOrder = order;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.memoryCache.delete(lruKey);
      this.sizes.delete(lruKey); // Clean up size tracking
      this.accessOrder.delete(lruKey);
      this.stats.evictions++;
      this.stats.memorySize--;
    }
  }

  /**
   * Delete from both caches
   */
  delete(key) {
    // Remove from memory cache
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key);
      this.sizes.delete(key); // Clean up size tracking
      this._removeFromAccessOrder(key);
      this.stats.memorySize--;
    }

    // Remove from persistent cache
    try {
      this.persistentStore.delete(key);
    } catch (error) {
      // MUTATE_RETHROW profile
      // TEST: TEST_SILENT_036_DELETE
      LoggerFacade.error('CrossExecutionCache', 'Delete operation failed', {
        key: key,
        error: error.message,
        stack: error.stack,
        context: 'delete'
      });

      throw error;  // Mutations never fail silently
    }
  }

  /**
   * Check if key exists in either cache
   */
  has(key) {
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      if (!entry.expires || Date.now() <= entry.expires) {
        return true;
      }
    }

    try {
      return this.persistentStore.has(key);
    } catch (error) {
      // BOOL_SENTINEL_FALSE_RETHROW_FATAL profile
      // TEST: TEST_SILENT_037_HAS
      LoggerFacade.error('CrossExecutionCache', 'Has check failed', {
        error: error.message,
        stack: error.stack,
        context: 'has',
        key: key
      });

      // Fatal condition check
      if (!error.recoverable || error.name === 'DatabaseError') {
        throw error;
      }

      // Recoverable - return sentinel
      return false;
    }
  }

  /**
   * Clear memory cache only (preserve persistent)
   */
  clear() {
    this.memoryCache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    this.sizes.clear();
    this.stats.memorySize = 0;
  }

  /**
   * Clear both memory and persistent caches
   */
  clearAll() {
    this.clear();
    try {
      this.persistentStore.clear();
    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_038_CLEARALL
      LoggerFacade.error('CrossExecutionCache', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'clearAll'
      });

      throw error;
    }
  }

  /**
   * Cleanup expired entries from memory cache
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    this.memoryCache.forEach((entry, key) => {
      if (entry.expires && now > entry.expires) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
      this._removeFromAccessOrder(key);
      this.stats.memorySize--;
    });

    return expiredKeys.length;
  }

  /**
   * Warm cache with multiple key-value pairs
   */
  warmUp(keyValuePairs, ttl = null) {
    if (!keyValuePairs || typeof keyValuePairs !== 'object') {
      return;
    }

    Object.entries(keyValuePairs).forEach(([key, value]) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * Get multiple values efficiently
   */
  getMultiple(keys) {
    if (!Array.isArray(keys)) {
      return {};
    }

    const results = {};
    const missingKeys = [];

    // Check memory cache first
    keys.forEach(key => {
      if (this.memoryCache.has(key)) {
        const entry = this.memoryCache.get(key);
        if (!entry.expires || Date.now() <= entry.expires) {
          results[key] = entry.value;
          this.stats.memoryHits++;
          this._updateAccessOrder(key);
        } else {
          missingKeys.push(key);
        }
      } else {
        missingKeys.push(key);
      }
    });

    // Check persistent cache for missing keys
    if (missingKeys.length > 0) {
      try {
        const persistentResults = this.persistentStore.getMultiple(missingKeys);
        Object.entries(persistentResults).forEach(([key, value]) => {
          results[key] = value;
          this.stats.persistentHits++;
          this._addToMemory(key, value);
        });

        // Count misses
        const foundInPersistent = Object.keys(persistentResults);
        const actualMisses = missingKeys.filter(key => !foundInPersistent.includes(key));
        this.stats.misses += actualMisses.length;

      } catch (error) {
        // RETHROW_WITH_LOG profile
        // TEST: TEST_SILENT_039_GETMULTIPLE
        LoggerFacade.error('CrossExecutionCache', 'Operation failed', {
          error: error.message,
          stack: error.stack,
          context: 'getMultiple'
        });

        throw error;
      }
    }

    this.stats.totalOperations += keys.length;
    return results;
  }

  /**
   * Set multiple values efficiently
   */
  setMultiple(keyValuePairs, ttl = null) {
    if (!keyValuePairs || typeof keyValuePairs !== 'object') {
      return;
    }

    const persistentPairs = {};
    const effectiveTTL = ttl || this.defaultTTL;

    Object.entries(keyValuePairs).forEach(([key, value]) => {
      // Add to memory
      this._addToMemory(key, value, effectiveTTL);

      // Prepare for persistent storage if TTL is long enough
      if (effectiveTTL > 60000) {
        persistentPairs[key] = value;
      }
    });

    // Batch persist
    if (Object.keys(persistentPairs).length > 0) {
      try {
        this.persistentStore.setMultiple(persistentPairs, effectiveTTL);
      } catch (error) {
        // RETHROW_WITH_LOG profile
        // TEST: TEST_SILENT_040_SETMULTIPLE
        LoggerFacade.error('CrossExecutionCache', 'Operation failed', {
          error: error.message,
          stack: error.stack,
          context: 'setMultiple',
          count: Object.keys(persistentPairs).length
        });

        throw error;
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.memoryHits + this.stats.persistentHits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.memoryHits + this.stats.persistentHits) / total) : 0;
    const memoryHitRate = total > 0 ? (this.stats.memoryHits / total) : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) + '%',
      memoryHitRate: Math.round(memoryHitRate * 100) + '%',
      cacheEfficiency: hitRate > 0.8 ? 'EXCELLENT' : hitRate > 0.6 ? 'GOOD' : 'POOR',
      maxMemoryItems: this.maxMemoryItems,
      accessOrderLength: this.accessOrder.size
    };
  }

  /**
   * Get detailed cache information
   */
  getCacheInfo() {
    // Use cached sizes instead of recalculating to prevent memory leak
    const memoryEntries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      size: this.sizes.get(key) || 0, // Use pre-calculated size
      expires: entry.expires,
      age: Date.now() - entry.created
    }));

    return {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.maxMemoryItems,
        entries: memoryEntries
      },
      persistent: this.persistentStore.getUsageInfo(),
      stats: this.getStats()
    };
  }

  /**
   * Optimize cache performance
   */
  optimize() {
    let optimizations = 0;

    // Clean expired entries
    const expiredCleaned = this.cleanup();
    optimizations += expiredCleaned;

    // Adjust memory size based on usage patterns
    const stats = this.getStats();
    if (stats.memoryHitRate < 0.5 && this.maxMemoryItems > 50) {
      // Low memory hit rate - reduce memory cache size
      this.maxMemoryItems = Math.max(50, this.maxMemoryItems - 20);
      optimizations++;
    } else if (stats.memoryHitRate > 0.9 && this.maxMemoryItems < 200) {
      // High memory hit rate - increase memory cache size
      this.maxMemoryItems = Math.min(200, this.maxMemoryItems + 20);
      optimizations++;
    }

    // Cleanup persistent store
    try {
      const persistentCleaned = this.persistentStore.cleanup();
      optimizations += persistentCleaned;
    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_041_OPTIMIZE
      LoggerFacade.error('CrossExecutionCache', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'optimize'
      });

      throw error;
    }

    if (optimizations > 0 && hasService('SmartLogger')) {
      getService('SmartLogger').debug('CrossExecutionCache', 'Cache optimized', {
        expiredCleaned,
        maxMemoryItems: this.maxMemoryItems,
        optimizations
      });
    }

    return optimizations;
  }

  /**
   * Health check for cache system
   */
  healthCheck() {
    try {
      const testKey = 'health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };

      // Test memory cache
      this._addToMemory(testKey, testValue, 5000);
      const memoryResult = this.memoryCache.get(testKey);

      // Test persistent cache
      let persistentResult = null;
      try {
        this.persistentStore.set(testKey, testValue, 5000);
        persistentResult = this.persistentStore.get(testKey);
      } catch (persistentError) {
        // RETHROW_WITH_LOG profile
        // TEST: TEST_SILENT_042_HEALTHCHECK_INNER
        LoggerFacade.error('CrossExecutionCache', 'Operation failed', {
          error: persistentError.message,
          stack: persistentError.stack,
          context: 'healthCheck_persistent'
        });

        throw persistentError;
      }

      // Cleanup test data
      this.delete(testKey);

      const memoryHealthy = memoryResult && memoryResult.value && memoryResult.value.test === true;
      const persistentHealthy = persistentResult && persistentResult.test === true;

      return {
        healthy: memoryHealthy,
        memory: {
          healthy: memoryHealthy,
          size: this.memoryCache.size,
          maxSize: this.maxMemoryItems
        },
        persistent: {
          healthy: persistentHealthy,
          available: this.persistentStore !== null
        },
        stats: this.getStats(),
        timestamp: TimeZoneAwareDate.now()
      };

    } catch (error) {
      // RETHROW_WITH_LOG profile
      // TEST: TEST_SILENT_043_HEALTHCHECK_OUTER
      LoggerFacade.error('CrossExecutionCache', 'Operation failed', {
        error: error.message,
        stack: error.stack,
        context: 'healthCheck'
      });

      throw error;
    }
  }

  /**
   * Destroy cache (cleanup)
   */
  destroy() {
    this.clear();
    this.stats = {
      memoryHits: 0,
      persistentHits: 0,
      misses: 0,
      evictions: 0,
      memorySize: 0,
      totalOperations: 0
    };
  }
}

/**
 * MOH TIME OS v2.0 - SMART LOGGER
 *
 * Intelligent logging system with suppression, batching, and activity tracking.
 * Prevents log spam while capturing essential system events.
 * Includes error handling and graceful degradation.
 */
class SmartLogger {
  constructor(cache) {
    if (!cache) {
      throw new Error('SmartLogger: cache parameter is required');
    }
    this.cache = cache;
    this.batchedLogs = [];
    this.maxBatchSize = 50;
    this.suppressionWindow = 30; // seconds
    this.logLevels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };
    this.currentLogLevel = this.logLevels.INFO; // Default to INFO and above
  }

  /**
   * Set the minimum log level
   * @param {string} level - Minimum log level (DEBUG, INFO, WARN, ERROR)
   */
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLogLevel = this.logLevels[level];
    }
  }

  /**
   * Private helper: Get the spreadsheet object with execution-scoped caching
   * @returns {Spreadsheet} The cached spreadsheet object
  */
  _getSpreadsheet() {
    return getActiveSystemSpreadsheet();
  }

  /**
   * Private method: Log a message with suppression and batching
   * @param {string} severity - Log severity level
   * @param {string} component - Component name generating the log
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   */
  _log(severity, component, message, context) {
    if (_loggingRecursionGuard) {
      return;
    }
    _loggingRecursionGuard = true;

    try {
      // Check if this log level should be processed
      const severityLevel = this.logLevels[severity] || this.logLevels.INFO;
      if (severityLevel < this.currentLogLevel) {
        return;
      }

      // Generate session ID and log hash for suppression
      const sessionId = Utilities.getUuid();
      const logHash = Utilities.base64Encode(
        Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, component + message)
      );
      const cacheKey = `log_suppress_${logHash}`;

      // Check if this log is suppressed
      if (this.cache.get(cacheKey)) {
        return;
      }

      // Suppress similar logs for the suppression window
      this.cache.set(cacheKey, true, this.suppressionWindow);

      // Prepare serializable context
      let serializableContext = context || {};
      if (context && context.error instanceof Error) {
        serializableContext = {
          ...context,
          error: {
            name: context.error.name,
            message: context.error.message,
            context: context.error.context,
            stack: context.error.stack ? context.error.stack.substring(0, 500) : undefined
          }
        };
      }

      const logRow = [
        TimeZoneAwareDate.now(),
        severity,
        component,
        message,
        JSON.stringify(serializableContext),
        sessionId
      ];

      // Always log to Apps Script log and console (dev visibility)
      const logLine = `[${severity}] ${component}: ${message}` +
        (context ? ` | ${JSON.stringify(serializableContext)}` : '');
      Logger.log(logLine);

      // Try to write to activity sheet
      try {
        const sheet = this._getSpreadsheet().getSheetByName(SHEET_NAMES.ACTIVITY);
        if (sheet) {
          this._writeToSheet(sheet, logRow);
        }
      } catch (sheetError) {
        // Log sheet write failure to console
        Logger.log(`SmartLogger ERROR: Sheet write failed: ${sheetError.message}`);
        Logger.log(JSON.stringify({
          component: 'SmartLogger',
          message: 'A critical error occurred during sheet write.',
          log: logRow,
          error: sheetError.message
        }));
      }

    } catch (error) {
      // Log any errors that occur during logging
      Logger.log('ERROR [SmartLogger._log]: Failed to log - ' + error.message);
    } finally {
      _loggingRecursionGuard = false;
    }
  }

  /**
   * Write log entry to sheet
   * @param {Sheet} sheet - Sheet to write to
   * @param {Array} logRow - Log data to write
   * @private
   */
  _writeToSheet(sheet, logRow) {
    try {
      sheet.appendRow(logRow);
    } catch (error) {
      // Add to batch if direct write fails
      this.batchedLogs.push(logRow);

      // Flush batch if it's getting full
      if (this.batchedLogs.length >= this.maxBatchSize) {
        this._flushBatchedLogs();
      }
    }
  }

  /**
   * Flush batched logs to sheet
   * @private
   */
  _flushBatchedLogs() {
    if (this.batchedLogs.length === 0) {
      return;
    }

    try {
      const sheet = this._getSpreadsheet().getSheetByName(SHEET_NAMES.ACTIVITY);
      if (sheet && this.batchedLogs.length > 0) {
        const lastRow = sheet.getLastRow();
        const numRows = this.batchedLogs.length;
        const numCols = this.batchedLogs[0].length;

        const range = sheet.getRange(lastRow + 1, 1, numRows, numCols);
        range.setValues(this.batchedLogs);

        this.batchedLogs = [];
      }
    } catch (error) {
      // If batch flush fails, just clear the batch to prevent memory buildup
      Logger.log(`SmartLogger: Failed to flush batched logs: ${error.message}`);
      this.batchedLogs = [];
    }
  }

  /**
   * Log an informational message
   * @param {string} component - Component name generating the log
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   */
  info(component, message, context = null) {
    this._log('INFO', component, message, context);
  }

  /**
   * Log a warning message
   * @param {string} component - Component name generating the log
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   */
  warn(component, message, context = null) {
    this._log('WARN', component, message, context);
  }

  /**
   * Log an error message
   * @param {string} component - Component name generating the log
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   */
  error(component, message, context = null) {
    this._log('ERROR', component, message, context);
  }

  /**
   * Log a debug message
   * @param {string} component - Component name generating the log
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   */
  debug(component, message, context = null) {
    this._log('DEBUG', component, message, context);
  }

  /**
   * Generic log method (defaults to INFO level)
   * @param {string} component - Component name generating the log
   * @param {string} message - Log message
   * @param {Object} context - Additional context data
   */
  log(component, message, context = null) {
    this._log('INFO', component, message, context);
  }

  /**
   * Log activity (alias for userActivity for compatibility)
   * @param {string} component - Component name
   * @param {string} activity - Activity description
   * @param {Object} details - Activity details
   */
  logActivity(component, activity, details = {}) {
    this.userActivity(activity, {
      component,
      ...details
    });
  }

  /**
   * Log performance metrics
   * @param {string} component - Component name
   * @param {string} operation - Operation name
   * @param {number} durationMs - Duration in milliseconds
   * @param {Object} additionalContext - Additional context
   */
  performance(component, operation, durationMs, additionalContext = {}) {
    const context = {
      operation,
      durationMs,
      performance: true,
      ...additionalContext
    };

    // Log as INFO if duration is reasonable, WARN if slow
    const severity = durationMs > 5000 ? 'WARN' : 'INFO';
    this._log(severity, component, `Performance: ${operation} completed in ${durationMs}ms`, context);
  }

  /**
   * Log user activity
   * @param {string} action - User action
   * @param {Object} details - Action details
   */
  userActivity(action, details = {}) {
    this._log('INFO', 'UserActivity', action, {
      userAction: true,
      timestamp: TimeZoneAwareDate.now(),
      ...details
    });
  }

  /**
   * Log system events
   * @param {string} event - System event name
   * @param {Object} details - Event details
   */
  systemEvent(event, details = {}) {
    this._log('INFO', 'SystemEvent', event, {
      systemEvent: true,
      timestamp: TimeZoneAwareDate.now(),
      ...details
    });
  }

  /**
   * Force flush any remaining batched logs
   */
  flush() {
    this._flushBatchedLogs();
  }

  /**
   * Get logging statistics
   * @returns {Object} Statistics about logging activity
   */
  getStats() {
    return {
      batchedLogsCount: this.batchedLogs.length,
      maxBatchSize: this.maxBatchSize,
      suppressionWindow: this.suppressionWindow,
      currentLogLevel: Object.keys(this.logLevels).find(
        key => this.logLevels[key] === this.currentLogLevel
      ),
      availableLevels: Object.keys(this.logLevels)
    };
  }

  /**
   * Clear batched logs (for testing/cleanup)
   */
  clearBatch() {
    this.batchedLogs = [];
  }

  /**
   * Adjust batch size based on usage patterns
   * @param {number} newSize - New batch size
   */
  setBatchSize(newSize) {
    if (newSize > 0 && newSize <= 1000) {
      this.maxBatchSize = newSize;
    }
  }

  /**
   * Adjust suppression window
   * @param {number} seconds - New suppression window in seconds
   */
  setSuppressionWindow(seconds) {
    if (seconds >= 1 && seconds <= 3600) {
      this.suppressionWindow = seconds;
    }
  }

  /**
   * Health check for logger system
   * @returns {Object} Health status
   */
  healthCheck() {
    try {
      const testMessage = `Health check at ${TimeZoneAwareDate.now()}`;
      const testContext = { test: true, timestamp: Date.now() };

      // Test logging without actual write
      const logRow = [
        TimeZoneAwareDate.now(),
        'DEBUG',
        'HealthCheck',
        testMessage,
        JSON.stringify(testContext),
        'health-check-session'
      ];

      // Test sheet access
      let sheetAccessible = false;
      try {
        const sheet = this._getSpreadsheet().getSheetByName(SHEET_NAMES.ACTIVITY);
        sheetAccessible = sheet !== null;
      } catch (error) {
        // Sheet not accessible
      }

      return {
        healthy: true,
        sheetAccessible,
        batchedLogsCount: this.batchedLogs.length,
        currentLogLevel: Object.keys(this.logLevels).find(
          key => this.logLevels[key] === this.currentLogLevel
        ),
        timestamp: TimeZoneAwareDate.now()
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: TimeZoneAwareDate.now()
      };
    }
  }

  /**
   * Log metrics for monitoring
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} tags - Additional tags for the metric
   */
  metric(name, value, tags = {}) {
    const context = {
      metric: true,
      metricName: name,
      metricValue: value,
      metricTags: tags,
      timestamp: TimeZoneAwareDate.now()
    };
    this._log('INFO', 'Metrics', `Metric: ${name} = ${value}`, context);
  }

  /**
   * Log audit events for compliance
   * @param {string} action - Action being audited
   * @param {Object} details - Audit details
   */
  audit(action, details = {}) {
    const context = {
      audit: true,
      auditAction: action,
      auditDetails: details,
      timestamp: TimeZoneAwareDate.now(),
      sessionId: Utilities.getUuid()
    };
    this._log('INFO', 'Audit', `Audit: ${action}`, context);
  }

  /**
   * Batch log multiple entries at once
   * @param {Array} logs - Array of log entries {level, component, message, context}
   */
  batch(logs) {
    if (!Array.isArray(logs) || logs.length === 0) {
      return;
    }

    try {
      for (const logEntry of logs) {
        const { level = 'INFO', component = 'Batch', message = '', context = {} } = logEntry;
        this._log(level, component, message, context);
      }
    } catch (error) {
      this._log('ERROR', 'SmartLogger', 'Failed to process batch logs', {
        error: error.message,
        batchSize: logs.length
      });
    }
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if all basic functionality works
   */
  selfTest() {
    try {
      // Test 1: Log level management
      const originalLevel = this.currentLogLevel;
      this.setLogLevel('DEBUG');
      if (this.currentLogLevel !== this.logLevels.DEBUG) {
        this.setLogLevel(Object.keys(this.logLevels).find(k => this.logLevels[k] === originalLevel));
        return false;
      }
      this.setLogLevel(Object.keys(this.logLevels).find(k => this.logLevels[k] === originalLevel));

      // Test 2: Basic logging functionality (INFO level to avoid being filtered)
      const testMessage = 'SmartLogger self-test';
      const testContext = { test: true, selfTest: true };

      try {
        this.info('SelfTest', testMessage, testContext);
      } catch (logError) {
        return false;
      }

      // Test 3: Stats functionality
      const stats = this.getStats();
      if (!stats || typeof stats.batchedLogsCount !== 'number') {
        return false;
      }

      // Test 4: Batch size management
      const originalBatchSize = this.maxBatchSize;
      this.setBatchSize(25);
      if (this.maxBatchSize !== 25) {
        return false;
      }
      this.setBatchSize(originalBatchSize);

      // Test 5: Suppression window management
      const originalWindow = this.suppressionWindow;
      this.setSuppressionWindow(60);
      if (this.suppressionWindow !== 60) {
        return false;
      }
      this.setSuppressionWindow(originalWindow);

      // Test 6: Health check functionality
      const health = this.healthCheck();
      if (!health || typeof health.healthy !== 'boolean') {
        return false;
      }

      return true;
    } catch (error) {
      // Self-test should not throw errors
      Logger.log(`SmartLogger self-test failed: ${error.message}`);
      return false;
    }
  }
}

/**
 * MOH TIME OS v2.0 - ERROR HANDLER WITH CIRCUIT BREAKER
 *
 * Implements circuit breaker pattern for external service resilience.
 * Provides intelligent retry logic with exponential backoff and jitter.
 * Handles graceful degradation when services are unavailable.
 */
class ErrorHandler {
  constructor(logger) {
    if (!logger) {
      throw new Error('ErrorHandler: logger parameter is required');
    }
    this.logger = logger;
    this.circuitBreakers = new Map();
    this.retryConfigs = new Map();

    // Default circuit breaker configuration
    this.defaultCircuitConfig = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      halfOpenMaxCalls: 3
    };

    // Default retry configuration
    this.defaultRetryConfig = {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      jitterFactor: 0.1
    };
  }

  /**
   * Execute operation with circuit breaker protection
   * @param {string} serviceName - Name of the service
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Configuration options
   * @returns {Promise|any} Operation result
   */
  executeWithCircuitBreaker(serviceName, operation, options = {}) {
    const circuitBreaker = this._getOrCreateCircuitBreaker(serviceName, options.circuitConfig);

    // Check circuit breaker state
    const state = circuitBreaker.getState();

    if (state === 'OPEN') {
      const error = new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
      error.circuitBreakerState = 'OPEN';
      throw error;
    }

    if (state === 'HALF_OPEN' && circuitBreaker.halfOpenCallCount >= circuitBreaker.config.halfOpenMaxCalls) {
      const error = new Error(`Circuit breaker HALF_OPEN call limit exceeded for service: ${serviceName}`);
      error.circuitBreakerState = 'HALF_OPEN_LIMIT_EXCEEDED';
      throw error;
    }

    try {
      // Execute the operation
      const result = operation();

      // Operation succeeded - record success
      circuitBreaker.recordSuccess();

      return result;

    } catch (error) {
      // Operation failed - record failure
      circuitBreaker.recordFailure();

      // Add circuit breaker context to error
      error.circuitBreakerState = circuitBreaker.getState();
      error.serviceName = serviceName;

      throw error;
    }
  }

  /**
   * Execute operation with retry logic
   * @param {Function} operation - Operation to execute
   * @param {Object} retryConfig - Retry configuration
   * @returns {any} Operation result
   */
  executeWithRetry(operation, retryConfig = {}) {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return operation();
      } catch (error) {
        lastError = error;

        // Don't retry if this is the last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Check if error is retryable
        if (!this._isRetryableError(error)) {
          this.logger.debug('ErrorHandler', 'Error is not retryable, aborting retry', {
            error: error.message,
            attempt: attempt
          });
          break;
        }

        // NO SLEEP: Retries happen instantly
        // Network latency provides natural spacing for API calls
        // Blocking sleep wastes execution quota
        this.logger.debug('ErrorHandler', `Retrying operation (attempt ${attempt + 1}/${config.maxAttempts}) - instant retry`, {
          error: error.message
        });
      }
    }

    // All retries exhausted
    lastError.retryAttempts = config.maxAttempts;
    throw lastError;
  }

  /**
   * Backward-compatible retry helper used by legacy services
   */
  withRetry(operation, contextName = 'operation', retryConfig = {}) {
    try {
      return this.executeWithRetry(operation, retryConfig);
    } catch (error) {
      if (this.logger && typeof this.logger.error === 'function') {
        this.logger.error('ErrorHandler', `${contextName} failed after retries`, {
          error: error.message,
          context: contextName
        });
      }
      throw error;
    }
  }


  /**
   * Execute operation with both circuit breaker and retry protection
   * @param {string} serviceName - Name of the service
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Configuration options
   * @returns {any} Operation result
   */
  executeWithProtection(serviceName, operation, options = {}) {
    const retryConfig = { ...this.defaultRetryConfig, ...options.retryConfig };

    return this.executeWithRetry(() => {
      return this.executeWithCircuitBreaker(serviceName, operation, options);
    }, retryConfig);
  }


  /**
   * Get or create circuit breaker for a service
   * @param {string} serviceName - Name of the service
   * @param {Object} config - Circuit breaker configuration
   * @returns {Object} Circuit breaker instance
   * @private
   */
  _getOrCreateCircuitBreaker(serviceName, config = {}) {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitConfig = { ...this.defaultCircuitConfig, ...config };
      this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName, circuitConfig, this.logger));
    }
    return this.circuitBreakers.get(serviceName);
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} Whether the error is retryable
   * @private
   */
  _isRetryableError(error) {
    // Don't retry validation errors
    if (error instanceof ValidationError) {
      return false;
    }

    // Don't retry authentication errors
    if (error instanceof AuthenticationError) {
      return false;
    }

    // Don't retry configuration errors
    if (error instanceof ConfigurationError) {
      return false;
    }

    // Retry network errors, timeouts, and API errors
    if (error instanceof NetworkError ||
        error instanceof TimeoutError ||
        error instanceof ApiError) {
      return true;
    }

    // Default: retry unknown errors
    return true;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   * @param {number} attempt - Current attempt number (1-based)
   * @param {Object} config - Retry configuration
   * @returns {number} Delay in milliseconds
   * @private
   */
  _calculateRetryDelay(attempt, config) {
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
    const jitter = Math.random() * config.jitterFactor * cappedDelay;
    return Math.round(cappedDelay + jitter);
  }

  /**
   * Get circuit breaker status for all services
   * @returns {Object} Status of all circuit breakers
   */
  getCircuitBreakerStatus() {
    const status = {};

    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      status[serviceName] = {
        state: circuitBreaker.getState(),
        failureCount: circuitBreaker.failureCount,
        lastFailureTime: circuitBreaker.lastFailureTime,
        halfOpenCallCount: circuitBreaker.halfOpenCallCount
      };
    }

    return status;
  }

  /**
   * Reset circuit breaker for a specific service
   * @param {string} serviceName - Name of the service
   */
  resetCircuitBreaker(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      this.logger.info('ErrorHandler', 'Circuit breaker reset', { serviceName });
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
    }
    this.logger.info('ErrorHandler', 'All circuit breakers reset');
  }

  /**
   * Execute operation with adaptive retry based on error type
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Retry options
   * @returns {any} Operation result
   */
  executeWithAdaptiveRetry(operation, options = {}) {
    const baseConfig = { ...this.defaultRetryConfig, ...options };
    let lastError;
    let currentDelay = baseConfig.baseDelayMs;

    for (let attempt = 1; attempt <= baseConfig.maxAttempts; attempt++) {
      try {
        return operation();
      } catch (error) {
        lastError = error;

        if (attempt === baseConfig.maxAttempts) {
          break;
        }

        if (!this._isRetryableError(error)) {
          break;
        }

        // Adaptive delay based on error type
        if (error.message && error.message.includes('quota')) {
          // Longer delay for quota errors
          currentDelay = Math.min(currentDelay * 3, 30000);
        } else if (error.message && error.message.includes('timeout')) {
          // Moderate delay for timeout errors
          currentDelay = Math.min(currentDelay * 2, 10000);
        } else {
          // Standard exponential backoff
          currentDelay = Math.min(currentDelay * 1.5, baseConfig.maxDelayMs);
        }

        // NO SLEEP: Instant retries (network latency provides natural spacing)
        // Adaptive retry still adjusts strategy based on error type, but without blocking delay
        this.logger.debug('ErrorHandler', `Adaptive retry attempt ${attempt + 1}/${baseConfig.maxAttempts} - instant retry`, {
          error: error.message,
          errorType: error.constructor.name,
          adaptiveStrategy: error.message && error.message.includes('quota') ? 'quota-aware' :
                           error.message && error.message.includes('timeout') ? 'timeout-aware' : 'standard'
        });
      }
    }

    lastError.retryAttempts = baseConfig.maxAttempts;
    lastError.retryStrategy = 'adaptive';
    throw lastError;
  }

  /**
   * Execute operation with fallback strategies
   * @param {string} serviceName - Name of the service
   * @param {Function} primaryOperation - Primary operation to execute
   * @param {Function} fallbackOperation - Fallback operation if primary fails
   * @param {Object} options - Configuration options
   * @returns {any} Operation result
   */
  executeWithFallback(serviceName, primaryOperation, fallbackOperation, options = {}) {
    try {
      return this.executeWithProtection(serviceName, primaryOperation, options);
    } catch (primaryError) {
      this.logger.warn('ErrorHandler', 'Primary operation failed, attempting fallback', {
        serviceName,
        primaryError: primaryError.message,
        circuitBreakerState: primaryError.circuitBreakerState
      });

      try {
        const result = fallbackOperation();
        this.logger.info('ErrorHandler', 'Fallback operation succeeded', { serviceName });
        return result;
      } catch (fallbackError) {
        this.logger.error('ErrorHandler', 'Both primary and fallback operations failed', {
          serviceName,
          primaryError: primaryError.message,
          fallbackError: fallbackError.message
        });

        // Combine error information
        const combinedError = new Error(`Primary: ${primaryError.message}; Fallback: ${fallbackError.message}`);
        combinedError.primaryError = primaryError;
        combinedError.fallbackError = fallbackError;
        combinedError.serviceName = serviceName;
        throw combinedError;
      }
    }
  }

  /**
   * Execute batch operations with partial failure tolerance
   * @param {string} serviceName - Name of the service
   * @param {Array} items - Items to process
   * @param {Function} operation - Operation to execute per item
   * @param {Object} options - Configuration options
   * @returns {Object} Results with success/failure breakdown
   */
  executeBatchWithTolerance(serviceName, items, operation, options = {}) {
    const { continueOnFailure = true, maxFailureRate = 0.5 } = options;
    const results = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const result = this.executeWithProtection(serviceName, () => operation(item), options);
        results.successful.push({ item, result, index: i });
        results.totalSuccessful++;
      } catch (error) {
        results.failed.push({ item, error, index: i });
        results.totalFailed++;

        // Check if failure rate is too high
        const currentFailureRate = results.totalFailed / (results.totalSuccessful + results.totalFailed);
        if (!continueOnFailure || (currentFailureRate > maxFailureRate && results.totalProcessed >= 10)) {
          this.logger.error('ErrorHandler', 'Batch processing stopped due to high failure rate', {
            serviceName,
            currentFailureRate,
            maxFailureRate,
            processed: results.totalProcessed,
            failed: results.totalFailed
          });
          break;
        }
      }
      results.totalProcessed++;
    }

    this.logger.info('ErrorHandler', 'Batch processing completed', {
      serviceName,
      totalItems: items.length,
      processed: results.totalProcessed,
      successful: results.totalSuccessful,
      failed: results.totalFailed,
      successRate: results.totalSuccessful / results.totalProcessed
    });

    return results;
  }

  /**
   * Handle graceful degradation for a service
   * @param {string} serviceName - Name of the service
   * @param {Function} operation - Operation to execute
   * @param {Function} degradedOperation - Degraded mode operation
   * @param {Object} options - Configuration options
   * @returns {any} Operation result
   */
  executeWithGracefulDegradation(serviceName, operation, degradedOperation, options = {}) {
    const circuitBreaker = this._getOrCreateCircuitBreaker(serviceName, options.circuitConfig);

    // If circuit breaker is open, use degraded mode immediately
    if (circuitBreaker.getState() === 'OPEN') {
      this.logger.info('ErrorHandler', 'Service degraded - using degraded operation', {
        serviceName,
        circuitBreakerState: 'OPEN'
      });
      return degradedOperation();
    }

    try {
      return this.executeWithProtection(serviceName, operation, options);
    } catch (error) {
      // If the service fails and circuit breaker opens, switch to degraded mode
      if (error.circuitBreakerState === 'OPEN') {
        this.logger.warn('ErrorHandler', 'Service degraded due to circuit breaker - switching to degraded mode', {
          serviceName,
          error: error.message
        });
        return degradedOperation();
      }
      throw error;
    }
  }

  /**
   * MISSING METHOD: Get service status (called from multiple locations)
   * @param {string} serviceName - Name of the service
   * @returns {boolean} True if service is healthy
   */
  getServiceStatus(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      return true; // Unknown services are assumed healthy
    }
    return circuitBreaker.getState() === 'CLOSED';
  }

  /**
   * Get overall health status of the error handling system
   * @returns {Object} Health status information
   */
  getHealth() {
    try {
      const circuitBreakerStatuses = this.getCircuitBreakerStatus();
      const totalBreakers = Object.keys(circuitBreakerStatuses).length;
      const openBreakers = Object.values(circuitBreakerStatuses).filter(status => status.state === 'OPEN').length;
      const halfOpenBreakers = Object.values(circuitBreakerStatuses).filter(status => status.state === 'HALF_OPEN').length;

      const healthStatus = {
        healthy: openBreakers === 0,
        totalCircuitBreakers: totalBreakers,
        openCircuitBreakers: openBreakers,
        halfOpenCircuitBreakers: halfOpenBreakers,
        circuitBreakerStatuses: circuitBreakerStatuses,
        selfTestPassed: this.selfTest()
      };

      return healthStatus;
    } catch (error) {
      this.logger.error('ErrorHandler', `Health check failed: ${error.message}`);
      return {
        healthy: false,
        error: error.message,
        selfTestPassed: false
      };
    }
  }

  /**
   * Record error tracking metrics
   * @param {string} metric - Metric name (e.g., 'error_count', 'failure_rate')
   * @param {number} value - Metric value
   */
  recordMetric(metric, value) {
    try {
      const context = {
        metric: metric,
        value: value,
        timestamp: Date.now(),
        source: 'ErrorHandler'
      };

      this.logger.info('ErrorHandler', `Metric recorded: ${metric} = ${value}`, context);

      // Log as metric if SmartLogger supports it
      if (this.logger && typeof this.logger.metric === 'function') {
        this.logger.metric(metric, value, { source: 'ErrorHandler' });
      }
    } catch (error) {
      this.logger.error('ErrorHandler', 'Failed to record metric', {
        metric,
        value,
        error: error.message
      });
    }
  }

  /**
   * Get circuit breaker state for a specific service
   * @param {string} service - Service name
   * @returns {string} Circuit breaker state (CLOSED, OPEN, HALF_OPEN, or UNKNOWN)
   */
  getCircuitState(service) {
    try {
      if (!service || typeof service !== 'string') {
        return 'UNKNOWN';
      }

      const circuitBreaker = this.circuitBreakers.get(service);
      if (!circuitBreaker) {
        return 'UNKNOWN';
      }

      return circuitBreaker.getState();
    } catch (error) {
      this.logger.error('ErrorHandler', 'Failed to get circuit state', {
        service,
        error: error.message
      });
      return 'UNKNOWN';
    }
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if all basic functionality works
   */
  selfTest() {
    try {
      this.logger.info('ErrorHandler', 'Running self-test');

      // Test 1: Acquire and release lock
      const testServiceName = 'selftest_service';
      const breaker = this._getOrCreateCircuitBreaker(testServiceName);

      const result = this.executeWithCircuitBreaker(testServiceName, () => 'ok');
      if (result !== 'ok') {
        return false;
      }

      if (!breaker || typeof breaker.getState !== 'function') {
        return false;
      }

      if (this.logger && typeof this.logger.debug === 'function') {
        this.logger.debug('ErrorHandler', 'Self-test heartbeat', { state: breaker.getState() });
      }

      return true;
    } catch (error) {
      this.logger.error('ErrorHandler', `Self-test failed: ${error.message}`);
      return false;
    }
  }
}

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  constructor(serviceName, config, logger) {
    this.serviceName = serviceName;
    this.config = config;
    this.logger = logger;
    this.reset();
  }

  /**
   * Get current circuit breaker state
   * @returns {string} Current state: CLOSED, OPEN, or HALF_OPEN
   */
  getState() {
    const now = Date.now();

    if (this.state === 'OPEN') {
      // Check if recovery timeout has passed
      if (now - this.lastFailureTime >= this.config.recoveryTimeout) {
        this._transitionToHalfOpen();
      }
    }

    return this.state;
  }

  /**
   * Record a successful operation
   */
  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this._transitionToClosed();
    }

    // Reset failure count on success
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Record a failed operation
   */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this._transitionToOpen();
    } else if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
      this._transitionToOpen();
    }
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCallCount = 0;
  }

  /**
   * Transition to CLOSED state
   * @private
   */
  _transitionToClosed() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenCallCount = 0;

    this.logger.info('CircuitBreaker', 'Transitioned to CLOSED', {
      serviceName: this.serviceName
    });
  }

  /**
   * Transition to OPEN state
   * @private
   */
  _transitionToOpen() {
    this.state = 'OPEN';
    this.halfOpenCallCount = 0;

    this.logger.warn('CircuitBreaker', 'Transitioned to OPEN', {
      serviceName: this.serviceName,
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold
    });
  }

  /**
   * Transition to HALF_OPEN state
   * @private
   */
  _transitionToHalfOpen() {
    this.state = 'HALF_OPEN';
    this.halfOpenCallCount = 0;

    this.logger.info('CircuitBreaker', 'Transitioned to HALF_OPEN', {
      serviceName: this.serviceName
    });
  }
}

/**
 * MOH TIME OS v2.0 - DISTRIBUTED LOCK MANAGER
 *
 * Provides distributed locking with stale lock detection and automatic cleanup.
 * Uses PropertiesService for persistent lock tracking across executions.
 * Prevents lock contention and automatically releases stale locks.
 */
class DistributedLockManager {
  constructor(persistentStore, logger) {
    this.persistentStore = persistentStore;
    this.logger = logger || console;
    this.lockPrefix = 'dlock_';
    this.staleLockThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.metrics = {
      acquireAttempts: 0,
      acquireSuccesses: 0,
      acquireFailures: 0,
      releases: 0,
      staleLocksCleanedUp: 0,
      contentionEvents: 0
    };
  }

  /**
   * Try to acquire a distributed lock
   * @param {string} lockName - Name of the lock (e.g., 'triggerEmailProcessing')
   * @param {number} timeoutMs - Maximum time to wait for lock in milliseconds
   * @param {string} holderId - Unique identifier for the lock holder (optional, will generate UUID)
   * @returns {Object|null} Lock handle object or null if failed
   */
  tryAcquireLock(lockName, timeoutMs, holderId) {
    this.metrics.acquireAttempts++;

    if (!lockName || typeof lockName !== 'string') {
      this.logger.error('DistributedLockManager', 'Invalid lock name', { lockName });
      this.metrics.acquireFailures++;
      return null;
    }

    const holder = holderId || Utilities.getUuid();
    const lockKey = this._getLockKey(lockName);
    const startTime = Date.now();
    const deadline = startTime + timeoutMs;

    try {
      // Clean up stale locks first
      this._cleanupStaleLock(lockKey, lockName);

      // Try to acquire lock with polling
      while (Date.now() < deadline) {
        const existingLock = this.persistentStore.get(lockKey);

        if (!existingLock) {
          // No lock exists, try to acquire it
          const lockData = {
            holder: holder,
            lockName: lockName,
            acquiredAt: Date.now(),
            expiresAt: Date.now() + this.staleLockThreshold
          };

          try {
            this.persistentStore.set(lockKey, lockData);

            // Verify we actually got the lock (race condition check)
            const verifyLock = this.persistentStore.get(lockKey);
            if (verifyLock && verifyLock.holder === holder) {
              this.metrics.acquireSuccesses++;
              this.logger.debug('DistributedLockManager', 'Lock acquired', {
                lockName: lockName,
                holder: holder,
                attemptDuration: Date.now() - startTime
              });

              return {
                lockName: lockName,
                holder: holder,
                lockKey: lockKey,
                acquiredAt: lockData.acquiredAt
              };
            }
          } catch (error) {
            this.logger.warn('DistributedLockManager', 'Failed to set lock', {
              lockName: lockName,
              error: error.message
            });
          }
        }

        // Lock is held by someone else - fail fast
        // NO SLEEP: GAS execution context is single-threaded, waiting won't help
        // If lock exists, it means another execution is active - respect that
        this.metrics.contentionEvents++;
      }

      // Timeout reached
      this.metrics.acquireFailures++;
      this.logger.warn('DistributedLockManager', 'Lock acquisition timeout', {
        lockName: lockName,
        timeoutMs: timeoutMs,
        holder: holder
      });

      return null;

    } catch (error) {
      this.metrics.acquireFailures++;
      this.logger.error('DistributedLockManager', 'Lock acquisition error', {
        lockName: lockName,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Release a distributed lock
   * @param {Object} lockHandle - Lock handle returned by tryAcquireLock
   * @returns {boolean} True if successfully released
   */
  releaseLock(lockHandle) {
    if (!lockHandle || !lockHandle.lockKey || !lockHandle.holder) {
      this.logger.warn('DistributedLockManager', 'Invalid lock handle for release', { lockHandle });
      return false;
    }

    try {
      const existingLock = this.persistentStore.get(lockHandle.lockKey);

      // Verify we own the lock before releasing
      if (existingLock && existingLock.holder === lockHandle.holder) {
        this.persistentStore.delete(lockHandle.lockKey);
        this.metrics.releases++;

        this.logger.debug('DistributedLockManager', 'Lock released', {
          lockName: lockHandle.lockName,
          holder: lockHandle.holder,
          holdDuration: Date.now() - lockHandle.acquiredAt
        });

        return true;
      } else {
        this.logger.warn('DistributedLockManager', 'Lock release failed - not owner', {
          lockName: lockHandle.lockName,
          currentHolder: existingLock ? existingLock.holder : 'none'
        });
        return false;
      }

    } catch (error) {
      this.logger.error('DistributedLockManager', 'Lock release error', {
        lockName: lockHandle.lockName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Check if a lock is currently held
   * @param {string} lockName - Name of the lock
   * @returns {boolean} True if lock is held
   */
  isLocked(lockName) {
    const lockKey = this._getLockKey(lockName);
    const existingLock = this.persistentStore.get(lockKey);

    if (!existingLock) {
      return false;
    }

    // Check if lock is stale
    if (Date.now() > existingLock.expiresAt) {
      this._cleanupStaleLock(lockKey, lockName);
      return false;
    }

    return true;
  }

  /**
   * Force release a lock (use with caution)
   * @param {string} lockName - Name of the lock
   * @returns {boolean} True if successfully released
   */
  forceRelease(lockName) {
    const lockKey = this._getLockKey(lockName);

    try {
      const existingLock = this.persistentStore.get(lockKey);
      if (existingLock) {
        this.persistentStore.delete(lockKey);
        this.logger.warn('DistributedLockManager', 'Lock force-released', {
          lockName: lockName,
          holder: existingLock.holder
        });
        return true;
      }
      return false;

    } catch (error) {
      this.logger.error('DistributedLockManager', 'Force release error', {
        lockName: lockName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get lock key for PropertiesService
   * @param {string} lockName - Lock name
   * @returns {string} Prefixed lock key
   * @private
   */
  _getLockKey(lockName) {
    return this.lockPrefix + lockName;
  }

  /**
   * Clean up stale lock if it exists
   * @param {string} lockKey - Lock key in PropertiesService
   * @param {string} lockName - Human-readable lock name for logging
   * @private
   */
  _cleanupStaleLock(lockKey, lockName) {
    try {
      const existingLock = this.persistentStore.get(lockKey);

      if (existingLock && Date.now() > existingLock.expiresAt) {
        this.persistentStore.delete(lockKey);
        this.metrics.staleLocksCleanedUp++;

        this.logger.warn('DistributedLockManager', 'Stale lock cleaned up', {
          lockName: lockName,
          holder: existingLock.holder,
          acquiredAt: existingLock.acquiredAt,
          age: Math.round((Date.now() - existingLock.acquiredAt) / 1000) + 's'
        });
      }

    } catch (error) {
      this.logger.error('DistributedLockManager', 'Stale lock cleanup error', {
        lockName: lockName,
        error: error.message
      });
    }
  }

  /**
   * Get all active locks
   * @returns {Array} Array of active lock information
   */
  getActiveLocks() {
    try {
      const allKeys = this.persistentStore.scan(this.lockPrefix + '*');
      const activeLocks = [];

      allKeys.forEach(key => {
        try {
          const lockData = this.persistentStore.get(key);
          if (lockData && Date.now() <= lockData.expiresAt) {
            activeLocks.push({
              lockName: lockData.lockName,
              holder: lockData.holder,
              acquiredAt: lockData.acquiredAt,
              age: Math.round((Date.now() - lockData.acquiredAt) / 1000),
              ttl: Math.round((lockData.expiresAt - Date.now()) / 1000)
            });
          }
        } catch (error) {
          // Skip invalid locks
        }
      });

      return activeLocks;

    } catch (error) {
      this.logger.error('DistributedLockManager', 'Failed to get active locks', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get lock metrics
   * @returns {Object} Lock metrics and statistics
   */
  getMetrics() {
    const totalAttempts = this.metrics.acquireAttempts;
    const successRate = totalAttempts > 0 ?
      Math.round((this.metrics.acquireSuccesses / totalAttempts) * 100) : 0;
    const contentionRate = totalAttempts > 0 ?
      Math.round((this.metrics.contentionEvents / totalAttempts) * 100) : 0;

    return {
      ...this.metrics,
      successRate: successRate + '%',
      contentionRate: contentionRate + '%',
      activeLocks: this.getActiveLocks().length
    };
  }

  /**
   * Health check for distributed lock manager
   * @returns {boolean} True if healthy
   */
  healthCheck() {
    try {
      const testLockName = 'health_check_lock_' + Date.now();
      const lockHandle = this.tryAcquireLock(testLockName, 5000);

      if (!lockHandle) {
        return false;
      }

      const released = this.releaseLock(lockHandle);
      return released;

    } catch (error) {
      this.logger.error('DistributedLockManager', 'Health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Clean up all expired locks
   * @returns {number} Number of locks cleaned up
   */
  cleanupAllStaleLocks() {
    let cleanedCount = 0;

    try {
      const allKeys = this.persistentStore.scan(this.lockPrefix + '*');

      allKeys.forEach(key => {
        try {
          const lockData = this.persistentStore.get(key);
          if (lockData && Date.now() > lockData.expiresAt) {
            this.persistentStore.delete(this._getLockKey(lockData.lockName));
            cleanedCount++;
          }
        } catch (error) {
          // Skip invalid locks
        }
      });

      if (cleanedCount > 0) {
        this.logger.info('DistributedLockManager', 'Batch cleanup completed', {
          cleaned: cleanedCount
        });
        this.metrics.staleLocksCleanedUp += cleanedCount;
      }

      return cleanedCount;

    } catch (error) {
      this.logger.error('DistributedLockManager', 'Batch cleanup error', {
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if all tests pass
   */
  selfTest() {
    try {
      this.logger.info('DistributedLockManager', 'Running self-test');

      // Test 1: Acquire and release lock
      const testLock1 = this.tryAcquireLock('selftest_lock1', 5000);
      if (!testLock1) {
        throw new Error('Failed to acquire test lock 1');
      }

      const released1 = this.releaseLock(testLock1);
      if (!released1) {
        throw new Error('Failed to release test lock 1');
      }

      // Test 2: Lock contention
      const testLock2a = this.tryAcquireLock('selftest_lock2', 5000);
      if (!testLock2a) {
        throw new Error('Failed to acquire test lock 2a');
      }

      const testLock2b = this.tryAcquireLock('selftest_lock2', 1000);
      if (testLock2b) {
        throw new Error('Lock contention test failed - acquired same lock twice');
      }

      const released2 = this.releaseLock(testLock2a);
      if (!released2) {
        throw new Error('Failed to release test lock 2');
      }

      // Test 3: Stale lock cleanup
      const testLock3 = this.tryAcquireLock('selftest_lock3', 5000);
      if (!testLock3) {
        throw new Error('Failed to acquire test lock 3');
      }

      // Manually expire the lock
      const lockKey3 = this._getLockKey('selftest_lock3');
      const lockData3 = this.persistentStore.get(lockKey3);
      lockData3.expiresAt = Date.now() - 1000; // 1 second in the past
      this.persistentStore.set(lockKey3, lockData3);

      // Try to acquire again - should succeed due to cleanup
      const testLock3b = this.tryAcquireLock('selftest_lock3', 5000);
      if (!testLock3b) {
        throw new Error('Stale lock cleanup test failed');
      }

      this.releaseLock(testLock3b);

      this.logger.info('DistributedLockManager', 'Self-test passed', {
        metrics: this.getMetrics()
      });

      return true;

    } catch (error) {
      this.logger.error('DistributedLockManager', 'Self-test failed', {
        error: error.message
      });
      return false;
    }
  }
}

/**
 * MOH TIME OS v2.0 - CONFIGURATION MANAGER
 *
 * Self-healing configuration system with graceful degradation.
 * Loads configuration from sheet with fallback to hardcoded defaults.
 * Includes caching, validation, and schema support.
 */
const DEFAULT_CONFIG_DATA = Object.freeze([
  ['TIMEZONE', 'Asia/Dubai'],
  ['ENABLE_EMAIL_PROCESSING', 'true'],
  ['ENABLE_CALENDAR_SYNC', 'false'],
  ['ENABLE_AUTO_SCHEDULING', 'false'],
  ['MAX_BATCH_SIZE', String(CONSTANTS.DEFAULT_BATCH_SIZE)],
  ['CACHE_TTL_MINUTES', '5'],
  ['EMAIL_BATCH_SIZE', String(CONSTANTS.EMAIL_BATCH_SIZE)],
  ['EMAIL_PROCESSING_LABEL', 'MOH-Time-OS'],
  ['SYSTEM_EMAIL', 'noreply@script.google.com'],
  ['ARCHIVE_SPREADSHEET_ID', ''],
  ['ARCHIVE_RETENTION_MONTHS', '12'],
  ['ZERO_TRUST_MAX_DAYS_BACK', '30'],
  ['ZERO_TRUST_BATCH_SIZE', '100'],
  ['ZERO_TRUST_MIN_REPUTATION_SCORE', '0.3'],
  ['SCHEDULER_INTERVAL_MINUTES', '15'],
  ['CONTEXT_MATCH_BONUS', '0.25']
]);

class HardenedConfigManager {
  constructor(cache, persistentStore, batchOperations, logger) {
    this.cache = cache;
    this.persistentStore = persistentStore;
    this.batchOperations = batchOperations;
    this.logger = logger;
    this.configInitialized = false;
    this.isUsingDefaults = false;
    this.testConfigOverrides = null;
  }

  /**
   * Ensures configuration is loaded, now with lazy loading on first use.
   * @private
   */
  _ensureConfigurationLoaded() {
    if (this.configInitialized) {
      return;
    }
    try {
      this._loadConfigurationFromSheet();
    } catch (error) {
      this._handleConfigurationFailure(error);
    }
    this.configInitialized = true;
  }

  /**
   * The core method to retrieve a raw config value. Now includes the lazy-loading check.
   * @private
   */
  _getRawConfig(key) {
    if (!this.configInitialized) {
      this._ensureConfigurationLoaded();
    }
    if (this.testConfigOverrides && this.testConfigOverrides.has(key)) {
      return this.testConfigOverrides.get(key);
    }
    try {
      return this.persistentStore.get(key);
    } catch (error) {
      this.logger.error('System', `ConfigManager: Failed to get config '${key}': ${error.message || error}`);
      return null;
    }
  }

  /**
   * Get configuration value with caching.
   */
  get(key, defaultValue = null) {
    this._ensureConfigurationLoaded();
    const cacheKey = `config_${key}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const value = this._getRawConfig(key);
    if (value !== null && value !== undefined) {
      this.cache.set(cacheKey, value, 300); // 5 minute cache
      return value;
    }
    return defaultValue;
  }

  /**
   * Get string configuration value.
   */
  getString(key, defaultValue = '') {
    const value = this.get(key, defaultValue);
    return String(value);
  }

  /**
   * Get boolean configuration value.
   */
  getBoolean(key, defaultValue = false) {
    const stringValue = this.getString(key, defaultValue.toString()).toLowerCase();
    return stringValue === 'true' || stringValue === '1' || stringValue === 'yes';
  }

  /**
   * Get array configuration value.
   */
  getArray(key, defaultValue = []) {
    const stringValue = this.getString(key, JSON.stringify(defaultValue));
    try {
      const parsed = JSON.parse(stringValue);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (error) {
      this.logger.error('HardenedConfigManager', 'JSON parse failed for key', { key, error: error.message });
      return defaultValue;
    }
  }

  /**
   * Get number configuration value with validation.
   */
  getNumber(key, defaultValue = 0, constraints = {}) {
    const stringValue = this.getString(key, defaultValue.toString());
    const rawValue = parseFloat(stringValue);
    if (isNaN(rawValue)) {
      return defaultValue;
    }
    if (!constraints.min && !constraints.max) {
      return rawValue;
    }
    let clampedValue = rawValue;
    let wasModified = false;
    if (constraints.min !== undefined && rawValue < constraints.min) {
      clampedValue = constraints.min;
      wasModified = true;
    }
    if (constraints.max !== undefined && rawValue > constraints.max) {
      clampedValue = constraints.max;
      wasModified = true;
    }
    if (wasModified) {
      this.logger.warn('HardenedConfigManager', 'Configuration value clamped', {
        key, original_value: rawValue, clamped_value: clampedValue, constraints
      });
    }
    return clampedValue;
  }

  /**
   * Get JSON configuration value with caching.
   */
  getJSON(key, defaultValue = {}) {
    const stringValue = this.getString(key, JSON.stringify(defaultValue));
    try {
      return JSON.parse(stringValue);
    } catch (error) {
      this.logger.error('HardenedConfigManager', 'JSON parse failed for key', { key, error: error.message });
      return defaultValue;
    }
  }

  /**
   * Sets a string configuration value.
   */
  setString(key, value) {
    try {
      this.persistentStore.set(key, value);
      this.cache.delete(`config_${key}`);
    } catch (error) {
      this.logger.error('System', `ConfigManager: Failed to set config '${key}': ${error.message || error}`);
    }
  }

  /**
   * Set boolean configuration value.
   */
  setBoolean(key, value) {
    this.setString(key, value ? 'true' : 'false');
  }

  /**
   * Set number configuration value.
   */
  setNumber(key, value) {
    this.setString(key, String(value));
  }

  /**
   * Set array configuration value.
   */
  setArray(key, value) {
    if (!Array.isArray(value)) {
      throw new Error('Value must be an array');
    }
    this.setString(key, JSON.stringify(value));
  }

  /**
   * Set JSON configuration value.
   */
  setJSON(key, value) {
    this.setString(key, JSON.stringify(value));
  }

  /**
   * Load configuration from APPSHEET_CONFIG sheet to PersistentStore.
   * @private
   */
  _loadConfigurationFromSheet() {
    try {
      const configData = this.batchOperations.getRowsByFilter(SHEET_NAMES.APPSHEET_CONFIG, {});
      if (configData.length === 0) {
        throw new Error('APPSHEET_CONFIG sheet is empty or not found.');
      }
      const headers = this.batchOperations.getHeaders(SHEET_NAMES.APPSHEET_CONFIG);
      const configMap = {};

      // Load hardcoded defaults first
      DEFAULT_CONFIG_DATA.forEach(row => {
        configMap[row[0]] = row[1];
      });

      // Override with values from the sheet
      const configKeyIndex = headers.indexOf('config_key') !== -1 ?
        headers.indexOf('config_key') : headers.indexOf('key');
      const configValueIndex = headers.indexOf('config_value') !== -1 ?
        headers.indexOf('config_value') : headers.indexOf('value');

      if (configKeyIndex === -1 || configValueIndex === -1) {
        throw new Error('APPSHEET_CONFIG sheet missing required columns');
      }

      for (const row of configData) {
        const configKey = row[configKeyIndex];
        const configValue = row[configValueIndex];
        if (configKey) {
          configMap[configKey] = configValue;
        }
      }

      for (const [key, value] of Object.entries(configMap)) {
        this.persistentStore.set(key, value);
      }

      this.isUsingDefaults = false;
      this.logger.info('HardenedConfigManager', 'Configuration loaded successfully from sheet.');
    } catch (error) {
      this.logger.error('HardenedConfigManager', `Failed to load configuration from sheet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle configuration loading failure with graceful degradation.
   * @private
   */
  _handleConfigurationFailure(originalError) {
    try {
      // Use the globally defined DEFAULT_CONFIG_DATA constant
      for (const row of DEFAULT_CONFIG_DATA) {
        this.persistentStore.set(row[0], row[1]);
      }
      this.isUsingDefaults = true;
      this.logger.warn('HardenedConfigManager', 'Configuration system failure - running on defaults', {
        error: originalError.message,
        using_defaults: true,
        recovery_action: 'System will operate in degraded mode using hardcoded defaults.'
      });
    } catch (fallbackError) {
      this.logger.error('HardenedConfigManager', `CONFIG FATAL: Complete configuration system failure. Original: ${originalError.message} Fallback: ${fallbackError.message}`);
      throw new Error(`Critical configuration system failure: ${originalError.message}`);
    }
  }

  /**
   * Get configuration health status for monitoring.
   * @returns {Object} Health status information
   */
  getConfigurationHealth() {
    this._ensureConfigurationLoaded();
    return {
      initialized: this.configInitialized,
      using_defaults: this.isUsingDefaults,
      config_source: this.isUsingDefaults ? 'hardcoded_defaults' : 'appsheet_config',
      health_status: this.isUsingDefaults ? 'WARNING' : 'OK',
      message: this.isUsingDefaults
        ? 'System is running on default configuration. APPSHEET_CONFIG sheet may be missing or corrupt.'
        : 'Configuration loaded successfully from APPSHEET_CONFIG sheet',
      timestamp: TimeZoneAwareDate.now()
    };
  }

  /**
   * Reload configuration from sheet
   * @returns {boolean} Success status
   */
  reloadConfiguration() {
    try {
      this.configInitialized = false;
      this.isUsingDefaults = false;
      this.cache.clear(); // Clear config cache
      this._ensureConfigurationLoaded();
      return !this.isUsingDefaults;
    } catch (error) {
      this.logger.error('HardenedConfigManager', 'Failed to reload configuration', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate configuration against expected schema
   * @returns {Object} Validation result
   */
  validateConfiguration() {
    this._ensureConfigurationLoaded();

    const requiredKeys = [
      'TIMEZONE',
      'ENABLE_EMAIL_PROCESSING',
      'ENABLE_CALENDAR_SYNC',
      'ENABLE_AUTO_SCHEDULING',
      'MAX_BATCH_SIZE',
      'CACHE_TTL_MINUTES'
    ];

    const missingKeys = [];
    const invalidValues = [];

    for (const key of requiredKeys) {
      const value = this.get(key);
      if (value === null || value === undefined) {
        missingKeys.push(key);
      }
    }

    // Validate specific value constraints
    const maxBatchSize = this.getNumber('MAX_BATCH_SIZE', 50);
    if (maxBatchSize < 1 || maxBatchSize > 1000) {
      invalidValues.push({
        key: 'MAX_BATCH_SIZE',
        value: maxBatchSize,
        reason: 'Must be between 1 and 1000'
      });
    }

    const cacheTTL = this.getNumber('CACHE_TTL_MINUTES', 5);
    if (cacheTTL < 1 || cacheTTL > 60) {
      invalidValues.push({
        key: 'CACHE_TTL_MINUTES',
        value: cacheTTL,
        reason: 'Must be between 1 and 60 minutes'
      });
    }

    return {
      valid: missingKeys.length === 0 && invalidValues.length === 0,
      missingKeys,
      invalidValues,
      usingDefaults: this.isUsingDefaults,
      timestamp: TimeZoneAwareDate.now()
    };
  }

  /**
   * Set test configuration overrides (for testing only)
   */
  setTestOverrides(overrides) {
    this.testConfigOverrides = new Map(Object.entries(overrides || {}));
    this.cache.clear(); // Clear cache to use overrides
  }

  /**
   * Clear test configuration overrides
   */
  clearTestOverrides() {
    this.testConfigOverrides = null;
    this.cache.clear();
  }

  /**
   * Get all configuration keys
   * @returns {Array} Array of all configuration key names
   */
  getAllKeys() {
    this._ensureConfigurationLoaded();

    try {
      // Get all keys from persistent store that match our config pattern
      const allKeys = [];

      // Add default config keys
      DEFAULT_CONFIG_DATA.forEach(([key]) => {
        if (!allKeys.includes(key)) {
          allKeys.push(key);
        }
      });

      // Add any additional keys from persistent store
      // Note: PersistentStore doesn't expose a direct way to list keys,
      // so we'll work with the known configuration structure


      return allKeys.sort();
    } catch (error) {
      this.logger.error('HardenedConfigManager', 'Failed to get all keys', {
        error: error.message
      });
      return [];
    }
  }

  /**
   * Delete a configuration key
   * @param {string} key - Configuration key to delete
   * @returns {boolean} True if deletion was successful
   */
  deleteKey(key) {
    try {
      if (!key || typeof key !== 'string') {
        this.logger.warn('HardenedConfigManager', 'Invalid key provided for deletion', { key });
        return false;
      }

      // Check if it's a default key that shouldn't be deleted
      const isDefaultKey = DEFAULT_CONFIG_DATA.some(([defaultKey]) => defaultKey === key);
      if (isDefaultKey) {
        this.logger.warn('HardenedConfigManager', 'Attempted to delete default configuration key', { key });
        return false;
      }

      // Delete from persistent store
      this.persistentStore.delete(key);

      // Clear from cache
      this.cache.delete(`config_${key}`);

      this.logger.info('HardenedConfigManager', 'Configuration key deleted', { key });
      return true;

    } catch (error) {
      this.logger.error('HardenedConfigManager', 'Failed to delete configuration key', {
        key,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if all basic functionality works
   */
  selfTest() {
    try {
      // Test 1: Basic configuration access
      const timezone = this.get('TIMEZONE', 'Asia/Dubai');
      if (!timezone || typeof timezone !== 'string') {
        this.logger.warn('ConfigManager', 'Self-test FAILED: Test 1 (timezone) - got: ' + typeof timezone);
        return false;
      }

      // Test 2: Type conversion methods
      const testNumber = this.getNumber('MAX_BATCH_SIZE', 50);
      if (typeof testNumber !== 'number' || testNumber <= 0) {
        this.logger.warn('ConfigManager', 'Self-test FAILED: Test 2 (number conversion) - got: ' + typeof testNumber + ' = ' + testNumber);
        return false;
      }

      const testBoolean = this.getBoolean('ENABLE_EMAIL_PROCESSING', true);
      if (typeof testBoolean !== 'boolean') {
        this.logger.warn('ConfigManager', 'Self-test FAILED: Test 2b (boolean conversion) - got: ' + typeof testBoolean);
        return false;
      }

      // Test 3: JSON handling
      const testDefault = { test: 'value' };
      const jsonResult = this.getJSON('NON_EXISTENT_KEY', testDefault);
      if (!jsonResult || jsonResult.test !== 'value') {
        this.logger.warn('ConfigManager', 'Self-test FAILED: Test 3 (JSON handling) - got: ' + JSON.stringify(jsonResult));
        return false;
      }

      // Test 4: Configuration validation
      const validation = this.validateConfiguration();
      if (!validation || typeof validation.valid !== 'boolean') {
        this.logger.warn('ConfigManager', 'Self-test FAILED: Test 4 (validation) - got: ' + JSON.stringify(validation));
        return false;
      }

      // Test 5: Test overrides functionality
      // Use unique key to prevent cross-contamination from other tests
      const testKey = 'CONFIG_TEST_' + Date.now();
      const originalValue = this.get(testKey, 'default');
      this.setTestOverrides({ [testKey]: 'override_value' });
      const overrideValue = this.get(testKey, 'default');
      this.clearTestOverrides();
      const clearedValue = this.get(testKey, 'default');

      if (overrideValue !== 'override_value' || clearedValue !== 'default') {
        this.logger.warn('ConfigManager', 'Self-test FAILED: Test 5 (overrides) - override=' + overrideValue + ', cleared=' + clearedValue);
        return false;
      }

      // Test 6: Cache functionality
      if (!this.cache || typeof this.cache.get !== 'function') {
        this.logger.warn('ConfigManager', 'Self-test FAILED: Test 6 (cache) - cache exists: ' + !!this.cache);
        return false;
      }

      this.logger.info('ConfigManager', 'Self-test PASSED - all 6 tests successful');
      return true;
    } catch (error) {
      this.logger.error('ConfigManager', 'Self-test EXCEPTION: ' + error.message);
      return false;
    }
  }

  /**
   * Get configuration value (alias for get)
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Configuration value
   */
  getConfig(key, defaultValue = null) {
    return this.get(key, defaultValue);
  }

  /**
   * Update configuration value (alias for set)
   * @param {string} key - Configuration key
   * @param {*} value - Value to set
   * @returns {boolean} True if updated successfully
   */
  updateConfig(key, value) {
    return this.set(key, value);
  }
}

// --- DEPENDENCY CONTAINER AND GLOBAL HELPERS ---

/**
 * MOH TIME OS v2.0 - DEPENDENCY CONTAINER
 *
 * Optimized dependency injection container with lazy loading, performance monitoring,
 * and self-healing capabilities. This is the heart of the modular architecture.
 */
class DependencyContainer {
  constructor() {
    this.services = new Map();           // Initialized services
    this.factories = new Map();          // Service factories
    this.lazyFactories = new Map();      // Lazy-loaded services
    this.singletons = new Map();         // Singleton instances
    this.dependencies = new Map();       // Dependency graph
    this.initOrder = [];                 // Initialization order
    this.initTimes = {};                 // Performance tracking
    this.initErrors = new Map();         // Initialization errors
    this.circularCheck = new Set();      // Circular dependency detection
    this.destroyed = false;              // Container state
    this.criticalServices = new Set([    // Services that must fail fast
      'SmartLogger',
      'ConfigManager',
      'ErrorHandler'
    ]);
    this.registrationSessions = [];         // Track registration history
    this.currentSession = null;             // Active registration session
    this.validatedServices = new Set();     // Services that passed validation
    this.validationMode = 'FULL';           // 'FULL' | 'INCREMENTAL' | 'NONE'
  }

  /**
   * Safe logging method that uses SmartLogger if available, otherwise falls back to console
   */
  _log(level, message, context) {
    if (this.services.has(SERVICES.SmartLogger)) {
      const logger = this.services.get(SERVICES.SmartLogger);
      if (logger && typeof logger[level] === 'function') {
        logger[level]('Container', message, context);
      } else {
        Logger.log('[Container] ' + level.toUpperCase() + ': ' + message + (context ? ' ' + JSON.stringify(context) : ''));
      }
    } else {
      Logger.log('[Container] ' + level.toUpperCase() + ': ' + message + (context ? ' ' + JSON.stringify(context) : ''));
    }
  }

  /**
   * Register a service with advanced options
   */
  register(name, factory, options = {}) {
    if (this.destroyed) {
      throw new Error('Cannot register services in destroyed container');
    }

    const {
      singleton = true,
      lazy = false,
      dependencies = [],
      critical = false,
      // REMOVED: timeout (was never implemented, misleading API)
      retries = 3
    } = options;

    // Validate inputs
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }
    if (typeof factory !== 'function') {
      throw new Error('Service factory must be a function');
    }

    // Check for duplicate registration
    if (this.services.has(name) || this.factories.has(name) || this.lazyFactories.has(name)) {
      this._log('warn', `Service ${name} already registered, overwriting`);
    }

    // Store dependency information
    this.dependencies.set(name, {
      deps: dependencies,
      critical,
      // REMOVED: timeout (not implemented)
      retries
    });

    if (lazy && !critical) {
      // Lazy loading for non-critical services
      this.lazyFactories.set(name, {
        factory,
        singleton,
        instance: null,
        initialized: false,
        options
      });

      this._log('info', `Registered lazy service: ${name}`);

    } else if (critical) {
      // Initialize critical services immediately
      this._log('info', `Initializing critical service: ${name}`);

      const startTime = Date.now();
      try {
        // Check dependencies first
        this._validateDependencies(name, dependencies);

        const instance = this._createInstance(name, factory, options);
        this.services.set(name, instance);

        const duration = Date.now() - startTime;
        this.initTimes[name] = duration;
        this.initOrder.push(name);

        this._log('info', `Critical service ${name} initialized in ${duration}ms`);

      } catch (error) {
        this.initErrors.set(name, error);
        this._log('error', `Critical service ${name} failed: ${error.message}`);
        throw error; // Critical services must succeed
      }

    } else {
      // Standard registration (eager but not critical)
      this.factories.set(name, factory);
      if (singleton) {
        this.singletons.set(name, null);
      }

      this._log('info', `✅ Service registered successfully: ${name} (singleton: ${singleton})`);
    }

    // Track in current session if active
    if (this.currentSession !== null && !this.currentSession.registeredServices.includes(name)) {
      this.currentSession.registeredServices.push(name);
    }

    return this; // Allow chaining
  }

  /**
   * Get service with dependency resolution and error handling
   */
  get(name) {
    if (this.destroyed) {
      throw new Error('Cannot get services from destroyed container');
    }

    // Check if already initialized
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Check for circular dependencies
    if (this.circularCheck.has(name)) {
      throw new Error(`Circular dependency detected: ${Array.from(this.circularCheck).join(' -> ')} -> ${name}`);
    }

    // Check lazy services
    const lazy = this.lazyFactories.get(name);
    if (lazy) {
      if (!lazy.initialized) {
        this._log('info', `Lazy initializing service: ${name}`);
        this._initializeLazyService(name, lazy);
      }
      return lazy.instance;
    }

    // Standard factory creation
    if (this.factories.has(name)) {
      return this._createStandardService(name);
    }

    // Service not found - log the missing service before attempting fallback
    this._log('error', `Service ${name} not registered in container`);

    // FAIL FAST: No fallbacks - services must be registered or throw error
    // This prevents silent degradation and makes failures obvious
    throw new Error(`Service ${name} not registered`);
  }

  /**
   * Initialize lazy service with full error handling
   */
  _initializeLazyService(name, lazy) {
    const startTime = Date.now();
    this.circularCheck.add(name);

    try {
      // Resolve dependencies first
      const depInfo = this.dependencies.get(name);
      if (depInfo && depInfo.deps.length > 0) {
        for (const dep of depInfo.deps) {
          this.get(dep);
        }
      }

      // Create instance with retry logic
      let lastError;
      const maxRetries = (depInfo && depInfo.retries) || 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          lazy.instance = lazy.factory();
          lazy.initialized = true;
          break;
        } catch (error) {
          lastError = error;
          this._log('warn', `Service ${name} attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        }
      }

      if (!lazy.initialized) {
        throw lastError || new Error('Service initialization failed after retries');
      }

      // Track performance
      const duration = Date.now() - startTime;
      this.initTimes[name] = duration;
      this.initOrder.push(name);

      // Store as singleton if required
      if (lazy.singleton) {
        this.services.set(name, lazy.instance);
      }

      this._log('info', `Lazy service ${name} initialized in ${duration}ms`);

    } catch (error) {
      this.initErrors.set(name, error);
      this._log('error', `Service ${name} initialization failed: ${error.message}`);
      throw error;

    } finally {
      this.circularCheck.delete(name);
    }
  }

  /**
   * Create standard (non-lazy) service
   */
  _createStandardService(name) {
    if (this.singletons.has(name)) {
      const existing = this.singletons.get(name);
      if (existing) return existing;
    }

    const factory = this.factories.get(name);
    const startTime = Date.now();

    try {
      const instance = this._createInstance(name, factory);

      if (this.singletons.has(name)) {
        this.singletons.set(name, instance);
        this.services.set(name, instance);
      }

      this.initTimes[name] = Date.now() - startTime;
      this.initOrder.push(name);

      return instance;

    } catch (error) {
      this.initErrors.set(name, error);
      this._log('error', `Service ${name} creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create service instance with monitoring
   */
  _createInstance(name, factory, options = {}) {
    const startTime = Date.now();

    try {
      const instance = factory();

      const duration = Date.now() - startTime;
      this._log('info', `Service ${name} created in ${duration}ms`);

      return instance;

    } catch (error) {
      this._log('error', `Service ${name} factory threw error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate service dependencies
   */
  _validateDependencies(serviceName, dependencies) {
    for (const dep of dependencies) {
      if (!this.has(dep)) {
        throw new Error(`Service ${serviceName} depends on ${dep} which is not registered`);
      }
    }
  }

  /**
   * Check if service is registered
   */
  has(name) {
    return this.services.has(name) ||
           this.factories.has(name) ||
           this.lazyFactories.has(name);
  }

  /**
   * Clear all services and reset container
   */
  clear() {
    this._log('info', 'Clearing all services...');

    const destroyOrder = [...this.initOrder].reverse();

    for (const serviceName of destroyOrder) {
      try {
        const service = this.services.get(serviceName);
        if (service && typeof service.destroy === 'function') {
          service.destroy();
        }
      } catch (error) {
        LoggerFacade.error('Container', 'Service cleanup failed', {
          serviceName: serviceName,
          error: error.message,
          stack: error.stack,
          context: 'clear',
          phase: 'cleanup'
        });
      }
    }

    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
    this.dependencies.clear();
    this.initErrors.clear();
    this.circularCheck.clear();

    this.initOrder = [];
    this.initTimes = {};

    this._log('info', 'Container cleared');
  }

  /**
   * Get initialization report for debugging
   */
  getInitializationReport() {
    const totalTime = Object.values(this.initTimes).reduce((a, b) => a + b, 0);
    const lazyUninitialized = Array.from(this.lazyFactories.entries())
      .filter(([name, lazy]) => !lazy.initialized)
      .map(([name]) => name);

    return {
      timestamp: TimeZoneAwareDate.now(),
      initOrder: this.initOrder,
      initTimes: this.initTimes,
      totalInitTime: totalTime,
      averageInitTime: this.initOrder.length > 0 ? totalTime / this.initOrder.length : 0,
      lazyUninitialized: lazyUninitialized,
      errors: Object.fromEntries(
        Array.from(this.initErrors.entries()).map(([name, error]) => [name, error.message])
      ),
      servicesCount: {
        initialized: this.services.size,
        factories: this.factories.size,
        lazy: this.lazyFactories.size,
        singletons: this.singletons.size
      }
    };
  }

  /**
   * Get service status for monitoring
   */
  getServiceStatus(serviceName) {
    if (this.services.has(serviceName)) {
      return {
        status: 'INITIALIZED',
        initTime: this.initTimes[serviceName] || 0,
        initOrder: this.initOrder.indexOf(serviceName)
      };
    }

    if (this.lazyFactories.has(serviceName)) {
      const lazy = this.lazyFactories.get(serviceName);
      return {
        status: lazy.initialized ? 'LAZY_INITIALIZED' : 'LAZY_PENDING',
        initTime: this.initTimes[serviceName] || 0
      };
    }

    if (this.factories.has(serviceName)) {
      return {
        status: 'REGISTERED',
        initTime: 0
      };
    }

    if (this.initErrors.has(serviceName)) {
      return {
        status: 'ERROR',
        error: this.initErrors.get(serviceName).message
      };
    }

    return { status: 'NOT_FOUND' };
  }

  /**
   * Health check for container
   */
  getHealthStatus() {
    const errorCount = this.initErrors.size;
    const totalServices = this.services.size + this.factories.size + this.lazyFactories.size;
    const errorRate = totalServices > 0 ? errorCount / totalServices : 0;

    let status = 'HEALTHY';
    if (errorRate > 0.5) {
      status = 'CRITICAL';
    } else if (errorRate > 0.2) {
      status = 'WARNING';
    }

    return {
      status,
      errorCount,
      totalServices,
      errorRate: Math.round(errorRate * 100),
      destroyed: this.destroyed
    };
  }

  /**
   * Start a new registration session for incremental registration
   */
  beginRegistrationSession(sessionName, mode = 'INCREMENTAL') {
    if (this.currentSession !== null) {
      this._log('warn', `Registration session '${this.currentSession.name}' already active, will be replaced`);
    }

    this.currentSession = {
      name: sessionName,
      mode: mode,
      registeredServices: [],
      startTime: Date.now(),
      endTime: null
    };

    this.validationMode = mode;

    this._log('info', `Started registration session: ${sessionName} (mode: ${mode})`);
    return this.currentSession;
  }

  /**
   * End active registration session and perform validation based on session mode
   */
  endRegistrationSession() {
    if (this.currentSession === null) {
      throw new Error('Container.endRegistrationSession: No active registration session to end');
    }

    const session = this.currentSession;
    session.endTime = Date.now();
    const duration = session.endTime - session.startTime;

    this._log('info', `Ending registration session: ${session.name} (${session.registeredServices.length} services, ${duration}ms)`);

    let validationResults = null;
    try {
      if (session.mode === 'FULL') {
        this._log('info', 'Performing FULL validation of all services');
        validationResults = this._validateAllServices();
      } else if (session.mode === 'INCREMENTAL') {
        this._log('info', `Performing INCREMENTAL validation of ${session.registeredServices.length} services`);
        validationResults = this._validateIncrementalServices(session.registeredServices);
      } else if (session.mode === 'NONE') {
        this._log('info', 'Skipping validation (mode: NONE)');
        validationResults = { skipped: true, mode: 'NONE' };
      } else {
        throw new Error(`Invalid validation mode: ${session.mode}`);
      }
    } catch (error) {
      this._log('error', `Registration session validation failed: ${error.message}`);
      this.currentSession = null;
      throw error;
    }

    const sessionSummary = {
      name: session.name,
      mode: session.mode,
      servicesRegistered: session.registeredServices.length,
      servicesList: session.registeredServices,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: duration,
      validationResults: validationResults
    };

    this.registrationSessions.push(sessionSummary);
    this.currentSession = null;

    this._log('info', `Registration session '${session.name}' completed successfully`);

    return sessionSummary;
  }

  /**
   * Register a service and all its transitive dependencies
   */
  registerWithDependencies(serviceName) {
    if (this.has(serviceName) && this.validatedServices.has(serviceName)) {
      this._log('debug', `Service ${serviceName} already registered and validated, skipping`);
      return;
    }

    if (typeof SERVICE_DEPENDENCIES === 'undefined') {
      throw new Error('Container.registerWithDependencies: SERVICE_DEPENDENCIES constant not defined');
    }

    const depsToRegister = this._getTransitiveDependencies(serviceName);

    this._log('info', `Registering ${serviceName} with ${depsToRegister.length - 1} transitive dependencies`);

    for (const depName of depsToRegister) {
      if (!this.has(depName)) {
        this._log('debug', `Registering dependency: ${depName}`);

        if (typeof registerService !== 'function') {
          throw new Error(`Container.registerWithDependencies: registerService() function not available`);
        }

        registerService(depName);
      } else {
        this._log('debug', `Dependency ${depName} already registered`);
      }
    }

    this._log('info', `Service ${serviceName} and all dependencies registered`);
  }

  /**
   * Get list of transitive dependencies in registration order
   */
  _getTransitiveDependencies(serviceName) {
    const deps = SERVICE_DEPENDENCIES[serviceName];

    if (!deps || deps.length === 0) {
      return [serviceName];
    }

    const visited = new Set();
    const result = [];
    const currentPath = new Set();

    const visit = (name) => {
      if (currentPath.has(name)) {
        const cycle = Array.from(currentPath).join(' -> ') + ' -> ' + name;
        throw new Error(`Circular dependency detected in SERVICE_DEPENDENCIES: ${cycle}`);
      }

      if (visited.has(name)) {
        return;
      }

      visited.add(name);
      currentPath.add(name);

      const serviceDeps = SERVICE_DEPENDENCIES[name] || [];

      for (const dep of serviceDeps) {
        visit(dep);
      }

      currentPath.delete(name);

      result.push(name);
    };

    visit(serviceName);
    return result;
  }

  /**
   * Validate only specified services
   */
  _validateIncrementalServices(serviceNames) {
    const logger = this.services.has(SERVICES.SmartLogger) ?
      this.services.get(SERVICES.SmartLogger) :
      LoggerFacade;

    logger.info('ServiceValidation', `Starting incremental validation of ${serviceNames.length} services`);

    const errors = [];
    const validated = [];

    for (const serviceName of serviceNames) {
      if (this.validatedServices.has(serviceName)) {
        logger.debug('ServiceValidation', `Service ${serviceName} already validated, skipping`);
        continue;
      }

      try {
        if (!this.has(serviceName)) {
          throw new Error('Service not registered in container');
        }

        const deps = SERVICE_DEPENDENCIES[serviceName] || [];
        for (const dep of deps) {
          if (!this.has(dep)) {
            throw new Error(`Missing dependency: ${dep}`);
          }
        }

        const instance = this.get(serviceName);
        if (!instance) {
          throw new Error('Service instantiated as null/undefined');
        }

        if (typeof SERVICE_INTERFACES !== 'undefined' && SERVICE_INTERFACES[serviceName]) {
          const requiredMethods = SERVICE_INTERFACES[serviceName];
          for (const method of requiredMethods) {
            if (typeof instance[method] !== 'function') {
              throw new Error(`Missing required method: ${method}`);
            }
          }
        }

        this.validatedServices.add(serviceName);
        validated.push(serviceName);

        logger.info('ServiceValidation', `✅ ${serviceName} validated successfully`);

      } catch (error) {
        errors.push({
          service: serviceName,
          error: error.message,
          stack: error.stack
        });
        logger.error('ServiceValidation', `❌ ${serviceName} validation failed: ${error.message}`);
      }
    }

    let circularDepsChecked = false;
    if (serviceNames.includes(SERVICES.EmailIngestionEngine) &&
        serviceNames.includes(SERVICES.ZeroTrustTriageEngine)) {
      try {
        logger.info('ServiceValidation', 'Checking circular dependency resolution (EmailIngestionEngine ↔ ZeroTrustTriageEngine)');
        this._validateCircularDependency();
        circularDepsChecked = true;
        logger.info('ServiceValidation', '✅ Circular dependency resolution validated');
      } catch (error) {
        errors.push({
          service: 'CircularDependency',
          error: error.message,
          stack: error.stack
        });
        logger.error('ServiceValidation', `❌ Circular dependency validation failed: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      const errorMsg = `Incremental validation failed for ${errors.length} service(s): ${errors.map(e => e.service).join(', ')}`;
      throw new Error(errorMsg);
    }

    logger.info('ServiceValidation', `Incremental validation complete: ${validated.length} services validated`);

    return {
      servicesValidated: validated.length,
      validatedList: validated,
      errors: errors,
      circularDepsChecked: circularDepsChecked
    };
  }

  /**
   * Validate circular dependency resolution
   */
  _validateCircularDependency() {
    const emailEngine = this.get(SERVICES.EmailIngestionEngine);
    const triageEngine = this.get(SERVICES.ZeroTrustTriageEngine);

    if (!emailEngine) {
      throw new Error('EmailIngestionEngine not instantiated');
    }
    if (!triageEngine) {
      throw new Error('ZeroTrustTriageEngine not instantiated');
    }

    let triageFromEmail;
    try {
      triageFromEmail = emailEngine.triageEngine;
      if (!triageFromEmail) {
        throw new Error('EmailIngestionEngine.triageEngine getter returned null/undefined');
      }
    } catch (e) {
      throw new Error('EmailIngestionEngine missing working triageEngine getter: ' + e.message);
    }

    let emailFromTriage;
    try {
      emailFromTriage = triageEngine.emailIngestionEngine;
      if (!emailFromTriage) {
        throw new Error('ZeroTrustTriageEngine.emailIngestionEngine getter returned null/undefined');
      }
    } catch (e) {
      throw new Error('ZeroTrustTriageEngine missing working emailIngestionEngine getter: ' + e.message);
    }

    if (triageFromEmail !== triageEngine) {
      throw new Error('EmailIngestionEngine.triageEngine does not reference ZeroTrustTriageEngine instance');
    }
    if (emailFromTriage !== emailEngine) {
      throw new Error('ZeroTrustTriageEngine.emailIngestionEngine does not reference EmailIngestionEngine instance');
    }
  }

  /**
   * Validate ALL registered services
   */
  _validateAllServices() {
    if (typeof validateServiceRegistrations !== 'function') {
      throw new Error('Container._validateAllServices: validateServiceRegistrations() function not available');
    }

    return validateServiceRegistrations();
  }
}

// Global container instance
const container = new DependencyContainer();

/**
 * Global helper functions for container access
 */
function getContainer() {
  return container;
}

function getService(name) {
  return container.get(name);
}

function hasService(name) {
  return container.has(name);
}

function getContainerStatus() {
  return container.getInitializationReport();
}

function resetContainer() {
  if (container) {
    container.reset();
    container = undefined;
  }
}



function getInitializedContainer() {
  const currentContainer = getContainer();
  // Check if the container is populated with services for this execution.
  // We can check for a critical service like SmartLogger to determine this.
  if (!currentContainer.has(SERVICES.SmartLogger)) {
    Logger.log('[AA_Container] Container not populated for current execution. Registering all services...');
    registerAllServices(); // This function is defined in AZ_ServiceRegistration.gs
  }
  return currentContainer;
}



class BatchOperations {
  /**
   * @param {CrossExecutionCache} cache - Cache instance for header caching
   * @param {SmartLogger} logger - Logger instance for error reporting
   */
  constructor(cache, logger) {
    if (!cache) {
      throw new Error('BatchOperations: cache parameter is required');
    }
    if (!logger) {
      throw new Error('BatchOperations: logger parameter is required');
    }
    this.cache = cache;
    this.logger = logger;
    this.columnMapCache = {}; // Cache column maps for O(1) lookup
  }

  /**
   * Generate a schema version token for optimistic locking operations
   */
  generateVersion() {
    return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  /**
   * Simple wrapper around global deepClone utility
   */
  deepClone(value) {
    return typeof deepClone === 'function' ? deepClone(value) : JSON.parse(JSON.stringify(value));
  }

  /**
   * Split array into chunks of a given size
   */
  chunkArray(array, chunkSize) {
    if (!Array.isArray(array) || chunkSize <= 0) {
      return [];
    }

    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Append rows to a sheet within the primary spreadsheet
   */
  appendRows(sheetName, rows) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.appendRows: sheetName must be a non-empty string');
    }
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return { success: true, rowsAppended: 0 };
    }

    // Deduplicate rows based on first column ID
    const dedupeResult = this._deduplicateRows(rows, sheetName);
    if (dedupeResult.allDuplicates) {
      return { success: true, rowsAppended: 0, duplicatesSkipped: dedupeResult.originalCount };
    }
    rows = dedupeResult.filtered;

    try {
      const sheet = this._getSheet(sheetName);
      const rowCount = rows.length;
      const columnCount = rows[0].length;
      const startRow = sheet.getLastRow() + 1;
      const range = sheet.getRange(startRow, 1, rowCount, columnCount);
      range.setValues(rows);

      return { success: true, rowsAppended: rowCount };
    } catch (error) {
      this.logger.error('BatchOperations', `appendRows failed for '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(`BatchOperations.appendRows failed for '${sheetName}': ${error.message}`);
    }
  }

  /**
   * Clear all data rows from a sheet (preserves headers)
   * @param {string} sheetName - Name of the sheet
   * @returns {Object} Result with rowsCleared count
   */
  clearSheetData(sheetName) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.clearSheetData: sheetName must be a non-empty string');
    }

    try {
      const sheet = this._getSheet(sheetName);
      const lastRow = sheet.getLastRow();

      if (lastRow > 1) { // Has data beyond header
        const lastCol = sheet.getLastColumn();
        try {
          sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
          this.logger.info('BatchOperations', `Cleared ${lastRow - 1} data rows from ${sheetName}`);
          return { success: true, rowsCleared: lastRow - 1 };
        } catch (e) {
          this.logger.error('BatchOperations', `Failed to clear content for '${sheetName}'`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations.clearSheetData failed to clear content for '${sheetName}': ${e.message}`);
        }
      }

      return { success: true, rowsCleared: 0 };
    } catch (error) {
      this.logger.error('BatchOperations', `clearSheetData failed for '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(`clearSheetData failed for '${sheetName}': ${error.message}`);
    }
  }

  /**
   * Append rows to a sheet in either the primary spreadsheet or an external spreadsheet
   */
  appendRowsToExternalSheet(spreadsheetId, sheetName, rows) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.appendRowsToExternalSheet: sheetName must be a non-empty string');
    }
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return { success: true, rowsAppended: 0 };
    }

    try {
      let targetSpreadsheet;
      try {
        targetSpreadsheet = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : getActiveSystemSpreadsheet();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get target spreadsheet for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.appendRowsToExternalSheet failed to get spreadsheet for '${sheetName}': ${e.message}`);
      }

      const targetId = spreadsheetId || targetSpreadsheet.getId();
      let sheet;
      try {
        sheet = targetSpreadsheet.getSheetByName(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get sheet by name '${sheetName}' in target spreadsheet`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.appendRowsToExternalSheet: Sheet '${sheetName}' not found in target spreadsheet: ${e.message}`);
      }
      if (!sheet) {
        throw new Error(`Sheet '${sheetName}' not found in target spreadsheet`);
      }

      const rowCount = rows.length;
      const columnCount = rows[0].length;
      let startRow;
      try {
        startRow = sheet.getLastRow() + 1;
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get last row for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.appendRowsToExternalSheet failed to get last row for '${sheetName}': ${e.message}`);
      }

      try {
        const range = sheet.getRange(startRow, 1, rowCount, columnCount);
        range.setValues(rows);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to set values for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.appendRowsToExternalSheet failed to set values for '${sheetName}': ${e.message}`);
      }

      return {
        success: true,
        rowsAppended: rowCount,
        targetSpreadsheetId: targetId
      };
    } catch (error) {
      this.logger.error('BatchOperations', `appendRowsToExternalSheet failed for '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(`BatchOperations.appendRowsToExternalSheet failed for '${sheetName}': ${error.message}`);
    }
  }

  /**
   * Private helper: Get the spreadsheet object with execution-scoped caching
   * Access the shared system spreadsheet cache
   * @returns {Spreadsheet} The cached spreadsheet object
  */
  _getSpreadsheet() {
    try {
      return getActiveSystemSpreadsheet();
    } catch (error) {
      this.logger.error('BatchOperations', 'Failed to get active system spreadsheet', { error: error.message, stack: error.stack });
      throw new Error(`BatchOperations._getSpreadsheet: Failed to get active system spreadsheet: ${error.message}`);
    }
  }

  /**
   * Private helper: Get a sheet by name using the cached spreadsheet
   * @param {string} sheetName - Name of the sheet to retrieve
   * @returns {Sheet} The sheet object
   */
  _getSheet(sheetName) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations._getSheet: sheetName must be a non-empty string');
    }

    let spreadsheet;
    try {
      spreadsheet = this._getSpreadsheet();
    } catch (e) {
      this.logger.error('BatchOperations', 'Failed to get spreadsheet in _getSheet', { error: e.message, stack: e.stack });
      throw new Error(`BatchOperations._getSheet: Failed to get spreadsheet: ${e.message}`);
    }

    let sheet;
    try {
      sheet = spreadsheet.getSheetByName(sheetName);
    } catch (e) {
      this.logger.error('BatchOperations', `Failed to get sheet by name '${sheetName}'`, { error: e.message, stack: e.stack });
      throw new Error(`BatchOperations._getSheet: Failed to get sheet '${sheetName}': ${e.message}`);
    }

    if (!sheet) {
      this.logger.error('BatchOperations', `Sheet '${sheetName}' not found`, { sheetName });
      throw new Error(`BatchOperations._getSheet: Sheet '${sheetName}' not found`);
    }

    return sheet;
  }

  /**
   * Get sheet headers with signature-based intelligent caching
   * Uses schema signature (sheetName:columnCount) to detect and adapt to schema changes
   * @param {string} sheetName - Name of the sheet
   * @returns {string[]} Array of header strings
   */
  getHeaders(sheetName) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.getHeaders: sheetName must be a non-empty string');
    }

    try {
      // Get the sheet object
      const sheet = this._getSheet(sheetName);

      // Generate schema signature: sheetName:columnCount
      let columnCount;
      try {
        columnCount = sheet.getLastColumn();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get last column for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getHeaders: Failed to get last column for sheet '${sheetName}': ${e.message}`);
      }
      const schemaSignature = `${sheetName}:${columnCount}`;

      // Try to get cached headers using schema signature
      const cachedHeaders = this.cache.get(`headers_${schemaSignature}`);

      if (cachedHeaders !== null) {
        // Cache hit - schema hasn't changed
        return cachedHeaders;
      }

      // Cache miss - first time or schema changed
      // Perform single read operation to get actual headers
      let headerRange;
      try {
        headerRange = sheet.getRange(1, 1, 1, columnCount);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get header range for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getHeaders: Failed to get header range for sheet '${sheetName}': ${e.message}`);
      }
      let headerValues;
      try {
        headerValues = headerRange.getValues();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get header values for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getHeaders: Failed to get header values for sheet '${sheetName}': ${e.message}`);
      }
      const headers = headerValues[0] || [];

      // Cache the headers with long TTL (1 hour)
      this.cache.set(`headers_${schemaSignature}`, headers, 3600);

      return headers;
    } catch (error) {
      this.logger.error('BatchOperations', `getHeaders failed for sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(
        `BatchOperations.getHeaders: Failed for sheet '${sheetName}' - ${error.message}`
      );
    }
  }

  /**
   * Get all data from a sheet in a single, efficient read operation
   * @param {string} sheetName - Name of the sheet
   * @returns {any[][]} 2D array of all sheet data including headers
   */
  getAllSheetData(sheetName) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.getAllSheetData: sheetName must be a non-empty string');
    }

    try {
      const sheet = this._getSheet(sheetName);

      // Single efficient read of entire data range
      let dataRange;
      try {
        dataRange = sheet.getDataRange();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get data range for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getAllSheetData: Failed to get data range for sheet '${sheetName}': ${e.message}`);
      }

      if (!dataRange || dataRange.getNumRows() === 0) {
        return [];
      }

      let allData;
      try {
        allData = dataRange.getValues();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get values from data range for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getAllSheetData: Failed to get values from data range for sheet '${sheetName}': ${e.message}`);
      }
      return allData;
    } catch (error) {
      this.logger.error('BatchOperations', `getAllSheetData failed for sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(
        `BatchOperations.getAllSheetData: Failed for sheet '${sheetName}' - ${error.message}`
      );
    }
  }



  /**
   * Get all actions (tasks) from the ACTIONS sheet.
   * @returns {Array<Object>} An array of MohTask objects.
   */
  getAllActions() {
    try {
      const cacheKey = 'all_actions_cache';
      let cachedActions = this.cache.get(cacheKey);

      if (cachedActions) {
        this.logger.info('BatchOperations', 'getAllActions: Cache hit', { key: cacheKey });
        return cachedActions;
      }

      const allData = this.getAllSheetData(SHEET_NAMES.ACTIONS);
      if (allData.length <= 1) return []; // Only headers or empty

      const headers = allData[0];
      const actions = [];
      for (let i = 1; i < allData.length; i++) {
        actions.push(MohTask.fromSheetRow(allData[i], headers));
      }

      // Cache the results for 5 minutes (300 seconds)
      this.cache.set(cacheKey, actions, 300);
      this.logger.info('BatchOperations', `getAllActions: Retrieved ${actions.length} tasks and cached`, { key: cacheKey });

      return actions;
    } catch (error) {
      this.logger.error('BatchOperations', 'Failed to get all actions', { error: error.message });
      throw error;
    }
  }

  /**
   * Perform batch updates to a sheet using array of range/value pairs
   * @param {string} sheetName - Name of the sheet
   * @param {Array<{rangeA1: string, values: any[][]}>} data - Array of update operations
   */
  batchUpdate(sheetName, data) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.batchUpdate: sheetName must be a non-empty string');
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('BatchOperations.batchUpdate: data must be a non-empty array');
    }

    // Validate data structure
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (!item.rangeA1 || typeof item.rangeA1 !== 'string') {
        throw new Error(
          `BatchOperations.batchUpdate: data[${i}].rangeA1 must be a non-empty string`
        );
      }
      if (!Array.isArray(item.values)) {
        throw new Error(`BatchOperations.batchUpdate: data[${i}].values must be an array`);
      }
    }

    try {
      const sheet = this._getSheet(sheetName);

      // Extract all A1 notations
      const a1Notations = data.map(item => item.rangeA1);

      // Get all range objects in single API call
      let ranges;
      try {
        ranges = sheet.getRangeList(a1Notations).getRanges();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get range list for '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.batchUpdate: Failed to get range list for sheet '${sheetName}': ${e.message}`);
      }

      if (ranges.length !== data.length) {
        throw new Error('BatchOperations.batchUpdate: Mismatch between ranges and data length');
      }

      // Apply updates to each range
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const values = data[i].values;

        // Validate dimensions
        let expectedRows, expectedCols;
        try {
          expectedRows = range.getNumRows();
          expectedCols = range.getNumColumns();
        } catch (e) {
          this.logger.error('BatchOperations', `Failed to get range dimensions for '${sheetName}'`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations.batchUpdate: Failed to get range dimensions for sheet '${sheetName}': ${e.message}`);
        }
        const actualRows = values.length;
        const actualCols = actualRows > 0 ? values[0].length : 0;

        if (actualRows !== expectedRows || actualCols !== expectedCols) {
          throw new Error(
            `BatchOperations.batchUpdate: Dimension mismatch for range ${data[i].rangeA1}. ` +
              `Expected ${expectedRows}x${expectedCols}, got ${actualRows}x${actualCols}`
          );
        }

        try {
          range.setValues(values);
        } catch (e) {
          this.logger.error('BatchOperations', `Failed to set values for range ${data[i].rangeA1} in sheet '${sheetName}'`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations.batchUpdate: Failed to set values for range ${data[i].rangeA1} in sheet '${sheetName}': ${e.message}`);
        }
      }
    } catch (error) {
      this.logger.error('BatchOperations', `Batch update failed for sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Professional enhancement: Server-side filtering for efficient data retrieval
   *
   * Gets rows from a sheet that match specified filter criteria.
   * Performs filtering in the I/O layer to minimize memory usage and CPU overhead.
   *
   * @param {string} sheetName - Name of the sheet
   * @param {Object} filterObject - Filter criteria { columnName: expectedValue, ... }
   * @param {Object} options - Optional parameters { includeHeader: boolean, operator: 'AND'|'OR' }
   * @returns {Array[]} Filtered rows matching the criteria
   */
  getRowsByFilter(sheetName, filterObject = {}, options = {}) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.getRowsByFilter: sheetName must be a non-empty string');
    }

    if (!filterObject || typeof filterObject !== 'object') {
      throw new Error('BatchOperations.getRowsByFilter: filterObject must be a valid object');
    }

    const { includeHeader = false, operator = 'AND' } = options;

    try {
      // Get headers and all data efficiently
      let headers;
      try {
        headers = this.getHeaders(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get headers for '${sheetName}' in getRowsByFilter`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getRowsByFilter: Failed to get headers for sheet '${sheetName}': ${e.message}`);
      }
      let allData;
      try {
        allData = this.getAllSheetData(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get all sheet data for '${sheetName}' in getRowsByFilter`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getRowsByFilter: Failed to get all sheet data for sheet '${sheetName}': ${e.message}`);
      }

      if (allData.length === 0) {
        return includeHeader ? [headers] : [];
      }

      // Get cached column map for O(1) lookup
      const columnMap = this._getColumnMap(sheetName);

      // Validate filter columns exist
      const filterKeys = Object.keys(filterObject);
      for (const key of filterKeys) {
        if (!(key in columnMap)) {
          throw new Error(`BatchOperations.getRowsByFilter: Column '${key}' not found in sheet '${sheetName}'`);
        }
      }

      // Skip header row for filtering (index 0 is header)
      const dataRows = allData.slice(1);
      const filteredRows = [];

      // Apply filtering logic with extracted matchers
      for (const row of dataRows) {
        const matches = operator === 'AND'
          ? this._matchesFilterAnd(row, columnMap, filterKeys, filterObject)
          : this._matchesFilterOr(row, columnMap, filterKeys, filterObject);

        if (matches) {
          filteredRows.push(row);
        }
      }

      // Return results with optional header
      if (includeHeader && filteredRows.length > 0) {
        return [headers, ...filteredRows];
      }

      return filteredRows;

    } catch (error) {
      this.logger.error('BatchOperations', `getRowsByFilter failed for sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(
        `BatchOperations.getRowsByFilter: Failed for sheet '${sheetName}' - ${error.message}`
      );
    }
  }

  /**
   * Professional enhancement: Advanced filtering with custom predicates
   *
   * Allows complex filtering logic beyond simple equality checks.
   *
   * @param {string} sheetName - Name of the sheet
   * @param {Function} predicate - Function that receives (row, headers) and returns boolean
   * @param {Object} options - Optional parameters { includeHeader: boolean }
   * @returns {Array[]} Filtered rows matching the predicate
   */
  getRowsByPredicate(sheetName, predicate, options = {}) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.getRowsByPredicate: sheetName must be a non-empty string');
    }

    if (typeof predicate !== 'function') {
      throw new Error('BatchOperations.getRowsByPredicate: predicate must be a function');
    }

    const { includeHeader = false } = options;

    try {
      let headers;
      try {
        headers = this.getHeaders(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get headers for '${sheetName}' in getRowsByPredicate`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getRowsByPredicate: Failed to get headers for sheet '${sheetName}': ${e.message}`);
      }
      let allData;
      try {
        allData = this.getAllSheetData(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get all sheet data for '${sheetName}' in getRowsByPredicate`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getRowsByPredicate: Failed to get all sheet data for sheet '${sheetName}': ${e.message}`);
      }

      if (allData.length === 0) {
        return includeHeader ? [headers] : [];
      }

      // Skip header row and apply predicate
      const dataRows = allData.slice(1);
      const filteredRows = dataRows.filter(row => predicate(row, headers));

      // Return results with optional header
      if (includeHeader && filteredRows.length > 0) {
        return [headers, ...filteredRows];
      }

      return filteredRows;

    } catch (error) {
      this.logger.error('BatchOperations', `getRowsByPredicate failed for sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(
        `BatchOperations.getRowsByPredicate: Failed for sheet '${sheetName}' - ${error.message}`
      );
    }
  }

  /**
   * Precision I/O: Get filtered rows with their sheet position indices
   *
   * Returns filtered data along with the actual row numbers in the sheet
   * for efficient batch updates without requiring full dataset reload.
   *
   * @param {string} sheetName - Name of the sheet
   * @param {Object} filterObject - Filter criteria { columnName: expectedValue, ... }
   * @returns {Array} Array of { row: Array, sheetRowIndex: number } objects
   */
  getRowsWithPosition(sheetName, filterObject = {}) {
    if (!sheetName || typeof sheetName !== 'string') {
      throw new Error('BatchOperations.getRowsWithPosition: sheetName must be a non-empty string');
    }

    try {
      let headers;
      try {
        headers = this.getHeaders(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get headers for '${sheetName}' in getRowsWithPosition`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getRowsWithPosition: Failed to get headers for sheet '${sheetName}': ${e.message}`);
      }
      let allData;
      try {
        allData = this.getAllSheetData(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get all sheet data for '${sheetName}' in getRowsWithPosition`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.getRowsWithPosition: Failed to get all sheet data for sheet '${sheetName}': ${e.message}`);
      }

      if (allData.length === 0) {
        return [];
      }

      // Get cached column map for O(1) lookup
      const columnMap = this._getColumnMap(sheetName);

      // Validate filter columns exist
      const filterKeys = Object.keys(filterObject);
      for (const key of filterKeys) {
        if (!(key in columnMap)) {
          throw new Error(`BatchOperations.getRowsWithPosition: Column '${key}' not found in sheet '${sheetName}'`);
        }
      }

      const result = [];

      // Process data rows (skip header at index 0)
      for (let i = 1; i < allData.length; i++) {
        const row = allData[i];
        let matches = true;

        // Check all filter conditions
        for (const key of filterKeys) {
          const columnIndex = columnMap[key];
          const cellValue = row[columnIndex];
          const expectedValue = filterObject[key];

          // Handle different comparison types
          if (expectedValue === null || expectedValue === undefined) {
            if (!(cellValue === null || cellValue === undefined || cellValue === '')) {
              matches = false;
              break;
            }
          } else if (typeof expectedValue === 'string' && typeof cellValue === 'string') {
            if (cellValue.toLowerCase() !== expectedValue.toLowerCase()) {
              matches = false;
              break;
            }
          } else if (cellValue !== expectedValue) {
            matches = false;
            break;
          }
        }

        if (matches) {
          result.push({
            row: row,
            sheetRowIndex: i + 1 // Convert to 1-based sheet row number
          });
        }
      }

      return result;

    } catch (error) {
      this.logger.error('BatchOperations', `getRowsWithPosition failed for sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw new Error(
        `BatchOperations.getRowsWithPosition: Failed for sheet '${sheetName}' - ${error.message}`
      );
    }
  }

  /**
   * Security fix: Update row with optimistic locking to prevent race conditions
   * @param {string} sheetName - Name of the sheet
   * @param {string} actionId - ID of the action to update
   * @param {MohTask} updatedAction - Updated action object
   * @returns {Object} {success: boolean, error?: string, versionConflict?: boolean}
   */
  updateActionWithOptimisticLocking(sheetName, actionId, updatedAction) {
    try {
      const sheet = this._getSheet(sheetName);
      const headers = this.getHeaders(sheetName);
      let allData;
      try {
        allData = sheet.getDataRange().getValues();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get data range values for '${sheetName}' in updateActionWithOptimisticLocking`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.updateActionWithOptimisticLocking: Failed to get data range values for sheet '${sheetName}': ${e.message}`);
      }

      // Find the action row
      const actionIdColIndex = headers.indexOf('action_id');
      const versionColIndex = headers.indexOf('version');

      if (actionIdColIndex === -1 || versionColIndex === -1) {
        return { success: false, error: 'Missing required columns (action_id or version)' };
      }

      let targetRowIndex = -1;
      let currentDbVersion = -1;

      // Find the target row and get its current version
      for (let i = 1; i < allData.length; i++) { // Skip header row
        if (allData[i][actionIdColIndex] === actionId) {
          targetRowIndex = i + 1; // Convert to 1-based sheet index
          currentDbVersion = parseInt(allData[i][versionColIndex] || 1, 10);
          break;
        }
      }

      if (targetRowIndex === -1) {
        return { success: false, error: `Action ${actionId} not found` };
      }

      // Check for version conflict - use smart retry system
      if (!updatedAction.isVersionCurrent(currentDbVersion)) {
        return this._handleVersionConflictWithRetry(sheetName, actionId, updatedAction, currentDbVersion, 1);
      }

      // Prepare the action for update (increments version)
      updatedAction.prepareForUpdate();

      // Convert action to row data
      const rowData = updatedAction.toSheetRow(headers);

      // Perform atomic update
      try {
        const range = sheet.getRange(targetRowIndex, 1, 1, headers.length);
        range.setValues([rowData]);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to set values for action ${actionId} in sheet '${sheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.updateActionWithOptimisticLocking: Failed to set values for action ${actionId} in sheet '${sheetName}': ${e.message}`);
      }

      return { success: true };

    } catch (error) {
      this.logger.error('BatchOperations', `Update operation failed for action ${actionId} in sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw error;  // Mutations never fail silently
    }
  }

  /**
   * Enhancement: Smart Retry + Selective Merge Conflict Resolution
   * Handles version conflicts with graduated escalation strategy
   * @param {string} sheetName - Name of the sheet
   * @param {string} actionId - ID of the action to update
   * @param {MohTask} updatedAction - Updated action object
   * @param {number} expectedDbVersion - Version we expected to find
   * @param {number} attempt - Current retry attempt (1-3)
   * @returns {Object} {success: boolean, merged?: boolean, retryAttempt?: number, error?: string}
   */
  _handleVersionConflictWithRetry(sheetName, actionId, updatedAction, expectedDbVersion, attempt) {
    // Use constructor-injected logger
    const logger = this.logger;

    // Retry configuration constants
    const MAX_RETRY_ATTEMPTS = 3;
    const BASE_BACKOFF_MS = 100;
    const MAX_BACKOFF_MS = 1000;
    const JITTER_FACTOR = 0.1;

    logger.warn('OptimisticLocking', `Version conflict detected - attempt ${attempt}`, {
      actionId,
      expectedVersion: updatedAction.version,
      currentDbVersion: expectedDbVersion,
      retryAttempt: attempt
    });

    // Strike 1: Immediate retry (assume microsecond timing collision)
    if (attempt === 1) {
      logger.debug('OptimisticLocking', 'Strike 1: Immediate retry', { actionId });
      return this._attemptRetryUpdate(sheetName, actionId, updatedAction, attempt);
    }

    // Strike 2: Delayed retry with exponential backoff
    if (attempt === 2) {
      const backoffMs = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
      const jitter = Math.random() * JITTER_FACTOR * backoffMs;
      const delayMs = Math.round(backoffMs + jitter);

      logger.warn('OptimisticLocking', 'Retry attempt due to version conflict', {
        attempt,
        requiredDelay: delayMs
      });

      // NO SLEEP: Use timestamp-based backoff instead of blocking
      const retryKey = `olr_${sheetName}_${actionId}`;
      let cache;
      try {
        cache = CacheService.getScriptCache();
      } catch (e) {
        logger.error('BatchOperations', 'Failed to get script cache', { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations._handleVersionConflictWithRetry: Failed to get script cache: ${e.message}`);
      }
      let lastRetryTime;
      try {
        lastRetryTime = parseInt(cache.get(retryKey) || '0', 10);
      } catch (e) {
        logger.error('BatchOperations', `Failed to get cache entry for ${retryKey}`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations._handleVersionConflictWithRetry: Failed to get cache entry: ${e.message}`);
      }
      const now = Date.now();
      const elapsed = now - lastRetryTime;

      if (elapsed < delayMs) {
        // Backoff period not elapsed - fail fast
        logger.debug('OptimisticLocking', 'Retry blocked by backoff timer', {
          actionId,
          elapsed,
          required: delayMs,
          remaining: delayMs - elapsed
        });

        return {
          success: false,
          error: 'Version conflict - retry too soon',
          retryAfter: delayMs - elapsed,
          attempt: attempt
        };
      }

      // Update retry timestamp (1 second TTL to auto-cleanup)
      try {
        cache.put(retryKey, now.toString(), 1);
      } catch (e) {
        logger.error('BatchOperations', `Failed to put cache entry for ${retryKey}`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations._handleVersionConflictWithRetry: Failed to put cache entry: ${e.message}`);
      }

      // Proceed with retry
      return this._attemptRetryUpdate(sheetName, actionId, updatedAction, attempt);
    }

    // Strike 3: Merge resolution attempt
    if (attempt === 3) {
      logger.warn('OptimisticLocking', 'Strike 3: Attempting merge resolution', { actionId });
      return this._attemptMergeResolution(sheetName, actionId, updatedAction);
    }

    // Max attempts exceeded
    return {
      success: false,
      error: `Version conflict could not be resolved after ${MAX_RETRY_ATTEMPTS} attempts`,
      versionConflict: true,
      retryAttempt: attempt
    };
  }

  /**
   * Attempt retry update for optimistic locking
   * @param {string} sheetName - Name of the sheet
   * @param {string} actionId - ID of the action to update
   * @param {MohTask} updatedAction - Updated action object
   * @param {number} attempt - Current retry attempt
   * @returns {Object} Result of retry attempt
   */
  _attemptRetryUpdate(sheetName, actionId, updatedAction, attempt) {
    try {
      // Re-read current state to get fresh version
      const sheet = this._getSheet(sheetName);
      const headers = this.getHeaders(sheetName);
      let allData;
      try {
        allData = sheet.getDataRange().getValues();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get data range values for '${sheetName}' in _attemptRetryUpdate`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations._attemptRetryUpdate: Failed to get data range values for sheet '${sheetName}': ${e.message}`);
      }

      const actionIdColIndex = headers.indexOf('action_id');
      const versionColIndex = headers.indexOf('version');

      let currentDbVersion = -1;
      let targetRowIndex = -1;

      // Find current state
      for (let i = 1; i < allData.length; i++) { // Skip header row
        if (allData[i][actionIdColIndex] === actionId) {
          targetRowIndex = i + 1; // Convert to 1-based sheet index
          currentDbVersion = parseInt(allData[i][versionColIndex] || 1, 10);
          break;
        }
      }

      if (targetRowIndex === -1) {
        return { success: false, error: `Action ${actionId} not found on retry` };
      }

      // Check if conflict is resolved
      if (updatedAction.isVersionCurrent(currentDbVersion)) {
        // Version is now current - proceed with update
        updatedAction.prepareForUpdate();
        const rowData = updatedAction.toSheetRow(headers);
        try {
          const range = sheet.getRange(targetRowIndex, 1, 1, headers.length);
          range.setValues([rowData]);
        } catch (e) {
          this.logger.error('BatchOperations', `Failed to set values for action ${actionId} in sheet '${sheetName}' during retry`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations._attemptRetryUpdate: Failed to set values for action ${actionId} in sheet '${sheetName}': ${e.message}`);
        }

        return { success: true, retryAttempt: attempt };
      } else {
        // Still conflicted - escalate to next attempt
        return this._handleVersionConflictWithRetry(sheetName, actionId, updatedAction, currentDbVersion, attempt + 1);
      }

    } catch (error) {
      this.logger.error('BatchOperations', `Retry update operation failed for action ${actionId} (attempt ${attempt})`, { error: error.message, stack: error.stack });
      throw error;  // Mutations never fail silently
    }
  }

  /**
   * Attempt automatic merge resolution for version conflicts
   * @param {string} sheetName - Name of the sheet
   * @param {string} actionId - ID of the action to update
   * @param {MohTask} updatedAction - Updated action object
   * @returns {Object} Result of merge attempt
   */
  _attemptMergeResolution(sheetName, actionId, updatedAction) {
    try {
      // Get current database state
      const sheet = this._getSheet(sheetName);
      const headers = this.getHeaders(sheetName);
      let allData;
      try {
        allData = sheet.getDataRange().getValues();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get data range values for '${sheetName}' in _attemptMergeResolution`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations._attemptMergeResolution: Failed to get data range values for sheet '${sheetName}': ${e.message}`);
      }

      const actionIdColIndex = headers.indexOf('action_id');
      let targetRowIndex = -1;
      let currentRow = null;

      // Find current database row
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][actionIdColIndex] === actionId) {
          targetRowIndex = i + 1;
          currentRow = allData[i];
          break;
        }
      }

      if (!currentRow) {
        return { success: false, error: `Action ${actionId} not found for merge` };
      }

      // Create MohTask from current database state
      const currentTask = MohTask.fromSheetRow(currentRow, headers);
      if (!currentTask) {
        return { success: false, error: 'Failed to parse current database state for merge' };
      }

      // Attempt intelligent merge
      const mergeResult = this._intelligentMerge(currentTask, updatedAction);
      if (!mergeResult.success) {
        return { success: false, error: mergeResult.error, merged: false };
      }

      // Apply merged result
      const mergedTask = mergeResult.mergedTask;
      mergedTask.prepareForUpdate();
      const rowData = mergedTask.toSheetRow(headers);
      try {
        const range = sheet.getRange(targetRowIndex, 1, 1, headers.length);
        range.setValues([rowData]);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to set values for action ${actionId} in sheet '${sheetName}' during merge resolution`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations._attemptMergeResolution: Failed to set values for action ${actionId} in sheet '${sheetName}': ${e.message}`);
      }

      this.logger.info('OptimisticLocking', 'Successfully merged conflicting versions', {
        actionId,
        mergeStrategy: mergeResult.strategy
      });

      return { success: true, merged: true, mergeStrategy: mergeResult.strategy };

    } catch (error) {
      this.logger.error('BatchOperations', `Merge resolution operation failed for action ${actionId} in sheet '${sheetName}'`, { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Intelligent merge of two task versions
   * @param {MohTask} currentTask - Current database version
   * @param {MohTask} updatedTask - Version being applied
   * @returns {Object} Merge result with strategy information
   */
  _intelligentMerge(currentTask, updatedTask) {
    try {
      // Create a new task starting with current database state
      const mergedTask = MohTask.fromObject(currentTask.toJSON());

      let strategy = [];

      // Safe merge fields (prefer updated version for user-initiated changes)
      const safeMergeFields = ['title', 'description', 'priority', 'lane', 'energy_required'];
      for (const field of safeMergeFields) {
        if (updatedTask[field] !== undefined && updatedTask[field] !== currentTask[field]) {
          mergedTask[field] = updatedTask[field];
          strategy.push(`${field}:updated`);
        }
      }

      // Timestamp fields (prefer most recent)
      const timestampFields = ['last_modified', 'completed_at', 'scheduled_for'];
      for (const field of timestampFields) {
        if (updatedTask[field] && currentTask[field]) {
          const updatedTime = new Date(updatedTask[field]);
          const currentTime = new Date(currentTask[field]);
          mergedTask[field] = updatedTime > currentTime ? updatedTask[field] : currentTask[field];
          strategy.push(`${field}:latest`);
        } else if (updatedTask[field]) {
          mergedTask[field] = updatedTask[field];
          strategy.push(`${field}:updated`);
        }
      }

      // Numeric fields (prefer higher values for progress indicators)
      if (updatedTask.estimated_minutes && updatedTask.estimated_minutes > currentTask.estimated_minutes) {
        mergedTask.estimated_minutes = updatedTask.estimated_minutes;
        strategy.push('estimated_minutes:higher');
      }

      // Status merge logic (prefer more advanced status)
      const statusPriority = {
        [STATUS.NOT_STARTED]: 1,
        [STATUS.IN_PROGRESS]: 2,
        [STATUS.BLOCKED]: 3,
        [STATUS.COMPLETED]: 4,
        [STATUS.ARCHIVED]: 5
      };

      const currentStatusPrio = statusPriority[currentTask.status] || 1;
      const updatedStatusPrio = statusPriority[updatedTask.status] || 1;

      if (updatedStatusPrio > currentStatusPrio) {
        mergedTask.status = updatedTask.status;
        strategy.push('status:advanced');
      }

      return {
        success: true,
        mergedTask: mergedTask,
        strategy: strategy.join(', ')
      };

    } catch (error) {
      return {
        success: false,
        error: `Merge failed: ${error.message}`
      };
    }
  }

  /**
   * Execute operations in a transaction
   * @param {Array} operations - Array of operations to execute atomically
   * @returns {Object} Transaction result with ID and status
   */
  transaction(operations) {
    const transactionId = this.generateVersion();

    try {
      if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('Operations must be a non-empty array');
      }

      const results = [];
      const rollbackData = [];

      this.logger.info('BatchOperations', 'Starting transaction', {
        transactionId,
        operationCount: operations.length
      });

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];

        try {
          // Store rollback information before operation
          if (operation.type === 'append') {
            rollbackData.push({
              type: 'delete_rows',
              sheetName: operation.sheetName,
              startRow: null, // Will be set after append
              rowCount: operation.rows.length
            });
          }

          // Execute operation
          let result;
          switch (operation.type) {
            case 'append':
              result = this.appendRows(operation.sheetName, operation.rows);
              // Update rollback data with actual row position
              let lastRow;
              try {
                lastRow = this._getSheet(operation.sheetName).getLastRow();
              } catch (e) {
                this.logger.error('BatchOperations', `Failed to get last row for sheet ${operation.sheetName} during transaction append`, { error: e.message, stack: e.stack });
                throw new Error(`BatchOperations.transaction: Failed to get last row for sheet ${operation.sheetName}: ${e.message}`);
              }
              rollbackData[rollbackData.length - 1].startRow =
                lastRow - operation.rows.length + 1;
              break;

            case 'update':
              result = this.batchUpdate(operation.sheetName, operation.data);
              break;

            default:
              throw new Error(`Unknown operation type: ${operation.type}`);
          }

          results.push({ success: true, result });

        } catch (operationError) {
          // Transaction failed - rollback previous operations
          this.logger.error('BatchOperations', 'Transaction operation failed', {
            transactionId,
            operationIndex: i,
            error: operationError.message
          });

          this._performRollback(rollbackData);

          return {
            success: false,
            transactionId,
            error: `Operation ${i} failed: ${operationError.message}`,
            rolledBack: true
          };
        }
      }

      this.logger.info('BatchOperations', 'Transaction completed successfully', {
        transactionId,
        operationsExecuted: results.length
      });

      return {
        success: true,
        transactionId,
        results,
        operationsExecuted: results.length
      };

    } catch (error) {
      this.logger.error('BatchOperations', 'Transaction failed', {
        transactionId,
        error: error.message
      });

      return {
        success: false,
        transactionId,
        error: error.message
      };
    }
  }

  /**
   * Perform atomic sheet data swap with fallback to legacy pattern
   * Used for CALENDAR_PROJECTION refresh to avoid race conditions
   * @param {string} originalSheetName - Sheet to update
   * @param {Array<Array>} newData - New data including headers
   * @param {Object} configManager - Config manager instance
   * @param {Object} logger - Logger instance
   * @returns {boolean} True if successful
   */
  performAtomicSwapOrFallback(originalSheetName, newData, configManager, logger) {
    const startTime = Date.now();

    try {
      logger.debug('BatchOperations', `Starting atomic swap for ${originalSheetName} with ${newData.length} rows`);

      let spreadsheet;
      try {
        spreadsheet = getActiveSystemSpreadsheet();
      } catch (e) {
        logger.error('BatchOperations', `Failed to get active system spreadsheet for atomic swap for '${originalSheetName}'`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to get active system spreadsheet: ${e.message}`);
      }
      let sheet;
      try {
        sheet = spreadsheet.getSheetByName(originalSheetName);
      } catch (e) {
        logger.error('BatchOperations', `Failed to get sheet by name '${originalSheetName}' for atomic swap`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to get sheet '${originalSheetName}': ${e.message}`);
      }

      if (!sheet) {
        throw new Error(`Sheet ${originalSheetName} not found`);
      }

      // Attempt atomic operation: clear and set in one batch
      try {
        sheet.clear();
      } catch (e) {
        logger.error('BatchOperations', `Failed to clear sheet '${originalSheetName}' for atomic swap`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to clear sheet '${originalSheetName}': ${e.message}`);
      }

      if (newData && newData.length > 0) {
        try {
          const range = sheet.getRange(1, 1, newData.length, newData[0].length);
          range.setValues(newData);
        } catch (e) {
          logger.error('BatchOperations', `Failed to set values for sheet '${originalSheetName}' for atomic swap`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to set values for sheet '${originalSheetName}': ${e.message}`);
        }
      }

      const elapsedMs = Date.now() - startTime;
      logger.info('BatchOperations', `Atomic swap completed for ${originalSheetName} in ${elapsedMs}ms`);
      return true;

    } catch (error) {
      const elapsedMs = Date.now() - startTime;
      logger.warn('BatchOperations', `Atomic swap failed for ${originalSheetName} after ${elapsedMs}ms: ${error.message}`);
      logger.info('BatchOperations', `Falling back to legacy pattern for ${originalSheetName}`);

      // Fallback: traditional row-by-row
      try {
        let spreadsheetFallback;
        try {
          spreadsheetFallback = getActiveSystemSpreadsheet();
        } catch (e) {
          logger.error('BatchOperations', `Failed to get active system spreadsheet for fallback for '${originalSheetName}'`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to get active system spreadsheet for fallback: ${e.message}`);
        }
        let sheetFallback;
        try {
          sheetFallback = spreadsheetFallback.getSheetByName(originalSheetName);
        } catch (e) {
          logger.error('BatchOperations', `Failed to get sheet by name '${originalSheetName}' for fallback`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to get sheet '${originalSheetName}' for fallback: ${e.message}`);
        }
        try {
          sheetFallback.clearContents();
        } catch (e) {
          logger.error('BatchOperations', `Failed to clear contents for sheet '${originalSheetName}' during fallback`, { error: e.message, stack: e.stack });
          throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to clear contents for sheet '${originalSheetName}' during fallback: ${e.message}`);
        }

        if (newData && newData.length > 0) {
          for (let i = 0; i < newData.length; i++) {
            try {
              sheetFallback.getRange(i + 1, 1, 1, newData[i].length).setValues([newData[i]]);
            } catch (e) {
              logger.error('BatchOperations', `Failed to set values for row ${i} in sheet '${originalSheetName}' during fallback`, { error: e.message, stack: e.stack });
              throw new Error(`BatchOperations.performAtomicSwapOrFallback: Failed to set values for row ${i} in sheet '${originalSheetName}' during fallback: ${e.message}`);
            }
          }
        }

        logger.info('BatchOperations', `Legacy fallback completed for ${originalSheetName}`);
        return true;

      } catch (fallbackError) {
        logger.error('BatchOperations', `Both atomic and fallback failed for ${originalSheetName}: ${fallbackError.message}`);
        return false;
      }
    }
  }

  /**
   * Rollback a specific transaction
   * @param {string} transactionId - ID of the transaction to rollback
   * @returns {Object} Rollback result
   */
  rollback(transactionId) {
    try {
      if (!transactionId || typeof transactionId !== 'string') {
        throw new Error('Transaction ID must be provided');
      }

      this.logger.warn('BatchOperations', 'Manual rollback requested', { transactionId });

      // In a full implementation, we would store transaction metadata
      // For this implementation, we'll provide a basic rollback structure
      return {
        success: false,
        transactionId,
        error: 'Manual rollback not supported - transaction metadata not stored',
        recommendation: 'Use atomic transaction() method for automatic rollback support'
      };

    } catch (error) {
      this.logger.error('BatchOperations', 'Rollback failed', {
        transactionId,
        error: error.message
      });

      return {
        success: false,
        transactionId,
        error: error.message
      };
    }
  }

  /**
   * Private helper: Perform rollback operations
   * @param {Array} rollbackData - Array of rollback operations
   * @private
   */
  _performRollback(rollbackData) {
    try {
      this.logger.info('BatchOperations', 'Performing transaction rollback', {
        operations: rollbackData.length
      });

      // Execute rollback operations in reverse order
      for (let i = rollbackData.length - 1; i >= 0; i--) {
        const rollbackOp = rollbackData[i];

        try {
          if (rollbackOp.type === 'delete_rows' && rollbackOp.startRow) {
            let sheet;
            try {
              sheet = this._getSheet(rollbackOp.sheetName);
            } catch (e) {
              this.logger.error('BatchOperations', `Failed to get sheet ${rollbackOp.sheetName} for rollback`, { error: e.message, stack: e.stack });
              continue; // Try to rollback other operations
            }
            try {
              sheet.deleteRows(rollbackOp.startRow, rollbackOp.rowCount);
            } catch (e) {
              this.logger.error('BatchOperations', `Failed to delete rows for sheet ${rollbackOp.sheetName} during rollback`, { error: e.message, stack: e.stack });
              continue; // Try to rollback other operations
            }
          }
        } catch (rollbackError) {
          this.logger.error('BatchOperations', 'Rollback operation failed', {
            operation: rollbackOp,
            error: rollbackError.message,
            stack: rollbackError.stack
          });
        }
      }

    } catch (error) {
      this.logger.error('BatchOperations', 'Rollback process failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Self-test method for deployment validation
   * @returns {boolean} True if all basic functionality works
   */
  selfTest() {
    try {
      // Test 1: Spreadsheet access
      let spreadsheet;
      try {
        spreadsheet = this._getSpreadsheet();
      } catch (e) {
        this.logger.error('BatchOperations', 'Self-test spreadsheet access failed', { error: e.message, stack: e.stack });
        return false;
      }
      if (!spreadsheet) {
        return false;
      }

      // Test 2: Header caching (using a known sheet)
      try {
        const headers = this.getHeaders(SHEET_NAMES.ACTIONS);
        if (!headers || !Array.isArray(headers) || headers.length === 0) {
          return false;
        }
      } catch (headerError) {
        this.logger.error('BatchOperations', 'Self-test header access failed', {
          error: headerError.message,
          stack: headerError.stack,
          context: 'selfTest'
        });

        throw headerError;
      }

      // Test 3: Safe sheet access
      try {
        const testSheet = this._getSheet(SHEET_NAMES.ACTIONS);
        // Just accessing - no writes in self-test
      } catch (sheetError) {
        this.logger.error('BatchOperations', 'Self-test sheet access failed', {
          error: sheetError.message,
          stack: sheetError.stack,
          context: 'selfTest'
        });

        throw sheetError;
      }

      // Test 4: Version generation
      const version1 = this.generateVersion();
      const version2 = this.generateVersion();
      if (typeof version1 !== 'string' || typeof version2 !== 'string') {
        return false;
      }
      if (version1 === version2) {
        // Versions should be unique
        return false;
      }

      // Test 5: Utility functions
      const testObject = { test: 'value', number: 123, nested: { inner: 'data' } };
      const cloned = this.deepClone(testObject);
      if (!cloned || cloned === testObject || cloned.test !== 'value' || cloned.nested.inner !== 'data') {
        return false;
      }

      // Test 6: Array chunking
      const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = this.chunkArray(testArray, 3);
      if (!chunks || chunks.length !== 4 || chunks[0].length !== 3 || chunks[3].length !== 1) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('BatchOperations', `Self-test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Batch write multiple rows to a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array<Array>} rows - Array of rows to write
   * @param {Object} options - Write options
   * @returns {Object} Write result
   */
  batchWrite(sheetName, rows, options = {}) {
    try {
      if (!sheetName || !rows || !Array.isArray(rows)) {
        throw new Error('Invalid parameters for batchWrite');
      }

      const sheet = this._getSheet(sheetName);
      let lastRow;
      try {
        lastRow = sheet.getLastRow();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get last row for '${sheetName}' in batchWrite`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.batchWrite: Failed to get last row for sheet '${sheetName}': ${e.message}`);
      }
      const numRows = rows.length;

      if (numRows === 0) {
        return { success: true, rowsWritten: 0 };
      }

      const numCols = rows[0].length;
      try {
        const range = sheet.getRange(lastRow + 1, 1, numRows, numCols);
        range.setValues(rows);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to set values for '${sheetName}' in batchWrite`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.batchWrite: Failed to set values for sheet '${sheetName}': ${e.message}`);
      }

      this.logger.info('BatchOperations', `Batch wrote ${numRows} rows to ${sheetName}`);
      return { success: true, rowsWritten: numRows };

    } catch (error) {
      this.logger.error('BatchOperations', 'Batch write failed', { error: error.message, sheetName, stack: error.stack });
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch read multiple rows from a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Object} options - Read options (offset, limit)
   * @returns {Array<Array>} Array of rows
   */
  batchRead(sheetName, options = {}) {
    try {
      if (!sheetName) {
        throw new Error('Sheet name is required for batchRead');
      }

      const { offset = 0, limit = 1000 } = options;
      const sheet = this._getSheet(sheetName);
      let lastRow;
      try {
        lastRow = sheet.getLastRow();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get last row for '${sheetName}' in batchRead`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.batchRead: Failed to get last row for sheet '${sheetName}': ${e.message}`);
      }
      let lastCol;
      try {
        lastCol = sheet.getLastColumn();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get last column for '${sheetName}' in batchRead`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.batchRead: Failed to get last column for sheet '${sheetName}': ${e.message}`);
      }

      if (lastRow === 0 || lastCol === 0) {
        return [];
      }

      const startRow = Math.max(2, offset + 2); // Skip header
      const numRows = Math.min(limit, lastRow - startRow + 1);

      if (numRows <= 0) {
        return [];
      }

      let range;
      try {
        range = sheet.getRange(startRow, 1, numRows, lastCol);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get range for '${sheetName}' in batchRead`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.batchRead: Failed to get range for sheet '${sheetName}': ${e.message}`);
      }
      let values;
      try {
        values = range.getValues();
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get values from range for '${sheetName}' in batchRead`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations.batchRead: Failed to get values from range for sheet '${sheetName}': ${e.message}`);
      }

      this.logger.info('BatchOperations', `Batch read ${values.length} rows from ${sheetName}`);
      return values;

    } catch (error) {
      this.logger.error('BatchOperations', 'Batch read failed', { error: error.message, sheetName, stack: error.stack });
      return [];
    }
  }

  /**
   * Deduplicate rows based on first column ID matching against existing sheet data
   * @param {Array<Array>} rows - Rows to filter
   * @param {string} sheetName - Name of sheet to check against
   * @returns {Object} Deduplication result with filtered rows
   * @private
   */
  _deduplicateRows(rows, sheetName) {
    const result = {
      filtered: rows,
      originalCount: rows.length,
      allDuplicates: false
    };

    // Skip deduplication if first column is empty
    if (rows.length === 0 || rows[0].length === 0 || !rows[0][0]) {
      return result;
    }

    try {
      let existingData;
      try {
        existingData = this.getAllSheetData(sheetName);
      } catch (e) {
        this.logger.error('BatchOperations', `Failed to get all sheet data for '${sheetName}' in _deduplicateRows`, { error: e.message, stack: e.stack });
        throw new Error(`BatchOperations._deduplicateRows: Failed to get all sheet data for sheet '${sheetName}': ${e.message}`);
      }

      if (existingData.length > 1) { // Has data beyond header
        const existingIds = new Set(existingData.slice(1).map(row => row[0]));
        const filteredRows = rows.filter(row => !existingIds.has(row[0]));

        if (filteredRows.length === 0) {
          this.logger.info('BatchOperations', `All ${rows.length} rows already exist in ${sheetName} - skipping append`);
          result.allDuplicates = true;
          return result;
        } else if (filteredRows.length < rows.length) {
          this.logger.info('BatchOperations', `Filtered ${rows.length - filteredRows.length} duplicate rows from ${sheetName}`);
        }

        result.filtered = filteredRows;
      }
    } catch (dedupeError) {
      // If deduplication fails, log warning and continue with original rows
      this.logger.warn('BatchOperations', `Duplicate detection failed for ${sheetName}: ${dedupeError.message}`, { stack: dedupeError.stack });
    }

    return result;
  }

  /**
   * Get column map for a sheet (cached or build new)
   * @param {string} sheetName - Name of the sheet
   * @returns {Object} Map of column names to indices
   * @private
   */
  _getColumnMap(sheetName) {
    // Return cached map if available
    if (this.columnMapCache[sheetName]) {
      return this.columnMapCache[sheetName];
    }

    // Build and cache new column map
    let headers;
    try {
      headers = this.getHeaders(sheetName);
    } catch (e) {
      this.logger.error('BatchOperations', `Failed to get headers for '${sheetName}' in _getColumnMap`, { error: e.message, stack: e.stack });
      throw new Error(`BatchOperations._getColumnMap: Failed to get headers for sheet '${sheetName}': ${e.message}`);
    }
    const columnMap = {};
    headers.forEach((header, index) => {
      columnMap[header] = index;
    });

    this.columnMapCache[sheetName] = columnMap;
    return columnMap;
  }

  /**
   * Clear column map cache for a sheet (call when structure changes)
   * @param {string} sheetName - Name of the sheet to clear cache for
   */
  clearColumnMapCache(sheetName) {
    if (sheetName) {
      delete this.columnMapCache[sheetName];
    } else {
      // Clear all if no sheet specified
      this.columnMapCache = {};
    }
  }

  /**
   * Compare cell value against expected value with type-aware logic
   * @param {any} cellValue - Value from sheet cell
   * @param {any} expectedValue - Expected value to match against
   * @returns {boolean} True if values match
   * @private
   */
  _compareValues(cellValue, expectedValue) {
    // Handle null/undefined/empty
    if (expectedValue === null || expectedValue === undefined) {
      return cellValue === null || cellValue === undefined || cellValue === '';
    }

    // Case-insensitive string comparison
    if (typeof expectedValue === 'string' && typeof cellValue === 'string') {
      return cellValue.toLowerCase() === expectedValue.toLowerCase();
    }

    // Exact match for other types (numbers, booleans, etc.)
    return cellValue === expectedValue;
  }

  /**
   * Check if row matches ALL filter conditions (AND operator)
   * @param {Array} row - Sheet row to check
   * @param {Object} columnMap - Map of column names to indices
   * @param {Array} filterKeys - Array of filter keys
   * @param {Object} filterObject - Object with filter key-value pairs
   * @returns {boolean} True if all conditions match
   * @private
   */
  _matchesFilterAnd(row, columnMap, filterKeys, filterObject) {
    return filterKeys.every(key => {
      const columnIndex = columnMap[key];
      const cellValue = row[columnIndex];
      const expectedValue = filterObject[key];
      return this._compareValues(cellValue, expectedValue);
    });
  }

  /**
   * Check if row matches ANY filter condition (OR operator)
   * @param {Array} row - Sheet row to check
   * @param {Object} columnMap - Map of column names to indices
   * @param {Array} filterKeys - Array of filter keys
   * @param {Object} filterObject - Object with filter key-value pairs
   * @returns {boolean} True if any condition matches
   * @private
   */
  _matchesFilterOr(row, columnMap, filterKeys, filterObject) {
    return filterKeys.some(key => {
      const columnIndex = columnMap[key];
      const cellValue = row[columnIndex];
      const expectedValue = filterObject[key];
      return this._compareValues(cellValue, expectedValue);
    });
  }
}

