# User Stories / User Stories — Valkirye Chat MVP

> **EN** All user stories for the Valkirye MVP. Each story follows the format:  
> *As a [actor], I can [action] so that [value].*  
> **DE** Alle User Stories für das Valkirye MVP. Jede Story folgt dem Format:  
> *Als [Akteur] kann ich [Aktion], damit [Mehrwert].*

---

## EPIC-01 — Identity & Access / Identität & Zugang

### US-01 — Registration via Invitation / Registrierung per Einladung
**EN** As a guest, I can register using a valid invitation link and OTP sent to my email, so that I can join the platform as a trusted member.  
**DE** Als Gast kann ich mich über einen gültigen Einladungslink und ein per E-Mail gesendetes Einmalpasswort registrieren, damit ich der Plattform als vertrauenswürdiges Mitglied beitreten kann.

**Acceptance Criteria / Akzeptanzkriterien:**
- Guest receives one email containing invitation link + OTP
- Link expires after 72 hours
- OTP is single-use — consumed on successful registration
- Guest sets display name + password on registration
- On success: account created in Cognito, profile stored in DynamoDB
- Inviter automatically added to new user's contacts
- New user automatically added to inviter's contacts
- Expired or used links return clear error message

---

### US-02 — Login / Anmeldung
**EN** As a member, I can log in with my email and password, so that I can access my conversations.  
**DE** Als Mitglied kann ich mich mit meiner E-Mail und meinem Passwort anmelden, damit ich auf meine Gespräche zugreifen kann.

**Acceptance Criteria:**
- Valid credentials return JWT access token + refresh token
- Invalid credentials return 401 — no detail about which field is wrong
- JWT expires after 1 hour — refresh token valid for 30 days
- Concurrent sessions supported (multiple devices)

---

### US-03 — Password Reset / Passwort zurücksetzen
**EN** As a member, I can reset my password via a link sent to my email, so that I can regain access if I forget my password.  
**DE** Als Mitglied kann ich mein Passwort über einen per E-Mail gesendeten Link zurücksetzen.

**Acceptance Criteria:**
- Password reset email sent via Cognito
- Reset link single-use, expires after 24 hours
- New password must meet minimum strength requirements
- Active sessions invalidated after password reset

---

### US-04 — Update Profile / Profil aktualisieren
**EN** As a member, I can update my display name, bio, and status message, so that my contacts know who I am.  
**DE** Als Mitglied kann ich meinen Anzeigenamen, meine Bio und meinen Status aktualisieren.

**Acceptance Criteria:**
- Display name: 2–50 characters, required
- Bio: max 200 characters, optional
- Status message: max 100 characters, optional
- Email cannot be changed via profile update
- Changes visible to contacts immediately

---

### US-05 — Submit Invite Request / Einladungsanfrage stellen
**EN** As a member, I can submit an invite request for someone I trust, so that they can join the platform.  
**DE** Als Mitglied kann ich eine Einladungsanfrage für jemanden stellen, dem ich vertraue.

**Acceptance Criteria:**
- Member submits recipient email + optional note to admin
- Maximum 5 pending invite requests per member at any time
- Member notified when admin approves or denies request
- On approval: system sends invitation email to recipient automatically

---

### US-06 — Admin Approves Invitation / Admin genehmigt Einladung
**EN** As admin, I can approve or deny pending invite requests, so that I control who enters the platform.  
**DE** Als Administrator kann ich ausstehende Einladungsanfragen genehmigen oder ablehnen.

**Acceptance Criteria:**
- Admin sees list of pending invite requests with requester + recipient email
- On approval: invitation link + OTP generated and emailed to recipient
- On denial: requester notified, their pending count decremented
- Admin can add a note on denial visible to requester

---

### US-07 — Delete Account / Konto löschen
**EN** As a member, I can delete my account and all associated data, so that I have the right to be forgotten.  
**DE** Als Mitglied kann ich mein Konto und alle zugehörigen Daten löschen (Recht auf Vergessenwerden).

**Acceptance Criteria:**
- Confirmation required before deletion
- All messages sent by user hard-deleted from DynamoDB
- Profile, contacts, invite records all purged
- Cognito account deactivated
- Contacts of deleted user notified that user has left
- Irreversible — no recovery possible

---

### US-08 — Admin Revokes User / Admin widerruft Benutzer
**EN** As admin, I can revoke any member account, so that I can remove bad actors from the platform.  
**DE** Als Administrator kann ich jedes Mitgliedskonto widerrufen, um Missbrauch zu verhindern.

