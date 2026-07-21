/**
 * Builds the film wall on the travel page from scripts/reels.json.
 *
 *   npm run reels
 *
 * For every post it will, if the file isn't already there, fetch the post's
 * cover from Instagram and convert it to a ~480px WebP in assets/img/reels/.
 * It then reads the real pixel dimensions back out and writes the markup
 * between the REELS:START / REELS:END markers in travel/index.html.
 *
 * Adding a film is therefore: add an entry to reels.json, run this.
 *
 * Instagram's cover URLs are signed and short-lived, which is why the images
 * are downloaded and committed rather than hot-linked.
 */

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, access, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'img', 'reels');
const pageFile = path.join(root, 'travel', 'index.html');

const WIDTH = 480;
const START = '<!-- REELS:START -->';
const END = '<!-- REELS:END -->';

const exists = (p) => access(p).then(() => true, () => false);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function ensureCover(code, slug) {
  const webp = path.join(outDir, `${slug}.webp`);
  if (await exists(webp)) return webp;

  const url = `https://www.instagram.com/p/${code}/media/?size=l`;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${code}: cover fetch failed (HTTP ${res.status})`);

  const tmp = path.join(outDir, `${slug}.src`);
  await writeFile(tmp, Buffer.from(await res.arrayBuffer()));

  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', tmp, '-vf', `scale=${WIDTH}:-2`, '-quality', '78', webp]);

  await rm(tmp, { force: true });
  console.log(`  fetched ${slug}.webp`);
  return webp;
}

async function dimensions(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
  const [w, h] = stdout.trim().split(',').map(Number);
  return { w, h };
}

const groups = JSON.parse(await readFile(path.join(root, 'scripts', 'reels.json'), 'utf8'));
await mkdir(outDir, { recursive: true });

const nav = groups
  .map((g) => `      <a href="#${g.id}">${esc(g.name)}</a>`)
  .join('\n');

const sections = [];

for (const group of groups) {
  const items = [];

  for (const [i, post] of group.posts.entries()) {
    const slug = `${group.id}-${i + 1}`;
    const file = await ensureCover(post.code, slug);
    const { w, h } = await dimensions(file);

    const caption = post.sub
      ? `${esc(post.caption)}<em>${esc(post.sub)}</em>`
      : esc(post.caption);

    // Landscape covers span two columns rather than being cropped to portrait.
    const wide = w > h ? ' class="is-wide"' : '';

    items.push(
`        <li${wide}>
          <a class="reel" href="https://www.instagram.com/p/${post.code}/"
             data-embed="${post.code}" data-title="${esc(post.caption)} — ${esc(group.name)}" rel="me noopener">
            <img src="/assets/img/reels/${slug}.webp" width="${w}" height="${h}"
                 loading="lazy" decoding="async" alt="${esc(post.alt)}">
            <span class="reel__badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13-.67-.66-1.34-1.08-2.13-1.38-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"/></svg>
            </span>
            <span class="reel__caption">${caption}</span>
          </a>
        </li>`);
  }

  sections.push(
`      <section class="place" id="${group.id}">
        <h2 class="place__name">${esc(group.name)}</h2>
        <p class="place__blurb">${esc(group.blurb)}</p>
        <ul class="reels">
${items.join('\n')}
        </ul>
      </section>`);
}

const block = `${START}
    <nav class="jump" aria-label="Destinations">
${nav}
    </nav>

${sections.join('\n\n')}
    ${END}`;

const page = await readFile(pageFile, 'utf8');
const a = page.indexOf(START);
const b = page.indexOf(END);
if (a === -1 || b === -1) throw new Error('REELS markers not found in travel/index.html');

await writeFile(pageFile, page.slice(0, a) + block + page.slice(b + END.length), 'utf8');

const total = groups.reduce((n, g) => n + g.posts.length, 0);
console.log(`\nWrote ${total} films across ${groups.length} destinations into travel/index.html`);
