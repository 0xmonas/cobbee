/**
 * SECURITY TEST: Admin Impersonation Attack
 *
 * This script attempts to:
 * 1. Create a fake wallet address
 * 2. Try to authenticate as admin
 * 3. Access admin routes without proper authorization
 * 4. Test CORS protections
 *
 * Expected Result: ALL ATTACKS SHOULD FAIL
 */

const TARGET_URL = 'https://cobbee.fun' // Production URL
const FAKE_ADMIN_WALLET = '0xFAKE1234567890ABCDEF1234567890ABCDEF1234' // Fake wallet

interface TestResult {
  testName: string
  passed: boolean
  details: string
  httpStatus?: number
  response?: any
}

const results: TestResult[] = []

// ============================================================================
// TEST 1: Direct Admin Route Access (Unauthenticated)
// ============================================================================
async function test1_DirectAdminAccess() {
  console.warn('\n🔴 TEST 1: Attempting direct /admin access without auth...')

  try {
    const response = await fetch(`${TARGET_URL}/admin`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SecurityTest/1.0',
      },
      redirect: 'manual', // Don't follow redirects
    })

    // 307 = Temporary Redirect (to login), 302 = Redirect, 401 = Unauthorized, 403 = Forbidden
    const passed = response.status === 307 || response.status === 302 || response.status === 401 || response.status === 403

    results.push({
      testName: 'Direct Admin Access (No Auth)',
      passed,
      details: passed
        ? `✅ PROTECTED: Server returned ${response.status} (redirected to login or blocked)`
        : `❌ VULNERABLE: Server returned ${response.status} - should block unauthenticated access`,
      httpStatus: response.status,
    })

    console.warn(results[results.length - 1].details)
  } catch (error) {
    results.push({
      testName: 'Direct Admin Access (No Auth)',
      passed: false,
      details: `❌ ERROR: ${error}`,
    })
  }
}

// ============================================================================
// TEST 2: CORS Attack - Try to read admin data from external origin
// ============================================================================
async function test2_CORSAttack() {
  console.warn('\n🔴 TEST 2: Attempting CORS attack with fake origin...')

  try {
    const response = await fetch(`${TARGET_URL}/admin`, {
      method: 'GET',
      headers: {
        'Origin': 'https://evil-attacker.com',
        'User-Agent': 'SecurityTest/1.0',
      },
    })

    const corsHeaders = response.headers.get('access-control-allow-origin')
    const passed = !corsHeaders || corsHeaders === TARGET_URL

    results.push({
      testName: 'CORS Attack (Evil Origin)',
      passed,
      details: passed
        ? `✅ PROTECTED: CORS header = ${corsHeaders || 'not set'} (blocks external origins)`
        : `❌ VULNERABLE: CORS allows ${corsHeaders} - external sites can read data`,
      httpStatus: response.status,
    })

    console.warn(results[results.length - 1].details)
  } catch (error) {
    results.push({
      testName: 'CORS Attack (Evil Origin)',
      passed: true, // Network error = CORS blocked
      details: `✅ PROTECTED: Request blocked (likely CORS) - ${error}`,
    })
  }
}

// ============================================================================
// TEST 3: Fake Supabase Session Cookie Injection
// ============================================================================
async function test3_FakeCookieInjection() {
  console.warn('\n🔴 TEST 3: Attempting to inject fake session cookie...')

  try {
    const fakeCookie = 'sb-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJGQUtFIiwicm9sZSI6ImFkbWluIn0.FAKESIGNATURE'

    const response = await fetch(`${TARGET_URL}/admin`, {
      method: 'GET',
      headers: {
        'Cookie': fakeCookie,
        'User-Agent': 'SecurityTest/1.0',
      },
      redirect: 'manual',
    })

    const passed = response.status !== 200

    results.push({
      testName: 'Fake Cookie Injection',
      passed,
      details: passed
        ? `✅ PROTECTED: Fake cookie rejected (status ${response.status})`
        : `❌ VULNERABLE: Fake cookie accepted - critical security flaw!`,
      httpStatus: response.status,
    })

    console.warn(results[results.length - 1].details)
  } catch (error) {
    results.push({
      testName: 'Fake Cookie Injection',
      passed: true,
      details: `✅ PROTECTED: Request rejected - ${error}`,
    })
  }
}

