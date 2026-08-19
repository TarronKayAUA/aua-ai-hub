---
last_reviewed: 2026-08-19
---

# Skills: Giving an Agent a Playbook

<span class="meta-chip">For everyone</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">The most useful part of this page needs no setup at all</span>

[Standing Setups](standing-setups.md) covers the containers that hold instructions for one body of work: a project for a course, a folder brief for a set of files. A **skill** is the next thing along. It is a small folder of instructions, sometimes with code attached, that teaches an assistant how to carry out one kind of task, and it applies wherever you work rather than inside a single project.

The useful half of this page is short and completely safe: you already have four skills, they are switched on, and most people do not know what they can do. The rest of the page is about the half that is not automatically safe, and it is written carefully on purpose.

## What a skill actually is

A skill is a folder containing a file of instructions, and optionally scripts the assistant can run. The assistant reads the short description of every installed skill at all times, and when a task looks like a match, it reads the full instructions and follows them.

That last part is the whole safety story, so it is worth stating plainly.

!!! danger "A skill is closer to installing software than to reading advice"

    When you read a document, you decide what to do with it. When an assistant loads a skill, the skill's instructions become instructions **it follows**, without asking you again, and any code bundled with the skill can be run with the access you have already granted: your files, your folders, and any tools that assistant can reach.

    A skill from someone you cannot identify is therefore not a tip. It is a program you are choosing to trust.

## The four you already have

These are written and maintained by Anthropic, are on by default in claude.ai and Cowork, and require nothing from you. Most of what faculty and staff need from skills is already here, which is the safest possible starting point.

<!-- render:skills -->

Capabilities in that table that people routinely miss: text recognition on a **scanned** PDF so it becomes searchable and quotable, filling in a PDF form, pulling the speaker notes out of a deck you inherited, and cleaning up an exported spreadsheet whose headers landed in the wrong rows.

One counterintuitive point worth knowing. The four document skills are available in claude.ai and Cowork, and are **not** available in Claude Code. The tool built for developers is the one without them.

### Switching file creation on

If you ask for a document and get text in the chat instead of a file, the setting is off. On a personal Free, Pro, or Max account, open **Settings**, then **Capabilities**, and turn on code execution and file creation. On a Team or Enterprise account, an administrator enables it in **Organization settings**, under **Skills**. Custom skills you add yourself live under **Customize**, then **Skills**.

## The risk, in plain terms

Anyone can write a skill and publish it. The largest public directory, skills.sh, is operated by Vercel and indexes roughly ten thousand ranked skills from more than two thousand different authors. Skills appear there automatically once anyone installs them: there is no application, no identity check, and no editorial review. The directory runs automated security scans, but by its own rules a skill is removed only if it fails **every** scanning partner, so a skill flagged as critical risk by one scanner can and does remain listed. The site says so itself: it cannot guarantee the quality or security of every skill listed.

Three things can go wrong, and none of them look alarming while they are happening:

- **The skill does something other than what it says.** Instructions you did not read can tell the assistant to open files you did not mean to share, or to send them somewhere. Nothing on screen has to look unusual.
- **A skill that was safe stops being safe.** Skills that pull instructions from a website inherit whatever that website says later. An author's account can change hands. What you audited in March is not necessarily what runs in November.
- **The advice is confidently wrong for medicine.** This is the one most likely to affect us. A skill for clinical documentation or exam writing, written by someone with no medical education background, can encode wrong practice in fluent, professional language, and the assistant will follow it without hesitation.

!!! warning "Popularity is not safety"

    Install counts, star ratings, and leaderboard positions measure how many people tried something. They do not measure whether it is correct, whether it is safe, or whether it suits medical education. A skill can be widely installed and still be wrong for our work, and tools that recommend skills by popularity are ranking that same signal.

## What to do

Anthropic's security guidance for its own product is unusually direct, and it is the right default here:

> Use Skills only from trusted sources: those you created yourself or obtained from Anthropic.

Its documentation adds that where a skill from an unknown source must be used at all, it deserves extreme caution and a thorough audit first, because the realistic failure modes include data exfiltration and unauthorized system access.

Translated into practice:

1. **Start, and usually stop, with the built-in skills.** They cover document work, which is most of what this audience needs, and they carry no installation decision at all.
2. **If you need more, take it from Anthropic's own published skills**, listed in the table above. You are choosing a known author, and you can read what you are installing.
3. **Treat anything from an open directory as unvetted software.** If you cannot read its instruction file and understand what it tells the assistant to do, you are not in a position to install it. Browsing to see what exists is fine. Installing on the strength of a leaderboard is not.
4. **Never combine an unvetted skill with sensitive material.** The [policy](../governance/policy.md) rules do not change here, and they bite harder than usual, because an assistant running a skill has whatever file access you gave it. Patient information and student records stay out, without exception.

Skills are new enough that the AI Committee has not yet taken a position on them, and no skill has been through the [tool review process](../governance/review-process.md). Until that happens, the guidance above is what this page recommends, drawn from the vendor's own documentation and the policy's data rules. If you have found a skill you believe belongs in front of colleagues, that is the kind of thing to bring to the committee rather than to pass around informally.

## Writing your own

The supported way to get a skill that fits AUA is to write one, not to adopt a stranger's. Anthropic publishes a skill-creator skill for exactly this, and the format is an open standard used by several vendors, so a skill written here is portable rather than tied to one product.

Two practical limits are worth knowing before you invest effort. Custom skills on claude.ai are **per user**: there is no way for an administrator to push one to everyone, to update it centrally, or to withdraw a bad version, so distribution means each person uploading it themselves. And custom skills **do not follow you between products**: one uploaded to claude.ai is not available in Claude Code, and the reverse.

For most teaching tasks, a well-written entry in the [prompt library](../prompts/index.md) does the same job with none of that overhead. Reach for a skill when the task is genuinely repetitive, has a fixed procedure worth encoding, and recurs often enough to be worth maintaining.
