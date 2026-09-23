# How AI Search Finds Things

The index inside most vector databases: points on a stack of graphs, sparse at the top and dense at the bottom. A search takes long jumps up high, drops down, and finds the closest matches after checking only a small fraction of the points.

A plain static page (canvas 2D, no build step, no network). It is one scene
packaged from the *Data Structures* project, which keeps the source, the
smoke tests and the research notes for every structure; regenerate this
folder with `scripts/package-single.py` there rather than editing it here.

- Autoplay runs the structure's own script on a loop; a visitor's phone
  (`controls/lib/index.js`) can take over, and 60 s of silence hands it back.
- Off the wall: `python3 -m http.server` in `web/`, move the mouse for the
  controls dock, or add `?interactive` to pin it.
- The protocol is documented at the top of `web/footron.js`.
