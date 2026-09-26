---
last_reviewed: 2026-09-01
---

# Reviewing the Literature

<span class="meta-chip">Step-by-step guide</span><span class="meta-chip">For faculty and graduate student researchers</span><span class="meta-chip">About 9 minutes</span> <span class="meta-note">From question to appraised evidence</span>

## The task

Artificial intelligence (AI) has changed literature work as much as any research task: tools now find, screen, and summarize papers faster than any manual process. What has not changed is the standard your review will be judged by, and the failure that sinks manuscripts fastest, citations that do not check out, is a signature AI failure. This playbook walks the workflow that captures the speed without inheriting the risk. The [AI for Research guide](../tools/research.md) describes the tools themselves; this page is the discipline for using them in sequence.

## Where AI helps, and where it hurts

**Helps:** orientation in an unfamiliar literature (cited summaries in minutes instead of days), finding seed papers and chasing citations forward and backward, screening hundreds of titles and abstracts against your criteria, and first-pass synthesis across a paper set you supply.

**Hurts:** fabricated or garbled references presented with full confidence, summaries that read as comprehensive while silently missing whole literatures (coverage always has limits; Scopus AI, for example, draws on abstracts and metadata from 2003 forward), and the temptation to appraise papers from AI summaries rather than from their methods sections. The summary is a map; the methods section is the territory.

<figure class="figure figure--html hf">
<p class="hf-title">Seven steps, two kept in your hands</p>
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
<p class="hf-legend">Outlined boxes: AI-assisted, you steer. Filled and green boxes: your judgment carries them.</p>
<figcaption>Speed where speed helps; judgment where judgment is the point.</figcaption>
</figure>

## Gather first

- Your research question, framework-vetted. If it is still an idea, the [Research question coach](../prompts/index.md#research-question-coach) prompt converts it into a PICO (population, intervention, comparison, outcome) structure, or its PICOT (PICO plus time frame) and SPIDER (sample, phenomenon of interest, design, evaluation, research type) variants, with a FINER (feasible, interesting, novel, ethical, relevant) screen, and hands you the novelty search to run.
- Your inclusion and exclusion criteria, written as numbered lists before any tool sees a single abstract.
- Your review's ambition, named honestly: an orientation for an introduction section, a scoping review, or a full systematic review. A systematic review needs a registered protocol and [Preferred Reporting Items for Systematic Reviews and Meta-Analyses (PRISMA)](https://www.prisma-statement.org/) documentation from the first search onward, not retrofitted at the end.
- Library access: [Scopus with AI](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home) through your AUA credentials.

## The workflow

1. **Orient with Scopus AI.** Ask your question plainly and read the cited orientation summary, opening the citations rather than trusting the synthesis. You are mapping the conversation your question joins: the key authors, the recent reviews, the terms the field actually uses.
2. **Run the real search.** Move from AI conversation to explicit database queries in Scopus and PubMed using the vocabulary step 1 surfaced. Save the exact query strings and dates; every serious review reports them. For systematic work, this is the step to involve a librarian.
3. **Grow the map from seeds.** Feed your strongest papers to ResearchRabbit or use Scopus citation chasing to find what your keyword queries missed: the papers your seeds cite, and the papers that cite your seeds.
4. **Screen at scale, conservatively.** The [Literature screening assistant](../prompts/index.md#literature-screening-assistant) prompt applies your frozen criteria to titles and abstracts with an audit trail, defaulting to "unclear" whenever the abstract cannot support a decision. Borderline calls stay with you, and the screening output works best as a first pass that speeds your own decisions.
5. **Appraise by hand.** This is the step your judgment carries. Read the methods sections of everything that survives screening and apply a structured instrument: the reporting checklist for each study's design as a completeness lens, and in medical education research, a rigor instrument such as the Medical Education Research Study Quality Instrument (MERSQI). AI can fetch and summarize; it cannot be accountable for your judgment that a study is worth building on. Once your own appraisal is written, the [critical appraisal second reader](../prompts/index.md#critical-appraisal-second-reader) is a second pair of eyes: it compares your appraisal with the paper and flags what you may have missed, and it will not appraise first.
6. **Synthesize from your own set.** Load the appraised papers, your papers, not the open web, into [Gemini Notebook](../tools/gemini-notebook.md) or a Claude Project and draft the synthesis grounded in that set, with every claim traceable to a source you have read.
7. **Verify every citation at the source.** Before a reference enters your manuscript, check that the paper exists, the authors and year are right, and it says what your sentence claims. References you feel sure of deserve the same check, because a confident memory is how a wrong year or a misattributed finding gets through. Until every reference is checked, the list is a set of leads rather than a reference list. The [AI Responsible Use Policy](../governance/policy.md#responsible-use) requires any reference obtained through an AI tool to be verified at the original source.

## Good practice for this task

- Cite the papers themselves; an AI-generated summary is a map to them, not a source.
- Manuscripts and grant applications you receive for peer review are confidential to the journal or funder, and reviewer terms generally bar putting them into AI tools, so they stay out unless the reviewer instructions provide or permit a tool. A colleague's unpublished work goes into a tool only with their agreement, and then on the same terms as your own drafts, in a paid plan with training on your content turned off ([Module 5: Research and Scholarship](../pathway/research.md) covers both).
- Disclose AI assistance per your target venue's instructions; the International Committee of Medical Journal Editors (ICMJE) recommendations are the baseline: writing assistance in the acknowledgments, AI used in data collection or analysis in the methods, and responsibility for all of it stays with the authors.

## Before you rely on it

- [ ] The search is reproducible: databases, query strings, dates, and counts are recorded.
- [ ] Screening criteria were frozen before screening began, and every AI screening decision carries its evidence quote.
- [ ] Every included paper's methods section was read by you, not just summarized (step 5).
- [ ] Every citation was checked at the original source (step 7).
- [ ] The synthesis cites only papers in your appraised set.
- [ ] AI assistance is disclosed per the venue's instructions.

**Related:** [AI for Research](../tools/research.md) for the tools at each stage, and [Module 5: Research and Scholarship](../pathway/research.md) for integrity, authorship, and disclosure.

More playbooks and refinements come from use: what worked, what broke, and what is missing go through the [feedback form](https://forms.office.com/r/5a8RCi2YKP).
