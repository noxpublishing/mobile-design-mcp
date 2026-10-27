# Palette app source

## Overview

The app owns one composition and two treatments of its task. Its complete Xcode
build/test interface is in the [study README](../README.md).

## Interface

- `PaletteApp` owns `PaletteStore`; `PaletteView` renders the task and treatment menu.
- `Composition`/`Swatch` define stable identity, validated RGB and SVG representation.
- `PaletteStore` exposes update, move, undo and retryable local persistence.
- `SwatchEditor` holds a temporary RGB draft; only Save commits it.
- `ExportDocument` supplies the actual SVG bytes to the native file exporter.
- `PaletteTheme` and `CompositionCanvas` owns semantic roles and the original composition canvas.

The SVG exporter writes five clipped colour columns and circular accents on a
canonical 1000 × 600 canvas. The SwiftUI canvas adapts these placement rules to
its available size; the export does not capture surrounding app controls.

## Invariants

- All store mutations are on the main actor. RGB must be finite and within 0...1.
- A composition has exactly five unique swatches for this bounded study.
- Undo restores complete prior state, including identity/order. A no-op is not history.
- Editor cancellation preserves state; reduced motion disables custom spatial motion.
- Dark/light system roles remain separate from the authored RGB composition colours.

## Side Effects

Completed changes persist atomically to Application Support. A read failure keeps
an original recovery copy; a failed backup blocks writes. A save failure preserves
the session state and exposes an error/Retry action. Export completion follows the
native document result; source generation alone is not successful destination save.

## Verification

State tests exercise edits/order/undo, persistence, invalid values, SVG content and
failed saves. UI tests execute editor/treatment/export-presentation paths and retain
actual screenshots. Read the parent README for current execution evidence/gaps;
test source alone does not establish a passing native run.
