---
last_reviewed: 2026-09-25
action:
  - text: Open the question tutor
    link: prompts/index.md#nbme-style-question-tutor
  - text: Set it up for a whole course
    link: tools/standing-setups.md#worked-pattern-a-course-assistant
    style: secondary
---

# Worked Example: Practice Questions from a Lecture

<span class="meta-chip">For students</span><span class="meta-chip">About 6 minutes</span>

What a session with the National Board of Medical Examiners (NBME)-style question tutor looks like, from pasting a lecture to the first explained answer, and what to check before you trust it.

The lecture and the student's replies are invented for this example. Claude's messages are its real output, unedited. The same prompt can word things differently each time and in each tool, so your session may differ in the details.

## What went in

The prompt, then five slides from a Year 1 renal physiology lecture, given to Claude together. In a course Project the prompt goes in the instructions and the slides in the files; the session runs the same way.

!!! note "The lecture excerpt (invented for this example)"

    **Renal Physiology, Lecture 6: Sodium handling along the nephron**

    **Slide 1: Learning objectives**

    1. State the share of filtered sodium reabsorbed in each nephron segment.
    2. Name the main apical sodium transporter in each segment.
    3. Explain how aldosterone changes sodium and potassium handling in the collecting duct.

    **Slide 2: Filtered load**

    - About 25,000 mmol of sodium is filtered each day (glomerular filtration rate 180 L/day x plasma sodium 140 mmol/L).
    - Less than 1% of filtered sodium is normally excreted.

    **Slide 3: Where sodium is reabsorbed**

    - Proximal tubule: about 67%. Water follows, so reabsorption here is isosmotic.
    - Thick ascending limb of the loop of Henle: about 25%. This segment is impermeable to water.
    - Distal convoluted tubule: about 5%.
    - Late distal tubule and collecting duct: about 3%, adjusted by aldosterone.

    **Slide 4: How sodium enters the cell**

    - Proximal tubule: sodium-hydrogen exchanger (NHE3), and sodium cotransport with glucose, amino acids, and phosphate.
    - Thick ascending limb: sodium-potassium-2-chloride cotransporter (NKCC2), blocked by loop diuretics such as furosemide.
    - Distal convoluted tubule: sodium-chloride cotransporter (NCC), blocked by thiazide diuretics.
    - Principal cells of the late distal tubule and collecting duct: epithelial sodium channel (ENaC), blocked by amiloride.
    - In every segment, Na+/K+-ATPase on the basolateral membrane pumps sodium out of the cell into the blood.

    **Slide 5: Aldosterone**

    - Secreted by the zona glomerulosa of the adrenal cortex in response to angiotensin II and a high plasma potassium.
    - In principal cells it increases the number of open ENaC channels and the number of Na+/K+-ATPase pumps.
    - Net effect: more sodium reabsorbed and more potassium secreted into the urine.

