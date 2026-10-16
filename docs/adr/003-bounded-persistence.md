# ADR 003: Keep adapter persistence bounded

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

The portfolio should demonstrate realistic service boundaries without pretending to reproduce three production systems. Separate databases for demonstration-only adapter state would increase setup cost without improving the core proof.

## Decision

The .NET operations core supports SQL Server through Entity Framework Core and uses an in-memory provider for fast local tests. Docker Compose runs SQL Server. The Node.js and Java adapters keep only transient request state and forward contract events immediately. PostgreSQL is intentionally omitted because the donation adapter is not the donation system of record.

## Consequences

- Local setup stays bounded and the critical event history is durable in the core.
- Adapter restarts lose demo-only request state.
- A production donation integration would use its existing PostgreSQL data plus a transactional outbox; that capability is outside this proof's scope.
