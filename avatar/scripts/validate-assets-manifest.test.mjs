import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAssetsManifest } from './validate-assets-manifest.mjs';

test('docs/assets-manifest.yml passes validation', () => {
  const result = validateAssetsManifest();
  assert.equal(result.ok, true, result.errors?.join('\n'));
});
