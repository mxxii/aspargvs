import test from 'ava';

import { argToToken } from '../src/key-token-parser';


const snapshotMacro = test.macro((t, input: string) => {
  t.snapshot(argToToken(input), '`' + input.replace(/`/g, '\\`') + '`');
});


test('null ArgToken', snapshotMacro, 'null');

test('true ArgToken', snapshotMacro, 'true');

test('false ArgToken', snapshotMacro, 'false');

test('string ArgToken', snapshotMacro, 'foo');

test('empty object ArgToken', snapshotMacro, '{}');


// Numbers

test('integer number ArgToken', snapshotMacro, '1');

test('float number ArgToken', snapshotMacro, '2.0');

test('signed float number ArgToken', snapshotMacro, '-3.14');

test('number in exponential format ArgToken', snapshotMacro, '4.5e+6');


// Arrays

test('empty array ArgToken', snapshotMacro, '[]');

test('nested arrays ArgToken', snapshotMacro, '[[],[[]]]');

test('arrays with values ArgToken', snapshotMacro, '[null,true,false,{},1.23,foo]');

test('spaces inside array ArgToken', snapshotMacro, '[ ,, 1 ,  true, {}, [\\] ]');


// Quoted string values

test('double quoted string ArgToken', snapshotMacro, '"foo"');

test('single quoted string ArgToken', snapshotMacro, "'foo'");

test('back tick quoted string ArgToken', snapshotMacro, '`foo`');


// Empty string values

test('empty string ArgToken', snapshotMacro, '');

test('double quoted empty string ArgToken', snapshotMacro, '""');

test('single quoted empty string ArgToken', snapshotMacro, "''");

test('back tick quoted empty string ArgToken', snapshotMacro, '``');

test('double quoted empty string in array ArgToken', snapshotMacro, '[""]');

test('single quoted empty string in array ArgToken', snapshotMacro, "['']");

test('back tick quoted empty string in array ArgToken', snapshotMacro, '[``]');
