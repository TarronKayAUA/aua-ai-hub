---
last_reviewed: 2026-07-02
---

# Module 5: Research and Scholarship

**For faculty and student researchers · about 10 minutes · CGEA competency domain: Using AI in Research and Scholarship**

--8<-- "includes/prompt-maturity-note.md"

## What you will be able to do

- Use AI for literature work with a workflow that catches its failure modes.
- Apply current disclosure norms for AI assistance in scholarly writing.
- Recognize the research-specific places where AI use is restricted.

## The core idea

Research rewards AI assistance more than almost any other academic activity (literature screening, summarization, drafting, code for analysis) and punishes sloppy AI use more too, because the integrity standards are unforgiving.

**Literature work.** Models are genuinely useful for screening titles and abstracts against inclusion criteria and for first-pass synthesis; recent studies (linked as further reading under the [research prompts](../prompts/index.md)) report strong sensitivity when prompts state criteria explicitly and a human verifies. Two cautions: every reference an AI suggests gets verified at the original source before you cite it, because fabricated citations remain a signature failure; and a literature-screening assistant is a recall tool, not a judge, so borderline calls stay human. The [Literature screening prompt](../prompts/index.md) in the library is built around exactly this division of labor.

**Writing and disclosure.** The norms have settled quickly and are remarkably consistent across journals: an AI tool cannot be an author, because authorship requires accountability no tool can hold; and AI assistance must be disclosed per the venue's requirements. The [International Committee of Medical Journal Editors (ICMJE) recommendations](https://www.icmje.org/recommendations/) now carry a dedicated section on AI use by authors, reviewers, and editors; check it and your target journal's instructions before submitting. Presenting AI-generated data, images, or references as authentic empirical material is research misconduct, full stop.

**Restricted zones.** Unpublished manuscripts, grant applications, and materials you receive for peer review are confidential; they do not go into public AI tools, and many funders explicitly prohibit AI use in peer review. Funder rules for AI in proposal preparation vary and change; check the current policy of your funder before drafting with assistance. Research data carrying human subjects identifiers falls under the [AI Responsible Use Policy](../governance/policy.md)'s prohibited-data rules: de-identify before any AI-assisted analysis, and involve your institutional review board (IRB) where human subjects research requires it.

<figure class="figure">
<svg viewBox="0 0 660 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three zones of research AI use: assisted and verified literature work, disclosed writing assistance, and restricted confidential material">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the three zones of research AI use</text>
<rect x="20" y="30" width="195" height="130" rx="8" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="117" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">assisted, verified</text>
<text x="117" y="74" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">literature screening</text>
<text x="117" y="90" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">first-pass synthesis</text>
<text x="117" y="106" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">analysis code drafting</text>
<text x="117" y="130" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">every citation checked</text>
<text x="117" y="143" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">at the original source</text>
<rect x="232" y="30" width="195" height="130" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="329" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">disclosed</text>
<text x="329" y="74" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">AI is never an author</text>
<text x="329" y="90" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">assistance disclosed per venue</text>
<text x="329" y="106" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">check ICMJE and the journal</text>
<text x="329" y="130" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">fabricated data, images, or</text>
<text x="329" y="143" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">references are misconduct</text>
<rect x="444" y="30" width="195" height="130" rx="8" fill="none" stroke="#c62828" stroke-width="2"/>
<text x="541" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">restricted</text>
<text x="541" y="74" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">manuscripts under review</text>
<text x="541" y="90" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">grant confidentiality, funder rules</text>
<text x="541" y="106" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">identifiable subjects data</text>
<text x="541" y="130" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">de-identify first and involve</text>
<text x="541" y="143" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">the IRB where required</text>
<text x="330" y="180" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">accountability never moves: it stays with you and your coauthors in every zone</text>
</svg>
<figcaption>Reward and risk rise together; disclosure and verification keep you on the right side.</figcaption>
</figure>

## Self-check

??? question "A model produced a beautifully formatted reference list for your introduction. Five of the twelve citations check out so far. What do you do with the other seven?"
    Verify every one at the original source before any of them enter the manuscript, and expect some to be fabrications: plausible authors, real journals, nonexistent papers. A partially verified AI reference list is not a reference list; it is a list of leads.

??? question "You are reviewing a manuscript for a journal and want an AI summary to speed things up. What is the problem?"
    Manuscripts under review are confidential materials entrusted to you; uploading one to a public AI tool discloses it to a third party without consent, and journals and funders widely prohibit it. Decline the shortcut.

??? question "Where does your accountability sit when AI helped with the analysis code and the drafting?"
    Exactly where it sat before AI: with you and your coauthors. Disclose the assistance per the venue's rules, verify what the tool produced, and stand behind every number and sentence. No disclosure transfers responsibility to the tool.

## Going deeper

- [AI for Research](../tools/research.md): the tool landscape mapped to each stage of a project, Scopus first where it is strongest.
- [Reviewing the Literature](../playbooks/literature-reviews.md): the full workflow from question to appraised evidence.
- [Research prompts](../prompts/index.md): the question coach, pre-submission reviewer, and reporting guideline auditor.

**Next:** [Module 6: Clinical Contexts](clinical.md)
