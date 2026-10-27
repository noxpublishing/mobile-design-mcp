---
name: mobile-design
description: Design and implement SwiftUI, Jetpack Compose or Expo/React Native apps using references, local captures, explicit implementation targets and bounded reviews. Web showcases belong to mobile-showcase.
license: Apache-2.0
---

# Native mobile design

Adapted for native mobile design from the Elephant–Goldfish method; see the package NOTICE. Read the [shared workflow and completion contract](../../docs/workflow.md) for direction selection, scope-sensitive review, revision validity, final UX/performance loops and qualified handoffs. This skill and mobile-showcase use that same contract.

Use mobile evidence to build the app the user requested. Keep SwiftUI and Jetpack Compose native: navigation, gestures, typography, safe areas/insets, accessibility, and motion should suit the target platform. A web page in a phone frame is not a native app implementation.

## Focused working modes

Use these companion skills when installed, or read their linked instructions when needed. Load only the relevant mode; a small edit does not require every phase.

| Need | Mode |
|---|---|
| Expo/React Native audit, redesign or implementation | [mobile-expo](../mobile-expo/SKILL.md) |
| Concrete mobile hierarchy, task and accessibility checks | [mobile-quality](../mobile-quality/SKILL.md) |
| New project or consequential scope reset | [mobile-setup](../mobile-setup/SKILL.md): short interview and durable project record; reuse existing answers |
| README and agent instructions | [mobile-project-docs](../mobile-project-docs/SKILL.md): factual contracts and canonical context behind AGENTS.md/CLAUDE.md |
| Agreed direction needs an implementable contract | [mobile-design-spec](../mobile-design-spec/SKILL.md) |
| Selected Figma reference | [mobile-figma](../mobile-figma/SKILL.md): actual nodes, mappings, screenshots and native adaptation |
| Animation or interactive graphics | [mobile-motion](../mobile-motion/SKILL.md): native code or optional Rive authoring/integration |
| Consistency after implementation changes | [mobile-design-drift](../mobile-design-drift/SKILL.md) |

Portable specialist reviewer profiles and fresh-context dispatch are defined in [agents.md](../../docs/agents.md). The [client guide](../../docs/clients.md) covers Claude Code/Codex on Windows, macOS and Linux. A profile file or installed skill is not proof that a review or native test ran.

## Establish the target and available evidence

Read the existing project and the user's brief first. Reuse their platform, stack, product purpose, audience, and required flows; ask only for consequential missing information. Platform filters use `ios` and `android`; the implementation stack is separately SwiftUI, Jetpack Compose or Expo/React Native. Use the actual project stack and the [target/capability contract](../../docs/expo.md). Native OS alone does not establish capture stack.

If available, call `get_provider_status` to learn which sources and optional dependencies actually work. Use the connected tool schemas; the following names describe capabilities, not a guarantee that every provider is online:

| Need | Tools | Evidence boundary |
|---|---|---|
| Find reference apps | `search_apps`, `get_app` | Award metadata and available media, not a screen library or proof of a particular interaction |
| Refresh official awards | `refresh_awards` | Current provider results may differ from the local catalog; retain source links and timestamps |
| Study screenshots or recordings | `import_recording`, `list_recordings` | Import existing local files; no live device-capture API is assumed |
| Describe a product journey | `create_flow`, `get_flow` | Ordered evidence with actions and optional clip ranges; distinguish observed steps from proposed ones |
| Study and implement motion | `analyze_transition`, `list_motion_recipes`, `build_motion_recipe` | Read measurement limits; recipes are authored implementation guidance; report observations and unknowns explicitly |
| Synthesize the brief | `create_project_brief`; legacy native `create_mobile_brief` | Validate the explicit target and returned V2 version; preserve legacy callers and missing evidence |
| Prepare independent review | `build_design_review_packet` | A bounded local snapshot, not a completed review or runtime quality certificate |
| Use an optional Mobbin connection | `mobbin_list_tools`, `mobbin_call` | Discover available tools and their schema first; availability and account access are not assumed |
| Search official Mobbin REST | `mobbin_search_screens` | Separate account/API-key entitlement; its current native platform is iOS. Do not relabel results as Android. |

If this MCP is absent, continue useful work from the project, official platform guidance, and user-supplied evidence. State the missing capability when it affects the result. Installing or registering a provider is a separate environment change, not a prerequisite silently introduced by this skill.

## Reference → flow → design direction

For a new app or direction, consult Mobbin and Awwwards with tools or web access actually available. Record provider gaps instead of inventing successful research. Mobbin supports suitable native examples where the account permits; Awwwards supplies adaptable art direction and composition. Routine corrections reuse the accepted reference set. Establish the native build/capture/profiling path early while keeping the dedicated performance loop last.

Choose references for concrete needs such as navigation, dense content, onboarding, forms, or a particular transition. Explain why each helps. An app's award does not establish the quality or exact appearance of every screen, and it does not make the resulting app an award winner.

