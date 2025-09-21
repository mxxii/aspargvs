import test from 'ava';

import { handleArgs } from '../src/aspargvs.ts';

export default { require: ['./_force-exit.ts'] };


const snapshotMacro = test.macro((t, input: string[]) => {
  handleArgs(
    input,
    { handlers: { json: (json) => { t.snapshot(json, '`' + input.join(' ') + '`'); } } },
  );
});


// Smoke test

test('empty args list', snapshotMacro, []);

test('key with empty value', snapshotMacro, ['--foo=']);


// Multiple arguments

test('combine array from multiple arguments of different shapes', snapshotMacro, ['--xs[]', '0', '1', '--xs[2].a=2', '--xs=[3,4]']);

test('empty array defined multiple times makes no effect', snapshotMacro, ['--xs[]', '--xs[]', '--xs=[]', '--xs=[]']);

test('combine nested objects', snapshotMacro, ['--a.a.a', '--a.a.b', '--a.b', '--b']);

test('throw when overriding the same key that is not an array', (t) => {
  t.throws(
    () => { handleArgs(['--a.b=1', '--a.b=b']); },
    { message: 'Trying to set "b" key multiple times.' },
  );
});


// Subkeys

test('object with subkeys 1', snapshotMacro, ['--foo={}', ':a=2', ':b=[3,4]', ':c', ':!d']);

test('object with subkeys 2', snapshotMacro, ['--foo{}', ':a=2', ':b=[3,4]', ':c', ':!d']);

test('array with subkeys', snapshotMacro, ['--bar=[0,1]', ':[2]=2', ':[3]=[3,4]', ':[_][]', ':![_]']);

test('bare values with subkeys', snapshotMacro, ['--bar[]', '{}', ':a=2', ':b=[3,4]', '[5]', ':[_]', ':![_]']);

test('throw when using invalid array subkey', (t) => {
  t.throws(
    () => { handleArgs(['--foo[]', ':[]']); },
    { message: 'Some args can not be parsed: :[]' },
  );
});

test('throw when providing array subkeys for an object', (t) => {
  t.throws(
    () => { handleArgs(['--foo{}', ':[0]']); },
    { message: 'Some args can not be parsed: :[0]' },
  );
});

test('throw when providing object subkeys for an array', (t) => {
  t.throws(
    () => { handleArgs(['--foo[]', ':a']); },
    { message: 'Some args can not be parsed: :a' },
  );
});

test('throw when providing subkeys for a primitive value', (t) => {
  t.throws(
    () => { handleArgs(['--foo=bar', ':[2]=z']); },
    { message: 'Some args can not be parsed: :[2]=z' },
  );
});


// Nested subkeys

test('nested object subkeys', snapshotMacro, ['--foo{}', ':bar{}', '::baz{}', ':::qux', '::baz2', ':bar2{}']);

test('nested array subkeys', snapshotMacro, ['--foo=[a]', ':[1]=[bar]', '::[_][]', ':::[_]', '::[_]', ':[2]=b']);

test('mixed nested subkeys', snapshotMacro, ['--foo{}', ':bar[]', '::[_]{}', ':::baz']);

test('mixed nested subkeys 2', snapshotMacro, ['--foo[]', ':[_]={}', '::bar[]', ':::[_]=baz']);

test('nested subkeys in bare values array', snapshotMacro, ['--foo[]', '{}', ':a{}', '::b=[3,4]', ':c', '[5]', ':[_][]', '::![_]', 'd']);

test('nested subkeys in bare values array 2', snapshotMacro, ['--foo{}', ':bar[]', '{}', '::a{}', ':::b=[3,4]', '::c', '[5]', '::[_][]', ':::![_]', 'd']);

test('throw when subkey of wrong depth is used', (t) => {
  t.throws(
    () => { handleArgs(['--foo{}', '::bar']); },
    { message: 'Some args can not be parsed: ::bar' },
  );
});

test('throw when subkey of wrong depth is used 2', (t) => {
  t.throws(
    () => { handleArgs(['--foo[]', '::[0]']); },
    { message: 'Some args can not be parsed: ::[0]' },
  );
});

test('throw when subkey of wrong depth is used 3', (t) => {
  t.throws(
    () => { handleArgs(['--foo[]', '{}', '::bar']); },
    { message: 'Some args can not be parsed: ::bar' },
  );
});


// Automatic index

test('object subkeys inside auto-indexed array', snapshotMacro, ['--foo[_]{}', ':bar=1', '--foo[_]={}', ':bar=2', ':baz=3']);

test('array subkeys inside auto-indexed array', snapshotMacro, ['--foo[_][]', ':[_]=1', ':[_]=2', '--foo[_][]', ':[_]=3']);

test('nested auto-indexed arrays', snapshotMacro, ['--foo[_][_]=1', '--foo[_][_]=2', '--foo[_][_]=3', '--foo[_][_]=4']);
