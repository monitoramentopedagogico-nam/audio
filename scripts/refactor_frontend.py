"""Extract and rebuild the legacy audio frontend without changing execution order."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "mysite" / "app" / "static" / "app"
TEMPLATE = ROOT / "mysite" / "app" / "templates" / "app" / "audio.html"
BUNDLE = STATIC / "audio.js"
MODULE_DIR = STATIC / "audio"

MODULES = (
    ("01-core.js", "function playClick(time){"),
    ("02-data-and-metronome.js", "function start(){"),
    ("03-capture-and-analysis.js", "function normalizeNoteName(noteName)"),
    ("04-music-theory.js", "function noteYFromScientificName(noteName)"),
    ("05-reading-and-arrangement.js", "function getInstrumentTransposeSemitones()"),
    ("06-transcription-and-upload.js", None),
)


def extract_css() -> None:
    template = TEMPLATE.read_text(encoding="utf-8")
    match = re.search(r"\n\s*<style>\s*\n(?P<css>.*?)\n\s*</style>", template, re.S)
    if not match:
        return
    css = "/* Audio workspace styles. Source of truth for app/audio.html. */\n" + match.group("css") + "\n"
    (STATIC / "audio.css").write_text(css, encoding="utf-8", newline="\n")
    link = '\n  <link rel="stylesheet" href="{% static \'app/audio.css\' %}">'
    template = template[: match.start()] + link + template[match.end() :]
    TEMPLATE.write_text(template, encoding="utf-8", newline="\n")


def extract_javascript() -> None:
    source = BUNDLE.read_text(encoding="utf-8")
    if source.startswith("/* GENERATED FILE"):
        raise SystemExit("audio.js is already generated; edit module sources instead")
    MODULE_DIR.mkdir(parents=True, exist_ok=True)
    cursor = 0
    for filename, next_marker in MODULES:
        if next_marker is None:
            chunk = source[cursor:]
            cursor = len(source)
        else:
            boundary = source.find(next_marker, cursor)
            if boundary < 0:
                raise SystemExit(f"split marker not found: {next_marker}")
            chunk = source[cursor:boundary]
            cursor = boundary
        (MODULE_DIR / filename).write_text(chunk.rstrip() + "\n", encoding="utf-8", newline="\n")


def build_bundle() -> None:
    chunks = []
    for filename, _ in MODULES:
        path = MODULE_DIR / filename
        if not path.exists():
            raise SystemExit(f"missing frontend module: {path}")
        chunks.append(f"/* module: {filename} */\n" + path.read_text(encoding="utf-8").rstrip())
    header = (
        "/* GENERATED FILE - DO NOT EDIT DIRECTLY.\n"
        " * Run: python scripts/refactor_frontend.py\n"
        " * Sources: mysite/app/static/app/audio/*.js\n"
        " */\n"
    )
    BUNDLE.write_text(header + "\n\n".join(chunks) + "\n", encoding="utf-8", newline="\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--extract", action="store_true", help="extract CSS and JS from legacy files first")
    args = parser.parse_args()
    if args.extract:
        extract_css()
        extract_javascript()
    build_bundle()


if __name__ == "__main__":
    main()
