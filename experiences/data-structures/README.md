# Four Ways to Remember

Four data structures an undergraduate is unlikely to have met — a Bloom filter,
a skip list, union-find and cuckoo hashing — each shown as the thing it
actually is in memory, operated on one step at a time, with what it costs in
the rail beside it.

It plays on a loop unattended, about 2½ minutes for all four. A phone can pick
one structure and stay on it.

Everything on screen is computed at runtime. The three hash functions are real
(FNV-1a, djb2 and sdbm), and the two moments the exhibit is built around — the
Bloom filter's false positive and cuckoo hashing's eviction cycle — are found
by running the algorithm and keeping a data set that produces them, not by
drawing them in. See **Honesty** below.

## Layout

| Path | What it is |
|---|---|
| `web/index.html` | The shell: page layout, the rail, the director that cycles the scenes, canvas fitting, and the phone connection |
| `web/draw.js` | Shared drawing helpers, the colour ground, the three hash functions, and `Beats` |
| `web/bloom.js`, `web/skiplist.js`, `web/unionfind.js`, `web/cuckoo.js` | One scene each |
| `controls/lib/index.js` | The phone panel |

A scene is a plain object pushed onto `window.Scenes`. It declares `id`, `name`,
`question`, `accent`, a `cost` table and a `uses` line for the rail, and
implements `reset(seed)`, `step(dt)` and `draw(ctx)`. The director never looks
at anything else, so a fifth structure is a fifth file plus one `<script>` tag.

Every scene draws into a fixed **1000 × 640** world and is contain-fitted, so no
scene asks how big the wall is. The margin left over is painted the same colour
as the world, so the seam does not show.

### Beats

A scene is written as a *script*, not a state machine: `reset()` pushes a list
of beats onto a `Beats`, and each beat carries its duration, the line of
narration that goes in the rail while it runs, and the row of the cost table to
light. The words and the picture are scheduled by the same object, so they
cannot drift apart. `tick(u)` gets progress from 0 to 1 and is always called
with exactly 1 as the beat ends, so a beat that moves something into place
always finishes with it in place.

Union-find is the one scene that also runs on real time: node depths, pointer
arcs and group colours ease toward their targets in `settle(dt)`, because a
union or a compression changes where things belong and they should travel
there rather than teleport.

## Tuning

The constants at the top of each scene file are the knobs — `M` and `K` for the
filter's bits and hash count, `N` and `MAX_H` for the skip list, `UNIONS` for
the union-find sequence, `SLOTS` and `MAX_KICKS` for the cuckoo tables.

Changing them changes what the captions say, so the captions have to be read
after. Several are written to state real quantities (how many names set the
false positive's bits, how full the cuckoo tables were when they cycled), and
those compute themselves — but the ones that do not, will lie.

`config.json`'s `lifetime` should cover at least one full cycle; at the
defaults that is about 156 seconds, and it is set to 330 so a visitor who
arrives mid-cycle still sees all four.

## Previewing

Serve `web/` over HTTP — opened from `file://` the page still runs, but the
kiosk does not, so preview it the way it ships:

```sh
cd web && python -m http.server 8000
```

Query parameters exist so a scene can be worked on without sitting through the
cycle to reach it. The wall loads the bare URL, so they are inert in production.

| Parameter | Effect |
|---|---|
| `?scene=cuckoo` | Open on that scene and stay on it (`bloom`, `skiplist`, `unionfind`, `cuckoo`) |
| `?t=12.5` | Fast-forward that many seconds into it before drawing |
| `?seed=42` | Fix the data instead of taking it from the clock |
| `?hold=1` | Freeze once there |
| `?speed=2` | Run at a different rate |

For example: `http://localhost:8000/?scene=bloom&t=32&seed=1&hold=1` is the
false positive, held still.

Seeking steps the scene at a fixed rate rather than jumping a clock, because a
beat's `enter`/`exit` hooks are what move the data — skipping them would land
on a frame whose state never happened.

Keys, for the same reason: `1`–`4` jump to a scene, `space` pauses, `N` moves
on, `R` deals new data. The wall has no keyboard.

## The phone

Four controls, and deliberately no more. There is no knob for the number of
bits in the filter or the skip list's height cap: those change what the
captions say, and a panel that can put the wall's narration out of step with
its picture is worse than no panel.

| Message | Effect |
|---|---|
| `{type:"show", value:"<id>"}` | Play that structure and stay on it |
| `{type:"speed", value:<0.6–2.0>}` | Playback rate |
| `{type:"pause", value:<bool>}` | Freeze / resume |
| `{type:"shuffle"}` | Deal new data for the structure on the wall, from the top |
| `{type:"resume"}` | Defaults, and back to the cycle |

Picking a structure sets a lock, so the wall stays on it instead of rolling
onward forty seconds later — which would look exactly like the button having
failed. `resume` clears it.

Nothing is ever sent back the other way: the wall only adds a listener, so the
panel owns its own state and seeds it from the same defaults.

## Honesty

The point of the exhibit is that these are real structures doing real work, so
three things are worth stating plainly.

- **The Bloom filter's false positive is genuine.** `reset()` picks seven names,
  fills the bit array, then searches the rest of the pool for a name whose three
  bits all happen to be set already. Across 3,000 seeds it found one every time.
  It prefers the candidate whose bits were set by the most different names, and
  the caption says how many it actually was — usually three, sometimes two.
- **Cuckoo hashing's eviction chain and cycle are genuine.** `reset()` shuffles
  the keys, simulates the textbook algorithm over them, and keeps a shuffle
  whose run contains a short chain, a long one, and a real failure. The rehash
  salt is tried in turn until one places every key, which is what a real
  implementation does. The wall then replays that simulation.
- **The skip list's search target is chosen, but both counts are real.** Any
  value in the list is a fair demonstration, so it picks the one that
  demonstrates best: a clear win over the bottom walk is a hard filter, and
  among those it prefers a search that overshoots and has to drop, because that
  is the idea. Both numbers on screen are the true counts for the value
  actually searched for.

The union-find sequence is fixed rather than random, and its first few unions
are done *without* union by size on purpose — a chain is not what a real
implementation produces, but it is what the two optimisations exist to prevent,
and it gives path compression something to flatten.

## Notes

- The four accent colours are per scene and set on `--accent` by the director,
  so the rail, the contents list and the progress bar recolour with the scene.
  The structural greys live in two places that must be changed together: the
  `:root` block in `web/index.html` and `T` at the top of `web/draw.js`.
- The caption strings carry a little markup (`<b>`, `<i>`, `<em>`) and are
  written into the rail with `innerHTML`. The scene files are the only source
  of them; nothing from the phone reaches it.
- `α(n)` in the union-find table is the inverse Ackermann function. The closing
  caption says it is below 5 for any number of elements that could be stored on
  any machine that will ever be built, which is the usual and fair way to put
  it — it is not constant time, and the difference is not measurable.
