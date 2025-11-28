// rollup.config.mjs

const baseConfig = {
  treeshake: false, 
};

export default [
  // customAnimation plugin
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
];
