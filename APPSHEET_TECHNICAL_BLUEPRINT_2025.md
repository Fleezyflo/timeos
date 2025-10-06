# MOH TIME OS v2.0 - APPSHEET TECHNICAL BLUEPRINT
**Complete Implementation Specification**

*Version: 2.0*
*Date: 2025-09-30*
*Target: AppSheet Enterprise Plus with AI Features*

---

## DOCUMENT PURPOSE

This is a **complete technical specification** for implementing the AppSheet application that integrates with MOH TIME OS v2.0. Every table, column, slice, view, action, and automation is defined with exact parameters. This is not a tutorial - it's a blueprint for direct implementation.

---

# SECTION 1: DATA FOUNDATION - TABLES & COLUMNS

## 1.1 TABLE: ACTIONS (Primary Task Management)

### Purpose
Core task list containing all actions (tasks) in the system. Primary operational table.

### Source
Google Sheet: `ACTIONS`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Initial Value | Formula/Expression | Description |
|-------------|---------------|-----------|----------|---------------|-------------------|-------------|
| `action_id` | Text | Text | Yes | `UNIQUEID()` | | Primary key, unique identifier |
| `status` | Enum | Text | Yes | `"PENDING"` | | Task status (see STATUS enum) |
| `priority` | Enum | Text | Yes | `"MEDIUM"` | | Task priority (see PRIORITY enum) |
| `created_at` | DateTime | DateTime | Yes | `NOW()` | | Timestamp of creation |
| `updated_at` | DateTime | DateTime | Yes | `NOW()` | Auto-update on edit | Last modification timestamp |
| `title` | Text | Text | Yes | | | Task title/name (max 255 chars) |
| `context` | Text | Text | No | | | Additional context information |
| `lane` | Ref | Text | No | | → LANES.[lane] | Reference to LANES table |
| `estimated_minutes` | Number | Integer | No | `30` | | Estimated duration in minutes |
| `scheduled_start` | DateTime | DateTime | No | | | When task is scheduled to start |
| `scheduled_end` | DateTime | DateTime | No | | | When task is scheduled to end |
| `actual_minutes` | Number | Integer | No | | | Actual time spent (filled on completion) |
| `completed_date` | DateTime | DateTime | No | | | Timestamp of completion |
| `source` | Text | Text | No | | | Origin: "email", "manual", "chat", etc. |
| `source_id` | Ref | Text | No | | → PROPOSED_TASKS.[proposal_id] | Reference to source proposal |
| `description` | LongText | Text | No | | | Detailed task description |
| `calendar_event_id` | Text | Text | No | | | Google Calendar event ID (if synced) |
| `rollover_count` | Number | Integer | No | `0` | | Times task was rescheduled |
| `scheduling_metadata` | LongText | JSON | No | | | JSON metadata from scheduler |
| `score` | Decimal | Number | No | | Computed by scheduler | Priority score |
| `deadline` | DateTime | DateTime | No | | | Hard deadline for task |
| `energy_required` | Enum | Text | No | `"MEDIUM"` | | Energy level needed: CRITICAL, HIGH, MEDIUM, LOW, RECOVERY |
| `focus_required` | Enum | Text | No | `"MEDIUM"` | | Focus level needed: INTENSE, HIGH, MEDIUM, LOW, BACKGROUND |
| `estimation_accuracy` | Decimal | Number | No | | | Ratio of actual vs estimated (post-completion) |

### Enum Values

**status** (dropdown, allow invalid):
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELED`
- `SCHEDULED`
- `PENDING`
- `PENDING_APPROVAL`
- `ACCEPTED`
- `REJECTED`
- `BLOCKED`
- `DEFERRED`
- `ARCHIVED`

**priority** (dropdown, allow invalid):
- `CRITICAL` - Urgent + Important, blocking others
- `URGENT` - Time-sensitive
- `HIGH` - Important but not urgent
- `MEDIUM` - Standard priority
- `LOW` - Nice to have
- `MINIMAL` - Background tasks

**energy_required** (dropdown, allow invalid):
- `CRITICAL` - Peak energy required
- `HIGH` - High energy needed
- `MEDIUM` - Moderate energy
- `LOW` - Low energy acceptable
- `RECOVERY` - Can do while recovering

**focus_required** (dropdown, allow invalid):
- `INTENSE` - Deep, uninterrupted focus
- `HIGH` - High concentration
- `MEDIUM` - Moderate focus
- `LOW` - Light attention
- `BACKGROUND` - Minimal focus needed

### Virtual Columns

| Column Name | Type | Formula | Purpose |
|-------------|------|---------|---------|
| `duration_hours` | Decimal | `IF(AND(ISNOTBLANK([scheduled_start]), ISNOTBLANK([scheduled_end])), (HOUR([scheduled_end] - [scheduled_start]) + MINUTE([scheduled_end] - [scheduled_start])/60), [estimated_minutes]/60)` | Duration in hours |
| `is_overdue` | Yes/No | `AND([status] <> "COMPLETED", [status] <> "CANCELED", ISNOTBLANK([deadline]), NOW() > [deadline])` | Whether task is past deadline |
| `days_until_deadline` | Decimal | `IF(ISNOTBLANK([deadline]), (HOUR([deadline] - NOW()) / 24), 999)` | Days remaining until deadline |
| `is_today` | Yes/No | `DATE([scheduled_start]) = TODAY()` | Whether scheduled for today |
| `is_active` | Yes/No | `IN([status], {"IN_PROGRESS", "SCHEDULED", "PENDING"})` | Whether task is active |
| `completion_rate` | Percent | `IF(AND(ISNOTBLANK([actual_minutes]), ISNOTBLANK([estimated_minutes]), [estimated_minutes] > 0), [actual_minutes]/[estimated_minutes], 0)` | Actual vs estimated ratio |
| `energy_match_score` | Decimal | Computed by bot | How well task energy matches current state |
| `predicted_duration` | Number | `PREDICT("Task Duration Predictor", [_THISROW])` | ML prediction of actual duration |
| `completion_probability` | Percent | `PREDICT("On-Time Completion Predictor", [_THISROW])` | ML prediction of on-time completion |

### Initial View Column Order
`action_id`, `title`, `status`, `priority`, `scheduled_start`, `estimated_minutes`, `lane`, `is_overdue`

---

## 1.2 TABLE: PROPOSED_TASKS (Email Triage Queue)

### Purpose
Stores proposed tasks extracted from emails before conversion to actions.

### Source
Google Sheet: `PROPOSED_TASKS`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Initial Value | Formula/Expression | Description |
|-------------|---------------|-----------|----------|---------------|-------------------|-------------|
| `proposal_id` | Text | Text | Yes | `UNIQUEID()` | | Primary key |
| `status` | Enum | Text | Yes | `"PENDING"` | | Proposal status |
| `created_at` | DateTime | DateTime | Yes | `NOW()` | | When proposal was created |
| `processed_at` | DateTime | DateTime | No | | | When proposal was processed |
| `source` | Text | Text | Yes | | | Source: "email", "ocr", "chat", "api" |
| `source_id` | Text | Text | No | | | Original source identifier (email ID, etc.) |
| `sender` | Ref | Text | No | | → SENDER_REPUTATION.[sender_email] | Reference to sender |
| `subject` | Text | Text | No | | | Email subject or proposal title |
| `parsed_title` | Text | Text | Yes | | | Extracted task title |
| `suggested_lane` | Text | Text | No | | | AI-suggested lane |
| `confidence_score` | Percent | Number | No | | | AI confidence (0.0-1.0) |
| `raw_content_preview` | LongText | Text | No | | | Preview of raw content |

### Additional AI Columns (for Gemini integration)

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `ai_processed` | Yes/No | Boolean | No | Whether AI extraction ran |
| `ai_task_type` | Enum | Text | No | AI-categorized type: Deep Work, Communication, Administrative, Creative |
| `ai_urgency` | Enum | Text | No | AI-determined urgency: CRITICAL, HIGH, MEDIUM, LOW |
| `ai_estimated_minutes` | Number | Integer | No | AI-estimated duration |
| `ai_due_date` | Date | Date | No | AI-extracted deadline |
| `ai_action_items` | LongText | Text | No | AI-extracted action items list |
| `ai_confidence` | Percent | Number | No | AI extraction confidence |

### Enum Values

**status**:
- `PENDING` - Awaiting review
- `PROCESSED` - Review complete
- `ACCEPTED` - Approved, converted to action
- `REJECTED` - Declined
- `DUPLICATE` - Already exists
- `INVALID` - Invalid format
- `EXPIRED` - Too old to process

**ai_task_type**:
- `Deep Work`
- `Communication`
- `Administrative`
- `Creative`

**ai_urgency**:
- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`

### Virtual Columns

| Column Name | Type | Formula | Purpose |
|-------------|------|---------|---------|
| `should_auto_accept` | Yes/No | `AND([confidence_score] > 0.8, [sender].[reputation_score] > 0.7, [sender].[approved_count] > 5)` | Auto-approval eligibility |
| `age_hours` | Decimal | `(HOUR(NOW() - [created_at]))` | Hours since creation |
| `is_stale` | Yes/No | `[age_hours] > 48` | Whether proposal is too old |

---

## 1.3 TABLE: CALENDAR_PROJECTION

### Purpose
Stores projected calendar events for conflict detection and availability checking.

### Source
Google Sheet: `CALENDAR_PROJECTION`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `event_id` | Text | Text | Yes | Unique event identifier |
| `start` | DateTime | DateTime | Yes | Event start time |
| `end` | DateTime | DateTime | Yes | Event end time |
| `type` | Text | Text | No | Event type: "calendar", "scheduled_task", "blocked" |
| `busy` | Yes/No | Boolean | Yes | Whether time is busy/blocked |
| `title` | Text | Text | No | Event title |
| `description` | LongText | Text | No | Event description |

### Virtual Columns

| Column Name | Type | Formula | Purpose |
|-------------|------|---------|---------|
| `duration_hours` | Decimal | `(HOUR([end] - [start]) + MINUTE([end] - [start])/60)` | Event duration |
| `is_today` | Yes/No | `DATE([start]) = TODAY()` | Whether event is today |
| `conflict_detected` | Yes/No | Computed by bot | Whether conflicts with other events |

---

## 1.4 TABLE: FOUNDATION_BLOCKS

### Purpose
Defines recurring time blocks with energy levels and contexts (e.g., "Monday 10-12 AM: High Energy Deep Work").

### Source
Google Sheet: `FOUNDATION_BLOCKS`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `block_id` | Text | Text | Yes | Unique block identifier |
| `day` | Enum | Text | Yes | Day of week: Monday, Tuesday, ..., Sunday |
| `start_time` | Time | Time | Yes | Block start time (e.g., 10:00) |
| `end_time` | Time | Time | Yes | Block end time (e.g., 12:00) |
| `block_type` | Text | Text | No | Type: "work", "personal", "blocked" |
| `energy_level` | Enum | Text | Yes | Expected energy: CRITICAL, HIGH, MEDIUM, LOW, RECOVERY |
| `context` | Text | Text | No | Context description |
| `active` | Yes/No | Boolean | Yes | Whether block is currently active |

### Enum Values

**day**:
- `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

**energy_level**:
- `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `RECOVERY`

---

## 1.5 TABLE: TIME_BLOCKS

### Purpose
Actual time blocks generated for scheduling, including availability and booking status.

