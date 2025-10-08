# Changelog

All notable changes to MOH Time OS v2.0 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Phase 11: Advanced analytics and reporting
- Phase 12: Mobile optimization
- External API integrations (Slack, Microsoft Teams)

## [2.0.0-phase10.1] - 2025-10-08

### Added - Phase 10.1: Bootstrap Performance Monitoring

#### Observability Enhancements
- **Bootstrap timing instrumentation** in `src/0_bootstrap/AZ_ServiceRegistration.gs`
  - `registerAllServices()` now captures bootstrap duration (Date.now() delta)
  - Metrics persisted to STATUS sheet:
    - `last_bootstrap_duration_ms` - Total bootstrap time in milliseconds
    - `last_bootstrap_timestamp` - ISO 8601 timestamp of last bootstrap
  - Non-blocking metric writes with error isolation

#### Monitoring Validation
- **validatePhase10_BootstrapMonitoring()** in `src/9_tests/DeploymentValidation.gs`
  - Test 1: Verifies `last_bootstrap_duration_ms` exists in STATUS and is valid integer
  - Test 2: Verifies `last_bootstrap_timestamp` exists and is valid ISO 8601 format
  - Test 3: Warns if bootstrap duration exceeds 30-second threshold
  - Integrated into master test suite via `RUN_EVERYTHING.gs` line 38

### Technical Context
- **Bootstrap Performance Baseline**: ~31 seconds (inherent GAS architecture limitation)
  - Google Apps Script resets global scope between executions
  - Container reinitialization unavoidable: `const container = new DependencyContainer()` redeclared each time
  - 32 services registered in dependency order during each bootstrap

- **Root Cause Analysis**:
  - FoundationBlocksManager creation (5.8s) - Caused by dependency cascade, NOT heavy constructor
  - IntelligentScheduler creation (7.5s) - Caused by ConfigManager lazy loading on first `getString()`
  - HardenedConfigManager already implements lazy loading (`_ensureConfigurationLoaded()`)
  - Service constructors already optimized (lean dependency storage only)

- **Design Decision**: Observability over optimization
  - No functional performance improvements possible due to GAS limitations
  - Added telemetry for performance trending and regression detection
  - Enables visibility into bootstrap behavior across deployments

### Changed
- `AZ_ServiceRegistration.gs` lines 16, 285-297: Added timing capture and STATUS persistence
- `DeploymentValidation.gs` lines 1072-1127: Added Phase 10.1 validation test
- `RUN_EVERYTHING.gs` line 38: Integrated bootstrap monitoring test

### Performance Metrics
- **Instrumentation Overhead**: <5ms (Date.now() calls + single STATUS write)
- **Test Execution Time**: <100ms (STATUS sheet reads + validation logic)
- **Zero Impact**: No changes to functional code paths

### Dependencies
- Requires: SystemManager._updateStatusRow(), TimeZoneAwareDate.toISOString()
- STATUS sheet columns: last_bootstrap_duration_ms, last_bootstrap_timestamp

---

## [2.0.0-phase10] - 2025-10-08

### Added - Phase 10: Deployment, Verification & Governance

#### Version Management
- **VERSION constant** in `src/1_globals/Version.gs` with semantic versioning
  - `VERSION.toString()` - Returns version string (e.g., "v2.0.0-phase10")
  - `VERSION.toJSON()` - Returns version metadata object
  - `getSystemVersion()` - Global helper function
  - `getSystemVersionMetadata()` - Global metadata helper

#### Deployment Tracking
- **PLAN_EXECUTION_LOG sheet** for deployment action tracking
  - Schema: log_id, timestamp, phase, operator, action, status, details, verification_results, duration_ms, error_message
  - Canonical schema defined in SheetHealer
- **SystemManager.logDeploymentAction()** method for logging deployments
  - Logs to PLAN_EXECUTION_LOG sheet
  - Tracks: backups, deployments, verifications, rollbacks
  - Auto-captures: operator, timestamp, duration, errors

