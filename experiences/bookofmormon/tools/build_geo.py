# -*- coding: utf-8 -*-
"""Build the geometry + resolved translation data the experience runs on.

Three geometry sources, all Natural Earth (public domain):
  110m admin_0        -> country polygons
  50m tiny_countries  -> points for microstates that 110m drops. This matters
                         more here than for most world maps: the Pacific is
                         central to this story (Hawaiian 1855, Samoan 1903,
                         Tongan 1946, Rarotongan 1965) and every one of those
                         nations is a dropped sliver at 110m.
  hand-placed points  -> sub-national places with no admin_0 feature at any
                         scale (Hawaii, Utah Territory, Wales, Chiapas...).
                         Approximate to ~0.5 degrees, which at 1000px wide is
                         under 2px -- fine for a pin, not for a border.
"""
import json, math, re, sys

NE110, TINY, BOM, OUT_W, OUT_D = sys.argv[1:6]
W = 1000.0
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
R3_2 = math.sqrt(3) / 2


def equal_earth(lon, lat):
    lam, phi = math.radians(lon), math.radians(lat)
    th = math.asin(max(-1.0, min(1.0, R3_2 * math.sin(phi))))
    t2 = th * th
    den = R3_2 * (A1 + 3 * A2 * t2 + t2 ** 3 * (7 * A3 + 9 * A4 * t2))
    y = A1 * th + A2 * th ** 3 + t2 ** 3 * th * (A3 + A4 * t2)
    return lam * math.cos(th) / den, y


X0, X1 = equal_earth(-180, 0)[0], equal_earth(180, 0)[0]
Y0, Y1 = equal_earth(0, -90)[1], equal_earth(0, 90)[1]
SCALE = W / (X1 - X0)
H = (Y1 - Y0) * SCALE


def wrap(lon, lon0):
    """Longitude relative to a central meridian, folded into [-180, 180)."""
    return ((lon - lon0 + 540.0) % 360.0) - 180.0


def raw_px(rel_lon, lat):
    """Project a longitude already measured from the central meridian.

    Bypasses wrap() deliberately: wrapping folds +180 onto -180, which would
    collapse the map's right edge onto its left one."""
    x, y = equal_earth(rel_lon, lat)
    return ((x - X0) * SCALE, (Y1 - y) * SCALE)


def to_px(lon, lat, lon0=0.0):
    return raw_px(wrap(lon, lon0), lat)


def wrapped_lons(ring, lon0):
    """Wrapped longitudes for a ring, with the +/-180 ambiguity resolved.

    A vertex sitting exactly on the cut meridian is equally -180 and +180, and
    picking wrong throws that vertex to the far side of the map -- which is
    what smears Russia's eastern tip across the whole world. Resolve each such
    vertex to match its neighbours instead."""
    ws = [wrap(lon, lon0) for lon, _ in ring]
    anchor = next((w for w in ws if abs(abs(w) - 180.0) > 1e-9), 0.0)
    for i, w in enumerate(ws):
        if abs(abs(w) - 180.0) <= 1e-9:
            ws[i] = 180.0 if anchor > 0 else -180.0
        else:
            anchor = ws[i]
    return ws


def split_ring(ring, lon0):
    """Break a ring wherever it jumps the cut meridian.

    Re-centring the projection puts the map's edge somewhere new, and any
    polygon straddling that edge would otherwise smear right across the map as
    a single horizontal band. Splitting on a >180 degree step leaves a small
    seam instead, which at 110m is invisible."""
    ws = wrapped_lons(ring, lon0)
    runs, cur, prev = [], [], None
    for (lon, lat), w in zip(ring, ws):
        if prev is not None and abs(w - prev) > 180.0:
            if len(cur) >= 3:
                runs.append(cur)
            cur = []
        cur.append((w, lat))
        prev = w
    if len(cur) >= 3:
        runs.append(cur)
    return runs


def project_rings(geom, lon0):
    """-> list of (area, points) for every drawable piece of one feature."""
    out = []
    for ring in rings_of(geom):
        # split_ring hands back already-wrapped longitudes, so project raw.
        for run in split_ring(ring, lon0):
            pts = simplify([raw_px(w, lat) for w, lat in run], 0.55)
            if len(pts) >= 3:
                out.append((ring_area(pts), pts))
    return out


