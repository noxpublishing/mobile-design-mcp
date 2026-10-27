<!-- SPDX-License-Identifier: Apache-2.0; adapted native-design reviewer guidance. See NOTICE. -->
# Independent design review lenses

Give each fresh-context reviewer only its selected lens, the task and the appropriate revision-bound packet. Review read-only. Never retrieve the author's conversation or hidden rationale. Do not run other agents from a reviewer. Report files/evidence actually inspected and any unavailable inputs.

## Shared report

State execution outcome: completed, failed-to-execute, or inconclusive. For each finding provide severity (blocker, major, minor), affected task/state and evidence id, visible or measured user impact, the specific rule or expectation, proposed correction and a verification step. Mark missing evidence separately. Do not invent a numeric quality score or equate no findings with a tested pass.

## Visual system

Inspect heading hierarchy and placement, type-role consistency, named spacing relationships, alignment, density and component reuse against accepted native source snapshots and representative peer screens. Explain why a departure hurts the selected direction or task. Avoid arbitrary aesthetic bans and do not force all heading roles to look identical.

## Task clarity

Use the discoverability packet: realistic entry context, task and target screens without the author's solution explanation. Identify the starting action, next step, progress, recovery and return path from what is actually visible or executable. Separate a product problem from an incomplete review packet. Static critique is a hypothesis about usability, not observed user behavior.

## Interaction and motion

Inspect the recorded before/after states, interruption, repeated activation, back navigation and reduced-motion behavior relevant to the task. Ask what the motion communicates. Frame samples do not establish original easing/spring parameters, exact input timing or haptics. Report unobserved states without inventing them.

## Accessibility

Inspect readable hierarchy, scaling/reflow, contrast evidence, reach/touch behavior, focus and semantic labels where actual native evidence supports them. A screenshot cannot prove VoiceOver/TalkBack or keyboard behavior. Identify which accessibility checks were performed and which remain unavailable.

## Platform coherence

Judge iOS and Android against the selected native interaction model, insets, navigation/back behavior, input and component semantics. Shared brand intent can have different platform expressions. Flag a web pattern imposed on a phone where it harms the native task; do not demand pixel-identical platforms.

## Native performance

Inspect runtime profiles and their run record, not screenshot similarity. Verify that before/after runs have comparable build, device, refresh rate, scenarios and conditions. Cite measured hitches/frame work or response delays and their user impact. Missing raw measurements are inconclusive. A performance fix that changes interaction needs UX rechecking.
