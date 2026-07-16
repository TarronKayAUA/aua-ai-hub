---
last_reviewed: 2026-07-02
---

# How LLMs Work

<span class="meta-chip">For everyone</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">No math, no code</span>

A plain-language primer for medical educators and students.

## What a large language model is

A large language model (LLM) is a computer program trained to predict text. Given some words, it predicts which words are likely to come next. That single ability, scaled up enormously, is what powers tools such as Claude, ChatGPT, and Gemini.

The "large" refers to two things: the amount of text the model learned from, and the size of the model itself. Modern LLMs are trained on a substantial portion of the public internet, plus books, articles, and code. The models themselves contain billions of internal settings, called parameters, that get adjusted during training. You can think of parameters as the dials the training process turns until the model becomes good at prediction.

## Training: how the model learns

Training happens before you ever type anything, and it has two main stages.

The first stage is pretraining. The model is shown enormous amounts of text with words hidden, and it must guess them. Each time it guesses wrong, its parameters are nudged so it does slightly better next time. Repeat this trillions of times and the model develops a statistical sense of how language fits together. To predict text well, it ends up absorbing a great deal about the world the text describes: grammar, facts, reasoning patterns, clinical vocabulary, and also the errors and biases present in its training data.

The second stage shapes that raw predictor into a useful assistant. Companies fine-tune the model on examples of helpful question-and-answer conversations, and they apply a technique called reinforcement learning from human feedback (RLHF), where human reviewers rate model responses and the model is adjusted to produce more of what reviewers prefer. This is why a modern assistant answers your question instead of merely continuing your sentence, and why it usually declines harmful requests.

<figure class="figure">
<svg viewBox="0 0 660 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram of the three training stages leading to an assistant">
<defs><marker id="ar1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<rect x="10" y="40" width="180" height="70" rx="8" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="100" y="68" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--md-typeset-color)">Pretraining</text>
<text x="100" y="88" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">predicts the next word across</text>
<text x="100" y="102" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">trillions of words of text</text>
<line x1="190" y1="75" x2="230" y2="75" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar1)"/>
<rect x="235" y="40" width="180" height="70" rx="8" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="325" y="68" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--md-typeset-color)">Fine-tuning + RLHF</text>
<text x="325" y="88" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">example conversations and</text>
<text x="325" y="102" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">human ratings shape behavior</text>
<line x1="415" y1="75" x2="455" y2="75" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar1)"/>
<rect x="460" y="40" width="190" height="70" rx="35" fill="var(--md-primary-fg-color)"/>
<text x="555" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">The assistant</text>
<text x="555" y="90" text-anchor="middle" font-size="11" fill="#ffffff">you actually talk to</text>
<line x1="100" y1="118" x2="100" y2="140" stroke="var(--md-default-fg-color--light)" stroke-dasharray="4 3"/>
<text x="108" y="158" text-anchor="start" font-size="11" fill="var(--md-default-fg-color--light)">training data ends here: the knowledge cutoff</text>
</svg>
<figcaption>Training happens once, in stages, before you ever type anything.</figcaption>
</figure>

A key consequence: the model's knowledge is frozen at the point its training data was collected, known as its knowledge cutoff. Events after that date are simply not in the model, unless the tool you are using adds them through search or document retrieval.

## Inference: what happens when you ask a question

Using a trained model is called inference. When you send a message, the model does not look anything up in a database. It reads your text and generates a response one small chunk at a time. Each chunk is called a token, roughly three quarters of a word in English. The model predicts the next token, appends it, then predicts the one after that, until the response is complete.

