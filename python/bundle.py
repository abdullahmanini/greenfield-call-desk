"""Inline the stylesheet and scripts into one self-contained page at dist/greenfield-call-desk.html.

Run from the project folder after build_site_data.py:  python3 python/bundle.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "assets" / "styles.css").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="assets/styles.css">', "<style>\n" + css + "</style>")
    for name in ("site-data.js", "app.js"):
        js = (ROOT / "assets" / name).read_text(encoding="utf-8")
        html = html.replace(f'<script src="assets/{name}"></script>', "<script>\n" + js + "</script>")
    out = ROOT / "dist" / "greenfield-call-desk.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({len(html) // 1024} KB)")


if __name__ == "__main__":
    main()
