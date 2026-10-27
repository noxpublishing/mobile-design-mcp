# Example configuration and native study

This directory groups client configuration/evidence templates and the Tempo
Android study. Templates illustrate expected inputs; they are not recorded app
or provider results.

## Runnable studies

- [Palette](palette-ios/README.md): SwiftUI colour composition, RGB editor, reorder, undo and SVG export.
- [Passage](passage-ios/README.md): SwiftUI day plan, time sheet, reorder and conflict recovery.
- [Folio](expo-study/README.md): Expo / React Native reading queue, native detail and local read state.
- [Study gallery](../docs/studies.md): actual captures, motion excerpts and verification limits.

## Interface

- [claude.mcp.json](./claude.mcp.json) and [codex.toml](./codex.toml) are client
  configuration templates using `node` and a placeholder absolute path to the
  built CLI. The Codex template sets a 240-second tool timeout. Merge the relevant
  entries into an existing client configuration after replacing the placeholders.
- [design-review.json](./design-review.json) illustrates a
  `mobile-design-review-v1` manifest with iOS metadata; it contains no native
  execution evidence.
- [design-review-expo.json](./design-review-expo.json) illustrates explicit-target
  V2 Expo review with selected TS/TSX source paths and missing native evidence.
- [performance-run.json](./performance-run.json) illustrates a
  `mobile-performance-run-v1` record explicitly marked unmeasured, with null
  measurement metadata.
- [tempo-android](./tempo-android/README.md) contains the native Android study,
  Gradle build and optional device capture helper.

## Invariants

- Configuration files are templates, not an instruction to overwrite a user's
  existing client setup. No client configuration is changed by their presence.
- Illustrative iOS metadata does not establish an iOS app, build or capture.
  Unmeasured performance records do not establish performance results.
- Tempo's baseline and workflow layouts share one APK and fixed study data.
  Preserve its single-author study qualifications and incomplete native checks.

Selected source and `evidence/` files are maintained study inputs. The nested
`.npmignore` excludes local test captures, native build outputs and generated Expo
projects from npm packages, including when the root `files` list includes this tree.

## Side Effects

- Reading these templates has none. A configured client launches the referenced
  toolkit command only when the user applies and uses its configuration.
- Tempo build, install, app-state and capture-file effects are documented in
  the [study contract](./tempo-android/README.md).

## Verification

From the repository root, run `npm test` and `npm run check:publication` for toolkit
and private-edition checks. These do not validate the native study. From
`examples/tempo-android`, use `gradle :app:assembleDebug` and the prerequisites
and optional device/capture commands in the [study README](./tempo-android/README.md).
No template alone establishes authenticated provider access or native results.