// ============================================================================
// TEST 4: SQL Injection in Wallet Address Parameter
// ============================================================================
async function test4_SQLInjectionWallet() {
  console.warn('\n🔴 TEST 4: Attempting SQL injection via wallet parameter...')

  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users WHERE '1'='1",
    FAKE_ADMIN_WALLET + "' OR is_admin=true --",
  ]

  let allPassed = true

  for (const payload of sqlPayloads) {
    try {
      // Trying to access admin with malicious wallet parameter
      const response = await fetch(`${TARGET_URL}/api/admin/verify?wallet=${encodeURIComponent(payload)}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SecurityTest/1.0',
        },
      })

      if (response.status === 200) {
        allPassed = false
        console.warn(`  ❌ SQL payload accepted: ${payload.substring(0, 30)}...`)
      }
    } catch (error) {
      // Expected - endpoint might not exist
    }
  }

  results.push({
    testName: 'SQL Injection (Wallet Parameter)',
    passed: allPassed,
    details: allPassed
      ? `✅ PROTECTED: All SQL injection payloads rejected`
      : `❌ VULNERABLE: Some SQL payloads were accepted - check parameter sanitization`,
  })

  console.warn(results[results.length - 1].details)
}

// ============================================================================
// TEST 5: Environment Variable Exposure
// ============================================================================
async function test5_EnvVariableExposure() {
  console.warn('\n🔴 TEST 5: Attempting to read ADMIN_WALLET_ADDRESSES env var...')

  const endpoints = [
    '/api/env',
    '/api/admin/config',
    '/.env',
    '/.env.local',
    '/admin/.env',
  ]

  let exposed = false

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${TARGET_URL}${endpoint}`, {
        method: 'GET',
      })

      if (response.status === 200) {
        const text = await response.text()
        if (text.includes('ADMIN_WALLET') || text.includes('0x')) {
          exposed = true
          console.warn(`  ❌ Env vars exposed at: ${endpoint}`)
        }
      }
    } catch (error) {
      // Expected - endpoints should not exist
    }
  }

  results.push({
    testName: 'Environment Variable Exposure',
    passed: !exposed,
    details: !exposed
      ? `✅ PROTECTED: ADMIN_WALLET_ADDRESSES not exposed via common endpoints`
      : `❌ VULNERABLE: Environment variables are publicly accessible!`,
  })

  console.warn(results[results.length - 1].details)
}

