# -*- coding: utf-8 -*-
"""Fetch 1 Nephi 3:7 in every language we have a translation for.

Why this verse: it is short enough to set large on a 2736px wall without
shrinking to nothing, and it is the one line most people can complete from
memory in English, which makes seeing it in Khmer or Georgian land.

Matching Wikipedia's language names to the Church's content codes is the whole
difficulty. The Church uses ISO 639-3 for most languages, so we build
candidates from the SIL table (by 639-1 code and by reference name) and probe.
A wrong code does not 404 -- it silently serves English -- so every result is
checked against the English text and discarded if it came back identical.
"""
import html, json, os, re, sys, time, urllib.parse, urllib.request

DATA, ISO, CACHE = sys.argv[1], sys.argv[2], sys.argv[3]
URI, VERSE = "/scriptures/bofm/1-ne/3", "7"
API = "https://www.churchofjesuschrist.org/study/api/v3/language-pages/type/content"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# ---------------------------------------------------------------- ISO tables
by_part1, by_name = {}, {}
with open(ISO, encoding="utf-8") as fh:
    next(fh)
    for line in fh:
        f = line.rstrip("\n").split("\t")
        if len(f) < 7:
            continue
        ident, part1, ref = f[0], f[3], f[6]
        if part1:
            by_part1[part1] = ident
        by_name.setdefault(ref.lower(), ident)

# Church codes that are not what the ISO table would predict, or languages
# whose Wikipedia name does not match any reference name.
OVERRIDE = {
    "Chinese": "zho", "Chinese (Simplified)": "zhs",
    "American Sign Language": "ase", "Cebuano": "ceb",
    "Haitian Creole": "hat", "Neomelanesian (Tok Pisin)": "tpi",
    "Kiribati (Gilbertese)": "gil", "Marshallese": "mah",
    "Rarotongan (Cook Islands Māori)": "rar", "Q'eqchi'": "kek",
    "Quiché": "quc", "Kaqchikel": "cak", "Hiligaynon (Ilonggo)": "hil",
    "Khmer (Cambodian)": "khm", "Armenian, Eastern": "hye",
    "Armenian, Western": "hyw", "Ibo (Igbo)": "ibo",
    "Quichua–Ecuador": "qvi", "Quechua—Peru": "quz",
    "Quechua—Bolivia": "quh", "Pampango/Kapampangan": "pam",
    "Kisii/Gusii": "guz", "Guaraní": "grn", "Māori": "mri",
    "Chewa": "nya", "Tshilubà": "lua", "Swati": "ssw", "Fante": "fat",
    "Persian": "fas", "Malay": "msa", "Mongolian": "mon", "Hmong": "hmn",
    "Bislama": "bis", "Pohnpeian": "pon", "Chuukese": "chk",
    "Kosraean": "kos", "Yapese": "yap", "Palauan": "pau",
    "Papiamento": "pap", "Waray-Waray": "war", "Bikolano": "bik",
    "Tzotzil": "tzo", "Mam": "mam", "Maya": "yua", "Guna": "cuk",
    "Efik": "efi", "Navajo": "nav", "Sesotho": "sot", "Twi": "twi",
    "Tswana": "tsn", "Shona": "sna", "Xhosa": "xho", "Zulu": "zul",
    "Yoruba": "yor", "Swahili": "swa", "Malagasy": "mlg", "Amharic": "amh",
    "Lingala": "lin", "Kinyarwanda": "kin", "Tagalog": "tgl",
    "Ilokano": "ilo", "Pangasinan": "pag", "Niuean": "niu",
    "Chamorro": "cha", "Tahitian": "tah", "Samoan": "smo", "Tongan": "ton",
    "Fijian": "fij", "Hawaiian": "haw", "Aymara": "aym", "Telugu": "tel",
    "Sinhala": "sin", "Nepali": "nep", "Burmese": "mya", "Lao": "lao",
    "Georgian": "kat", "Macedonian": "mkd", "Maltese": "mlt",
    # The Church uses 639-2/B here, not 639-3, and the specific
    # Iranian-Persian code rather than the macrolanguage.
    "Albanian": "alb", "Persian": "pes",
}

SKIP = {"Deseret Alphabet (English)", "Braille (English)", "Braille (Spanish)",
        "Turkish—Armenian Script"}


def candidates(rec):
    lang, code = rec["language"], (rec["langCode"] or "").split("-")[0].lower()
    out = []
    if lang in OVERRIDE:
        out.append(OVERRIDE[lang])
    if code and code in by_part1:
        out.append(by_part1[code])
    if len(code) == 3:
        out.append(code)
    base = re.split(r"[(,—–/]", lang)[0].strip().lower()
    if base in by_name:
        out.append(by_name[base])
    seen, uniq = set(), []
    for c in out:
        if c and c not in seen:
            seen.add(c)
            uniq.append(c)
    return uniq


def strip_tags(s):
    s = re.sub(r"<span class=\"verse-number\">.*?</span>", "", s, flags=re.S)
    s = re.sub(r"<sup[^>]*>.*?</sup>", "", s, flags=re.S)
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


os.makedirs(CACHE, exist_ok=True)


def get_verse(code):
    """Return (verse_text, chapter_title) for a Church language code."""
    path = os.path.join(CACHE, "%s.json" % code)
    if os.path.exists(path):
        raw = open(path, encoding="utf-8").read()
    else:
        url = API + "?" + urllib.parse.urlencode({"lang": code, "uri": URI})
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        raw = urllib.request.urlopen(req, timeout=45).read().decode("utf-8")
        open(path, "w", encoding="utf-8").write(raw)
        time.sleep(0.3)                      # be a polite guest
    d = json.loads(raw)
    body = (d.get("content") or {}).get("body") or ""
    m = re.search(r'<p[^>]*class="verse"[^>]*id="p%s".*?</p>' % VERSE, body, re.S)
    if not m:
        m = re.search(r'<p[^>]*id="p%s"[^>]*class="verse".*?</p>' % VERSE, body, re.S)
    return (strip_tags(m.group()) if m else ""), (d.get("meta") or {}).get("title", "")


data = json.load(open(DATA, encoding="utf-8"))
eng, eng_title = get_verse("eng")
print("English reference (%d chars): %s\n" % (len(eng), eng[:90]))

ok, miss = 0, []
for rec in data["translations"]:
    rec["verse"] = ""
    rec["verseRef"] = ""
    rec["verseLang"] = ""
    if rec["language"] in SKIP:
        continue
    if rec["language"] == "English":
        rec.update(verse=eng, verseRef=eng_title, verseLang="eng")
        ok += 1
        continue
    for code in candidates(rec):
        try:
            text, title = get_verse(code)
        except Exception:                                  # noqa: BLE001
            continue
        # A bogus code serves English rather than failing, so reject a match
        # that is byte-identical to the English verse.
        if text and text != eng:
            rec.update(verse=text, verseRef=title, verseLang=code)
            ok += 1
            break
    else:
        miss.append("%s [%s]" % (rec["language"], ",".join(candidates(rec)) or "-"))

json.dump(data, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("verses found: %d / %d" % (ok, len(data["translations"])))
print("no verse (%d):" % len(miss))
for m in miss:
    print("   ", m)
