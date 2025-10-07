### ACTIONS Column Definition

The `ACTIONS` sheet stores the core task data. The `MohTask` class defines the properties that map to the columns in this sheet. Key columns, including the newly added/emphasized ones, are:

*   **`action_id`**: (string) Unique identifier for the task.
*   **`title`**: (string) The main title or description of the task.
*   **`description`**: (string) Detailed description of the task.
*   **`status`**: (string) Current status of the task (e.g., `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `PENDING`).
*   **`priority`**: (string) Priority level of the task (e.g., `HIGH`, `MEDIUM`, `LOW`).
*   **`lane`**: (string) Categorization of the task, used for context matching and scheduling.
*   **`estimated_minutes`**: (number) Estimated time in minutes to complete the task.
*   **`actual_minutes`**: (number, nullable) Actual time in minutes taken to complete the task.
*   **`scheduled_start`**: (date, ISO string) Planned start time for the task.
*   **`scheduled_end`**: (date, ISO string) Planned end time for the task.
*   **`completed_date`**: (date, ISO string, nullable) Date and time when the task was completed.
*   **`due_date`**: (date, ISO string, nullable) Due date for the task.
*   **`deadline`**: (date, ISO string, nullable) Hard deadline for the task.
*   **`created_at`**: (date, ISO string) Timestamp when the task was created.
*   **`updated_at`**: (date, ISO string) Last timestamp when the task was updated.
*   **`calendar_event_id`**: (string) ID of the corresponding Google Calendar event, if synced.
*   **`source`**: (string) Origin of the task (e.g., `MANUAL`, `EMAIL`, `APPSHEET`).
*   **`source_id`**: (string) Identifier from the source system (e.g., email message ID, proposal ID).
*   **`external_url`**: (string) URL to an external resource related to the task.
*   **`attachments`**: (JSON array string) JSON string representing an array of attachment metadata.
*   **`metadata`**: (JSON object string) JSON string for arbitrary additional metadata.
*   **`rollover_count`**: (number) Number of times the task has been rolled over (not completed on schedule).
*   **`last_rollover_date`**: (date, ISO string, nullable) Last date the task was rolled over.
*   **`notes`**: (string) General notes about the task.
*   **`energy_required`**: (string) Energy level required for the task.
*   **`focus_required`**: (string) Focus level required for the task.
*   **`impact`**: (string) Impact level of the task.
*   **`urgency`**: (string) Urgency level of the task.
*   **`effort_minutes`**: (number) Estimated effort in minutes (similar to `estimated_minutes`).
*   **`estimation_accuracy`**: (number, nullable) Accuracy of previous estimations for similar tasks.
*   **`score`**: (number) Calculated priority score for scheduling.
*   **`scheduling_metadata`**: (JSON object string) JSON string containing metadata related to scheduling decisions.
*   **`version`**: (number) Version of the task record, used for optimistic locking.
*   **`dependency`**: (string) *[Legacy/Deprecated]* Single dependency ID. Replaced by `dependencies` array.
*   **`estimated_completion`**: (date, ISO string, nullable) Estimated completion date.
*   **`completion_notes`**: (string) Notes added upon task completion.
*   **`created_by`**: (string) Email or identifier of the user who created the task.
*   **`assigned_to`**: (string) Email or identifier of the user assigned to the task.
*   **`parent_id`**: (string) ID of a parent task, if this task is a sub-task.
*   **`dependencies`**: (JSON array string) **NEW/UPDATED:** JSON string representing an array of `action_id`s that this task is blocked by.
*   **`tags`**: (JSON array string) **NEW/UPDATED:** JSON string representing an array of tags associated with the task.

### PROPOSED_TASKS Ingestion and Approval Lifecycle

The `PROPOSED_TASKS` sheet serves as a staging area for potential tasks identified from various sources, primarily email ingestion. The lifecycle involves:

1.  **Ingestion (`EmailIngestionEngine`)**:
    *   The `EmailIngestionEngine` processes incoming emails (either label-based or via Zero-Trust Triage).
    *   It extracts actionable information and generates task proposals.
    *   These proposals are then formatted into rows and appended to the `PROPOSED_TASKS` sheet via `_createTaskProposals`.
    *   Each proposal is assigned a `proposal_id` and initially set to `STATUS.PENDING`.
    *   Crucially, optional fields that are not provided by the email parsing are set to blank strings in the sheet row, ensuring data consistency and preventing `undefined` or `null` values. The `created_task_id` column remains blank at this stage.

2.  **Approval (`appsheet_approveProposal`)**:
    *   The `appsheet_approveProposal` function (exposed via `AppSheetBridge`) is the primary mechanism for approving a pending task proposal.
    *   It takes a `proposalId` and optional `overrides` (e.g., for `estimated_minutes`, `priority`, `lane`, `title`).
    *   Upon approval, the function performs the following atomic operations:
        *   Retrieves the pending proposal from `PROPOSED_TASKS`.
        *   Constructs a new `MohTask` object using the proposal data, applying any user-provided `overrides`.
        *   Validates the new `MohTask` instance.
        *   Appends the newly created task to the `ACTIONS` sheet.
        *   Updates the original proposal's status in `PROPOSED_TASKS` to `PROPOSAL_STATUS.ACCEPTED`.
        *   Sets the `processed_at` timestamp for the proposal.
        *   Populates the `created_task_id` column in the `PROPOSED_TASKS` sheet with the `action_id` of the newly created task.
    *   **Graceful Failure**: If an attempt is made to approve an already processed (e.g., `ACCEPTED` or `REJECTED`) proposal, the function will return a failure message, preventing duplicate task creation.

**New Tests for Ingestion and Approval:**

A new test suite, `EmailIngestionApprovalTests.gs`, has been introduced to cover these critical flows:

*   **`testCreateTaskProposals_validData`**: Verifies that `_createTaskProposals` correctly processes a fully populated proposal, ensuring all expected columns are filled and `created_task_id` is initially blank.
*   **`testCreateTaskProposals_missingOptionalFields`**: Confirms that `_createTaskProposals` handles proposals with missing optional fields by inserting blank strings, demonstrating the "healing" of invalid/missing data.
*   **`testAppsheetApproveProposal_success`**: An integration test that simulates the successful approval of a pending proposal, asserting correct updates in both `PROPOSED_TASKS` (status, `processed_at`, `created_task_id`) and the creation of a new task in the `ACTIONS` sheet. It also verifies that `overrides` are correctly applied.
*   **`testAppsheetApproveProposal_alreadyProcessed`**: An edge case test ensuring that attempting to approve an already `ACCEPTED` proposal results in a graceful failure and no further changes to the sheets.
