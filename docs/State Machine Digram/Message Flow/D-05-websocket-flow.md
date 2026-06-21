# D-05 — WebSocket Message Flow / WebSocket-Nachrichtenfluss

> **EN** Complete message journey: connection, key exchange, send, relay,
> offline queue, delivery, and read receipts. Covers UC-04, UC-05, FR-2.1–2.9.
>
> **DE** Vollständige Nachrichtenreise: Verbindung, Schlüsselaustausch, Senden,
> Weiterleitung, Offline-Warteschlange, Zustellung und Lesebestätigungen.

```mermaid
sequenceDiagram
    participant A as Alice (client)
    participant GW as API Gateway WS
    participant L as Lambda (NestJS)
    participant DB as DynamoDB
    participant B as Bob (client)

    rect rgba(42,157,143,0.1)
    note over A,B: Connection phase
    A->>GW: WSS connect (JWT in header)
    GW->>L: $connect event
    L->>L: verify JWT
    L->>DB: store WS_CONNECTION (TTL 2h)
    L-->>A: connection accepted
    end

    rect rgba(38,109,178,0.1)
    note over A,B: Key exchange (per conversation)
    A->>GW: send X25519 pubkey
    GW->>L: route to chat handler
    L->>DB: check Bob connection status
    alt Bob online
        L->>GW: relay pubkey to Bob
        GW->>B: deliver pubkey
        B->>GW: send Bob's pubkey back
        GW->>L: route to chat handler
        L->>GW: relay to Alice
        GW->>A: deliver Bob's pubkey
    else Bob offline
        L->>DB: store pubkey for later delivery
    end
    note over A,B: Both derive shared secret independently (see D-04)
    end

    rect rgba(231,111,81,0.1)
    note over A,B: Send message
    A->>A: encrypt message (XSalsa20-Poly1305)
    A->>GW: send ciphertext + convId
    GW->>L: route to sendMessage handler
    L->>DB: store MESSAGE (ciphertext, delivered=false)

    alt Bob online
        L->>GW: relay ciphertext
        GW->>B: deliver ciphertext
        B->>B: decrypt with shared secret
        L->>DB: update delivered=true
    else Bob offline
        note over L,DB: message queued, TTL 30 days
    end
    end

    rect rgba(233,196,106,0.15)
    note over A,B: Offline delivery on reconnect
    B->>GW: WSS connect (JWT in header)
    GW->>L: $connect event
    L->>DB: query undelivered messages for Bob
    DB-->>L: queued ciphertext messages
    L->>GW: relay all queued (chronological)
    GW->>B: deliver queued messages
    L->>DB: mark all delivered=true
    end

    rect rgba(42,157,143,0.1)
    note over A,B: Read receipt
    B->>B: opens conversation
    B->>GW: send readReceipt(msgId)
    GW->>L: route to chat handler
    L->>DB: set readAt timestamp
    alt Alice online
        L->>GW: relay read receipt
        GW->>A: deliver read receipt
    else Alice offline
        note over L,DB: receipt delivered on Alice reconnect
    end
    end
```

## Implementation Notes / Implementierungshinweise

- **One `$connect` handler serves two purposes** — fresh connection AND offline message sync. No separate sync endpoint needed; connecting triggers the queued-message check automatically.
- **Encryption happens entirely client-side** (`A->>A: encrypt message`) — the Lambda layer never has access to plaintext at any point in this flow.
- **Key exchange and message relay share the same online/offline branching pattern** — both check `WS_CONNECTION` existence before deciding to relay live or store-and-forward.
- **`delivered` flag transitions false → true** exactly once, either immediately (online path) or on reconnect (offline path) — never reverts.

## Related Requirements / Verwandte Anforderungen
- FR-2.1 — FR-2.9 (`docs/srs.md` §3.2)
- UC-04 (open conversation), UC-05 (send/receive) — `docs/requirements/use-cases.md`
- See `docs/diagrams/D-04-encryption-flow.md` for the key exchange cryptographic detail
