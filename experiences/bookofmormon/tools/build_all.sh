#!/bin/sh
# Regenerate everything the experience ships. Order matters: verses must exist
# before the fonts are subset, or the subsets cover only the book titles.
set -e
python build_geo.py ne110m.geojson ne_50m_admin_0_tiny_countries.geojson bom.json world.json data.json
python fetch_verses.py data.json iso639.tab vcache
python fetch_fonts.py data.json build/fonts
