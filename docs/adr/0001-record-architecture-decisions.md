# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

The project should be maintainable for years, possibly by people who weren't part of the original discussions. The reasons behind choices get lost quickly.

## Decision

Record every significant architectural or technology decision as a short Markdown ADR in `docs/adr/`, numbered sequentially, using [template.md](template.md).

## Consequences

- Anyone can see _why_ the code looks the way it does.
- Reversing a decision means writing a new ADR that supersedes the old one, which forces a deliberate change.
- Small overhead per decision.

## Alternatives considered

- **Wiki / chat history:** gets lost and isn't versioned with the code.
