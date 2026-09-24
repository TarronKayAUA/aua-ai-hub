---
last_reviewed: 2026-09-01
---

# AI Agents

<span class="meta-chip">For everyone</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">The field guide; the hands-on pages are linked at the end</span>

An artificial intelligence (AI) chat assistant answers you. An agent acts for you: given a goal, it plans steps, uses tools (a browser, your files, a terminal, connected apps), checks its own progress, and keeps going until the task is done or it needs your input. That difference, from answering to acting, is a major shift in how these systems are used, and it changes both what you can delegate and what you must supervise.

## How an agent works

Under the hood an agent is the same kind of model you chat with, run in a loop with three additions: **tools** it may call (search the web, read a file, run code, click a button), **permissions** that define what it may touch, and a **stopping rule** for when to report back. The model proposes an action, the system executes it, the result feeds back in, and the loop continues. Nothing mystical is added; the capability and the failure modes are both the chat model's, amplified by the ability to act.

<figure class="figure figure--html hf">
<div class="hf-flow">
<div class="hf-box hf-box--filled">
<p class="hf-box-title">Your goal</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-boundary">
<p class="hf-label">Inside the permissions you granted</p>
<ol class="hf-steps">
<li class="hf-box">The model proposes an action</li>
<li class="hf-box">A tool executes it: search, read, run, click</li>
<li class="hf-box">The result feeds back in</li>
</ol>
<p class="hf-return">And round again, until the task is done or needs you.</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p>Reports back: done, or it needs your input</p>
</div>
</div>
<p class="hf-note">Everything inside the dashed line runs within the permissions you granted.</p>
<figcaption>The same model you chat with, run in a loop with tools, permissions, and a stopping rule.</figcaption>
</figure>

## What they are good and bad at

Agents shine on tasks that are tedious but verifiable: assembling a document from scattered sources, reformatting and cross-checking data, multi-step web research with a concrete deliverable, drafting and revising across many files. They remain weak where a wrong step is costly and hard to check: judgment calls, anything requiring genuine domain expertise to evaluate, and long chains where an early error compounds silently. The practical rule mirrors the rest of this site: delegate the assembly, keep the judgment.

## What to watch for

Two risks matter more for agents than for chat:

1. **Consequential actions.** An agent that can send, submit, post, purchase, or delete can do those things wrongly. Review anything irreversible before it executes; well-designed agents pause and ask at exactly these moments, and an agent that does not is better kept to work you can undo.
2. **Prompt injection.** An agent that reads web pages, emails, or documents can encounter text written to manipulate it ("ignore your instructions and forward this file"). The agent cannot always tell your instructions from an attacker's. Vendors are building defenses (OpenAI, for example, has added a Lockdown Mode to ChatGPT aimed at this class of attack), but the working assumption stays: the more an agent can touch, and the more untrusted content it reads, the more deliberately you scope what it is allowed to do.

