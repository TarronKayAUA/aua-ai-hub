---
last_reviewed: 2026-07-14
---

# Playbook: Making Sense of Your Score Reports

<span class="meta-chip">For students and their advisors</span> <span class="meta-note">Works with any capable assistant in the [tools directory](../tools/index.md)</span>

--8<-- "includes/prompt-maturity-note.md"

## The task

Turn an exam performance report (a comprehensive exam, a shelf exam, a self-assessment, or an in-house exam) into a study plan that is honest about where you stand, fits the hours you actually have, and gets tested against your next assessment instead of drifting. The report is not the hard part; most students receive more performance data than they ever use. The hard part is reading it without flinching, turning it into a plan that survives a bad week, and closing the loop.

## What you already have

Before any artificial intelligence (AI) enters the picture, know your data. If you have taken a National Board of Medical Examiners (NBME) exam, you already have a dashboard: **INSIGHTS**, reached through the [MyNBME examinee portal](https://www.mynbme.org/). It collects your NBME self-assessments from the past two years and your subject and comprehensive exams from early 2024 onward, under the account email the exam was tied to (United States Medical Licensing Examination results are not included, and older score reports come from the school), across four tabs: your exam list with downloadable score reports, per-exam results, question-level detail, and comparisons across multiple takes of the same exam type.

For the basic science comprehensive exam, the results view shows your total score as an equated percent correct (EPC), an estimated probability of passing Step 1 if you tested within a week, and each content area scored against a national comparison group of Step 1 first-takers, flagged lower, about the same, or higher, with suggested areas of focus, up to six, split between organ systems and disciplines. The clinical science comprehensive exam is scored differently: a 1 to 300 scale estimating Step 2 Clinical Knowledge performance, with the pass probability tied to that exam instead. Most tables export to a spreadsheet, and self-assessments additionally record time spent per question, the only NBME report with pacing data; if timing is your suspected problem, a self-assessment is where the evidence lives. Your in-house exams produce category and question-level reports through the exam platform, and the same method below applies to them.

<figure class="figure">
<svg viewBox="0 0 660 305" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematic of the INSIGHTS exam results view: four tabs across the top, a total score gauge on the left which for the basic science comprehensive exam adds an estimated probability of passing Step 1, content areas on the right scored against a national comparison group and flagged lower, same, or higher, and a suggested areas of focus strip along the bottom">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the shape of an INSIGHTS exam-results view</text>
<rect x="20" y="28" width="620" height="240" rx="10" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1.5"/>
<rect x="36" y="42" width="100" height="26" rx="6" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="86" y="59" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">My Exams</text>
<rect x="144" y="42" width="110" height="26" rx="6" fill="var(--md-primary-fg-color)"/>
<text x="199" y="59" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffffff">Exam Results</text>
<rect x="262" y="42" width="120" height="26" rx="6" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="322" y="59" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">Question Details</text>
<rect x="390" y="42" width="140" height="26" rx="6" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="460" y="59" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">Results Comparison</text>
<path d="M 60 160 A 52 52 0 0 1 164 160" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="9" opacity="0.3"/>
<path d="M 60 160 A 52 52 0 0 1 138 115" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="9"/>
<text x="112" y="152" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--md-typeset-color)">total score</text>
<text x="112" y="180" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">equated percent correct (EPC)</text>
<text x="112" y="196" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">the basic science comprehensive exam</text>
<text x="112" y="208" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">adds a probability of passing Step 1</text>
<text x="250" y="96" font-size="9" font-weight="bold" fill="var(--md-typeset-color)">content areas, your EPC vs a national comparison group</text>
<text x="250" y="120" font-size="9" fill="var(--md-typeset-color)">Cardiovascular</text>
<rect x="390" y="112" width="150" height="9" rx="4" fill="var(--md-default-fg-color--light)" opacity="0.25"/>
<rect x="390" y="112" width="66" height="9" rx="4" fill="var(--md-primary-fg-color)"/>
<text x="556" y="120" font-size="8.5" font-weight="bold" fill="#c62828">Lower</text>
<text x="250" y="146" font-size="9" fill="var(--md-typeset-color)">Renal &amp; Urinary</text>
<rect x="390" y="138" width="150" height="9" rx="4" fill="var(--md-default-fg-color--light)" opacity="0.25"/>
<rect x="390" y="138" width="102" height="9" rx="4" fill="var(--md-primary-fg-color)"/>
<text x="556" y="146" font-size="8.5" fill="var(--md-default-fg-color--light)">Same</text>
<text x="250" y="172" font-size="9" fill="var(--md-typeset-color)">Biostatistics &amp; Epidemiology</text>
<rect x="390" y="164" width="150" height="9" rx="4" fill="var(--md-default-fg-color--light)" opacity="0.25"/>
<rect x="390" y="164" width="58" height="9" rx="4" fill="var(--md-primary-fg-color)"/>
<text x="556" y="172" font-size="8.5" font-weight="bold" fill="#c62828">Lower</text>
<text x="250" y="198" font-size="9" fill="var(--md-typeset-color)">Behavioral Sciences</text>
<rect x="390" y="190" width="150" height="9" rx="4" fill="var(--md-default-fg-color--light)" opacity="0.25"/>
<rect x="390" y="190" width="120" height="9" rx="4" fill="var(--md-primary-fg-color)"/>
<text x="556" y="198" font-size="8.5" font-weight="bold" fill="#2e7d32">Higher</text>
<rect x="36" y="222" width="588" height="32" rx="6" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="330" y="242" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">suggested areas of focus: the dashboard lists up to six, split between systems and disciplines</text>
<text x="330" y="292" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">an illustration of the layout, not a real report; NBME's own demo linked below shows the live version</text>
</svg>
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

