# D-07 — Message State Machine / Nachrichten-Zustandsautomat

> **EN** Every state a message can be in, and every valid transition.
> Covers FR-2.4–2.8.
>
> **DE** Alle Zustände, die eine Nachricht annehmen kann, und alle gültigen
> Übergänge.

```mermaid
stateDiagram-v2
    [*] --> Created: client encrypts + sends ciphertext

    Created --> StoredQueued: recipient offline
    Created --> StoredDelivered: recipient online, relay succeeds

    StoredQueued --> StoredDelivered: recipient reconnects, queue flushed
    StoredQueued --> Purged: TTL 30 days elapsed, never delivered

    StoredDelivered --> Read: recipient opens conversation

    Created --> Deleted: either party deletes
    StoredQueued --> Deleted: either party deletes
    StoredDelivered --> Deleted: either party deletes
    Read --> Deleted: either party deletes

    Deleted --> [*]: hard delete from DynamoDB
    Purged --> [*]: TTL automatic removal

    note right of Created
        delivered = false
        readAt = null
    end note

    note right of StoredQueued
        delivered = false
        ttl set (30 days)
    end note

    note right of StoredDelivered
        delivered = true
        ttl removed
    end note

    note right of Read
        readAt = timestamp
        read receipt relayed to sender
    end note

    note right of Deleted
        hard delete, no recovery
        deletion event relayed
    end note
```

## Implementation Notes / Implementierungshinweise

- **Deletion is reachable from every state** — the delete handler must not assume a message has been delivered or read first
- **Two distinct terminal paths** — `Deleted` (explicit user action) vs `Purged` (automatic TTL expiry) — distinguish these in any future audit logging
- **`StoredQueued` → `Purged`** only applies to undelivered messages — once `delivered = true`, TTL is removed and the message persists until explicitly deleted

## Related Requirements / Verwandte Anforderungen
FR-2.4 — FR-2.8 (`docs/srs.md` §3.2)
