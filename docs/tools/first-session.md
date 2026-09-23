---
last_reviewed: 2026-09-01
---

# Your First Agent Session

<span class="meta-chip">About 20 minutes</span> <span class="meta-note">Works with Claude Code or Codex in the ChatGPT desktop app</span>

[Choosing Your Interface](interfaces.md) explains why agents change what artificial intelligence (AI) can do for you; this page has you run one, once, on a folder that cannot be hurt. By the end you will have watched a model read files, ask your permission, run a tool, and hand back work with evidence you can check, and you will know which settings to change and which to leave alone.

## Before you start

- Install an agent: the [Claude Code desktop app](https://claude.com/product/claude-code) or the [ChatGPT desktop app](https://learn.chatgpt.com/docs/app) (Codex is a mode inside it). Codex is included with every ChatGPT plan, including Free; Claude Code needs a paid Claude plan (Pro or above), so take the ChatGPT route if you have no subscription.
- Optional but worthwhile: the [local toolkit](interfaces.md#equipping-the-machine), so document conversion works when you get ambitious later.

## The walkthrough

<figure class="figure figure--html hf">
<p class="hf-title">Twenty minutes, five beats</p>
<ol class="hf-steps">
<li class="hf-box hf-box--ok"><p class="hf-box-title">A folder</p><p class="hf-box-sub">of copies, never originals</p></li>
<li class="hf-box"><p class="hf-box-title">One real task</p><p class="hf-box-sub">a deliverable, not a question</p></li>
<li class="hf-box hf-box--warn"><p class="hf-box-title">The prompts</p><p class="hf-box-sub">read each one; you are the gate</p></li>
<li class="hf-box"><p class="hf-box-title">The loop</p><p class="hf-box-sub">read, write, check, continue</p></li>
<li class="hf-box hf-box--filled"><p class="hf-box-title">You review the output, yourself</p></li>
</ol>
<p class="hf-legend">Green: your safety net. Amber: your control. Filled: your judgment.</p>
<p class="hf-note">The beats repeat for every new kind of task, not just the first one ever.</p>
<figcaption>Copies, a task, the gate, the loop, and your own eyes on the result.</figcaption>
</figure>

1. **Make a practice folder of copies.** Create a folder on your desktop and copy four or five course readings or papers into it (PDFs are perfect). Copies, not originals: your first session should be one where no mistake matters.
2. **Open the agent in that folder.** In Claude Code, open the folder; in the ChatGPT app, switch to Codex and open the folder as a local project. That folder is now the agent's whole world: by default it works there and asks before going beyond it.
3. **Give it a real task.** Paste this, or your own version:

    > Read the documents in this folder. Create a file called summary-table.md with one row per document: title, source and year, a five-sentence summary, and the three points most worth teaching from it. Tell me which document was hardest to read and why.

4. **Watch the permission prompts, and read them.** In Claude Code, reading files inside the folder you opened generally will not prompt, but the moment the agent wants to *write* the new file, it asks. Codex's default mode gives the agent more room: it edits inside the folder without asking and prompts before it reaches the internet or anything outside the folder, so you may see no prompt at this step. This is the habit to build on day one: the prompt tells you exactly what the agent wants to do, and you are the gate. Approve what matches your request; deny anything that surprises you, and ask the agent why it wanted it.
5. **Watch the loop.** The agent reads each file (tool call), builds the table (generation), writes the file (tool call), and typically re-reads its own output to check it (tool call again). That loop (act, check, continue) is what separates an agent from a chat window.
6. **Iterate like it is a conversation, because it is.** "Add a column rating each paper's difficulty for second-year students." The agent edits the file it already made; nothing is regenerated from scratch.
7. **Review the work.** Open summary-table.md yourself. Agents make verification cheap, and the habit of looking at what actually changed is what makes them safe.

If the agent says a tool is missing, it will name exactly what to install; that is normal, and it is how your machine gets [equipped](interfaces.md#equipping-the-machine) over time. Newly installed tools need the app restarted before the agent can see them.

## The settings that matter

Both agents have a settings surface worth five minutes of your attention. Everything below was checked against the vendors' documentation in September 2026; treat exact names as subject to drift.

### Claude Code

- **Permission mode** is the big one. *Manual* (the default) prompts on first use of each tool: right for your first sessions and for unfamiliar folders. *Plan* has Claude read and explore but not change files: the look-before-touching mode, ideal for "tell me what you would do." *Accept edits* auto-approves file edits in the working folder once you trust the workflow: right for repetitive editing sessions. *Auto* approves tool calls with background safety checks that verify actions match your request: the convenience mode for work you would approve anyway. *Bypass permissions* skips prompting entirely, and Anthropic's own docs restrict it to isolated environments like containers or virtual machines; on a machine you care about, treat it as off-limits.
- **Effort** (the `/effort` command) sets how hard the model reasons, from low to max; the default is high on most models, but Opus 5.5, Claude Code's default model since September 2026, starts at medium. Drop to low for mechanical batch work (renaming, reformatting, applying a known fix everywhere); the work gets faster and cheaper with no quality loss where no judgment is needed. The max level removes reasoning constraints for a single session, and the docs are candid that it "may show diminishing returns and is prone to overthinking": reserve it for genuinely hard problems, not as a default. For one hard question inside an ordinary session, including the word "ultrathink" in a prompt requests deeper reasoning for that turn only.
- **Ultracode** (also under `/effort`) is a different kind of setting: it combines the xhigh reasoning level with dynamic multi-agent workflows, so substantive tasks get planned and fanned out across parallel subagents. The trade-off is the same in both directions: markedly more thorough on large, decomposable work (audits, sweeps, many-file changes), and markedly more time and token spend. Session-only by design; turn it on for the big task, not for the afternoon.
- **Fast mode** (`/fast`) makes Opus up to 2.5 times faster at a higher cost per token, billed through usage credits rather than your subscription's included limits. Worth it for interactive back-and-forth where you are waiting on each response; wrong for long autonomous tasks where you are not watching. If you use it, enable it at the start of a session (first enablement mid-conversation charges the fast rate for the whole existing context).
- **A folder brief** (`CLAUDE.md`) makes your preferences permanent; run `/init` and Claude drafts one from what it finds in the folder. See [Standing Setups](standing-setups.md).

### Codex (ChatGPT desktop app)

- **Permission mode**: *Ask for approval* (the default) lets Codex read and edit within the workspace and run routine commands, asking before it touches the internet or anything beyond the folder. *Approve for me* has ChatGPT auto-review requests and only surface the ones it flags, and OpenAI's docs note the auto-reviewer can make mistakes. *Full access* removes approvals entirely, and the docs attach an explicit warning about data loss and leaks: same verdict as bypass mode above, not for a machine you care about.
- **Model and effort** live on one slider: Sol, Terra, or Luna, each from light effort up through max, with *Ultra* above them all. On paid plans, the documented default pairing is Sol at medium effort (Free and Go plans run Terra, so the model choice does not appear there), and the docs' own advice matches this page's: start at the default and increase only when a task visibly needs deeper planning.
- **Ultra mode** is the Codex counterpart of ultracode: it splits large tasks across parallel subagents and synthesizes the results. Same trade, same advice; OpenAI's docs say it plainly: "Most tasks do not need Max or Ultra." (If Ultra is missing from your slider, it enables under Settings, then Configuration.)
- **A folder brief** (`AGENTS.md`) is read before any work begins, layered from a global file down to per-folder ones. See [Standing Setups](standing-setups.md).

### The starting posture

This site's recommendation, stated as a table so you can disagree with it precisely:

| Setting | Start with | Graduate to | Never (on a machine you care about) |
| --- | --- | --- | --- |
| Permissions | Manual / Ask for approval, with Plan mode (Claude Code) at any stage for a look before touching | Accept edits, Auto, or Approve for me once a workflow has earned trust | Bypass permissions / Full access |
| Effort | The default | Low for mechanical batches; xhigh or max for the genuinely hard step | Max as an always-on default |
| Orchestration (ultracode / Ultra) | Off | On for large, decomposable tasks, accepting the time and token cost | On for routine questions |
| Folder access | One task-specific folder | Additional folders added deliberately | Your whole home directory or disk |

<figure class="figure figure--html hf">
<p class="hf-title">Permissions: a ladder you climb per workflow, not a dial you set once</p>
<div class="hf-box hf-box--dashed hf-box--aside"><p>Plan mode: read and propose, change nothing; useful at every rung.</p></div>
<div class="hf-flow">
<div class="hf-box hf-box--ok">
<p class="hf-box-title">Ask first</p>
<p class="hf-box-sub">Manual: Ask for approval</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p class="hf-box-title">Edits flow</p>
<p class="hf-box-sub">Accept edits, for a workflow that has earned it</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p class="hf-box-title">Checked autonomy</p>
<p class="hf-box-sub">Auto: Approve for me. A reviewer surfaces only what it flags, and it can be wrong: keep reading the surprises.</p>
</div>
<span class="hf-wall"><span class="hf-sr">A wall, not a rung:</span></span>
<div class="hf-box hf-box--stop">
<p class="hf-box-title">Bypass, Full access</p>
<p class="hf-box-sub">isolated machines only, never one you care about</p>
</div>
</div>
<p class="hf-note">Every new kind of task starts back at ask first; the ladder is climbed by workflows, not by people.</p>
<figcaption>Trust is granted to a proven workflow, one rung at a time, and the wall on the right is not a rung.</figcaption>
</figure>

## Guardrails

The agent's folder boundary is your main control: open the folder the task needs, nothing wider. The [AI Responsible Use Policy](../governance/policy.md)'s data rules apply to every file in that folder, because the agent may read any of it; a folder containing a student roster is a folder an agent should not be working in. And keep the first-session rule for every *new kind* of task, not just the first one ever: copies first, originals after the workflow has earned it. The [AI Agents guide](agents.md) covers the fuller risk model, including prompt injection, once you are running sessions routinely.

**Next:** [Standing Setups](standing-setups.md), so the assistant keeps your context between sessions.
