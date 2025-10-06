# MOH TIME OS v2.0 - WEB APP COMPLETE SPECIFICATION

**Created:** 2025-10-01
**Status:** RESEARCH COMPLETE - READY FOR ARCHITECTURE DECISIONS
**Purpose:** Zero-assumption specification for building web interface matching AppSheet functionality

---

## EXECUTIVE SUMMARY

This document contains **complete research** for building a mobile-first web application to replace AppSheet integration. All technical constraints, library options, and implementation patterns have been verified against Google Apps Script capabilities and the existing MOH TIME OS v2.0 codebase.

**Key Constraints Identified:**
- ❌ No WebSocket support in Apps Script → Must use polling
- ✅ Mobile-first required
- ✅ Real-time updates required (via polling)
- ⚠️ Multi-page vs SPA decision needed
- ✅ All backend functions already exist (appsheet_* functions)

---

# SECTION 1: TECHNICAL RESEARCH FINDINGS

## 1.1 Real-Time Updates in Apps Script

### Constraint
Google Apps Script **does not support WebSockets** or Server-Sent Events (SSE).

### Solution: Polling
**Implementation Pattern:**
```javascript
// Client-side JavaScript
let pollInterval;
const POLL_FREQUENCY = 5000; // 5 seconds

function startPolling() {
  pollInterval = setInterval(function() {
    google.script.run
      .withSuccessHandler(updateUI)
      .withFailureHandler(handleError)
      .appsheet_getMyDay({ view: 'today' });
  }, POLL_FREQUENCY);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
}
```

### Trade-offs
- ✅ Simple to implement
- ✅ Works within Apps Script constraints
- ❌ 5-second lag maximum
- ❌ Increased API calls (12 per minute per user)
- ⚠️ Must handle tab visibility (stop polling when tab hidden)

### References
- Stack Overflow: "build real time dashboard using google apps script"
- script.gs: "Build a real-time dashboard (web app) using google.script.run API"

---

## 1.2 Mobile-First CSS Frameworks

### Requirements
- ✅ No build step (CDN only)
- ✅ Mobile-first responsive design
- ✅ Lightweight (< 50KB)
- ✅ No JavaScript dependencies (or minimal)

### Evaluated Options

| Framework | Size | JS Required | Mobile-First | CDN | Verdict |
|-----------|------|-------------|--------------|-----|---------|
| **Milligram** | 2KB gzipped | ❌ None | ✅ Yes | ✅ Yes | **BEST** - Ultra lightweight |
| **Bulma** | ~25KB | ❌ None | ✅ Yes | ✅ Yes | **EXCELLENT** - Feature-rich, no JS |
| **Beer CSS** | ~20KB | ❌ None | ✅ Yes | ✅ Yes | **GOOD** - Material Design |
| **Cirrus UI** | Single file | ❌ None | ✅ Yes | ✅ Yes | **GOOD** - Modern utilities |
| **Pure CSS** | 3.5KB | ❌ None | ✅ Yes | ✅ Yes | **GOOD** - Minimalist |
| **Skeleton** | 400 lines | ❌ None | ✅ Yes | ✅ Yes | **GOOD** - Ultra minimal |

### Recommendation
**Primary: Bulma** - Best balance of features, documentation, and zero JS dependency
**Alternative: Milligram** - If extreme lightness needed

### CDN Links
```html
<!-- Bulma -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">

<!-- Milligram -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/milligram@1.4.1/dist/milligram.min.css">
```

---

## 1.3 Calendar Component

### Requirements
- ✅ Drag-and-drop event rescheduling
- ✅ Mobile touch support
- ✅ CDN availability
- ✅ Day/Week/Month views
- ✅ Works with vanilla JS

### Evaluated Options

| Library | Size | Mobile | Drag/Drop | CDN | License | Verdict |
|---------|------|--------|-----------|-----|---------|---------|
| **FullCalendar** | ~100KB | ✅ | ✅ | ✅ | MIT/Commercial | **MATURE** - Industry standard |
| **Event Calendar** | ~50KB | ✅ | ✅ | ✅ | MIT | **LIGHTWEIGHT** - Modern |
| **CalenStyle** | ~40KB | ✅ | ✅ | ✅ | MIT | **MOBILE-OPTIMIZED** |

### Recommendation
**Event Calendar (@event-calendar/build)** - Modern, lightweight, excellent mobile support

