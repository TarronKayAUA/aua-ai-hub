---
last_reviewed: 2026-09-26
action:
  - text: Open the question tutor
    link: prompts/index.md#nbme-style-question-tutor
  - text: Set it up for a whole course
    link: tools/standing-setups.md#worked-pattern-a-course-assistant
    style: secondary
---

# Worked Example: Practice Questions from a Lecture

<span class="meta-chip">For students</span><span class="meta-chip">About 7 minutes</span>

What a session with the National Board of Medical Examiners (NBME)-style question tutor looks like, from pasting a lecture to the first explained answer, and what to check before you trust it.

The lecture and the student's replies are invented for this example. Claude's messages are its real output, unedited. The same prompt can word things differently each time and in each tool, so your session may differ in the details.

## What went in

The prompt, then five slides from a Year 1 renal physiology lecture, given to Claude together. In a course Project, the prompt goes in the instructions and the slides in the files. The intended workflow is the same there; check that the tutor lists the right objectives and works from the lecture you meant.

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
    - Connecting tubule and collecting duct: about 3%, adjusted by aldosterone.
    - These shares are rounded estimates, and the segments are simplified compartments.

    **Slide 4: How sodium enters the cell**

    - Proximal tubule: sodium-hydrogen exchanger (NHE3), and sodium cotransport with glucose, amino acids, and phosphate.
    - Thick ascending limb: sodium-potassium-2-chloride cotransporter (NKCC2), blocked by loop diuretics such as furosemide.
    - Distal convoluted tubule: sodium-chloride cotransporter (NCC), blocked by thiazide diuretics.
    - Principal cells of the connecting tubule and collecting duct: epithelial sodium channel (ENaC), blocked by amiloride. ENaC also appears in the late distal convoluted tubule, where it overlaps with NCC.
    - In these sodium-reabsorbing cells, the Na+/K+-ATPase on the basolateral membrane pumps sodium out of the cell into the interstitial fluid. From there, sodium returns to the blood through the peritubular capillaries (and the vasa recta in the medulla).

    **Slide 5: Aldosterone**

    - Secreted by the zona glomerulosa of the adrenal cortex in response to angiotensin II and a high plasma potassium.
    - In principal cells it increases the abundance and activity of apical ENaC and the activity of the basolateral Na+/K+-ATPase.
    - Net effect: it promotes sodium reabsorption and potassium secretion into the urine. Potassium leaves the cell through apical potassium channels.

Use slides and notes you are permitted to upload, subject to your course's rules and the [Artificial Intelligence (AI) Responsible Use Policy](../governance/policy.md#intellectual-property-rights-and-copyright-issues). Question-bank and NBME items are a different matter: they are licensed content, and the policy does not allow licensed material into an AI tool without a review, because the license may not permit it.

## The prompt

