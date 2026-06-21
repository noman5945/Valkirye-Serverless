# Epics / Epiken — Valkirye Chat MVP

> **EN** MVP epics for Valkirye — a secured, invitation-only, 1-to-1 encrypted chat system.  
> **DE** MVP-Epiken für Valkirye — ein gesichertes, einladungsbasiertes, Ende-zu-Ende-verschlüsseltes Chat-System.

---

## EPIC-01 — Identity & Access / Identität & Zugang
**EN** Invitation-only registration, email+password auth, profile management, auto-contacts from invite chain.  
**DE** Einladungsbasierte Registrierung, E-Mail+Passwort-Authentifizierung, Profilverwaltung, automatische Kontakte aus der Einladungskette.

- Admin is root of trust — approves all invitations
- Users submit invite requests — admin approves → OTP + link sent via email
- Inviter and invitee automatically added to each other's contacts on registration
- Profile: display name, bio, status — email always private

**Stories:** US-01 → US-08  
**Maps to:** `lib/auth-stack.ts` · `lib/user-stack.ts` · `src/auth/` · `src/user/`

---

## EPIC-02 — Messaging / Nachrichtensystem
**EN** Secured 1-to-1 chat between contacts. ECDH key exchange. Server relays ciphertext only.  
**DE** Gesicherter 1-zu-1-Chat zwischen Kontakten. ECDH-Schlüsselaustausch. Server leitet nur Chiffretext weiter.

- Only contacts can open conversations
- ECDH X25519 key exchange client-side on conversation open
- XSalsa20-Poly1305 encryption — server never sees plaintext
- Real-time WebSocket delivery · offline queue on reconnect
- Read receipts · bilateral hard delete · conversation history
- Forward secrecy by design

**Stories:** US-09 → US-16  
**Maps to:** `lib/chat-stack.ts` · `lib/connection-stack.ts` · `src/chat/` · `src/connection/`

---

## EPIC-03 — GDPR & Compliance / Datenschutz & Compliance
**EN** Privacy by design. Data minimisation, right to erasure, data export, EU residency.  
**DE** Datenschutz durch Technikgestaltung. Datensparsamkeit, Recht auf Löschung, Datenexport, EU-Datenhaltung.

- Full account deletion cascades all data (Art. 17)
- Personal data export as JSON (Art. 20)
- DynamoDB TTL on undelivered messages (30 days)
- All data in eu-central-1 (Frankfurt)
- No personal data in logs

**Stories:** US-17 → US-20  
**Maps to:** `src/user/handlers/` · `lib/user-stack.ts`

---

## EPIC-04 — Security & Infrastructure / Sicherheit & Infrastruktur
**EN** Least-privilege IAM, secrets management, JWT protection on all routes, rate limiting.  
**DE** Minimale IAM-Rechte, Secrets-Verwaltung, JWT-Schutz auf allen Routen, Rate Limiting.

- Per-Lambda IAM roles — no wildcard permissions
- AWS Secrets Manager — no secrets in code
- Cognito JWT authorizer on all routes
- API Gateway throttling
- Input validation on all handlers

**Stories:** US-21 → US-25  
**Maps to:** `lib/constructs/` · `src/shared/middleware/`

---

## EPIC-05 — Observability & CI/CD / Beobachtbarkeit & CI/CD
**EN** Structured logging, X-Ray tracing, CloudWatch alarms, GitHub Actions pipeline.  
**DE** Strukturiertes Logging, X-Ray-Tracing, CloudWatch-Alarme, GitHub-Actions-Pipeline.

- Lambda Powertools — structured JSON logs, no PII
- X-Ray tracing end-to-end
- CloudWatch alarms on error thresholds
- GitHub Actions: lint → test → synth → deploy

**Stories:** US-26 → US-29  
**Maps to:** `src/shared/logger/` · `.github/workflows/`

---

## Summary / Übersicht

| Epic | Priority | Stories |
|---|---|---|
| EPIC-01 Identity & Access | P0 | US-01–08 |
| EPIC-02 Messaging | P0 | US-09–16 |
| EPIC-03 GDPR & Compliance | P0 | US-17–20 |
| EPIC-04 Security & Infra | P0 | US-21–25 |
| EPIC-05 Observability & CI/CD | P1 | US-26–29 |
