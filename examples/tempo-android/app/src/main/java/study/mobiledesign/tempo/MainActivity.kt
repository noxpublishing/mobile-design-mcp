package study.mobiledesign.tempo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class Habit(val title: String, val detail: String)
val studyHabits = listOf(
    Habit("Drink water", "1 glass · Start with something simple"),
    Habit("Read 10 pages", "10 min · Make a little space"),
    Habit("Take a walk", "15 min · Step outside")
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT)
        )
        val variant = intent.getStringExtra("variant") ?: "baseline"
        setContent {
            var completed by remember { mutableStateOf(setOf(0)) }
            val toggle: (Int) -> Unit = { index -> completed = if (index in completed) completed - index else completed + index }
            MaterialTheme {
                if (variant == "workflow") WorkflowScreen(completed, toggle)
                else BaselineScreen(completed, toggle)
            }
        }
    }
}

@Composable
fun BaselineScreen(completed: Set<Int>, toggle: (Int) -> Unit) {
    Scaffold(
        bottomBar = { Surface(tonalElevation = 3.dp) {
            Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(20.dp), horizontalArrangement = Arrangement.SpaceAround) {
                Text("Today", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                Text("Your routine", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } }
    ) { insets ->
        Column(Modifier.fillMaxSize().padding(insets).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
            Text("Tempo", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text("Tuesday, October 27", style = MaterialTheme.typography.bodyMedium)
            Text("Your daily rhythm", style = MaterialTheme.typography.headlineSmall)
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Today's progress", style = MaterialTheme.typography.titleMedium)
                    Text("${completed.size} of 3 habits complete", style = MaterialTheme.typography.bodyLarge)
                    LinearProgressIndicator(progress = { completed.size / 3f }, modifier = Modifier.fillMaxWidth())
                }
            }
            Text("Your habits", style = MaterialTheme.typography.titleLarge)
            studyHabits.forEachIndexed { index, habit ->
                OutlinedCard(Modifier.fillMaxWidth()) {
                    Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = index in completed, onCheckedChange = { toggle(index) })
                        Column(Modifier.weight(1f).padding(start = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(habit.title, style = MaterialTheme.typography.titleMedium)
                            Text(habit.detail, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
            val next = studyHabits.indices.firstOrNull { it !in completed }
            Button(onClick = { next?.let(toggle) }, enabled = next != null, modifier = Modifier.fillMaxWidth()) {
                Text(if (next == null) "All done for today" else "Complete next habit")
            }
        }
    }
}