**Acceptance Criteria:**
- Admin can revoke any member immediately
- Revoked user's active sessions terminated
- Revoked user cannot log in or register again with same email
- Revocation logged with timestamp and admin ID

---

## EPIC-02 — Messaging / Nachrichtensystem

### US-09 — Open Conversation / Gespräch öffnen
**EN** As a member, I can open a conversation with any of my contacts, so that we can chat privately.  
**DE** Als Mitglied kann ich ein Gespräch mit einem meiner Kontakte öffnen.

**Acceptance Criteria:**
- Member can only open conversations with users in their contacts list
- One conversation per contact pair — no duplicates
- Existing conversation reopened if already exists
- ECDH X25519 key exchange initiated on conversation open

---

### US-10 — Send Encrypted Message / Verschlüsselte Nachricht senden
**EN** As a member, I can send an encrypted text message to a contact, so that only we can read it.  
**DE** Als Mitglied kann ich eine verschlüsselte Textnachricht an einen Kontakt senden.

**Acceptance Criteria:**
- Message encrypted client-side with XSalsa20-Poly1305 before sending
- Server receives and stores ciphertext only — never plaintext
- Message max length: 10,000 characters (before encryption)
- Empty messages rejected client-side
- Message assigned UUID, senderId, conversationId, createdAt on server

---

### US-11 — Receive Message Real-time / Nachricht in Echtzeit empfangen
**EN** As a member, I can receive messages in real-time when I am online, so that I can have live conversations.  
**DE** Als Mitglied kann ich Nachrichten in Echtzeit empfangen, wenn ich online bin.

**Acceptance Criteria:**
- Message delivered via WebSocket within 500ms (p95) when recipient online
- Recipient decrypts message client-side using shared secret
- Message appears in conversation immediately
- WebSocket connection authenticated via JWT on connect

---

### US-12 — Offline Message Delivery / Offline-Nachrichtenzustellung
**EN** As a member, I can receive messages that were sent while I was offline, so that I never miss a conversation.  
**DE** Als Mitglied kann ich Nachrichten empfangen, die gesendet wurden, während ich offline war.

**Acceptance Criteria:**
- Messages queued in DynamoDB when recipient offline
- All queued messages delivered in order on reconnect
- Delivery confirmed — queue cleared after successful delivery
- Undelivered messages purged after 30 days (TTL)

---

### US-13 — Read Receipts / Lesebestätigungen
**EN** As a member, I can see when my contact has read my message, so that I know it was received.  
**DE** Als Mitglied kann ich sehen, wann mein Kontakt meine Nachricht gelesen hat.

**Acceptance Criteria:**
- Read receipt sent automatically when recipient opens the conversation
- `readAt` timestamp stored on message record
- Sender notified of read receipt via WebSocket (if online) or on next connect
- No intermediate sent/delivered status — read only

---

### US-14 — Delete Message / Nachricht löschen
**EN** As a member, I can delete a message for both parties, so that I can remove something I sent.  
**DE** Als Mitglied kann ich eine Nachricht für beide Seiten löschen.

**Acceptance Criteria:**
- Either party can delete any message in the conversation
- Hard delete from DynamoDB — no soft delete, no recovery
- Deletion event relayed to other party via WebSocket (if online)
- Deleted message replaced with "Message deleted" placeholder in UI
- Deletion irreversible

---

### US-15 — Conversation History / Gesprächsverlauf
**EN** As a member, I can scroll through my conversation history, so that I can refer back to previous messages.  
**DE** Als Mitglied kann ich durch meinen Gesprächsverlauf scrollen.

**Acceptance Criteria:**
- Messages loaded in reverse chronological order (newest first)
- Pagination: 50 messages per page
- History only readable by clients holding the correct keypair
- Forward secrecy: new keypair = history unreadable (by design)

---

### US-16 — Forward Secrecy Awareness / Bewusstsein für Forward Secrecy
**EN** As a member, I am clearly informed that losing my keypair means losing my message history, so that I understand the security model.  
**DE** Als Mitglied werde ich klar darüber informiert, dass der Verlust meines Schlüsselpaares den Verlust meines Nachrichtenverlaufs bedeutet.

**Acceptance Criteria:**
- Warning displayed on first login and on new device login
- Warning displayed before any action that would regenerate keypair
- User must explicitly acknowledge warning before proceeding
- Warning stored as dismissed — not shown repeatedly

---

