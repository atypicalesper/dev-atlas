# OWASP Top 10

The OWASP Top 10 is the industry-standard awareness document for web application security, published by the Open Web Application Security Project. It is not a checklist of individual bugs but a ranking of the ten broadest, highest-impact *categories* of risk, derived from analysis of hundreds of thousands of real applications plus a practitioner survey. It is referenced by compliance frameworks (PCI-DSS, SOC 2), procurement requirements, and most secure-coding standards, which is why "do you handle the OWASP Top 10?" is one of the most common security interview questions. The current stable edition is **2021**; a **2025** revision reached release-candidate stage and reshuffles the list (covered at the end). The 2021 ordering below is the one to know first — it has been the reference for years and most tooling still maps to it.

```
A01  Broken Access Control                 — acting outside intended permissions
A02  Cryptographic Failures                — weak/missing encryption, exposed data
A03  Injection                             — SQL/NoSQL/OS/LDAP injection, XSS
A04  Insecure Design                       — missing security in the design itself
A05  Security Misconfiguration             — bad defaults, verbose errors, open buckets
A06  Vulnerable and Outdated Components     — dependencies with known CVEs
A07  Identification & Authentication Failures — weak auth, broken sessions
A08  Software & Data Integrity Failures     — unverified updates, insecure deserialization
A09  Security Logging & Monitoring Failures — breaches go undetected
A10  Server-Side Request Forgery (SSRF)     — server fetches attacker-controlled URLs
```

A useful mental model: A01–A03 are the classic "attacker exploits running code" risks, A04–A06 are "the system was built or assembled insecurely," A07–A08 cover identity and the integrity of what you ship, and A09–A10 are detection and a fast-rising network-level risk. Defense in depth means assuming any single control can fail, so most real mitigations combine validation, least privilege, and monitoring rather than relying on one fix.

---

## A01 — Broken Access Control

Broken access control is the act of a user doing something the application never intended to allow — reading another user's record, calling an admin-only endpoint, or escalating their own role. It ranked #1 in 2021 because it is simultaneously the most common finding and among the most damaging: a single missing ownership check can expose every record in a table. The canonical example is **IDOR** (Insecure Direct Object Reference), where the server uses a client-supplied identifier without verifying the requester owns that object. The fix is never client-side hiding — UI that omits a button does nothing to stop a crafted request — but a server-side authorization decision on every request, denied by default.

```typescript
// VULNERABLE — trusts the URL parameter, returns anyone's order
app.get('/api/orders/:id', async (req, res) => {
  const order = await db.order.findById(req.params.id);
  res.json(order); // attacker changes /123 to /124 and reads it
});

// SECURE — scope the query to the authenticated owner; deny by default
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  const order = await db.order.findOne({
    id: req.params.id,
    ownerId: req.user.id,          // ownership enforced in the query
  });
  if (!order) return res.sendStatus(404); // 404, not 403 — don't leak existence
  res.json(order);
});
```

**Defenses:** deny by default and centralize authorization in a policy layer/middleware rather than scattering checks; enforce ownership in the data access itself (`WHERE id = ? AND owner_id = ?`); prefer opaque UUIDs over sequential integer keys; re-validate authorization on every request (never trust prior pages or hidden fields); rate-limit and log access-control failures so probing is visible.

---

## A02 — Cryptographic Failures

Previously called "Sensitive Data Exposure," this category covers everything that goes wrong when protecting data in transit and at rest: transmitting over plain HTTP, storing passwords with fast or broken hashes (MD5, SHA-1, or worse, plaintext), hardcoding keys, using weak algorithms or ECB mode, and failing to rotate secrets. The root question is always *what data needs protecting, and is the right algorithm applied correctly?* Passwords are the most frequent failure point: they must be run through a slow, salted, memory-hard hash so that a database breach does not immediately yield every credential.

```typescript
import argon2 from 'argon2';

// SECURE password storage — argon2id is memory-hard and salted automatically
const hash = await argon2.hash(password, { type: argon2.argon2id });
const ok   = await argon2.verify(hash, attemptedPassword);

// AVOID: md5/sha1/sha256(password), or any unsalted/fast hash
// AVOID: bcrypt with low cost — use cost >= 12 if you must use bcrypt
```

