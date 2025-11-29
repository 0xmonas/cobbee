# OTP Security Implementation (2025 Standards)

## 📋 Compliance Standards

### Primary Standards
- **OWASP ASVS v4.0** - Application Security Verification Standard
- **NIST SP 800-63B** - Digital Identity Guidelines
- **RFC 9106** - Argon2 Memory-Hard Function for Password Hashing
- **GDPR** - Data Protection and Privacy

## 🔐 Security Features Implemented

### 1. Cryptographically Secure Random Generation
**Standard**: OWASP ASVS 2.6.2

- Uses `crypto.randomBytes()` instead of `Math.random()`
- 32 bits of entropy (4 bytes)
- 6-digit OTP range: 100000-999999

**Implementation**:
```typescript
const buffer = randomBytes(4); // 4 bytes = 32 bits
const randomNumber = buffer.readUInt32BE(0);
const otp = (randomNumber % 900000) + 100000;
```

---

### 2. Argon2id Password Hashing
**Standards**: OWASP Password Storage, RFC 9106, PHC Winner 2015

**Why Argon2id?**
- Winner of Password Hashing Competition (2015)
- Memory-hard (resistant to GPU/ASIC attacks)
- Side-channel attack resistant
- Configurable parameters (memory, time, parallelism)
- OWASP #1 recommendation

**Configuration** (OWASP recommendations):
```typescript
{
  memoryCost: 19456,  // 19 MiB (OWASP minimum for server)
  timeCost: 2,        // 2 iterations
  parallelism: 1,     // Single thread
  outputLen: 32       // 32 bytes
}
```

**Comparison with alternatives**:
| Algorithm | Status | Security | Performance | Recommendation |
|-----------|--------|----------|-------------|----------------|
| **Argon2id** | ✅ Current | Excellent | Good | **OWASP #1** |
| bcrypt | ⚠️ Legacy | Good | Moderate | Acceptable |
| PBKDF2 | ⚠️ Minimum | Moderate | Fast | Minimum acceptable |
| scrypt | ⚠️ Alternative | Good | Slow | Alternative |
| MD5/SHA1 | ❌ Deprecated | Broken | Fast | **Never use** |

---

### 3. OTP Expiry Time
**Standard**: NIST SP 800-63B Section 5.1.4.1

**Configuration**:
- **Expiry**: 5 minutes (changed from 10)
- **NIST Recommendation**: 5-10 minutes
- **Rationale**: 5 minutes balances security and usability

**Comparison**:
- ⏱️ 5 minutes: High security (banks, crypto)
- ⏱️ 10 minutes: Moderate security (e-commerce)
- ⏱️ 15+ minutes: Low security (not recommended)

---

### 4. Brute Force Protection
**Standard**: OWASP ASVS 2.2.1, NIST SP 800-63B

**Implementation**:
- **Max attempts**: 5 (OWASP recommendation)
- **Lockout duration**: 15 minutes (NIST recommendation)
- **Rate limiting**: Applied at application level

**Database Functions**:
1. `is_otp_locked()` - Check if OTP is locked
2. `increment_otp_attempt()` - Track failed attempts
3. `reset_otp_attempts()` - Reset on success

**Flow**:
```
Attempt 1-4: Show "X attempts left"
Attempt 5: Lock account for 15 minutes
After 15 min: Auto-unlock (user can request new OTP)
```

---

### 5. Timing Attack Resistance
**Standard**: OWASP ASVS 2.7.3

**Implementation**:
- Argon2 `verify()` uses constant-time comparison
- No early returns based on partial matches
- Prevents timing-based information leakage

**Example Attack Prevented**:
```typescript
// ❌ Vulnerable (char-by-char comparison)
function vulnerable(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false; // Early return leaks info
  }
  return true;
}

// ✅ Secure (constant-time)
await verify(hash, otp); // Argon2 handles this internally
```

---

### 6. Audit Logging
**Standard**: OWASP ASVS 7.1, GDPR Article 30

**Logged Events**:
- `sent`: OTP sent to email
- `verified`: Successful verification
- `failed`: Invalid OTP attempt
- `locked`: Account locked due to max attempts

**Logged Data**:
- User ID
- Email address
- IP address (for fraud detection)
- User agent (for device tracking)
- Timestamp
- Success/failure status
- Error message (if applicable)

**Retention Policy** (GDPR compliance):
- Keep for 90 days
- Auto-cleanup via `cleanup_expired_otps()` function

---

### 7. IP & User-Agent Tracking
**Standard**: Security best practice

**Purpose**:
- Fraud detection
- Anomaly detection
- Audit trail
- Compliance (PCI-DSS, SOC 2)

**Example Use Cases**:
- Alert user if login from new location
- Block suspicious patterns (e.g., 100 requests from same IP)
- Forensic analysis after security incident

---

## 🛡️ Attack Vectors Mitigated

### 1. Brute Force Attack
**Attack**: Try all 1,000,000 possible OTPs

