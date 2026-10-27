# Rive authoring and native integration

Rive is optional. Use native SwiftUI/Compose for native UI transitions and gestures
unless the project's design calls for another approach. Rive is useful for
stateful animated graphics, illustrations or similar authored assets. A screen
may combine native interaction with a Rive illustration.

## Editor connection

Rive documents an official editor MCP at `http://127.0.0.1:9791/mcp`. Its desktop
editor must be running; current documentation limits this integration to macOS
and Windows. It can inspect/edit scenes, keyframes, state machines and data
bindings. Discover the actual connected schemas rather than inventing tool
names. See [Rive MCP](https://rive.app/docs/editor/ai/mcp).

This toolkit does not bundle or start that editor and does not provide a Rive
cloud proxy. On Linux, prepare specifications/native alternatives and integrate
existing assets; editor authoring requires a supported editor host. A remote
host must be configured deliberately; `127.0.0.1` refers to the agent client's
own host, not another computer. Do not expose the editor endpoint publicly.

## From source to app

Maintain both the editable source reference and its real exported `.riv` file.
Record source revision when available, export hash, artboard/state-machine names,
view-model/property paths and types, runtime version/API generation, app-state
mapping, semantic/static fallback, reduced-motion behavior and asset rights.
The template in `skills/mobile-motion/assets/motion-contract.md` captures this.

Check current export availability and account entitlement in the editor; no plan
or export permission is assumed. Creating editor objects does not establish that
a runtime artifact was exported. See [runtime export](https://rive.app/docs/editor/exporting/exporting-for-runtime).

Integrate using the project's pinned runtime and current official documentation:
[Apple](https://rive.app/docs/runtimes/apple/apple),
[Android](https://rive.app/docs/runtimes/android/android).
Confirm actual asset features on both targets. New and legacy API generations
differ; validate data bindings or legacy inputs against the file and runtime
actually used. Do not hard-code invented artboard or property names.

App state remains authoritative. Preserve binding/resource ownership, load-error
fallback, cancellation/repeated activation and lifecycle. Pause unnecessary work
offscreen or in background and release owned resources. Supply accessible native
information/actions as needed. Pass the platform motion preference to a real
binding and implement its alternative path: Rive does not automatically select
reduced motion. See [Rive reduced motion](https://rive.app/docs/editor/accessibility/reduced-motion).

Compile, render and inspect actual native behavior, then collect comparable
performance profiles for important scenarios. A `.riv` file or successful MCP call
does not certify UX, accessibility or frame pacing. This toolkit has no native
Rive runtime test or editor session verified yet.

## Explicit project targets

For Expo, confirm the compatible installed runtime and native build path using [Expo contracts](expo.md). A valid editor export is separate from runtime integration and native lifecycle/accessibility verification.
