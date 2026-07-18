# BayAreaConcerts

Static site generator + GitHub Pages deploy for a weekly Bay Area concert listing. See `README.md` for how it works.

## Conventions

- `generate.py` is stdlib-only - no `requirements.txt`, no `pip install` step in the workflow. Keep it that way.
- No third-party GitHub Actions beyond `actions/checkout`/`actions/setup-python` - the `gh-pages` publish step is a manual git commit+push (self-commit trick, mirrors `automations/concerts.yml`), not `peaceiris/actions-gh-pages` or similar.
- `templates/page.html` + `static/style.css` + `static/app.js` stay as separate, real files for editing; `generate.py` inlines them into one `dist/index.html` at build time via placeholder substitution (`__STYLE__`, `__SCRIPT__`, `__SHOW_DATA_JSON__`, `__LAST_UPDATED__`, `__SHOW_COUNT__`).
- The show list's identity/shape is owned by `automations/concerts/digest.py` (`state.json` schema) - this repo only ever reads it, never writes back.
- Design system (dark "night show" / light "paper flyer" palette, condensed-sans + Georgia + monospace type) was established for this project specifically - keep it consistent if extending the UI.
