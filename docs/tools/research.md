---
last_reviewed: 2026-09-01
---

# AI for Research

<span class="meta-chip">For faculty and student researchers</span><span class="meta-chip">About 12 minutes</span>

Artificial intelligence (AI) tools now cover most stages of a research project, from finding literature to checking a manuscript's citations. This page maps the current landscape to the tasks researchers actually do, with honest notes on cost, field fit, and where each tool falls short. Entries here also appear in the [tools directory](index.md) with their governance status.

!!! note "Two things that keep AI-assisted research sound"
    **Check each citation against the paper.** Language models can produce references that look right and do not exist, or cite a real paper for a claim it does not make; opening each one before it goes into your manuscript catches both. The [AI Responsible Use Policy](../governance/policy.md#responsible-use) requires references obtained from an AI tool to be verified at the original source.

    **Participant data follows the policy and your protocol.** Research participant data, including anything identifiable or covered by an Institutional Review Board (IRB) protocol, is among the information the [AI Responsible Use Policy](../governance/policy.md#responsible-use) keeps out of publicly available AI tools unless the AI Responsible Use Subcommittee has approved a tool for it, and a paid plan on its own is not that approval. Your IRB protocol usually also says where participant data may be stored and processed, so it is worth checking before bringing a new tool into a study. Your own unpublished drafts are yours to work on in a paid plan with training on your content turned off. A shared manuscript is partly your co-authors' work, so it is worth agreeing with them on the tools you will use, which also keeps the paper's AI disclosure complete.

<figure class="figure figure--html hf">
<p class="hf-title">The pipeline, mapped to tools</p>
<ol class="hf-steps hf-steps--wide">
<li class="hf-box"><p class="hf-box-title">Find and map</p><p class="hf-box-sub">Scopus with AI (AUA-licensed), Semantic Scholar, ResearchRabbit, deep research modes</p></li>
<li class="hf-box"><p class="hf-box-title">Screen and extract</p><p class="hf-box-sub">Elicit, plus the library's screening prompt</p></li>
<li class="hf-box"><p class="hf-box-title">Evidence questions</p><p class="hf-box-sub">Scopus AI, Consensus, Scite, OpenEvidence</p></li>
<li class="hf-box"><p class="hf-box-title">Synthesize your sources</p><p class="hf-box-sub">Gemini Notebook, grounded in what you upload</p></li>
<li class="hf-box"><p class="hf-box-title">Analyze</p><p class="hf-box-sub">Claude Science, analysis plan prompt</p></li>
<li class="hf-box"><p class="hf-box-title">Write and disclose</p><p class="hf-box-sub">pre-submission reviewer and reporting guideline auditor prompts</p></li>
</ol>
<figcaption>Each stage has a section below.</figcaption>
</figure>

If you only want the table, jump to [Cost and field fit at a glance](#cost-and-field-fit-at-a-glance).

## Scopus with AI, licensed for AUA

AUA holds an institution-wide license to [Scopus](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home), Elsevier's citation database of peer-reviewed literature, arranged through the AUA Library in 2026, and the license includes [Scopus AI](https://www.elsevier.com/products/scopus/scopus-ai), the generative layer built on top of it. Ask a question in plain language and it returns a summary with citations and confidence indicators, a concept map of the surrounding topic, the foundational papers behind the answer, and emerging research themes; a Deep Research mode plans and runs a longer investigation and produces a downloadable report. Sign in with your AUA credentials through the library link above.

Know what it is grounded in before you lean on it: Scopus AI works from titles, abstracts, and metadata rather than full text, its coverage concentrates on literature from 2003 onward, and Elsevier itself states that the summaries are not citable. Treat it as a quick way to orient in an unfamiliar literature and surface the papers that matter, then read those papers.

Because it is comprehensive and the directory's one institutionally licensed research tool, this page's default is Scopus first: where Scopus does a task well, start there. The tools below earn their places by doing things Scopus does not.

## Finding and mapping literature

Start with [Scopus](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home) for searching, orientation summaries, and citation chasing: it is licensed, curated, and its AI layer turns a plain-language question into a cited map of the territory. For anything clinical, PubMed remains its peer rather than its subset; run both.

[Semantic Scholar](https://www.semanticscholar.org) is a free alternative: a free, no-sign-in search engine over 200+ million papers including the PubMed corpus, with citation graphs and one-line paper summaries. Reach for it off campus, for quick checks, or when you want a second index's view of the same question.

[ResearchRabbit](https://www.researchrabbit.ai/) does one thing Scopus AI's concept maps do not: give it a few seed papers you already trust and it maps the literature *around them* visually, surfacing related work, shared authorship, and citation neighborhoods. Its free tier currently includes the full feature set, which the company says it intends to keep. Use Scopus to find your seeds, ResearchRabbit to grow them. The directory's [Research](index.md#research) section lists further search assistants, including Undermind, Asta, and SciSpace.

The **deep research modes** inside the general assistants (ChatGPT, Gemini, and Claude all offer one, with the fullest versions on paid plans) will search the open web and produce a cited report on a topic. They are useful for orientation in an unfamiliar area and weaker for exhaustive coverage: they miss paywalled work and their recall is not systematic-review grade. Their output works best as a scouting report that shows you where to dig, rather than as the review itself.

## Screening and extracting

[Elicit](https://elicit.com) is built for the middle of a literature review: it finds empirical papers, screens them against your criteria, and extracts study characteristics (population, intervention, outcomes, effect sizes) into structured tables you can audit column by column. The free tier covers light use; serious extraction work lands on the paid tiers. Pair it with the [Literature screening assistant](../prompts/index.md#literature-screening-assistant) prompt in the library, which turns any capable assistant into a conservative second screener with an audit trail.

For team-based systematic reviews, [Rayyan](https://www.rayyan.ai/) (free plan available) and [Covidence](https://www.covidence.org/) (paid) manage reference import, duplicate detection, and screening across a review team; the [directory](index.md#research) describes each.

## Answering evidence questions

For a first pass at "what does the literature say about X," licensed [Scopus AI](http://auamed.idm.oclc.org/login?url=https://www.scopus.com/pages/home) covers this ground well: a cited, confidence-scored summary that tells you which papers to read. The tools below each add something it lacks.

[Consensus](https://consensus.app) answers "does X help with Y?" questions by synthesizing across published studies, with a meter summarizing which way the evidence leans. It shows where the literature disagrees, and is best treated as a first pass that tells you which papers to actually read.

[OpenEvidence](https://www.openevidence.com) is the clinical specialist: question answering cited to the medical literature, built for point-of-care use and free for verified clinicians. The access catch matters at AUA: verification is built around United States credentials (a National Provider Identifier, or enrollment at a US medical school), and the service withdrew from the United Kingdom and European Union in spring 2026. Faculty and students holding US credentials can use it; others largely cannot.

[Scite](https://scite.ai) answers a narrower and valuable question: has this paper's claim been supported or disputed by later work? Its citation-context analysis is most useful when a key claim in your manuscript rests on one or two studies.

## Synthesizing from your own sources

[Gemini Notebook](gemini-notebook.md), which Google renamed from NotebookLM in July 2026, is a free tool for working with a fixed set of papers: upload them and it answers questions, drafts summaries, and builds study aids grounded in the sources you add, with citations back to the exact passage. Because it answers from your uploads rather than from general knowledge, it is less prone to invented answers than a general assistant, though not immune: its [dedicated page](gemini-notebook.md) covers what the published evaluations found, the features that add web sources, and where generated summaries and audio overviews go wrong. The limitation is the same as the strength: it only knows what you upload.

## Analysis and agentic workbenches

For planning statistics before you run them, the [Analysis plan reviewer](../prompts/index.md#analysis-plan-reviewer) prompt in the library is the place to start; it recommends methods and names its assumptions without ever inventing results.

The newest category in 2026 is the **agent-based research workbench**, and [Claude Science](https://claude.com/science) is one example: a local-first desktop application. A coordinating agent can query more than 60 scientific databases and draw on a growing set of scientific skills and connectors (genomics, single-cell analysis, proteomics, structural biology, cheminformatics). It runs code on your machine or your lab's servers, and a separate reviewer agent checks citations and calculations in what it produces. Local-first means your files and outputs stay on your device, but the model itself runs in Anthropic's cloud, so anything the agent reads is sent there. Because the agent opens files on its own, pointing it at a folder that holds only what you mean to share keeps everything else out of its reach.

**Setting it up:** Claude Science is in beta for Pro, Max, Team, and Enterprise Claude plans, on Mac (Apple silicon and Intel) and Linux, from [claude.com/science](https://claude.com/science). Anthropic also advertises a discounted Team plan for scientists at academic and nonprofit institutions, described on that page as available at no cost to start. On a Windows machine, install it inside the Windows Subsystem for Linux (WSL: run `wsl --install` in an administrator terminal, then install the Linux build inside that environment); it can also run on a remote machine over a secure shell (SSH) connection, including a high-performance computing login node. Expect beta rough edges. The reviewer agent reduces the checking you do rather than replacing it, so treat its sign-off as a first pass.

For general-purpose agents (coding assistants, computer-use tools) that also serve research workflows, see [AI Agents](agents.md).

## Judged by the same rulers

The pipeline's last stage, writing and disclosure, is the one no tool changes. AI-assisted research is held to the same instruments as any research:

- **Reporting guidelines** for your design: the EQUATOR Network's reporting checklists, such as STROBE (Strengthening the Reporting of Observational Studies in Epidemiology) for observational studies or CONSORT (Consolidated Standards of Reporting Trials) for trials.
- **Rigor instruments** like the Medical Education Research Study Quality Instrument (MERSQI) in medical education.
- **The International Committee of Medical Journal Editors (ICMJE) authorship rules**, which are explicit on three points: an AI tool cannot be an author; AI writing assistance is disclosed in the acknowledgments and AI used in data collection or analysis in the methods; and responsibility for every AI-assisted sentence stays with the humans who sign the paper. Journals often add their own requirements on top, so reading the target journal's instructions for authors early lets you keep a note of which tools you used as you go, rather than piecing it together at submission.

The prompt library's [Pre-submission reviewer](../prompts/index.md#pre-submission-reviewer) and [Reporting guideline auditor](../prompts/index.md#reporting-guideline-auditor) turn those standards into working checks, the [literature review playbook](../playbooks/literature-reviews.md) walks the full workflow, and the [Research and Scholarship module](../pathway/research.md) covers the disclosure norms.

## Cost and field fit at a glance

Prices are approximate, checked September 2026 from vendor pages, and change often; the vendor's pricing page is authoritative.

| Tool | Cost | Best fit for AUA researchers |
| --- | --- | --- |
| [Scopus with AI](#scopus-with-ai-licensed-for-aua) | AUA institutional license; no cost to AUA users | Everyone; cited orientation summaries plus citation-database depth |
| [Semantic Scholar](#finding-and-mapping-literature) | Free | Everyone; all fields including medical education |
| [ResearchRabbit](#finding-and-mapping-literature) | Free (feature-complete tier) | Everyone; literature mapping in any field |
| [Gemini Notebook](#synthesizing-from-your-own-sources) | Free; higher limits on Google's paid AI plans | Everyone; synthesis from your own paper set |
| [Consensus](#answering-evidence-questions) | Free tier; Pro about $10/month, student discounts | Clinical and biomedical evidence questions |
| [Elicit](#screening-and-extracting) | Free tier; paid tiers from $11 to $89 per user per month when billed annually | Systematic-review style screening and extraction |
| [Scite](#answering-evidence-questions) | About $20/month, free trial | Verifying how key claims held up; biomedical depth |
| [OpenEvidence](#answering-evidence-questions) | Free for verified US clinicians and US medical students | Clinical questions; US-credential holders only |
| [Claude Science](#analysis-and-agentic-workbenches) | Included in paid Claude plans (beta); a discounted Team plan for scientists is advertised for academic and nonprofit institutions | Computational and laboratory science; statistics-heavy work |

Field notes: **medical education researchers** get the most from Scopus with AI, Semantic Scholar, Elicit, Gemini Notebook, and the prompt library's research prompts; Consensus and OpenEvidence lean clinical and index education literature thinly. **Bench and computational scientists** are the audience Claude Science was built for. **Clinical questions** suit OpenEvidence (when accessible) and Consensus, both of which point you to the underlying papers to read.

Suggest a tool for this page through the [About page](../about.md) contact. New tools enter the directory as Listed, a catalog fact rather than a verdict; committee review of any tool can be requested through the [review process](../governance/review-process.md).
