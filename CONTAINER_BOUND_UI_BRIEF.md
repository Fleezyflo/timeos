# MOH TIME OS - CONTAINER-BOUND WEB UI IMPLEMENTATION BRIEF
**Version:** 3.0 - CORRECTED  
**Created:** 2025-01-03  
**Status:** AUTHORITATIVE SPECIFICATION

---

## ⚠️ CRITICAL CONSTRAINTS - VIOLATION = FAILURE ⚠️

### ABSOLUTE REQUIREMENTS
1. **NEVER** create new spreadsheets (`SpreadsheetApp.create()` is FORBIDDEN)
2. **NEVER** build standalone Node.js/React/Express applications
3. **NEVER** use REST APIs, Express servers, or external hosting
4. **NEVER** use OAuth or Google APIs directly
5. **ALWAYS** use `SpreadsheetApp.getActiveSpreadsheet()` for spreadsheet access
6. **ALWAYS** access services via `container.get(SERVICE_NAME)`
7. **ALWAYS** use exact column names from existing sheets (see Section 4)
8. **ALWAYS** implement as HTML served by Google Apps Script `doGet()`

### THIS IS A CONTAINER-BOUND SCRIPT
- The script is BOUND to an EXISTING Google Spreadsheet
- It has access to 31 pre-registered services in the container
- All data operations MUST go through existing services
- The spreadsheet already exists with populated data - DO NOT CREATE ANYTHING NEW

---

## 1. SYSTEM ARCHITECTURE - THE ONLY CORRECT WAY

```
Google Apps Script Project (Container-Bound to Existing Spreadsheet)
│
├── doGet(e) → Serves HTML Web App
│
├── DayPlanner.html (Single Page Application)
│   ├── Calls google.script.run.appsheet_* functions
│   └── Updates UI based on responses
│
├── AppSheetBridge.gs (Existing - DO NOT RECREATE)
│   ├── appsheet_getAllTasks()
│   ├── appsheet_getMyDay()
│   ├── appsheet_completeTask()
│   └── 20+ other existing functions
│
└── Container Services (31 Registered - ACCESS VIA container.get())
    ├── BatchOperations → Reads spreadsheet data
    ├── IntelligentScheduler → Schedules tasks
    ├── HumanStateManager → Tracks energy
    └── All other services...
```

### DATA FLOW - MEMORIZE THIS
```
User Browser → DayPlanner.html → google.script.run → AppSheetBridge.gs → container.get(SERVICE) → Existing Spreadsheet
                     ↑                                                                                        ↓
                     └──────────────────────── Returns data via callbacks ←─────────────────────────────────┘
```

---

## 2. EXACT FILE TO CREATE

### File: `/moh-time-os-v2/src/5_web/DayPlanner.html`

This is the ONLY file you need to create. It must:
1. Be a single HTML file with embedded CSS and JavaScript
2. Use `google.script.run` for ALL backend communication
3. Never use `fetch()`, `axios`, or any HTTP requests
4. Include all 6 views in one file

---

## 3. EXISTING BACKEND FUNCTIONS - USE THESE EXACTLY

These functions already exist in `AppSheetBridge.gs`. Call them via `google.script.run`:

```javascript
// Get dashboard data
google.script.run
  .withSuccessHandler(function(data) { /* handle success */ })
  .withFailureHandler(function(error) { /* handle error */ })
  .appsheet_getMyDay({ view: 'today' });

// Get all tasks
google.script.run
  .withSuccessHandler(handleTasks)
  .appsheet_getAllTasks({ 
    filters: { status: 'SCHEDULED', priority: 'HIGH' },
    limit: 50 
  });

// Complete a task
google.script.run
  .withSuccessHandler(handleComplete)
  .appsheet_completeTask({ 
    taskId: 'ACT_12345', 
    actualMinutes: 30 
  });

// Start a task
google.script.run
  .withSuccessHandler(handleStart)
  .appsheet_startTask({ taskId: 'ACT_12345' });

// Create new task
google.script.run
  .withSuccessHandler(handleCreated)
  .appsheet_createTask({
    title: 'New Task',
    priority: 'MEDIUM',
    lane: 'ops',
    estimated_minutes: 30
  });

// Get proposals
google.script.run
  .withSuccessHandler(handleProposals)
  .appsheet_getProposals();

// Process proposal
google.script.run
  .withSuccessHandler(handleProcessed)
  .appsheet_processProposal({
    proposalId: 'PROP_123',
    action: 'approve',
    taskData: { priority: 'HIGH' }
  });

// Log energy state
google.script.run
  .withSuccessHandler(handleLogged)
  .appsheet_logEnergyState({
    energy_level: 7,
    focus_level: 8,
    stress_level: 3,
    mood: 'FOCUSED'
  });
```

