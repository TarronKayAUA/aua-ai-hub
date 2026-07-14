---
last_reviewed: 2026-07-10
---

# Reviewing the Literature

**For faculty and graduate student researchers · from question to appraised evidence**

--8<-- "includes/prompt-maturity-note.md"

Artificial intelligence (AI) has changed literature work more than any other research task: tools now find, screen, and summarize papers at a speed no human matches. What has not changed is the standard your review will be judged by, and the failure that sinks manuscripts fastest, citations that do not check out, is a signature AI failure. This playbook walks the workflow that captures the speed without inheriting the risk. The [AI for Research guide](../tools/research.md) describes the tools themselves; this page is the discipline for using them in sequence.

## Where AI helps, and where it hurts

**Helps:** orientation in an unfamiliar literature (cited summaries in minutes instead of days), finding seed papers and chasing citations forward and backward, screening hundreds of titles and abstracts against your criteria, and first-pass synthesis across a paper set you supply.

**Hurts:** fabricated or garbled references presented with full confidence, summaries that read as comprehensive while silently missing whole literatures (coverage always has limits; Scopus AI, for example, draws on abstracts and metadata from 2003 forward), and the temptation to appraise papers from AI summaries rather than from their methods sections. The summary is a map; the methods section is the territory.

<figure class="figure">
<svg viewBox="0 0 660 215" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The seven-step literature workflow: AI accelerates orientation, search, mapping, screening, and synthesis, while appraisal stays entirely human and every citation is verified at the source">
<defs><marker id="lr-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">seven steps, one that never delegates</text>
<rect x="20" y="34" width="118" height="46" rx="7" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="79" y="53" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">1 orient</text>
<text x="79" y="67" text-anchor="middle" font-size="8" fill="var(--md-default-fg-color--light)">Scopus AI, cited summary</text>
<rect x="152" y="34" width="118" height="46" rx="7" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="211" y="53" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">2 search</text>
<text x="211" y="67" text-anchor="middle" font-size="8" fill="var(--md-default-fg-color--light)">recorded query strings</text>
<rect x="284" y="34" width="118" height="46" rx="7" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="343" y="53" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">3 grow the map</text>
<text x="343" y="67" text-anchor="middle" font-size="8" fill="var(--md-default-fg-color--light)">citation chasing, seeds</text>
<rect x="416" y="34" width="118" height="46" rx="7" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="475" y="53" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">4 screen</text>
<text x="475" y="67" text-anchor="middle" font-size="8" fill="var(--md-default-fg-color--light)">frozen criteria, audit trail</text>
<line x1="140" y1="57" x2="150" y2="57" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lr-ar)"/>
<line x1="272" y1="57" x2="282" y2="57" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lr-ar)"/>
<line x1="404" y1="57" x2="414" y2="57" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lr-ar)"/>
<line x1="475" y1="82" x2="475" y2="102" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lr-ar)"/>
<rect x="340" y="106" width="270" height="48" rx="7" fill="var(--md-primary-fg-color)"/>
<text x="475" y="126" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">5 appraise, by hand</text>
<text x="475" y="142" text-anchor="middle" font-size="8.5" fill="#ffffff">methods sections read by you; MERSQI, checklists</text>
<line x1="338" y1="130" x2="308" y2="130" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lr-ar)"/>
<rect x="170" y="106" width="136" height="48" rx="7" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="238" y="126" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">6 synthesize</text>
<text x="238" y="141" text-anchor="middle" font-size="8" fill="var(--md-default-fg-color--light)">from your appraised set</text>
<line x1="168" y1="130" x2="138" y2="130" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lr-ar)"/>
<rect x="20" y="106" width="116" height="48" rx="7" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="78" y="126" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">7 verify every</text>
<text x="78" y="141" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">citation at source</text>
<text x="330" y="182" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">AI accelerates six of the seven steps; the appraisal step is the one that makes it your review</text>
<text x="330" y="200" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">outlined boxes: AI-assisted, you steer · filled box: entirely yours</text>
</svg>
<figcaption>Speed where speed is safe; judgment where judgment is the point.</figcaption>
</figure>

## Gather first

- Your research question, framework-vetted. If it is still an idea, the [Research question coach](../prompts/index.md) prompt converts it into a PICO/PICOT or SPIDER structure with a FINER screen, and hands you the novelty search to run.
- Your inclusion and exclusion criteria, written as numbered lists before any tool sees a single abstract.
- Your review's ambition, named honestly: an orientation for an introduction section, a scoping review, or a full systematic review. A systematic review needs a registered protocol and PRISMA documentation from the first search onward, not retrofitted at the end.
- Library access: [Scopus with AI](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home) through your AUA credentials.

## The workflow

1. **Orient with Scopus AI.** Ask your question plainly and read the cited orientation summary, opening the citations rather than trusting the synthesis. You are mapping the conversation your question joins: the key authors, the recent reviews, the terms the field actually uses.
2. **Run the real search.** Move from AI conversation to explicit database queries in Scopus and PubMed using the vocabulary step 1 surfaced. Save the exact query strings and dates; every serious review reports them. For systematic work, this is the step to involve a librarian.
3. **Grow the map from seeds.** Feed your strongest papers to ResearchRabbit or use Scopus citation chasing to find what your keyword queries missed: the papers your seeds cite, and the papers that cite your seeds.
4. **Screen at scale, conservatively.** The [Literature screening assistant](../prompts/index.md) prompt applies your frozen criteria to titles and abstracts with an audit trail, defaulting to "unclear" whenever the abstract cannot support a decision. Borderline calls stay yours, and screening decisions are aids, never verdicts.
5. **Appraise by hand.** This step does not delegate. Read the methods sections of everything that survives screening and apply a structured instrument: the reporting checklist for each study's design as a completeness lens, and in medical education research, a rigor instrument such as the Medical Education Research Study Quality Instrument (MERSQI). AI can fetch and summarize; it cannot be accountable for your judgment that a study is worth building on.
6. **Synthesize from your own set.** Load the appraised papers, your papers, not the open web, into NotebookLM or a Claude Project and draft the synthesis grounded in that set, with every claim traceable to a source you have read.
7. **Verify every citation at the source.** Before any reference enters your manuscript: the paper exists, the authors and year are right, and it says what your sentence claims. No exceptions, including references you are certain about.

## Guardrails for this task

- AI-generated summaries are not citable sources; cite the papers.
- A reference list that is only partially verified is not a reference list; it is a list of leads (the [Research and Scholarship module](../pathway/research.md) covers why this failure is treated as misconduct when it reaches print).
- Manuscripts you receive for peer review, and other people's unpublished work, never enter any AI tool.
- Disclose AI assistance per your target venue's instructions; the International Committee of Medical Journal Editors (ICMJE) recommendations are the baseline: writing assistance in the acknowledgments, AI used in data collection or analysis in the methods, and responsibility for all of it stays with the authors.

## Verify before you rely on it

- [ ] The search is reproducible: databases, query strings, dates, and counts are recorded.
- [ ] Screening criteria were frozen before screening began, and every AI screening decision carries its evidence quote.
- [ ] Every included paper's methods section was read by a human, not summarized into the review.
- [ ] Every citation was opened at the original source and says what you claim it says.
- [ ] The synthesis cites only papers in your appraised set.
- [ ] AI assistance is disclosed per the venue's instructions.

More playbooks and refinements come from use: what worked, what broke, and what is missing go through the [feedback form](https://forms.office.com/r/5a8RCi2YKP).
