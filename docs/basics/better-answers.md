---
last_reviewed: 2026-07-02
---

# Getting Better Answers

The model you use is fixed; what you control is everything around it. This page covers the three levers that decide answer quality in practice: what goes into the **context window** (and what you keep out of it), what persists across conversations as **memory**, and the standing **instructions** that govern how the model behaves. [How LLMs Work](how-llms-work.md), the primer on large language models (LLMs), explains what the context window is; this page is about using it well. No technical background needed.

## One window, two budgets

Everything the model can see lives in one working memory, the context window, measured in tokens (a token is roughly three quarters of a word). Everything counts against it: your messages, the files you attach (for very large files, some assistants quietly pull in excerpts rather than the whole document), the model's own replies, your standing instructions, and anything its memory feature has stored. Consumer assistants today offer windows from a few thousand tokens on some free tiers to a million or more, depending on the model and plan; check your plan's documentation rather than assuming.

<figure class="figure">
<svg viewBox="0 0 660 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram of one context window shared by standing instructions, memory, attachments, the conversation, and the reply, with the reply capped to a small slice">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">one window, and everything shares it</text>
<rect x="20" y="30" width="620" height="60" rx="6" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2.5"/>
<rect x="22" y="32" width="48" height="56" fill="var(--md-default-fg-color--lightest)" opacity="0.55"/>
<rect x="72" y="32" width="40" height="56" fill="var(--md-default-fg-color--lightest)" opacity="0.55"/>
<rect x="114" y="32" width="248" height="56" fill="var(--md-default-fg-color--lightest)" opacity="0.9"/>
<rect x="364" y="32" width="188" height="56" fill="var(--md-default-fg-color--lightest)" opacity="0.55"/>
<rect x="554" y="32" width="84" height="56" fill="var(--md-primary-fg-color)"/>
<text x="238" y="56" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">attachments</text>
<text x="238" y="72" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">often the biggest share</text>
<text x="458" y="56" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">conversation</text>
<text x="458" y="72" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">so far</text>
<text x="596" y="64" text-anchor="middle" font-size="10.5" fill="#ffffff">the reply</text>
<line x1="46" y1="90" x2="46" y2="100" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="60" y="112" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">standing instructions</text>
<line x1="92" y1="90" x2="92" y2="118" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="92" y="130" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">memory</text>
<path d="M554,94 L554,100 L638,100 L638,94" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="640" y="114" text-anchor="end" font-size="10" fill="var(--md-typeset-color)">the output cap: one reply is limited to this slice,</text>
<text x="640" y="128" text-anchor="end" font-size="10" fill="var(--md-typeset-color)">no matter how large the window is</text>
<text x="330" y="156" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">the shares vary by task; the output cap does not</text>
</svg>
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
3. **Attachments are bigger than they look.** A slide deck or a journal article upload can consume tens of thousands of tokens. Three "for reference" attachments can eat more of the window than the entire conversation.

<figure class="figure">
<svg viewBox="0 0 660 235" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bar chart of approximate token costs: a question about 50, a page of prose about 650, a 30-slide deck about 4,000, a journal article about 8,000, an hour of lecture transcript about 12,000">
<text x="330" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">what familiar material costs, in tokens</text>
<text x="175" y="52" text-anchor="end" font-size="10.5" fill="var(--md-typeset-color)">your question</text>
<rect x="185" y="38" width="2.5" height="20" fill="var(--md-primary-fg-color)"/>
<text x="196" y="52" text-anchor="start" font-size="10" fill="var(--md-default-fg-color--light)">≈ 50 (the sliver everything else competes with)</text>
<text x="175" y="87" text-anchor="end" font-size="10.5" fill="var(--md-typeset-color)">a page of prose</text>
<rect x="185" y="73" width="22" height="20" fill="var(--md-primary-fg-color)"/>
<text x="215" y="87" text-anchor="start" font-size="10" fill="var(--md-default-fg-color--light)">≈ 650</text>
<text x="175" y="122" text-anchor="end" font-size="10.5" fill="var(--md-typeset-color)">a 30-slide deck</text>
<rect x="185" y="108" width="133" height="20" fill="var(--md-primary-fg-color)"/>
<text x="326" y="122" text-anchor="start" font-size="10" fill="var(--md-default-fg-color--light)">≈ 4,000</text>
<text x="175" y="157" text-anchor="end" font-size="10.5" fill="var(--md-typeset-color)">a journal article</text>
<rect x="185" y="143" width="267" height="20" fill="var(--md-primary-fg-color)"/>
<text x="460" y="157" text-anchor="start" font-size="10" fill="var(--md-default-fg-color--light)">≈ 8,000</text>
<text x="175" y="192" text-anchor="end" font-size="10.5" fill="var(--md-typeset-color)">an hour of lecture, transcribed</text>
<rect x="185" y="178" width="400" height="20" fill="var(--md-primary-fg-color)"/>
<text x="593" y="192" text-anchor="start" font-size="10" fill="var(--md-default-fg-color--light)">≈ 12,000</text>
<text x="330" y="222" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">approximate, at three quarters of a word per token; dense notes and long articles run higher</text>
</svg>
<figcaption>Three casual "for reference" attachments can outweigh your actual question hundreds of times over.</figcaption>
</figure>

