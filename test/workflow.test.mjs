import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
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
    assert.equal(result.results.filter(item => item.status === 'installed').length, 35);
    assert.equal(result.status, 'completed');
    const receipt=JSON.parse(await readFile(result.receiptPath,'utf8'));
    assert.equal(receipt.instructionContract,2);assert.ok(['clean','modified','unknown'].includes(receipt.source.state));
    assert.match(receipt.source.revision,/^[a-f0-9]{40}$/);
    for(const name of ['mobile-expo','mobile-quality']) {
      assert.ok((await readFile(join(home,'.agents','skills',name,'agents','openai.yaml'),'utf8')).includes('$'+name));
    }
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
    assert.equal(next.status,'partial');
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

test('an unmanaged receipt is preserved before any workflow replacement',async()=>{
 const home=await realpath(await mkdtemp(join(tmpdir(),'design-receipt-')));
 try{
  const directory=join(home,'.mobile-design-mcp');await mkdir(directory);
  const path=join(directory,'install-receipt.json');await writeFile(path,'Personal record.');
  await assert.rejects(installWorkflow({home}),/receipt.*preserved/);
  assert.equal(await readFile(path,'utf8'),'Personal record.');
  await assert.rejects(stat(join(directory,'workflow')),{code:'ENOENT'});
 }finally{await rm(home,{recursive:true,force:true});}
});

test('project installation refuses a client directory escaping its selected scope', async () => {
  const project = await realpath(await mkdtemp(join(tmpdir(), 'design-scope-')));
  const outside = await realpath(await mkdtemp(join(tmpdir(), 'design-personal-')));
  try {
    await symlink(outside, join(project, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(installWorkflow({ client: 'codex', scope: 'project', project }), /outside the selected scope/);
    assert.deepEqual(await readdir(outside), []);
    await assert.rejects(stat(join(project, '.mobile-design-mcp')), { code: 'ENOENT' });
  } finally {
    await rm(project, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true });
  }
});

test('Windows CRLF profile checkouts generate working client definitions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'design-crlf-'));
  try {
    const checkout = join(root, 'source'); const home = join(root, 'home'); await mkdir(home);
    for (const directory of ['skills/demo', 'agents', 'docs', 'scripts', 'examples', 'src', 'test', 'LICENSES']) await mkdir(join(checkout, directory), { recursive: true });
    for (const file of ['package.json', 'tsconfig.json', 'README.md', 'LICENSE', 'NOTICE']) await writeFile(join(checkout, file), 'Fixture.\r\n');
    await writeFile(join(checkout,'package.json'),JSON.stringify({name:'fixture',version:'1.0.0'}));
    await writeFile(join(checkout, 'skills', 'demo', 'SKILL.md'), '---\r\nname: demo\r\ndescription: Demo skill\r\n---\r\nRead [guide](../../docs/guide.md).\r\n');
    await writeFile(join(checkout, 'docs', 'guide.md'), 'Guide.');
    await mkdir(join(checkout, 'examples', 'demo', 'build'), { recursive: true });
    await writeFile(join(checkout, 'examples', 'demo', 'build', 'private.apk'), 'Generated build output');
    await writeFile(join(checkout, 'examples', 'demo', 'local.properties'), 'Machine-specific SDK path');
    await writeFile(join(checkout, 'agents', 'demo-reviewer.md'), '---\r\nname: demo-reviewer\r\ndescription: Review the fixture\r\n---\r\nInspect read-only.\r\n');
    const first=await installWorkflow({ home, checkout });
    assert.equal(JSON.parse(await readFile(first.receiptPath,'utf8')).source.revision,null);
    await assert.rejects(stat(join(home, '.mobile-design-mcp', 'workflow', 'examples', 'demo', 'build')), { code: 'ENOENT' });
    await assert.rejects(stat(join(home, '.mobile-design-mcp', 'workflow', 'examples', 'demo', 'local.properties')), { code: 'ENOENT' });
    const codex = await readFile(join(home, '.codex', 'agents', 'demo-reviewer.toml'), 'utf8');
    const instructions = JSON.parse(codex.match(/^developer_instructions = (.+)$/m)[1]);
    assert.ok(instructions.includes('Inspect read-only.')); assert.ok(instructions.includes('docs/agents.md'));
    assert.ok((await readFile(join(home, '.claude', 'agents', 'demo-reviewer.md'), 'utf8')).includes('tools: Read, Glob, Grep'));
    const same=await installWorkflow({home,checkout});assert.equal(same.results.every(item=>item.status==='unchanged'),true);
    await writeFile(join(checkout,'README.md'),'Updated contract.');
    const changed=await installWorkflow({home,checkout});assert.equal(changed.recovery.resources.length,1);
    assert.equal(await readFile(join(changed.recovery.resources[0].backup,'README.md'),'utf8'),'Fixture.\r\n');
    assert.equal(await readFile(join(home,'.mobile-design-mcp','workflow','README.md'),'utf8'),'Updated contract.');
    await writeFile(join(home,'.codex','agents','demo-reviewer.toml'),'Personal reviewer.');
    const partial=await installWorkflow({home,checkout});assert.equal(partial.status,'partial');
    assert.equal(await readFile(join(home,'.codex','agents','demo-reviewer.toml'),'utf8'),'Personal reviewer.');
    await writeFile(join(checkout,'agents','demo-reviewer.md'),'Malformed profile.');
    await assert.rejects(installWorkflow({home,checkout}),/Invalid portable agent profile/);
    const failed=JSON.parse(await readFile(join(home,'.mobile-design-mcp','install-receipt.json'),'utf8'));
    assert.equal(failed.status,'failed');assert.equal(failed.recovery.resources.length,1);
    assert.ok((await readFile(join(failed.recovery.resources[0].backup,'agents','demo-reviewer.md'),'utf8')).includes('Inspect read-only.'));
    const remaining=await readdir(join(home,'.mobile-design-mcp'));
    assert.equal(remaining.some(name=>name.startsWith('install-')&&name!=='install-receipt.json'),false);
    assert.equal(await readFile(join(home,'.codex','agents','demo-reviewer.toml'),'utf8'),'Personal reviewer.');
    await rm(join(checkout,'skills','demo'),{recursive:true});
    await writeFile(join(checkout,'agents','demo-reviewer.md'),'---\nname: demo-reviewer\ndescription: Review the fixture\n---\nInspect read-only.\n');
    const retired=await installWorkflow({home,checkout});
    assert.equal(retired.status,'partial');
    assert.equal(retired.results.filter(item=>item.status==='skipped-retired').length,2);
    assert.ok(await stat(join(home,'.agents','skills','demo','SKILL.md')));
  } finally { await rm(root, { recursive: true, force: true }); }
});
