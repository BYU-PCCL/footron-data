# Learned Index

Replace an index with a model: plot where every key sits in sorted order, fit that curve with a few straight lines, and look only near the prediction. Proposed at Google in 2018 and made provably bounded by the PGM-index in 2020.

A plain static page (canvas 2D, no build step, no network). It is one scene
packaged from the *Data Structures* project, which keeps the source, the
smoke tests and the research notes for every structure; regenerate this
folder with `scripts/package-single.py` there rather than editing it here.

- Autoplay runs the structure's own script on a loop; a visitor's phone
  (`controls/lib/index.js`) can take over, and 60 s of silence hands it back.
- Off the wall: `python3 -m http.server` in `web/`, move the mouse for the
  controls dock, or add `?interactive` to pin it.
- The protocol is documented at the top of `web/footron.js`.
