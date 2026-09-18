# Book of Mormon translations

A passive wall piece. It cycles pages about individual translations — each with
the book's title and 1 Nephi 3:7 set in that language's own script, and a map of
where the language is spoken — and every few pages steps back to an atlas that
plays the whole 1830–2024 timeline across the world.

There are no photographs in this experience. Everything on screen is drawn from
data at runtime: the covers are typeset, the maps are projected from vector
outlines, and the 20 writing systems come from glyph-subset webfonts that ship
inside the experience.

It runs on a dark ground — warm near-black, gold foil, off-white type. The
palette is the `:root` block in `web/index.html`; the one piece of it that
lives elsewhere is the map's sequential ramp, in `ERAS` in `web/app.js`. The
two have to be changed together: every ramp step must stay clear of `--land`,
or a country translated in the 1830s becomes indistinguishable from one that
has no translation at all.

## Tuning

The knobs are the constants at the top of `web/app.js`:

| Constant | What it does |
|---|---|
| `SCOPE` | `'curated'` plays the `FEATURED` list (~27 pages, ~6 min cycle); `'all'` plays every translation in the data (~126 pages, ~23 min) |
| `FEATURED` | Which languages get their own page, in order. Unknown names are skipped, so it is safe to edit freely |
| `PAGE_MS` / `ATLAS_MS` | Dwell time per language page / per atlas interlude |
| `ATLAS_EVERY` | How many language pages between atlas interludes |
| `ERAS` | The sequential colour ramp, oldest → newest |

`config.json`'s `lifetime` should cover one full cycle; at the defaults that is
about 400 seconds.

## Previewing

Serve `web/` over HTTP — `fetch` of the JSON will not work from `file://`:

```sh
cd web && python -m http.server 8765
```

Query parameters exist for working on one page without sitting through the
cycle. The wall loads the bare URL, so they are inert in production.

| Parameter | Effect |
|---|---|
| `?only=Japanese,Arabic` | Play only these languages |
| `?hold=1` | Freeze on the first page instead of advancing |
| `?atlas=1` | Open on the atlas |
| `?year=1980` | Freeze the atlas at one year instead of sweeping |

For example: `http://localhost:8765/?only=Tongan&hold=1`

## Regenerating the data

`web/data.json`, `web/world.json` and the fonts are all generated. Nothing in
them should be hand-edited — rerun the pipeline instead:

```sh
cd tools && sh build_all.sh
```

Order matters, and `build_all.sh` encodes it: the verses have to be fetched
before the fonts are subset, or the subsets will only cover the book titles and
every verse will render as tofu.

| Script | What it does |
|---|---|
| `parse_bom.py` | Parses the wikitext of Wikipedia's *List of Book of Mormon translations* into the raw table. Reads the wikitext rather than the rendered page so years, native titles and `{{lang}}` codes come through byte-exact |
| `build_geo.py` | Projects Natural Earth country outlines into SVG paths, resolves each language's locations to countries/points/regions, and merges the article's duplicate listings |
| `fetch_verses.py` | Fetches 1 Nephi 3:7 per language from the Church's scripture site |
| `fetch_fonts.py` | Downloads a glyph-subset woff2 per script, covering exactly the characters drawn |

The scripts need the source files that `build_all.sh` expects in the same
directory (the Natural Earth GeoJSON, the exported wikitext and the SIL ISO
639-3 table); each script's docstring names its source URL.

## Sources

- **Translations, dates, native titles, locations, speaker counts** —
  [List of Book of Mormon translations](https://en.wikipedia.org/wiki/List_of_Book_of_Mormon_translations),
  Wikipedia (CC BY-SA). Translations *not* published by the Church (Esperanto,
  Klingon, the independent Hebrew editions) are deliberately excluded.
- **Country outlines and microstate points** — [Natural Earth](https://www.naturalearthdata.com/)
  110m `admin_0_countries` and 50m `admin_0_tiny_countries`, public domain.
- **Verse text** — scriptures published by The Church of Jesus Christ of
  Latter-day Saints, one verse per language.
- **Fonts** — Google's Noto families, SIL Open Font License.

## Notes on the data

- **126 translations**, of which 121 have a verse. Hebrew (1981) is out of
  print with no text online, and American Sign Language is published as video;
  both, along with the two Braille editions and the Deseret Alphabet, show a
  short line explaining why instead of a verse.
- **The two Braille editions have no geography** and so get no map. Everything
  else resolves to at least one place.
- **A place mentioned only as a minority or diaspora is not lit.** Wikipedia
  gives Hawaiian's range as "Hawaiian Islands (minority in Continental United
  States)"; both are links, so taking the list flat lights the whole United
  States for a language of the islands. `build_geo.py` marks everything after
  a minority/expatriate/diaspora marker as `secondary`, and the page maps only
  the rest. It affects nine languages — Hawaiian, Māori, Welsh, Bulgarian,
  Kazakh and others. If that leaves a language with nowhere at all, the
  footnoted places are kept rather than showing no map.
- **Two projections ship** in `world.json`: Atlantic-centred and centred on
  150°E. Each page picks whichever keeps its places together, because an
  Atlantic-centred map tears the Pacific in half and the Pacific is where a
  large share of these translations live.
- **Some points are placed by hand** (Hawaii, Utah Territory, Wales, Chiapas,
  Chuuk…) because Natural Earth has no `admin_0` feature for them at any scale.
  They are accurate to roughly half a degree — fine for a pin, not a border.
- **The atlas colours each country for the *first* language spoken there to be
  published**, not the most recent, so the ramp reads as a date.
