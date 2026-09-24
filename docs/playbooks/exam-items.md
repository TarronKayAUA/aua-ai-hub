---
last_reviewed: 2026-09-01
---

# Playbook: Writing and Vetting Exam Questions

<span class="meta-chip">For faculty</span><span class="meta-chip">About 6 minutes</span> <span class="meta-note">Works with any capable assistant in the [tools directory](../tools/index.md)</span>

## The task

Use artificial intelligence (AI) to draft and structurally vet multiple choice questions (MCQs), cutting item-writing time while the calls that matter stay with you and your exam committee: clinical accuracy, blueprint fit, and what goes on a live exam.

## Where AI helps, and where it hurts

Models draft plausible vignette-based items quickly and are genuinely good at the mechanical vetting pass: catching cueing, non-homogeneous options, lead-ins that fail the cover-the-options test, and testwise shortcuts. The published comparisons (linked as further reading under the [MCQ prompts](../prompts/index.md#mcq-generation)) consistently find AI items usable but uneven, with flaws that standard item-review criteria catch. What models cannot do is judge clinical accuracy reliably, know your blueprint, or carry accountability for an exam. The workflow below keeps those with you.

## Gather first

- The learning objective each item must test, and the blueprint slot it fills.
- Target level (preclinical or clinical) and item format conventions your exam committee uses.
- Your item-writing standards (the library prompts encode the common National Board of Medical Examiners style rules: vignette-dependent, lead-in answerable cold, homogeneous options, no absolutes or cues).

## The workflow

1. **Draft.** Run the [Single best answer item writer](../prompts/index.md#mcq-generation) with one objective at a time. Generate two or three variants per objective; variety is cheap and your selection instinct is fast. For a team-based learning session, the [Team-based learning session builder](../prompts/index.md#team-based-learning-session-builder) drafts the readiness questions and application cases together, in AUA's format.
2. **Vet structurally.** Feed each candidate through the [Item flaw checker](../prompts/index.md#mcq-vetting). Have it report flaws before proposing any rewrite, so you see the diagnosis, not just a polished surface.
3. **Vet for content.** This step is entirely yours: clinical accuracy, currency of the underlying knowledge, blueprint fit, and difficulty for your cohort. The studies are blunt that this is where AI items fail when they fail.
4. **Pilot like any item.** AI-drafted items go through your normal exam review committee and post-exam item analysis. Flag their origin in your records so you can compare their performance statistics over time. The [post-exam item analysis reader](../prompts/index.md#post-exam-item-analysis-reader) helps read those statistics, working from the numbers alone.

## Good practice for this task

- Questions from a licensed question bank belong to their publisher, and their license usually limits reuse; the [AI Responsible Use Policy](../governance/policy.md#intellectual-property-rights-and-copyright-issues) requires a review before licensed third-party material goes into an AI tool.
- Build vignettes from invented details, or from a real case abstracted until no one could recognize it. A recognizable case can identify the patient to anyone who was on that rotation, and patient information stays out of public AI tools under the policy.
- If past exam performance shapes a new item, aggregate statistics (difficulty, how often each option was chosen) are all the drafting needs. Individual students' results are education records and stay out of public AI tools.

## Before you rely on it

- [ ] Every item independently verified for clinical accuracy against a current source.
- [ ] Structural vet passed, by the flaw checker and by your own read.
- [ ] Blueprint mapping confirmed; the item tests the objective, not adjacent trivia.
- [ ] Standard exam committee review and pilot analysis applied, with AI origin noted in records.

**Related:** [Module 4: Teaching and Assessment](../pathway/teaching-assessment.md) for the principles, and the item-vetting prompts in the [prompt library](../prompts/index.md).
