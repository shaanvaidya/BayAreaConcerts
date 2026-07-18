"""Render concerts/state.json (from the automations repo) into a static,
dependency-free index.html.

Usage: python3 generate.py --state state.json --out dist/index.html
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).parent


def load_shows(state_path: Path) -> dict:
    state = json.loads(state_path.read_text())
    if state.get("schema_version") != 1:
        raise ValueError(f"unexpected schema_version {state.get('schema_version')!r} - state.json format may have changed")

    shows = [
        {
            "venue": s["venue"],
            "title": s["title"],
            "date": s["date"],
            "url": s["url"],
            "first_seen": s.get("first_seen", s["date"]),
        }
        for s in state["shows"].values()
    ]
    shows.sort(key=lambda s: s["date"])
    venues = sorted({s["venue"] for s in shows})

    return {
        "shows": shows,
        "venues": venues,
        "count": len(shows),
        "last_updated": state.get("last_updated", ""),
    }


def render(payload: dict) -> str:
    template = (ROOT / "templates" / "page.html").read_text()
    style = (ROOT / "static" / "style.css").read_text()
    script = (ROOT / "static" / "app.js").read_text()

    # A show title containing the literal substring "</script" would
    # otherwise close the embedded JSON data island early and truncate
    # the page - escape it before embedding.
    data_json = json.dumps(
        {"shows": payload["shows"], "venues": payload["venues"]},
        ensure_ascii=False,
    ).replace("</", "<\\/")

    last_updated = payload["last_updated"][:10] if payload["last_updated"] else "unknown"

    html = template
    html = html.replace("__STYLE__", style)
    html = html.replace("__SCRIPT__", script)
    html = html.replace("__SHOW_DATA_JSON__", data_json)
    html = html.replace("__LAST_UPDATED__", last_updated)
    html = html.replace("__SHOW_COUNT__", str(payload["count"]))
    return html


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", required=True, type=Path)
    parser.add_argument("--out", default=Path("dist/index.html"), type=Path)
    args = parser.parse_args()

    payload = load_shows(args.state)
    html = render(payload)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(html)
    (args.out.parent / ".nojekyll").write_text("")

    print(f"Wrote {args.out} ({payload['count']} shows, {len(payload['venues'])} venues)")


if __name__ == "__main__":
    main()
