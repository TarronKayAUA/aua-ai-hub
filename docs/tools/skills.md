---
last_reviewed: 2026-09-01
---

# Skills: Giving an Agent a Playbook

<span class="meta-chip">For everyone</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">The most useful part of this page needs no setup at all</span>

[Standing Setups](standing-setups.md) covers the containers that hold instructions for one body of work: a project for a course, a folder brief for a set of files. A **skill** is the next thing along. It is a small folder of instructions, sometimes with code attached, that teaches an artificial intelligence (AI) assistant how to carry out one kind of task, and it applies wherever you work rather than inside a single project.

The most useful part of this page is short: you already have four skills, usually already switched on, and most people do not know what they can do. The rest covers where other skills come from, how to judge one before installing it, and how to write your own.

## What a skill actually is

A skill is a folder containing a file of instructions, and optionally scripts the assistant can run. The assistant reads the short description of every installed skill at all times, and when a task looks like a match, it reads the full instructions and follows them.

That last part is what makes skills useful, and it is also the thing to understand before installing one someone else wrote.

A skill works more like installed software than like advice. When you read a document, you decide what to do with it. When an assistant loads a skill, it follows the skill's instructions without asking you again, and any code bundled with the skill runs with the access you have already granted: your files, your folders, and any tools that assistant can reach. Installing a skill is therefore a decision to trust its author, the same decision you make when installing any program.

## The four you already have

These are written and maintained by Anthropic and come with claude.ai and Cowork, with nothing to install. They need file creation switched on, which is the default on most personal accounts; if you get text instead of a file, see [Switching file creation on](#switching-file-creation-on) below. Most of what faculty and staff need from skills is already here.

<!-- render:skills -->

Capabilities in that table that people routinely miss: text recognition on a **scanned** PDF so it becomes searchable and quotable, filling in a PDF form, pulling the speaker notes out of a deck you inherited, and cleaning up an exported spreadsheet whose headers landed in the wrong rows.

The four document skills are available in claude.ai and Cowork, and Anthropic's help center says skills are also available in Claude Code; check the skill list there before assuming a particular one is installed.

### Switching file creation on

If you ask for a document and get text in the chat instead of a file, the setting is off. On a personal Free, Pro, or Max account, open **Settings**, then **Capabilities**, and turn on code execution and file creation. On a Team or Enterprise account, an administrator enables it in **Organization settings**, under **Skills**. Custom skills you add yourself live under **Customize**, then **Skills**.

## Skills from open directories

Anyone can write a skill and publish it. The largest public directory, skills.sh, is operated by Vercel and indexed roughly ten thousand ranked skills from more than two thousand authors when this page was checked in August 2026. Skills appear there automatically once anyone installs them: there is no application, no identity check, and no editorial review. The directory runs automated security scans, but by its own rules a skill is removed only if it fails **every** scanning partner, so a skill flagged as critical risk by one scanner can and does remain listed. The site says so itself: it cannot guarantee the quality or security of every skill listed.

Three things can go wrong, and none of them looks alarming while it is happening:

- **The skill does something other than what it says.** Instructions you did not read can tell the assistant to open files you did not mean to share, or to send them somewhere. Nothing on screen has to look unusual.
- **A skill that was safe stops being safe.** Skills that pull instructions from a website inherit whatever that website says later. An author's account can change hands. What you audited in March is not necessarily what runs in November.
- **The advice is confidently wrong for medicine.** This is the one most likely to affect us. A skill for clinical documentation or exam writing, written by someone with no medical education background, can encode wrong practice in fluent, professional language, and the assistant will follow it without hesitation.

Install counts, star ratings, and leaderboard positions show how many people tried a skill. They do not show whether it is correct or suits medical education, and tools that recommend skills by popularity rank the same signal, so treat a ranking as a reason to look at a skill, not as a reason to install it.

## What to do

Anthropic's own security guidance for skills is short:

> Use Skills only from trusted sources: those you created yourself or obtained from Anthropic.

Its documentation adds that a skill from any other source should be audited thoroughly before use, because a skill written to misbehave can direct the assistant to send data elsewhere or reach parts of the system you did not intend.

Translated into practice:

1. **Start with the built-in skills.** They cover document work, which is most of what this audience needs, with nothing to install.
2. **If you need more, take it from Anthropic's own published skills**, listed in the table above. You are choosing a known author, and you can read what you are installing.
3. **Read a skill from an open directory before installing it.** Its instruction file is plain text: if you can follow what it tells the assistant to do, and what any bundled scripts do, you can judge it as you would any program. Browsing a directory is a good way to find ideas.
4. **Try a new skill on ordinary files first.** A skill runs with whatever file access you gave the assistant, so the [AI Responsible Use Policy](../governance/policy.md#responsible-use)'s data rules apply to everything it can reach, as they do to anything you paste. A first run on ordinary files shows you what the skill actually does before you rely on it for real work.

The AI Committee has not taken a position on skills, and no skill has been through the [tool review process](../governance/review-process.md); the suggestions above come from the vendor's documentation and the policy's data rules. If you find or write a skill colleagues would benefit from, share it along with where it came from, so each person can judge it for themselves, and tell the [AI Committee](../governance/committee.md) too, so it can be weighed for this page.

## Writing your own

Often the best way to get a skill that fits AUA is to write one: you know exactly what it tells the assistant, and it encodes your own practice rather than someone else's. Anthropic publishes a skill-creator skill for exactly this, and the format is an open standard used by several vendors, so a skill written here is portable rather than tied to one product.

Two practical limits are worth knowing before you invest effort. On personal accounts, custom skills are **per user**: each person uploads their own copy, and there is no central update or withdrawal. On Team and Enterprise accounts, an administrator can provision a skill for the whole organization from Organization settings, which is the route an institution would use. And custom skills **do not follow you between products**: one uploaded to claude.ai is not available in Claude Code, and the reverse.

For most teaching tasks, a well-written entry in the [prompt library](../prompts/index.md) does the same job with none of that overhead. Reach for a skill when the task is genuinely repetitive, has a fixed procedure worth encoding, and recurs often enough to be worth maintaining.

**Back to:** the [AI Literacy Pathway](../pathway/index.md); this page is the last step of its agent stage.
