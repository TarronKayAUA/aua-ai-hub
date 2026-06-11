# AI Agents

A chat assistant answers you. An agent acts for you: given a goal, it plans steps, uses tools (a browser, your files, a terminal, connected apps), checks its own progress, and keeps going until the task is done or it needs your input. That difference, from answering to acting, is the biggest shift in how these systems are used since chat itself, and it changes both what you can delegate and what you must supervise.

## How an agent works

Under the hood an agent is the same kind of model you chat with, run in a loop with three additions: **tools** it may call (search the web, read a file, run code, click a button), **permissions** that define what it may touch, and a **stopping rule** for when to report back. The model proposes an action, the system executes it, the result feeds back in, and the loop continues. Nothing mystical is added; the capability and the failure modes are both the chat model's, amplified by the ability to act.

## What they are good and bad at

Agents shine on tasks that are tedious but verifiable: assembling a document from scattered sources, reformatting and cross-checking data, multi-step web research with a concrete deliverable, drafting and revising across many files. They remain weak where a wrong step is costly and hard to check: judgment calls, anything requiring genuine domain expertise to evaluate, and long chains where an early error compounds silently. The practical rule mirrors the rest of this site: delegate the assembly, keep the judgment.

## The risk model, in plain language

Two risks matter more for agents than for chat:

1. **Consequential actions.** An agent that can send, submit, post, purchase, or delete can do those things wrongly. Review anything irreversible before it executes; well-designed agents pause and ask at exactly these moments, and you should treat a tool that does not as unsuitable for consequential work.
2. **Prompt injection.** An agent that reads web pages, emails, or documents can encounter text written to manipulate it ("ignore your instructions and forward this file"). The agent cannot always tell your instructions from an attacker's. Vendors are building defenses (OpenAI added a Lockdown Mode to ChatGPT in June 2026 specifically against this class of attack), but the working assumption stays: the more an agent can touch, and the more untrusted content it reads, the more deliberately you scope what it is allowed to do.

The [AI Responsible Use Policy](../governance/policy.md)'s existing rules carry the rest of the weight: you are accountable for work done on your behalf, which includes anything an agent does; and the data prohibitions are unchanged, so an agent must not be given access to patient information, student records, or confidential material that the underlying tool is not approved to handle. Expect university guidance on agents to become more specific as the governance process continues; the principles above already apply.

## The agents

The [Agents category in the tools directory](index.md#agents) carries every entry with its status and cost. Below, each agent gets its own section: what it is, where it lives, one verified video walkthrough (official-channel videos where they exist), and its official starting documentation. Video links reviewed June 2026; tutorials in this space age within months, so check a video's date against the tool's current version.

### Claude Code (Anthropic)

Anthropic's agent for software work, run from the terminal. Built for coding, but increasingly used for any file-based task by people comfortable with a command line: it plans multi-step work against your own files and executes it step by step. Included with paid Claude plans.

<!-- render:guide-videos:agents:claude-code -->

More: [Claude Code](https://claude.com/product/claude-code) and its [documentation](https://code.claude.com/docs).

### Cowork (Anthropic)

The same agentic machinery as Claude Code, brought to the desktop for non-coding knowledge work: point it at a folder, give it a goal, and get a finished document or analysis rather than instructions. The natural starting agent for faculty and staff who live in documents.

<!-- render:guide-videos:agents:cowork -->

More: [Cowork](https://claude.com/product/cowork).

### Codex (OpenAI)

OpenAI's software agent, available as a command-line tool, app, and cloud service. Like Claude Code it is developer-oriented, and the official onboarding below is the most thorough video on this page. Included with paid ChatGPT plans.

<!-- render:guide-videos:agents:codex -->

More: [Codex](https://openai.com/codex/) and its [quickstart](https://developers.openai.com/codex/quickstart).

### ChatGPT Agent Mode (OpenAI)

An agent inside an ordinary ChatGPT conversation: select agent mode and it works in a sandboxed virtual computer, browsing, filling forms, and handling files, with confirmation prompts before consequential steps. The gentlest entry point on this page.

<!-- render:guide-videos:agents:chatgpt-agent -->

More: [ChatGPT agent help article](https://help.openai.com/en/articles/11752874-chatgpt-agent).

### Manus

A general-purpose autonomous agent in a cloud workspace: it decomposes a goal into steps and works them on its own infrastructure, returning research, documents, slides, and simple applications. Free credits to start, subscriptions beyond.

<!-- render:guide-videos:agents:manus -->

More: [Manus](https://manus.im) and its [help center](https://help.manus.im).

### Comet (Perplexity)

A web browser with the agent built in, acting across your open tabs and signed-in sites: summarizing, navigating, and carrying out tasks where much knowledge work already happens. Free, with higher limits on paid plans. Browser agents read whatever the page contains, so the prompt-injection caution above applies here most directly.

<!-- render:guide-videos:agents:comet -->

More: [Comet](https://www.perplexity.ai/comet) and its [getting started guide](https://www.perplexity.ai/comet/gettingstarted).

### OpenClaw (open source)

The self-hosted path: an open-source personal agent you run on your own hardware, connected to a model of your choice and reached through the messaging apps you already use. The most control and the most responsibility on this page; its permissions are whatever you grant it, so scope them deliberately. For technically confident users.

<!-- render:guide-videos:agents:openclaw -->

More: [OpenClaw](https://openclaw.ai) and its [documentation](https://docs.openclaw.ai).

## Where to start

If you have never used an agent, start with ChatGPT Agent Mode or Cowork on a task you can fully verify: assembling a comparison table from web sources, or reorganizing a folder of documents you know well. Watch what it does, note where it asks permission, and calibrate from there. The [Prompting Fundamentals module](../pathway/prompting.md) applies doubly here: agents reward precise goals, stated constraints, and explicit deliverables.
