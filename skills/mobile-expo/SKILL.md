---
name: mobile-expo
description: Design, audit or redesign a bounded Expo/React Native screen or flow while preserving its installed SDK, navigation, components and business behavior.
license: See ../../LICENSE
---

# Expo design work

Inspect the actual app before choosing an implementation: package/lockfile, SDK,
React Native version, navigation, theme/components, native-directory ownership,
animation dependencies and available local build path. Reuse known project facts.
Read [Expo contracts](../../docs/expo.md) and the relevant part of the
[shared workflow](../../docs/workflow.md).

Set the requested target to the real OS plus `expo-react-native`. An iOS target
does not mean SwiftUI. Inspect the connected tool list and capability report.
For supported tooling use `create_project_brief`, then check that the result is
`mobile-design-brief-v2` and preserves the exact requested target. Never treat a
legacy SwiftUI/Compose brief as an Expo result. Missing capabilities leave the
runtime route unsupported; source inspection and qualified local work can continue.

For an audit, inspect the actual implemented task and evidence before editing.
For a redesign, keep the same task/content and preserve unrelated product logic.
For implementation, use the app's canonical theme and existing compatible
components. A visual change does not authorize an SDK migration, dependency swap,
generated-native conversion or paid cloud build.

Use the compatible installed React Native animation stack and the
[motion contract](../mobile-motion/assets/motion-contract.md). The native MCP
recipe generator does not emit Expo code. Preserve cancellation, state authority,
system back and reduced motion. Use [mobile quality](../../docs/mobile-quality.md)
for concrete layout/accessibility/task checks, without imposing a new aesthetic.

Use a V2 review manifest for the declared Expo target. Select actual theme/TSX
sources for consistency; withhold those sources and rationale for discoverability.
Keep reviews bounded and findings in the existing lifecycle. Verify changed tasks
on the claimed native OS; web rendering, source review and a build alone establish
different evidence. Report unavailable device/semantic/performance checks explicitly.
