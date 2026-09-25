---
last_reviewed: 2026-09-01
---

# Getting Better Answers

<span class="meta-chip">For everyone</span><span class="meta-chip">About 12 minutes</span> <span class="meta-note">No technical background needed</span>

The model you use is fixed; what you control is everything around it. This page covers the three levers that decide the quality of an artificial intelligence (AI) assistant's answers in practice: what goes into the **context window** (and what you keep out of it), what persists across conversations as **memory**, and the standing **instructions** that govern how the model behaves. [How LLMs Work](how-llms-work.md), the primer on large language models (LLMs), explains what the context window is; this page is about using it well.

The short version is [the checklist](#the-checklist) at the end; the rest of the page explains why each item is there.

## One window, two budgets

Everything the model can see lives in one working memory, the context window, measured in tokens (a token is roughly three quarters of a word). Everything counts against it: your messages, the files you attach (for very large files, some assistants quietly pull in excerpts rather than the whole document), the model's own replies, your standing instructions, and anything its memory feature has stored. Consumer assistants today offer windows from a few thousand tokens on some free tiers to a million or more, depending on the model and plan; check your plan's documentation rather than assuming.

<figure class="figure figure--html hf">
<p class="hf-title">One window, and everything shares it</p>
<div class="hf-segbar">
<span style="flex-grow: 1">standing instructions</span>
<span style="flex-grow: 1">memory</span>
<span style="flex-grow: 4">attachments<small>often the biggest share</small></span>
<span style="flex-grow: 3">conversation<small>so far</small></span>
<span class="hf-seg--key" style="flex-grow: 1.4">the reply</span>
</div>
<p class="hf-note-right">The output cap: one reply is limited to its slice, no matter how large the window is.</p>
<p class="hf-note">The shares vary by task; the output cap does not.</p>
<figcaption>Everything competes for the same window, and the reply's slice stays small however large the window grows.</figcaption>
</figure>

The less obvious fact is that **output has its own, much smaller cap**. Generated text shares the window like everything else, but a single reply is also capped well below what the window can hold, and the exact cap varies by model and plan. Two practical consequences:

- **A long reply cannot rescue an overstuffed request.** If you paste three lectures and ask for a comprehensive study guide, the reply will be bounded by the output cap no matter how much you provided. Ask for the guide one section at a time instead: same total output, each piece complete.
- **Long replies degrade in two ways.** A reply that hits the hard cap cuts off abruptly, usually mid-sentence. A reply that merely runs long tends to compress and rush its final sections. Either way the recovery is the same: ask the model to continue, or to redo the last section alone.

For genuinely long deliverables, structure beats size: ask for an outline first, approve it, then request the sections one by one. Each request gets a full output budget and your review between sections steers the whole. Curate the input per section too: carry the approved outline forward, and attach only the source material that section needs, rather than dragging everything through every request.

## Context flooding: more input is not better

It is tempting to attach everything that might be relevant. Past a point this backfires, in three ways:

1. **Attention dilutes.** A question buried under two hundred pages competes with everything else for the model's attention. Models have also been shown to recall material at the **beginning and end** of a long context more reliably than material in the middle, an effect first documented in 2023 ([Liu et al.](https://arxiv.org/abs/2307.03172)); newer models have reduced it substantially, but long-context performance still degrades in subtler ways, so the placement advice stands. If one passage matters most, quote it directly next to your question rather than leaving the model to find it.
2. **Irrelevant material actively misleads.** The model treats everything in the window as potentially relevant. An attached document about a different topic does not just waste space; it invites the answer to drift toward it.
3. **Attachments are bigger than they look.** A slide deck or a journal article runs to several thousand tokens, and a long or image-heavy PDF can run far higher. Three "for reference" attachments can eat more of the window than the entire conversation.

<figure class="figure figure--html hf">
<p class="hf-title">What familiar material costs, in tokens</p>
<div class="hf-bars">
<p><span class="hf-bar-label">your question</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 0.33%"></span><span class="hf-bar-value">&asymp; 50 (the sliver everything else competes with)</span></span></p>
<p><span class="hf-bar-label">a page of prose</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 4.33%"></span><span class="hf-bar-value">&asymp; 650</span></span></p>
<p><span class="hf-bar-label">a 30-slide deck</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 26.67%"></span><span class="hf-bar-value">&asymp; 4,000</span></span></p>
<p><span class="hf-bar-label">a journal article</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 53.33%"></span><span class="hf-bar-value">&asymp; 8,000</span></span></p>
<p><span class="hf-bar-label">an hour of lecture, transcribed</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 80%"></span><span class="hf-bar-value">&asymp; 12,000</span></span></p>
</div>
<p class="hf-note">Approximate, at three quarters of a word per token; dense notes and long articles run higher.</p>
<figcaption>Three casual "for reference" attachments can outweigh your actual question hundreds of times over.</figcaption>
</figure>

The habit that fixes all three: **curate, then place.** Attach only what the task needs, quote the key passage near the question, and state what you want the material used for ("using only the attached objectives, write..."). If your source material genuinely exceeds what fits, that is what grounding tools are for: [Gemini Notebook](../tools/gemini-notebook.md) and similar tools index your documents and pull in only relevant passages per question, rather than holding everything in the window at once.

Curious what your own material costs? Paste it below. The count runs entirely in your browser, and the text is not sent anywhere.

<div class="tok-estimator" id="tok-estimator" markdown="0">
<label class="tok-label" for="tok-input">Paste text to estimate its token cost:</label>
<textarea id="tok-input" rows="5" placeholder="Paste a paragraph, an abstract, or an entire document..."></textarea>
<div class="tok-result" id="tok-result">Paste or type above to see the estimate.</div>
</div>

## Long conversations drift; know when to start fresh

A conversation is one growing context. Late in a long chat, three things degrade: early instructions fade as thousands of tokens pile on top of them, your corrections coexist with the mistakes they corrected (both remain in the window, and the model can regress to the earlier version), and contradictory drafts accumulate. If the model starts repeating an error you already fixed, or reintroducing an approach you rejected, the conversation is the problem, not the request. Push far enough and you also hit the literal wall: a notice that the conversation has reached its maximum length. The same fix recovers both.

The fix costs thirty seconds: **summarize and carry.** Ask the model to write a short summary of the current state: what was decided, what the constraints are, where things stand. Paste that summary into a fresh conversation and continue. You keep the useful state and shed the clutter. As a rule of thumb, one task per conversation; when the topic changes, so should the chat.

<figure class="figure figure--html hf">
<div class="hf-flow">
<div class="hf-box hf-box--plain">
<p class="hf-box-title">A long conversation</p>
<p class="hf-lines" aria-hidden="true"><span></span><span></span><span class="is-struck"></span><span></span><span class="is-struck"></span><span></span></p>
<p class="hf-box-foot">Decisions buried under drafts, old mistakes still in the window.</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p class="hf-box-title">A short summary</p>
<ul>
<li>what was decided</li>
<li>the constraints</li>
<li>where things stand</li>
</ul>
<p class="hf-box-foot">The model writes this for you, in one request.</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--plain">
<p class="hf-box-title">A fresh conversation</p>
<p class="hf-pill">The summary, pasted first</p>
<p class="hf-box-foot">Your next request, with a clean window.</p>
</div>
</div>
<figcaption>Summarize and carry: the useful state moves to a fresh window, the clutter stays behind.</figcaption>
</figure>

## Memory: what persists between conversations

Most consumer assistants now offer a **memory feature**: facts and preferences carried across conversations ("teaches pharmacology," "prefers tables"). Three things to understand about it:

- **Memory is retrieval, not learning.** The model is not retrained on your chats; stored notes are quietly added to your context each conversation. That also means memory consumes window space and can mislead like any other context: a stale stored fact ("working on the cardiology exam") shapes answers long after it stops being true.
- **Review it periodically.** Every major assistant lets you review and delete stored memories in settings, and some let you edit them in place; prune anything stale or wrong the way you would clean up standing instructions. Some assistants also draw on your past conversations automatically, separately from the visible memory list; that too is a setting you can turn off.
- **Memory carries details forward.** A fact stored in memory resurfaces in every future conversation. The [AI Responsible Use Policy](../governance/policy.md#responsible-use) keeps protected health information and student records covered by the Family Educational Rights and Privacy Act (FERPA) out of publicly available AI tools unless the AI Responsible Use Subcommittee has vetted and approved a tool for that data (section C.3 under Responsible Use), and memory is where a detail entered by mistake would linger. A practical habit: use a temporary chat, or turn memory off, for any conversation whose details you would not want carried into later ones, and delete any stored entry you did not mean to keep. A temporary chat keeps the exchange out of your saved history, though the vendor may still keep a copy for a limited period, so it does not change which data belongs in the tool.

## Standing instructions: set defaults once

Every assistant offers some form of standing instructions: custom instructions in settings, or per-workspace versions such as Projects in Claude and ChatGPT. Text placed there applies to every conversation and carries extra weight (a direct request in a message can still override it for that reply), which makes it the right home for things you would otherwise repeat: who you are and who your output is for ("I teach preclinical pharmacology; default to US medical education conventions"), format defaults ("no tables unless asked"), and verbosity preferences.

Two habits keep standing instructions useful. **Keep them short and stable**: a page of rules dilutes itself, and the model follows five clear standing instructions better than thirty. **Put role and defaults in the instructions, put the task in the message**: instructions describe how you always want the assistant to behave; the message describes what you want right now. The [prompt library](../prompts/index.md)'s longer prompts work best with this split: paste them into a Project's instructions rather than into the chat, as the question tutor's notes recommend; [Standing Setups](../tools/standing-setups.md) walks through building those containers.

## The checklist

Before a task that matters, thirty seconds of setup:

1. **Memory set on purpose:** a temporary chat, or memory off, for anything you would rather not see carried into later conversations.
2. **Right container:** fresh conversation for a new task; standing instructions carry your defaults.
3. **Curated input:** only the material the task needs, key passage quoted next to the question.
4. **Stated use:** say what the material is for and what the output should look like.
5. **Sized output:** for anything long, outline first, then sections, one request each, with only that section's sources attached.
6. **Drift check:** the moment the model regresses to a corrected mistake, summarize and carry to a fresh chat.

None of this is model-specific, and all of it matters more as tasks get longer. Curious what context physically costs? The [hardware page](../tools/hardware.md) shows how conversation length consumes memory when you run models on your own machine. For prompt patterns to use inside the window, see the [Prompting Fundamentals module](../pathway/prompting.md) and the [prompt library](../prompts/index.md).

The pathway's agent stage builds on these same three levers, pointed at agents: see [Choosing Your Interface](../tools/interfaces.md), [Standing Setups](../tools/standing-setups.md), and [Your First Agent Session](../tools/first-session.md).
