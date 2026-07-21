# kristileka.github.io

Personal site — a technical profile page and a travel/drone page. Static HTML, no build
step, no framework. Everything is hand-editable.

```
index.html            engineering profile (the SEO centrepiece)
travel/index.html     travel & drone films
404.html
assets/css/main.css   design system — both pages share it
assets/js/main.js     nav, lightbox, YouTube facade, scroll reveal
assets/img/           favicon, social preview cards, gallery
sitemap.xml, robots.txt, site.webmanifest
scripts/              image optimiser
```

---

## 1. Before you publish

Four things are placeholders. The site works without them, but these are the gaps:

| What | Where | Notes |
|---|---|---|
| Instagram handle | `travel/index.html` — search `YOUR_INSTAGRAM` | 4 occurrences |
| YouTube video ids | `travel/index.html` — search `YOUTUBE_ID_` | 3 film cards |
| Gallery photos | `travel/index.html` — the `shot--empty` blocks | see section 4 |
| Instagram in structured data | `index.html` — the `sameAs` array | see section 6 |

Everything else comes from your CV and the two repositories — job titles, the 8+ years,
the skills list, the metrics in the Impact section, and the degree. The prose is a draft
in your voice; read it once and make it sound like you.

The Impact section is the one to check most carefully. Those are real outcomes from your
CV, deliberately **unattributed** — no employer or client is named anywhere on the site,
per your instruction, so the numbers stand on their own. Confirm you're comfortable
publishing each figure, since some are specific enough to identify the project to someone
who already knows it.

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

## 5. Video — do not self-host

4K drone footage on GitHub Pages will be slow and will blow through the bandwidth
allowance. Upload to **YouTube**, then put the video id into the film cards.

This is also the SEO-correct answer: YouTube is the second largest search engine, the
video ranks there on its own, and the embed here earns a second surface. Title the
uploads with real place names — *"Llogara Pass, Albania — 4K drone"* — since that is what
people actually search.

The cards use a click-to-load facade: the poster frame is shown, and YouTube's iframe and
cookies only load when someone presses play. That keeps the page fast and avoids
third-party tracking on first paint.

Vimeo is the alternative if you want no ads and better colour handling, but it costs
money and brings far less discovery. Instagram Reels are for reach, not for hosting —
link to them, don't embed them.

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

- Colours, spacing and type scale are CSS custom properties at the top of `main.css`.
  The travel page switches palette purely via `<body data-palette="field">`.
- `assets/js/main.js` is progressive enhancement only — every feature degrades to
  working HTML if the script fails to load.
- The social preview cards in `assets/img/` were generated with ffmpeg. To regenerate
  after changing the text, the filter scripts are throwaway; easiest is to re-run the
  same `drawtext` chain, or just edit the PNGs directly.
