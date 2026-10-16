# ADR 001: Use one versioned lifecycle event contract

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

The memorial, donation, and commerce platforms use different languages and data models. The operations console needs a stable way to understand their operational activity without importing every platform's domain model.

## Decision

Platform Bridge uses a deliberately small JSON Schema envelope, versioned as `1.0.0`. Every adapter emits the same identifiers, source, timestamp, subject, lifecycle status, severity, and a bounded event-specific `data` object. The core validates every event against the schema before accepting it.

Breaking changes require a new schema version. Additive event types can be introduced by updating the schema and compatibility tests.

## Consequences

- Cross-language compatibility is executable rather than assumed.
- The dashboard remains independent of source platform implementation details.
- Adapters must translate source-specific payloads and must not leak sensitive data.
- Schema evolution requires coordinated tests, but not coordinated release timing for every platform.
