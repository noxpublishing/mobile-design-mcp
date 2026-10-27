# Independent workflow review

Date: 2026-10-27. Six fresh-context reviewers examined a fixed baseline concept and selected existing implementation files. Reviews ran in two bounded concurrent groups due to available worker slots; no earlier review findings were passed to later reviewers. Each reviewer reported the exact persona, standard and target files read. Reviewers worked read-only and did not run native builds, usability tests or profiles.

| Lens | Main question |
|---|---|
| Design feasibility and resource use | Can evidence, captures and iterations fit a bounded operating policy? |
| Comprehension and ergonomics | Can a user supply a goal, choose a direction and understand completion? |
| Simplicity and reuse | What can existing native themes and skills provide without another workflow engine? |
| Evidence and codebase | Are evidence identity, diagnostics and current tool behavior reliable? |
| Migration and readiness | Can the method be added without changing existing record meanings? |
| Structure and maintainability | Do all entry points share ownership, invalidation and completion rules? |

No concept-stage blockers were reported. Major findings required operational decisions; the codebase lens also identified concrete implementation defects. The consolidated dispositions are:

| Finding | Disposition |
|---|---|
| Undefined review cost/convergence | Scope-sensitive defaults, packet byte/asset bounds, two-round escalation and a pilot before broad rollout |
| Native execution path not established | Early per-project readiness check; external native collectors; explicit unverified outcomes |
| Expanding coverage and vague regression scope | Priority tasks, representative peer components and targeted platform/accessibility reruns |
| Competing canonical design records | Native theme/components remain authoritative; a short project decision record; additive snapshots only |
| Stale review conclusions | Revision/state/device/evidence identity and replacement-evidence findings; packet stale/hash checks |
| Inconsistent app/showcase completion | One shared design/UX/performance/qualified-handoff contract referenced by both skills and briefs |
| Leading fresh-review context | Discoverability packets omit rationale, design rules and reference examples |
| Source access/non-persistence | Record actual availability; do not assume fresh reviewers have account access or mirror provider media |
| Repeated media work | Valid hashed frame-study reuse; bounded packets and deliberate retention rather than automatic source deletion |
| Identical bytes losing new capture provenance | Separate capture-context IDs from content hashes; regression test |
| Impossible saved clip interval | Check against measured video duration before saving evidence-backed flow; protocol regression test |
| Cross-platform flow omitted from brief diagnostics | Explicit cross-platform flow IDs and adaptation gaps; protocol regression test |
| Server/auth roots disagree | Pass the explicit server root to provider status and clients |
| Ambiguous execution failure | Structured failed-to-execute diagnostics and completed/partial/failed provider refresh status |
| Unbounded optional showcase obligation | Represent one app revision; update affected media within the authorized website scope |

The resulting contract is [workflow.md](../workflow.md); the bounded snapshot implementation is [review-packet.ts](../../src/review-packet.ts). The concept remains clear that profiling collection, real-device rendering and real-user research happen per app and are not proved by reviewing this repository.

Accepted scope boundary: this release uses a lean file-based review manifest and skills instead of introducing a second persistent design-system database or a general project-state engine. That decision follows the reuse/simplicity findings; it does not assert that every possible future workflow capability exists.

Outstanding evidence: authenticated provider integration, native SwiftUI/Compose compilation and visual checks, actual user observations, native performance measurements and pilot cost estimates are project/environment-dependent. They are not silently promoted to passing results.
