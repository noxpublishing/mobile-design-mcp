# Mobile Design MCP

Native mobile design references, evidence and review workflows for **SwiftUI** and **Jetpack Compose**.

> **For noncommercial studies, learning and research.** Original project code is source-available under the [Noncommercial Study License](LICENSE); commercial use by recipients is not licensed. Separately licensed Apache-2.0 workflow files retain their permissions. The rights holder's own local use is unrestricted by this grant. No runtime usage locks are included. See [usage and content rights](docs/usage-rights.md).

Search award-recognized apps, organize your own screenshots and recordings, annotate UX flows, inspect transition frames, and generate native motion examples. The accompanying design skill develops a visual direction and applies independent review, a final UX loop and a measured native-performance loop. An optional showcase skill presents the finished app afterward.

This is an early working toolkit. It supports an agent's design work; it does not certify award quality, collect native frame profiles or turn one screenshot into a complete app.

## Quick start

Requires Node.js 22.13 or newer. Video analysis also requires `ffmpeg` and `ffprobe`.

```bash
git clone https://github.com/noxpublishing/mobile-design-mcp.git
cd mobile-design-mcp
npm ci --ignore-scripts
npm run build
npm run index
```

The index command fetches public award metadata. The MCP server does not crawl automatically at startup. Default user library: `~/.local/share/mobile-design-mcp`; override it with `MOBILE_DESIGN_DATA_DIR`.

Start the stdio MCP process directly with:

```bash
node dist/cli.js
```

For Codex:

```bash
codex mcp add mobile_design -- node /absolute/path/to/mobile-design-mcp/dist/cli.js
```

Use a longer tool deadline for video work; see [configuration example](examples/codex.toml) and [official MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).

## Design workflow

```mermaid
flowchart LR
  A[Goal and users] --> B[Mobbin and Awwwards references]
  B --> C[Comparable design directions]
  C --> D[Chosen native visual system]
  D --> E[Build and independent review]
  E --> F[UX refinement]
  F --> G[Measured native performance]
  G --> H[Optional app showcase]
```

The working agent keeps the brief and decisions coherent. Independent reviewers receive fresh conversation contexts and bounded evidence for a particular question. They judge visible or measured results rather than inheriting the author's explanation.

The [workflow contract](docs/workflow.md) defines:

- Small role-based typography scales and named spacing relationships.
- Purposeful heading treatment, hierarchy and placement.
- Consistency without turning every screen into the same template.
- Proportionate reviews for a local edit, flow change or new direction.
- Revision-bound evidence and targeted reruns after accepted changes.
- Separate design, UX, performance and qualified-handoff outcomes.

The app's existing native themes and components remain authoritative. Review snapshots do not become another editable token database. Missing device access or profiles remain unverified work, not a passing score.

## Skills

| Skill | Purpose |
|---|---|
| [mobile-design](skills/mobile-design/SKILL.md) | Reference-led native design, independent review and final UX/performance loops |
| [mobile-showcase](skills/mobile-showcase/SKILL.md) | A separate product website using final app screenshots and clips after app completion |

The skills belong to this checkout and refer to its shared workflow documentation. Install them as symlinked skill folders so those references remain available:

```bash
mkdir -p ~/.agents/skills
ln -s /absolute/path/to/mobile-design-mcp/skills/mobile-design ~/.agents/skills/mobile-design
ln -s /absolute/path/to/mobile-design-mcp/skills/mobile-showcase ~/.agents/skills/mobile-showcase
```

Existing folders are not overwritten by these commands. Reload the client if newly configured tools or skills have not appeared.

## MCP tools

| Tool | Capability |
|---|---|
| `get_provider_status` | Local catalog and optional provider/dependency readiness |
| `refresh_awards` | Official Apple and/or dated Google Play award metadata |
| `search_apps`, `get_app` | Search/read award and curated app references |
| `import_app` | Add a curated reference without inventing awards |
| `import_recording`, `list_recordings` | Validate, copy and hash local screenshots or videos |
| `create_flow`, `get_flow` | Annotate ordered reference steps with valid clip bounds |
| `analyze_transition` | Extract time-indexed review frames; reuse valid cached studies |
| `build_design_review_packet` | Snapshot bounded local design evidence for independent review |
| `list_motion_recipes`, `build_motion_recipe` | SwiftUI/Compose examples with explicit timing and reduced-motion behavior |
| `create_mobile_brief` | Organize references, flows, platform adaptations and evidence gaps |
| `mobbin_search_screens` | Live official REST search, with its own account entitlement |
| `mobbin_list_tools`, `mobbin_call` | Discover and call explicitly read-only official MCP tools |

