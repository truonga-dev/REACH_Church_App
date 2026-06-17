# Security & Compliance Guide - REACH Church Vietnam

**Last Updated:** June 5, 2026  
**Version:** 1.0.0

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Compliance Requirements](#compliance-requirements)
5. [Security Best Practices](#security-best-practices)
6. [Incident Response](#incident-response)

---

## Security Overview

### Security Principles

```
1. Zero Trust: Verify every request
2. Defense in Depth: Multiple security layers
3. Least Privilege: Minimum necessary access
4. Principle of Least Exposure: Minimize attack surface
5. Secure by Default: Security as default, not optional
```

### Security Layers

```
┌─────────────────────────────────────────┐
│ 1. Network Security (Firewall, WAF)     │
├─────────────────────────────────────────┤
│ 2. Transport Security (TLS/HTTPS)       │
├─────────────────────────────────────────┤
│ 3. Authentication (JWT tokens)          │
├─────────────────────────────────────────┤
│ 4. Authorization (RBAC, RLS)            │
├─────────────────────────────────────────┤
│ 5. Data Encryption (At rest & in transit)│
├─────────────────────────────────────────┤
│ 6. Audit Logging (Activity tracking)    │
└─────────────────────────────────────────┘
```

---

## Authentication & Authorization

### Authentication Methods

**1. Email & Password**
```
User Registration:
  Email validation → Password hash (bcrypt) → Store in Supabase

User Login:
  Email/Password validation → JWT token generation
  Token contains: user_id, email, role, exp (1 hour)
  Refresh token (30 days) to get new access token

Token Structure:
  Header: { "alg": "HS256", "typ": "JWT" }
  Payload: { "user_id": "...", "role": "user", "exp": ... }
  Signature: HMAC-SHA256
```

**2. Password Security**
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers
- Salted & hashed with bcrypt
- Never stored in plain text
- Reset via email verification

**3. Session Management**
```typescript
// AuthContext manages user session
const [user, setUser] = useState<User | null>(null)
const [token, setToken] = useState<string | null>(null)

// Persisted in sessionStorage (cleared on browser close)
sessionStorage.setItem('auth_token', token)

// Auto-refresh before expiry
useEffect(() => {
  const timer = setInterval(refreshToken, 50 * 60 * 1000) // 50 mins
  return () => clearInterval(timer)
}, [])
```

### Authorization & RBAC

**User Roles:**

| Role | Permissions | Examples |
|------|-------------|----------|
| user | Read public content, create prayer requests, manage own profile | Regular member |
| moderator | Review prayer requests, moderate comments | Prayer team lead |
| admin | All operations, user management, content creation | Pastoral staff |

**Row-Level Security (RLS):**

```sql
-- Users see only their own data
CREATE POLICY "Users can view own data"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins see all data
CREATE POLICY "Admins can view all data"
  ON public.user_profiles
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

---

## Data Protection

### Encryption at Rest

```
Database Level:
├─ Column encryption for sensitive data
├─ Transparent Data Encryption (TDE)
├─ Backup encryption

Application Level:
├─ PII (Personal Identifiable Information) encrypted
├─ Sensitive fields: passwords, API keys
└─ Encryption key rotation (monthly)
```

### Encryption in Transit

```
TLS 1.3 (Minimum TLS 1.2)
├─ HTTPS for all connections
├─ Certificate: Let's Encrypt (auto-renewal)
├─ HSTS enabled (Strict-Transport-Security)
└─ Certificate pinning (for mobile PWA)
```

### Data Classification

```
Public:
  - Devotionals, sermons, news
  - Bible content
  - Ministry schedules

Confidential:
  - User profiles
  - Prayer requests
  - Email addresses

Restricted:
  - Passwords (never log)
  - API keys (vault only)
  - Payment information
```

### Secrets Management

```
Secrets stored in:
├─ GitHub Secrets (for CI/CD)
├─ Environment variables (production)
├─ Vault service (long-term)

Never commit:
├─ API keys
├─ Database credentials
├─ JWT secrets
├─ Passwords

Rotation schedule:
├─ API keys: quarterly
├─ Passwords: annual (or after incident)
├─ Certificates: automatic
```

---

## Compliance Requirements

### GDPR (General Data Protection Regulation)

**Applicable if:** Have EU users or data

**Key Requirements:**

1. **Consent**
   - [ ] Privacy policy clearly states data usage
   - [ ] Opt-in for emails/marketing
   - [ ] Consent saved with timestamp

2. **Data Rights**
   - [ ] Users can request data export (SAR)
   - [ ] Users can request deletion (right to be forgotten)
   - [ ] Users can opt-out at any time

3. **Data Protection**
   - [ ] DPA with Supabase
   - [ ] Data processing agreement
   - [ ] Breach notification plan

4. **Privacy Policy**
   ```
   Must include:
   - What data is collected
   - How it's used
   - How long it's retained
   - Third-party services
   - User rights
   - Contact for data requests
   ```

**Implementation:**

```typescript
// Example: Data export endpoint
export async function exportUserData(userId: string) {
  const profile = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return {
    profile,
    preferences,
    highlights,
    prayers,
    donations,
  }
}
```

### CCPA (California Consumer Privacy Act)

**Applicable if:** Have California users

**Key Requirements:**
- Disclose data collection (at collection time)
- Allow data deletion requests
- Provide "Do Not Sell" option
- No discrimination for exercising rights

### Local Regulations (Vietnam)

**Key Requirements:**
- Data localization: Data must be stored in Vietnam
- Cross-border transfers: Restricted
- Personal data: Special protection required

---

## Security Best Practices

### Code Security

✅ **Do's:**
```typescript
// ✅ Input validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// ✅ SQL injection prevention (use parameterized queries)
const result = await supabase
  .from('users')
  .select('*')
  .eq('email', email)  // Parameterized

// ✅ CORS properly configured
app.use(cors({
  origin: ['https://reach-church.com'],
  credentials: true,
}))
```

❌ **Don'ts:**
```typescript
// ❌ Concatenating SQL
const query = `SELECT * FROM users WHERE email = '${email}'`

// ❌ Logging sensitive data
console.log('Password:', password)
logger.info('User created', { password })

// ❌ Storing API keys in code
const apiKey = 'sk-xxxxx'
```

### API Security

```
Rate Limiting:
├─ 100 req/hour for unauthenticated
├─ 1000 req/hour for authenticated
├─ 100 req/minute for sensitive operations

Request Validation:
├─ Content-Type check
├─ Body size limits (max 1MB)
├─ Query parameter validation

Response Security:
├─ No sensitive data in error messages
├─ No API keys in responses
├─ Security headers (X-Content-Type-Options, etc.)
```

### Infrastructure Security

```
Network:
├─ Private databases (no public IP)
├─ VPC/networking for isolation
├─ Network policies (deny all, allow specific)

Secrets:
├─ Never in code/git
├─ Environment variables only
├─ Rotation policy

Monitoring:
├─ Intrusion detection
├─ Anomaly detection
├─ Real-time alerts
```

---

## Vulnerability Management

### Dependency Scanning

```bash
# Regular scans
npm audit
npm audit fix

# Automated scanning
# Snyk integration in CI/CD
# GitHub Dependabot

# Version updates
npm update --save  # Minor/patch
npm upgrade --save  # Major (manual)
```

### Security Testing

```bash
# Static analysis
npm run lint

# Dependency check
npm audit

# OWASP scanning
# Manual penetration testing (quarterly)

# Secrets scanning
# Pre-commit hooks to prevent leaks
```

### Vulnerability Disclosure

```
If found, please report to:
Email: security@reach-church.com
GPG Key: [available on website]

Do not:
- Publish vulnerability publicly
- Access data beyond testing
- Run DOS attacks
```

---

## Incident Response

### Incident Classification

```
Critical:
  - Database breach
  - Application compromise
  - Massive data loss
  - Recovery Time Objective (RTO): < 1 hour

High:
  - Security vulnerability (not yet exploited)
  - Unauthorized access (limited scope)
  - RTO: < 24 hours

Medium:
  - API abuse/DDoS
  - Configuration error
  - RTO: < 7 days

Low:
  - Minor vulnerabilities
  - Information disclosure
  - RTO: next release
```

### Response Timeline

```
Detection (T+0)
  ↓ (< 5 minutes)
Confirmation (T+5)
  ↓ (immediately)
Alert Team (T+10)
  ↓ (< 1 hour for critical)
Containment (T+60)
  ↓ (< 24 hours)
Investigation (T+1d)
  ↓ (< 3 days)
Recovery (T+3d)
  ↓ (< 7 days)
Post-Mortem (T+7d)
  ↓ (< 30 days)
Preventive Actions
```

### Incident Response Plan

**1. Detection & Alert**
```
Automated Detection:
  - Sentry for errors
  - DataDog for anomalies
  - CloudFlare for DDoS
  
Manual Detection:
  - User reports
  - Team notifications
  - Support tickets
```

**2. Investigation**
```
Gather Information:
  - When incident started
  - What systems affected
  - What data exposed
  - Impact scope

Access Logs:
  - supabase dashboard → logs
  - kubectl logs
  - Application logs (ELK)
```

**3. Containment**
```
Immediate Actions:
  - Isolate affected systems
  - Revoke compromised credentials
  - Block malicious IPs
  - Rollback if necessary

Communication:
  - Notify affected users
  - Update status page
  - Media response (if needed)
```

**4. Recovery**
```
Restore from Backup:
  - Test backup first
  - Verify data integrity
  - Gradual restore

Deploy Fixes:
  - Fix vulnerability
  - Deploy security patch
  - Monitor closely
```

**5. Post-Incident**
```
Analysis:
  - Timeline of events
  - Root cause analysis
  - Impact assessment

Preventive Measures:
  - Code changes
  - Process improvements
  - Infrastructure hardening

Documentation:
  - Incident report
  - Lessons learned
  - Preventive actions
```

---

## Security Checklist

### Pre-Launch

- [ ] SSL certificate installed
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CORS properly set
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Secrets not in code
- [ ] Dependencies scanned for vulnerabilities
- [ ] Security audit passed
- [ ] Privacy policy live
- [ ] GDPR compliance reviewed
- [ ] DPA signed with vendors
- [ ] Backup/recovery tested
- [ ] Monitoring active
- [ ] Incident response plan ready

### Ongoing

- [ ] Security updates applied (monthly)
- [ ] Dependency updates checked (weekly)
- [ ] Logs reviewed (daily)
- [ ] Incidents tracked and resolved
- [ ] Training completed by team
- [ ] Penetration testing (annual)

---

## Resources

- 📚 [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- 🔐 [GDPR Documentation](https://gdpr-info.eu/)
- 🛡️ [Supabase Security](https://supabase.com/docs/guides/auth)
- 🔑 [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Questions?** Email: security@reach-church.com
