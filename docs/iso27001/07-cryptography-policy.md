# Cryptography Policy: Kardashev Catalyst UG

**Document ID:** NISD2-ISMS-008  
**Version:** 1.0  
**Owner:** Simon Orzel (CEO / CISO)  
**Approved by:** Cory Hisey (COO)  
**Effective:** 2026-05-19  
**Next review:** 2027-05-19

---

## 1. Purpose

This policy defines the cryptographic standards used to protect Kardashev Catalyst UG data in transit and at rest, and governs key and certificate management.

---

## 2. Encryption in transit

**Standard:** TLS 1.3 minimum. TLS 1.2 permitted only where a specific system cannot support 1.3.  
TLS 1.0 and 1.1 are prohibited.

| Connection | Implementation |
|---|---|
| Browser → platform | TLS 1.3 via Cloudflare (managed certificate, auto-renewed) |
| Platform → PostgreSQL | TLS via Hetzner private network + pg SSL mode |
| Platform → AWS S3 | TLS 1.3 (AWS SDK default) |
| Platform → Resend API | TLS 1.3 (HTTPS API) |
| Internal team communication | Signal (E2EE) for sensitive operational comms |

No plaintext transmission of credentials, customer data, or personal data is permitted over any network.

---

## 3. Encryption at rest

| Asset | Standard | Implementation |
|---|---|---|
| PostgreSQL database | AES-256 | Hetzner volume encryption |
| AWS S3 evidence files | AES-256 | SSE-AES256 (server-side encryption, enforced via bucket policy) |
| Developer laptops | AES-256 | FileVault 2 (Apple T2/M-series secure enclave) |
| 1Password vault | AES-256 with PBKDF2 | 1Password managed |
| Google Drive | AES-128 (Google-managed) | Google Workspace default |

---

## 4. Key management

| Key type | Management | Rotation |
|---|---|---|
| AWS S3 encryption keys | AWS-managed (SSE-AES256) | Automatic (AWS managed) |
| TLS certificates (production) | Cloudflare (auto-renewed) | Automatic: 90-day Let's Encrypt certs |
| TLS certificates (staging) | Let's Encrypt via certbot | Automatic: monitored for expiry |
| SSH keys (server access) | Generated locally, stored in 1Password | On departure of key holder or suspected compromise |
| API keys (Hetzner, AWS, Resend) | 1Password Teams | Rotated annually or on suspected compromise |
| Database passwords | 1Password Teams | Rotated annually or on suspected compromise |

**Rule:** No cryptographic key or credential is stored in source code, environment variable files committed to Git, or any system accessible without MFA.

---

## 5. Certificate monitoring

TLS certificate expiry is monitored for all domains:
- **nisd2.eu** (production): Cloudflare monitors and auto-renews
- **Staging domains**: Better Uptime certificate check configured, alerts at ≤14 days remaining

Alert recipient: Simon Orzel via email and Signal.

---

## 6. Prohibited algorithms

The following are prohibited for any new implementation:

| Category | Prohibited |
|---|---|
| Symmetric encryption | DES, 3DES, RC4 |
| Hash functions | MD5, SHA-1 (for integrity or signing purposes) |
| TLS versions | SSL 3.0, TLS 1.0, TLS 1.1 |
| Key exchange | RSA < 2048-bit, DHE < 2048-bit |

---

## 7. Post-quantum readiness

NIST PQC standards are being finalized (2024–2025). When TLS libraries add production-ready PQC key exchange (e.g., ML-KEM/Kyber via Cloudflare), this will be evaluated for adoption. A migration plan will be documented before the 2027 policy review.