### CDN Links
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@event-calendar/build@4.6.0/event-calendar.min.css">
<script src="https://cdn.jsdelivr.net/npm/@event-calendar/build@4.6.0/event-calendar.min.js"></script>
```

### Implementation Pattern
```javascript
const ec = new EventCalendar(document.getElementById('calendar'), {
  view: 'dayGridWeek',
  events: [],
  editable: true,
  eventDrop: function(info) {
    // Call backend to update task
    google.script.run
      .withSuccessHandler(onRescheduleSuccess)
      .appsheet_rescheduleTask({
        taskId: info.event.id,
        newStart: info.event.start.toISOString(),
        newEnd: info.event.end.toISOString()
      });
  }
});
```

---

## 1.4 Chart Library (Energy Log)

### Requirements
- ✅ Line charts for energy/focus/stress trends
- ✅ Mobile responsive
- ✅ CDN availability
- ✅ Lightweight

### Evaluated Options

| Library | Size | Mobile | Types | CDN | Ease of Use | Verdict |
|---------|------|--------|-------|-----|-------------|---------|
| **ApexCharts** | ~150KB | ✅ | All types | ✅ | Excellent | **FEATURE-RICH** |
| **Chart.js** | ~60KB | ✅ | 8 types | ✅ | Good | **LIGHTWEIGHT** |

### Recommendation
**Chart.js** - Lighter, sufficient for line charts, excellent documentation

### CDN Link
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

### Implementation Pattern
```javascript
const ctx = document.getElementById('energyChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: dates, // Last 7 days
    datasets: [
      {
        label: 'Energy',
        data: energyLevels,
        borderColor: '#48bb78',
        tension: 0.4
      },
      {
        label: 'Focus',
        data: focusLevels,
        borderColor: '#4299e1',
        tension: 0.4
      },
      {
        label: 'Stress',
        data: stressLevels,
        borderColor: '#f56565',
        tension: 0.4
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});
```

---

## 1.5 Swipe Gesture Library (Triage Queue)

### Requirements
- ✅ Swipe left/right detection
- ✅ Mobile touch events
- ✅ Vanilla JS compatible
- ✅ CDN or lightweight

### Evaluated Options

| Library | Size | Active | CDN | Features | Verdict |
|---------|------|--------|-----|----------|---------|
| **Swiper.js** | ~80KB | ✅ 2025 | ✅ | Full slider | **BEST** - Most popular |
| **Hammer.js** | ~24KB | ❌ Unmaintained | ✅ | Gestures | SKIP - Dead project |
| **ZingTouch** | ~15KB | ✅ | ✅ | Gestures | **GOOD** - Active |
| **Vanilla JS** | 0KB | ✅ | N/A | Custom | **LIGHTWEIGHT** |

### Recommendation
**Swiper.js** for full card stack experience, OR **Vanilla JS** for lightweight implementation

### Swiper.js CDN
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```

### Vanilla JS Pattern
```javascript
let startX, startY;

element.addEventListener('touchstart', function(e) {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

element.addEventListener('touchend', function(e) {
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  const diffX = endX - startX;
  const diffY = endY - startY;

  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
    if (diffX > 0) {
      onSwipeRight(); // Approve
    } else {
      onSwipeLeft(); // Reject
    }
  }
});
```

---

## 1.6 SPA vs Multi-Page Architecture

### Apps Script Capabilities

#### Option A: Single-Page Application (SPA)
**Method:** Use `google.script.history` API to manage URL state

```javascript
// Push state on navigation
google.script.history.push({ page: 'calendar' }, 'Calendar', '?page=calendar');

// Listen for history changes
google.script.history.setChangeHandler(function(e) {
  showPage(e.state.page);
});
```

**Pros:**
- ✅ Faster navigation (no page reload)
- ✅ Better for real-time polling
- ✅ Smoother animations/transitions

**Cons:**
- ❌ **Known bug:** Blank screen on refresh with back/forward buttons
- ❌ More complex state management
- ❌ All code loads upfront

#### Option B: Multi-Page Application (MPA)
**Method:** Multiple HTML files served via `doGet(e.parameter.page)`

```javascript
function doGet(e) {
  const page = e.parameter.page || 'dashboard';
  return HtmlService.createHtmlOutputFromFile('pages/' + page);
}
```

**Pros:**
- ✅ Simple implementation
- ✅ Each page isolated
- ✅ No history API bugs

**Cons:**
- ❌ Full page reload on navigation
- ❌ Polling restarts on each page
- ❌ State lost between pages

#### Option C: Hybrid (SPA with Component Loading)
**Method:** Single HTML file, load page content via `google.script.run`

```javascript
function loadPage(pageName) {
  google.script.run
    .withSuccessHandler(function(html) {
      document.getElementById('content').innerHTML = html;
    })
    .getPageHTML(pageName);
}

// Server-side
function getPageHTML(pageName) {
  return HtmlService.createTemplateFromFile('pages/' + pageName)
    .evaluate()
    .getContent();
}
```

**Pros:**
- ✅ Faster than full page reload
- ✅ Avoid history API bugs
- ✅ On-demand loading

**Cons:**
- ⚠️ More complex than pure SPA/MPA
- ⚠️ Need to manage component lifecycle

### Recommendation
**HYBRID APPROACH** - Single HTML shell, load page components via google.script.run

---

# SECTION 2: APPSHEET FUNCTIONALITY MAPPING

## 2.1 Six Views to Implement

### VIEW 1: Dashboard
**AppSheet Design:**
- Today's Overview Card (task count)
- Task List (today's tasks sorted by scheduled_start)
- Energy Status Gauge (latest HUMAN_STATE.energy_level)
- Completion Probability Gauge (avg of today's tasks)
- High Priority Tasks (limit 3)
- Pending Proposals Counter (links to Triage Queue)

**Web Implementation:**
```
COMPONENTS:
├─ Header Card: "Today's Schedule" + task count
├─ Task Card List: today's tasks (scrollable)
├─ Energy Gauge: circular progress (1-5 scale)
├─ Completion Gauge: percentage bar
├─ Priority Alert Box: top 3 high priority tasks
└─ Notification Badge: pending proposals count (tap → nav to Triage)

DATA SOURCES:
- appsheet_getMyDay({ view: 'today' })
- appsheet_getSystemStatus() → human state
- Custom: appsheet_getHighPriorityTasks()
- Custom: appsheet_getPendingProposalsCount()

POLLING STRATEGY:
- Poll every 30 seconds for task updates
- Poll every 2 minutes for energy state
- Update UI incrementally (don't flash entire page)
```

---

### VIEW 2: Task List (All Tasks)
**AppSheet Design:**
- Table view with grouping by status
- Sort by priority DESC, scheduled_start ASC
- Search on title/description
- Filters: priority, status, lane, date range
- Inline actions: Schedule, Start, Complete, Edit

**Web Implementation:**
```
COMPONENTS:
├─ Search Bar (top, sticky)
├─ Filter Pills: Status, Priority, Lane, Date Range
├─ Task Group Sections: Collapsed by status
│   └─ Task Cards: Expandable
│       ├─ Title, time, priority badge
│       ├─ Swipe actions: Complete ← | → Delete
│       └─ Tap: Expand for actions
└─ Floating Action Button: + Add Task

DATA SOURCES:
- appsheet_getAllTasks({ filters, search, sort })
  (New function needed - returns all active tasks)

IMPLEMENTATION:
- Infinite scroll or pagination (100 tasks at a time)
- Client-side filtering for instant feedback
- Debounced search (500ms)
- LocalStorage for last filter state
```

---

### VIEW 3: Calendar View
**AppSheet Design:**
- Calendar grid (Day/Week/Month views)
- Color-coded by priority
- Drag-to-reschedule enabled
- Click event → detail view

**Web Implementation:**
```
COMPONENT:
Event Calendar library integrated

DATA SOURCES:
- appsheet_getCalendarEvents({ start, end })
  (New function needed - returns tasks + calendar events)

IMPLEMENTATION:
- Week view default (mobile-friendly)
- Day view for mobile portrait
- Event drag handler:
  1. Update UI optimistically
  2. Call appsheet_rescheduleTask()
  3. Revert if failure
- Color mapping:
  CRITICAL: #D32F2F (red)
  URGENT: #F57C00 (orange)
  HIGH: #FBC02D (yellow)
  MEDIUM: #1976D2 (blue)
  LOW: #757575 (gray)
```

---

### VIEW 4: Triage Queue
**AppSheet Design:**
- Deck view (swipe cards)
- Card shows: sender, title, subject, preview, confidence, AI urgency
- Swipe right = Approve
- Swipe left = Reject
- Tap = Detail view

**Web Implementation:**
```
COMPONENTS:
├─ Card Stack (Swiper.js or vanilla)
│   ├─ Sender Badge (with reputation dot)
│   ├─ Title (AI parsed)
│   ├─ Subject line
│   ├─ Content Preview (200 chars)
│   ├─ Footer: Confidence %, AI Urgency, Duration
│   └─ Swipe Gestures Enabled
└─ Action Buttons (for non-touch): Approve / Reject

DATA SOURCES:
- appsheet_getPendingProposals()
  (New function needed - returns PROPOSED_TASKS with status=PENDING)

IMPLEMENTATION:
- Load 10 cards at a time
- Swipe right → call appsheet_approveProposal()
- Swipe left → call appsheet_rejectProposal()
  (New function needed)
- Optimistic UI: card flies off, next card appears
- Undo button (5 second timeout)
```

---

### VIEW 5: Energy Log
**AppSheet Design:**
- Form: Log energy/focus/mood/stress
- Chart: Line chart of last 7 days

**Web Implementation:**
```
COMPONENTS:
├─ Form Card (top):
│   ├─ Energy Slider (1-5)
│   ├─ Focus Slider (1-5)
│   ├─ Mood Dropdown
│   ├─ Stress Slider (1-5)
│   ├─ Notes Textarea
│   └─ Submit Button
└─ Chart Card (bottom):
    └─ Chart.js Line Chart (3 series, 7 days)

DATA SOURCES:
- Form submit → appsheet_updateHumanState()
- Chart data → appsheet_getEnergyHistory({ days: 7 })
  (New function needed - returns HUMAN_STATE last 7 days)

IMPLEMENTATION:
- Sliders: HTML5 range inputs
- Real-time chart update after submit
- Color coding:
  Energy: Green (#48bb78)
  Focus: Blue (#4299e1)
  Stress: Red (#f56565)
```

---

### VIEW 6: Settings
**AppSheet Design:**
- Form/detail view of APPSHEET_CONFIG table
- Grouped by category
- Expandable sections

**Web Implementation:**
```
COMPONENTS:
├─ Accordion Sections (by category):
│   ├─ Scheduling Settings
│   ├─ Email Processing
│   ├─ Notifications
│   └─ Display Preferences
└─ Each setting:
    ├─ Label + Description
    └─ Input (text/number/toggle/dropdown)

DATA SOURCES:
- appsheet_getConfig()
  (Exists - returns configuration)
- appsheet_updateConfig({ item, value })
  (New function needed)

IMPLEMENTATION:
- Auto-save on blur (500ms debounce)
- Validation before save
- Success/error toast notifications
```

---

## 2.2 Ten Actions to Implement

### ACTION 1: Schedule Task
**Backend:** `appsheet_runScheduling({ taskId, priority, dryRun })`
**Trigger:** Button on task card (status = PENDING, no scheduled_start)
**UI Flow:**
1. Show loading spinner on task card
2. Call backend
3. On success: Update task card with new scheduled time
4. Show toast: "Task scheduled for [time]"

---

### ACTION 2: Approve Proposal
**Backend:** `appsheet_approveProposal({ proposalId })`
**Trigger:** Swipe right OR button on proposal card
**UI Flow:**
1. Animate card flying right
2. Call backend
3. On success: Remove card, show next
4. Show toast: "Task created and scheduled"

---

### ACTION 3: Reject Proposal
**Backend:** NEW - `appsheet_rejectProposal({ proposalId, reason })`
**Trigger:** Swipe left OR button on proposal card
**UI Flow:**
1. Animate card flying left
2. Optionally prompt for reason
3. Call backend
4. On success: Remove card, show next
5. Show toast: "Proposal rejected"

---

### ACTION 4: Complete Task
**Backend:** NEW - `appsheet_completeTask({ taskId, actualMinutes })`
**Trigger:** Button on task card (status = IN_PROGRESS or SCHEDULED)
**UI Flow:**
1. Show modal: "How long did this take?" (number input, default = estimated_minutes)
2. User enters actual time
3. Call backend
4. On success: Update task status to COMPLETED, strikethrough UI
5. Show toast: "Task completed!"

---

### ACTION 5: Update Energy State
**Backend:** `appsheet_updateHumanState({ energy, focus, mood, stress, autoReschedule })`
**Trigger:** Submit button on Energy Log form
**UI Flow:**
1. Validate form fields
2. Show loading on submit button
3. Call backend
4. On success: Clear form, update chart, show toast
5. If autoReschedule=true: "Energy updated. Schedule adjusted."

---

### ACTION 6: Start Task
**Backend:** NEW - `appsheet_startTask({ taskId })`
**Trigger:** Play button on task card (status = SCHEDULED)
**UI Flow:**
1. Change button to "In Progress" badge
2. Call backend
3. On success: Update status to IN_PROGRESS
4. Start client-side timer display

---

### ACTION 7: Snooze Task
**Backend:** `appsheet_runScheduling({ taskId })` after updating scheduled_start
**Trigger:** Snooze button on task card
**UI Flow:**
1. Show modal with options: "15 min", "1 hour", "Tomorrow", "Next Week"
2. User selects option
3. Call backend with computed new time
4. On success: Update task card, increment rollover_count
5. Show toast: "Snoozed until [time]"

---

### ACTION 8: Archive Task
**Backend:** NEW - `appsheet_archiveTask({ taskId })`
**Trigger:** Archive button (status = COMPLETED)
**UI Flow:**
1. Fade out task card
2. Call backend
3. On success: Remove from UI
4. Show toast: "Task archived"

---

### ACTION 9: Cancel Task
**Backend:** NEW - `appsheet_cancelTask({ taskId })`
**Trigger:** Cancel/Delete button (any status except COMPLETED)
**UI Flow:**
1. Show confirmation modal: "Are you sure?"
2. User confirms
3. Call backend
4. On success: Remove from UI or gray out
5. Show toast: "Task canceled"

---

### ACTION 10: Reschedule Task
**Backend:** `appsheet_runScheduling({ taskId })` after clearing schedule
**Trigger:** Reschedule button (status = SCHEDULED)
**UI Flow:**
1. Clear scheduled_start/end on UI
2. Call backend
3. On success: Update task with new time
4. Show toast: "Task rescheduled to [time]"

---

# SECTION 3: DATA SYNCHRONIZATION STRATEGY

## 3.1 Polling Architecture

### Global Polling Manager
```javascript
const PollingManager = {
  intervals: {},

  start: function(key, callback, frequency) {
    if (this.intervals[key]) {
      clearInterval(this.intervals[key]);
    }
    this.intervals[key] = setInterval(callback, frequency);
    callback(); // Immediate first call
  },

  stop: function(key) {
    if (this.intervals[key]) {
      clearInterval(this.intervals[key]);
      delete this.intervals[key];
    }
  },

  stopAll: function() {
    Object.keys(this.intervals).forEach(key => this.stop(key));
  }
};

// Stop polling when tab hidden
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    PollingManager.stopAll();
  } else {
    // Restart polling for current page
    initCurrentPagePolling();
  }
});
```

### Per-Page Polling Strategy

| Page | Data Endpoint | Frequency | On Change |
|------|--------------|-----------|-----------|
| Dashboard | `appsheet_getMyDay('today')` | 30s | Update task cards |
| Dashboard | `appsheet_getSystemStatus()` | 2min | Update energy gauge |
| Task List | `appsheet_getAllTasks()` | 30s | Re-render changed tasks only |
| Calendar | `appsheet_getCalendarEvents()` | 1min | Re-render calendar |
| Triage Queue | `appsheet_getPendingProposals()` | 1min | Add new cards to stack |
| Energy Log | `appsheet_getEnergyHistory()` | 5min | Update chart |

### Change Detection
```javascript
function updateTasksIncrementally(newTasks) {
  const cache = loadFromCache('tasks');

  newTasks.forEach(function(newTask) {
    const cached = cache.find(t => t.action_id === newTask.action_id);

    if (!cached) {
      // New task - add to UI
      addTaskCard(newTask);
    } else if (hasChanged(cached, newTask)) {
      // Changed task - update UI
      updateTaskCard(newTask);
    }
  });

  // Remove deleted tasks
  cache.forEach(function(cached) {
    if (!newTasks.find(t => t.action_id === cached.action_id)) {
      removeTaskCard(cached.action_id);
    }
  });

  saveToCache('tasks', newTasks);
}

function hasChanged(oldTask, newTask) {
  return oldTask.status !== newTask.status ||
         oldTask.scheduled_start !== newTask.scheduled_start ||
         oldTask.title !== newTask.title;
}
```

---

## 3.2 Client-Side Caching

### LocalStorage Strategy
```javascript
const Cache = {
  set: function(key, value, ttl) {
    const item = {
      value: value,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get: function(key) {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  },

  invalidate: function(key) {
    localStorage.removeItem(key);
  }
};

// Usage
Cache.set('tasks:today', tasks, 60000); // 1 minute TTL
const cached = Cache.get('tasks:today');
```

### Cache Invalidation Rules
- **After mutation:** Invalidate related caches
  - Complete task → Invalidate `tasks:today`, `tasks:all`
  - Reschedule task → Invalidate `tasks:today`, `calendar:events`
  - Approve proposal → Invalidate `proposals:pending`, `tasks:today`

---

## 3.3 Optimistic UI Updates

### Pattern
```javascript
function completeTaskOptimistic(taskId, actualMinutes) {
  // 1. Update UI immediately
  updateTaskCardStatus(taskId, 'COMPLETED');
  showToast('Task completed!');

  // 2. Call backend
  google.script.run
    .withSuccessHandler(function(result) {
      // 3. Confirm success - UI already updated
      Cache.invalidate('tasks:today');
    })
    .withFailureHandler(function(error) {
      // 4. Revert UI on failure
      revertTaskCardStatus(taskId);
      showErrorToast('Failed to complete task: ' + error.message);
    })
    .appsheet_completeTask({ taskId: taskId, actualMinutes: actualMinutes });
}
```

---

# SECTION 4: BACKEND FUNCTIONS NEEDED

## 4.1 Existing Functions (Already Implemented)
✅ `appsheet_runScheduling(params)`
✅ `appsheet_processEmails(params)`
✅ `appsheet_updateHumanState(params)`
✅ `appsheet_getSystemStatus()`
✅ `appsheet_approveProposal(params)`
✅ `appsheet_handleNewRecord(params)`
✅ `appsheet_handleUpdate(params)`
✅ `appsheet_resolveConflict(params)`

## 4.2 New Functions Required

### Function: `appsheet_getMyDay`
**Status:** ✅ Already created in previous brief
**Signature:** `({ view: 'today'|'scheduled' }) → { success, tasks, count, timestamp }`

### Function: `appsheet_getAllTasks`
**Purpose:** Get all active tasks with filtering/sorting
**Signature:**
```javascript
function appsheet_getAllTasks(params) {
  // params: { filters: {status, priority, lane}, search: string, limit: number, offset: number }
  // Returns: { success: true, tasks: [], total: number, timestamp: ISO }
}
```

### Function: `appsheet_getCalendarEvents`
**Purpose:** Get tasks + calendar events for date range
**Signature:**
```javascript
function appsheet_getCalendarEvents(params) {
  // params: { startDate: ISO, endDate: ISO }
  // Returns: { success: true, events: [{id, title, start, end, type, priority}], timestamp: ISO }
}
```

### Function: `appsheet_getPendingProposals`
**Purpose:** Get pending email proposals for triage
**Signature:**
```javascript
function appsheet_getPendingProposals() {
  // Returns: { success: true, proposals: [], count: number, timestamp: ISO }
}
```

### Function: `appsheet_rejectProposal`
**Purpose:** Reject email proposal
**Signature:**
```javascript
function appsheet_rejectProposal(params) {
  // params: { proposalId: string, reason: string }
  // Returns: { success: true, timestamp: ISO }
}
```

### Function: `appsheet_completeTask`
**Purpose:** Mark task complete with actual time
**Signature:**
```javascript
function appsheet_completeTask(params) {
  // params: { taskId: string, actualMinutes: number }
  // Returns: { success: true, completedAt: ISO, estimationAccuracy: number, timestamp: ISO }
}
```

### Function: `appsheet_startTask`
**Purpose:** Start a scheduled task
**Signature:**
```javascript
function appsheet_startTask(params) {
  // params: { taskId: string }
  // Returns: { success: true, startedAt: ISO, timestamp: ISO }
}
```

### Function: `appsheet_archiveTask`
**Purpose:** Archive completed task
**Signature:**
```javascript
function appsheet_archiveTask(params) {
  // params: { taskId: string }
  // Returns: { success: true, timestamp: ISO }
}
```

### Function: `appsheet_cancelTask`
**Purpose:** Cancel task
**Signature:**
```javascript
function appsheet_cancelTask(params) {
  // params: { taskId: string }
  // Returns: { success: true, timestamp: ISO }
}
```

### Function: `appsheet_getEnergyHistory`
**Purpose:** Get human state history for charts
**Signature:**
```javascript
function appsheet_getEnergyHistory(params) {
  // params: { days: number }
  // Returns: { success: true, history: [{timestamp, energy, focus, stress, mood}], timestamp: ISO }
}
```

### Function: `appsheet_getHighPriorityTasks`
**Purpose:** Get top priority tasks for dashboard
**Signature:**
```javascript
function appsheet_getHighPriorityTasks(params) {
  // params: { limit: number }
  // Returns: { success: true, tasks: [], timestamp: ISO }
}
```

### Function: `appsheet_getPendingProposalsCount`
**Purpose:** Get count of pending proposals
**Signature:**
```javascript
function appsheet_getPendingProposalsCount() {
  // Returns: { success: true, count: number, timestamp: ISO }
}
```

### Function: `appsheet_updateConfig`
**Purpose:** Update configuration setting
**Signature:**
```javascript
function appsheet_updateConfig(params) {
  // params: { item: string, value: any }
  // Returns: { success: true, timestamp: ISO }
}
```

---

# SECTION 5: ARCHITECTURE RECOMMENDATION

## 5.1 Recommended Tech Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| **CSS Framework** | Bulma | Zero JS, mobile-first, excellent docs |
| **Calendar** | Event Calendar | Lightweight, modern, good mobile support |
| **Charts** | Chart.js | Lighter than ApexCharts, sufficient for line charts |
| **Swipe Gestures** | Vanilla JS | Lightest option, full control |
| **Architecture** | Hybrid SPA | Best balance of performance and simplicity |
| **State Management** | Vanilla JS + LocalStorage | No framework overhead |
| **Real-Time** | Polling (30s-2min) | Only option in Apps Script |

---

## 5.2 File Structure

```
/moh-time-os-v2/src/5_web/
├── webapp/
│   ├── shell.html              # Main HTML shell (entry point)
│   ├── pages/
│   │   ├── dashboard.html      # Dashboard view
│   │   ├── tasklist.html       # Task list view
│   │   ├── calendar.html       # Calendar view
│   │   ├── triage.html         # Triage queue view
│   │   ├── energy.html         # Energy log view
│   │   └── settings.html       # Settings view
│   ├── components/
│   │   ├── task-card.html      # Reusable task card
│   │   ├── navbar.html         # Navigation bar
│   │   └── modals.html         # Modal templates
│   └── lib/
│       ├── app.js              # Main app logic
│       ├── polling.js          # Polling manager
│       ├── cache.js            # Cache manager
│       └── utils.js            # Utility functions
└── AppSheetBridge.gs          # Modify to serve HTML
```

---

## 5.3 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create HTML shell with navigation
- [ ] Implement polling manager
- [ ] Implement cache manager
- [ ] Set up Bulma CSS framework
- [ ] Create basic page routing

### Phase 2: Dashboard (Week 1)
- [ ] Implement Dashboard view
- [ ] Add `appsheet_getMyDay` function
- [ ] Add `appsheet_getHighPriorityTasks` function
- [ ] Add `appsheet_getPendingProposalsCount` function
- [ ] Integrate polling for dashboard

### Phase 3: Task Management (Week 2)
- [ ] Implement Task List view
- [ ] Add `appsheet_getAllTasks` function
- [ ] Add `appsheet_completeTask` function
- [ ] Add `appsheet_startTask` function
- [ ] Add `appsheet_archiveTask` function
- [ ] Add `appsheet_cancelTask` function
- [ ] Implement optimistic UI updates

### Phase 4: Calendar (Week 2)
- [ ] Integrate Event Calendar library
- [ ] Implement Calendar view
- [ ] Add `appsheet_getCalendarEvents` function
- [ ] Implement drag-to-reschedule
- [ ] Add event creation/editing

### Phase 5: Triage Queue (Week 3)
- [ ] Implement Triage Queue view
- [ ] Add `appsheet_getPendingProposals` function
- [ ] Add `appsheet_rejectProposal` function
- [ ] Implement swipe gestures (vanilla JS)
- [ ] Add undo functionality

### Phase 6: Energy Log (Week 3)
- [ ] Integrate Chart.js
- [ ] Implement Energy Log view
- [ ] Add `appsheet_getEnergyHistory` function
- [ ] Create energy logging form
- [ ] Implement chart updates

### Phase 7: Settings & Polish (Week 4)
- [ ] Implement Settings view
- [ ] Add `appsheet_updateConfig` function
- [ ] Add loading states everywhere
- [ ] Add error boundaries
- [ ] Mobile testing & optimization
- [ ] PWA manifest (optional)

---

# SECTION 6: OPEN QUESTIONS FOR USER

Before creating final implementation brief, need decisions on:

## 6.1 Priority Questions

### Q1: Which views are MUST-HAVE for MVP?
Options:
- [ ] All 6 views
- [ ] Dashboard + Task List + Calendar (core 3)
- [ ] Dashboard + Task List only (minimal)
- [ ] Other combination: _________________

### Q2: Mobile Navigation Style?
Options:
- [ ] Bottom tab bar (iOS style)
- [ ] Hamburger menu (Material style)
- [ ] Top tabs (swipeable)
- [ ] Floating action button menu

### Q3: Offline Support?
- [ ] Yes - full offline with sync queue
- [ ] Partial - read-only cached data
- [ ] No - require internet connection

### Q4: Push Notifications?
- [ ] Yes - via Service Workers (if possible)
- [ ] No - polling is sufficient

### Q5: Task Creation from UI?
- [ ] Yes - full form to create tasks
- [ ] Quick add only (title + quick schedule)
- [ ] No - tasks only from email/other sources

### Q6: Authentication Beyond Token?
- [ ] Keep simple token auth
- [ ] Add Google OAuth login
- [ ] Add PIN/password within app

---

# SECTION 7: ESTIMATED EFFORT

## 7.1 Development Time (Based on Phases)

| Phase | Description | Time Estimate |
|-------|-------------|---------------|
| Phase 1 | Foundation | 3-5 days |
| Phase 2 | Dashboard | 2-3 days |
| Phase 3 | Task Management | 4-5 days |
| Phase 4 | Calendar | 3-4 days |
| Phase 5 | Triage Queue | 2-3 days |
| Phase 6 | Energy Log | 2-3 days |
| Phase 7 | Settings & Polish | 3-5 days |
| **TOTAL** | **All 6 Views** | **19-28 days** |
| **MVP** | **Dashboard + Tasks + Calendar** | **12-17 days** |

## 7.2 Complexity Assessment

| Feature | Complexity | Risk | Notes |
|---------|-----------|------|-------|
| Polling architecture | Medium | Low | Well-documented pattern |
| Mobile-first CSS | Low | Low | Using Bulma framework |
| Task list with filters | Medium | Low | Standard CRUD operations |
| Calendar with drag-drop | High | Medium | Third-party library, needs testing |
| Swipe gestures | Medium | Low | Vanilla JS implementation |
| Chart integration | Low | Low | Chart.js well-documented |
| Real-time updates | Medium | Medium | Polling limitations |
| Optimistic UI | Medium | Medium | Requires careful error handling |
| SPA routing | Medium | Medium | Known history API bugs |
| Cross-browser testing | Medium | Low | Focus on modern mobile browsers |

---

# SECTION 8: NEXT STEPS

## 8.1 Immediate Action Items

1. **User Decisions Required:**
   - Answer 6 priority questions in Section 6.1
   - Confirm tech stack recommendations
   - Confirm phased approach

2. **Architecture Finalization:**
   - Lock down SPA/MPA/Hybrid decision
   - Confirm navigation pattern
   - Confirm offline strategy

3. **Create Final Brief:**
   - Once decisions made, create implementation brief with:
     - Complete code for all components
     - All backend functions ready to copy-paste
     - Step-by-step deployment instructions
     - Zero assumptions, zero errors

---

## 8.2 Research Status

✅ **COMPLETE** - Real-time updates (polling)
✅ **COMPLETE** - Mobile-first CSS frameworks
✅ **COMPLETE** - Calendar component options
✅ **COMPLETE** - Chart library options
✅ **COMPLETE** - Swipe gesture implementation
✅ **COMPLETE** - SPA vs MPA architecture
✅ **COMPLETE** - All 6 views mapped
✅ **COMPLETE** - All 10 actions mapped
✅ **COMPLETE** - Data synchronization strategy
✅ **COMPLETE** - Backend functions inventory

⏸️ **AWAITING** - User decisions on 6 priority questions
⏸️ **AWAITING** - Final architecture confirmation

---

**SPECIFICATION STATUS:** RESEARCH COMPLETE ✅
**READY FOR:** User decisions + Final implementation brief creation
**ESTIMATED TIME TO FINAL BRIEF:** 2-4 hours after decisions made
**ESTIMATED TIME TO WORKING MVP:** 12-17 days after implementation starts
