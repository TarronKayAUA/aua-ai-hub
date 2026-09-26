---
last_reviewed: 2026-09-25
action:
  - text: Open the Administrative Drafting guide
    link: playbooks/admin-drafting.md#the-workflow
---

# Worked Example: A Memo and Meeting Minutes

<span class="meta-chip">For faculty and staff</span><span class="meta-chip">About 6 minutes</span>

Two everyday drafting jobs, a schedule-change memo and the minutes of the meeting that agreed it, drafted from facts and notes, and the checking that makes them safe to send.

The facts and notes are invented for this example, and the people are roles rather than names. Claude's drafts are its real output, unedited. The same instruction can word things differently each time and in each tool, so yours may differ in the details.

## What went in

One instruction, used twice in one conversation: first with the memo facts, then with the meeting notes.

!!! note "The memo facts (invented for this example)"

    - From: Course Director, Year 1 Physiology
    - To: Year 1 physiology faculty and small-group facilitators
    - The renal physiology practical moves from Thursday, October 15, 2026 to Tuesday, October 20, 2026.
    - Same time: 1:00 to 3:00 pm.
    - Reason: the simulation lab is closed on October 15 for equipment installation.
    - Room for October 20: not confirmed yet.
    - The course office will tell the students; facilitators do not need to.
    - Facilitators: reply to the course office by Friday, October 9, to confirm you can attend on the new date.
    - The handout and pre-reading are unchanged.

!!! note "The meeting notes (invented for this example)"

    Year 1 course directors, monthly meeting, Wed Sept 30, 12 to 1

    Present: chair (Year 1 lead), course directors (CDs) for physiology, anatomy, biochemistry; curriculum office coordinator. Apologies: histology CD.

    1. Renal practical: lab closed Oct 15 (equipment install), moving to Tue Oct 20, same time. Agreed. Physiology CD sends memo this week. Room still open, coordinator checking with facilities.
    2. Formative quizzes: anatomy wants to move its weekly quiz from Fri to Mon so it doesn't clash with physiology's. Biochem worried Mon clashes with their review session. No decision. Anatomy and biochem to talk, bring a proposal next meeting.
    3. Midterm review week: agreed each course gets one 2-hour review session in the week of Oct 26. Coordinator drafts timetable by Oct 14.
    4. Any other business: none.

    Next meeting Wed Oct 28, same time.

