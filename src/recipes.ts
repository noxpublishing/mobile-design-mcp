import type { Platform } from './types.js';

export interface MotionRecipeDefinition {
  id: string;
  title: string;
  platforms: Platform[];
  description: string;
}

export interface MotionRecipeInput {
  pattern: string;
  platform: Platform;
  durationMs?: number;
  reducedMotion?: boolean;
}

export interface MotionRecipeResult {
  pattern: string;
  title: string;
  platform: Platform;
  evidenceStatus: 'authored';
  language: 'swift' | 'kotlin';
  code: string;
  durationMs: number;
  reducedMotion: boolean;
  timing: {
    mode: 'system' | 'authored';
    customDurationApplied: boolean;
    note: string;
  };
  assumptions: string[];
  accessibility: string[];
  limitations: string[];
  sources: Array<{ title: string; url: string }>;
}

const DEFINITIONS: readonly MotionRecipeDefinition[] = [
  {
    id: 'bottom-sheet',
    title: 'Native modal bottom sheet',
    platforms: ['ios', 'android'],
    description: 'Platform sheet with a close action and an inline alternative when motion is reduced. Presentation timing belongs to the system.',
  },
  {
    id: 'shared-element',
    title: 'Shared preview to details',
    platforms: ['ios', 'android'],
    description: 'Connect the same preview across summary and detail layouts; reduced motion switches directly between accessible states.',
  },
  {
    id: 'success-feedback',
    title: 'Persistent success feedback',
    platforms: ['ios', 'android'],
    description: 'A small confirmation animation backed by persistent text and an accessible status. No essential information depends on movement.',
  },
];

export function listMotionRecipes(): MotionRecipeDefinition[] {
  return DEFINITIONS.map((definition) => ({ ...definition, platforms: [...definition.platforms] }));
}

const APPLE_REDUCE_MOTION = {
  title: 'SwiftUI accessibilityReduceMotion',
  url: 'https://developer.apple.com/documentation/swiftui/environmentvalues/accessibilityreducemotion',
};
const ANDROID_REDUCE_MOTION = {
  title: 'Android ValueAnimator.areAnimatorsEnabled',
  url: 'https://developer.android.com/reference/android/animation/ValueAnimator#areAnimatorsEnabled()',
};

const ANDROID_IMPORTS = `import android.animation.ValueAnimator
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp`;

// Observe the system setting instead of taking a one-time snapshot of it.
// areAnimatorsEnabled() requires Android API 26; that minimum is in the result.
const ANDROID_REDUCED_MOTION_HELPER = `@Composable
private fun rememberRecipeReducedMotion(requested: Boolean): Boolean {
    val context = LocalContext.current
    var systemReduced by remember { mutableStateOf(!ValueAnimator.areAnimatorsEnabled()) }
    DisposableEffect(context) {
        val resolver = context.contentResolver
        val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                systemReduced = !ValueAnimator.areAnimatorsEnabled()
            }
        }
        resolver.registerContentObserver(
            Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE),
            false,
            observer
        )
        // Refresh after registration so an intervening settings change is not missed.
        systemReduced = !ValueAnimator.areAnimatorsEnabled()
        onDispose { resolver.unregisterContentObserver(observer) }
    }
    return requested || systemReduced
}`;

function iosBottomSheet(reducedMotion: boolean): string {
  return String.raw`import SwiftUI

// Authored example, iOS 16+. Native sheet timing is system-controlled.
struct BottomSheetRecipe: View {
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @State private var isOpen = false
    private let requestedReduceMotion = ${reducedMotion}
    private var reduceMotion: Bool { requestedReduceMotion || systemReduceMotion }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Button("Open options") { isOpen = true }
                .disabled(isOpen)
            if reduceMotion && isOpen {
                optionsContent
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            }
        }
        .padding()
        .sheet(isPresented: Binding(
            get: { isOpen && !reduceMotion },
            set: { isOpen = $0 }
        )) {
            optionsContent
                .padding()
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .transaction { transaction in
            if reduceMotion {
                transaction.animation = nil
                transaction.disablesAnimations = true
            }
        }
    }

    private var optionsContent: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Options").font(.headline).accessibilityAddTraits(.isHeader)
            Text("Choose an option or close this panel.")
            Button("Close options") { isOpen = false }
        }
    }
}`;
}

