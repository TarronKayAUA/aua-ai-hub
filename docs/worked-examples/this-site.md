---
last_reviewed: 2026-09-03
---

# How this site is built

<span class="meta-chip">For anyone curious how this site works</span><span class="meta-chip">About 9 minutes</span> <span class="meta-note">A worked example. Every number here was measured from the repository, and the repository is public.</span>

This site publishes curated artificial intelligence (AI) news six times a day, maintains a tool directory and a literacy pathway, and costs nothing to host. It has been running since 9 June 2026. I am a physician and a medical educator. I cannot write the code that does any of this.

That last sentence is the reason the site is worth writing about, so let me put the division of labor on the table before anything else.

## Who wrote what

| | |
|---|---|
| Commits, 9 June to 3 September 2026 | 651 |
| By an automated account | 419 |
| By me | 232 |
| Of those, carrying an AI co-author trailer | 180 |
| Automated news refreshes | 396, about 61% of all history |
| Test files in the repository | 0 |

Effectively all of the code was written by an AI assistant across many sessions. Roughly three fifths of the project's history is the pipeline feeding itself. My contribution is specification, verification, and the decisions about what the system is not permitted to do.

I state this plainly because a reader who assumed I hand-wrote a feed aggregator would be misled, and because the interesting question is not whether a non-programmer can produce working software. It is whether they can steward it responsibly once it exists and runs unattended.

## Specification came before code

The first commit contains no pipeline. It contains a 473-line specification and a working-rules document, and nothing that runs.

Those two files still govern the project. The rules document opens with five non-negotiable working rules, including one that constrains the assistant rather than me: present a short plan and wait for approval before writing code. Others forbid hardcoding any value that should come from a data file, and require that every generation step print verification counts and fail loudly on a mismatch.

Writing the constraints first was the single highest-leverage decision in the project. Every later argument about whether something was allowed had somewhere to be resolved.

## The selection algorithm is mostly prose

The site's most consequential machinery decides which news items get published. I expected this to be code. It mostly is not.

A numeric scorer written on the first day still runs on every candidate. It adds up keyword matches and a per-feed weight. In the sixty days of decisions the system retains, it decided nothing: its only live job is ordering candidates before they are handed to a language model, and that ordering has never hit the cap that would make it matter.

The actual selection happens in a 1,719-word English document that tells a model what this audience needs and what to reject. It began at 347 words. It is version-controlled alongside the code, and it changed five times between June and July, each time in response to a specific wrong decision.

Around that document sit gates the model cannot touch: a lookback window, a keyword blocklist, three deduplication passes, and a ledger that guarantees any given item is judged exactly once, ever. Inside those gates the model chooses. Outside them, the code overrides the model on hard limits, and every override is recorded with a reason.

The lesson I did not expect: the most important artifact in the system is a piece of writing, and it earns the same review as code because it behaves like code.

## What the automation is not allowed to do

Four systems run unattended and watch for things I would otherwise have to check by hand: conference dates, tool roster drift, open calls, and pages overdue for review. The design question for all four was not what they can find. It was what they may change.

The strictest case is the conference watcher, which is the only one permitted to edit a data file by itself. It shipped as propose-only. Three weeks later it was allowed to apply a change, but only through three gates that must all pass: the model's quoted evidence must appear literally in the page that was actually fetched, the resulting dates must stay internally coherent, and the same value must have been seen on two consecutive runs days apart. Anything that fails a gate becomes an issue for me to decide. New conferences are always proposal-only, never automatic.

There is an honest footnote. **That auto-apply path has never once fired.** No entry in the calendar carries the provenance comment it would leave behind, and every commit that has ever touched that file was authored by me. I built a carefully gated capability that has so far done nothing. Whether that is prudent engineering or wasted effort is genuinely unclear, and I would rather record it than quietly not mention it.

## The failure that keeps recurring

I expected the characteristic failure of AI-written software to be bad code. It has not been. The recurring shape is that **a check silently stopped checking**.

- An entry in the link checker's exemption list was keyed with a `www.` prefix that the matcher strips, so for about a month it matched nothing at all.
- A tool marked as exempt from one check turned out to be exempt from every check. A vendor renamed the product and the site carried the old name for six weeks.
- A nightly benchmark table quietly fell back to a pinned copy six months old, because the source changed a naming convention and the pattern that discovered it returned nothing. No automated check noticed. I noticed, by reading the page and seeing that two current models were missing.
- A build cache scoped one directory too wide restored the previous run's audio over freshly published files, so the live site served recordings one commit behind for two deploys.
- A spending guard read a corrupted ledger as "nothing spent this month". It would have failed open at exactly the moment it was needed.

Every one of these is invisible while it is happening. That is the property they share, and it is why the working-rules document now carries fourteen documented gotchas where it once carried five. The rulebook grew from failures, each entry dated to an incident.

Twice, an audit built to catch the model's mistakes instead convicted my own configuration. In one case I reviewed roughly 130 rejection decisions looking for bad judgment, found none, and discovered that the pipeline was truncating the evidence it sent, so the model had been correctly reporting that it could not see enough to decide.

## One change, end to end

A recent example, small enough to follow completely. The site's read-aloud players originally used a free voice model that runs on a laptop. Replacing it with a better commercial voice took one day and turned on a single measurement: the pages that rarely change total about 42,000 characters, and the news pages consume that much every five days. So the paid voice reads the static pages for a couple of dollars a year, and the free one still reads the news, where the same voice would have cost hundreds of dollars a month.

The best open-weights alternative was disqualified on paperwork rather than quality. Its permissive license covers the inference code, not the model weights, which are restricted to non-commercial use. Two further candidates failed for related reasons.

The change also cost something. The build can no longer regenerate that audio, because the key is deliberately kept off the servers, so a page edited without regenerating now serves **no player at all** rather than reading superseded words aloud. Silence is the better failure.

## What it costs

Hosting is free, on static pages published from the repository. The recurring cost is a few dollars a month in model usage. Nine workflows run on seven schedules, the busiest being the news refresh six times a day, which is not a freshness preference: scheduled runs are routinely delayed by five to eleven hours, so the schedule stopped trying to hit a time and blankets the day instead.

## What transfers

- Write the specification and the rules before the code. They are what later disagreements get resolved against.
- Expect the prompt to be the algorithm, and review it as carefully as you review code.
- Decide what automation may change by itself, and make everything else escalate to a person.
- Assume any check can silently stop checking. Design so that a dead check fails loudly rather than passing quietly.
- Verify by reading the output, not only the logs. Two of the failures above were found by looking at the published page.

## What this does not show

There is no test suite in this repository and never has been, and nothing measures whether anyone reads the site. I also cannot tell you what the pipeline has wrongly discarded, because rejected items are dropped before anything is written down.

That last gap is not hypothetical. While preparing this piece I ran a review that found the news blocklist matching substrings, so the term "crypto" had been quietly discarding anything about cryptogenic stroke or cryptococcal infection. On a medical education site. It is fixed, and by design there is no way to know what it cost.
