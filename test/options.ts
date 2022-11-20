import test from 'ava';
import deepmerge from 'deepmerge';
import { stdout } from 'test-console';

import { handleArgs, Options } from '../src/aspargvs';


const outputSnapshotMacro = test.macro((t, args: string[], options: Options) => {
  const inspect = stdout.inspect();
  handleArgs(args, options);
  inspect.restore();
  t.snapshot(inspect.output, '`' + args.join(' ') + '`');
});

const kebabToSnakeCase = (str: string) => str.replace(/-/g, '_');

const snakeToKebabCase = (str: string) => str.replace(/_/g, '-');


test('throw when key is separate from value', t => {
  t.throws(
    () => {
      handleArgs(
        ['--foo', 'bar'],
        { handlers: { json: () => { t.fail('This code must not be reached in this test.'); } } }
      );
    },
    { message: 'Some args can not be parsed: bar' }
  );
});


test(
  'modify parsed keys with key handler',
  outputSnapshotMacro,
  ['inspect', '--a-b-c', '---', '--a-b.c-d'],
  { handlers: {
    key: kebabToSnakeCase,
    inspect: true,
    json: () => { console.log('This code must not be reached in this test.'); }
  } }
);

test(
  'modify unparsed keys with unkey handler',
  outputSnapshotMacro,
  ['unparse', '--a-b-c', '---', '--a-b.c-d'],
  { handlers: {
    unkey: kebabToSnakeCase,
    unparse: true,
    json: () => { console.log('This code must not be reached in this test.'); }
  } }
);

test(
  'modify parsed and unparsed keys',
  outputSnapshotMacro,
  ['unparse', '--a-b-c', '---', '--a-b.c-d'],
  { handlers: {
    key: kebabToSnakeCase,
    unkey: snakeToKebabCase,
    unparse: true,
    json: () => { console.log('This code must not be reached in this test.'); }
  } }
);


test(
  'custom merge',
  outputSnapshotMacro,
  ['json', './test/files/sample1.json', 'preset', 'foo', '--d[]', 'baz'],
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
  { handlers: { json: (json) => JSON.stringify(json), merge: (acc, next) => deepmerge(acc, next, { arrayMerge: (destinationArray, sourceArray) => [...sourceArray, ...destinationArray] }) }, presets: { foo: { description: 'Foo', json: { c: [3,4,5], d: ['bar'] } } } }
);
