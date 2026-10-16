# ADR 002: Put translation at adapter boundaries

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

Replacing or deeply modifying three established applications would create unnecessary coupling and migration risk. Their technology stacks also differ.

## Decision

Each platform owns a thin adapter that validates a local command, maps it to the shared lifecycle contract, and sends it to the Platform Bridge ingestion API. The demo includes a Node.js commerce adapter and a Java donation adapter; the .NET API seeds representative memorial activity to keep the vertical slice compact.

## Consequences

- Existing platforms can adopt the bridge incrementally.
- Translation and retry behavior are isolated and independently testable.
- The bridge does not become a distributed domain model or transaction coordinator.
- Production adapters would add authenticated delivery, durable outbox storage, and retry/dead-letter handling.
