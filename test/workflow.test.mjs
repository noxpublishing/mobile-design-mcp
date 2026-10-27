import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installWorkflow } from '../scripts/install-workflow.mjs';
import { syncAgentContext } from '../scripts/sync-agent-context.mjs';

test('agent context preview and updates retain manual instructions and converge', async () => {
  const root = await mkdtemp(join(tmpdir(), 'design docs '));
  try {
    await mkdir(join(root, 'docs')); await writeFile(join(root, 'docs', 'context.md'), 'Accepted project facts.\n');
    await writeFile(join(root, 'AGENTS.md'), '# Existing\n\nKeep this human instruction.\n');
    const args = { project: root, context: 'docs/context.md' };
    const preview = await syncAgentContext(args); assert.equal(preview.mode, 'preview');
    await assert.rejects(stat(join(root, 'CLAUDE.md')), { code: 'ENOENT' });
    assert.equal(await readFile(join(root, 'AGENTS.md'), 'utf8'), '# Existing\n\nKeep this human instruction.\n');
    await syncAgentContext({ ...args, write: true });
    assert.ok((await readFile(join(root, 'AGENTS.md'), 'utf8')).startsWith('# Existing\n\nKeep this human instruction.\n'));
    assert.equal((await syncAgentContext({ ...args, write: true })).files.every(file => !file.changed), true);
    await writeFile(join(root, 'docs', 'new context.md'), 'New canonical facts.');
    await syncAgentContext({ project: root, context: 'docs/new context.md', write: true });
    const result = await readFile(join(root, 'AGENTS.md'), 'utf8');
    assert.ok(result.includes('docs/new context.md')); assert.equal(result.split('context:start').length, 2);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('context preflight rejects malformed wrappers and escaping sources without replacing manual text', async () => {
  const root = await mkdtemp(join(tmpdir(), 'design-context-')); const outside = await mkdtemp(join(tmpdir(), 'context-outside-'));
  try {
    await writeFile(join(root, 'context.md'), 'Facts'); await writeFile(join(root, 'AGENTS.md'), 'Keep me.');
    await writeFile(join(root, 'CLAUDE.md'), '<!-- mobile-design:context:start -->');
    await assert.rejects(syncAgentContext({ project: root, context: 'context.md', write: true }), /Malformed/);
    assert.equal(await readFile(join(root, 'AGENTS.md'), 'utf8'), 'Keep me.');
    await writeFile(join(outside, 'context.md'), 'Outside');
    await symlink(outside, join(root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(syncAgentContext({ project: root, context: 'escape/context.md', write: true }), /project-local/);
    await assert.rejects(syncAgentContext({ project: root, context: '../outside.md' }), /project-local/);
  } finally { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
});

test('portable installation creates real skills and client-specific agents without model or permission changes', async () => {
  const home = await realpath(await mkdtemp(join(tmpdir(), 'design install ')));
  try {
    const result = await installWorkflow({ home });
    assert.equal(result.results.filter(item => item.status === 'installed').length, 31);
    const skill = join(home, '.agents', 'skills', 'mobile-motion'); assert.equal((await stat(skill)).isDirectory(), true);
    assert.equal((await readFile(join(skill, 'SKILL.md'), 'utf8')).includes('](../../docs/'), false);
    assert.ok((await readFile(join(skill, 'assets', 'motion-contract.md'), 'utf8')).includes('Motion contract'));
    const codex = await readFile(join(home, '.codex', 'agents', 'mobile-ux-reviewer.toml'), 'utf8');
    assert.ok(codex.includes('developer_instructions = ')); assert.equal(/^model\s*=/m.test(codex), false);
    const claude = await readFile(join(home, '.claude', 'agents', 'mobile-ux-reviewer.md'), 'utf8');
    assert.ok(claude.includes('tools: Read, Glob, Grep'));
    await assert.rejects(stat(join(home, '.codex', 'config.toml')), { code: 'ENOENT' });
    await assert.rejects(stat(join(home, '.claude', 'settings.json')), { code: 'ENOENT' });
    await writeFile(join(skill, 'SKILL.md'), 'Personal edits.');
    const linkedSkill = join(home, '.agents', 'skills', 'mobile-figma');
    const personal = join(home, 'personal-reference'); await mkdir(personal);
    await symlink(personal, join(linkedSkill, 'personal'), process.platform === 'win32' ? 'junction' : 'dir');
    const missingClaudeAgent = join(home, '.claude', 'agents', 'mobile-ux-reviewer.md'); await rm(missingClaudeAgent);
    const next = await installWorkflow({ home });
    assert.equal(next.results.find(item => item.path === skill).status, 'skipped-modified');
    assert.equal(next.results.find(item => item.path === linkedSkill).status, 'skipped-modified');
    assert.equal(next.results.find(item => item.path === missingClaudeAgent).status, 'installed');
    assert.equal(await readFile(join(skill, 'SKILL.md'), 'utf8'), 'Personal edits.');
  } finally { await rm(home, { recursive: true, force: true }); }
});

test('project-scoped install preserves an unmanaged skill and validates scope', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'design-project-install-')));
  try {
    const existing = join(root, '.claude', 'skills', 'mobile-setup'); await mkdir(existing, { recursive: true });
    await writeFile(join(existing, 'SKILL.md'), 'Existing project instruction.');
    const result = await installWorkflow({ client: 'claude', scope: 'project', project: root });
    assert.equal(result.results.find(item => item.path === existing).status, 'skipped-existing');
    assert.equal(await readFile(join(existing, 'SKILL.md'), 'utf8'), 'Existing project instruction.');
    await assert.rejects(installWorkflow({ client: 'anything', home: root }), /Invalid/);
    await assert.rejects(installWorkflow({ scope: 'project', project: 'relative' }), /absolute/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('Windows CRLF profile checkouts generate working client definitions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'design-crlf-'));
  try {
    const checkout = join(root, 'source'); const home = join(root, 'home'); await mkdir(home);
    for (const directory of ['skills/demo', 'agents', 'docs', 'scripts', 'examples', 'src', 'test', 'LICENSES']) await mkdir(join(checkout, directory), { recursive: true });
    for (const file of ['package.json', 'tsconfig.json', 'README.md', 'LICENSE', 'NOTICE']) await writeFile(join(checkout, file), 'Fixture.\r\n');
    await writeFile(join(checkout, 'skills', 'demo', 'SKILL.md'), '---\r\nname: demo\r\ndescription: Demo skill\r\n---\r\nRead [guide](../../docs/guide.md).\r\n');
    await writeFile(join(checkout, 'docs', 'guide.md'), 'Guide.');
    await writeFile(join(checkout, 'agents', 'demo-reviewer.md'), '---\r\nname: demo-reviewer\r\ndescription: Review the fixture\r\n---\r\nInspect read-only.\r\n');
    await installWorkflow({ home, checkout });
    const codex = await readFile(join(home, '.codex', 'agents', 'demo-reviewer.toml'), 'utf8');
    const instructions = JSON.parse(codex.match(/^developer_instructions = (.+)$/m)[1]);
    assert.ok(instructions.includes('Inspect read-only.')); assert.ok(instructions.includes('docs/agents.md'));
    assert.ok((await readFile(join(home, '.claude', 'agents', 'demo-reviewer.md'), 'utf8')).includes('tools: Read, Glob, Grep'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
