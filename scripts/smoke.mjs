import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const root=await mkdtemp(join(tmpdir(),'mobile-stdio-smoke-'));
const client=new Client({name:'mobile-design-smoke',version:'0.1.0'});
const transport=new StdioClientTransport({command:process.execPath,args:[new URL('../dist/cli.js',import.meta.url).pathname],env:{...process.env,MOBILE_DESIGN_DATA_DIR:root},stderr:'pipe'});
let stderr='';transport.stderr?.on('data',chunk=>stderr+=chunk.toString());
const result={startedAt:new Date().toISOString(),scope:'Actual stdio MCP server, isolated local state, live public awards sources. No authenticated Mobbin request.',calls:[]};
const call=async(name,args={})=>{
 const raw=await client.callTool({name,arguments:args});assert.ok(!raw.isError,raw.content?.[0]?.text);
 const value=JSON.parse(raw.content[0].text);result.calls.push({name,result:value});return value;
};
try {
 await client.connect(transport);
 result.server=client.getServerVersion();const list=await client.listTools();result.tools=list.tools.map(t=>t.name);
 await call('get_provider_status');
 const awards=await call('refresh_awards',{provider:'all'});assert.ok(awards.results.every(r=>!r.error),JSON.stringify(awards));
 const ios=await call('search_apps',{platform:'ios',limit:30});const android=await call('search_apps',{platform:'android',limit:30});
 assert.ok(ios.apps.length>0);assert.ok(android.apps.length>0);
 await call('get_app',{id:ios.apps[0].id});
 for(const platform of ['ios','android'])for(const pattern of ['bottom-sheet','shared-element','success-feedback'])await call('build_motion_recipe',{platform,pattern,reducedMotion:true});
 await call('create_mobile_brief',{goal:'Native habit tracking with clear progress and restrained motion',platform:'android',appIds:[android.apps[0].id]});
 const target={platform:'ios',implementationStack:'expo-react-native'};
 const explicit=await call('create_project_brief',{goal:'An original reading queue with clear return navigation',target});
 assert.equal(explicit.brief.schema,'mobile-design-brief-v2');assert.deepEqual(explicit.brief.target,target);
 result.status='passed';result.stderr=stderr;
 await mkdir(new URL('../.artifacts/',import.meta.url),{recursive:true});
 await writeFile(new URL('../.artifacts/live-smoke.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:result.status,server:result.server,tools:result.tools.length,calls:result.calls.length,iosApps:ios.apps.length,androidApps:android.apps.length},null,2));
}finally{await client.close();await rm(root,{recursive:true,force:true});}
