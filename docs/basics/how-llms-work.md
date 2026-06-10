# How LLMs Work

A plain-language primer for medical educators and students. No math, no code, about a ten-minute read.

## What a large language model is

A large language model (LLM) is a computer program trained to predict text. Given some words, it predicts which words are likely to come next. That single ability, scaled up enormously, is what powers tools such as Claude, ChatGPT, and Gemini.

The "large" refers to two things: the amount of text the model learned from, and the size of the model itself. Modern LLMs are trained on a substantial portion of the public internet, plus books, articles, and code. The models themselves contain billions of internal settings, called parameters, that get adjusted during training. You can think of parameters as the dials the training process turns until the model becomes good at prediction.

## Training: how the model learns

Training happens before you ever type anything, and it has two main stages.

The first stage is pretraining. The model is shown enormous amounts of text with words hidden, and it must guess them. Each time it guesses wrong, its parameters are nudged so it does slightly better next time. Repeat this trillions of times and the model develops a statistical sense of how language fits together. To predict text well, it ends up absorbing a great deal about the world the text describes: grammar, facts, reasoning patterns, clinical vocabulary, and also the errors and biases present in its training data.

The second stage shapes that raw predictor into a useful assistant. Companies fine-tune the model on examples of helpful question-and-answer conversations, and they apply a technique called reinforcement learning from human feedback (RLHF), where human reviewers rate model responses and the model is adjusted to produce more of what reviewers prefer. This is why a modern assistant answers your question instead of merely continuing your sentence, and why it usually declines harmful requests.

A key consequence: the model's knowledge is frozen at the point its training data was collected, known as its knowledge cutoff. Events after that date are simply not in the model, unless the tool you are using adds them through search or document retrieval.

## Inference: what happens when you ask a question

Using a trained model is called inference. When you send a message, the model does not look anything up in a database. It reads your text and generates a response one small chunk at a time. Each chunk is called a token, roughly three quarters of a word in English. The model predicts the next token, appends it, then predicts the one after that, until the response is complete.

Everything the model can see at once, your conversation so far plus any documents you pasted in, is called the context window. It is the model's working memory. It is large but finite, and when a conversation outgrows it, the earliest material falls out of view. That is why a long chat can seem to forget instructions you gave at the start, and why pasting in the relevant policy or article often improves answers: you are placing the facts directly into the model's working memory instead of relying on what it half-remembers from training.

There is also a setting called temperature that controls how predictable the output is. Low temperature makes the model pick the most likely next token nearly every time, which produces consistent but sometimes flat responses. Higher temperature allows more variety. This is one reason the same question can produce different answers on different tries.

## Why models make things up

The failure mode everyone in medicine needs to understand is hallucination, sometimes called confabulation: the model states something false with complete fluency and confidence. A fabricated citation with a plausible journal name, real author names, and a fake page range is the classic example.

Hallucination is not a glitch. It follows directly from how the model works. The model produces text that is statistically plausible given its training. Most of the time, plausible and true coincide. But when the model lacks the specific fact you need, it does not return an error message. It produces the most plausible-sounding continuation anyway, because generating plausible text is the only thing it does. The model has no internal flag that distinguishes remembering from inventing.

Newer systems reduce this in two main ways. Retrieval-augmented generation (RAG) fetches relevant documents first and asks the model to answer from those documents, a practice called grounding. Reasoning models spend extra tokens working through a problem step by step before answering, which improves reliability on complex questions. Both help. Neither eliminates the problem. Verification of anything consequential remains your job, exactly as it would be with an unfamiliar colleague's confident claim.

## What this means in practice

A few rules of thumb follow directly from the mechanics described above.

LLMs are strongest at transforming text you give them: summarizing an article, restructuring notes into a table, drafting questions from your lecture content, adjusting the reading level of patient instructions, or critiquing a draft. In these tasks the source material is in the context window, so the model leans less on its imperfect memory.

They are weakest when treated as a search engine or an oracle: asked for specific citations, exact dosages, current guidelines, or anything where the precise fact matters and is not supplied in the conversation. These are the situations where hallucination does real damage.

Treat outputs as a competent first draft from an assistant who has read widely but verifies nothing. Check claims against primary sources before they reach students or patients. Never paste protected health information (PHI) or student records covered by the Family Educational Rights and Privacy Act (FERPA) into consumer AI tools; see the [tools directory](../tools/index.md) for the governance status of each tool at our institution.

Finally, remember that capability is moving quickly. Specific model names and features will change; the fundamentals on this page, prediction, training, context, and hallucination, change much more slowly and remain the right lens for judging each new tool.

## Where to go next

- The [Glossary](glossary.md) defines the terms used here, plus the rest of the vocabulary you will encounter.
- [Common Misconceptions](misconceptions.md) addresses frequent misunderstandings directly.
- The [Learning page](../learning/index.md) lists courses and videos if you want to go deeper.
