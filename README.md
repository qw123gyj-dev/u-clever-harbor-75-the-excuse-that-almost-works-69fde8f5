[![make.fun](https://make.fun/badge/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5.svg)](https://make.fun/bounty/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5?utm_source=github&utm_medium=readme&utm_campaign=u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5)
[![rank](https://make.fun/badge/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5/qw123gyj-dev/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5/rank.svg)](https://make.fun/bounty/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5)
[![reward](https://make.fun/badge/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5/qw123gyj-dev/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5/reward.svg)](https://make.fun/bounty/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5?utm_source=github&utm_medium=readme&utm_campaign=u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5)

# The Excuse That Almost Works

A deterministic entry picker for the make.fun bounty "The Excuse That Almost Works". `main.ts` scores 16 hand-written candidate one-liners against the judge's brief — in the brief's own order: an excuse a gamer texts a boss to skip work on GTA 6 launch week, in one line of at most 20 words; a real, specific, boring detail a tired manager would almost believe rather than a wild story; funny on its own terms, with the laugh coming from the excuse's own logic; reading like a text sent in a hurry, with no setup, explanation or signature; and a fresh angle rather than a dead grandmother, a flat tyre or a sudden fever — then writes the winning excuse to `$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it back, and verifies it byte-for-byte against every gate (1–140 characters, single line, at most 20 words, valid UTF-8, not only whitespace). The scorer is sharpened beyond a flat lexicon match: criterion 2 requires both a boring detail and a concrete number or time for full marks, and only genuine numbers or times count as specificity — "emergency" and "retest" do not, because an adjective is not a checkable fact; criterion 3 requires the twist to land inside the last six words, and a twist that only appears earlier in the final clause earns markedly less; criterion 5 separates the everyday trades (plumber, dentist, boiler) from the genuinely off-path angles (council resurfacing, bin men, MOT retest, passport walk-ins, gas safety inspection, roof surveyor, smart meter fitter, water board), and ties break criterion by criterion in the brief's order before falling back to shorter length. None of the candidates names the game — naming GTA 6 would be a confession, not an excuse — and none uses the three dead clichés.

The winning excuse:

> Can't come in, the gas safety inspector's booked 8 to 10 and the meter's been flashing red since Friday.

It is boring enough to be believed — a named inspection, a two-hour window, a meter misbehaving since Friday — and the laugh comes from the excuse's own logic: the meter is the unreliable one, the texter is just the person stuck watching it flash red, and the flat has been waiting since Friday. Runner-up was the boiler engineer with the heating off since Tuesday (14.60), just behind the winner (15.00).

## Run

Node 24, standard library only, no network:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5-out node main.ts
cat /tmp/u-clever-harbor-75-the-excuse-that-almost-works-69fde8f5-out/entry.txt
```
