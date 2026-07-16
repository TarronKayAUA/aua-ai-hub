---
last_reviewed: 2026-07-02
---

# Common Misconceptions

<span class="meta-chip">For everyone</span><span class="meta-chip">About 5 minutes</span>

Frequent misunderstandings about artificial intelligence (AI) tools, and what is actually true. Each section is short and self-contained.

## :material-database-off: "It looks up answers in a database"

A large language model (LLM) does not retrieve stored answers. It generates text word by word based on patterns learned during training. Nothing is "looked up" unless the specific tool adds a search or retrieval step, and most chat tools tell you when they do. This is why a model can describe a journal article that does not exist: it is composing plausible text, not consulting a catalog.

## :material-account-voice: "If it sounds confident, it is probably correct"

Fluency and accuracy are unrelated in these systems. The model produces equally polished prose whether it is right or wrong, because confidence in the writing style carries no information about the underlying facts. Calibrate your trust to the type of task: transformation of material you supplied is usually reliable, while specific facts, numbers, and citations pulled from the model's memory need verification.

<figure class="figure">
<svg viewBox="0 0 660 195" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two-panel diagram: tasks grounded in material you supplied are usually reliable; facts pulled from the model's memory need source verification">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">calibrate trust by task, not by tone</text>
<rect x="20" y="30" width="300" height="125" rx="8" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.25" stroke="#2e7d32" stroke-width="2"/>
<text x="170" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">grounded in what you supplied</text>
<text x="170" y="76" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">summarizing your article</text>
<text x="170" y="94" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">restructuring your notes</text>
<text x="170" y="112" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">critiquing your draft</text>
<text x="170" y="138" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">usually reliable; still read it</text>
<rect x="340" y="30" width="300" height="125" rx="8" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.25" stroke="#c62828" stroke-width="2"/>
<text x="490" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">pulled from the model's memory</text>
<text x="490" y="76" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">specific facts and numbers</text>
<text x="490" y="94" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">dosages, criteria, thresholds</text>
<text x="490" y="112" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">citations and references</text>
<text x="490" y="138" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">verify at the source before use</text>
<text x="330" y="180" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">the prose reads identically in both cases; the writing style tells you nothing</text>
</svg>
<figcaption>Fluency is constant; reliability is not. Sort by where the content came from, not by how it sounds.</figcaption>
</figure>

## :material-keyboard-outline: "It is just fancy autocomplete, so it cannot do anything useful"

The mechanism really is next-word prediction, but the conclusion does not follow. Predicting text well across the breadth of human writing required these models to internalize grammar, facts, reasoning patterns, and style. The practical capabilities, summarizing, drafting, translating, critiquing, tutoring, are real and measurable. Dismissing the technology outright is as much an error as trusting it blindly.

## :material-sync-off: "The model learns from my conversations as we talk"

Within one conversation the model can use what you said earlier, but its underlying knowledge is not updated by chatting. Training is a separate, offline process. A correction you make today does not teach the model anything for tomorrow. Whether a vendor later uses your conversations as future training data is a separate privacy question governed by the vendor's data policy, which is one reason institutional review of tools matters.

## :material-magnify-close: "AI detectors can reliably catch AI-generated writing"

Current detection tools produce both false positives and false negatives at rates that make them unsafe as the sole basis for an academic integrity decision. They are particularly prone to flagging the writing of non-native English speakers. Assessment design that reduces the payoff of undisclosed AI use, plus clear policies about acceptable use, works better than detection after the fact.

## :material-trophy-outline: "Newer and bigger always means better for my task"

Model rankings change monthly, but a leaderboard measures general performance, not your use case. A smaller, cheaper, or local model may be entirely adequate for summarizing lecture notes, while no current model may be adequate for unsupervised clinical decisions. Evaluate against your actual task, and remember that workflow fit, privacy, and cost matter as much as raw capability.

## :material-stethoscope: "AI will replace physicians and educators"

The evidence so far supports a narrower claim: these tools shift how time is spent, automating drafting, summarization, and information triage, while judgment, accountability, examination skills, and the human relationship remain with people. The realistic near-term risk for professionals is not replacement; it is using the tools carelessly, or refusing to learn what they can and cannot do.

## :material-head-question-outline: "It understands me the way a person would"

A model has no beliefs, goals, or awareness of you. It maps your words to likely continuations. The conversational style invites us to attribute understanding and intent, and that attribution is precisely what makes confident errors persuasive. Keeping the mechanism in mind, prediction rather than comprehension, is the single most useful habit for working with these tools safely.

---

For the mechanics behind these points, see [How LLMs Work](how-llms-work.md). For unfamiliar terms, see the [Glossary](glossary.md).
