import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseAppleAwards,refreshAppleAwards} from '../dist/awards.js';

const fixture=await readFile(new URL('./fixtures/awards-2026.html',import.meta.url),'utf8');
const url='https://developer.apple.com/design/awards/';
const at='2026-10-27T10:00:00Z';
const htmlResponse=(body=fixture,extra={})=>new Response(body,{headers:{'content-type':'text/html'},...extra});

test('award association preserves each category/status and excludes unsupported platforms and games',()=>{
  const rows=parseAppleAwards(fixture,url,at);
  assert.deepEqual(rows.map(r=>r.name),['Test Aurora','Test Tide']);
  const aurora=rows[0];
  assert.deepEqual(aurora.awards.map(a=>[a.category,a.status]),[['Interaction','winner'],['Visuals and Graphics','finalist']]);
  assert.deepEqual(aurora.platforms,['ios']);
  assert.equal(aurora.description,'A test app with accessible interactions.');
  assert.equal(aurora.source.observedAt,at);
  assert.equal(rows[1].awards[0].status,'finalist');
  assert.equal(rows[1].awards[0].url,url+'#interaction');
  assert.equal(aurora.media,undefined);
});

test('year is observed from page content and never silently filled from request or clock',()=>{
  assert.throws(()=>parseAppleAwards(fixture,url,at,2025),/differs/);
  assert.throws(()=>parseAppleAwards(fixture.replaceAll('2026',''),url,at,2026),/unambiguous/);
  assert.throws(()=>parseAppleAwards(fixture.replace('winners and finalists</title>','2025 winners and finalists</title>'),url,at),/unambiguous/);
  assert.throws(()=>parseAppleAwards(fixture,url,at,2026.5),/integer/);
});

test('source and timestamp validation keeps provenance explicit',()=>{
  assert.throws(()=>parseAppleAwards(fixture,'https://example.com/design/awards/',at),/developer.apple.com/);
  assert.throws(()=>parseAppleAwards(fixture,'https://developer.apple.com.evil.example/design/awards/',at),/developer.apple.com/);
  assert.throws(()=>parseAppleAwards(fixture,url,'not a timestamp'),/timestamp/);
});

test('refresh returns source-linked results without requesting media or app pages',async()=>{
  const requested=[];
  const result=await refreshAppleAwards({year:2026,fetchFn:async(input,init)=>{
    requested.push(String(input));assert.equal(init.redirect,'manual');assert.ok(init.signal);
    return htmlResponse();
  }});
  assert.deepEqual(requested,[url]);assert.equal(result.apps.length,2);assert.ok(result.warnings.length);
});

test('an off-domain redirect is rejected before any second request',async()=>{
  let calls=0;
  await assert.rejects(refreshAppleAwards({fetchFn:async()=>{
    calls++;return new Response(null,{status:302,headers:{location:'https://example.com/design/awards/'}});
  }}),/developer.apple.com/);
  assert.equal(calls,1);
});

test('a same-domain redirect is followed and each record cites its final source',async()=>{
  const final=url+'2026/';let calls=0;
  const result=await refreshAppleAwards({fetchFn:async(input)=>{
    calls++;return calls===1?new Response(null,{status:302,headers:{location:'./2026/'}}):htmlResponse();
  }});
  assert.equal(calls,2);assert.equal(result.sourceUrl,final);
  assert.equal(result.apps[0].source.url,final+'#interaction');
});

test('HTML size is bounded while streaming, not after an unlimited body read',async()=>{
  let cancelled=false;
  const stream=new ReadableStream({
    pull(controller){controller.enqueue(new Uint8Array(1024*1024));},
    cancel(){cancelled=true;},
  });
  await assert.rejects(refreshAppleAwards({fetchFn:async()=>htmlResponse(stream)}),/4 MiB/);
  assert.equal(cancelled,true);
});

test('declared oversized body, non-HTML, blocks and empty/drifted result are explicit errors',async()=>{
  await assert.rejects(refreshAppleAwards({fetchFn:async()=>new Response('x',{headers:{'content-type':'text/html','content-length':String(5*1024*1024)}})}),/4 MiB/);
  await assert.rejects(refreshAppleAwards({fetchFn:async()=>new Response('{}',{headers:{'content-type':'application/json'}})}),/not HTML/);
  await assert.rejects(refreshAppleAwards({fetchFn:async()=>new Response('blocked',{status:403})}),/HTTP 403/);
  await assert.rejects(refreshAppleAwards({fetchFn:async()=>htmlResponse('<title>2026 Apple Design Awards</title>')}),/listing may have changed/);
});
