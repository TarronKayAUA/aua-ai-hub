---
last_reviewed: 2026-09-01
---

# Module 4: Teaching and Assessment

<span class="meta-chip">For faculty</span><span class="meta-chip">About 15 minutes</span> <span class="meta-note">Central Group on Educational Affairs (CGEA) competency domain: AI Possibilities in Medical Education</span>

## What you will be able to do

- Identify the teaching tasks where AI assistance is currently strongest and weakest.
- Use a safe workflow for AI-assisted assessment item drafting.
- Set AI expectations for your own course deliberately rather than by default.

--8<-- "includes/prompt-maturity-note.md"

## The core idea

For educators, artificial intelligence (AI) is at its best on structured generation from your materials: outlines, cases, vignettes, draft questions, rubrics, explanations at a chosen level, and alternative examples when students need a concept approached differently. It is weakest exactly where your judgment is the job: deciding what matters for your learners, judging clinical accuracy, and evaluating real student work fairly.

### Content and session preparation

The [Preparing a Lecture playbook](../playbooks/lecture-prep.md) walks the full workflow. The pattern generalizes: feed the model your objectives and materials, ask for structure plus active-learning checks, then apply your expertise to what comes back. The accuracy of anything that reaches students is yours to confirm.

### Assessment writing

AI drafts plausible multiple choice questions (MCQs) quickly, and the evidence so far says quality is usable but uneven, with structural flaws that standard item-writing rules catch. Two non-negotiables frame the workflow: every AI-drafted item gets faculty review for accuracy and blueprint fit before use, and secure assessment materials (live exam items, answer keys, secure banks) never go into public AI tools. The [exam questions playbook](../playbooks/exam-items.md) gives the step-by-step, and the prompt library's [item writer](../prompts/index.md#single-best-answer-item-writer) and [flaw checker](../prompts/index.md#item-flaw-checker) carry the studies behind this as further reading.

### Evaluating student work

This is the highest-caution zone. Identifiable student work and grades are records protected by the Family Educational Rights and Privacy Act (FERPA), so they do not go into public tools; de-identify first or do not use AI at all. And outputs from AI detectors and similarity flags are preliminary indicators, not verdicts; treat any flag as a starting point for human review, never as sufficient evidence on its own.

### Your course's AI rules

Students will use these tools; ambiguity serves no one. The policy delegates labeling and attribution expectations to course and departmental guidelines, which means your syllabus is where the line gets drawn. The [syllabus AI statement playbook](../playbooks/syllabus-statement.md) offers adaptable templates from prohibited to encouraged-with-verification.

<figure class="figure figure--html hf">
<p class="hf-title">The caution gradient</p>
<div class="hf-gradient">
<div class="hf-grad-row">
<p class="hf-grad-label">Content preparation</p>
<div class="hf-box hf-box--ok"><p>Strong leverage: outlines, cases, checks from your materials. The accuracy of what reaches students is yours to confirm.</p></div>
</div>
<div class="hf-grad-row">
<p class="hf-grad-label">Assessment writing</p>
<div class="hf-box hf-box--warn"><p>Usable but uneven drafts. Faculty review every item, and finalized secure items never enter public tools.</p></div>
</div>
<div class="hf-grad-row">
<p class="hf-grad-label">Evaluating student work</p>
<div class="hf-box hf-box--stop"><p>FERPA territory: de-identify or do not use AI at all. Detector flags are indicators, never verdicts.</p></div>
</div>
</div>
<figcaption>The further down, the less the tool decides and the more you do.</figcaption>
</figure>

## Self-check

??? question "You want AI feedback on twelve student reflection essays. What has to happen first?"
    De-identification, at minimum: names, identifiers, and details that make an author traceable must come out, because identifiable student work is a protected education record and public tools are not approved for it. Even then, the feedback that reaches the student should be yours; the tool can help you draft, not judge.

??? question "An AI detector flags one student's essay at 92 percent. What does that number justify by itself?"
    A closer human look, and nothing more. Detector outputs are preliminary indicators with known false-positive problems. An academic integrity action needs human review of the actual evidence and an opportunity for the student to respond, not a percentage from a black box.

??? question "Why are AI-drafted exam items kept out of public AI tools after they are finalized for use?"
    Because a live exam item is secure assessment material: pasting it into a public tool risks exposing it (some tools learn from or store inputs), which compromises the assessment. Treat anything drafted in a public tool as already exposed, so do the final revision outside the tool before an item enters a secure bank, and never paste a finalized item back in.

## Going deeper

- [Feedback on Student Writing](../playbooks/writing-feedback.md): the highest-caution zone above, as a full guarded workflow.
- [Administrative Drafting](../playbooks/admin-drafting.md): the same discipline applied to memos, minutes, and reports.
- [Standing Setups](../tools/standing-setups.md): a project per course, so the model knows your objectives all term.
- [AI-Generated Images in Teaching](../playbooks/ai-images.md): why generated anatomy fails, what to reach for instead, and the conditions under which a flawed image is defensible pedagogy.

**Next:** [Module 5: Research and Scholarship](research.md) or [Module 6: Clinical Contexts](clinical.md)
