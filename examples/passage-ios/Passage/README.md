# Passage app source

## Overview

The app source owns a local four-stop day plan, a native list and time-editing
sheet, bounded undo and recoverable JSON persistence. It has no network service,
location integration or external package dependency. The surrounding
[study instructions](../README.md) describe how to run it.

## Interface

- [PassageApp](PassageApp.swift) is the SwiftUI entry point. It owns one
  `ItineraryStore`; `--uitesting` selects an in-memory store.
- [Stop and Itinerary](Itinerary.swift) define `passage-study-v1`, authored sample
  content, time validation, formatted clocks and adjacent-stop conflict notes.
- [ItineraryStore](ItineraryStore.swift) is a `@MainActor ObservableObject` with
  published itinerary, history, unsaved state and error message. `updateTime`,
  `move`, `undo` and `persist` are its mutation boundary.
- [ItineraryView](ItineraryView.swift) presents the list, completed native moves,
  semantic move actions, conflict feedback, undo, retry and treatment menu. Its
  selected stop opens the editing sheet.
- [StopDetail](StopDetail.swift) holds an isolated draft. It exposes a native
  time picker, 15-minute adjustments, Save and Cancel callbacks, and medium/large
  sheet detents.
- [PassageTheme and RouteSketch](StudyTheme.swift) provide system/adaptive colour
  roles and a decorative four-point route. These symbols are internal to the
  app target; this directory is not a public Swift library.

## Invariants

- A valid itinerary has schema `passage-study-v1`, exactly four unique nonempty
  stop IDs, nonempty titles, positive durations, and start/end times within one
  day. Commits reject invalid or unchanged state.
- Stop IDs, descriptions and durations stay stable during time edits and moves.
  Reordering preserves arrival times. Conflict detection compares adjacent stops
  in the current order; conflicts are review feedback, not automatic rescheduling
  or a validation failure.
- Sheet edits affect the model only through Save. Cancel or interactive sheet
  dismissal discards its local draft. A draft ending after midnight cannot save.
- Undo stores at most 20 prior itinerary snapshots in memory. It does not survive
  an app restart. Treatment selection changes presentation only.
- Accessibility text sizes use vertically arranged row content; ordinary sizes
  use a time/content row. System Reduce Motion disables the explicit itinerary
  animation. The route drawing is hidden from accessibility and relies on the
  model's four-stop constraint.

## Side Effects

- Store initialization synchronously reads the configured JSON file. Normal
  app storage is Application Support `Passage/itinerary.json`.
- Invalid or unreadable saved data is copied to a UUID-suffixed recovery file
  before using the built-in plan. A failed backup blocks persistence until a retry can make the recovery copy and preserves the original file.
- A completed valid change or undo creates the parent directory as needed and
  atomically writes JSON. A failed write keeps session state, marks it unsaved
  and supplies error feedback; `persist` retries ordinary write failures.
- `fileURL: nil` performs no reads or writes. Only the itinerary is serialized;
  history, sheet drafts, treatment choice and errors stay in memory.

## Verification

From the [study directory](../README.md), use the shared `Passage` scheme to run
`PassageTests` and `PassageUITests` after building successfully. The study README
contains the commands, recorded local run and outstanding device/accessibility/
performance checks. Source inspection alone is not native execution evidence.
