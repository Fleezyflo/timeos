#!/bin/bash

echo "=========================================="
echo "MOH TIME OS v2.0 - Running All Tests"
echo "=========================================="

# List of functions to test
functions=(
    "completeSetup"
    "runFinalProductionTest"
    "testAllFunctions"
    "runConsoleEliminationVerification"
    "runSystemValidationSuite"
    "runDeploymentValidation"
    "runMasterTestOrchestrator"
    "verifyConsoleElimination"
    "getConsoleEliminationStatus"
)

echo "Attempting to run functions via clasp..."

for func in "${functions[@]}"; do
    echo ""
    echo "Running: $func"
    echo "-------------------"
    clasp run "$func" 2>&1 | head -20
done

echo ""
echo "=========================================="
echo "Fetching execution logs..."
echo "=========================================="
clasp logs 2>&1 | tail -100

echo ""
echo "Test execution complete."
echo "Please check the Google Apps Script editor for detailed logs:"
echo "https://script.google.com/d/1pK-7rP3H5ix7RyLGy8JrGR47a-PLQG-wc0ZkIPh19jyN_GUYxvsu6MPF/edit"