# Use Cases / Anwendungsfälle — Valkirye Chat MVP

> **EN** Detailed use cases derived from user stories. Each use case describes actors, preconditions, main flow, alternative flows, and postconditions.  
> **DE** Detaillierte Anwendungsfälle aus den User Stories. Jeder Anwendungsfall beschreibt Akteure, Vorbedingungen, Hauptablauf, alternative Abläufe und Nachbedingungen.

---

## Actors / Akteure

| Actor | Description EN | Beschreibung DE |
|---|---|---|
| **Admin** | Platform owner — root of trust | Plattformbesitzer — Vertrauenswurzel |
| **Member** | Authenticated registered user | Authentifizierter registrierter Benutzer |
| **Guest** | Holder of a valid invitation link | Inhaber eines gültigen Einladungslinks |
| **System** | Cognito, Lambda, DynamoDB, API Gateway | Cognito, Lambda, DynamoDB, API Gateway |

---

## UC-01 — Register via Invitation / Registrierung per Einladung

**Related Stories:** US-01  
**Primary Actor:** Guest  
**Secondary Actor:** System, Admin

**Preconditions / Vorbedingungen:**
- Guest has received invitation email containing link + OTP
- Link has not expired (< 72 hours)
- OTP has not been used

**Main Flow / Hauptablauf:**
1. Guest clicks invitation link in email
2. System validates link — checks expiry and usage status
3. Guest enters OTP, display name, and password
4. System validates OTP — marks as consumed
5. System creates Cognito user account
6. System creates member profile in DynamoDB
7. System creates bidirectional contact record (inviter ↔ invitee)
8. System sends confirmation email to new member
9. Guest redirected to login screen

**Alternative Flows / Alternative Abläufe:**
- **A1 — Link expired:** System returns error "Invitation has expired. Request a new one."
- **A2 — OTP already used:** System returns error "This invitation has already been used."
- **A3 — Weak password:** System returns password strength requirements, guest corrects
- **A4 — Display name taken:** System prompts guest to choose another display name

**Postconditions / Nachbedingungen:**
- New member account exists in Cognito and DynamoDB
- Inviter and invitee appear in each other's contacts
- OTP record marked consumed
- Invitation link invalidated

---

## UC-02 — Login / Anmeldung

**Related Stories:** US-02  
**Primary Actor:** Member

**Preconditions:** Member has a registered account

**Main Flow:**
1. Member enters email and password
2. System authenticates via Cognito
3. System returns JWT access token (1h) + refresh token (30 days)
4. Member stored session locally
5. Member directed to conversation list

**Alternative Flows:**
- **A1 — Invalid credentials:** System returns 401 — no field-level detail
- **A2 — Account revoked:** System returns 403 "Account suspended"
- **A3 — Token expired:** Client uses refresh token to obtain new access token silently

**Postconditions:** Member has valid JWT — can access all authenticated endpoints

---

## UC-03 — Submit and Approve Invitation / Einladung beantragen und genehmigen

**Related Stories:** US-05, US-06  
**Primary Actor:** Member (requester), Admin (approver)

**Preconditions:**
- Member has fewer than 5 pending invite requests
- Recipient email not already registered

**Main Flow:**
1. Member submits invite request — recipient email + optional note
2. System stores pending request, notifies admin
3. Admin reviews pending requests list
4. Admin approves request
5. System generates unique Bifröst link (72h expiry) + single-use OTP
6. System sends one email to recipient containing link + OTP
7. System notifies requester of approval
8. Pending request marked approved

**Alternative Flows:**
- **A1 — Admin denies:** Requester notified with optional admin note. Pending count decremented.
- **A2 — Member has 5 pending:** System rejects new request — "Maximum pending invitations reached"
- **A3 — Email already registered:** System rejects — "This email already has an account"

**Postconditions:** Invitation email delivered to recipient. Request record updated.

---

## UC-04 — Open Conversation / Gespräch öffnen

**Related Stories:** US-09  
**Primary Actor:** Member

**Preconditions:**
- Member is authenticated
- Target user is in member's contacts list
- WebSocket connection established

