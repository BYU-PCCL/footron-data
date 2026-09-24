# Have I Seen This Before?

A Bloom filter, shown as the thing it actually is in memory — thirty-two bits —
operated on one name at a time, with what it costs in the rail beside it.

It plays on a loop unattended, about forty seconds a run, and deals new data
every time round. A phone can slow it down, freeze it, or ask for a new deal.

Everything on screen is computed at runtime. The three hash functions are real
(FNV-1a, djb2 and sdbm), and the moment the exhibit is built around — the false
positive — is found by running the algorithm and keeping a data set that
produces one, not by drawing it in. See **Honesty** below.

This is one of four structures that were originally a single cycling exhibit,
`data-structures`. The other three now stand alone the same way: `skip-list`,
`union-find` and `cuckoo-hashing`. `web/draw.js` and the shell in
`web/index.html` are shared between them by copy, so a fix to either is worth
carrying across all four.

## Layout

| Path | What it is |
|---|---|
| `web/index.html` | The shell: page layout, the rail, the director that loops the run, canvas fitting, and the phone connection |
| `web/draw.js` | Shared drawing helpers, the colour ground, the three hash functions, and `Beats` |
| `web/bloom.js` | The scene |
| `controls/lib/index.js` | The phone panel |

The scene is a plain object pushed onto `window.Scenes`. It declares `id`,
`name`, `question`, `accent`, a `cost` table and a `uses` line for the rail, and
implements `reset(seed)`, `step(dt)` and `draw(ctx)`. The shell takes
`window.Scenes[0]` and never looks at anything else, so it does not know which
structure it was built around — the `<script>` tag is the only place that is
named.

The scene draws into a fixed **1000 × 640** world and is contain-fitted, so it
never asks how big the wall is. The margin left over is painted the same colour
as the world, so the seam does not show.

### Beats

The scene is written as a *script*, not a state machine: `reset()` pushes a list
of beats onto a `Beats`, and each beat carries its duration, the line of
narration that goes in the rail while it runs, and the row of the cost table to
light. The words and the picture are scheduled by the same object, so they
cannot drift apart. `tick(u)` gets progress from 0 to 1 and is always called
with exactly 1 as the beat ends, so a beat that moves something into place
always finishes with it in place.

## Tuning

The constants at the top of `web/bloom.js` are the knobs — `M` for the number of
bits, `K` for the hash count, `N_INSERT` for how many names go in before
anything is asked.

Changing them changes what the captions say, so the captions have to be read
after. Several are written to state real quantities (how many names set the
false positive's bits, the false positive rate at this fill), and those compute
themselves — but the ones that do not, will lie.

`config.json`'s `lifetime` should cover at least a couple of runs; at the
defaults a run is about forty seconds, and it is set to 180.

## Previewing

Serve `web/` over HTTP — opened from `file://` the page still runs, but the
kiosk does not, so preview it the way it ships:

```sh
cd web && python -m http.server 8000
```

Query parameters exist so a moment can be looked at over and over without
waiting for it to come round. The wall loads the bare URL, so they are inert in
production.

| Parameter | Effect |
|---|---|
| `?t=12.5` | Fast-forward that many seconds into the run before drawing |
| `?seed=42` | Fix the data instead of taking it from the clock |
| `?hold=1` | Freeze once there |
| `?speed=2` | Run at a different rate |
| `?bare=1` | The scene alone, edge to edge, with none of the chrome |

For example: `http://localhost:8000/?seed=1&t=32&hold=1` is the false positive,
held still. That is also the still in this folder — `thumb.jpg` is that URL with
`&bare=1` at 800 × 800, and `wide.jpg` is it without at 1200 × 800, so both can
be regenerated to the same framing rather than to a guess.

Seeking steps the scene at a fixed rate rather than jumping a clock, because a
beat's `enter`/`exit` hooks are what move the data — skipping them would land on
a frame whose state never happened.

Keys, for the same reason: `space` pauses, `R` deals new data. The wall has no
keyboard.

## The phone

Three controls, and deliberately no more. There is no knob for the number of
bits or the hash count: those change what the captions say, and a panel that can
put the wall's narration out of step with its picture is worse than no panel.

| Message | Effect |
|---|---|
| `{type:"speed", value:<0.6–2.0>}` | Playback rate |
| `{type:"pause", value:<bool>}` | Freeze / resume |
| `{type:"shuffle"}` | Deal new names and play again from the top |
| `{type:"resume"}` | Defaults, and play again from the top |

Nothing is ever sent back the other way: the wall only adds a listener, so the
panel owns its own state and seeds it from the same defaults.

## Honesty

**The false positive is genuine.** `reset()` picks seven names, fills the bit
array, then searches the rest of the pool for a name whose three bits all happen
to be set already. Across 3,000 seeds it found one every time. It prefers the
candidate whose bits were set by the most different names, and the caption says
how many it actually was — usually three, sometimes two.

The names are computer scientists, which is a pool the exhibit can draw a
different seven from every time without any of them needing to be explained.
Burton Bloom is in there on purpose.

## Notes

- The accent colour lives in `web/bloom.js` and is set on `--accent` by the
  shell, so the rail and the progress bar recolour with it. The structural greys
  live in two places that must be changed together: the `:root` block in
  `web/index.html` and `T` at the top of `web/draw.js`.
- The caption strings carry a little markup (`<b>`, `<i>`, `<em>`) and are
  written into the rail with `innerHTML`. The scene file is the only source of
  them; nothing from the phone reaches it.
- `web/draw.js` still carries everything the other three scenes need — the
  arc helpers, the group colours, all three hash functions. It is copied across
  the four unchanged on purpose, so that a fix ports by copying the file.