function androidBottomSheet(reducedMotion: boolean): string {
  return `${ANDROID_IMPORTS}
import kotlinx.coroutines.launch

// Authored example, Android API 26+, Compose Material 3.
// Material controls sheet timing; durationMs is not a sheet API parameter.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetRecipe(reducedMotion: Boolean = ${reducedMotion}) {
    val reduceMotion = rememberRecipeReducedMotion(reducedMotion)
    var isOpen by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()
    Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Button(onClick = { isOpen = true }, enabled = !isOpen) { Text("Open options") }
        if (isOpen && reduceMotion) {
            Surface(shape = RoundedCornerShape(16.dp), tonalElevation = 2.dp) {
                SheetOptions(onClose = { isOpen = false })
            }
        }
    }
    if (isOpen && !reduceMotion) {
        ModalBottomSheet(onDismissRequest = { isOpen = false }, sheetState = sheetState) {
            SheetOptions(onClose = {
                scope.launch { sheetState.hide() }.invokeOnCompletion {
                    if (!sheetState.isVisible) isOpen = false
                }
            })
        }
    }
}

@Composable
private fun SheetOptions(onClose: () -> Unit) {
    Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Options", style = MaterialTheme.typography.titleLarge)
        Text("Choose an option or close this panel.")
        Button(onClick = onClose) { Text("Close options") }
    }
}

${ANDROID_REDUCED_MOTION_HELPER}`;
}

function iosSharedElement(durationMs: number, reducedMotion: boolean): string {
  return String.raw`import SwiftUI

// Authored example: one SwiftUI hierarchy, not a cross-window transition.
struct SharedElementRecipe: View {
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @Namespace private var heroNamespace
    @State private var expanded = false
    private let requestedReduceMotion = ${reducedMotion}
    private var reduceMotion: Bool { requestedReduceMotion || systemReduceMotion }

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            if expanded {
                preview(size: 240)
                Text("Preview details").font(.title2).accessibilityAddTraits(.isHeader)
                Text("The same preview is shown at a larger size.")
            } else {
                preview(size: 96)
                Text("Preview summary")
            }
            Button(expanded ? "Back to summary" : "Show details") {
                var transaction = Transaction(animation: reduceMotion
                    ? nil : .easeInOut(duration: ${durationMs / 1000}))
                transaction.disablesAnimations = reduceMotion
                withTransaction(transaction) { expanded.toggle() }
            }
            .accessibilityValue(expanded ? "Details shown" : "Summary shown")
        }
        .padding(24)
    }

    @ViewBuilder
    private func preview(size: CGFloat) -> some View {
        if reduceMotion {
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.accentColor)
                .frame(width: size, height: size)
                .accessibilityLabel("Preview")
        } else {
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.accentColor)
                .matchedGeometryEffect(id: "preview", in: heroNamespace)
                .frame(width: size, height: size)
                .accessibilityLabel("Preview")
        }
    }
}`;
}

function androidSharedElement(durationMs: number, reducedMotion: boolean): string {
  return `${ANDROID_IMPORTS}
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics

// Authored example: Compose Animation 1.7+; keep one shared transition scope.
@OptIn(ExperimentalSharedTransitionApi::class)
@Composable
fun SharedElementRecipe(reducedMotion: Boolean = ${reducedMotion}) {
    val reduceMotion = rememberRecipeReducedMotion(reducedMotion)
    var expanded by remember { mutableStateOf(false) }
    if (reduceMotion) {
        // Switch directly, without a shared-element overlay or spatial movement.
        PreviewContent(expanded, onToggle = { expanded = !expanded })
    } else {
        SharedTransitionLayout {
            AnimatedContent(
                targetState = expanded,
                transitionSpec = {
                    fadeIn(tween(${durationMs})) togetherWith fadeOut(tween(${durationMs}))
                },
                label = "preview-details"
            ) { targetExpanded ->
                PreviewContent(
                    expanded = targetExpanded,
                    onToggle = { expanded = !expanded },
                    heroModifier = Modifier.sharedElement(
                        sharedContentState = rememberSharedContentState(key = "preview"),
                        animatedVisibilityScope = this@AnimatedContent,
                        boundsTransform = BoundsTransform { _, _ -> tween(${durationMs}) }
                    )
                )
            }
        }
    }
}

@Composable
private fun PreviewContent(expanded: Boolean, onToggle: () -> Unit, heroModifier: Modifier = Modifier) {
    Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
        Box(heroModifier
            .size(if (expanded) 240.dp else 96.dp)
            .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(24.dp))
            .semantics { contentDescription = "Preview" })
        Text(if (expanded) "Preview details" else "Preview summary")
        if (expanded) Text("The same preview is shown at a larger size.")
        Button(onClick = onToggle) { Text(if (expanded) "Back to summary" else "Show details") }
    }
}

${ANDROID_REDUCED_MOTION_HELPER}`;
}