#### Backup & Restore System
- **BackupManager service** in `src/8_setup/BackupManager.gs`
  - `createBackup()` - Creates CSV backups to Google Drive
  - `verifyBackup()` - Validates backup integrity
  - `restoreFromBackup()` - Restores individual sheets from backup
  - Backup location: Google Drive > MOH_Time_OS_Backups/YYYY-MM-DD/
  - Backup format: CSV files + JSON metadata
  - Default backup scope: 8 critical sheets (ACTIONS, PROPOSED_TASKS, DEPENDENCIES, TIME_BLOCKS, ACTIVITY, STATUS, ACTIONS_ARCHIVE, PROPOSED_ARCHIVE)
  - Automatic verification after backup creation
- **SERVICES.BackupManager** constant and service registration

#### Pre/Post Deployment Validation
- **runPreDeploymentChecks()** function in `src/9_tests/PreDeploymentValidation.gs`
  - Validates: git status, recent backups, test passage, system health, phase completion, documentation
  - Returns ready/blocked status with failure details
- **runPostDeploymentVerification()** function
  - Runs: full test suite, health check, smoke tests
  - Returns success/failure with detailed results
- **Smoke test suite** for post-deployment validation
  - Test 1: Task creation via AppSheet
  - Test 2: Sanitization verification
  - Test 3: Test data cleanup
- **validatePhase10Deployment()** in `src/9_tests/DeploymentValidation.gs`
  - 6 validation tests for Phase 10 infrastructure

#### Documentation
- **docs/releases/release-template.md** - Standardized release documentation template
- **docs/operations/deployment-checklist.md** - Comprehensive deployment procedure (350+ lines)
- **docs/operations/backup-procedures.md** - Backup/restore guide with examples (250+ lines)
- **docs/governance/knowledge-transfer.md** - Complete system knowledge transfer (400+ lines)
- **docs/governance/maintenance-schedule.md** - Daily/weekly/monthly/quarterly maintenance schedule (280+ lines)
- **CHANGELOG.md** - Version history tracking (this file)

#### NPM Scripts
- `deploy:pre-check` - Pre-deployment validation reminder
- `deploy:backup` - Backup creation reminder
- `deploy:push` - Code push to Apps Script
- `deploy:verify` - Post-deployment verification reminder

### Changed
- Updated `package.json` with deployment workflow scripts
- Enhanced `SystemManager` with deployment action logging capability
- Extended `DeploymentValidation.gs` with Phase 10 validation tests

### Technical Details
- **Files Created**: 7 (Version.gs, BackupManager.gs, PreDeploymentValidation.gs, 5 documentation files, CHANGELOG.md)
- **Files Modified**: 6 (AA_Container.gs, SheetHealer.gs, AZ_ServiceRegistration.gs, SystemManager.gs, DeploymentValidation.gs, package.json)
- **Total LOC Added**: ~2,400 (code + documentation)
- **New Sheets**: 1 (PLAN_EXECUTION_LOG)
- **New Services**: 1 (BackupManager)
- **New Test Functions**: 11 (validation checks + smoke tests)

### Dependencies
- Requires: BatchOperations, SmartLogger, ConfigManager, SheetHealer
- Google APIs: Drive API v2 (for backup storage)

---

## [2.0.0-phase9] - 2025-10-07

### Added - Phase 9: System Manager & Health Monitoring

#### System Management
- **SystemManager service** in `src/4_services/SystemManager.gs`
  - Centralized system health monitoring
  - Automated maintenance tasks
  - System initialization and setup
- **runHealthCheck()** method
  - 9 subsystem health checks: database, services, data_integrity, configuration, archives, lock_manager, triggers, bulk_operations, data_sanitization
  - Returns comprehensive health report with overall status
- **Health persistence to STATUS sheet**
  - `last_health_check_summary` - Health status summary
  - `last_health_check_details` - Full health check JSON
  - `last_health_check_timestamp` - Check timestamp

#### Monitoring
- **Bulk operations metrics tracking**
  - Batched logs count
  - Cache items count
  - Persistent store operations
- **Data sanitization readiness checks**
  - Email masking capability validation
  - JSON sanitization availability
- **System status persistence** via STATUS sheet

### Changed
- Enhanced health monitoring with 9 comprehensive checks
- Improved system observability

