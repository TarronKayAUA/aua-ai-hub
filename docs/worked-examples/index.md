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
| [How this site is built](this-site.md) | The pipeline, automation and rules behind the site you are reading | Specification before code, a selection algorithm that turned out to be prose, and the failure that keeps recurring: a check that silently stopped checking |
| [Forking a program I could not have written](sharex-hdr.md) | Adding HDR screenshot capture to ShareX, in a language the author does not write | Deciding boundaries when you cannot review the code, refusing things on a maintainer's behalf, and publishing what you could not verify |
| [Checking a headline against my own genome](genome.md) | Testing a widely reported genetics finding against the author's own consumer genotype data | Declining a flattering conclusion the data cannot support, setting refusals in advance, and catching a model's confident error inside your own expertise |

!!! note "How to read these"
    Every claim in a worked example is meant to be traceable to something concrete: a file, a commit, a log, a published paper. Where a number was never measured, the text says so rather than estimating. Where something is unverified, it is labeled unverified. If you find a claim that does not meet that standard, the [feedback form](https://forms.office.com/r/5a8RCi2YKP) is the fastest way to tell the maintainer.
