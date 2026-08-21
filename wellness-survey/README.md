# The Peptide Lounge — Wellness Assessment

A branded, mobile-friendly wellness intake survey. One self-contained
`index.html` — no build step, no dependencies beyond Google Fonts.

## What it does

- Walks the member through **About You** + the **six wellness dimensions**
  (Peptide Goals, Calm & Anxiety, Stress, Hormones, Vitality, Lifestyle)
  — one section per screen, with a gold progress bar.
- Scores each dimension on the same 0–4 scale as the original score sheet
  (symptom sections reverse-scored; overall = mean of the six dimensions)
  and shows a **Wellness Snapshot**: overall ring gauge, per-dimension
  bars, band labels, an auto-written Care Team Summary, and key
  observations.
- The Hormones section adapts to the member's sex (the perimenopause and
  erectile-change questions only appear when relevant).
- Submits everything — contact details, every answer, and all computed
  scores — to **Netlify Forms** (form name: `wellness-intake`), so
  submissions appear in the Netlify dashboard under **Forms** and can
  trigger email notifications. On the live site, each submission is
  automatically emailed to the medical director
  (nimaalipour@alipourmedical.com).
- Members can **email themselves a copy** of their snapshot (opens their
  mail app pre-filled) or **print / save** it (print stylesheet included).

## Deploying on Netlify

**Option A — drag and drop:** at app.netlify.com, drag this
`wellness-survey` folder onto "Deploy manually". Done.

**Option B — from this repo:** create a new Netlify site from the repo and
set **Base directory** and **Publish directory** to `wellness-survey`.

After the first deploy, open **Site → Forms** in Netlify to confirm the
`wellness-intake` form was detected, and add an email notification under
**Forms → Form notifications** so the care team is alerted on each
submission.

## Brand

Uses the 2026 brand kit: cream `#FCF9F0`, charcoal `#2E2E2E`, signature
gold `#B5893E`, bronze `#8F6A25`, parchment `#F5F0E1`; Poppins for UI and
Cormorant Garamond for display headings; the bar-and-point logo motif is
rendered in pure CSS.
