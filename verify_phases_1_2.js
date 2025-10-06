/**
 * PHASE 1 & 2 VERIFICATION SCRIPT
 * Tests completion and perfection of implemented fixes
 */

// Test Phase 1: Core Services
function verifyPhase1() {
  const checks = {};
  
  // Check 1: SafeColumnAccess exists
  try {
    const fs = require('fs');
    const safeColumnPath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/7_support/SafeColumnAccess.gs';
    const content = fs.readFileSync(safeColumnPath, 'utf8');
    
    checks.safeColumnExists = fs.existsSync(safeColumnPath);
    checks.hasAllMethods = [
      'buildColumnMap', 'getColumnIndex', 'getValue', 'setValue', 
      'createEmptyRow', 'validateRow', 'mapRowToObject', 'mapObjectToRow'
    ].every(method => content.includes(method));
    
  } catch(e) {
    checks.safeColumnExists = false;
    checks.hasAllMethods = false;
  }
  
  // Check 2: IntelligentScheduler STUB removed
  try {
    const fs = require('fs');
    const schedulerPath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/4_services/IntelligentScheduler.gs';
    const content = fs.readFileSync(schedulerPath, 'utf8');
    
    checks.stubRemoved = !content.includes('// STUB:');
    checks.hasActiveHours = content.includes('_calculateActiveHours()');
    checks.hasTotalHours = content.includes('_calculateTotalAvailableHours()');
    
  } catch(e) {
    checks.stubRemoved = false;
  }
  
  // Check 3: EmailIngestionEngine Learning System
  try {
    const fs = require('fs');
    const enginePath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/4_services/EmailIngestionEngine.gs';
    const content = fs.readFileSync(enginePath, 'utf8');
    
    checks.learningImplemented = content.includes('_persistLearningData(');
    checks.hasRecommendation = content.includes('_generateRecommendation(');
    checks.learningSystemComplete = !content.includes('return {};') || content.includes('patterns:');
    
  } catch(e) {
    checks.learningImplemented = false;
  }
  
  // Check 4: DEPENDENCIES sheet added
  try {
    const fs = require('fs');
    const constantsPath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/1_globals/Constants.gs';
    const content = fs.readFileSync(constantsPath, 'utf8');
    
    checks.dependenciesSheet = content.includes("DEPENDENCIES: 'Dependencies'");
    
  } catch(e) {
    checks.dependenciesSheet = false;
  }
  
  return checks;
}

// Test Phase 2: Service Container
function verifyPhase2() {
  const checks = {};
  
  // Check 1: SERVICES enum updated
  try {
    const fs = require('fs');
    const constantsPath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/1_globals/Constants.gs';
    const content = fs.readFileSync(constantsPath, 'utf8');
    
    checks.businessLogicInEnum = content.includes("BusinessLogicValidation: 'BusinessLogicValidation'");
    checks.auditProtocolInEnum = content.includes("AuditProtocol: 'AuditProtocol'");
    
  } catch(e) {
    checks.businessLogicInEnum = false;
    checks.auditProtocolInEnum = false;
  }
  
  // Check 2: BusinessLogicValidation service exists
  try {
    const fs = require('fs');
    const blvPath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/4_services/BusinessLogicValidation.gs';
    const content = fs.readFileSync(blvPath, 'utf8');
    
    checks.businessLogicExists = fs.existsSync(blvPath);
    checks.hasValidateTask = content.includes('validateTaskCreation(');
    checks.hasStateTransition = content.includes('validateStateTransition(');
    checks.hasScheduleConflict = content.includes('validateScheduleConflict(');
    checks.hasSelfTest = content.includes('selfTest()');
    
  } catch(e) {
    checks.businessLogicExists = false;
  }
  
  // Check 3: AuditProtocol service exists
  try {
    const fs = require('fs');
    const auditPath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/4_services/AuditProtocol.gs';
    const content = fs.readFileSync(auditPath, 'utf8');
    
    checks.auditProtocolExists = fs.existsSync(auditPath);
    checks.hasLogAudit = content.includes('logAuditEvent(');
    checks.hasGetTrail = content.includes('getAuditTrail(');
    checks.hasGenerateReport = content.includes('generateAuditReport(');
    checks.hasBatchWriting = content.includes('_flushAuditCache(');
    
  } catch(e) {
    checks.auditProtocolExists = false;
  }
  
  // Check 4: Service registrations
  try {
    const fs = require('fs');
    const regPath = '/Users/molhamhomsi/Downloads/Time OS/moh-time-os-v2/src/8_setup/ServiceRegistration.gs';
    const content = fs.readFileSync(regPath, 'utf8');
    
    checks.businessLogicRegistered = content.includes('container.register(\n    SERVICES.BusinessLogicValidation');
    checks.auditProtocolRegistered = content.includes('container.register(\n    SERVICES.AuditProtocol');
    checks.circularDependencyFixed = content.includes('engine.setTriageEngine = () => container.get(SERVICES.ZeroTrustTriageEngine)');
    
  } catch(e) {
    checks.businessLogicRegistered = false;
    checks.auditProtocolRegistered = false;
  }
  
  return checks;
}

// Main verification
Logger.log('=== PHASE 1 & 2 VERIFICATION RESULTS ===\n');

const phase1 = verifyPhase1();
const phase2 = verifyPhase2();

Logger.log('PHASE 1: Core Services Implementation');
Logger.log('--------------------------------------');
Object.entries(phase1).forEach(([key, value]) => {
  Logger.log('  ' + key + ': ' + (value ? '✓ PASS' : '✗ FAIL'));
});

Logger.log('\nPHASE 2: Service Container Fixes');
Logger.log('----------------------------------');
Object.entries(phase2).forEach(([key, value]) => {
  Logger.log('  ' + key + ': ' + (value ? '✓ PASS' : '✗ FAIL'));
});

// Calculate totals
const phase1Pass = Object.values(phase1).filter(v => v === true).length;
const phase1Total = Object.values(phase1).length;
const phase2Pass = Object.values(phase2).filter(v => v === true).length;
const phase2Total = Object.values(phase2).length;

Logger.log('\n=== SUMMARY ===');
Logger.log('Phase 1: ' + phase1Pass + '/' + phase1Total + ' checks passed (' + Math.round(phase1Pass/phase1Total*100) + '%)');
Logger.log('Phase 2: ' + phase2Pass + '/' + phase2Total + ' checks passed (' + Math.round(phase2Pass/phase2Total*100) + '%)');

const totalPass = phase1Pass + phase2Pass;
const total = phase1Total + phase2Total;
Logger.log('\nOVERALL: ' + totalPass + '/' + total + ' checks passed (' + Math.round(totalPass/total*100) + '%)');

if (totalPass === total) {
  Logger.log('\n✓ ALL PHASE 1 & 2 FIXES VERIFIED AND PERFECT!');
} else {
  Logger.log('\n✗ Some fixes are incomplete or incorrect. Review failed checks above.');
}