```python
# Python equivalent
from argon2 import PasswordHasher
ph = PasswordHasher()          # argon2id defaults
hash = ph.hash(password)
ph.verify(hash, attempted)     # raises on mismatch
```

**Defenses:** TLS 1.2+ everywhere with HSTS, and encrypt sensitive fields at rest (AES-256-GCM, an authenticated mode — never ECB); use `argon2id` (or `bcrypt` cost ≥ 12) for passwords; keep keys in a managed secret store (Vault, AWS KMS/Secrets Manager) and rotate them, never in source or committed env files; classify data and store the minimum; never log secrets, tokens, or PII.

---

## A03 — Injection

Injection happens whenever untrusted input is interpreted as code or commands by an interpreter — SQL, NoSQL, OS shell, LDAP, or the browser DOM (XSS, folded into this category in 2021). The structural fix is the same across all variants: keep data and code separate so input can never change the *structure* of a query or command. For SQL that means parameterized queries; for the shell it means passing arguments as an array instead of building a command string; for the browser it means contextual output encoding plus a Content-Security-Policy.

```typescript
// VULNERABLE — string interpolation lets input rewrite the query
db.query(`SELECT * FROM users WHERE email = '${email}'`);
// email = "' OR '1'='1"  ->  returns every user

// SECURE — parameterized; the driver binds values, never parses them as SQL
db.query('SELECT * FROM users WHERE email = $1', [email]);

// COMMAND INJECTION — pass args as an array, don't shell out to a string
import { execFile } from 'node:child_process';
execFile('convert', [userFile, '-resize', '100x100', outFile]); // safe
// NOT: exec(`convert ${userFile} ...`)
```

For XSS specifically, rely on framework auto-escaping (React/JSX escapes by default) and avoid `dangerouslySetInnerHTML` / `v-html`; when raw HTML is unavoidable, sanitize with a vetted library (DOMPurify) and serve a strict CSP so injected scripts cannot execute.

**Defenses:** parameterized queries / prepared statements always (and ORMs that bind parameters); validate against allowlists and reject unexpected shapes; contextual output encoding for HTML/JS/URL contexts; a strict CSP as a second layer for XSS; avoid building shell commands from input.

---

## A04 — Insecure Design

Insecure Design was introduced in 2021 to capture flaws that are not implementation bugs but weaknesses in the architecture itself — there is no "patch" because the code does exactly what it was designed to do, and the design is the problem. Examples: a password-reset flow with no rate limit that enables enumeration, a checkout that never caps quantity or price and allows negative totals, or a trust boundary that assumes a mobile client will enforce rules. These are caught by thinking like an attacker *before* writing code: threat modeling, abuse cases, and baking limits and security requirements into the design.

```typescript
// Insecure by design: unlimited reset attempts enable account enumeration + brute force
// Secure design encodes the control as a requirement, e.g.:
//   - max 3 reset requests per account per hour
//   - generic response whether or not the email exists
//   - single-use, short-TTL, cryptographically random tokens
const token = crypto.randomBytes(32).toString('hex'); // unguessable
await store.set(`reset:${token}`, userId, { ttlSeconds: 900 }); // 15 min, one-time
```

**Defenses:** threat-model early (STRIDE) and write misuse/abuse cases alongside user stories; design in limits — rate limiting, quotas, transaction/spend caps, business-rule validation; use established secure design patterns and reference architectures; separate trust boundaries and never rely on the client to enforce security.

---

## A05 — Security Misconfiguration

This is the broadest and one of the most common categories: the code may be fine, but the way it is deployed and configured is not. It includes default or unchanged credentials, verbose error pages that leak stack traces and versions, unnecessary features or ports left enabled, missing security headers, overly permissive CORS, and open cloud storage buckets. Because configuration drifts over time and across environments, the durable fix is repeatable, reviewed, hardened configuration (infrastructure as code) plus automated scanning.