<figure class="figure">
<svg viewBox="0 0 660 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram of the next-token prediction loop">
<defs><marker id="ar2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<rect x="10" y="55" width="210" height="60" rx="8" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="115" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--md-typeset-color)">The text so far</text>
<text x="115" y="100" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">your prompt + reply in progress</text>
<line x1="220" y1="85" x2="258" y2="85" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar2)"/>
<rect x="262" y="50" width="170" height="70" rx="10" fill="var(--md-primary-fg-color)"/>
<text x="347" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">Model</text>
<text x="347" y="100" text-anchor="middle" font-size="11" fill="#ffffff">predicts the next token</text>
<line x1="432" y1="85" x2="470" y2="85" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar2)"/>
<rect x="474" y="55" width="170" height="60" rx="8" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="559" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--md-typeset-color)">One new token</text>
<text x="559" y="100" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">about three quarters of a word</text>
<path d="M 559 115 L 559 160 L 115 160 L 115 120" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#ar2)"/>
<text x="337" y="152" text-anchor="middle" font-size="11" fill="var(--md-default-fg-color--light)">appended to the text, then the loop repeats</text>
</svg>
<figcaption>A response is built one token at a time; nothing is looked up.</figcaption>
</figure>

Everything the model can see at once, your conversation so far plus any documents you pasted in, is called the context window. It is the model's working memory. It is large but finite, and when a conversation outgrows it, the earliest material falls out of view. That is why a long chat can seem to forget instructions you gave at the start, and why pasting in the relevant policy or article often improves answers: you are placing the facts directly into the model's working memory instead of relying on what it half-remembers from training.

<figure class="figure">
<svg viewBox="0 0 660 175" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram of the context window as working memory">
<rect x="120" y="35" width="520" height="80" rx="10" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2.5"/>
<text x="380" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the context window: everything the model can see</text>
<rect x="20" y="50" width="85" height="50" rx="6" fill="var(--md-default-fg-color--lightest)" opacity="0.45"/>
<text x="62" y="73" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)" opacity="0.8">oldest</text>
<text x="62" y="87" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)" opacity="0.8">messages</text>
<rect x="135" y="50" width="110" height="50" rx="6" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="190" y="79" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">instructions</text>
<rect x="255" y="50" width="130" height="50" rx="6" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="320" y="73" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">conversation</text>
<text x="320" y="87" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">so far</text>
<rect x="395" y="50" width="130" height="50" rx="6" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="460" y="73" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">documents</text>
<text x="460" y="87" text-anchor="middle" font-size="11" fill="var(--md-typeset-color)">you pasted in</text>
<rect x="535" y="50" width="95" height="50" rx="6" fill="var(--md-primary-fg-color)"/>
<text x="582" y="73" text-anchor="middle" font-size="11" fill="#ffffff">latest</text>
<text x="582" y="87" text-anchor="middle" font-size="11" fill="#ffffff">question</text>
<text x="62" y="135" text-anchor="middle" font-size="10.5" fill="var(--md-default-fg-color--light)">pushed out when</text>
<text x="62" y="149" text-anchor="middle" font-size="10.5" fill="var(--md-default-fg-color--light)">the window is full</text>
</svg>
<figcaption>Working memory is large but finite; what falls outside it is invisible to the model.</figcaption>
</figure>

Using that working memory well, what to put in it, what to keep out of it, and when to start a fresh conversation, is a skill of its own; [Getting Better Answers](better-answers.md) covers it.

There is also a setting called temperature that controls how predictable the output is. Low temperature makes the model pick the most likely next token nearly every time, which produces consistent but sometimes flat responses. Higher temperature allows more variety. This is one reason the same question can produce different answers on different tries.

## Why models make things up

The failure mode everyone in medicine needs to understand is hallucination, sometimes called confabulation: the model states something false with complete fluency and confidence. A fabricated citation with a plausible journal name, real author names, and a fake page range is the classic example.

Hallucination is not a glitch. It follows directly from how the model works. The model produces text that is statistically plausible given its training. Most of the time, plausible and true coincide. But when the model lacks the specific fact you need, it does not return an error message. It produces the most plausible-sounding continuation anyway, because generating plausible text is the only thing it does. The model has no reliable signal it can surface that distinguishes remembering from inventing.

