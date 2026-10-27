# Motion from reference to running app

The working agent builds animation in the native project; the MCP supplies
reference evidence and authored starting examples. Use `mobile-motion` for the
full process. There is no one-call universal animation engine in this server.

1. **Observe:** inspect selected clips using `import_recording`, `create_flow`
   and `analyze_transition`, or read actual Figma motion context when available.
   Label observed information, inferences, authored choices and unknowns.
2. **Specify:** define the task/purpose, trigger, initial/target state, progress
   ownership, interruption, reversal, timing ownership, lifecycle, semantic
   feedback and reduced-motion path in the motion contract.
3. **Choose:** native SwiftUI/Compose for platform navigation, layout and gestures;
   optional Rive for suitable authored animated graphics; a mixed approach where
   useful. Consider asset/dependency cost and the existing architecture.
4. **Build:** integrate a shipped native recipe or write project-specific native
   code. For Rive, author through an actual connected editor or use a real supplied
   asset, export it and implement the verified binding contract.
5. **Verify:** compile and render; check interruption, repetition, back navigation,
   lifecycle, load errors and reduced motion. Give current clips and context to
   the motion reviewer. Recheck affected UX, then measure native performance.

The three shipped patterns are bottom sheets, shared elements and success feedback,
each with SwiftUI/Compose variants. Their code is authored, with explicit platform
prerequisites and reduced-motion handling. New effects are implemented by the agent
in the app, not silently added to the recipe catalog. System-owned animation timing
is kept separate from custom timing. A frame interval is not a measured transition
duration, and video does not establish input latency, original spring values or haptics.

See [Figma](figma.md), [Rive](rive.md), [reviewer dispatch](agents.md) and the
[shared workflow](workflow.md). Missing build/editor/device evidence remains explicit.

## Explicit project targets

Expo uses the actual project-compatible React Native animation stack, following [Expo contracts](expo.md). The existing recipe generator remains SwiftUI/Compose-only. A runnable host exercising a similar interaction does not verify a different generated snippet.
