import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMotionRecipe, listMotionRecipes } from '../dist/recipes.js';

test('catalogue exposes the three supported patterns without mutable shared state', () => {
  const catalogue = listMotionRecipes();
  assert.deepEqual(catalogue.map(({ id }) => id), ['bottom-sheet', 'shared-element', 'success-feedback']);
  catalogue[0].platforms.length = 0;
  catalogue[0].title = 'changed by caller';
  const fresh = listMotionRecipes();
  assert.deepEqual(fresh[0].platforms, ['ios', 'android']);
  assert.equal(fresh[0].title, 'Native modal bottom sheet');
});

test('all six recipe variants disclose authorship, platform prerequisites and primary sources', () => {
  for (const { id } of listMotionRecipes()) {
    for (const platform of ['ios', 'android']) {
      const recipe = buildMotionRecipe({ pattern: id, platform });
      assert.equal(recipe.evidenceStatus, 'authored');
      assert.equal(recipe.pattern, id);
      assert.equal(recipe.platform, platform);
      assert.equal(recipe.language, platform === 'ios' ? 'swift' : 'kotlin');
      assert.ok(recipe.code.length > 500);
      assert.ok(recipe.assumptions.length >= 2);
      assert.ok(recipe.limitations.some((note) => note.includes('not been compiled')));
      for (const { url } of recipe.sources) {
        assert.equal(new URL(url).hostname, platform === 'ios' ? 'developer.apple.com' : 'developer.android.com');
      }
    }
  }
});

test('finite durations are rounded and bounded before interpolation into source', () => {
  const base = { pattern: 'shared-element', platform: 'android' };
  assert.equal(buildMotionRecipe({ ...base, durationMs: -10 }).durationMs, 100);
  assert.equal(buildMotionRecipe({ ...base, durationMs: 999999 }).durationMs, 1200);
  const recipe = buildMotionRecipe({ ...base, durationMs: 327.6 });
  assert.equal(recipe.durationMs, 328);
  assert.match(recipe.code, /BoundsTransform \{ _, _ -> tween\(328\) \}/);
  assert.equal(buildMotionRecipe(base).durationMs, 280);
});

test('SwiftUI source preserves environment key paths and converts milliseconds to seconds', () => {
  const recipe = buildMotionRecipe({ pattern: 'shared-element', platform: 'ios', durationMs: 450 });
  assert.ok(recipe.code.includes('@Environment(\\.accessibilityReduceMotion)'));
  assert.match(recipe.code, /easeInOut\(duration: 0\.45\)/);
  assert.match(recipe.code, /transaction\.disablesAnimations = reduceMotion/);
});

test('sheet timing is honestly system-owned on both platforms', () => {
  for (const platform of ['ios', 'android']) {
    const recipe = buildMotionRecipe({ pattern: 'bottom-sheet', platform, durationMs: 500 });
    assert.equal(recipe.timing.mode, 'system');
    assert.equal(recipe.timing.customDurationApplied, false);
    assert.match(recipe.timing.note, /not applied/);
    assert.match(recipe.code, /Close options/);
  }
});

test('reduced-motion output keeps the content and disables custom spatial motion', () => {
  for (const { id } of listMotionRecipes()) {
    const ios = buildMotionRecipe({ pattern: id, platform: 'ios', reducedMotion: true });
    const android = buildMotionRecipe({ pattern: id, platform: 'android', reducedMotion: true });
    assert.equal(ios.reducedMotion, true);
    assert.equal(android.reducedMotion, true);
    assert.equal(ios.timing.customDurationApplied, false);
    assert.equal(android.timing.customDurationApplied, false);
    assert.match(ios.code, /requestedReduceMotion = true/);
    assert.match(android.code, /reducedMotion: Boolean = true/);
    assert.match(android.code, /registerContentObserver/);
    assert.match(android.code, /unregisterContentObserver/);
  }
  const success = buildMotionRecipe({ pattern: 'success-feedback', platform: 'android', reducedMotion: true });
  assert.match(success.code, /if \(reduceMotion\) 0 else/);
  assert.match(success.code, /liveRegion = LiveRegionMode\.Polite/);
  assert.match(success.code, /Saved successfully/);
});

test('invalid inputs cannot silently select a template or inject duration source', () => {
  const base = { pattern: 'success-feedback', platform: 'ios' };
  assert.throws(() => buildMotionRecipe({ ...base, pattern: '__proto__' }), /Unknown motion pattern/);
  assert.throws(() => buildMotionRecipe({ ...base, platform: 'web' }), /platform must be/);
  for (const durationMs of [NaN, Infinity, -Infinity, '280); malicious()']) {
    assert.throws(() => buildMotionRecipe({ ...base, durationMs }), /finite number/);
  }
  assert.throws(() => buildMotionRecipe({ ...base, reducedMotion: 'false' }), /boolean/);
  assert.throws(() => buildMotionRecipe(null), /input is required/);
});
