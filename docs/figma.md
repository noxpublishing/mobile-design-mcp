# Figma as a native design source

Use `mobile-figma` for selected frames, components and variables. The mobile MCP
does not proxy Figma or store account tokens. Connect the official Figma server
or an available Figma integration in the agent client, then discover its actual
tools and access. The remote endpoint is `https://mcp.figma.com/mcp`.
See [official setup](https://developers.figma.com/docs/figma-mcp-server/).

Read design context and a screenshot for the selected node. Use metadata to
narrow large selections, component/variable mappings where available, and motion
context if the connected server exposes it. Record node URL, state/variant,
retrieval time and source version when supplied. Exports remain subject to
their owners' rights; references are not automatically publishable assets.

Figma output may resemble React/Tailwind. Translate its design intent into the
project's native SwiftUI/Compose components, rather than importing a web layout.
See [official tool descriptions](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/).

The app's native theme/components stay authoritative unless the project records
a different ownership decision. Figma can own approved design intent while native
source owns implemented values and platform behavior; record mappings and resolve
disagreements. Do not maintain two silently diverging token sets. Compare fresh
native renders with the exact selected variant, with explicit platform/accessibility
differences. Prototype motion is not a runtime performance measurement.

Read access and write access are separate. Only edit identified Figma content
when the user's task authorizes it and the connected account/tools support it.
Read back actual changes. No automatic two-way synchronization is implemented.
Account/seat limits and tool availability must be checked at use time.

Current toolkit verification does not include authenticated Figma requests.

## Explicit project targets

For Expo projects preserve the actual stack and SDK when translating selected context; follow [Expo contracts](expo.md). Actual node access/export and native verification remain separate evidence.
