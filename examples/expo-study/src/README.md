# Folio application source

## Overview

This directory owns the authored notes, reading-queue state and persistence,
native queue/detail UI, adaptive theme and motion preference. The
[study instructions](../README.md) contain dependency, run and verification
details. The study is an application, not an exported component library.

## Interface

- [readingItems](readingItems.ts) exports `ReadingItem`, four original notes and
  `readingById`; the stable IDs are `margin`, `walk`, `draft` and `table`.
- [queue](queue.ts) exports `QueueState`, `initialQueue`, `isQueueState`,
  `decodeQueue`, `moveItem` and `toggleRead`. These are pure domain operations.
- [persistence](persistence.ts) defines `StorageAdapter` and
  `createQueuePersistence`, whose `load` and `save` wrap state decoding and JSON
  writes. [storage](storage.ts) supplies the AsyncStorage adapter.
- [useReadingQueue](useReadingQueue.ts) owns hydration, current state, session
  undo history, save/error status and move/toggle/undo/recovery actions.
- [QueueScreen](QueueScreen.tsx) integrates the reorderable native list,
  accessibility move actions, presentation switch, undo, storage feedback and
  selected note.
- [ArticleDetail](ArticleDetail.tsx) displays the selected note in a scrolling
  modal with Done and read/unread actions.
- [useStudyMotion](useStudyMotion.ts) combines the initial Reanimated motion
  preference with asynchronous AccessibilityInfo querying and change events.
  [theme](theme.ts) supplies appearance-specific colour roles and system serif
  choices.

## Invariants

- Decoded state has exactly `schema`, `order` and `completed` keys with schema
  `folio-study-v1`. Order contains every authored ID once; completed IDs are
  unique and belong to the same authored set.
- Missing storage starts a fresh queue. Malformed JSON, unknown schemas, unknown
  IDs and extra fields are rejected instead of silently resetting saved data.
- Domain operations preserve prior snapshots. Invalid or unchanged moves return
  the original state; toggling an unknown ID does the same. Reordering preserves
  read status.
- Mutations wait for hydration or explicit fresh replacement. Successful changes
  retain at most 20 prior states; hydration and fresh replacement clear history.
  Undo saves the restored snapshot.
- Save calls capture JSON immediately; loads and saves share a serialized
  operation chain, so a new load waits for already queued saves. A failed
  operation rejects its caller without poisoning later requests. Only the
  latest save request updates the hook's save/error status.
- A tracked drag cancellation remounts the list with a new generation. Leaving
  active AppState also invalidates pending drag callbacks; begin/reorder callbacks
  reject old generations. Undo and treatment controls stay disabled through a
  changed-position release until its reorder callback. These guards are not
  proof of complete native interruption handling.
- Treatment and selected-note state are session-local. Read/unread changes do not
  move the note, and modal dismissal does not undo a completed read-state change.

## Side Effects

- Mount opens AsyncStorage through `queuePersistence`. Accepted edits, Undo,
  explicit fresh replacement and retry saving enqueue writes to
  `folio-study:queue:v1`.
- Failed opening keeps existing storage and leaves domain edits disabled. The
  user may retry opening or deliberately replace saved data. Failed writes keep
  in-memory changes and offer retry.
- Hydration/request counters suppress stale hook responses. Unmount cleanup
  suppresses UI updates; it does not abort already queued storage writes.
- AppState, hardware-back and reduced-motion listeners are removed on cleanup.
  Drag events cross to the React Native runtime with `scheduleOnRN`; announcements
  provide reorder/cancellation feedback.
- No network or provider integration exists in this directory. Generated native
  build files and dependency internals are outside its maintained source contract.

## Verification

From the [study directory](../README.md), run `npm run typecheck`, `npm test` and
`npx expo install --check` sequentially. The domain tests cover pure queue and
persistence behavior; hook lifecycle, gesture ordering, native presentation and
accessibility require separate native execution. The study README records the
current evidence boundary and remaining checks.
