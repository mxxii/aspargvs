import test from 'ava';

import { argToToken } from '../src/key-token-parser';


const snapshotMacro = test.macro((t, input: string) => {
  t.snapshot(argToToken(input), '`' + input.replace(/`/g, '\\`') + '`');
});


test('bare key ArgToken', snapshotMacro, '--foo');

test('negation ArgToken', snapshotMacro, '--!foo');

test('key=value ArgToken', snapshotMacro, '--foo=bar');

test('empty array key ArgToken', snapshotMacro, '--foo[]');

test('empty object key ArgToken', snapshotMacro, '--foo{}');

test('nested keys ArgToken', snapshotMacro, '--foo.bar.baz');

test('nested numeric keys ArgToken', snapshotMacro, '--0.1.2');

test('nested arrays ArgToken', snapshotMacro, '--foo[1][2].[3]');

test('nested array with auto index ArgToken', snapshotMacro, '--foo[_]');


// Empty string keys

test('empty string key ArgToken', snapshotMacro, '--');

test('nested empty string key ArgToken', snapshotMacro, '--...');

test('empty string array key ArgToken', snapshotMacro, '--[]');

test('nested empty string array key ArgToken', snapshotMacro, '--.[]');

test('array index in empty string key ArgToken 1', snapshotMacro, '--[1]');

test('array index in empty string key ArgToken 2', snapshotMacro, '--.[1]');


// Negation combinations

test('nested key with negation ArgToken', snapshotMacro, '--!foo.bar.baz');

test('nested array with negation ArgToken', snapshotMacro, '--!foo.[1][2]');

test('empty string key with negation ArgToken', snapshotMacro, '--!');


// Subkey ArgToken

test('bare subkey ArgToken', snapshotMacro, ':foo');

test('empty string subkey ArgToken', snapshotMacro, ':');

test('nested array with negation subkey ArgToken', snapshotMacro, ':![1].foo.[2]');

test('nested array with auto index subkey ArgToken', snapshotMacro, ':[_][_].[_][]');

test('array index in empty string subkey ArgToken', snapshotMacro, ':.[1]');
