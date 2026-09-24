---
last_reviewed: 2026-09-01
---

# Standing Setups: Assistants that Remember

<span class="meta-chip">For everyone</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">Longer if you build your first project as you read</span>

[Getting Better Answers](../basics/better-answers.md) explains the three levers that decide output quality: context, memory, and standing instructions. This page is about making the third lever permanent. If you find yourself re-explaining your course, your project, or your preferences at the start of every conversation, you are doing setup work that the tools are designed to hold for you. Set it up once, and every future session starts already knowing your job.

## The three containers

| Container | Where it lives | What persists | Best for |
| --- | --- | --- | --- |
| Claude Project | claude.ai (all plans; free accounts get five) | Per-project instructions, an uploaded knowledge base, and a separate per-project memory | A course, a manuscript, a committee: any body of work with stable materials |
| ChatGPT Project | ChatGPT app and web | Project instructions, uploaded sources, and the project's chats (including ChatGPT Work sessions) | The same jobs, on the OpenAI side |
| Folder brief | A markdown file in a folder an agent works in (`CLAUDE.md` for Claude Code, `AGENTS.md` for Codex) | Standing rules the agent reads before any work in that folder | Recurring agent work on the same files |

The common idea: **instructions plus materials, attached to the work instead of the conversation.** A project's instructions apply to every chat inside it, and its uploaded knowledge is available without re-uploading.

There is a fourth container worth knowing about, and it works the other way around: a [skill](skills.md) attaches instructions to a *kind of task* rather than to one body of work, so it applies wherever you are. If you use claude.ai or Cowork, four of them are already available to you, and that page also covers how to judge a skill someone else wrote. A per-course [Gemini Notebook](gemini-notebook.md) is the same pattern for source-grounded questions: your lectures uploaded once, answered from with citations all term.

<figure class="figure figure--html hf">
<p class="hf-title">Anatomy of a standing setup</p>
<div class="hf-frame">
<p class="hf-frame-title">The container: a project, or a folder with a brief</p>
<div class="hf-chips">
<span class="hf-chip hf-chip--filled">Instructions<small>who it is, your rules, what to answer from</small></span>
<span class="hf-chip hf-chip--filled">Knowledge<small>syllabus, objectives, papers, materials you would hand out</small></span>
</div>
<div class="hf-chips hf-chips--below">
<span class="hf-chip">Monday's chat<small>starts already briefed</small></span>
<span class="hf-chip">Next week's chat<small>same instructions, same knowledge</small></span>
<span class="hf-chip">Week ten's chat<small>still nothing re-explained</small></span>
</div>
</div>
<p class="hf-note">Set up once; every conversation inside inherits both boxes above it.</p>
<figcaption>The container holds what you would otherwise repeat; the chats just use it.</figcaption>
</figure>

Claude keeps each project's memory separate from your other work. In ChatGPT, do not count on context carrying from one chat to the next unless it is in the project's sources. OpenAI's own guidance is to put rules that must always apply in the instructions rather than relying on automatic memory: "Treat memories as a helpful recall layer, not as the only source for rules that must always apply."

## Worked pattern: a course assistant

The highest-value standing setup for faculty is one project per course:

1. **Create the project** and name it for the course.
2. **Upload the knowledge**: syllabus, learning objectives, the session schedule, your reading list, and any handouts you would give a student. Rosters, grades, and individual student work are student education records, which a course assistant has no use for, and identifiable patient details are protected health information (PHI); the [AI Responsible Use Policy](../governance/policy.md#responsible-use) keeps both out of publicly available AI tools unless a tool has been approved for them.
3. **Write the instructions**, which are just a standing version of a good prompt: who the assistant is (a teaching assistant for this specific course and level), what it answers from (the uploaded materials first, citing the section it drew on), and your standing rules (US English, the course's terminology, "say so when the materials do not cover a question rather than guessing").
4. **Use it all term.** Draft announcements, generate practice questions against the actual objectives, and check whether a planned session duplicates an earlier one, all without re-explaining the course once.

Students can run the same pattern in reverse: a project per course, lecture notes and syllabus as knowledge, and the [National Board of Medical Examiners (NBME)-style question tutor](../prompts/index.md#nbme-style-question-tutor) from the prompt library pasted in as the project instructions. That combination, a reviewed prompt plus your own materials in a standing container, is the study setup this site recommends.

The same shape serves research: one project per manuscript or study, with your appraised paper set as knowledge (the [literature review playbook](../playbooks/literature-reviews.md)'s synthesis step, made permanent) and the project instructions carrying your reporting guideline and journal target.

## Folder briefs: standing instructions for agents

Agent interfaces have their own version, and it is just a text file. Claude Code reads `CLAUDE.md` files (a personal one in the `.claude` folder of your home directory applies everywhere; a `CLAUDE.md` in the working folder applies to work there), and Codex reads `AGENTS.md` files the same way (a global one in the `.codex` folder of your home directory, then per-folder ones), before doing any work. What belongs in one is what you would otherwise repeat: where things are, what conventions to follow, the "always do X" rules. Two practical notes from Anthropic's guidance: Claude Code can draft a starting brief for you (run `/init` in a folder and it drafts one from what it finds), and the brief should stay short, since the docs recommend under 200 lines; a brief the length of a policy manual stops being read carefully, by models as by people.

The heuristic for what to add: **when the agent makes the same mistake twice, or you type the same correction twice, that correction belongs in the brief.** Standing setups are how one-time feedback becomes permanent behavior.

<figure class="figure figure--html hf">
<p class="hf-title">How folder briefs layer</p>
<div class="hf-flow">
<div class="hf-box hf-box--plain">
<p class="hf-box-title">Your personal brief</p>
<p class="hf-box-sub">.claude or .codex folder: the defaults that apply to all your work</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p class="hf-box-title">The folder's brief</p>
<p class="hf-box-sub">CLAUDE.md or AGENTS.md: this project's rules, on top</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--filled">
<p class="hf-box-title">The session</p>
<p class="hf-box-sub">the agent reads both briefs, global to folder, before any work</p>
</div>
</div>
<p class="hf-return">The same correction twice becomes a line in the folder's brief.</p>
<p class="hf-note">The personal brief carries your voice everywhere; the folder's brief speaks for the project.</p>
<figcaption>Layered, not merged: the broad rules travel with you, the specific ones live with the work, and repeated feedback flows back in.</figcaption>
</figure>

## Keeping a setup accurate

- Instructions are advice to the model, not enforcement. A project instructed to answer only from its knowledge will still occasionally reach beyond it; spot-check citations against the uploaded materials, especially early on.
- Projects accumulate. Review a long-lived project's knowledge each term; a stale syllabus in the knowledge base produces confidently outdated answers, which is worse than no assistant at all.

**Next:** [Agent Skills](skills.md), the last step of the pathway's agent stage.
