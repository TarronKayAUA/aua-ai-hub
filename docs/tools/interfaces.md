---
last_reviewed: 2026-07-13
---

# Chat, Work, or Code: Choosing Your AI Interface

<span class="meta-chip">For everyone</span><span class="meta-chip">About 12 minutes</span>

The same model behaves very differently depending on the room you put it in. A web chat, a working session, and a code agent can all run the identical frontier model, but the interface decides what the model can actually do, how much of your material it can see, and what the work costs. This page explains the three kinds of interface, what a tool call is, why letting a model run tools on your machine is dramatically cheaper for heavy work, and how to equip a computer so an agent can do real work on it.

!!! note "This page is not about running models locally"
    Everything here uses cloud models; what runs locally is the *tools* they call (file readers, document converters, compilers). Running the models themselves on your own hardware is a different topic with its own trade-offs: see [Running Models Locally](local.md).

## Three kinds of room

**Web chat** (chatgpt.com, claude.ai) is a conversation. You paste material in, the model generates text out. It is the right tool for questions, drafting, and thinking out loud, and the wrong tool the moment the work involves files, revisions at scale, or verification.

**Working sessions** are the middle tier: [Claude Cowork](https://claude.com/product/cowork) and [ChatGPT Work](https://learn.chatgpt.com/docs/app) take a task rather than a message, plan it, execute it over minutes, and hand back finished artifacts: documents, spreadsheets, slide decks. Anthropic's framing is exact: "Where Chat is a conversation, Cowork is a working session." Cowork runs in an isolated environment on Anthropic's servers with your files uploaded to it; ChatGPT Work on the desktop can additionally use local files and desktop applications with your permission (on web and mobile it cannot reach your computer's files).

**Code agents** are the deepest tier: [Claude Code](https://code.claude.com/docs/en/overview) (terminal, IDE extensions, desktop app, or web) and [Codex mode](https://learn.chatgpt.com/docs/app) in the ChatGPT desktop app. These work directly in a folder you open for them: reading files, editing them in place, and running commands, with every consequential action gated by a permission system. Despite the name, code agents are not only for code: anything that lives in files (a course folder, a manuscript, a data export) is their territory.

| | Web chat | Working session | Code agent |
| --- | --- | --- | --- |
| You provide | Pasted text, uploads | A task and files or folder access | A folder on your machine |
| It produces | Text in the chat | Finished documents, sheets, decks | Edited files, run commands, verified results |
| Sees your files | Only what you paste or upload | Uploaded or permitted files | The folder you opened, on demand |
| Runs tools | No | Yes, mostly in the vendor's cloud | Yes, on your machine |
| Effort control | Limited | Model and effort selection on paid plans | Full effort dial |
| Best for | Questions, drafts, exploration | Deliverables from your materials | Heavy, multi-step, verifiable work |

## What a tool call is

A tool call is the model pausing text generation to request an action: read this file, run this command, search this folder. The interface executes the action (asking your permission where it matters), returns the result, and the model continues with that result in hand. That loop, repeated, is what makes an agent an agent.

<figure class="figure">
<svg viewBox="0 0 660 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The tool call loop: the model requests an action, the interface checks permission and runs the tool on your machine, and the result returns to the model">
<text x="330" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the tool call loop</text>
<rect x="30" y="60" width="150" height="60" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="105" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">model (cloud)</text>
<text x="105" y="103" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">decides what it needs</text>
<rect x="255" y="60" width="150" height="60" rx="8" fill="none" stroke="#ff8f00" stroke-width="2"/>
<text x="330" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">interface</text>
<text x="330" y="103" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">permission check</text>
<rect x="480" y="60" width="150" height="60" rx="8" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="555" y="85" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">tool (your machine)</text>
<text x="555" y="103" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">reads, converts, runs</text>
<defs><marker id="tc-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-default-fg-color--light)"/></marker></defs>
<line x1="180" y1="75" x2="253" y2="75" stroke="var(--md-default-fg-color--light)" stroke-width="1.6" marker-end="url(#tc-ar)"/>
<text x="216" y="68" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">"read chapter 3"</text>
<line x1="405" y1="75" x2="478" y2="75" stroke="var(--md-default-fg-color--light)" stroke-width="1.6" marker-end="url(#tc-ar)"/>
<text x="441" y="68" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">approved</text>
<path d="M 555 120 L 555 160 L 105 160 L 105 122" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1.6" marker-end="url(#tc-ar)"/>
<text x="330" y="153" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">result returns: only the 30 lines that matter enter the model's context</text>
<text x="330" y="188" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">generation pauses, the action runs, and the model continues with the result in hand</text>
</svg>
<figcaption>The permission check sits between the model's request and your machine; the rules are enforced by the interface, not by the model.</figcaption>
</figure>

## Why local tools save inference

Model output is the expensive part: every word a model generates is paid inference, whether by tokens or by your plan's usage limits. Tool calls move work off the meter in three ways.

**Deterministic work runs on your processor, not the model's.** Ask a chat interface to reformat a 40-page document and the model must regenerate every word of it as output. Ask a code agent and it writes a 30-line script; your computer does the conversion in a second, for free, perfectly. The model's output was 30 lines, not 40 pages. The same logic covers converting files, renaming figures, extracting tables, and running statistics: anything with a right answer a program can compute should be computed, not generated.

**The model reads what it needs, not what you have.** In chat, context is whatever you paste, usually whole documents. An agent searches the folder and reads the 30 relevant lines from each file. You get better answers ([context quality is the main lever](../basics/better-answers.md)) while consuming a fraction of the input budget.

**Verification is nearly free.** An agent that just edited a file can run the checker, read the one-line result, and fix what failed, in a loop, until the work is actually correct. Each round costs a command execution and a few lines of output rather than a full regeneration. This is why agent-produced work can arrive *verified*, which is the real difference between the tiers: chat gives you text that looks right, agents can give you work that was checked.

The practical rule: the heavier and more file-bound the task, the further right you should move in the table above. A question costs the same everywhere; a hundred-file revision is affordable only where tools are.

## Dialing effort

Both vendors now expose how hard the model thinks as a setting, and it is the most direct cost and quality lever you have. Claude Code offers effort levels low, medium, high (the default), xhigh, and max, plus a fast mode for quick turnarounds. The GPT-5.6 family exposes effort from none up to a new max setting on paid plans. Both ecosystems also added orchestration above a single agent: ChatGPT's ultra mode splits a task across parallel subagents, and Claude Code's ultracode setting has the model orchestrate multi-agent workflows.

The heuristic: default effort for routine work; drop effort (or use fast mode) for mechanical batch tasks where the steps are obvious; raise it only for the genuinely hard steps: architecture decisions, subtle debugging, analysis where a wrong answer is expensive. Effort applies per task, so one session can dial down for the cleanup and up for the hard part. Paying maximum reasoning for routine file renames is the agent-era version of leaving the lights on.

## The current lineups (July 2026)

Model names go stale faster than anything else on this page; treat these as a snapshot, check the [Benchmarks section](../benchmarks.md) for standings, and expect the interfaces to outlive the models in them.

- **Anthropic:** Claude Code and Cowork run the Claude family. Claude Fable 5 is the top model for the hardest, longest-running tasks (selected explicitly with `/model fable`; not the default). Claude Opus 4.8 is the default on Max and enterprise plans; Claude Sonnet 5 is the default on Pro.
- **OpenAI:** the ChatGPT app runs the GPT-5.6 family, three tiers under one generation: Sol (flagship), Terra (the everyday mid-tier), Luna (fastest and cheapest). Free and Go plans get Terra; Plus, Pro, Business, and Enterprise plans choose the tier and set the effort level.

## Equipping the machine

An agent is only as capable as the tools on the computer it works in. The pattern to know: **you do not need to guess what to install, because the agent will tell you.** Give it a task, and when it hits a missing tool it will name the exact package and the install command; install once and every future session benefits. A development task will have it request a compiler toolchain and software development kits; a document task will have it request the converters below.

This starter set covers most academic document work, and each item is something an agent can drive without you learning it:

| Tool | What it unlocks for the agent | Windows (winget) | Mac (brew) |
| --- | --- | --- | --- |
| LibreOffice | Convert Word, Excel, and PowerPoint files to PDF; open legacy formats; render documents so the agent can visually verify its own edits | `winget install TheDocumentFoundation.LibreOffice` | `brew install --cask libreoffice` |
| Poppler | Read and render PDF pages, extract text | `winget install oschwartz10612.Poppler` | `brew install poppler` |
| Pandoc | Convert between document formats (Markdown, Word, HTML) | `winget install JohnMacFarlane.Pandoc` | `brew install pandoc` |
| Python | Data work, scripting, document surgery | `winget install Python.Python.3.13` | ships with tools agents install |
| Node.js | Generate Word and PowerPoint files programmatically; web tooling | `winget install OpenJS.NodeJS.LTS` | `brew install node` |
| Tesseract (optional) | Read scanned documents (optical character recognition) | `winget install UB-Mannheim.TesseractOCR` | `brew install tesseract` |
| ImageMagick (optional) | Convert and resize images in bulk | `winget install ImageMagick.ImageMagick` | `brew install imagemagick` |

All commands verified July 2026 (winget ships with Windows 11; [Homebrew](https://brew.sh) is the Mac equivalent). After installing, restart the terminal or app so the new tools are visible. On university-managed machines, software installation may require information technology involvement; the toolkit works identically on personal machines.

## The rules ride along

The interface changes what a model can do, never what you may give it: the [AI Responsible Use Policy](../governance/policy.md)'s data rules apply identically in chat, sessions, and agents, and an agent with file access makes them easier to violate by accident, so open folders deliberately. The permission systems are real but bounded: consequential actions prompt for approval, and the rules are enforced by the interface software rather than by the model's judgment. Grant access to the folder the task needs, not your whole disk. For the fuller risk picture (consequential actions, prompt injection, and the guardrails for each), see the [AI Agents guide](agents.md), and for what these agents are and who makes them, the same page has the field guide.
