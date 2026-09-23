---
last_reviewed: 2026-09-01
---

# Playbook: Preparing a Lecture

<span class="meta-chip">For faculty</span><span class="meta-chip">About 5 minutes</span> <span class="meta-note">Works with any capable assistant in the [tools directory](../tools/index.md)</span>

## The task

Turn a topic and a set of learning objectives into a session plan: a structure, timed sections, active-learning checks, and supporting materials, in a fraction of the usual drafting time.

## Where AI helps, and where it hurts

Artificial intelligence (AI) is strong at structure and variation: organizing content against objectives, generating clinical openers, drafting check questions, proposing analogies, and producing alternative explanations for a concept students struggle with. It is weak exactly where your expertise lives: knowing what this cohort needs, judging clinical accuracy and currency, and deciding what to cut. Use it to multiply your drafting, never to outsource your judgment about content.

<figure class="figure figure--html hf">
<ol class="hf-steps">
<li class="hf-box hf-box--filled"><span class="hf-step-tag">You decide</span>Your objectives and materials</li>
<li class="hf-box"><span class="hf-step-tag">The model drafts</span>A timed outline with checks</li>
<li class="hf-box hf-box--filled"><span class="hf-step-tag">You decide</span>Judge, cut, refit for your cohort</li>
<li class="hf-box"><span class="hf-step-tag">The model drafts</span>Support materials on request</li>
<li class="hf-box hf-box--ok"><span class="hf-step-tag">Before anything ships</span>Every claim that survives gets checked against a current source</li>
</ol>
<figcaption>The ping-pong that works: you supply and judge, the model drafts and varies, and nothing ships unverified.</figcaption>
</figure>

## Gather first

- Your learning objectives for the session (the single highest-value input). If they are rough, the [learning objective sharpener](../prompts/index.md#learning-objective-sharpener) tightens them first.
- Existing materials: last year's slides or outline, the assigned reading, the curriculum map context.
- Constraints: duration, audience year, format, what the students were taught before this session.

--8<-- "includes/prompt-maturity-note.md"

## The workflow

1. **Start from the template.** The [Lecture outline builder](../prompts/index.md#content-generation) prompt in the library takes duration, audience, topic, and objectives, and returns a timed outline with an active check per section. Paste your materials after it; do not run it from a blank page.
2. **Interrogate the draft.** Ask what the outline omits that a [your specialty] educator would expect, where students typically get confused on this topic, and what could be cut first if time runs short. Treat the answers as prompts for your judgment, not verdicts.
3. **Deepen the checks.** For each section's active check, ask for one alternative format (single best answer question, think-pair-share prompt, quick poll) and pick what fits your room.
4. **Generate support materials.** Once the outline is yours, ask for the things that follow mechanically: a handout skeleton, draft slide bullets per section, or three vignette variants of your opener for reuse in small groups. For figures, read [AI-Generated Images in Teaching](ai-images.md) before generating one.
5. **Verify content.** Every factual claim, dose, criterion, and guideline reference that survives into your materials gets checked against a current authoritative source. Models confidently reproduce outdated clinical thresholds; currency checking is non-negotiable.

## Guardrails for this task

- Your own teaching materials are fine as inputs, and a colleague's need their permission first. Confidential institutional documents and research participant data stay out of public AI tools whoever supplies them, and a colleague's permission does not change that.
- If your slides will state that AI assisted their preparation, follow your department's attribution practice; the [policy](../governance/policy.md) delegates the standard to course and departmental guidelines.
- No identifiable student data belongs in this workflow; if you design a session around last year's cohort performance, de-identify the data first.

## Before you rely on it

- [ ] Every objective is actually served by a section, and nothing essential to the blueprint was silently dropped.
- [ ] Every factual and clinical claim checked against a current source.
- [ ] Checks and examples match your students' level, not a generic level.
- [ ] The plan fits the real duration with the cut-first list identified.

**Related:** [AI-Generated Images in Teaching](ai-images.md) for figures, and [Writing and Vetting Exam Questions](exam-items.md) for the items that follow the session.