---

## 4. EXACT COLUMN NAMES - USE THESE EXACTLY

### ACTIONS Sheet Columns (Your existing spreadsheet)
```javascript
const TASK_COLUMNS = {
  'action_id': 0,        // NOT 'id'
  'status': 1,           // SCHEDULED, IN_PROGRESS, COMPLETED, etc.
  'priority': 2,         // CRITICAL, URGENT, HIGH, MEDIUM, LOW
  'created_at': 3,       // ISO timestamp
  'updated_at': 4,       // ISO timestamp
  'title': 5,            // Task title
  'context': 6,          // Additional context
  'lane': 7,             // ops, admin, creative, client, etc.
  'estimated_minutes': 8, // NOT 'durationMinutes'
  'description': 9,      // Task description
  'source': 10,          // webapp, email, manual
  'energy_required': 11, // NOT 'energyRequired'
  'focus_required': 12,  // HIGH, MEDIUM, LOW
  'deadline': 13,        // ISO timestamp
  'scheduled_start': 14, // NOT 'scheduledStart'
  'scheduled_end': 15,   // NOT 'scheduledEnd'
  'completed_date': 16,  // NOT 'completedAt'
  'actual_minutes': 17,  // Actual time taken
  'estimation_accuracy': 18, // Ratio of actual/estimated
  'created_by': 19,      // NOT 'sourceEmail'
  'assigned_to': 20,     // User assignment
  'rollover_count': 21,  // Times task was deferred
  'parent_id': 22,       // Parent task reference
  'dependencies': 23,    // JSON array of task IDs
  'tags': 24            // JSON array of tags
};
```

### PROPOSED_TASKS Sheet Columns
```javascript
const PROPOSAL_COLUMNS = {
  'proposal_id': 0,
  'sender_email': 1,
  'subject': 2,
  'body': 3,
  'extracted_title': 4,
  'suggested_priority': 5,
  'suggested_lane': 6,
  'suggested_duration': 7,
  'confidence_score': 8,
  'status': 9,           // PENDING, APPROVED, REJECTED
  'processed_at': 10,
  'created_task_id': 11
};
```

### HUMAN_STATE Sheet Columns  
```javascript
const ENERGY_COLUMNS = {
  'state_id': 0,
  'timestamp': 1,
  'energy_level': 2,     // 1-10
  'focus_level': 3,      // 1-10
  'mood': 4,             // FOCUSED, NEUTRAL, TIRED, etc.
  'stress_level': 5,     // 1-10
  'current_context': 6,  // Current work context
  'notes': 7            // Optional notes
};
```

---

## 5. HTML STRUCTURE REQUIREMENTS

```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MOH TIME OS</title>
  
  <!-- Bulma CSS for styling -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
  
  <!-- Font Awesome for icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <style>
    /* Custom styles here */
  </style>
</head>
<body>
  <div id="app">
    <!-- Navigation -->
    <nav id="bottom-nav">
      <button data-view="dashboard">Dashboard</button>
      <button data-view="tasks">Tasks</button>
      <button data-view="calendar">Calendar</button>
      <button data-view="triage">Triage</button>
      <button data-view="energy">Energy</button>
      <button data-view="settings">Settings</button>
    </nav>
    
    <!-- View Container -->
    <div id="view-container">
      <!-- Views will be shown/hidden via JavaScript -->
    </div>
  </div>
  
  <script>
    // ALL JavaScript must be here
    // NO external scripts except CDN libraries
    
    const APP = {
      currentView: 'dashboard',
      
      // Initialize on load
      init: function() {
        this.loadDashboard();
        this.setupEventListeners();
      },
      
      // Load dashboard data
      loadDashboard: function() {
        google.script.run
          .withSuccessHandler(this.renderDashboard)
          .withFailureHandler(this.handleError)
          .appsheet_getMyDay({ view: 'today' });
      },
      
      // NEVER use fetch() or XMLHttpRequest
      // ALWAYS use google.script.run
    };
    
    // Start app when page loads
    document.addEventListener('DOMContentLoaded', function() {
      APP.init();
    });
  </script>
</body>
</html>
```

