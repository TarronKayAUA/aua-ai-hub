---
last_reviewed: 2026-09-03
---

# When a check stops checking

<span class="meta-chip">For anyone curious how this site works</span><span class="meta-chip">About 12 minutes</span> <span class="meta-note">A worked example. Every number here was measured from the repository, and the repository is public.</span>

For roughly six weeks, this site confidently told visitors about a Google product using a name Google had stopped using.

Nothing was broken. No alarm fired, no build failed, no check went red. The tool in question carried a small flag in its configuration marking it exempt from one particular verification, for the entirely reasonable reason that its product page sits behind a login wall and cannot be fetched. What nobody noticed was that the same flag also removed it from the weekly review that would have caught a rename. An exemption from one check turned out to be an exemption from all of them.

That is the characteristic failure of this project. Not bad code. Not crashes. A check that quietly stopped checking, and went on reporting success from behind its own blind spot.

I want to describe the whole system, because it is the site you are currently reading and every claim below can be verified against it. But that is the thread worth pulling.

## What this is, and who wrote it

This site publishes curated artificial intelligence news six times a day, maintains a directory of tools, a literacy pathway, a governance section and a conference calendar, and costs nothing to host. It has been running since 9 June 2026.

I am a physician and a medical educator. I cannot write the code that does any of this.

| | |
|---|---|
| Commits, 9 June to 3 September 2026 | 651 |
| By an automated account | 419 |
| By me | 232 |
| Of those, carrying an AI co-author trailer | 180 |
| Automated news refreshes | 396, about 61% of all history |
| Test files in the repository | 0 |

Effectively all of the code was written by an AI assistant across a great many sessions. Around three fifths of the project's entire history is the pipeline feeding itself, which is either impressive or slightly absurd depending on your mood.

I put that on the table immediately because a reader who assumed I had hand-written a feed aggregator would be misled, and because the interesting question was never whether a non-programmer can produce working software. Obviously they can now. The question is whether they can be trusted to run it afterwards.

## Writing the rules before there was anything to break

The very first commit contains no pipeline. It contains a 473-line specification and a working-rules document, and nothing whatsoever that executes.

Both files still govern the project three months later. The rules document opens with five non-negotiable working rules, one of which constrains the assistant rather than me: present a short plan and wait for approval before writing code. Others forbid hardcoding any value that ought to come from a data file, and require every generation step to print its counts and fail loudly when they do not add up.

Writing the constraints before the code was the single highest-leverage decision in the project, and it cost an afternoon. Every subsequent argument about whether something was permitted had somewhere to be settled, rather than being relitigated from scratch by two parties with no shared memory.

## The algorithm turned out to be an essay

The most consequential machinery on this site decides which news items get published. I assumed, without ever quite examining the assumption, that this was code.

It mostly is not.

There is a numeric scorer, written on the first day, that still runs against every candidate. It adds up keyword matches and a per-feed weight and produces a number. In the sixty days of decisions the system retains, that number decided precisely nothing. Its only remaining job is ordering candidates before they are handed to a language model, and the ordering only matters if a cap is hit, which has never happened.

The actual selection happens in a 1,719-word document written in English, which tells a model what this audience needs and what to throw away. It started life at 347 words. It lives in version control beside the code, it has been rewritten five times, and every one of those rewrites was a response to a specific bad decision that reached the page.

Around that document sit the gates the model cannot touch: a lookback window, a blocklist, three deduplication passes, and a ledger guaranteeing that any given item is judged exactly once, ever, and never offered again. Inside those gates the model chooses freely. Outside them the code overrides it on hard limits, and every override is recorded with a reason so that it can be audited later.

The lesson I did not expect is that the most important artifact in the system is a piece of prose, and it needs reviewing exactly as carefully as code, because it behaves exactly like code.

## What the robots may and may not touch

Four systems run unattended, watching things I would otherwise have to check by hand: conference dates, drift in the tool directory, open calls for papers, and pages overdue for review.

The design question for all four was never what they can find. It was what they are permitted to change.

The strictest case is the conference watcher, the only one allowed to edit a data file by itself. It shipped as proposal-only. Three weeks later it was permitted to apply a change, but only through three gates that must all pass: the model's quoted evidence has to appear literally in the page that was actually fetched, the resulting dates have to stay internally coherent, and the same value has to have been seen on two consecutive runs days apart. Anything failing a gate becomes an issue for me to decide, and a newly discovered conference is always proposal-only, never automatic.

