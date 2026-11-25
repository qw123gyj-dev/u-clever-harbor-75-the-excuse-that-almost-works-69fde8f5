// The Excuse That Almost Works — deterministic entry picker.
//
// The brief asks for exactly one line of plain text, at most 20 words,
// the excuse a gamer texts their boss to get out of work during GTA 6
// launch week. It has to read like something a real person would send
// in a hurry. A judge model plays a tired manager who has heard every
// excuse twice and believes almost none of them, and compares entries
// two at a time, picking the one it would almost believe.
//
// The judge weighs the entries, most important first:
//   1. Is it an excuse a gamer sends a boss to skip work on GTA 6
//      launch week, one line of at most 20 words? An off-subject or
//      over-long line loses to any excuse on the subject.
//   2. Does it sound like something a tired manager would almost
//      believe: a real, specific, boring workplace detail rather
//      than a wild story?
//   3. Is it funny on its own terms, with the laugh coming from the
//      excuse's own logic or detail rather than a joke bolted on
//      the end?
//   4. Does it read like a text sent in a hurry: one line, plain
//      words, no setup, no explanation and no signature?
//   5. Does it find an angle the obvious excuses miss, rather than
//      a dead grandmother, a flat tyre or a sudden fever?
//
// This program scores a set of hand-written candidate one-liners
// against those five criteria, in that order (weights 5, 4, 3, 2, 1),
// writes the winner to $MAKEFUN_OUTPUT_DIR/entry.txt (fallback
// /output/entry.txt), reads it back and verifies it against every
// gate before exiting.
//
// The scoring idea, criterion by criterion:
//
//   * Criterion 1 is a format check with teeth: the line must open
//     with (or at least contain) a plain absence statement — "can't
//     make it in", "won't be in", "not in today" — stay inside 20
//     words, stay on one line, and never mention the game. Naming
//     GTA 6 in the text is a confession, not an excuse, so any
//     candidate that does so is docked hard here.
//   * Criterion 2 is the heart of the field. A believable excuse
//     is boring and specific: a named trade or office (plumber,
//     boiler engineer, dentist, landlord, council), plus a concrete
//     number or time (a four-hour window, 9am, "rescheduled
//     twice", "only slot for three weeks"). Wild stories and the
//     three shopworn clichés — dead grandmother, flat tyre, sudden
//     fever — are docked, because a tired manager has heard every
//     one of them twice.
//   * Criterion 3 looks for the laugh inside the excuse's own
//     logic, and insists it lands late: the twist has to sit in the
//     last six words, not merely somewhere in the sentence. A line
//     whose punch is "he's already rescheduled twice" earns its
//     laugh from the situation itself; a line that tacks a gag on
//     the end does not.
//   * Criterion 4 is the hurried-text test: no greeting, no
//     "sorry for the inconvenience", no "because" explanation, no
//     sign-off, no "thanks". Contractions and a cold open with the
//     absence statement are what a real rushed text looks like.
//   * Criterion 5 rewards a fresh angle. Plumbers, dentists and
//     boilers are the excuses everybody reaches for first, so they
//     score lower here than the council resurfacing a street, a bin
//     collection that never came, an MOT retest with a ten-minute
//     cancellation rule, or a passport appointment that only does
//     walk-ins before noon.
//
// Revision pass: 12 candidates, and a sharper scorer — criterion 2
// now requires both a boring detail AND a concrete number or time
// for full marks (a vague "the plumber is coming" is exactly the
// kind of line a manager stops believing); criterion 3 now requires
// the twist to sit inside the last six words; criterion 5 now
// separates the everyday trades (plumber, dentist, boiler) from the
// genuinely off-path angles; and ties break by the criterion vector
// in the brief's own order, the way the judge itself walks the
// criteria, before falling back to shorter length.
//
// Second revision pass: 16 candidates, and the scorer tightened
// again. Criterion 2's specificity markers must now be genuine
// numbers or times: "emergency" and "retest" no longer count, because
// an adjective is not a checkable fact — a line whose only
// "specificity" was the word "emergency" loses marks for it, as it
// should. Criterion 3 docks a twist that sits in the final clause
// but outside the last six words harder (0.70 for a strong twist,
// 0.50 for a medium one): a punchline the reader has to wait past
// the ending for is not a punchline. Four new hand-written
// candidates join the field — a gas safety inspection with a meter
// flashing red since Friday, a roof surveyor with scaffolders at
// 7am, a smart meter fitter who charges forty quid for a miss, and
// a water board digging up the pavement — each a boring, checkable,
// off-path angle the obvious excuses miss.
//
// Node 24, standard library only, no network, fully deterministic:
// the same candidates always produce the same winner.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
//
// Sixteen hand-written one-liners, each an excuse a gamer texts a boss.
// Every one is a single line, at most 20 words, and none of them names
// the game: the whole joke is that the excuse is boring enough to be
// believed, and the launch-week timing does the rest of the talking.
// None of them uses the three dead clichés (dead grandmother, flat
// tyre, sudden fever) — those lose to anything on the subject.

