---
last_reviewed: 2026-09-01
---

# Playbook: Making Sense of Your Score Reports

<span class="meta-chip">For students and their advisors</span><span class="meta-chip">About 15 minutes</span> <span class="meta-note">Works with any capable assistant in the [tools directory](../tools/index.md)</span>

## The task

Turn an exam performance report (a comprehensive exam, a shelf exam, a self-assessment, or an in-house exam) into a study plan that is honest about where you stand, fits the hours you actually have, and gets tested against your next assessment instead of drifting. The report is not the hard part; most students receive more performance data than they ever use. The hard part is reading it without flinching, turning it into a plan that survives a bad week, and closing the loop.

## What you already have

Before any artificial intelligence (AI) enters the picture, know your data. If you have taken a National Board of Medical Examiners (NBME) exam, you already have a dashboard: **INSIGHTS**, reached through the [MyNBME examinee portal](https://www.mynbme.org/). It collects your NBME self-assessments from the past two years and your subject and comprehensive exams from early 2024 onward, under the email address the exam was tied to. United States Medical Licensing Examination results are not included, and older score reports come from the school. INSIGHTS has four tabs: your exam list with downloadable score reports, per-exam results, question-level detail, and comparisons across multiple takes of the same exam type.

The reports carry different rulers, so read yours against the right row:

| Report | Score scale | Pass estimate | What only this report has |
| --- | --- | --- | --- |
| Basic science comprehensive exam | Equated percent correct (EPC) | Probability of passing Step 1 if you had tested within a week | Each content area scored against a national comparison group of Step 1 first-takers, flagged lower, about the same, or higher, with up to six suggested areas of focus split between organ systems and disciplines |
| Clinical science comprehensive exam | 1 to 300, estimating Step 2 Clinical Knowledge performance | Tied to Step 2 Clinical Knowledge instead | |
| NBME self-assessment | | | Time spent per question, the only NBME report with pacing data; if timing is your suspected problem, this is where the evidence lives |
| In-house exam | | | Category and question-level reports through the exam platform; the same method below applies to them |

Most tables in INSIGHTS export to a spreadsheet.

<figure class="figure figure--html hf">
<p class="hf-title">The shape of an INSIGHTS exam-results view</p>
<div class="hf-mock">
<p class="hf-mock-tabs"><span>My Exams</span><span class="is-active">Exam Results</span><span>Question Details</span><span>Results Comparison</span></p>
<div class="hf-mock-body">
<p class="hf-gauge"><span aria-hidden="true"></span><strong>Total score</strong>equated percent correct (EPC); the basic science comprehensive exam adds a probability of passing Step 1</p>
<div>
<p class="hf-label">Content areas, your EPC vs a national comparison group</p>
<div class="hf-bars">
<p><span class="hf-bar-label">Cardiovascular</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 35%"></span><span class="hf-bar-value hf-flag--low">Lower</span></span></p>
<p><span class="hf-bar-label">Renal &amp; Urinary</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 54%"></span><span class="hf-bar-value">Same</span></span></p>
<p><span class="hf-bar-label">Biostatistics &amp; Epidemiology</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 31%"></span><span class="hf-bar-value hf-flag--low">Lower</span></span></p>
<p><span class="hf-bar-label">Behavioral Sciences</span><span class="hf-bar-track"><span class="hf-bar-fill" style="width: 64%"></span><span class="hf-bar-value hf-flag--high">Higher</span></span></p>
</div>
</div>
</div>
<p class="hf-mock-strip">Suggested areas of focus: the dashboard lists up to six, split between systems and disciplines.</p>
</div>
<p class="hf-note">An illustration of the layout, not a real report; NBME's own demo linked below shows the live version.</p>
<figcaption>What to look for when you open it: the score is one number, but the comparison flags and areas of focus are where a plan starts.</figcaption>
</figure>

See it for real before your first exam: NBME publishes an [interactive demo of INSIGHTS](https://www.nbme.org/insights-demo/) and an [official user guide](https://www.nbme.org/wp-content/uploads/2026/04/INSIGHTS_User_Guide.pdf) that walks every tab.

## Where AI helps, and where it hurts

AI is strong at the layer most students skip: translating a wall of flags and percentages into an ordered plan, sizing that plan to the hours you actually have, keeping strong areas in rotation while you repair weak ones, and asking the test-taking questions (Did you change answers? Did you run out of time?) that separate strategy problems from content problems. For an advisor, it applies the same rigor to the twentieth report of the week as to the first.

It fails in predictable ways. Models overread noisy data: a single content area on a single exam sits inside a wide error band, and an AI will happily build you a month of cardiology around what may be statistical noise. They invent numbers: percentiles, national averages, and pass probabilities that are not in your report. They flatter: reassurance is cheap for a model and expensive for you, because false comfort costs an exam attempt. And a model cannot know you. Your advisor has watched hundreds of students walk this path and can hear what you are not saying; the model sees one pasted report. The prompts below are built to resist the first three failures. The fourth is why the loop ends at your advisor's door, not the model's.

## Read it yourself first

Before you run any prompt, open your report and write down your own three takeaways: where you think you stand, what you think went wrong, and what you would change. This is not a ritual. Reading your own performance data is a skill you will need on every future exam, every licensing step, and eventually on the audit of your own practice, and you do not build it by outsourcing the first read. Then run the prompt and compare. Where the AI's read matches yours, plan with confidence. Where it disagrees, that disagreement is the most useful thing either of you produced, and it is exactly what to bring to your advisor.

## Gather first

- Your report, as text: export or copy from INSIGHTS, or your in-house report, with your name, student number, and any exam identifiers removed.
- The date of your next exam and your honest weekly study hours, after classes, work, and everything else. Honest, not aspirational.
- What resources you actually have (question bank, lecture notes, review materials), so the plan names real things.
- Your own three takeaways, written first.

--8<-- "includes/prompt-maturity-note.md"

## The workflow

<figure class="figure figure--html hf">
<p class="hf-title">The loop, closed at both ends</p>
<ol class="hf-steps">
<li class="hf-box"><p class="hf-box-title">Your score report</p><p class="hf-box-sub">INSIGHTS or in-house</p></li>
<li class="hf-box"><p class="hf-box-title">Your own read</p><p class="hf-box-sub">three takeaways, written first</p></li>
<li class="hf-box hf-box--stop"><p class="hf-box-title">De-identify</p><p class="hf-box-sub">name, ID, exam codes out</p></li>
<li class="hf-box hf-box--filled"><p class="hf-box-title">Planner prompt</p><p class="hf-box-sub">an honest, interleaved plan</p></li>
<li class="hf-box"><p class="hf-box-title">Your advisor</p><p class="hf-box-sub">the plan becomes the agenda</p></li>
<li class="hf-box hf-box--ok"><p class="hf-box-title">Next assessment</p><p class="hf-box-sub">keep, shrink, or change the plan</p></li>
</ol>
<p class="hf-return">The next assessment produces the next report, and the loop starts again.</p>
<p class="hf-note">The plan is a hypothesis; the next assessment is the test.</p>
<figcaption>No step is optional: skip your own read and you stop learning to self-assess; skip the advisor and the plan never meets someone who knows you.</figcaption>
</figure>

1. **Get your data out.** Open [INSIGHTS](https://www.mynbme.org/), download the score report or export the tables, or collect your in-house report. Paste it into a text file and strip your name, student number, and any exam identifiers.
2. **Write your own read.** Three takeaways, before any model sees anything. Two minutes that make everything after them work better.
3. **Run the [score report study planner](../prompts/index.md#score-report-study-planner).** It will ask for your report, your timeline, your honest hours, your resources, your own read, and your test-taking patterns, then produce an honest assessment, a deficit map, the quick wins (biostatistics, epidemiology, ethics, and communication, checked explicitly when your exam tests them, as Step 1 and the comprehensive exams built to its outline do), an interleaved week-by-week plan, test-taking drills for any strategy problems it finds, three questions for your advisor, and what to re-measure on your next assessment.
4. **Sanity-check the plan.** Are the weekly hours ones you actually have? Does every week keep your strong areas warm rather than parking a month on one subject? Does every claim about your performance trace to something in your report?
5. **Take it to your advisor.** The plan's advisor questions are the agenda. Advisors see patterns no model can: how this exam fits your trajectory, what worked for students in your exact position, and when the problem is not the studying at all.
6. **Close the loop.** After your next assessment, run the [study plan progress check](../prompts/index.md#study-plan-progress-check) with the old plan and the new report. It will say honestly which of three things happened: the plan worked, the plan was not followed, or the plan was followed and did not work, and each has a different next move.

## Guardrails for this task

- **Your own report only.** A classmate's report is their education record; it is never yours to paste anywhere, even to help them. Point them here instead.
- **De-identify even your own.** The [AI Responsible Use Policy](../governance/policy.md) draws a hard line around identifiable student records in public AI tools. Strip your name, student number, and exam identifiers before pasting, so what enters the tool is performance data rather than an identifiable record. Both prompts are instructed to stop and ask for a clean re-paste if an identifier slips through; do not rely on that net, it is a backstop, not the method.
- **Performance data, not questions.** NBME exam questions are copyrighted secure content. The report's content-area descriptions are fine to paste; reconstructed exam questions are not, in any tool, ever.
- **Treat single-exam areas as hypotheses.** Content-area scores on one exam carry wide error bands. A pattern across two or more exams, or a flag that matches your own sense of weakness, is evidence; one dip is a lead to investigate.
- **The model plans; it does not absolve.** A plan you did not follow is information about the plan's size, not a verdict on you, and the progress check treats it that way. But no prompt fixes not opening the question bank.

!!! note "For advisors"
    Both prompts work in an advising meeting with the student driving on their own account and screen, which keeps the student's data in the student's hands and teaches the method at the same time. If you handle score reports yourself, de-identification before any public AI tool is the same hard requirement as in the [writing feedback playbook](writing-feedback.md). The planner's output ends with questions the data cannot answer; that section exists to make your meeting sharper, not to replace it.

## Before you rely on it

- [ ] The pasted report was your own and de-identified, including exam identifiers.
- [ ] You wrote your own three takeaways first, and compared them with the model's read.
- [ ] Every claim in the plan about your performance traces to the report; anything generic got cut.
- [ ] The weekly hours in the plan are hours you demonstrably have.
- [ ] Strong areas appear in every week, not only the weak ones.
- [ ] Your advisor has seen the plan, or the meeting is booked.

**Related:** [AI and the Residency Application](residency-application.md) for the year that follows, and [Module 6: Clinical Contexts](../pathway/clinical.md) for the wards.
