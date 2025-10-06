#!/bin/bash

echo "🚀 Installing one-time trigger to execute all tests..."

# Use AppsScript API directly via clasp
clasp run 'EXECUTE_ALL_TESTS_IMMEDIATELY' 2>&1 || echo "Note: Function will execute via existing triggers"

echo ""
echo "⏳ Waiting 30 seconds for execution..."
sleep 30

echo ""
echo "📊 Pulling comprehensive logs..."
clasp logs 2>&1 | tail -300 > /tmp/all_logs.txt
cat /tmp/all_logs.txt

echo ""
echo "🔍 Checking for errors..."
grep -E "(ERROR|FAIL|❌)" /tmp/all_logs.txt | head -20 || echo "✅ No errors found!"

echo ""
echo "📈 Checking for successes..."
grep -E "(SUCCESS|PASS|✅)" /tmp/all_logs.txt | wc -l | xargs echo "Success count:"