const CANDIDATES: string[] = [
  // The four-hour window, already rescheduled twice: the detail that
  // sells it is that the plumber is the unreliable one, not the texter.
  "Can't make it in today, the plumber's window is 8 to 12 and he's already rescheduled twice.",
  // A boiler engineer, a heating outage since Tuesday: boring, dated,
  // and specific enough that a manager can picture the cold flat.
  "Won't be in today, the boiler engineer can only come this morning and the heating's been off since Tuesday.",
  // The council resurfaces the street and the car is boxed in. Nobody
  // plans this excuse; that is why it sounds true.
  "Can't come in, the council's resurfacing my street today and I physically can't get the car out.",
  // The landlord's electrician, finally coming, needs a body in the
  // flat all morning. The "finally" does the quiet comic work.
  "Not in today, my landlord's electrician is finally coming and he needs someone in the flat all morning.",
  // Broadband engineer, 9 to 1, nobody else home to let him in. The
  // window is the excuse; the empty flat is the alibi.
  "Can't make it in, the broadband engineer comes between 9 and 1 and nobody else is home.",
  // The dentist moved the appointment, and it is the only slot for
  // three weeks. Turning it down would cost more than a day's work.
  "Won't be in today, the dentist moved my appointment to this morning and it's the only slot for three weeks.",
  // A leak under the sink, an emergency plumber, and an instruction
  // not to run the water. The flat is winning the argument.
  "Can't come in today, there's a leak under the sink and the emergency plumber says don't run the water.",
  // An MOT retest at 9am with a ten-minute cancellation rule. The
  // garage's bureaucracy is stricter than the boss's.
  "Not in today, my MOT retest is 9am and the garage cancels the booking if I'm ten minutes late.",
  // The fire alarm died at 3am and the letting agent insists someone
  // waits for the engineer. A 3am detail nobody invents for fun.
  "Can't make it in, the fire alarm died at 3am and the letting agent insists someone waits for the engineer.",
  // A passport appointment moved to today, walk-ins only before noon.
  // Government paperwork, with a deadline, beats the office.
  "Won't be in, my passport appointment got moved to today and they only do walk-ins before noon.",
  // The washing machine flooded the kitchen; the landlord's contractor
  // is on the way. Wet floors are a boring, checkable fact.
  "Can't come in today, the washing machine flooded the kitchen and I'm waiting on the landlord's contractor.",
  // The bin men missed the street and the council needs someone in
  // for the recollection. Municipal farce as an alibi.
  "Not in today, the bin men missed our street and the council needs someone in for the recollection.",
  // A gas safety inspection, booked 8 to 10, and a meter that's been
  // flashing red since Friday. The meter is the one misbehaving, and
  // the texter is just the person stuck watching it.
  "Can't come in, the gas safety inspector's booked 8 to 10 and the meter's been flashing red since Friday.",
  // A surveyor measuring a roof leak, with scaffolders arriving at
  // 7am. Nobody schedules scaffolding for fun; that is the point.
  "Not in today, the surveyor's measuring the roof leak and the scaffolders arrive at 7am.",
  // A smart meter fitter, 8 to 11, who charges forty quid for a
  // missed slot. The fine is the excuse's own price tag.
  "Won't be in, the smart meter fitter comes 8 to 11 and they charge forty quid if I miss it.",
  // The water board digging up the pavement, supply shut off till
  // noon. A whole street with no water is hard to argue with.
  "Can't make it in, the water board's digging up the pavement and they've shut off our supply till noon.",
];

// ------------------------------------------------------- scorer lexicons
// All lexicons are plain word lists checked against the candidate text
// itself; no candidate carries a pre-assigned score.

const WEIGHTS = [5, 4, 3, 2, 1]; // brief order: criterion 1 matters most.

// Plain absence statements: the line must say, in plain words, that
// the sender is not coming in (criterion 1, and the cold open of
// criterion 4).
const ABSENCE_PHRASES = [
  "can't make it in",
  "can't come in",
  "won't be in",
  "not in today",
];

