# kristileka.github.io

Personal site — a work page and a travel page. Static HTML, no build step, no framework.
Everything is hand-editable.

```
index.html            work: Viaduct and GraphDSL (the SEO centrepiece)
travel/index.html     28 films across 8 destinations
404.html
assets/css/main.css   design system — all pages share it
assets/js/main.js     lightbox + Instagram embed loader (~50 lines)
assets/img/reels/     self-hosted cover images (generated)
assets/img/gallery/   photographs (empty until you add some)
sitemap.xml, robots.txt, site.webmanifest
scripts/reels.json    the film wall: destinations, captions, alt text
scripts/build-reels.mjs   regenerates the wall — `npm run reels`
scripts/optimize-images.mjs   photo pipeline — `npm run images`
```

---

## 1. Outstanding

Nothing is broken and no placeholder links ship. What would still improve it:

| What | Where | Notes |
|---|---|---|
| Specific landmark names | `scripts/reels.json` | captions are descriptive but generic — see below |
| Photographs | `travel/index.html` | see section 4 |

Several films are of named places I chose not to guess at. The Faroes sea stack with the
arch, the Madeira ridge stairs, the Iceland canyon — naming those in the caption and alt
text would pull in searches for the landmark itself, not just for you. Edit `reels.json`
and run `npm run reels`; the wall regenerates in place.

Everything else comes from your CV and the two repositories. The prose is a draft in your
voice; read it once and make it sound like you.

The homepage is deliberately short — it exists to point at Viaduct and GraphDSL, and
nothing competes with them. There is no employment history, no metrics wall and no skills
grid; the CV covers those, and no employer or client is named anywhere on the site. The
full detail still ships in the JSON-LD, which search engines read and visitors never see.

Everything else comes from your CV and the two repositories. The prose is a draft in your
voice; read it once and make it sound like you.

The homepage is deliberately short — it exists to point at Viaduct and GraphDSL, and
nothing competes with them. There is no employment history, no metrics wall and no skills
grid; the CV covers those, and no employer or client is named anywhere on the site. The
full detail still ships in the JSON-LD, which search engines read and visitors never see.

---

## 2. Deploy

The repo name `kristileka.github.io` means GitHub Pages serves it at the root of your
account — no `gh-pages` branch, no config.

```bash
git init
git add .
git commit -m "Personal site"
git branch -M main
git remote add origin https://github.com/kristileka/kristileka.github.io.git
git push -u origin main
```

Then **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch
`main`, folder `/ (root)`. Live within a minute or two at `https://kristileka.github.io`.

To preview locally: `npm run serve`, then open `http://localhost:3000`. Use a server
rather than opening the file directly — the absolute paths (`/assets/...`) need one.

---

## 3. Custom domain

**Buy `kristileka.dev.`** Reasons: `.dev` is on the HSTS preload list so it is
HTTPS-only by design, it reads unambiguously as an engineer's domain, and it is a real
gTLD rather than a repurposed country code. `.tech` is fine but noisier and usually has a
steep renewal price after the first year — check year-two pricing before committing.
Registrar: Cloudflare Registrar sells at cost with no upsells; Porkbun is the next best.

Don't bother buying misspellings. One domain, used consistently everywhere, is what
builds the signal.

**DNS** — at your registrar, for the apex `kristileka.dev`:

```
A     @   185.199.108.153
A     @   185.199.109.153
A     @   185.199.110.153
A     @   185.199.111.153
AAAA  @   2606:50c0:8000::153
AAAA  @   2606:50c0:8001::153
AAAA  @   2606:50c0:8002::153
AAAA  @   2606:50c0:8003::153
CNAME www kristileka.github.io.
```

If you use Cloudflare DNS, set those records to **DNS only** (grey cloud), not proxied —
proxying breaks GitHub's certificate provisioning.

**Then, in the repo:**

```bash
mv CNAME.example CNAME     # contains: kristileka.dev
```

Commit and push, set the same domain under Settings → Pages → Custom domain, and tick
**Enforce HTTPS** once the certificate is issued (usually under an hour).

**Finally, update the URLs in the markup.** Every canonical, `og:url`, sitemap entry and
JSON-LD `@id` currently points at `kristileka.github.io`. Leaving them stale after the
move splits your ranking signal across two hostnames. From the repo root:

```bash
grep -rl "kristileka.github.io" --include="*.html" --include="*.xml" --include="*.txt" --include="*.webmanifest" . \
  | xargs sed -i 's|https://kristileka\.github\.io|https://kristileka.dev|g'
```

GitHub keeps `kristileka.github.io` redirecting to the custom domain afterwards, so old
links stay alive and the redirect passes ranking through.

---

## 4. Photos — hosting and quality

**Recommendation: commit optimised photos to this repo.** Not a third-party CDN.

The reason is specifically about search. Images served from your own domain, with
descriptive filenames and real alt text, are what get you into Google Images under your
own name — and image results are a large share of how a personal name query gets
answered. An image on `cdn.somebody-else.com` earns that host the signal, not you.
GitHub Pages gives you a soft 1 GB repo limit and 100 GB/month of bandwidth, which is far
more than a personal gallery of properly compressed photos will ever use.

Optimise before committing — never commit a 12 MB drone RAW:

```bash
npm install                 # once, pulls in sharp
# put full-size photos in assets/img/gallery/_originals/
npm run images
```

