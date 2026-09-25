---
last_reviewed: 2026-09-01
hide:
  - navigation
---

# For Students

<span class="meta-chip">For medical students</span> <span class="meta-note">Organized by where you are, from first semester to the wards</span>

!!! tip "If you have 35 minutes"
    Read the pathway's first three modules: [How AI Works](pathway/how-ai-works.md), [Prompting Fundamentals](pathway/prompting.md), and [The Policy in Practice](pathway/rules.md). Everything else on this page builds on them.

This site was built for the whole American University of Antigua College of Medicine (AUACOM) community, and much of it was built with you specifically in mind. Nothing here replaces your course materials or your own judgment. Artificial intelligence (AI) tools make strong study aids once you know where they are reliable and where they are not, and learning that is most of the skill. The sections below follow the shape of medical school, so you can skip to wherever you are standing.

<div class="grid cards" markdown>

- :material-head-lightbulb:{ .lg .middle } __Learn the basics__

    ---

    Three short modules cover most of what you need: how AI works, prompting habits, and what the policy asks.

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

## Patient data, classmates' work, and exams: what to know {: #the-lines-that-never-move }

The full detail lives in [The Policy in Practice](pathway/rules.md) and the [AI Responsible Use Policy](governance/policy.md).

- Patient information, including a name, an identifiable case detail, or a photo of a chart, stays out of public AI tools under the policy unless the AI Responsible Use Subcommittee has vetted and approved a tool for that data. Stripped to a teaching abstraction, a case is fine to practice with; see [On the wards](#on-the-wards).
- A classmate's work is theirs, so check with them before it goes into a tool, the same courtesy you would want for your own draft.
- Your course syllabus is where expectations for AI on assignments are set, and the policy asks you to acknowledge AI use the way your course or department specifies. If the syllabus does not cover something you want to try, ask your instructor: a quick message usually settles it, and the conversation often improves the idea.
- The Student Handbook treats unauthorized or unacknowledged AI use in coursework, assessments, or clinical training as possible academic misconduct; your course syllabus says what is authorized.
- Whatever a tool contributed, the work you submit and its errors are yours.

## Starting out

The literacy pathway's first three modules are short, plain-language, and written for everyone. Start with these three:

1. [How AI Works](pathway/how-ai-works.md) (about 10 minutes): why a chatbot's confident answer is not always a correct one, and why that is a feature of the mechanism rather than an occasional glitch.
2. [Prompting Fundamentals](pathway/prompting.md) (about 15 minutes): the habits that most improve what you get back, starting with giving the model your actual materials.
3. [The Policy in Practice](pathway/rules.md) (about 10 minutes): what the policy asks when AI contributes to your work, including which information stays out of public tools.

## Through the basic sciences

This is where the daily habits form, and the ones that pay off share a shape: the AI works from **your** materials, and **you** do the recalling.

- **Set it up once, not every session.** A [standing setup](tools/standing-setups.md) holds your course, its objectives, and your notes, so every conversation starts briefed.
- **Prompts written for this stage.** A lecture tutor, a daily review sheet builder, a flashcard builder, and a National Board of Medical Examiners (NBME)-style question tutor, all working from the lecture you attach, in the [prompt library](prompts/index.md).
- **Documents, without the fiddling.** Scanned PDFs, exported spreadsheets, and study sheets as real files: the [Skills page](tools/skills.md) covers what is switched on, and how to judge a skill before adding one.
- **One notebook per course.** [Gemini Notebook](tools/gemini-notebook.md) (formerly NotebookLM) answers from what you upload, with citations; it finds well and summarizes less reliably.
- **Finding study tools.** The [study tools](tools/index.md?task=study) are built for this.
- **Better answers, less effort.** [Getting Better Answers](basics/better-answers.md) explains the three levers that decide quality: context, memory, and standing instructions.
- **Anatomy is a known weak spot for image generators.** Generated diagrams look convincing and get foramina, rib counts, and attachments wrong; the [misconceptions page](basics/misconceptions.md) explains what to use instead.
- **Calibrating trust.** Fluency is not accuracy; the [misconceptions page](basics/misconceptions.md) covers how to judge reliability by task, which matters double for exams and wards.

## Building a study schedule {: #building-a-study-schedule }

A schedule is only as good as what goes into it. The [study schedule builder](prompts/index.md#study-schedule-builder) is written for this school's block structure, either keeping up through a block or counting down to one exam such as a remedial. Before you use it, gather:

- **Your course syllabus**, the version that lists the learning objectives. It turns "review neuro" into named objectives you can act on.
- **The teaching calendar**, with your individual readiness assurance test (iRAT), quiz, and end-of-system exam dates.
- **Any score reports from this block**, with your name and student number left off. The plan does not need them, and without them the report is performance data rather than an identifiable student record.
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

Clinical rotations add a second set of policies alongside the university's: the hospital's own rules on privacy and devices.

- Read [Clinical Contexts](pathway/clinical.md) before your first rotation. It covers how AI works as a study aid on rotations and what changes when a real patient is involved.
- **Practicing differentials against an AI is legitimate and effective**, with one discipline: a real encounter gets stripped to a teaching abstraction first, meaning an age band, a presentation pattern, and nothing identifiable. The [clinical reasoning partner](prompts/index.md#clinical-reasoning-partner) runs practice cases a step at a time.
- Where the site's policies and the university's differ, the stricter of the two sets the limit in practice. Site orientation or your preceptor can tell you what the site allows.

## The application year

The [residency application playbook](playbooks/residency-application.md) covers what the Association of American Medical Colleges (AAMC) and the Educational Commission for Foreign Medical Graduates (ECFMG) actually permit, the best use of AI in this year (interview rehearsal, especially if you do not have a network of physicians to practice with), how to use an assistant as a critic of your own draft rather than its author, and how to tell a patient story in a personal statement without identifying the patient. Two prompts support it: the [mock residency interview](prompts/index.md#mock-residency-interview) and the [personal statement critic](prompts/index.md#personal-statement-critic).

For anything about strategy, meaning which programs, how many, how to signal, and how your own record should be presented, your Education Enhancement Department (EED) clinical advisor is the person to see. The playbook is about the tools, not the plan.

## Staying current

[This Week](news/this-week.md) rolls up the last seven days of curated news, videos, and podcasts, refreshed through the day. The [Videos page](news/videos.md) has a Medical AI section with seminar recordings and explainers, and a weekly digest of highlights lands every Friday in the [archive](news/archive/index.md).

## Take part

The [Opportunities page](opportunities.md) lists buildathons, hackathons, and challenges open to international participants, wherever in the world they run; check each listing's eligibility before you plan around it. The [Prompt Exchange](prompts/exchange.md) accepts community prompt contributions with public voting, and news pages carry a comments section (free GitHub account required; posts are public; standards on the [About page](about.md#comments-and-feedback)). If something on this site is wrong, missing, or confusing, the [feedback form](https://forms.office.com/r/5a8RCi2YKP) is five questions and about two minutes.
