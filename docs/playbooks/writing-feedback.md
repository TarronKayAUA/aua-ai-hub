---
last_reviewed: 2026-09-01
---

# Playbook: Feedback on Student Writing

<span class="meta-chip">For faculty</span><span class="meta-chip">About 7 minutes</span> <span class="meta-note">Works with any capable assistant in the [tools directory](../tools/index.md)</span>

## The task

Give substantive, rubric-grounded formative feedback on a stack of student writing (reflections, essays, reports, case write-ups) in a fraction of the usual time, while the grade, and any judgment of the student, stay with you.

## Where AI helps, and where it hurts

Artificial intelligence (AI) is strong at the mechanical layer of feedback: applying your rubric consistently to the twentieth essay as to the first, spotting structural patterns (a missing counterargument, an unsupported claim, a conclusion that answers a different question), and offering alternative phrasings for points you want to make more kindly or more clearly. It is weak at everything that requires knowing the student (judging growth against their previous work, sensing what this particular writer can hear right now, and any decision that touches a grade), because it has none of that context. It also fails in a way specific to this task: models generate plausible-sounding praise and criticism that does not match the text in front of them, so every observation must carry a quote you can check.

One more failure mode is yours rather than the model's: feedback that arrives in a voice that is not yours teaches students that your feedback is not worth reading. The model drafts observations; the words that reach the student are yours.

<figure class="figure figure--html hf">
<p class="hf-title">From submission to feedback</p>
<div class="hf-flow">
<div class="hf-box">
<p class="hf-box-title">De-identify first</p>
<p class="hf-box-sub">names, IDs, traceable details out</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p>Frozen rubric, observations only</p>
<p class="hf-box-sub">each anchored to a quote</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--filled">
<p class="hf-box-title">You judge, cut, and rewrite</p>
<p class="hf-box-sub">in your voice</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--ok">
<p>Feedback, disclosed</p>
</div>
</div>
<div class="hf-box hf-box--wall"><p>Grades stay with you; this pipeline drafts formative feedback.</p></div>
<p class="hf-note">De-identifying protects the student's record; keeping grades out of the pipeline keeps the judgment yours.</p>
<figcaption>Observations flow through; names stay out, and the grade stays with you.</figcaption>
</figure>

## Gather first

- Your rubric or feedback criteria, written out (if they live in your head, this task is the reason to write them down).
- The assignment brief the students actually received.
- The submissions, de-identified (step 1 below shows how).

## The workflow

1. **De-identify first.** Remove names, identification numbers, and identifying details (a clinical encounter described with its site, date, team, or an unusual detail can identify a student as surely as a name). Student submissions are education records under the Family Educational Rights and Privacy Act (FERPA), and the policy keeps identifiable student records out of public AI tools, so this step comes before anything else. A find-and-replace to "Student A, Student B" is usually sufficient and preserves your ability to map feedback back; skim a few afterward for the indirect details a find-and-replace misses.
2. **Freeze the criteria.** Give the model your rubric and the assignment brief, have it restate the criteria as a numbered list, and correct it before any essay is read. The [rubric feedback drafter](../prompts/index.md#rubric-feedback-drafter) builds in this step and the next. Consistency across the stack is the whole point; a rubric that drifts mid-stack is worse than none.
3. **Run per essay, observations only.** For each submission ask for: rubric-grounded observations, each anchored to a verbatim quote from the essay; the single highest-leverage improvement; and one thing done genuinely well, also quote-anchored. Ask it to leave out grades, scores, rankings, and comparisons between students (the rubric feedback drafter already does). Measure each essay against the rubric rather than a classmate's essay: a peer exemplar pulls the feedback toward comparison, and the rubric is the standard the students were given.
4. **Judge and rewrite.** Read each observation set against the essay. Discard what is wrong or tone-deaf (some will be), keep what you would have found yourself on a good day, add what only you can know, and rewrite the keepers in your own voice.
5. **Return it as yours, disclosed as your syllabus says.** How you disclose AI assistance in feedback follows the course and departmental guidelines the [AI Responsible Use Policy](../governance/policy.md) delegates to; your [syllabus AI statement](syllabus-statement.md) is the place that decision lives, and students reasonably expect the same transparency about your AI use that you expect about theirs.

## Good practice for this task

- This playbook is for formative feedback, and it leaves grades out on purpose: models drift across a stack and can praise or fault things the essay does not contain, and a grade is a judgment you need to be able to explain to the student. If you want to explore AI support for scoring, treat it as a pilot: compare its marks with your own across the stack, look for patterns that disadvantage particular groups of students (the policy requires that work in any educational assessment), and share what you learn with the AI Committee.
- Read the observations as notes on this text, not on the student: the model saw one essay with no history, so its reading says little about the writer.
- If your course limits students' AI use, they will notice whether yours meets the same standard. Disclosing your own use the way your syllabus describes keeps that conversation honest in both directions.

## Before you rely on it

- [ ] Every observation's quote actually appears in the essay (models misquote; check a sample per essay).
- [ ] The feedback that reaches each student is in your voice and reflects your judgment, not a lightly edited transcript.
- [ ] Your disclosure practice matches your syllabus statement.

**Related:** [Your Syllabus AI Statement](syllabus-statement.md), where your disclosure practice is written down, and the advisor note in [Making Sense of Your Score Reports](score-reports.md).
