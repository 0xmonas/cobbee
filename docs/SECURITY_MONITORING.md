# 🔒 Security Monitoring & Testing

Professional security monitoring setup for Cobbee platform.

## 📋 Table of Contents

- [Automated Testing](#automated-testing)
- [CI/CD Integration](#cicd-integration)
- [Production Monitoring](#production-monitoring)
- [Alerting Setup](#alerting-setup)
- [Security Tools](#security-tools)
- [Best Practices](#best-practices)

---

## 🤖 Automated Testing

### Local Security Tests

Run comprehensive security tests locally:

```bash
# Make script executable
chmod +x scripts/security-tests.sh

# Run tests against local server
./scripts/security-tests.sh

# Run tests against staging
BASE_URL=https://staging.cobbee.fun ./scripts/security-tests.sh

# Run tests against production
BASE_URL=https://cobbee.fun ./scripts/security-tests.sh
```

### Test Results

Test results are saved to `test-results/security-report-YYYYMMDD_HHMMSS.json`

Example report:
```json
{
  "timestamp": "2025-11-18T10:30:00Z",
  "base_url": "https://cobbee.fun",
  "tests": [
    {
      "test": "Admin Dashboard",
      "method": "GET",
      "endpoint": "/admin",
      "expected_status": 307,
      "actual_status": 307,
      "result": "PASS"
    }
  ],
  "summary": {
    "total": 10,
    "passed": 10,
    "failed": 0,
    "success_rate": 100.00
  }
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions

Security tests run automatically on:
- ✅ Every push to `main` or `develop`
- ✅ Every pull request
- ✅ Daily at 2:00 AM (scheduled)

Configuration: `.github/workflows/security-tests.yml`

### Included Checks

1. **npm audit** - Dependency vulnerability scanning
2. **TruffleHog** - Secret scanning
3. **CodeQL** - Static code analysis
4. **Dependency Review** - New dependency security review
5. **Admin Security Tests** - Custom endpoint security tests

### Viewing Results

1. Go to GitHub → Actions tab
2. Click on latest workflow run
3. View security test results
4. Download artifacts for detailed reports

---

## 📊 Production Monitoring

### 1. Sentry Setup

**Real-time error & security monitoring**

```bash
# Install
pnpm add @sentry/nextjs

# Configure
npx @sentry/wizard@latest -i nextjs
```

Add to `.env.local`:
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Features:**
- Real-time error tracking
- Security event monitoring
- Performance monitoring
- User feedback
- Release tracking

### 2. Datadog Setup

**Application Performance Monitoring (APM)**

```bash
# Install
pnpm add dd-trace
```

Add to `.env.local`:
```env
DATADOG_API_KEY=your-api-key
DATADOG_SERVICE=cobbee-production
```

**Features:**
- Infrastructure monitoring
- APM & distributed tracing
- Log management
- Security monitoring
- Real-time dashboards

### 3. Vercel Analytics

**Built-in analytics (already configured)**

```env
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-id
```

---

## 🚨 Alerting Setup

### 1. Slack Notifications

**Setup:**
1. Go to https://api.slack.com/messaging/webhooks
2. Create incoming webhook for your channel
3. Add to `.env.local`:

```env
SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Triggered on:**
- ⚠️  Failed admin access attempts
- 🔴 Critical security events
- 📊 Daily security summary

### 2. Email Alerts (SendGrid)

```env
SENDGRID_API_KEY=your-api-key
ALERT_EMAIL_TO=admin@cobbee.fun
```

### 3. SMS Alerts (Twilio)

For critical events:

```env
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
ALERT_PHONE_NUMBERS=+1234567890
```

### 4. PagerDuty Integration

For on-call alerts:

```env
PAGERDUTY_INTEGRATION_KEY=your-key
```

---

## 🛠️ Security Tools

### 1. OWASP ZAP (Penetration Testing)

```bash
# Install Docker
docker pull owasp/zap2docker-stable

# Run automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://cobbee.fun
```

### 2. Burp Suite (Manual Testing)

Professional tool for security testing:
- Download: https://portswigger.net/burp
- Configure proxy
- Test admin endpoints manually

### 3. npm audit

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically
pnpm audit --fix

# View detailed report
pnpm audit --json > audit-report.json
```

### 4. Snyk (Continuous Security)

```bash
# Install
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

---

## 📈 Monitoring Dashboard

### Recommended Tools

1. **Grafana** - Custom dashboards
   - Admin login attempts
   - Failed authentications
   - Rate limit triggers
   - Response times

2. **Datadog Dashboard**
   - Infrastructure metrics
   - Application performance
   - Security events
   - Error rates

3. **Sentry Dashboard**
   - Error frequency
   - User impact
   - Release health
   - Performance issues

---

## 🎯 Best Practices

### 1. Regular Security Audits

```bash
# Weekly
pnpm audit
./scripts/security-tests.sh

# Monthly
# - Review access logs
# - Update dependencies
# - Test disaster recovery

# Quarterly
# - External security audit
# - Penetration testing
# - Update security policies
```

### 2. Incident Response

**When security alert triggers:**

1. ✅ Acknowledge alert immediately
2. ✅ Check audit logs (`/admin/audit`)
3. ✅ Identify threat source
4. ✅ Mitigate (block IP, revoke access)
5. ✅ Document incident
6. ✅ Post-incident review

### 3. Access Management

```bash
# Rotate admin wallets quarterly
# Update ADMIN_WALLET_ADDRESSES in .env

# Monitor for:
- Unusual login times
- Multiple failed attempts
- Access from new locations
- Bulk data exports
```

### 4. Data Backup

```bash
# Daily automated backups
# Test restore procedure monthly
# Off-site backup storage
# Encrypted backups
```

---

## 📝 Compliance

### GDPR Compliance
- ✅ Audit logs (7 years retention)
- ✅ User data access controls
- ✅ Right to be forgotten
- ✅ Data breach notifications

### SOC 2 Compliance
- ✅ Access controls
- ✅ Audit trails
- ✅ Incident response
- ✅ Monitoring & alerting

---

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Web3 Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)

---

## 🆘 Support

For security concerns:
- 🔐 Email: security@cobbee.fun
- 🐛 Bug Bounty: https://cobbee.fun/security
- 📚 Docs: https://docs.cobbee.fun/security
