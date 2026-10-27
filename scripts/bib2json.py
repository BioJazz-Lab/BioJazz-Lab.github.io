#!/usr/bin/env python3
"""Convert the BibTeX files in content/publications/*.bib into
content/publications/bib.json, the format read by the researchlab theme's
`list_publications` shortcode.

It also converts personal lists in content/publications/members/<username>.bib
into members/<username>.json; these are shown only on that member's page and
are never merged into the lab list.

Only Python 3 (standard library) is needed. Run from the site root:

    python3 scripts/bib2json.py

The GitHub Actions workflow runs it automatically before every build.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BIB_DIR = ROOT / "content" / "publications"
OUT = BIB_DIR / "bib.json"


def parse_bibtex(text):
    """Minimal BibTeX parser: handles @type{key, field = {...} | "..." | number}."""
    text = re.sub(r"(?m)^\s*%.*$", "", text)  # drop comment lines
    entries, i = [], 0
    while True:
        m = re.compile(r"@(\w+)\s*\{\s*([^,\s]+)\s*,").search(text, i)
        if not m:
            break
        etype, key, j = m.group(1).lower(), m.group(2), m.end()
        fields = {}
        while True:
            fm = re.compile(r"\s*,?\s*(\w[\w-]*)\s*=\s*").match(text, j)
            if not fm:
                break
            name, j = fm.group(1).lower(), fm.end()
            if text[j] == "{":
                depth, k = 0, j
                while True:
                    if text[k] == "{":
                        depth += 1
                    elif text[k] == "}":
                        depth -= 1
                        if depth == 0:
                            break
                    k += 1
                value, j = text[j + 1:k], k + 1
            elif text[j] == '"':
                k = text.index('"', j + 1)
                value, j = text[j + 1:k], k + 1
            else:
                vm = re.compile(r"[^,}\s]+").match(text, j)
                value, j = vm.group(0), vm.end()
            fields[name] = " ".join(value.split())
        end = text.index("}", j)
        entries.append({"type": etype, "key": key, **fields})
        i = end + 1
    return entries


def latex_to_html(s):
    s = re.sub(r"\\(?:textit|emph)\{([^{}]*)\}", r"<i>\1</i>", s)
    s = re.sub(r"\\textbf\{([^{}]*)\}", r"<b>\1</b>", s)
    return latex_to_text(s)


def latex_to_text(s):
    s = re.sub(r"\\(?:textit|emph|textbf)\{([^{}]*)\}", r"\1", s)
    s = s.replace("--", "–").replace("\\&", "&").replace("{", "").replace("}", "")
    return safe(s)


def safe(s):
    # The theme embeds these strings inside JavaScript strings and an HTML
    # attribute, so remove characters that would break that.
    return (s.replace("\\", "").replace('"', "”").replace("`", "'")
             .replace("${", "$ {").strip())


def format_authors(raw):
    names = []
    for a in re.split(r"\s+and\s+", raw):
        a = a.strip()
        if "," in a:
            last, first = [p.strip() for p in a.split(",", 1)]
            a = f"{first} {last}"
        names.append(latex_to_text(a))
    return ", ".join(names)


def format_venue(e):
    if e["type"] == "article":
        v = e.get("journal", "")
        if e.get("volume"):
            v += f", {e['volume']}"
            if e.get("number"):
                v += f"({e['number']})"
        if e.get("pages"):
            v += f": {e['pages']}" if e.get("volume") else f", {e['pages']}"
        return latex_to_text(v)
    book = e.get("booktitle", e.get("publisher", e.get("school", e.get("institution", ""))))
    v = f"In {book}" if e["type"] in ("incollection", "inproceedings", "inbook") else book
    if e.get("series"):
        v += f" ({e['series']})"
    if e.get("pages"):
        v += f", pp. {e['pages']}"
    return latex_to_text(v)


def clean_bibtex(e):
    skip = {"type", "key", "labels", "pdf", "file"}
    lines = [f"@{e['type']}{{{e['key']},"]
    for k, v in e.items():
        if k not in skip:
            lines.append(f"  {k} = {{{latex_to_text(v)}}},")
    lines[-1] = lines[-1].rstrip(",")
    lines.append("}")
    return "\n".join(lines)


def convert(bib_files, out_path):
    entries = []
    for f in bib_files:
        found = parse_bibtex(f.read_text(encoding="utf-8"))
        print(f"{f.relative_to(ROOT)}: {len(found)} entries")
        entries += found
    keys = [e["key"] for e in entries]
    dups = {k for k in keys if keys.count(k) > 1}
    if dups:
        sys.exit(f"Duplicate BibTeX keys: {', '.join(sorted(dups))}")

    bibs, categories = [], set()
    for e in entries:
        missing = [k for k in ("title", "author", "year") if k not in e]
        if missing:
            sys.exit(f"Entry {e['key']} is missing: {', '.join(missing)}")
        labels = [l.strip() for l in e.get("labels", "").split(",") if l.strip()]
        categories.update(labels)
        doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", e.get("doi", ""))
        bib = {
            "title": latex_to_html(e["title"]),
            "year": int(e["year"]),
            "author": format_authors(e["author"]),
            "cite": format_venue(e),
            "doi": doi,
            "category": labels,
            "bibtex": clean_bibtex(e),
        }
        if e.get("pdf") or e.get("file"):
            bib["downloadUrl"] = e.get("pdf") or e.get("file")
        bibs.append(bib)

    bibs.sort(key=lambda b: (-b["year"], b["title"].lower()))
    out_path.write_text(json.dumps({"categories": sorted(categories), "bibs": bibs},
                                   ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  -> wrote {out_path.relative_to(ROOT)}: {len(bibs)} publications, {len(categories)} tags")


def main():
    # 1. Lab publications: every .bib directly in content/publications/ -> bib.json
    convert(sorted(BIB_DIR.glob("*.bib")), OUT)
    # 2. Personal lists, kept separate from the lab list:
    #    content/publications/members/<username>.bib -> members/<username>.json
    for f in sorted((BIB_DIR / "members").glob("*.bib")):
        convert([f], f.with_suffix(".json"))


if __name__ == "__main__":
    main()