```typescript
import helmet from 'helmet';
app.use(helmet());              // sane security headers: CSP, HSTS, nosniff, etc.

// Generic errors to clients; full detail only in server logs
app.use((err, req, res, _next) => {
  logger.error({ err, path: req.path }); // detailed, server-side
  res.status(500).json({ error: 'Internal Server Error' }); // generic, to client
});

// Tight CORS — never reflect arbitrary origins
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
```

**Defenses:** harden defaults and disable unused features/ports; manage config as code (Terraform/CDK) so it is reviewable and repeatable; set security headers (CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS); return generic errors to clients and keep detail in logs; scan configuration and cloud IAM/bucket policies in CI; separate and lock down environments.

---

## A06 — Vulnerable and Outdated Components

Modern applications are mostly third-party code: a small `package.json` pulls in hundreds of transitive dependencies, any of which may carry a known CVE. This category covers running libraries, frameworks, or runtimes with published vulnerabilities — often the easiest path in, because the exploit is public and the version is detectable. The defense is operational discipline: know exactly what you depend on, watch for advisories, and patch on a cadence rather than only after an incident.

```bash
# Software Composition Analysis in CI
npm audit --omit=dev           # Node — fail the build on high/critical
pip-audit                      # Python — checks installed packages against advisories

# Automate updates and review: Dependabot / Renovate open PRs as CVEs land
```

**Defenses:** run SCA in CI (`npm audit`, `pip-audit`, Snyk) and gate on severity; automate dependency updates (Dependabot/Renovate); maintain an SBOM and remove unused dependencies to shrink the attack surface; pin versions and verify sources; track end-of-life runtimes and upgrade proactively.

---

## A07 — Identification and Authentication Failures

This category covers weaknesses in confirming identity and managing sessions: permitting weak or breached passwords, no protection against credential stuffing or brute force, missing MFA, predictable session tokens, and sessions that are not invalidated on logout or rotated after login. Authentication is high-value to attackers because a single valid session often bypasses every other control, so the bar is layered defenses rather than any one measure.

```typescript
// Harden login: rate-limit + backoff, check against breach lists, support MFA
app.post('/login', loginRateLimiter, async (req, res) => {
  const user = await findUser(req.body.email);
  // constant-time verify regardless of whether the user exists (avoid timing/enumeration)
  const ok = user && await argon2.verify(user.passwordHash, req.body.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' }); // generic
  // issue a short-lived token + rotating refresh token; new session id on auth
});
```

```typescript
// Session cookies: lock them down
res.cookie('sid', sessionId, {
  httpOnly: true,   // not readable by JS (XSS can't steal it)
  secure: true,     // HTTPS only
  sameSite: 'lax',  // CSRF mitigation
  maxAge: 1000 * 60 * 60,
});
```

**Defenses:** offer/enforce MFA; reject weak and known-breached passwords; rate-limit logins with lockout/backoff; use server-side sessions or short-lived signed JWTs with refresh-token rotation, and invalidate on logout; set `HttpOnly`, `Secure`, `SameSite` cookies; return generic auth errors to avoid enumeration.

---

## A08 — Software and Data Integrity Failures

Added in 2021, this category is about trusting code or data whose integrity has not been verified. It includes insecure deserialization (reconstructing objects from untrusted bytes, which can lead to remote code execution), auto-updates and plugins installed without signature checks, dependencies pulled from compromised sources, and — increasingly — CI/CD pipelines that build and deploy with too much trust and too little verification. The SolarWinds and various npm-account-takeover incidents are textbook examples of integrity failures in the supply chain.

```typescript
// Insecure: deserializing untrusted input into live objects
// (native serialization formats can execute code on load)
// SAFE: use a data-only format and validate the parsed shape
import { z } from 'zod';
const Payload = z.object({ id: z.string().uuid(), amount: z.number().positive() });
const data = Payload.parse(JSON.parse(rawUntrustedBody)); // throws on anything unexpected

// Verify integrity of external scripts you load in the browser:
// <script src="https://cdn.example.com/lib.js"
//         integrity="sha384-..." crossorigin="anonymous"></script>
```

**Defenses:** never deserialize untrusted data with native/code-capable formats — prefer JSON and validate the parsed result (Zod/Pydantic); verify signatures and checksums on updates, packages, and artifacts; harden CI/CD with least privilege, protected branches, and signed commits; use Subresource Integrity (SRI) for third-party browser scripts and lockfiles with integrity hashes for dependencies.