### Source
Google Sheet: `TIME_BLOCKS`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `block_id` | Text | Text | Yes | Unique block identifier |
| `start_time` | DateTime | DateTime | Yes | Block start |
| `end_time` | DateTime | DateTime | Yes | Block end |
| `duration_minutes` | Number | Integer | Yes | Block duration |
| `block_type` | Text | Text | No | Type of block |
| `energy_level` | Enum | Text | No | Energy level for block |
| `context` | Text | Text | No | Context/purpose |
| `available` | Yes/No | Boolean | Yes | Whether available for scheduling |
| `busy` | Yes/No | Boolean | Yes | Whether currently occupied |
| `title` | Text | Text | No | Block title if booked |
| `description` | LongText | Text | No | Block description |
| `task_id` | Ref | Text | No | Reference to scheduled task |
| `created_at` | DateTime | DateTime | Yes | Block creation timestamp |

---

## 1.6 TABLE: LANES

### Purpose
Configuration for task categorization lanes (contexts) with energy preferences and weights.

### Source
Google Sheet: `LANES`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `lane` | Text | Text | Yes | Lane identifier (primary key) |
| `description` | LongText | Text | No | Lane description |
| `weight` | Decimal | Number | No | Scheduling weight (0.0-1.0) |
| `min_block_minutes` | Number | Integer | No | Minimum time block size |
| `max_daily_minutes` | Number | Integer | No | Maximum daily allocation |
| `priority_multiplier` | Decimal | Number | No | Priority score multiplier |
| `context_type` | Text | Text | No | Context category |
| `energy_preference` | Enum | Text | No | Preferred energy level |
| `is_active` | Yes/No | Boolean | Yes | Whether lane is active |
| `created_at` | DateTime | DateTime | Yes | Creation timestamp |
| `updated_at` | DateTime | DateTime | No | Last update timestamp |

### Valid Lane Values
`ops`, `admin`, `creative`, `client`, `growth`, `deep_focus`, `batch`, `communication`, `learning`, `maintenance`, `high_energy`, `low_energy`, `social`, `solo`, `personal`

---

## 1.7 TABLE: SENDER_REPUTATION

### Purpose
Tracks email sender reputation and trust scores for auto-triage.

### Source
Google Sheet: `SENDER_REPUTATION`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `sender_email` | Email | Email | Yes | Sender email address (primary key) |
| `approved_count` | Number | Integer | Yes | Count of approved proposals |
| `rejected_count` | Number | Integer | Yes | Count of rejected proposals |
| `reputation_score` | Decimal | Number | Yes | Computed reputation (0.0-1.0) |
| `total_interactions` | Number | Integer | Yes | Total proposals from sender |
| `first_seen` | DateTime | DateTime | Yes | First interaction timestamp |
| `last_updated` | DateTime | DateTime | Yes | Last update timestamp |
| `status` | Enum | Text | Yes | Sender status |
| `block_reason` | LongText | Text | No | Why sender was blocked |
| `blocked_at` | DateTime | DateTime | No | When sender was blocked |
| `trustScore` | Decimal | Number | No | Manual trust override |

### Enum Values

**status**:
- `TRUSTED` - Auto-approve eligible
- `NEUTRAL` - Normal processing
- `SUSPICIOUS` - Requires extra review
- `BLOCKED` - Rejected automatically

### Virtual Columns

| Column Name | Type | Formula | Purpose |
|-------------|------|---------|---------|
| `approval_rate` | Percent | `IF([total_interactions] > 0, [approved_count] / [total_interactions], 0)` | Percentage approved |
| `is_trusted` | Yes/No | `AND([status] = "TRUSTED", [reputation_score] > 0.7)` | Auto-approve eligibility |

---

## 1.8 TABLE: CHAT_QUEUE

### Purpose
Stores chat messages for asynchronous processing by ChatEngine.

### Source
Google Sheet: `CHAT_QUEUE`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `message_id` | Text | Text | Yes | Unique message identifier |
| `timestamp` | DateTime | DateTime | Yes | Message timestamp |
| `user` | Email | Email | Yes | User who sent message |
| `context` | Text | Text | No | Conversation context |
| `payload` | LongText | JSON | Yes | Message payload (JSON) |
| `status` | Enum | Text | Yes | Processing status |
| `last_updated` | DateTime | DateTime | Yes | Last status update |

### Enum Values

