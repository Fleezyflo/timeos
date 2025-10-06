# MOH Time OS v2.0

## Project Overview

This is a comprehensive, personal task and time management system named "MOH Time OS v2.0". It is built entirely on the Google Apps Script platform, deeply integrating with Google Sheets, Gmail, and Google Calendar to create a powerful automation engine for productivity.

**Core Purpose:**
The system is designed to automate the entire lifecycle of a task:
*   **Ingestion:** It can process incoming emails, identify actionable items using a "Zero Trust Triage Engine", and create task proposals.
*   **Scheduling:** An "Intelligent Scheduler" allocates tasks into "Foundation Blocks" (time slots) based on energy levels, context, priority, and deadlines.
*   **Management:** It tracks task status, dependencies, and human state (energy, mood, focus) to make adaptive scheduling decisions.
*   **Execution:** It provides a central dashboard in Google Sheets and can sync tasks to Google Calendar.
*   **Control:** A `RemoteControl` interface provides simple, high-level functions (`START`, `EMAIL`, `SCHEDULE`) to run the system from the Apps Script editor.

**Key Technologies:**
*   **Platform:** Google Apps Script (V8 Runtime)
*   **Primary Interface:** Google Sheets
*   **Integrations:** Google Calendar, Gmail
*   **Local Development:** `clasp` (Google's CLI for Apps Script) and `npm`.

**Architecture:**
The system is highly modular and follows modern software design principles, which is advanced for a Google Apps Script project.
*   **Dependency Injection:** It uses a custom dependency injection container (`DependencyContainer` in `0_bootstrap/AA_Container.gs`) to manage all its components.
*   **Service-Oriented:** The logic is broken down into dozens of individual services, each with a specific responsibility (e.g., `EmailIngestionEngine`, `IntelligentScheduler`, `CalendarSyncManager`, `SystemManager`). All services are registered in `src/8_setup/ServiceRegistration.gs` (Note: This file path might be outdated, as `SystemBootstrap.gs` now handles service registration via `registerAllServices()`).
*   **Robustness:** The architecture includes components for self-healing (`SheetHealer.gs`), error handling with circuit breakers (`ErrorHandler`), and distributed locking (`DistributedLockManager`).
*   **Bootstrap Process:** The system has a multi-phase bootstrap process (`SystemBootstrap.gs`) that ensures the environment is validated, sheets are created, and services are registered in the correct order.

## Building and Running

This project is managed using `npm` and `clasp`.

**1. Installation:**
Install development dependencies, including `clasp`.
```bash
npm install
```

**2. Authentication:**
Log in to your Google account to allow `clasp` to manage your Apps Script files.
```bash
clasp login
```

**3. Deployment:**
Push the local files to your Google Apps Script project. The `--force` flag is recommended to avoid interactive prompts that can cause the command to hang.
```bash
clasp push --force
```

**4. Initializing the System:**
The primary entry point for setting up the system for the first time is the `completeSetup()` function in `src/8_setup/SystemBootstrap.gs`.
*   Open the Google Apps Script editor.
*   Select the function `completeSetup` from the function list.
*   Click **Run**.

Alternatively, the `RemoteControl.gs` file provides a simpler `START()` function that can also be run from the editor.

**5. Running Core Operations:**
The `RemoteControl.gs` file provides simple, high-level functions to operate the system from the Apps Script editor:
*   `EMAIL()`: Runs the email ingestion process.
*   `SCHEDULE()`: Runs the intelligent scheduling cycle.
*   `SYNC()`: Syncs tasks with Google Calendar.
*   `CHECK()`: Runs a system health check.

**6. Testing:**
The project contains a comprehensive test suite. The main entry point for running all tests is the `RUN_ALL_TESTS_NOW()` function in the `RUN_ALL_TESTS_NOW.gs` file. Run this function from the Apps Script editor to validate system integrity.
A `run_tests.sh` script might also exist for local testing.

## Development Conventions

*   **File Structure:** The `src` directory is organized by feature/layer, including `0_bootstrap`, `1_globals`, `2_models`, `4_services`, `8_setup`, and `9_tests`.
*   **Dependency Management:** All services are managed by the custom DI container. Services should be stateless and receive their dependencies through their constructor. New services must be registered via the `registerAllServices()` function, likely called from `SystemBootstrap.gs`.
*   **Globals:** Global constants and enums are defined in `src/0_bootstrap/AA_Container.gs` (which includes content from `AB_Constants.gs` and `AC_Enums.gs`). Avoid creating other global variables.
*   **Logging:** All logging must be done through the `SmartLogger` service, which is available via the container. Direct calls to `console.log` are forbidden in production code. For bootstrap-phase logging where the container is not yet available, use the global `Logger.log`.
*   **Error Handling:** Use the custom error classes (`DatabaseError`, `ValidationError`, etc.) and the `ErrorHandler` service to manage exceptions and implement retry logic.
*   **Sheet Interaction:** All direct interaction with Google Sheets is abstracted away by the `BatchOperations` service. No other service should directly call `SpreadsheetApp`.
*   **Code Quality:** An audit has been performed, identifying critical issues, duplicate functions, orphaned code, and blocking `Utilities.sleep()` calls. The codebase generally demonstrates professional-grade software engineering with a solid foundation.