There is an honest footnote to all that careful engineering. **The auto-apply path has never once fired.** Not a single entry in the calendar carries the provenance comment it would leave behind, and every commit that has ever touched that file was authored by me.

I built a carefully gated capability that has, to date, done absolutely nothing. Whether that is prudence or waste is genuinely unclear to me, and I would rather write it down than quietly not mention it.

## The failure that keeps coming back

I expected the characteristic failure of AI-written software to be code that does the wrong thing. It has not been, not once. The recurring shape is a check that silently stopped checking, and here is the collection.

An entry in the link checker's exemption list was keyed with a `www.` prefix that the matcher strips before comparing, so for about a month it matched nothing at all and exempted nothing. The fix added an assertion that fails at startup if any entry in that list can never match, which is the correct response: make the class of bug impossible rather than fixing the instance.

The tool exemption I opened with, which quietly removed an entry from every check rather than one, and left a stale product name on the site for six weeks.

A nightly benchmark table that fell back to a pinned copy six months old, because the upstream source changed a naming convention and the pattern that discovered the current version returned nothing at all. No automated check noticed, for weeks. I noticed, by reading the page and thinking that two obviously current models were conspicuously absent.

A build cache scoped one directory too wide, which restored the previous run's audio files over freshly published ones, so the live site served recordings a commit behind for two deploys.

A spending guard that read a corrupted ledger, the expected result of an interrupted run, and interpreted it as "nothing spent this month". It would have failed open at precisely the moment it was needed, which is the only moment that counts.

Every one of these is invisible while it is happening. That is the property they share, and it is why the working-rules document now carries fourteen documented gotchas where it originally carried five. The rulebook grew out of the failures, each entry dated to the incident that produced it, which makes it a rather unflattering document and a genuinely useful one.

Twice, an audit built to catch the model's mistakes ended up convicting my own configuration instead. On one occasion I reviewed around 130 rejection decisions hunting for bad judgement, found none whatsoever, and discovered that the pipeline had been truncating the evidence it sent, so the model had been accurately reporting that it could not see enough to decide and I had been reading that as incompetence.

## One change, start to finish

A recent example small enough to follow completely.

The read-aloud players on this site originally used a free voice model that runs on a laptop. Replacing it with a better commercial voice took a day, and the entire decision turned on one measurement: the pages that rarely change come to about 42,000 characters in total, and the news pages consume that much every five days.

So the paid voice reads the static pages for a couple of dollars a year, and the free one still reads the news, where the same voice would have cost several hundred dollars a month to narrate summaries that are replaced the following morning.

The best open-weights alternative was disqualified on paperwork rather than quality. Its permissive licence covers the inference code and not the model weights, which are restricted to non-commercial use, and two further candidates failed for closely related reasons. On a site run by a university, an unresolved licensing chain is not worth a modest quality gain.

The change cost something, too. The build can no longer regenerate that audio, because the key is deliberately kept off the servers, which means a page edited without regenerating now serves **no player at all** rather than reading superseded words aloud in a confident voice. Silence is the better failure, and it took a while to be comfortable with that.

## What it costs

Hosting is free, on static pages published from the repository. The recurring cost is a few dollars a month in model usage.

Nine workflows run on seven schedules, the busiest being the news refresh six times a day. That frequency is not a freshness preference, which surprises people. Scheduled runs on shared infrastructure are routinely delayed by five to eleven hours, so the schedule gave up trying to hit a particular time and simply blankets the day instead, on the assumption that some of them will land.

## What transfers

- Write the specification and the rules before the code. They are what later disagreements get resolved against, and they cost an afternoon.
- Expect the prompt to be the algorithm. Review it like code, because it is one.
- Decide what automation may change by itself. Everything else escalates to a person.
- Assume any check can silently stop checking, and design so that a dead check fails loudly rather than passing quietly. Every failure above was invisible while it was happening.
- Read the output, not only the logs. Two of the five were found by looking at the published page with my own eyes.

## What this does not show

There is no test suite in this repository and never has been, and nothing measures whether anybody reads the site. I also cannot tell you what the pipeline has wrongly discarded, because rejected items are dropped before anything is written down.

That last gap is not hypothetical. While preparing this piece I ran a review that found the news blocklist matching substrings rather than whole words, which meant the term "crypto" had been quietly discarding anything about cryptogenic stroke or cryptococcal infection. On a medical education site. It is fixed, and by design there is no way to know what it cost.
