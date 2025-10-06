#!/bin/bash
echo "🚀 Triggering all test functions programmatically via existing triggers..."

# The triggers are already installed and running automatically
# Let's just wait and pull logs

echo "⏳ Waiting 10 seconds for triggers to fire..."
sleep 10

echo "📊 Pulling logs..."
clasp logs --simplified 2>&1 | tail -200
