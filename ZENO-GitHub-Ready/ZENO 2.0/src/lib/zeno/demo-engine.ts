import type { ReplyMode } from "./types";

/**
 * ZENO demo response engine.
 *
 * Every reply here is canned content and is ALWAYS labeled with
 * DEMO_NOTE, so nobody mistakes it for a live AI model. When a real model
 * is connected (through a server function, with keys held server-side),
 * this module gets replaced and the labeling goes with it.
 */

export const DEMO_NOTE = "Demo response · canned content · no AI model connected yet";

export const SUGGESTED_PROMPTS = [
  {
    prompt: "Explain something difficult",
    description: "Pick a tough idea and get a plain-language first pass.",
  },
  {
    prompt: "Help me solve a problem",
    description: "Work through something that's stuck, one step at a time.",
  },
  {
    prompt: "Explore a new idea",
    description: "Take a spark and see where it could lead.",
  },
] as const;

export type TrackId = "difficult" | "problem" | "idea";

interface Track {
  label: string;
  initial: string;
  simpler: string;
  deeper: string;
  check: string;
}

const TRACKS: Record<TrackId, Track> = {
  difficult: {
    label: "Explain something difficult",
    initial: [
      "### Entropy, without the fear",
      "",
      "Entropy is one of those words that sounds far scarier than the idea actually is. Strip away the formulas and it measures something simple: **how many different ways a situation can be arranged and still look the same from the outside.**",
      "",
      "- A tidy desk has *low* entropy — there are very few arrangements that count as “tidy”.",
      "- A messy desk has *high* entropy — there are millions of arrangements that all look equally messy.",
      "",
      "That single idea explains why heat flows from hot to cold, why ice melts in your drink, and why sorting a messy room takes effort while messing it up takes none. The messy state simply has far more ways to happen, and nature doesn't play favorites — arrangements that are easy to hit get hit more often.",
      "",
      "**Takeaway:** entropy isn't “chaos” or “disorder” in a vague sense. It's a count of possibilities, and possibility counts drive almost everything in physics.",
    ].join("\n"),
    simpler: [
      "### Entropy, like we're chatting over coffee",
      "",
      "Imagine you drop a bag of 100 letter tiles. There's exactly **one** way for them to land in perfect alphabetical order, but a near-infinite number of ways for them to land in gibberish. If you shake the bag and pour, which result do you expect?",
      "",
      "That's the whole idea. Entropy is just the number of “gibberish” arrangements compared to the number of “tidy” ones.",
      "",
      "- Tidy outcomes: rare, hard to hit.",
      "- Messy outcomes: everywhere, easy to hit.",
      "",
      "**Takeaway:** things drift toward mess not because nature loves mess, but because mess has way more seats at the table.",
    ].join("\n"),
    deeper: [
      "### Entropy, one level down",
      "",
      "Formally, Boltzmann defined entropy as **S = k · ln W**, where W is the number of microstates consistent with what you observe and k is a constant that just converts counts into temperature units. Three consequences follow:",
      "",
      "1. **It's about information, not substance.** Entropy depends on what you're able to distinguish. A deck of cards sorted by suit looks ordered to you and random to someone who also tracks face value — same physical deck, different entropy.",
      "2. **The second law is probability, not force.** Nothing forbids the tiles landing in alphabetical order; it's just overwhelmingly unlikely. Statistical mechanics turns “unlikely” into “effectively never” through sheer numbers.",
      "3. **Shannon's information entropy is the same mathematics** with k set by units. Compressing a file and cooling a gas are cousins: both reduce uncertainty, and both pay the same tax elsewhere (Landauer's principle links erasing a bit to dumping a minimum amount of heat).",
      "",
      "**Takeaway:** entropy is a counting argument applied relentlessly — physics, information, and computation are three dialects of the same sentence.",
    ].join("\n"),
    check: [
      "### Quick check — did it land?",
      "",
      "Try answering these before peeking at the hints:",
      "",
      "1. A cup of hot tea cools to room temperature. Which direction did entropy move, and why is that direction favored?",
      "2. True or false: entropy means a system is becoming more *random*. What's the more precise wording?",
      "3. If you could watch a single air molecule, would you see “entropy” happening? Why or why not?",
      "",
      "> Hints: 1 — the mixed state has far more arrangements, so it's where things settle. 2 — false; it's about the number of indistinguishable arrangements, not randomness itself. 3 — no; entropy is a property of the *ensemble*, a bookkeeping over possibilities, not a force any one molecule feels.",
      "",
      "How did you do? Say **“go deeper”** for the mathematical backbone, or **“simpler”** for another analogy.",
    ].join("\n"),
  },
  problem: {
    label: "Help me solve a problem",
    initial: [
      "### A five-step way to unstick a problem",
      "",
      "Since this is the demo, let's use a concrete one: **“My app breaks for one user and works for everyone else.”** Here's the loop ZENO would walk with you:",
      "",
      "1. **Restate it in one sentence.** “This user's account hits an error that no other account does.” If you can't write that sentence, that's the real blocker.",
      "2. **Find what's different about them.** Different role, older data, unusual settings, a typo in their email from 2021? One differing variable is usually enough to explain the whole symptom.",
      "3. **Reproduce it on demand.** A bug you can trigger is a bug you can kill; capture the exact steps before touching anything.",
      "4. **Split the system in half.** Does the failure happen before the data reaches your code, or inside it? Halve the search space at each test instead of guessing.",
      "5. **Fix the cause, not the symptom.** Then ask: *why did this survive so long?* — that answer usually becomes a new test or check.",
      "",
      "**Takeaway:** debugging is a search problem. Every experiment should shrink the space of possible causes — never just “try things”.",
      "",
      "Tell me about *your* actual problem and we'll run this loop on it.",
    ].join("\n"),
    simpler: [
      "### The three-question version",
      "",
      "Any stuck problem, three questions:",
      "",
      "1. **What exactly happens, and what did I expect instead?** Writing both down often exposes a wrong assumption on the spot.",
      "2. **When did it last work, and what changed since?** The change is nearly always inside that window.",
      "3. **What's the smallest test that would prove one suspect innocent or guilty?** Run that test — not a big fix, just the test.",
      "",
      "**Takeaway:** don't solve the whole problem at once; solve “which half is broken”, and repeat.",
    ].join("\n"),
    deeper: [
      "### Root cause, the serious toolkit",
      "",
      "When a problem keeps coming back, surface fixes aren't the issue — the method is. Three heavier tools:",
      "",
      "1. **Five Whys with evidence gates.** Each “why” must be backed by an artifact (a log line, a diff, a metric), not a plausible story. Five evidence-backed whys usually reach a process cause, not a person.",
      "2. **Inversion.** Instead of “how do we fix this?”, ask “how would I *guarantee* this failure again?” — every answer names a condition to defend against. Failures imagined backward are cheaper than failures shipped forward.",
      "3. **Base rates.** Before blaming the exotic cause, ask how often the boring causes explain cases like this. Flaky networks, stale caches, and expired credentials account for a remarkable share of “impossible” bugs.",
      "",
      "**Takeaway:** mature debugging looks less like cleverness and more like disciplined bookkeeping of what's been ruled out.",
    ].join("\n"),
    check: [
      "### Quick check — is the method yours yet?",
      "",
      "1. Your teammate suggests “let's just add a retry and see”. Which step of the loop does that skip, and why does it matter?",
      "2. You have three suspects for a failure. What's the most information-dense next experiment?",
      "3. The bug is fixed. What question should you always ask before closing the ticket?",
      "",
      "> Hints: 1 — step 3/4: a retry hides the cause instead of shrinking the search space, so the bug stays armed. 2 — one that splits the suspects roughly in half, not the one that's easiest. 3 — “why did this survive so long?”, and what check would catch the next one.",
      "",
      "Want to pressure-test it? Say **“go deeper”** for the root-cause toolkit, or bring me a real problem.",
    ].join("\n"),
  },
  idea: {
    label: "Explore a new idea",
    initial: [
      "### Let's take an idea apart",
      "",
      "Demo idea to work with: **“a study app that turns your lecture notes into tiny daily quizzes.”** Here's the exploration pass ZENO runs on any spark:",
      "",
      "1. **The itch.** Who hurts, and how much? Students re-read notes passively and remember little; the pain is real and felt weekly, near exams daily.",
      "2. **The mechanism.** Why would this work when highlighting doesn't? Retrieval practice — being *asked* — beats re-reading, and it's one of the best-replicated results in learning science.",
      "3. **The wedge.** Start absurdly narrow: one course, one format (PDF slides), auto-generated three-question quizzes at breakfast. Small enough to build, specific enough to judge.",
      "4. **The honest risks.** Quiz quality is everything — a wrong question destroys trust instantly. And notes vary wildly in structure, so “parse anything” is harder than it sounds.",
      "5. **The next probe.** Not an app — a weekend where you hand-make quizzes from three real lecture PDFs and watch five students use them.",
      "",
      "**Takeaway:** an idea gets strong by being *attacked early and cheaply* — the job of exploration is to find the cheapest test that could kill it.",
      "",
      "Got your own spark? Drop it in and we'll run the same pass on it.",
    ].join("\n"),
    simpler: [
      "### Ideas in three easy questions",
      "",
      "When a new idea shows up, ask it three friendly questions:",
      "",
      "1. **Who is annoyed, and how often?** If the answer is “rarely”, it's a nice-to-have. If it's “every day”, keep digging.",
      "2. **What's the one magical moment?** Name the single instant where the user thinks “oh, that's nice”. If you can't name it, the idea is still a fog.",
      "3. **What's the cheapest way to fake it this week?** Before building, do the scrappy version by hand. Handmade first, automated later.",
      "",
      "**Takeaway:** an idea isn't judged by how big it sounds, but by how quickly you can put a rough version in front of one real person.",
    ].join("\n"),
    deeper: [
      "### Sharper instruments for idea evaluation",
      "",
      "Beyond the basics, a few tools that separate promising sparks from flattering ones:",
      "",
      "1. **Demand-side vs supply-side novelty.** “Nobody has done this” is a supply-side claim. The demand-side question — “would anyone switch from their current workaround?” — is the one that matters, and switching costs are the silent killer.",
      "2. **The mom-test filter.** Ask about the person's *past behavior*, never about your idea. “What did you do after your last lecture?” beats “would you use an app that quizzes you?” Compliments are not data.",
      "3. **Pre-mortem.** Write the one-star review from 18 months in the future, dated and specific. Every sentence in it becomes a risk to instrument *now*.",
      "4. **Kill criteria set in advance.** Decide before the experiment what result would make you stop. Without it, every outcome is spun as encouraging and you never learn anything.",
      "",
      "**Takeaway:** evaluation isn't about being positive or negative — it's about converting vague hope into cheap, falsifiable next steps.",
    ].join("\n"),
    check: [
      "### Quick check — could you run this pass alone?",
      "",
      "1. What's the difference between the “itch” and the “mechanism”? Which one kills ideas faster when it's missing?",
      "2. Why is the “wedge” deliberately narrow? What does a wide first version cost you?",
      "3. You show your prototype to a friend and they say “oh, I'd definitely use that”. Why is that weak evidence — and what would you ask instead?",
      "",
      "> Hints: 1 — the itch is the pain, the mechanism is why your solution relieves it; a solution without a mechanism is a guess, and that kills faster. 2 — a wide version blurs the signal: you can't tell which part users valued, and you pay for all of it. 3 — it's a prediction about future behavior; ask what they *did* last time they faced the problem.",
      "",
      "Say **“go deeper”** for the evaluation toolkit, or **“simpler”** to run it back gently.",
    ].join("\n"),
  },
};

