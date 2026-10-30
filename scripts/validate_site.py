"""Check the publishable directory without third-party dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "source"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("href", "src", "poster"):
            if attrs.get(key):
                self.links.append(attrs[key])
        if tag == "img":
            assert "alt" in attrs, "Every image needs alt text or an empty alt"


page = PageParser()
page.feed((PUBLIC / "index.html").read_text())
assert len(page.ids) == len(set(page.ids)), "Duplicate HTML IDs"
for link in page.links:
    url = urlsplit(link)
    if url.scheme or url.netloc:
        continue
    assert not url.path.startswith("/"), f"Root-absolute URL breaks repository Pages: {link}"
    if url.path:
        target = (PUBLIC / unquote(url.path)).resolve()
        assert target.is_relative_to(PUBLIC.resolve()), f"Public link escapes source/: {link}"
        assert target.is_file(), f"Missing resource: {link}"
    elif url.fragment:
        assert url.fragment in page.ids, f"Missing anchor: {link}"

js = (PUBLIC / "app.js").read_text()
for selector in re.findall(r'querySelector\("#([\w-]+)"\)', js):
    assert selector in page.ids, f"JavaScript target does not exist: {selector}"
for slug in ("corgi", "astronaut", "ironman", "panda", "nebula"):
    for side in ("before", "after"):
        for folder, extension in (("videos", "mp4"), ("images", "webp")):
            assert (PUBLIC / f"assets/{folder}/{slug}-{side}.{extension}").is_file()
for step in (1, 3, 5, 7, 10, 12, 14):
    assert (PUBLIC / f"assets/frames/failure-{step:02}.webp").is_file()
    assert (PUBLIC / f"assets/videos/l2r-step-{step:02}.mp4").is_file()

records = json.loads((ROOT / "scripts/asset-provenance.json").read_text())
recorded = {record["public_file"] for record in records}
for asset in (PUBLIC / "assets").rglob("*"):
    if asset.is_file() and asset.suffix != ".svg":
        assert str(asset.relative_to(ROOT)) in recorded, f"Missing asset provenance: {asset.name}"

files = [path for path in PUBLIC.rglob("*") if path.is_file()]
assert not any(path.is_symlink() for path in PUBLIC.rglob("*")), "Public files must be self-contained"
assert not any(path.suffix in {".pptx", ".xlsx", ".zip", ".tar"} for path in files), "Research source archive in public folder"
assert all(path.stat().st_size < 95_000_000 for path in files), "Asset too large for ordinary Git hosting"
total = sum(path.stat().st_size for path in files)
print(f"OK: {len(files)} public files, {len(page.links)} links, {len(records)} curated assets, {total / 1024**2:.1f} MiB.")

