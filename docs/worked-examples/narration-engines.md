---
last_reviewed: 2026-09-03
---

# Changing the voice that reads this site aloud

<span class="meta-chip">For anyone curious how this site is built</span><span class="meta-chip">About 6 minutes</span> <span class="meta-note">A worked example: one day's change to this site, including the parts that went wrong.</span>

Several pages on this site can be read aloud. If you open the [first pathway module](../pathway/how-ai-works.md) there is a player under the title, and what you hear is generated from the words on the page rather than recorded by a person.

That feature shipped on 1 September 2026 using a voice model that runs on an ordinary laptop, costs nothing, and is licensed for any use. It worked. It also sounded like what it was. This is an account of replacing it two days later, and of what a review of that change found afterward.

## Measure before deciding

The first useful step was not choosing a voice. It was counting characters, because every commercial speech service bills per character and the answer turned out to depend entirely on which pages we were talking about.

| | Characters | Audio |
|---|---|---|
| The nine static pages, all together | 42,629 | About 50 minutes |
| The news briefs, per refresh | 8,474 | About 10 minutes |
| The news briefs, per month | About 1,500,000 | About 30 hours |

The news pages regenerate six times a day, so they consume in five days what every static page on the site consumes in total. That single comparison decided the design before any voice was auditioned. A paid voice for the static pages costs a couple of dollars a year. The same voice on the news pipeline would cost a few hundred dollars a month, to read summaries that are replaced the same day.

So the site now uses two voices: a commercial one for the pages that rarely change, generated on a maintainer's machine and committed to the repository, and the original free local model for the news briefs, generated automatically. Neither is hardcoded. Both are configuration.

## The obvious upgrade was disqualified on paperwork

The best-performing open-weights voice model on public blind-comparison rankings would have been a substantial improvement and free to run. It was ruled out, along with the next two candidates, and not for technical reasons.

Its model weights are licensed for research and non-commercial use only. The permissive license that the project advertises covers the inference code, not the weights. A second candidate required a separately negotiated commercial license. A third claimed a permissive license but inherits weights from an upstream project restricted to academic use, and when asked directly the authors declined to clarify.

For an institutional website, an unresolved licensing chain is not a risk worth carrying for a modest quality gain. The lesson generalizes past this project: with open-weights models, the license on the code and the license on the weights are different documents, and the one that matters is the one you are less likely to read.

## What the change cost

| | |
|---|---|
| Characters billed | 42,115 |
| Money spent | Nothing, inside a free monthly allowance |
| Generation time | About 15 minutes |
| Audio produced | 44.9 minutes across nine pages |

## What was given up

The previous arrangement had a property worth naming: if someone edited a narrated page and forgot to regenerate the audio, the automated build noticed, re-read the page, and committed the corrected audio. Text and audio could not drift apart.

That is no longer possible, and the reason is deliberate. The commercial voice requires an account key, and putting that key into the automated build would let the build spend money and would expose the key to every workflow. So the key exists only on one machine, which means the build cannot fix a stale page.

The replacement is a fail-safe rather than a fix. Each audio file records a fingerprint of the exact text it was read from and the voice that read it. When the build finds a page whose text no longer matches its recording, it serves that page **without a player at all** rather than reading superseded words aloud, and a scheduled check opens a task for the maintainer naming the affected pages.

Silence is a worse feature and a better failure. A missing player is obvious and harmless. Audio confidently reading a paragraph that was edited last week is neither.

## What went wrong

Three things, and the third is the one worth carrying away.

**The chosen voice did not support the chosen model.** A voice was selected by ear from the provider's samples. It turned out to be available only on the provider's older engine, not the newer one the site had been configured to use. Of roughly 992 voices in the catalogue, only eight support the newer engine in English. Asking for an unsupported combination does not produce an error; it produces audio, quietly, from a different engine. The system now refuses the combination outright before generating anything.

**The catalogue lookup was silently truncated.** The provider returns voices fifty at a time. The first version of the lookup read only the first page, so it reported that a voice which plainly existed was not in the catalogue. Any listing endpoint should be assumed paginated until proven otherwise.

**A review that never ran looked exactly like a review that found nothing.** After the change was written, it was submitted to an automated review. The result came back with an empty list of findings. An empty findings list is what a clean review looks like. In fact every one of the six reviewers had failed on a server error and the tool had faithfully reported zero findings from zero completed reviews. Checking the run log rather than the summary is what caught it.

The review was then done by hand, and it found six real defects. One mattered: the safeguard that tracks spending against the monthly allowance wrote its ledger in a way that could be corrupted by an interrupted run, and a corrupted ledger was being read as "nothing spent this month." The guard would have failed open at precisely the moment it was needed, which is to say after an interruption. Unknown and zero are not the same number, and a guard that confuses them is not a guard.

## What transfers

- Measure the thing before choosing between options. One character count settled a design question that could have been argued about indefinitely.
- With open-weights models, read the license on the weights, not the license on the repository.
- Prefer an obvious failure to a plausible one. No audio beats wrong audio.
- Treat an empty result from an automated check as unverified until you have seen evidence the check actually ran.
- Distinguish "unknown" from "zero" anywhere a safety limit depends on the difference.

## What this does not show

Nobody knows whether anyone listens to these recordings. No measurement of use exists, and none is planned, because the site does not track visitors that closely. The change improved a quality that was assessed by ear, by one person, against one alternative. The review that found the defects was performed by the same person who wrote the change, which is a genuine weakness and the reason the automated second opinion was attempted at all.
