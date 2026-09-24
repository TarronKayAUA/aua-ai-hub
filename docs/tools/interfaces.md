---
last_reviewed: 2026-09-01
---

# Chat, Work, or Code: Choosing Your AI Interface

<span class="meta-chip">Stage 3: working with agents</span><span class="meta-chip">About 12 minutes</span> <span class="meta-note">The Equipping section is for people setting up an agent</span>

The same model behaves very differently depending on the room you put it in. A web chat, a working session, and a code agent can all run the identical frontier model, but the interface decides what the model can actually do, how much of your material it can see, and what the work costs. This page explains the three kinds of artificial intelligence (AI) interface, what a tool call is, why letting a model run tools on your machine is substantially cheaper for heavy work, and how to equip a computer so an agent can do real work on it.

!!! note "This page is not about running models locally"
    Everything here uses cloud models; what runs locally is the *tools* they call (file readers, document converters, compilers). Running the models themselves on your own hardware is a different topic with its own trade-offs: see [Running Models Locally](local.md).

## Web chat, working session, or code agent

**Web chat** (chatgpt.com, claude.ai) is a conversation. You paste or upload material, and the model mostly replies with text. It is the right tool for questions, drafting, and thinking out loud, and the wrong tool the moment the work involves files, revisions at scale, or verification.

