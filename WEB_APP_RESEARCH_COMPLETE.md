# COMPLETE SYSTEM RESEARCH - DAY PLANNER WEB APP

**Research Date:** 2025-10-01
**Purpose:** Zero-error integration plan for day planner web interface

---

## 1. ACTIONS SHEET SCHEMA ✅ VERIFIED

**Sheet Name:** `SHEET_NAMES.ACTIONS` = `'ACTIONS'`

**Complete Column List (24 columns):**
```javascript
[
  'action_id',           // Index 0
  'status',              // Index 1  - Values: NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELED, SCHEDULED, PENDING, PENDING_APPROVAL, ACCEPTED, REJECTED, BLOCKED, DEFERRED, ARCHIVED
  'priority',            // Index 2  - Values: CRITICAL, URGENT, HIGH, MEDIUM, LOW, MINIMAL
  'created_at',          // Index 3
  'updated_at',          // Index 4
  'title',               // Index 5
  'context',             // Index 6
  'lane',                // Index 7  - Values: ops, admin, creative, client, growth, deep_focus, batch, communication, learning, maintenance, high_energy, low_energy, social, solo, personal
  'estimated_minutes',   // Index 8  ⚠️ NOT estimated_duration!
  'scheduled_start',     // Index 9
  'scheduled_end',       // Index 10
  'actual_minutes',      // Index 11
  'completed_date',      // Index 12
  'source',              // Index 13
  'source_id',           // Index 14
  'description',         // Index 15
  'calendar_event_id',   // Index 16
  'rollover_count',      // Index 17
  'scheduling_metadata', // Index 18
  'score',               // Index 19
  'deadline',            // Index 20
  'energy_required',     // Index 21 - Values: CRITICAL, HIGH, MEDIUM, LOW, RECOVERY
  'focus_required',      // Index 22 - Values: INTENSE, HIGH, MEDIUM, LOW, BACKGROUND
  'estimation_accuracy'  // Index 23
]
```

**Source:** `/src/0_bootstrap/SheetHealer.gs` lines 291-298

---

## 2. BATCHOPERATIONS API ✅ VERIFIED

**Available Methods:**

```javascript
// Get column names
batchOps.getHeaders(sheetName)
// Returns: ['action_id', 'status', 'priority', ...]

// Get ALL rows including header (2D array)
batchOps.getAllSheetData(sheetName)
// Returns: [['action_id', 'status', ...], ['ACT_123', 'SCHEDULED', ...], ...]
// ⚠️ Row 0 is headers, data starts at row 1

// Filter rows by column values
batchOps.getRowsByFilter(sheetName, filterObject, options)
// Example: batchOps.getRowsByFilter('ACTIONS', {status: 'SCHEDULED'})
// Returns: Array of matching rows (without headers)

// Filter by custom function
batchOps.getRowsByPredicate(sheetName, predicateFunction, options)
// Returns: Array of matching rows

// Filter with row positions
batchOps.getRowsWithPosition(sheetName, filterObject)
// Returns: Array of {row: [data], rowIndex: number}
```

**Source:** `/src/3_core/BatchOperations.gs` lines 186-446

---

## 3. APPSHEET FUNCTION SIGNATURES ✅ VERIFIED

**All 8 Functions (lines 142-618 in AppSheetBridge.gs):**

```javascript
// 1. Schedule tasks
appsheet_runScheduling(params)
// Input: {taskId?, priority?, dryRun: boolean}
// Output: {success: true, scheduled: number, conflicts: number, rescheduled: number, skipped: [], timestamp: ISO}

// 2. Process emails
appsheet_processEmails(params)
// Input: {maxEmails?: number}
// Output: {success: true, processed: number, approved: number, ignored: number, proposals: [], timestamp: ISO}

// 3. Update human state
appsheet_updateHumanState(params)
// Input: {energy: 1-5, focus: 1-5, mood: string, stress: 1-5, autoReschedule?: boolean}
// Output: {success: true, state_updated: boolean, rescheduled: number, timestamp: ISO}

// 4. Get system status
appsheet_getSystemStatus()
// Input: none
// Output: {success: true, healthy: boolean, services: {}, metrics: {}, timestamp: ISO}

// 5. Approve proposal
appsheet_approveProposal(params)
// Input: {proposalId: string}
// Output: {success: true, action_id: string, scheduled: boolean, timestamp: ISO}

// 6. Handle new record (for AppSheet webhooks)
appsheet_handleNewRecord(params)
// Input: {table: string, rowId: string, data: object}
// Output: {success: true, processed: boolean, triggered: [], timestamp: ISO}

// 7. Handle update (for AppSheet webhooks)
appsheet_handleUpdate(params)
// Input: {table: string, rowId: string, before: object, after: object}
// Output: {success: true, rescheduled: boolean, changes_processed: boolean, timestamp: ISO}

// 8. Resolve conflict
appsheet_resolveConflict(params)
// Input: {winningTask: string, conflictId: string, losingTasks: []}
// Output: {success: true, rescheduled: [], failed: [], timestamp: ISO}
```

