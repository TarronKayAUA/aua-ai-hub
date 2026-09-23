---
last_reviewed: 2026-09-01
hide:
  - navigation
---

# For Students

<span class="meta-chip">For medical students</span> <span class="meta-note">Organized by where you are, from first semester to the wards</span>

!!! tip "If you have 35 minutes"
    Read the pathway's first three modules: [How AI Works](pathway/how-ai-works.md), [Prompting Fundamentals](pathway/prompting.md), and [The Rules](pathway/rules.md). Everything else on this page builds on them.

This site was built for the whole American University of Antigua College of Medicine (AUACOM) community, and much of it was built with you specifically in mind. Nothing here replaces your course materials or your own judgment; artificial intelligence (AI) tools are study aids with sharp edges, and knowing where the edges are is most of the skill. The sections below follow the shape of medical school, so you can skip to wherever you are standing.

<div class="grid cards" markdown>

- :material-head-lightbulb:{ .lg .middle } __Learn the basics__

    ---

    Three short modules cover most of what you need: how AI works, prompting habits, and the rules.

    [Start the pathway](pathway/index.md)

- :material-book-open-variant:{ .lg .middle } __Study with AI__

    ---

    Set up an exam-style question tutor once per course from your own lecture notes, or keep one notebook per course.

    [Set it up](tools/standing-setups.md) · [One notebook per course](tools/gemini-notebook.md)

- :material-chart-line:{ .lg .middle } __After an exam__

    ---

    Turn a score report into an honest study plan your advisor can hold you to.

    [Read your reports](playbooks/score-reports.md)

</div>

## The lines that never move: patient data, classmates' work, exams {: #the-lines-that-never-move }

These hold at every stage below, whatever the tool and whatever the pressure. The full detail lives in [The Rules](pathway/rules.md) and the [AI Responsible Use Policy](governance/policy.md).

!!! danger "Never crossed, whatever the tool"
    - Patient information never goes into a public AI tool. Not a name, not an identifiable case detail, not a photo of a chart.
    - A classmate's identifiable work is not yours to paste into a tool either.
    - Your course's syllabus sets the rules for assignments; the policy delegates that line to your instructors. When you are not sure whether a use is allowed, ask before using.
    - Unauthorized AI use in secure examinations is academic dishonesty under the existing integrity rules.
    - Whatever a tool contributed, the work you submit and its errors are yours.

## Starting out

The literacy pathway's first three modules are short, plain-language, and written for everyone. Start with these three:

1. [How AI Works](pathway/how-ai-works.md) (about 10 minutes): why a chatbot's confident answer is not always a correct one, and why that is a feature of the mechanism rather than an occasional glitch.
2. [Prompting Fundamentals](pathway/prompting.md) (about 15 minutes): the habits that most improve what you get back, starting with giving the model your actual materials.
3. [The Rules](pathway/rules.md) (about 10 minutes): what must never go into a public AI tool, and what the university expects when AI contributes to your work.

## Through the basic sciences

This is where the daily habits form, and the ones that pay off share a shape: the AI works from **your** materials, and **you** do the recalling.

- **Set it up once, not every session.** A [standing setup](tools/standing-setups.md) holds your course, its objectives, and your notes, so every conversation starts briefed.
- **Prompts written for this stage.** A lecture tutor, a daily review sheet builder, a flashcard builder, and a National Board of Medical Examiners (NBME)-style question tutor, all working from the lecture you attach, in the [prompt library](prompts/index.md).
- **Documents, without the fiddling.** Scanned PDFs, exported spreadsheets, and study sheets as real files: the [Skills page](tools/skills.md) covers what is switched on, and why unknown skills deserve caution.
- **One notebook per course.** [Gemini Notebook](tools/gemini-notebook.md) (formerly NotebookLM) answers from what you upload, with citations; it finds well and summarizes less reliably.
- **Finding study tools.** The [study tools](tools/index.md?task=study) are built for this; statuses describe the institution's relationship with a tool, not an endorsement.
- **Better answers, less effort.** [Getting Better Answers](basics/better-answers.md) explains the three levers that decide quality: context, memory, and standing instructions.
- **Do not let AI draw your anatomy.** Generated diagrams look convincing and get foramina, rib counts, and attachments wrong; the [misconceptions page](basics/misconceptions.md) explains what to use instead.
- **Calibrating trust.** Fluency is not accuracy; the [misconceptions page](basics/misconceptions.md) covers how to judge reliability by task, which matters double for exams and wards.

