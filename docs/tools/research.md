---
last_reviewed: 2026-07-08
---

# AI for Research

Artificial intelligence tools now cover most stages of a research project, from finding literature to checking a manuscript's citations. This page maps the current landscape to the tasks researchers actually do, with honest notes on cost, field fit, and where each tool falls short. Entries here also appear in the [tools directory](index.md) with their governance status; statuses are provisional pending AI Committee review.

!!! warning "Three rules before any of the tools"
    **Verify every citation.** Language models fabricate plausible references, and a fabricated citation in a submitted manuscript is a career-level error. Every reference an AI surfaces gets checked against the actual paper before it enters your work.

    **Check the journal's AI policy before you write with AI.** Most journals now follow International Committee of Medical Journal Editors (ICMJE) style guidance: AI tools cannot be authors, and their use in drafting must be disclosed in the methods or acknowledgments. Check the specific journal's instructions for authors before submission, not after.

    **Unpublished data stays out of consumer tools.** Data covered by an Institutional Review Board (IRB) protocol, participant information, and unpublished results do not belong in free web tools, whose terms often permit training on your inputs. The [AI Responsible Use Policy](../governance/policy.md) applies to research exactly as it does to teaching.

<figure class="figure">
<svg viewBox="0 0 660 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Six research stages from finding literature to writing, each mapped to the tools covered below">
<defs><marker id="rs-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the pipeline, mapped to tools</text>
<rect x="20" y="32" width="195" height="88" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="117" y="52" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">1. find and map</text>
<text x="117" y="72" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">Scopus with AI (AUA-licensed),</text>
<text x="117" y="86" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">Semantic Scholar, ResearchRabbit,</text>
<text x="117" y="100" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">deep research modes</text>
<rect x="232" y="32" width="195" height="88" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="329" y="52" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">2. screen and extract</text>
<text x="329" y="72" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">Elicit, plus the library's</text>
<text x="329" y="86" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">screening prompt</text>
<rect x="444" y="32" width="195" height="88" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="541" y="52" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">3. evidence questions</text>
<text x="541" y="72" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">Scopus AI, Consensus,</text>
<text x="541" y="86" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">Scite, OpenEvidence</text>
<rect x="20" y="152" width="195" height="88" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="117" y="172" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">4. synthesize your sources</text>
<text x="117" y="192" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">NotebookLM, grounded</text>
<text x="117" y="206" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">in what you upload</text>
<rect x="232" y="152" width="195" height="88" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="329" y="172" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">5. analyze</text>
<text x="329" y="192" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">Claude Science,</text>
<text x="329" y="206" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">analysis plan prompt</text>
<rect x="444" y="152" width="195" height="88" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="541" y="172" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">6. write and disclose</text>
<text x="541" y="192" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">verify every citation,</text>
<text x="541" y="206" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">check the journal's AI policy</text>
<line x1="217" y1="76" x2="230" y2="76" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rs-ar)"/>
<line x1="429" y1="76" x2="442" y2="76" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rs-ar)"/>
<path d="M 541 120 L 541 136 L 117 136 L 117 150" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rs-ar)"/>
<line x1="217" y1="196" x2="230" y2="196" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rs-ar)"/>
<line x1="429" y1="196" x2="442" y2="196" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rs-ar)"/>
</svg>
<figcaption>Each stage has a section below; every stage ends with your own verification at the source.</figcaption>
</figure>

## Scopus with AI, licensed for AUA

AUA holds an institution-wide license to [Scopus](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home), Elsevier's citation database of peer-reviewed literature, arranged through the AUA Library in 2026, and the license includes [Scopus AI](https://www.elsevier.com/products/scopus/scopus-ai), the generative layer built on top of it. Ask a question in plain language and it returns a summary with citations and confidence indicators, a concept map of the surrounding topic, the foundational papers behind the answer, and emerging research themes; a Deep Research mode plans and runs a longer investigation and produces a downloadable report. Sign in with your AUA credentials through the library link above.

Know what it is grounded in before you lean on it: Scopus AI works from titles, abstracts, and metadata rather than full text, its coverage concentrates on literature from 2003 onward, and Elsevier itself states that the summaries are not citable. Treat it as the fastest way to orient in an unfamiliar literature and surface the papers that matter, then read those papers; the verification rules at the top of this page apply unchanged.

Because it is licensed, comprehensive, and the directory's one approved research tool, this page's default is Scopus first: where Scopus does a task well, start there. The tools below earn their places by doing things Scopus does not, and those recommendations are unchanged.

## Finding and mapping literature

Start with [Scopus](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home) for searching, orientation summaries, and citation chasing: it is licensed, curated, and its AI layer turns a plain-language question into a cited map of the territory. For anything clinical, PubMed remains its peer rather than its subset; run both.

