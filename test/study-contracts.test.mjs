import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDesignReviewPacket } from '../dist/review-packet.js';

test('shipped study manifests build real V2 packets from matching source and capture bytes', async () => {
  const examples = fileURLToPath(new URL('../examples/', import.meta.url));
  const output = await mkdtemp(join(tmpdir(), 'mobile-study-packets-'));
  try {
    for (const name of ['palette-ios', 'passage-ios', 'expo-study']) {
      const root = join(examples, name);
      const manifest = JSON.parse(await readFile(join(root, 'design-review.json'), 'utf8'));
      const receipt = JSON.parse(await readFile(join(root, 'evidence', 'receipt.json'), 'utf8'));
      assert.equal(manifest.revision, receipt.revision);
      for (const source of receipt.sourceFiles) {
        const actual = createHash('sha256').update(await readFile(join(root, source.path))).digest('hex');
        assert.equal(actual, source.sha256, name + ': source changed since its capture: ' + source.path);
      }
      for (const evidence of manifest.evidence) {
        const media = receipt.media.find(item => 'evidence/' + item.path === evidence.path);
        assert.ok(media, name + ': missing capture receipt');
        assert.equal(media.captureConditions.textScale, manifest.device.textScale, name + ': mixed text-scale contexts');
      }
      const result = await buildDesignReviewPacket({ manifestPath: join(root, 'design-review.json'), outputDirectory: join(output, name), mode: 'consistency' });
      const packet = JSON.parse(await readFile(result.packetPath, 'utf8'));
      assert.equal(packet.schema, 'mobile-design-packet-v2');
      assert.deepEqual(packet.target, manifest.target);
      assert.equal(packet.evidence.length, manifest.evidence.length);
      assert.equal(packet.outcome, 'not-reviewed');
      assert.ok(packet.gaps.length, 'The studies retain their explicit acceptance gaps.');
      if (name === 'expo-study') assert.ok(packet.designSystem.some(source => source.path.endsWith('.tsx')));
    }
  } finally { await rm(output, { recursive: true, force: true }); }
});
