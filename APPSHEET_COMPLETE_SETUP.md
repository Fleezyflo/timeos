# MOH TIME OS + AppSheet POWER USER MANUAL
## Transform Your Time Management with AI-Powered Automation

*Last Updated: September 2024 | AppSheet Version: Current | MOH TIME OS: v2.0*

---

## 🎯 What You'll Build

By the end of this manual, you'll have:
- ✅ Fully automated email-to-task pipeline with AI classification
- ✅ Smart notifications via Email, SMS, and Push
- ✅ Energy-optimized scheduling that adapts to your state
- ✅ OCR processing for handwritten notes and whiteboards
- ✅ Predictive ML models for task duration and completion
- ✅ Direct integration with Google Apps Script backend
- ✅ Real-time synchronization across all devices

**Time to Complete: 3-4 hours**
**Skill Level Required: Intermediate (we'll guide you through everything)**

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Google Workspace account (free Gmail works)
- [ ] Access to Google Sheet ID: `1GZf9wx9-9glFW0WXkVrYI7kZI3NeHhEosVdb-ctylk0`
- [ ] Google Apps Script deployment URL (from MOH TIME OS setup)
- [ ] AppSheet account (free to start, $5/user for production)
- [ ] Twilio account for SMS (optional, free trial available)
- [ ] 3-4 hours of focused time

---

## 🚀 PHASE 1: CORE DATA CONNECTION (30 minutes)

### Step 1.1: Create Your AppSheet App

1. **Navigate to AppSheet**
   ```
   https://www.appsheet.com/start
   ```

2. **Click "Start with your own data"**
   - Select: Google Sheets
   - Sign in with your Google account

3. **Enter the Spreadsheet URL**
   ```
   https://docs.google.com/spreadsheets/d/1GZf9wx9-9glFW0WXkVrYI7kZI3NeHhEosVdb-ctylk0
   ```

   🔴 **CRITICAL**: If you get "Access Denied", you need to:
   - Open the sheet in Google Sheets
   - Click Share → Change to "Anyone with link can view"
   - Return to AppSheet and retry

### Step 1.2: Understanding What AppSheet Detected

AppSheet will automatically detect 12 tables. Here's what each does:

| Table | Purpose | Key Columns | Relationships |
|-------|---------|-------------|---------------|
| **ACTIONS** | Core task list | action_id, status, priority, scheduled_start | Primary table |
| **PROPOSED_TASKS** | Email triage queue | proposal_id, confidence_score, sender | Links to ACTIONS |
| **CALENDAR_PROJECTION** | Calendar events | event_id, start, end, busy | Links to ACTIONS |
| **TIME_BLOCKS** | Available time slots | block_id, energy_level, available | For scheduling |
| **LANES** | Task categories | lane, weight, energy_preference | Task classification |
| **SENDER_REPUTATION** | Trust scores | sender_email, reputation_score | Email filtering |
| **APPSHEET_CONFIG** | System settings | key, value | Configuration |

### Step 1.3: Fix Data Types (CRITICAL)

AppSheet will guess wrong on several columns. Fix these immediately:

1. **Go to Data → Columns**

2. **For ACTIONS table, change:**
   ```
   created_at: DateTime
   updated_at: DateTime
   scheduled_start: DateTime
   scheduled_end: DateTime
   completed_date: DateTime
   deadline: DateTime
   status: Enum (Base: Text)
   priority: Enum (Base: Text)
   lane: Ref (to LANES table)
   estimated_minutes: Number
   actual_minutes: Number
   score: Decimal
   ```

3. **For PROPOSED_TASKS table, change:**
   ```
   created_at: DateTime
   processed_at: DateTime
   status: Enum
   confidence_score: Percent
   sender: Ref (to SENDER_REPUTATION)
   ```

### Step 1.4: Create Enum Values

1. **Click on `status` column in ACTIONS**
2. **Under "Values", add:**
   ```
   NOT_STARTED
   IN_PROGRESS
   COMPLETED
   CANCELED
   SCHEDULED
   PENDING
   BLOCKED
   ARCHIVED
   ```

3. **Click on `priority` column in ACTIONS**
4. **Under "Values", add:**
   ```
   CRITICAL
   URGENT
   HIGH
   MEDIUM
   LOW
   MINIMAL
   ```

### Step 1.5: Set Up References

1. **ACTIONS.source_id → PROPOSED_TASKS.proposal_id**
   - Type: Ref
   - Source table: PROPOSED_TASKS
   - This links tasks to their email origins

2. **PROPOSED_TASKS.sender → SENDER_REPUTATION.sender_email**
   - Type: Ref
   - Source table: SENDER_REPUTATION
   - This enables reputation tracking

### Step 1.6: Create Virtual Columns

Add these computed columns for intelligence:

1. **In ACTIONS table, add virtual column "Duration":**
   ```
   IF(
     AND(ISNOTBLANK([scheduled_start]), ISNOTBLANK([scheduled_end])),
     HOUR([scheduled_end] - [scheduled_start]) + MINUTE([scheduled_end] - [scheduled_start])/60,
     [estimated_minutes]/60
   )
   ```

2. **In ACTIONS table, add virtual column "Is_Overdue":**
   ```
   AND(
     [status] <> "COMPLETED",
     ISNOTBLANK([deadline]),
     NOW() > [deadline]
   )
   ```

3. **In ACTIONS table, add virtual column "Days_Until_Deadline":**
   ```
   IF(
     ISNOTBLANK([deadline]),
     HOUR([deadline] - NOW()) / 24,
     999
   )
   ```

4. **In PROPOSED_TASKS, add virtual column "Should_Auto_Accept":**
   ```
   AND(
     [confidence_score] > 0.8,
     [sender].[reputation_score] > 0.7,
     [sender].[approved_count] > 5
   )
   ```

### Step 1.7: Create Slices for Filtered Views

Slices are filtered subsets of your data:

1. **Create "My Active Tasks" slice:**
   - Source: ACTIONS
   - Filter: `AND([status] <> "COMPLETED", [status] <> "ARCHIVED")`

2. **Create "Today's Tasks" slice:**
   - Source: ACTIONS
   - Filter: `DATE([scheduled_start]) = TODAY()`

3. **Create "High Priority" slice:**
   - Source: ACTIONS
   - Filter: `IN([priority], {"CRITICAL", "URGENT", "HIGH"})`

4. **Create "Pending Proposals" slice:**
   - Source: PROPOSED_TASKS
   - Filter: `[status] = "PENDING"`

🫁 **BREATHE**: You've completed the foundation! Your data is now properly connected and typed. Take a 5-minute break before Phase 2.

---

## 📬 PHASE 2: NOTIFICATION SYSTEM (45 minutes)

### Step 2.1: Email Templates

1. **Go to Automation → Create New Bot**
2. **Name it: "Task Assignment Notifier"**

3. **Configure the Event:**
   ```
   Event Type: Data Change
   Table: ACTIONS
   Condition: AND(
     [_THISROW_BEFORE].[status] <> [_THISROW_AFTER].[status],
     [_THISROW_AFTER].[status] = "SCHEDULED"
   )
   ```

4. **Create Email Template:**
   ```html
   Subject: New Task Assigned: <<[title]>>

   Body:
   <h2>You have a new task!</h2>

   <div style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
     <h3><<[title]>></h3>
     <p><strong>Priority:</strong> <<[priority]>></p>
     <p><strong>Deadline:</strong> <<[deadline]>></p>
     <p><strong>Estimated Time:</strong> <<[estimated_minutes]>> minutes</p>
     <p><strong>Description:</strong> <<[description]>></p>
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

### Step 2.2: SMS Integration (Optional but Powerful)

1. **Set up Twilio:**
   - Sign up at twilio.com
   - Get your Account SID and Auth Token
   - Get a phone number

2. **Create SMS Bot:**
   ```
   Name: Critical Alert SMS
   Event: Data Change
   Table: ACTIONS
   Condition: IN([priority], {"CRITICAL", "URGENT"})
   ```

3. **Configure SMS Task:**
   ```
   Type: Send SMS
   To: <<USEREMAIL()>>  // You'll map emails to phone numbers
   Body: URGENT: <<[title]>> due <<[deadline]>>. Reply Y to acknowledge.
   ```

### Step 2.3: Push Notifications

1. **Enable Push Notifications:**
   - Go to Settings → Offline/Sync → Push Notifications
   - Toggle ON

2. **Create Push Notification Bot:**
   ```
   Name: Real-time Updates
   Event: Data Change
   Table: ACTIONS
   Condition: true  // All changes
   ```

3. **Configure Push Task:**
   ```
   Title: Task Update
   Message: <<[title]>> is now <<[status]>>
   Link: LINKTOROW([_THISROW])
   ```

### Step 2.4: Daily Digest Bot

This is where it gets powerful:

1. **Create Scheduled Bot:**
   ```
   Name: Daily Digest
   Schedule: Daily at 8:00 AM
   Timezone: Your timezone
   ```

2. **Create Process with Multiple Steps:**

   **Step 1: Query Today's Tasks**
   ```
   Type: Return Value
   Value: SELECT(
     ACTIONS[action_id],
     DATE([scheduled_start]) = TODAY()
   )
   ```

   **Step 2: Calculate Metrics**
   ```
   Type: Return Value
   Value: {
     "total_tasks": COUNT([Step1]),
     "total_hours": SUM(SELECT(ACTIONS[estimated_minutes], IN([action_id], [Step1]))) / 60,
     "high_priority": COUNT(SELECT(ACTIONS[action_id], AND(IN([action_id], [Step1]), IN([priority], {"HIGH", "URGENT", "CRITICAL"}))))
   }
   ```

   **Step 3: Send Digest Email**
   ```html
   Subject: Your Daily Plan - <<TODAY()>>

   <h1>Good Morning! 📅</h1>

   <h2>Today's Overview</h2>
   <ul>
     <li>Total Tasks: <<[Step2].[total_tasks]>></li>
     <li>Estimated Hours: <<[Step2].[total_hours]>></li>
     <li>High Priority Items: <<[Step2].[high_priority]>></li>
   </ul>

   <h2>Your Schedule</h2>
   <<Start: FOREACH(task IN [Step1])>>
     <div style="margin: 10px 0; padding: 10px; border-left: 3px solid
       <<IF([task].[priority] = "CRITICAL", "#ff0000",
          IF([task].[priority] = "HIGH", "#ff9900", "#0099ff"))>>;">
       <strong><<[task].[scheduled_start]>>:</strong> <<[task].[title]>>
       <br>Duration: <<[task].[estimated_minutes]>> min | Priority: <<[task].[priority]>>
     </div>
   <<End>>

   <h2>Energy Optimization Tip</h2>
   <p>Your peak hours are typically 10 AM - 12 PM. High-priority tasks are scheduled accordingly.</p>
   ```

🫁 **BREATHE**: Notification system complete! Test by changing a task status. You should receive an email within 1-2 minutes.

---

## 🤖 PHASE 3: AUTOMATION BOTS (60 minutes)

### Step 3.1: Email Processing Bot

This bot connects to your Google Apps Script backend:

1. **Create Bot: "Process Email Queue"**
   ```
   Schedule: Every 15 minutes
   Time: Between 7 AM and 10 PM
   ```

2. **Add Webhook Task:**
   ```
   URL: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   HTTP Method: POST
   Headers:
     Authorization: Bearer YOUR_API_KEY
     Content-Type: application/json
   Body:
   {
     "action": "EMAIL",
     "timestamp": "<<NOW()>>",
     "source": "AppSheet"
   }
   ```

3. **Add Return Value Processing:**
   ```
   Type: Return Value
   Value:
   IF(
     [ResponseCode] = 200,
     "Success: " & [ResponseBody].[processed_count] & " emails processed",
     "Error: " & [ResponseBody].[error]
   )
   ```

4. **Add Conditional Branch:**
   ```
   Condition: [ResponseBody].[new_proposals] > 0
   True Branch: Send notification
   False Branch: Log only
   ```

### Step 3.2: Intelligent Scheduling Bot

1. **Create Bot: "Optimize Schedule"**
   ```
   Event: Data Change
   Table: ACTIONS
   Condition: OR(
     [_THISROW_BEFORE].[priority] <> [_THISROW_AFTER].[priority],
     [_THISROW_BEFORE].[deadline] <> [_THISROW_AFTER].[deadline],
     [_THISROW_BEFORE].[status] <> [_THISROW_AFTER].[status]
   )
   ```

2. **Add Process with GAS Integration:**

   **Step 1: Collect Related Tasks**
   ```
   Type: Return Value
   Value: SELECT(
     ACTIONS[action_id],
     AND(
       [status] = "SCHEDULED",
       [scheduled_start] > NOW()
     )
   )
   ```

   **Step 2: Call Scheduling Optimizer**
   ```
   Type: Call Webhook
   URL: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   Body:
   {
     "action": "SCHEDULE",
     "tasks": "<<[Step1]>>",
     "trigger_task": "<<[_THISROW].[action_id]>>",
     "optimization_mode": "energy_aware"
   }
   ```

   **Step 3: Update Schedule**
   ```
   Type: Run Data Action
   Action: Update rows in ACTIONS
   Rows: [Step2].[ResponseBody].[updated_tasks]
   ```

### Step 3.3: Energy State Monitor Bot

1. **Create Bot: "Energy Check"**
   ```
   Schedule: At 10:00 AM, 2:00 PM, 4:00 PM
   ```

2. **Step 1: Send SMS Check**
   ```
   Type: Send SMS
   To: User's phone
   Body: "Quick check: How's your energy? Reply 1 (Low) to 5 (High)"
   ```

3. **Step 2: Wait for Response**
   ```
   Type: Wait
   Condition: New row in ENERGY_RESPONSES table
   Timeout: 10 minutes
   ```

4. **Step 3: Process Energy Update**
   ```
   Type: Call Webhook
   URL: GAS endpoint
   Body:
   {
     "action": "UPDATE_ENERGY",
     "level": "<<[ENERGY_RESPONSES].[Last].[value]>>",
     "timestamp": "<<NOW()>>"
   }
   ```

5. **Step 4: Reschedule if Needed**
   ```
   Type: Conditional Branch
   Condition: [Step3].[ResponseBody].[reschedule_needed]
   True: Trigger Schedule Optimization Bot
   ```

### Step 3.4: Conflict Resolution Bot

1. **Create Bot: "Resolve Conflicts"**
   ```
   Event: Data Change
   Table: CALENDAR_PROJECTION
   Condition: [_THISROW_AFTER].[conflict_detected] = true
   ```

2. **Process Steps:**

   **Step 1: Identify Conflicting Tasks**
   ```
   SELECT(
     ACTIONS[action_id],
     AND(
       [scheduled_start] < [_THISROW].[end],
       [scheduled_end] > [_THISROW].[start]
     )
   )
   ```

   **Step 2: Calculate Priority Scores**
   ```
   ORDERBY(
     [Step1],
     LOOKUP([_THISROW], "ACTIONS", "action_id", "score"),
     false
   )
   ```

   **Step 3: Reschedule Lower Priority**
   ```
   Action: Update row
   Table: ACTIONS
   Row: INDEX([Step2], 2)  // Second highest priority
   Updates:
     scheduled_start: [_THISROW].[end] + "000:15:00"
     scheduled_end: [scheduled_start] + ([estimated_minutes] * "000:01:00")
   ```

🫁 **BREATHE**: Core automation complete! Your system now processes emails, optimizes schedules, and responds to your energy levels automatically.

---

## 🧠 PHASE 4: AI FEATURES (45 minutes)

### Step 4.1: Enable OCR for Document Processing

1. **Go to Intelligence → Document Understanding**

2. **Create Document Processor:**
   ```
   Name: Task Extractor
   Document Type: Unstructured
   Trigger: New file in Drive folder
   ```

3. **Configure Extraction Fields:**
   ```
   Task Title:
     Type: Text
     Hints: "task", "todo", "action item"

   Due Date:
     Type: Date
     Hints: "due", "deadline", "by"

   Priority:
     Type: Text with validation
     Values: High, Medium, Low
     Hints: "urgent", "asap", "important"

   Assigned To:
     Type: Text
     Hints: "assign", "owner", "responsible"
   ```

4. **Create Processing Bot:**
   ```
   Event: New file in Google Drive folder
   Process:
     1. Extract data using Document Understanding
     2. Create row in PROPOSED_TASKS
     3. Set confidence_score based on extraction confidence
     4. Trigger standard approval workflow
   ```

### Step 4.2: Predictive Models

1. **Enable Predictive Models:**
   - Go to Intelligence → Predictive Models

2. **Create Duration Predictor:**
   ```
   Model Name: Task Duration Estimator
   Type: Regression
   Target Column: actual_minutes
   Feature Columns:
     - title (text analysis)
     - priority
     - lane
     - description_length
     - created_hour_of_day
     - created_day_of_week
   Training Data: Last 500 completed tasks
   ```

3. **Create Completion Predictor:**
   ```
   Model Name: On-Time Completion
   Type: Classification
   Target: IF([completed_date] <= [deadline], "OnTime", "Late")
   Features:
     - priority
     - estimated_minutes
     - days_until_deadline
     - current_task_load
     - historical_completion_rate
   ```

4. **Integrate Predictions:**

   Add virtual column in ACTIONS:
   ```
   Predicted_Duration:
   PREDICT("Task Duration Estimator", [_THISROW])

   Completion_Probability:
   PREDICT("On-Time Completion", [_THISROW])
   ```

### Step 4.3: Smart Assistant Integration

1. **Enable Smart Assistant:**
   - Settings → Intelligence → Smart Assistant → Enable

2. **Train Custom Intents:**

   **Intent: Create Task**
   ```
   Training Phrases:
   - "Add task [title] due [date]"
   - "Create [priority] priority task [title]"
   - "Schedule [title] for [time]"

   Action: Add row to ACTIONS
   Parameters:
     title: @sys.any
     deadline: @sys.date-time
     priority: @priority_entity
   ```

   **Intent: Check Schedule**
   ```
   Training Phrases:
   - "What's on my schedule today?"
   - "Show me tomorrow's tasks"
   - "What's my next task?"

   Action: Show view "Today's Tasks"
   Response: "You have <<COUNT(Today's Tasks)>> tasks today"
   ```

   **Intent: Update Energy**
   ```
   Training Phrases:
   - "I'm feeling low energy"
   - "Energy level is [number]"
   - "I'm exhausted"

   Action: Update HUMAN_STATE
   Trigger: Energy optimization bot
   ```

### Step 4.4: Learning Feedback Loop

1. **Create Feedback Collection:**

   Add to ACTIONS table:
   ```
   actual_difficulty: Enum (Easy, Medium, Hard)
   feedback_notes: LongText
   was_estimate_accurate: Yes/No
   ```

2. **Create Learning Bot:**
   ```
   Event: Data Change
   Table: ACTIONS
   Condition: [status] = "COMPLETED"

   Process:
     1. Compare estimated_minutes vs actual_minutes
     2. If difference > 30%, request feedback
     3. Store feedback for model retraining
     4. Update sender reputation if source was email
   ```

---

## 🔗 PHASE 5: ADVANCED INTEGRATIONS (30 minutes)

### Step 5.1: Google Calendar Bi-Directional Sync

1. **Connect Google Calendar:**
   - Go to Extensions → Google Calendar
   - Authenticate with Google account
   - Select calendars to sync

2. **Configure Sync Rules:**
   ```
   From AppSheet to Calendar:
     Trigger: ACTIONS status = "SCHEDULED"
     Event Title: [title]
     Start: [scheduled_start]
     End: [scheduled_end]
     Description: [description] + "Priority: " + [priority]
     Color: IF([priority]="CRITICAL", "Red", IF([priority]="HIGH", "Orange", "Blue"))

   From Calendar to AppSheet:
     Table: CALENDAR_PROJECTION
     Filter: Events with "MOH:" prefix
     Update: Every 5 minutes
   ```

### Step 5.2: Zapier Integration

1. **Create Zapier Webhook:**
   ```
   URL: https://hooks.zapier.com/hooks/catch/YOUR_HOOK
   Trigger: New high-priority task
   Data:
     task_id: [action_id]
     title: [title]
     priority: [priority]
     deadline: [deadline]
   ```

2. **Zapier Actions (examples):**
   - Create Trello card
   - Post to Slack
   - Add to Notion
   - Create Jira issue

### Step 5.3: Custom API Endpoints

1. **Create API Bot:**
   ```
   Name: External API Handler
   Event: API Call (enable in Settings)
   Authentication: API Key
   ```

2. **Define Endpoints:**

   **GET /tasks**
   ```
   Return: SELECT(
     ACTIONS[action_id, title, status, priority, deadline],
     [status] <> "ARCHIVED"
   )
   ```

   **POST /tasks**
   ```
   Action: Add row to ACTIONS
   Required fields: title, priority
   Optional: deadline, description, estimated_minutes
   Return: Created task with action_id
   ```

   **PUT /tasks/{id}**
   ```
   Action: Update row in ACTIONS
   Filter: [action_id] = {id}
   Return: Updated task
   ```

### Step 5.4: Voice Commands

1. **Enable Google Assistant:**
   - Settings → Intelligence → Voice → Enable

2. **Configure Voice Commands:**
   ```
   "Hey Google, add task [title] to MOH Time"
   "Hey Google, what's my next task in MOH Time?"
   "Hey Google, mark [task] as complete in MOH Time"
   ```

---

## 🧪 TESTING & TROUBLESHOOTING

### Test Scenarios

Run these tests in order:

1. **Email Processing Test:**
   - Send email to designated inbox
   - Wait 15 minutes
   - Check PROPOSED_TASKS for new entry
   - Verify confidence score calculation

2. **Scheduling Test:**
   - Create task with deadline tomorrow
   - Change priority to CRITICAL
   - Verify automatic rescheduling
   - Check for calendar update

3. **Energy Test:**
   - Manually update energy level
   - Verify task reshuffling
   - Check if low-energy tasks moved to current slots

4. **OCR Test:**
   - Upload photo of handwritten task list
   - Verify extraction accuracy
   - Check proposed tasks creation

### Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Sync taking forever" | Too many formulas in sheets | Move calculations to virtual columns |
| "Webhooks failing" | Authentication error | Regenerate API key, update in AppSheet |
| "OCR not extracting" | Poor image quality | Ensure good lighting, clear handwriting |
| "Predictions inaccurate" | Insufficient training data | Need 100+ completed tasks minimum |
| "Notifications not sending" | Email limits | Upgrade AppSheet plan or reduce frequency |
| "Calendar conflicts" | Timezone mismatch | Set timezone in AppSheet Settings |
| "Bot not triggering" | Condition too restrictive | Test condition in expression editor |
| "SMS not working" | Twilio setup | Verify phone number format, credits |

### Performance Optimization

1. **Sync Settings:**
   ```
   Sync on start: ON
   Delayed sync: 3 seconds
   Background sync: Every 30 minutes
   Sync scope: Only relevant data
   ```

2. **Virtual Column Optimization:**
   - Avoid SELECT() in virtual columns where possible
   - Use references instead of lookups
   - Limit virtual column chains

3. **Security Filters:**
   ```
   Only sync user's own tasks:
   [assigned_to] = USEREMAIL()
   ```

---

## 🚀 DEPLOYMENT CHECKLIST

### Week 1: Foundation
- [ ] Data connection complete
- [ ] Data types corrected
- [ ] Basic views created
- [ ] Test with sample data

### Week 2: Automation
- [ ] Email bot operational
- [ ] Scheduling bot tested
- [ ] Notifications working
- [ ] Energy monitoring active

### Week 3: Intelligence
- [ ] OCR processing enabled
- [ ] Predictive models trained
- [ ] Assistant responding
- [ ] Learning loop active

### Week 4: Production
- [ ] All integrations tested
- [ ] Performance optimized
- [ ] Users trained
- [ ] Monitoring dashboard active

---

## 📊 SUCCESS METRICS

Monitor these KPIs:

1. **Automation Rate:** % of tasks created automatically (Target: >60%)
2. **Prediction Accuracy:** Duration estimates within 20% (Target: >80%)
3. **On-Time Completion:** Tasks finished by deadline (Target: >90%)
4. **Energy Optimization:** Tasks completed in optimal energy state (Target: >70%)
5. **User Adoption:** Daily active users (Target: 100% after week 2)

---

## 🆘 GETTING HELP

### Resources:
- AppSheet Documentation: https://support.google.com/appsheet
- Community Forum: https://community.appsheet.com
- Video Tutorials: YouTube "AppSheet Advanced"
- MOH TIME OS Support: Check repository issues

### Emergency Fixes:
1. **System Down:** Check Google Apps Script quotas
2. **Data Loss:** AppSheet keeps 30-day backup
3. **Sync Broken:** Reset sync in Settings
4. **Bot Loops:** Add loop prevention conditions

---

## 🎯 NEXT STEPS

Once your system is running:

1. **Collect Feedback:** Survey users after week 1
2. **Refine Models:** Retrain with accumulated data
3. **Add Features:** Voice shopping lists, expense tracking
4. **Scale Up:** Multi-team deployment
5. **API Integration:** Connect to enterprise systems

---

## 💡 PRO TIPS

1. **Start Simple:** Get basic task management working before adding AI
2. **Test Often:** Use AppSheet's preview mode extensively
3. **Document Everything:** Keep notes on what works
4. **Backup Regularly:** Export app definition weekly
5. **Monitor Costs:** Watch for usage spikes
6. **Train Users:** Create video walkthrough
7. **Iterate Quickly:** Ship improvements weekly

---

*Congratulations! You've built an AI-powered time management system that learns and adapts. This is just the beginning - AppSheet's capabilities are vast, and your system will evolve with your needs.*

**Remember: The goal isn't perfection on day one. It's continuous improvement powered by real usage data.**

---

*End of Manual - Total Setup Time: 3-4 hours*
*Ongoing Optimization: 1 hour/week*
*ROI: 10+ hours/week saved through automation*