def sphere_outline():
    """The projection's boundary: the two edge meridians plus the pole lines.

    Tracing parallels instead (lat -90 then lat +90) gives a lens that misses
    the map's actual widest points at the equator, and leaves stray near
    vertical strokes across the map."""
    steps = [(-180.0, la) for la in range(-90, 91, 3)]
    steps += [(lo / 10.0, 90.0) for lo in range(-1800, 1801, 30)]
    steps += [(180.0, la) for la in range(90, -91, -3)]
    steps += [(lo / 10.0, -90.0) for lo in range(1800, -1801, -30)]
    pts = [raw_px(lo, la) for lo, la in steps]
    return "M" + "L".join("%.1f %.1f" % (x, y) for x, y in pts) + "Z"


def simplify(pts, tol):
    """Douglas-Peucker, iterative so a long coastline cannot blow the stack."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        ax, ay = pts[i]
        bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        nrm = math.hypot(dx, dy)
        best, bi = -1.0, None
        for k in range(i + 1, j):
            px, py = pts[k]
            if nrm:
                d = abs(dy * (px - ax) - dx * (py - ay)) / nrm
            else:
                d = math.hypot(px - ax, py - ay)
            if d > best:
                best, bi = d, k
        if bi is not None and best > tol:
            keep[bi] = True
            stack += [(i, bi), (bi, j)]
    return [p for p, k in zip(pts, keep) if k]


def ring_area(pts):
    return abs(sum(pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
                   for i in range(-1, len(pts) - 1))) / 2


def rings_of(g):
    if g["type"] == "Polygon":
        return g["coordinates"]
    if g["type"] == "MultiPolygon":
        return [r for p in g["coordinates"] for r in p]
    return []


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


# ------------------------------------------------------------------ polygons
# Two projections of the same world. PAC_LON0 re-centres on the Pacific, which
# the Atlantic-centred default splits down the middle -- and the Pacific is
# where a large share of these translations live (Hawaiian 1855, Samoan 1903,
# Tahitian 1904, Tongan 1946, Rarotongan 1965, Fijian 1980, Kiribati, the
# Marshalls, Micronesia). 150E puts the cut in the mid-Atlantic at 30W, where
# it crosses nothing but open water and a corner of Greenland.
PAC_LON0 = 150.0
LON0S = {"": 0.0, "Pac": PAC_LON0}

g = json.load(open(NE110, encoding="utf-8"))
sub_idx, wb_idx, name_idx = {}, {}, {}
cmaps = {suf: {} for suf in LON0S}

for f in g["features"]:
    p = f["properties"]
    if p.get("CONTINENT") in ("Antarctica", "Seven seas (open ocean)"):
        continue
    iso = (p.get("ISO_A3") or "").strip()
    if not iso or iso == "-99":
        iso = re.sub(r"[^A-Z]", "", (p.get("ADMIN") or "").upper())[:3] or "XXX"

    made = False
    for suf, lon0 in LON0S.items():
        parts = project_rings(f["geometry"], lon0)
        if not parts:
            continue
        biggest = max(a for a, _ in parts)
        kept = [(a, pts) for a, pts in parts
                if not (a < 1.2 and a < biggest * 0.06)] or parts
        _, main = max(kept, key=lambda t: t[0])
        cmaps[suf][iso] = {
            "n": p.get("NAME"),
            "cont": p.get("CONTINENT"),
            "d": "".join("M" + "L".join("%.1f %.1f" % (x, y) for x, y in pts) + "Z"
                         for _, pts in kept),
            "c": [round(sum(x for x, _ in main) / len(main), 1),
                  round(sum(y for _, y in main) / len(main), 1)],
        }
        made = True
    if not made:
        continue
    sub_idx.setdefault(p.get("SUBREGION"), []).append(iso)
    wb_idx.setdefault(p.get("REGION_WB"), []).append(iso)
    for k in (p.get("NAME"), p.get("ADMIN"), p.get("NAME_LONG"), p.get("GEOUNIT"),
              p.get("FORMAL_EN"), p.get("NAME_SORT"), p.get("BRK_NAME")):
        if k:
            name_idx.setdefault(norm(k), iso)

countries = cmaps[""]

# -------------------------------------------------------------------- points
pmaps = {suf: {} for suf in LON0S}


def add_point(nm, lon, lat):
    key = "P_" + re.sub(r"[^A-Z0-9]", "", nm.upper())[:10]
    for suf, lon0 in LON0S.items():
        x, y = to_px(lon, lat, lon0)
        pmaps[suf][key] = {"n": nm, "c": [round(x, 1), round(y, 1)]}
    name_idx.setdefault(norm(nm), key)
    return key


for f in json.load(open(TINY, encoding="utf-8"))["features"]:
    p = f["properties"]
    nm = p.get("NAME") or p.get("ADMIN")
    if nm:
        lon, lat = f["geometry"]["coordinates"][:2]
        add_point(nm, lon, lat)

HAND = {
    "Hawaiian Islands": (-156.3, 20.6),
    "Utah Territory": (-111.7, 39.3),
    "Wales": (-3.8, 52.3),
    "Flanders": (3.7, 51.0),
    "French Flanders": (2.9, 50.8),
    "Catalonia": (1.5, 41.8),
    "Roussillon": (2.8, 42.7),
    "Karelia": (33.0, 62.0),
    "Nagorno-Karabakh": (46.8, 39.8),
    "Amhara": (37.8, 11.6),
    "Chiapas": (-92.6, 16.7),
    "Oaxaca": (-96.7, 17.1),
    "Veracruz": (-96.1, 19.2),
    "Central Luzon": (120.8, 15.5),
    "Eastern Visayas": (125.0, 11.8),
    "Bicol Region": (123.4, 13.4),
    "Pangasinan": (120.3, 15.9),
    "Netherlands Antilles": (-69.0, 12.2),
    "Tahiti": (-149.4, -17.6),
    "Yap": (138.1, 9.5),
    "Rarotonga": (-159.8, -21.2),
    "Central Highlands": (-90.9, 14.8),
    # Cabo Verde is absent from both the 110m polygons and either
    # tiny_countries set, so it needs placing by hand like the rest.
    "Cape Verde": (-23.6, 15.1),
    # The three Micronesian translations all give "Federated States of
    # Micronesia" as their location, which would stack three identical pins on
    # one dot. Each language actually belongs to its own state, so we place
    # those islands and let LANG_HOME below point each language at its own.
    "Chuuk": (151.8, 7.4),
    "Kosrae": (163.0, 5.3),
    "Pohnpei": (158.2, 6.9),
}
for nm, (lon, lat) in HAND.items():
    add_point(nm, lon, lat)

# Wikipedia's spelling -> Natural Earth's spelling, resolved via name_idx so we
# never hardcode a generated point key.
NE_ALIAS = {
    "Cook Islands": "Cook Is.",
    "Faroe Islands": "Faeroe Is.",
    "Marshall Islands": "Marshall Is.",
    "Northern Mariana Islands": "N. Mariana Is.",
    "Federated States of Micronesia": "Micronesia",
}

# Languages whose home island is more specific than the location column says.
LANG_HOME = {"Chuukese": "Chuuk", "Kosraean": "Kosrae", "Pohnpeian": "Pohnpei"}

# ------------------------------------------------------------------- regions
REGIONS = {
    "Middle East": sub_idx.get("Western Asia", []),
    "North Africa": sub_idx.get("Northern Africa", []),
    "Southeast Asia": sub_idx.get("South-Eastern Asia", []),
    "Eastern Europe": sub_idx.get("Eastern Europe", []),
    "Latin America": wb_idx.get("Latin America & Caribbean", []),
    "sub-Saharan Africa": wb_idx.get("Sub-Saharan Africa", []),
    "Anglosphere": ["USA", "GBR", "CAN", "AUS", "NZL", "IRL"],
    "Danish Realm": ["DNK", "GRL"],
    "Czechoslovakia": ["CZE", "SVK"],
    "Korea": ["KOR", "PRK"],
    "Caucasus Mountains": ["ARM", "GEO", "AZE"],
    "post-Soviet states": ["RUS", "UKR", "BLR", "MDA", "EST", "LVA", "LTU", "GEO",
                           "ARM", "AZE", "KAZ", "UZB", "TKM", "TJK", "KGZ"],
    "Armenian Diaspora": ["ARM", "RUS", "USA", "FRA", "LBN", "SYR", "IRN", "GEO"],
}
regions = {k: [i for i in v if i in countries] for k, v in REGIONS.items() if v}

# Names Natural Earth spells differently, or does not carry at all.
ALIAS = {
    "U.S": "USA", "US": "USA", "United States": "USA",
    "Continental United States": "USA", "Southwestern United States": "USA",
    "UK": "GBR", "Great Britain": "GBR",
    "Czech Republic": "CZE", "Democratic Republic of Congo": "COD",
    "Republic of the Congo": "COG", "Cape Verde": "CPV", "Ivory Coast": "CIV",
    "minority in Argentina": "ARG", "Western Armenian": "ARM",
    "Eastern Armenia": "ARM", "Hawaii": "P_HAWAIIANIS", "Utah": "P_UTAHTERRIT",
}
for k, v in ALIAS.items():
    name_idx.setdefault(norm(k), v)
for wiki, ne in NE_ALIAS.items():
    if norm(ne) in name_idx:
        name_idx.setdefault(norm(wiki), name_idx[norm(ne)])


def resolve(name):
    if name in regions:
        return {"kind": "region", "key": name, "isos": regions[name]}
    k = name_idx.get(norm(name))
    if not k:
        return None
    if k.startswith("P_"):
        return {"kind": "point", "key": k} if k in pmaps[""] else None
    return {"kind": "country", "key": k} if k in countries else None


# Clauses that mark a place as somewhere the language has merely spread to.
SECONDARY_RE = re.compile(
    r"minorit|expatriate|diaspora|as a foreign language|elsewhere", re.I)


def secondary_names(text, names):
    """Location names the source mentions only after a minority/diaspora marker.

    Wikipedia writes Hawaiian's range as "Hawaiian Islands (minority in
    Continental United States)". Both are links, so a flat list of locations
    lights up the whole United States for a language of the islands.

    The marker governs everything that follows it, not just the next clause:
    "Bulgaria; minorities in Greece, Turkey and Ukraine" demotes all three, and
    "Germany, Austria, Switzerland with minorities elsewhere" demotes none of
    the three. So we split on the marker's position, not on punctuation. A name
    that appears both before and after it counts by its first mention."""
    if not text:
        return set()
    m = SECONDARY_RE.search(text)
    if not m:
        return set()
    cut = m.start()
    return {n for n in names if n and text.find(n) >= cut}


# --------------------------------------------------------- resolve the corpus
bom = json.load(open(BOM, encoding="utf-8"))
recs, unresolved = [], {}
for t in bom["translations"]:
    geo, seen = [], set()
    home = LANG_HOME.get(t["language"])
    minor = secondary_names(t["locationsText"], t["locations"])
    for loc in ([home] if home else []) + t["locations"]:
        r = resolve(loc)
        if not r:
            unresolved[loc] = unresolved.get(loc, 0) + 1
            continue
        sig = (r["kind"], r["key"])
        if sig in seen:
            continue
        seen.add(sig)
        if loc in minor:
            r["secondary"] = True
        geo.append(r)
    # If every place was a footnote, keep them -- a page with no map at all is
    # worse than one centred on a diaspora.
    if geo and all(g.get("secondary") for g in geo):
        for g in geo:
            g.pop("secondary", None)
    t["geo"] = geo
    recs.append(t)

# Merge the article's duplicate listings: a language can sit in two tables,
# e.g. Deseret in complete + out-of-print, Navajo in selections + in-progress.
merged = {}
for t in sorted(recs, key=lambda r: (r["language"], r["year"] or 9999)):
    k = norm(t["language"])
    if k in merged:
        m = merged[k]
        m["alsoStatus"] = sorted(set(m.get("alsoStatus", []) + [t["status"]]))
        if t["year"] and (not m["year"] or t["year"] < m["year"]):
            m["year"], m["status"] = t["year"], t["status"]
        continue
    merged[k] = t
recs = sorted(merged.values(), key=lambda r: (r["year"] or 9999, r["language"]))

json.dump({"projection": "equal-earth",
           "viewBox": [0, 0, round(W, 1), round(H, 1)],
           "pacLon0": PAC_LON0,
           "outline": sphere_outline(),
           "countries": countries, "countriesPac": cmaps["Pac"],
           "points": pmaps[""], "pointsPac": pmaps["Pac"],
           "regions": regions},
          open(OUT_W, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
json.dump({"source": bom["source"], "translations": recs},
          open(OUT_D, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

nogeo = [t["language"] for t in recs if not t["geo"]]
print("countries=%d (pac %d) points=%d regions=%d" % (len(countries), len(cmaps["Pac"]), len(pmaps[""]), len(regions)))
print("translations=%d (merged from %d rows)" % (len(recs), len(bom["translations"])))
print("unresolved locations=%d: %s" % (len(unresolved), sorted(unresolved)))
print("translations with NO geo (%d): %s" % (len(nogeo), nogeo))