**All functions:**
- Call `ensureSystemInitialized()` first (auto-registers services if needed)
- Throw errors (not return {success: false})
- Use TimeZoneAwareDate.toISOString()

---

## 4. WEB APP ARCHITECTURE ✅ VERIFIED

**Request Flow:**

```
User Browser
    ↓
doGet(e) [SystemBootstrap.gs:563]
    ↓
container.get(SERVICES.WebAppManager) ⚠️ Requires services registered
    ↓
webAppManager.handleDoGet(e)
    ↓
secureAuth.verifyWebAppToken(e) ⚠️ Requires ?auth=TOKEN
    ↓
appSheetBridge.doGet(e)
    ↓
Currently: Returns JSON via ContentService
```

**Current Endpoints (AppSheetBridge.doGet):**
- `?endpoint=config` → Configuration JSON
- `?endpoint=status` → System status JSON
- Default: Status JSON

**Source:** `/src/8_setup/SystemBootstrap.gs:563-590`, `/src/5_web/WebAppManager.gs:17-37`

---

## 5. AUTHENTICATION SYSTEM ⚠️ CRITICAL

**How it works:**

```javascript
// WebAppManager checks auth BEFORE calling AppSheetBridge
secureAuth.verifyWebAppToken(e)
```

**Auth Requirements:**
1. Script Properties must have `WEB_APP_TOKEN` set
2. Every GET request must include `?auth=TOKEN_VALUE`
3. Token comparison: `e.parameter.auth === PropertiesService.getScriptProperties().getProperty('WEB_APP_TOKEN')`
4. **Failure returns 401 Unauthorized** before reaching AppSheetBridge

**Source:** `/src/5_web/SecureWebAppAuth.gs:150-171`

**⚠️ IMPLICATION FOR HTML:**
- If HTML is served via doGet(), initial page load requires `?auth=TOKEN`
- Every subsequent google.script.run call from HTML inherits auth context
- Without token: 401 error, no HTML served

---

## 6. SERVICE INITIALIZATION TIMING ⚠️ CRITICAL

**Container Bootstrap:**
```javascript
// AA_Container.gs:866
const container = new DependencyContainer();  // ✅ Created on file load

// But services NOT registered until:
completeSetup()                // OR
registerAllServices()          // OR
ensureBootstrapServices()      // Called
```

**doGet() assumes services exist:**
```javascript
// SystemBootstrap.gs:579
const webAppManager = container.get(SERVICES.WebAppManager);  // ⚠️ Throws if not registered
```

**Auto-initialization:**
- `appsheet_*` functions call `ensureSystemInitialized()` → `registerAllServices()`
- But doGet() itself doesn't have this guard
- If first web request happens before completeSetup(), doGet() fails

**⚠️ RISK:**
- Cold start: doGet() → container.get(WebAppManager) → Error: Service not registered

---

## 7. DEPLOYMENT CONFIGURATION ✅ VERIFIED

**Apps Script Config (appsscript.json):**
```json
{
  "timeZone": "Asia/Dubai",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"  // ⚠️ No Google login required, BUT custom token IS required
  },
  "runtimeVersion": "V8"
}
```

**Clasp Deployment (.claspignore):**
```
**/*.js    # ⚠️ Excluded - only .gs files deploy
**/*.ts    # ⚠️ Excluded
*.md       # Excluded

# HTML files (.html) NOT excluded → Will deploy ✅
```

**Source:** `/src/appsscript.json`, `/.claspignore`

---

## 8. HTMLSERVICE INTEGRATION ⚠️ NOT IMPLEMENTED

**Current State:**
- ❌ No HTML files exist in codebase
- ❌ No HtmlService usage found
- ❌ AppSheetBridge.doGet() only returns ContentService JSON
- ❌ No endpoint serves HTML

**How HtmlService works in Apps Script:**

```javascript
// Serving HTML
HtmlService.createHtmlOutputFromFile('FileName')  // .html file in project
  .setTitle('Page Title')
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

// Or with template (scriptlets)
HtmlService.createTemplateFromFile('FileName')
  .evaluate();

// Calling server functions from HTML
<script>
  google.script.run
    .withSuccessHandler(callback)
    .withFailureHandler(errorCallback)
    .serverFunctionName(params);
</script>
```

