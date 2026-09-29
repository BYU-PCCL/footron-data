# Houses of Light

A slideshow of Latter-day Saint temples: one photograph at a time, held long
enough to look at, with a chronology ribbon along the bottom and a globe in the
corner turning to each building's real coordinates.

## Licensing — please read

Two sources, on two different sets of terms.

**Wikimedia Commons** — CC BY, CC BY-SA, CC0 or public domain, credited to the
photographer as those licences require.

**The Church's media library** — the official photographs, and the reason
temples like Rome, Abidjan and Benin City are here at all. These are **not**
freely licensed. They are used under the
[Terms of Use](https://www.churchofjesuschrist.org/legal/terms-of-use?lang=eng)
on churchofjesuschrist.org, which permit posting Gospel Media elsewhere for
personal, noncommercial use, and copyright remains with Intellectual Reserve,
Inc. They are credited to Intellectual Reserve on the wall, in a different form
from the CC credits so the two are never confused.

Both are listed, in separate sections, in [CREDITS.md](CREDITS.md). Anyone
reusing this experience elsewhere should satisfy themselves that their own use
is within the Church's terms; a noncommercial display at a Church university is
the case it was added for.

## How the photographs were chosen

Roughly 1,100 candidates were harvested from Commons and scored by
**LAION-Aesthetics V2** (an MLP head over CLIP ViT-L/14 embeddings, trained on
human ratings), then filtered by five zero-shot CLIP gates that reject posed
groups, interiors, construction sites, visitor-centre scale models and
composited "giant moon" shots.

Three more filters are not models at all, because nothing here could separate
them: artists' renderings (the Church library carries them for temples that
were not yet built), a family of Commons uploads run through a sepia-and-grunge
treatment, and detail crops of a doorway or a statue. All three label
themselves in the filename — "Artist Rendition", "Aged", "Close-up" — so a
title match is exact where a CLIP gate would risk discarding real photographs.
Two remaining images are on an explicit denylist with their reasons recorded
beside them, the star-field composite of Draper among them.

**206 images across 201 temples in 48 countries** survived.

## Notes for this repo

* No build step — plain ES modules and static assets, so the tree served here
  is the tree that runs.
* The wall is 2736x1216 — 2.25:1 — and not one of these photographs is that
  wide (the median is 4:3). The frame is filled edge to edge and then travelled
  across: each slide opens at the foot of the picture and rises to the spire
  over its life, so all of it is seen. Cropping to fill and holding still would
  show 59% of a 4:3 photograph and cut the spire off a quarter of them.
* The running order is reshuffled on every load. Five minutes is about thirty
  slides out of two hundred, so a fixed order would show the same thirty
  temples to everyone; scores are jittered and the countries dealt at random,
  so it differs each boot while better photographs still tend to come early.
* The bottom-left corner is left clear for the launcher's "Scan to" QR card
  (300x300 plus 32 of padding): the caption, the credit line and the left end of
  the chronology ribbon all start to the right of it.
* The image set is 39 MB of WebP, sized by height — the most of a photograph
  the wall can ever show at once is its full height.
* Phone controls are off unless Footron passes `?ftMsgUrl=…`; append `?ftmsg=1`
  to test against a local messaging server.

The data pipeline that produced `web/assets/` is kept outside this repo.