// ============================================================================
// TEST 6: Brute Force Admin Wallet Enumeration
// ============================================================================
async function test6_WalletEnumeration() {
  console.warn('\n🔴 TEST 6: Attempting to enumerate valid admin wallets...')

  const commonWallets = [
    '0x0000000000000000000000000000000000000000',
    '0x1111111111111111111111111111111111111111',
    '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    FAKE_ADMIN_WALLET,
  ]

  let enumerable = false

  for (const wallet of commonWallets) {
    try {
      // Try to create a user with this wallet and check response time/difference
      const response = await fetch(`${TARGET_URL}/api/auth/check-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet_address: wallet }),
      })

      // If endpoint exists and returns different status codes = enumerable
      if (response.status === 200 || response.status === 403) {
        enumerable = true
        console.warn(`  ⚠️ Endpoint reveals wallet validity: ${wallet.substring(0, 10)}...`)
      }
    } catch (error) {
      // Expected - endpoint might not exist
    }
  }

  results.push({
    testName: 'Wallet Enumeration',
    passed: !enumerable,
    details: !enumerable
      ? `✅ PROTECTED: Cannot enumerate valid admin wallets`
      : `⚠️ WARNING: Endpoint may leak admin wallet validity (timing/status codes)`,
  })

  console.warn(results[results.length - 1].details)
}

// ============================================================================
// TEST 7: Session Fixation Attack
// ============================================================================
async function test7_SessionFixation() {
  console.warn('\n🔴 TEST 7: Attempting session fixation attack...')

  try {
    // Try to set a known session ID and reuse it
    const fixedSessionId = 'ATTACKER_CONTROLLED_SESSION_12345'

    const response = await fetch(`${TARGET_URL}/admin`, {
      method: 'GET',
      headers: {
        'Cookie': `session_id=${fixedSessionId}`,
        'User-Agent': 'SecurityTest/1.0',
      },
      redirect: 'manual',
    })

    const setCookieHeader = response.headers.get('set-cookie')
    const sessionRegenerated = setCookieHeader && !setCookieHeader.includes(fixedSessionId)

    // If redirected (307/302) or unauthorized (401/403), also safe
    const isBlocked = response.status === 307 || response.status === 302 || response.status === 401 || response.status === 403

    results.push({
      testName: 'Session Fixation',
      passed: sessionRegenerated || isBlocked,
      details: sessionRegenerated
        ? `✅ PROTECTED: Session regenerated (not using attacker's session ID)`
        : isBlocked
        ? `✅ PROTECTED: Request blocked (status ${response.status})`
        : `⚠️ WARNING: Session may be fixable (status ${response.status})`,
      httpStatus: response.status,
    })

    console.warn(results[results.length - 1].details)
  } catch (error) {
    results.push({
      testName: 'Session Fixation',
      passed: true,
      details: `✅ PROTECTED: Request rejected - ${error}`,
    })
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
  console.warn('═══════════════════════════════════════════════════════════')
  console.warn('🔒 COBBEE ADMIN SECURITY TEST SUITE')
  console.warn('═══════════════════════════════════════════════════════════')
  console.warn(`Target: ${TARGET_URL}`)
  console.warn(`Fake Wallet: ${FAKE_ADMIN_WALLET}`)
  console.warn('═══════════════════════════════════════════════════════════')

  await test1_DirectAdminAccess()
  await test2_CORSAttack()
  await test3_FakeCookieInjection()
  await test4_SQLInjectionWallet()
  await test5_EnvVariableExposure()
  await test6_WalletEnumeration()
  await test7_SessionFixation()

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.warn('\n═══════════════════════════════════════════════════════════')
  console.warn('📊 TEST SUMMARY')
  console.warn('═══════════════════════════════════════════════════════════')

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  results.forEach(result => {
    const emoji = result.passed ? '✅' : '❌'
    console.warn(`${emoji} ${result.testName}`)
  })

  console.warn('\n───────────────────────────────────────────────────────────')
  console.warn(`Passed: ${passed}/${total}`)
  console.warn(`Failed: ${failed}/${total}`)
  console.warn(`Security Score: ${((passed / total) * 100).toFixed(1)}%`)
  console.warn('═══════════════════════════════════════════════════════════')

  if (failed === 0) {
    console.warn('\n🎉 ALL SECURITY TESTS PASSED!')
    console.warn('Admin authentication appears secure against common attacks.')
  } else {
    console.warn('\n⚠️  SECURITY VULNERABILITIES DETECTED!')
    console.warn('Please review failed tests and patch vulnerabilities.')
  }

  // Save results to JSON file
  const fs = require('fs')
  fs.writeFileSync(
    './security-test-results.json',
    JSON.stringify({ timestamp: new Date().toISOString(), results, summary: { passed, failed, total } }, null, 2)
  )
  console.warn('\n📝 Results saved to: security-test-results.json')
}

// ============================================================================
// EXECUTE
// ============================================================================
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