function iosSuccessFeedback(durationMs: number, reducedMotion: boolean): string {
  return String.raw`import SwiftUI

// Authored example: call confirmation only after your save operation succeeds.
struct SuccessFeedbackRecipe: View {
    @Environment(\.accessibilityReduceMotion) private var systemReduceMotion
    @AccessibilityFocusState private var statusFocused: Bool
    @State private var saved = false
    private let requestedReduceMotion = ${reducedMotion}
    private var reduceMotion: Bool { requestedReduceMotion || systemReduceMotion }

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: saved ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 44))
                .foregroundStyle(saved ? Color.green : Color.secondary)
                .scaleEffect(saved && !reduceMotion ? 1.04 : 1)
                .animation(reduceMotion ? nil : .easeOut(duration: ${durationMs / 1000}), value: saved)
                .accessibilityHidden(true)
            Text(saved ? "Saved successfully" : "Ready to save")
                .accessibilityFocused($statusFocused)
            Button("Confirm successful save") {
                // Demo only. Invoke this state change after real persistence succeeds.
                saved = true
                statusFocused = true
            }
            .disabled(saved)
        }
        .padding(24)
        .transaction { transaction in
            if reduceMotion {
                transaction.animation = nil
                transaction.disablesAnimations = true
            }
        }
    }
}`;
}

function androidSuccessFeedback(durationMs: number, reducedMotion: boolean): string {
  return `${ANDROID_IMPORTS}
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics

// Authored example: call confirmation only after your save operation succeeds.
@Composable
fun SuccessFeedbackRecipe(reducedMotion: Boolean = ${reducedMotion}) {
    val reduceMotion = rememberRecipeReducedMotion(reducedMotion)
    var saved by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (saved && !reduceMotion) 1.04f else 1f,
        animationSpec = tween(durationMillis = if (reduceMotion) 0 else ${durationMs}),
        label = "success-scale"
    )
    Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(
            text = if (saved) "✓" else "○",
            style = MaterialTheme.typography.displaySmall,
            modifier = Modifier.graphicsLayer { scaleX = scale; scaleY = scale }
                .clearAndSetSemantics { }
        )
        // Keep the live-region node composed before and after the update.
        Text(
            text = if (saved) "Saved successfully" else "Ready to save",
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite }
        )
        Button(onClick = {
            // Demo only. Invoke this state change after real persistence succeeds.
            saved = true
        }, enabled = !saved) { Text("Confirm successful save") }
    }
}

${ANDROID_REDUCED_MOTION_HELPER}`;
}