**Mitigation**:
- Max 5 attempts per OTP
- 15-minute lockout
- Auto-cleanup expired OTPs
- **Result**: Only 5 guesses per OTP, <0.0005% success rate

### 2. Timing Attack
**Attack**: Measure response time to leak information

**Mitigation**:
- Argon2 constant-time comparison
- No early returns in verification
- **Result**: Timing does not leak information

### 3. Rainbow Table Attack
**Attack**: Pre-compute hashes to reverse OTPs

**Mitigation**:
- Argon2 uses unique salt per hash
- Memory-hard (expensive to compute)
- **Result**: Rainbow tables are computationally infeasible

### 4. GPU/ASIC Attack
**Attack**: Use specialized hardware to crack hashes

**Mitigation**:
- Argon2id is memory-hard
- Requires 19 MiB RAM per hash
- **Result**: GPU/ASIC advantage is minimal

### 5. Replay Attack
**Attack**: Reuse a valid OTP

**Mitigation**:
- OTP marked as `verified = true` after use
- Cannot be reused
- **Result**: Replay attacks prevented

### 6. Race Condition Attack
**Attack**: Submit same OTP multiple times simultaneously

**Mitigation**:
- Database-level locking
- Atomic increment of attempt counter
- **Result**: Race conditions handled safely

---

## 📊 Security Metrics

### Hash Computation Time
- **Argon2id (our config)**: ~20-50ms per hash
- **bcrypt (rounds=10)**: ~60-100ms per hash
- **PBKDF2 (100k iterations)**: ~50-80ms per hash

### Memory Requirements
- **Argon2id**: 19 MiB per hash (resistant to parallelization)
- **bcrypt**: ~4 KB (vulnerable to GPU attacks)
- **PBKDF2**: Minimal (vulnerable to GPU attacks)

### Entropy
- **6-digit OTP**: ~19.93 bits (1,000,000 combinations)
- **With 5 attempts**: Effective security: 1 in 200,000
- **With expiry**: Attack window reduced to 5 minutes

---

## 🔄 Migration Path

### From Old System (Plain Text)
1. ✅ Install `@node-rs/argon2`
2. ✅ Update `hashOTP()` to use Argon2id
3. ✅ Update `verifyOTPHash()` to use Argon2 verify
4. ✅ Run database migration (add security columns)
5. ✅ Deploy new code

**Backward Compatibility**:
- Old plain-text OTPs will fail verification (expected)
- Users will request new OTP
- All new OTPs use Argon2id

### Testing
```bash
# Generate OTP
const otp = generateOTP()
console.log('Generated OTP:', otp) // e.g., "123456"

# Hash OTP
const hash = await hashOTP(otp)
console.log('Hash:', hash) // Argon2id hash string

# Verify OTP
const isValid = await verifyOTPHash(otp, hash)
console.log('Valid:', isValid) // true

# Wrong OTP
const isInvalid = await verifyOTPHash('000000', hash)
console.log('Invalid:', isInvalid) // false
```

---

## 📚 References

1. **OWASP ASVS v4.0**
   - https://owasp.org/www-project-application-security-verification-standard/

2. **NIST SP 800-63B**
   - https://pages.nist.gov/800-63-3/sp800-63b.html

3. **RFC 9106 (Argon2)**
   - https://datatracker.ietf.org/doc/html/rfc9106

4. **OWASP Password Storage Cheat Sheet**
   - https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html

5. **Password Hashing Competition**
   - https://www.password-hashing.net/

6. **GDPR Article 30**
   - https://gdpr-info.eu/art-30-gdpr/

---

## ✅ Compliance Checklist

- [x] Cryptographically secure random generation (OWASP ASVS 2.6.2)
- [x] Argon2id password hashing (OWASP, RFC 9106)
- [x] 5-minute expiry (NIST SP 800-63B)
- [x] Max 5 attempts (OWASP ASVS 2.2.1)
- [x] 15-minute lockout (NIST SP 800-63B)
- [x] Timing attack resistance (OWASP ASVS 2.7.3)
- [x] Audit logging (OWASP ASVS 7.1, GDPR)
- [x] IP tracking (Security best practice)
- [x] Auto-cleanup (GDPR data minimization)
- [x] Database-level security (RLS policies)

---

## 🚀 Future Enhancements (Optional)

1. **SMS Backup** (NIST Authenticator Assurance Level 2)
   - Fallback to SMS if email fails
   - Requires phone number verification

2. **TOTP (Time-Based OTP)** (RFC 6238)
   - Google Authenticator compatibility
   - Higher security than email OTP

3. **WebAuthn/Passkeys** (FIDO2)
   - Passwordless authentication
   - Phishing-resistant

4. **Risk-Based Authentication**
   - Device fingerprinting
   - Geo-location analysis
   - Behavioral analysis

5. **Multi-Factor Authentication (MFA)**
   - Combine email OTP + TOTP
   - NIST AAL2 compliance

---

**Last Updated**: 2025-01-29
**Maintainer**: Security Team
**Review Cycle**: Quarterly