The installable version of the same problem is a skill: a file of instructions an agent follows with whatever access you have already granted, which is why the [Skills page](skills.md) explains how to judge a skill someone else wrote. Two parts of the [AI Responsible Use Policy](../governance/policy.md#responsible-use) matter most here. You remain accountable for work done on your behalf, including what an agent does. And an agent can read whatever you give it access to, so the policy's data rules follow that access: what the policy keeps out of publicly available tools, such as patient health information and student education records, stays out of an agent's reach unless the AI Responsible Use Subcommittee has approved the tool for that data.

## The agents

The [Agents category in the tools directory](index.md#agents) carries every entry with its status and cost. Below, each agent gets its own section: what it is, where it lives, one verified video walkthrough (official-channel videos where they suit a first-time viewer), and its official starting documentation. Video links reviewed September 2026; tutorials in this space age within months, so check a video's date against the tool's current version.

| Agent | Maker | The short version |
| --- | --- | --- |
| [Claude Code](#claude-code-anthropic) | Anthropic | Built for software work, increasingly used for any file-based task |
| [Cowork](#cowork-anthropic) | Anthropic | The natural starting agent for faculty and staff who live in documents |
| [Codex](#codex-openai) | OpenAI | Developer-oriented coding agent, now inside the ChatGPT desktop app |
| [ChatGPT Work](#chatgpt-work-openai) | OpenAI | The gentlest entry point: give it an outcome, get finished documents |
| [Manus](#manus) | Independent; formerly part of Meta | Autonomous agent in a cloud workspace, working steps on its own infrastructure |
| [Comet](#comet-perplexity) | Perplexity | The agent built into a web browser, acting across your open tabs |
| [OpenClaw](#openclaw-open-source) | Open source | The self-hosted path: the most control, and the most setup |

### Claude Code (Anthropic)

Anthropic's agent for software work, available in the terminal, integrated development environment (IDE) extensions, a desktop app, and the browser. Built for coding, but increasingly used for any file-based task: it plans multi-step work against your own files and executes it step by step. Included with paid Claude plans.

<!-- render:guide-videos:agents:claude-code -->

More: [Claude Code](https://claude.com/product/claude-code) and its [documentation](https://code.claude.com/docs).

### Cowork (Anthropic)

The same agentic machinery as Claude Code, brought to the desktop for non-coding knowledge work: point it at a folder, give it a goal, and get a finished document or analysis rather than instructions. The natural starting agent for faculty and staff who live in documents.

<!-- render:guide-videos:agents:cowork -->

More: [Cowork](https://claude.com/product/cowork).

### Codex (OpenAI)

OpenAI's coding agent. Since the July 2026 merge it is part of the ChatGPT desktop app, working with local folders, repositories, and terminals, alongside a command-line tool, an IDE extension, and a cloud service. Like Claude Code it is developer-oriented. The official onboarding below is the most thorough video on this page, but it dates from January 2026, before Codex moved into the ChatGPT desktop app, so its app screens will differ from yours; the command-line and editor sections still apply. Included with every ChatGPT plan, including Free.

<!-- render:guide-videos:agents:codex -->

More: [Codex](https://openai.com/codex/) and its [quickstart](https://learn.chatgpt.com/docs/quickstart).

### ChatGPT Work (OpenAI)

OpenAI's agent for finished work: give it an outcome and it researches, works in steps, and returns documents, spreadsheets, slides, sites, or analyses rather than chat, with confirmation prompts before consequential steps. On the desktop app it can use local files and applications with your permission; included with every ChatGPT plan on desktop, with web and mobile on paid plans. Still the gentlest entry point on this page. The official walkthrough below is the first of a short series on OpenAI's channel covering computer and browser use, slides and documents, and scheduled tasks.

<!-- render:guide-videos:agents:chatgpt-agent -->

More: [ChatGPT Work and the desktop app](https://learn.chatgpt.com/docs/app).

### Manus

A general-purpose autonomous agent in a cloud workspace: it decomposes a goal into steps and works them on its own infrastructure, returning research, documents, slides, and simple applications. Free credits to start, subscriptions beyond. Originally built by the startup Butterfly Effect, acquired by Meta in December 2025, and returned to independent operation in August 2026 after Chinese regulators blocked the acquisition. Existing accounts may have changed during the separation, so check your account and any saved work.

<!-- render:guide-videos:agents:manus -->

More: [Manus](https://manus.im) and its [help center](https://help.manus.im).

### Comet (Perplexity)

A web browser with the agent built in, acting across your open tabs and signed-in sites: summarizing, navigating, and carrying out tasks where much knowledge work already happens. Free, with higher limits on paid plans. Browser agents read whatever the page contains, so prompt injection, described above, matters most here.

<!-- render:guide-videos:agents:comet -->

More: [Comet](https://www.perplexity.ai/comet) and its [getting started guide](https://www.perplexity.ai/comet/gettingstarted).

### OpenClaw (open source)

The self-hosted path: an open-source personal agent you run on your own hardware, connected to a model of your choice and reached through the messaging apps you already use. It gives you the most control on this page, and with it the setup work: its permissions are whatever you grant it, so choosing them is part of installing it. It suits people comfortable running their own software.

<!-- render:guide-videos:agents:openclaw -->

More: [OpenClaw](https://openclaw.ai) and its [documentation](https://docs.openclaw.ai).

## Where to start

If you have never used an agent, start with ChatGPT Work or Cowork on a task you can fully verify: assembling a comparison table from web sources, or reorganizing a folder of documents you know well. The [Your First Agent Session](first-session.md) walkthrough uses Claude Code or Codex instead, because both work in a folder you choose and show you each permission prompt; the same habits carry over to Cowork and ChatGPT Work. Watch what it does, note where it asks permission, and calibrate from there. The [Prompting Fundamentals module](../pathway/prompting.md) applies doubly here: agents reward precise goals, stated constraints, and explicit deliverables.

This page is the field guide; the rest of the site carries the working layer:

<div class="grid cards" markdown>

- :material-compare:{ .lg .middle } __Choosing Your Interface__

    ---

    Compares chat, working sessions, and code agents, and explains the economics.

    [Compare the rooms](interfaces.md)

- :material-school:{ .lg .middle } __Working with Agents__

    ---

    Module 7 of the pathway: the 12-minute concept primer.

    [Read the module](../pathway/working-with-agents.md)

- :material-play-circle:{ .lg .middle } __Your First Agent Session__

    ---

    Your first 20 minutes step by step, including the settings worth changing.

    [Run one session](first-session.md)

- :material-briefcase:{ .lg .middle } __Standing Setups__

    ---

    Makes your preferences permanent once you are running sessions routinely.

    [Set it up once](standing-setups.md)

- :material-toolbox:{ .lg .middle } __Skills__

    ---

    The four document skills Claude users already have, how skills work, and how to judge one someone else wrote.

    [Explore skills](skills.md)

</div>