---

## 6. PROHIBITED PATTERNS - NEVER DO THESE

### ❌ NEVER: Create a React Application
```javascript
// WRONG - DO NOT CREATE REACT APPS
import React from 'react';
import { createRoot } from 'react-dom/client';
```

### ❌ NEVER: Use REST APIs
```javascript
// WRONG - NO FETCH CALLS
fetch('/api/tasks')
  .then(res => res.json())
  .then(data => console.log(data));
```

### ❌ NEVER: Create Express Servers
```javascript
// WRONG - NO SERVERS
const express = require('express');
const app = express();
app.listen(3000);
```

### ❌ NEVER: Create New Spreadsheets
```javascript
// WRONG - NEVER CREATE SPREADSHEETS
const newSheet = SpreadsheetApp.create('New Sheet');
```

### ❌ NEVER: Use Direct Google APIs
```javascript
// WRONG - NO DIRECT API CALLS
const sheets = google.sheets({ version: 'v4', auth });
```

### ❌ NEVER: Use Wrong Column Names
```javascript
// WRONG - USE EXACT COLUMN NAMES
task.id // WRONG - use task.action_id
task.durationMinutes // WRONG - use task.estimated_minutes
task.scheduledStart // WRONG - use task.scheduled_start
```

---

## 7. CORRECT PATTERNS - ALWAYS DO THESE

### ✅ CORRECT: Use google.script.run
```javascript
// CORRECT - Use google.script.run for all backend calls
google.script.run
  .withSuccessHandler(function(result) {
    console.log('Success:', result);
  })
  .withFailureHandler(function(error) {
    console.error('Error:', error);
  })
  .appsheet_getAllTasks({ filters: { status: 'SCHEDULED' } });
```

### ✅ CORRECT: Access Existing Spreadsheet
```javascript
// In AppSheetBridge.gs (already exists, don't recreate)
const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const sheet = spreadsheet.getSheetByName('ACTIONS');
```

### ✅ CORRECT: Use Container Services
```javascript
// In backend functions (already exist)
const batchOps = container.get(SERVICES.BatchOperations);
const scheduler = container.get(SERVICES.IntelligentScheduler);
```

---

## 8. VIEWS TO IMPLEMENT

### 8.1 Dashboard View
- Display current energy state (if logged)
- Show today's task count
- List high-priority tasks
- Display completion probability
- Show scheduled tasks for today

### 8.2 Task List View  
- Display all tasks with filters
- Allow status filtering (SCHEDULED, IN_PROGRESS, etc.)
- Task actions: Start, Complete, Snooze, Cancel
- Create new task form
- Search functionality

### 8.3 Calendar View
- Show week or month view
- Display scheduled tasks
- Allow drag-and-drop rescheduling
- Color-code by priority or lane

### 8.4 Triage Queue View
- Display email proposals
- Swipe or button actions: Approve/Reject
- Show confidence scores
- Edit before approving

### 8.5 Energy Log View
- Energy input form (sliders for levels 1-10)
- Mood selector
- Historical chart
- Notes field

### 8.6 Settings View
- Auto-refresh toggle
- Polling frequency
- Work hours configuration
- Notification preferences

---

## 9. AUTHENTICATION & AUTHORIZATION

The web app uses token-based authentication that's ALREADY IMPLEMENTED:

