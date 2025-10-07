# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MOH Time OS v2.0** is a sophisticated task and time management system built entirely on Google Apps Script (GAS V8 runtime). It integrates with Google Sheets, Gmail, and Google Calendar to automate the entire task lifecycle: ingestion, scheduling, management, and execution.

**Platform:** Google Apps Script V8 Runtime (no async/await, no optional chaining, no ES6 modules)
**Primary Interface:** Google Sheets with AppSheet Bridge for external API access
**Development:** clasp CLI for local development and deployment

## Core Architecture

### Dependency Injection Container

The system uses a custom DI container (`DependencyContainer` in `src/0_bootstrap/AA_Container.gs`) to manage all services. This is the heart of the architecture:

- **Container Initialization:** The container is globally available after `AA_Container.gs` loads
- **Service Registration:** All services are registered via `registerAllServices()` in `src/0_bootstrap/AZ_ServiceRegistration.gs`
- **Service Resolution:** Access services via `container.get(SERVICES.ServiceName)`
- **Load Order:** Files in `0_bootstrap/` are loaded alphabetically, hence the `AA_`, `AZ_` prefixes

### Bootstrap Sequence

The system has a **single, predictable initialization path** via `completeSetup()` in `src/8_setup/SystemBootstrap.gs`:

1. **Phase 1:** Container Setup - validates environment and container availability
2. **Phase 2:** Sheet Healing - ensures all required sheets exist with correct schemas
3. **Phase 3:** Service Registration - registers all services in dependency order
4. **Phase 4:** Service Validation - verifies critical services are operational
5. **Phase 5:** Trigger Installation - sets up time-based and event-driven triggers

**Critical:** The system uses `ensureBootstrapServices()` for stateless web app execution contexts where the container may need re-hydration. This function:
- Checks if the system has ever been initialized (`SYSTEM_INITIALIZED` script property)
- Runs `completeSetup()` if never initialized
- Re-hydrates the container via `registerAllServices()` if container is incomplete
- Uses `WebAppManager` presence as the container health check

### Directory Structure

```
src/
├── 0_bootstrap/       # Container, constants, enums, service registration (loads first)
├── 1_globals/         # Global utilities, timezone utils
├── 2_models/          # Data models (MohTask, TimeBlock)
├── 3_core/            # Core error classes and base error handling
├── 4_services/        # Business logic services (20+ services)
├── 5_web/             # Web app endpoints, AppSheet bridge, chat engine
├── 7_support/         # Support utilities (SafeColumnAccess, MockService)
├── 8_setup/           # System bootstrap and trigger setup
├── 9_tests/           # Comprehensive test suite
```

### Key Services

- **SmartLogger:** All logging goes through this service (never use `console.log` in production code; use `Logger.log` only during bootstrap before container is available)
- **BatchOperations:** Exclusive interface for Google Sheets operations (never call `SpreadsheetApp` directly)
- **ConfigManager:** Centralized configuration with caching
- **SystemManager:** System health, status, and shutdown operations
- **EmailIngestionEngine:** Email processing with "Zero Trust Triage" for task extraction
- **IntelligentScheduler:** Schedules tasks into "Foundation Blocks" based on energy/context/priority
- **CalendarSyncManager:** Bidirectional sync with Google Calendar
- **ErrorHandler:** Circuit breakers, retry logic, and error recovery
- **WebAppManager:** Web app request routing and response handling
- **AppSheetBridge:** External API endpoints for AppSheet integration

### Constants and Enums

All constants are defined in `CONSTANTS`, `SHEET_NAMES`, `SERVICES`, `STATUS`, etc. in `src/0_bootstrap/AA_Container.gs`. These are frozen objects and must be used throughout the codebase (no magic strings).

## Development Workflow

### Setup and Authentication

```bash
npm install          # Install clasp
clasp login         # Authenticate with Google
```

### Pushing Code

```bash
clasp push --force  # Push local files to Apps Script (--force avoids interactive prompts)
npm run push        # Alias for clasp push
```

### Deployment

```bash
./deploy.sh         # Automated deployment script (pushes, deploys, tests)
```

The script:
1. Pushes code via `clasp push --force`
2. Updates the web app deployment
3. Displays the web app URL
4. Attempts to run backend tests

### Opening Apps Script IDE

```bash
clasp open          # Opens the Apps Script web editor
npm run open        # Alias
```

### Running Tests

**From Apps Script Editor:**
- Run `RUN_ALL_TESTS()` function from `src/EXECUTE_ALL_TESTS_NOW.gs`
- Run `TEST()` from `src/RemoteControl.gs` for quick test access

**From Command Line:**
```bash
clasp run RUN_ALL_TESTS  # Requires Apps Script API enabled
```

### Viewing Logs

```bash
clasp logs          # Stream execution logs
npm run logs        # Alias
```

