# Tempo: a recorded native redesign

Tempo is an original, one-screen Jetpack Compose study for completing a daily
habit. The comparison holds the platform, APK, initial three habits, completed
water habit and reading-completion task constant. It changes visual hierarchy,
grouping, task-specific wording, spacing, color roles and motion implementation.

## Baseline and direction

The baseline uses conventional Material 3 cards, typography, progress and controls.
It was first built before the recorded MCP research pass. The author already knew
the workflow; this is not an independent control group. Its navigation-looking
footer labels are static text, and neither layout implements a routine destination.
Final comparison captures use both layouts in the same APK.

The delegated direction was a calm editorial treatment: paper, forest and lime;
12/16/32sp role scale; 24dp outer/section spacing; an 8dp related-content relationship;
purposeful component spacing; a clear next habit and a task-specific completion
action. Values live in `WorkflowScreen.kt`, not a second token database.

## Actual research and MCP use

The real stdio server was called for `get_provider_status`, `search_apps`, two
`get_app` reads, `mobbin_list_tools`, `build_motion_recipe` and `create_mobile_brief`.
The selected Android metadata concerned Focus Friend and Wiser, from
[Google Play Best of 2025](https://blog.google/products-and-platforms/platforms/google-play/best-apps-games-2025/).
This recognition/product context is not evidence of their current screens or
motion. No reference-app artwork, screen or implementation was copied.

[Mobbin discovery](https://mobbin.com/discover/apps/ios/latest) exposed the sign-in
surface; authenticated screen research was unavailable. The MCP call did not
establish account access. This remains a gap, not completed Mobbin screen research.
[Awwwards' public editorial/minimal reference description](https://www.awwwards.com/inspiration/exhibition-page)
was consulted for high-level composition research; a full-site or animation
inspection was not established. The resulting visual choices are authored.

The MCP's Android success-feedback recipe informed state-linked feedback and
system reduced-motion observation. The app uses a native progress animation with
an authored 220ms duration; exact timing was not recovered from a reference.
It has no Rive dependency and no Figma file is claimed to have been inspected.

The actual native captures were also imported through `import_app`, two
`import_recording` calls and `create_flow` as an implemented study journey.
The [sanitized MCP-use record](assets/tempo-mcp-use.json) links its local record
identities and hashes without publishing local filesystem paths or credentials.

## Captures and verification

[Capture metadata](assets/tempo-evidence.json) records APK hash, Android/API,
display/density, font/animation settings, image hashes and interaction assertions.
The [capture helper](../examples/tempo-android/capture-study.mjs) installs the built
debug APK, launches each layout from reset state, waits for UIAutomator idle,
captures raw `adb screencap` PNGs, completes reading and undoes it through actual
taps. The exported screenshots are not retouched or generated mockups. A demo
clock is configured in the emulator to make the status bar consistent.

An independent fresh-context visual reviewer inspected both default-size captures
and relevant source. It found no visible readability/clipping blocker within
those captures and confirmed the shared initial habit state. Its scope did not
include native interaction execution, text scaling, TalkBack or performance.
The separate capture-helper assertions cover only the stated completion/undo task.

Original vector geometry supplies the UI illustration and the SVG banner. System
fonts and Compose components are used through the platform/runtime; no third-party
font binary or stock artwork is redistributed. The banner's small phones are
illustrations, separate from the actual app screenshots.

## Completion limits

This is a **qualified handoff**: native compilation and a narrow executed task
are supported, with a scoped visual review. Representative real-user research,
TalkBack, additional devices/text scales and comparable release/profile performance
measurements remain incomplete. No usability percentage, performance gain, award
or causal superiority of the workflow is claimed. An attractive screenshot alone
does not establish those results.
