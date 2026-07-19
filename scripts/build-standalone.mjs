import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

async function buildSingleEntry(pageName, outputDirectory) {
  await viteBuild({
    configFile: false,
    root,
    base: './',
    logLevel: 'warn',
    build: {
      outDir: outputDirectory,
      emptyOutDir: true,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        input: path.join(root, pageName),
        output: {
          codeSplitting: false,
          entryFileNames: 'assets/app.js',
          assetFileNames: 'assets/[name][extname]',
        },
      },
    },
  });
}

async function inlinePage(pageName, outputName, buildDirectory) {
let html = await fs.readFile(path.join(buildDirectory, pageName), 'utf8');

const scriptMatch = html.match(/<script type="module" crossorigin src="\.\/assets\/([^"]+)"><\/script>/);
const styleMatch = html.match(/<link rel="stylesheet" crossorigin href="\.\/assets\/([^"]+)">/);
if (!scriptMatch || !styleMatch) throw new Error(`Built JavaScript or CSS asset was not found in dist/${pageName}.`);

const [javascript, stylesheet] = await Promise.all([
  fs.readFile(path.join(buildDirectory, 'assets', scriptMatch[1]), 'utf8'),
  fs.readFile(path.join(buildDirectory, 'assets', styleMatch[1]), 'utf8'),
]);

const storageShim = `<script>
window.__SELF_SEALING_STANDALONE__ = true;
try {
  localStorage.setItem('__tower_test', '1');
  localStorage.removeItem('__tower_test');
} catch (error) {
  const memoryStore = new Map();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key) => memoryStore.has(key) ? memoryStore.get(key) : null,
      setItem: (key, value) => memoryStore.set(key, String(value)),
      removeItem: (key) => memoryStore.delete(key),
      clear: () => memoryStore.clear(),
    },
  });
}
</script>`;

html = html
  .replace(styleMatch[0], () => `<style>${stylesheet.replaceAll('</style', '<\\/style')}</style>`)
  .replace(scriptMatch[0], () => `${storageShim}\n<script type="module">${javascript.replaceAll('</script', '<\\/script')}</script>`)
  .replace(/\s*<link rel="manifest"[^>]+>/, '')
  .replace(/\s*<link rel="icon"[^>]+>/, '')
  .replace(/\s*<link rel="apple-touch-icon"[^>]+>/, '')
  .replace(/\s*<link rel="modulepreload"[^>]+>/g, '');

const unresolvedAssetReference = html.match(/(?:src|href)=["']\.\/assets\/[^"']+["']/);
const unresolvedModuleImport = html.match(/(?:from\s*|import\s*\()["']\.\/[^"']+\.js["']/);
if (unresolvedAssetReference || unresolvedModuleImport) {
  throw new Error(`Standalone ${pageName} still contains an external build dependency.`);
}

await Promise.all([fs.writeFile(path.join(root, outputName), html), fs.writeFile(path.join(dist, outputName), html)]);
return html;
}

const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'self-sealing-standalone-'));

try {
  const towerBuild = path.join(temporaryRoot, 'tower');
  const cityBuild = path.join(temporaryRoot, 'city');
  await buildSingleEntry('index.html', towerBuild);
  await buildSingleEntry('city.html', cityBuild);

  const [towerHtml, cityHtml] = await Promise.all([
    inlinePage('index.html', 'standalone-mobile.html', towerBuild),
    inlinePage('city.html', 'standalone-city.html', cityBuild),
  ]);
  console.log(`Standalone tower: ${(Buffer.byteLength(towerHtml) / 1024).toFixed(1)} KiB; city: ${(Buffer.byteLength(cityHtml) / 1024).toFixed(1)} KiB`);
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
