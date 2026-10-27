import { cp, lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const CHECKOUT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const marker = '.mobile-design-managed.json';
const portable = path => path.split(sep).join('/');
async function statOrNull(path) { try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
async function filesAt(root, prefix = '') {
  const files = [];
  for (const entry of (await readdir(join(root, prefix), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Unexpected symlink in install source: ' + path);
    if (entry.isDirectory()) files.push(...await filesAt(root, path)); else if (entry.isFile()) files.push(path);
  }
  return files;
}
async function digests(root) {
  const result = {};
  for (const file of await filesAt(root)) if (file !== marker) result[portable(file)] = hash(await readFile(join(root, file)));
  return result;
}
async function installOwnedDirectory(target, stage) {
  const stat = await statOrNull(target);
  if (stat) {
    if (!stat.isDirectory() || stat.isSymbolicLink()) return 'skipped-existing';
    let previous;
    try { previous = JSON.parse(await readFile(join(target, marker), 'utf8')); } catch { return 'skipped-existing'; }
    let current;
    try { current = await digests(target); } catch { return 'skipped-modified'; }
    if (previous.owner !== 'mobile-design-mcp' || JSON.stringify(current) !== JSON.stringify(previous.files)) return 'skipped-modified';
  }
  const state = { owner: 'mobile-design-mcp', files: await digests(stage) };
  await writeFile(join(stage, marker), JSON.stringify(state, null, 2) + '\n');
  await mkdir(dirname(target), { recursive: true });
  if (stat) {
    const backup = target + '.previous-' + randomUUID(); await rename(target, backup);
    try { await rename(stage, target); } catch (error) { await rename(backup, target); throw error; }
    await rm(backup, { recursive: true });
  } else await rename(stage, target);
  return stat ? 'updated' : 'installed';
}

export async function installWorkflow({ client = 'both', scope = 'user', project, home = homedir(), checkout = CHECKOUT }) {
  if (!['codex', 'claude', 'both'].includes(client) || !['user', 'project'].includes(scope)) throw new Error('Invalid client or scope.');
  if (scope === 'project' && (!project || !isAbsolute(project))) throw new Error('Project scope requires an absolute --project path.');
  const root = await realpath(scope === 'project' ? project : home);
  const source = await realpath(checkout);
  const toolkit = join(root, '.mobile-design-mcp', 'workflow');
  if (source === toolkit || relative(source, toolkit).split(sep)[0] !== '..' && !isAbsolute(relative(source, toolkit))) throw new Error('Install outside the toolkit source checkout.');
  const workspace = join(root, '.mobile-design-mcp', 'install-' + randomUUID());
  await mkdir(workspace, { recursive: true });
  const results = [];
  try {
    const bundle = join(workspace, 'bundle'); await mkdir(bundle);
    // Explicit allowlist: no .git, credentials, captures, runtime state or dependencies.
    const includeResource = path => !relative(source, path).split(sep).some(part =>
      ['.git', '.gradle', 'build', 'node_modules', '.artifacts', 'local.properties'].includes(part)
      || part.endsWith('.apk') || part === '.env' || part.startsWith('.env.'));
    for (const name of ['skills', 'agents', 'docs', 'scripts', 'examples', 'src', 'test', 'package.json', 'tsconfig.json', 'README.md', 'LICENSE', 'LICENSES', 'NOTICE']) await cp(join(source, name), join(bundle, name), { recursive: true, dereference: false, filter: includeResource });
    const bundleStatus = await installOwnedDirectory(toolkit, bundle);
    results.push({ path: toolkit, status: bundleStatus });
    if (bundleStatus.startsWith('skipped')) throw new Error('Existing workflow bundle is unmanaged or modified; preserved. Choose another scope or review it before updating.');
    const names = (await readdir(join(source, 'skills'), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    for (const selected of client === 'both' ? ['codex', 'claude'] : [client]) {
      const skills = join(root, selected === 'codex' ? '.agents' : '.claude', 'skills');
      for (const name of names) {
        const stage = join(workspace, selected + '-' + name); await cp(join(toolkit, 'skills', name), stage, { recursive: true });
        for (const file of await filesAt(stage)) if (file.endsWith('.md')) {
          const path = join(stage, file); let content = await readFile(path, 'utf8');
          // Skill folders are real copies on every OS. Rebase toolkit links; local assets stay local.
          content = content.replace(/\]\(\.\.\/\.\.\/([^\s)]+)\)/g, (_, tail) => `](<${portable(toolkit)}/${tail}>)`);
          content = content.replace('license: See ../../LICENSE', `license: See ${portable(toolkit)}/LICENSE`);
          if (file === 'SKILL.md') content += `\nToolkit root: ${portable(toolkit)}. Resolve toolkit-relative agent/profile paths there; app-project paths remain relative to the app.\n`;
          await writeFile(path, content);
        }
        results.push({ path: join(skills, name), status: await installOwnedDirectory(join(skills, name), stage) });
      }
      for (const file of (await readdir(join(toolkit, 'agents'))).filter(file => file.endsWith('.md')).sort()) {
        const raw = (await readFile(join(toolkit, 'agents', file), 'utf8')).replace(/\r\n/g, '\n');
        const match = raw.match(/^---\nname: ([^\n]+)\ndescription: ([^\n]+)\n---\n([\s\S]*)$/);
        if (!match) throw new Error('Invalid portable agent profile: ' + file);
        const [, name, description, body] = match;
        const instructions = `Toolkit root: ${portable(toolkit)}. Read ${portable(toolkit)}/docs/agents.md. Resolve toolkit-relative paths against that root, and use only the supplied review packet for app evidence.\n${body}`;
        const directory = join(root, selected === 'codex' ? '.codex' : '.claude', 'agents'); await mkdir(directory, { recursive: true });
        const target = join(directory, name + (selected === 'codex' ? '.toml' : '.md'));
        const content = selected === 'codex'
          ? `# mobile-design-mcp managed agent; remove this file before reinstalling to update it.\nname = ${JSON.stringify(name)}\ndescription = ${JSON.stringify(description)}\ndeveloper_instructions = ${JSON.stringify(instructions)}\n`
          : `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\ntools: Read, Glob, Grep\n---\n${instructions}`;
        // Agent files may have personal changes. Never replace an existing definition automatically.
        try { await writeFile(target, content, { flag: 'wx' }); results.push({ path: target, status: 'installed' }); }
        catch (error) { if (error.code !== 'EEXIST') throw error; results.push({ path: target, status: 'skipped-existing' }); }
      }
    }
    return { client, scope, toolkit, results, note: 'No MCP connections, credentials, model settings or permission settings were changed. Restart the client and verify discovery.' };
  } finally { await rm(workspace, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { client: { type: 'string', default: 'both' }, scope: { type: 'string', default: 'user' }, project: { type: 'string' } } });
    console.log(JSON.stringify(await installWorkflow(values), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