/** Produce authored examples; no duration, easing or layout is measured from an app. */
export function buildMotionRecipe(input: MotionRecipeInput): MotionRecipeResult {
  if (!input || typeof input !== 'object') throw new TypeError('Recipe input is required.');
  if (input.platform !== 'ios' && input.platform !== 'android') {
    throw new RangeError('platform must be ios or android.');
  }
  const definition = DEFINITIONS.find((recipe) => recipe.id === input.pattern);
  if (!definition) {
    throw new RangeError(`Unknown motion pattern. Choose ${DEFINITIONS.map((recipe) => recipe.id).join(', ')}.`);
  }
  if (input.durationMs !== undefined && (typeof input.durationMs !== 'number' || !Number.isFinite(input.durationMs))) {
    throw new TypeError('durationMs must be a finite number.');
  }
  if (input.reducedMotion !== undefined && typeof input.reducedMotion !== 'boolean') {
    throw new TypeError('reducedMotion must be a boolean.');
  }
  const durationMs = Math.max(100, Math.min(1200, Math.round(input.durationMs ?? 280)));
  const reducedMotion = input.reducedMotion ?? false;
  const ios = input.platform === 'ios';
  const sheet = definition.id === 'bottom-sheet';
  const code = sheet
    ? (ios ? iosBottomSheet(reducedMotion) : androidBottomSheet(reducedMotion))
    : definition.id === 'shared-element'
      ? (ios ? iosSharedElement(durationMs, reducedMotion) : androidSharedElement(durationMs, reducedMotion))
      : (ios ? iosSuccessFeedback(durationMs, reducedMotion) : androidSuccessFeedback(durationMs, reducedMotion));
  const sources: MotionRecipeResult['sources'] = [ios ? { ...APPLE_REDUCE_MOTION } : { ...ANDROID_REDUCE_MOTION }];
  if (sheet) {
    sources.push(ios
      ? { title: 'SwiftUI presentationDetents', url: 'https://developer.apple.com/documentation/swiftui/view/presentationdetents(_:)' }
      : { title: 'Compose Material bottom sheets', url: 'https://developer.android.com/develop/ui/compose/components/bottom-sheets' });
  } else if (definition.id === 'shared-element') {
    sources.push(ios
      ? { title: 'SwiftUI matchedGeometryEffect', url: 'https://developer.apple.com/documentation/swiftui/view/matchedgeometryeffect(id:in:properties:anchor:issource:)' }
      : { title: 'Compose shared element transitions', url: 'https://developer.android.com/develop/ui/compose/animation/shared-elements' });
  } else {
    sources.push(ios
      ? { title: 'SwiftUI AccessibilityFocusState', url: 'https://developer.apple.com/documentation/swiftui/accessibilityfocusstate' }
      : { title: 'Compose accessibility semantics', url: 'https://developer.android.com/develop/ui/compose/accessibility/semantics' });
  }
  return {
    pattern: definition.id,
    title: definition.title,
    platform: input.platform,
    evidenceStatus: 'authored',
    language: ios ? 'swift' : 'kotlin',
    code,
    durationMs,
    reducedMotion,
    timing: {
      mode: sheet ? 'system' : 'authored',
      customDurationApplied: !sheet && !reducedMotion,
      note: sheet
        ? 'Native sheet presentation uses system timing; durationMs is bounded metadata and is not applied. Reduced motion uses an immediate inline panel.'
        : 'durationMs is an authored baseline clamped to 100–1200 ms, not a measured app value. Reduced motion skips spatial animation; system settings may further alter timing.',
    },
    assumptions: [
      'Standalone integration example, not a reconstruction of any referenced app. Copy each recipe into its own file and adapt content, state ownership and localization.',
      ios
        ? 'SwiftUI on iOS 16 or later; place the view in an existing app. Read both the app preference and accessibilityReduceMotion.'
        : 'Android API 26 or later with a compatible Compose BOM and Material 3; the host Activity already supplies MaterialTheme. The settings observer tracks the system animator-duration setting.',
      ...(definition.id === 'shared-element' ? [ios
        ? 'matchedGeometryEffect connects views inside one namespace/hierarchy; it does not implement a cross-window or native navigation transition.'
        : 'Requires Compose Animation 1.7+ shared-transition APIs; an experimental opt-in may be required by the chosen BOM. The example keeps both states in one SharedTransitionLayout.'] : []),
    ],
    accessibility: [
      'The example combines an explicit reduced-motion preference with the platform setting.',
      sheet ? 'Reduced motion shows the same options inline with a labeled close button; no drag gesture is required.'
        : definition.id === 'shared-element' ? 'Reduced motion changes content directly. A labeled button reaches both summary and details without depending on the visual transition.'
          : 'Persistent success text accompanies the decorative icon; SwiftUI moves accessibility focus to status and Compose uses a polite live region.',
    ],
    limitations: [
      'Generated Swift/Kotlin examples have not been compiled against your app SDK or tested with VoiceOver/TalkBack; validate them in the target project.',
      'No app-specific duration, easing, layout measurements, haptics or proprietary assets are inferred.',
      ...(sheet ? ['The inline reduced-motion alternative intentionally changes the modal presentation into in-flow content.'] : []),
    ],
    sources,
  };
}
