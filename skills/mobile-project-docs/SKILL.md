---
name: mobile-project-docs
description: Create or improve mobile-project READMEs, AGENTS.md and CLAUDE.md from actual repository facts, keeping one canonical design context and preserving existing instructions.
license: See ../../LICENSE
---

# Maintain useful mobile project documentation

Inspect the requested subtree, existing instructions, manifests, native theme/components and accepted design record. Scope documentation by meaningful ownership boundaries: a root overview and a component/package README where an interface needs explanation. Do not create a README for every folder or copy implementation listings into prose.

For each useful contract explain purpose, public interface, invariants, side effects, dependencies and actual verification commands. For native components include semantic role, relevant states, accessibility and motion behavior when these are part of the interface. Verify paths and symbols against source. Distinguish a proposed contract from implemented behavior and a runnable command from a command actually tested.

## Agent entry points

The standard filename is `AGENTS.md` (plural). Preserve an existing `AGENT.md` or other project convention and explain its role; do not assume clients discover it. Keep `AGENTS.md` and `CLAUDE.md` short and point them to one project-local `docs/design/agent-context.md` or an existing equivalent. Never overwrite a human-authored instruction file with a generic template.

The canonical context should name the accepted scope/decision record, native source paths, verified build commands, project-specific type/spacing rules, source ownership, motion decisions, review completion criteria and relevant known gaps. Include only facts that alter the next agent's work. Avoid histories, fake commands, an invented test matrix or copying the whole workflow into every file.

An optional helper at [sync-agent-context.mjs](../../scripts/sync-agent-context.mjs) updates only a marked link block in root `AGENTS.md` and `CLAUDE.md`. Draft and inspect the canonical context first. Run:

```bash
node /path/to/mobile-design-mcp/scripts/sync-agent-context.mjs --project /path/to/app --context docs/design/agent-context.md
```

The default previews the result; add `--write` for the requested update. The helper verifies project-local paths, refuses symlink targets and retains text outside its block. It does not generate the context or establish client-specific instruction precedence. Nested instructions and the user's requests still apply.

## Verify and maintain

Read every changed document, resolve local links, confirm commands and remove unsupported claims. Preserve licenses and applicable source notices. Recheck shared contracts after design or implementation changes. Use `mobile-design-drift` when a broader consistency audit is requested or materially needed. Do not commit, publish or change unrelated configuration merely because documentation was requested.
