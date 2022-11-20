import typescript from '@rollup/plugin-typescript';

export default {
  external: ['deepmerge', 'peberminta', 'peberminta/char', 'fs', 'util'],
  input: 'src/aspargvs.ts',
  plugins: [typescript()],
  output: [
    {
      dir: 'lib',
      format: 'es',
      entryFileNames: '[name].mjs',
    },
    {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].cjs',
    },
  ],
};