Your own slides and notes are exactly what the tutor is built for. Question-bank and NBME items are a different matter. They are licensed content, and licensed material may not go into an artificial intelligence (AI) tool without a review under the [AI Responsible Use Policy](../governance/policy.md#intellectual-property-rights-and-copyright-issues), because the license may not permit it.

## The prompt

The [NBME-style question tutor](../prompts/index.md#nbme-style-question-tutor) from the Prompt Library, word for word, as it stood in September 2026. It lists your objectives and waits for you to confirm them, then asks one question at a time and explains only after you answer.

## What came back

**Output from Claude, September 2026, unedited.** Three messages. The two short replies between them are the student's, and are invented.

!!! quote "Claude, message 1: the objective checklist"

    Here are the learning objectives in your slides, as a numbered checklist:

    1. State the share of filtered sodium reabsorbed in each nephron segment.
    2. Name the main apical sodium transporter in each segment.
    3. Explain how aldosterone changes sodium and potassium handling in the collecting duct.

    Two parts of the slides are not covered by a stated objective: the filtered load calculation on Slide 2, and the diuretics named on Slide 4. I'll use them only as supporting detail in questions unless you want either one added as an objective of its own.

    Confirm the checklist or tell me what to change. I'll start in Exam mode; say "study mode" at any point to switch.

> **Student (invented):** Add the filtered load calculation from Slide 2 as objective 4. Keep the diuretics as supporting detail. Confirmed.

!!! quote "Claude, message 2: the first question"

    Question 1

    A 52-year-old man comes to the physician for a follow-up examination. His blood pressure has been 150/95 mm Hg or higher at three visits over the past 2 months. Treatment with hydrochlorothiazide is started. The nephron segment where this drug acts normally reabsorbs approximately what percentage of the filtered sodium load?

    (A) Less than 1%<br>
    (B) 3%<br>
    (C) 5%<br>
    (D) 25%<br>
    (E) 67%

> **Student (invented):** D

!!! quote "Claude, message 3: the explanation"

    The correct answer is (C) 5%.

    Hydrochlorothiazide is a thiazide diuretic. Your Slide 4 places the thiazide target, the sodium-chloride cotransporter (NCC), in the distal convoluted tubule, and Slide 3 gives that segment's share as about 5% of filtered sodium. The item takes two steps: drug to segment, then segment to share.

    - (A) Less than 1%: confuses the share a segment reabsorbs with the share excreted in the urine (Slide 2).
    - (B) 3%: the next segment along, the late distal tubule and collecting duct, where amiloride blocks ENaC; an adjacency error.
    - (D) 25%: the thick ascending limb, where loop diuretics such as furosemide block NKCC2; this mixes up thiazide and loop diuretics.
    - (E) 67%: the proximal tubule; assumes a drug acts where the most sodium is reabsorbed.

    Concept tested: matching a diuretic's site of action to the share of filtered sodium reabsorbed there.

    Objective 1, 2nd order.

    You chose (D), the loop diuretic site. One way to keep them apart, using your Slide 4: loop diuretics act in the loop (the thick ascending limb, NKCC2, about 25%), and thiazides act one segment later, in the distal convoluted tubule (NCC, about 5%). In order along the nephron, your slides give 67%, 25%, 5%, and 3%.

    Want one more question on this objective before we move on?

## What to check

The tutor is told to work only from your slides. These are the lines a careful student checks, and why.

1. **The checklist in message 1.** Compare it with your objectives slide, word for word. The tutor builds its questions around this list, so a dropped or reworded objective quietly shapes every question after it.
2. **"Your Slide 4 places the thiazide target ... in the distal convoluted tubule, and Slide 3 gives that segment's share as about 5% of filtered sodium."** Open the slides it names and confirm they say that. The prompt forbids invented page references; checking takes seconds and is how you catch the time one slips through.
3. **"Hydrochlorothiazide is a thiazide diuretic."** The one step in this question that is not on the slides: it comes from the drug's name. The prompt says every question must be answerable from your material, so when one leans on something your slides do not cover, say so and ask for another.
4. **"(C) 5%", and the other percentages.** These match your slides. Published figures differ slightly (the proximal tubule is often given as 65 to 70%, the distal convoluted tubule as 5 to 10%), so if a textbook disagrees with your slides, ask your instructor which figures the course expects.
5. **"(D) 25% ... mixes up thiazide and loop diuretics."** Check that this is really why you chose D. If it is not, say why you did ("I think the answer is D because..."): the prompt tells the tutor to re-check your slides and change the key only if they support you, so your reasoning gets a proper answer.
6. **"Objective 1, 2nd order."** The blood pressure history does not change the answer, so this is closer to linked recall than clinical reasoning. For harder questions, ask for them: "give me a 3rd-order".

## What we changed

One edit, made before any question was asked: the objective list.

- **Before:** the three objectives from Slide 1, with the filtered load calculation on Slide 2 left as background.
- **After:** "Add the filtered load calculation from Slide 2 as objective 4."
- **Why:** the tutor builds its questions around the checklist and uses the rest only as supporting detail. The lecture teaches a calculation, and making it an objective means practicing it directly.

??? note "The physiology in this example, and where it was checked"

    - Filtered load: 180 L/day x 140 mmol/L = 25,200 mmol a day, so "about 25,000" holds. Less than 1% is excreted on a typical diet.
    - Shares of filtered sodium: proximal tubule about 67% (65 to 70% in other sources), thick ascending limb about 25%, distal convoluted tubule about 5% (up to 10%), late distal tubule and collecting duct about 2 to 3%. The shares are rounded, which is why they add up to about 100% although a little sodium is excreted.
    - Apical entry: NHE3 and sodium cotransport in the proximal tubule; NKCC2 in the thick ascending limb, blocked by loop diuretics; NCC in the distal convoluted tubule, blocked by thiazides; ENaC in principal cells, blocked by amiloride.
    - Slide 4's last line is shorthand: the basolateral sodium-potassium pump (Na+/K+-ATPase) moves sodium into the interstitial fluid around the tubule, and from there it enters the peritubular capillaries.
    - Aldosterone: from the zona glomerulosa, released in response to angiotensin II and a high plasma potassium; in principal cells it increases open ENaC channels and Na+/K+-ATPase pumps, so more sodium is reabsorbed and more potassium secreted.
    - The question's key: hydrochlorothiazide, a thiazide, acts in the distal convoluted tubule, which the slides give as about 5%.

    Checked in September 2026 against OpenStax Anatomy and Physiology 2e, sections [25.6](https://openstax.org/books/anatomy-and-physiology-2e/pages/25-6-tubular-reabsorption) and [26.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/26-3-electrolyte-balance), OpenStax Pharmacology for Nurses, sections [34.1](https://openstax.org/books/pharmacology/pages/34-1-introduction-to-diuretics) and [34.5](https://openstax.org/books/pharmacology/pages/34-5-thiazide-and-thiazide-like-diuretics), and Deranged Physiology's [renal handling of sodium](https://derangedphysiology.com/main/cicm-primary-exam/renal-system/Chapter-013/renal-handling-sodium).
