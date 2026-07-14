---
last_reviewed: 2026-07-13
---

# Glossary

Short, plain-language definitions of the artificial intelligence (AI) terms you will meet on this site and in the wider literature. Entries are alphabetized.

**Agent**: an AI system that does more than answer a single question. It plans steps, uses tools such as web search or code execution, checks its own results, and works toward a goal with limited supervision. [Module 7 of the pathway](../pathway/working-with-agents.md) is the 12-minute introduction.

**Alignment**: the research effort to make AI systems pursue the goals their developers and users intend, including being honest and declining harmful requests.

**API (application programming interface)**: the channel programs use to talk to an AI model directly, without a chat website. Institutions use APIs to build AI features into their own software.

**Benchmark**: a standardized test set used to compare models, for example a bank of licensing-exam-style questions. Useful for rough comparisons, but performance on a benchmark does not guarantee performance on your real task.

**Bias**: systematic skew in model behavior, usually inherited from training data. In medicine this can mean weaker performance for underrepresented patient groups or stereotyped assumptions in generated text.

**Chain of thought**: a model's written step-by-step reasoning before its final answer. Asking a model to work step by step often improves accuracy on multi-step problems.

**Context window**: the model's working memory, measured in tokens. It holds the conversation and any documents you provide. Content that falls outside it is invisible to the model.

**Effort (reasoning effort)**: a user-facing setting for how hard a model thinks before answering, typically from low to a maximum. Higher effort is deeper, slower, and costlier; the skill is matching the setting to the task rather than leaving it high for everything.

**Embedding**: a list of numbers representing the meaning of a piece of text, such that similar texts get similar numbers. Embeddings power semantic search, where results match meaning rather than exact keywords.

**Eval**: short for evaluation, a structured test of model behavior. Running evals is how teams check whether a model is good enough, and stays good enough, for a specific use.

**Fine-tuning**: additional training that adapts a pretrained model to a narrower purpose, such as following instructions politely or specializing in a domain.

**Folder brief**: a plain text file of standing instructions that an agent reads before working in a folder (Claude Code reads `CLAUDE.md`, Codex reads `AGENTS.md`). The place for conventions and "always do X" rules you would otherwise repeat. See [Standing Setups](../tools/standing-setups.md).

**GPU and VRAM**: the graphics processing unit (GPU) is the chip that does AI computation; video random access memory (VRAM) is its onboard memory. VRAM size determines how large a model a computer can run locally.

**Grounding**: giving a model trusted source material and instructing it to answer only from that material, which reduces fabricated answers.

**Guardrails**: safety measures wrapped around a model, such as refusal training and content filters, intended to block harmful or off-limits outputs.

**Hallucination (confabulation)**: a fluent, confident statement that is false, such as an invented citation. It happens because models generate plausible text rather than retrieve verified facts. Some authors prefer the term confabulation.

**Jailbreak**: a prompt crafted to trick a model into ignoring its safety rules. A reminder that guardrails are imperfect.

**Knowledge cutoff**: the date when a model's training data ends. The model knows nothing after that date unless the tool adds current information through search or retrieval.

**Latency**: the wait time between sending a request and receiving the response.

**Leaderboard**: a public ranking of models on benchmarks or human preference votes. Rankings shift often and measure general ability, not fitness for your specific task.

**LLM (large language model)**: an AI model trained on very large amounts of text to predict the next token, which lets it generate and transform language. The technology behind Claude, ChatGPT, and Gemini. See [How LLMs Work](how-llms-work.md).

**Local model**: a model that runs entirely on your own computer rather than on a company's servers. Slower and less capable than frontier models, but data never leaves your machine.

**MCP (Model Context Protocol)**: an open standard that lets AI assistants connect to external tools and data sources, such as a file system or a reference database, in a consistent way.

**Model card**: a document published with a model describing what it was trained on, what it is good and bad at, and its known risks. Worth reading before adopting a model for institutional use.

