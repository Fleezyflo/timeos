# SUBAGENT VERIFICATION CHECKLIST & EXECUTION GUIDE

## HOW SUBAGENTS MUST EXECUTE TO PERFECTION

### EXECUTION PROTOCOL

Each subagent MUST:
1. **READ** the phase brief completely before starting
2. **COMPARE** every code change against the COMPLETE_CODE_FIX_PLAN.md
3. **VERIFY** line numbers and context before modifications
4. **TEST** each change individually
5. **VALIDATE** using the criteria in each brief

### VERIFICATION AGAINST MASTER PLAN

**Primary Reference**: `COMPLETE_CODE_FIX_PLAN.md`
- Contains ALL 202 fixes with exact implementations
- Subagents must cross-reference their phase brief with this master plan
- Any discrepancies must be reported before proceeding

**Validation Document**: `PLAN_VALIDATION_PROOF.md`
- Shows expected outcomes for each fix
- Subagents verify their results match expected outcomes

---

## PHASE 1 VERIFICATION CHECKLIST

### Task 1: SafeColumnAccess
- [ ] File exists: `src/7_support/SafeColumnAccess.gs`
- [ ] Contains all 8 methods: buildColumnMap, getColumnIndex, getValue, setValue, createEmptyRow, validateRow, mapRowToObject, mapObjectToRow
- [ ] Constructor initializes headers and columnMap
- [ ] Methods handle edge cases (null values, missing columns)

### Task 2: IntelligentScheduler STUB
- [ ] Line 328 no longer contains "STUB" warning
- [ ] _calculateSchedulingEfficiency returns calculated value, not hardcoded 0.75
- [ ] Added _calculateActiveHours() method
- [ ] Added _calculateTotalAvailableHours() method

### Task 3: EmailIngestionEngine Learning
- [ ] _initializeLearningSystem no longer returns empty object
- [ ] Added _persistLearningData() method
- [ ] Added _generateRecommendation() method
- [ ] Learning data persists to PersistentStore

### Task 4: DEPENDENCIES Sheet
- [ ] SHEET_NAMES constant includes DEPENDENCIES: 'Dependencies'
- [ ] No duplicate entries in SHEET_NAMES

**Verification Command**:
```javascript
function verifyPhase1() {
  const checks = {
    safeColumnAccess: typeof SafeColumnAccess === 'function',
    dependenciesSheet: SHEET_NAMES.DEPENDENCIES === 'Dependencies',
    stubRemoved: !IntelligentScheduler.prototype._calculateSchedulingEfficiency.toString().includes('STUB'),
    learningSystem: EmailIngestionEngine.prototype._initializeLearningSystem.toString().length > 100
  };
  console.log('Phase 1 Verification:', checks);
  return Object.values(checks).every(v => v === true);
}
```

---

## PHASE 2 VERIFICATION CHECKLIST

### Task 1: SERVICES Enum
- [ ] SERVICES.BusinessLogicValidation exists
- [ ] SERVICES.AuditProtocol exists

### Task 2: BusinessLogicValidation Service
- [ ] File created: `src/4_services/BusinessLogicValidation.gs`
- [ ] Contains validateTaskCreation method
- [ ] Contains validateStateTransition method
- [ ] Contains validateScheduleConflict method
- [ ] selfTest method returns boolean

### Task 3: AuditProtocol Service
- [ ] File created: `src/4_services/AuditProtocol.gs`
- [ ] Contains logAuditEvent method
- [ ] Contains getAuditTrail method
- [ ] Contains generateAuditReport method
- [ ] Uses batch writing for performance

### Task 4: Service Registrations
- [ ] BusinessLogicValidation registered in ServiceRegistration.gs
- [ ] AuditProtocol registered in ServiceRegistration.gs
- [ ] Circular dependency fixed with lazy loading

**Verification Command**:
```javascript
function verifyPhase2() {
  const checks = {
    servicesEnum: SERVICES.BusinessLogicValidation && SERVICES.AuditProtocol,
    businessLogic: container.get(SERVICES.BusinessLogicValidation) !== null,
    auditProtocol: container.get(SERVICES.AuditProtocol) !== null,
    circularFixed: typeof EmailIngestionEngine.prototype.setTriageEngine === 'function'
  };
  console.log('Phase 2 Verification:', checks);
  return Object.values(checks).every(v => v === true);
}
```

