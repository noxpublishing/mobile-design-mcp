# Native Mobile Design Workflow

- Author: Mobile Design MCP contributors
- Date: 2026-10-27
- Status: independently reviewed concept; workflow instructions and review-packet support implemented. Per-app native validation remains required.

## Overview

Use the Elephant–Goldfish context pattern for native mobile design. The working agent maintains product intent, selected art direction and decisions. Independent fresh-context reviewers inspect task-relevant evidence through design-specific lenses. The method focuses on iOS/SwiftUI and Android/Jetpack Compose experience, rather than general backend architecture.

Each project consults Mobbin and Awwwards where access permits, proposes distinct directions for the same task, selects a direction and develops a coherent native visual system. After iterative integration, a dedicated UX loop and then native performance verification close the app work. The optional showcase website follows from the final app artifacts.

## Goals and boundaries

Address inconsistent spacing, excessive or arbitrary type sizes, poorly differentiated or placed headings, generic visual treatment and changes that are not checked in context. Use a small deliberate type scale and named spacing relationships with purposeful exceptions and accessible scaling.

Preserve expressive design. A rule violation should cite a meaningful relationship and user impact, not enforce an arbitrary template. An award or admired reference does not establish the quality of the new app.

Keep implemented design, UX review and measured runtime performance distinct. Agent critique is not real-user research; generated source is not a rendered app; missing profiles are not a performance pass. The toolkit prepares evidence and workflows but does not collect native profiles or promise a universally best experience.

## Decisions after independent review

1. **Keep the native project authoritative.** Existing themes, components and assets own implementation values. A short project record owns direction decisions and intentional exceptions. The MCP catalog stays a reference/media library, not a second token database.
2. **Use additive review packets.** The versioned manifest names revision, task/state, platform/device conditions, evidence role and file identities. Existing capture and flow records retain their meanings. Unknown legacy metadata stays unknown.
3. **Separate review questions.** Discoverability packets omit solution rationale, design rules and reference examples. Consistency packets include canonical source snapshots and representative peer components. Reviewers distinguish visible defects from unavailable evidence.
4. **Bound effort by scope.** Local edits normally need one independent consistency review; flow and direction work use appropriate extra lenses. Two correction rounds per bounded scope are a provisional escalation point, never evidence of quality. Pilot a small native flow before expanding the matrix.
5. **Invalidate selectively.** Shared token/component changes recheck representative affected uses; local changes stay narrow. Findings point to replacement evidence and become verified only after a relevant rerun. Unaffected accepted decisions remain valid.
6. **Use one completion contract.** Both skills and generated briefs distinguish design implemented, UX reviewed, performance measured and a qualified handoff. A missing required runtime check remains unverified.
7. **Keep profiling external initially.** Establish the build, device, capture and collector path early. Finish with comparable native scenarios and raw measurements. Performance changes affecting interaction reopen the affected UX check, followed by performance revalidation.
8. **Respect provider boundaries.** Reference access and availability are explicit. Authenticated provider media are not silently persisted into review repositories; local app evidence and provider links remain separate.
9. **Keep the showcase scoped.** A website represents an identified app revision. Later app changes can invalidate its media without making an old optional site block unrelated native work.

The operational detail and stop rules live in the [shared workflow](../workflow.md). This brief states intent and decisions rather than maintaining another copy of that procedure.

## Implemented refinements

The MCP now builds bounded local review snapshots without claiming the review itself has run. It rejects stale evidence revisions, mismatched declared hashes and project-path escapes. Discovery-mode snapshots withhold the intended answer.

Capture content identity is separate from its app/version/context identity. Reference clip ranges are checked against actual media duration. Generated briefs report cross-platform flow adaptation as well as app-reference adaptation. Repeated valid transition studies reuse existing hashed frames. Provider failures expose execution status without erasing partial successes.

These changes are covered by automated tests. They do not prove a particular app's spacing quality, task usability or frame performance.

## Pilot and unresolved per-app inputs

Start with one bounded change, such as a repeated heading and its spacing across two screens. Use the existing theme, current normal/enlarged-text renders, one relevant independent review and a rerun of accepted corrections. Measure actual review effort and artifact use before choosing larger budgets.

Each real app still needs its user/task scope, available source access, selected direction, target devices, build/revision linkage, runtime collector and acceptance criteria. UX observations and performance results must be supplied by that project. Unavailable access produces an explicit qualified handoff, not fabricated completion.

## Review record and attribution

Six independent fresh-context lenses reviewed the baseline concept. The [review summary](review-summary.md) records consolidated findings and dispositions. This is concept/workflow review, not a native-app usability study or runtime benchmark.

The adapted method retains upstream attribution and license scope in [NOTICE](../../NOTICE).
