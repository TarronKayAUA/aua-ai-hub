---
last_reviewed: 2026-09-03
---

# Worked Examples

Accounts of real projects built with artificial intelligence (AI) assistance, written to show the method rather than the result: what was specified, what was checked, what broke, and what a colleague could reuse. **These are software and data projects, not clinical cases.**

<img class="section-banner" src="../assets/section-worked-examples.svg" alt="">

Where the [AI Literacy Pathway](../pathway/index.md) teaches the foundations and the [Playbooks](../playbooks/index.md) walk through a task, these walk through a whole project after the fact, including the parts that did not work. Each one is written by the person who did the work, about their own work, and each is explicit about what it did not establish.

They are here because the useful skill is turning out not to be generating things with AI. It is specifying a project, deciding what the system is not allowed to do, verifying output you cannot fully read, noticing when the model is confidently wrong, and knowing when to stop. Those are teachable, and they are easier to show than to describe.

| Worked example | What it is | What it demonstrates |
| --- | --- | --- |
| [When a check stops checking](this-site.md) | How this site is built, and the six weeks it displayed a product name that no longer existed | Specification before code, a selection algorithm that turned out to be an essay, and five ways a check went on reporting success from behind its own blind spot |
| [I fixed software I cannot read](sharex-hdr.md) | Building HDR screenshot capture into ShareX, in a language the author does not write | Deciding boundaries when you cannot review the code, refusing things on a maintainer's behalf, and an ending the author did not control |
| [My favourite game was not a game](recommender.md) | A media tracker and recommender for one family, built in three weeks without the author writing a line of it | Testing software you cannot read, six ways a check passes against broken code, and a measurement that flattered its way into the profile |
| [The Neanderthal gene that explained nothing](genome.md) | A widely reported genetics finding, tested against the author's own genotype | Declining a flattering conclusion the data cannot support, refusals agreed in advance, and catching a confident error inside your own expertise |

!!! note "How to read these"
    Every claim in a worked example is meant to be traceable to something concrete: a file, a commit, a log, a published paper. Where a number was never measured, the text says so rather than estimating. Where something is unverified, it is labeled unverified. If you find a claim that does not meet that standard, the [feedback form](https://forms.office.com/r/5a8RCi2YKP) is the fastest way to tell the maintainer.
