/**
 * Builds the film wall on the travel page from scripts/reels.json.
 *
 *   npm run reels
 *
 * For every post it will, if the file isn't already there, fetch the post's
 * cover from Instagram and convert it to a ~480px WebP in assets/img/reels/.
 * It then reads the real pixel dimensions back out and writes, between the
 * markers in travel/index.html:
 *
 *   REELS      — the jump nav and the destination sections
 *   REELS-LD   — ImageObject structured data for every cover
 *
 * Adding a film is therefore: add an entry to reels.json, run this.
 *
 * Filenames come from the caption, not the post code, because the filename is
 * one of the things Google reads when deciding what an image shows —
 * `kristi-leka-the-great-wall.webp` earns more than `Dafs-quGVNb.webp`.
 * Rename a caption and the file is regenerated; the old one is pruned.
 *
 * Instagram's cover URLs are signed and short-lived, which is why the images
 * are downloaded and committed rather than hot-linked.
 */

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile, access, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'img', 'reels');
const pageFile = path.join(root, 'travel', 'index.html');

const SITE = 'https://kristileka.dev';
const PERSON = `${SITE}/#kristileka`;
const WIDTH = 480;
const PORTRAIT_WIDTH = 1080;
const PORTRAIT_FILE = 'kristi-leka-portrait.webp';

const exists = (p) => access(p).then(() => true, () => false);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugify = (s) => s
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function fetchCover(code) {
  const res = await fetch(`https://www.instagram.com/p/${code}/media/?size=l`, {
    headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${code}: cover fetch failed (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function encode(srcBuffer, dest, width) {
  const tmp = `${dest}.src`;
  await writeFile(tmp, srcBuffer);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', tmp, '-vf', `scale=${width}:-2`, '-quality', '80', dest]);
  await rm(tmp, { force: true });
}

async function dimensions(file) {
  const { stdout } = await run('ffprobe', ['-v', 'error', '-select_streams', 'v',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]);
  const [w, h] = stdout.trim().split(',').map(Number);
  return { w, h };
}

// --- load + validate -------------------------------------------------------

const groups = JSON.parse(await readFile(path.join(root, 'scripts', 'reels.json'), 'utf8'));
await mkdir(outDir, { recursive: true });

const seen = new Map();
const slugs = new Set();

for (const g of groups) {
  for (const p of g.posts) {
    if (seen.has(p.code)) {
      throw new Error(`${p.code} appears in both "${seen.get(p.code)}" and "${g.name}" — a post belongs to one section only`);
    }
    seen.set(p.code, g.name);

    p.slug = `${g.id}-${slugify(p.caption)}`;
    if (slugs.has(p.slug)) throw new Error(`duplicate filename "${p.slug}" — captions must be unique within a section`);
    slugs.add(p.slug);
  }
}

// --- fetch + encode --------------------------------------------------------

let fetched = 0;

for (const group of groups) {
  for (const post of group.posts) {
    const file = path.join(outDir, `${post.slug}.webp`);
    const needPortrait = post.portrait && !(await exists(path.join(root, 'assets', 'img', PORTRAIT_FILE)));

    if (!(await exists(file)) || needPortrait) {
      const buf = await fetchCover(post.code);
      if (!(await exists(file))) {
        await encode(buf, file, WIDTH);
        console.log(`  ${post.slug}.webp`);
        fetched++;
      }
      if (needPortrait) {
        // A larger copy for Person.image — search engines want more than 480px
        // for an entity portrait, and the grid does not need to carry the cost.
        await encode(buf, path.join(root, 'assets', 'img', PORTRAIT_FILE), PORTRAIT_WIDTH);
        console.log(`  ${PORTRAIT_FILE} (portrait for structured data)`);
      }
    }
    Object.assign(post, await dimensions(file));
  }
}

// --- prune orphans ---------------------------------------------------------

const keep = new Set([...slugs].map((s) => `${s}.webp`));
let pruned = 0;
for (const f of await readdir(outDir)) {
  if (f.endsWith('.webp') && !keep.has(f)) {
    await rm(path.join(outDir, f));
    console.log(`  pruned ${f}`);
    pruned++;
  }
}

// --- markup ----------------------------------------------------------------

const nav = groups.map((g) => `      <a href="#${g.id}">${esc(g.name)}</a>`).join('\n');

const sections = groups.map((group) => {
  const items = group.posts.map((post) => {
    const wide = post.w > post.h ? ' class="is-wide"' : '';
    const caption = post.sub
      ? `${esc(post.caption)}<em>${esc(post.sub)}</em>`
      : esc(post.caption);

    return `        <li${wide}>
          <a class="reel" href="https://www.instagram.com/p/${post.code}/"
             data-embed="${post.code}" data-title="${esc(post.caption)} — ${esc(group.name)}" rel="me noopener">
            <img src="/assets/img/reels/${post.slug}.webp" width="${post.w}" height="${post.h}"
                 loading="lazy" decoding="async" alt="${esc(post.alt)}">
            <span class="reel__badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13-.67-.66-1.34-1.08-2.13-1.38-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z"/></svg>
            </span>
            <span class="reel__caption">${caption}</span>
          </a>
        </li>`;
  }).join('\n');

  return `      <section class="place" id="${group.id}">
        <h2 class="place__name">${esc(group.name)}</h2>
        <p class="place__blurb">${esc(group.blurb)}</p>
        <ul class="reels">
${items}
        </ul>
      </section>`;
});

const block = `<!-- REELS:START -->
    <nav class="jump" aria-label="Destinations">
${nav}
    </nav>

${sections.join('\n\n')}
    <!-- REELS:END -->`;

// --- structured data -------------------------------------------------------
// Every cover described as an ImageObject, credited to the same Person node
// the rest of the site uses. This is the part that gives Google Images
// something to attach to a name rather than just a file.

const media = groups.flatMap((group) =>
  group.posts.map((post) => ({
    '@type': 'ImageObject',
    '@id': `${SITE}/travel/#${post.slug}`,
    contentUrl: `${SITE}/assets/img/reels/${post.slug}.webp`,
    url: `${SITE}/travel/#${group.id}`,
    name: post.sub ? `${post.caption} — ${post.sub}` : post.caption,
    description: post.alt,
    caption: post.alt,
    width: post.w,
    height: post.h,
    contentLocation: { '@type': 'Place', name: group.name },
    creator: { '@id': PERSON },
    copyrightHolder: { '@id': PERSON },
    creditText: 'Kristi Leka',
  })));

const ld = {
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  '@id': `${SITE}/travel/#gallery`,
  name: 'Backpacking, skiing and nature photography by Kristi Leka',
  isPartOf: { '@id': `${SITE}/travel/#page` },
  author: { '@id': PERSON },
  associatedMedia: media,
};

const ldBlock = `<!-- REELS-LD:START -->
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
<!-- REELS-LD:END -->`;

// --- write -----------------------------------------------------------------

let page = await readFile(pageFile, 'utf8');

for (const [name, replacement] of [['REELS', block], ['REELS-LD', ldBlock]]) {
  const start = `<!-- ${name}:START -->`;
  const end = `<!-- ${name}:END -->`;
  const a = page.indexOf(start);
  const b = page.indexOf(end);
  if (a === -1 || b === -1) throw new Error(`${name} markers not found in travel/index.html`);
  page = page.slice(0, a) + replacement + page.slice(b + end.length);
}

await writeFile(pageFile, page, 'utf8');

const total = groups.reduce((n, g) => n + g.posts.length, 0);
console.log(`\n${total} films across ${groups.length} sections` +
            ` — ${fetched} fetched, ${pruned} pruned`);