The current server exposes 17 tools. Motion examples cover bottom sheets, shared elements and success feedback on both native platforms. They are authored examples, not recovered source or device-verified app builds.

## Evidence and review packets

Imported media retains content hashes separately from capture context. Identical bytes can belong to different app versions or capture circumstances; those contexts get separate records. Reference, proposed and implemented journeys must remain distinguishable.

Place a [review manifest](examples/design-review.json) at the native project root and add actual project-local captures. Call `build_design_review_packet` with absolute manifest/output paths and a mode: consistency, discoverability, motion, accessibility or performance.

The packet builder:

- Checks declared revision/hash consistency and local path boundaries.
- Copies at most eight evidence assets, 8 MiB per asset and 20 MiB of evidence in total.
- Separately includes up to eight design-source snapshots of at most 128 KiB each.
- Includes canonical design-source snapshots for consistency checks.
- Withholds rationale, rules and reference examples in discoverability mode.
- Marks missing required evidence inconclusive.
- Does not start reviewers, establish build identity or certify UX/performance.

A frame interval is not a measured transition duration. Haptics, gesture timing and original easing/spring parameters remain unknown without supporting evidence. The [performance run template](examples/performance-run.json) starts explicitly unmeasured; native collectors must supply real profiles.

Awwwards is consulted through an available external MCP or normal web research. This server does not bundle an Awwwards connection. iOS simulator builds/profile collection require a suitable Mac/Xcode environment; recordings can be imported on another host.

## Mobbin connection

The local library and native tools work without Mobbin. To connect your own eligible account:

```bash
npm run mobbin:login
```

The explicit login command displays an authorization URL and listens on a loopback callback. It uses the official OAuth flow with PKCE and state checking, and saves credentials with private file permissions in the user library. A real account is required to verify access.

A supplied OAuth token can alternatively use `MOBBIN_MCP_ACCESS_TOKEN`. REST uses a different credential, `MOBBIN_API_KEY`, and its documented Team/Enterprise entitlement. An `.env` file is not loaded automatically; provide variables through the server's launch environment.

The current REST schema supports `ios` and `web`, not Android. This native toolkit exposes the iOS subset and rejects Android REST requests before sending them. MCP tools are discovered from the connected account; the bridge forwards only tools explicitly annotated read-only.

Provider answers remain live and are not copied into the local reference corpus. See [connection details](docs/mobbin-connection.md), [source boundaries](docs/sources.md) and the providers' own terms.

## Verification and limits

```bash
npm test
npm run smoke
```

Tests run offline, including media/provenance, FTS, flow bounds, platform diagnostics, native recipes, OAuth storage and review packet isolation. Video tests need ffmpeg/ffprobe.

The smoke test starts the real stdio MCP server, uses temporary local state and fetches the public award sources live. Its generated report goes to ignored `.artifacts/live-smoke.json`. It does not imply an authenticated Mobbin test or native rendering/profiling.

Apple Design Awards and Google Play Best of are different recognitions. Google Play remains labeled as a broad app award with region/year, not a UI-design prize. Award metadata does not include current screens or measured animations.

The independent workflow review and resulting changes are summarized in [review notes](docs/design/review-summary.md). Native UI rendering, real-user research and final app performance verification must still be performed for each actual app project.

## License and acknowledgments

Original runtime code and unmarked project documentation use the custom [Noncommercial Study License](LICENSE). You may inspect, modify and redistribute them for the permitted study purposes, retaining the license and notices. Commercial use by recipients requires separate permission. This is a public, source-available project; it is not offered as unrestricted open-source software.

Adapted workflow files explicitly marked Apache-2.0 retain that license and its permissions. Dependencies and reference content retain their own rights. See [NOTICE](NOTICE), [Apache license](LICENSES/Apache-2.0.txt) and [usage and content rights](docs/usage-rights.md). A study label does not clear rights in third-party screens, graphics, fonts or brands.
