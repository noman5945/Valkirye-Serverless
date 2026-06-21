# Valkirye — Norse Mythology Glossary
# Valkirye — Nordische Mythologie Glossar

> **EN** This document maps Norse mythology concepts to Valkirye product concepts.
> UI and user-facing language uses Norse terms. Code, APIs, database fields, and
> technical documentation use English equivalents.
>
> **DE** Dieses Dokument ordnet nordische Mythologiebegriffe den Valkirye-Produktkonzepten zu.
> Die Benutzeroberfläche verwendet nordische Begriffe. Code, APIs, Datenbankfelder und
> technische Dokumentation verwenden englische Entsprechungen.

---

## The Nine Realms / Die Neun Welten

> In Norse mythology, Yggdrasil — the world tree — connects nine distinct realms.
> In Valkirye, Yggdrasil is the platform itself. The realms are the networks.
> There is no hard limit of nine — the mythology is the inspiration, not the constraint.

```
                    🌳 Yggdrasil
               (The Valkirye Platform)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Ásgarðr          [Realms...]       [Realms...]
  (Asgard)         each a private     each isolated
  Platform          community          from others
   Admin
```

---

## Role Hierarchy / Rollenhierarchie

| UI Term (Norse) | Code Term (English) | Description EN | Beschreibung DE |
|---|---|---|---|
| **Ásgarðr** | `platform_admin` | The Valkirye platform owner. Absolute authority. Sees all realms. Approves Jarls. Can revoke anyone. | Der Valkirye-Plattformbesitzer. Absolute Autorität. Sieht alle Reiche. Genehmigt Jarls. Kann jeden widerrufen. |
| **Jarl** | `realm_admin` | A Network Creator. Applies to Ásgarðr for authority. Creates and governs one or more Realms. Invites first members freely. Approves member invite requests. | Ein Netzwerkersteller. Bewirbt sich bei Ásgarðr. Erstellt und regiert ein oder mehrere Reiche. Lädt erste Mitglieder frei ein. |
| **Einherjar** | `member` | A Realm Member. Invited and approved. Can message any member in the same Realm. Can request to invite others (Jarl approves). | Ein Reichsmitglied. Eingeladen und genehmigt. Kann jedem Mitglied im selben Reich schreiben. Kann andere einladen (Jarl genehmigt). |
| **Valkyrja** | `invite` | An invitation. Carries the invitee to their Realm. Single-use. Issued by Ásgarðr (for Jarls) or Jarl (for Einherjar). | Eine Einladung. Trägt den Eingeladenen in sein Reich. Einmalig verwendbar. |

> **Note on Einherjar:** In Norse myth, the Einherjar are the chosen warriors who dwell in
> Valhalla — selected by the Valkyries. In Valkirye, they are the chosen members of each
> Realm — selected via invitation. The singular is **Einheri**.

---

## Core Concepts / Kernkonzepte

| UI Term (Norse) | Code Term (English) | Description |
|---|---|---|
| **Realm** | `network` | An isolated private community. Has one Jarl (admin). Members can only see and message within their own Realm(s). |
| **Yggdrasil** | `platform` | The Valkirye platform itself — the world tree connecting all Realms. |
| **Bifröst** | `invite_link` | The bridge between realms — the invitation link that carries a new member in. Single-use, expires in 72h. |
| **Rune** | `otp` | The one-time password delivered by email alongside the Bifröst link. Single-use, no time limit. |
| **The Veil** | `encryption` | The end-to-end encryption layer. The server (Yggdrasil) cannot see beyond the Veil. |
| **Seiðr** | `key_exchange` | The ECDH X25519 key exchange — the magic ritual that establishes The Veil between two Einherjar. |
| **Völva** | `keypair` | The user's cryptographic keypair. Losing the Völva means losing all history — forward secrecy by design. |
| **Ragnarök** | `account_deletion` | Full account erasure — the end of a user's existence in all Realms. Cascades all data. GDPR Art. 17. |

---

## UI Copy Examples / UI-Text-Beispiele

> How Norse terms appear in the actual product interface

| Context | UI Text |
|---|---|
| Registration screen | *"You have been chosen. Enter your Rune to join the Realm."* |
| Invite link expired | *"The Bifröst has faded. Ask your Jarl for a new invitation."* |
| Send invite request | *"Request a Valkyrja for someone you trust."* |
| Key exchange on connect | *"Performing Seiðr…"* |
| Account deletion warning | *"This is Ragnarök. Your presence in all Realms will be erased forever."* |
| New keypair warning | *"Your Völva has changed. Ancient messages are beyond the Veil."* |
| Empty conversation | *"The Veil is ready. Speak freely."* |
| Offline queue delivered | *"Messages from the void delivered."* |

---

## The Nine Realms — Reference / Referenz der Neun Welten

> For flavour and future use — each real Norse realm and its potential Valkirye meaning

| Norse Realm | Mythology | Valkirye Flavour |
|---|---|---|
| **Ásgarðr** | Home of the Æsir gods | Platform Admin — the gods' seat |
| **Miðgarðr** | Home of humans | The everyday members — Einherjar |
| **Jötunheimr** | Home of giants — powerful, independent | Jarls — powerful realm builders |
| **Valhölla** | Hall of the chosen slain | Future: premium or verified members |
| **Álfheimr** | Home of the light elves | Future: trusted, long-standing members |
| **Niðavellir** | Home of the dwarves — master craftsmen | Future: developers / API users |
| **Niflheimr** | Realm of ice and mist — the void | Deleted accounts — the forgotten |
| **Múspellsheim** | Realm of fire — primordial, dangerous | Banned/revoked users |
| **Helheimr** | Realm of the dead | Archived/suspended realms |

---

## What Never Changes / Was sich nie ändert

> These terms are **always English** regardless of context:
> - All code identifiers (`realmId`, `memberId`, `inviteToken`)
> - All API endpoints (`POST /networks`, `GET /users/:id`)
> - All database field names
> - All ADRs and technical documentation
> - All error codes and logs

---

## Naming Convention Summary / Namenskonventionen

```
UI Layer          →  Norse terms     (Realm, Jarl, Bifröst, Rune, Veil)
Product docs      →  Both            (Realm (network), Jarl (realm_admin))
Code / APIs       →  English only    (network, realm_admin, invite_token)
Database fields   →  English only    (networkId, adminId, inviteToken)
Error messages    →  English only    (INVITE_EXPIRED, MEMBER_NOT_FOUND)
Test files        →  English only
ADRs              →  English only
```
