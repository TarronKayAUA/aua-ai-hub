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

Calibrate verification to stakes: a brainstorm needs a sniff test, a lecture slide needs a source check, and anything touching assessment, research, or patient care needs full verification at the original source, per the [AI Responsible Use Policy](../governance/policy.md).

## Self-check

??? question "You want help writing a quiz on a lecture you gave. What is the highest-impact thing to include in your request?"
    The lecture materials themselves: your objectives, slides or notes, and the level of your students. Asking for a quiz on the topic without your materials gets a generic quiz on what the model assumes the topic covers; supplying them gets a quiz on what you actually taught.

??? question "The model's first answer is 70 percent right but misses your main point. What is the better next move: rewrite your prompt from scratch in a new chat, or reply with a correction?"
    Usually reply with a specific correction; the model has your context and responds well to targeted feedback. Start fresh when the conversation has accumulated confusion or has drifted so far that the context is hurting more than helping.

??? question "What does 'ask for reasoning you can check' buy you that a bare answer does not?"
    A verification surface. Steps, sources, and stated assumptions can each be checked independently, so errors surface before you rely on them. A bare answer offers nothing to inspect except your trust.

**Next:** [Module 3: The Rules](rules.md)
