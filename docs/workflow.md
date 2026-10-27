<!-- SPDX-License-Identifier: Apache-2.0; adapted for native mobile design. See NOTICE. -->
# Native mobile design workflow

This is the shared completion and review contract for the native-design and showcase skills. It adapts Elephant–Goldfish context separation to iOS/SwiftUI and Android/Jetpack Compose design.

The same contract applies to Expo/React Native through [Expo mode](expo.md).
Identify OS and implementation stack separately; use the actual app stack.
`create_project_brief` requires an explicit supported target and returns a V2
brief. Check the connected capability report and returned target/version.
Legacy `create_mobile_brief` remains native-only V1. Historical captures without
stack provenance remain unknown. [Mobile quality](mobile-quality.md) reuses this workflow and finding states.

## Ownership and intake

For a new project use `mobile-setup` to reuse known facts, ask a short targeted interview and maintain one durable project record. Resume it instead of repeating setup on every task. `mobile-project-docs` maintains factual READMEs and thin AGENTS.md/CLAUDE.md entry points; `mobile-design-spec` expands accepted decisions when needed. See [client installation](clients.md) and [specialist reviewer dispatch](agents.md). These are focused working modes, not additional mandatory gates for every edit.

The Elephant is the working agent that keeps the brief and decisions coherent. Goldfish are independent reviewers started with fresh conversation contexts. They receive a selected review packet and their specific lens, not the author's transcript or private reasoning.

Keep the app's existing theme, tokens, components and source assets authoritative. An established project extends those sources unless a deliberate direction decision authorizes changing them. The MCP reference library is not a second token database. A short record in the app project names those authoritative files and records decisions, intentional exceptions and evidence links.

Intake reuses known information: purpose, audience, primary tasks, platforms, existing constraints and success conditions. Expose assumptions that change a design decision. The user should not have to select reviewer agents or assemble tool IDs.

Example: “a calm habit tracker” becomes a brief with the intended user, the daily check-in task, required states and platform. Unknown audience or task assumptions remain questions; an invented monetization flow is not added silently.

## 1. References and direction

Consult Mobbin for available native app examples and Awwwards for suitable art direction, composition, typography or presentation references. Record what was actually inspected, the source, date and relevant observation. An app award is metadata, not proof that a specific transition is good or present in its current version.

For a new direction, normally show two or three meaningfully different treatments of the same key task and content. Include representative rendered states, reference basis, hierarchy, density, component and motion choices, and a recommendation with trade-offs. Changing only the accent color is not a distinct experience.

The user can choose, request one bounded revision or combine compatible qualities. Record what that choice fixes and what remains flexible. If no option is suitable, identify the failed criteria before preparing another round. Routine changes reuse the selected reference set; refresh it when the direction or evidence becomes outdated.

Unavailable services are explicit evidence gaps. Do not invent access or copy provider media into an unrestricted repository. Existing-project work can continue from identified local evidence, but missing required inspiration must not be called completed research.

Selected Figma nodes can contribute design intent through `mobile-figma`; record node/variant, actual access and ownership. `mobile-motion` chooses native APIs or optional Rive for the effect, records the state/binding contract and verifies actual output. External tools remain client-connected integrations. See [Figma](figma.md), [Rive](rive.md) and the [motion pipeline](motion.md).

## 2. Visual system and anti-slop criteria

Establish role-based rules in native source:

- A small type scale, normally explored around two or three base sizes, with semantic roles and intentional exceptions. Accessibility text scaling is not a violation of that base scale.
- Named relationships for heading-to-description, description-to-controls, internal padding and separation between sections.
- Heading hierarchy and placement appropriate to the role. Repeated roles share treatment; different roles can vary purposefully.
- Consistent alignment, density, emphasis, color roles and component states.
- Motion with a purpose and reduced-motion alternatives.

Avoid generic “AI slop” verdicts. Identify the actual problem: a title dominates the primary task, identical card treatment hides hierarchy, decoration competes with content, or spacing does not follow the agreed relationship. A visual technique is not universally forbidden because it appeared in a weak design.

Existing native theme/component files remain the source of the values. Review packets contain snapshots for inspection, not independently editable replacements.

## 3. Build, review and reintegrate

Implement the relevant native screens and task states. Mark journeys as reference, proposal or implemented run. Reference recordings cannot prove that the new app works.

After a change, identify affected semantic roles, tokens, components, assets, screen states and tasks. Render fresh evidence for the affected scope. Update the canonical source, accepted decisions and evidence links together. A local accepted correction should not silently alter the whole direction.

Use `mobile-design-drift` for a requested or materially needed consistency audit across decisions, native sources, renders, motion assets and project documentation. Missing evidence and intentional differences remain distinct from confirmed drift.

Use these default routes:

| Change | Default review |
|---|---|
| Local visual adjustment | Changed render, applicable rules and one representative existing use; one independent consistency reviewer |
| Interaction or flow change | Affected journey with relevant success/error/back states; task and interaction review |
| New direction or broad redesign | Comparable alternatives, chosen rules and representative platform/accessibility states; visual, task and accessibility lenses as relevant |

Escalate by user impact and shared dependencies, not file count. A shared type or spacing-token change checks representative downstream uses across affected screens. A local decorative asset change normally stays local. Include normal and enlarged text for changed text layouts and reduced motion where changed interactions depend on motion. Record omitted combinations.

