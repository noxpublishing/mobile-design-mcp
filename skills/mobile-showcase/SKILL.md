---
name: mobile-showcase
description: Build an optional showcase website for a completed native mobile app design using its final screenshots, device mockups, and motion clips. Use after the app design is finished and the user requests its website; do not start a showcase as a substitute for unfinished app work.
license: Apache-2.0
---

# Showcase a finished mobile app

Adapted native-design handoff guidance; see the package NOTICE. Use the same [completion contract](../../docs/workflow.md#completion) as mobile-design.

Create a separate website that explains and presents the actual completed app. Use its final screen content and motion as the visual source of truth. A strong showcase can be the aim; awards or acceptance by Awwwards cannot be promised.

## Check readiness and scope

Read the app handoff, agreed scope and available artifacts. Verified readiness requires current design, UX-review and measured native-performance evidence for the agreed revision and platforms. Accepted gaps remain a qualified handoff; they do not turn absent profiles into a pass. Only an explicitly requested provisional showcase may proceed from such a handoff, and it must retain that label. Do not equate a concept screen, reference collection or generated code stub with a finished app design.

Proceed when the user requested the showcase, including a website already authorized as a later phase. If app work is still incomplete, continue or return to that work and identify what remains. Do not quietly redesign the app while building its marketing page. Proposed app changes belong in the native project and require an updated final media set before the website represents them.

Identify the website's purpose, audience, content, brand assets, and destination for its primary action from the user's brief. Reuse existing choices; clarify only consequential gaps. Keep the website in a separate project or an explicitly agreed subdirectory. Do not change the native app's architecture to accommodate the website.

## Assemble the final asset set

Create a small asset inventory containing each file's role, originating app revision/build, platform, device or viewport, and screen/flow. Use:

- Final screenshots rendered from the user's finished app design, with real screen content.
- Device mockups that frame those screenshots without altering the app UI. Choose accurate device proportions and preserve readable content.
- Short clips of the final app's implemented motion or complete flows. A reference-app recording cannot stand in for the user's app.
- Approved brand graphics, icons, copy, and licensed supporting assets.

Read imported media and provenance using `list_recordings` or `get_flow` when useful. The mobile MCP does not capture a running app: use existing simulator/emulator/device capture tooling if available. If required final screenshots or clips are missing, request the real artifacts or explain the capture needed. Continue independent work such as content planning while waiting, but do not present placeholders as final app media.

Generated decorative backgrounds or device framing may support the composition when requested or useful. They must not invent app features, replace missing authentic screens, or conceal changes to the final design. Keep any temporary development placeholders unmistakable and remove them before handoff.

## Find a web direction and build

If an Awwwards MCP is available, use its actual discovery tools to shortlist web references for composition, type, device presentation, and motion. Inspect available full-page and motion evidence before reproducing a specific effect. The website may draw from web references; its app screenshots and product claims must come from the completed app.

If Awwwards is unavailable, use normal web research, the user's references, or their established brand system. Awwwards is an optional source, not a required account, installation, or approval gate. Follow the available website-building workflow appropriate to the user's stack or hosting preference.

State the website direction, then implement its story around the product: what it does, the main user journey, meaningful screen details, and a working primary action. Choose section structure from the content. Avoid fake store links, invented testimonials, unsupported metrics, or claims that the app has shipped if it has not.

Use media from the final asset set with responsive sizing, readable phone screens, poster frames, and appropriate compression. Prefer motion that clarifies the app's behavior. Provide reduced-motion behavior and controls or static alternatives for clips; avoid loading heavy media before it is needed. Link relevant app screenshots and clip ranges to the sections that use them so future app revisions can update the website accurately.

## Verify and hand off

Run the website's supported build checks and inspect mobile and desktop layouts. Check screen readability, device aspect ratios, video playback and fallbacks, keyboard operation, reduced motion, overflow, broken links, and console/network errors. Verify that every demonstrated screen and interaction belongs to the identified final app build; distinguish illustrative website animation from actual app interaction.

Deliver the website with run instructions, asset inventory/provenance, verification results, and known gaps. Record which app revision it represents. Later native changes can mark affected website media stale; update those within the authorized website scope rather than making an old showcase block unrelated app work. Keep deployment separate: publish only when the user has asked for publication and the destination is known. Building the website does not by itself authorize deployment or award submission. If publication was already explicitly authorized, complete the relevant hosting workflow without asking for duplicate permission.
