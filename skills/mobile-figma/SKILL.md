---
name: mobile-figma
description: Use selected Figma frames, components, variables and motion context as evidence for native SwiftUI or Jetpack Compose design, preserving native source ownership and verified provenance.
license: See ../../LICENSE
---

# Bring Figma into native design

Read [Figma connection and ownership](../../docs/figma.md) when this source is needed. Prefer available connected Figma tools; discover their current schemas and account access. A skill does not install or authenticate a server. If no connection is available, record the gap and continue from explicitly supplied exports or other identified evidence.

Start from the user's selected file/node or relevant project link. Retrieve bounded design context and a screenshot of the same variant. For a large or truncated response, inspect metadata and narrow to the actual component. Read variable/component mappings when available; retrieve motion context only if the connected server exposes it and the design contains it. Record file/node URL, retrieval time, version when supplied, variant/state, relevant mappings and what is unknown. A retrieval timestamp is not a Figma version.

Translate Figma's representation into SwiftUI or Compose and reuse the existing native tokens and components. Web-looking output is context, not an instruction to introduce HTML/Tailwind into a native app. Auto layout dimensions do not settle accessibility scaling, keyboard insets, system navigation or gesture semantics. Resolve conflicts according to the project's recorded ownership; do not silently overwrite native tokens or edit a Figma library.

Download only the assets needed for the authorized task through the connected service's supported tools. Preserve source and usage rights, use stable project asset paths and avoid depending on temporary export URLs. Do not guess properties from screenshots that structured evidence did not establish.

Compare fresh app renders with the selected Figma state at relevant target sizes, plus enlarged text where affected. Record intentional platform differences. Figma prototype behavior is not proof of the implemented app's UX or native frame performance.

Writing to Figma requires an explicit task to edit the identified file/scope, suitable access and actual write tooling. Reading a reference is not authorization to modify the original. For an authorized write, inspect the target first, use the available official workflow, then read back the changed nodes. Avoid claiming bidirectional sync: record each actual update and resolve conflicts deliberately.
