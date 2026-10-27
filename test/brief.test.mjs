import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Store } from '../dist/store.js';
import { createBrief } from '../dist/brief.js';
import { supportedTargets } from '../dist/project-target.js';

test('brief assembly preserves legacy guidance and historical flow provenance',async()=>{
  const root=await mkdtemp(join(tmpdir(),'mobile-brief-'));const store=new Store(root);
  try{
    const flow={id:'old-flow',title:'Prior capture',platform:'ios',steps:[{recordingId:'old-capture',label:'Open'}],tags:[],createdAt:'2025-01-01T00:00:00Z'};
    store.putFlow(flow);
    const input={goal:'Review reading queue',appIds:[],flowIds:[flow.id],constraints:[]};
    const legacy=createBrief(store,input,{platform:'ios',implementationStack:'swiftui'},true).brief;
    assert.equal(legacy.schema,'mobile-design-brief-v1');assert.equal(legacy.stack,'SwiftUI');
    assert.equal(legacy.platform,'ios');assert.equal('target' in legacy,false);
    assert.equal(legacy.implementation.navigation,'Choose the native navigation model for the actual tasks.');
    for(const target of supportedTargets){
      const {brief}=createBrief(store,input,target);
      assert.equal(brief.schema,'mobile-design-brief-v2');assert.deepEqual(brief.target,target);
      assert.equal('stack' in brief,false);assert.equal('platform' in brief,false);
      assert.deepEqual(brief.flows[0],flow);assert.equal('implementationStack' in brief.flows[0],false);
      assert.deepEqual(store.getFlow(flow.id),flow);
      assert.equal(brief.completion.performance,'unmeasured');
      if(target.implementationStack==='expo-react-native')assert.match(brief.implementation.motion,/does not support Expo/);
    }
    assert.throws(()=>createBrief(store,{...input,appIds:['missing']},supportedTargets[0]),/Unknown app/);
    assert.throws(()=>createBrief(store,{...input,flowIds:['missing']},supportedTargets[0]),/Unknown flow/);
  }finally{store.close();await rm(root,{recursive:true,force:true});}
});

test('actual stdio server advertises and validates the explicit target brief',async()=>{
  const root=await mkdtemp(join(tmpdir(),'mobile-target-stdio-'));
  const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../dist/cli.js',import.meta.url))],
    env:{...Object.fromEntries(Object.entries(process.env).filter(([key,value])=>value!==undefined&&!key.startsWith('MOBBIN_'))),MOBILE_DESIGN_DATA_DIR:root},stderr:'pipe'});
  const client=new Client({name:'target-contract-test',version:'1'});
  try{
    await client.connect(transport);
    const tools=await client.listTools();assert.equal(tools.tools.length,18);
    assert.ok(tools.tools.some(tool=>tool.name==='create_project_brief'));
    const target={platform:'ios',implementationStack:'expo-react-native'};
    const response=await client.callTool({name:'create_project_brief',arguments:{goal:'Design the reading queue',target}});
    assert.ok(!response.isError,response.content[0].text);
    const {brief}=JSON.parse(response.content[0].text);
    assert.equal(brief.schema,'mobile-design-brief-v2');assert.deepEqual(brief.target,target);
    const invalid=await client.callTool({name:'create_project_brief',arguments:{goal:'Invalid native pair',target:{platform:'android',implementationStack:'swiftui'}}});
    assert.equal(invalid.isError,true);
    const missing=await client.callTool({name:'create_project_brief',arguments:{goal:'Missing target'}});assert.equal(missing.isError,true);
    const status=await client.callTool({name:'get_provider_status',arguments:{}});
    const actual=JSON.parse(status.content[0].text);
    assert.equal(actual.capabilities.schema,'mobile-design-capabilities-v1');
    assert.deepEqual(actual.capabilities.targets,supportedTargets);
    assert.ok(actual.capabilities.artifacts.review.includes('mobile-design-review-v2'));
    const old=await client.callTool({name:'create_mobile_brief',arguments:{goal:'Legacy caller',platform:'android'}});
    assert.equal(JSON.parse(old.content[0].text).brief.stack,'Jetpack Compose');
  }finally{await client.close();await transport.close();await rm(root,{recursive:true,force:true});}
});
