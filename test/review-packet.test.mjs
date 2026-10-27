import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDesignReviewPacket } from '../dist/review-packet.js';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+kHfoAAAAASUVORK5CYII=','base64');
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'native-review-'));await writeFile(join(root,'screen.png'),png);
 await writeFile(join(root,'Theme.swift'),'enum Spacing { static let headingToBody = 12 }');
 const manifest={schema:'mobile-design-review-v1',revision:'build-a',scope:'local',task:'Find the next action',entryContext:'First visit to the screen',platform:'ios',device:{name:'Fixture',os:'fixture',textScale:1},direction:'Private design rationale',criteria:['Use the chosen hierarchy'],designSystemSources:['Theme.swift'],evidence:[{id:'screen',path:'screen.png',revision:'build-a',state:'initial',role:'implemented',kind:'screenshot'}]};
 const manifestPath=join(root,'review.json');await writeFile(manifestPath,JSON.stringify(manifest));return {root,manifest,manifestPath};
}
test('consistency snapshots carry canonical source hashes and never claim a review pass',async()=>{
 const f=await fixture();try{
  const result=await buildDesignReviewPacket({...f,outputDirectory:join(f.root,'.artifacts','packet'),mode:'consistency'});
  const packet=JSON.parse(await readFile(result.packetPath,'utf8'));
  assert.equal(result.status,'ready-for-review');assert.equal(packet.outcome,'not-reviewed');assert.equal(packet.revision,'build-a');
  assert.equal(packet.designSystem.length,1);assert.equal(packet.evidence[0].sha256.length,64);
  assert.deepEqual(await readFile(join(result.outputDirectory,packet.evidence[0].path)),png);
  await assert.rejects(buildDesignReviewPacket({...f,outputDirectory:result.outputDirectory,mode:'consistency'}),/exist/i);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('discoverability packet omits solution rationale, criteria, native sources and reference examples',async()=>{
 const f=await fixture();try{
  f.manifest.evidence.push({...f.manifest.evidence[0],id:'reference',role:'reference'});await writeFile(f.manifestPath,JSON.stringify(f.manifest));
  const result=await buildDesignReviewPacket({...f,outputDirectory:join(f.root,'packet'),mode:'discoverability'});
  const packet=JSON.parse(await readFile(result.packetPath,'utf8'));
  assert.equal(packet.direction,undefined);assert.equal(packet.criteria,undefined);assert.equal(packet.designSystem,undefined);
  assert.equal(packet.evidence.length,1);assert.equal(packet.evidence[0].role,'implemented');
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('stale revisions, modified bytes and project path escapes cannot create passing evidence',async()=>{
 const f=await fixture();const outside=await mkdtemp(join(tmpdir(),'review-outside-'));try{
  const run=()=>buildDesignReviewPacket({...f,outputDirectory:join(f.root,'packet'),mode:'consistency'});
  f.manifest.evidence[0].revision='old';await writeFile(f.manifestPath,JSON.stringify(f.manifest));await assert.rejects(run(),/Stale/);
  f.manifest.evidence[0].revision='build-a';f.manifest.evidence[0].sha256='0'.repeat(64);
  await writeFile(f.manifestPath,JSON.stringify(f.manifest));await assert.rejects(run(),/bytes changed/);
  delete f.manifest.evidence[0].sha256;await writeFile(join(outside,'screen.png'),png);
  await symlink(outside,join(f.root,'escape'),process.platform==='win32'?'junction':'dir');f.manifest.evidence[0].path='escape/screen.png';
  await writeFile(f.manifestPath,JSON.stringify(f.manifest));await assert.rejects(run(),/inside the native project/);
 }finally{await rm(f.root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
});
test('missing runtime evidence is inconclusive, not a performance pass',async()=>{
 const f=await fixture();try{
  const result=await buildDesignReviewPacket({...f,outputDirectory:join(f.root,'packet'),mode:'performance'});
  assert.equal(result.status,'inconclusive');assert.ok(result.gaps.some(g=>g.includes('profile')));
 }finally{await rm(f.root,{recursive:true,force:true});}
});
