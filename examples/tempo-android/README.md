# Tempo — a native design study

A small Jetpack Compose habit-completion app with two layouts in the same APK:
`baseline` uses conventional Material 3 components; `workflow` applies the mobile
design workflow to hierarchy, spacing, emphasis, task copy and motion behavior.
Both begin with the same three habits and Drink water complete. Neither layout
has a separate routine destination; baseline footer labels are static text.

This is an illustrative redesign by one author, not a controlled comparison of
independent agents or evidence that using an MCP causes better UX. The baseline
was first built before the recorded MCP-assisted redesign. The author already
knew the workflow. Final captures use the same APK/device and initial data.

## Build and run

Requires JDK 17, Gradle 8.14.3, Android SDK platform 36 and Build Tools 35.0.0.
Set `ANDROID_HOME` for your machine, or an ignored `local.properties` SDK path.
Dependencies are pinned in the Gradle files; the first build needs repository
access. No signing credentials or production services are required.

```text
gradle :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -W -n study.mobiledesign.tempo/.MainActivity --es variant baseline
```

Force-stop the package before launching with `--es variant workflow` to switch
layouts. Habit state is held in memory and resets on process restart; no data
leaves the app. The source is a one-task study, not a shipped habit product.

From this directory run the cross-platform capture helper with one connected
Android emulator/device, or specify its serial:

```text
node capture-study.mjs --serial emulator-5554
```

The helper installs the debug APK, launches both layouts, captures original PNGs,
and checks completing/undoing reading through actual taps and UI hierarchy.
It writes `docs/assets/tempo-evidence.json` and the screenshots. Use `--output`
for another destination. It interacts only with the study package; run it on a
dedicated test emulator/device. Do not publish captures containing personal data.

## What the workflow contributed

The MCP was actually called for provider status, Android award references,
selected app metadata, Mobbin availability, an authored success-feedback recipe
and a native brief. Focus Friend and Wiser supplied recognition/product-context
metadata; their current screen designs were not recovered or copied.

Mobbin's public discovery page exposed its sign-in surface; an authenticated
screen library was unavailable. Awwwards' public editorial/minimal reference
descriptions informed high-level composition research; no third-party graphics,
screens or font files are bundled. See the [study record](../../docs/tempo-study.md)
for sources, actual checks and limitations.

The workflow variant owns its tokens in `WorkflowScreen.kt`: 12/16/32sp roles,
24dp outer/section spacing and an 8dp related-content relationship, with local
component spacing. It uses native state, a purpose-specific completion action,
toggle semantics, persistent numeric progress and reduced-motion-aware feedback.
Original vector geometry is drawn in Compose; there is no Rive dependency.

Native compilation and captured single-task interaction have been checked.
Real-user research, TalkBack, additional devices/text-scale coverage and measured
native performance remain incomplete. This demo is a qualified handoff, not a
fully verified app or an award-winning claim.
