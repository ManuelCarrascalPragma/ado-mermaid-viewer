import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { join } from 'path';

const isWatch = process.argv.includes('--watch');
const isMinify = process.argv.includes('--minify');

const outdir = join('dist');

if (!existsSync(outdir)) {
  mkdirSync(outdir, { recursive: true });
}

async function buildAll() {
  try {
    // Build background script
    await build({
      entryPoints: ['src/background/index.js'],
      outfile: join(outdir, 'background.js'),
      bundle: true,
      format: 'esm',
      target: 'chrome100',
      minify: isMinify,
      sourcemap: !isMinify,
    });

    // Build content script
    await build({
      entryPoints: ['src/content/index.js'],
      outfile: join(outdir, 'content.js'),
      bundle: true,
      format: 'esm',
      target: 'chrome100',
      minify: isMinify,
      sourcemap: !isMinify,
    });

    // Copy static assets
    copyFileSync('styles/main.css', join(outdir, 'styles.css'));
    copyFileSync('manifest.json', join(outdir, 'manifest.json'));

    // Copy lib folder
    const libSrc = join('lib');
    const libDest = join(outdir, 'lib');
    if (!existsSync(libDest)) {
      mkdirSync(libDest, { recursive: true });
    }
    cpSync(libSrc, libDest, { recursive: true });

    // Copy icons
    ['icon16.png', 'icon48.png', 'icon128.png', 'icon.svg'].forEach(icon => {
      copyFileSync(icon, join(outdir, icon));
    });

    console.log(`Build ${isMinify ? 'production' : 'development'} complete`);
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

if (isWatch) {
  // Watch mode handled by esbuild's watch API
  build({
    entryPoints: ['src/background/index.js', 'src/content/index.js'],
    outdir,
    bundle: true,
    format: 'esm',
    target: 'chrome100',
    sourcemap: true,
  }).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  await buildAll();
}