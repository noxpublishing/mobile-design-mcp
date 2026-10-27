import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGooglePlayAwards, refreshGooglePlayAwards, GOOGLE_PLAY_AWARDS_URL } from '../dist/google-awards.js';
const html=`<article><h1>Google Play's best apps and games of 2025</h1><div class="rich-text">
<h2>Best overall app and game</h2><p><b>Best App:</b> <a href="https://play.google.com/store/apps/details?id=com.example.focus">Focus</a></p>
<h2>Best apps of 2025</h2><ul><li><b>Best for Fun:</b> <a href="https://play.google.com/store/apps/details?id=com.example.fun">Fun</a></li><li><b>Best for Watches:</b> <a href="https://play.google.com/store/apps/details?id=com.example.watch">Watch</a></li></ul>
<h2>Best games of 2025</h2><p><b>Best for Fun:</b> <a href="https://play.google.com/store/apps/details?id=com.example.game">Game</a></p></div></article>`;
test('Google source retains broad award identity and excludes games and non-phone categories',()=>{
 const apps=parseGooglePlayAwards(html,GOOGLE_PLAY_AWARDS_URL,'2026-10-27T00:00:00Z');
 assert.deepEqual(apps.map(a=>a.name),['Focus','Fun']);
 assert.ok(apps.every(a=>a.platforms[0]==='android'&&a.awards[0].year===2025&&a.tags.includes('broad-app-award')));
});
test('Google source checks its year and streaming boundary',async()=>{
 assert.throws(()=>parseGooglePlayAwards(html.replaceAll('2025','2026'),GOOGLE_PLAY_AWARDS_URL,'2026-10-27T00:00:00Z'),/2025/);
 await assert.rejects(refreshGooglePlayAwards({fetchFn:async()=>new Response('x'.repeat(4*1024*1024+1),{headers:{'content-type':'text/html'}})}),/4 MiB/);
});
