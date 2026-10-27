import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const START = '<!-- mobile-design:context:start -->';
const END = '<!-- mobile-design:context:end -->';
const inside = (root, path) => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel); };
async function optionalStat(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function syncAgentContext({ project, context = 'docs/design/agent-context.md', write = false }) {
  if (!isAbsolute(project)) throw new Error('project must be absolute.');
  const root = await realpath(project);
  if (isAbsolute(context) || !inside(root, resolve(root, context))) throw new Error('context must be project-local.');
  const source = await realpath(resolve(root, context));
  if (!inside(root, source) || !(await lstat(source)).isFile()) throw new Error('context must be a project-local file.');
  if (!(await readFile(source, 'utf8')).trim()) throw new Error('Write a nonempty canonical context first.');
  const link = relative(root, source).split(sep).join('/');
  // A code span is used instead of a Markdown URL so spaces and parentheses are unambiguous.
  if (/[`\r\n]/.test(link)) throw new Error('Unsupported context path characters.');
  const block = `${START}\n## Mobile design context\n\nRead the project-local file \`${link}\` before mobile design work. It names the accepted scope, authoritative native sources, verification commands and current evidence gaps. Preserve existing project instructions and the user's current request.\n${END}`;
  const plan = [];
  for (const name of ['AGENTS.md', 'CLAUDE.md']) {
    const path = join(root, name); const stat = await optionalStat(path);
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) throw new Error(`Refusing non-regular instruction target: ${name}`);
    const before = stat ? await readFile(path, 'utf8') : '';
    const starts = before.split(START).length - 1; const ends = before.split(END).length - 1;
    if (starts !== ends || starts > 1 || (starts && before.indexOf(START) > before.indexOf(END))) throw new Error(`Malformed managed context block: ${name}`);
    const content = starts ? before.slice(0, before.indexOf(START)) + block + before.slice(before.indexOf(END) + END.length)
      : before + (before && !before.endsWith('\n') ? '\n' : '') + (before ? '\n' : '# Project instructions\n\n') + block + '\n';
    plan.push({ path, before, content, changed: content !== before, existed: !!stat });
  }
  if (write) for (const item of plan.filter(item => item.changed)) {
    // Recheck after preflight so an intervening edit is never silently replaced.
    const stat = await optionalStat(item.path);
    if (stat && (!stat.isFile() || stat.isSymbolicLink())) throw new Error('Instruction target changed during update.');
    if (!!stat !== item.existed || (stat && await readFile(item.path, 'utf8') !== item.before)) throw new Error('Instruction file changed during update.');
    await writeFile(item.path, item.content, item.existed ? {} : { flag: 'wx' });
  }
  return { mode: write ? 'written' : 'preview', context: link, block, files: plan.map(({ path, changed }) => ({ path, changed })) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { project: { type: 'string' }, context: { type: 'string' }, write: { type: 'boolean', default: false } } });
    if (!values.project) throw new Error('Usage: node sync-agent-context.mjs --project ABSOLUTE_PATH [--context RELATIVE_PATH] [--write]');
    console.log(JSON.stringify(await syncAgentContext(values), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
