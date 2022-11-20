import test from 'ava';

import { argToToken } from '../src/key-token-parser';


const snapshotMacro = test.macro((t, input: string) => {
  t.snapshot(argToToken(input), '`' + input.replace(/`/g, '\\`') + '`');
});


// Keys

test('escape square bracket (not an array index)', snapshotMacro, '--foo\\[0]=1');

test('escape square bracket (not an array key)', snapshotMacro, '--foo\\[]');

test('escape curly bracket (not an object key)', snapshotMacro, '--foo\\{}');

test('escape a dot (not a nested key)', snapshotMacro, '--foo\\.bar=1');

test('escape the equals sign (not a key-value)', snapshotMacro, '--foo\\=1');

test('escape the exclamation mark (not a negation)', snapshotMacro, '--\\!foo');


// Value arrays

test('escape an array comma (part of a string entry)', snapshotMacro, '[foo\\,bar]');

test('escape an array closing bracket (part of a string entry)', snapshotMacro, '[foo\\]bar]');


// Quotes in quoted strings

test('escape double quote inside double quoted string', snapshotMacro, '"\\""');

test('escape single quote inside single quoted string', snapshotMacro, "'\\''");

test('escape back tick inside back tick quoted string', snapshotMacro, '`\\``');
