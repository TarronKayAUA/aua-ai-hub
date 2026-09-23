---
last_reviewed: 2026-09-01
---

# How LLMs Work

<span class="meta-chip">For everyone</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">No math, no code</span>

A plain-language primer for medical educators and students.

## What a large language model is

A large language model (LLM) is a computer program trained to predict text. Given some words, it predicts which words are likely to come next. That single ability, scaled up enormously, is what powers tools such as Claude, ChatGPT, and Gemini.

The "large" refers to two things: the amount of text the model learned from, and the size of the model itself. Modern LLMs are trained on a substantial portion of the public internet, plus books, articles, and code. The models themselves contain billions of internal settings, called parameters, that get adjusted during training. You can think of parameters as the dials the training process turns until the model becomes good at prediction.

## Training: how the model learns

Training happens before you ever type anything, and it has two main stages.

The first stage is pretraining. The model reads enormous amounts of text and, at each point, must guess the next word. Each time it guesses wrong, its parameters are nudged so it does slightly better next time. Repeat this trillions of times and the model develops a statistical sense of how language fits together. To predict text well, it ends up absorbing a great deal about the world the text describes: grammar, facts, reasoning patterns, clinical vocabulary, and also the errors and biases present in its training data.

The second stage shapes that raw predictor into a useful assistant. Companies fine-tune the model on examples of helpful question-and-answer conversations, and they apply a technique called reinforcement learning from human feedback (RLHF), where human reviewers rate model responses and the model is adjusted to produce more of what reviewers prefer. This is why a modern assistant answers your question instead of merely continuing your sentence, and why it usually declines harmful requests.

<figure class="figure figure--html hf">
<div class="hf-flow">
<div class="hf-box hf-box--plain">
<p class="hf-box-title">Pretraining</p>
<p>Predicts the next word across trillions of words of text.</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--plain">
<p class="hf-box-title">Fine-tuning + RLHF</p>
<p>Example conversations and human ratings shape behavior.</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--filled hf-box--pill">
<p class="hf-box-title">The assistant</p>
<p>you actually talk to</p>
</div>
</div>
<p class="hf-marker">Training data ends here, after pretraining: the knowledge cutoff.</p>
<figcaption>Training happens once, in stages, before you ever type anything.</figcaption>
</figure>

A key consequence: the model's knowledge is frozen at the point its training data was collected, known as its knowledge cutoff. Events after that date are simply not in the model, unless the tool you are using adds them through search or document retrieval.

## Inference: what happens when you ask a question

Using a trained model is called inference. When you send a message, the model does not look anything up in a database. It reads your text and generates a response one small chunk at a time. Each chunk is called a token, roughly three quarters of a word in English. The model predicts the next token, appends it, then predicts the one after that, until the response is complete.

<figure class="figure figure--html hf">
<div class="hf-flow">
<div class="hf-box hf-box--plain">
<p class="hf-box-title">The text so far</p>
<p>your prompt + reply in progress</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--filled">
<p class="hf-box-title">Model</p>
<p>predicts the next token</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--plain">
<p class="hf-box-title">One new token</p>
<p>about three quarters of a word</p>
</div>
</div>
<p class="hf-return">Appended to the text, then the loop repeats.</p>
<figcaption>A response is built one token at a time; nothing is looked up.</figcaption>
</figure>

Everything the model can see at once (your conversation so far plus any documents you pasted in) is called the context window. It is the model's working memory. It is large but finite, and when a conversation outgrows it, the earliest material falls out of view. That is why a long chat can seem to forget instructions you gave at the start, and why pasting in the relevant policy or article often improves answers: you are placing the facts directly into the model's working memory instead of relying on what it half-remembers from training.

<figure class="figure figure--html hf">
<p class="hf-title">The context window: everything the model can see</p>
<div class="hf-outside">
<p><span class="hf-chip hf-chip--faded">oldest messages</span><br>pushed out when the window is full</p>
<div class="hf-frame">
<div class="hf-chips">
<span class="hf-chip">instructions</span>
<span class="hf-chip">conversation so far</span>
<span class="hf-chip">documents you pasted in</span>
<span class="hf-chip hf-chip--filled">latest question</span>
</div>
</div>
</div>
<figcaption>Working memory is large but finite; what falls outside it is invisible to the model.</figcaption>
</figure>

