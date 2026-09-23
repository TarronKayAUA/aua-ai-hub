---
last_reviewed: 2026-09-01
---

# Playbook: Reviewing the Literature

<span class="meta-chip">For faculty and graduate student researchers</span><span class="meta-chip">About 9 minutes</span> <span class="meta-note">From question to appraised evidence</span>

## The task

Artificial intelligence (AI) has changed literature work as much as any research task: tools now find, screen, and summarize papers faster than any manual process. What has not changed is the standard your review will be judged by, and the failure that sinks manuscripts fastest, citations that do not check out, is a signature AI failure. This playbook walks the workflow that captures the speed without inheriting the risk. The [AI for Research guide](../tools/research.md) describes the tools themselves; this page is the discipline for using them in sequence.

## Where AI helps, and where it hurts

**Helps:** orientation in an unfamiliar literature (cited summaries in minutes instead of days), finding seed papers and chasing citations forward and backward, screening hundreds of titles and abstracts against your criteria, and first-pass synthesis across a paper set you supply.

**Hurts:** fabricated or garbled references presented with full confidence, summaries that read as comprehensive while silently missing whole literatures (coverage always has limits; Scopus AI, for example, draws on abstracts and metadata from 2003 forward), and the temptation to appraise papers from AI summaries rather than from their methods sections. The summary is a map; the methods section is the territory.

<figure class="figure figure--html hf">
<p class="hf-title">Seven steps, one that never delegates</p>
<ol class="hf-steps">
<li class="hf-box"><p class="hf-box-title">Orient</p><p class="hf-box-sub">Scopus AI, cited summary</p></li>
<li class="hf-box"><p class="hf-box-title">Search</p><p class="hf-box-sub">recorded query strings</p></li>
<li class="hf-box"><p class="hf-box-title">Grow the map</p><p class="hf-box-sub">citation chasing, seeds</p></li>
<li class="hf-box"><p class="hf-box-title">Screen</p><p class="hf-box-sub">frozen criteria, audit trail</p></li>
<li class="hf-box hf-box--filled"><p class="hf-box-title">Appraise, by hand</p><p class="hf-box-sub">methods sections read by you; MERSQI, checklists</p></li>
<li class="hf-box"><p class="hf-box-title">Synthesize</p><p class="hf-box-sub">from your appraised set</p></li>
<li class="hf-box hf-box--ok"><p class="hf-box-title">Verify every citation at source</p></li>
</ol>
<p class="hf-note">AI accelerates five of the seven steps; appraisal and citation checking stay yours.</p>
<p class="hf-legend">Outlined boxes: AI-assisted, you steer. Filled and green boxes: entirely yours.</p>
<figcaption>Speed where speed is safe; judgment where judgment is the point.</figcaption>
</figure>

## Gather first

- Your research question, framework-vetted. If it is still an idea, the [Research question coach](../prompts/index.md#research-question-coach) prompt converts it into a PICO (population, intervention, comparison, outcome) structure, or its PICOT (PICO plus time frame) and SPIDER (sample, phenomenon of interest, design, evaluation, research type) variants, with a FINER (feasible, interesting, novel, ethical, relevant) screen, and hands you the novelty search to run.
- Your inclusion and exclusion criteria, written as numbered lists before any tool sees a single abstract.
- Your review's ambition, named honestly: an orientation for an introduction section, a scoping review, or a full systematic review. A systematic review needs a registered protocol and [Preferred Reporting Items for Systematic Reviews and Meta-Analyses (PRISMA)](https://www.prisma-statement.org/) documentation from the first search onward, not retrofitted at the end.
- Library access: [Scopus with AI](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home) through your AUA credentials.

--8<-- "includes/prompt-maturity-note.md"

## The workflow

1. **Orient with Scopus AI.** Ask your question plainly and read the cited orientation summary, opening the citations rather than trusting the synthesis. You are mapping the conversation your question joins: the key authors, the recent reviews, the terms the field actually uses.
2. **Run the real search.** Move from AI conversation to explicit database queries in Scopus and PubMed using the vocabulary step 1 surfaced. Save the exact query strings and dates; every serious review reports them. For systematic work, this is the step to involve a librarian.
3. **Grow the map from seeds.** Feed your strongest papers to ResearchRabbit or use Scopus citation chasing to find what your keyword queries missed: the papers your seeds cite, and the papers that cite your seeds.
4. **Screen at scale, conservatively.** The [Literature screening assistant](../prompts/index.md#literature-screening-assistant) prompt applies your frozen criteria to titles and abstracts with an audit trail, defaulting to "unclear" whenever the abstract cannot support a decision. Borderline calls stay yours, and screening decisions are aids, never verdicts.
5. **Appraise by hand.** This step does not delegate. Read the methods sections of everything that survives screening and apply a structured instrument: the reporting checklist for each study's design as a completeness lens, and in medical education research, a rigor instrument such as the Medical Education Research Study Quality Instrument (MERSQI). AI can fetch and summarize; it cannot be accountable for your judgment that a study is worth building on.
6. **Synthesize from your own set.** Load the appraised papers, your papers, not the open web, into [Gemini Notebook](../tools/gemini-notebook.md) or a Claude Project and draft the synthesis grounded in that set, with every claim traceable to a source you have read.
7. **Verify every citation at the source.** Before any reference enters your manuscript: the paper exists, the authors and year are right, and it says what your sentence claims. No exceptions, including references you are certain about.

## Guardrails for this task

- AI-generated summaries are not citable sources; cite the papers.
- A reference list that is only partially verified is not a reference list; it is a list of leads (the [Research and Scholarship module](../pathway/research.md) covers why this failure is treated as misconduct when it reaches print).
- Manuscripts you receive for peer review, and other people's unpublished work, never enter any AI tool: journal and funder confidentiality rules for reviewers generally forbid it.
- Disclose AI assistance per your target venue's instructions; the International Committee of Medical Journal Editors (ICMJE) recommendations are the baseline: writing assistance in the acknowledgments, AI used in data collection or analysis in the methods, and responsibility for all of it stays with the authors.

## Before you rely on it

- [ ] The search is reproducible: databases, query strings, dates, and counts are recorded.
- [ ] Screening criteria were frozen before screening began, and every AI screening decision carries its evidence quote.
- [ ] Every included paper's methods section was read by a human, not summarized into the review.
- [ ] Every citation was opened at the original source and says what you claim it says.
- [ ] The synthesis cites only papers in your appraised set.
- [ ] AI assistance is disclosed per the venue's instructions.

**Related:** [AI for Research](../tools/research.md) for the tools at each stage, and [Module 5: Research and Scholarship](../pathway/research.md) for integrity, authorship, and disclosure.

More playbooks and refinements come from use: what worked, what broke, and what is missing go through the [feedback form](https://forms.office.com/r/5a8RCi2YKP).
