---
last_reviewed: 2026-07-13
---

# Your First Agent Session

**About 20 minutes · works with Claude Code or Codex in the ChatGPT desktop app**

[Choosing Your Interface](interfaces.md) explains why agents change what artificial intelligence (AI) can do for you; this page has you run one, once, on a folder that cannot be hurt. By the end you will have watched a model read files, ask your permission, run a tool, and hand back verified work, and you will know which settings to change and which to leave alone.

## Before you start

- Install an agent: the [Claude Code desktop app](https://claude.com/claude-code) or the [ChatGPT desktop app](https://learn.chatgpt.com/docs/app) (Codex is a mode inside it). Both offer free tiers sufficient for this walkthrough.
- Optional but worthwhile: the [local toolkit](interfaces.md#equipping-the-machine), so document conversion works when you get ambitious later.

## The walkthrough

<figure class="figure">
<svg viewBox="0 0 660 175" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The first session in five beats: a folder of copies, one real task, permission prompts you actually read, the agent's work loop, and your own review of the output">
<defs><marker id="fs-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">twenty minutes, five beats</text>
<rect x="20" y="40" width="112" height="66" rx="7" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="76" y="62" text-anchor="middle" font-size="9.5" font-weight="bold" fill="var(--md-typeset-color)">a folder</text>
<text x="76" y="78" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">of copies,</text>
<text x="76" y="92" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">never originals</text>
<line x1="134" y1="73" x2="150" y2="73" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#fs-ar)"/>
<rect x="153" y="40" width="112" height="66" rx="7" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="209" y="62" text-anchor="middle" font-size="9.5" font-weight="bold" fill="var(--md-typeset-color)">one real task</text>
<text x="209" y="78" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">a deliverable,</text>
<text x="209" y="92" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">not a question</text>
<line x1="267" y1="73" x2="283" y2="73" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#fs-ar)"/>
<rect x="286" y="40" width="112" height="66" rx="7" fill="none" stroke="#ff8f00" stroke-width="2"/>
<text x="342" y="62" text-anchor="middle" font-size="9.5" font-weight="bold" fill="var(--md-typeset-color)">the prompts</text>
<text x="342" y="78" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">read each one;</text>
<text x="342" y="92" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">you are the gate</text>
<line x1="400" y1="73" x2="416" y2="73" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#fs-ar)"/>
<rect x="419" y="40" width="112" height="66" rx="7" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="475" y="62" text-anchor="middle" font-size="9.5" font-weight="bold" fill="var(--md-typeset-color)">the loop</text>
<text x="475" y="78" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">read, write, check,</text>
<text x="475" y="92" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">continue</text>
<line x1="533" y1="73" x2="549" y2="73" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#fs-ar)"/>
<rect x="552" y="40" width="88" height="66" rx="7" fill="var(--md-primary-fg-color)"/>
<text x="596" y="66" text-anchor="middle" font-size="9.5" font-weight="bold" fill="#ffffff">you review</text>
<text x="596" y="82" text-anchor="middle" font-size="9" fill="#ffffff">the output,</text>
<text x="596" y="95" text-anchor="middle" font-size="9" fill="#ffffff">yourself</text>
<text x="330" y="136" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">green: your safety net · amber: your control · filled: your judgment</text>
<text x="330" y="158" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">the beats repeat for every new kind of task, not just the first one ever</text>
</svg>
<figcaption>Copies, a task, the gate, the loop, and your own eyes on the result.</figcaption>
</figure>

1. **Make a practice folder of copies.** Create a folder on your desktop and copy four or five course readings or papers into it (PDFs are perfect). Copies, not originals: your first session should be one where no mistake matters.
2. **Open the agent in that folder.** In Claude Code, open the folder; in the ChatGPT app, switch to Codex and open the folder as a local project. That folder is now the agent's whole world: by default it works there and asks before going beyond it.
3. **Give it a real task.** Paste this, or your own version:

    > Read the documents in this folder. Create a file called summary-table.md with one row per document: title, source and year, a five-sentence summary, and the three points most worth teaching from it. Tell me which document was hardest to read and why.

4. **Watch the permission prompts, and read them.** Reading files inside the folder you opened generally will not prompt; the moment the agent wants to *write* the new file, it asks. This is the habit to build on day one: the prompt tells you exactly what the agent wants to do, and you are the gate. Approve what matches your request; deny anything that surprises you, and ask the agent why it wanted it.
5. **Watch the loop.** The agent reads each file (tool call), builds the table (generation), writes the file (tool call), and typically re-reads its own output to check it (tool call again). That loop, act, check, continue, is the thing chat interfaces cannot do.
6. **Iterate like it is a conversation, because it is.** "Add a column rating each paper's difficulty for second-year students." The agent edits the file it already made; nothing is regenerated from scratch.
7. **Review the work.** Open summary-table.md yourself. Agents make verification cheap, and the habit of looking at what actually changed is what makes them safe.

If the agent says a tool is missing, it will name exactly what to install; that is normal, and it is how your machine gets [equipped](interfaces.md#equipping-the-machine) over time. Newly installed tools need the app restarted before the agent can see them.

## The settings that matter

Both agents have a settings surface worth five minutes of your attention. Everything below is verified against the vendors' documentation as of July 2026; treat exact names as subject to drift.

### Claude Code

- **Permission mode** is the big one. *Manual* (the default) prompts on first use of each tool: right for your first sessions and for unfamiliar folders. *Plan* has Claude read and explore but not change files: the look-before-touching mode, ideal for "tell me what you would do." *Accept edits* auto-approves file edits in the working folder once you trust the workflow: right for repetitive editing sessions. *Auto* approves tool calls with background safety checks that verify actions match your request: the convenience mode for work you would approve anyway. *Bypass permissions* skips prompting entirely, and Anthropic's own docs restrict it to isolated environments like containers or virtual machines; on a machine you care about, treat it as off-limits.
- **Effort** (the `/effort` command) sets how hard the model reasons, from low to max; the default is high. Drop to low for mechanical batch work (renaming, reformatting, applying a known fix everywhere); the work gets faster and cheaper with no quality loss where no judgment is needed. The max level removes reasoning constraints for a single session, and the docs are candid that it "may show diminishing returns and is prone to overthinking": reserve it for genuinely hard problems, not as a default. For one hard question inside an ordinary session, including the word "ultrathink" in a prompt requests deeper reasoning for that turn only.
- **Ultracode** (also under `/effort`) is a different kind of setting: it combines the xhigh reasoning level with dynamic multi-agent workflows, so substantive tasks get planned and fanned out across parallel subagents. The trade-off is the same in both directions: markedly more thorough on large, decomposable work (audits, sweeps, many-file changes), and markedly more time and token spend. Session-only by design; turn it on for the big task, not for the afternoon.
- **Fast mode** (`/fast`) makes Opus up to 2.5 times faster at a higher cost per token, billed through usage credits rather than your subscription's included limits. Worth it for interactive back-and-forth where you are waiting on each response; wrong for long autonomous tasks where you are not watching. If you use it, enable it at the start of a session (first enablement mid-conversation charges the fast rate for the whole existing context).
- **A folder brief** (`CLAUDE.md`) makes your preferences permanent; run `/init` and Claude drafts one from what it finds in the folder. See [Standing Setups](standing-setups.md).

### Codex (ChatGPT desktop app)

- **Permission mode**: *Ask for approval* (the default) lets Codex read and edit within the workspace and run routine commands, asking before it touches the internet or anything beyond the folder. *Approve for me* has ChatGPT auto-review requests and only surface the ones it flags, and OpenAI's docs note the auto-reviewer can make mistakes. *Full access* removes approvals entirely, and the docs attach an explicit warning about data loss and leaks: same verdict as bypass mode above, not for a machine you care about.
- **Model and effort** live on one slider: Sol, Terra, or Luna, each from light effort up through max, with *Ultra* above them all. The documented default pairing is Sol at medium effort, and the docs' own advice matches this page's: start at the default and increase only when a task visibly needs deeper planning.
- **Ultra mode** is the Codex counterpart of ultracode: it splits large tasks across parallel subagents and synthesizes the results. Same trade, same advice; OpenAI's docs say it plainly: "Most tasks do not need Max or Ultra." (If Ultra is missing from your slider, it enables under Settings, then Configuration.)
- **A folder brief** (`AGENTS.md`) is read before any work begins, layered from a global file down to per-folder ones. See [Standing Setups](standing-setups.md).

### The starting posture

This site's recommendation, stated as a table so you can disagree with it precisely:

| Setting | Start with | Graduate to | Never (on a machine you care about) |
| --- | --- | --- | --- |
| Permissions | Manual / Ask for approval | Plan for exploration; Accept edits or Auto once a workflow has earned trust | Bypass permissions / Full access |
| Effort | The default | Low for mechanical batches; xhigh or max for the genuinely hard step | Max as an always-on default |
| Orchestration (ultracode / Ultra) | Off | On for large, decomposable tasks, accepting the time and token cost | On for routine questions |
| Folder access | One task-specific folder | Additional folders added deliberately | Your whole home directory or disk |

## Guardrails

The agent's folder boundary is your main control: open the folder the task needs, nothing wider. The [policy](../governance/policy.md)'s data rules apply to every file in that folder, because the agent may read any of it; a folder containing a student roster is a folder an agent should not be working in. And keep the first-session rule for every *new kind* of task, not just the first one ever: copies first, originals after the workflow has earned it. The [AI Agents guide](agents.md) covers the fuller risk model, including prompt injection, once you are running sessions routinely.
