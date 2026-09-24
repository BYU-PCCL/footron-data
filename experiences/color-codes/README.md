# What Color Is This?

One color, written the three ways a computer writes colors — `#A7CC6D`,
`rgb(167, 204, 109)`, `hsl(83, 48%, 61%)` — with the arithmetic that gets from
each one to the next drawn rather than stated.

It plays on a loop unattended, about fifty seconds a run, on a new color every
time round. A phone can slow it down, freeze it, deal a new color — or switch
the wall into a quiz, where it shows a color and four codes and waits to be
told which one is right.

Everything on screen is computed at runtime from three bytes. There is no table
of colors with their codes typed in beside them anywhere in the experience,
which is the only reason the wall can be trusted when it says two notations are
the same color, and the only reason the game can mark an answer. See
**Honesty** below.

This shares its shell and its `draw.js` with the data-structures exhibits —
`bloom-filter` and `skip-list` — by copy, so a fix to `box`, `text` or `Beats`
is worth carrying across all three.

## Layout

| Path | What it is |
|---|---|
| `web/index.html` | The shell: page layout, the rail, the director that loops the run, canvas fitting, and the phone connection both ways |
| `web/draw.js` | Drawing helpers, the color ground, `Beats`, and the color conversions |
| `web/color.js` | The scene — both the attract run and the game |
| `controls/lib/index.js` | The phone panel, which is two panels: watching and playing |

The scene is a plain object pushed onto `window.Scenes`. The shell takes
`window.Scenes[0]` and talks to it only through `reset(seed)`, `step(dt)`,
`draw(ctx)`, `caption()`, `hot()`, `progress()`, `finished()`, `readout()`,
`phoneState()`, `answer(i)` and `nextRound()` — so it does not know what the
scene is about.

The scene draws into a fixed **1000 × 640** world and is contain-fitted, so it
never asks how big the wall is. The margin left over is painted the same color
as the world, so the seam does not show.

### Beats

The attract run is written as a *script*, not a state machine: `reset()` pushes
a list of beats onto a `Beats`, and each beat carries its duration, the line of
narration that goes in the rail while it runs, and the row of the readout to
light. The words and the picture are scheduled by the same object, so they
cannot drift apart. `tick(u)` gets progress from 0 to 1 and is always called
with exactly 1 as the beat ends.

The run builds up the right-hand column a block at a time — RGB, then its bits,
then hex, then HSL — and dims whatever the narration is not on. It ends by
**turning the hue**: the color, the bars, the digits, the ring and the chart all
move together for nine seconds. That beat is the point of the whole thing. Hue
is not a fourth number stored somewhere; it is the shape of the three that are,
and the only way to show that is to move it and let the channels chase each
other.

### The game

`game` mode is a separate picture drawn by the same scene: the color, four
codes, and a countdown to the next round once an answer is in.

- The notation **rotates** — hex, then `rgb()`, then `hsl()` — rather than being
  drawn at random, so a visitor who plays three rounds has met all three.
- The three wrong options are a color from elsewhere on the hue ring, a near
  neighbour on it, and the right hue at the wrong lightness. Every one of them
  is re-rolled until all four options are at least 85 apart in the byte cube,
  so they can be told apart across a room.
- They are **real colors**, and the wall draws each one beside its code once the
  answer is in. That is the part that teaches: a wrong guess shows you exactly
  what you picked.
- The caption on a wrong answer names the channel that actually differs most,
  with both numbers — computed from the two colors, not written per round.
- Under the swatch is a key for reading the notation this round is in, because
  the visitor being asked walked up thirty seconds ago and has no reason to know
  which two digits of six are the blue ones.

Left alone with an unanswered question for 75 seconds, the game hands the wall
back to the attract loop. A wall sitting on a question nobody answered looks
broken.

## Tuning

The knobs are the constants at the top of `web/color.js`: the geometry block,
`REVEAL_HOLD` (how long a marked answer stays up) and `IDLE_GIVE_UP`.

Changing the beat durations in `script()` changes the run length;
`config.json`'s `lifetime` should cover at least a couple of runs, and at the
defaults a run is about fifty seconds.

The captions state real quantities — the number of colors in 24 bits, what a
byte is worth in hex — and the ones that depend on the color compute themselves.

## Previewing

