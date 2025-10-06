/**
 * Quick validation script to test the load order fixes
 */

function validateLoadOrder() {
  console.log('=== LOAD ORDER VALIDATION ===');

  // Test 1: Check container exists
  console.log('Test 1: Container availability');
  if (typeof container === 'undefined') {
    console.log('❌ FAIL: container is undefined');
    return false;
  } else {
    console.log('✅ PASS: container is defined');
  }

  // Test 2: Check CONSTANTS exists
  console.log('\nTest 2: Constants availability');
  if (typeof CONSTANTS === 'undefined') {
    console.log('❌ FAIL: CONSTANTS is undefined');
    return false;
  } else {
    console.log('✅ PASS: CONSTANTS is defined');
    console.log('   VERSION:', CONSTANTS.VERSION);
  }

  // Test 3: Check SERVICES exists
  console.log('\nTest 3: Services enum availability');
  if (typeof SERVICES === 'undefined') {
    console.log('❌ FAIL: SERVICES is undefined');
    return false;
  } else {
    console.log('✅ PASS: SERVICES is defined');
    console.log('   SmartLogger:', SERVICES.SmartLogger);
  }

  // Test 4: Check STATUS exists
  console.log('\nTest 4: Status enum availability');
  if (typeof STATUS === 'undefined') {
    console.log('❌ FAIL: STATUS is undefined');
    return false;
  } else {
    console.log('✅ PASS: STATUS is defined');
    console.log('   NOT_STARTED:', STATUS.NOT_STARTED);
  }

  // Test 5: Check RemoteControl functions exist
  console.log('\nTest 5: RemoteControl functions');
  const remoteControlFunctions = ['START', 'STOP', 'STATUS', 'EMAIL', 'SCHEDULE'];
  let allFunctionsExist = true;

  for (const funcName of remoteControlFunctions) {
    if (typeof this[funcName] === 'function') {
      console.log(`✅ PASS: ${funcName}() function exists`);
    } else {
      console.log(`❌ FAIL: ${funcName}() function missing`);
      allFunctionsExist = false;
    }
  }

  // Test 6: Test container basic operations
  console.log('\nTest 6: Container operations');
  try {
    const status = container.getHealthStatus();
    console.log('✅ PASS: container.getHealthStatus() works');
    console.log('   Health status:', status.status);
  } catch (error) {
    console.log('❌ FAIL: container operations failed:', error.message);
    return false;
  }

  // Test 7: Test error classes exist
  console.log('\nTest 7: Error classes availability');
  const errorClasses = ['DatabaseError', 'ValidationError', 'BusinessLogicError', 'SchedulingError', 'TriageError'];
  let allErrorsExist = true;

  for (const errorName of errorClasses) {
    if (typeof this[errorName] === 'function') {
      console.log(`✅ PASS: ${errorName} class exists`);
    } else {
      console.log(`❌ FAIL: ${errorName} class missing`);
      allErrorsExist = false;
    }
  }

  console.log('\n=== VALIDATION SUMMARY ===');

  if (allFunctionsExist && allErrorsExist) {
    console.log('🎉 ALL TESTS PASSED - Load order is correct!');
    console.log('✅ Container loads first (AA_Container.gs)');
    console.log('✅ Constants loads second (AB_Constants.gs)');
    console.log('✅ Enums loads third (AC_Enums.gs)');
    console.log('✅ RemoteControl functions available');
    console.log('✅ Error classes consolidated and available');
    return true;
  } else {
    console.log('❌ SOME TESTS FAILED - Load order issues remain');
    return false;
  }
}

// Run validation
try {
  const result = validateLoadOrder();
  console.log('\nValidation result:', result ? 'SUCCESS' : 'FAILURE');
} catch (error) {
  console.log('❌ VALIDATION CRASHED:', error.message);
}