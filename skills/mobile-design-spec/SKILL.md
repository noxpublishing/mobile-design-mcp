---
name: mobile-design-spec
description: Turn an accepted native mobile brief into an implementation-ready design specification with tasks, states, visual rules, motion contracts and evidence-based acceptance criteria.
license: See ../../LICENSE
---

# Specify a native mobile design

Use the existing setup/decision record and [shared contract](../../docs/workflow.md). Resolve missing direction choices only when they block the specification. Draft a proportionate `docs/design/spec.md` or update the existing equivalent. A small component change needs a short scoped contract, not a full product specification.

Describe priority tasks and screen/state transitions, including relevant loading, empty, error, cancellation and return paths. Map semantic components to actual SwiftUI/Compose ownership and native theme files. Specify type roles and spacing relationships in terms of authoritative tokens; avoid another editable token-value table. Include intentional platform differences, text scaling, semantics and reduced motion.

Record reference provenance and what was observed versus authored. Use `mobile-figma` for selected Figma nodes and `mobile-motion` for meaningful transitions when available. Motion contracts name trigger, initial/final state, interruption/reversal, timing ownership, feedback, reduced-motion behavior and lifecycle; Rive contracts also name actual file/binding evidence or mark it pending.

Define observable acceptance criteria and the evidence needed to check them, the relevant reviewer lenses and the build/capture/profiling path. Leave thresholds requiring a device decision explicitly unresolved. Separate implementation, UX review and performance measurement. Link implementation tasks to the affected native source and evidence rather than treating a spec as a completed app.

Keep unresolved decisions visible. Continue routine authorized work within accepted direction; ask only for consequential changes of scope or taste. Update the specification when the implemented contract changes and invalidate affected review evidence. Do not make a new speculative product requirement appear accepted through documentation.

## Explicit project targets

Carry OS and actual implementation stack separately through the specification. Use the explicit-target and artifact-version boundaries in [Expo contracts](../../docs/expo.md); old captures keep unknown stack provenance.
