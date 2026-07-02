# Getting Better Answers

The model you use is fixed; what you control is everything around it. This page covers the three levers that decide answer quality in practice: what goes into the **context window** (and what you keep out of it), what persists across conversations as **memory**, and the standing **instructions** that govern how the model behaves. [How LLMs Work](how-llms-work.md), the primer on large language models (LLMs), explains what the context window is; this page is about using it well. No technical background needed.

## One window, two budgets

Everything the model can see lives in one working memory, the context window, measured in tokens (a token is roughly three quarters of a word). Everything counts against it: your messages, the files you attach (for very large files, some assistants quietly pull in excerpts rather than the whole document), the model's own replies, your standing instructions, and anything its memory feature has stored. Consumer assistants today offer windows from a few thousand tokens on some free tiers to a million or more, depending on the model and plan; check your plan's documentation rather than assuming.

The less obvious fact is that **output has its own, much smaller cap**. Generated text shares the window like everything else, but a single reply is also capped well below what the window can hold, and the exact cap varies by model and plan. Two practical consequences:

- **A long reply cannot rescue an overstuffed request.** If you paste three lectures and ask for a comprehensive study guide, the reply will be bounded by the output cap no matter how much you provided. Ask for the guide one section at a time instead: same total output, each piece complete.
- **Long replies degrade in two ways.** A reply that hits the hard cap cuts off abruptly, usually mid-sentence. A reply that merely runs long tends to compress and rush its final sections. Either way the recovery is the same: ask the model to continue, or to redo the last section alone.

For genuinely long deliverables, structure beats size: ask for an outline first, approve it, then request the sections one by one. Each request gets a full output budget and your review between sections steers the whole. Curate the input per section too: carry the approved outline forward, and attach only the source material that section needs, rather than dragging everything through every request.

## Context flooding: more input is not better

It is tempting to attach everything that might be relevant. Past a point this backfires, in three ways:

1. **Attention dilutes.** A question buried under two hundred pages competes with everything else for the model's attention. Models have also been shown to recall material at the **beginning and end** of a long context more reliably than material in the middle, an effect first documented in 2023 ([Liu et al.](https://arxiv.org/abs/2307.03172)); newer models have reduced it substantially, but long-context performance still degrades in subtler ways, so the placement advice stands. If one passage matters most, quote it directly next to your question rather than leaving the model to find it.
2. **Irrelevant material actively misleads.** The model treats everything in the window as potentially relevant. An attached document about a different topic does not just waste space; it invites the answer to drift toward it.
3. **Attachments are bigger than they look.** A slide deck or a journal article upload can consume tens of thousands of tokens. Three "for reference" attachments can eat more of the window than the entire conversation.

The habit that fixes all three: **curate, then place.** Attach only what the task needs, quote the key passage near the question, and state what you want the material used for ("using only the attached objectives, write..."). If your source material genuinely exceeds what fits, that is what grounding tools are for: [NotebookLM](../tools/index.md) and similar tools index your documents and pull in only relevant passages per question, rather than holding everything in the window at once.

## Long conversations drift; know when to start fresh

A conversation is one growing context. Late in a long chat, three things degrade: early instructions fade as thousands of tokens pile on top of them, your corrections coexist with the mistakes they corrected (both remain in the window, and the model can regress to the earlier version), and contradictory drafts accumulate. If the model starts repeating an error you already fixed, or reintroducing an approach you rejected, the conversation is the problem, not the request. Push far enough and you also hit the literal wall: a notice that the conversation has reached its maximum length. The same fix recovers both.

The fix costs thirty seconds: **summarize and carry.** Ask the model to write a short summary of the current state: what was decided, what the constraints are, where things stand. Paste that summary into a fresh conversation and continue. You keep the useful state and shed the clutter. As a rule of thumb, one task per conversation; when the topic changes, so should the chat.

## Memory: what persists between conversations

Most consumer assistants now offer a **memory feature**: facts and preferences carried across conversations ("teaches pharmacology," "prefers tables"). Three things to understand about it:

- **Memory is retrieval, not learning.** The model is not retrained on your chats; stored notes are quietly added to your context each conversation. That also means memory consumes window space and can mislead like any other context: a stale stored fact ("working on the cardiology exam") shapes answers long after it stops being true.
- **Review it periodically.** Every major assistant lets you review and delete stored memories in settings, and some let you edit them in place; prune anything stale or wrong the way you would clean up standing instructions. Some assistants also draw on your past conversations automatically, separately from the visible memory list; that too is a setting you can turn off.
- **The data rules apply to memory with extra force.** A fact stored in memory resurfaces in every future conversation. Never let an assistant memorize patient information or student records; the [AI Responsible Use Policy](../governance/policy.md)'s lines on protected health information and records covered by the Family Educational Rights and Privacy Act (FERPA) apply to what a tool stores, not just what you type. The practical mechanism: turn memory off, or use a temporary chat (every major assistant offers one, and it keeps the exchange out of stored history) whenever a conversation goes anywhere near those lines, and delete any stored entry that slips through.

## System instructions: set defaults once

Every assistant offers some form of standing instructions: custom instructions in settings, or per-workspace versions such as Projects in Claude and ChatGPT. Text placed there applies to every conversation and carries extra weight (a direct request in a message can still override it for that reply), which makes it the right home for things you would otherwise repeat: who you are and who your output is for ("I teach preclinical pharmacology; default to US medical education conventions"), format defaults ("no tables unless asked"), and verbosity preferences.

Two habits keep standing instructions useful. **Keep them short and stable**: a page of rules dilutes itself, and the model follows five clear standing instructions better than thirty. **Put role and defaults in the instructions, put the task in the message**: instructions describe how you always want the assistant to behave; the message describes what you want right now. The [prompt library](../prompts/index.md)'s longer prompts are designed for exactly this split, which is why their notes say to paste them into a Project's instructions rather than into the chat.

## The checklist

Before a task that matters, thirty seconds of setup:

1. **Nothing sensitive:** no patient information, no student records, and memory off or a temporary chat if the topic goes anywhere near them.
2. **Right container:** fresh conversation for a new task; standing instructions carry your defaults.
3. **Curated input:** only the material the task needs, key passage quoted next to the question.
4. **Stated use:** say what the material is for and what the output should look like.
5. **Sized output:** for anything long, outline first, then sections, one request each, with only that section's sources attached.
6. **Drift check:** the moment the model regresses to a corrected mistake, summarize and carry to a fresh chat.

None of this is model-specific, and all of it matters more as tasks get longer. Curious what context physically costs? The [hardware page](../tools/hardware.md) shows how conversation length consumes memory when you run models on your own machine. For prompt patterns to use inside the window, see the [Prompting Fundamentals module](../pathway/prompting.md) and the [prompt library](../prompts/index.md).