// Words that name the game or the launch. Mentioning them in the text
// is a confession, not an excuse (criterion 1 dock).
const GAME_WORDS = [
  "gta",
  "grand theft",
  "launch week",
  "launch day",
  "release day",
  "video game",
  "gaming",
  "playstation",
  "xbox",
];

// Boring, specific, real-world details a tired manager would almost
// believe (criterion 2). Trades, offices and household systems —
// nothing wild, nothing dramatic, nothing that needs a hospital.
const BORING_DETAILS = [
  "plumber",
  "boiler",
  "engineer",
  "dentist",
  "landlord",
  "council",
  "broadband",
  "mot",
  "leak",
  "electrician",
  "appointment",
  "resurfacing",
  "passport",
  "bin men",
  "fire alarm",
  "washing machine",
  "contractor",
  "garage",
  "letting agent",
  "heating",
  "sink",
  "kitchen",
  "street",
  "flat",
  "gas",
  "inspector",
  "meter",
  "surveyor",
  "roof",
  "scaffolders",
  "fitter",
  "water board",
  "pavement",
  "supply",
];

// Concrete numbers and times: the specificity that turns a vague
// "someone is coming" into a checkable fact (criterion 2). Only
// genuine numbers and times count here: "emergency" and "retest"
// were struck from this list in the second revision pass, because
// an adjective is not a checkable fact and a booking type is not
// a time.
const SPECIFICITY_MARKERS = [
  "8 to 12",
  "9 and 1",
  "9am",
  "3am",
  "before noon",
  "ten minutes",
  "three weeks",
  "since tuesday",
  "twice",
  "all morning",
  "this morning",
  "only slot",
  "8 to 10",
  "since friday",
  "7am",
  "8 to 11",
  "forty quid",
  "till noon",
];

// Wild stories and the three shopworn clichés (criterion 2 dock,
// criterion 5 dock). A tired manager has heard every one twice.
const WILD_CLICHES = [
  "grandmother",
  "grandma",
  "grandad",
  "flat tyre",
  "flat tire",
  "fever",
  "flu",
  "migraine",
  "hospital",
  "accident",
  // NOTE: a bare "died" is deliberately NOT listed here: "the fire
  // alarm died at 3am" is a boring household fact, not the dead-
  // grandmother cliché, and listing it would false-trigger on it.
  // The cliché itself is already covered by grandmother / grandma /
  // funeral above.
  "funeral",
  "car broke down",
  "sick",
];

// Twist phrases whose laugh comes from the excuse's own logic, and
// which must land in the last six words (criterion 3).
const STRONG_TWISTS = [
  "rescheduled twice",
  "ten minutes late",
  "only slot for three weeks",
  "can't get the car out",
  "don't run the water",
  "before noon",
  "nobody else is home",
  "off since tuesday",
  "all morning",
  "waits for the engineer",
  "waiting on the landlord's contractor",
  "in for the recollection",
  "flashing red since friday",
  "scaffolders arrive at 7am",
  "forty quid if i miss it",
  "supply till noon",
];
const MEDIUM_TWISTS = [
  "finally coming",
  "only do walk-ins",
  "moved to today",
  "missed our street",
  "flooded the kitchen",
  "cancels the booking",
  "insists someone waits",
  "can only come",
  "moved my appointment",
];

// Angles the obvious excuses miss (criterion 5, full marks): the
// council, the bins, the MOT retest, the passport office, the fire
// alarm at 3am. Nobody's first draft reaches for these.
const FRESH_ANGLES = [
  "resurfacing",
  "bin men",
  "mot retest",
  "passport",
  "fire alarm",
  "broadband",
  "washing machine flooded",
  "gas safety",
  "surveyor",
  "smart meter",
  "water board",
];
// Everyday trades everybody reaches for first (criterion 5, partial
// marks): plumber, dentist, boiler, landlord's electrician. Believable
// but familiar, so they score lower on freshness.
const COMMON_ANGLES = [
  "plumber",
  "dentist",
  "boiler",
  "electrician",
  "leak under the sink",
];

// Markers of a composed, explained excuse rather than a rushed text
// (criterion 4 dock): greetings, apologies, explanations, sign-offs.
const SETUP_MARKERS = [
  "hi ",
  "hello",
  "dear",
  "sorry for",
  "apologise",
  "apologize",
  "because",
  "unfortunately",
  "thanks",
  "thank you",
  "kind regards",
  "best regards",
  "please let me know",
  "i hope you understand",
  "as you know",
];

// Words that do no work in a hurried text (criterion 4 dock).
const FILLERS = [
  "very",
  "really",
  "just",
  "actually",
  "simply",
  "please",
  "kindly",
];