Inspect actual screenshots when available. For motion, import a local recording and inspect the relevant before/after states or clip segment. Preserve app/version, device or OS details when known, source, and recording identity. Keep three kinds of statements distinct: observed in evidence, inferred from incomplete evidence, and authored for this app. Do not invent measurements, easing curves, or gestures that a recording cannot establish.

Build the requested journey around the user's content and tasks. Cover the states that matter to that journey: navigation and return paths, loading/empty/error behavior, permissions, input validation, and success. Include only states relevant to the agreed scope. Use `create_flow` to associate reference steps with recordings; keep proposed app behavior clearly identified in the brief.

State the direction before substantial UI work: platform, screen/flow scope, tokens and type hierarchy, navigation model, reusable components, motion intent, and which choices come from which references. `create_project_brief` can organize an explicit target; the legacy native `create_mobile_brief` remains available. Neither replaces product judgment or implements an app.

For a substantial new direction, normally show two or three comparable treatments of the same key task and content, with references and trade-offs. Ask for a direction decision when the user has not already selected or delegated it. Establish a small role-based type scale, named heading-to-description and description-to-element spacing, component padding, heading placement and exceptions in the app's existing native theme. Two or three base type sizes are a starting point, not a cap on accessibility scaling or justified semantic roles. Make anti-slop findings specific to hierarchy, task and chosen direction rather than banning visual techniques universally.

## Implement and verify in the native project

Use the existing architecture and theme when present. Translate the design into reusable SwiftUI views or Compose composables and shared tokens. Apply native text scaling, semantic labels, touch targets, keyboard behavior, insets, and reduced-motion alternatives appropriate to the platform and brief. A SwiftUI recipe is not automatically a Compose recipe: review timing, state ownership, lifecycle, and gesture behavior on each target.

Implement complete user-visible flows incrementally and run checks supported by the project. Generated motion code is a starting point: integrate it with real state and verify interruption, back navigation, repeated activation, and reduced motion where applicable. Judge the app's hierarchy, usability and continuity against its declared direction and recorded observations.

Compare final app renders at the target device sizes. Use existing simulator/emulator/device tooling when available; this MCP imports recordings and does not provide live capture. Record which builds and visual checks actually ran. If native rendering is unavailable, identify the remaining check; do not describe source inspection or a generated recipe as a verified device result.

## Independent review and reintegration

Keep one project record naming the native source of truth and selected direction. Use a revision-bound packet for the current scope. The packet builder accepts a project-local manifest and copies only bounded local assets; external provider media are not fetched or mirrored. A discoverability packet withholds the solution rationale, design rules and reference examples. A consistency packet includes the native rules and representative peer components.

Use fresh-context reviewers for independent checks when delegation is available and authorized. Give each only its selected [review lens](references/review-lenses.md), packet and task, without the conversation history or private rationale. Reviewers inspect read-only and return actual execution outcome, evidence-linked findings and missing coverage. If fresh context is unavailable, label that check unavailable; never simulate independent reviewers in the same context.

For blind discoverability, check auto-loaded project instructions, skills and memory as well. Follow the isolation fallback in [agents.md](../../docs/agents.md) when they reveal the solution; a clean conversation alone may not be sufficient.

Route local changes to one relevant reviewer and targeted reruns. Flow changes normally need task/interaction review; broader directions add appropriate visual/accessibility/platform lenses. Default to two correction rounds per bounded scope before surfacing an unresolved decision. That limit controls effort, not the truth of a pass.

After corrections, update canonical tokens/components/assets, accepted decisions and current evidence together. Recheck affected peer uses after shared-rule changes. Record finding state and replacement evidence; changed implementation/device/state invalidates corresponding older results. Keep reference, proposed and implemented journeys distinct.

## Final UX and performance loops

After design integration, execute the priority app tasks and review discoverability, feedback, recovery and return paths. Distinguish independent critique, agent-driven execution and real-user observations. Fix demonstrated issues and rerun the affected tasks; source inspection alone does not close the UX loop.

Then profile the implemented native flows on defined devices and comparable builds/conditions. Record raw runtime evidence, collector, refresh rate, repetitions and agreed criteria. Fix measured bottlenecks and repeat. An optimization changing interaction reopens the affected UX check, followed by performance revalidation. The MCP prepares evidence; it does not currently collect native frame profiles.

## Finish the app before the optional showcase

Verified app completion requires the shared contract's design-implemented, UX-reviewed and performance-measured results for the agreed revision and scope. Missing required native checks or profiles produce a qualified handoff, not a verified pass. Accepting a limitation never changes unmeasured performance into a measurement. A polished hero screen alone does not complete a multi-screen app.

Deliver the native result with the brief, flow map, reference provenance, verification results, and any remaining gaps. Preserve final screenshots and short motion clips from that finished design, with their app build/revision, platform, device/viewport, and screen or flow names. If final media is unavailable, state that; never substitute reference-app screenshots or invented app screens.

A showcase website is an optional next deliverable. Start `mobile-showcase` after verified app completion and the user's website request. A qualified handoff permits only an explicitly requested provisional showcase, retaining its unverified status. If the website was already requested as a later phase, continue when its conditions are met without asking again. Otherwise mention the option briefly at handoff and finish the app task. Keep website changes separate from app design changes.