**Multimodal**: able to work with more than one kind of input or output, such as text plus images, audio, or video.

**Open weights vs. open source**: open weights means the trained model file is downloadable and runnable locally. Fully open source additionally releases the training data and code. Many popular "open" models are open weights only.

**Orchestration (subagents)**: splitting a large task across multiple AI agents working in parallel, with the results combined at the end. The vendors' highest-effort modes work this way; markedly more thorough on big decomposable tasks, and markedly more expensive.

**Parameters**: the billions of adjustable internal values that store what a model learned during training. Loosely, more parameters means more capacity.

**Permission prompt**: the pause where an agent asks your approval before an action (writing a file, running a command). Enforced by the interface software rather than by the model, which makes it the user's main safety control: approve what matches your request, question what surprises you.

**PHI and FERPA considerations**: protected health information (PHI) is patient data covered by privacy law; the Family Educational Rights and Privacy Act (FERPA) covers student education records. Neither belongs in a consumer AI tool. Use only tools approved for such data, and when in doubt, leave the data out.

**Pretraining**: the first and largest stage of training, where a model learns language and world knowledge by predicting hidden words across enormous text collections.

**Project (standing setup)**: a persistent container on an assistant platform holding instructions and uploaded materials that apply to every conversation inside it, so a course or a manuscript never has to be re-explained. See [Standing Setups](../tools/standing-setups.md).

**Prompt**: everything you type to an AI model: the question, instructions, and any pasted material. Clearer, more specific prompts produce better responses.

**Prompt engineering**: the practice of writing and refining prompts to get reliable results, including giving the model a role, examples, and explicit output formats.

**Quantization**: compressing a model's parameters into lower-precision numbers so it runs on smaller hardware, with a usually modest loss in quality. Common for local models.

**RAG (retrieval-augmented generation)**: an architecture that first retrieves relevant documents from a trusted source, then has the model answer from those documents. Reduces hallucination and allows current, citable answers.

**Rate limit**: a cap on how many requests or tokens a user can send to a model in a given period.

**Reasoning model**: a model variant that spends extra computation thinking through a problem step by step before answering. Better at complex problems, slower and costlier per question.

**Red teaming**: deliberately attacking a model with adversarial prompts to find failure modes before real users do.

**RLHF (reinforcement learning from human feedback)**: a training stage where humans rate model responses and the model is adjusted toward preferred behavior. A major reason assistants are helpful and usually decline harmful requests.

**System prompt**: standing instructions given to a model before the user's messages, defining its role, tone, and rules. Users typically do not see it.

**Temperature**: a setting controlling output randomness. Low temperature gives consistent, predictable responses; higher temperature gives more varied ones.

**Token**: the unit of text a model reads and writes, roughly three quarters of an English word. Context windows, pricing, and rate limits are all measured in tokens.

**Tool use (tool calls, function calling)**: a model pausing text generation to request an action (read a file, run a command, search), with the result feeding back into its answer. The mechanism that turns a chat model into an agent; consequential calls pass through a permission prompt first.

**Training vs. inference**: training is the slow, expensive process of building a model. Inference is using the finished model to answer questions. Your conversations are inference; they do not update the model's parameters.

**Vector database**: a database designed to store embeddings and find the most similar items quickly. The retrieval layer underneath most RAG systems.

**Vision model**: a model that can interpret images, such as reading a chart, a slide, or a photograph, and answer questions about them.

**Weights**: another name for a model's learned parameter values. "Downloading a model" means downloading its weights.

**Working session**: the interface tier between chat and code agents (Claude Cowork, ChatGPT Work): you give a task rather than a message, and the system plans, works, and returns finished documents, spreadsheets, or slides. See [Choosing Your Interface](../tools/interfaces.md).

**Zero-shot and few-shot**: zero-shot means asking a model to do a task with instructions only. Few-shot means including a handful of worked examples in the prompt, which often improves consistency.
