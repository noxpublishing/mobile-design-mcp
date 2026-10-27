import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const project = dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({ options: { serial: { type: 'string' }, output: { type: 'string' } } });
const output = values.output ? resolve(values.output) : resolve(project, '../../docs/assets');
const prefix = values.serial ? ['-s', values.serial] : [];
const adb = (...args) => execFileSync('adb', [...prefix, ...args], { timeout: 30000, maxBuffer: 12 * 1024 * 1024 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const app = 'study.mobiledesign.tempo';
const apk = join(project, 'app/build/outputs/apk/debug/app-debug.apk');
await mkdir(output, { recursive: true });
const apkBytes = await readFile(apk);
adb('install', '-r', apk);
function dump() {
  adb('shell', 'uiautomator', 'dump', '/sdcard/tempo-study.xml');
  return adb('exec-out', 'cat', '/sdcard/tempo-study.xml').toString();
}
function tapText(xml, text) {
  const nodes = xml.match(/<node\b[^>]*>/g) ?? [];
  const node = nodes.find(value => value.includes(`text="${text}"`));
  const bounds = node?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!bounds) throw new Error('Visible target not found: ' + text);
  adb('shell', 'input', 'tap', String(Math.round((+bounds[1] + +bounds[3]) / 2)), String(Math.round((+bounds[2] + +bounds[4]) / 2)));
}
function tapHabitCheckbox(xml, index) {
  const nodes = (xml.match(/<node\b[^>]*>/g) ?? []).filter(value => value.includes('checkable="true"'));
  const bounds = nodes[index]?.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (!bounds) throw new Error('Habit checkbox not found: ' + index);
  adb('shell', 'input', 'tap', String(Math.round((+bounds[1] + +bounds[3]) / 2)), String(Math.round((+bounds[2] + +bounds[4]) / 2)));
}
async function capture(name) {
  const bytes = adb('exec-out', 'screencap', '-p');
  await writeFile(join(output, name), bytes);
  return { path: name, sha256: sha(bytes) };
}
const runs = [];
for (const variant of ['baseline', 'workflow']) {
  adb('shell', 'am', 'force-stop', app);
  adb('shell', 'am', 'start', '-W', '-n', app + '/.MainActivity', '--es', 'variant', variant);
  const initial = dump();
  if (!initial.includes(variant === 'baseline' ? '1 of 3 habits complete' : '01 / 03')) throw new Error('Initial state did not match.');
  const screenshot = await capture('tempo-' + variant + '.png');
  tapText(initial, variant === 'baseline' ? 'Complete next habit' : 'Complete reading');
  const completed = dump();
  const completedExpected = variant === 'baseline' ? '2 of 3 habits complete' : '02 / 03';
  if (!completed.includes(completedExpected)) throw new Error('Completion did not update the visible progress.');
  const completedScreenshot = variant === 'workflow' ? await capture('tempo-workflow-completed.png') : null;
  tapHabitCheckbox(completed, 1);
  const undone = dump();
  if (!undone.includes(variant === 'baseline' ? '1 of 3 habits complete' : '01 / 03')) throw new Error('Undo did not restore progress.');
  runs.push({ variant, screenshot, completedScreenshot, assertions: { initialState: true, completeReading: true, undoReading: true } });
}
const evidence = {
  schema: 'tempo-study-evidence-v1', capturedAt: new Date().toISOString(), package: app,
  apkSha256: sha(apkBytes), androidRelease: adb('shell', 'getprop', 'ro.build.version.release').toString().trim(),
  apiLevel: adb('shell', 'getprop', 'ro.build.version.sdk').toString().trim(),
  display: adb('shell', 'wm', 'size').toString().trim(), density: adb('shell', 'wm', 'density').toString().trim(),
  fontScale: adb('shell', 'settings', 'get', 'system', 'font_scale').toString().trim(),
  animationScale: adb('shell', 'settings', 'get', 'global', 'animator_duration_scale').toString().trim(),
  buildType: 'debug', capture: 'Unedited adb screencap PNGs after UIAutomator idle; status-bar demo clock may be configured separately.',
  comparison: 'Illustrative single-author redesign of the same one-screen task; not a randomized or blinded benchmark.',
  performance: 'unmeasured', realUserStudy: 'not-performed', talkBackTest: 'not-performed', runs
};
await writeFile(join(output, 'tempo-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
