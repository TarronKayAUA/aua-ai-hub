---
last_reviewed: 2026-07-02
---

# Module 4: Teaching and Assessment

**For faculty · about 15 minutes · CGEA competency domain: AI Possibilities in Medical Education**

--8<-- "includes/prompt-maturity-note.md"

## What you will be able to do

- Identify the teaching tasks where AI assistance is currently strongest and weakest.
- Use a safe workflow for AI-assisted assessment item drafting.
- Set AI expectations for your own course deliberately rather than by default.

## The core idea

For educators, AI is at its best on structured generation from your materials: outlines, cases, vignettes, draft questions, rubrics, explanations at a chosen level, and alternative examples when students need a concept approached differently. It is weakest exactly where your judgment is the job: deciding what matters for your learners, judging clinical accuracy, and evaluating real student work fairly.

**Content and session preparation.** The [Preparing a Lecture playbook](../playbooks/lecture-prep.md) walks the full workflow. The pattern generalizes: feed the model your objectives and materials, ask for structure plus active-learning checks, then apply your expertise to what comes back. The accuracy of anything that reaches students is yours to confirm.

**Assessment writing.** AI drafts plausible multiple choice questions (MCQs) quickly, and the evidence so far says quality is usable but uneven, with structural flaws that standard item-writing rules catch. Two non-negotiables frame the workflow: every AI-drafted item gets faculty review for accuracy and blueprint fit before use, and secure assessment materials (live exam items, answer keys, secure banks) never go into public AI tools. The [exam questions playbook](../playbooks/exam-items.md) gives the step-by-step, and the prompt library's [item writer and flaw checker](../prompts/index.md) carry the studies behind this as further reading.

**Evaluating student work.** This is the highest-caution zone. Identifiable student work and grades are FERPA-protected records, so they do not go into public tools; de-identify first or do not use AI at all. And outputs from AI detectors and similarity flags are preliminary indicators, not verdicts; treat any flag as a starting point for human review, never as sufficient evidence on its own.

**Your course's AI rules.** Students will use these tools; ambiguity serves no one. The policy delegates labeling and attribution expectations to course and departmental guidelines, which means your syllabus is where the line gets drawn. The [syllabus AI statement playbook](../playbooks/syllabus-statement.md) offers adaptable templates from prohibited to encouraged-with-verification.

<figure class="figure">
<svg viewBox="0 0 660 225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Caution gradient across three teaching tasks: content preparation has strong leverage, assessment writing needs review and security, evaluating student work is the highest-caution zone">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the caution gradient</text>
<text x="24" y="61" text-anchor="start" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">content preparation</text>
<rect x="220" y="36" width="420" height="44" rx="6" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="430" y="54" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">strong leverage: outlines, cases, checks from your materials;</text>
<text x="430" y="68" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">the accuracy of what reaches students is yours to confirm</text>
<text x="24" y="126" text-anchor="start" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">assessment writing</text>
<rect x="220" y="101" width="420" height="44" rx="6" fill="none" stroke="#e65100" stroke-width="2"/>
<text x="430" y="119" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">usable but uneven drafts; faculty review every item, and</text>
<text x="430" y="133" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">finalized secure items never enter public tools</text>
<text x="24" y="191" text-anchor="start" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">evaluating student work</text>
<rect x="220" y="166" width="420" height="44" rx="6" fill="none" stroke="#c62828" stroke-width="2"/>
<text x="430" y="184" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">FERPA territory: de-identify or do not use AI at all;</text>
<text x="430" y="198" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">detector flags are indicators, never verdicts</text>
</svg>
<figcaption>The further down, the less the tool decides and the more you do.</figcaption>
</figure>

## Self-check

??? question "You want AI feedback on twelve student reflection essays. What has to happen first?"
    De-identification, at minimum: names, identifiers, and details that make an author traceable must come out, because identifiable student work is a protected education record and public tools are not approved for it. Even then, the feedback that reaches the student should be yours; the tool can help you draft, not judge.

??? question "An AI detector flags one student's essay at 92 percent. What does that number justify by itself?"
    A closer human look, and nothing more. Detector outputs are preliminary indicators with known false-positive problems. An academic integrity action needs human review of the actual evidence and an opportunity for the student to respond, not a percentage from a black box.

??? question "Why are AI-drafted exam items kept out of public AI tools after they are finalized for use?"
    Because a live exam item is secure assessment material: pasting it into a public tool risks exposing it (some tools learn from or store inputs), which compromises the assessment. Drafting with AI happens before items become secure; once they are finalized for use, they stay out of public tools.

**Next:** [Module 5: Research and Scholarship](research.md) or [Module 6: Clinical Contexts](clinical.md)
