---
last_reviewed: 2026-09-01
prompts:
  - lecture-outline-builder
---

# Preparing a Lecture

<span class="meta-chip">Step-by-step guide</span><span class="meta-chip">For faculty</span><span class="meta-chip">About 5 minutes</span>

**Have ready:** your learning objectives for the session, last year's slides or outline, and the session's length, audience, and format.
{: .have-ready }

**See it done:** [a worked example with real output](../examples/lecture-outline.md), from objectives to a checked outline.

## The workflow

1. **Start from the template.** Paste the [Lecture outline builder](../prompts/index.md#lecture-outline-builder) prompt into an artificial intelligence (AI) assistant: it takes duration, audience, topic, and objectives, and returns a timed outline with an active check per section. Your objectives are the single highest-value input; if they are rough, the [learning objective sharpener](../prompts/index.md#learning-objective-sharpener) tightens them first. Paste your materials after the prompt (last year's slides or outline, the assigned reading, the curriculum map context, and what the students were taught before this session): with them, the outline starts from what you actually teach rather than from a generic version of the topic.
2. **Interrogate the draft.** Ask what the outline omits that a [your specialty] educator would expect, where students typically get confused on this topic, and what could be cut first if time runs short. Treat the answers as prompts for your judgment, not verdicts.
3. **Deepen the checks.** For each section's active check, ask for one alternative format (single best answer question, think-pair-share prompt, quick poll) and pick what fits your room.
4. **Generate support materials.** Once the outline is yours, ask for the things that follow mechanically: a handout skeleton, draft slide bullets per section, or three vignette variants of your opener for reuse in small groups. For figures, [AI-Generated Images in Teaching](ai-images.md) covers where image generators go wrong on anatomy and what tends to work better.
5. **Verify content.** Check every factual claim, dose, criterion, and guideline reference that survives into your materials against a current authoritative source. Models confidently reproduce outdated clinical thresholds, and the threshold on a slide is the one students remember.

## Good practice for this task

- Your own teaching materials make the best inputs, since the outline should reflect your course; a licensed figure or a real case among them is worth a second look first. A colleague's materials are their work, so a word with them before you build on their slides is both a courtesy and a guard against copyright problems.
- Note AI-generated content on slides the way your department does: students notice whether faculty meet the standard they are asked to meet.
- If you design a session around last year's cohort performance, work from aggregate or de-identified results: a session plan needs the pattern rather than the names.

## Before you rely on it

- [ ] Every objective is actually served by a section, and nothing essential to the blueprint was silently dropped.
- [ ] Every factual and clinical claim checked against a current source.
- [ ] Checks and examples match your students' level, not a generic level.
- [ ] The plan fits the real duration with the cut-first list identified.

## About this task {: #the-task }

Turn a topic and a set of learning objectives into a session plan: a structure, timed sections, active-learning checks, and supporting materials, in a fraction of the usual drafting time.

### Where AI helps, and where it hurts

AI is strong at structure and variation: organizing content against objectives, generating clinical openers, drafting check questions, proposing analogies, and producing alternative explanations for a concept students struggle with. It is weak exactly where your expertise lives: knowing what this cohort needs, judging clinical accuracy and currency, and deciding what to cut. Use it to multiply your drafting while the judgment about content stays with you.

<figure class="figure figure--html hf">
<ol class="hf-steps">
<li class="hf-box hf-box--filled"><span class="hf-step-tag">You decide</span>Your objectives and materials</li>
<li class="hf-box"><span class="hf-step-tag">The model drafts</span>A timed outline with checks</li>
<li class="hf-box hf-box--filled"><span class="hf-step-tag">You decide</span>Judge, cut, refit for your cohort</li>
<li class="hf-box"><span class="hf-step-tag">The model drafts</span>Support materials on request</li>
<li class="hf-box hf-box--ok"><span class="hf-step-tag">You verify</span>Every surviving claim, against a current source</li>
</ol>
<figcaption>The ping-pong that works: you supply and judge, the model drafts and varies, and you check what survives before it reaches students.</figcaption>
</figure>

**Related:** [AI-Generated Images in Teaching](ai-images.md) for figures, and [Writing and Vetting Exam Questions](exam-items.md) for the items that follow the session.
