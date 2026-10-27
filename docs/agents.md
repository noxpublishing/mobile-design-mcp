# Specialist agents and handoffs

The repository ships portable reviewer profiles in `agents/`. These files are
instructions an agent harness can load, not running processes. The [client installer](clients.md)
also generates Claude Code Markdown and Codex TOML definitions in the clients'
agent directories. Profiles have a name/description and a Markdown body;
their availability or registration does not prove any review executed.

| Profile | Review question |
|---|---|
| [Visual](../agents/mobile-visual-reviewer.md) | Does the render follow the chosen hierarchy, type, spacing and component roles? |
| [UX](../agents/mobile-ux-reviewer.md) | Can a user discover and complete the agreed task, including recovery? |
| [Accessibility](../agents/mobile-accessibility-reviewer.md) | Is the task operable with relevant semantic, text, focus and motion adaptations? |
| [Platform](../agents/mobile-platform-reviewer.md) | Does the implementation fit native navigation, lifecycle and platform constraints? |
| [Motion](../agents/mobile-motion-reviewer.md) | Is movement meaningful, controllable and correctly connected to state? |
| [Performance](../agents/mobile-performance-reviewer.md) | Do actual comparable native profiles meet the agreed criteria? |
| [Documentation](../agents/mobile-docs-reviewer.md) | Do docs/instructions accurately describe the implemented project and evidence? |

The working agent owns setup, design decisions, native implementation and
reintegration. `mobile-setup`, `mobile-project-docs`, `mobile-design-spec`,
`mobile-figma` and `mobile-motion` supply focused working modes. Reviewers
inspect read-only and return findings; they do not edit the same files in parallel.

## Dispatch

When fresh-context delegation is available and authorized, start only the
profiles relevant to the current change. A local edit normally needs one lens;
a broader direction or task change may need several. Give the reviewer:

1. The exact profile file and this protocol.
2. Its bounded review packet or equivalent evidence and the current task.
3. The revision, platform and what it may read or execute.

Do not pass the author's conversation or prior conclusions into an independent
review. For discoverability, use a packet without solution rationale, design
rules or reference examples. If a reviewer needs missing evidence, report the
gap rather than filling it from the author's explanation. A separate process
receiving the full conversation is not a fresh-context review.

For a blind discoverability review also check automatically loaded project
instructions, preloaded skills and persistent agent memory. If those disclose
the solution or its rationale, use a clean review workspace outside the app
project with only the bounded packet and generic review protocol. If the client
cannot isolate that context, label the review unblinded/unavailable rather than
claiming a blind independent task check. Do not preload the design-system skill
or canonical app decision record into that reviewer.

Example dispatch: “Read `agents/mobile-ux-reviewer.md` and `docs/agents.md`.
Review this discoverability packet for the stated task. Work read-only, use only
the permitted evidence and return the report described below.” Resolve those
paths within the toolkit checkout before dispatching from an app project.

If the harness has no independent-agent capability, the working agent may
perform a labeled self-check. Keep independent review unavailable. These
profiles are portable instructions; per-client agent registration is optional
and must follow that client's current schema rather than assuming filenames
register them automatically.

## Report and resolution

Return execution outcome `completed`, `failed-to-execute` or `inconclusive`;
list actual files/evidence inspected and omitted coverage. Each finding has
severity, evidence/state, expected/observed behavior, user impact, proposed
correction and required rerun. Separate visible defects from missing evidence.
An empty findings list is not a certificate for uninspected behavior.

The working agent records open, fixed-pending-rerun, verified, deliberately
accepted or invalidated status. Cite replacement evidence to close a fix.
Follow the [shared completion contract](workflow.md); do not call missing native
builds, semantics, user observations or profiles a passing result. A provisional
two-round correction budget triggers a decision, not automatic approval.

## Explicit project targets

For Expo review name both OS and implementation stack in the selected evidence. Inspect actual TSX/theme snapshots for consistency; keep discoverability withholding intact. The existing lenses and finding states apply without another review engine.
