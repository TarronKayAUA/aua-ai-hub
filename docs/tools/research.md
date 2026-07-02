# AI for Research

Artificial intelligence tools now cover most stages of a research project, from finding literature to checking a manuscript's citations. This page maps the current landscape to the tasks researchers actually do, with honest notes on cost, field fit, and where each tool falls short. Entries here also appear in the [tools directory](index.md) with their governance status; statuses are provisional pending AI Committee review.

!!! warning "Three rules before any of the tools"
    **Verify every citation.** Language models fabricate plausible references, and a fabricated citation in a submitted manuscript is a career-level error. Every reference an AI surfaces gets checked against the actual paper before it enters your work.

    **Check the journal's AI policy before you write with AI.** Most journals now follow International Committee of Medical Journal Editors (ICMJE) style guidance: AI tools cannot be authors, and their use in drafting must be disclosed in the methods or acknowledgments. Check the specific journal's instructions for authors before submission, not after.

    **Unpublished data stays out of consumer tools.** Data covered by an Institutional Review Board (IRB) protocol, participant information, and unpublished results do not belong in free web tools, whose terms often permit training on your inputs. The [AI Responsible Use Policy](../governance/policy.md) applies to research exactly as it does to teaching.

## Finding and mapping literature

[Semantic Scholar](https://www.semanticscholar.org) remains the strongest free starting point: a search engine over 200+ million papers including the PubMed corpus, with citation graphs and one-line paper summaries. It complements PubMed rather than replacing it; for anything clinical, run both.

[ResearchRabbit](https://www.researchrabbit.ai/) takes a different angle: give it a few seed papers and it maps the surrounding literature visually, surfacing related work, shared authorship, and citation neighborhoods. Its free tier is genuinely feature-complete (the company commits to keeping it that way), which makes it the lowest-risk recommendation on this page.

The **deep research modes** inside the general assistants (ChatGPT, Gemini, and Claude all have one on their paid plans) will search the open web and produce a cited report on a topic. They are useful for orientation in an unfamiliar area and weaker for exhaustive coverage: they miss paywalled work and their recall is not systematic-review grade. Treat their output as a scouting report, never as the review itself.

## Screening and extracting

[Elicit](https://elicit.com) is the established tool for the middle of a literature review: it finds empirical papers, screens them against your criteria, and extracts study characteristics (population, intervention, outcomes, effect sizes) into structured tables you can audit column by column. The free tier covers light use; serious extraction work lands on the paid tiers. Pair it with the [Literature screening assistant](../prompts/index.md) prompt in the library, which turns any capable assistant into a conservative second screener with an audit trail.

## Answering evidence questions

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
| Semantic Scholar | Free | Everyone; all fields including medical education |
| ResearchRabbit | Free (feature-complete tier) | Everyone; literature mapping in any field |
| NotebookLM | Free; higher limits on Google's paid AI plans | Everyone; synthesis from your own paper set |
| Consensus | Free tier; Pro about $10/month, student discounts | Clinical and biomedical evidence questions |
| Elicit | Free tier; paid tiers roughly $7 to $49/month | Systematic-review style screening and extraction |
| Scite | About $20/month, free trial | Verifying how key claims held up; biomedical depth |
| OpenEvidence | Free for verified US clinicians and US medical students | Clinical questions; US-credential holders only |
| Claude Science | Included in paid Claude plans (beta) | Computational and laboratory science; statistics-heavy work |

Field notes: **medical education researchers** get the most from Semantic Scholar, Elicit, NotebookLM, and the prompt library's research prompts; Consensus and OpenEvidence lean clinical and index education literature thinly. **Bench and computational scientists** are the audience Claude Science was built for. **Clinical questions** belong with OpenEvidence (when accessible) and Consensus, always confirmed against the underlying papers.

Suggest a tool for this page through the [About page](../about.md) contact, and expect the directory's governance statuses to lag new tools: reviewed slowly is the point.
