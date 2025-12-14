// rollup.config.mjs
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';



const baseConfig = {
  treeshake: false,
  plugins: [nodeResolve(), commonjs()],
};

export default [
  // Combined bundle containing both plugins
  {
    input: 'plugins/customAnimation/src/main.js',
    output: {
      file: 'plugins/customAnimation/dist/customAnimation.plugin.js',
      format: 'iife',                
      name: 'CustomAnimationPlugin',
    },
    ...baseConfig,
  },

  // generateCustomAnim plugin
  {
    input: 'plugins/generateCustomAnim/src/main.js',
    output: {
      file: 'plugins/generateCustomAnim/dist/generateCustomAnim.plugin.js',
      format: 'iife',
      name: 'GenerateCustomAnimPlugin',
    },
    ...baseConfig,
  },

  //allPlugins
  {
    input: 'plugins/allPlugins/src/main.js',
    output: {
      file: 'plugins/allPlugins/dist/allPlugins.plugin.js',
      format: 'iife',
      name: 'DrawioCustomPlugins',
    },
    ...baseConfig,
  },

  //parser plugin
  {
    input: 'plugins/ParserPlugin/src/main.js',
    output: {
      file: 'plugins/ParserPlugin/dist/parserPlugin.plugin.js',
      format: 'iife',
      name: 'ParserCustomPlugins',
    },
    ...baseConfig,
  },
];
