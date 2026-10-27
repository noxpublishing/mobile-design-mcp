# Passage · day-plan study

## Overview

A standalone SwiftUI iPhone study for arranging four fictional stops and editing
their arrival times. An original route sketch, native reorder controls and a
time-editing sheet support a small, complete planning task. Baseline and refined
treatments share the same data and operations; they do not establish a measured
UX improvement or an independent comparison.

## Interface

- Open [Passage.xcodeproj](Passage.xcodeproj/project.pbxproj) in Xcode, select the
  shared `Passage` scheme and choose an iPhone simulator you own before running.
- [Passage source](Passage/README.md) owns the model, persistence, UI and theme.
- Tap **Morning table** to open its detail sheet. Use the time picker or
  **15 min earlier/later**, then **Save time** or **Cancel**. Drag the sheet between
  its medium and large detents to see more of the stop description.
- Drag a native row handle to change the order, or use the row's **Move earlier**
  and **Move later** accessibility actions. Arrival times stay as entered;
  neighbouring conflicts remain visible for review.
- The leading toolbar button undoes a completed time or order change. The
  **Study treatment** menu selects baseline or refined presentation without
  changing the plan.
- `PassageTests` checks model, undo and persistence behavior. `PassageUITests`
  exercises native time editing, cancellation, saving, reordering and undo.

## Invariants

- iOS 17+, SwiftUI, iPhone target; no external packages or project generator.
- Four unique stop identities persist across edits and reordering. Invalid time
  ranges do not enter the committed model; valid times may still conflict with
  a neighbouring stop.
- All venues and descriptions are fictional study content. The route sketch is
  original geometry, with no live map or travel-time calculation.
- Native `List` controls own interactive drag handling. The plan changes on a
  completed move, rather than on each drag frame.
- Rows adapt at accessibility Dynamic Type sizes; controls use system text
  styles and light/dark roles. The itinerary-change animation consults the
  system Reduce Motion preference.
- These app-authored interactions do not verify the exact output of an MCP
  motion recipe.

## Side Effects

- Normal launches read and atomically save app-local JSON at Application Support
  `Passage/itinerary.json`. Undo retains at most 20 prior plans in the session.
- Failed writes preserve the current plan in memory, show an error and expose
  **Retry saving**. Unreadable saved data is backed up before replacement; if
  that backup fails, the original file is preserved and persistence remains
  blocked until a recovery copy can be made.
- `--uitesting` uses the built-in plan in memory without reading or writing the
  saved plan. Treatment selection, sheet drafts and undo history are not saved.
- Building and testing produce Xcode artifacts and install/run the app on the
  explicitly selected simulator. Keep results and recordings in ignored local
  artifact storage.

## Verification

Xcode and an installed iOS simulator runtime are required. From this directory,
build first and run the tests after a successful build:

```sh
xcodebuild -project Passage.xcodeproj -scheme Passage -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
xcodebuild -project Passage.xcodeproj -scheme Passage -destination 'id=REPLACE_WITH_OWN_SIMULATOR_UDID' -configuration Debug -parallel-testing-enabled NO CODE_SIGNING_ALLOWED=NO test
```

These commands use Xcode's default DerivedData location. For a custom location,
choose local build storage outside a cloud-synced source directory.

On 2026-10-27, the local Xcode 26.2 / iOS 26.2 iPhone simulator run passed all
four model/persistence tests and three UI journeys. The journeys checked
09:30 → Cancel → 09:30, 09:30 → Save → 09:45 → Undo → 09:30, plus a native
reorder that displayed a time conflict and could be undone. Native screenshots
were attached to that run. A separate dark-mode run at accessibility-extra-large
text passed the sheet-action reachability task. This result does not establish physical-device,
VoiceOver, a dedicated reduced-motion task or native performance acceptance.
Keep the source identity and actual run conditions with any later captures.