---

## PHASE 3 VERIFICATION CHECKLIST

### Task 1: EmailIngestionEngine Quota
- [ ] Constructor includes quotaManager property
- [ ] _enforceQuotaLimit() method added
- [ ] processUnreadEmails wrapped with quota enforcement
- [ ] Retry logic with exponential backoff

### Task 2: Batch Processing
- [ ] _processEmailBatch() method added
- [ ] _processMessage() method added
- [ ] Individual message failures don't stop batch

### Task 3: ZeroTrustTriageEngine Quota
- [ ] Constructor includes quotaManager
- [ ] _enforceQuotaLimit() method added
- [ ] scanUnprocessedEmails handles rate limits

**Verification Command**:
```javascript
function verifyPhase3() {
  const emailEngine = container.get(SERVICES.EmailIngestionEngine);
  const triageEngine = container.get(SERVICES.ZeroTrustTriageEngine);

  const checks = {
    emailQuota: emailEngine.quotaManager && emailEngine.quotaManager.maxCallsPerMinute === 75,
    emailEnforce: typeof emailEngine._enforceQuotaLimit === 'function',
    triageQuota: triageEngine.quotaManager && triageEngine.quotaManager.maxCallsPerMinute === 75,
    batchMethod: typeof emailEngine._processEmailBatch === 'function'
  };
  console.log('Phase 3 Verification:', checks);
  return Object.values(checks).every(v => v === true);
}
```

---

## PHASE 4 VERIFICATION CHECKLIST

### All Hardcoded Values Replaced
- [ ] SystemManager: archive limit uses ConfigManager
- [ ] SystemManager: log limit uses ConfigManager
- [ ] EmailIngestionEngine: system fingerprints from config
- [ ] EmailIngestionEngine: action keywords from config
- [ ] IntelligentScheduler: scoring weights from config
- [ ] IntelligentScheduler: lane mappings from config
- [ ] Default configs added to seedInitialData

**Verification Command**:
```javascript
function verifyPhase4() {
  const configManager = container.get(SERVICES.ConfigManager);

  const checks = {
    archiveLimit: configManager.get('ARCHIVE_BATCH_LIMIT') !== null,
    systemFingerprints: configManager.get('SYSTEM_EMAIL_FINGERPRINTS') !== null,
    scoringWeights: typeof IntelligentScheduler.prototype.getScoringWeights === 'function',
    laneMapping: typeof IntelligentScheduler.prototype.getLaneEnergyMapping === 'function'
  };
  console.log('Phase 4 Verification:', checks);
  return Object.values(checks).every(v => v === true);
}
```

---

## PHASE 5 VERIFICATION CHECKLIST

### Error Classes
- [ ] BusinessLogicError.gs created
- [ ] SchedulingError.gs created
- [ ] TriageError.gs created
- [ ] All extend BaseError
- [ ] Static factory methods implemented
- [ ] Errors globally available

**Verification Command**:
```javascript
function verifyPhase5() {
  const checks = {
    businessLogicError: typeof BusinessLogicError === 'function',
    schedulingError: typeof SchedulingError === 'function',
    triageError: typeof TriageError === 'function',
    extendsBase: BusinessLogicError.prototype instanceof BaseError
  };
  console.log('Phase 5 Verification:', checks);
  return Object.values(checks).every(v => v === true);
}
```

---

## PHASE 6 VERIFICATION CHECKLIST (DO LAST)

### Test Harnesses
- [ ] IntegrationFlowValidator.gs created
- [ ] PerformanceBenchmarkHarness.gs created
- [ ] SecurityValidationHarness.gs created
- [ ] StressTestSimulator.gs created
- [ ] RegressionTestGuard.gs created
- [ ] All have runAll() method
- [ ] All generate reports

**Verification Command**:
```javascript
function verifyPhase6() {
  const checks = {
    integration: typeof IntegrationFlowValidator === 'function',
    performance: typeof PerformanceBenchmarkHarness === 'function',
    security: typeof SecurityValidationHarness === 'function',
    stress: typeof StressTestSimulator === 'function',
    regression: typeof RegressionTestGuard === 'function'
  };
  console.log('Phase 6 Verification:', checks);
  return Object.values(checks).every(v => v === true);
}
```

