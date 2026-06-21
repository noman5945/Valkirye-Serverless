# FUTURE-04 — Microservices Migration / Microservices-Migration

## Status
`Planned` — `Geplant`

## Summary
Migration from single NestJS Lambda (Option A) to per-feature Lambda deployment
(Option B) — true microservices isolation.

## Prerequisites / Voraussetzungen
- [ ] NestJS module boundaries fully understood and tested
- [ ] AWS CDK experience sufficient for 4x stack management
- [ ] CI/CD pipeline supports independent feature deployments
- [ ] X-Ray service map configured for distributed tracing
- [ ] Decision on inter-service communication: EventBridge vs direct HTTP vs SQS

## Migration Steps / Migrationsschritte

```
Step 1:  Extract shared/ into npm workspace package (@valkirye/shared)
Step 2:  Create Lambda Layer for shared runtime code
Step 3:  Split AppModule — one NestJS app per feature
Step 4:  Replace cross-module DI with EventBridge domain events
Step 5:  Update CDK — one NodejsFunction + SnapStart per feature
Step 6:  Update API Gateway routing — per-feature Lambda integrations
Step 7:  Update IAM — per-feature scoped roles
Step 8:  Update CI/CD — independent deploy per feature on change
Step 9:  Validate with X-Ray service map
```

## Inter-Service Communication Options / Optionen für Inter-Service-Kommunikation

| Pattern | Use case | Latency |
|---|---|---|
| AWS EventBridge | Async domain events (user deleted → cascade) | ~ms, async |
| Direct Lambda invoke | Sync cross-service calls | ~50ms |
| DynamoDB streams | Data change reactions | ~seconds |
| SQS | Reliable async messaging | ~ms, async |

## Domain Events to Define / Zu definierende Domain-Events
- `UserDeleted` → ChatModule purges messages
- `UserRevoked` → ConnectionModule terminates WS
- `InviteApproved` → AuthModule sends email
- `MessageDelivered` → ChatModule updates status

## GDPR Note / DSGVO-Hinweis
Account deletion cascade (FR-3.1) currently handled in one transaction.
In microservices, this becomes an eventual consistency saga pattern —
requires careful design to guarantee full erasure within GDPR 30-day window.
