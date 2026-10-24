import { mkdir, copyFile } from 'node:fs/promises';
import { build } from 'esbuild';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js']) await copyFile(file, `dist/${file}`);
await build({ entryPoints: ['voice.js'], bundle: true, format: 'esm', outfile: 'dist/voice.bundle.js', minify: true });