## EPIC-03 — GDPR & Compliance / Datenschutz & Compliance

### US-17 — Export Personal Data / Persönliche Daten exportieren
**EN** As a member, I can export all personal data Valkirye holds about me as JSON, so that I can exercise my right to data portability (GDPR Art. 20).  
**DE** Als Mitglied kann ich alle über mich gespeicherten persönlichen Daten als JSON exportieren (DSGVO Art. 20).

**Acceptance Criteria:**
- Export includes: profile, contacts list, invite records, message metadata
- Message ciphertext included — member can decrypt locally
- Export delivered as downloadable JSON file
- Request processed within 72 hours (GDPR requirement)
- Export endpoint authenticated — member can only export their own data

---

### US-18 — Right to Erasure / Recht auf Löschung
**EN** As a member, I can permanently delete my account and all associated data, so that I exercise my right to erasure (GDPR Art. 17).  
**DE** Als Mitglied kann ich mein Konto und alle zugehörigen Daten dauerhaft löschen (DSGVO Art. 17).

**Acceptance Criteria:**
- All profile data deleted from DynamoDB
- All messages (sent and received) hard-deleted
- Contact records purged
- Invite records anonymised (chain integrity preserved without PII)
- Cognito account deleted
- Completed within 30 days of request (GDPR requirement)
- Confirmation email sent on completion

---

### US-19 — View Held Data / Gespeicherte Daten einsehen
**EN** As a member, I can view all data Valkirye holds about me, so that I exercise my right of access (GDPR Art. 15).  
**DE** Als Mitglied kann ich alle über mich gespeicherten Daten einsehen (DSGVO Art. 15).

**Acceptance Criteria:**
- Member can view profile, contacts, invite history, message metadata
- Email shown to member (it is their own data)
- Response within 30 days (GDPR requirement)

---

### US-20 — Audit Trail / Prüfpfad
**EN** As admin, I can access the invite chain audit trail, so that I can demonstrate GDPR accountability (Art. 5 §2).  
**DE** Als Administrator kann ich auf den Einladungsketten-Prüfpfad zugreifen (DSGVO Art. 5 §2).

**Acceptance Criteria:**
- Every account traceable to its invite chain
- Invite records include: inviter ID, invitee email (hashed), timestamp, approval timestamp
- Audit trail preserved even after account deletion (PII removed, chain intact)
- Accessible to admin only

---

## EPIC-04 — Security / Sicherheit

### US-21 — Least Privilege IAM / Minimale IAM-Rechte
**EN** As admin, every Lambda function runs with a scoped IAM role, so that a compromised function cannot access unrelated resources.  
**DE** Als Administrator läuft jede Lambda-Funktion mit einer eingeschränkten IAM-Rolle.

**Acceptance Criteria:**
- No IAM policy contains wildcard `*` resource
- Each Lambda role grants access only to its required DynamoDB tables and actions
- IAM policies reviewed in CDK code — no console-created policies

---

### US-22 — Secrets Management / Secrets-Verwaltung
**EN** As admin, no secrets or credentials are stored in code or environment files, so that the codebase is safe to open-source.  
**DE** Als Administrator werden keine Secrets oder Zugangsdaten im Code oder in Umgebungsdateien gespeichert.

**Acceptance Criteria:**
- All secrets in AWS Secrets Manager
- `.env` files absent from repository — `.gitignore` enforced
- Secrets injected at Lambda runtime via Secrets Manager SDK call
- `git log` contains no credentials — verified in CI

---

### US-23 — JWT Route Protection / JWT-Routenschutz
**EN** As admin, all API routes are protected by JWT authorisation, so that unauthenticated access is impossible.  
**DE** Als Administrator sind alle API-Routen durch JWT-Autorisierung geschützt.

**Acceptance Criteria:**
- Cognito JWT authorizer attached to all HTTP API routes
- WebSocket `$connect` rejects connections without valid JWT
- Expired or invalid tokens return 401
- Token claims validated on every request

---

### US-24 — Rate Limiting / Ratenbegrenzung
**EN** As admin, API Gateway throttling is configured, so that the platform is protected from abuse and DoS.  
**DE** Als Administrator ist API Gateway Throttling konfiguriert, um die Plattform vor Missbrauch zu schützen.

**Acceptance Criteria:**
- Default throttle: 100 requests/second per route
- Burst limit: 200 requests
- WebSocket message rate limited per connection
- 429 response returned on limit exceeded

---

