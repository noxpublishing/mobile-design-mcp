import test from 'node:test';
import assert from 'node:assert/strict';
import { projectTargetSchema, supportedTargets } from '../dist/project-target.js';

test('explicit targets permit both Expo operating systems and only the supported native pairs',()=>{
  for(const target of supportedTargets)assert.deepEqual(projectTargetSchema.parse(target),target);
  for(const target of [
    {},{platform:'ios'},{platform:'expo',implementationStack:'expo-react-native'},
    {platform:'ios',implementationStack:'jetpack-compose'},
    {platform:'android',implementationStack:'swiftui'},
    {platform:'ios',implementationStack:'unknown'},
    {platform:'ios',implementationStack:'swiftui',inferred:true},
  ])assert.equal(projectTargetSchema.safeParse(target).success,false);
});
