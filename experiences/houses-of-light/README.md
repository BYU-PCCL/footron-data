# Houses of Light

A slideshow of Latter-day Saint temples: one photograph at a time, held long
enough to look at, with a chronology ribbon along the bottom and a globe in the
corner turning to each building's real coordinates.

## Licensing

Every photograph is from **Wikimedia Commons** under a free licence — CC BY,
CC BY-SA, CC0 or public domain. The photographer and the licence are shown on
the wall for the whole time each photograph is up, and the full table is in
[CREDITS.md](CREDITS.md).

The Church's own media library is deliberately *not* used: its terms permit
personal and church use, not redistribution on a public installation.

## How the photographs were chosen

Roughly 1,100 candidates were harvested from Commons and scored by
**LAION-Aesthetics V2** (an MLP head over CLIP ViT-L/14 embeddings, trained on
human ratings), then filtered by five zero-shot CLIP gates that reject posed
groups, interiors, construction sites, visitor-centre scale models and
composited "giant moon" shots. 171 images across 137 temples survived.

## Notes for this repo

* No build step — plain ES modules and static assets, so the tree served here
  is the tree that runs.
* The image set is 38 MB of WebP. Images are sized by *height*, because the
  photograph is fitted into the 2736x1216 frame rather than cropped to it: not
  one of these photographs is 2.25:1 (the median is 4:3), so cropping to fill
  would cut the spire off a quarter of them.
* Phone controls are off unless Footron passes `?ftMsgUrl=…`; append `?ftmsg=1`
  to test against a local messaging server.

The data pipeline that produced `web/assets/` is kept outside this repo.
