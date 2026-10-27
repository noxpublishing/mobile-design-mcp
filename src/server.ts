import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Store } from './store.js';
import { refreshAppleAwards } from './awards.js';
import { refreshGooglePlayAwards } from './google-awards.js';
import { analyzeTransition, importRecording, probeVideo, recordingPreview } from './media.js';
import { buildMotionRecipe, listMotionRecipes } from './recipes.js';
import { callMobbinTool, dataRoot, getMobbinStatus, listMobbinTools, searchMobbinScreens } from './mobbin.js';
import { buildDesignReviewPacket, reviewMode } from './review-packet.js';
import type { Flow, Platform, ReferenceApp } from './types.js';
const exec = promisify(execFile);
const platform = z.enum(['ios','android']);
const tags = z.array(z.string().trim().min(1).max(80)).max(30).default([]);
const ro = {readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const network = {...ro,idempotentHint:false,openWorldHint:true};
const write = {...ro,readOnlyHint:false,idempotentHint:false};
const json = (value:unknown) => ({content:[{type:'text' as const,text:JSON.stringify(value,null,2)}]});
const failure=(error:unknown)=>{
  const message=error instanceof Error?error.message:'Operation failed.';
  return {isError:true,content:[{type:'text' as const,text:message}],structuredContent:{status:'failed-to-execute',error:{message}}};
};
const guard = <T extends object>(fn:(args:T)=>Promise<unknown>|unknown) => async (args:T) => {
  try {
    const value=await fn(args);const result=json(value);
    return value&&typeof value==='object'&&'status' in value&&value.status==='failed'?{...result,isError:true}:result;
  } catch(error) { return failure(error); }
};

export function createMobileServer(root=dataRoot()) {
  const store=new Store(root);
  const server=new McpServer({name:'mobile-design-mcp',version:'0.1.0'});
  server.tool('get_provider_status','Inspect this local library and configured optional providers. No remote account checks.',{},ro,guard(async()=>{
    const available=await Promise.all(['ffmpeg','ffprobe','adb','xcrun'].map(async name=>{
      try{await exec(name,name==='ffmpeg'||name==='ffprobe'?['-version']:['--version'],{timeout:3000,maxBuffer:10000});return [name,true];}catch{return [name,false];}
    }));
    return {counts:store.counts(),storage:root,platforms:['ios','android'],nativeStacks:{ios:'SwiftUI',android:'Jetpack Compose'},
      mobbin:getMobbinStatus(root),dependencies:Object.fromEntries(available),
      capture:{localImport:true,liveDeviceAutomation:false,iosSimulatorHost:'macOS with Xcode required; import captures here'},
      awards:{apple:store.getMeta('refresh:apple'),googlePlay:store.getMeta('refresh:google')},
      awwwards:{connection:'external MCP or web research',availability:'not-checked-by-this-server'},
      figma:{connection:'official external MCP',endpoint:'https://mcp.figma.com/mcp',availability:'not-checked-by-this-server',skill:'mobile-figma'},
      rive:{connection:'official external desktop editor MCP',endpoint:'http://127.0.0.1:9791/mcp',editorHostPlatforms:['macOS','Windows'],availability:'not-checked-by-this-server',skill:'mobile-motion',bundledRuntime:false},
      coverage:'Local catalog subset; awards identify references, not current screenshots or measured transitions.'};
  }));
  server.tool('refresh_awards','Fetch official Apple Design Awards and/or the dated Google Play Best of 2025 smartphone-app awards. Stores metadata, not screen libraries.',{
    provider:z.enum(['apple','google','all']).default('all'),year:z.number().int().min(2000).max(2100).optional(),
  },{...network,readOnlyHint:false},guard(async args=>{
    if(args.year && args.provider!=='apple')throw new Error('year is supported only for Apple as a current-page year check. Google is a dated 2025 source.');
    const selected=args.provider==='all'?['apple','google']: [args.provider];
    const results=await Promise.all(selected.map(async name=>{
      try {
        const result=name==='apple'?await refreshAppleAwards({year:args.year}):await refreshGooglePlayAwards();
        store.upsertApps(result.apps);const status={sourceUrl:result.sourceUrl,observedAt:result.observedAt,count:result.apps.length,warnings:result.warnings};
        store.setMeta('refresh:'+name,status);return {provider:name,...status};
      }catch(error){return {provider:name,error:error instanceof Error?error.message:'Provider failed'};}
    }));
    const failed=results.filter(result=>'error' in result).length;
    return {status:failed===results.length?'failed':failed?'partial':'completed',results,counts:store.counts()};
  }));
  server.tool('search_apps','Search the local award/curated app catalog with FTS5. This is metadata search, not a full screen library.',{
    query:z.string().max(500).optional(),platform:platform.optional(),awardsOnly:z.boolean().default(false),limit:z.number().int().min(1).max(100).default(12),
  },ro,guard(args=>({apps:store.searchApps(args),counts:store.counts(),coverage:'Local cached subset only',note:'Use refresh_awards to populate official references, or import_app for your own curated references.'})));
  server.tool('get_app','Read one local app reference, its sourced awards and associated local captures.',{id:z.string()},ro,guard(args=>{
    const app=store.getApp(args.id);if(!app)throw new Error('Unknown app id.');
    return {app,recordings:store.listRecordings({appId:app.id}),note:'An award does not prove an interaction was present in the captured app version.'};
  }));
  server.tool('import_app','Add a curated app reference without inventing awards. Use for your own apps or Android/iOS references.',{
    name:z.string().trim().min(1).max(200),platforms:z.array(platform).min(1).max(2),description:z.string().max(3000).default(''),tags,sourceUrl:z.string().url().optional(),
  },write,guard(args=>{
    const id='local-'+randomUUID();const app:ReferenceApp={id,name:args.name,platforms:[...new Set(args.platforms)],description:args.description,tags:args.tags,
      source:{provider:'local',url:args.sourceUrl??'urn:mobile-design:'+id,observedAt:new Date().toISOString()},awards:[]};
    store.upsertApps([app]);return {app};
  }));
  server.tool('import_recording','Copy a local screenshot/video into your owned reference library, hash it and retain platform/version provenance.',{
    path:z.string().min(1),title:z.string().trim().min(1).max(200),platform,appId:z.string().optional(),appVersion:z.string().max(100).optional(),
    osVersion:z.string().max(100).optional(),capturedAt:z.string().datetime().optional(),tags,
  },write,guard(args=>importRecording(store,args)));
  server.tool('list_recordings','List imported local media, optionally with up to two inline screenshot previews.',{
    platform:platform.optional(),appId:z.string().optional(),limit:z.number().int().min(1).max(50).default(12),previews:z.boolean().default(false),
  },ro,async args=>{
    const recordings=store.listRecordings(args);const result=json({recordings});
    const content:Array<{type:'text';text:string}|{type:'image';data:string;mimeType:string}>=[...result.content];
    if(args.previews)for(const recording of recordings.slice(0,2)){const preview=await recordingPreview(recording);if(preview)content.push(preview);}
    return {content};
  });
  server.tool('create_flow','Store an ordered reference journey backed by existing local recordings. Records observed steps, not an invented navigation trace.',{
    title:z.string().trim().min(1).max(200),platform,appId:z.string().optional(),tags,
    steps:z.array(z.object({recordingId:z.string(),label:z.string().trim().min(1).max(200),action:z.string().max(500).optional(),startMs:z.number().min(0).optional(),endMs:z.number().positive().optional()})).min(1).max(30),
  },write,guard(async args=>{
    if(args.appId&&!store.getApp(args.appId))throw new Error('Unknown appId.');
    const durations=new Map<string,number>();
    for(const step of args.steps){
      const recording=store.getRecording(step.recordingId);if(!recording)throw new Error('Unknown step recording: '+step.recordingId);
      if(recording.platform!==args.platform)throw new Error('Flow and recording platforms must match.');
      if(args.appId&&recording.appId&&args.appId!==recording.appId)throw new Error('Flow and capture app identifiers do not match.');
      if((step.startMs===undefined)!==(step.endMs===undefined))throw new Error('Clip steps require both startMs and endMs.');
      if(step.startMs!==undefined&&(!recording.mediaType.startsWith('video/')||step.endMs!<=step.startMs))throw new Error('Clip ranges require a video and endMs greater than startMs.');
      if(step.endMs!==undefined){
        let duration=durations.get(recording.id);
        if(duration===undefined){duration=(await probeVideo(recording)).durationMs;durations.set(recording.id,duration);}
        if(step.endMs>duration+1)throw new Error('Flow clip interval extends beyond the measured video duration.');
      }
    }
    const flow:Flow={...args,id:'flow-'+randomUUID(),createdAt:new Date().toISOString()};store.putFlow(flow);return {flow,annotationStatus:'User-provided flow labels and actions; not automatically observed input events.'};
  }));
  server.tool('get_flow','Read an ordered reference flow and its capture provenance.',{id:z.string()},ro,guard(args=>{
    const flow=store.getFlow(args.id);if(!flow)throw new Error('Unknown flow.');
    return {flow,recordings:flow.steps.map(s=>store.getRecording(s.recordingId))};
  }));
  server.tool('analyze_transition','Extract time-indexed review frames from a local video interval. Does not infer original easing, springs or haptics.',{
    recordingId:z.string(),startMs:z.number().min(0),endMs:z.number().positive(),frames:z.number().int().min(3).max(12).default(6),inlineFrames:z.boolean().default(true),
  },write,async args=>{
    try {
      const study=await analyzeTransition(store,args);
      const content:Array<{type:'text';text:string}|{type:'image';data:string;mimeType:string}>=[...json(study).content];
      if(args.inlineFrames)for(const frame of study.frames)content.push({type:'image',data:(await readFile(frame.path)).toString('base64'),mimeType:'image/jpeg'});
      return {content};
    }catch(error){return failure(error);}
  });
  server.tool('list_motion_recipes','List authored native motion patterns, with SwiftUI and Jetpack Compose variants.',{},ro,guard(()=>({recipes:listMotionRecipes()})));
  server.tool('build_design_review_packet','Create a bounded, revision-bound local snapshot for an independent native design review. Does not run reviewers or certify quality.',{
    manifestPath:z.string().min(1),outputDirectory:z.string().min(1),mode:reviewMode,
  },write,guard(args=>buildDesignReviewPacket(args)));
  server.tool('build_motion_recipe','Generate an authored SwiftUI or Compose example with reduced-motion handling and explicit timing assumptions.',{
    pattern:z.enum(['bottom-sheet','shared-element','success-feedback']),platform,durationMs:z.number().min(100).max(1200).optional(),reducedMotion:z.boolean().default(false),
  },ro,guard(args=>buildMotionRecipe(args)));
  server.tool('create_mobile_brief','Synthesize a cited native-app direction from selected local references and flow evidence. Missing motion and visual evidence stay explicit.',{
    goal:z.string().trim().min(1).max(3000),platform,appIds:z.array(z.string()).max(8).default([]),flowIds:z.array(z.string()).max(8).default([]),
    constraints:z.array(z.string().max(500)).max(20).default([]),
  },ro,guard(args=>{
    const apps=args.appIds.map(id=>{const app=store.getApp(id);if(!app)throw new Error('Unknown app: '+id);return app;});
    const flows=args.flowIds.map(id=>{const flow=store.getFlow(id);if(!flow)throw new Error('Unknown flow: '+id);return flow;});
    const crossPlatform=apps.filter(app=>!app.platforms.includes(args.platform)).map(app=>app.id);
    const crossPlatformFlows=flows.filter(flow=>flow.platform!==args.platform).map(flow=>flow.id);
    const gaps:string[]=[];
    if(!apps.length)gaps.push('No selected reference apps.');if(!flows.length)gaps.push('No recorded reference journeys.');
    if(crossPlatform.length)gaps.push('Some app references are from another platform; adapt navigation and interaction conventions explicitly.');
    if(crossPlatformFlows.length)gaps.push('Selected flows from another platform require adaptation and do not validate target-platform interactions: '+crossPlatformFlows.join(', '));
    gaps.push('Palette, typography, easing, spring constants, gestures and haptics are not recovered from award metadata.');
    const stack=args.platform==='ios'?'SwiftUI':'Jetpack Compose';
    const brief={schema:'mobile-design-brief-v1',goal:args.goal,platform:args.platform,stack,constraints:args.constraints,
      references:apps.map(app=>({id:app.id,name:app.name,platforms:app.platforms,awards:app.awards,source:app.source})),
      flows,crossPlatformReferenceIds:crossPlatform,crossPlatformFlowIds:crossPlatformFlows,evidenceGaps:gaps,
      inspirationResearch:{mobbin:'not-attested-by-this-brief',awwwards:'not-attested-by-this-brief'},
      implementation:{navigation:'Choose the native navigation model for the actual tasks.',motion:'Use observed clips where available; label new recipes as authored.',
        accessibility:['Dynamic text and accessible labels','Platform touch targets and insets','Visible loading, error and empty states where relevant','Reduced-motion alternative'],
        verification:'Render and test on the target simulator/device; metadata and generated code do not verify UI quality.'},
      completion:{design:'unverified',ux:'unverified',performance:'unmeasured',contract:'docs/workflow.md#completion'},
      showcase:{optional:true,ready:false,requires:'Verified app design, UX review and measured native performance for the identified revision, plus final app media. Accepted gaps are a qualified handoff, not a verified pass.'}};
    const markdown=[`# ${stack} app direction`,args.goal,'',...apps.map(app=>`- Reference: ${app.name} — ${app.source.url}`),'','Evidence gaps:',...gaps.map(g=>'- '+g),'',...args.constraints.map(c=>'- Constraint: '+c)].join('\n');
    return {brief,markdown};
  }));
  server.tool('mobbin_search_screens','Query the official Mobbin REST screen search live. Requires your API key; current native filter supports iOS, not Android. Results are not persisted.',{
    query:z.string().trim().min(1).max(500),platform,limit:z.number().int().min(1).max(20).default(6),
  },network,guard(args=>searchMobbinScreens(args)));
  server.tool('mobbin_list_tools','Discover the official account-connected Mobbin MCP tool schemas. Requires OAuth sign-in.',{},network,guard(()=>listMobbinTools(root)));
  server.tool('mobbin_call','Call a discovered, explicitly read-only official Mobbin MCP tool without persisting its content locally.',{
    name:z.string().min(1),arguments:z.record(z.string(),z.unknown()).optional(),
  },network,async args=>{
    try{return await callMobbinTool(args,root);}catch(error){return failure(error);}
  });
  return {server,store,close:async()=>{await server.close();store.close();}};
}