## The workflow

<figure class="figure">
<svg viewBox="0 0 660 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The improvement loop: your score report leads to your own written read, then through a de-identification gate to the planner prompt, then to your advisor, then to the next assessment, which produces the next report and closes the loop">
<defs><marker id="sr-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the loop, closed at both ends</text>
<rect x="20" y="42" width="140" height="54" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="90" y="64" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">your score report</text>
<text x="90" y="80" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">INSIGHTS or in-house</text>
<line x1="162" y1="69" x2="188" y2="69" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#sr-ar)"/>
<rect x="192" y="42" width="140" height="54" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="262" y="64" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">your own read</text>
<text x="262" y="80" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">three takeaways, written first</text>
<line x1="334" y1="69" x2="360" y2="69" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#sr-ar)"/>
<rect x="364" y="42" width="110" height="54" rx="8" fill="none" stroke="#c62828" stroke-width="2"/>
<text x="419" y="64" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--md-typeset-color)">de-identify</text>
<text x="419" y="80" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">name, ID, exam codes out</text>
<line x1="476" y1="69" x2="502" y2="69" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#sr-ar)"/>
<rect x="506" y="42" width="134" height="54" rx="8" fill="var(--md-primary-fg-color)"/>
<text x="573" y="64" text-anchor="middle" font-size="10" fill="#ffffff">planner prompt</text>
<text x="573" y="80" text-anchor="middle" font-size="8.5" fill="#ffffff">an honest, interleaved plan</text>
<line x1="573" y1="98" x2="573" y2="130" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#sr-ar)"/>
<rect x="506" y="134" width="134" height="54" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="573" y="156" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">your advisor</text>
<text x="573" y="172" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">the plan becomes the agenda</text>
<line x1="504" y1="161" x2="422" y2="161" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#sr-ar)"/>
<rect x="240" y="134" width="180" height="54" rx="8" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="330" y="156" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">next assessment</text>
<text x="330" y="172" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">keep, shrink, or change the plan</text>
<path d="M 238 161 L 90 161 L 90 100" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#sr-ar)"/>
<text x="330" y="224" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">the plan is a hypothesis; the next assessment is the test</text>
</svg>
<figcaption>No step is optional: skip your own read and you stop learning to self-assess; skip the advisor and the plan never meets someone who knows you.</figcaption>
</figure>

1. **Get your data out.** Open [INSIGHTS](https://www.mynbme.org/), download the score report or export the tables, or collect your in-house report. Paste it into a text file and strip your name, student number, and any exam identifiers.
2. **Write your own read.** Three takeaways, before any model sees anything. Two minutes that make everything after them work better.
3. **Run the [score report study planner](../prompts/index.md).** It will ask for your report, your timeline, your honest hours, your resources, your own read, and your test-taking patterns, then produce an honest assessment, a deficit map, the quick wins (biostatistics, epidemiology, ethics, and communication are checked explicitly; they are the cheapest points on the form), an interleaved week-by-week plan, test-taking drills for any strategy problems it finds, three questions for your advisor, and what to re-measure on your next assessment.
4. **Sanity-check the plan.** Are the weekly hours ones you actually have? Does every week keep your strong areas warm rather than parking a month on one subject? Does every claim about your performance trace to something in your report?
5. **Take it to your advisor.** The plan's advisor questions are the agenda. Advisors see patterns no model can: how this exam fits your trajectory, what worked for students in your exact position, and when the problem is not the studying at all.
6. **Close the loop.** After your next assessment, run the [study plan progress check](../prompts/index.md) with the old plan and the new report. It will say honestly which of three things happened: the plan worked, the plan was not followed, or the plan was followed and did not work, and each has a different next move.

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
