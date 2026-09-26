---
# The page's own title: without it MkDocs names the page from its file
# ("Index"), because the first line below is a comment, not the heading.
title: AI Literacy Pathway
last_reviewed: 2026-09-01
action:
  - text: "Start Module 1: How AI Works (10 minutes)"
    link: pathway/how-ai-works.md
---

<!-- The Learn plate: decorative art beside the title on wide screens
(aria-hidden, takes no space). docs/javascripts/layout-learn.js draws it
from docs/assets/art/; its styles are at the end of layout-learn.css. -->
<div class="learn-plate" data-learn-plate aria-hidden="true"></div>

# AI Literacy Pathway

<span class="meta-chip">Seven modules</span><span class="meta-chip">Self-paced</span><span class="meta-chip" data-learn-minutes="sum:1-3">Modules 1 to 3 take about 30 minutes</span>

<!-- The minutes on this page (the meta line above, the bullets, the stage
notes and every route-map entry) are checked against each page's own
"About N minutes" chip by scripts/layout_learn.py, and the build fails on a
mismatch. If a module's length changes, change its chip and this page
together. The Start button's text is checked the same way. -->

<div class="learn-door" markdown>

<div class="learn-door__intro" markdown>

A self-paced introduction to artificial intelligence (AI) in plain language, with no math. Each module is short, points to the relevant material on this site and beyond, ends with a short self-check, and stands alone.

- **Modules 1 to 3, the foundations,** are for everyone, in order: what these systems are, how to direct them, and a short guide to the university's policy. Together they take <span data-learn-minutes="sum:1-3">about 30 minutes</span>.
- **Modules 4 to 6** go deeper for your role, <span data-learn-minutes="each:4-6">10 to 15 minutes</span> each. Take the ones that match your work.
- **Module 7**, on working with agents, is optional, for when the basics feel comfortable. Four optional hands-on guides follow it.

All seven modules take <span data-learn-minutes="sum:1-7">about 75 minutes</span>, and the hands-on guides add <span data-learn-minutes="sum:guides">about 50 minutes</span>.

</div>

<nav class="route-map" aria-label="The pathway at a glance" markdown>

<div class="route-stage route-stage--core" markdown>
<p class="route-stage-head"><span class="route-stage-num">Stage 1</span><span class="route-stage-name">Foundations</span><span class="route-stage-note" data-learn-minutes="sum:1-3">Everyone, in order, about 30 minutes</span></p>

- <span class="route-n">1</span> <span class="route-text">[How AI Works](how-ai-works.md)</span> <span class="route-min">10 min</span>
- <span class="route-n">2</span> <span class="route-text">[Prompting Fundamentals](prompting.md)</span> <span class="route-min">15 min</span>
- <span class="route-n">3</span> <span class="route-text">[The Policy in Practice](rules.md)</span> <span class="route-min">5 min</span>

</div>

<div class="route-stage route-stage--pick" markdown>
<p class="route-stage-head"><span class="route-stage-num">Stage 2</span><span class="route-stage-name">Your Work</span><span class="route-stage-note" data-learn-minutes="each:4-6">Pick what matches your role, 10 to 15 minutes each</span></p>

- <span class="route-n">4</span> <span class="route-text">[Teaching and Assessment](teaching-assessment.md) <span class="route-for">For faculty</span></span> <span class="route-min">15 min</span>
- <span class="route-n">5</span> <span class="route-text">[Research and Scholarship](research.md) <span class="route-for">For faculty and student researchers</span></span> <span class="route-min">10 min</span>
- <span class="route-n">6</span> <span class="route-text">[Clinical Contexts](clinical.md) <span class="route-for">For students and clinical faculty</span></span> <span class="route-min">10 min</span>

</div>

<div class="route-stage route-stage--optional" markdown>
<p class="route-stage-head"><span class="route-stage-num">Stage 3, optional</span><span class="route-stage-name">Working with Agents</span><span class="route-stage-note">Module 7, then four hands-on guides</span></p>

- <span class="route-n">7</span> <span class="route-text">[Working with Agents](working-with-agents.md)</span> <span class="route-min">12 min</span>
- <span class="route-n route-n--guide"></span> <span class="route-text">[Choosing Your Interface](../tools/interfaces.md)</span> <span class="route-min">12 min</span>
- <span class="route-n route-n--guide"></span> <span class="route-text">[Your First Agent Session](../tools/first-session.md)</span> <span class="route-min">20 min</span>
- <span class="route-n route-n--guide"></span> <span class="route-text">[Standing Setups](../tools/standing-setups.md)</span> <span class="route-min">10 min</span>
- <span class="route-n route-n--guide"></span> <span class="route-text">[Agent Skills](../tools/skills.md)</span> <span class="route-min">10 min</span>

</div>

</nav>

<p class="route-legend">A solid line means in order, separate stops mean pick what fits, and a dashed line means optional. Numbered stops are the seven modules; open dots are the hands-on guides. Every module also stands alone: the stages are the recommended order, not a requirement.</p>

<div class="learn-shelf" markdown>

## The reference shelf

Five pages that sit alongside the modules.

- [How LLMs Work, in Depth](../basics/how-llms-work.md) <span class="learn-shelf__sub">Large language models (LLMs), one level down</span>
- [Getting Better Answers](../basics/better-answers.md) <span class="learn-shelf__sub">Context, memory, and standing instructions; Stage 3 assumes it</span>
- [Glossary](../basics/glossary.md) <span class="learn-shelf__sub">The AI terms the pathway uses</span>
- [Common Misconceptions](../basics/misconceptions.md) <span class="learn-shelf__sub">Calibrating trust by task</span>
- [Courses and Resources](../learning/index.md) <span class="learn-shelf__sub">External courses for when you finish</span>

</div>

</div>

## About this pathway

The university's [AI Responsible Use Policy](../governance/policy.md) commits AUA to providing training resources on responsible AI use. This pathway is the AI Hub's contribution to that commitment, maintained by the Associate Dean of AI in Medical Education.

**What it aligns with.** The pathway's coverage is mapped to the [Artificial Intelligence Competencies for Medical Educators](https://www.aamc.org/about-us/mission-areas/medical-education/advancing-ai-resource-collection/artificial-intelligence-competencies-medical-educators), the framework compiled by the Central Group on Educational Affairs (CGEA) Faculty Development Special Interest Group and published through the Association of American Medical Colleges (AAMC). Each module notes the competency domain it serves at its foot; the six core modules cover all seven domains, and Module 7 deepens Working with AI and Critical Appraisal of AI Outputs.

**What it is not.** The pathway is not a training requirement, and completing it does not certify anything. It is here to make you a more capable user of these tools.

Questions, corrections, or suggestions: use the [feedback form](https://forms.office.com/r/5a8RCi2YKP) or the contact route on the [About page](../about.md).
