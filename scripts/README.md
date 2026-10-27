# Repository scripts

## Overview

These Node.js entry points install the shared workflow, synchronize contributor
context, screen distribution files, refresh public award metadata, and exercise
the compiled MCP server. Command aliases and the Node.js requirement are defined
in [package.json](../package.json). Workflow behavior is documented in
[the workflow guide](../docs/workflow.md).

## Interface

| Entry point | Contract |
| --- | --- |
| [install-workflow.mjs](./install-workflow.mjs) | Exports `installWorkflow({ client = 'both', scope = 'user', project, home = homedir(), checkout = CHECKOUT })`. CLI: `--client codex\|claude\|both`, `--scope user\|project`, `--project <absolute-path>`. Available as `npm run workflow:install -- <options>`. |
| [sync-agent-context.mjs](./sync-agent-context.mjs) | Exports `syncAgentContext({ project, context = 'docs/design/agent-context.md', write = false })`. CLI: `--project`, `--context`, `--write`. Previews changes unless `--write` is supplied. This repository uses [docs/agent-context.md](../docs/agent-context.md), so pass `--context docs/agent-context.md` explicitly. |
| [check-publication.mjs](./check-publication.mjs) | `npm run check:publication` screens the public-study distribution. Screens tracked and nonignored untracked paths, credential patterns, local artifacts, and license/NOTICE labels. |
| [index-awards.mjs](./index-awards.mjs) | `npm run index` loads compiled `dist` modules, refreshes Apple then Google public award metadata, and persists results in the configured local store. |
| [smoke.mjs](./smoke.mjs) | `npm run smoke` loads compiled `dist` modules and exercises the real stdio server: live public award refresh/search, six native recipes, a legacy brief and an explicit-target Expo brief. |
| [test.mjs](./test.mjs) | Enumerates immediate `.test.mjs` files in `test/` and launches Node's test runner with `shell: false`. `npm test` builds once before invoking it. |

## Invariants

- The installer copies an allowlisted workflow bundle to
  `<scope-root>/.mobile-design-mcp/workflow`, skills to `.agents/skills` or
  `.claude/skills`, and reviewers to `.codex/agents` or `.claude/agents`.
  Managed, unmodified directories can update; unmanaged, modified, and symlink
  destinations are preserved. Existing reviewer definitions are always preserved.
  Matching existing bytes are `unchanged`; differing reviewers remain preserved
  conflicts. Receipts report partial/failed states and source identity separately
  from the uninspected connected runtime.
- Installer filtering excludes repository/build state, dependencies, local
  configuration, environment files, artifacts, and APKs. Root `AGENTS.md`,
  `CLAUDE.md`, and `package-lock.json` are not top-level bundle entries. Installation
  does not configure MCP clients, permissions, models, or credentials.
- Context paths must resolve inside the selected project and contain nonempty
  context. Target wrappers must be regular files with unique, balanced managed
  markers. Only the marked block changes; outside content is preserved. Targets
  are checked again before writes.
- Neither installation nor context synchronization is an all-files transaction.
  The installer updates the bundle before individual destinations.
- Publication checks require the study license, retained notices and matching
  package/README labels. They neither repair nor publish files, and do not
  establish exhaustive secret detection or content-rights clearance.
- The smoke run isolates `MOBILE_DESIGN_DATA_DIR` but otherwise inherits the
  process environment. It does not establish credential sanitization,
  authenticated Mobbin access, or native app/build/performance validation.

## Side Effects

- Workflow installation writes managed copies under the chosen user or project
  scope. Context synchronization writes wrappers only with `--write`.
  The installer writes `.mobile-design-mcp/install-receipt.json` and retains prior
  unmodified managed directories replaced in an attempt under its scope-local
  `recovery/<attempt>/` directory, with before/after hashes. A failed attempt can
  leave a partially updated set; read its receipt. Recovery is path-selective,
  preserves subsequent personal edits and is not an all-files rollback.
- Award indexing contacts public sources, upserts local data, records refresh
  metadata and failures separately, and closes the store.
- Smoke testing launches a child stdio server and makes live public-source
  requests. On success it writes `.artifacts/live-smoke.json`; cleanup closes the
  client and removes temporary state.
- Publication checks read Git/file state and optional GitHub event metadata.
  `npm test` writes compiled output before the test runner launches a child
  process.

## Verification

Run from the repository root:

```sh
npm test
npm run check:publication
```

`npm test` includes the TypeScript build and offline suite; do not run another
build beside it. `npm run smoke` is a separate live-network check requiring
compiled `dist` output. Its public award requests do not verify authenticated
provider access or native examples. See [contributor context](../docs/agent-context.md)
for the edition's evidence and verification boundaries.
