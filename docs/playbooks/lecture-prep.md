---
last_reviewed: 2026-07-02
---

# Playbook: Preparing a Lecture

**For faculty · works with any capable assistant in the [tools directory](../tools/index.md)**

--8<-- "includes/prompt-maturity-note.md"

## The task

Turn a topic and a set of learning objectives into a session plan: a structure, timed sections, active-learning checks, and supporting materials, in a fraction of the usual drafting time.

## Where AI helps, and where it hurts

AI is strong at structure and variation: organizing content against objectives, generating clinical openers, drafting check questions, proposing analogies, and producing alternative explanations for a concept students struggle with. It is weak exactly where your expertise lives: knowing what this cohort needs, judging clinical accuracy and currency, and deciding what to cut. Use it to multiply your drafting, never to outsource your judgment about content.

<figure class="figure">
<svg viewBox="0 0 660 245" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Swimlane diagram alternating between what the model drafts and what you decide, ending in source verification">
<defs><marker id="lp-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="28" y="22" text-anchor="start" font-size="10" font-weight="bold" fill="var(--md-default-fg-color--light)">the model drafts</text>
<rect x="20" y="30" width="620" height="60" rx="6" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.25"/>
<text x="28" y="102" text-anchor="start" font-size="10" font-weight="bold" fill="var(--md-default-fg-color--light)">you decide</text>
<rect x="20" y="110" width="620" height="60" rx="6" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.25"/>
<rect x="40" y="118" width="125" height="44" rx="6" fill="var(--md-primary-fg-color)"/>
<text x="102" y="136" text-anchor="middle" font-size="9.5" fill="#ffffff">your objectives</text>
<text x="102" y="150" text-anchor="middle" font-size="9.5" fill="#ffffff">and materials</text>
<rect x="190" y="38" width="125" height="44" rx="6" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="252" y="56" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">timed outline</text>
<text x="252" y="70" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">with checks</text>
<rect x="340" y="118" width="125" height="44" rx="6" fill="var(--md-primary-fg-color)"/>
<text x="402" y="136" text-anchor="middle" font-size="9.5" fill="#ffffff">judge, cut, refit</text>
<text x="402" y="150" text-anchor="middle" font-size="9.5" fill="#ffffff">for your cohort</text>
<rect x="490" y="38" width="125" height="44" rx="6" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="552" y="56" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">support materials</text>
<text x="552" y="70" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">on request</text>
<line x1="168" y1="130" x2="198" y2="86" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lp-ar)"/>
<line x1="318" y1="78" x2="348" y2="116" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lp-ar)"/>
<line x1="468" y1="130" x2="498" y2="86" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lp-ar)"/>
<line x1="552" y1="84" x2="552" y2="182" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lp-ar)"/>
<rect x="40" y="185" width="575" height="30" rx="6" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="327" y="204" text-anchor="middle" font-size="10.5" fill="var(--md-typeset-color)">every claim that survives gets checked against a current source</text>
</svg>
<figcaption>The ping-pong that works: you supply and judge, the model drafts and varies, and nothing ships unverified.</figcaption>
</figure>

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