The [NBME-style question tutor](../prompts/index.md#nbme-style-question-tutor) from the Prompt Library, word for word, as it stood in September 2026. It lists your objectives and waits for you to confirm them, then asks one question at a time and explains only after you answer. "NBME-style" names the format it aims for; its questions are not written, reviewed, or endorsed by the NBME.

## What came back

**Output from Claude, September 2026, unedited; run on the corrected input.** An earlier draft of these slides had imprecise lines, listed under [What we changed](#what-we-changed); they were corrected and the session run again, so everything below comes from the slides as shown above. Three messages. The two short replies between them are the student's, and are invented.

!!! quote "Claude, message 1: the objective checklist"

    Here are the learning objectives stated in your slides, as a numbered checklist:

    1. State the share of filtered sodium reabsorbed in each nephron segment.
    2. Name the main apical sodium transporter in each segment.
    3. Explain how aldosterone changes sodium and potassium handling in the collecting duct.

    Two parts of the slides are not tied to a stated objective: the filtered load calculation on Slide 2, and the diuretics on Slide 4 (furosemide, the thiazides, and amiloride). I'll use them only as supporting detail inside questions unless you want either added as an objective of its own.

    Please confirm the checklist or tell me what to change. I'll start in Exam mode; say "study mode" at any time to switch.

> **Student (invented):** Add the filtered load calculation from Slide 2 as objective 4. Keep the diuretics as supporting detail. Confirmed.

!!! quote "Claude, message 2: the first question"

    Question 1

    An investigator studies sodium transport in one nephron segment of an experimental animal. The segment reabsorbs about 25% of the filtered sodium load, and no water is reabsorbed across its wall. A drug is applied that blocks sodium entry across the apical membrane of the cells lining this segment. Which of the following transport proteins is the most likely target of this drug?

    (A) Epithelial sodium channel (ENaC)<br>
    (B) Sodium-chloride cotransporter (NCC)<br>
    (C) Sodium-hydrogen exchanger (NHE3)<br>
    (D) Sodium-potassium pump (Na+/K+-ATPase)<br>
    (E) Sodium-potassium-2-chloride cotransporter (NKCC2)

> **Student (invented):** B

!!! quote "Claude, message 3: the explanation"

    The correct answer is (E) Sodium-potassium-2-chloride cotransporter (NKCC2).

    Slide 3 describes one segment that reabsorbs about 25% of filtered sodium and is impermeable to water: the thick ascending limb of the loop of Henle. Slide 4 gives NKCC2 as the apical sodium entry step in that segment, blocked by loop diuretics such as furosemide. The item takes two steps: identify the segment from its share and its water handling, then name its apical transporter.

    - (A) ENaC: the channel in principal cells of the connecting tubule and collecting duct, which reabsorb about 3%; choosing it places the loop's work in the last, aldosterone-adjusted segments.
    - (B) NCC: the transporter of the next segment along, the distal convoluted tubule, which reabsorbs about 5%; an adjacency error, made easier by the similar names NCC and NKCC2.
    - (C) NHE3: the proximal tubule's exchanger, but there water follows sodium and reabsorption is isosmotic (Slide 3), which the stem rules out; this matches the segment by share of work rather than by water handling.
    - (D) Na+/K+-ATPase: present in these cells but on the basolateral membrane, pumping sodium out of the cell into the interstitial fluid (Slide 4); this confuses apical entry with basolateral exit.

    Concept tested: identifying a nephron segment from its share of sodium reabsorption and its water permeability, then naming its apical sodium entry step.

    Objective 2, 2nd order.

    You chose (B), the distal convoluted tubule's transporter. A way to keep the two apart using your slides: NKCC2 is the loop's transporter (thick ascending limb, about 25%, no water follows, blocked by loop diuretics), and NCC belongs to the segment after it (distal convoluted tubule, about 5%, blocked by thiazides). Along the nephron, your Slide 4 gives the apical entry steps in this order: NHE3, NKCC2, NCC, then ENaC.

    Want one more question on this objective before we move on?

## What to check

The tutor is told to work only from your slides. These are the lines a careful student checks, and why.

1. **The slides themselves.** The tutor reproduces your material faithfully, mistakes included, so an answer that matches your slides is only as good as the slides. The earlier draft of this lecture said the sodium pump moves sodium "into the blood" (it moves it into the interstitial fluid first), and a question built on that line could have repeated it. If a slide looks wrong or loose, ask your instructor, not the tutor.
2. **The checklist in message 1.** Compare it with your objectives slide, word for word. The tutor builds its questions around this list, so a dropped or reworded objective quietly shapes every question after it. Here it matches Slide 1 exactly.
3. **"Slide 3 describes one segment that reabsorbs about 25% of filtered sodium and is impermeable to water ... Slide 4 gives NKCC2 as the apical sodium entry step in that segment."** Open the slides it names and confirm they say that, and that nothing in the question comes from anywhere else. Here everything does come from Slides 3 and 4, but the promise does not always hold: when this example was first run, on the earlier draft of the slides, the first question named hydrochlorothiazide, a drug the slides never mention. It is a thiazide, but knowing that came from outside the lecture. When a question leans on something your slides do not cover, say so and ask for another.
4. **"...and no water is reabsorbed across its wall."** The clue matches your Slide 3, which calls the thick ascending limb impermeable to water. Most physiology texts describe the distal convoluted tubule as nearly impermeable to water too, so it is the 25%, not the water, that singles out the thick ascending limb. The question still has one defensible answer, but only because of the number.
5. **The reasons given for each wrong answer.** They are the tutor's guesses at why someone might choose each option; it cannot know what you were thinking. "Made easier by the similar names NCC and NKCC2" may or may not be why you chose B. The line for C does not hold together: it says choosing C "matches the segment by share of work", but the proximal tubule's share is about 67%, not the stem's 25%. If your reason was different, say so ("I think the answer is B because..."): the prompt tells the tutor to re-check your slides and change the key only if they support you.
6. **"Objective 2, 2nd order."** The order is the tutor's own label, counting linked steps; it does not measure difficulty. Here the stem's findings do decide the answer, but they are two facts from your slides, restated, so this is mostly linked recall. For application practice, ask for a question whose clinical or experimental findings have to be used to reach the answer, still from your slides only; if the slides cannot support one, the prompt tells the tutor to say so.
7. **The percentages.** These match your slides. Published figures differ (the proximal tubule is often given as 65 to 70%, the distal convoluted tubule as 5 to 10%), so if a textbook disagrees with your slides, ask your instructor which figures the course expects.

## What we changed

**The slides, before this run.** A review found imprecise lines in the earlier draft. They were corrected and the session run again from the start; nothing in Claude's messages was edited.

- **Slide 4, before:** "In every segment, Na+/K+-ATPase on the basolateral membrane pumps sodium out of the cell into the blood."
- **After:** "In these sodium-reabsorbing cells, the Na+/K+-ATPase on the basolateral membrane pumps sodium out of the cell into the interstitial fluid. From there, sodium returns to the blood through the peritubular capillaries (and the vasa recta in the medulla)."
- **Slide 3, before:** "Distal convoluted tubule: about 5%" and "Late distal tubule and collecting duct: about 3%". The distal convoluted tubule has a late part of its own, so the two labels overlapped.
- **After:** "Distal convoluted tubule: about 5%" and "Connecting tubule and collecting duct: about 3%", with a note that the shares are rounded and the segments simplified. Slide 4 now says that NCC and ENaC overlap in the late distal convoluted tubule.
- **Slide 5:** the aldosterone lines now say it increases the abundance and activity of ENaC and the activity of the pump, and that potassium leaves through apical potassium channels.

**The objective list, before any question was asked.**

- **Before:** the three objectives from Slide 1, with the filtered load calculation on Slide 2 left as supporting detail.
- **After:** "Add the filtered load calculation from Slide 2 as objective 4."
- **Why:** the tutor builds its questions around the checklist and uses the rest only as supporting detail. Adding the calculation to the checklist tells the tutor to include direct calculation practice. This excerpt ends before any calculation question, so check that later questions actually cover it.

??? note "The physiology in this example, and where it was checked"

    - Filtered load: 180 L/day x 140 mmol/L = 25,200 mmol a day, so "about 25,000" holds. Less than 1% is excreted on a typical diet.
    - Shares of filtered sodium: proximal tubule about 67% (65 to 70% in other sources), thick ascending limb about 25%, distal convoluted tubule about 5% (5 to 10% elsewhere), connecting tubule and collecting duct about 3% (OpenStax gives 5% for the collecting duct). The shares are rounded, which is why they add up to about 100% although a little sodium is excreted.
    - Water: reabsorption in the proximal tubule is roughly isosmotic, and the thick ascending limb is impermeable to water. Most physiology texts describe the distal convoluted tubule as nearly impermeable to water as well.
    - Apical entry: NHE3 and sodium cotransport in the proximal tubule; NKCC2 in the thick ascending limb, blocked by loop diuretics; NCC in the distal convoluted tubule, blocked by thiazides; ENaC in principal cells of the connecting tubule and collecting duct, blocked by amiloride. NCC and ENaC overlap in the late distal convoluted tubule.
    - The basolateral sodium-potassium pump (Na+/K+-ATPase) moves sodium into the interstitial fluid around the tubule, and from there it enters the peritubular capillaries (the vasa recta in the medulla).
    - Aldosterone: from the zona glomerulosa, released in response to angiotensin II and a high plasma potassium. In principal cells it increases the abundance and activity of apical ENaC and the activity of the basolateral pump, promoting sodium reabsorption and potassium secretion through apical potassium channels.
    - The question's key: a segment reabsorbing about 25% of filtered sodium with no water is the thick ascending limb, whose apical entry step is NKCC2. Hydrochlorothiazide, from the earlier run, is a thiazide and acts on NCC in the distal convoluted tubule.

    Checked in September 2026 against OpenStax Anatomy and Physiology 2e, sections [25.6](https://openstax.org/books/anatomy-and-physiology-2e/pages/25-6-tubular-reabsorption) and [26.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/26-3-electrolyte-balance), OpenStax Pharmacology for Nurses, sections [34.1](https://openstax.org/books/pharmacology/pages/34-1-introduction-to-diuretics) and [34.5](https://openstax.org/books/pharmacology/pages/34-5-thiazide-and-thiazide-like-diuretics), and Deranged Physiology's pages on [renal handling of sodium](https://derangedphysiology.com/main/cicm-primary-exam/renal-system/Chapter-013/renal-handling-sodium) and the [distal tubule and collecting duct](https://derangedphysiology.com/main/cicm-primary-exam/renal-system/Chapter-0063/distal-tubule-and-collecting-duct).