## Building a study schedule {: #building-a-study-schedule }

A schedule is only as good as what goes into it. The [study schedule builder](prompts/index.md#study-schedule-builder) is written for this school's block structure, either keeping up through a block or counting down to one exam such as a remedial. Before you use it, gather:

- **Your course syllabus**, the version that lists the learning objectives. It turns "review neuro" into named objectives you can act on.
- **The teaching calendar**, with your individual readiness assurance test (iRAT), quiz, and end-of-system exam dates.
- **Any score reports from this block**, with your name and student number removed.
- **Your honest hours** per day, and your fixed commitments.
- **A few sentences on what you think is going wrong.** It is the most useful thing you can give it.

What a good schedule has, whoever builds it:

- **Clock times and named content**, each block ending in something you produce: a diagram drawn from memory, a set number of questions on named objectives. "Review cardiology" is not a plan.
- **The weekly rhythm**: preparation before team-based learning, each lecture consolidated within a day, a spaced revisit of earlier material from the block, and a question set.
- **Your school's lectures and slides as the main source.** Exams before your final term are written in-house from them; question banks and flashcards support them.
- **What you are not studying, and why.** A plan that covers everything thoroughly has not made the hard choices.
- **Checkpoints and a buffer**: a review after each assessment, and slack so one bad day does not sink the week.

Take the result to your advisor. After your next assessment, the [study plan progress check](prompts/index.md#study-plan-progress-check) tells you honestly whether it is working.

## Around an exam: NBME, USMLE Step 1 and course exams {: #around-an-exam }

**Before.** The [NBME-style question tutor](prompts/index.md#nbme-style-question-tutor) in exam mode drills first and debriefs after, which is closer to the real thing than reading explanations as you go. Build questions from the lectures you were actually taught, not from a general model's memory of the subject, and treat every explanation as something to check rather than something to trust.

**After.** The [score reports playbook](playbooks/score-reports.md) turns an NBME INSIGHTS report or an in-house score breakdown into an honest, interleaved study plan, with a prompt built for it and a loop that ends at your advisor's door. You write your own read of the report first; the AI refines it, it does not replace it. For a practice block or a quiz, the [missed-question debrief](prompts/index.md#missed-question-debrief) sorts each miss by cause (a knowledge gap, a slip, a misread, a changed answer, or the clock), working from your own notes rather than the questions themselves.

## On the wards

Clinical rotations change the rules, because you are now inside a hospital's privacy perimeter as well as the university's.

- Read [Clinical Contexts](pathway/clinical.md) before your first rotation. It shows exactly where the line sits between AI as a study aid and AI anywhere near real patients.
- **Practicing differentials against an AI is legitimate and effective**, with one discipline: a real encounter gets stripped to a teaching abstraction first, meaning an age band, a presentation pattern, and nothing identifiable.
- Your clinical site has its own rules, and they may be stricter than ours. Follow the stricter one, and ask before using anything on site.

## The application year

The [residency application playbook](playbooks/residency-application.md) covers what the Association of American Medical Colleges (AAMC) and the Educational Commission for Foreign Medical Graduates (ECFMG) actually permit, the best use of AI in this year (interview rehearsal, especially if you do not have a network of physicians to practice with), how to use an assistant as a critic of your own draft rather than its author, and the privacy trap hiding inside patient stories in personal statements.

For anything about strategy, meaning which programs, how many, how to signal, and how your own record should be presented, your Education Enhancement Department (EED) clinical advisor is the person to see. The playbook is about the tools, not the plan.

## Staying current

[This Week](news/this-week.md) rolls up the last seven days of curated news, videos, and podcasts, refreshed through the day. The [Videos page](news/videos.md) has a Medical AI section with seminar recordings and explainers, and a weekly digest of highlights lands every Friday in the [archive](news/archive/index.md).

## Take part

The [Opportunities page](opportunities.md) lists buildathons, hackathons, and challenges open to international participants, wherever in the world they run; check each listing's eligibility before you plan around it. The [Prompt Exchange](prompts/exchange.md) accepts community prompt contributions with public voting, and news pages carry a comments section (free GitHub account required; posts are public; standards on the [About page](about.md#comments-and-feedback)). If something on this site is wrong, missing, or confusing, the [feedback form](https://forms.office.com/r/5a8RCi2YKP) is five questions and about two minutes.