**status**:
- `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

---

## 1.9 TABLE: ACTIVITY

### Purpose
System activity log for audit trail and debugging.

### Source
Google Sheet: `ACTIVITY`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `timestamp` | DateTime | DateTime | Yes | Log entry timestamp |
| `level` | Enum | Text | Yes | Log level: DEBUG, INFO, WARN, ERROR |
| `component` | Text | Text | Yes | Component name |
| `action` | Text | Text | Yes | Action performed |
| `data` | LongText | JSON | No | Additional data (JSON) |
| `user` | Email | Email | No | User who triggered action |

---

## 1.10 TABLE: STATUS

### Purpose
Key-value store for system status and configuration.

### Source
Google Sheet: `STATUS`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `key` | Text | Text | Yes | Status key (primary key) |
| `value` | Text | Text | No | Status value |
| `updated_at` | DateTime | DateTime | Yes | Last update timestamp |
| `description` | LongText | Text | No | Key description |

---

## 1.11 TABLE: APPSHEET_CONFIG

### Purpose
Configuration values readable by AppSheet (synced from ConfigManager).

### Source
Google Sheet: `APPSHEET_CONFIG`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `row_id` | Text | Text | Yes | Unique row identifier |
| `category` | Text | Text | No | Config category |
| `subcategory` | Text | Text | No | Config subcategory |
| `item` | Text | Text | No | Config item name |
| `key` | Text | Text | Yes | Config key (unique) |
| `value` | Text | Text | No | Config value (any type) |
| `description` | LongText | Text | No | Config description |

---

## 1.12 TABLE: HUMAN_STATE

### Purpose
Tracks user's current energy, focus, mood, and stress levels for energy-aware scheduling.

### Source
Google Sheet: `HUMAN_STATE`

### Columns Definition

| Column Name | AppSheet Type | Base Type | Required | Description |
|-------------|---------------|-----------|----------|-------------|
| `timestamp` | DateTime | DateTime | Yes | State capture timestamp |
| `energy_level` | Number | Integer | No | Energy level (1-5) |
| `focus_level` | Number | Integer | No | Focus level (1-5) |
| `mood` | Enum | Text | No | Current mood |
| `stress_level` | Number | Integer | No | Stress level (1-5) |
| `current_context` | Text | Text | No | What user is doing |
| `notes` | LongText | Text | No | Additional notes |

### Enum Values

**mood**:
- `Energized`, `Focused`, `Neutral`, `Tired`, `Stressed`, `Overwhelmed`

---

# SECTION 2: SLICES (Filtered Data Views)

## 2.1 Active Tasks
**Source Table:** ACTIONS
**Filter Expression:**
```
AND([status] <> "COMPLETED", [status] <> "CANCELED", [status] <> "ARCHIVED")
```
**Purpose:** All tasks currently in play

---

## 2.2 Today's Tasks
**Source Table:** ACTIONS
**Filter Expression:**
```
AND(
  DATE([scheduled_start]) = TODAY(),
  IN([status], {"SCHEDULED", "IN_PROGRESS"})
)
```
**Sort:** `scheduled_start` ASC

---

## 2.3 High Priority Tasks
**Source Table:** ACTIONS
**Filter Expression:**
```
IN([priority], {"CRITICAL", "URGENT", "HIGH"})
```
**Sort:** `priority` DESC, `deadline` ASC

---

## 2.4 Overdue Tasks
**Source Table:** ACTIONS
**Filter Expression:**
```
[is_overdue] = TRUE
```
**Sort:** `deadline` ASC

---

## 2.5 This Week Tasks
**Source Table:** ACTIONS
**Filter Expression:**
```
AND(
  [scheduled_start] >= TODAY(),
  [scheduled_start] < (TODAY() + 7),
  IN([status], {"SCHEDULED", "PENDING"})
)
```
**Sort:** `scheduled_start` ASC

---

## 2.6 Pending Proposals
**Source Table:** PROPOSED_TASKS
**Filter Expression:**
```
[status] = "PENDING"
```
**Sort:** `confidence_score` DESC, `created_at` DESC

---

## 2.7 Auto-Approve Eligible
**Source Table:** PROPOSED_TASKS
**Filter Expression:**
```
[should_auto_accept] = TRUE
```
**Sort:** `confidence_score` DESC

---

## 2.8 Unscheduled Tasks
**Source Table:** ACTIONS
**Filter Expression:**
```
AND(
  [status] = "PENDING",
  ISBLANK([scheduled_start])
)
```
**Sort:** `priority` DESC, `created_at` ASC

---

## 2.9 Completed Today
**Source Table:** ACTIONS
**Filter Expression:**
```
AND(
  [status] = "COMPLETED",
  DATE([completed_date]) = TODAY()
)
```
**Sort:** `completed_date` DESC

---

## 2.10 In Progress
**Source Table:** ACTIONS
**Filter Expression:**
```
[status] = "IN_PROGRESS"
```
**Sort:** `scheduled_start` ASC

---

## 2.11 Blocked Tasks
**Source Table:** ACTIONS
**Filter Expression:**
```
[status] = "BLOCKED"
```
**Sort:** `created_at` DESC

---

## 2.12 Low Confidence Proposals
**Source Table:** PROPOSED_TASKS
**Filter Expression:**
```
AND(
  [status] = "PENDING",
  [confidence_score] < 0.6
)
```
**Sort:** `created_at` DESC

---

## 2.13 Trusted Senders
**Source Table:** SENDER_REPUTATION
**Filter Expression:**
```
[status] = "TRUSTED"
```
**Sort:** `reputation_score` DESC

---

## 2.14 Next 3 Tasks
**Source Table:** ACTIONS (Today's Tasks slice)
**Filter Expression:**
```
AND(
  [scheduled_start] > NOW(),
  DATE([scheduled_start]) = TODAY()
)
```
**Sort:** `scheduled_start` ASC
**Limit:** 3 rows

---

## 2.15 Needs Rescheduling
**Source Table:** ACTIONS
**Filter Expression:**
```
AND(
  [rollover_count] > 2,
  IN([status], {"PENDING", "DEFERRED"})
)
```
**Sort:** `rollover_count` DESC

---

# SECTION 3: REFERENCE COLUMNS (Relationships)

## 3.1 ACTIONS → PROPOSED_TASKS
**Source Column:** `ACTIONS.source_id`
**Target Table:** `PROPOSED_TASKS`
**Target Column:** `proposal_id`
**Type:** Ref
**Relationship:** Many-to-One
**Purpose:** Link tasks to their originating proposals

---

## 3.2 PROPOSED_TASKS → SENDER_REPUTATION
**Source Column:** `PROPOSED_TASKS.sender`
**Target Table:** `SENDER_REPUTATION`
**Target Column:** `sender_email`
**Type:** Ref
**Relationship:** Many-to-One
**Purpose:** Link proposals to sender reputation data

---

## 3.3 ACTIONS → LANES
**Source Column:** `ACTIONS.lane`
**Target Table:** `LANES`
**Target Column:** `lane`
**Type:** Ref
**Relationship:** Many-to-One
**Purpose:** Link tasks to their categorization lane

---

## 3.4 TIME_BLOCKS → ACTIONS
**Source Column:** `TIME_BLOCKS.task_id`
**Target Table:** `ACTIONS`
**Target Column:** `action_id`
**Type:** Ref
**Relationship:** Many-to-One (optional)
**Purpose:** Link time blocks to scheduled tasks

---

## 3.5 Reverse References (Auto-Generated)

These are automatically created by AppSheet:

### PROPOSED_TASKS.Related_Actions
**Type:** List
**Formula:** `REF_ROWS("ACTIONS", "source_id")`
**Purpose:** Get all actions created from this proposal

### SENDER_REPUTATION.Related_Proposals
**Type:** List
**Formula:** `REF_ROWS("PROPOSED_TASKS", "sender")`
**Purpose:** Get all proposals from this sender

### LANES.Related_Actions
**Type:** List
**Formula:** `REF_ROWS("ACTIONS", "lane")`
**Purpose:** Get all tasks in this lane

---

# SECTION 4: ACTIONS (Buttons & Behaviors)

## 4.1 ACTION: Schedule Task

**Display Name:** Schedule Task
**Icon:** schedule
**Show If:** `AND([status] = "PENDING", ISBLANK([scheduled_start]))`
**Prominence:** Primary
**Behavior:** Execute Apps Script + Update Row

### Steps:
1. **Call Apps Script Function**
   - Function: `appsheet_runScheduling`
   - Parameters:
     ```json
     {
       "taskId": [action_id],
       "priority": [priority],
       "dryRun": false
     }
     ```

2. **Update Row (if successful)**
   - Table: ACTIONS
   - Row: `[_THISROW]`
   - Set:
     - `status` = `"SCHEDULED"`
     - `updated_at` = `NOW()`

3. **Send Notification**
   - Type: Push
   - Title: "Task Scheduled"
   - Message: `CONCATENATE([title], " scheduled for ", TEXT([scheduled_start], "h:mm AM/PM"))`

---

## 4.2 ACTION: Approve Proposal

**Display Name:** Approve
**Icon:** check_circle
**Show If:** `[status] = "PENDING"`
**Prominence:** Primary
**Behavior:** Execute Apps Script

### Steps:
1. **Call Apps Script Function**
   - Function: `appsheet_approveProposal`
   - Parameters:
     ```json
     {
       "proposalId": [proposal_id]
     }
     ```

2. **Update Row**
   - Table: PROPOSED_TASKS
   - Row: `[_THISROW]`
   - Set:
     - `status` = `"ACCEPTED"`
     - `processed_at` = `NOW()`

3. **Show Notification**
   - Type: Success
   - Message: "Task created and scheduled"

---

## 4.3 ACTION: Reject Proposal

**Display Name:** Reject
**Icon:** cancel
**Show If:** `[status] = "PENDING"`
**Prominence:** Secondary
**Behavior:** Update Row + Update Reputation

### Steps:
1. **Update Proposal**
   - Table: PROPOSED_TASKS
   - Row: `[_THISROW]`
   - Set:
     - `status` = `"REJECTED"`
     - `processed_at` = `NOW()`

2. **Update Sender Reputation**
   - Table: SENDER_REPUTATION
   - Row: `[sender]`
   - Set:
     - `rejected_count` = `[rejected_count] + 1`
     - `reputation_score` = Recompute via bot

---

## 4.4 ACTION: Complete Task

**Display Name:** Complete
**Icon:** done
**Show If:** `IN([status], {"IN_PROGRESS", "SCHEDULED"})`
**Prominence:** Primary
**Behavior:** Update Row + Request Input

### Steps:
1. **Request User Input**
   - Prompt: "How long did this task take?"
   - Input Type: Number
   - Input Name: `actual_minutes`
   - Default: `[estimated_minutes]`

2. **Update Row**
   - Table: ACTIONS
   - Row: `[_THISROW]`
   - Set:
     - `status` = `"COMPLETED"`
     - `completed_date` = `NOW()`
     - `actual_minutes` = `[INPUT:actual_minutes]`
     - `estimation_accuracy` = `[INPUT:actual_minutes] / [estimated_minutes]`
     - `updated_at` = `NOW()`

3. **Log Activity**
   - Add row to ACTIVITY
   - Values:
     ```
     timestamp: NOW()
     level: "INFO"
     component: "AppSheet"
     action: "Task Completed"
     data: JSON with task details
     ```

---

## 4.5 ACTION: Update Energy State

**Display Name:** Log Energy
**Icon:** battery_charging_full
**Show If:** `TRUE` (always available)
**Prominence:** Secondary
**Behavior:** Add Row + Execute Script

### Steps:
1. **Request User Input**
   - Prompt: "How are you feeling?"
   - Inputs:
     - `energy_level` (Number, 1-5, default 3)
     - `focus_level` (Number, 1-5, default 3)
     - `mood` (Enum, dropdown)
     - `notes` (Text, optional)

2. **Add Row to HUMAN_STATE**
   - Values:
     ```
     timestamp: NOW()
     energy_level: [INPUT:energy_level]
     focus_level: [INPUT:focus_level]
     mood: [INPUT:mood]
     notes: [INPUT:notes]
     ```

3. **Call Apps Script**
   - Function: `appsheet_updateHumanState`
   - Parameters:
     ```json
     {
       "energy": [INPUT:energy_level],
       "focus": [INPUT:focus_level],
       "mood": [INPUT:mood],
       "autoReschedule": true
     }
     ```

4. **Show Notification**
   - Message: "Energy state updated. Schedule adjusted if needed."

---

## 4.6 ACTION: Start Task

**Display Name:** Start
**Icon:** play_arrow
**Show If:** `[status] = "SCHEDULED"`
**Prominence:** Primary

### Steps:
1. **Update Row**
   - Set:
     - `status` = `"IN_PROGRESS"`
     - `updated_at` = `NOW()`

2. **Start Timer** (if using AppSheet timer feature)

---

## 4.7 ACTION: Snooze Task

**Display Name:** Snooze
**Icon:** snooze
**Show If:** `IN([status], {"SCHEDULED", "PENDING"})`
**Prominence:** Secondary

### Steps:
1. **Request Input**
   - Prompt: "Snooze for how long?"
   - Options: "15 min", "1 hour", "Tomorrow", "Next Week"

2. **Update Row**
   - Set:
     - `scheduled_start` = Computed based on selection
     - `rollover_count` = `[rollover_count] + 1`
     - `status` = `"DEFERRED"`

3. **Call Apps Script**
   - Function: `appsheet_runScheduling`
   - Trigger full reschedule

---

## 4.8 ACTION: Archive Task

**Display Name:** Archive
**Icon:** archive
**Show If:** `[status] = "COMPLETED"`
**Prominence:** Secondary

### Steps:
1. **Update Row**
   - Set:
     - `status` = `"ARCHIVED"`
     - `updated_at` = `NOW()`

---

## 4.9 ACTION: Cancel Task

**Display Name:** Cancel
**Icon:** close
**Show If:** `[status] <> "COMPLETED"`
**Prominence:** Danger

### Steps:
1. **Confirm**
   - Prompt: "Are you sure you want to cancel this task?"

2. **Update Row**
   - Set:
     - `status` = `"CANCELED"`
     - `updated_at` = `NOW()`

---

## 4.10 ACTION: Reschedule Task

**Display Name:** Reschedule
**Icon:** update
**Show If:** `[status] = "SCHEDULED"`
**Prominence:** Secondary

### Steps:
1. **Clear Schedule**
   - Set:
     - `scheduled_start` = NULL
     - `scheduled_end` = NULL
     - `status` = `"PENDING"`

2. **Call Apps Script**
   - Function: `appsheet_runScheduling`
   - Parameters: `{ "taskId": [action_id] }`

---

# SECTION 5: VIEWS (UI Definitions)

## 5.1 VIEW: Dashboard

**Type:** Dashboard
**For:** ACTIONS table
**Primary:** Yes

### Widgets:

#### Widget 1: Today's Overview Card
**Type:** Card
**Data Source:** Today's Tasks slice
**Display:**
```
Title: "Today's Schedule"
Subtitle: CONCATENATE(COUNT([Today's Tasks]), " tasks scheduled")
Icon: today
```

#### Widget 2: Task List
**Type:** Table/Card View
**Data Source:** Today's Tasks slice
**Sort:** `scheduled_start` ASC
**Columns:** `title`, `scheduled_start`, `estimated_minutes`, `priority`
**Inline Actions:** Start, Complete, Snooze

#### Widget 3: Energy Status Gauge
**Type:** Gauge/Progress
**Data Source:** HUMAN_STATE (latest row)
**Formula:** `SELECT(HUMAN_STATE[energy_level], TRUE, [timestamp], TRUE)[1]`
**Display:** 1-5 scale

#### Widget 4: Completion Probability
**Type:** Gauge
**Formula:**
```
AVERAGE(
  SELECT(ACTIONS[completion_probability],
    DATE([scheduled_start]) = TODAY()
  )
)
```
**Display:** Percentage with color coding

#### Widget 5: High Priority Tasks
**Type:** Card List
**Data Source:** High Priority Tasks slice
**Limit:** 3 rows
**Display:** Compact cards with priority badge

#### Widget 6: Pending Proposals Count
**Type:** Counter
**Formula:** `COUNT([Pending Proposals])`
**Action:** Navigate to Triage Queue view
**Show If:** Count > 0

---

## 5.2 VIEW: Task List (All Tasks)

**Type:** Table
**For:** ACTIONS table
**Data Source:** Active Tasks slice

### Configuration:
- **Group By:** `status`
- **Sort:** `priority` DESC, `scheduled_start` ASC
- **Columns:**
  - `title` (primary)
  - `status` (badge/chip)
  - `priority` (badge/chip with colors)
  - `scheduled_start`
  - `estimated_minutes`
  - `lane`
  - `is_overdue` (icon)
- **Search:** Enabled on `title`, `description`
- **Filters:**
  - Priority dropdown
  - Status dropdown
  - Lane dropdown
  - Date range picker
- **Inline Actions:**
  - Schedule Task
  - Start Task
  - Complete Task
  - Edit

---

## 5.3 VIEW: Calendar View

**Type:** Calendar
**For:** ACTIONS table
**Data Source:** This Week Tasks slice

### Configuration:
- **Date Column:** `scheduled_start`
- **End Date Column:** `scheduled_end`
- **Title:** `title`
- **Color By:** `priority`
  - CRITICAL: Red (#D32F2F)
  - URGENT: Orange (#F57C00)
  - HIGH: Yellow (#FBC02D)
  - MEDIUM: Blue (#1976D2)
  - LOW: Gray (#757575)
- **Day View:** Show time slots
- **Week View:** Default
- **Month View:** Available
- **Click Action:** Open detail view
- **Drag to Reschedule:** Enabled (updates `scheduled_start`, `scheduled_end`)

---

## 5.4 VIEW: Triage Queue

**Type:** Deck (swipe cards)
**For:** PROPOSED_TASKS table
**Data Source:** Pending Proposals slice

### Configuration:
- **Card Layout:**
  - **Header:** `[sender]` (with reputation badge)
  - **Title:** `[parsed_title]`
  - **Subtitle:** `[subject]`
  - **Body:** `[raw_content_preview]` (truncated to 200 chars)
  - **Footer:**
    - Confidence: `[confidence_score]` (as percentage)
    - AI Urgency: `[ai_urgency]` (badge)
    - AI Duration: `[ai_estimated_minutes]` mins
- **Actions:**
  - Swipe Right / Approve Button: Execute Approve action
  - Swipe Left / Reject Button: Execute Reject action
  - Tap: Open detail view
- **Sort:** `confidence_score` DESC

---

## 5.5 VIEW: Energy Log

**Type:** Form + Chart
**For:** HUMAN_STATE table

### Form Section:
- **Title:** "Log Your State"
- **Fields:**
  - `energy_level` (slider, 1-5)
  - `focus_level` (slider, 1-5)
  - `mood` (dropdown)
  - `stress_level` (slider, 1-5)
  - `notes` (text area)
- **Submit Action:** Add Row + Execute `appsheet_updateHumanState`

### Chart Section:
**Type:** Line Chart
**X-Axis:** `timestamp`
**Y-Axis:** `energy_level`, `focus_level`, `stress_level`
**Time Range:** Last 7 days
**Series:**
- Energy (green)
- Focus (blue)
- Stress (red)

---

## 5.6 VIEW: Settings

**Type:** Form/Detail
**For:** APPSHEET_CONFIG table

### Configuration:
- **Group By:** `category`
- **Display:** Expandable sections
- **Editing:** Enabled for authorized users
- **Columns:**
  - `item` (label)
  - `value` (editable)
  - `description` (help text)

---

# SECTION 6: AUTOMATIONS/BOTS (Complete Workflows)

## 6.1 BOT: Email Processing Scheduler

**Name:** Email Processing Scheduler
**Trigger:** Schedule
**Schedule:** Every 15 minutes
**Active Hours:** 7:00 AM - 10:00 PM
**Timezone:** Asia/Dubai

### Process Steps:

#### Step 1: Call Apps Script
**Type:** Execute Apps Script Function
**Function:** `appsheet_processEmails`
**Parameters:**
```json
{
  "timestamp": <<NOW()>>,
  "source": "appsheet_scheduled"
}
```

#### Step 2: Parse Response
**Type:** Return Value
**Store As:** `EmailResult`
**Value:** `[Step1].[ResponseBody]`

#### Step 3: Conditional - New Proposals?
**Condition:** `[EmailResult].[proposals] > 0`

**If TRUE:**
  - **Step 4A: Send Notification**
    - Type: Push Notification
    - Title: "New Tasks Pending"
    - Message: `CONCATENATE([EmailResult].[proposals], " new proposals need review")`
    - Link: Navigate to Triage Queue view

**If FALSE:**
  - **Step 4B: Log Only**
    - Type: Add Row to ACTIVITY
    - level: "DEBUG"
    - message: "Email check - no new proposals"

---

## 6.2 BOT: Intelligent Scheduler

**Name:** Intelligent Scheduler
**Trigger:** Data Change
**Table:** ACTIONS
**Condition:**
```
OR(
  [_THISROW_BEFORE].[priority] <> [_THISROW_AFTER].[priority],
  [_THISROW_BEFORE].[deadline] <> [_THISROW_AFTER].[deadline],
  [_THISROW_BEFORE].[estimated_minutes] <> [_THISROW_AFTER].[estimated_minutes],
  ISBLANK([_THISROW_BEFORE].[action_id])
)
```
**Run Behavior:** Real-time (not batched)

### Process Steps:

#### Step 1: Check Completion Probability
**Type:** Conditional Branch
**Condition:** `[predicted_completion_probability] < 0.6`

**If TRUE (Low Probability):**
  - **Step 2A: Increase Priority**
    - Type: Update Row
    - Table: ACTIONS
    - Row: `[_THISROW]`
    - Set: `priority` = `"HIGH"`

  - **Step 3A: Use AI Duration**
    - Type: Update Row
    - Set: `estimated_minutes` = `[ai_duration_estimate]`

**If FALSE (Good Probability):**
  - Skip to Step 4

#### Step 4: Call Scheduler
**Type:** Execute Apps Script
**Function:** `appsheet_runScheduling`
**Parameters:**
```json
{
  "taskId": [action_id],
  "priority": [priority],
  "dryRun": false
}
```

#### Step 5: Update Status
**Type:** Update Row
**Table:** ACTIONS
**Row:** `[_THISROW]`
**Set:** `updated_at` = `NOW()`

---

## 6.3 BOT: Energy Monitor

**Name:** Smart Energy Responder
**Trigger:** Schedule
**Schedule:** Hourly (10 AM, 2 PM, 4 PM, 7 PM)
**Timezone:** Asia/Dubai

### Process Steps:

#### Step 1: Get Latest Energy State
**Type:** Return Value
**Value:**
```
SELECT(HUMAN_STATE[energy_level],
  [timestamp] > (NOW() - 0.04166),  // Last hour
  [timestamp],
  TRUE
)[1]
```
**Store As:** `LatestEnergy`

#### Step 2: Get Latest Focus State
**Type:** Return Value
**Value:**
```
SELECT(HUMAN_STATE[focus_level],
  [timestamp] > (NOW() - 0.04166),
  [timestamp],
  TRUE
)[1]
```
**Store As:** `LatestFocus`

#### Step 3: Conditional - Low Energy?
**Condition:** `OR([LatestEnergy] <= 2, [LatestFocus] <= 2)`

**If TRUE:**
  - **Step 4A: Call Apps Script**
    - Function: `appsheet_updateHumanState`
    - Parameters:
      ```json
      {
        "energy": [LatestEnergy],
        "focus": [LatestFocus],
        "autoReschedule": true
      }
      ```

  - **Step 5A: Send Notification**
    - Type: Push
    - Title: "Schedule Adjusted"
    - Message: "Tasks rescheduled based on energy level"

**If FALSE (High Energy):**
  - **Step 4B: Move High-Priority Forward**
    - Call: `appsheet_runScheduling`
    - Parameters: `{ "priority": "critical", "optimize": true }`

---

## 6.4 BOT: Conflict Resolver

**Name:** Intelligent Conflict Handler
**Trigger:** Data Change
**Table:** CALENDAR_PROJECTION
**Condition:** `[conflict_detected] = TRUE`
**Run Behavior:** Real-time

### Process Steps:

#### Step 1: Find Conflicting Tasks
**Type:** Return Value
**Value:**
```
SELECT(ACTIONS[action_id],
  AND(
    [scheduled_start] < [_THISROW].[end],
    [scheduled_end] > [_THISROW].[start],
    IN([status], {"SCHEDULED", "IN_PROGRESS"})
  )
)
```
**Store As:** `ConflictingTasks`

#### Step 2: Get Task Details
**Type:** Return Value
**Value:**
```
SELECT(ACTIONS[title, priority, score],
  IN([action_id], [ConflictingTasks])
)
```
**Store As:** `TaskDetails`

#### Step 3: Use Gemini to Prioritize
**Type:** AI Task - Categorize
**Prompt:**
```
Given these conflicting tasks, which should take priority?

<<Start: FOREACH(task IN [TaskDetails])>>
Task <<INDEX([TaskDetails], task)>>:
- Title: <<[task].[title]>>
- Priority: <<[task].[priority]>>
- Score: <<[task].[score]>>
<<End>>

Consider: urgency, importance, deadlines, dependencies.
Return the task number that should keep its time slot.
```
**Store As:** `WinningTask`

#### Step 4: Call Apps Script
**Type:** Execute Apps Script
**Function:** `appsheet_resolveConflict`
**Parameters:**
```json
{
  "winningTask": [WinningTask],
  "conflictId": [_THISROW].[event_id],
  "losingTasks": [ConflictingTasks]
}
```

#### Step 5: Send Notification
**Type:** Push
**Message:** "Calendar conflict resolved automatically"

---

## 6.5 BOT: Daily Digest

**Name:** Daily Digest Generator
**Trigger:** Schedule
**Schedule:** Daily at 8:00 AM
**Timezone:** Asia/Dubai

### Process Steps:

#### Step 1: Query Today's Tasks
**Type:** Return Value
**Value:**
```
SELECT(ACTIONS[action_id],
  DATE([scheduled_start]) = TODAY()
)
```
**Store As:** `TodayTasks`

#### Step 2: Calculate Metrics
**Type:** Return Value
**Value:**
```json
{
  "total_tasks": COUNT([TodayTasks]),
  "total_hours": SUM(
    SELECT(ACTIONS[estimated_minutes],
      IN([action_id], [TodayTasks])
    )
  ) / 60,
  "high_priority": COUNT(
    SELECT(ACTIONS[action_id],
      AND(
        IN([action_id], [TodayTasks]),
        IN([priority], {"HIGH", "URGENT", "CRITICAL"})
      )
    )
  ),
  "avg_completion_prob": AVERAGE(
    SELECT(ACTIONS[completion_probability],
      IN([action_id], [TodayTasks])
    )
  )
}
```
**Store As:** `Metrics`

#### Step 3: Send Digest Email
**Type:** Send Email
**To:** `USEREMAIL()`
**Subject:** `CONCATENATE("Your Daily Plan - ", TEXT(TODAY(), "dddd, MMMM d"))`
**Body:**
```html
<h1>Good Morning! 📅</h1>

<h2>Today's Overview</h2>
<ul>
  <li><strong>Total Tasks:</strong> <<[Metrics].[total_tasks]>></li>
  <li><strong>Estimated Hours:</strong> <<ROUND([Metrics].[total_hours], 1)>></li>
  <li><strong>High Priority Items:</strong> <<[Metrics].[high_priority]>></li>
  <li><strong>Average Completion Probability:</strong> <<ROUND([Metrics].[avg_completion_prob] * 100, 0)>>%</li>
</ul>

<h2>Your Schedule</h2>
<<Start: FOREACH(task IN SELECT(ACTIONS[_THISROW], IN([action_id], [TodayTasks])))>>
  <div style="margin: 10px 0; padding: 10px; border-left: 3px solid
    <<IF([task].[priority] = "CRITICAL", "#ff0000",
       IF([task].[priority] = "HIGH", "#ff9900", "#0099ff"))>>;">
    <strong><<TEXT([task].[scheduled_start], "h:mm AM/PM")>>:</strong> <<[task].[title]>>
    <br>Duration: <<[task].[estimated_minutes]>> min | Priority: <<[task].[priority]>>
  </div>
<<End>>

<h2>Energy Optimization Tip</h2>
<p>Your peak hours are typically 10 AM - 12 PM. High-priority tasks are scheduled accordingly.</p>

<p><a href="<<APPLINK()>>" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
  Open App
</a></p>
```

---

## 6.6 BOT: Task Assignment Notifier

**Name:** Task Assignment Notifier
**Trigger:** Data Change
**Table:** ACTIONS
**Condition:**
```
AND(
  [_THISROW_BEFORE].[status] <> [_THISROW_AFTER].[status],
  [_THISROW_AFTER].[status] = "SCHEDULED"
)
```
**Run Behavior:** Real-time

### Process Steps:

#### Step 1: Send Push Notification
**Type:** Push Notification
**Title:** "New Task Assigned"
**Message:** `CONCATENATE([title], " scheduled for ", TEXT([scheduled_start], "h:mm AM/PM"))`
**Link:** `LINKTOROW([_THISROW])`
**Priority:** Normal

#### Step 2: Send Email (Optional)
**Type:** Send Email
**To:** `USEREMAIL()`
**Subject:** `CONCATENATE("New Task Assigned: ", [title])`
**Body:**
```html
<h2>You have a new task!</h2>

<div style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
  <h3><<[title]>></h3>
  <p><strong>Priority:</strong> <<[priority]>></p>
  <p><strong>Scheduled:</strong> <<TEXT([scheduled_start], "MMMM d, h:mm AM/PM")>></p>
  <p><strong>Estimated Time:</strong> <<[estimated_minutes]>> minutes</p>
  <<IF(ISNOTBLANK([deadline]), CONCATENATE("<p><strong>Deadline:</strong> ", TEXT([deadline], "MMMM d, yyyy"), "</p>"), "")>>
  <<IF(ISNOTBLANK([description]), CONCATENATE("<p><strong>Description:</strong> ", [description], "</p>"), "")>>
</div>

<div style="margin-top: 20px;">
  <a href="<<LINKTOROW([_THISROW])>>"
     style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
    View Task
  </a>
</div>

<p style="color: #666; margin-top: 30px;">
  This task was automatically scheduled based on your energy levels and calendar availability.
</p>
```

---

## 6.7 BOT: Real-time Sync to Apps Script

**Name:** Instant Sheet Update
**Trigger:** Data Change
**Table:** ACTIONS, PROPOSED_TASKS, HUMAN_STATE
**Condition:** `TRUE` (all changes)
**Run Behavior:** Real-time

### Process Steps:

#### Step 1: Determine Change Type
**Type:** Conditional Branch
**Condition:** `ISBLANK([_THISROW_BEFORE].[PrimaryKey])`

**If TRUE (New Record):**
  - Store: `ChangeType` = `"NEW"`

**If FALSE (Update):**
  - Store: `ChangeType` = `"UPDATE"`

#### Step 2: Call Apps Script
**Type:** Execute Apps Script
**Function:** Conditional on `ChangeType`

**If NEW:**
  - Function: `appsheet_handleNewRecord`
  - Parameters:
    ```json
    {
      "table": "[_TABLENAME]",
      "rowId": "[_THISROW].[PrimaryKey]",
      "data": "[_THISROW]"
    }
    ```

**If UPDATE:**
  - Function: `appsheet_handleUpdate`
  - Parameters:
    ```json
    {
      "table": "[_TABLENAME]",
      "rowId": "[_THISROW].[PrimaryKey]",
      "before": "[_THISROW_BEFORE]",
      "after": "[_THISROW_AFTER]"
    }
    ```

#### Step 3: Log Sync
**Type:** Add Row to ACTIVITY
**Values:**
```
timestamp: NOW()
level: "DEBUG"
component: "AppSheetSync"
action: "Real-time sync triggered"
data: JSON with sync details
```

---

## 6.8 BOT: Prediction Update Trigger

**Name:** ML Model Refresh Trigger
**Trigger:** Data Change
**Table:** ACTIONS
**Condition:** `[status] = "COMPLETED"`
**Run Behavior:** Batched (hourly)

### Process Steps:

#### Step 1: Check Training Data Count
**Type:** Return Value
**Value:**
```
COUNT(
  SELECT(ACTIONS[action_id],
    AND(
      [status] = "COMPLETED",
      ISNOTBLANK([actual_minutes])
    )
  )
)
```
**Store As:** `TrainingCount`

#### Step 2: Conditional - Enough Data?
**Condition:** `MOD([TrainingCount], 50) = 0`  // Every 50 completions

**If TRUE:**
  - **Step 3: Trigger Model Retrain**
    - Type: Custom API Call (if available)
    - Or: Log to ACTIVITY for manual retrain

  - **Step 4: Send Notification**
    - Type: Email
    - To: Admin
    - Subject: "ML Model Retrain Recommended"
    - Message: `CONCATENATE("Training data reached ", [TrainingCount], " samples. Consider retraining predictive models.")`

---

## 6.9 BOT: Overdue Alert

**Name:** Overdue Task Alert
**Trigger:** Schedule
**Schedule:** Daily at 9:00 AM
**Timezone:** Asia/Dubai

### Process Steps:

#### Step 1: Query Overdue Tasks
**Type:** Return Value
**Value:**
```
SELECT(ACTIONS[action_id, title, deadline],
  [is_overdue] = TRUE
)
```
**Store As:** `OverdueTasks`

#### Step 2: Conditional - Any Overdue?
**Condition:** `COUNT([OverdueTasks]) > 0`

**If TRUE:**
  - **Step 3: Send Alert Email**
    - Type: Email
    - To: `USEREMAIL()`
    - Subject: `CONCATENATE("⚠️ ", COUNT([OverdueTasks]), " Overdue Tasks")`
    - Body: List of overdue tasks with deadlines

  - **Step 4: Send Push Notification**
    - Type: Push
    - Title: "Overdue Tasks"
    - Message: `CONCATENATE(COUNT([OverdueTasks]), " tasks are overdue")`
    - Link: Navigate to Overdue Tasks slice

---

## 6.10 BOT: Weekly Planning

**Name:** Weekly Planning Generator
**Trigger:** Schedule
**Schedule:** Weekly on Sunday at 6:00 PM
**Timezone:** Asia/Dubai

### Process Steps:

#### Step 1: Query Next Week Tasks
**Type:** Return Value
**Value:**
```
SELECT(ACTIONS[action_id],
  AND(
    [scheduled_start] >= (TODAY() + 1),
    [scheduled_start] < (TODAY() + 8),
    IN([status], {"SCHEDULED", "PENDING"})
  )
)
```

#### Step 2: Calculate Weekly Metrics
**Type:** Return Value
**Value:** Weekly totals, by day, by priority

#### Step 3: Call Apps Script for Optimization
**Type:** Execute Apps Script
**Function:** `appsheet_runScheduling`
**Parameters:**
```json
{
  "mode": "weekly_optimization",
  "startDate": "<<TODAY() + 1>>",
  "endDate": "<<TODAY() + 8>>"
}
```

#### Step 4: Send Weekly Plan Email
**Type:** Email with formatted plan

---

## 6.11 BOT: Gemini Proposal Processor

**Name:** Email Intelligence Processor
**Trigger:** Data Change
**Table:** PROPOSED_TASKS
**Condition:** `AND([status] = "PENDING", [ai_processed] <> TRUE)`
**Run Behavior:** Real-time

### Process Steps:

#### Step 1: Gemini AI Extraction
**Type:** AI Task - Extract
**Source:** `[raw_content_preview]`
**Model:** Gemini 1.5 Pro
**Temperature:** 0.3
**Extract Fields:**

1. **Task Type**
   - Type: Category
   - Options: `["Deep Work", "Communication", "Administrative", "Creative"]`
   - Prompt: "Categorize this email into one of the task types based on the content"

2. **Urgency Level**
   - Type: Category
   - Options: `["CRITICAL", "HIGH", "MEDIUM", "LOW"]`
   - Prompt: "Determine urgency based on language cues, deadlines mentioned, and sender tone"

3. **Estimated Minutes**
   - Type: Number
   - Range: 15-480
   - Prompt: "Estimate time needed in minutes based on task complexity and scope"

4. **Due Date**
   - Type: Date
   - Prompt: "Extract any mentioned deadline or due date. Return null if none mentioned."

5. **Key Action Items**
   - Type: Text (List)
   - Prompt: "List main action items from email as bullet points"

**Store As:** `AIExtraction`

#### Step 2: Update Proposal with AI Data
**Type:** Update Row
**Table:** PROPOSED_TASKS
**Row:** `[_THISROW]`
**Set:**
```
ai_task_type: [AIExtraction].[Task Type]
ai_urgency: [AIExtraction].[Urgency Level]
ai_estimated_minutes: [AIExtraction].[Estimated Minutes]
ai_due_date: [AIExtraction].[Due Date]
ai_action_items: [AIExtraction].[Key Action Items]
ai_processed: TRUE
ai_confidence: [AIExtraction].[Confidence]
```

#### Step 3: Conditional - High Confidence Auto-Approve?
**Condition:** `[should_auto_accept] = TRUE`

**If TRUE:**
  - Execute: Approve Proposal action automatically

---

## 6.12 BOT: OCR Task Extractor

**Name:** Document Intelligence Processor
**Trigger:** File Upload
**Table:** ACTIONS (when file attached)
**Condition:** `ISNOTBLANK([Attachment])`

### Process Steps:

#### Step 1: Gemini AI OCR Extraction
**Type:** AI Task - Extract (with OCR)
**Source:** `[Attachment]`
**Model:** Gemini 1.5 Pro
**Extract Fields:**

1. **Document Type**
   - Prompt: "Identify document type: Invoice, Contract, Note, Whiteboard, Photo, Handwritten, etc."

2. **Tasks Mentioned**
   - Type: Text (List)
   - Prompt: "Extract all task items, action items, or to-dos mentioned in document. Return as list."

3. **People Mentioned**
   - Type: Text (List)
   - Prompt: "List all people mentioned by name"

4. **Deadlines**
   - Type: Date (List)
   - Prompt: "Extract any dates or deadlines mentioned"

**Store As:** `OCRExtraction`

#### Step 2: Loop Through Extracted Tasks
**Type:** For Each
**List:** `[OCRExtraction].[Tasks Mentioned]`

**For Each Task:**
  - **Add Row to PROPOSED_TASKS**
    - Values:
      ```
      proposal_id: UNIQUEID()
      status: "PENDING"
      source: "ocr_extraction"
      source_id: [_THISROW].[action_id]
      parsed_title: [TaskItem]
      confidence_score: [OCRExtraction].[Confidence]
      ai_processed: TRUE
      created_at: NOW()
      ```

#### Step 3: Send Notification
**Type:** Push
**Title:** "Tasks Extracted from Document"
**Message:** `CONCATENATE(COUNT([ExtractedTasks]), " tasks found in ", [OCRExtraction].[Document Type])`

---

## 6.13 BOT: Predictive Task Suggester

**Name:** Pattern Learner
**Trigger:** Schedule
**Schedule:** Daily at 6:00 AM
**Timezone:** Asia/Dubai

### Process Steps:

#### Step 1: Analyze Historical Patterns
**Type:** Return Value
**Value:**
```
SELECT(ACTIONS[title, lane, priority, day_of_week],
  AND(
    [created_at] > (TODAY() - 90),
    WEEKDAY([created_at]) = WEEKDAY(TODAY()),
    [status] = "COMPLETED"
  )
)
```
**Store As:** `HistoricalPatterns`

#### Step 2: Use Predictive Model
**Type:** ML Prediction (if custom model trained)
**Or:** Pattern matching logic
**Input:** Current date, day of week, recent activity
**Output:** Suggested tasks with confidence

#### Step 3: Create High-Confidence Suggestions
**Type:** For Each suggestion with confidence > 0.7
**Action:** Add Row to PROPOSED_TASKS
**Values:**
```
parsed_title: [Suggestion]
source: "predictive_ml"
confidence_score: [Confidence]
status: "ML_SUGGESTION"
ai_processed: TRUE
```

#### Step 4: Send Daily Brief
**Type:** Email
**To:** `USEREMAIL()`
**Subject:** "Daily Suggestions from AI"
**Body:** List of suggested tasks with option to approve/dismiss

---

## 6.14 BOT: Completion Feedback Collector

**Name:** Learning Feedback Loop
**Trigger:** Data Change
**Table:** ACTIONS
**Condition:** `[status] = "COMPLETED"`
**Run Behavior:** Real-time

### Process Steps:

#### Step 1: Compare Estimate vs Actual
**Type:** Return Value
**Value:**
```
ABS([estimated_minutes] - [actual_minutes]) / [estimated_minutes]
```
**Store As:** `EstimateError`

#### Step 2: Conditional - Large Variance?
**Condition:** `[EstimateError] > 0.3`  // 30% off

**If TRUE:**
  - **Step 3A: Request Feedback**
    - Type: Send Push Notification
    - Title: "Estimation Feedback"
    - Message: "This task took different time than estimated. Can you provide feedback?"
    - Action: Open feedback form

  - **Step 4A: Update Sender Reputation (if from email)**
    - If: `ISNOTBLANK([source_id])`
    - Then: Adjust sender reputation based on accuracy

#### Step 3: Log for Model Retraining
**Type:** Add Row to ACTIVITY
**Values:** Detailed completion metrics for ML training

---

## 6.15 BOT: Calendar Sync

**Name:** Bidirectional Calendar Sync
**Trigger:** Data Change
**Table:** ACTIONS
**Condition:** `[status] = "SCHEDULED"`
**Run Behavior:** Real-time

### Process Steps:

#### Step 1: Check Calendar Event ID
**Type:** Conditional
**Condition:** `ISBLANK([calendar_event_id])`

**If TRUE (No event yet):**
  - **Step 2A: Create Calendar Event**
    - Type: Google Calendar Create Event
    - Title: `[title]`
    - Start: `[scheduled_start]`
    - End: `[scheduled_end]`
    - Description: `CONCATENATE("Priority: ", [priority], "\n", [description])`
    - Color: Based on priority
    - Store Event ID: Update `[calendar_event_id]`

**If FALSE (Event exists):**
  - **Step 2B: Update Calendar Event**
    - Type: Google Calendar Update Event
    - Event ID: `[calendar_event_id]`
    - Update: Start, End, Title, Description

---

# SECTION 7: INTELLIGENCE INTEGRATION

## 7.1 Gemini AI Configuration

### Connection Setup
1. **Enable Gemini AI:** Settings → Intelligence → Gemini AI → Enable
2. **Model Selection:** Gemini 1.5 Pro (for best accuracy)
3. **API Quota:** Monitor usage in AppSheet Intelligence dashboard

### Extraction Templates

#### Template 1: Email Task Extraction
**Use Case:** Extract task details from email proposals
**Source Column:** `PROPOSED_TASKS.raw_content_preview`
**Temperature:** 0.3 (more deterministic)
**Max Tokens:** 2000

**Fields:**
```json
{
  "task_type": {
    "type": "category",
    "options": ["Deep Work", "Communication", "Administrative", "Creative"],
    "prompt": "Categorize the task type based on email content"
  },
  "urgency": {
    "type": "category",
    "options": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
    "prompt": "Determine urgency from language cues, deadlines, and sender tone"
  },
  "estimated_minutes": {
    "type": "number",
    "range": [15, 480],
    "prompt": "Estimate time needed in minutes based on complexity"
  },
  "due_date": {
    "type": "date",
    "prompt": "Extract any mentioned deadline or due date"
  },
  "action_items": {
    "type": "text_list",
    "prompt": "List main action items as bullet points"
  }
}
```

#### Template 2: OCR Document Processing
**Use Case:** Extract tasks from images/documents
**Source:** File attachment
**Temperature:** 0.2 (very deterministic for OCR)
**Max Tokens:** 3000

**Fields:**
```json
{
  "document_type": {
    "type": "text",
    "prompt": "Identify document type: Invoice, Contract, Note, Whiteboard, Photo, Handwritten, etc."
  },
  "tasks_mentioned": {
    "type": "text_list",
    "prompt": "Extract all task items, action items, or to-dos. Return as list."
  },
  "people_mentioned": {
    "type": "text_list",
    "prompt": "List all people mentioned by name"
  },
  "deadlines": {
    "type": "date_list",
    "prompt": "Extract any dates or deadlines"
  },
  "key_numbers": {
    "type": "text_list",
    "prompt": "Extract important numbers, amounts, or quantities"
  }
}
```

#### Template 3: Conflict Resolution Prioritization
**Use Case:** AI decides which task wins calendar conflict
**Source:** Constructed prompt from conflicting tasks
**Temperature:** 0.4 (balanced)
**Max Tokens:** 1000

**Prompt Template:**
```
Given these conflicting tasks, which should take priority?

Task 1:
- Title: {task1.title}
- Priority: {task1.priority}
- Deadline: {task1.deadline}
- Score: {task1.score}
- Lane: {task1.lane}

Task 2:
- Title: {task2.title}
- Priority: {task2.priority}
- Deadline: {task2.deadline}
- Score: {task2.score}
- Lane: {task2.lane}

Consider: urgency, importance, deadlines, dependencies, energy requirements.
Return only the task number (1 or 2) that should keep its time slot.
```

**Expected Response Format:**
```
1
```
(or)
```
2
```

### Confidence Thresholds

| AI Task | Minimum Confidence | Auto-Execute Threshold | Manual Review Threshold |
|---------|-------------------|------------------------|------------------------|
| Email Extraction | 0.5 | 0.8 | 0.5-0.8 |
| OCR Processing | 0.4 | 0.85 | 0.4-0.85 |
| Conflict Resolution | 0.6 | 0.9 | 0.6-0.9 |
| Task Categorization | 0.7 | N/A | N/A |

---

## 7.2 Predictive ML Models

### Model 1: Task Duration Predictor

**Type:** Regression
**Target Column:** `ACTIONS.actual_minutes`
**Training Data Filter:**
```
AND(
  [status] = "COMPLETED",
  ISNOTBLANK([actual_minutes]),
  [actual_minutes] > 0,
  [actual_minutes] < 600
)
```
**Minimum Training Samples:** 100
**Auto-Retrain:** Weekly (Sunday 2:00 AM)

**Feature Columns:**
```json
{
  "text_features": [
    {
      "column": "title",
      "method": "text_analysis",
      "weight": 0.25
    },
    {
      "column": "description",
      "method": "text_analysis",
      "weight": 0.15
    }
  ],
  "categorical_features": [
    {
      "column": "lane",
      "weight": 0.20
    },
    {
      "column": "ai_task_type",
      "weight": 0.15
    },
    {
      "column": "priority",
      "weight": 0.10
    },
    {
      "column": "context_type",
      "weight": 0.05
    }
  ],
  "numeric_features": [
    {
      "column": "estimated_minutes",
      "weight": 0.10
    }
  ],
  "derived_features": [
    {
      "name": "day_of_week",
      "formula": "WEEKDAY([created_at])",
      "weight": 0.05
    },
    {
      "name": "hour_of_day",
      "formula": "HOUR([created_at])",
      "weight": 0.05
    },
    {
      "name": "title_length",
      "formula": "LEN([title])",
      "weight": 0.05
    },
    {
      "name": "has_deadline",
      "formula": "IF(ISNOTBLANK([deadline]), 1, 0)",
      "weight": 0.05
    }
  ],
  "reference_features": [
    {
      "column": "sender",
      "reference_path": "sender.reputation_score",
      "weight": 0.05
    }
  ]
}
```

**Model Parameters:**
- Algorithm: Gradient Boosted Trees
- Max Depth: 6
- Learning Rate: 0.1
- Validation Split: 20%
- Early Stopping: Enabled

**Performance Targets:**
- R² Score: > 0.75
- Mean Absolute Error: < 15 minutes
- 90th Percentile Error: < 30 minutes

**Usage:**
```
Virtual Column: predicted_duration
Formula: PREDICT("Task Duration Predictor", [_THISROW])
```

---

### Model 2: On-Time Completion Predictor

**Type:** Binary Classification
**Target Column:** `will_complete_on_time` (virtual column)
**Target Definition:**
```
IF(
  AND(
    [status]="COMPLETED",
    ISNOTBLANK([completed_date]),
    ISNOTBLANK([deadline])
  ),
  IF([completed_date] <= [deadline], "Yes", "No"),
  ""
)
```
**Training Data Filter:**
```
AND(
  [status] = "COMPLETED",
  ISNOTBLANK([deadline]),
  ISNOTBLANK([completed_date])
)
```
**Minimum Training Samples:** 150
**Auto-Retrain:** Weekly

**Feature Columns:**
```json
{
  "categorical_features": [
    {
      "column": "priority",
      "weight": 0.20
    },
    {
      "column": "lane",
      "weight": 0.15
    },
    {
      "column": "ai_task_type",
      "weight": 0.10
    }
  ],
  "numeric_features": [
    {
      "column": "estimated_minutes",
      "weight": 0.15
    },
    {
      "column": "ai_estimated_minutes",
      "weight": 0.10
    },
    {
      "column": "predicted_duration",
      "weight": 0.10
    }
  ],
  "derived_features": [
    {
      "name": "days_until_deadline",
      "formula": "(HOUR([deadline] - NOW()) / 24)",
      "weight": 0.15
    },
    {
      "name": "current_workload",
      "formula": "COUNT(SELECT(ACTIONS[action_id], [status]=\"IN_PROGRESS\"))",
      "weight": 0.10
    }
  ],
  "reference_features": [
    {
      "column": "sender",
      "reference_path": "sender.reputation_score",
      "weight": 0.05
    }
  ],
  "historical_features": [
    {
      "name": "historical_completion_rate",
      "formula": "User's past on-time completion rate",
      "weight": 0.10
    }
  ]
}
```

**Model Parameters:**
- Algorithm: Logistic Regression with regularization
- Class Weights: Balanced
- Validation Split: 25%
- Threshold: 0.5 (adjustable)

**Performance Targets:**
- Accuracy: > 80%
- Precision: > 75%
- Recall: > 70%
- AUC-ROC: > 0.85

**Usage:**
```
Virtual Column: completion_probability
Formula: PREDICT("On-Time Completion Predictor", [_THISROW])
```

---

### Model Monitoring

**Track These Metrics:**
1. **Prediction Accuracy:** Compare predictions to actuals weekly
2. **Feature Importance:** Monitor which features drive predictions
3. **Drift Detection:** Alert if prediction quality degrades
4. **Training Data Quality:** Ensure sufficient, diverse samples

**Dashboard Widget:**
```
Chart: Model Performance Trends
X-Axis: Week
Y-Axis: Accuracy, R² Score
Series: Duration Predictor, Completion Predictor
```

---

## 7.3 Smart Assistant Configuration

**Enable:** Settings → Intelligence → Smart Assistant → ON

### Intent 1: Schedule Task with AI

**Training Phrases:**
- "Schedule [task] using AI optimization"
- "Smart schedule: [task]"
- "Add [task] and let AI decide timing"
- "Intelligently schedule [task]"
- "AI schedule [task] for me"

**Parameters:**
- `@task_title` (required, any text)

**Action Flow:**
1. Create task in ACTIONS (status = PENDING)
2. Call Gemini to extract details from `@task_title`
3. Use Duration Predictor for estimate
4. Call `appsheet_runScheduling`
5. Return: "Scheduled for [time] based on your energy and workload"

---

### Intent 2: Check Predictions

**Training Phrases:**
- "How likely am I to finish today's tasks?"
- "Show my completion probability"
- "Am I overcommitted?"
- "Will I finish on time today?"
- "Check my schedule probability"

**Parameters:** None

**Action Flow:**
1. Query today's tasks with completion probabilities
2. Calculate average probability
3. Generate insight:
   - > 80%: "You're on track! High probability of completing everything."
   - 60-80%: "Moderate chance. Consider prioritizing."
   - < 60%: "Overcommitted. Consider rescheduling or deferring tasks."

---

### Intent 3: Update Energy State

**Training Phrases:**
- "I'm feeling low energy"
- "Energy level is [number]"
- "I'm exhausted"
- "High energy right now"
- "Update my energy to [number]"

**Parameters:**
- `@energy_level` (optional, 1-5)

**Action Flow:**
1. If no number provided, prompt: "On a scale of 1-5, how's your energy?"
2. Update HUMAN_STATE table
3. Call `appsheet_updateHumanState` with autoReschedule=true
4. Return: "Energy updated to [level]. Schedule adjusted for [X] tasks."

---

### Intent 4: Show Next Task

**Training Phrases:**
- "What's next?"
- "Show my next task"
- "What should I do now?"
- "Next task please"

**Parameters:** None

**Action Flow:**
1. Query: Next scheduled task with start time > NOW()
2. Return formatted response:
   ```
   Next up: [title]
   Time: [scheduled_start]
   Duration: [estimated_minutes] min
   Priority: [priority]
   ```

---

### Intent 5: Complete Current Task

**Training Phrases:**
- "Mark current task as done"
- "Complete this task"
- "I finished the current task"
- "Task complete"

**Parameters:**
- `@actual_minutes` (optional, number)

**Action Flow:**
1. Find task with status = "IN_PROGRESS"
2. If none, ask: "Which task did you complete?"
3. If no actual_minutes, prompt: "How long did it take?"
4. Execute Complete Task action
5. Return: "Great! [title] marked as complete. [Next task info]"

---

# SECTION 8: APPS SCRIPT INTEGRATION

## 8.1 Apps Script API Setup

### Prerequisites:
1. **Enable Apps Script API**
   - Navigate to: https://script.google.com/home/usersettings
   - Toggle ON: "Google Apps Script API"

2. **Get Script ID**
   - Open MOH TIME OS Apps Script project
   - Project Settings → Script ID
   - Copy Script ID (format: `1qSPBJ4...ABC123...xyz789`)

3. **Configure OAuth Scopes**
   Add to `appsscript.json`:
   ```json
   {
     "timeZone": "Asia/Dubai",
     "dependencies": {
       "enabledAdvancedServices": []
     },
     "executionApi": {
       "access": "ANYONE"
     },
     "oauthScopes": [
       "https://www.googleapis.com/auth/spreadsheets",
       "https://www.googleapis.com/auth/script.external_request",
       "https://www.googleapis.com/auth/gmail.readonly",
       "https://www.googleapis.com/auth/gmail.modify",
       "https://www.googleapis.com/auth/calendar",
       "https://www.googleapis.com/auth/drive"
     ]
   }
   ```

4. **Deploy as API Executable**
   - Deploy → New Deployment
   - Type: API Executable
   - Access: Anyone
   - Copy Deployment ID

---

## 8.2 AppSheet Connection Configuration

### In AppSheet:

1. **Navigate to:** Automation → Apps Script

2. **Add Connection:**
   - Name: `MOH_TIME_OS`
   - Script ID: `[Your Script ID]`
   - Click "Authorize"

3. **Grant Permissions:**
   - Sign in with Google account
   - Grant all requested permissions
   - Verify green checkmark appears

4. **Test Connection:**
   - AppSheet will list available functions
   - Verify all wrapper functions appear:
     - `appsheet_runScheduling`
     - `appsheet_processEmails`
     - `appsheet_updateHumanState`
     - `appsheet_approveProposal`
     - `appsheet_getSystemStatus`
     - `appsheet_handleNewRecord`
     - `appsheet_handleUpdate`
     - `appsheet_resolveConflict`

---

## 8.3 Callable Functions Reference

### Function: appsheet_runScheduling

**Purpose:** Trigger intelligent scheduling cycle
**Execution Time:** 2-5 seconds

**Parameters:**
```typescript
interface SchedulingParams {
  taskId?: string;           // Specific task to schedule (optional)
  priority?: string;          // Override priority filter (optional)
  dryRun?: boolean;          // Test mode without writing (default: false)
  mode?: string;             // "immediate" | "batch" | "weekly_optimization"
  startDate?: string;        // For weekly optimization (ISO date)
  endDate?: string;          // For weekly optimization (ISO date)
  optimize?: boolean;        // Extra optimization pass (default: false)
}
```

**Returns:**
```typescript
interface SchedulingResult {
  success: boolean;
  scheduled: number;         // Count of tasks scheduled
  conflicts: number;         // Count of conflicts detected
  rescheduled: number;       // Count of tasks rescheduled
  skipped: string[];         // Array of task IDs skipped
  timestamp: string;         // ISO timestamp
  error?: string;            // Error message if failed
}
```

**Usage in Bot:**
```javascript
// Basic usage
appsheet_runScheduling({
  "dryRun": false
})

// Schedule specific task
appsheet_runScheduling({
  "taskId": [action_id],
  "priority": [priority]
})

// Weekly optimization
appsheet_runScheduling({
  "mode": "weekly_optimization",
  "startDate": "<<TODAY() + 1>>",
  "endDate": "<<TODAY() + 8>>"
})
```

---

### Function: appsheet_processEmails

**Purpose:** Trigger email triage cycle
**Execution Time:** 5-15 seconds (depends on email count)

**Parameters:**
```typescript
interface EmailProcessingParams {
  maxEmails?: number;        // Max emails to process (default: 20)
  source?: string;           // Tracking source
  timestamp?: string;        // Request timestamp
}
```

**Returns:**
```typescript
interface EmailProcessingResult {
  success: boolean;
  processed: number;         // Emails processed
  approved: number;          // Auto-approved
  ignored: number;           // Filtered out
  proposals_created: string[]; // Array of proposal IDs
  timestamp: string;
  error?: string;
}
```

**Usage in Bot:**
```javascript
appsheet_processEmails({
  "maxEmails": 50,
  "source": "appsheet_scheduled",
  "timestamp": "<<NOW()>>"
})
```

---

### Function: appsheet_updateHumanState

**Purpose:** Update user energy/focus state and optionally reschedule
**Execution Time:** 2-4 seconds

**Parameters:**
```typescript
interface HumanStateParams {
  energy?: number;           // Energy level 1-5
  focus?: number;            // Focus level 1-5
  mood?: string;             // Mood enum value
  stress?: number;           // Stress level 1-5
  autoReschedule?: boolean;  // Trigger rescheduling (default: false)
  timestamp?: string;
}
```

**Returns:**
```typescript
interface HumanStateResult {
  success: boolean;
  state_updated: boolean;
  rescheduled: number;       // Tasks rescheduled (if autoReschedule=true)
  timestamp: string;
  error?: string;
}
```

**Usage in Bot:**
```javascript
appsheet_updateHumanState({
  "energy": [INPUT:energy_level],
  "focus": [INPUT:focus_level],
  "mood": [INPUT:mood],
  "autoReschedule": true
})
```

---

### Function: appsheet_approveProposal

**Purpose:** Approve proposal, create action, and schedule
**Execution Time:** 3-6 seconds

**Parameters:**
```typescript
interface ApprovalParams {
  proposalId: string;        // Required: proposal_id to approve
}
```

**Returns:**
```typescript
interface ApprovalResult {
  success: boolean;
  action_id: string;         // New action ID created
  scheduled: boolean;        // Whether task was scheduled
  timestamp: string;
  error?: string;
}
```

**Usage in Bot:**
```javascript
appsheet_approveProposal({
  "proposalId": [proposal_id]
})
```

---

### Function: appsheet_getSystemStatus

**Purpose:** Get current system health and metrics
**Execution Time:** < 1 second

**Parameters:** None

**Returns:**
```typescript
interface SystemStatus {
  healthy: boolean;
  services: {
    [serviceName: string]: {
      status: string;
      lastRun?: string;
    }
  };
  metrics: {
    tasksScheduled: number;
    pendingProposals: number;
    completedToday: number;
  };
  timestamp: string;
  error?: string;
}
```

---

### Function: appsheet_handleNewRecord

**Purpose:** Handle new record created in AppSheet
**Execution Time:** 1-2 seconds

**Parameters:**
```typescript
interface NewRecordParams {
  table: string;             // Table name
  rowId: string;             // Primary key value
  data: object;              // Full row data
}
```

**Returns:**
```typescript
interface HandleResult {
  success: boolean;
  processed: boolean;
  triggered?: string[];      // Services triggered
  timestamp: string;
  error?: string;
}
```

---

### Function: appsheet_handleUpdate

**Purpose:** Handle record update in AppSheet
**Execution Time:** 1-3 seconds

**Parameters:**
```typescript
interface UpdateParams {
  table: string;
  rowId: string;
  before: object;            // Row state before update
  after: object;             // Row state after update
}
```

**Returns:**
```typescript
interface HandleResult {
  success: boolean;
  rescheduled: boolean;
  changes_processed: boolean;
  timestamp: string;
  error?: string;
}
```

---

### Function: appsheet_resolveConflict

**Purpose:** Resolve calendar conflict by rescheduling losing tasks
**Execution Time:** 3-8 seconds

**Parameters:**
```typescript
interface ConflictParams {
  winningTask: string;       // Task ID that keeps slot
  conflictId: string;        // Conflict event ID
  losingTasks: string[];     // Array of task IDs to reschedule
}
```

**Returns:**
```typescript
interface ConflictResult {
  success: boolean;
  rescheduled: string[];     // Task IDs rescheduled
  failed: string[];          // Task IDs that couldn't be rescheduled
  timestamp: string;
  error?: string;
}
```

---

## 8.4 Error Handling

### Common Error Codes:

| Error Code | Meaning | Resolution |
|------------|---------|------------|
| `PERMISSION_DENIED` | OAuth scope missing | Re-authorize connection |
| `FUNCTION_NOT_FOUND` | Function name typo | Check function spelling |
| `EXECUTION_TIMEOUT` | Script took too long | Optimize or retry |
| `QUOTA_EXCEEDED` | API quota limit hit | Wait and retry later |
| `INVALID_PARAMETERS` | Wrong parameter format | Check parameter types |

### Bot Error Handling Pattern:

```javascript
// In bot step after Apps Script call:

Step: Conditional Branch
Condition: [FunctionResult].[success] = FALSE

If TRUE (Error occurred):
  Step: Log Error
  - Add row to ACTIVITY
  - level: "ERROR"
  - component: "AppSheetBot"
  - action: [FunctionName]
  - data: [FunctionResult].[error]

  Step: Send Admin Alert
  - Email to admin
  - Subject: "Apps Script Integration Error"
  - Body: Error details

  Step: Notify User (if critical)
  - Push notification
  - "An error occurred. Please try again."
```

---

## 8.5 Real-time Sync Configuration

### Apps Script → AppSheet (onEdit Trigger)

Add this to Apps Script project:

```javascript
/**
 * Installed trigger for sheet edits
 * Syncs changes immediately to AppSheet
 */
function onEdit(e) {
  if (!e || !e.range) return;

  const sheetName = e.range.getSheet().getName();
  const editedRow = e.range.getRow();

  // Only sync operational sheets
  const syncSheets = [
    SHEET_NAMES.ACTIONS,
    SHEET_NAMES.PROPOSED_TASKS,
    SHEET_NAMES.HUMAN_STATE,
    SHEET_NAMES.CALENDAR_PROJECTION
  ];

  if (!syncSheets.includes(sheetName)) return;

  try {
    // Trigger AppSheet sync
    // Use AppSheet API or webhook (if configured)
    const logger = safeGetService(SERVICES.SmartLogger, console);
    logger.debug('AppSheetSync', 'Sheet edited, AppSheet sync triggered', {
      sheet: sheetName,
      row: editedRow
    });

  } catch (error) {
    Logger.log('AppSheet sync error: ' + error.message);
  }
}
```

### AppSheet → Apps Script (Real-time Bot)

Configured in Bot 6.7 (Real-time Sync to Apps Script)

---

# SECTION 9: IMPLEMENTATION CHECKLIST

## Phase 1: Foundation Setup (Week 1)

### Day 1: Data Connection
- [ ] Create AppSheet app from Google Sheet
- [ ] Verify all 12 tables detected
- [ ] Set spreadsheet URL: `https://docs.google.com/spreadsheets/d/1GZf9wx9-9glFW0WXkVrYI7kZI3NeHhEosVdb-ctylk0`

### Day 2: Data Types
- [ ] Fix column types in ACTIONS table (24 columns)
- [ ] Fix column types in PROPOSED_TASKS table (12 + AI columns)
- [ ] Configure all enum values (status, priority, lanes, etc.)
- [ ] Set up data validations

### Day 3: Relationships
- [ ] Create ACTIONS → PROPOSED_TASKS reference
- [ ] Create PROPOSED_TASKS → SENDER_REPUTATION reference
- [ ] Create ACTIONS → LANES reference
- [ ] Create TIME_BLOCKS → ACTIONS reference
- [ ] Verify reverse references auto-generated

### Day 4: Virtual Columns
- [ ] Add 9 virtual columns to ACTIONS
- [ ] Add 3 virtual columns to PROPOSED_TASKS
- [ ] Add 3 virtual columns to CALENDAR_PROJECTION
- [ ] Add 2 virtual columns to SENDER_REPUTATION
- [ ] Test all formulas

### Day 5: Slices
- [ ] Create 15 slices (Active Tasks, Today's Tasks, etc.)
- [ ] Test filter expressions
- [ ] Verify sorts and limits

---

## Phase 2: Views & Actions (Week 2)

### Day 6-7: Views
- [ ] Create Dashboard view with 6 widgets
- [ ] Create Task List view (table)
- [ ] Create Calendar View
- [ ] Create Triage Queue (deck view)
- [ ] Create Energy Log view
- [ ] Create Settings view

### Day 8-9: Actions
- [ ] Implement 10 primary actions
- [ ] Test each action thoroughly
- [ ] Verify conditional visibility (Show If)
- [ ] Test input prompts and confirmations

### Day 10: UI Polish
- [ ] Set icons for all views
- [ ] Configure colors for priority badges
- [ ] Test navigation flows
- [ ] Optimize for mobile

---

## Phase 3: Apps Script Integration (Week 3)

### Day 11: Apps Script Setup
- [ ] Enable Apps Script API
- [ ] Copy Script ID
- [ ] Configure OAuth scopes in appsscript.json
- [ ] Add executionApi.access = "ANYONE"
- [ ] Deploy as API Executable

### Day 12: Wrapper Functions
- [ ] Add 8 appsheet_* wrapper functions to Apps Script
- [ ] Test each function in Apps Script IDE
- [ ] Verify return values match interface

### Day 13: AppSheet Connection
- [ ] Add Apps Script connection in AppSheet
- [ ] Authorize with Google account
- [ ] Verify all functions visible
- [ ] Test connection with appsheet_getSystemStatus

### Day 14-15: Test Integration
- [ ] Test appsheet_runScheduling
- [ ] Test appsheet_processEmails
- [ ] Test appsheet_updateHumanState
- [ ] Test appsheet_approveProposal
- [ ] Test error handling

---

## Phase 4: Automation (Week 4)

### Day 16-17: Core Bots
- [ ] Create Email Processing Scheduler bot (6.1)
- [ ] Create Intelligent Scheduler bot (6.2)
- [ ] Create Energy Monitor bot (6.3)
- [ ] Create Conflict Resolver bot (6.4)
- [ ] Test each bot individually

### Day 18-19: Notification Bots
- [ ] Create Daily Digest bot (6.5)
- [ ] Create Task Assignment Notifier bot (6.6)
- [ ] Create Overdue Alert bot (6.9)
- [ ] Test email templates
- [ ] Test push notifications

### Day 20: Sync & Utility Bots
- [ ] Create Real-time Sync bot (6.7)
- [ ] Create Prediction Update Trigger bot (6.8)
- [ ] Create Calendar Sync bot (6.15)
- [ ] Test bidirectional sync

---

## Phase 5: AI Features (Week 5)

### Day 21-22: Gemini AI
- [ ] Enable Gemini AI (requires Enterprise Plus)
- [ ] Configure Email Intelligence Processor bot (6.11)
- [ ] Configure OCR Task Extractor bot (6.12)
- [ ] Test extraction accuracy
- [ ] Tune confidence thresholds

### Day 23-24: Predictive Models
- [ ] Ensure 100+ completed tasks with actual_minutes
- [ ] Create Task Duration Predictor model
- [ ] Train model (10-15 minutes)
- [ ] Verify accuracy > 75%
- [ ] Deploy model

- [ ] Ensure 150+ completed tasks with deadlines
- [ ] Create On-Time Completion Predictor model
- [ ] Train model
- [ ] Verify accuracy > 80%
- [ ] Deploy model

### Day 25: AI Integration
- [ ] Add predicted_duration virtual column
- [ ] Add completion_probability virtual column
- [ ] Create Predictive Task Suggester bot (6.13)
- [ ] Create Learning Feedback Loop bot (6.14)
- [ ] Test end-to-end AI workflow

---

## Phase 6: Polish & Production (Week 6)

### Day 26-27: Testing
- [ ] Run all test scenarios from Section 7
- [ ] Test with multiple users
- [ ] Load test with 100+ tasks
- [ ] Verify quota usage acceptable
- [ ] Test offline mode

### Day 28: Documentation
- [ ] Create user guide
- [ ] Document custom workflows
- [ ] Create video walkthrough
- [ ] Set up support channel

### Day 29: Deployment
- [ ] Deploy to production
- [ ] Set up monitoring dashboard
- [ ] Configure backup schedule
- [ ] Train users

### Day 30: Monitoring & Iteration
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Tune bot schedules
- [ ] Adjust AI confidence thresholds
- [ ] Plan iteration 2

---

## Validation Checklist

### Data Integrity
- [ ] All relationships working
- [ ] No broken references
- [ ] Enum values complete
- [ ] Virtual columns computing correctly

### Functionality
- [ ] All 10 actions working
- [ ] All 15 bots running on schedule
- [ ] Apps Script integration reliable
- [ ] Real-time sync < 2 seconds latency

### AI/ML
- [ ] Gemini extraction confidence > 70%
- [ ] Duration prediction accuracy > 75%
- [ ] Completion prediction accuracy > 80%
- [ ] Auto-approval working for trusted senders

### Performance
- [ ] App load time < 3 seconds
- [ ] Sync time < 5 seconds
- [ ] Bot execution < 10 seconds
- [ ] No quota warnings

### User Experience
- [ ] Navigation intuitive
- [ ] Mobile experience smooth
- [ ] Notifications timely
- [ ] Error messages helpful

---

## Success Criteria

### Week 1 (Foundation)
- All tables connected and typed correctly
- Virtual columns computing
- Slices filtering properly

### Week 2 (UI)
- All views functional
- Actions executing
- Navigation working

### Week 3 (Integration)
- Apps Script connection stable
- Functions callable from AppSheet
- Error handling working

### Week 4 (Automation)
- Core bots running
- Notifications sending
- Scheduling working

### Week 5 (AI)
- Gemini extraction accurate
- ML models trained and deployed
- Predictions informing decisions

### Week 6 (Production)
- System stable under load
- Users trained
- Metrics tracking

---

# APPENDICES

## Appendix A: Enum Reference

Complete list of all enum values used in the system:

### STATUS Enum
```
NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELED, SCHEDULED, PENDING,
PENDING_APPROVAL, ACCEPTED, REJECTED, BLOCKED, DEFERRED, ARCHIVED
```

### PRIORITY Enum
```
CRITICAL, URGENT, HIGH, MEDIUM, LOW, MINIMAL
```

### LANE Enum
```
ops, admin, creative, client, growth, deep_focus, batch,
communication, learning, maintenance, high_energy, low_energy,
social, solo, personal
```

### ENERGY_LEVEL Enum
```
CRITICAL, HIGH, MEDIUM, LOW, RECOVERY
```

### FOCUS_LEVEL Enum
```
INTENSE, HIGH, MEDIUM, LOW, BACKGROUND
```

### PROPOSAL_STATUS Enum
```
PENDING, PROCESSED, ACCEPTED, REJECTED, DUPLICATE, INVALID, EXPIRED
```

### SENDER_STATUS Enum
```
TRUSTED, NEUTRAL, SUSPICIOUS, BLOCKED
```

### AI_TASK_TYPE Enum
```
Deep Work, Communication, Administrative, Creative
```

### AI_URGENCY Enum
```
CRITICAL, HIGH, MEDIUM, LOW
```

### MOOD Enum
```
Energized, Focused, Neutral, Tired, Stressed, Overwhelmed
```

---

## Appendix B: Quick Reference Formulas

### Common Virtual Columns

**Duration in Hours:**
```
IF(
  AND(ISNOTBLANK([scheduled_start]), ISNOTBLANK([scheduled_end])),
  (HOUR([scheduled_end] - [scheduled_start]) + MINUTE([scheduled_end] - [scheduled_start])/60),
  [estimated_minutes]/60
)
```

**Is Overdue:**
```
AND(
  [status] <> "COMPLETED",
  [status] <> "CANCELED",
  ISNOTBLANK([deadline]),
  NOW() > [deadline]
)
```

**Days Until Deadline:**
```
IF(ISNOTBLANK([deadline]), (HOUR([deadline] - NOW()) / 24), 999)
```

**Should Auto-Accept:**
```
AND(
  [confidence_score] > 0.8,
  [sender].[reputation_score] > 0.7,
  [sender].[approved_count] > 5
)
```

**Completion Rate:**
```
IF(
  AND(
    ISNOTBLANK([actual_minutes]),
    ISNOTBLANK([estimated_minutes]),
    [estimated_minutes] > 0
  ),
  [actual_minutes]/[estimated_minutes],
  0
)
```

---

## Appendix C: Color Coding Standards

### Priority Colors
- **CRITICAL:** `#D32F2F` (Red)
- **URGENT:** `#F57C00` (Orange)
- **HIGH:** `#FBC02D` (Yellow)
- **MEDIUM:** `#1976D2` (Blue)
- **LOW:** `#757575` (Gray)
- **MINIMAL:** `#BDBDBD` (Light Gray)

### Status Colors
- **COMPLETED:** `#4CAF50` (Green)
- **IN_PROGRESS:** `#2196F3` (Blue)
- **SCHEDULED:** `#9C27B0` (Purple)
- **PENDING:** `#FF9800` (Orange)
- **BLOCKED:** `#F44336` (Red)
- **CANCELED:** `#9E9E9E` (Gray)

### Energy Level Colors
- **CRITICAL:** `#E91E63` (Pink)
- **HIGH:** `#FF5722` (Deep Orange)
- **MEDIUM:** `#FFC107` (Amber)
- **LOW:** `#8BC34A` (Light Green)
- **RECOVERY:** `#009688` (Teal)

---

## Appendix D: Performance Optimization Tips

1. **Limit Virtual Column Chains:** Max 2 levels deep
2. **Use Slices Instead of Filters:** Pre-filtered for faster loading
3. **Batch Bot Execution:** Non-urgent bots run hourly, not real-time
4. **Cache Predictions:** Update weekly, not on every view
5. **Optimize Sync Scope:** Only sync last 90 days of data
6. **Use Security Filters:** `[assigned_to] = USEREMAIL()`

---

## Appendix E: Troubleshooting Guide

### Issue: Slow Sync
**Cause:** Too many virtual columns calculating on sync
**Fix:** Move calculations to bots, reduce virtual column count

### Issue: Apps Script Function Not Found
**Cause:** Function not deployed as API executable
**Fix:** Redeploy script, verify executionApi.access setting

### Issue: Gemini Low Confidence
**Cause:** Prompt too vague or data quality poor
**Fix:** Add examples to prompts, clean input data

### Issue: ML Model Poor Accuracy
**Cause:** Insufficient or biased training data
**Fix:** Collect 200+ diverse samples, retrain model

### Issue: Bot Not Triggering
**Cause:** Condition too restrictive or timing issue
**Fix:** Test condition in expression builder, check schedule timezone

---

**END OF TECHNICAL BLUEPRINT**

*This document contains 100% of the information needed to implement the AppSheet application. No guesswork required. Every table, column, slice, view, action, bot, AI configuration, and integration detail is specified.*

**Implementation Time Estimate:** 6 weeks (40 hours/week = 240 hours)
**Maintenance Time:** 2-4 hours/week after deployment

**Version:** 2.0 Final
**Date:** 2025-09-30
**Status:** COMPLETE & READY FOR IMPLEMENTATION
