import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
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
test('V2 preserves explicit Expo target and snapshots real TSX without evaluating it',async()=>{
 const f=await fixture();try{
  const source='throw new Error("Snapshots must never run"); export const Screen = () => <View />;';
  await writeFile(join(f.root,'Screen.tsx'),source);f.manifest.designSystemSources=['Screen.tsx'];
  await writeFile(f.manifestPath,JSON.stringify(f.manifest));
  await assert.rejects(buildDesignReviewPacket({...f,outputDirectory:join(f.root,'old-packet'),mode:'consistency'}),/Unsupported design-system/);
  const {platform,...base}=f.manifest;
  const target={platform,implementationStack:'expo-react-native'};
  const manifest={...base,schema:'mobile-design-review-v2',target};
  await writeFile(f.manifestPath,JSON.stringify(manifest));
  const result=await buildDesignReviewPacket({...f,outputDirectory:join(f.root,'packet'),mode:'consistency'});
  const packet=JSON.parse(await readFile(result.packetPath,'utf8'));
  assert.equal(packet.schema,'mobile-design-packet-v2');assert.deepEqual(packet.target,target);
  assert.equal('platform' in packet,false);assert.equal(packet.outcome,'not-reviewed');
  assert.equal(await readFile(join(result.outputDirectory,packet.designSystem[0].path),'utf8'),source);
  assert.equal(packet.designSystem[0].sha256.length,64);
  manifest.evidence.push({...manifest.evidence[0],id:'reference',role:'reference'});
  await writeFile(f.manifestPath,JSON.stringify(manifest));
  const blind=await buildDesignReviewPacket({...f,outputDirectory:join(f.root,'blind'),mode:'discoverability'});
  const withheld=JSON.parse(await readFile(blind.packetPath,'utf8'));
  assert.equal(withheld.direction,undefined);assert.equal(withheld.criteria,undefined);assert.equal(withheld.designSystem,undefined);
  assert.equal(withheld.evidence.length,1);assert.deepEqual(withheld.target,target);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
test('V2 rejects invalid versions, pairs and native TSX while retaining source bounds',async()=>{
 const f=await fixture();try{
  await writeFile(join(f.root,'Screen.tsx'),'export const color = "blue";');
  const {platform,...base}=f.manifest;
  const valid={...base,schema:'mobile-design-review-v2',target:{platform,implementationStack:'expo-react-native'},designSystemSources:['Screen.tsx']};
  const run=()=>buildDesignReviewPacket({...f,outputDirectory:join(f.root,'packet'),mode:'consistency'});
  for(const manifest of [
   {...valid,schema:'mobile-design-review-v3'},
   {...valid,target:{platform:'android',implementationStack:'swiftui'}},
   {...valid,target:{platform:'ios',implementationStack:'swiftui'}},
   {...valid,platform:'ios'},
  ]){
   await writeFile(f.manifestPath,JSON.stringify(manifest));await assert.rejects(run());
   await assert.rejects(stat(join(f.root,'packet')),/ENOENT/);
  }
  await writeFile(f.manifestPath,JSON.stringify(valid));await writeFile(join(f.root,'Screen.tsx'),'x'.repeat(128*1024+1));
  await assert.rejects(run(),/128 KiB/);await assert.rejects(stat(join(f.root,'packet')),/ENOENT/);
 }finally{await rm(f.root,{recursive:true,force:true});}
});
