---
name: mobile-setup
description: Prepare a native mobile design project through a short interview and a durable brief covering scope, visual direction, sources and verification. Resume an existing setup without repeating answered questions.
license: See ../../LICENSE
---

# Prepare a mobile design project

Read the [shared workflow](../../docs/workflow.md) and the existing project instructions, native sources and decision records. Run this preparation for a new project or a consequential scope reset, not before every edit. If an existing brief answers the questions, summarize it and continue the requested work.

## Short interview

Reuse information already supplied. Ask at most three concise questions together, with a recommended default where useful. Start with the unresolved items that affect the design most:

- Product, intended users, their main task and the desired outcome.
- Target OS and actual implementation stack, required screens/flows, agreed task boundary and explicit exclusions.
- Brand, preferred feeling, existing references, constraints and freedom to propose a direction.

Then resolve only consequential gaps: content and languages, accessibility needs, existing theme/components, motion ambition, target devices, available Figma/Mobbin/Rive access, timeline and depth of review. Do not make account connection or a long questionnaire a prerequisite for useful progress. An unknown may remain an explicit assumption if the task can proceed. A design direction requiring the user's choice remains proposed until selected or delegated.

## Durable output

Create or update `docs/design/project.md` using the [project record](assets/project.md) as a starting structure. Adapt the structure to an existing equivalent rather than introducing a competing record. Capture:

- Accepted facts versus proposed choices, assumptions and unanswered questions.
- Priority user tasks, agreed deliverables, platforms and out-of-scope work.
- Native source-of-truth paths, reference availability, visual direction status and motion approach.
- Device/build/capture/profiling readiness, verification criteria and explicitly unmeasured work.
- Next action, decisions that need the user, and whether a later showcase is requested.

Use `mobile-project-docs` when available to make the README and `AGENTS.md`/`CLAUDE.md` point to a concise canonical agent context. Otherwise maintain those links directly. These documents describe the project; they do not create build tooling, connect accounts or prove app completion.

Do not put secrets, private provider responses or personal interview details into publishable documents. Summarize the setup briefly for correction, then continue authorized design work. Revisiting setup changes affected decisions and invalidates their dependent evidence; it does not erase valid work or restart the entire interview.
