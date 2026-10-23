import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/src/assets', { recursive: true });
await mkdir('dist/src/vendor', { recursive: true });

await Promise.all([
  cp('index.html', 'dist/index.html'),
  cp('README.md', 'dist/README.md'),
  cp('src/app.js', 'dist/src/app.js'),
  cp('src/styles.css', 'dist/src/styles.css'),
  cp('src/vendor/pdf-lib.min.js', 'dist/src/vendor/pdf-lib.min.js'),
  cp('src/assets/template-pdf-data.js', 'dist/src/assets/template-pdf-data.js'),
  cp('src/assets/template-village.png', 'dist/src/assets/template-village.png'),
  cp('src/assets/template-city.png', 'dist/src/assets/template-city.png')
]);

console.log('Static site packaged in dist/');
