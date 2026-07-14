---
last_reviewed: 2026-07-13
---

# Module 1: How AI Works

**For everyone · about 10 minutes · CGEA competency domain: Understanding AI**

## What you will be able to do

- Explain, in one sentence each, what a large language model (LLM) is and how it produces text.
- Explain why these systems sometimes state false things confidently, and why that is a feature of how they work rather than an occasional glitch.
- State two practical consequences of training cutoffs and context windows for your own use.

## The core idea

A large language model is a system trained on enormous amounts of text to do one thing: predict the next small piece of text, over and over, until an answer takes shape. Everything impressive (fluent explanations, working code, a differential diagnosis discussion) and everything dangerous (confident fabrication, invented citations) follows from that single mechanism. The model is not consulting a database of facts. It is producing the most plausible continuation of the conversation, and most of the time the most plausible continuation is also true. When it is not, the output looks exactly as confident.

Read [How LLMs Work](../basics/how-llms-work.md) now; it is a ten-minute plain-language tour with diagrams of the prediction loop, the context window, how training works, and why hallucination happens. Then come back for the self-check.

Three consequences worth internalizing:

1. **Knowledge has a date.** Models learn from training data with a cutoff. Anything after that date is invisible to the model unless it can search the web or you paste the material in. For a fast-moving field, always ask: would the answer have changed recently?
2. **Memory has a size.** The context window is the model's working memory for your conversation. Very long conversations and documents can push earlier material out of focus. New conversation, fresh start.
3. **Fluency is not accuracy.** The polish of the prose carries no information about its truth. Verification is your job, every time, and the [AI Responsible Use Policy](../governance/policy.md) makes that responsibility explicit.

<figure class="figure">
<svg viewBox="0 0 660 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The three consequences: knowledge has a training cutoff date, working memory has a size limit, and fluent confident text is not evidence of accuracy">
<text x="330" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the three consequences worth internalizing</text>
<rect x="20" y="34" width="195" height="118" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="117" y="56" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">knowledge has a date</text>
<line x1="45" y1="78" x2="190" y2="78" stroke="var(--md-default-fg-color--light)" stroke-width="2"/>
<line x1="140" y1="70" x2="140" y2="86" stroke="#c62828" stroke-width="2.5"/>
<text x="92" y="100" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">training data</text>
<text x="165" y="100" text-anchor="middle" font-size="8.5" fill="#c62828">invisible</text>
<text x="117" y="124" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">after the cutoff: nothing,</text>
<text x="117" y="138" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">unless it searches or you paste it in</text>
<rect x="232" y="34" width="195" height="118" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="329" y="56" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">memory has a size</text>
<rect x="262" y="68" width="134" height="26" rx="4" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1.5"/>
<text x="329" y="85" text-anchor="middle" font-size="8.5" fill="var(--md-typeset-color)">the context window</text>
<text x="247" y="85" text-anchor="middle" font-size="9" fill="#c62828">...</text>
<text x="329" y="124" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">very long chats push earlier</text>
<text x="329" y="138" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">material out of focus</text>
<rect x="444" y="34" width="195" height="118" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="541" y="56" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">fluency is not accuracy</text>
<text x="541" y="82" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">"confident, polished, specific"</text>
<text x="541" y="100" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">tells you nothing about</text>
<text x="541" y="114" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">whether it is true</text>
<text x="541" y="138" text-anchor="middle" font-size="8.5" fill="#2e7d32">verification is your job, every time</text>
<text x="330" y="184" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">one mechanism, predicting plausible text, explains all three</text>
</svg>
<figcaption>Everything impressive and everything dangerous about these systems follows from the same mechanism.</figcaption>
</figure>

## Self-check

??? question "A colleague says their chatbot 'looked up' an answer in its database and so it must be right. What is wrong with that mental model?"
    The model did not look anything up (unless it explicitly ran a web search). It generated the most statistically plausible continuation of the conversation from patterns learned in training. Plausible usually overlaps with true, but nothing in the mechanism guarantees it, so the answer needs verification like any unsourced claim.

??? question "You ask a model about a drug approval from last month and it confidently describes an older approval instead. Why?"
    The approval likely postdates the model's training cutoff. The model cannot know events after its training data ends, and rather than say so it may produce the most plausible answer from what it does know. Asking the model to search the web, or pasting in the source, fixes this; trusting unaided recall for recent events does not.

??? question "When is the model's confident tone evidence that its answer is correct?"
    Never. Tone is a property of the text generation, not of the underlying accuracy. Treat confidence and correctness as fully independent until verified.

## Going deeper

- [How LLMs Work](../basics/how-llms-work.md): the same mechanics, one level down (already linked above; it rewards a second pass).
- [Common Misconceptions](../basics/misconceptions.md): calibrating trust by task.
- [Benchmarks](../benchmarks.md): how capability actually gets measured, updated nightly.

**Next:** [Module 2: Prompting Fundamentals](prompting.md)
