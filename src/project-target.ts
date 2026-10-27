import { z } from 'zod';
import type { ProjectTarget } from './types.js';

export const supportedTargets: readonly ProjectTarget[] = [
  {platform:'ios',implementationStack:'swiftui'},
  {platform:'android',implementationStack:'jetpack-compose'},
  {platform:'ios',implementationStack:'expo-react-native'},
  {platform:'android',implementationStack:'expo-react-native'},
];

export const projectTargetSchema=z.object({
  platform:z.enum(['ios','android']),
  implementationStack:z.enum(['swiftui','jetpack-compose','expo-react-native']),
}).strict().superRefine((target,context)=>{
  if(!supportedTargets.some(pair=>pair.platform===target.platform&&pair.implementationStack===target.implementationStack))
    context.addIssue({code:'custom',path:['implementationStack'],message:'Unsupported platform/implementation stack pair.'});
});

export const projectCapabilities={
  schema:'mobile-design-capabilities-v1',
  targets:supportedTargets,
  artifacts:{brief:['mobile-design-brief-v1','mobile-design-brief-v2'],review:['mobile-design-review-v1','mobile-design-review-v2'],packet:['mobile-design-packet-v1','mobile-design-packet-v2']},
  operations:{
    create_mobile_brief:{targetSelection:'legacy-platform',stacks:['swiftui','jetpack-compose']},
    create_project_brief:{targetSelection:'explicit',stacks:['swiftui','jetpack-compose','expo-react-native']},
    build_design_review_packet:{targetSelection:'manifest-version'},
    build_motion_recipe:{stacks:['swiftui','jetpack-compose'],expo:'Use the project-compatible installed React Native animation stack; no Expo recipe generation.'},
  },
} as const;
