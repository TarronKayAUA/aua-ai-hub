---
last_reviewed: 2026-09-01
---

# Module 5: Research and Scholarship

<span class="meta-chip">For faculty and student researchers</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">Central Group on Educational Affairs (CGEA) competency domain: Using AI in Research and Scholarship</span>

## What you will be able to do

- Use AI for literature work with a workflow that catches its failure modes.
- Apply current disclosure norms for AI assistance in scholarly writing.
- Recognize the research-specific places where AI use is restricted.

--8<-- "includes/prompt-maturity-note.md"

## The core idea

Research offers real gains from artificial intelligence (AI) assistance (literature screening, summarization, drafting, code for analysis) and real penalties for sloppy use, because the integrity standards are unforgiving.

### Literature work

Models are genuinely useful for screening titles and abstracts against inclusion criteria and for first-pass synthesis; recent studies (linked as further reading under the [research prompts](../prompts/index.md#research)) report strong sensitivity when prompts state criteria explicitly and a human verifies. Two cautions: every reference an AI suggests gets verified at the original source before you cite it, because fabricated citations remain a signature failure; and a literature-screening assistant is a recall tool, not a judge, so borderline calls stay human. The [Literature screening assistant](../prompts/index.md#literature-screening-assistant) prompt in the library is built around exactly this division of labor.

### Writing and disclosure

Two norms are now widely shared across journals: an AI tool cannot be an author, because authorship requires accountability no tool can hold; and AI assistance must be disclosed. What must be disclosed, and where, still varies by venue. The [International Committee of Medical Journal Editors (ICMJE) recommendations](https://www.icmje.org/recommendations/) now carry a dedicated section on AI use by authors, reviewers, and editors; check it and your target journal's instructions before submitting. Presenting AI-generated data, images, or references as authentic empirical material is research misconduct, full stop.

### Restricted zones

Manuscripts and grant applications you receive for peer review are confidential; they do not go into any AI tool, and many funders explicitly prohibit AI use in peer review. Your own unpublished drafts are different: they are yours, and a paid plan with training on your content turned off is a reasonable place to work on them, with your co-authors' agreement for shared work. Funder rules for AI in proposal preparation vary and change; check the current policy of your funder before drafting with assistance. Research data carrying human subjects identifiers falls under the [AI Responsible Use Policy](../governance/policy.md)'s prohibited-data rules: de-identify before any AI-assisted analysis, and involve your institutional review board (IRB) where human subjects research requires it.

<figure class="figure figure--html hf">
<p class="hf-title">The three zones of research AI use</p>
<div class="hf-panels">
<div class="hf-box hf-box--ok">
<p class="hf-box-title">Assisted, verified</p>
<ul>
<li>literature screening</li>
<li>first-pass synthesis</li>
<li>analysis code drafting</li>
</ul>
<p class="hf-box-foot">Every citation checked at the original source.</p>
</div>
<div class="hf-box">
<p class="hf-box-title">Disclosed</p>
<ul>
<li>AI is never an author</li>
<li>assistance disclosed per venue</li>
<li>check ICMJE and the journal</li>
</ul>
<p class="hf-box-foot">Fabricated data, images, or references are misconduct.</p>
</div>
<div class="hf-box hf-box--stop">
<p class="hf-box-title">Restricted</p>
<ul>
<li>manuscripts under review</li>
<li>grant confidentiality, funder rules</li>
<li>identifiable subjects data</li>
</ul>
<p class="hf-box-foot">De-identify first and involve the IRB where required.</p>
</div>
</div>
<p class="hf-note">Accountability never moves: it stays with you and your coauthors in every zone.</p>
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

- [AI for Research](../tools/research.md): the tool landscape mapped to each stage of a project, starting with Scopus AI, which AUA licenses.
- [Reviewing the Literature](../playbooks/literature-reviews.md): the full workflow from question to appraised evidence.
- [Research prompts](../prompts/index.md#research): the question coach, pre-submission reviewer, and reporting guideline auditor.

**Next:** [Module 6: Clinical Contexts](clinical.md)
