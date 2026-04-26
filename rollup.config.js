import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import del from 'rollup-plugin-delete';
import { dts } from 'rollup-plugin-dts';

const external = [
  'deepmerge',
  'peberminta',
  'peberminta/char',
  'node:fs',
  'node:util',
];

export default [
  {
    external: external,
    input: 'src/aspargvs.ts',
    plugins: [
      typescript(),
      cleanup({ extensions: ['ts'] }),
    ],
    output: [
      {
        format: 'es',
        file: 'lib/aspargvs.mjs',
      },
      {
        format: 'cjs',
        file: 'lib/aspargvs.cjs',
      },
    ],
  },
  {
    external: external,
    input: 'src/aspargvs.ts',
    plugins: [
      dts(),
      del({ targets: 'lib/*.d.ts', hook: 'writeBundle', verbose: true }),
    ],
    output: [
      {
        format: 'es',
        file: 'lib/aspargvs.d.mts',
      },
      {
        format: 'cjs',
        file: 'lib/aspargvs.d.cts',
      },
    ],
  },
];