---

## A09 — Security Logging and Monitoring Failures

You cannot respond to what you cannot see. This category covers the absence of the detection layer: not logging authentication and access-control events, logs without enough context to investigate, no alerting on suspicious patterns, logs that are not centralized or are easily tampered with, and the lack of a tested incident-response plan. The cost shows up as breaches that persist undetected for months. The goal is high-signal, tamper-resistant, centralized logging with alerts on the events that matter — and, just as important, *not* logging secrets or PII in the process.

```typescript
// Log security-relevant events with context (who/what/where), never secrets
logger.warn('auth.login.failed', {
  email: maskEmail(req.body.email), // masked, not raw PII
  ip: req.ip,
  userAgent: req.get('user-agent'),
  ts: Date.now(),
});
// Ship to a central store (SIEM), alert on spikes in failures / access-control denials
```

**Defenses:** log authentication, access-control, and input-validation failures with enough context to investigate; centralize logs (SIEM) and protect their integrity and retention; alert on anomalies (failure spikes, privilege changes); keep secrets and PII out of logs; maintain and rehearse an incident-response runbook.

---

## A10 — Server-Side Request Forgery (SSRF)

SSRF occurs when an application fetches a remote resource from a URL it does not fully validate, letting an attacker make the *server* issue requests on their behalf. Because the request originates inside the trust boundary, it can reach internal-only services: admin panels, databases, and especially cloud metadata endpoints (`http://169.254.169.254/`) that can hand out credentials. It rose into the Top 10 in 2021 as more applications fetch user-supplied URLs (webhooks, image proxies, link previews, integrations).

```typescript
import { isIP } from 'node:net';
import dns from 'node:dns/promises';

// SECURE fetch: allowlist scheme/host, resolve the IP, block private ranges
async function safeFetch(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:') throw new Error('https only');
  const { address } = (await dns.lookup(url.hostname));
  if (isPrivate(address)) throw new Error('blocked internal address');
  return fetch(url, { redirect: 'error' }); // don't silently follow redirects
}
// isPrivate(): reject 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16, ::1, fc00::/7
```

**Defenses:** allowlist destinations (scheme, host, port) rather than blocklisting; resolve and validate the target IP, blocking private/link-local/loopback ranges, and re-validate after any redirect (or disable redirects); never echo the raw fetched response back to the user; segment the network and apply an egress firewall; require IMDSv2 on AWS so the metadata endpoint resists SSRF.

---

## 2021 vs 2025

The OWASP Top 10 is refreshed roughly every three to four years as new data arrives. The **2021** edition above remains the most widely cited and is the safe default for interviews and standards mapping. The **2025** revision (release-candidate stage) keeps **Broken Access Control at #1** but reshuffles the rest: **Security Misconfiguration** rises (reflecting cloud and IaC complexity), **Vulnerable and Outdated Components** broadens into a wider **Software Supply Chain Failures** category, and a new category around **mishandling of exceptional conditions** (insecure error/exception handling) appears, with **SSRF** absorbed into a broader server-side-request bucket rather than standing alone. Treat the exact 2025 names and ordering as still settling until confirmed against `owasp.org`; the underlying risks do not change, only how they are grouped and ranked.

---

## Quick checklist

```
[ ] Deny-by-default authorization, ownership enforced in queries        (A01)
[ ] TLS everywhere; argon2id passwords; secrets in a vault              (A02)
[ ] Parameterized queries; output encoding; strict CSP                  (A03)
[ ] Threat model + abuse cases; rate limits and caps by design          (A04)
[ ] Hardened config as code; security headers; generic errors           (A05)
[ ] SCA in CI; automated dependency updates; SBOM                       (A06)
[ ] MFA; breach-checked passwords; login rate limits; secure cookies    (A07)
[ ] No untrusted deserialization; signed artifacts; SRI; locked CI/CD   (A08)
[ ] Central, tamper-resistant logs; alerting; tested IR plan            (A09)
[ ] URL allowlists; block private ranges; IMDSv2; egress firewall       (A10)
```