[Semantic Scholar](https://www.semanticscholar.org) is the strongest open alternative: a free, no-sign-in search engine over 200+ million papers including the PubMed corpus, with citation graphs and one-line paper summaries. Reach for it off campus, for quick checks, or when you want a second index's view of the same question.

[ResearchRabbit](https://www.researchrabbit.ai/) does one thing Scopus AI's concept maps do not: give it a few seed papers you already trust and it maps the literature *around them* visually, surfacing related work, shared authorship, and citation neighborhoods. Its free tier is genuinely feature-complete (the company commits to keeping it that way). Use Scopus to find your seeds, ResearchRabbit to grow them.

The **deep research modes** inside the general assistants (ChatGPT, Gemini, and Claude all have one on their paid plans) will search the open web and produce a cited report on a topic. They are useful for orientation in an unfamiliar area and weaker for exhaustive coverage: they miss paywalled work and their recall is not systematic-review grade. Treat their output as a scouting report, never as the review itself.

## Screening and extracting

[Elicit](https://elicit.com) is the established tool for the middle of a literature review: it finds empirical papers, screens them against your criteria, and extracts study characteristics (population, intervention, outcomes, effect sizes) into structured tables you can audit column by column. The free tier covers light use; serious extraction work lands on the paid tiers. Pair it with the [Literature screening assistant](../prompts/index.md) prompt in the library, which turns any capable assistant into a conservative second screener with an audit trail.

## Answering evidence questions

For a first pass at "what does the literature say about X," licensed [Scopus AI](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home) now covers this ground well: a cited, confidence-scored summary that tells you which papers to read. The tools below each add something it lacks.

[Consensus](https://consensus.app) answers "does X help with Y?" questions by synthesizing across published studies, with a meter summarizing which way the evidence leans. It is quick and honest about disagreement in the literature, and best treated as a first pass that tells you which papers to actually read.

[OpenEvidence](https://www.openevidence.com) is the clinical specialist: question answering cited to the medical literature, built for point-of-care use and free for verified clinicians. The access catch matters at AUA: verification is built around United States credentials (a National Provider Identifier, or enrollment at a US medical school), and the service withdrew from the United Kingdom and European Union in spring 2026. Faculty and students holding US credentials can use it; others largely cannot.

[Scite](https://scite.ai) answers a narrower and valuable question: has this paper's claim been supported or disputed by later work? Its citation-context analysis is worth the subscription when a key claim in your manuscript rests on one or two studies.

## Synthesizing from your own sources

[NotebookLM](https://notebooklm.google.com) is the standout free tool for working with a fixed set of papers: upload them and it answers questions, drafts summaries, and builds study aids grounded only in what you gave it, with citations back to the exact passage. Because it refuses to reach beyond the uploaded sources, it has the lowest hallucination risk of anything on this page. The limitation is the same as the strength: it only knows what you upload.

## Analysis and agentic workbenches

For planning statistics before data touches any tool, the [Analysis plan reviewer](../prompts/index.md) prompt in the library is the place to start; it recommends methods and names its assumptions without ever inventing results.

The new category in 2026 is the **agentic research workbench**, and [Claude Science](https://claude.com/science) is the most complete entrant: a local-first desktop application in which a coordinating agent works with about 60 curated scientific skills and connectors (genomics, single-cell analysis, proteomics, structural biology, cheminformatics), executes code on your machine or your lab's infrastructure, and runs a reviewer agent that checks citations and calculations in what it produces. Local-first matters here: files and artifacts can stay on your device, which is a meaningfully better posture for sensitive research material than a consumer web tool.

**Setting it up:** Claude Science is in beta for Pro, Max, Team, and Enterprise Claude plans, on macOS 13+ and Linux x64, from [claude.com/science](https://claude.com/science). On a Windows machine, install it inside the Windows Subsystem for Linux (WSL: run `wsl --install` in an administrator terminal, then install the Linux build inside that environment); it can also run on a remote machine over SSH, including a high-performance computing login node. Expect beta rough edges, and hold it to the same standard as everything else here: the reviewer agent reduces checking work, it does not replace it.

For general-purpose agents (coding assistants, computer-use tools) that also serve research workflows, see [AI Agents](agents.md).

## Cost and field fit at a glance

Prices are approximate, checked July 2026 from vendor pages, and change often; the vendor's pricing page is authoritative.

| Tool | Cost | Best fit for AUA researchers |
| --- | --- | --- |
| Scopus with AI | AUA institutional license; no cost to AUA users | Everyone; cited orientation summaries plus citation-database depth |
| Semantic Scholar | Free | Everyone; all fields including medical education |
| ResearchRabbit | Free (feature-complete tier) | Everyone; literature mapping in any field |
| NotebookLM | Free; higher limits on Google's paid AI plans | Everyone; synthesis from your own paper set |
| Consensus | Free tier; Pro about $10/month, student discounts | Clinical and biomedical evidence questions |
| Elicit | Free tier; paid tiers roughly $7 to $49/month | Systematic-review style screening and extraction |
| Scite | About $20/month, free trial | Verifying how key claims held up; biomedical depth |
| OpenEvidence | Free for verified US clinicians and US medical students | Clinical questions; US-credential holders only |
| Claude Science | Included in paid Claude plans (beta) | Computational and laboratory science; statistics-heavy work |

Field notes: **medical education researchers** get the most from Scopus with AI, Semantic Scholar, Elicit, NotebookLM, and the prompt library's research prompts; Consensus and OpenEvidence lean clinical and index education literature thinly. **Bench and computational scientists** are the audience Claude Science was built for. **Clinical questions** belong with OpenEvidence (when accessible) and Consensus, always confirmed against the underlying papers.

## Judged by the same rulers

None of these tools changes what your work is measured against. AI-assisted research is held to the same instruments as any research: the reporting guideline for your design (the EQUATOR Network's checklists, such as STROBE for observational studies or CONSORT for trials), rigor instruments like the Medical Education Research Study Quality Instrument (MERSQI) in medical education, and the International Committee of Medical Journal Editors (ICMJE) rules on authorship, which are explicit that an AI tool cannot be an author, that AI writing assistance is disclosed in the acknowledgments and AI used in data collection or analysis in the methods, and that responsibility for every AI-assisted sentence stays with the humans who sign the paper. The prompt library's [Pre-submission reviewer and Reporting guideline auditor](../prompts/index.md) turn those standards into working checks, the [literature review playbook](../playbooks/literature-reviews.md) walks the full workflow, and the [Research and Scholarship module](../pathway/research.md) covers the disclosure norms.

Suggest a tool for this page through the [About page](../about.md) contact, and expect the directory's governance statuses to lag new tools: reviewed slowly is the point.