## RemoteControl Interface

The `src/RemoteControl.gs` file provides a user-friendly API for system operations. Run these functions from the Apps Script editor:

**System Control:**
- `START()` - Initialize the system (runs `completeSetup()`)
- `STOP()` - Shutdown system
- `RESET()` - Clear container and reinitialize

**Operations:**
- `EMAIL()` - Run email ingestion
- `SCHEDULE()` - Run scheduling cycle
- `SYNC()` - Sync with Google Calendar

**Maintenance:**
- `FIX()` - Run sheet healer to fix schema issues
- `CHECK()` - System health check
- `TEST()` - Run all tests

**Utilities:**
- `GET_STATUS()` - Get container and system status
- `CONFIG(key, value)` - Get or set configuration
- `BACKUP()` - Create system backup
- `HELP()` - Display available functions

**Triggers:**
- `INSTALL()` - Install all triggers
- `UNINSTALL()` - Remove all triggers
- `LIST()` - List current triggers

## Important Development Rules

### Google Apps Script V8 Constraints

- **No async/await:** GAS V8 doesn't support it
- **No optional chaining (?.):** Use explicit null checks
- **No ES6 modules:** No `import`/`export`, everything is global
- **No top-level await:** Not supported
- **No nested function declarations that V8 rejects:** Use function expressions or declarations at the top level

### Code Style

- **Dependency Access:** Always use `container.get(SERVICES.ServiceName)`, never create service instances directly
- **Logging:** Use `SmartLogger` service for all production logging, `Logger.log` only during bootstrap
- **Sheet Access:** Use `BatchOperations` service exclusively, never `SpreadsheetApp` directly
- **Error Handling:** Use custom error classes (`DatabaseError`, `ValidationError`, etc.) and `ErrorHandler` service
- **Constants:** Use `CONSTANTS`, `SERVICES`, `STATUS`, `SHEET_NAMES` enums, never magic strings
- **Stateless Services:** Services should be stateless and receive dependencies via constructor

### Sheet Healing

The `SheetHealer` (`src/0_bootstrap/SheetHealer.gs`) automatically:
- Creates missing sheets
- Adds missing columns
- Fixes header alignment issues
- Validates schema integrity

Run `healSheets()` or `FIX()` from RemoteControl if sheet issues occur.

### Testing

Tests are comprehensive and organized in `src/9_tests/`:
- **Unit Tests:** Individual service tests
- **Integration Tests:** Multi-service workflows
- **Validation Tests:** System health and deployment validation
- **Smoke Tests:** Calendar projection and envelope shape tests

All tests should:
- Use the container for service access
- Clean up after themselves
- Return structured results with pass/fail status
- Log failures with context

### Known Issues and Remediation

See `ULTIMATE_REMEDIATION_PLAN.md` for documented fixes:
- Bootstrap logic for stateless web app contexts
- AppSheet Bridge filter logic bugs
- Error propagation with stack traces

### Web App and API Endpoints

The web app is container-bound and handles:
- `doGet()` requests via `AppSheetBridge` for config/status endpoints
- `doPost()` requests via `WebAppManager` for task operations
- Authentication via `SecureWebAppAuth`

**Web App URL Pattern:** `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

### Critical Files

- `src/0_bootstrap/AA_Container.gs` - Container, constants, enums (loads first)
- `src/0_bootstrap/AZ_ServiceRegistration.gs` - Service registration
- `src/8_setup/SystemBootstrap.gs` - Bootstrap sequence
- `src/RemoteControl.gs` - User-facing API
- `src/5_web/AppSheetBridge.gs` - External API bridge
- `appsscript.json` - Apps Script manifest with OAuth scopes

## Timezone

The system operates in **Asia/Dubai** timezone (`CONSTANTS.TIMEZONE`). All date/time operations must account for this.

## Cache Strategy

The system uses multiple cache layers:
- **ScriptCache:** Short-term in-memory cache (5 minutes default)
- **PersistentStore:** Script properties for long-term storage
- **CrossExecutionCache:** Hybrid cache with compression for large payloads

Cache keys are prefixed and use TTL-based expiration.

## Error Handling Patterns

1. **Circuit Breakers:** Prevent cascading failures (5 failures trigger open circuit)
2. **Retry Logic:** Exponential backoff for transient errors (3 retries max)
3. **Error Propagation:** Stack traces are now propagated to frontend (recent fix)
4. **Fail Fast:** System throws errors immediately rather than silently failing

## Debugging

- Check logs: `clasp logs` or Apps Script IDE Executions tab
- Check system status: Run `GET_STATUS()` or `CHECK()`
- Verify container: Check if `typeof container !== 'undefined'`
- Verify services: Run `container.listServices()` to see registered services
- Run sheet healer: `FIX()` to repair schema issues
- Check script properties: `PropertiesService.getScriptProperties().getProperties()`