**⚠️ REQUIREMENT:**
- HTML file must be created in Apps Script project (via clasp or web IDE)
- File extension: `.html`
- Location: `src/*.html` (same level as .gs files for clasp)

---

## 9. TIMEZONE HANDLING ✅ VERIFIED

**TimeZoneAwareDate class:**
```javascript
TimeZoneAwareDate.toISOString(date)
// Returns: "2025-10-01T14:22:00+04:00" (includes timezone offset)
// Uses Utilities.formatDate() with timezone from appsscript.json
// Has caching for performance
```

**Timezone:** `Asia/Dubai` (UTC+4)

**Source:** `/src/1_globals/TimeZoneUtils.gs:14-71`

---

## 10. IDENTIFIED RISKS & GAPS

### 🔴 CRITICAL RISKS

1. **Auth Token Requirement**
   - Problem: All GET requests require `?auth=TOKEN` parameter
   - Impact: HTML page load requires token in URL
   - UX Issue: Users must know/share secret token
   - Security: Token visible in URL (browser history, logs)

2. **Service Initialization Race**
   - Problem: doGet() calls container.get(WebAppManager) without checking if registered
   - Impact: Cold start web requests fail with "Service not registered"
   - Workaround: appsheet_* functions have ensureSystemInitialized(), but doGet doesn't

3. **No HTML Infrastructure**
   - Problem: HtmlService never used, no patterns to follow
   - Impact: Integration requires new architecture decisions
   - Unknown: How auth works with HtmlService vs ContentService

### 🟡 MEDIUM RISKS

4. **Column Name Mismatch**
   - Problem: Field is `estimated_minutes` not `estimated_duration`
   - Impact: UI would show wrong values if using wrong column name

5. **Header Row in getAllSheetData()**
   - Problem: Returns 2D array with headers at index 0
   - Impact: Must skip first row when processing

6. **Error Handling in HTML**
   - Problem: google.script.run errors not well documented
   - Impact: Unknown how to gracefully handle server errors in UI

### 🟢 LOW RISKS

7. **Timezone Display**
   - Problem: Times in ISO with +04:00, need formatting for display
   - Impact: JS Date() can parse, but display needs formatting

8. **Mobile Responsiveness**
   - Problem: No existing UI patterns to follow
   - Impact: Must design from scratch

---

## 11. REMAINING RESEARCH QUESTIONS

### Architecture Decisions Needed:

1. **Auth Strategy:**
   - Option A: Keep token-based auth, embed token in HTML
   - Option B: Add public endpoint exception for HTML only
   - Option C: Modify auth to allow certain endpoints without token

2. **Service Initialization:**
   - Option A: Add ensureSystemInitialized() to doGet()
   - Option B: Assume completeSetup() always runs first
   - Option C: Add service check in WebAppManager

3. **HTML Serving:**
   - Option A: Add HTML endpoint to AppSheetBridge.doGet()
   - Option B: Create separate service for HTML
   - Option C: Bypass WebAppManager for HTML endpoint

4. **Error Handling:**
   - How do google.script.run errors surface in HTML?
   - Should HTML check service availability before loading?
   - Fallback UI when backend unavailable?

5. **Deployment:**
   - Create HTML file locally then clasp push?
   - Or create in web IDE then clasp pull?
   - How to test HTML before deployment?

---

## 12. RECOMMENDED APPROACH

Given all constraints, here's the **safest, zero-risk approach**:

### Phase 1: Foundation (Low Risk)
1. Create HTML file locally: `src/5_web/DayPlanner.html`
2. Add HTML endpoint to AppSheetBridge.doGet() (returns HtmlService)
3. Add new function `appsheet_getMyDay()` (follows existing pattern)
4. Test deployment: clasp push

### Phase 2: Auth Resolution (Medium Risk)
5. Decision: Embed auth token in HTML OR add public exception
6. Test auth flow end-to-end

### Phase 3: Integration (Medium Risk)
7. Wire HTML buttons to appsheet_* functions via google.script.run
8. Implement error handling in HTML
9. Test all user flows

### Phase 4: Polish (Low Risk)
10. Add loading states, styling, mobile responsive
11. Final testing

---

## 13. NEXT STEPS

**Before creating the final brief, decide:**

1. **Auth**: How should HTML access be secured?
2. **Initialization**: Add guard to doGet() or assume completeSetup()?
3. **Testing**: Deploy to test project first or main project?

**Then:** Create comprehensive, zero-assumption implementation brief with all code ready to copy-paste.

---

**Research Status:** COMPLETE ✅
**Ready for Brief:** After architecture decisions above
