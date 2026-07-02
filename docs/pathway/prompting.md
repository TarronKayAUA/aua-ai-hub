# Module 2: Prompting Fundamentals

**For everyone · about 15 minutes · CGEA competency domains: Working with AI, Critical Appraisal of AI Outputs**

--8<-- "includes/prompt-maturity-note.md"

## What you will be able to do

- Structure a request so the model has what it needs: a role, your actual materials, the task, and the output shape you want.
- Iterate on a first draft answer instead of accepting or abandoning it.
- Apply a verification habit proportionate to the stakes of the task.

## The core idea

The quality of what you get is mostly determined by what you give. Modern assistants do not need magic words; they need what any capable new colleague would need: context, materials, a clear task, and an example of what good output looks like. Four habits cover most of it:

1. **Give it your materials.** The single biggest upgrade. Paste your learning objectives, your draft, your criteria, your data description. A model working from your actual material is grounded; a model working from a blank page is improvising.
2. **Say who it is and who you are.** "You are helping a medical educator review exam questions for structural flaws" beats an unframed request, because it tells the model which of its many registers to use.
3. **Specify the output.** Format, length, level, what to include and exclude. If you want options rather than one answer, say how many.
4. **Iterate.** The first response is a first draft. Ask for what is missing, point at what is wrong, push back. Models respond well to specific correction, and two rounds of iteration routinely beat one elaborate prompt.

And one meta-habit: **ask for reasoning you can check, not bare answers.** A response that shows its steps, cites its sources, or flags its own uncertainty gives you something to verify. The [prompt library](../prompts/index.md) is built around these habits; every template there shows them in action, and the [Learning to prompt](../prompts/index.md#learning-to-prompt) resources go deeper, from Anthropic's 24-minute Prompting 101 video to Google's beginner guide.

<figure class="figure">
<svg viewBox="0 0 660 195" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Anatomy of a strong request: role, materials, task, and output shape, plus an iteration loop with the reply">
<defs><marker id="pf-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">a strong request, anatomized</text>
<rect x="100" y="28" width="310" height="152" rx="10" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.2" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<rect x="114" y="40" width="282" height="30" rx="5" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.9"/>
<text x="255" y="59" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">role: who it is, who you are</text>
<rect x="114" y="76" width="282" height="30" rx="5" fill="var(--md-primary-fg-color)"/>
<text x="255" y="89" text-anchor="middle" font-size="9" fill="#ffffff">materials: objectives, drafts, criteria</text>
<text x="255" y="100" text-anchor="middle" font-size="9" fill="#ffffff">(the single biggest upgrade)</text>
<rect x="114" y="112" width="282" height="30" rx="5" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.9"/>
<text x="255" y="131" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">task: what you want done</text>
<rect x="114" y="148" width="282" height="30" rx="5" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.9"/>
<text x="255" y="167" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">output: format, length, level, how many</text>
<rect x="480" y="70" width="150" height="44" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="555" y="88" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">a first draft,</text>
<text x="555" y="102" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">not a verdict</text>
<line x1="412" y1="80" x2="478" y2="80" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#pf-ar)"/>
<path d="M 555 116 L 555 150 L 414 150" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#pf-ar)"/>
<text x="510" y="168" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">iterate: point at what is wrong, push back</text>
</svg>
<figcaption>Two rounds of targeted iteration routinely beat one elaborate prompt.</figcaption>
</figure>

Calibrate verification to stakes: a brainstorm needs a sniff test, a lecture slide needs a source check, and anything touching assessment, research, or patient care needs full verification at the original source, per the [AI Responsible Use Policy](../governance/policy.md).

## Self-check

??? question "You want help writing a quiz on a lecture you gave. What is the highest-impact thing to include in your request?"
    The lecture materials themselves: your objectives, slides or notes, and the level of your students. Asking for a quiz on the topic without your materials gets a generic quiz on what the model assumes the topic covers; supplying them gets a quiz on what you actually taught.

??? question "The model's first answer is 70 percent right but misses your main point. What is the better next move: rewrite your prompt from scratch in a new chat, or reply with a correction?"
    Usually reply with a specific correction; the model has your context and responds well to targeted feedback. Start fresh when the conversation has accumulated confusion or has drifted so far that the context is hurting more than helping.

??? question "What does 'ask for reasoning you can check' buy you that a bare answer does not?"
    A verification surface. Steps, sources, and stated assumptions can each be checked independently, so errors surface before you rely on them. A bare answer offers nothing to inspect except your trust.

**Next:** [Module 3: The Rules](rules.md)
