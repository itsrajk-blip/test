import { mkdir, copyFile, cp } from 'node:fs/promises';
import { build } from 'esbuild';
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js', 'chat.js']) await copyFile(file, `dist/${file}`);
await build({ entryPoints: ['voice.js'], bundle: true, format: 'esm', outfile: 'dist/voice.bundle.js', minify: true });
