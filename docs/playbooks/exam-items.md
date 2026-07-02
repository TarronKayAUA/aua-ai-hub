# Playbook: Writing and Vetting Exam Questions

**For faculty · the highest-stakes playbook, read the guardrails first**

--8<-- "includes/prompt-maturity-note.md"

## The task

Use AI to draft and structurally vet multiple choice questions (MCQs), cutting item-writing time while keeping quality control and assessment security entirely human.

## Where AI helps, and where it hurts

Models draft plausible vignette-based items quickly and are genuinely good at the mechanical vetting pass: catching cueing, non-homogeneous options, lead-ins that fail the cover-the-options test, and testwise shortcuts. The published comparisons (linked as further reading under the [MCQ prompts](../prompts/index.md#mcq-generation)) consistently find AI items usable but uneven, with flaws that standard item-review criteria catch. What models cannot do is judge clinical accuracy reliably, know your blueprint, or carry accountability for an exam. The workflow below keeps those with you.

## Gather first

- The learning objective each item must test, and the blueprint slot it fills.
- Target level (preclinical or clinical) and item format conventions your committee uses.
- Your item-writing standards (the library prompts encode the common National Board of Medical Examiners style rules: vignette-dependent, lead-in answerable cold, homogeneous options, no absolutes or cues).

## The workflow

1. **Draft.** Run the [Single best answer item writer](../prompts/index.md#mcq-generation) with one objective at a time. Generate two or three variants per objective; variety is cheap and your selection instinct is fast.
2. **Vet structurally.** Feed each candidate through the [Item flaw checker](../prompts/index.md#mcq-vetting). Have it report flaws before proposing any rewrite, so you see the diagnosis, not just a polished surface.
3. **Vet for content.** This step is entirely yours: clinical accuracy, currency of the underlying knowledge, blueprint fit, and difficulty for your cohort. The studies are blunt that this is where AI items fail when they fail.
4. **Pilot like any item.** AI-drafted items earn no exemption from your normal review committee and post-exam item analysis. Flag their origin in your records so you can compare their performance statistics over time.

## Guardrails for this task

This is where assessment security and AI collide, so the lines are bright:

- **Drafting happens before items are secure.** Working with AI on new draft items is fine. Once an item is finalized for a live exam, it is secure assessment material and **never enters a public AI tool again**, not for revision, not for explanation drafting, not for difficulty estimation. Exposure of secure items to tools that may store or learn from inputs compromises the exam.
- The same applies to answer keys, secure item banks, and anything from a licensed question bank, which is additionally third-party intellectual property the license almost certainly prohibits uploading.
- Never include real patient details in vignettes; invent or fully abstract them.
- Item drafts derived from past exam performance data require that data to be de-identified first.
- Per the [AI Responsible Use Policy](../governance/policy.md), the final items are your responsibility and your committee's, regardless of what drafted them.

<figure class="figure">
<svg viewBox="0 0 660 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Timeline split by a bright line: AI may touch draft items, and never touches finalized secure items">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the bright line</text>
<rect x="20" y="28" width="295" height="130" rx="8" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.3" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="167" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">while drafting</text>
<text x="167" y="66" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">AI is fine here</text>
<text x="167" y="90" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">draft variants with AI</text>
<text x="167" y="108" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">structural flaw vetting</text>
<text x="167" y="126" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">your own content vet</text>
<rect x="345" y="28" width="295" height="130" rx="8" fill="none" stroke="#c62828" stroke-width="2"/>
<text x="492" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">once finalized for a live exam</text>
<text x="492" y="66" text-anchor="middle" font-size="9.5" fill="#c62828">never enters a public AI tool again</text>
<text x="492" y="90" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">no revision help</text>
<text x="492" y="108" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">no explanation drafting</text>
<text x="492" y="126" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">no difficulty estimation</text>
<line x1="330" y1="24" x2="330" y2="162" stroke="#c62828" stroke-width="3"/>
<text x="330" y="176" text-anchor="middle" font-size="9.5" fill="#c62828">finalized</text>
<text x="330" y="192" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">answer keys and licensed bank content live on the secure side from day one</text>
</svg>
<figcaption>Drafting with AI is fine; a finalized item is secure material, and secure material never touches a public tool.</figcaption>
</figure>

## Before you rely on it

- [ ] Every item independently verified for clinical accuracy against a current source.
- [ ] Structural vet passed, by the flaw checker and by your own read.
- [ ] Blueprint mapping confirmed; the item tests the objective, not adjacent trivia.
- [ ] Standard committee review and pilot analysis applied, with AI origin noted in records.
- [ ] No finalized secure item or key has touched a public tool.
