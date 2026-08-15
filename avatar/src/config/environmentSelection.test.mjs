import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultColor, normalizeEnvironmentSelection } from './environmentSelection.js';

test('normalizeEnvironmentSelection passes the three usable shapes through', () => {
  assert.deepEqual(normalizeEnvironmentSelection({ type: 'none' }), { type: 'none' });
  assert.deepEqual(normalizeEnvironmentSelection({ type: 'env', id: 'stars' }), {
    type: 'env',
    id: 'stars',
  });
  assert.deepEqual(normalizeEnvironmentSelection({ type: 'color', value: defaultColor }), {
    type: 'color',
    value: defaultColor,
  });
});

test('normalizeEnvironmentSelection keeps ids it cannot verify', () => {
  assert.deepEqual(normalizeEnvironmentSelection({ type: 'env', id: 'lib-env-desk-4f2' }), {
    type: 'env',
    id: 'lib-env-desk-4f2',
  });
  assert.deepEqual(normalizeEnvironmentSelection({ type: 'env', id: ' stars ' }), {
    type: 'env',
    id: 'stars',
  });
});

test('normalizeEnvironmentSelection rejects an env with no id', () => {
  assert.equal(normalizeEnvironmentSelection({ type: 'env' }), null);
  assert.equal(normalizeEnvironmentSelection({ type: 'env', id: '' }), null);
  assert.equal(normalizeEnvironmentSelection({ type: 'env', id: '   ' }), null);
  assert.equal(normalizeEnvironmentSelection({ type: 'env', id: 42 }), null);
});

test('normalizeEnvironmentSelection accepts only hex colours', () => {
  assert.deepEqual(normalizeEnvironmentSelection({ type: 'color', value: '#FF0080' }), {
    type: 'color',
    value: '#ff0080',
  });
  assert.deepEqual(normalizeEnvironmentSelection({ type: 'color', value: '#abc' }), {
    type: 'color',
    value: '#abc',
  });
  assert.equal(normalizeEnvironmentSelection({ type: 'color', value: 'red' }), null);
  assert.equal(normalizeEnvironmentSelection({ type: 'color', value: 'ff0080' }), null);
  assert.equal(normalizeEnvironmentSelection({ type: 'color', value: '#ff00800' }), null);
  assert.equal(normalizeEnvironmentSelection({ type: 'color' }), null);
});

test('normalizeEnvironmentSelection rejects anything that is not a selection', () => {
  assert.equal(normalizeEnvironmentSelection(null), null);
  assert.equal(normalizeEnvironmentSelection(undefined), null);
  assert.equal(normalizeEnvironmentSelection('stars'), null);
  assert.equal(normalizeEnvironmentSelection({}), null);
  // No implied default: a payload has to say which mode it means.
  assert.equal(normalizeEnvironmentSelection({ value: '#ff0080' }), null);
  assert.equal(normalizeEnvironmentSelection({ type: 'gif', id: 'stars' }), null);
});

test('normalizeEnvironmentSelection does not alias its input', () => {
  // The stage keeps this in state and compares it by identity in effects.
  const raw = { type: 'env', id: 'stars' };
  assert.notEqual(normalizeEnvironmentSelection(raw), raw);
});
