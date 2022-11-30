import test from 'ava';
import deepmerge from 'deepmerge';
import { stdout } from 'test-console';

import { handleArgs, JsonObject, Options } from '../src/aspargvs';


const outputSnapshotMacro = test.macro((t, args: string[], options: Options) => {
  const inspect = stdout.inspect();
  handleArgs(args, options);
  inspect.restore();
  t.snapshot(inspect.output, '`' + args.join(' ') + '`');
});

const presets: Options['presets'] = {
  foo: { description: 'Foo', json: { a: true } },
  bar: { description: 'Bar', json: { b: 1, c: [1] } },
  baz: { description: 'Baz', json: { b: 2, c: [2] } },
};

const merge: (acc: JsonObject, next: JsonObject) => JsonObject
  = (acc, next) => deepmerge(acc, next);


// version

test('throw when used version command without handler', t => {
  t.throws(
    () => { handleArgs(
      ['version'],
      { handlers: { json: () => { console.log('This code must not be reached in this test.'); } } }
    ); },
    { message: `Some args can not be parsed: version` }
  );
});

test(
  'version command',
  outputSnapshotMacro,
  ['version'],
  { handlers: { version: () => 'v1', json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'version command with own output',
  outputSnapshotMacro,
  ['version'],
  { handlers: { version: () => { console.log('v1'); }, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'version command - short alias',
  outputSnapshotMacro,
  ['-v'],
  { handlers: { version: () => 'v1', json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'version command - common alias',
  outputSnapshotMacro,
  ['--version'],
  { handlers: { version: () => 'v1', json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'version alias without handler',
  outputSnapshotMacro,
  ['--version'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); } } }
);


// help

test('throw when used help command without handler', t => {
  t.throws(
    () => { handleArgs(
      ['help'],
      { handlers: { json: () => { console.log('This code must not be reached in this test.'); } } }
    ); },
    { message: `Some args can not be parsed: help` }
  );
});

test(
  'help command',
  outputSnapshotMacro,
  ['help'],
  { handlers: { help: () => 'help placeholder', json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'help command - short alias',
  outputSnapshotMacro,
  ['-h'],
  { handlers: { help: () => 'help placeholder', json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'help command - common alias',
  outputSnapshotMacro,
  ['--help'],
  { handlers: { help: () => 'help placeholder', json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'help alias without handler',
  outputSnapshotMacro,
  ['--help'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge } }
);

test(
  'help command - with own output',
  outputSnapshotMacro,
  ['help'],
  { handlers: { help: () => { console.log('help placeholder'); }, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'help command - default handler, no merge handler',
  outputSnapshotMacro,
  ['help'],
  { handlers: { help: true, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'help command - pass-through handler, bin, version, inspect, unparse, presets',
  outputSnapshotMacro,
  ['help'],
  { handlers: {
    bin: () => 'example',
    version: () => 'v1',
    help: (help) => help,
    json: () => { console.log('This code must not be reached in this test.'); },
    merge: merge,
    inspect: {},
    unparse: true
  }, presets: presets }
);


// preset

test('throw when used preset command without presets', t => {
  t.throws(
    () => { handleArgs(
      ['preset', 'foo'],
      { handlers: { json: () => { console.log('This code must not be reached in this test.'); }, merge: merge } }
    ); },
    { message: `Some args can not be parsed: preset foo` }
  );
});

test('throw when used preset command without merge handler', t => {
  t.throws(
    () => { handleArgs(
      ['preset', 'foo'],
      { handlers: { json: () => { console.log('This code must not be reached in this test.'); } }, presets: presets }
    ); },
    { message: `Can't use 'json' or 'preset' command without supplying 'merge' handler.` }
  );
});

test(
  'preset command',
  outputSnapshotMacro,
  ['preset', 'foo'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge }, presets: presets }
);

test(
  'preset command - short alias',
  outputSnapshotMacro,
  ['-p', 'foo'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge }, presets: presets }
);

test(
  'preset command - multiple presets',
  outputSnapshotMacro,
  ['preset', 'foo', '-p', 'bar', 'preset', 'baz', '--b=3', '--d'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge }, presets: presets }
);


// json

test('throw when no json handler', t => {
  t.throws(
    () => { handleArgs([], { handlers: { merge: merge } }); },
    { message: `What to do with parsed args JSON object? 'json' handler is not specified.` }
  );
});

test('throw when used json command with no merge handler', t => {
  t.throws(
    () => { handleArgs([], { handlers: { } }); },
    { message: `What to do with parsed args JSON object? 'json' handler is not specified.` }
  );
});

test(
  'json command',
  outputSnapshotMacro,
  ['json', './test/files/sample1.json'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge } }
);

test(
  'json command - short alias',
  outputSnapshotMacro,
  ['-j', './test/files/sample1.json'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge } }
);

test(
  'json command - multiple files',
  outputSnapshotMacro,
  ['-j', './test/files/sample1.json', '-j', './test/files/sample2.json', '--b=3', '--e'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge } }
);


// json and preset together

test(
  'json and preset - test 1',
  outputSnapshotMacro,
  ['-j', './test/files/sample1.json', '-p', 'baz'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge }, presets: presets }
);

test(
  'json and preset - test 2',
  outputSnapshotMacro,
  ['-p', 'baz', '-j', './test/files/sample1.json'],
  { handlers: { json: (json) => { console.log(JSON.stringify(json)); }, merge: merge }, presets: presets }
);


// inspect

test('throw when used inspect command without handler', t => {
  t.throws(
    () => { handleArgs(
      ['inspect', '--foo=bar'],
      { handlers: { json: () => { console.log('This code must not be reached in this test.'); } } }
    ); },
    { message: `Some args can not be parsed: inspect --foo=bar` }
  );
});

test(
  'inspect command - default implementation',
  outputSnapshotMacro,
  ['inspect', '--foo=bar'],
  { handlers: { inspect: {}, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'inspect command - short alias',
  outputSnapshotMacro,
  ['-i', '--foo=bar'],
  { handlers: { inspect: {}, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'inspect command - deeply nested object - no depth specified',
  outputSnapshotMacro,
  ['inspect', '--a.b.c.d.e.f.g.h'],
  { handlers: { inspect: {}, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'inspect command - deeply nested object - depth = 5',
  outputSnapshotMacro,
  ['inspect', '--a.b.c.d.e.f.g.h'],
  { handlers: { inspect: { depth: 5 }, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'inspect command - own handler',
  outputSnapshotMacro,
  ['inspect', '--foo=bar'],
  { handlers: { inspect: (json) => JSON.stringify(json), json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'inspect command - own handler, own output',
  outputSnapshotMacro,
  ['inspect', '--foo=bar'],
  { handlers: { inspect: (json) => { console.log(JSON.stringify(json)); }, json: () => { console.log('This code must not be reached in this test.'); } } }
);


// unparse

test('throw when used unparse command without handler', t => {
  t.throws(
    () => { handleArgs(
      ['unparse', '--foo=bar', '--baz'],
      { handlers: { json: () => { console.log('This code must not be reached in this test.'); } } }
    ); },
    { message: `Some args can not be parsed: unparse --foo=bar --baz` }
  );
});

test(
  'unparse command - default implementation',
  outputSnapshotMacro,
  ['unparse', '--foo=bar', '--baz'],
  { handlers: { unparse: true, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'unparse command - short alias',
  outputSnapshotMacro,
  ['-u', '--foo=bar', '--baz'],
  { handlers: { unparse: true, json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'unparse command - own handler',
  outputSnapshotMacro,
  ['unparse', '--foo=bar', '--baz'],
  { handlers: { unparse: (args) => args.join(';;'), json: () => { console.log('This code must not be reached in this test.'); } } }
);

test(
  'unparse command - own handler, own output',
  outputSnapshotMacro,
  ['unparse', '--foo=bar', '--baz'],
  { handlers: { unparse: (args) => { console.log(args.join(';;')); }, json: () => { console.log('This code must not be reached in this test.'); } } }
);


// Not commands

test(
  'command-like arguments after first key argument',
  outputSnapshotMacro,
  ['--foo[]', 'json', 'help', 'inspect', 'unparse', '-j', '-h', '-i', '-u'],
  { handlers: {
    json: (json) => {
      console.log('Business logic start.');
      console.log(JSON.stringify(json));
      console.log('Business logic end.');
    },
    help: true,
    inspect: {},
    unparse: true
  } }
);
