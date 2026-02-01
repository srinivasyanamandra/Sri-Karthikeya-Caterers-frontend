# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please email us at:
**security@srikarthikeyacaterers.in**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and provide updates on the fix timeline.

## Security Measures

### Application Security
- Environment variables for sensitive data
- Form validation and sanitization
- XSS protection via React
- No exposed API keys or secrets
- HTTPS enforcement in production

### Dependencies
- Regular dependency updates
- Security audit via `npm audit`
- Automated vulnerability scanning

### Best Practices
- Principle of least privilege
- Input validation
- Output encoding
- Secure headers configuration
- Regular security reviews

## Responsible Disclosure

We appreciate responsible disclosure of security vulnerabilities. We commit to:
- Acknowledging receipt within 48 hours
- Providing regular updates on fix progress
- Crediting researchers (if desired)
- Fixing critical issues within 7 days
