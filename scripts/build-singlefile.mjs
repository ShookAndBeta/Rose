import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = new URL('../dist/', import.meta.url);
const assetsDir = new URL('./assets/', distDir);

const assets = await readdir(assetsDir);
const jsName = assets.find((name) => name.endsWith('.js'));
const cssName = assets.find((name) => name.endsWith('.css'));

if (!jsName || !cssName) {
  throw new Error('Vite output is missing its JavaScript or CSS asset.');
}

const [template, javascript, css] = await Promise.all([
  readFile(new URL('./index.html', distDir), 'utf8'),
  readFile(join(fileURLToPath(assetsDir), jsName), 'utf8'),
  readFile(join(fileURLToPath(assetsDir), cssName), 'utf8')
]);

const html = template
  .replace(
    /\s*<script type="module" crossorigin src="[^"]+"><\/script>/,
    `\n  <script type="module">\n${javascript.replaceAll('</script>', '<\\/script>')}\n  </script>`
  )
  .replace(
    /\s*<link rel="stylesheet" crossorigin href="[^"]+">/,
    `\n  <style>\n${css}\n  </style>`
  );

await writeFile(
  new URL('./particle-rose.html', distDir),
  html,
  'utf8'
);

console.log('Created dist/particle-rose.html');
