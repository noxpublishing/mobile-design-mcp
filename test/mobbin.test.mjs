import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { searchMobbinScreens, MobbinOAuthProvider } from '../dist/mobbin.js';
test('Android is rejected before credentials or network, rather than relabelling iOS screens',async()=>{
 let calls=0;await assert.rejects(searchMobbinScreens({query:'paywall',platform:'android'},async()=>{calls++;return new Response('{}');}),/not android/);assert.equal(calls,0);
});
test('REST auth absence does not trigger scraping',async()=>{
 const previous=process.env.MOBBIN_API_KEY;delete process.env.MOBBIN_API_KEY;let calls=0;
 try{await assert.rejects(searchMobbinScreens({query:'paywall',platform:'ios'},async()=>{calls++;return new Response('{}');}),/MOBBIN_API_KEY/);assert.equal(calls,0);}finally{if(previous===undefined)delete process.env.MOBBIN_API_KEY;else process.env.MOBBIN_API_KEY=previous;}
});
test('official REST adapter uses the documented schema and does not persist the response',async()=>{
 const previous=process.env.MOBBIN_API_KEY;process.env.MOBBIN_API_KEY='test-fixture-key';
 try{
  const result=await searchMobbinScreens({query:'onboarding permissions',platform:'ios',limit:3},async(url,init)=>{
   assert.equal(url,'https://api.mobbin.com/v1/screens/search');assert.equal(init.redirect,'error');
   assert.equal(JSON.parse(init.body).platform,'ios');assert.equal(JSON.parse(init.body).limit,3);
   return new Response(JSON.stringify({screens:[{id:'fixture',app_name:'Fixture',platform:'ios'}]}));
  });assert.equal(result.persistentStorage,false);assert.equal(result.screens.length,1);
  await assert.rejects(searchMobbinScreens({query:'x',platform:'ios'},async()=>new Response('x'.repeat(2*1024*1024+1))),/exceeds/);
 }finally{if(previous===undefined)delete process.env.MOBBIN_API_KEY;else process.env.MOBBIN_API_KEY=previous;}
});
test('OAuth tokens use private file permissions; PKCE verifier stays in memory',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mobile-auth-'));
 try{
  const provider=new MobbinOAuthProvider(root,'http://127.0.0.1:34219/callback');
  provider.saveCodeVerifier('fixture-verifier');assert.equal(provider.codeVerifier(),'fixture-verifier');
  provider.saveTokens({access_token:'fixture-access',token_type:'Bearer'});
  assert.equal((await stat(provider.path)).mode&0o777,0o600);
  const reopened=new MobbinOAuthProvider(root);assert.equal(reopened.tokens().access_token,'fixture-access');
  assert.throws(()=>reopened.codeVerifier(),/No active/);
  assert.notEqual(provider.expectedState,reopened.expectedState);
 }finally{await rm(root,{recursive:true,force:true});}
});