The habit that fixes all three: **curate, then place.** Attach only what the task needs, quote the key passage near the question, and state what you want the material used for ("using only the attached objectives, write..."). If your source material genuinely exceeds what fits, that is what grounding tools are for: [NotebookLM](../tools/index.md) and similar tools index your documents and pull in only relevant passages per question, rather than holding everything in the window at once.

Curious what your own material costs? Paste it below. The count runs entirely in your browser, and the text is not sent anywhere.

<div class="tok-estimator" id="tok-estimator" markdown="0">
<label class="tok-label" for="tok-input">Paste text to estimate its token cost:</label>
<textarea id="tok-input" rows="5" placeholder="Paste a paragraph, an abstract, or an entire document..."></textarea>
<div class="tok-result" id="tok-result">Paste or type above to see the estimate.</div>
</div>

## Long conversations drift; know when to start fresh

A conversation is one growing context. Late in a long chat, three things degrade: early instructions fade as thousands of tokens pile on top of them, your corrections coexist with the mistakes they corrected (both remain in the window, and the model can regress to the earlier version), and contradictory drafts accumulate. If the model starts repeating an error you already fixed, or reintroducing an approach you rejected, the conversation is the problem, not the request. Push far enough and you also hit the literal wall: a notice that the conversation has reached its maximum length. The same fix recovers both.

The fix costs thirty seconds: **summarize and carry.** Ask the model to write a short summary of the current state: what was decided, what the constraints are, where things stand. Paste that summary into a fresh conversation and continue. You keep the useful state and shed the clutter. As a rule of thumb, one task per conversation; when the topic changes, so should the chat.

<figure class="figure">
<svg viewBox="0 0 660 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three-panel diagram: a long cluttered conversation is condensed into a short summary, which is pasted into a fresh conversation">
<defs><marker id="ba-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="107" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">a long conversation</text>
<rect x="15" y="30" width="185" height="115" rx="8" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.35" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<rect x="27" y="42" width="140" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.5"/>
<rect x="27" y="56" width="155" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.5"/>
<rect x="27" y="70" width="120" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.5"/>
<line x1="25" y1="73.5" x2="149" y2="73.5" stroke="#c62828" stroke-width="1.5" opacity="0.75"/>
<rect x="27" y="84" width="150" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.5"/>
<rect x="27" y="98" width="130" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.5"/>
<line x1="25" y1="101.5" x2="159" y2="101.5" stroke="#c62828" stroke-width="1.5" opacity="0.75"/>
<rect x="27" y="112" width="155" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.5"/>
<rect x="27" y="126" width="100" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.85"/>
<text x="107" y="163" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">decisions buried under drafts,</text>
<text x="107" y="176" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">old mistakes still in the window</text>
<line x1="205" y1="88" x2="243" y2="88" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ba-ar)"/>
<text x="330" y="40" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">a short summary</text>
<rect x="250" y="48" width="160" height="85" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="330" y="72" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">what was decided</text>
<text x="330" y="90" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">the constraints</text>
<text x="330" y="108" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">where things stand</text>
<text x="330" y="163" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">the model writes this for you,</text>
<text x="330" y="176" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">in one request</text>
<line x1="414" y1="88" x2="448" y2="88" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ba-ar)"/>
<text x="550" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">a fresh conversation</text>
<rect x="455" y="30" width="190" height="115" rx="8" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.35" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<rect x="467" y="42" width="166" height="30" rx="5" fill="var(--md-primary-fg-color)"/>
<text x="550" y="61" text-anchor="middle" font-size="9.5" fill="#ffffff">the summary, pasted first</text>
<rect x="467" y="84" width="120" height="7" rx="3" fill="var(--md-default-fg-color--light)" opacity="0.85"/>
<text x="550" y="110" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">your next request,</text>
<text x="550" y="123" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">with a clean window</text>
</svg>
<figcaption>Summarize and carry: the useful state moves to a fresh window, the clutter stays behind.</figcaption>
</figure>

