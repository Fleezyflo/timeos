# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MOH Time OS v2.0** is a sophisticated Google Apps Script (GAS) task management and scheduling system built on top of Google Sheets. It provides intelligent email triage, calendar synchronization, time blocking, and task management with a modular, dependency-injected architecture.

**Runtime Environment:** Google Apps Script V8 runtime
**Primary Data Store:** Google Sheets (acting as database)
**External APIs:** Gmail API v1, Google Calendar API v3
**Timezone:** Asia/Dubai (configured in appsscript.json)

## Development Commands

### Core Commands (via clasp)

```bash
# Authentication and setup
npm run login              # Authenticate with Google Apps Script

# Deploy to Google Apps Script
npm run push               # Push local changes to GAS
npm run pull               # Pull changes from GAS to local

# View logs and open editor
npm run logs               # View execution logs
npm run open               # Open project in GAS web editor

# Deployment
npm run deploy             # Deploy as web app or API executable
```

### Test Execution

Tests run **directly in Google Apps Script**, not locally. To execute tests:

1. Push code: `npm run push`
2. Open GAS editor: `npm run open`
3. In GAS editor, run one of these functions:
   - `RUN_EVERYTHING_NOW()` - Comprehensive system test (src/RUN_EVERYTHING.gs)
   - `RUN_ALL_TESTS()` - Complete test suite orchestration
   - `SYSTEM_PERFECTION_TEST()` - System validation test
   - Individual test functions from src/9_tests/

**Important:** There is no local Node.js test runner. All tests execute within the GAS runtime environment.

### Verification Scripts

These Node.js scripts validate code structure locally before pushing:

```bash
node validate_load_order.js        # Verify file load order dependencies
node phase2_final_verification.js  # Validate Phase 2 completion
node verify_phases_1_2.js          # Check phases 1-2 status
```

## Architecture

### Load Order and Bootstrap Sequence

The system uses a **strict numbered load order** to ensure dependencies are available before use:

