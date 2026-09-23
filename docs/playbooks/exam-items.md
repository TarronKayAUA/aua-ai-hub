---
last_reviewed: 2026-09-01
---

# Playbook: Writing and Vetting Exam Questions

<span class="meta-chip">For faculty</span><span class="meta-chip">About 6 minutes</span> <span class="meta-note">The highest-stakes playbook: read the [guardrails](#guardrails-for-this-task) first</span>

## The task

Use artificial intelligence (AI) to draft and structurally vet multiple choice questions (MCQs), cutting item-writing time while keeping quality control and assessment security entirely human.

## Where AI helps, and where it hurts

Models draft plausible vignette-based items quickly and are genuinely good at the mechanical vetting pass: catching cueing, non-homogeneous options, lead-ins that fail the cover-the-options test, and testwise shortcuts. The published comparisons (linked as further reading under the [MCQ prompts](../prompts/index.md#mcq-generation)) consistently find AI items usable but uneven, with flaws that standard item-review criteria catch. What models cannot do is judge clinical accuracy reliably, know your blueprint, or carry accountability for an exam. The workflow below keeps those with you.

## Gather first

- The learning objective each item must test, and the blueprint slot it fills.
- Target level (preclinical or clinical) and item format conventions your exam committee uses.
- Your item-writing standards (the library prompts encode the common National Board of Medical Examiners style rules: vignette-dependent, lead-in answerable cold, homogeneous options, no absolutes or cues).

--8<-- "includes/prompt-maturity-note.md"

## The workflow

1. **Draft.** Run the [Single best answer item writer](../prompts/index.md#mcq-generation) with one objective at a time. Generate two or three variants per objective; variety is cheap and your selection instinct is fast.
2. **Vet structurally.** Feed each candidate through the [Item flaw checker](../prompts/index.md#mcq-vetting). Have it report flaws before proposing any rewrite, so you see the diagnosis, not just a polished surface.
3. **Vet for content.** This step is entirely yours: clinical accuracy, currency of the underlying knowledge, blueprint fit, and difficulty for your cohort. The studies are blunt that this is where AI items fail when they fail.
4. **Pilot like any item.** AI-drafted items earn no exemption from your normal exam review committee and post-exam item analysis. Flag their origin in your records so you can compare their performance statistics over time.

## Guardrails for this task

This is where assessment security and AI collide, so the lines are bright:

- **Drafting happens before items are secure.** Working with AI on new draft items is fine. A finalized item is usually a revised draft, so the wording you finalize is only as secure as the drafts before it: draft in a tool with model training turned off where the tool allows it, and keep draft items out of shared or saved chats. Once an item is finalized for a live exam, it is secure assessment material and **never enters a public AI tool again**, not for revision, not for explanation drafting, not for difficulty estimation. Exposure of secure items to tools that may store or learn from inputs compromises the exam.
- The same applies to answer keys, secure item banks, and anything from a licensed question bank, which is also third-party intellectual property: the policy prohibits entering licensed third-party material into AI tools without review, whatever the license says.
- Never include real patient details in vignettes; invent or fully abstract them.
- Item drafts derived from past exam performance data require that data to be de-identified first.
- Per the [AI Responsible Use Policy](../governance/policy.md), the final items are your responsibility and your exam committee's, regardless of what drafted them.

<figure class="figure figure--html hf">
<p class="hf-title">The bright line</p>
<div class="hf-split">
<div class="hf-box hf-box--plain">
<p class="hf-box-title">While drafting</p>
<p class="hf-box-sub">AI is fine here</p>
<ul>
<li>draft variants with AI</li>
<li>structural flaw vetting</li>
<li>your own content vet</li>
</ul>
</div>
<div class="hf-split-line"><span>finalized</span></div>
<div class="hf-box hf-box--stop">
<p class="hf-box-title">Once finalized for a live exam</p>
<p class="hf-box-alert">never enters a public AI tool again</p>
<ul>
<li>no revision help</li>
<li>no explanation drafting</li>
<li>no difficulty estimation</li>
</ul>
</div>
</div>
<p class="hf-note">Answer keys and licensed bank content live on the secure side from day one.</p>
<figcaption>Drafting with AI is fine; a finalized item is secure material, and secure material never touches a public tool.</figcaption>
</figure>

## Before you rely on it

- [ ] Every item independently verified for clinical accuracy against a current source.
- [ ] Structural vet passed, by the flaw checker and by your own read.
- [ ] Blueprint mapping confirmed; the item tests the objective, not adjacent trivia.
- [ ] Standard exam committee review and pilot analysis applied, with AI origin noted in records.
- [ ] No finalized secure item or key has touched a public tool.

**Related:** [Module 4: Teaching and Assessment](../pathway/teaching-assessment.md) for the principles, and the item-vetting prompts in the [prompt library](../prompts/index.md).
