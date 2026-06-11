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

## Self-check

??? question "A colleague says their chatbot 'looked up' an answer in its database and so it must be right. What is wrong with that mental model?"
    The model did not look anything up (unless it explicitly ran a web search). It generated the most statistically plausible continuation of the conversation from patterns learned in training. Plausible usually overlaps with true, but nothing in the mechanism guarantees it, so the answer needs verification like any unsourced claim.

??? question "You ask a model about a drug approval from last month and it confidently describes an older approval instead. Why?"
    The approval likely postdates the model's training cutoff. The model cannot know events after its training data ends, and rather than say so it may produce the most plausible answer from what it does know. Asking the model to search the web, or pasting in the source, fixes this; trusting unaided recall for recent events does not.

??? question "When is the model's confident tone evidence that its answer is correct?"
    Never. Tone is a property of the text generation, not of the underlying accuracy. Treat confidence and correctness as fully independent until verified.

**Next:** [Module 2: Prompting Fundamentals](prompting.md)
