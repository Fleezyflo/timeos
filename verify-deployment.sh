#!/bin/bash
#
# MOH TIME OS v2.0 - DEPLOYMENT VERIFICATION SCRIPT
#
# Verifies deployment success by testing:
# 1. Backend functions via clasp run
# 2. HTML serving via curl
# 3. Web app accessibility
#
# Usage: ./verify-deployment.sh
#

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Deployment ID
DEPLOYMENT_ID="AKfycbyU4-8CWU36Tr6m_aUax4YRi9s626pco00aBcan1PRu"
WEB_APP_URL="https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}MOH TIME OS v2.0 - DEPLOYMENT VERIFICATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Track results
TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Backend Functions
echo -e "${YELLOW}[1/3] Testing backend functions...${NC}"
echo -e "${BLUE}Running RUN_ALL_BACKEND_TESTS via clasp...${NC}"

if clasp run RUN_ALL_BACKEND_TESTS 2>/dev/null; then
    echo -e "${GREEN}✅ Backend tests executed successfully${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️  Could not run backend tests via clasp${NC}"
    echo -e "${BLUE}Note: Requires Apps Script API enabled${NC}"
    echo -e "${BLUE}To enable: https://script.google.com/home/usersettings${NC}"
    echo -e "${BLUE}Or run manually in Apps Script IDE: clasp open${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 2: HTML Serving
echo -e "${YELLOW}[2/3] Testing HTML serving...${NC}"
echo -e "${BLUE}Fetching: ${WEB_APP_URL}${NC}"

HTTP_RESPONSE=$(curl -s -o /tmp/dayplanner_response.html -w "%{http_code}" "$WEB_APP_URL" 2>/dev/null)

if [ "$HTTP_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ HTTP 200 OK${NC}"

    # Check if response contains HTML
    if grep -q "<!DOCTYPE html" /tmp/dayplanner_response.html 2>/dev/null; then
        echo -e "${GREEN}✅ Valid HTML response${NC}"

        # Check for DayPlanner content
        if grep -q "MOH Time OS" /tmp/dayplanner_response.html 2>/dev/null; then
            echo -e "${GREEN}✅ DayPlanner content detected${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "${YELLOW}⚠️  Expected DayPlanner content not found${NC}"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo -e "${RED}❌ Response is not HTML${NC}"
        echo -e "${BLUE}First 200 chars of response:${NC}"
        head -c 200 /tmp/dayplanner_response.html
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
elif [ "$HTTP_RESPONSE" = "302" ]; then
    echo -e "${YELLOW}⚠️  HTTP 302 Redirect (may require authentication)${NC}"
    echo -e "${BLUE}Try opening in browser: ${WEB_APP_URL}${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${RED}❌ HTTP ${HTTP_RESPONSE}${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 3: Web App Accessibility
echo -e "${YELLOW}[3/3] Checking web app accessibility...${NC}"

# Try to fetch with user-agent
HTTP_RESPONSE_2=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: Mozilla/5.0" \
    "$WEB_APP_URL" 2>/dev/null)

if [ "$HTTP_RESPONSE_2" = "200" ] || [ "$HTTP_RESPONSE_2" = "302" ]; then
    echo -e "${GREEN}✅ Web app is accessible${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ Web app not accessible (HTTP ${HTTP_RESPONSE_2})${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Cleanup
rm -f /tmp/dayplanner_response.html

# Final Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ VERIFICATION PASSED${NC}"
    echo ""
    echo -e "${BLUE}🎉 Deployment is fully functional!${NC}"
    echo -e "${BLUE}Web App URL: ${WEB_APP_URL}${NC}"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  VERIFICATION COMPLETED WITH WARNINGS${NC}"
    echo ""
    echo -e "${BLUE}Some tests failed but deployment may still work.${NC}"
    echo -e "${BLUE}Manual verification recommended:${NC}"
    echo -e "  1. Open web app in browser: ${WEB_APP_URL}"
    echo -e "  2. Open Apps Script IDE: clasp open"
    echo -e "  3. Run function: RUN_ALL_BACKEND_TESTS"
    echo ""
    exit 1
fi
