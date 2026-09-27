---
last_reviewed: 2026-09-01
prompts:
  - single-best-answer-item-writer
  - item-flaw-checker
---

# Writing and Vetting Exam Questions

<span class="meta-chip">Step-by-Step Guide</span><span class="meta-chip">Faculty</span><span class="meta-chip">About 6 minutes</span>

**Have ready:** the learning objective each item must test and the blueprint slot it fills, the target level (preclinical or clinical), and your exam committee's item format conventions.
{: .have-ready }

## The Workflow

1. **Draft.** Run the [Single Best Answer Item Writer](../prompts/index.md#single-best-answer-item-writer) in an artificial intelligence (AI) assistant with one objective at a time. Generate two or three variants per objective; variety is cheap and your selection instinct is fast. Bring your own item-writing standards: the library prompts encode the common National Board of Medical Examiners style rules (vignette-dependent, lead-in answerable cold, homogeneous options, no absolutes or cues). For a team-based learning session, the [Team-Based Learning Session Builder](../prompts/index.md#team-based-learning-session-builder) drafts the readiness questions and application cases together, in AUA's format.
2. **Vet structurally.** Feed each candidate through the [Item Flaw Checker](../prompts/index.md#item-flaw-checker). Have it report flaws before proposing any rewrite, so you see the diagnosis, not just a polished surface.
3. **Vet for content.** This step is entirely yours: clinical accuracy, currency of the underlying knowledge, blueprint fit, and difficulty for your cohort. The studies are blunt that this is where AI items fail when they fail.
4. **Pilot like any item.** AI-drafted items go through your normal exam review committee and post-exam item analysis. Flag their origin in your records so you can compare their performance statistics over time. The [Post-exam Item Analysis Reader](../prompts/index.md#post-exam-item-analysis-reader) helps read those statistics, working from the numbers alone.

## Good Practice for This Task

- Questions from a licensed question bank belong to their publisher, and their license usually limits reuse, so new items written from your own learning objectives are the better route, and they test what you taught.
- Build vignettes from invented details, or from a real case abstracted until no one could recognize it. A recognizable case can identify the patient to anyone who was on that rotation.
- If past exam performance shapes a new item, aggregate statistics (difficulty, how often each option was chosen) are all the drafting needs.

## Before You Rely on It

- [ ] Every item independently verified for clinical accuracy against a current source.
- [ ] Structural vet passed, by the flaw checker and by your own read.
- [ ] Blueprint mapping confirmed; the item tests the objective, not adjacent trivia.
- [ ] Standard exam committee review and pilot analysis applied, with AI origin noted in records.

## About This Task {: #the-task }

Use AI to draft and structurally vet multiple choice questions (MCQs), cutting item-writing time while the calls that matter stay with you and your exam committee: clinical accuracy, blueprint fit, and what goes on a live exam.

### Where AI Helps, and Where It Hurts

Models draft plausible vignette-based items quickly and are genuinely good at the mechanical vetting pass: catching cueing, non-homogeneous options, lead-ins that fail the cover-the-options test, and testwise shortcuts. The published comparisons (linked as further reading under the [MCQ prompts](../prompts/index.md#mcq-generation)) consistently find AI items usable but uneven, with flaws that standard item-review criteria catch. What models cannot do is judge clinical accuracy reliably, know your blueprint, or carry accountability for an exam. The workflow above keeps those with you.

**Related:** [Module 4: Teaching and Assessment](../pathway/teaching-assessment.md) for the principles, and the item-vetting prompts in the [prompt library](../prompts/index.md).
