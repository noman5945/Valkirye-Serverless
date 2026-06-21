# D-04 — ECDH Key Exchange & Encryption Flow / ECDH-Schlüsselaustausch & Verschlüsselungsablauf

> **EN** The cryptographic mechanics underlying D-05's "key exchange" and "send
> message" phases. Proves the server-blind relay claim mathematically.
> Covers NFR-1.1, NFR-1.2, NFR-1.3.
>
> **DE** Die kryptografischen Mechanismen hinter den Phasen "Schlüsselaustausch"
> und "Nachricht senden" aus D-05. Belegt mathematisch, dass der Server blind
> ist (reiner Relay).

## Key Exchange (once per conversation) / Schlüsselaustausch (einmal pro Gespräch)

```
Alice                              Server                              Bob
  │                                   │                                  │
  ├─ generate X25519 keypair          │           generate X25519 keypair
  │  (privA, pubA)                    │                    (privB, pubB) ┤
  │                                   │                                  │
  ├─ send pubA ──────────────────────►│                                  │
  │                                   ├─ stores pubA, pubB (relay only) │
  │                                   ├─ deliver pubA ──────────────────►│
  │                                   │◄─────────────── send pubB ───────┤
  │◄──────────── deliver pubB ────────┤                                  │
  │                                   │                                  │
  ├─ secret = X25519(privA, pubB)     │      secret = X25519(privB, pubA)┤
  │                                   │                                  │
  └──── X25519(privA,pubB) ≡ X25519(privB,pubA) — mathematically guaranteed
```

## Message Encryption (every message) / Nachrichtenverschlüsselung (jede Nachricht)

```
Alice                              Server                              Bob
  │                                   │                                  │
  ├─ nonce = random(24 bytes)         │                                  │
  ├─ ciphertext = secretbox(          │                                  │
  │    plaintext, nonce, secret)      │                                  │
  ├─ send ciphertext + nonce ────────►│                                  │
  │                                   ├─ stores + relays ciphertext     │
  │                                   │  (cannot decrypt — no secret)   │
  │                                   ├─ deliver ciphertext ────────────►│
  │                                   │                                  │
  │                                   │  plaintext = secretbox_open(    │
  │                                   │    ciphertext, nonce, secret) ◄─┤
  │                                   │  (also verifies authenticity)   │
```

## What the Server Sees / Was der Server sieht

| Data | Server visibility |
|---|---|
| `pubA`, `pubB` | ✓ Sees — public keys, useless without matching private key |
| `ciphertext` + `nonce` | ✓ Sees — cannot decrypt without the shared secret |
| `senderId`, `timestamp`, message size | ✓ Sees — metadata only |
| `privA`, `privB` | ✗ Never sees — generated and stored client-side only |
| Derived shared secret | ✗ Never sees — computed independently by each client |
| Plaintext content | ✗ Never sees — encrypted before transmission |

## Forward Secrecy Implication / Forward-Secrecy-Implikation

**EN** If Alice loses `privA` (new device, app reinstall, no backup), she can
never recompute this shared secret again. All ciphertext encrypted under that
secret becomes permanently undecryptable. This is intentional — see SRS NFR-1.3
and User Story US-16.

**DE** Wenn Alice `privA` verliert (neues Gerät, App-Neuinstallation, kein
Backup), kann sie dieses gemeinsame Geheimnis nie wieder berechnen. Aller
unter diesem Geheimnis verschlüsselter Chiffretext wird dauerhaft
unentschlüsselbar. Dies ist beabsichtigt.

## Implementation / Implementierung

| Component | Library |
|---|---|
| Key exchange | `libsodium.crypto_box_keypair()` — X25519 |
| Shared secret | `libsodium.crypto_box_beforenm(pubKey, privKey)` |
| Encrypt | `libsodium.crypto_box_easy(message, nonce, pubKey, privKey)` |
| Decrypt | `libsodium.crypto_box_open_easy(ciphertext, nonce, pubKey, privKey)` |
| Browser | `libsodium-wrappers` |
| Mobile | `rn-libsodium` |

**Critical implementation note:** nonce MUST be freshly random for every
message. Nonce reuse with the same key catastrophically breaks
XSalsa20-Poly1305 security guarantees.

## Related Requirements / Verwandte Anforderungen
- NFR-1.1 (E2E encryption), NFR-1.2 (key exchange protocol), NFR-1.3 (forward secrecy) — `docs/srs.md` §4.1
- US-16 (forward secrecy awareness) — `docs/requirements/user-stories.md`
- See `docs/diagrams/D-05-websocket-flow.md` for how this fits into the full message journey