Start with one review and a targeted rerun after correction. A provisional budget is two correction rounds per bounded scope. Budget exhaustion is a decision point, not a passing result: explain the unresolved issue and recommend a trade-off or additional work. Measure the cost of a pilot flow before applying a larger review matrix. Do not resend the entire history to every reviewer.

Routine fixes within the agreed direction are authorized work. Bring changed scope, a new direction or unresolved taste trade-offs to the user.

## Review packets and findings

Use `build_design_review_packet` with a project-local `mobile-design-review-v1` manifest, or assemble an equivalent bounded packet when that tool is unavailable. See [example manifest](../examples/design-review.json). The tool snapshots local files, verifies declared revision/hash consistency and keeps packets separate from the native source.

Explicit-target work uses `mobile-design-review-v2`, replacing `platform` with
required `target`. It produces a `mobile-design-packet-v2`; V1 stays V1. See the
[Expo template](../examples/design-review-expo.json). Selected TS/TSX/JS/JSX
sources are permitted for V2 Expo consistency, never executed or import-crawled.
Old readers may reject V2; preserve inputs rather than erase stack identity.

- Consistency: accepted direction, canonical source snapshots, changed screens and representative peer components.
- Discoverability: realistic entry context, user task and target screens. Omit the solution rationale, design rules and reference examples that reveal the intended answer.
- Motion: relevant clip/frames and known input context; unknown gesture timing, easing and haptics remain unknown.
- Accessibility: relevant renders plus actual semantic/native test evidence when available.
- Performance: measured runtime profile evidence and a comparable run record.

Packets use at most eight evidence assets, 8 MiB per asset and 20 MiB of evidence in total. Separately, up to eight canonical design-source snapshots of at most 128 KiB each may be included. Prefer a few representative screens or short intervals. Repeated valid transition studies reuse their existing frames. Archive superseded generated packets deliberately; do not delete source captures, decisions or native assets as an automatic cache reset.

A packet identifies app/build revision, platform, device/OS, state, evidence role and file hashes. Revision and device fields are declarations; hashes prove bytes only. Check the build-to-capture link when using the packet. Legacy media with unknown context remain unknown.

A fresh reviewer reads its [selected lens](../skills/mobile-design/references/review-lenses.md) and the packet. It returns an execution outcome (completed, failed-to-execute, inconclusive) and findings with severity, evidence/state, user impact, proposed correction and required rerun. Missing evidence is a separate finding from a visible design defect. Do not simulate independent agents when fresh-context delegation is unavailable.

The Elephant records each finding as open, fixed-pending-rerun, verified, deliberately accepted, or invalidated. A resolution cites replacement evidence. Changes to an affected token, implementation, state or device condition invalidate the corresponding old result. Preserve unaffected decisions instead of reopening the entire app.

## 4. UX loop

After visual/interaction integration, walk complete priority tasks in the implemented app. Check orientation, discoverability, task completion, progress/feedback, error recovery and return paths. Inspect relevant loading, empty and error states rather than only the happy path.

Keep independent critique, agent-driven execution and representative real-user observations separate. An agent's opinion is not a user study. Use real-user feedback when it is available or required by the project's success criteria, and identify its absence.

For each task record the revision, state, execution conditions, evidence, issue and rerun. Resolve agreed task failures and material interaction problems. If a fix changes composition, recheck its visual rules. Stop only at the agreed criteria or a clearly qualified handoff.

## 5. Final native performance loop

This dedicated pass follows UX refinement. Earlier direction work establishes that the required build/profiling path exists and checks unusually expensive effects for feasibility; it does not replace the final pass.

Define representative target devices and scenarios before measuring. Use release/profile builds as appropriate and record revision/build configuration, device/OS/refresh rate, relevant thermal/cache/network conditions, collector/version, repetitions, raw evidence and the agreed thresholds. See [run-record template](../examples/performance-run.json).

Inspect actual frame pacing/hitches, input responsiveness and relevant UI-thread or asset work. A video, screenshot or generated recipe cannot establish native frame performance. Instruments, Android profiling/benchmarks or another identified native collector can produce the evidence; this MCP does not collect those profiles itself.

Optimize measured bottlenecks and repeat comparable scenarios. If the optimization changes visible interaction, rerun the affected UX check and then the final performance scenario. Do not promise zero stutter on all hardware or invent measurements when a device/provider is unavailable.

## Completion

All entry points use these distinct statuses:

- **Design implemented:** the agreed UI/flows and rules exist for an identified revision; this alone is not a UX or performance pass.
- **UX reviewed:** agreed tasks have current evidence and material findings are resolved; state which kind of observation supports this.
- **Performance measured:** agreed native scenarios have current, comparable measurements and meet the stated thresholds.
- **Qualified handoff:** missing access, native builds, tests or measurements are explicitly listed. Accepting a gap never turns unmeasured performance into measured performance.

A verified app completion requires the first three for the agreed platform/task scope. Missing required runtime evidence keeps completion unverified. Provide useful partial work with the qualified-handoff label instead of running an endless loop.

The optional showcase starts after verified completion and uses that app revision's final media. A user may explicitly request a provisional showcase despite a qualified handoff; label it provisional and preserve the unresolved checks. Do not silently convert “accepted limitations” into “everything verified.”

Later app changes may invalidate affected showcase media. Update an existing website within its authorized scope; an old optional website does not block unrelated native work.