const KEYWORD_HINTS: Array<{ track: TrackId; words: string[] }> = [
  {
    track: "difficult",
    words: ["explain", "difficult", "understand", "confus", "complex", "what is", "why is", "how does", "concept"],
  },
  {
    track: "problem",
    words: ["problem", "solve", "stuck", "fix", "debug", "issue", "error", "broken", "trouble"],
  },
  {
    track: "idea",
    words: ["idea", "explore", "brainstorm", "invent", "spark", "concept", "startup", "project"],
  },
];

/** Picks the demo track whose keywords best match the prompt (falls back to "difficult"). */
export function selectTrack(prompt: string): TrackId {
  const text = prompt.toLowerCase();
  let best: TrackId = "difficult";
  let bestScore = 0;
  for (const { track, words } of KEYWORD_HINTS) {
    const score = words.filter((w) => text.includes(w)).length;
    if (score > bestScore) {
      best = track;
      bestScore = score;
    }
  }
  return best;
}

const MODE_FIELDS = {
  initial: "initial",
  simpler: "simpler",
  deeper: "deeper",
  check: "check",
} as const satisfies Record<ReplyMode, keyof Track>;

/** Returns the full demo reply text for a prompt and reply mode. Always labeled as demo content. */
export function getResponse(prompt: string, mode: ReplyMode = "initial"): string {
  const track = TRACKS[selectTrack(prompt)];
  return track[MODE_FIELDS[mode]];
}
