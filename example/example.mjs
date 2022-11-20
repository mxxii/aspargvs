import { inspect } from 'util';
import deepmerge from 'deepmerge';

import { handleArgv } from '../lib/aspargvs.mjs';

// console.log('process.argv:');
// process.argv.forEach((val, index) => {
//   console.log(`  [${String(index).padStart(3)}] ${val}`);
// });

// https://gist.github.com/nblackburn/875e6ff75bc8ce171c758bf75f304707#gistcomment-3677597
const camelToKebabCase = (str) => str
  .replace(/\B([A-Z])(?=[a-z])/g, '-$1')
  .replace(/\B([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase();

const kebabToCamelCase = (str) => str.replace(/-./g, x=>x[1].toUpperCase());

handleArgv({
  handlers: {
    help: true,
    unparse: true,
    inspect: true,
    json: businessLogic,
    merge: (acc, next) => deepmerge(acc, next),
    key: kebabToCamelCase,
    unkey: camelToKebabCase,
    bin: () => 'example',
    version: () => 'Version 0.1.0',
  },
  presets: {
    'foo': {
      description: 'The Foo',
      json: {
        foo: 'foo',
        barArray: [ 'bar', [] ]
      }
    }
  }
});

function businessLogic (optionsObject) {
  console.log('Options parsed from args:');
  console.log(inspect(optionsObject, { breakLength: 40 }));
}
