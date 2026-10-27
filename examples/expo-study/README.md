# Folio · reading-queue study

## Overview

An original Expo / React Native study built around four short notes. Arrange the
queue, open a note, change its read status and undo a change. The refined
presentation uses editorial typography and short excerpts; the baseline uses the
same content, state and operations with a simpler row treatment. These authored
treatments do not establish a measured UX improvement.

## Interface

- [App.tsx](App.tsx) supplies gesture and safe-area roots; [index.ts](index.ts)
  registers the Expo application.
- [Source contract](src/README.md) describes the queue model, persistence, screen,
  article modal, theme and motion preference handling.
- Open a note and scroll to **Mark as read**. **Mark as unread** reverses its
  status. **Done** returns to the queue; its **Undo** action restores the previous
  order or read status.
- Hold a row's handle to reorder. The note's accessibility actions provide
  **Move earlier** and **Move later** alternatives.
- **Show baseline / Show refined** changes presentation without replacing data.
- Loading and storage errors have explicit status and retry actions. If saved
  data cannot be opened, **Replace saved data with a fresh queue** deliberately
  replaces it; retrying alone preserves it.
- [package.json](package.json) owns the local commands and dependency ranges;
  [package-lock.json](package-lock.json) pins the installed dependency graph.
  [app.json](app.json) configures Folio for iPhone and Android.

## Invariants

- The dependency line is Expo SDK 55, React 19.2, React Native 0.83.10,
  Reanimated 4.2.1 and Worklets 0.7.4. SDK 55 was selected for the local Xcode 26.2
  toolchain. Preserve this lockfile rather than upgrading dependencies to run it.
- The queue contains each of the four authored note IDs exactly once. Read status
  follows ID, not list position; changing status does not reorder the queue.
- Queue operations become available after local state opens successfully or a
  fresh queue is explicitly chosen. Undo keeps at most 20 prior states in the
  current session.
- Queue order and read status are saved locally. Note content, treatment choice,
  modal selection and undo history are not part of saved state.
- Gesture cancellation has source-level guards for touch cancellation, app
  interruption and Android back during a tracked drag. Native event ordering,
  rapid reversals and interruption coverage still require actual device runs.
- The UI follows system light/dark appearance and motion preference. Reduced
  motion selects zero list animation duration, neutral dragged-cell effects and
  no modal transition; source configuration alone does not verify native results.
- Study content and the icon are original. There are no accounts, feeds or
  provider-media dependencies.

## Side Effects

- AsyncStorage reads/writes `folio-study:queue:v1`. Accepted changes and Undo
  enqueue JSON snapshots; failed writes keep session state and expose retry.
- Unreadable or incompatible saved data remains untouched until explicit fresh
  replacement. This study does not create a separate recovery copy.
- Screen hooks register AppState, hardware-back and accessibility-motion
  listeners, then remove them on cleanup. Reorder and cancellation feedback uses
  accessibility announcements.
- Dependency installation accesses package registries and writes `node_modules`.
  Native run commands generate ignored `ios/` or `android/` projects, install
  native dependencies, build the app and start a local development server.
  Run only on an explicitly chosen simulator/emulator or connected device.

## Verification

Use Node 22.13+ and the committed lockfile. From this directory, run the checks
sequentially:

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npx expo install --check
```

For an iOS development build, install Xcode and an iOS simulator runtime first.
For Android, configure the Android SDK, emulator/device and Java toolchain first.
Select a device owned for this task in the native run command's picker:

```sh
npm run ios -- --device
# Or, separately:
npm run android -- --device
```

See the [SDK 55 documentation](https://docs.expo.dev/versions/v55.0.0/) for its
platform prerequisites. Retain ignored native build output and captures outside
cloud-synced source storage where possible; stop the development server when done.

Current local evidence (2026-10-27): TypeScript checking, Expo's dependency
compatibility check and all five domain/persistence tests passed. Those tests
include serialized writes, failed-write retry and hydration during a pending save.
A native iOS Release build passed with Xcode 26.2 / iOS 26.2. Native UI execution
verified reading/status/undo, actual handle reordering, persisted order after
relaunch, and the same journey with the OS Reduce Motion switch enabled. An
eight-second held drag was interrupted by foregrounding a neutral test app;
the queue and undo state remained unchanged on return. Generated test drivers
and raw result bundles stay in local artifact storage. Android execution is
not established by these iOS results. A separate dark-mode run at
accessibility-extra-large text verified scrolling to the status action and
returning with the pinned Done control. See [media/source receipt](evidence/receipt.json)
and [V2 review manifest](design-review.json).

For further native acceptance, check semantic reorder with assistive technology,
Android back behavior, repeated interruptions and representative devices. Physical-device,
VoiceOver/TalkBack and native performance checks remain separate acceptance work.
Keep the exact source identity, device/OS, settings and actual results with each
capture; a web preview or an encoded video's frame rate is not native performance
evidence.