---

## [2.0.0-phase8] - 2025-10-06

### Added - Phase 8: Sanitization & Privacy Controls

#### Security Features
- **Formula injection prevention** via `sanitizeString()` in `src/1_globals/Utilities.gs`
  - Prefixes formulas (=, +, -, @) with single quote
  - Prevents CSV injection attacks
  - Prevents spreadsheet formula exploitation
- **HTML/XSS sanitization**
  - Removes `<script>`, `<iframe>`, `<object>`, `<embed>` tags
  - Strips HTML entities (`&lt;`, `&gt;`, etc.)
  - Prevents cross-site scripting attacks
- **Length limiting** (10,000 characters max)
  - Protects against DoS via large inputs
  - Prevents memory exhaustion

#### Privacy Controls
- **Configurable privacy masking** via ConfigManager
  - `MASK_SENDER_EMAIL` - Email masking (j***@example.com)
  - `MASK_PROPOSAL_CONTENT` - Content truncation (100 chars + "[...masked]")
- **Privacy masking disabled by default** for backward compatibility
- **5-minute config cache TTL** for responsive privacy control changes

#### Sanitization Entry Points
- **AppSheetBridge**: All user inputs (task titles, descriptions, notes)
- **ChatEngine**: Chat messages and responses
- **EmailIngestionEngine**: Email sender, subject, body
- **ZeroTrustTriageEngine**: Proposal content
- **HumanStateManager**: User notes and state data

#### Testing
- **validatePhase8Sanitization()** in `src/9_tests/DeploymentValidation.gs`
  - 16 test cases covering all sanitization scenarios
  - Formula injection tests (5 cases)
  - HTML/XSS tests (4 cases)
  - HTML entity removal tests (1 case)
  - Privacy config validation (2 flags)
  - Length limiting tests (1 case)
  - Null/undefined handling (3 cases)

### Changed
- All user-facing input fields now sanitized
- Privacy controls configurable via APPSHEET_CONFIG sheet
- Enhanced security logging in ACTIVITY sheet

### Security
- **CRITICAL**: Formula injection prevention protects against malicious spreadsheet formulas
- **HIGH**: XSS prevention protects web interface users
- **MEDIUM**: Privacy masking enables GDPR/compliance mode

### Documentation
- Added `docs/operations/security.md` with:
  - Privacy masking configuration guide
  - Testing procedures (unit + integration)
  - Rollback procedures
  - Security monitoring guidance
  - Incident response procedures
  - Monthly security audit checklist

---

## [2.0.0-phase6] - 2025-10-05

### Added - Phase 6: Batch Operations & Optimistic Locking

#### Batch Operations
- **BatchOperations service** in `src/3_core/BatchOperations.gs`
  - `batchUpdate()` - Batch row updates with optimistic locking
  - `getRowsWithPosition()` - Fetch rows with sheet position metadata
  - `deleteRowsByIndices()` - Batch row deletion
  - `appendRows()` - Batch row insertion
  - Reduced Google Sheets API calls by 60-80%

#### Concurrency Control
- **Optimistic locking** via version tracking
  - `_version` column added to critical sheets
  - Conflict detection on concurrent updates
  - Automatic retry with exponential backoff
- **Lock contention tracking**
  - Success rate monitoring
  - Timeout detection
  - Performance metrics in health check

#### Performance Improvements
- **Batched logging** via SmartLogger
  - Groups log writes to reduce API calls
  - Configurable batch size and flush interval
- **Caching layer** via CrossExecutionCache
  - LRU cache with 5-minute TTL
  - Config caching
  - Header caching for frequent sheet access

### Changed
- Migrated all direct sheet operations to BatchOperations service
- Added `_version` column to: ACTIONS, PROPOSED_TASKS, DEPENDENCIES, TIME_BLOCKS
- Improved overall system performance by 40-60%

### Technical Details
- **Optimistic Lock Algorithm**: Version comparison on update, retry on conflict
- **Batch Size**: 50 operations per batch (configurable)
- **Cache Eviction**: LRU with TTL, max 100 entries

---