That writes `<name>-800.webp` and `<name>-1600.webp`, **strips EXIF** (drone and phone
photos carry GPS coordinates — you probably don't want your launch points published),
and drops paste-ready `<figure>` markup in `assets/img/gallery/_snippets.html`.

Name the files after the place, not the camera: `llogara-pass-sunset.jpg` beats
`DJI_0421.JPG`. That filename becomes part of the URL and Google reads it.

Two rules when you paste the markup in:

- **Alt text describes the scene**, e.g. *"Aerial view of the Llogara Pass switchbacks
  meeting the Albanian Riviera at sunset"* — not *"drone photo"*. This is the single
  highest-leverage thing on that page.
- **Keep `width` and `height`** on every `<img>`. They prevent layout shift, which is a
  ranking factor.

If the gallery ever grows past a few hundred photos, move the files behind Cloudflare R2
(zero egress fees) on an `img.kristileka.dev` subdomain — still your domain, so the SEO
argument above still holds.

## 5. Video — Instagram, not self-hosted

4K drone footage on GitHub Pages would be slow and would blow through the bandwidth
allowance, so the films stay on Instagram and this page points at them.

Each card is a **self-hosted cover image wrapped in a plain link to the post**. Clicking
opens Instagram's embed inside the lightbox; nothing is requested from Instagram until
that click, so the page stays fast and no third-party cookies land on first paint. With
JavaScript disabled the same card is just a link straight to the post, which is why it
degrades cleanly.

**Do not hand-edit the film wall in `travel/index.html`.** Everything between the
`REELS:START` and `REELS:END` markers is generated. Edit `scripts/reels.json` and run:

```bash
npm run reels
```

That fetches any cover it doesn't already have, converts it to a ~480px WebP, reads the
real pixel dimensions back out so every `<img>` carries `width`/`height` (no layout
shift), and rewrites the markup. Adding a destination or a film is a JSON entry:

```json
{ "code": "DYUQKZSN02m", "caption": "Waterfall lagoon", "sub": "Flores",
  "alt": "Describe what is actually in the frame, and name the place" }
```

The `alt` field is the one that matters. It is what makes the image findable, so write a
real sentence naming the place rather than "drone shot".

Two things worth knowing. Instagram's cover URLs are signed and expire within hours,
which is why covers are downloaded and committed rather than hot-linked — if you ever see
a broken cover, delete the WebP and re-run. And if you want the *videos* themselves to
rank in search, Instagram won't do that for you; YouTube would, since the video would
rank there on its own. Right now the films are here to be seen, while the **covers** are
what's indexable — 28 images on your own domain, each with descriptive alt text and a
place name, which is the part that can surface in Google Images.

---

## 6. SEO — what's already done, and what only you can do

Already in place:

- `Person` structured data (JSON-LD) on both pages — job title, Tirana/Albania address,
  degree via `alumniOf`, and `SoftwareSourceCode` entries for Viaduct and GraphDSL
  crediting you as maintainer and author. This is what lets Google treat *"Kristi Leka"*
  as an entity rather than a string of text — important because there are several people
  with your name in software, and the location is a strong disambiguator.
- Unique `<title>` and meta description per page, canonicals, `sitemap.xml`, `robots.txt`.
- Open Graph and Twitter cards with rendered 1200×630 preview images, so links posted to
  LinkedIn, Slack or X show a real card.
- Semantic headings, one `<h1>` per page, keyboard-navigable, `prefers-reduced-motion`
  respected, no layout-shifting assets.

What you need to do after launch, in rough order of impact:

1. **Add your site link to the profiles that already rank for your name.** GitHub profile
   website field, LinkedIn "Website" section, Instagram bio. Google follows these to
   confirm the pages describe the same person. This matters more than anything on the
   page itself.
2. **Add Instagram to the `sameAs` array** in `index.html` once the handle is filled in —
   `sameAs` is the mechanism that ties the profiles together. Only list profiles that are
   genuinely yours; a wrong entry actively hurts.
3. **Verify in [Google Search Console](https://search.google.com/search-console)** and
   submit `sitemap.xml`. Do the same at [Bing Webmaster Tools](https://www.bing.com/webmasters).
4. **Be patient about the name query.** Ranking for *"Kristi Leka"* against existing
   LinkedIn and GitHub results takes weeks, and the fastest accelerant is consistent
   inbound links from those same profiles.

One deliberate omission: no employer is named anywhere. Open source contributions are
attributed to the projects, not to a company.

---

## 7. Editing notes

- The design is deliberately plain: paper background, ink text, one accent
  (`--accent`, a burnt sienna), hairline rules, and no gradients, shadows, cards or
  animation. If you add to it, resist the urge to decorate — the restraint is the point.
- All colours live as custom properties at the top of `main.css`, with a
  `prefers-color-scheme: dark` block that swaps the same tokens. Nothing else is
  theme-aware, so a new component inherits both modes for free.
- Body text is Source Serif 4; small meta labels use the system sans stack and code
  uses the system mono stack. One webfont, no icon fonts.
- `assets/js/main.js` is ~50 lines of progressive enhancement — the YouTube facade,
  the lightbox, and the footer year. Both pages work fully without it.
- The social preview cards and the touch icon in `assets/img/` were generated with
  ffmpeg `drawtext` using Georgia. Easiest way to change the wording is to edit the
  PNGs directly, or re-run the same filter chain.
