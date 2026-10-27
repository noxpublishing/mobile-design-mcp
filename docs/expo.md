# Expo targets and evidence

Expo is an implementation stack targeting iOS/Android. Read the actual package,
lockfile, SDK, navigation, theme/components, animation dependencies and native
build configuration before editing an app. Use version-compatible official
documentation for APIs and configuration. Preserve generated-native ownership.

Use `target: { platform: "ios", implementationStack: "expo-react-native" }`
or its Android equivalent with `create_project_brief`. The connected runtime must
advertise `mobile-design-capabilities-v1`, that operation/target and V2 artifact
support. Check the returned brief version and exact target. A copied skill or
repository version does not prove the connected executable has been updated.

An older runtime may ignore extra fields on `create_mobile_brief`, returning a
native V1 result. Do not use that path as an Expo fallback. If new support is
missing, explain the absent capability and compatible installation route;
qualified source-only work remains useful. Changing a client connection is a
separate operation governed by the user's authorization.

The existing recipe generator emits SwiftUI/Compose. Implement Expo motion with
the project's compatible installed React Native stack and real state. Confirm
Expo Go versus development-build constraints for the actual native modules.
Do not add a migration, new state library or paid build merely for design work.

V2 review manifests replace the V1 `platform` field with required `target`.
They otherwise keep existing evidence and source budgets. Expo consistency may
snapshot selected TS/TSX/JS/JSX files; nothing executes or follows imports.
Discoverability omits design sources, rationale, criteria and reference screens.
Keep the original manifest/source when rolling back to a reader that cannot
process V2; do not erase stack identity through a lossy conversion.

Test safe areas, platform back, keyboard where present, text scaling, semantic
actions, persistence/recovery and interrupted/reduced motion. Name actual native
build/run conditions. Web output, TypeScript, simulator execution, physical-device
accessibility and native performance are separate checks. Follow
[workflow completion](workflow.md#completion) and [installation](clients.md).


Keep a review manifest scoped to one declared text-scale context. The shipped
study manifests contain default-size captures; dark/enlarged-text captures remain
in their receipts with the exact named OS category. Do not guess a numeric scale
or combine those assets under a default-scale device declaration.
