const { join } = require('path');

const resolve = require('rollup-plugin-node-resolve');
const sourcemaps = require('rollup-plugin-sourcemaps');

const globals = {
  '@angular/core': 'ng.core',
  rxjs: 'rxjs',
  'rxjs/operators': 'rxjs.operators',
  '@ngxs/store': 'ngxs.store'
};

const input = join(__dirname, 'dist/entity-state/fesm2015/ngxs-labs-entity-state.js');
const output = {
  file: join(__dirname, 'dist/entity-state/bundles/ngxs-labs-entity-state.umd.js'),
  name: 'ngxs-labs.entity-state',
  globals,
  format: 'umd',
  exports: 'named'
};

module.exports = {
  input,
  output,
  plugins: [resolve(), sourcemaps()],
  external: Object.keys(globals)
};