These facts and notes are invented and hold nothing confidential, so they are ordinary material for any capable assistant. Confidential personnel information, student education records, patient health information, and AUA proprietary business information stay out of public artificial intelligence (AI) tools under the [AI Responsible Use Policy](../governance/policy.md#responsible-use), unless the AI Responsible Use Subcommittee has vetted and approved a tool for that data. For a document about an individual, the guide shows how to draft with placeholders and add the specifics yourself.

## The prompt

The Prompt Library has no memo prompt, so this uses the instruction from step 2 of [Administrative Drafting](../playbooks/admin-drafting.md#the-workflow), word for word:

> Draft a memo from exactly these facts; where information is missing, write [TO CONFIRM] rather than filling the gap.

For the minutes, the same sentence with "minutes from exactly these notes". Step 3 of the guide adds one of your own past memos, so the draft follows your structure and voice; this example leaves it out.

## What came back

!!! quote "Output from Claude, September 2026, unedited: the memo"

    **MEMO**

    **To:** Year 1 physiology faculty and small-group facilitators<br>
    **From:** Course Director, Year 1 Physiology<br>
    **Date:** [TO CONFIRM]<br>
    **Subject:** Renal physiology practical moved to Tuesday, October 20

    The renal physiology practical is moving from Thursday, October 15, 2026 to Tuesday, October 20, 2026. The time is unchanged: 1:00 to 3:00 pm.

    The change is needed because the simulation lab is closed on October 15 for equipment installation.

    **Room:** [TO CONFIRM]. The room for October 20 has not been confirmed yet.

    **What you need to do:** reply to the course office by Friday, October 9, to confirm that you can attend on the new date.

    **What you do not need to do:** tell the students. The course office will let them know.

    The handout and pre-reading are unchanged.

!!! quote "Output from Claude, September 2026, unedited: the minutes"

    **Year 1 Course Directors: Minutes of the Monthly Meeting**

    **Date:** Wednesday, September 30, 2026, 12:00 to 1:00 pm<br>
    **Location:** [TO CONFIRM]<br>
    **Present:** Chair (Year 1 lead); Course Directors for Physiology, Anatomy, and Biochemistry; Curriculum Office Coordinator<br>
    **Apologies:** Course Director, Histology

    **1. Renal physiology practical**<br>
    The simulation lab is closed on October 15 for equipment installation. The committee agreed to move the renal practical to Tuesday, October 20, at the same time. The Physiology Course Director will send a memo this week. The room for October 20 is still open; the Curriculum Office Coordinator is checking with facilities.

    **2. Formative quizzes**<br>
    Anatomy would like to move its weekly quiz from Friday to Monday so that it does not clash with the physiology quiz. Biochemistry was concerned that Monday would clash with its review session. No decision was made. Anatomy and Biochemistry will discuss the options and bring a proposal to the next meeting.

    **3. Midterm review week**<br>
    Agreed: each course will have one 2-hour review session in the week of October 26. The Curriculum Office Coordinator will draft the timetable by October 14.

    **4. Any other business**<br>
    None.

    **Actions**

    | Action | Owner | Due |
    | --- | --- | --- |
    | Send the memo on the renal practical change | Physiology Course Director | This week [TO CONFIRM: date] |
    | Confirm the room for October 20 with facilities | Curriculum Office Coordinator | [TO CONFIRM] |
    | Bring a proposal on quiz days | Anatomy and Biochemistry Course Directors | Next meeting |
    | Draft the review-week timetable | Curriculum Office Coordinator | October 14 |

    **Next meeting:** Wednesday, October 28, 12:00 to 1:00 pm.

## What to check

Both drafts are close to ready, which is when a slip gets through. These are the lines a careful sender checks, and why.

1. **Every [TO CONFIRM].** Two in the memo (the date and the room) and three in the minutes (the location and two due dates). They are the gaps made visible: fill each one or take it out before anything is sent.
2. **"What you need to do: reply to the course office"** and **"What you do not need to do: tell the students."** The facts gave both to facilitators. The memo addresses them to everyone on the To line, including faculty who are not facilitating.
3. **"The committee agreed to move the renal practical..."** The notes never call this meeting a committee. Minutes are the record of who decided what, so name the group as it is.
4. **"No decision was made."** One risk in drafted minutes is a discussion written up as a decision. It held here; check every "agreed" against your notes anyway (items 1 and 3 were agreed, item 2 was not).
5. **What the notes did not say.** "12:00 to 1:00 pm" reads "12 to 1" as midday, the year comes from the memo earlier in the conversation, and "Confirm the room ... with facilities" turns "checking with facilities" into a promise to confirm, which is more than the notes record. Each is a reasonable reading, and each is the model's, so confirm it.
6. **"The room for October 20 is still open..."** Shorthand carried over from the notes. In minutes it could mean the room is free; what is true is that no room is confirmed yet.
7. **Every date and weekday.** All correct here: Thursday, October 15; Tuesday, October 20; Friday, October 9; Wednesday, October 28. A wrong weekday beside a right date is a common slip, and both documents are records, so check them against a calendar.

## What we changed

**The memo.** The date and room filled in before sending, and the two instructions addressed to the people they are for.

- **Before:** "**What you need to do:** reply to the course office by Friday, October 9, to confirm that you can attend on the new date. **What you do not need to do:** tell the students. The course office will let them know."
- **After:** "**Facilitators:** please reply to the course office by Friday, October 9, to confirm that you can attend on the new date. You do not need to tell the students; the course office will let them know."

**The minutes.** The committee label removed, the shorthand made plain, and the action matched to what was said.

- **Before:** "The committee agreed to move the renal practical to Tuesday, October 20, at the same time. ... The room for October 20 is still open; the Curriculum Office Coordinator is checking with facilities."
- **After:** "Agreed: the renal practical moves to Tuesday, October 20, at the same time. ... No room is confirmed for October 20 yet; the Curriculum Office Coordinator is checking with facilities."
- The action row "Confirm the room for October 20 with facilities" became "Check the room for October 20 with facilities", and the location, the meeting time, and the due dates were confirmed or removed.
