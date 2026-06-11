# Playbook: Preparing a Lecture

**For faculty · works with any capable assistant in the [tools directory](../tools/index.md)**

--8<-- "includes/prompt-maturity-note.md"

## The task

Turn a topic and a set of learning objectives into a session plan: a structure, timed sections, active-learning checks, and supporting materials, in a fraction of the usual drafting time.

## Where AI helps, and where it hurts

AI is strong at structure and variation: organizing content against objectives, generating clinical openers, drafting check questions, proposing analogies, and producing alternative explanations for a concept students struggle with. It is weak exactly where your expertise lives: knowing what this cohort needs, judging clinical accuracy and currency, and deciding what to cut. Use it to multiply your drafting, never to outsource your judgment about content.

## Gather first

- Your learning objectives for the session (the single highest-value input).
- Existing materials: last year's slides or outline, the assigned reading, the curriculum map context.
- Constraints: duration, audience year, format, what the students were taught before this session.

## The workflow

1. **Start from the template.** The [Lecture outline builder](../prompts/index.md#content-generation) prompt in the library takes duration, audience, topic, and objectives, and returns a timed outline with an active check per section. Paste your materials after it; do not run it from a blank page.
2. **Interrogate the draft.** Ask what the outline omits that a [your specialty] educator would expect, where students typically get confused on this topic, and what could be cut first if time runs short. Treat the answers as prompts for your judgment, not verdicts.
3. **Deepen the checks.** For each section's active check, ask for one alternative format (one-best-answer question, think-pair-share prompt, quick poll) and pick what fits your room.
4. **Generate support materials.** Once the outline is yours, ask for the things that follow mechanically: a handout skeleton, draft slide bullets per section, or three vignette variants of your opener for reuse in small groups.
5. **Verify content.** Every factual claim, dose, criterion, and guideline reference that survives into your materials gets checked against a current authoritative source. Models confidently reproduce outdated clinical thresholds; currency checking is non-negotiable.

## Guardrails for this task

- Unpublished institutional materials are fine to use as inputs only if they are yours to use; a colleague's unpublished materials need their permission first.
- If your slides will state that AI assisted their preparation, follow your department's attribution practice; the [policy](../governance/policy.md) delegates the standard to course and departmental guidelines.
- No student data belongs in this workflow; designing a session around last cohort's performance data means de-identifying it first.

## Before you rely on it

- [ ] Every objective is actually served by a section, and nothing essential to the blueprint was silently dropped.
- [ ] Every factual and clinical claim checked against a current source.
- [ ] Checks and examples match your students' level, not a generic level.
- [ ] The plan fits the real duration with the cut-first list identified.