Serve `web/` over HTTP — opened from `file://` the page still runs, but the
kiosk does not, so preview it the way it ships:

```sh
cd web && python -m http.server 8000
```

| Parameter | Effect |
|---|---|
| `?t=12.5` | Fast-forward that many seconds into the run before drawing |
| `?seed=42` | Fix the color instead of taking it from the clock |
| `?hold=1` | Freeze once there |
| `?speed=2` | Run at a different rate |
| `?mode=game` | Start in the quiz instead of the attract loop |
| `?answer=2` | In the quiz, answer that option before drawing |
| `?bare=1` | The scene alone, edge to edge, with none of the chrome |

For example: `http://localhost:8000/?seed=7&t=46&hold=1` is the hue sweep, held
still. That is also the still in this folder — `thumb.jpg` is that URL with
`&bare=1` at 800 × 800, and `wide.jpg` is it without at 1200 × 800, so both can
be regenerated to the same framing rather than to a guess.

Seeking steps the scene at a fixed rate rather than jumping a clock, because a
beat's `enter`/`exit` hooks are what move the picture — skipping them would land
on a frame whose state never happened.

Keys, for the same reason: `space` pauses, `R` takes a new color, `G` switches
between watching and playing, `1`–`4` answer, `N` is the next round. The wall
has no keyboard.

## The phone

Unlike the other exhibits in this family, this one **talks back**: a panel
cannot draw four multiple-choice buttons without being told what the four
choices are. The wall is the authority and the phone follows it, so two phones
never disagree and a phone that connects mid-round gets the round that is
already on the wall.

| Message | Effect |
|---|---|
| `{type:"mode", value:"game"\|"show"}` | Switch between the quiz and the loop |
| `{type:"answer", index:0..3}` | Answer the open question |
| `{type:"next"}` | The next color, whether or not one is marked |
| `{type:"speed", value:<0.6–2.0>}` | Playback rate |
| `{type:"pause", value:<bool>}` | Freeze / resume |
| `{type:"shuffle"}` | A new color, from the top |
| `{type:"resume"}` | Defaults, the attract loop, from the top |

And back the other way, whenever what the panel should be drawing has gone
stale, plus once to each phone as it connects:

```js
{ type: "state", mode: "show" }
{ type: "state", mode: "game", round, notation, options: [4 strings],
  picked, correct, revealed, swatches: [4 hex] | null, right, asked }
```

The color itself is deliberately not in that message while a question is open.
The panel could easily draw the swatch, and then a visitor would play the whole
game with their back to the exhibit. Once an answer is in there is nothing left
to give away, so `swatches` arrives then.

The first answer decides the round; a second phone tapping a moment later is
answering a question that has already been marked, and is ignored rather than
quietly changing the score under the first visitor.

## Honesty

**Every number on the wall is derived from three bytes at runtime.** The scene
picks a color, and the hex digits, the percentages, the hue angle, the bit
pattern, the hue ring, the channel chart and all four options in the game come
out of the conversions at the bottom of `draw.js`. A color's byte triple is the
truth; `hsl()` on the wall is the correct rounding of *those* bytes, not the
numbers the color was generated from.

Colors are picked in HSL rather than as three random bytes, because three random
bytes gives a run of muddy colors that all look like each other. That is the one
place a human preference enters, and it only chooses which colors get shown —
never what is said about them.

`hsl()` here is CSS's `hsl()`, which treats sRGB as a plain cube of bytes. It is
not a perceptual space, and two colors with the same L can look quite different
in brightness. That is worth knowing and not worth saying on the wall.

## Notes

- The accent colour is the colour currently on the wall, floored to something
  readable by `D.legible()` and written onto `--accent` by the shell, so the
  rail and the progress bar move with the hue sweep. The structural greys live
  in two places that must be changed together: the `:root` block in
  `web/index.html` and `T` at the top of `web/draw.js`.
- Everything in `T` is a neutral on purpose. On an exhibit about colour, a page
  with a colour of its own sits next to the swatch and changes what the swatch
  looks like. The three channel colours and the two verdict colours are the only
  exceptions.
- The caption strings carry a little markup (`<b>`, `<i>`, `<em>`) and are
  written into the rail with `innerHTML`. The scene file is the only source of
  them; nothing from the phone reaches it.