**Working sessions** are the middle tier: [Claude Cowork](https://claude.com/product/cowork) and [ChatGPT Work](https://openai.com/chatgpt-work/) take a task rather than a message, plan it, execute it over minutes, and hand back finished artifacts: documents, spreadsheets, slide decks. Anthropic's framing is exact: "Where Chat is a conversation, Cowork is a working session." In the Claude desktop app, Cowork works in folders you choose on your computer, and a task started from web or mobile keeps running in Anthropic's cloud; ChatGPT Work on the desktop can likewise use local files and desktop applications with your permission (on web and mobile it cannot reach your computer's files).

**Code agents** are the deepest tier: [Claude Code](https://code.claude.com/docs/en/overview) (the terminal, extensions for code editors, a desktop app, or the web) and [Codex mode](https://openai.com/codex/) in the ChatGPT desktop app. These work directly in a folder you open for them: reading files, editing them in place, and running commands, with every consequential action gated by a permission system. Despite the name, code agents are not only for code: anything that lives in files (a course folder, a manuscript, a data export) is their territory.

| | Web chat | Working session | Code agent |
| --- | --- | --- | --- |
| You provide | Pasted text, uploads | A task and files or folder access | A folder on your machine |
| It produces | Text in the chat, and files when file creation is on | Finished documents, sheets, decks | Edited files, run commands, results it has checked |
| Sees your files | Only what you paste or upload | Uploaded or permitted files | The folder you opened, on demand |
| Runs tools | Some, in the vendor's cloud (web search, and file creation where it is switched on) | Yes, on your computer or in the vendor's cloud | Yes, on your machine |
| Effort control | Limited | Model and effort selection on paid plans | Full effort dial |
| Best for | Questions, drafts, exploration | Deliverables from your materials | Heavy, multi-step, verifiable work |

## What a tool call is

A tool call is the model pausing text generation to request an action: read this file, run this command, search this folder. The interface executes the action (asking your permission where it matters), returns the result, and the model continues with that result in hand. That loop, repeated, is what makes an agent an agent.

<figure class="figure figure--html hf">
<p class="hf-title">The tool call loop</p>
<div class="hf-flow">
<div class="hf-box">
<p class="hf-box-title">Model (cloud)</p>
<p class="hf-box-sub">decides what it needs</p>
</div>
<span class="hf-arrow">"read chapter 3"</span>
<div class="hf-box hf-box--warn">
<p class="hf-box-title">Interface</p>
<p class="hf-box-sub">permission check</p>
</div>
<span class="hf-arrow">approved</span>
<div class="hf-box hf-box--ok">
<p class="hf-box-title">Tool (your machine)</p>
<p class="hf-box-sub">reads, converts, runs</p>
</div>
</div>
<p class="hf-return">Result returns to the model: only the 30 lines that matter enter its context.</p>
<p class="hf-note">Generation pauses, the action runs, and the model continues with the result in hand.</p>
<figcaption>The permission check sits between the model's request and your machine; the rules are enforced by the interface, not by the model.</figcaption>
</figure>

## Why local tools save inference

Model output is the expensive part: every word a model generates is paid inference, whether by tokens or by your plan's usage limits. Tool calls move work off the meter in three ways.

**Deterministic work runs on your processor, not the model's.** Ask a chat interface to reformat a 40-page document and the model must regenerate every word of it as output. Ask a code agent and it writes a 30-line script; your computer does the conversion in a second, at no model cost. The model's output was 30 lines, not 40 pages. The same logic covers converting files, renaming figures, extracting tables, and running statistics: anything with a right answer a program can compute should be computed, not generated.

**The model reads what it needs, not what you have.** In chat, context is whatever you paste, usually whole documents. An agent searches the folder and reads the 30 relevant lines from each file. You get better answers ([context quality is the main lever](../basics/better-answers.md)) while consuming a fraction of the input budget.

**Verification is nearly free.** An agent that just edited a file can run the checker, read the one-line result, and fix what failed, in a loop, until the work is actually correct. Each round costs a command execution and a few lines of output rather than a full regeneration. This is why agent-produced work can arrive *verified*, which is the real difference between the tiers: chat gives you text that looks right, agents can give you work that was checked.

The practical rule: the heavier and more file-bound the task, the further right you should move in the table above. A question costs the same everywhere; a hundred-file revision is affordable only where tools are.

## Dialing effort

Both vendors now expose how hard the model thinks as a setting, and it is the most direct cost and quality lever you have. Claude Code offers effort levels low, medium, high, xhigh, and max, plus a fast mode for quick turnarounds; high is the default on most models, but Claude Opus 5.5 starts at medium. The GPT-5.6 family exposes a range of effort settings up to max on paid plans. Both ecosystems also added orchestration above a single agent: ChatGPT's Ultra mode splits a task across parallel subagents, and Claude Code's ultracode setting has the model orchestrate multi-agent workflows.

The heuristic: default effort for routine work; drop effort (or use fast mode) for mechanical batch tasks where the steps are obvious; raise it only for the genuinely hard steps: architecture decisions, subtle debugging, analysis where a wrong answer is expensive. Effort applies per task, so one session can dial down for the cleanup and up for the hard part. Paying maximum reasoning for routine file renames is the agent-era version of leaving the lights on.

## The current lineups (September 2026)

Model names go stale faster than anything else on this page; treat these as a snapshot, check the [Benchmarks section](../benchmarks.md) for standings, and expect the interfaces to outlive the models in them.

- **Anthropic:** Claude Code and Cowork run the Claude family.
    - **Claude Opus 5.5** (released September 22, 2026) is Anthropic's recommended starting point for most work and Claude Code's default model on paid plans; Anthropic reports it matches Claude Fable 5.1 on most work at a lower price.
    - **Claude Fable 5.1** (released September 1, 2026) remains Anthropic's model for demanding reasoning and long-running agent work. It is available on every paid plan but never the default: you select it explicitly (in Claude Code with `/model`); Max plans include it for up to half of weekly usage, and on Pro plans it draws on usage credits.
    - **Claude Sonnet 5** is the faster, lower-cost tier; Anthropic says Sonnet 5.5 and Haiku 5.5 will follow in the coming weeks.
    - When Opus 5.5 or Fable 5.1 flags a request as biology or cybersecurity work, Claude Code re-runs it on an older Claude model and notes the switch in the transcript; researchers working with biomedical material should expect to see this.
- **OpenAI:** the ChatGPT app runs the GPT-5.6 family, three tiers under one generation: Sol (flagship), Terra (the everyday mid-tier), Luna (fastest and cheapest). Free and Go plans get Terra; Plus, Pro, Business, and Enterprise plans choose the tier and set the effort level.

## Equipping the machine

An agent is only as capable as the tools on the computer it works in. The pattern to know: **you do not need to guess what to install, because the agent will tell you.** Give it a task, and when it hits a missing tool it will name the exact package and the install command; install once and every future session benefits. A development task will have it request a compiler toolchain and software development kits; a document task will have it request the converters below.

This starter set covers most academic document work, and each item is something an agent can drive without you learning it:

??? note "The toolkit, for people setting up an agent"
    | Tool | What it unlocks for the agent | Windows (winget) | Mac (brew) |
    | --- | --- | --- | --- |
    | LibreOffice | Convert Word, Excel, and PowerPoint files to PDF; open legacy formats; render documents so the agent can visually verify its own edits | `winget install TheDocumentFoundation.LibreOffice` | `brew install --cask libreoffice` |
    | Poppler | Read and render PDF pages, extract text | `winget install oschwartz10612.Poppler` | `brew install poppler` |
    | Pandoc | Convert between document formats (Markdown, Word, HTML) | `winget install JohnMacFarlane.Pandoc` | `brew install pandoc` |
    | Python | Data work, scripting, document surgery | `winget install Python.Python.3.13` | `brew install python` |
    | Node.js | Generate Word and PowerPoint files programmatically; web tooling | `winget install OpenJS.NodeJS.LTS` | `brew install node` |
    | Tesseract (optional) | Read scanned documents (optical character recognition) | `winget install UB-Mannheim.TesseractOCR` | `brew install tesseract` |
    | ImageMagick (optional) | Convert and resize images in bulk | `winget install ImageMagick.ImageMagick` | `brew install imagemagick` |

All commands verified July 2026 (winget ships with Windows 11; [Homebrew](https://brew.sh) is the Mac equivalent). After installing, restart the terminal or app so the new tools are visible. On university-managed machines, installing software may need help from Information Technology (IT); on a personal machine you can install the toolkit yourself.

## Choosing what the agent can see

An agent can read anything in the folder you open, so choosing the folder is how you decide what reaches the model. A folder scoped to the task keeps the agent's searches quick and its answers focused, and it means material the [AI Responsible Use Policy](../governance/policy.md#responsible-use) keeps out of publicly available tools, such as patient or student records, is not read along the way. Consequential actions prompt for your approval, and that check is enforced by the interface software rather than left to the model's judgment. The [AI Agents guide](agents.md) covers the rest of what is worth knowing (actions that cannot be undone, and prompt injection) and profiles each agent and its maker. When you are ready to try one, [Your First Agent Session](first-session.md) walks you through twenty minutes on a folder of copies.

**Next:** [Your First Agent Session](first-session.md).