1. **0_bootstrap/** - Core infrastructure loaded first
   - `AA_Container.gs` - Dependency injection container (loaded first due to AA prefix)
   - `LoggerFacade.gs` - Universal logging (no dependencies)
   - `SheetHealer.gs` - Schema validation and repair
   - `AZ_ServiceRegistration.gs` - Service registration (loaded last in bootstrap)

2. **1_globals/** - Global constants and utilities
   - `Constants.gs` - SHEET_NAMES, STATUS constants, SERVICES registry
   - `TimeZoneUtils.gs` - Timezone-aware date handling
   - `Utilities.gs` - General utility functions

3. **2_models/** - Data models and domain objects

4. **3_core/** - Core business logic
   - `0_BaseError.gs` - Base error class (loaded first)
   - `CustomErrors.gs` - Specialized error types
   - BatchOperations, ErrorHandler, SmartLogger, etc.

5. **4_services/** - Business services
   - `SystemManager.gs` - System health and maintenance
   - Email processing, calendar sync, scheduling services

6. **5_web/** - Web application and API endpoints
   - `WebAppManager.gs` - HTTP request handling
   - `ChatEngine.gs` - Chat interface
   - `AppSheetBridge.gs` - AppSheet integration

7. **7_support/** - Testing and development utilities
8. **8_setup/** - Initialization scripts
9. **9_tests/** - Comprehensive test suites

**Critical:** Files with numeric prefixes (0_, AA_, AZ_) control load order within directories.

### Dependency Injection Container

The system uses a **global singleton container** for service management:

```javascript
// Container is globally accessible after bootstrap
const logger = container.get(SERVICES.SmartLogger);
const batchOps = container.get(SERVICES.BatchOperations);
const systemMgr = container.get(SERVICES.SystemManager);
```

Services are registered in `AZ_ServiceRegistration.gs` and accessed via the `SERVICES` constant registry.

### Logging Strategy

**Three-tier logging system:**

1. **LoggerFacade** (0_bootstrap/LoggerFacade.gs)
   - Always available, no dependencies
   - Uses native `Logger.log()`
   - Fallback for all contexts
   - Use during bootstrap or when container unavailable

2. **SmartLogger** (3_core/)
   - Advanced logging with structured data
   - Sheet-based log persistence (ACTIVITY sheet)
   - Available after container initialization
   - Retrieved via `container.get(SERVICES.SmartLogger)`

3. **getLogger()** helper
   - Automatically selects appropriate logger
   - Tries SmartLogger first, falls back to LoggerFacade
   - Recommended for most code

```javascript
// Preferred pattern
const logger = getLogger();
logger.info('ComponentName', 'Operation completed', { details: data });

// Bootstrap/early init pattern
LoggerFacade.info('Bootstrap', 'Container initializing');
```

### Data Layer Architecture

**Google Sheets as Database:**

All data operations go through `BatchOperations` class (3_core/), which provides:
- Row-based CRUD operations
- Header-based column mapping
- Batch updates for performance
- Transaction-like operations with optimistic locking

**Sheet Structure (SHEET_NAMES constant in 1_globals/Constants.gs):**
- ACTIONS - Main task/action records
- PROPOSED_TASKS - Task proposals awaiting approval
- CALENDAR_PROJECTION - Calendar sync state
- FOUNDATION_BLOCKS - Recurring time blocks
- TIME_BLOCKS - Scheduled time blocks
- LANES - Priority lanes for task organization
- SENDER_REPUTATION - Email sender trust scores
- CHAT_QUEUE - Chat message queue
- ACTIVITY - System activity logs
- STATUS - System health metrics
- APPSHEET_CONFIG - AppSheet integration configuration
- HUMAN_STATE - User state and preferences

**Schema Management:**
- `SheetHealer` class validates and repairs schema
- Run `healSheets()` or via SystemManager setup
- Schema definitions in bootstrap layer

### Error Handling

**Custom error hierarchy (3_core/):**
- `BaseError` - Foundation class
- `DatabaseError`, `ValidationError`, `ConfigurationError`, etc.
- All errors extend BaseError for consistent handling

**Error handling pattern:**
```javascript
try {
  // operation
} catch (error) {
  LoggerFacade.error('Component', 'Operation failed', {
    error: error.message,
    stack: error.stack,
    context: 'operationName'
  });
  throw error; // or return sentinel value
}
```

### Testing Architecture

**Test organization (src/9_tests/):**
- `MasterTestOrchestrator.gs` - Central test orchestration
- `ComprehensiveTests.gs` - Integration tests
- `BackendFunctionTests.gs` - API endpoint tests
- Phase-specific validation tests (Phase3ValidationTest.gs, etc.)

**Test execution profile:**
- Tests must run in GAS environment (not Node.js)
- Use `RUN_EVERYTHING_NOW()` for full system validation
- Performance benchmarking and memory leak detection included
- Cryptographic test result verification

## Key Constraints and Conventions

### File Naming
- Use `.gs` extension for Google Apps Script files
- Numeric prefixes control load order (0_, 1_, 2_, etc.)
- AA/AZ prefixes for first/last within directory

### Code Style
- ES6 classes preferred
- Dependency injection via constructor
- No direct global access - use container
- Comprehensive JSDoc comments

### Critical Rules
1. **Never use console.log directly** - Use LoggerFacade or getLogger()
2. **Never create sheets directly** - Use BatchOperations or SheetHealer
3. **Never hardcode sheet names** - Use SHEET_NAMES constants
4. **Never bypass container** - Always inject dependencies
5. **Always run healSheets()** before schema operations
6. **Never assume container is ready** - Check before accessing services

### Deployment Safety
- Test locally first with `validate_load_order.js`
- Push with `npm run push`
- Verify in GAS editor before deploying
- Run `RUN_EVERYTHING_NOW()` to validate deployment
- Check logs with `npm run logs`

## Common Workflows

### Adding a New Service

1. Create service class in appropriate tier (3_core/ or 4_services/)
2. Add service name to SERVICES constant (1_globals/Constants.gs)
3. Register in container (0_bootstrap/AZ_ServiceRegistration.gs)
4. Inject dependencies via constructor
5. Add tests in 9_tests/
6. Update this file

### Debugging Runtime Issues

1. Check execution logs: `npm run logs`
2. Run health check: `runSystemHealthCheck()` in GAS editor
3. Validate schema: `healSheets()` via SystemManager
4. Check container registration: Verify service in AZ_ServiceRegistration.gs
5. Verify load order: Run `validate_load_order.js`

### Schema Changes

1. Update sheet definitions in SheetHealer
2. Run `healSheets()` to apply changes
3. Update BatchOperations if adding new operations
4. Update SHEET_NAMES constant if adding sheets
5. Test with comprehensive suite

## Project-Specific Context

This system implements a **System Execution Intelligence (SEI)** architecture as defined in the root CLAUDE.md. Key principles:

- **Evidence Over Assertion:** All operations must be verifiable
- **Zero Guessing Policy:** Never improvise missing information
- **Idempotency Assurance:** All operations safe to repeat
- **Auditability by Design:** Complete operation logging

The system is currently undergoing a multi-phase refactoring plan (see ATOMIC_EXECUTION_PLAN.md and various phase documents in root).
