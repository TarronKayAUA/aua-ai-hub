---
last_reviewed: 2026-07-13
---

# Playbook: Feedback on Student Writing

**For faculty · works with any capable assistant in the [tools directory](../tools/index.md)**

--8<-- "includes/prompt-maturity-note.md"

## The task

Give substantive, rubric-grounded formative feedback on a stack of student writing (reflections, essays, reports, case write-ups) in a fraction of the usual time, without ever letting a model judge a student or a grade.

## Where AI helps, and where it hurts

AI is strong at the mechanical layer of feedback: applying your rubric consistently to the twentieth essay as to the first, spotting structural patterns (a missing counterargument, an unsupported claim, a conclusion that answers a different question), and offering alternative phrasings for points you want to make more kindly or more clearly. It is weak, and must be kept away from, everything that requires knowing the student: judging growth against their previous work, sensing what this particular writer can hear right now, and any decision that touches a grade. It also fails in a way specific to this task: models generate plausible-sounding praise and criticism that does not match the text in front of them, so every observation must carry a quote you can check.

One more failure mode is yours rather than the model's: feedback that arrives in a voice that is not yours teaches students that your feedback is not worth reading. The model drafts observations; the words that reach the student are yours.

## Gather first

- Your rubric or feedback criteria, written out (if they live in your head, this task is the reason to write them down).
- The assignment brief the students actually received.
- The submissions, **de-identified**: this step is not optional (see guardrails).

## The workflow

1. **De-identify first.** Remove names, identification numbers, and identifying details (a described clinical encounter can identify a student as surely as a name). Student submissions are educational records; identifiable student work never enters a public AI tool. A find-and-replace to "Student A, Student B" is usually sufficient and preserves your ability to map feedback back.
2. **Freeze the criteria.** Give the model your rubric and the assignment brief, have it restate the criteria as a numbered list, and correct it before any essay is read, the same frozen-rubric discipline as the [literature screening prompt](../prompts/index.md). Consistency across the stack is the whole point; a rubric that drifts mid-stack is worse than none.
3. **Run per essay, observations only.** For each submission ask for: rubric-grounded observations, each anchored to a verbatim quote from the essay; the single highest-leverage improvement; and one thing done genuinely well, also quote-anchored. Explicitly forbid grades, scores, rankings, and comparisons between students, and never paste one student's work as an exemplar for critiquing another's.
4. **Judge and rewrite.** Read each observation set against the essay. Discard what is wrong or tone-deaf (some will be), keep what you would have found yourself on a good day, add what only you can know, and rewrite the keepers in your own voice.
5. **Return it as yours, disclosed as your syllabus says.** How you disclose AI assistance in feedback is a course-level decision the [policy](../governance/policy.md) delegates to you; your [syllabus AI statement](syllabus-statement.md) is the place that decision lives, and students reasonably expect the same transparency about your AI use that you expect about theirs.

## Guardrails for this task

- The Family Educational Rights and Privacy Act (FERPA) treats student submissions as educational records: de-identification before any public AI tool is a hard requirement, not a courtesy.
- Grades stay entirely human. This playbook is for formative feedback; a model never scores, ranks, or contributes to a summative judgment.
- Do not build a mental model of a student from an AI's reading of their work; the observations are about the text, not the person.
- If your course restricts students' AI use, hold your own use to the standard your syllabus sets: disclosed and defensible.

## Before you rely on it

- [ ] Every submission was de-identified before upload, and spot-checked for indirect identifiers.
- [ ] Every observation's quote actually appears in the essay (models misquote; check a sample per essay).
- [ ] The feedback that reaches each student is in your voice and reflects your judgment, not a lightly edited transcript.
- [ ] No grade, score, or ranking was AI-touched at any step.
- [ ] Your disclosure practice matches your syllabus statement.
