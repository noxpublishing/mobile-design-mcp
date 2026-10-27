import type { Store } from './store.js';
import type { ProjectTarget } from './types.js';
import { projectTargetSchema } from './project-target.js';

export interface BriefInput {
  goal:string;
  appIds:string[];
  flowIds:string[];
  constraints:string[];
}

export function createBrief(store:Store,args:BriefInput,target:ProjectTarget,legacy=false) {
  projectTargetSchema.parse(target);
  const apps=args.appIds.map(id=>{const app=store.getApp(id);if(!app)throw new Error('Unknown app: '+id);return app;});
  const flows=args.flowIds.map(id=>{const flow=store.getFlow(id);if(!flow)throw new Error('Unknown flow: '+id);return flow;});
  const crossPlatform=apps.filter(app=>!app.platforms.includes(target.platform)).map(app=>app.id);
  const crossPlatformFlows=flows.filter(flow=>flow.platform!==target.platform).map(flow=>flow.id);
  const gaps:string[]=[];
  if(!apps.length)gaps.push('No selected reference apps.');if(!flows.length)gaps.push('No recorded reference journeys.');
  if(crossPlatform.length)gaps.push('Some app references are from another platform; adapt navigation and interaction conventions explicitly.');
  if(crossPlatformFlows.length)gaps.push('Selected flows from another platform require adaptation and do not validate target-platform interactions: '+crossPlatformFlows.join(', '));
  gaps.push('Palette, typography, easing, spring constants, gestures and haptics are not recovered from award metadata.');
  const expo=target.implementationStack==='expo-react-native';
  const stack=expo?'Expo / React Native':target.implementationStack==='swiftui'?'SwiftUI':'Jetpack Compose';
  const common={goal:args.goal,constraints:args.constraints,
    references:apps.map(app=>({id:app.id,name:app.name,platforms:app.platforms,awards:app.awards,source:app.source})),
    flows,crossPlatformReferenceIds:crossPlatform,crossPlatformFlowIds:crossPlatformFlows,evidenceGaps:gaps,
    inspirationResearch:{mobbin:'not-attested-by-this-brief',awwwards:'not-attested-by-this-brief'},
    implementation:{
      navigation:expo?'Preserve the actual Expo project navigation and platform back behavior.':'Choose the native navigation model for the actual tasks.',
      motion:expo?'Use the project-compatible installed React Native animation stack and motion contract. Native SwiftUI/Compose recipe generation does not support Expo.':'Use observed clips where available; label new recipes as authored.',
      accessibility:['Dynamic text and accessible labels','Platform touch targets and insets','Visible loading, error and empty states where relevant','Reduced-motion alternative'],
      verification:expo?'Inspect the actual SDK and dependencies; build and test on the declared native OS. Source or web rendering does not verify native UI quality.':'Render and test on the target simulator/device; metadata and generated code do not verify UI quality.',
    },
    completion:{design:'unverified',ux:'unverified',performance:'unmeasured',contract:'docs/workflow.md#completion'},
    showcase:{optional:true,ready:false,requires:'Verified app design, UX review and measured native performance for the identified revision, plus final app media. Accepted gaps are a qualified handoff, not a verified pass.'},
  };
  const brief=legacy
    ? {schema:'mobile-design-brief-v1',platform:target.platform,stack,...common}
    : {schema:'mobile-design-brief-v2',target,...common};
  const markdown=[`# ${stack} app direction`,args.goal,'',...apps.map(app=>`- Reference: ${app.name} — ${app.source.url}`),'','Evidence gaps:',...gaps.map(g=>'- '+g),'',...args.constraints.map(c=>'- Constraint: '+c)].join('\n');
  return {brief,markdown};
}