### US-25 — Dependency Security / Abhängigkeitssicherheit
**EN** As admin, dependency vulnerabilities are caught automatically in CI, so that known security issues are not deployed.  
**DE** Als Administrator werden Abhängigkeitsschwachstellen automatisch in CI erkannt.

**Acceptance Criteria:**
- `npm audit --audit-level=high` runs in CI pipeline
- Pipeline fails on high or critical severity vulnerabilities
- All dependencies pinned to exact versions in `package.json`

---

## EPIC-05 — Observability & CI/CD

### US-26 — Structured Logging / Strukturiertes Logging
**EN** As admin, every Lambda request produces a structured JSON log entry, so that I can debug and monitor the system.  
**DE** Als Administrator erzeugt jede Lambda-Anfrage einen strukturierten JSON-Logeintrag.

**Acceptance Criteria:**
- Lambda Powertools Logger used on every handler
- Every log entry includes: requestId, correlationId, level, timestamp, message
- No PII (email, display name, message content) in any log entry
- Log level configurable per environment (DEBUG / INFO / ERROR)

---

### US-27 — Request Tracing / Anfragen-Tracing
**EN** As admin, I can trace any request end-to-end across all Lambdas, so that I can diagnose latency and errors.  
**DE** Als Administrator kann ich jede Anfrage über alle Lambdas hinweg verfolgen.

**Acceptance Criteria:**
- AWS X-Ray enabled on all Lambda functions
- Lambda Powertools Tracer creates subsegments for DynamoDB calls
- Trace visible in X-Ray console within 30 seconds
- Correlation ID consistent across the full request chain

---

### US-28 — Error Alerting / Fehlerbenachrichtigung
**EN** As admin, I am alerted when Lambda error rates exceed threshold, so that I can respond to incidents quickly.  
**DE** Als Administrator werde ich benachrichtigt, wenn Lambda-Fehlerraten den Schwellenwert überschreiten.

**Acceptance Criteria:**
- CloudWatch alarm on Lambda error rate > 5% over 5 minutes
- Alarm triggers SNS notification to admin email
- Dashboard shows: error rate, invocation count, duration p95, throttles

---

### US-29 — CI/CD Pipeline / CI/CD-Pipeline
**EN** As admin, every code push is automatically linted, tested, and deployed, so that the system is always in a releasable state.  
**DE** Als Administrator wird jeder Code-Push automatisch gelintet, getestet und deployt.

**Acceptance Criteria:**
- GitHub Actions pipeline on every push to `main`
- Stages in order: lint → type-check → unit tests → `cdk synth` → `npm audit` → deploy
- Pipeline fails fast — stops on first failing stage
- CDK snapshot tests detect unintended infrastructure changes
- Deploy only on `main` branch — PRs run lint + test only

---

## Story Map / Story-Übersicht

| ID | Epic | Actor | Priority | Estimated Effort |
|---|---|---|---|---|
| US-01 | Identity | Guest | P0 | M |
| US-02 | Identity | Member | P0 | S |
| US-03 | Identity | Member | P0 | S |
| US-04 | Identity | Member | P0 | S |
| US-05 | Identity | Member | P0 | S |
| US-06 | Identity | Admin | P0 | S |
| US-07 | Identity | Member | P0 | M |
| US-08 | Identity | Admin | P0 | S |
| US-09 | Messaging | Member | P0 | M |
| US-10 | Messaging | Member | P0 | L |
| US-11 | Messaging | Member | P0 | L |
| US-12 | Messaging | Member | P0 | M |
| US-13 | Messaging | Member | P1 | S |
| US-14 | Messaging | Member | P1 | S |
| US-15 | Messaging | Member | P1 | M |
| US-16 | Messaging | Member | P0 | S |
| US-17 | GDPR | Member | P0 | M |
| US-18 | GDPR | Member | P0 | M |
| US-19 | GDPR | Member | P0 | S |
| US-20 | GDPR | Admin | P0 | S |
| US-21 | Security | Admin | P0 | S |
| US-22 | Security | Admin | P0 | S |
| US-23 | Security | Admin | P0 | S |
| US-24 | Security | Admin | P0 | S |
| US-25 | Security | Admin | P0 | S |
| US-26 | Observability | Admin | P1 | S |
| US-27 | Observability | Admin | P1 | S |
| US-28 | Observability | Admin | P1 | S |
| US-29 | Observability | Admin | P0 | M |

> Effort: S = 1–2 days · M = 3–4 days · L = 5–7 days
