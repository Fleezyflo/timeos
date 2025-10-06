#!/bin/bash
#
# MOH TIME OS v2.0 - AUTOMATED DEPLOYMENT SCRIPT
#
# Fully automated deployment and testing for container-bound web app
# Usage: ./deploy.sh
#
# Requirements:
# - clasp CLI installed and authenticated
# - Working directory: moh-time-os-v2/
#

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment ID (latest working)
DEPLOYMENT_ID="AKfycbz_GpWVnbWRks-KrgqlO9v40cA_n0rMabccZKcCfm-FdJZj7mPNq5mT6n-AqLMcxq1t"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}MOH TIME OS v2.0 - AUTOMATED DEPLOYMENT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Step 1: Push code to Apps Script
echo -e "${YELLOW}[1/4] Pushing code to Apps Script...${NC}"
if clasp push --force; then
    echo -e "${GREEN}✅ Code pushed successfully${NC}"
else
    echo -e "${RED}❌ Code push failed${NC}"
    exit 1
fi
echo ""

# Step 2: Update deployment
echo -e "${YELLOW}[2/4] Updating web app deployment...${NC}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEPLOY_OUTPUT=$(clasp deploy -i "$DEPLOYMENT_ID" -d "Automated deployment $TIMESTAMP" 2>&1)

if echo "$DEPLOY_OUTPUT" | grep -q "Updated deployment"; then
    echo -e "${GREEN}✅ Deployment updated: $DEPLOYMENT_ID${NC}"
else
    echo -e "${RED}❌ Deployment update failed${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi
echo ""

# Step 3: Extract and display web app URL
echo -e "${YELLOW}[3/4] Retrieving web app URL...${NC}"
# The URL pattern for Apps Script web apps
WEB_APP_URL="https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec"
echo -e "${GREEN}🌐 Web App URL: ${WEB_APP_URL}${NC}"
echo ""

# Step 4: Run backend tests
echo -e "${YELLOW}[4/4] Running backend tests via clasp...${NC}"
echo -e "${BLUE}Note: This executes RUN_ALL_BACKEND_TESTS() in the Apps Script environment${NC}"

# Attempt to run tests (may require Apps Script API to be enabled)
if clasp run RUN_ALL_BACKEND_TESTS 2>/dev/null; then
    echo -e "${GREEN}✅ Backend tests executed${NC}"
else
    echo -e "${YELLOW}⚠️  Could not execute tests via clasp run (may require Apps Script API)${NC}"
    echo -e "${BLUE}📝 To run tests manually:${NC}"
    echo -e "${BLUE}   1. Open Apps Script IDE: clasp open${NC}"
    echo -e "${BLUE}   2. Run function: RUN_ALL_BACKEND_TESTS${NC}"
fi
echo ""

# Final summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Details:${NC}"
echo -e "   Deployment ID: ${DEPLOYMENT_ID}"
echo -e "   Timestamp:     ${TIMESTAMP}"
echo -e "   Web App URL:   ${WEB_APP_URL}"
echo ""
echo -e "${BLUE}🧪 Next Steps:${NC}"
echo -e "   1. Verify deployment: ./verify-deployment.sh"
echo -e "   2. Open web app:      open ${WEB_APP_URL}"
echo -e "   3. View logs:         clasp logs"
echo ""