## Memory: what persists between conversations

Most consumer assistants now offer a **memory feature**: facts and preferences carried across conversations ("teaches pharmacology," "prefers tables"). Three things to understand about it:

- **Memory is retrieval, not learning.** The model is not retrained on your chats; stored notes are quietly added to your context each conversation. That also means memory consumes window space and can mislead like any other context: a stale stored fact ("working on the cardiology exam") shapes answers long after it stops being true.
- **Review it periodically.** Every major assistant lets you review and delete stored memories in settings, and some let you edit them in place; prune anything stale or wrong the way you would clean up standing instructions. Some assistants also draw on your past conversations automatically, separately from the visible memory list; that too is a setting you can turn off.
- **The data rules apply to memory with extra force.** A fact stored in memory resurfaces in every future conversation. Never let an assistant memorize patient information or student records; the [AI Responsible Use Policy](../governance/policy.md)'s lines on protected health information and records covered by the Family Educational Rights and Privacy Act (FERPA) apply to what a tool stores, not just what you type. The practical mechanism: turn memory off, or use a temporary chat (every major assistant offers one, and it keeps the exchange out of stored history) whenever a conversation goes anywhere near those lines, and delete any stored entry that slips through.

## System instructions: set defaults once

Every assistant offers some form of standing instructions: custom instructions in settings, or per-workspace versions such as Projects in Claude and ChatGPT. Text placed there applies to every conversation and carries extra weight (a direct request in a message can still override it for that reply), which makes it the right home for things you would otherwise repeat: who you are and who your output is for ("I teach preclinical pharmacology; default to US medical education conventions"), format defaults ("no tables unless asked"), and verbosity preferences.

Two habits keep standing instructions useful. **Keep them short and stable**: a page of rules dilutes itself, and the model follows five clear standing instructions better than thirty. **Put role and defaults in the instructions, put the task in the message**: instructions describe how you always want the assistant to behave; the message describes what you want right now. The [prompt library](../prompts/index.md)'s longer prompts are designed for exactly this split, which is why their notes say to paste them into a Project's instructions rather than into the chat; [Standing Setups](../tools/standing-setups.md) walks through building those containers.

## The checklist

Before a task that matters, thirty seconds of setup:

1. **Nothing sensitive:** no patient information, no student records, and memory off or a temporary chat if the topic goes anywhere near them.
2. **Right container:** fresh conversation for a new task; standing instructions carry your defaults.
3. **Curated input:** only the material the task needs, key passage quoted next to the question.
4. **Stated use:** say what the material is for and what the output should look like.
5. **Sized output:** for anything long, outline first, then sections, one request each, with only that section's sources attached.
6. **Drift check:** the moment the model regresses to a corrected mistake, summarize and carry to a fresh chat.

None of this is model-specific, and all of it matters more as tasks get longer. Curious what context physically costs? The [hardware page](../tools/hardware.md) shows how conversation length consumes memory when you run models on your own machine. For prompt patterns to use inside the window, see the [Prompting Fundamentals module](../pathway/prompting.md) and the [prompt library](../prompts/index.md).

This page is also the first step of the pathway's operator stage: the same three levers, pointed at agents, are what [Choosing Your Interface](../tools/interfaces.md), [Standing Setups](../tools/standing-setups.md), and [Your First Agent Session](../tools/first-session.md) build on.
