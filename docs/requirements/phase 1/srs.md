# Software Requirements Specification (SRS)
# Softwareanforderungsspezifikation (SRS)

**Project / Projekt:** Valkirye — Secured Chat System  
**Version:** 1.0.0 — MVP  
**Date / Datum:** 2026-06-14  
**Author / Autor:** Valkirye Development Team  
**Standard:** IEEE 830-1998  
**Status:** Proposed / Vorgeschlagen  
**Language / Sprache:** Bilingual EN + DE

---

## Table of Contents / Inhaltsverzeichnis

1. [Introduction / Einleitung](#1-introduction)
2. [Overall Description / Gesamtbeschreibung](#2-overall-description)
3. [Functional Requirements / Funktionale Anforderungen](#3-functional-requirements)
4. [Non-Functional Requirements / Nicht-funktionale Anforderungen](#4-non-functional-requirements)
5. [System Constraints / Systembeschränkungen](#5-system-constraints)
6. [External Interface Requirements / Externe Schnittstellenanforderungen](#6-external-interface-requirements)
7. [Future Considerations / Zukünftige Überlegungen](#7-future-considerations)
8. [Appendix / Anhang](#8-appendix)

---

## 1. Introduction / Einleitung

### 1.1 Purpose / Zweck

**EN**  
This Software Requirements Specification defines the functional and non-functional requirements
for the Valkirye MVP — a secured, invitation-only, end-to-end encrypted 1-to-1 chat system
built on AWS serverless infrastructure. This document serves as the authoritative reference
for design, implementation, testing, and compliance verification.

**DE**  
Diese Softwareanforderungsspezifikation definiert die funktionalen und nicht-funktionalen
Anforderungen für das Valkirye MVP — ein gesichertes, einladungsbasiertes, Ende-zu-Ende-
verschlüsseltes 1-zu-1-Chat-System auf AWS Serverless-Infrastruktur. Dieses Dokument dient
als maßgebliche Referenz für Design, Implementierung, Tests und Compliance-Verifizierung.

### 1.2 Scope / Umfang

**EN**  
Valkirye is a private communication platform. Its core purpose is to provide a trusted space
where invited, verified individuals can exchange encrypted messages that the server cannot read.
The MVP delivers:

- Invitation-only user registration with admin-controlled access
- End-to-end encrypted 1-to-1 messaging (ECDH X25519 + XSalsa20-Poly1305)
- Real-time message delivery via WebSocket with offline queue fallback
- GDPR-compliant data handling with right to erasure and data portability
- Serverless infrastructure on AWS (Lambda, API Gateway, DynamoDB, Cognito)

**DE**  
Valkirye ist eine private Kommunikationsplattform. Ihr Kernzweck ist es, einen vertrauenswürdigen
Raum zu schaffen, in dem eingeladene, verifizierte Personen verschlüsselte Nachrichten austauschen
können, die der Server nicht lesen kann. Das MVP liefert:

- Einladungsbasierte Benutzerregistrierung mit admin-kontrolliertem Zugang
- Ende-zu-Ende-verschlüsseltes 1-zu-1-Messaging (ECDH X25519 + XSalsa20-Poly1305)
- Echtzeit-Nachrichtenzustellung via WebSocket mit Offline-Warteschlange
- DSGVO-konforme Datenverwaltung mit Recht auf Löschung und Datenportabilität
- Serverlose Infrastruktur auf AWS (Lambda, API Gateway, DynamoDB, Cognito)

### 1.3 Definitions / Definitionen

| Term / Begriff | Definition |
|---|---|
| **Admin** | Platform owner — root of trust. Approves all invitations. |
| **Member** | Authenticated registered user — can send/receive messages |
| **Guest** | Holder of a valid invitation link — not yet registered |
| **Contact** | A member with whom messaging is permitted — established via invitation chain |
| **Invitation link** | A time-limited URL that allows a guest to register |
| **OTP** | One-time password — single-use code delivered with invitation link |
| **E2E encryption** | End-to-end encryption — server never holds or processes plaintext |
| **ECDH** | Elliptic Curve Diffie-Hellman — key exchange protocol |
| **Forward secrecy** | Property whereby loss of long-term key does not compromise past sessions |
| **Ciphertext** | Encrypted message content — the only form stored on the server |
| **Invite chain** | The traceable sequence of who invited whom — stored for audit |

### 1.4 References / Referenzen

| Reference | Document |
|---|---|
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications |
| GDPR / DSGVO | Regulation (EU) 2016/679 — General Data Protection Regulation |
| RFC 7748 | Elliptic Curves for Diffie-Hellman Key Agreement (X25519) |
| libsodium docs | https://doc.libsodium.org |
| AWS CDK docs | https://docs.aws.amazon.com/cdk |
| `docs/requirements/epics.md` | Valkirye Epic definitions |
| `docs/requirements/user-stories.md` | Valkirye User Stories |
| `docs/requirements/use-cases.md` | Valkirye Use Cases |
| `docs/product/norse-glossary.md` | Norse mythology UI terminology |

### 1.5 Overview / Überblick

**EN**  
Section 2 describes the product context, user characteristics, and assumptions.
Section 3 defines all functional requirements, organised by epic.
Section 4 defines non-functional requirements covering security, performance, compliance, and reliability.
Section 5 lists system constraints.
Section 6 describes external interfaces.
Section 7 documents planned future capabilities outside MVP scope.

**DE**  
Abschnitt 2 beschreibt den Produktkontext, Benutzermerkmale und Annahmen.
Abschnitt 3 definiert alle funktionalen Anforderungen, geordnet nach Epiken.
Abschnitt 4 definiert nicht-funktionale Anforderungen für Sicherheit, Leistung, Compliance und Zuverlässigkeit.
Abschnitt 5 listet Systembeschränkungen auf.
Abschnitt 6 beschreibt externe Schnittstellen.
Abschnitt 7 dokumentiert geplante zukünftige Funktionen außerhalb des MVP-Umfangs.

---

## 2. Overall Description / Gesamtbeschreibung

### 2.1 Product Perspective / Produktperspektive

**EN**  
Valkirye is a standalone serverless application. It does not integrate with or extend any
existing platform. It consists of:

- A backend API (AWS Lambda + API Gateway) — the server
- A client application (browser and/or mobile) — where encryption occurs
- A managed authentication service (Amazon Cognito)
- A managed database (Amazon DynamoDB)
- A managed email service (Amazon SES via Cognito)

The server is a **pure relay**. It routes encrypted messages between clients and stores
ciphertext. It has no capability to read message content by design.

**DE**  
Valkirye ist eine eigenständige serverlose Anwendung. Sie integriert sich nicht in eine
bestehende Plattform und erweitert keine solche. Sie besteht aus:

- Einer Backend-API (AWS Lambda + API Gateway) — dem Server
- Einer Client-Anwendung (Browser und/oder Mobil) — wo die Verschlüsselung stattfindet
- Einem verwalteten Authentifizierungsdienst (Amazon Cognito)
- Einer verwalteten Datenbank (Amazon DynamoDB)
- Einem verwalteten E-Mail-Dienst (Amazon SES über Cognito)

Der Server ist ein **reiner Relay**. Er leitet verschlüsselte Nachrichten zwischen Clients
weiter und speichert Chiffretext. Er ist by Design nicht in der Lage, Nachrichteninhalte zu lesen.

### 2.2 Product Functions / Produktfunktionen

**EN** At the highest level, Valkirye provides:

1. **Controlled access** — invitation-only registration, admin-gated
2. **Encrypted messaging** — client-side E2E encryption, server-blind relay
3. **Contact management** — auto-established from invitation chain
4. **GDPR compliance** — erasure, portability, minimisation by design

**DE** Auf höchster Ebene bietet Valkirye:

1. **Kontrollierten Zugang** — einladungsbasierte Registrierung, admin-kontrolliert
2. **Verschlüsseltes Messaging** — clientseitige E2E-Verschlüsselung, Server-blindes Relay
3. **Kontaktverwaltung** — automatisch aus der Einladungskette etabliert
4. **DSGVO-Compliance** — Löschung, Portabilität, Datensparsamkeit by Design

### 2.3 User Characteristics / Benutzermerkmale

| Actor | Technical Level | Access Method |
|---|---|---|
| **Admin** | High — operates via API | Direct API calls + AWS Console |
| **Member** | Non-technical assumed | Browser client or mobile app |
| **Guest** | Non-technical assumed | Email link → browser or mobile |

### 2.4 Assumptions / Annahmen

**EN**
- Clients (browser/mobile) support the libsodium cryptographic library
- Members understand that losing their device without backup means losing message history
- Admin is a single trusted individual for MVP — no admin UI required
- AWS Free Tier is sufficient for MVP development and demonstration
- Internet connectivity is assumed for all operations

**DE**
- Clients (Browser/Mobil) unterstützen die kryptografische Bibliothek libsodium
- Mitglieder verstehen, dass der Verlust ihres Geräts ohne Backup den Verlust des Nachrichtenverlaufs bedeutet
- Der Admin ist für das MVP eine einzelne vertrauenswürdige Person — keine Admin-UI erforderlich
- AWS Free Tier ist für MVP-Entwicklung und -Demonstration ausreichend

### 2.5 Constraints / Einschränkungen

- AWS Free Tier limits apply during development
- No third-party analytics, tracking, or advertising
- All personal data must remain within the EU (eu-central-1)
- Server must never store or process plaintext message content

---

## 3. Functional Requirements / Funktionale Anforderungen

> **Convention:** Each requirement is identified as `FR-[epic].[number]`.  
> **Konvention:** Jede Anforderung wird als `FR-[Epik].[Nummer]` identifiziert.

---

### 3.1 Identity & Access / Identität & Zugang

#### FR-1.1 — Invitation-Only Registration / Einladungsbasierte Registrierung
**EN** The system SHALL only allow new user registration via a valid, unexpired, unused invitation link accompanied by a valid OTP.  
**DE** Das System SOLL die Registrierung neuer Benutzer nur über einen gültigen, nicht abgelaufenen, unbenutzten Einladungslink mit einem gültigen OTP erlauben.

**Verification:** UC-01, US-01

#### FR-1.2 — Invitation Link Expiry / Ablauf des Einladungslinks
**EN** The system SHALL invalidate invitation links after 72 hours from generation.  
**DE** Das System SOLL Einladungslinks 72 Stunden nach der Generierung ungültig machen.

#### FR-1.3 — OTP Single Use / Einmaliges OTP
**EN** The system SHALL mark an OTP as consumed after first successful use and reject any further use of the same OTP.  
**DE** Das System SOLL ein OTP nach der ersten erfolgreichen Verwendung als verbraucht markieren.

#### FR-1.4 — Auto-Contact on Registration / Automatischer Kontakt bei Registrierung
**EN** The system SHALL automatically create a bidirectional contact relationship between the inviter and the newly registered member upon successful registration.  
**DE** Das System SOLL bei erfolgreicher Registrierung automatisch eine bidirektionale Kontaktbeziehung zwischen dem Einlader und dem neu registrierten Mitglied erstellen.

#### FR-1.5 — JWT Authentication / JWT-Authentifizierung
**EN** The system SHALL authenticate members using Cognito-issued JWT access tokens. All protected endpoints SHALL reject requests with missing, expired, or invalid tokens with HTTP 401.  
**DE** Das System SOLL Mitglieder mit von Cognito ausgestellten JWT-Zugriffstoken authentifizieren.

#### FR-1.6 — Token Refresh / Token-Aktualisierung
**EN** The system SHALL support silent token refresh using a refresh token valid for 30 days, without requiring re-authentication.  
**DE** Das System SOLL eine stille Token-Aktualisierung mit einem 30 Tage gültigen Refresh-Token unterstützen.

#### FR-1.7 — Password Reset / Passwort zurücksetzen
**EN** The system SHALL provide a password reset flow via Cognito that sends a reset link to the member's registered email address.  
**DE** Das System SOLL einen Passwort-Reset-Ablauf über Cognito bereitstellen.

#### FR-1.8 — Profile Management / Profilverwaltung
**EN** The system SHALL allow members to update their display name (2–50 chars), bio (max 200 chars), and status message (max 100 chars). Email SHALL NOT be updatable via the profile endpoint.  
**DE** Das System SOLL Mitgliedern erlauben, ihren Anzeigenamen (2–50 Zeichen), ihre Bio (max. 200 Zeichen) und ihre Statusnachricht (max. 100 Zeichen) zu aktualisieren.

#### FR-1.9 — Invite Request Limit / Einladungsanfrage-Limit
**EN** The system SHALL reject invite requests from members who already have 5 or more pending unapproved invite requests.  
**DE** Das System SOLL Einladungsanfragen von Mitgliedern ablehnen, die bereits 5 oder mehr ausstehende Anfragen haben.

#### FR-1.10 — Admin Invitation Control / Admin-Einladungskontrolle
**EN** The system SHALL require admin approval before generating any invitation link. The system SHALL NOT generate invitation links without an explicit admin approval action.  
**DE** Das System SOLL eine Admin-Genehmigung erfordern, bevor ein Einladungslink generiert wird.

#### FR-1.11 — Admin User Revocation / Admin-Benutzerwiderruf
**EN** The system SHALL allow the admin to revoke any member account. Revocation SHALL immediately terminate all active sessions and prevent future login.  
**DE** Das System SOLL dem Admin erlauben, jedes Mitgliedskonto zu widerrufen.

#### FR-1.12 — Email Privacy / E-Mail-Datenschutz
**EN** The system SHALL NOT return a member's email address in any API response accessible to other members. Email SHALL only be returned to the member themselves via the data export endpoint.  
**DE** Das System SOLL die E-Mail-Adresse eines Mitglieds in keiner API-Antwort zurückgeben, die für andere Mitglieder zugänglich ist.

---

### 3.2 Messaging / Nachrichtensystem

#### FR-2.1 — Contact-Only Messaging / Kontakt-exklusives Messaging
**EN** The system SHALL only permit a member to open a conversation with a user present in their contacts list. Attempts to message non-contacts SHALL be rejected with HTTP 403.  
**DE** Das System SOLL einem Mitglied nur erlauben, ein Gespräch mit einem Benutzer in seiner Kontaktliste zu eröffnen.

#### FR-2.2 — ECDH Key Exchange / ECDH-Schlüsselaustausch
**EN** The system SHALL relay X25519 public keys between conversation participants via WebSocket. The system SHALL store public keys temporarily for offline key exchange delivery.  
**DE** Das System SOLL X25519-öffentliche Schlüssel zwischen Gesprächsteilnehmern über WebSocket weiterleiten.

#### FR-2.3 — Ciphertext-Only Storage / Nur-Chiffretext-Speicherung
**EN** The system SHALL store only ciphertext in DynamoDB. The system SHALL NOT decrypt, inspect, log, or process message content at any point.  
**DE** Das System SOLL nur Chiffretext in DynamoDB speichern und Nachrichteninhalte niemals entschlüsseln, prüfen, protokollieren oder verarbeiten.

#### FR-2.4 — Real-time Delivery / Echtzeit-Zustellung
**EN** The system SHALL deliver messages to online recipients via API Gateway WebSocket within 500ms (p95 target).  
**DE** Das System SOLL Nachrichten an Online-Empfänger über API Gateway WebSocket innerhalb von 500 ms zustellen (p95-Ziel).

#### FR-2.5 — Offline Queue / Offline-Warteschlange
**EN** The system SHALL queue messages for offline recipients in DynamoDB. The system SHALL deliver all queued messages in chronological order upon recipient reconnection.  
**DE** Das System SOLL Nachrichten für Offline-Empfänger in DynamoDB in die Warteschlange stellen und bei Wiederverbindung in chronologischer Reihenfolge zustellen.

#### FR-2.6 — Offline Queue TTL / TTL der Offline-Warteschlange
**EN** The system SHALL apply a DynamoDB TTL of 30 days to undelivered queued messages. Messages not delivered within 30 days SHALL be automatically purged.  
**DE** Das System SOLL eine DynamoDB-TTL von 30 Tagen auf unzugestellte Nachrichten in der Warteschlange anwenden.

#### FR-2.7 — Read Receipts / Lesebestätigungen
**EN** The system SHALL record a `readAt` timestamp on a message when the recipient opens the conversation containing that message. The system SHALL notify the sender of the read receipt via WebSocket or on next connection.  
**DE** Das System SOLL einen `readAt`-Zeitstempel auf einer Nachricht aufzeichnen, wenn der Empfänger das Gespräch öffnet.

#### FR-2.8 — Message Deletion / Nachrichtenlöschung
**EN** The system SHALL allow either conversation participant to permanently delete any message. Deletion SHALL be a hard delete from DynamoDB with no recovery. The system SHALL relay the deletion event to the other participant.  
**DE** Das System SOLL jedem Gesprächsteilnehmer erlauben, jede Nachricht dauerhaft zu löschen (Hard Delete, keine Wiederherstellung).

#### FR-2.9 — Conversation History / Gesprächsverlauf
**EN** The system SHALL return paginated conversation history (50 messages per page) in reverse chronological order.  
**DE** Das System SOLL paginierte Gesprächshistorie (50 Nachrichten pro Seite) in umgekehrter chronologischer Reihenfolge zurückgeben.

#### FR-2.10 — Message Length Limit / Nachrichtenlängenbegrenzung
**EN** The system SHALL reject messages exceeding 10,000 characters (measured pre-encryption on the client).  
**DE** Das System SOLL Nachrichten ablehnen, die 10.000 Zeichen überschreiten (gemessen vor der Verschlüsselung auf dem Client).

#### FR-2.11 — One Conversation Per Pair / Ein Gespräch pro Paar
**EN** The system SHALL enforce one conversation per contact pair. Opening a conversation with an existing contact SHALL return the existing conversation.  
**DE** Das System SOLL ein Gespräch pro Kontaktpaar erzwingen.

---

### 3.3 GDPR & Compliance / Datenschutz & Compliance

#### FR-3.1 — Right to Erasure / Recht auf Löschung
**EN** The system SHALL provide an account deletion endpoint that permanently removes all personal data: profile, messages (sent and received), contacts, and active sessions. Cognito account SHALL be deleted. Invite chain records SHALL be anonymised (PII removed, chain structure preserved). Processing SHALL complete within 30 days.  
**DE** Das System SOLL einen Konto-Lösch-Endpunkt bereitstellen, der alle persönlichen Daten dauerhaft entfernt. Die Verarbeitung SOLL innerhalb von 30 Tagen abgeschlossen sein.

**GDPR Reference:** Art. 17

#### FR-3.2 — Data Portability / Datenportabilität
**EN** The system SHALL provide a data export endpoint returning all personal data in structured JSON format: profile, contacts, invite records, message metadata, and ciphertext. A download link SHALL be delivered to the member's email within 72 hours of request.  
**DE** Das System SOLL einen Datenexport-Endpunkt bereitstellen, der alle persönlichen Daten als strukturiertes JSON zurückgibt.

**GDPR Reference:** Art. 20

#### FR-3.3 — Right of Access / Auskunftsrecht
**EN** The system SHALL allow members to retrieve all data held about them via an authenticated API endpoint.  
**DE** Das System SOLL Mitgliedern erlauben, alle über sie gespeicherten Daten über einen authentifizierten API-Endpunkt abzurufen.

**GDPR Reference:** Art. 15

#### FR-3.4 — Consent Recording / Einwilligungserfassung
**EN** The system SHALL record explicit consent at registration with a timestamp. Consent record SHALL be preserved even after account deletion (anonymised).  
**DE** Das System SOLL bei der Registrierung eine explizite Einwilligung mit Zeitstempel aufzeichnen.

**GDPR Reference:** Art. 5 §1a, Art. 7

#### FR-3.5 — Audit Trail / Prüfpfad
**EN** The system SHALL maintain an invite chain audit trail. Each record SHALL contain: inviter ID, hashed invitee email, request timestamp, approval timestamp. PII SHALL be removed on account deletion but chain structure SHALL be preserved.  
**DE** Das System SOLL einen Einladungsketten-Prüfpfad pflegen.

**GDPR Reference:** Art. 5 §2

#### FR-3.6 — No PII in Logs / Keine PII in Logs
**EN** The system SHALL NOT include any personally identifiable information in CloudWatch log entries. This includes email addresses, display names, and message content.  
**DE** Das System SOLL keine personenbezogenen Daten in CloudWatch-Logeinträgen aufnehmen.

**GDPR Reference:** Art. 5 §1c, Art. 32

---

### 3.4 Security / Sicherheit

#### FR-4.1 — JWT Protection on All Routes / JWT-Schutz auf allen Routen
**EN** The system SHALL attach a Cognito JWT authorizer to all HTTP API routes and the WebSocket `$connect` route. Requests without a valid JWT SHALL be rejected with HTTP 401.  
**DE** Das System SOLL einen Cognito-JWT-Authorizer an alle HTTP-API-Routen und die WebSocket-`$connect`-Route anhängen.

#### FR-4.2 — Least Privilege IAM / Minimale IAM-Rechte
**EN** Each Lambda function SHALL have a dedicated IAM role granting access only to the specific DynamoDB tables and actions required for its function. No IAM policy SHALL use wildcard `*` on resource or action.  
**DE** Jede Lambda-Funktion SOLL eine dedizierte IAM-Rolle haben, die nur Zugriff auf die spezifisch benötigten DynamoDB-Tabellen und -Aktionen gewährt.

#### FR-4.3 — Secrets Management / Secrets-Verwaltung
**EN** The system SHALL store all secrets and credentials in AWS Secrets Manager. No secrets SHALL appear in source code, environment files, or CDK output. `.env` files SHALL be absent from the repository.  
**DE** Das System SOLL alle Secrets und Zugangsdaten in AWS Secrets Manager speichern.

#### FR-4.4 — Rate Limiting / Ratenbegrenzung
**EN** The system SHALL configure API Gateway throttling with a default rate of 100 requests/second and burst limit of 200 requests per route. Requests exceeding the limit SHALL receive HTTP 429.  
**DE** Das System SOLL API Gateway Throttling mit einer Standardrate von 100 Anfragen/Sekunde und einem Burst-Limit von 200 Anfragen konfigurieren.

#### FR-4.5 — Input Validation / Eingabevalidierung
**EN** All Lambda handlers SHALL validate and sanitise input before processing. Invalid input SHALL return HTTP 400 with a descriptive error message.  
**DE** Alle Lambda-Handler SOLLEN Eingaben vor der Verarbeitung validieren und bereinigen.

#### FR-4.6 — Dependency Security / Abhängigkeitssicherheit
**EN** The CI pipeline SHALL run `npm audit --audit-level=high` and fail on detection of high or critical severity vulnerabilities.  
**DE** Die CI-Pipeline SOLL `npm audit --audit-level=high` ausführen und bei hochgradigen Schwachstellen fehlschlagen.

---

### 3.5 Observability / Beobachtbarkeit

#### FR-5.1 — Structured Logging / Strukturiertes Logging
**EN** All Lambda functions SHALL use AWS Lambda Powertools Logger to emit structured JSON logs. Every log entry SHALL include requestId, correlationId, log level, and timestamp.  
**DE** Alle Lambda-Funktionen SOLLEN AWS Lambda Powertools Logger verwenden, um strukturierte JSON-Logs auszugeben.

#### FR-5.2 — Distributed Tracing / Verteiltes Tracing
**EN** All Lambda functions SHALL have AWS X-Ray tracing enabled. Lambda Powertools Tracer SHALL create subsegments for all DynamoDB operations.  
**DE** Alle Lambda-Funktionen SOLLEN AWS X-Ray Tracing aktiviert haben.

#### FR-5.3 — Error Alerting / Fehlerbenachrichtigung
**EN** The system SHALL configure a CloudWatch alarm that triggers when any Lambda function error rate exceeds 5% over a 5-minute window. The alarm SHALL notify the admin via SNS email.  
**DE** Das System SOLL einen CloudWatch-Alarm konfigurieren, der ausgelöst wird, wenn die Fehlerrate einer Lambda-Funktion 5% über 5 Minuten überschreitet.

#### FR-5.4 — CI/CD Pipeline / CI/CD-Pipeline
**EN** The system SHALL have a GitHub Actions pipeline that executes on every push to `main` in the following order: lint → type-check → unit tests → CDK synth → npm audit → deploy. The pipeline SHALL fail fast on the first failing stage.  
**DE** Das System SOLL eine GitHub-Actions-Pipeline haben, die bei jedem Push auf `main` ausgeführt wird.

---

## 4. Non-Functional Requirements / Nicht-funktionale Anforderungen

### 4.1 Security / Sicherheit

#### NFR-1.1 — End-to-End Encryption
**EN** Message content SHALL be encrypted on the sending client using XSalsa20-Poly1305 (libsodium `box`) before transmission. The server SHALL never receive, store, or process plaintext message content.  
**DE** Nachrichteninhalte SOLLEN auf dem sendenden Client mit XSalsa20-Poly1305 (libsodium `box`) verschlüsselt werden, bevor sie übertragen werden.

#### NFR-1.2 — Key Exchange Protocol
**EN** The system SHALL use ECDH X25519 (Curve25519) for session key exchange. Key exchange SHALL occur client-side only. The server SHALL relay public keys but SHALL NOT participate in or store derived shared secrets.  
**DE** Das System SOLL ECDH X25519 (Curve25519) für den Sitzungsschlüsselaustausch verwenden. Der Austausch SOLL nur clientseitig erfolgen.

#### NFR-1.3 — Forward Secrecy
**EN** The system SHALL implement forward secrecy. Loss of a user's keypair SHALL NOT enable decryption of previously stored ciphertext. Each conversation session SHALL use an independently derived shared secret.  
**DE** Das System SOLL Forward Secrecy implementieren. Der Verlust eines Schlüsselpaares SOLL keine Entschlüsselung zuvor gespeicherter Chiffretexte ermöglichen.

#### NFR-1.4 — Transport Security
**EN** All communications between clients and the server SHALL use TLS 1.2 or higher. HTTP connections SHALL NOT be supported.  
**DE** Alle Kommunikationen zwischen Clients und dem Server SOLLEN TLS 1.2 oder höher verwenden.

#### NFR-1.5 — Encryption at Rest
**EN** All DynamoDB tables SHALL have server-side encryption enabled using AWS-managed keys (SSE-S3 minimum, SSE-KMS preferred).  
**DE** Alle DynamoDB-Tabellen SOLLEN serverseitige Verschlüsselung mit AWS-verwalteten Schlüsseln aktiviert haben.

#### NFR-1.6 — Authentication Strength
**EN** Passwords SHALL meet minimum requirements: 8 characters minimum, at least one uppercase letter, one lowercase letter, one number. Requirements enforced by Cognito User Pool policy.  
**DE** Passwörter SOLLEN Mindestanforderungen erfüllen: mindestens 8 Zeichen, mindestens ein Großbuchstabe, ein Kleinbuchstabe, eine Zahl.

---

### 4.2 Performance / Leistung

#### NFR-2.1 — Message Delivery Latency
**EN** Real-time message delivery to online recipients SHALL achieve p95 latency of ≤ 500ms measured from server receipt to WebSocket delivery.  
**DE** Die Echtzeit-Nachrichtenzustellung SOLL eine p95-Latenz von ≤ 500 ms erreichen.

#### NFR-2.2 — API Response Time
**EN** All REST API endpoints SHALL respond within 1000ms at p95 under normal load, excluding cold start invocations.  
**DE** Alle REST-API-Endpunkte SOLLEN innerhalb von 1000 ms bei p95 unter normaler Last antworten.

#### NFR-2.3 — Cold Start Mitigation
**EN** Lambda functions SHALL be implemented in TypeScript (Node.js runtime) with bundle sizes minimised via tree-shaking to reduce cold start duration below 500ms.  
**DE** Lambda-Funktionen SOLLEN in TypeScript (Node.js-Runtime) mit minimierten Bundle-Größen implementiert werden, um die Cold-Start-Dauer unter 500 ms zu halten.

#### NFR-2.4 — Concurrent Users
**EN** The system SHALL support a minimum of 100 concurrent WebSocket connections within AWS Free Tier limits during MVP phase.  
**DE** Das System SOLL mindestens 100 gleichzeitige WebSocket-Verbindungen innerhalb der AWS Free Tier-Limits unterstützen.

---

### 4.3 Reliability / Zuverlässigkeit

#### NFR-3.1 — Availability
**EN** The system SHALL target 99.9% availability, leveraging AWS managed service SLAs (Lambda, DynamoDB, API Gateway, Cognito all provide ≥ 99.9% SLA).  
**DE** Das System SOLL eine Verfügbarkeit von 99,9% anstreben.

#### NFR-3.2 — Message Durability
**EN** Messages written to DynamoDB SHALL not be lost. DynamoDB point-in-time recovery (PITR) SHALL be enabled on all tables.  
**DE** In DynamoDB geschriebene Nachrichten SOLLEN nicht verloren gehen. Point-in-Time-Recovery SOLL auf allen Tabellen aktiviert sein.

#### NFR-3.3 — Graceful Degradation
**EN** If the WebSocket connection is unavailable, the client SHALL fall back to polling REST endpoints for new messages. The offline queue ensures no message loss during degraded connectivity.  
**DE** Bei Nichtverfügbarkeit der WebSocket-Verbindung SOLL der Client auf REST-Endpunkte für neue Nachrichten zurückfallen.

---

### 4.4 Maintainability / Wartbarkeit

#### NFR-4.1 — Clean Architecture
**EN** The codebase SHALL follow a feature-slice clean architecture. Each feature (auth, connection, chat, user) SHALL be self-contained with domain, use-cases, and handlers layers. No cross-feature imports SHALL exist at the domain layer.  
**DE** Die Codebasis SOLL einer Feature-Slice-Clean-Architecture folgen.

#### NFR-4.2 — Test Coverage
**EN** Use case layer SHALL achieve minimum 70% unit test coverage. CDK stacks SHALL have snapshot tests. Lambda handler integration paths SHALL have at least one integration test each.  
**DE** Die Use-Case-Schicht SOLL eine Mindest-Unit-Test-Abdeckung von 70% erreichen.

#### NFR-4.3 — Infrastructure as Code
**EN** ALL infrastructure SHALL be defined in AWS CDK TypeScript. No manual configuration via the AWS Console SHALL be required to deploy a complete environment.  
**DE** DIE GESAMTE Infrastruktur SOLL in AWS CDK TypeScript definiert sein.

#### NFR-4.4 — Documentation
**EN** All architectural decisions SHALL be documented as ADRs in `/docs/adr/`. All public Lambda handler interfaces SHALL have JSDoc comments.  
**DE** Alle Architekturentscheidungen SOLLEN als ADRs in `/docs/adr/` dokumentiert werden.

---

### 4.5 GDPR & Legal / DSGVO & Rechtliches

#### NFR-5.1 — EU Data Residency
**EN** All personal data SHALL be stored exclusively in AWS region `eu-central-1` (Frankfurt, Germany). No data SHALL be transferred outside the EU/EEA.  
**DE** Alle personenbezogenen Daten SOLLEN ausschließlich in der AWS-Region `eu-central-1` (Frankfurt, Deutschland) gespeichert werden.

**GDPR Reference:** Art. 44–49

#### NFR-5.2 — Data Minimisation
**EN** The system SHALL collect and store only data strictly necessary for the stated purpose. No telemetry, analytics, or behavioural data SHALL be collected.  
**DE** Das System SOLL nur Daten erheben und speichern, die für den angegebenen Zweck unbedingt erforderlich sind.

**GDPR Reference:** Art. 5 §1c

#### NFR-5.3 — Erasure Completeness
**EN** Account deletion SHALL remove all personal data within 30 days. Automated verification tests SHALL confirm cascade deletion covers all DynamoDB tables.  
**DE** Die Kontolöschung SOLL alle personenbezogenen Daten innerhalb von 30 Tagen entfernen.

**GDPR Reference:** Art. 17

#### NFR-5.4 — Processor Agreements
**EN** AWS Data Processing Addendum (DPA) covers Cognito, SES, DynamoDB, Lambda, and CloudWatch usage. No additional processor agreements are required for MVP.  
**DE** Der AWS Data Processing Addendum (DPA) deckt die Nutzung von Cognito, SES, DynamoDB, Lambda und CloudWatch ab.

**GDPR Reference:** Art. 28

---

## 5. System Constraints / Systembeschränkungen

| Constraint | Description EN | Beschreibung DE |
|---|---|---|
| **AWS Free Tier** | System must operate within Free Tier limits during MVP phase | System muss während der MVP-Phase innerhalb der Free-Tier-Limits betrieben werden |
| **No plaintext storage** | Server must never store or process message plaintext — architectural constraint | Server darf niemals Klartext von Nachrichten speichern oder verarbeiten |
| **EU region only** | All AWS resources must be deployed to eu-central-1 | Alle AWS-Ressourcen müssen in eu-central-1 deployt werden |
| **No third-party tracking** | No Google Analytics, Mixpanel, or similar services | Keine Google Analytics, Mixpanel oder ähnliche Dienste |
| **TypeScript only** | All Lambda functions and CDK code in TypeScript (Node.js 20.x) | Alle Lambda-Funktionen und CDK-Code in TypeScript |
| **libsodium client** | Client-side crypto implemented with libsodium-wrappers (browser) and rn-libsodium (mobile) | Clientseitige Krypto mit libsodium-wrappers und rn-libsodium |

---

## 6. External Interface Requirements / Externe Schnittstellenanforderungen

### 6.1 AWS Services

| Service | Usage |
|---|---|
| **API Gateway WebSocket** | Real-time bidirectional messaging |
| **API Gateway HTTP API** | REST endpoints (auth, profile, GDPR) |
| **AWS Lambda (Node.js 20.x)** | All business logic handlers |
| **Amazon DynamoDB** | Primary data store — single-table design |
| **Amazon Cognito User Pools** | Authentication, JWT issuance, SES email |
| **Amazon SES** | Invitation and notification emails (via Cognito) |
| **AWS Secrets Manager** | Runtime secrets injection |
| **AWS X-Ray** | Distributed tracing |
| **Amazon CloudWatch** | Logs, metrics, alarms |

### 6.2 Client Libraries

| Library | Version | Usage |
|---|---|---|
| `libsodium-wrappers` | Latest stable | ECDH X25519 + XSalsa20-Poly1305 (browser) |
| `rn-libsodium` | Latest stable | Same — React Native mobile |

### 6.3 Communication Protocols

| Protocol | Usage |
|---|---|
| **WSS (WebSocket Secure)** | Real-time message delivery — TLS mandatory |
| **HTTPS** | All REST API calls — TLS mandatory |
| **JWT (Bearer token)** | Authentication on all endpoints |

---

## 7. Future Considerations / Zukünftige Überlegungen

> **EN** The following capabilities are explicitly out of MVP scope but are designed for in the data model and architecture.  
> **DE** Die folgenden Funktionen sind explizit außerhalb des MVP-Umfangs, werden jedoch im Datenmodell und der Architektur berücksichtigt.

| ID | Feature | Notes |
|---|---|---|
| FUTURE-01 | Liveness detection | AWS Rekognition Face Liveness — parked due to GDPR Art. 9 biometric complexity |
| FUTURE-02 | Group chat | Sender Key protocol (Signal model) — data model designed, implementation deferred |
| FUTURE-03 | Push notifications | FCM (Android) + APNs (iOS) |
| FUTURE-04 | Multi-realm architecture | Jarl/Network Creator system — data model multi-realm ready |
| FUTURE-05 | Avatar upload | S3 pre-signed URLs |
| FUTURE-06 | MFA / TOTP | Cognito built-in — one config change |
| FUTURE-07 | Media messages | S3 + pre-signed URLs + client-side encryption |
| FUTURE-08 | WAF | AWS WAF on API Gateway — deferred (cost) |
| FUTURE-09 | Admin dashboard UI | Currently admin operates via API |
| FUTURE-10 | Message editing | With edit history |

---

## 8. Appendix / Anhang

### 8.1 Data Model Overview / Datenmodell-Überblick

> Full DynamoDB single-table design defined in `docs/data-model.md`

**Primary entities / Primäre Entitäten:**

| Entity | PK | SK | Key Fields |
|---|---|---|---|
| Member | `USER#<userId>` | `PROFILE` | displayName, bio, status, createdAt, consentAt |
| Contact | `USER#<userId>` | `CONTACT#<contactId>` | createdAt, inviteId |
| Conversation | `CONV#<convId>` | `METADATA` | participant1Id, participant2Id, createdAt |
| Message | `CONV#<convId>` | `MSG#<timestamp>#<msgId>` | senderId, ciphertext, readAt, delivered |
| InviteRequest | `INVITE#<inviteId>` | `REQUEST` | requesterId, recipientEmailHash, status, createdAt |
| InviteToken | `TOKEN#<token>` | `OTP` | inviteId, otp (hashed), expiresAt, consumed |
| Connection | `CONN#<connectionId>` | `USER#<userId>` | userId, connectedAt, TTL |

### 8.2 Encryption Flow Summary / Verschlüsselungsablauf-Zusammenfassung

```
1. Alice opens conversation with Bob
2. Alice generates X25519 keypair (client-side)
3. Alice sends public key to server
4. Server relays Alice's public key to Bob
5. Bob generates X25519 keypair (client-side)
6. Bob sends public key to server
7. Server relays Bob's public key to Alice
8. Alice derives shared secret: ECDH(Alice_private, Bob_public)
9. Bob derives shared secret:  ECDH(Bob_private, Alice_public)
10. Alice_shared_secret == Bob_shared_secret (mathematically guaranteed)
11. Alice encrypts: libsodium.box(message, nonce, Bob_public, Alice_private)
12. Alice sends ciphertext to server
13. Server stores ciphertext — never inspects content
14. Server relays ciphertext to Bob
15. Bob decrypts: libsodium.box.open(ciphertext, nonce, Alice_public, Bob_private)
```

### 8.3 GDPR Compliance Matrix / DSGVO-Compliance-Matrix

| GDPR Article | Requirement | Implementation | FR Reference |
|---|---|---|---|
| Art. 5 §1a | Lawfulness | Consent at registration | FR-3.4 |
| Art. 5 §1b | Purpose limitation | Chat only — no secondary use | NFR-5.2 |
| Art. 5 §1c | Data minimisation | Email hidden, ciphertext only, no analytics | NFR-5.2 |
| Art. 5 §2 | Accountability | Invite chain audit trail | FR-3.5 |
| Art. 7 | Consent | Explicit consent recorded at registration | FR-3.4 |
| Art. 15 | Right of access | GET /users/:id/data | FR-3.3 |
| Art. 17 | Right to erasure | DELETE /users/:id — full cascade | FR-3.1 |
| Art. 20 | Data portability | GET /users/:id/export — JSON | FR-3.2 |
| Art. 25 | Privacy by design | E2E encryption, minimisation, EU residency | NFR-1.1, NFR-5.1 |
| Art. 28 | Processor agreements | AWS DPA covers all services | NFR-5.4 |
| Art. 32 | Security of processing | TLS, encryption at rest, Secrets Manager | NFR-1.4, NFR-1.5 |
| Art. 44 | Data transfers | eu-central-1 only — no cross-border transfer | NFR-5.1 |

### 8.4 Build Order / Buildreihenfolge

**Recommended implementation sequence / Empfohlene Implementierungsreihenfolge:**

```
Week 1:  Infrastructure scaffolding
         lib/ stacks skeleton · DynamoDB table · Cognito setup · CI/CD pipeline

Week 2:  Auth feature slice
         Registration · Login · Password reset · Invite system

Week 3:  Connection + Chat feature slice (Part 1)
         WebSocket connect/disconnect · ECDH key exchange · sendMessage Lambda

Week 4:  Chat feature slice (Part 2)
         Offline queue · Read receipts · Message deletion · History pagination

Week 5:  GDPR + Security hardening
         Erasure endpoint · Export endpoint · IAM hardening · Rate limiting

Week 6:  Observability + Polish
         Powertools logging · X-Ray · CloudWatch alarms · Documentation finalisation
```

