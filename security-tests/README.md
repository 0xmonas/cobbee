# 🔒 Cobbee Security Test Suite

## Overview

This directory contains security penetration tests for the Cobbee admin authentication system.

## Tests Included

### 1. **Direct Admin Access (Unauthenticated)**
- Attempts to access `/admin` without authentication
- Expected: 302 redirect to login or 401/403 error

### 2. **CORS Attack**
- Tries to read admin data from external origin (`https://evil-attacker.com`)
- Expected: CORS headers block external origins

### 3. **Fake Cookie Injection**
- Attempts to inject forged Supabase session cookies
- Expected: Fake JWT signatures are rejected

### 4. **SQL Injection (Wallet Parameter)**
- Tests for SQL injection vulnerabilities in wallet address validation
- Payloads: `' OR '1'='1`, `'; DROP TABLE users; --`, etc.
- Expected: All malicious payloads sanitized/rejected

### 5. **Environment Variable Exposure**
- Checks if `ADMIN_WALLET_ADDRESSES` env var is publicly accessible
- Endpoints tested: `/api/env`, `/.env`, `/.env.local`, etc.
- Expected: Env vars not exposed via HTTP

### 6. **Wallet Enumeration**
- Attempts to enumerate valid admin wallets via timing/response differences
- Expected: No information leakage about wallet validity

### 7. **Session Fixation**
- Tries to fix a user's session to a known session ID
- Expected: Session IDs regenerated on login

## Running Tests

### Against Production (cobbee.fun)
```bash
pnpm security:test:prod
```

### Against Local Development
```bash
# First, edit the script to use localhost
# Change: const TARGET_URL = 'http://localhost:3000'

pnpm security:test
```

## Expected Results

**All tests should PASS (show ✅)** for a secure system:

```
✅ Direct Admin Access (No Auth)
✅ CORS Attack (Evil Origin)
✅ Fake Cookie Injection
✅ SQL Injection (Wallet Parameter)
✅ Environment Variable Exposure
✅ Wallet Enumeration
✅ Session Fixation

Security Score: 100%
```

## Results

Test results are automatically saved to `security-test-results.json` with:
- Timestamp
- Individual test results
- HTTP status codes
- Pass/fail summary

## Security Checklist

- [ ] All 7 tests pass with 100% score
- [ ] ADMIN_WALLET_ADDRESSES env var is set and secret
- [ ] Supabase RLS policies are enabled
- [ ] Admin routes protected by proxy.ts middleware
- [ ] No admin endpoints exposed without authentication
- [ ] Session cookies are HttpOnly and Secure
- [ ] CORS policies restrict external origins

## Adding New Tests

To add a new security test:

1. Create a new async function `testN_YourTestName()`
2. Add it to `runAllTests()` execution
3. Push result to `results[]` array with format:
   ```typescript
   results.push({
     testName: 'Your Test Name',
     passed: boolean,
     details: 'Description of result',
     httpStatus?: number,
   })
   ```

## Threat Model

This test suite validates protection against:

- ✅ Unauthenticated access
- ✅ CORS attacks from external sites
- ✅ Session hijacking/forgery
- ✅ SQL injection
- ✅ Environment variable leakage
- ✅ Brute force enumeration
- ✅ Session fixation

**Not tested** (require manual review):
- CSRF attacks (Next.js CSRF tokens)
- XSS attacks (React auto-escaping)
- Rate limiting (requires load testing)
- DDoS protection (infrastructure level)

## Reporting Issues

If any test fails:

1. Review the failed test details in console output
2. Check `security-test-results.json` for specifics
3. Fix the vulnerability in code
4. Re-run tests to verify fix
5. Document the vulnerability and patch in changelog

## License

Internal security tool - Not for public distribution
