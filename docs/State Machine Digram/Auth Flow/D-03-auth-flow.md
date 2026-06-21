# D-03 — Authentication Flow / Authentifizierungsablauf

> **EN** Complete auth flow: invitation approval, registration, login, token
> refresh, and password reset. Covers UC-01, UC-02, UC-03, FR-1.1–1.7.
>
> **DE** Vollständiger Authentifizierungsablauf: Einladungsgenehmigung,
> Registrierung, Anmeldung, Token-Aktualisierung und Passwort-Zurücksetzung.

```mermaid
flowchart TD
    Start([Member submits invite request]) --> Pending{Admin reviews}
    Pending -->|Deny| Denied[Requester notified<br/>pending count -1]
    Pending -->|Approve| GenLink[Generate Bifrost link 72h<br/>+ single-use OTP]
    GenLink --> SendEmail[SES sends one email<br/>link + OTP]
    SendEmail --> GuestClick[Guest clicks link]

    GuestClick --> CheckLink{Link valid?}
    CheckLink -->|Expired| LinkErr[Error: request new invitation]
    CheckLink -->|Valid| EnterOTP[Guest enters OTP<br/>+ display name + password]

    EnterOTP --> CheckOTP{OTP valid<br/>and unused?}
    CheckOTP -->|Invalid/used| OtpErr[Error: invitation already used]
    CheckOTP -->|Valid| CreateUser[Create Cognito user<br/>role = member]

    CreateUser --> CreateProfile[Create DynamoDB profile<br/>+ bidirectional contact record]
    CreateProfile --> ConsumeOTP[Mark OTP consumed]
    ConsumeOTP --> ConfirmEmail[Send confirmation email]
    ConfirmEmail --> Registered([Account created])

    Registered --> Login[Member logs in<br/>email + password]
    Login --> CognitoAuth{Cognito<br/>validates}
    CognitoAuth -->|Invalid| LoginErr[401 Unauthorized]
    CognitoAuth -->|Valid| IssueTokens[Issue JWT access token 1h<br/>+ refresh token 30d]

    IssueTokens --> Authenticated([Member authenticated])
    Authenticated --> APICall[Member calls protected endpoint]
    APICall --> CheckExpiry{Access token<br/>expired?}
    CheckExpiry -->|No| Allow[Request proceeds]
    CheckExpiry -->|Yes| Refresh[Client uses refresh token<br/>silent re-auth]
    Refresh --> RefreshValid{Refresh token<br/>valid?}
    RefreshValid -->|Yes| IssueTokens
    RefreshValid -->|No, 30d expired| ForceLogin[Force re-login]

    Authenticated -.->|Forgot password| ResetReq[Request password reset]
    ResetReq --> ResetEmail[Cognito sends reset email]
    ResetEmail --> ResetConfirm[Member sets new password]
    ResetConfirm --> InvalidateSessions[All active sessions invalidated]
    InvalidateSessions --> ForceLogin

    style Start fill:#2a9d8f,stroke:#1a6358,color:#fff
    style Registered fill:#2a9d8f,stroke:#1a6358,color:#fff
    style Authenticated fill:#2a9d8f,stroke:#1a6358,color:#fff
    style Denied fill:#e76f51,stroke:#b3492e,color:#fff
    style LinkErr fill:#e76f51,stroke:#b3492e,color:#fff
    style OtpErr fill:#e76f51,stroke:#b3492e,color:#fff
    style LoginErr fill:#e76f51,stroke:#b3492e,color:#fff
    style ForceLogin fill:#e9c46a,stroke:#b8923f,color:#3d3d3a
```

## Implementation Notes / Implementierungshinweise

- **Link validity checked before OTP** — fail fast on expired links without prompting for OTP entry
- **Password reset invalidates ALL active sessions** — not just the requesting device — secure default
- **Admin user is never created via this flow** — see `D-02` Role Model — provisioned separately at deploy time
- **Refresh is silent** — client-side interceptor handles token refresh transparently; member never sees a "please log in again" prompt unless the 30-day refresh token itself has expired

## Related Requirements / Verwandte Anforderungen
- FR-1.1 — FR-1.7 (`docs/srs.md` §3.1)
- UC-01, UC-02, UC-03 (`docs/requirements/use-cases.md`)
