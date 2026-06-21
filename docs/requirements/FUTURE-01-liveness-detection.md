# FUTURE-01 — Liveness Detection / Lebendigkeitserkennung

## Status
`Parked` — `Zurückgestellt`

## Summary / Zusammenfassung

**EN**  
During account registration, prompt the user to open their camera. Use computer vision to
perform real-time liveness detection — confirming a live human is present rather than a photo,
video replay, or AI-generated deepfake. This would serve as a strong bot prevention mechanism.

**DE**  
Während der Kontoerstellung wird der Benutzer aufgefordert, seine Kamera zu öffnen. Computer
Vision führt eine Echtzeit-Lebendigkeitserkennung durch — es wird bestätigt, dass eine echte
Person anwesend ist und kein Foto, kein Video-Replay oder KI-generiertes Deepfake.
Dies würde als starker Bot-Präventionsmechanismus dienen.

## Proposed Implementation / Vorgeschlagene Implementierung
- **AWS Rekognition Face Liveness** — managed liveness check, no custom CV model needed
- Client opens camera via browser `getUserMedia` API or React Native camera module
- Liveness session created server-side, result verified server-side
- Face embedding stored for uniqueness check (one account per face)

## Why Parked / Warum zurückgestellt

| Reason / Grund | Detail |
|---|---|
| **GDPR Article 9** | Biometric data is special category personal data — requires explicit consent, DPA notification, strict retention policy |
| **German law** | *Datenschutzkonferenz* applies heightened scrutiny to biometric processing |
| **Cost** | Rekognition Face Liveness charged per session — not free-tier compatible |
| **Complexity** | Face embedding storage requires a vector database or Rekognition collection |
| **Deepfakes** | Current technology cannot reliably detect high-quality AI-generated faces |

## Prerequisite Before Implementing / Voraussetzungen vor der Implementierung
- Legal review of biometric data processing under DSGVO
- Formal Data Protection Impact Assessment (DPIA / Datenschutz-Folgenabschätzung) per DSGVO Art. 35
- Upgrade to pay-as-you-go AWS account
- Explicit user consent flow for biometric processing

## Links
- [AWS Rekognition Face Liveness](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)
- DSGVO Art. 9 — Verarbeitung besonderer Kategorien personenbezogener Daten
- DSGVO Art. 35 — Datenschutz-Folgenabschätzung
