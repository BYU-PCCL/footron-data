# -*- coding: utf-8 -*-
"""Parse the wikitext of en.wikipedia "List of Book of Mormon translations"
into a JSON file the experience can drive itself from.

We parse the raw wikitext (Special:Export) rather than the rendered page so
the years, the native-language titles and the {{lang}} codes come through
byte-exact -- the native title and its script code are what the procedural
cover is drawn from, so a mangled one is a broken page, not a typo."""
import html, json, re, sys, unicodedata

SRC, OUT = sys.argv[1], sys.argv[2]

raw = open(SRC, encoding="utf-8").read()
body = html.unescape(re.search(r"<text[^>]*>(.*)</text>", raw, re.S).group(1))

# Sections we keep. The "not published by the Church" table is deliberately
# excluded -- no Klingon/Esperanto/independent-Hebrew editions.
WANTED = {
    "Complete translations":   "complete",
    "Selections only":         "selections",
    "Translations in progress": "in-progress",
    "Out of print":            "out-of-print",
}

def find_sections(text):
    hits = [(m.start(), m.group(1).strip()) for m in re.finditer(r"^==\s*(.+?)\s*==\s*$", text, re.M)]
    for i, (pos, name) in enumerate(hits):
        end = hits[i + 1][0] if i + 1 < len(hits) else len(text)
        yield name, text[pos:end]

def strip_refs(s):
    """Drop <ref>..</ref>, <ref/>, comments. Refs are littered mid-cell."""
    s = re.sub(r"<ref[^>]*?/\s*>", "", s)
    s = re.sub(r"<ref.*?</ref\s*>", "", s, flags=re.S)
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    return s

def split_template(inner):
    """Split a template body on top-level | only (nested {{}} and [[]] keep theirs)."""
    parts, buf, depth = [], [], 0
    i = 0
    while i < len(inner):
        two = inner[i:i + 2]
        if two in ("{{", "[["):
            depth += 1; buf.append(two); i += 2; continue
        if two in ("}}", "]]"):
            depth -= 1; buf.append(two); i += 2; continue
        if inner[i] == "|" and depth == 0:
            parts.append("".join(buf)); buf = []; i += 1; continue
        buf.append(inner[i]); i += 1
    parts.append("".join(buf))
    return parts

def expand_templates(s, langs):
    """Replace {{lang|code|text}} with text, recording the code. Other
    templates collapse to their last positional arg or vanish."""
    out, i = [], 0
    while i < len(s):
        if s[i:i + 2] == "{{":
            depth, j = 1, i + 2
            while j < len(s) and depth:
                if s[j:j + 2] == "{{": depth += 1; j += 2; continue
                if s[j:j + 2] == "}}": depth -= 1; j += 2; continue
                j += 1
            parts = split_template(s[i + 2:j - 2])
            name = parts[0].strip().lower()
            pos = [p for p in parts[1:] if "=" not in p.split("|")[0][:12]]
            if name in ("lang", "transliteration", "transl"):
                if len(pos) >= 2:
                    langs.append(pos[0].strip())
                    out.append(expand_templates(pos[1], langs))
            elif name in ("nowrap", "small", "smaller", "nobold"):
                out.append(expand_templates(pos[0], langs) if pos else "")
            i = j; continue
        out.append(s[i]); i += 1
    return "".join(out)

def links_in(s):
    """Wikilink targets, display-text resolved: [[Peru]] / [[X|Y]] -> Peru / Y."""
    return [ (m.group(2) or m.group(1)).strip()
             for m in re.finditer(r"\[\[([^\]\|]+)(?:\|([^\]]*))?\]\]", s) ]

def clean(s, langs=None):
    langs = langs if langs is not None else []
    s = strip_refs(s)
    s = expand_templates(s, langs)
    s = re.sub(r"\[\[(?:[^\]\|]+)\|([^\]]*)\]\]", r"\1", s)   # [[A|B]] -> B
    s = re.sub(r"\[\[([^\]\|]+)\]\]", r"\1", s)               # [[A]]   -> A
    s = re.sub(r"\[https?://\S+\s+([^\]]+)\]", r"\1", s)      # ext link
    s = re.sub(r"https?://\S+", "", s)
    s = s.replace("'''", "").replace("''", "")
    s = re.sub(r"<br\s*/?>", " / ", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\{\{|\}\}", "", s)
    return re.sub(r"\s+", " ", s).strip(" .,;/")

def parse_table(block):
    """Row cells are line-oriented here; a line opening with a single | starts
    a cell and later lines continue it (notes cells wrap across lines)."""
    m = re.search(r"^\{\|.*?$(.*?)^\|\}", block, re.S | re.M)
    if not m: return []
    headers, rows, cur = [], [], None
    for line in m.group(1).splitlines():
        t = line.strip()
        if t.startswith("!"):
            headers += [clean(h) for h in re.split(r"!!|^!", t) if h.strip()]
        elif t.startswith("|-"):
            if cur: rows.append(cur)
            cur = []
        elif t.startswith("|}"):
            break
        elif t.startswith("|") and cur is not None:
            cur.append(t[1:])
        elif cur:
            if cur: cur[-1] += "\n" + line
    if cur: rows.append(cur)
    return [dict(zip(headers, r)) for r in rows if any(c.strip() for c in r)]

def col(row, *names):
    for k in row:
        kl = k.lower().rstrip(".")
        for n in names:
            if kl.startswith(n): return row[k]
    return ""

RTL = {"ar", "ur", "fa", "he", "arc", "syr", "ckb", "prs"}

records, counts = [], {}
for name, block in find_sections(body):
    key = WANTED.get(name)
    if not key: continue
    rows = parse_table(block)
    counts[key] = len(rows)
    for row in rows:
        langs = []
        title = clean(col(row, "title"), langs)
        locraw = strip_refs(col(row, "primary location"))
        language = clean(col(row, "language"))
        year = clean(col(row, "date"))
        code = langs[0] if langs else ""
        base = code.split("-")[0].lower()
        scripts = sorted({unicodedata.name(ch, "?").split()[0]
                          for ch in title if ch.isalpha()} - {"?"})
        records.append({
            "language": language,
            "year": int(re.search(r"\d{4}", year).group()) if re.search(r"\d{4}", year) else None,
            "yearRaw": year,
            "nativeTitle": title,
            "langCode": code,
            "rtl": base in RTL,
            "scripts": scripts,
            "locations": [clean(x) for x in links_in(locraw)] or ([clean(locraw)] if clean(locraw) else []),
            "locationsText": clean(locraw),
            "speakers": clean(col(row, "approx", "speakers")),
            "notes": clean(col(row, "notes")),
            "status": key,
        })

records.sort(key=lambda r: (r["year"] or 9999, r["language"]))
json.dump({"source": "https://en.wikipedia.org/wiki/List_of_Book_of_Mormon_translations",
           "counts": counts, "translations": records},
          open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("rows per table:", counts, "total:", len(records))
