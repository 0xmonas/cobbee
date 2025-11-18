#!/bin/bash

###########################################
# Admin Security Test Suite
# Automated security testing for admin endpoints
###########################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TEST_RESULTS_DIR="test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="${TEST_RESULTS_DIR}/security-report-${TIMESTAMP}.json"

# Create results directory
mkdir -p "${TEST_RESULTS_DIR}"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# JSON report
echo "{" > "${REPORT_FILE}"
echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "${REPORT_FILE}"
echo "  \"base_url\": \"${BASE_URL}\"," >> "${REPORT_FILE}"
echo "  \"tests\": [" >> "${REPORT_FILE}"

###########################################
# Helper Functions
###########################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"

    TESTS_RUN=$((TESTS_RUN + 1))

    log_info "Testing: ${test_name}"

    local curl_cmd="curl -s -X ${method} ${BASE_URL}${endpoint}"

    if [ -n "$data" ]; then
        curl_cmd="${curl_cmd} -H 'Content-Type: application/json' -d '${data}'"
    fi

    curl_cmd="${curl_cmd} -w '\n%{http_code}' -o /dev/null"

    local status_code=$(eval $curl_cmd)

    # Write to JSON report
    if [ $TESTS_RUN -gt 1 ]; then
        echo "," >> "${REPORT_FILE}"
    fi

    echo "    {" >> "${REPORT_FILE}"
    echo "      \"test\": \"${test_name}\"," >> "${REPORT_FILE}"
    echo "      \"method\": \"${method}\"," >> "${REPORT_FILE}"
    echo "      \"endpoint\": \"${endpoint}\"," >> "${REPORT_FILE}"
    echo "      \"expected_status\": ${expected_status}," >> "${REPORT_FILE}"
    echo "      \"actual_status\": ${status_code}," >> "${REPORT_FILE}"

    if [ "$status_code" = "$expected_status" ]; then
        log_info "✅ PASSED - Expected ${expected_status}, got ${status_code}"
        echo "      \"result\": \"PASS\"" >> "${REPORT_FILE}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "❌ FAILED - Expected ${expected_status}, got ${status_code}"
        echo "      \"result\": \"FAIL\"" >> "${REPORT_FILE}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi

    echo "    }" >> "${REPORT_FILE}"
}

###########################################
# Test Suite
###########################################

log_info "Starting Admin Security Tests..."
log_info "Base URL: ${BASE_URL}"
echo ""

# Test 1: Admin Pages (Unauthenticated)
log_info "=== Testing Admin Pages (Unauthenticated) ==="
test_endpoint "Admin Dashboard" "GET" "/admin" "307"
test_endpoint "Admin Users Page" "GET" "/admin/users" "307"
test_endpoint "Admin Supporters Page" "GET" "/admin/supporters" "307"
test_endpoint "Admin Wallets Page" "GET" "/admin/wallets" "307"
test_endpoint "Admin Analytics Page" "GET" "/admin/analytics" "307"
test_endpoint "Admin Audit Page" "GET" "/admin/audit" "307"
echo ""

# Test 2: Admin API Endpoints (Unauthenticated)
log_info "=== Testing Admin API Endpoints (Unauthenticated) ==="
test_endpoint "Block User API" "POST" "/api/admin/users/test-123/block" "401" '{"reason":"test"}'
test_endpoint "Unblock User API" "POST" "/api/admin/users/test-123/unblock" "401"
test_endpoint "Blacklist Wallet API" "POST" "/api/admin/wallets/blacklist" "401" '{"wallet_address":"0x123","reason":"test"}'
test_endpoint "Unblacklist Wallet API" "POST" "/api/admin/wallets/unblacklist" "401" '{"wallet_address":"0x123"}'
echo ""

# Test 3: Rate Limiting
log_info "=== Testing Rate Limiting ==="
log_info "Sending 5 rapid requests to test rate limiting..."
for i in {1..5}; do
    status=$(curl -s -X POST "${BASE_URL}/api/admin/wallets/blacklist" \
        -H "Content-Type: application/json" \
        -d '{"wallet_address":"0x123","reason":"test"}' \
        -w '%{http_code}' -o /dev/null)

    if [ "$status" = "429" ]; then
        log_info "✅ Request $i: Rate limited (429) - Working correctly"
        break
    elif [ "$status" = "401" ]; then
        log_info "⚠️  Request $i: Unauthorized (401) - Auth check before rate limit"
    else
        log_warn "⚠️  Request $i: Status $status"
    fi

    sleep 0.1
done
echo ""

# Test 4: Security Headers
log_info "=== Testing Security Headers ==="
headers=$(curl -s -I "${BASE_URL}/admin" | grep -E "X-Frame-Options|X-Content-Type-Options|Content-Security-Policy")
if echo "$headers" | grep -q "X-Frame-Options"; then
    log_info "✅ X-Frame-Options header present"
else
    log_error "❌ X-Frame-Options header missing"
fi

if echo "$headers" | grep -q "X-Content-Type-Options"; then
    log_info "✅ X-Content-Type-Options header present"
else
    log_error "❌ X-Content-Type-Options header missing"
fi

if echo "$headers" | grep -q "Content-Security-Policy"; then
    log_info "✅ Content-Security-Policy header present"
else
    log_error "❌ Content-Security-Policy header missing"
fi
echo ""

###########################################
# Generate Report
###########################################

echo "  ]," >> "${REPORT_FILE}"
echo "  \"summary\": {" >> "${REPORT_FILE}"
echo "    \"total\": ${TESTS_RUN}," >> "${REPORT_FILE}"
echo "    \"passed\": ${TESTS_PASSED}," >> "${REPORT_FILE}"
echo "    \"failed\": ${TESTS_FAILED}," >> "${REPORT_FILE}"
echo "    \"success_rate\": $(awk "BEGIN {printf \"%.2f\", ($TESTS_PASSED/$TESTS_RUN)*100}")" >> "${REPORT_FILE}"
echo "  }" >> "${REPORT_FILE}"
echo "}" >> "${REPORT_FILE}"

###########################################
# Summary
###########################################

log_info "========================================"
log_info "Test Summary"
log_info "========================================"
log_info "Total Tests: ${TESTS_RUN}"
log_info "Passed: ${GREEN}${TESTS_PASSED}${NC}"
log_info "Failed: ${RED}${TESTS_FAILED}${NC}"
log_info "Success Rate: $(awk "BEGIN {printf \"%.2f%%\", ($TESTS_PASSED/$TESTS_RUN)*100}")"
log_info "Report saved to: ${REPORT_FILE}"
log_info "========================================"

# Exit with error if any tests failed
if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
fi

exit 0
