package study.mobiledesign.tempo

import android.animation.ValueAnimator
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Source of truth for this deliberately small native study.
private object Tempo {
    val paper = Color(0xFFF4F3EA)
    val ink = Color(0xFF23352A)
    val muted = Color(0xFF626E5C)
    val line = Color(0xFFD9DFCE)
    val soft = Color(0xFFE8EDDC)
    val lime = Color(0xFFDCF78D)
    val small = 12.sp
    val body = 16.sp
    val display = 32.sp
    val inset = 24.dp
    val related = 8.dp
    val section = 24.dp
}

@Composable
fun WorkflowScreen(completed: Set<Int>, toggle: (Int) -> Unit) {
    val reduceMotion = rememberTempoReducedMotion()
    val progress by animateFloatAsState(
        completed.size / 3f, animationSpec = tween(if (reduceMotion) 0 else 220), label = "Daily progress"
    )
    val next = studyHabits.indices.firstOrNull { it !in completed }
    val action = when (next) { 0 -> "Complete water"; 1 -> "Complete reading"; 2 -> "Complete walk"; else -> "All done for today" }
    Scaffold(containerColor = Tempo.paper, bottomBar = {
        Column(Modifier.background(Tempo.paper).navigationBarsPadding().padding(horizontal = Tempo.inset)) {
            HorizontalDivider(color = Tempo.line)
            Row(Modifier.fillMaxWidth().padding(vertical = 20.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("TODAY / 01", fontSize = Tempo.small, fontWeight = FontWeight.Bold, letterSpacing = 1.sp, color = Tempo.ink)
                Text("A small daily practice", fontSize = Tempo.small, color = Tempo.muted)
            }
        }
    }) { insets ->
        Column(Modifier.fillMaxSize().padding(insets).verticalScroll(rememberScrollState()).padding(horizontal = Tempo.inset)) {
            Row(Modifier.fillMaxWidth().padding(top = 16.dp, bottom = 28.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(32.dp).background(Tempo.lime, CircleShape), contentAlignment = Alignment.Center) {
                    Canvas(Modifier.size(18.dp)) {
                        val p = Path().apply { moveTo(size.width * .12f, size.height * .8f); lineTo(size.width * .12f, size.height * .2f); lineTo(size.width * .5f, size.height * .6f); lineTo(size.width * .88f, size.height * .2f); lineTo(size.width * .88f, size.height * .8f) }
                        drawPath(p, Tempo.ink, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
                    }
                }
                Text("tempo", Modifier.padding(start = 10.dp), fontSize = Tempo.body, fontWeight = FontWeight.Bold, color = Tempo.ink)
                Spacer(Modifier.weight(1f))
                Text("TUESDAY, OCT 27", fontSize = Tempo.small, letterSpacing = .8.sp, color = Tempo.muted)
            }
            Text("A little better.\nEvery day.", fontSize = Tempo.display, lineHeight = 36.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-1).sp, color = Tempo.ink)
            Spacer(Modifier.height(Tempo.related))
            Text("One small action. A little more you.", fontSize = Tempo.body, color = Tempo.muted)
            Spacer(Modifier.height(Tempo.section))
            Row(
                Modifier.fillMaxWidth().background(Tempo.ink, RoundedCornerShape(24.dp)).padding(24.dp)
                    .semantics(mergeDescendants = true) { stateDescription = "${completed.size} of 3 habits complete" },
                horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(Tempo.related)) {
                    Text("YOUR DAILY RHYTHM", fontSize = Tempo.small, letterSpacing = 1.sp, color = Color(0xFFBFCCB6))
                    Text("${completed.size.toString().padStart(2, '0')} / 03", fontSize = Tempo.display, fontWeight = FontWeight.Medium, letterSpacing = (-1).sp, color = Tempo.paper)
                    Text("habits complete", fontSize = Tempo.small, color = Color(0xFFBFCCB6))
                }
                Canvas(Modifier.size(88.dp)) {
                    val stroke = 7.dp.toPx(); val diameter = size.minDimension - stroke
                    val at = Offset(stroke / 2, stroke / 2); val bounds = Size(diameter, diameter)
                    drawArc(Color(0xFF4D6048), -90f, 360f, false, at, bounds, style = Stroke(stroke, cap = StrokeCap.Round))
                    drawArc(Tempo.lime, -90f, progress * 360f, false, at, bounds, style = Stroke(stroke, cap = StrokeCap.Round))
                    val leaf = Path().apply {
                        moveTo(size.width * .4f, size.height * .65f)
                        cubicTo(size.width * .25f, size.height * .35f, size.width * .6f, size.height * .27f, size.width * .66f, size.height * .3f)
                        cubicTo(size.width * .68f, size.height * .58f, size.width * .52f, size.height * .65f, size.width * .4f, size.height * .65f)
                    }
                    drawPath(leaf, Tempo.lime)
                    drawLine(Tempo.ink, Offset(size.width * .4f, size.height * .65f), Offset(size.width * .57f, size.height * .41f), 2.dp.toPx(), StrokeCap.Round)
                }
            }
            Row(Modifier.fillMaxWidth().padding(top = 28.dp, bottom = 12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Your habits", fontSize = Tempo.body, fontWeight = FontWeight.SemiBold, color = Tempo.ink)
                Text("${3 - completed.size} TO GO", fontSize = Tempo.small, letterSpacing = 1.sp, color = Tempo.muted)
            }
            studyHabits.forEachIndexed { index, habit ->
                val done = index in completed
                val focused = index == next
                Row(
                    Modifier.fillMaxWidth().padding(bottom = 8.dp)
                        .background(if (focused) Tempo.soft else Color.Transparent, RoundedCornerShape(18.dp))
                        .border(1.dp, if (focused) Color(0xFFC9D4B8) else Tempo.line, RoundedCornerShape(18.dp))
                        .toggleable(value = done, role = Role.Checkbox, onValueChange = { toggle(index) })
                        .padding(horizontal = 16.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(Modifier.size(32.dp).background(if (done) Tempo.ink else Tempo.paper, CircleShape).border(1.dp, if (done) Tempo.ink else Color(0xFFB3BFA5), CircleShape), contentAlignment = Alignment.Center) {
                        if (done) Canvas(Modifier.size(16.dp)) {
                            val check = Path().apply { moveTo(size.width * .15f, size.height * .5f); lineTo(size.width * .4f, size.height * .75f); lineTo(size.width * .85f, size.height * .25f) }
                            drawPath(check, Tempo.lime, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round))
                        }
                    }
                    Column(Modifier.weight(1f).padding(start = 12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(habit.title, fontSize = Tempo.body, fontWeight = FontWeight.Medium, color = if (done) Tempo.muted else Tempo.ink)
                        Text(habit.detail, fontSize = Tempo.small, color = Tempo.muted)
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = { next?.let(toggle) }, enabled = next != null,
                modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp), shape = RoundedCornerShape(28.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Tempo.lime, contentColor = Tempo.ink)
            ) {
                Text(action, fontSize = Tempo.body, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                Canvas(Modifier.size(22.dp)) {
                    drawLine(Tempo.ink, Offset(size.width * .15f, size.height * .5f), Offset(size.width * .85f, size.height * .5f), 2.dp.toPx(), StrokeCap.Round)
                    val arrow = Path().apply { moveTo(size.width * .6f, size.height * .25f); lineTo(size.width * .85f, size.height * .5f); lineTo(size.width * .6f, size.height * .75f) }
                    drawPath(arrow, Tempo.ink, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round))
                }
            }
            Spacer(Modifier.height(16.dp))
            Text(if (completed.size == 3) "All three complete. Make room for tomorrow." else "Small steps count. You're building something.",
                Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite },
                fontSize = Tempo.small, color = Tempo.muted)
            Spacer(Modifier.height(24.dp))
        }
    }
}

// Adapted from the MCP's authored Android success-feedback recipe.
@Composable
private fun rememberTempoReducedMotion(): Boolean {
    val resolver = LocalContext.current.contentResolver
    var reduced by remember { mutableStateOf(!ValueAnimator.areAnimatorsEnabled()) }
    DisposableEffect(resolver) {
        val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) { reduced = !ValueAnimator.areAnimatorsEnabled() }
        }
        resolver.registerContentObserver(Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE), false, observer)
        reduced = !ValueAnimator.areAnimatorsEnabled()
        onDispose { resolver.unregisterContentObserver(observer) }
    }
    return reduced
}
