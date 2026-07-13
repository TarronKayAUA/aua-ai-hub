---
last_reviewed: 2026-07-13
---

# Standing Setups: Assistants that Remember

[Getting Better Answers](../basics/better-answers.md) explains the three levers that decide output quality: context, memory, and standing instructions. This page is about making the third lever permanent. If you find yourself re-explaining your course, your project, or your preferences at the start of every conversation, you are doing setup work that the tools are designed to hold for you. Set it up once, and every future session starts already knowing your job.

## The three containers

| Container | Where it lives | What persists | Best for |
| --- | --- | --- | --- |
| Claude Project | claude.ai (all plans; free accounts get five) | Per-project instructions, an uploaded knowledge base, and a separate per-project memory | A course, a manuscript, a committee: any body of work with stable materials |
| ChatGPT Project | ChatGPT app and web | Project instructions, uploaded sources, and the project's chats (including ChatGPT Work sessions) | The same jobs, on the OpenAI side |
| Folder brief | A markdown file in a folder an agent works in (`CLAUDE.md` for Claude Code, `AGENTS.md` for Codex) | Standing rules the agent reads before any work in that folder | Recurring agent work on the same files |

The common idea: **instructions plus materials, attached to the work instead of the conversation.** A project's instructions apply to every chat inside it, and its uploaded knowledge is available without re-uploading. Claude keeps each project's memory separate from your other work; on the OpenAI side, note that context does not automatically flow between chats unless it is in the project's sources, and OpenAI's own guidance is to keep rules that must always apply in the instructions file rather than relying on automatic memory: "Treat memories as a helpful recall layer, not as the only source for rules that must always apply."

## Worked pattern: a course assistant

The highest-value standing setup for faculty is one project per course:

1. **Create the project** and name it for the course.
2. **Upload the knowledge**: syllabus, learning objectives, the session schedule, your reading list, and any handouts you would give a student. Only material you would hand to any student belongs here: no rosters, no grades, no individual student work (the [policy](../governance/policy.md)'s data rules apply to knowledge bases exactly as to chat messages).
3. **Write the instructions**, which are just a standing version of a good prompt: who the assistant is (a teaching assistant for this specific course and level), what it answers from (the uploaded materials first, citing the section it drew on), and your standing rules (US English, the course's terminology, "say so when the materials do not cover a question rather than guessing").
4. **Use it all term.** Draft announcements, generate practice questions against the actual objectives, and check whether a planned session duplicates an earlier one, all without re-explaining the course once.

Students can run the same pattern in reverse: a project per course, lecture notes and syllabus as knowledge, and the [NBME-style question tutor](../prompts/index.md) from the prompt library pasted in as the project instructions. That combination, a reviewed prompt plus your own materials in a standing container, is the single best study setup this site can recommend.

The same shape serves research: one project per manuscript or study, with your appraised paper set as knowledge (the [literature review playbook](../playbooks/literature-reviews.md)'s synthesis step, made permanent) and the project instructions carrying your reporting guideline and journal target.

## Folder briefs: standing instructions for agents

Agent interfaces have their own version, and it is just a text file. Claude Code reads `CLAUDE.md` files (personal ones in your home directory apply everywhere; a `CLAUDE.md` in the folder applies to work there), and Codex reads `AGENTS.md` files the same way, layered from global to folder, before doing any work. What belongs in one is what you would otherwise repeat: where things are, what conventions to follow, the "always do X" rules. Two practical notes from the vendors' own guidance: Claude Code can generate a starting brief for you (run `/init` in a folder and it drafts one from what it finds), and keep the file short, since the docs recommend under 200 lines; a brief the length of a policy manual stops being read carefully, by models as by people.

The heuristic for what to add: **when the agent makes the same mistake twice, or you type the same correction twice, that correction belongs in the brief.** Standing setups are how one-time feedback becomes permanent behavior.

## Guardrails

- A knowledge base is an upload: everything the [policy](../governance/policy.md) says about data applies. Course materials you would give any student are fine; anything identifiable about individual students or patients is not, in a project or anywhere else.
- Instructions are advice to the model, not enforcement. A project instructed to answer only from its knowledge will still occasionally reach beyond it; spot-check citations against the uploaded materials, especially early on.
- Projects accumulate. Review a long-lived project's knowledge each term; a stale syllabus in the knowledge base produces confidently outdated answers, which is worse than no assistant at all.
