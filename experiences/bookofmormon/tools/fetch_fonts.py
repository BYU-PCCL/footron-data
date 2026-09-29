# -*- coding: utf-8 -*-
"""Download self-hosted, glyph-subset webfonts for every script in the corpus.

The wall cannot be assumed to reach fonts.googleapis.com at display time -- the
scriptures experience already carries that warning in its markup -- so the
fonts have to ship inside the experience. Shipping whole Noto families would be
absurd (Noto Serif KR alone is ~16MB) and we only ever draw one book title per
script. So we ask the Google Fonts CSS API for a subset covering exactly the
characters we use, via its &text= parameter, and save the returned woff2.

Result: ~20 scripts in a few dozen KB total, with no network at display time.
Everything goes through urllib rather than curl because the titles are not
ASCII and a Windows shell mangles them into "?" on the way past.
"""
import json, os, re, sys, urllib.error, urllib.parse, urllib.request

DATA, OUTDIR = sys.argv[1], sys.argv[2]
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# Codepoint range -> Noto family. Latin/Greek/Cyrillic share one serif; every
# other script gets the matching Noto Serif so the covers look like a set.
RANGES = [
    (0x10400, 0x1044F, "Noto Sans Deseret"),
    (0x0530, 0x058F, "Noto Serif Armenian"),
    (0x0590, 0x05FF, "Noto Serif Hebrew"),
    (0x0600, 0x06FF, "Noto Naskh Arabic"),
    (0x0750, 0x077F, "Noto Naskh Arabic"),
    (0x0900, 0x097F, "Noto Serif Devanagari"),
    (0x0980, 0x09FF, "Noto Serif Bengali"),
    (0x0B80, 0x0BFF, "Noto Serif Tamil"),
    (0x0C00, 0x0C7F, "Noto Serif Telugu"),
    (0x0D80, 0x0DFF, "Noto Serif Sinhala"),
    (0x0E00, 0x0E7F, "Noto Serif Thai"),
    (0x0E80, 0x0EFF, "Noto Serif Lao"),
    (0x1000, 0x109F, "Noto Serif Myanmar"),
    (0x10A0, 0x10FF, "Noto Serif Georgian"),
    (0x1200, 0x137F, "Noto Serif Ethiopic"),
    (0x1780, 0x17FF, "Noto Serif Khmer"),
    (0x3040, 0x30FF, "Noto Serif JP"),
    (0xAC00, 0xD7AF, "Noto Serif KR"),
    (0x1100, 0x11FF, "Noto Serif KR"),
]
BASE = "Noto Serif"


def family_for_char(ch, han_family):
    cp = ord(ch)
    if 0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF:
        return han_family               # Han is shared; the language decides
    for lo, hi, fam in RANGES:
        if lo <= cp <= hi:
            return fam
    return BASE


def han_family_for(rec):
    lang, code = rec["language"], (rec["langCode"] or "")
    if "Simplified" in lang or code.startswith("zh-Hans"):
        return "Noto Serif SC"
    if "Chinese" in lang or code.startswith("zh"):
        return "Noto Serif TC"
    if code.startswith("ko") or "Korean" in lang:
        return "Noto Serif KR"
    return "Noto Serif JP"


data = json.load(open(DATA, encoding="utf-8"))
need = {}       # family -> set of chars


def assign(rec, text, hf):
    """Record every glyph `text` needs and return the family that carries it.

    Title and verse are scored separately: a title can be romanised while the
    verse is not (and vice versa), so one shared answer would leave one of the
    two setting in a fallback face."""
    fams = {}
    for ch in text:
        if ch.isspace():
            continue
        fam = family_for_char(ch, hf)
        need.setdefault(fam, set()).add(ch)
        fams[fam] = fams.get(fam, 0) + 1
    nonlatin = [f for f in fams if f != BASE]
    return max(nonlatin, key=lambda f: fams[f]) if nonlatin else BASE


for rec in data["translations"]:
    hf = han_family_for(rec)
    rec["font"] = assign(rec, rec["nativeTitle"], hf)
    # The verse is whole sentences, so it pulls in far more of each script
    # than the title does -- it has to be in the union or the subset will be
    # missing most of the glyphs actually drawn on screen.
    rec["verseFont"] = assign(rec, rec.get("verse") or "", hf)

# Also make sure the base serif covers the language names and UI text.
for rec in data["translations"]:
    need.setdefault(BASE, set()).update(c for c in rec["language"] if not c.isspace())
need[BASE].update("0123456789-–—.,;:()[]'’·/&!?«»“” ")


def fetch_css(family, chars, weights):
    """Ask for the weights we want, falling back to the family's single weight.

    Not every Noto family carries a weight axis -- Noto Sans Deseret has none,
    and asking it for wght@600 is a 400, not a silent default."""
    def get(spec):
        q = [("family", spec), ("text", "".join(sorted(chars))), ("display", "swap")]
        url = "https://fonts.googleapis.com/css2?" + urllib.parse.urlencode(q)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        return urllib.request.urlopen(req, timeout=60).read().decode("utf-8")

    try:
        return get("%s:wght@%s" % (family, ";".join(weights)))
    except urllib.error.HTTPError as e:
        if e.code != 400:
            raise
        return get(family)


os.makedirs(OUTDIR, exist_ok=True)
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
css_out, total, failed = [], 0, []

for family in sorted(need):
    chars = need[family]
    weights = ["400", "600"] if family == BASE else ["600"]
    try:
        css = fetch_css(family, chars, weights)
    except Exception as e:                       # noqa: BLE001
        failed.append((family, "css: %s" % e))
        continue
    blocks = re.findall(r"@font-face\s*\{(.*?)\}", css, re.S)
    if not blocks:
        failed.append((family, "no @font-face returned"))
        continue
    # A family with a weight axis answers both weights with the SAME variable
    # woff2, so download each URL once and collapse the duplicate into one
    # @font-face with a weight *range* rather than shipping the bytes twice.
    by_url = {}
    for block in blocks:
        m = re.search(r"url\(([^)]+)\)", block)
        wm = re.search(r"font-weight:\s*(\d+)", block)
        if m:
            by_url.setdefault(m.group(1), []).append(wm.group(1) if wm else "400")

    for url, ws in by_url.items():
        lo, hi = min(ws, key=int), max(ws, key=int)
        name = "%s-%s.woff2" % (slug(family), lo if lo == hi else "%s-%s" % (lo, hi))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            blob = urllib.request.urlopen(req, timeout=60).read()
        except Exception as e:                   # noqa: BLE001
            failed.append((family, "woff2: %s" % e))
            continue
        open(os.path.join(OUTDIR, name), "wb").write(blob)
        total += len(blob)
        css_out.append(
            "@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
            "font-display:swap;src:url('fonts/%s') format('woff2')}"
            % (family, lo if lo == hi else "%s %s" % (lo, hi), name))
        print("  %-24s w%-8s %5d bytes  %2d glyphs"
              % (family, lo if lo == hi else "%s-%s" % (lo, hi), len(blob), len(chars)))

open(os.path.join(os.path.dirname(OUTDIR), "fonts.css"), "w", encoding="utf-8").write(
    "/* Glyph-subset Noto faces, generated by fetch_fonts.py. Each file holds\n"
    "   only the characters this experience actually draws. */\n"
    + "\n".join(css_out) + "\n")

json.dump(data, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("\nfamilies=%d  files=%d  total=%.1f KB" % (len(need), len(css_out), total / 1024))
if failed:
    print("FAILED:")
    for f, why in failed:
        print("  %s -> %s" % (f, why))