**Main Flow:**
1. Member selects a contact from contacts list
2. System checks existing conversation — creates if none exists
3. Client initiates ECDH X25519 key exchange
4. Client generates X25519 keypair for this session
5. Client sends public key to server via WebSocket
6. Server relays public key to recipient (if online) or stores for delivery
7. Recipient's client sends its public key back
8. Both clients independently derive shared secret
9. Conversation UI opened — "The Veil is ready"

**Alternative Flows:**
- **A1 — Recipient offline:** Public key stored. Exchange completes when recipient reconnects.
- **A2 — Not a contact:** System returns 403 — cannot open conversation with non-contact

**Postconditions:** Both clients hold the same shared secret. Conversation ready for encrypted messages.

---

## UC-05 — Send and Receive Encrypted Message / Verschlüsselte Nachricht senden und empfangen

**Related Stories:** US-10, US-11, US-12  
**Primary Actor:** Member (sender), Member (recipient)

**Preconditions:**
- Conversation open with completed key exchange
- Sender authenticated with active WebSocket

**Main Flow:**
1. Sender types message (max 10,000 chars)
2. Client encrypts message with XSalsa20-Poly1305 using shared secret
3. Client sends ciphertext + messageId + conversationId via WebSocket
4. Server stores ciphertext record in DynamoDB (never inspects content)
5. Server checks recipient connection status
6. **If online:** Server relays ciphertext to recipient via WebSocket
7. Recipient client decrypts message using shared secret
8. Message displayed in conversation

**Alternative Flows:**
- **A1 — Recipient offline:** Server stores message with `delivered: false`. On recipient reconnect, server delivers all queued messages in order, marks `delivered: true`.
- **A2 — Message too long:** Client rejects before sending — "Message too long"
- **A3 — Key exchange incomplete:** Client blocks send — prompts to wait for key exchange

**Postconditions:** Message stored as ciphertext in DynamoDB. Delivered to recipient in real-time or on reconnect.

---

## UC-06 — Delete Message / Nachricht löschen

**Related Stories:** US-14  
**Primary Actor:** Member

**Preconditions:**
- Member is a participant in the conversation
- Message exists in DynamoDB

**Main Flow:**
1. Member selects message — chooses delete
2. Client confirms deletion intent
3. Client sends delete request with messageId to server
4. Server verifies member is conversation participant
5. Server hard-deletes message record from DynamoDB
6. Server sends deletion event to other participant via WebSocket (if online)
7. Both clients replace message with "Message deleted" placeholder

**Alternative Flows:**
- **A1 — Other participant offline:** Deletion event queued — delivered on reconnect
- **A2 — Unauthorised:** Non-participant attempts deletion — 403 returned

**Postconditions:** Message record permanently removed from DynamoDB. No recovery possible.

---

## UC-07 — Delete Account (Ragnarök) / Konto löschen

**Related Stories:** US-07, US-18  
**Primary Actor:** Member

**Preconditions:** Member is authenticated

**Main Flow:**
1. Member initiates account deletion
2. System displays confirmation warning — irreversible action
3. Member confirms
4. System begins cascade deletion:
   - All messages sent by member hard-deleted
   - All messages received by member hard-deleted
   - Profile record deleted
   - Contact records deleted
   - Invite records anonymised (chain preserved, PII removed)
   - Cognito account deleted
5. Active sessions terminated
6. Contacts notified: "A contact has left Valkirye"
7. Confirmation email sent to member's email before deletion

**Alternative Flows:**
- **A1 — Member cancels confirmation:** No action taken

**Postconditions:** All PII removed from all DynamoDB tables. Cognito account deleted. Invite chain integrity preserved without PII.

---

## UC-08 — Export Personal Data / Persönliche Daten exportieren

**Related Stories:** US-17, US-19  
**Primary Actor:** Member

**Preconditions:** Member is authenticated

**Main Flow:**
1. Member requests data export
2. System acknowledges — "Your export will be ready within 72 hours"
3. System Lambda compiles export:
   - Profile data (including email)
   - Contacts list
   - Invite records (sent and received)
   - All message records (ciphertext — member can decrypt locally)
   - Account creation timestamp
4. Export compiled as JSON
5. Secure download link sent to member's email (expires 48 hours)
6. Member downloads JSON file

**Alternative Flows:**
- **A1 — Export already requested:** System returns existing export if < 7 days old

**Postconditions:** Member has received all personal data held by Valkirye in portable JSON format.