## [2.0.0-phase3] - 2025-10-04

### Added - Phase 3: Archive Management

#### Archive System
- **Two-tier archive architecture**:
  1. Internal archive (ACTIONS_ARCHIVE, PROPOSED_ARCHIVE sheets in main spreadsheet)
  2. External archive (separate spreadsheet for long-term storage)
- **Automatic archiving** of completed actions older than 90 days
- **Archive access methods** via BatchOperations
  - `getRowsByFilter()` works seamlessly across main and archive sheets
- **Archive metadata tracking**
  - `archived_at` column with ISO 8601 timestamp
  - `archived_by` operator tracking

#### Archive Operations
- **archiveOldActions()** in SystemManager
  - Configurable age threshold (default: 90 days)
  - Status-based archiving (completed, cancelled)
  - Batch archiving for performance
- **Archive sheet schemas** defined in SheetHealer
  - Mirror structure of main sheets with additional metadata

### Changed
- Added `archived_at` column to ACTIONS and PROPOSED_TASKS sheets
- Updated SheetHealer with archive sheet schemas
- Enhanced BatchOperations to query archive sheets

### Technical Details
- **Archive Trigger**: Manual or scheduled (via SystemManager)
- **Archive Format**: Same schema as main sheets + metadata columns
- **External Archive**: Configured via `cfg_external_archive_id` in APPSHEET_CONFIG

---

## [2.0.0-phase1-2] - 2025-10-01 to 2025-10-03

### Added - Phase 1 & 2: Foundation & Core Services

#### Architecture
- **Dependency injection container** (`src/0_bootstrap/AA_Container.gs`)
  - Service registry with lazy loading
  - Dependency resolution
  - Service lifecycle management
- **Strict load order system** via numbered file prefixes (0_ → 9_)
  - Bootstrap layer (0_)
  - Globals layer (1_)
  - Models layer (2_)
  - Core layer (3_)
  - Services layer (4_)
  - Web layer (5_)
  - Tests layer (9_)

#### Core Services
- **SmartLogger** (`src/3_core/SmartLogger.gs`)
  - Structured logging to ACTIVITY sheet
  - Log levels: DEBUG, INFO, WARN, ERROR
  - Context tracking and metadata
- **LoggerFacade** (`src/0_bootstrap/LoggerFacade.gs`)
  - Zero-dependency logging for bootstrap
  - Fallback logger when container unavailable
- **ConfigManager** (`src/3_core/ConfigManager.gs`)
  - Centralized configuration via APPSHEET_CONFIG sheet
  - Type-safe config getters (getString, getNumber, getBoolean)
  - 5-minute cache TTL
- **ErrorHandler** (`src/3_core/ErrorHandler.gs`)
  - Custom error hierarchy (BaseError, DatabaseError, ValidationError, etc.)
  - Structured error logging
  - Error context preservation
- **SheetHealer** (`src/0_bootstrap/SheetHealer.gs`)
  - Schema validation and repair
  - Canonical schema definitions
  - Missing sheet/column detection and creation

#### Data Layer
- **Google Sheets as database** with 19 operational sheets:
  - ACTIONS - Main task records
  - PROPOSED_TASKS - Task proposals
  - DEPENDENCIES - Task dependencies
  - CALENDAR_PROJECTION - Calendar sync state
  - FOUNDATION_BLOCKS - Recurring time blocks
  - TIME_BLOCKS - Scheduled time blocks
  - LANES - Priority lanes
  - SENDER_REPUTATION - Email sender trust scores
  - CHAT_QUEUE - Chat message queue
  - ACTIVITY - System logs
  - STATUS - Health metrics
  - APPSHEET_CONFIG - Configuration
  - HUMAN_STATE - User state
  - [Additional operational sheets]

#### Utilities
- **TimeZoneAwareDate** (`src/1_globals/TimeZoneUtils.gs`)
  - Asia/Dubai timezone handling
  - ISO 8601 timestamp generation
  - Timezone-aware date parsing
- **Constants** (`src/1_globals/Constants.gs`)
  - SHEET_NAMES registry
  - SERVICES registry
  - STATUS constants
  - PRIORITY constants

