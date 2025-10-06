# Security Policy

## Supported Versions

The LASCMMG Tournament Management System is actively maintained. We provide security updates for the following versions:

| Version | Supported          | Notes                          |
| ------- | ------------------ | ------------------------------ |
| 1.x.x   | :white_check_mark: | Current stable release         |
| < 1.0   | :x:                | No longer supported            |

## Security Features

LASCMMG implements multiple layers of security protection:

- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **CSRF Protection**: Redis-backed CSRF token validation
- **Rate Limiting**: Configurable rate limits on all API endpoints
- **Input Validation**: Server-side validation using Joi schemas
- **XSS Protection**: XSS-clean middleware and CSP headers
- **Audit Logging**: Immutable hash-chain audit trail
- **Session Management**: Redis-based session tracking with inactivity timeout
- **SQL Injection**: Parameterized queries via better-sqlite3
- **Secure Headers**: Helmet.js with Content Security Policy

## Reporting a Vulnerability

We take security vulnerabilities seriously and appreciate responsible disclosure.

### How to Report

**Please DO NOT open public GitHub issues for security vulnerabilities.**

Instead, report security issues via:

1. **Email**: Send details to the repository owner at `bernardopg` (via GitHub profile contact)
2. **Subject Line**: Use "SECURITY: [Brief Description]"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)
   - Your contact information for follow-up

### What to Expect

- **Initial Response**: Within 48 hours of submission
- **Status Updates**: Every 5-7 days until resolution
- **Fix Timeline**:
  - Critical vulnerabilities: 7 days
  - High severity: 14 days
  - Medium severity: 30 days
  - Low severity: 60 days

### After Reporting

**Accepted Vulnerabilities**:

- We will work on a fix and keep you updated
- Credit will be given in release notes (unless you prefer to remain anonymous)
- A security advisory will be published after the fix is released

**Declined Reports**:

- We will provide a detailed explanation
- If we disagree with the severity assessment, we'll explain our reasoning
- You're welcome to request clarification

## Security Best Practices for Deployment

When deploying LASCMMG in production:

1. **Environment Variables**:
   - Generate strong random secrets for `JWT_SECRET`, `COOKIE_SECRET`, and `CSRF_SECRET`
   - Use at least 64 characters for secrets
   - Never commit `.env` files to version control

2. **Redis Security**:
   - Enable Redis authentication
   - Use TLS for Redis connections in production
   - Restrict Redis network access

3. **Database**:
   - Regular backups (automated via included backup system)
   - Restrict file system access to database files
   - Enable WAL mode (already configured)

4. **HTTPS**:
   - Always use HTTPS in production
   - Enable HSTS headers
   - Use valid SSL/TLS certificates

5. **Monitoring**:
   - Review audit logs regularly
   - Monitor failed login attempts
   - Set up alerts for suspicious activity

6. **Updates**:
   - Keep dependencies up to date
   - Run `npm audit` regularly
   - Subscribe to security advisories

## Security Testing

We use multiple tools for security validation:

- **Manual Security Audits**: Periodic code reviews
- **Dependency Scanning**: `npm audit` in CI/CD
- **Static Analysis**: ESLint with security plugins
- **Custom Audit Script**: `npm run security-audit`

To run security checks locally:

```bash
# Check for known vulnerabilities
npm audit

# Run custom security audit
node scripts/security-audit.js

# Review audit logs
node scripts/audit-review.js
```

## Acknowledgments

We appreciate the security researchers and contributors who help keep LASCMMG secure. Contributors will be listed here upon request after vulnerability disclosure and resolution.

---

**Last Updated**: October 2025