Using that working memory well (what to put in it, what to keep out of it, and when to start a fresh conversation) is a skill of its own; [Getting Better Answers](better-answers.md) covers it.

There is also a setting called temperature that controls how predictable the output is. Low temperature makes the model pick the most likely next token nearly every time, which produces consistent but sometimes flat responses. Higher temperature allows more variety. This is one reason the same question can produce different answers on different tries.

<!-- render:next-token-demo -->

## Why models make things up

The failure mode everyone in medicine needs to understand is hallucination, sometimes called confabulation: the model states something false with complete fluency and confidence. A fabricated citation with a plausible journal name, real author names, and a fake page range is the classic example.

Hallucination is not a glitch. It follows directly from how the model works. The model produces text that is statistically plausible given its training. Most of the time, plausible and true coincide. But when the model lacks the specific fact you need, it does not return an error message. It produces the most plausible-sounding continuation anyway, because generating plausible text is the only thing it does. The model has no reliable signal it can surface that distinguishes remembering from inventing.

<figure class="figure figure--html hf">
<div class="hf-flow">
<div class="hf-box hf-box--plain">
<p class="hf-box-title">Your question</p>
<p>needs a specific fact</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--filled">
<p class="hf-box-title">Model</p>
<p>always writes plausible text</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-col">
<p class="hf-label">If the fact was learned</p>
<div class="hf-box hf-box--ok">
<p class="hf-box-title">Plausible and true</p>
<p>a correct, confident answer</p>
</div>
<p class="hf-label">If the fact is missing</p>
<div class="hf-box hf-box--stop">
<p class="hf-box-title">Plausible but invented</p>
<p>a hallucination, equally confident</p>
</div>
</div>
</div>
<p class="hf-note">Both read identically; only checking the source tells them apart.</p>
<figcaption>Hallucination is not a glitch; it is what plausible-text generation does when the fact is missing.</figcaption>
</figure>

Newer systems reduce this in two main ways. Retrieval-augmented generation (RAG) fetches relevant documents first and asks the model to answer from those documents, a practice called grounding. Reasoning models spend extra tokens working through a problem step by step before answering, which improves reliability on complex questions. Both help. Neither eliminates the problem. Verification of anything consequential remains your job, exactly as it would be with an unfamiliar colleague's confident claim.

## What this means in practice

A few rules of thumb follow directly from the mechanics described above.

**Strongest: transforming text you give them.** Summarizing an article, restructuring notes into a table, drafting questions from your lecture content, adjusting the reading level of patient instructions, or critiquing a draft. In these tasks the source material is in the context window, so the model leans less on its imperfect memory.

**Weakest: treated as a search engine or an oracle.** Asked for specific citations, exact dosages, current guidelines, or anything where the precise fact matters and is not supplied in the conversation. These are the situations where hallucination does real damage.

Treat outputs as a competent first draft from an assistant who has read widely but verifies nothing. Check claims against primary sources before they reach students or patients. Never paste protected health information (PHI) or student records covered by the Family Educational Rights and Privacy Act (FERPA) into consumer artificial intelligence (AI) tools; see the [tools directory](../tools/index.md) for the governance status of each tool at our institution.

Finally, remember that capability is moving quickly. Specific model names and features will change; the fundamentals on this page (prediction, training, context, and hallucination) change much more slowly and remain the right lens for judging each new tool.

## Where to go next

- Came here from [Module 1: How AI Works](../pathway/how-ai-works.md)? Go back there for the rest of the module and its self-check.
- The [Glossary](glossary.md) defines the terms used here, plus the rest of the vocabulary you will encounter.
- [Common Misconceptions](misconceptions.md) addresses frequent misunderstandings directly.
- [Courses and Resources](../learning/index.md) lists courses and videos if you want to go deeper.
