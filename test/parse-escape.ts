import test from 'ava';

import { argToToken } from '../src/key-token-parser.ts';

export default { require: ['./_force-exit.ts'] };


const snapshotMacro = test.macro((t, input: string) => {
  t.snapshot(argToToken(input), '`' + input.replace(/`/g, '\\`') + '`');
});


// Keys

test('escape square bracket (not an array index)', snapshotMacro, '--foo\\[0]=1');

test('escape square bracket (not an array key)', snapshotMacro, '--foo\\[]');

test('escape curly bracket (not an object key)', snapshotMacro, '--foo\\{}');

test('escape a dot (not a nested key)', snapshotMacro, '--foo\\.bar=1');

test('escape the equals sign (not a key-value)', snapshotMacro, '--foo\\=1');

test('first exclamation mark is a negation when unescaped', snapshotMacro, '--!!!foo');

test('escape the first exclamation mark (not a negation)', snapshotMacro, '--\\!!!foo');

test('escape multiple exclamation marks (not a negation)', snapshotMacro, '--\\!!\\!foo');

test('dashes in a depth 0 key (no need to escape)', snapshotMacro, '----foo');

test('dashes in higher depth key (no need to escape)', snapshotMacro, '::--foo');

test('colons in a depth 0 key (no need to escape)', snapshotMacro, '--::foo');

test('escape first colon in higher depth key', snapshotMacro, '::\\::foo');

test('escape multiple colons in higher depth key', snapshotMacro, ':\\::\\:foo');


// Value arrays

test('escape an array comma (part of a string entry)', snapshotMacro, '[foo\\,bar]');

test('escape an array closing bracket (part of a string entry)', snapshotMacro, '[foo\\]bar]');


// Quotes in quoted strings

test('escape double quote inside double quoted string', snapshotMacro, '"\\""');

test('escape single quote inside single quoted string', snapshotMacro, "'\\''");

test('escape back tick inside back tick quoted string', snapshotMacro, '`\\``');
