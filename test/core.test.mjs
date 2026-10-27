import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMobileServer } from '../dist/server.js';
import { Store } from '../dist/store.js';
import { importRecording, analyzeTransition } from '../dist/media.js';
const exec=promisify(execFile);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+kHfoAAAAASUVORK5CYII=','base64');
const app=(id,platform='ios')=>({id,name:id,platforms:[platform],description:'Editorial magazine',tags:['onboarding'],source:{provider:'local',url:'https://example.com/'+id,observedAt:new Date().toISOString()},awards:[]});
test('FTS updates are atomic and native-platform filters survive reopening',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mobile-store-'));let store=new Store(root);
 try{
  store.upsertApps([app('ios-app'),app('android-app','android')]);
  assert.deepEqual(store.searchApps({query:'magazines',platform:'android'}).map(a=>a.id),['android-app']);
  store.upsertApps([{...app('ios-app'),description:'Changed topic',tags:[]}]);
  assert.equal(store.searchApps({query:'magazines',platform:'ios'}).length,0);
  assert.equal(store.searchApps({awardsOnly:true}).length,0);
  store.close();store=new Store(root);assert.equal(store.getApp('ios-app').description,'Changed topic');
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('local capture import verifies media, deduplicates and rejects platform confusion',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mobile-import-'));const store=new Store(join(root,'data'));
 try{
  const path=join(root,'capture.png');await writeFile(path,png);store.upsertApps([app('reference')]);
  const first=await importRecording(store,{path,title:'Test screen',platform:'ios',appId:'reference'});
  assert.equal(first.duplicate,false);assert.deepEqual(await readFile(first.recording.storedPath),png);
  const repeated=await importRecording(store,{path,title:'Test screen',platform:'ios',appId:'reference'});assert.equal(repeated.duplicate,true);
  const second=await importRecording(store,{path,title:'Same content',platform:'ios',appVersion:'2'});
  assert.equal(second.duplicate,false);assert.notEqual(second.recording.id,first.recording.id);
  assert.equal(second.recording.sha256,first.recording.sha256);assert.equal(second.recording.appVersion,'2');
  await assert.rejects(importRecording(store,{path,title:'Wrong platform',platform:'android',appId:'reference'}),/platform/);
  await assert.rejects(analyzeTransition(store,{recordingId:first.recording.id,startMs:0,endMs:500}),/video/);
  await writeFile(join(root,'fake.png'),'not an image');
  await assert.rejects(importRecording(store,{path:join(root,'fake.png'),title:'Fake',platform:'ios'}),/signature/);
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('transition study extracts real frames and keeps unknown motion properties unknown',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mobile-video-'));const store=new Store(join(root,'data'));
 try{
  const path=join(root,'synthetic.mp4');
  await exec('ffmpeg',['-v','error','-f','lavfi','-i','testsrc2=size=120x240:rate=10','-t','1','-pix_fmt','yuv420p',path]);
  const {recording}=await importRecording(store,{path,title:'Synthetic fixture',platform:'android'});
  const result=await analyzeTransition(store,{recordingId:recording.id,startMs:0,endMs:800,frames:3});
  assert.equal(result.frames.length,3);assert.equal(result.selectedIntervalMs,800);
  assert.equal(result.measured.easing,null);assert.equal(result.measured.haptics,null);assert.equal(result.measured.transitionDurationMs,null);
  assert.ok((await readFile(result.frames[0].path)).length>100);
  const cached=await analyzeTransition(store,{recordingId:recording.id,startMs:0,endMs:800,frames:3});assert.equal(cached.cacheHit,true);
  await assert.rejects(analyzeTransition(store,{recordingId:recording.id,startMs:0,endMs:1500}),/beyond/);
  const instance=createMobileServer(join(root,'data'));
  const client=new Client({name:'clip-bounds-test',version:'1'});const [a,b]=InMemoryTransport.createLinkedPair();
  await instance.server.connect(b);await client.connect(a);
  try{
   const result=await client.callTool({name:'create_flow',arguments:{title:'Impossible clip',platform:'android',steps:[{recordingId:recording.id,label:'Invalid',startMs:1000,endMs:2000}]}});
   assert.equal(result.isError,true);assert.match(result.content[0].text,/beyond/);
  }finally{await client.close();await instance.close();}
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('MCP protocol supports a native reference→capture→flow→brief journey',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mobile-mcp-'));const instance=createMobileServer(join(root,'data'));
 const client=new Client({name:'integration-test',version:'1'});const [a,b]=InMemoryTransport.createLinkedPair();
 await instance.server.connect(b);await client.connect(a);
 const call=async(name,args)=>{const r=await client.callTool({name,arguments:args});assert.ok(!r.isError,r.content?.[0]?.text);return JSON.parse(r.content[0].text);};
 try{
  const tools=await client.listTools();assert.ok(tools.tools.some(t=>t.name==='analyze_transition'));
  const {app:ref}=await call('import_app',{name:'My Android app',platforms:['android']});
  const path=join(root,'screen.png');await writeFile(path,png);
  const {recording}=await call('import_recording',{path,title:'Onboarding',platform:'android',appId:ref.id});
  const {flow}=await call('create_flow',{title:'Welcome flow',platform:'android',appId:ref.id,steps:[{recordingId:recording.id,label:'Welcome'}]});
  const {brief}=await call('create_mobile_brief',{goal:'A readable welcome experience',platform:'android',appIds:[ref.id],flowIds:[flow.id]});
  assert.equal(brief.stack,'Jetpack Compose');assert.equal(brief.flows[0].steps[0].recordingId,recording.id);
  assert.equal(brief.showcase.ready,false);
  const {recording:iosCapture}=await call('import_recording',{path,title:'iOS reference',platform:'ios'});
  const {flow:iosFlow}=await call('create_flow',{title:'iOS inspiration',platform:'ios',steps:[{recordingId:iosCapture.id,label:'Welcome'}]});
  const cross=await call('create_mobile_brief',{goal:'Android adaptation',platform:'android',flowIds:[iosFlow.id]});
  assert.deepEqual(cross.brief.crossPlatformFlowIds,[iosFlow.id]);assert.ok(cross.brief.evidenceGaps.some(g=>g.includes(iosFlow.id)));
  const mismatch=await client.callTool({name:'create_flow',arguments:{title:'Wrong platform',platform:'ios',steps:[{recordingId:recording.id,label:'Wrong'}]}});
  assert.equal(mismatch.isError,true);
  const recipe=await call('build_motion_recipe',{pattern:'success-feedback',platform:'ios',reducedMotion:true});assert.equal(recipe.language,'swift');
 }finally{await client.close();await instance.close();await rm(root,{recursive:true,force:true});}
});
