---
name: mobile-design-drift
description: Audit consistency between native mobile design decisions, theme/components, Figma sources, renders, motion assets and project instructions; report stale or unverified claims with evidence.
license: See ../../LICENSE
---

# Check native design drift

Identify the requested scope and current revision. Read the accepted project/spec record, authoritative native theme/components, relevant README and agent context, and available renders/flow/profile evidence. Use the [shared contract](../../docs/workflow.md) and [review protocol](../../docs/agents.md). Begin read-only; an audit request alone does not authorize redesign or external Figma/Rive edits.

Check relationships rather than filenames alone:

- Accepted type/spacing/component roles versus current native implementation and rendered uses.
- Selected Figma nodes versus implementation, respecting recorded ownership and intentional platform differences.
- Motion specification versus actual code or identified Rive file, state machine and bindings.
- Changed shared tokens/assets versus downstream screens and accepted exceptions.
- Current revision/state/device versus evidence and design/UX/performance completion claims.
- README, `AGENTS.md` and `CLAUDE.md` versus commands and canonical project context.

Classify each result as a confirmed mismatch, intentional documented difference, stale evidence, missing evidence or unverifiable claim. A source diff does not prove a visible defect; a render does not prove native accessibility or performance. A missing provider is an evidence gap, not a fabricated comparison. Do not rewrite the chosen direction to match a newer unrelated reference.

Return a concise report with inspected files/evidence, severity, expected/observed behavior, user impact, proposed correction and required rerun. Use `agents/mobile-docs-reviewer.md` and affected domain profiles when fresh-context delegation is available and authorized. Do not label a same-context self-check independent.

When fixes are requested or already authorized, correct bounded inconsistencies, update canonical sources and obtain replacement evidence for affected results. Keep unresolved trade-offs visible. Never change an unmeasured claim into a pass to remove a warning.

## Explicit project targets

When relevant, compare requested target, actual runtime capabilities and returned artifact version using [Expo contracts](../../docs/expo.md). A partial installation is a capability gap, distinct from visual drift.
