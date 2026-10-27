---
name: mobile-motion
description: Design, build and verify native mobile motion in SwiftUI or Jetpack Compose, or integrate and author Rive assets through available editor tools for interactive animated graphics.
license: See ../../LICENSE
---

# Build purposeful mobile motion

Use the selected direction, actual user task and [motion pipeline](../../docs/motion.md). Decide the rendering approach per effect. Native navigation, layout, sheets, gestures and simple feedback normally use platform APIs. Consider Rive for authored interactive illustrations or graphics whose stateful animation benefits from its editor/runtime. A mixed screen may use both. Respect an explicit engine choice and assess its integration cost; decorative ambition alone does not justify a new dependency.

## Specify before coding

For each meaningful effect record the trigger, initial/target state, purpose, progress/data ownership, interruption/reversal and repeated activation, timing ownership, lifecycle, reduced-motion alternative, semantic feedback and verification evidence. Use the [motion contract](assets/motion-contract.md) where useful. Mark observed parameters, authored choices and unknowns separately. A clip cannot recover exact spring values, haptics or touch latency.

## Native implementation

Use `list_motion_recipes` and `build_motion_recipe` for the three shipped patterns when appropriate; they are authored examples with prerequisites, not a universal animation generator. For another effect, implement it directly in the existing native project using current platform APIs and real state. Preserve interactive progress and cancellation rather than approximating a gesture with an unrelated timed video. Confirm the recipe's deployment/API assumptions, adapt it, then compile and render using available native tooling.

## Rive authoring and integration

Read [Rive setup and runtime boundaries](../../docs/rive.md). Verify actual editor connection before promising asset creation. With authorized Rive editor tools, inspect the open file/artboard, create or modify the relevant shapes, timelines, state machine and data bindings, then inspect the result. Follow the editor's actual export workflow and record the runtime `.riv` artifact separately from its editable source. Do not treat an editor mutation or a renamed text file as a valid export.

With only a supplied `.riv`, inspect its real artboards, state machines and view-model/property names using compatible tooling or supplied verified metadata. Unknown names remain pending. Select and pin a compatible native runtime; check current official documentation against the installed API generation. New and legacy APIs differ, so never combine legacy input calls with a data-binding-only path.

Keep semantic app state authoritative. Define the app-to-animation binding contract and map completion/errors/events deliberately; decorative events must not silently perform business actions. Reuse resources appropriately, handle load failure, pause offscreen/background work and release owned resources. Supply native accessible status/actions and a static or reduced-motion path. Pass the OS motion preference into the file's actual supported binding; Rive does not choose this automatically.

Without editor access or an asset, deliver the specification, native alternative or clearly labeled pending integration. Do not claim to have generated or tested a `.riv` file. Do not install an invented Rive cloud MCP.

## Verification

Check start/end, interruption, reversal, repeated activation, navigation away/back, background/foreground, missing asset and reduced motion. Capture the actual implementation for motion review. Follow with the affected UX check, then real native performance scenarios including the animation's loading and active cost. Source, screenshots and recipe output cannot certify frame pacing. Report precisely what compiled, ran and was measured.
