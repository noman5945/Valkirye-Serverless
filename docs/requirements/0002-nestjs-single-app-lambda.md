# ADR-0002: NestJS Single Application over Per-Feature Lambda Deployment

## Status
Proposed

## Date
2026-06-18

## Context

The Valkirye backend requires a TypeScript framework for Lambda handlers. Two deployment
strategies were evaluated after selecting NestJS as the application framework:

**Option A — Single NestJS application, one Lambda**
All feature modules (auth, chat, connection, user) bundled into one NestJS app deployed
as a single Lambda function. API Gateway routes all requests to this one function.

**Option B — One NestJS app per feature, separate Lambdas**
Each feature slice deployed as an independent Lambda with its own NestJS module,
IAM role, SnapStart config, and deployment lifecycle.

The team has identified Option B (microservices isolation) as the correct long-term
architecture but evaluated whether it is appropriate for the MVP phase.

## Decision

We adopt **Option A — Single NestJS application** for MVP.

Option B is explicitly documented as the **v2 migration target** once the team has
gained sufficient NestJS and AWS experience to manage inter-service communication,
shared code distribution via Lambda Layers, and distributed tracing across service
boundaries.

## Rationale

### Why Option A for MVP

| Concern | Option A | Option B |
|---|---|---|
| NestJS DI across features | ✓ Native — inject across modules | ✗ Requires HTTP calls or duplication |
| Shared code (guards, pipes) | ✓ Imported naturally | ✗ Lambda Layer or code duplication |
| Cold start config | 1 SnapStart config | 4 SnapStart configs |
| IAM roles | 1 scoped role | 4 roles to maintain |
| Local development | `nest start` — one process | 4 processes, port management |
| Debugging | One CloudWatch log group | Correlate across 4 log groups |
| Deployment complexity | Simple — one CDK construct | 4x CDK constructs, 4x CI/CD targets |
| Timeline impact | 6 weeks | +2–3 weeks estimated |

### Why Option B is deferred, not abandoned

Option B represents true microservice isolation — independent deployability,
fault isolation, and per-service scaling. These are genuine production benefits
at team scale. The decision to defer is not a rejection of microservices but a
deliberate sequencing choice:

1. Learn NestJS patterns deeply in a single-app context first
2. Understand inter-module boundaries before making them network boundaries
3. Ship a complete, documented MVP within the 6-week constraint
4. Migrate to Option B with full understanding of the tradeoffs

## Option A Architecture

```
Client
  └── API Gateway (HTTP + WebSocket)
        └── Single Lambda (NestJS app + SnapStart)
              ├── AuthModule
              ├── ChatModule
              ├── ConnectionModule
              ├── UserModule
              └── SharedModule (guards, pipes, interceptors)
```

## Option B Migration Path (v2)

```
Client
  └── API Gateway
        ├── /auth/*     → auth-lambda     (AuthModule)
        ├── /users/*    → user-lambda     (UserModule)
        ├── /chat/*     → chat-lambda     (ChatModule)
        └── ws routes   → connection-lambda (ConnectionModule)

Inter-service communication:
  - AWS EventBridge for async domain events
  - Shared types via npm workspace package
  - Shared guards/pipes via Lambda Layer
  - Distributed tracing via X-Ray service map
```

## Consequences

### Positive
- Full NestJS DI available across all feature modules
- Single deployment unit — simpler CI/CD for MVP
- One SnapStart configuration covers all routes
- Shared guards, pipes, and interceptors work natively
- Faster time to working MVP

### Negative
- No fault isolation between features — a crash in UserModule affects ChatModule
- Single IAM role must cover all DynamoDB table permissions
- Bundle size larger than per-feature deployment
- Not a true microservices architecture

### Neutral
- Feature-slice folder structure mirrors microservice boundaries exactly
- Migration to Option B requires extracting modules into separate apps — not a rewrite
- The domain layer (entities + interfaces) is already decoupled and portable

## Links
- [ADR-0001](./0001-serverless-architecture.md) — Serverless architecture decision
- [SRS §4.1](../srs.md) — NFR-4.1 Clean architecture requirement
- `docs/future/FUTURE-04-microservices-migration.md` — v2 migration plan
