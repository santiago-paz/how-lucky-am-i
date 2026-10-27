// Bundle the three.js globe into one classic script, so the site needs no module loader and
// still opens from a plain static host. Output is committed: assets/js/globe3d.js.
import { build } from 'esbuild';

await build({
  entryPoints: ['assets/src/globe3d.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  outfile: 'assets/js/globe3d.js',
  legalComments: 'eof',
  banner: { js: '/* three.js (MIT) bundled with assets/src/globe3d.js. Rebuild with: npm run build:3d */' },
});
console.log('built assets/js/globe3d.js');
