import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import typescript from 'rollup-plugin-typescript2';
import pkg from '../../package.json';

export default {
  input: `${__dirname}/../../src/index.ts`,
  output: [
    {
      file: pkg.exports['.'][0].require,
      format: 'cjs',
    },
    {
      file: pkg.exports['.'][0].import,
      format: 'es',
    },
  ],
  external: ['crypto'],
  plugins: [
    commonjs(),
    nodeResolve(),
    alias({
      entries: [
        {find: './environment/index', replacement: './environment/server'},
      ],
    }),
    typescript({
      typescript: require('typescript'),
    }),
  ],
};
