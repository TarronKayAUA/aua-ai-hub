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

## The options

The [Agents category in the tools directory](index.md#agents) carries the current entries with statuses and costs. The shape of the field, by where the agent lives:

- **In your terminal**: [Claude Code](https://claude.com/product/claude-code) (Anthropic) and [Codex](https://openai.com/codex/) (OpenAI), built for software work but increasingly used for any file-based task by people comfortable with a command line.
- **On your desktop**: [Cowork](https://claude.com/product/cowork) (Anthropic) brings the same agentic machinery to non-coding knowledge work: point it at a folder, give it a goal, get a finished deliverable.
- **Inside the chat app**: [ChatGPT Agent Mode](https://help.openai.com/en/articles/11752874-chatgpt-agent) runs tasks in a sandboxed virtual computer from an ordinary ChatGPT conversation; the gentlest entry point.
- **In the browser**: [Comet](https://www.perplexity.ai/comet) (Perplexity) embeds the agent where much knowledge work already happens, acting across your tabs.
- **In a cloud workspace**: [Manus](https://manus.im) takes a goal and works it autonomously on its own infrastructure, returning research, documents, and slides.
- **Self-hosted**: [OpenClaw](https://openclaw.ai) is the open-source path, a personal agent you run on your own hardware and reach through your messaging apps. The most control and the most responsibility; its permissions are whatever you grant it.

## Watch how it is done

One verified walkthrough per tool, chosen for current interfaces and a beginner audience (official-channel videos where they exist). Links reviewed June 2026; tutorials in this space age within months, so check a video's date against the tool's current version.

<!-- render:guide-videos:agents -->

## Where to start

If you have never used an agent, start with ChatGPT Agent Mode or Cowork on a task you can fully verify: assembling a comparison table from web sources, or reorganizing a folder of documents you know well. Watch what it does, note where it asks permission, and calibrate from there. The [Prompting Fundamentals module](../pathway/prompting.md) applies doubly here: agents reward precise goals, stated constraints, and explicit deliverables.
