# Data Handling & Sanitization

## Overview

MOH Time OS v2.0 implements comprehensive data sanitization and privacy controls to protect against injection attacks and ensure user data privacy.

## Phase 8: Sanitization & Privacy Controls

### Sanitization Policy

All user-provided text input is automatically sanitized through the `sanitizeString()` utility function (src/1_globals/Utilities.gs) before being stored in the system.

#### Protection Mechanisms

1. **Formula Injection Prevention**
   - Detects dangerous formula prefixes: `=`, `+`, `-`, `@`
   - Automatically prefixes with single quote (`'`) to escape formula execution
   - Prevents CSV injection attacks when data is exported to spreadsheets

2. **XSS (Cross-Site Scripting) Hardening**
   - Removes HTML tags: `<`, `>`
   - Strips JavaScript protocols: `javascript:`
   - Removes event handlers: `onclick=`, `onload=`, etc.
   - Eliminates HTML entities: `&lt;`, `&gt;`, `&amp;`, `&quot;`

3. **Length Limiting**
   - Maximum string length: 10,000 characters
   - Automatically truncates inputs exceeding limit
   - Prevents memory abuse and denial-of-service attacks

4. **Type Safety**
   - Returns empty string for `null`, `undefined`, or non-string inputs
   - Ensures consistent output type across all sanitization calls

### Entry Points Protected

Sanitization is applied at all user input entry points:

1. **AppSheet API** (src/5_web/AppSheetBridge.gs)
   - `appsheet_createTask()`: Sanitizes `title`, `description`, `created_by`
   - Location: Line 1315-1327

2. **Chat Interface** (src/5_web/ChatEngine.gs)
   - `_parseTaskParameters()`: Sanitizes `title`, `description`, `created_by`
   - Location: Line 200-207

3. **Email Ingestion** (src/4_services/EmailIngestionEngine.gs)
   - `parseTaskFromEmailWithLearning()`: Sanitizes `sender`, `subject`, `parsed_title`, `raw_content_preview`
   - Location: Line 732-734

4. **Zero Trust Triage** (src/4_services/ZeroTrustTriageEngine.gs)
   - NLP analysis results: Sanitizes `sender`, `subject`, `parsed_title`, `raw_content_preview`
   - Location: Line 452-454

5. **Human State Recording** (src/4_services/HumanStateManager.gs)
   - `recordHumanState()`: Sanitizes user-provided `notes`
   - Location: Line 39

6. **DayPlanner UI** (src/5_web/DayPlanner.html)
   - Client-side rendering uses template literals with pre-sanitized server data
   - No additional client-side sanitization required
   - Location: Line 2958

### Privacy Masking

Optional privacy controls can be enabled via configuration flags in the `APPSHEET_CONFIG` sheet:

#### Configuration Flags

1. **MASK_PROPOSAL_CONTENT** (default: `false`)
   - When enabled: Truncates email content preview to 100 characters + `[...masked]`
   - When disabled: Shows full 200 character preview (sanitized)
   - Applies to: Email proposals and zero-trust triage results

2. **MASK_SENDER_EMAIL** (default: `false`)
   - When enabled: Masks sender email as `m***@domain.com`
   - When disabled: Stores full email address (sanitized)
   - Applies to: All email-sourced proposals and tasks

#### Enabling Privacy Masking

```javascript
// Via ConfigManager
const configManager = container.get(SERVICES.ConfigManager);
configManager.set('MASK_PROPOSAL_CONTENT', 'true');
configManager.set('MASK_SENDER_EMAIL', 'true');
```

Or manually update the `APPSHEET_CONFIG` sheet:
- Row: Find config with `config_key` = 'cfg_mask_proposal_content'
- Set `config_value` to `'true'` to enable
- Changes take effect on next email processing cycle

### Compliance Considerations

#### GDPR Compliance

- **Right to be Forgotten**: Enable `MASK_SENDER_EMAIL` to minimize PII storage
- **Data Minimization**: Enable `MASK_PROPOSAL_CONTENT` to limit email content retention
- **Purpose Limitation**: Masked data still supports task management while reducing privacy exposure

#### Security Best Practices

1. **Defense in Depth**: Sanitization applied before storage AND before rendering
2. **Fail-Safe Defaults**: Privacy masking disabled by default (no breaking changes)
3. **Audit Trail**: All sanitization and masking operations logged via SmartLogger
4. **Verification**: Phase 8 validation tests ensure sanitization integrity

### Testing Sanitization

Run validation tests to verify sanitization is working:

```javascript
// Run from Apps Script IDE
const result = validatePhase8Sanitization();
Logger.log(result); // Should return true
```

Test cases include:
- Formula injection with `=`, `+`, `-`, `@` prefixes
- XSS attempts with `<script>`, `javascript:`, `onclick=`
- HTML entity bypasses with `&lt;`, `&gt;`, `&amp;`
- Length limiting with 15,000 character strings
- Null/undefined input handling
- Privacy config flag existence

### Sanitization Examples

```javascript
// Formula injection prevention
sanitizeString("=SUM(A1:A10)")  → "'=SUM(A1:A10)"
sanitizeString("+IMPORTRANGE()") → "'+IMPORTRANGE()"
sanitizeString("@FORMULA")        → "'@FORMULA"

// XSS prevention
sanitizeString("<script>alert(1)</script>") → "scriptalert(1)/script"
sanitizeString("javascript:void(0)")         → "void(0)"
sanitizeString("onclick=alert(1)")           → "alert(1)"

// HTML entity removal
sanitizeString("&lt;html&gt;") → "html"
sanitizeString("&amp;test")    → "test"

// Normal text (unchanged)
sanitizeString("Buy groceries") → "Buy groceries"
sanitizeString("Meeting at 3pm") → "Meeting at 3pm"
```

### Privacy Masking Examples

```javascript
// With MASK_SENDER_EMAIL enabled
Original: "john.doe@example.com"
Masked:   "j***@example.com"

// With MASK_PROPOSAL_CONTENT enabled
Original: "Please review the attached quarterly financial report for Q3 2024. The deadline for feedback is October 15th, and we need sign-off from all department heads before proceeding with the board presentation."
Masked:   "Please review the attached quarterly financial report for Q3 2024. The deadline for feedback is Oc[...masked]"
```

### Rollback Procedures

If sanitization causes issues with legitimate data:

1. **Disable Privacy Masking**: Set config flags to `'false'`
2. **Review Logs**: Check ACTIVITY sheet for sanitization warnings
3. **Verify Data**: Existing data remains unchanged; only new inputs are sanitized
4. **Revert Code**: If necessary, revert commit containing Phase 8 changes

### Performance Impact

- **Negligible**: Sanitization adds <1ms per string operation
- **Batching**: Bulk operations maintain same performance profile
- **Caching**: Config flags cached for 5 minutes (default TTL)
- **Memory**: Length limiting prevents memory abuse

### Known Limitations

1. **Existing Data**: Sanitization only applies to new inputs after Phase 8 deployment
2. **Partial Masking**: Sender email masking preserves domain for routing/filtering
3. **Reversibility**: Sanitization is one-way; original unsanitized data is not stored
4. **Non-Text Data**: Numbers, dates, and JSON structures are not sanitized

### Support

For questions or issues related to data handling and sanitization:
1. Check logs in ACTIVITY sheet for sanitization warnings
2. Run `validatePhase8Sanitization()` to verify system integrity
3. Review source code comments in `Utilities.gs:101-138`
4. Consult operations/security.md for operational procedures

---

**Last Updated**: Phase 8 Implementation
**Version**: 2.0
**Status**: Production
