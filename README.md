# Resilience Point — Investor Experience

Pure static site (HTML / CSS / JS). No build step, no bundler, no runtime unpacking.

## Structure

```
index.html
assets/
  css/      stylesheets (rp, rp-additions, rp-revisions, gate)
  js/       scripts (rp, rp-additions, rp-revisions, gate)
  images/   logo, mark, photos (.svg / .jpg)
  fonts/    Raleway family (.ttf)
  video/    walkthrough.mp4 (scroll-scrubbed)
```

## Deploy

**Vercel** — import the repo; framework preset = "Other" (no build command, output dir = root). Deploys as-is.

**GitHub Pages** — push to a repo, then Settings → Pages → deploy from branch (root). All paths are relative, so it works from any sub-path.

## Access

The site opens on a password gate. Default password: `resilience2026`
(change it in `assets/js/gate.js` → `ACCESS_PASSWORD`).