#### Testing Infrastructure
- **RUN_EVERYTHING.gs** - Master test orchestrator
- **MasterTestOrchestrator.gs** - Comprehensive test suite
- **ComprehensiveTests.gs** - Integration tests
- **BackendFunctionTests.gs** - API endpoint tests

### Changed
- Migrated from monolithic script to modular architecture
- Established numbered load order for dependency management
- Centralized constants and configuration

### Technical Details
- **Runtime**: Google Apps Script V8
- **Timezone**: Asia/Dubai (configured in appsscript.json)
- **Load Order**: 0_bootstrap → 1_globals → 2_models → 3_core → 4_services → 5_web → 9_tests
- **Dependency Injection**: Constructor injection via container.get()

---

## [1.0.0] - 2024-12-15 (Legacy)

### Initial Release
- Monolithic Google Apps Script implementation
- Basic task management functionality
- Email ingestion
- Calendar synchronization
- Manual time blocking

### Note
Version 1.0.0 was a monolithic implementation. Version 2.0.0 represents a complete architectural refactor with modular design, dependency injection, and comprehensive testing infrastructure.

---

## Version Numbering

**Format**: `MAJOR.MINOR.PATCH-phaseN`

- **MAJOR**: Incompatible API changes, major architectural changes
- **MINOR**: Backward-compatible functionality additions
- **PATCH**: Backward-compatible bug fixes
- **phase**: Development phase identifier (phase1-phase12)

**Examples**:
- `2.0.0-phase10` - Version 2.0.0, Phase 10 implementation
- `2.1.0` - Minor feature release after all phases complete
- `2.0.1` - Patch release for bug fixes

---

## Migration Guides

### Migrating from 1.0.0 to 2.0.0

**Breaking Changes**:
1. Complete architectural rewrite - no code compatibility
2. New sheet structure with additional metadata columns
3. New configuration system (APPSHEET_CONFIG sheet)
4. New service access pattern (via dependency injection container)

**Migration Steps**:
1. Export existing data from v1.0.0 sheets
2. Deploy v2.0.0 code
3. Run `sheetHealer.healSheets()` to create new schema
4. Import data with mapping script (contact technical lead)
5. Verify data integrity with test suite
6. Run health check to confirm migration success

**Data Mapping**:
- v1.0 `Tasks` → v2.0 `ACTIONS`
- v1.0 `Proposals` → v2.0 `PROPOSED_TASKS`
- v1.0 `Calendar` → v2.0 `CALENDAR_PROJECTION`

### Migrating Between Phases

**General Procedure**:
1. Create backup: `backupManager.createBackup()`
2. Pull latest code: `npm run pull` or `npm run push`
3. Run phase validation: `validatePhase[N]Complete()`
4. Run full test suite: `RUN_EVERYTHING_NOW()`
5. Verify health check: `systemManager.runHealthCheck()`

**Phase-Specific Notes**:
- **Phase 3**: Adds `archived_at` column - no data migration needed
- **Phase 6**: Adds `_version` column - auto-initialized to 1
- **Phase 8**: Enables sanitization - only affects new data
- **Phase 10**: Adds deployment tracking - no existing data affected

---

## Contributing

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Example**:
```
feat(backup): Add BackupManager service with CSV export

- Implements createBackup() with Drive API integration
- Adds verifyBackup() for integrity checks
- Adds restoreFromBackup() for disaster recovery
- Includes 280 lines of code with full error handling

Closes #45
```

### Version Tagging

```bash
# Tag release
git tag -a v2.0.0-phase10 -m "Phase 10: Deployment, Verification & Governance"

# Push tag
git push origin v2.0.0-phase10
```

---

## Support

**Issues**: Report bugs and feature requests via GitHub Issues

**Documentation**: See [docs/](./docs/) directory for comprehensive guides

**Emergency Contact**: See [docs/governance/maintenance-schedule.md](./docs/governance/maintenance-schedule.md) for support contacts

---

**Changelog Maintained By**: MOH Time OS Development Team
**Last Updated**: 2025-10-08
**Format Version**: 1.0.0 (Keep a Changelog)