<figure class="figure">
<svg viewBox="0 0 660 215" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram of why hallucination happens">
<defs><marker id="ar3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<rect x="10" y="75" width="150" height="55" rx="8" fill="var(--md-default-fg-color--lightest)" stroke="var(--md-primary-fg-color)"/>
<text x="85" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">Your question</text>
<text x="85" y="116" text-anchor="middle" font-size="10.5" fill="var(--md-typeset-color)">needs a specific fact</text>
<line x1="160" y1="102" x2="198" y2="102" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar3)"/>
<rect x="202" y="70" width="160" height="65" rx="10" fill="var(--md-primary-fg-color)"/>
<text x="282" y="96" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">Model</text>
<text x="282" y="114" text-anchor="middle" font-size="10.5" fill="#ffffff">always writes plausible text</text>
<line x1="362" y1="88" x2="408" y2="55" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar3)"/>
<line x1="362" y1="116" x2="408" y2="150" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar3)"/>
<text x="385" y="42" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)">fact was learned</text>
<text x="385" y="178" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)">fact is missing</text>
<rect x="415" y="28" width="235" height="52" rx="8" fill="var(--md-default-fg-color--lightest)" stroke="#2e7d32" stroke-width="2"/>
<text x="532" y="50" text-anchor="middle" font-size="11.5" font-weight="bold" fill="var(--md-typeset-color)">plausible and true</text>
<text x="532" y="68" text-anchor="middle" font-size="10.5" fill="var(--md-typeset-color)">a correct, confident answer</text>
<rect x="415" y="125" width="235" height="52" rx="8" fill="var(--md-default-fg-color--lightest)" stroke="#c62828" stroke-width="2"/>
<text x="532" y="147" text-anchor="middle" font-size="11.5" font-weight="bold" fill="var(--md-typeset-color)">plausible but invented</text>
<text x="532" y="165" text-anchor="middle" font-size="10.5" fill="var(--md-typeset-color)">a hallucination, equally confident</text>
<text x="650" y="203" text-anchor="end" font-size="10.5" font-style="italic" fill="var(--md-default-fg-color--light)">both read identically; only checking the source tells them apart</text>
</svg>
<figcaption>Hallucination is not a glitch; it is what plausible-text generation does when the fact is missing.</figcaption>
</figure>

Newer systems reduce this in two main ways. Retrieval-augmented generation (RAG) fetches relevant documents first and asks the model to answer from those documents, a practice called grounding. Reasoning models spend extra tokens working through a problem step by step before answering, which improves reliability on complex questions. Both help. Neither eliminates the problem. Verification of anything consequential remains your job, exactly as it would be with an unfamiliar colleague's confident claim.

## What this means in practice

A few rules of thumb follow directly from the mechanics described above.

**Strongest: transforming text you give them.** Summarizing an article, restructuring notes into a table, drafting questions from your lecture content, adjusting the reading level of patient instructions, or critiquing a draft. In these tasks the source material is in the context window, so the model leans less on its imperfect memory.

**Weakest: treated as a search engine or an oracle.** Asked for specific citations, exact dosages, current guidelines, or anything where the precise fact matters and is not supplied in the conversation. These are the situations where hallucination does real damage.

Treat outputs as a competent first draft from an assistant who has read widely but verifies nothing. Check claims against primary sources before they reach students or patients. Never paste protected health information (PHI) or student records covered by the Family Educational Rights and Privacy Act (FERPA) into consumer AI tools; see the [tools directory](../tools/index.md) for the governance status of each tool at our institution.

Finally, remember that capability is moving quickly. Specific model names and features will change; the fundamentals on this page, prediction, training, context, and hallucination, change much more slowly and remain the right lens for judging each new tool.

## Where to go next

- The [Glossary](glossary.md) defines the terms used here, plus the rest of the vocabulary you will encounter.
- [Common Misconceptions](misconceptions.md) addresses frequent misunderstandings directly.
- The [Learning page](../learning/index.md) lists courses and videos if you want to go deeper.