---

## PHASE 7 VERIFICATION CHECKLIST

### Final Fixes
- [ ] Priority switch handles all PRIORITY values
- [ ] Energy distance has bounds checking
- [ ] Status transition validation complete
- [ ] Complex date parsing added
- [ ] Row validation methods added
- [ ] System integrity check function added

**Verification Command**:
```javascript
function verifyPhase7() {
  const checks = {
    statusTransition: typeof isValidStatusTransition === 'function',
    complexDate: typeof parseComplexDate === 'function',
    timeEstimate: typeof extractTimeEstimate === 'function',
    integrityCheck: typeof runSystemIntegrityCheck === 'function'
  };
  console.log('Phase 7 Verification:', checks);
  return Object.values(checks).every(v => v === true);
}
```

---

## MASTER VERIFICATION FUNCTION

```javascript
function verifyAllPhases() {
  const results = {
    phase1: verifyPhase1(),
    phase2: verifyPhase2(),
    phase3: verifyPhase3(),
    phase4: verifyPhase4(),
    phase5: verifyPhase5(),
    phase6: verifyPhase6(),
    phase7: verifyPhase7()
  };

  const allPassed = Object.values(results).every(v => v === true);

  console.log('=== SYSTEM VERIFICATION RESULTS ===');
  console.log(results);
  console.log('ALL PHASES PASSED:', allPassed);

  if (allPassed) {
    // Run final system integrity check
    const integrity = runSystemIntegrityCheck();
    console.log('SYSTEM INTEGRITY:', integrity);
    return integrity.passed;
  }

  return false;
}
```

---

## SUBAGENT EXECUTION RULES

### RULE 1: NO DEVIATIONS
- Follow the brief EXACTLY
- Do not "improve" or modify the provided code
- Copy-paste implementations as given

### RULE 2: VERIFY BEFORE COMMIT
- Run phase verification function before marking complete
- All checks must pass
- Report any failures immediately

### RULE 3: MAINTAIN ORDER
- Complete phases 1-5 and 7 before phase 6 (testing)
- Do not skip phases
- Each phase builds on previous

### RULE 4: ERROR HANDLING
- If a fix fails, STOP and report
- Do not attempt to fix differently
- Reference the master plan for clarification

### RULE 5: VALIDATION IS MANDATORY
- Every change must be validated
- Use the verification commands
- Document any discrepancies

---

## SUCCESS CRITERIA

The system is considered SUCCESSFULLY FIXED when:

1. **All verification functions return true**
2. **System integrity check passes**
3. **completeSetup() runs without errors**
4. **All services instantiate properly**
5. **No console errors during startup**
6. **All 14 sheets exist with correct structure**

---

## TROUBLESHOOTING GUIDE

### If Phase Verification Fails:
1. Check exact line numbers in brief
2. Verify file paths are correct
3. Compare with COMPLETE_CODE_FIX_PLAN.md
4. Ensure no typos in implementation
5. Check for GAS V8 compatibility

### Common Mistakes to Avoid:
- Using async/await (not supported)
- Using optional chaining ?. (not supported)
- Using spread operator in certain contexts
- Forgetting to add to global scope
- Missing dependencies in constructor

---

## FINAL VALIDATION

After all phases complete:
```javascript
function finalSystemValidation() {
  console.log('Starting final system validation...');

  // 1. Test system setup
  const setupResult = completeSetup();
  console.log('Setup result:', setupResult);

  // 2. Verify all services
  const allServices = verifyAllPhases();
  console.log('All phases verified:', allServices);

  // 3. Check system integrity
  const integrity = checkSystemIntegrity();
  console.log('System integrity:', integrity);

  // 4. Test core operations
  const tests = {
    sheets: checkSheetHealth(),
    schema: container.get(SERVICES.SystemManager)._verifyDatabaseSchema(),
    config: container.get(SERVICES.ConfigManager).getConfigurationHealth()
  };

  console.log('Core operations:', tests);

  const success = setupResult.success &&
                 allServices &&
                 integrity.passed &&
                 tests.sheets.healthy &&
                 tests.schema === true;

  console.log('=== FINAL RESULT ===');
  console.log('SYSTEM FULLY OPERATIONAL:', success);

  return success;
}
```

This validation MUST return true for the system to be considered fixed.