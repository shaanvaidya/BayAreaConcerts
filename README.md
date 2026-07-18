# BayAreaConcerts

A weekly-refreshed, filterable listing of upcoming Bay Area concerts, built from the venue data tracked by [automations/concerts](https://github.com/shaanvaidya/automations/tree/master/concerts). Live at [shaanvaidya.com/BayAreaConcerts](https://shaanvaidya.com/BayAreaConcerts/).

## How it works

1. `automations/concerts/digest.py` scrapes 19 Bay Area venues weekly and commits `concerts/state.json` back to the (public) `automations` repo.
2. This repo's [`build.yml`](.github/workflows/build.yml) workflow runs an hour later: fetches that `state.json` over plain HTTPS (no auth needed - `automations` is public), runs [`generate.py`](generate.py) to render a static `index.html`, and publishes it to this repo's `gh-pages` branch.
3. GitHub Pages serves `gh-pages` at the URL above.

No build tooling, no JS framework, no dependencies beyond the Python standard library - `generate.py` does simple template substitution into `templates/page.html`, inlining `static/style.css` and `static/app.js`. All filtering (search, venue, date range) happens client-side in vanilla JS against a JSON data island embedded in the page.

## Local development

```bash
python3 generate.py --state /path/to/automations/concerts/state.json --out dist/index.html
open dist/index.html
```

## One-time setup (already done)

- `gh-pages` branch bootstrapped as an empty orphan branch.
- GitHub Pages enabled: Settings → Pages → source = `gh-pages` branch, `/` root.

## Note

If `automations`' Monday run fails or is delayed, this workflow just redeploys last week's already-committed `state.json` content - a stale-but-fine degrade, not something to code around.
