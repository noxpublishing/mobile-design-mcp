# Runtime source

## Overview

This directory implements the stdio MCP server for native mobile design
references, imported evidence, flows, authored motion recipes and local review
packets. [server.ts](./server.ts) owns the tool schemas and handlers;
[the root README](../README.md) lists the tools. Shared workflow policy lives in
[docs/workflow.md](../docs/workflow.md), with contributor context in
[docs/agent-context.md](../docs/agent-context.md).

## Interface

| Boundary | Contract |
| --- | --- |
| [cli.ts](./cli.ts), [server.ts](./server.ts) | `createMobileServer(root = dataRoot())` returns `{ server, store, close }`. The CLI connects stdio and handles SIGINT/SIGTERM with idempotent cleanup. |
| [types.ts](./types.ts) | Shared `Platform` (`ios` or `android`), `Provider`, `Award`, `ReferenceApp`, `Recording` and `Flow` types. |
| [project-target.ts](./project-target.ts), [brief.ts](./brief.ts) | `projectTargetSchema`, supported target/capability descriptions and `createBrief` share explicit target validation and bounded legacy/V2 brief assembly. |
| [store.ts](./store.ts) | `Store` persists apps, full-text search, recordings, flows and metadata; exposes counts and `close()`. |
| [awards.ts](./awards.ts), [google-awards.ts](./google-awards.ts) | `parseAppleAwards` / `refreshAppleAwards` and `parseGooglePlayAwards` / `refreshGooglePlayAwards` supply public award references. |
| [media.ts](./media.ts) | `importRecording`, `probeVideo`, `analyzeTransition` and `recordingPreview` handle local capture evidence. See [motion evidence](../docs/motion.md) for the analysis workflow. |
| [recipes.ts](./recipes.ts) | `listMotionRecipes` and `buildMotionRecipe` expose `bottom-sheet`, `shared-element` and `success-feedback` definitions, using `MotionRecipeDefinition`, `MotionRecipeInput` and `MotionRecipeResult`. |
| [review-packet.ts](./review-packet.ts) | `reviewMode`, V1 `reviewManifestSchema`, `reviewManifestV2Schema` and `buildDesignReviewPacket` prepare consistency, discoverability, motion, accessibility or performance evidence for independent review. |
| [mobbin.ts](./mobbin.ts), [mobbin-login.ts](./mobbin-login.ts) | `dataRoot`, `MobbinOAuthProvider`, provider status, tool discovery, read-only forwarding and screen search support the separate [Mobbin connection workflow](../docs/mobbin-connection.md). |

`create_mobile_brief` returns `mobile-design-brief-v1` guidance for SwiftUI on iOS
or Compose on Android, with reference/flow evidence, platform warnings and gaps.
`create_project_brief` requires a supported OS/stack target and returns V2 for
SwiftUI, Compose or Expo/React Native. Provider status advertises actual code
capabilities. Old recordings/flows keep unknown stack provenance. Native recipe
generation remains SwiftUI/Compose-only; this server does not build apps or
automate live devices. See [Expo contracts](../docs/expo.md) and the
[original study gallery](../docs/studies.md) for native examples and actual coverage.

## Invariants

- App payloads and their FTS5 entries are updated transactionally. The local
  database uses SQLite WAL. Call `close()` when the server/store is no longer used.
- Imported recordings must be absolute paths to regular, nonempty PNG, JPEG,
  MP4, WebM or MOV files, at most 500 MiB, with matching file signatures. Preserve
  provenance and the distinct byte/capture SHA-256 identities; imported copies
  are rehashed.
- Flows require existing recordings, matching platforms and compatible supplied
  app identities. Clip
  timestamps must be paired and fit the measured video duration. Historical
  recording platform metadata does not establish its implementation stack.
- Recipe snippets are authored Swift/Kotlin guidance with assumptions,
  accessibility notes, limitations and sources. Finite custom durations are
  clamped to 100–1200 ms (default 280 ms); native sheets use system timing.
  A generated recipe or brief does not establish native compilation or UI quality.
- Review manifests are limited to 1 MiB. Packets accept at most eight local
  evidence assets (8 MiB each, 20 MiB total) and eight design-source snapshots
  (128 KiB each), enforce revision/hash checks and resolve relative evidence
  paths inside the project. Discoverability packets omit reference, rationale,
  criteria and design-source material. Missing required evidence is
  `inconclusive`; complete evidence is `ready-for-review`, never `reviewed`.
  V1 preserves its contract/allowlist; V2 requires an explicit target and preserves
  it in V2 output. V2 Expo can include selected TS/TSX/JS/JSX source without
  execution/import crawling. Unsupported versions/pairs fail explicitly.
- Mobbin configuration does not establish entitlement. REST screen search
  requires its separate API key, accepts iOS only, limits results to 1–20,
  rejects redirects and bounds requests to 20 seconds / 2 MiB. MCP discovery is
  limited to five pages and forwarding allows only explicitly read-only tools;
  clients close in `finally`. Search does not fall back to scraping or persist
  results locally.

## Side Effects

- `dataRoot()` selects `MOBILE_DESIGN_DATA_DIR` or
  `~/.local/share/mobile-design-mcp`. Opening the store creates local data
  directories and `library.db`; tool calls can update persisted app, recording,
  flow and metadata state.
- Recording imports copy local media into the library. `probeVideo` launches
  `ffprobe` with a 10-second / 1 MiB output bound; screenshot previews are limited
  to 3 MiB.
- Transition analysis launches `ffmpeg` for 3–12 review frames from an interval
  of at most 30 seconds. Each extraction has a 15-second / 1 MiB process-output
  bound. It writes JPEGs and `study.json` below the library's `studies/<key>`
  directory and reuses cached frames only after identity/hash checks. Failed
  extraction can leave partial study files for a later retry. Requested frame
  positions do not establish input-event timestamps or transition duration; see
  [media.ts](./media.ts) and [the motion guide](../docs/motion.md).
- Award refreshes contact public sources; configured Mobbin operations contact
  external provider endpoints. Provider status performs short version checks
  for `ffmpeg`, `ffprobe`, `adb` and `xcrun`; these do not establish account access.
- Review packet generation creates a new output directory, copies and rehashes
  local evidence, and writes `packet.json` and `REVIEW.md`. Failure removes that
  newly created output. It does not fetch remote media or invoke reviewers.

## Verification

Run from the repository root:

```sh
npm test
npm run check:publication
```

`npm test` includes the TypeScript build and offline suite; do not run a separate
build alongside it. Optional `npm run smoke` exercises the real stdio server
with temporary state and contacts public award sources. It does not verify
authenticated provider access. Native build, capture and performance evidence
must follow each example's own README; see [verification boundaries](../docs/agent-context.md).
