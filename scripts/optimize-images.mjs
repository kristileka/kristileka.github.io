/**
 * Turns full-size photos into web-ready derivatives.
 *
 *   1. drop originals into  assets/img/gallery/_originals/
 *   2. npm install                (once — pulls in sharp)
 *   3. npm run images
 *
 * Writes <name>-800.webp and <name>-1600.webp next to the gallery, strips EXIF
 * (which includes GPS coordinates from most drones and phones), and prints the
 * <figure> block to paste into travel/index.html.
 *
 * Originals stay in _originals/ and are git-ignored — keep them somewhere safe.
 */

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'assets', 'img', 'gallery', '_originals');
const outDir = path.join(root, 'assets', 'img', 'gallery');

const WIDTHS = [800, 1600];
const QUALITY = 82;

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error('sharp is not installed. Run:  npm install\n');
  process.exit(1);
}

if (!existsSync(srcDir)) {
  await mkdir(srcDir, { recursive: true });
  console.log(`Created ${path.relative(root, srcDir)} — put your full-size photos there and re-run.`);
  process.exit(0);
}

const files = (await readdir(srcDir)).filter((f) => /\.(jpe?g|png|tiff?|webp)$/i.test(f));

if (files.length === 0) {
  console.log(`No images found in ${path.relative(root, srcDir)}.`);
  process.exit(0);
}

const snippets = [];

for (const file of files) {
  const slug = path
    .basename(file, path.extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const image = sharp(path.join(srcDir, file), { failOn: 'none' }).rotate();
  const { width: srcW, height: srcH } = await image.metadata();

  let largest = { w: 0, h: 0 };

  for (const w of WIDTHS) {
    if (srcW < w && w !== WIDTHS[0]) continue; // don't upscale
    const target = Math.min(w, srcW);
    const out = path.join(outDir, `${slug}-${w}.webp`);

    await image
      .clone()
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out);

    const h = Math.round((srcH / srcW) * target);
    if (target > largest.w) largest = { w: target, h };
    console.log(`  ${path.relative(root, out)}  (${target}px)`);
  }

  snippets.push(
    `      <figure class="shot">\n` +
    `        <img src="/assets/img/gallery/${slug}-1600.webp"\n` +
    `             srcset="/assets/img/gallery/${slug}-800.webp 800w,\n` +
    `                     /assets/img/gallery/${slug}-1600.webp 1600w"\n` +
    `             sizes="(max-width: 640px) 100vw, 33vw"\n` +
    `             width="${largest.w}" height="${largest.h}" loading="lazy" decoding="async"\n` +
    `             alt="TODO describe the place and what is in frame">\n` +
    `        <button class="shot__btn" type="button"><span class="visually-hidden">Open full size</span></button>\n` +
    `        <figcaption><b>TODO place</b><span>TODO country — TODO year</span></figcaption>\n` +
    `      </figure>`
  );
}

const snippetFile = path.join(outDir, '_snippets.html');
await writeFile(snippetFile, snippets.join('\n\n') + '\n', 'utf8');

console.log(`\nDone — ${files.length} image(s) processed.`);
console.log(`Paste-ready markup written to ${path.relative(root, snippetFile)}`);
console.log('Fill in the alt text and captions, then drop the blocks into travel/index.html.');
