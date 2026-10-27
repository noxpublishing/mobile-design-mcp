# Palette · colour composition study

## Overview

A standalone SwiftUI iOS study with five original colours, an editable composition,
stable reordering, a bounded undo history and actual SVG document export.
The exported artwork uses a canonical 1000 × 600 SVG canvas with the same
five colours and clipped circular accents as the responsive screen composition.
[Actual native export](evidence/Palette.svg).
Baseline/refined treatments use the same state and tasks. This is an authored
study, not an independent comparison or a measured UX/performance improvement.

## Interface

- Open [Palette.xcodeproj](Palette.xcodeproj/project.pbxproj), scheme `Palette`.
- [Palette source](Palette/README.md) owns the UI, state and export contracts.
- Tap a colour to expand its editor; adjust RGB and save or cancel.
- Use native reorder handles or semantic move actions. Undo restores an edit/order.
- Export opens the native document destination; cancellation is not export success.
- The toolbar treatment menu switches the presentation without changing data.
- [design-review.json](design-review.json) identifies the target and evidence scope.
  Keep it aligned with actual source/device/assets before building a review packet.

## Invariants

- iOS 17+, SwiftUI, no external packages, services or project generator required.
- Stable five-swatch identity; invalid saved colours do not enter the UI.
- Original geometric canvas/icon and local content; no provider media.
- Dynamic type, semantic move actions, system light/dark roles and reduced motion.
- Native list drag controls own interactive reorder/cancellation. The composition
  changes on the completed move, not on every drag frame.
- Expansion/reversal and feedback are app-authored interactions. This app does not
  exercise or verify an exact output from the MCP recipe generator.

## Side Effects

- Completed changes atomically save app-local JSON; undo is bounded to 20 changes
  in the current session. Failed saves keep session state with an explicit error.
- Unreadable saved data is copied to a named recovery file before replacement.
  If that backup fails, persistence is blocked and the original file is preserved.
  Retry attempts the recovery copy again before writing current state.
- Export writes only through the native document flow to the selected destination.
- `--uitesting` starts the built-in palette in memory for isolated UI tests.
- Builds/tests write Xcode DerivedData and optional `.artifacts/` results and install/run only on the selected
  simulator. Choose an owned simulator explicitly rather than the generic booted one.

## Verification

Xcode and an installed iOS simulator runtime are required. From this directory:

```sh
xcodebuild -project Palette.xcodeproj -scheme Palette -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
xcodebuild -project Palette.xcodeproj -scheme Palette -destination 'id=REPLACE_WITH_OWN_SIMULATOR_UDID' -parallel-testing-enabled NO -resultBundlePath .artifacts/PaletteTests.xcresult CODE_SIGNING_ALLOWED=NO test
```

On 2026-10-27, Xcode 26.2 / iOS 26.2 simulator verification passed four
model/persistence tests and four UI journeys. The actual native tasks covered
edit cancellation, save, undo, reorder with the OS Reduce Motion switch enabled,
export cancellation and destination save. A separate dark-mode run at
accessibility-extra-large text passed the editor-action reachability task.
Use Xcode default DerivedData or local build storage outside cloud-synced sources. No physical-device, VoiceOver, user-study
or native performance result is established by compilation or test source.
Retain actual run conditions and evidence under ignored `.artifacts/`.