```javascript
// Backend already handles this
function doGet(e) {
  const token = e.parameter.auth;
  if (!validateToken(token)) {
    return HtmlService.createHtmlOutput('Unauthorized');
  }
  return HtmlService.createHtmlOutputFromFile('5_web/DayPlanner')
    .setTitle('MOH TIME OS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

Access URL will be: `[APPS_SCRIPT_URL]?auth=[TOKEN]`

---

## 10. DEPLOYMENT CHECKLIST

### Pre-Implementation Verification
- [ ] Confirm you're modifying an existing Google Apps Script project
- [ ] Verify the script is bound to an existing spreadsheet
- [ ] Check that AppSheetBridge.gs already exists with all functions
- [ ] Confirm container services are registered

### Implementation Requirements
- [ ] Create ONLY `DayPlanner.html` file
- [ ] Use ONLY `google.script.run` for backend calls
- [ ] Use EXACT column names from Section 4
- [ ] Include all 6 views in single HTML file
- [ ] Add NO external dependencies except CDN links

### Post-Implementation Testing
- [ ] Verify NO new spreadsheets were created
- [ ] Confirm data loads from existing spreadsheet
- [ ] Test all CRUD operations work
- [ ] Verify services are accessed correctly
- [ ] Check authentication works with token

---

## 11. SAMPLE IMPLEMENTATION SNIPPETS

### Loading Tasks with Correct Column Names
```javascript
function loadTasks() {
  google.script.run
    .withSuccessHandler(function(result) {
      const tasksHtml = result.tasks.map(task => `
        <div class="task-card">
          <h3>${task.title}</h3>
          <p>Priority: ${task.priority}</p>
          <p>Lane: ${task.lane}</p>
          <p>Duration: ${task.estimated_minutes} minutes</p>
          <p>Status: ${task.status}</p>
          <button onclick="startTask('${task.action_id}')">Start</button>
          <button onclick="completeTask('${task.action_id}')">Complete</button>
        </div>
      `).join('');
      document.getElementById('tasks-container').innerHTML = tasksHtml;
    })
    .withFailureHandler(function(error) {
      console.error('Failed to load tasks:', error);
    })
    .appsheet_getAllTasks({ filters: { status: 'SCHEDULED' } });
}
```

### Completing a Task
```javascript
function completeTask(taskId) {
  const actualMinutes = prompt('How many minutes did this take?');
  if (actualMinutes) {
    google.script.run
      .withSuccessHandler(function(result) {
        alert('Task completed successfully!');
        loadTasks(); // Reload the list
      })
      .withFailureHandler(function(error) {
        alert('Failed to complete task: ' + error.message);
      })
      .appsheet_completeTask({
        taskId: taskId,
        actualMinutes: parseInt(actualMinutes)
      });
  }
}
```

### Logging Energy State
```javascript
function logEnergy() {
  const energyData = {
    energy_level: document.getElementById('energy-slider').value,
    focus_level: document.getElementById('focus-slider').value,
    stress_level: document.getElementById('stress-slider').value,
    mood: document.querySelector('input[name="mood"]:checked').value,
    notes: document.getElementById('energy-notes').value
  };
  
  google.script.run
    .withSuccessHandler(function(result) {
      alert('Energy state logged!');
      document.getElementById('energy-form').reset();
    })
    .withFailureHandler(function(error) {
      alert('Failed to log energy: ' + error.message);
    })
    .appsheet_logEnergyState(energyData);
}
```

---

## 12. FINAL WARNINGS

### THIS IS NOT A STANDALONE APPLICATION
- It runs INSIDE Google Apps Script
- It uses an EXISTING spreadsheet
- It accesses EXISTING services
- It calls EXISTING backend functions

### DO NOT CREATE
- ❌ Node.js servers
- ❌ React applications  
- ❌ REST APIs
- ❌ New spreadsheets
- ❌ Package.json files
- ❌ External databases

### YOU MUST USE
- ✅ google.script.run
- ✅ Existing AppSheetBridge functions
- ✅ Exact column names from this document
- ✅ Container services via backend
- ✅ Single HTML file approach

---

## SUCCESS CRITERIA

Your implementation is CORRECT if:
1. Only one file created: `DayPlanner.html`
2. No new spreadsheets created
3. All data comes from existing spreadsheet
4. All backend calls use `google.script.run`
5. Column names match exactly
6. Works immediately when deployed via Apps Script

Your implementation is WRONG if:
1. You created a React app
2. You created a server
3. You used fetch() or REST APIs
4. You created a new spreadsheet
5. You used wrong column names
6. It requires npm install or external hosting

---

END OF BRIEF - FOLLOW EXACTLY OR FAIL