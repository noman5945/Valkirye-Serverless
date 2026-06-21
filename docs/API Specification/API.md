# API Specification / API-Spezifikation — Valkirye MVP

> **EN** Complete REST and WebSocket API reference. All endpoints require a
> valid Cognito JWT (`Authorization: Bearer <token>`) unless marked **Public**.
> Endpoints marked **Admin** additionally require the `Admins` Cognito group
> claim (see `docs/diagrams/D-02-erd.md` Role Model).
>
> **DE** Vollständige REST- und WebSocket-API-Referenz. Alle Endpunkte
> erfordern ein gültiges Cognito-JWT, sofern nicht als **Public** markiert.
> Mit **Admin** markierte Endpunkte erfordern zusätzlich die `Admins`-Gruppe.

**Base URL (HTTP):** `https://api.valkirye.app/v1`  
**Base URL (WebSocket):** `wss://ws.valkirye.app`

---

## Table of Contents

1. [Auth](#1-auth)
2. [Invitations](#2-invitations)
3. [User / Profile](#3-user--profile)
4. [GDPR](#4-gdpr)
5. [Chat (REST)](#5-chat-rest)
6. [WebSocket Routes](#6-websocket-routes)
7. [Error Format](#7-error-format)
8. [Common Types](#8-common-types)

---

## 1. Auth

### POST `/auth/register` — **Public**

**EN** Complete registration using a valid Bifröst link token and OTP.  
**Maps to:** UC-01, FR-1.1, FR-1.3

**Request:**

```json
{
  "token": "string (from invite link)",
  "otp": "string (6-digit code)",
  "displayName": "string (2-50 chars)",
  "password": "string (min 8 chars, 1 upper, 1 lower, 1 number)"
}
```

**Response `201 Created`:**

```json
{
  "userId": "uuid",
  "displayName": "string",
  "role": "member",
  "createdAt": "ISO 8601 timestamp"
}
```

**Errors:** `400` invalid input · `410` link expired · `409` OTP already used

---

### POST `/auth/login` — **Public**

**EN** Authenticate with email and password.  
**Maps to:** UC-02, FR-1.5

**Request:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200 OK`:**

```json
{
  "accessToken": "JWT (1h expiry)",
  "refreshToken": "string (30 day expiry)",
  "userId": "uuid",
  "role": "admin | member"
}
```

**Errors:** `401` invalid credentials · `403` account revoked

---

### POST `/auth/refresh` — **Public**

**EN** Exchange a valid refresh token for a new access token.  
**Maps to:** FR-1.6

**Request:**

```json
{
  "refreshToken": "string"
}
```

**Response `200 OK`:**

```json
{
  "accessToken": "JWT (1h expiry)"
}
```

**Errors:** `401` refresh token expired or invalid

---

### POST `/auth/logout`

**EN** Invalidate the current session.

**Request:** _(empty body)_

**Response `204 No Content`**

---

### POST `/auth/password-reset/request` — **Public**

**EN** Request a password reset email.  
**Maps to:** UC-02 (A-variant), FR-1.7

**Request:**

```json
{
  "email": "string"
}
```

**Response `202 Accepted`:**

```json
{
  "message": "If this email exists, a reset link has been sent."
}
```

> **Note:** Always returns 202 regardless of whether the email exists — prevents user enumeration.

---

### POST `/auth/password-reset/confirm` — **Public**

**EN** Set a new password using the reset token.

**Request:**

```json
{
  "resetToken": "string",
  "newPassword": "string"
}
```

**Response `200 OK`:**

```json
{
  "message": "Password updated. All sessions have been logged out."
}
```

**Errors:** `400` weak password · `410` reset token expired

---

## 2. Invitations

### POST `/invitations/request`

**EN** Submit an invite request for someone to join.  
**Maps to:** UC-03, FR-1.9

**Request:**

```json
{
  "recipientEmail": "string",
  "note": "string (optional, max 200 chars)"
}
```

**Response `201 Created`:**

```json
{
  "inviteId": "uuid",
  "status": "pending",
  "createdAt": "ISO 8601 timestamp"
}
```

**Errors:** `429` max 5 pending requests reached · `409` email already registered

---

### GET `/invitations/mine`

**EN** List the requesting member's own invite requests and their status.

**Response `200 OK`:**

```json
{
  "invitations": [
    {
      "inviteId": "uuid",
      "recipientEmailMasked": "j***@example.com",
      "status": "pending | approved | denied | used | expired",
      "createdAt": "ISO 8601 timestamp",
      "resolvedAt": "ISO 8601 timestamp | null"
    }
  ]
}
```

---

### GET `/invitations/pending` — **Admin**

**EN** List all pending invite requests for admin review.  
**Maps to:** UC-03, FR-1.10

**Response `200 OK`:**

```json
{
  "invitations": [
    {
      "inviteId": "uuid",
      "requesterId": "uuid",
      "requesterDisplayName": "string",
      "recipientEmailMasked": "j***@example.com",
      "note": "string | null",
      "createdAt": "ISO 8601 timestamp"
    }
  ]
}
```

---

### POST `/invitations/{inviteId}/approve` — **Admin**

**EN** Approve a pending invite request — generates Bifröst link + OTP, sends email.  
**Maps to:** UC-03, FR-1.10

**Request:** _(empty body)_

**Response `200 OK`:**

```json
{
  "inviteId": "uuid",
  "status": "approved",
  "linkExpiresAt": "ISO 8601 timestamp (+72h)"
}
```

**Errors:** `404` invite not found · `409` already resolved

---

### POST `/invitations/{inviteId}/deny` — **Admin**

**EN** Deny a pending invite request.

**Request:**

```json
{
  "adminNote": "string (optional)"
}
```

**Response `200 OK`:**

```json
{
  "inviteId": "uuid",
  "status": "denied"
}
```

---

## 3. User / Profile

### GET `/users/me`

**EN** Get the authenticated member's own profile.

**Response `200 OK`:**

```json
{
  "userId": "uuid",
  "displayName": "string",
  "bio": "string | null",
  "status": "string | null",
  "role": "admin | member",
  "email": "string",
  "createdAt": "ISO 8601 timestamp"
}
```

> **Note:** Email is only ever returned to the user themselves — FR-1.12.

---

### GET `/users/{userId}`

**EN** Get another member's public profile (contact only).  
**Maps to:** UC visibility rules

**Response `200 OK`:**

```json
{
  "userId": "uuid",
  "displayName": "string",
  "bio": "string | null",
  "status": "string | null"
}
```

**Errors:** `403` not a contact — email and other PII never included

---

### PATCH `/users/me`

**EN** Update the authenticated member's profile.  
**Maps to:** US-04, FR-1.8

**Request:**

```json
{
  "displayName": "string (2-50 chars, optional)",
  "bio": "string (max 200 chars, optional)",
  "status": "string (max 100 chars, optional)"
}
```

**Response `200 OK`:**

```json
{
  "userId": "uuid",
  "displayName": "string",
  "bio": "string | null",
  "status": "string | null"
}
```

**Errors:** `400` validation failure

---

### GET `/users/me/contacts`

**EN** List the authenticated member's contacts (auto-populated from invite chain).

**Response `200 OK`:**

```json
{
  "contacts": [
    {
      "userId": "uuid",
      "displayName": "string",
      "status": "string | null"
    }
  ]
}
```

---

### DELETE `/users/{userId}` — **Admin**

**EN** Revoke a member account immediately.  
**Maps to:** US-08, FR-1.11

**Response `204 No Content`**

**Errors:** `404` user not found · `403` cannot revoke self

---

## 4. GDPR

### GET `/users/me/data`

**EN** View all data held about the authenticated member.  
**Maps to:** US-19, FR-3.3, GDPR Art. 15

**Response `200 OK`:**

```json
{
  "profile": { "...": "full profile incl. email" },
  "contacts": ["..."],
  "invitations": ["..."],
  "messageCount": "number",
  "consentRecordedAt": "ISO 8601 timestamp"
}
```

---

### POST `/users/me/export`

**EN** Request a full data export as downloadable JSON.  
**Maps to:** US-17, FR-3.2, GDPR Art. 20

**Request:** _(empty body)_

**Response `202 Accepted`:**

```json
{
  "message": "Export requested. A download link will be emailed within 72 hours.",
  "requestedAt": "ISO 8601 timestamp"
}
```

---

### DELETE `/users/me` (Ragnarök)

**EN** Permanently delete own account and all associated data.  
**Maps to:** US-07, US-18, FR-3.1, GDPR Art. 17

**Request:**

```json
{
  "confirmation": "string (must equal \"DELETE MY ACCOUNT\")"
}
```

**Response `202 Accepted`:**

```json
{
  "message": "Account deletion in progress. This is irreversible.",
  "requestedAt": "ISO 8601 timestamp"
}
```

**Errors:** `400` confirmation string mismatch

---

## 5. Chat (REST)

### GET `/conversations`

**EN** List all conversations for the authenticated member.

**Response `200 OK`:**

```json
{
  "conversations": [
    {
      "convId": "uuid",
      "contactId": "uuid",
      "contactDisplayName": "string",
      "lastMessageAt": "ISO 8601 timestamp | null",
      "unreadCount": "number"
    }
  ]
}
```

---

### POST `/conversations`

**EN** Open (or retrieve existing) conversation with a contact.  
**Maps to:** UC-04, FR-2.1, FR-2.11

**Request:**

```json
{
  "contactId": "uuid"
}
```

**Response `200 OK`:**

```json
{
  "convId": "uuid",
  "createdAt": "ISO 8601 timestamp"
}
```

**Errors:** `403` target is not a contact

---

### GET `/conversations/{convId}/messages`

**EN** Get paginated conversation history.  
**Maps to:** UC, US-15, FR-2.9

**Query params:** `?cursor=<string>&limit=50`

**Response `200 OK`:**

```json
{
  "messages": [
    {
      "msgId": "uuid",
      "senderId": "uuid",
      "ciphertext": "base64 string",
      "nonce": "base64 string",
      "createdAt": "ISO 8601 timestamp",
      "readAt": "ISO 8601 timestamp | null"
    }
  ],
  "nextCursor": "string | null"
}
```

---

## 6. WebSocket Routes

> **EN** Connection requires `Authorization` header with JWT during the
> handshake (`$connect`). All subsequent messages are JSON frames routed by
> the `action` field.

### `$connect`

**EN** Establish WebSocket connection. Triggers offline message queue delivery.  
**Maps to:** D-05, FR-2.4, FR-2.5

**Client → Server:** _(handshake only, JWT in header)_

**Server → Client (on queued messages):**

```json
{
  "action": "queuedMessages",
  "messages": ["...same shape as REST history..."]
}
```

---

### `$disconnect`

**EN** Clean up connection record. No client action required.

---

### `exchangeKey`

**EN** Send X25519 public key to initiate or continue key exchange.  
**Maps to:** D-04, FR-2.2

**Client → Server:**

```json
{
  "action": "exchangeKey",
  "convId": "uuid",
  "publicKey": "base64 string (X25519)"
}
```

**Server → Other Client:**

```json
{
  "action": "keyExchanged",
  "convId": "uuid",
  "fromUserId": "uuid",
  "publicKey": "base64 string"
}
```

---

### `sendMessage`

**EN** Send an encrypted message.  
**Maps to:** D-05, UC-05, FR-2.3, FR-2.4

**Client → Server:**

```json
{
  "action": "sendMessage",
  "convId": "uuid",
  "ciphertext": "base64 string",
  "nonce": "base64 string"
}
```

**Server → Recipient (if online):**

```json
{
  "action": "newMessage",
  "convId": "uuid",
  "msgId": "uuid",
  "senderId": "uuid",
  "ciphertext": "base64 string",
  "nonce": "base64 string",
  "createdAt": "ISO 8601 timestamp"
}
```

---

### `markRead`

**EN** Mark a message as read — triggers read receipt.  
**Maps to:** UC, US-13, FR-2.7

**Client → Server:**

```json
{
  "action": "markRead",
  "msgId": "uuid"
}
```

**Server → Sender (if online):**

```json
{
  "action": "readReceipt",
  "msgId": "uuid",
  "readAt": "ISO 8601 timestamp"
}
```

---

### `deleteMessage`

**EN** Delete a message for both parties.  
**Maps to:** UC-06, US-14, FR-2.8

**Client → Server:**

```json
{
  "action": "deleteMessage",
  "msgId": "uuid"
}
```

**Server → Other Client (if online):**

```json
{
  "action": "messageDeleted",
  "msgId": "uuid"
}
```

---

## 7. Error Format

**EN** All REST errors follow a consistent shape.

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "displayName must be between 2 and 50 characters",
  "timestamp": "ISO 8601 timestamp",
  "path": "/users/me"
}
```

**Standard error codes:**

| Code               | HTTP Status | Meaning                                                |
| ------------------ | ----------- | ------------------------------------------------------ |
| `VALIDATION_ERROR` | 400         | Input failed validation                                |
| `UNAUTHORIZED`     | 401         | Missing or invalid JWT                                 |
| `FORBIDDEN`        | 403         | Valid JWT but insufficient permission                  |
| `NOT_FOUND`        | 404         | Resource does not exist                                |
| `CONFLICT`         | 409         | State conflict (e.g. OTP already used)                 |
| `GONE`             | 410         | Resource expired (e.g. invite link)                    |
| `RATE_LIMITED`     | 429         | Too many requests                                      |
| `INTERNAL_ERROR`   | 500         | Unexpected server error — logged, never exposes detail |

---

## 8. Common Types

```typescript
type UUID = string; // v4 UUID
type ISO8601 = string; // e.g. "2026-06-20T14:30:00Z"
type Base64 = string; // binary data encoded as base64
type Role = "admin" | "member";
type InviteStatus = "pending" | "approved" | "denied" | "used" | "expired";
```
