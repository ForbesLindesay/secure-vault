import {sizeSnapshot} from 'rollup-plugin-size-snapshot';
import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import typescript from 'rollup-plugin-typescript2';
import pkg from '../../package.json';

export default {
  input: `${__dirname}/../../src/index.ts`,
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    },
  ],
  plugins: [
    commonjs(),
    nodeResolve(),
    alias({
      entries: [
        {find: './environment/index', replacement: './environment/browser'},
      ],
    }),
    typescript({
      typescript: require('typescript'),
    }),

    sizeSnapshot(),
  ],
};
