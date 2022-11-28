import { inspect } from 'util';
import test from 'ava';

import { unparseArgs, JsonObject } from '../src/aspargvs';


const snapshotMacro = test.macro((t, json: JsonObject, unkey?: (key: string) => string) => {
  t.snapshot(unparseArgs(json, unkey), '```js\n' + inspect(json) + '\n```');
});


test('empty object', snapshotMacro, {});

test('simple array', snapshotMacro, { xs: [0, 1] });

test('array with object', snapshotMacro, { xs: [0, 1, {a: 2}] });

test('array with objects containing multiple keys', snapshotMacro, { xs: [ {a: 0, b: 1}, {a: 2, b: 3} ] });

test('array with object and more primitive values', snapshotMacro, { xs: [0, 1, {a: 2}, 3, 4] });

test('booleans', snapshotMacro, {
  a: true,
  b: { c: false },
  d: [true, false]
});

test('boolean-like strings', snapshotMacro, {
  a: 'true',
  b: { c: 'false' },
  d: ['true', 'false']
});

test('null and null-like string', snapshotMacro, {
  a: null,
  b: 'null',
  c: [null, 'null']
});

test('number and number-like string', snapshotMacro, { a: [1, -2, 3.4, 5e6], b: ['1', '-2', '3.4', '5e6'] });

test('strings', snapshotMacro, {
  a: 'word',
  b: 'with double quote"',
  c: 'with single quote\'',
  d: 'with backtick`',
  e: 'just multiple words',
  f: '[1]',
  g: '{}',
  h: '--foo',
  i: 'word-with_safe--symbols_1.2',
});
