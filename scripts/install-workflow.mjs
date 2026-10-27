import { cp, lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';

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
async function installOwnedDirectory(target, stage, recovery) {
  const stat = await statOrNull(target);
  let current;
  if (stat) {
    if (!stat.isDirectory() || stat.isSymbolicLink()) return 'skipped-existing';
    let previous;
    try { previous = JSON.parse(await readFile(join(target, marker), 'utf8')); } catch { return 'skipped-existing'; }
    try { current = await digests(target); } catch { return 'skipped-modified'; }
    if (previous.owner !== 'mobile-design-mcp' || JSON.stringify(current) !== JSON.stringify(previous.files)) return 'skipped-modified';
  }
  const state = { owner: 'mobile-design-mcp', files: await digests(stage) };
  if (stat && JSON.stringify(current) === JSON.stringify(state.files)) return 'unchanged';
  await writeFile(join(stage, marker), JSON.stringify(state, null, 2) + '\n');
  await mkdir(dirname(target), { recursive: true });
  if (stat) {
    const backup = join(recovery.directory, String(recovery.resources.length));
    await mkdir(dirname(backup), { recursive: true }); await rename(target, backup);
    try { await rename(stage, target); } catch (error) { await rename(backup, target); throw error; }
    recovery.resources.push({ path: target, backup, previousFiles: current, installedFiles: state.files });
  } else await rename(stage, target);
  return stat ? 'updated' : 'installed';
}

export async function installWorkflow({ client = 'both', scope = 'user', project, home = homedir(), checkout = CHECKOUT }) {
  if (!['codex', 'claude', 'both'].includes(client) || !['user', 'project'].includes(scope)) throw new Error('Invalid client or scope.');
  if (scope === 'project' && (!project || !isAbsolute(project))) throw new Error('Project scope requires an absolute --project path.');
  const root = await realpath(scope === 'project' ? project : home);
  const source = await realpath(checkout);
  const selectedClients = client === 'both' ? ['codex', 'claude'] : [client];
  const destinations = [join(root, '.mobile-design-mcp'), ...selectedClients.flatMap(selected => [
    join(root, selected === 'codex' ? '.agents' : '.claude', 'skills'),
    join(root, selected === 'codex' ? '.codex' : '.claude', 'agents'),
  ])];
  for (const directory of destinations) {
    let existing = directory;
    while (!await statOrNull(existing)) existing = dirname(existing);
    const resolved = await realpath(existing);
    const rel = relative(root, resolved);
    if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) throw new Error('Install destination resolves outside the selected scope; preserved.');
    if (!(await lstat(resolved)).isDirectory()) throw new Error('Install destination ancestor is not a directory; preserved.');
  }
  const toolkit = join(root, '.mobile-design-mcp', 'workflow');
  if (source === toolkit || relative(source, toolkit).split(sep)[0] !== '..' && !isAbsolute(relative(source, toolkit))) throw new Error('Install outside the toolkit source checkout.');
  const attempt = randomUUID();
  const receiptPath = join(root, '.mobile-design-mcp', 'install-receipt.json');
  const existingReceipt = await statOrNull(receiptPath);
  let previousReceipt;
  if (existingReceipt) {
    if (!existingReceipt.isFile() || existingReceipt.isSymbolicLink()) throw new Error('Existing install receipt is not a managed regular file; preserved.');
    let previous;
    try { previous = JSON.parse(await readFile(receiptPath, 'utf8')); } catch { throw new Error('Existing install receipt is unreadable; preserved.'); }
    if (previous.owner !== 'mobile-design-mcp' || previous.schema !== 'mobile-design-install-v1') throw new Error('Existing install receipt is unmanaged; preserved.');
    previousReceipt = previous;
  }
  const pkg = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
  const identity = { packageVersion: pkg.version ?? null, revision: null, state: 'unknown' };
  try {
    const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8', timeout: 3000, maxBuffer: 1024 * 1024, stdio: ['ignore','pipe','ignore'] }).trim();
    if (await realpath(git('rev-parse', '--show-toplevel')) === source) {
      identity.revision = git('rev-parse', 'HEAD');
      identity.state = git('status', '--porcelain') ? 'modified' : 'clean';
    }
  } catch { /* Archive sources have no Git identity. */ }
  const workspace = join(root, '.mobile-design-mcp', 'install-' + attempt);
  const recovery = { directory: join(root, '.mobile-design-mcp', 'recovery', attempt), resources: [] };
  await mkdir(workspace, { recursive: true });
  const results = [];
  const rememberedPaths = new Set([
    ...(Array.isArray(previousReceipt?.managedPaths) ? previousReceipt.managedPaths : []),
    ...(Array.isArray(previousReceipt?.results) ? previousReceipt.results.map(item => item?.path) : []),
  ].filter(path => typeof path === 'string'));
  const receipt = { schema: 'mobile-design-install-v1', owner: 'mobile-design-mcp', attempt,
    instructionContract: 2, source: identity, client, scope, status: 'in-progress', results, recovery,
    runtimeConnection: 'not-inspected; verify the actual connected capability report after restart' };
  const saveReceipt = async () => {
    receipt.managedPaths = [...new Set([...rememberedPaths, ...results.map(item => item.path)])].sort();
    const pending = receiptPath + '.pending-' + attempt;
    try { await writeFile(pending, JSON.stringify(receipt, null, 2) + '\n'); await rename(pending, receiptPath); }
    finally { await rm(pending, { force: true }); }
  };
  try {
    const bundle = join(workspace, 'bundle'); await mkdir(bundle);
    // Explicit allowlist: no .git, credentials, captures, runtime state or dependencies.
    const includeResource = path => {
      const selected = portable(relative(source, path));
      return !/^examples\/expo-study\/(?:ios|android)(?:\/|$)/.test(selected)
        && !selected.split('/').some(part =>
          ['.git', '.gradle', '.expo', 'build', 'DerivedData', 'xcuserdata', 'node_modules', '.artifacts', 'local.properties'].includes(part)
          || /\.(?:apk|ipa|xcarchive|xcuserstate)$/.test(part) || part === '.env' || part.startsWith('.env.'));
    };
    for (const name of ['skills', 'agents', 'docs', 'scripts', 'examples', 'src', 'test', 'package.json', 'tsconfig.json', 'README.md', 'LICENSE', 'LICENSES', 'NOTICE']) await cp(join(source, name), join(bundle, name), { recursive: true, dereference: false, filter: includeResource });
    const bundleStatus = await installOwnedDirectory(toolkit, bundle, recovery);
    results.push({ path: toolkit, status: bundleStatus });
    if (bundleStatus.startsWith('skipped')) throw new Error('Existing workflow bundle is unmanaged or modified; preserved. Choose another scope or review it before updating.');
    const names = (await readdir(join(source, 'skills'), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    for (const selected of selectedClients) {
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
        results.push({ path: join(skills, name), status: await installOwnedDirectory(join(skills, name), stage, recovery) });
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
        catch (error) {
          if (error.code !== 'EEXIST') throw error;
          const info = await statOrNull(target);
          const matches = info?.isFile() && !info.isSymbolicLink() && await readFile(target, 'utf8') === content;
          results.push({ path: target, status: matches ? 'unchanged' : 'skipped-existing', ...(matches ? {} : { action: 'Preserved definition differs; review it against the current generated profile before claiming alignment.' }) });
        }
      }
    }
    const currentPaths = new Set(results.map(item => item.path));
    const clientRoots = selectedClients.flatMap(selected => [
      join(root, selected === 'codex' ? '.agents' : '.claude', 'skills'),
      join(root, selected === 'codex' ? '.codex' : '.claude', 'agents'),
    ]);
    for (const path of rememberedPaths) {
      if (currentPaths.has(path) || !clientRoots.some(directory => dirname(path) === directory)) continue;
      if (await statOrNull(path)) results.push({ path, status: 'skipped-retired',
        action: 'Preserved resource is absent from this edition. Review and remove it explicitly before claiming scope alignment.' });
    }
    receipt.status = results.some(item => item.status.startsWith('skipped')) ? 'partial' : 'completed';
    await saveReceipt();
    return { client, scope, toolkit, results, receiptPath, status: receipt.status, recovery,
      note: 'No MCP connections, credentials, model settings or permission settings were changed. Preserved conflicts need review; restart the client and verify actual connected capabilities.' };
  } catch (error) {
    receipt.status = 'failed'; receipt.error = error.message;
    try { await saveReceipt(); } catch (receiptError) { throw new AggregateError([error, receiptError], 'Installation failed and its receipt could not be saved; inspect the managed paths and recovery directory.'); }
    throw error;
  } finally { await rm(workspace, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { client: { type: 'string', default: 'both' }, scope: { type: 'string', default: 'user' }, project: { type: 'string' } } });
    console.log(JSON.stringify(await installWorkflow(values), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