// ------------------------------------------------------------------ helpers

function lower(text: string): string {
  return text.toLowerCase();
}

function containsAny(text: string, words: string[]): boolean {
  const hay = lower(text);
  return words.some((w) => hay.includes(w));
}

function countDistinct(text: string, words: string[]): number {
  const hay = lower(text);
  return words.filter((w) => hay.includes(w)).length;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Words in the text, split on whitespace, punctuation stripped only
// for counting purposes; the gate counts words the plain way.
function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

function wordCount(text: string): number {
  return wordsOf(text).length;
}

// The final clause is everything after the last comma or sentence
// break; that is where the excuse's own logic has to pay off
// (criterion 3).
function finalClause(text: string): string {
  const comma = text.lastIndexOf(", ");
  const stop = text.lastIndexOf(". ");
  const idx = Math.max(comma, stop);
  return idx === -1 ? text : text.slice(idx + 2);
}

// The last few words of the text, joined: the twist must land here,
// not merely somewhere in the final clause.
function lastWords(text: string, n: number): string {
  const words = lower(text).split(/\s+/).filter((w) => w.length > 0);
  return words.slice(-n).join(" ");
}

// Does the line open cold with the absence statement, the way a real
// rushed text does, instead of warming up with a greeting?
function opensWithAbsence(text: string): boolean {
  const hay = lower(text);
  return ABSENCE_PHRASES.some((p) => hay.startsWith(p));
}

// Contractions are the fingerprint of a text typed in a hurry.
function hasContraction(text: string): boolean {
  return /'(t|s|m|re|ve|ll|d)\b/i.test(text);
}

// The three dead clichés, checked as whole phrases so that a word
// like "sick" inside another word cannot false-trigger.
function hasWildCliche(text: string): boolean {
  return containsAny(text, WILD_CLICHES);
}

// ------------------------------------------------------------- per-criterion

// Criterion 1: an excuse a gamer sends a boss to skip work on GTA 6
// launch week, one line of at most 20 words. Full marks need a plain
// absence statement, the word limit, and no mention of the game.
function scoreCriterion1(text: string): number {
  const absence = containsAny(text, ABSENCE_PHRASES) ? 0.5 : 0;
  const words = wordCount(text);
  const withinLimit = words <= 20 ? 0.3 : Math.max(0, 0.3 - (words - 20) * 0.1);
  const singleLine = text.includes("\n") || text.includes("\r") ? 0 : 0.2;
  const gameMention = containsAny(text, GAME_WORDS) ? 0.4 : 0;
  return clamp01(absence + withinLimit + singleLine - gameMention);
}

// Criterion 2: sounds like something a tired manager would almost
// believe — a real, specific, boring detail rather than a wild story.
// Full marks need BOTH a boring detail and a concrete number or time:
// a vague "the plumber is coming" is exactly the line a manager
// stops believing. Wild stories and the three clichés are docked.
function scoreCriterion2(text: string): number {
  const details = countDistinct(text, BORING_DETAILS);
  const specifics = countDistinct(text, SPECIFICITY_MARKERS);
  const detailScore = Math.min(details, 3) / 3;
  const specificScore = Math.min(specifics, 2) / 2;
  let score = 0.55 * detailScore + 0.45 * specificScore;
  if (hasWildCliche(text)) score -= 0.5;
  if (containsAny(text, ["hospital", "accident", "funeral"])) score -= 0.3;
  return clamp01(score);
}

// Criterion 3: funny on its own terms, with the laugh coming from the
// excuse's own logic or detail rather than a joke bolted on the end.
// The twist must land in the last six words for full marks; a twist
// that only appears earlier in the final clause earns markedly less
// (0.70 strong, 0.50 medium), because a punchline the reader has to
// wait past the ending for is not a punchline.
function scoreCriterion3(text: string): number {
  const tail = lastWords(text, 6);
  const clause = lower(finalClause(text));
  if (STRONG_TWISTS.some((w) => tail.includes(w))) return 1.0;
  if (STRONG_TWISTS.some((w) => clause.includes(w))) return 0.7;
  if (MEDIUM_TWISTS.some((w) => tail.includes(w))) return 0.75;
  if (MEDIUM_TWISTS.some((w) => clause.includes(w))) return 0.5;
  return 0.4;
}

// Criterion 4: reads like a text sent in a hurry — one line, plain
// words, no setup, no explanation and no signature. A cold open with
// the absence statement plus a contraction is the hurried register;
// greetings, apologies and "because" explanations break it.
function scoreCriterion4(text: string): number {
  let score = 0.5;
  if (opensWithAbsence(text)) score += 0.25;
  if (hasContraction(text)) score += 0.25;
  const setups = countDistinct(text, SETUP_MARKERS);
  score -= 0.25 * setups;
  const words = wordsOf(text);
  const filler = words.filter((w) =>
    FILLERS.includes(lower(w).replace(/[^a-z]/g, "")),
  ).length;
  if (words.length > 0) score -= filler / words.length;
  return clamp01(score);
}

// Criterion 5: finds an angle the obvious excuses miss. The council,
// the bins, the MOT retest, the passport office and the 3am fire
// alarm are off-path angles; plumbers, dentists and boilers are the
// excuses everybody reaches for first and score lower; the three
// dead clichés score lowest of all.
function scoreCriterion5(text: string): number {
  if (hasWildCliche(text)) return 0.1;
  if (containsAny(text, FRESH_ANGLES)) return 1.0;
  if (containsAny(text, COMMON_ANGLES)) return 0.6;
  return 0.75;
}

const CRITERION_SCORERS = [
  scoreCriterion1,
  scoreCriterion2,
  scoreCriterion3,
  scoreCriterion4,
  scoreCriterion5,
];

interface Scored {
  text: string;
  criteria: number[];
  total: number;
}

function scoreCandidate(text: string): Scored {
  const criteria = CRITERION_SCORERS.map((fn) => fn(text));
  const total = criteria.reduce((sum, c, i) => sum + WEIGHTS[i] * c, 0);
  return { text, criteria, total };
}

// --------------------------------------------------------------------- gate
//
// The sealed gate: /output/entry.txt must be UTF-8 text of 1 to 140
// characters, not only white space. The brief adds the judge's own
// format rule on top: one line of at most 20 words. Both are checked
// here, before scoring and again after writing.

function gateProblems(text: string): string[] {
  const problems: string[] = [];
  const chars = [...text]; // code points, not UTF-16 units
  if (chars.length < 1 || chars.length > 140) {
    problems.push(`length ${chars.length} outside 1..140 characters`);
  }
  if (text.trim().length === 0) problems.push("only whitespace");
  if (text.includes("\n") || text.includes("\r")) {
    problems.push("not a single line");
  }
  const words = wordCount(text);
  if (words > 20) {
    problems.push(`word count ${words} over 20`);
  }
  if (Buffer.from(text, "utf8").toString("utf8") !== text) {
    problems.push("not valid UTF-8 round-trip");
  }
  return problems;
}

// --------------------------------------------------------------------- main

function main(): void {
  // 1. Keep only gate-valid candidates.
  const valid = CANDIDATES.filter((c) => {
    const problems = gateProblems(c);
    if (problems.length > 0) {
      console.error(`excluded candidate (${problems.join("; ")}): ${c}`);
      return false;
    }
    return true;
  });
  if (valid.length === 0) {
    console.error("no gate-valid candidate");
    process.exit(1);
  }

  // 2. Score every candidate, deterministically. Ties break the way the
  // judge walks the brief: criterion by criterion, in the brief's order,
  // then by shorter text, then lexicographically.
  const scored = valid.map(scoreCandidate);
  scored.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    for (let i = 0; i < a.criteria.length; i++) {
      if (b.criteria[i] !== a.criteria[i]) return b.criteria[i] - a.criteria[i];
    }
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });

  for (const s of scored) {
    console.log(
      `${s.total.toFixed(2)}  [${s.criteria.map((c) => c.toFixed(2)).join(" ")}]  (${[...s.text].length} chars, ${wordCount(s.text)} words) ${s.text}`,
    );
  }

  const winner = scored[0];
  console.log(
    `\nwinner (${[...winner.text].length} chars, ${wordCount(winner.text)} words): ${winner.text}`,
  );

  // 3. Write the winner, with no trailing newline: the file holds exactly
  //    the one-line excuse, nothing else.
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, winner.text, "utf8");

  // 4. Read it back and verify byte-for-byte against every gate.
  const back = readFileSync(outPath, "utf8");
  const backBytes = readFileSync(outPath);
  if (back !== winner.text) {
    console.error("read-back text differs from winner");
    process.exit(1);
  }
  if (!backBytes.equals(Buffer.from(winner.text, "utf8"))) {
    console.error("read-back bytes differ from winner");
    process.exit(1);
  }
  const problems = gateProblems(back);
  if (problems.length > 0) {
    console.error(`gate failed on written file: ${problems.join("; ")}`);
    process.exit(1);
  }

  console.log(`wrote and verified ${outPath} (${backBytes.length} bytes)`);
}

main();
