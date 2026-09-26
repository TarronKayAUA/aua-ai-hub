---
last_reviewed: 2026-09-25
action:
  - text: Open the Lecture outline builder
    link: prompts/index.md#lecture-outline-builder
  - text: Read the lecture guide
    link: playbooks/lecture-prep.md
    style: secondary
---

# Worked Example: Outlining a Physiology Lecture

<span class="meta-chip">For faculty</span><span class="meta-chip">About 9 minutes</span>

What the Lecture outline builder gives back for a 50-minute session, and the checking that turns it into something you can teach from.

The session details are invented for this example. Claude's outline is its real output, unedited, and long, as a real one is: [what to check](#what-to-check) follows it. The same prompt can word things differently each time and in each tool, so yours may differ in the details.

## What went in

The prompt, followed by these details, given to Claude together.

!!! note "The session details (invented for this example)"

    Duration: 50 minutes<br>
    Audience: Year 1, cardiovascular physiology<br>
    Topic: The cardiac cycle in the left heart

    Objectives:

    1. Describe the pressure changes in the left atrium, left ventricle, and aorta during one cardiac cycle.
    2. Relate the opening and closing of the mitral and aortic valves to these pressure changes.
    3. Identify the phases of the cardiac cycle on a left ventricular pressure-volume loop.
    4. Calculate stroke volume and ejection fraction from end-diastolic and end-systolic volumes.

    Constraints: Students covered cardiac action potentials and the electrocardiogram (ECG) last week. The Wiggers diagram must appear.

## The prompt

The [Lecture outline builder](../prompts/index.md#lecture-outline-builder) from the Prompt Library, word for word, as it stood in September 2026. It shows its time arithmetic first, maps every section to one objective, writes out an active check for each, and marks as [VERIFY] any factual claim you did not supply and no attached source supports.

## What came back

!!! quote "Output from Claude, September 2026, unedited"

    **Time arithmetic**

    - Duration 50 minutes; 10% buffer = 5 minutes left unallocated, so 45 minutes to plan.
    - Opener 3 + close 3 = 6 minutes, leaving 39 minutes for four sections, one per objective.
    - Sections of 10, 10, 10, and 9 minutes, each ending in a 2-minute active check.
    - Total: 3 + 10 + 10 + 10 + 9 + 3 = 45 minutes. All four objectives fit; nothing needs trimming.

    **Opener (3 min, 0:00 to 0:03).** Invented case.
    A 72-year-old woman gets chest pain when she climbs stairs and has a harsh systolic murmur heard best at the right upper sternal border [VERIFY]. At cardiac catheterization, her peak left ventricular pressure is 180 mm Hg while her peak aortic pressure is 120 mm Hg [VERIFY]. Ask: "The aortic valve is open while the ventricle ejects. How can these two pressures be 60 mm Hg apart?" Leave it unanswered until the close.

    **Section 1 (10 min, 0:03 to 0:13). Objective 1: pressures in the left atrium, left ventricle, and aorta**

    - Build the Wiggers diagram live. Start from last week's ECG as the time axis, then add the aortic, left ventricular, and left atrial pressure traces.
    - Left ventricle: low during filling (below about 12 mm Hg) [VERIFY], a steep rise just after the QRS complex, a peak near 120 mm Hg [VERIFY], then a steep fall as the ventricle relaxes.
    - Aorta: between about 80 and 120 mm Hg [VERIFY]. It never falls to ventricular diastolic levels, because the stretched aortic wall recoils and holds pressure up during diastole [VERIFY].
    - Left atrium: low throughout, with an a wave from atrial contraction and a v wave as the atrium fills against a closed mitral valve [VERIFY].
    - **Active check (single best answer, 2 min):** At which point in the cardiac cycle is aortic pressure at its lowest?
        - (A) At the dicrotic notch
        - (B) At the end of rapid ejection
        - (C) During atrial contraction
        - (D) Just after the mitral valve opens
        - (E) Just before the aortic valve opens
        - Key: E. Aortic pressure falls throughout diastole as blood runs off to the tissues, and keeps falling through isovolumetric contraction, so its lowest point is the instant before ejection begins [VERIFY].

    **Section 2 (10 min, 0:13 to 0:23). Objective 2: the valves and the pressures that move them**

    - One rule for every valve: it opens when the pressure behind it exceeds the pressure ahead of it, and closes when that difference reverses [VERIFY].
    - Mark the four crossings on the Section 1 diagram:
        - Mitral valve closes when left ventricular pressure rises above left atrial pressure; isovolumetric contraction begins; first heart sound (S1) [VERIFY].
        - Aortic valve opens when left ventricular pressure rises above aortic pressure, at about 80 mm Hg [VERIFY]; ejection begins.
        - Aortic valve closes when left ventricular pressure falls below aortic pressure; dicrotic notch; second heart sound (S2) [VERIFY].
        - Mitral valve opens when left ventricular pressure falls below left atrial pressure; filling begins [VERIFY].
    - Between each closing and the next opening is an isovolumetric phase: both valves are closed and ventricular volume does not change [VERIFY].
    - **Active check (think-pair-share, 2 min):** "With a partner, put these four events in order, starting at the end of filling, and name the pressure crossing behind each: aortic valve opens, aortic valve closes, mitral valve opens, mitral valve closes." Listen for: mitral closes (ventricle above atrium), aortic opens (ventricle above aorta), aortic closes (ventricle below aorta), mitral opens (ventricle below atrium).

    **Section 3 (10 min, 0:23 to 0:33). Objective 3: the phases on the pressure-volume loop**

    - **Spaced retrieval (from Section 2):** before drawing the loop, ask the room to name the four valve events in order. Each one becomes a corner of the loop.
    - Axes: left ventricular volume across, pressure up; one cycle runs counterclockwise [VERIFY].
    - Corners: bottom right, mitral valve closes (end-diastolic volume); top right, aortic valve opens; top left, aortic valve closes (end-systolic volume); bottom left, mitral valve opens [VERIFY].
    - Sides: right, isovolumetric contraction; top, ejection; left, isovolumetric relaxation; bottom, filling [VERIFY].
    - The loop's width is the stroke volume, which leads into Section 4.
    - **Active check (poll, 2 min):** "Which side of the loop is isovolumetric relaxation?" Options: bottom, left, right, top. Answer: left, where volume stays at end-systolic volume while pressure falls.

    **Section 4 (9 min, 0:33 to 0:42). Objective 4: stroke volume and ejection fraction**

    - Stroke volume = end-diastolic volume minus end-systolic volume. Ejection fraction = stroke volume divided by end-diastolic volume.
    - Worked example: end-diastolic volume 120 mL and end-systolic volume 50 mL give a stroke volume of 70 mL and an ejection fraction of 70/120, about 58%. These are typical resting values [VERIFY]; a normal resting ejection fraction is often quoted as roughly 55 to 70% [VERIFY].
    - Point back to the loop: the same 70 mL is its width.
    - **Active check (single best answer, 2 min):** A left ventricle has an end-diastolic volume of 140 mL and an end-systolic volume of 84 mL. What is its ejection fraction?
        - (A) 40%
        - (B) 56%
        - (C) 60%
        - (D) 67%
        - (E) 167%
        - Key: A. Stroke volume is 140 minus 84 = 56 mL, and 56/140 = 40%. (B) reads the stroke volume in mL as a percentage, (C) is end-systolic over end-diastolic volume, (D) is stroke volume over end-systolic volume, and (E) is end-diastolic over end-systolic volume.

    **Close (3 min, 0:42 to 0:45)**

    - Back to the opener: with a normal valve, left ventricular and aortic pressures are nearly equal during ejection [VERIFY]. A narrowed aortic valve resists flow, so the ventricle must reach a higher pressure to eject. Her 60 mm Hg is the gradient across the valve, which would show on the Wiggers diagram as a gap between the two traces during ejection [VERIFY].
    - One takeaway per objective:
        1. Left ventricular pressure swings from under about 12 mm Hg to about 120 mm Hg; aortic pressure stays between about 80 and 120 mm Hg; left atrial pressure stays low [VERIFY].
        2. Every valve event is a pressure crossing.
        3. On the loop, the two vertical sides are the isovolumetric phases, the top is ejection, and the bottom is filling.
        4. Stroke volume is end-diastolic minus end-systolic volume; ejection fraction is stroke volume divided by end-diastolic volume.

    **Buffer (5 min, 0:45 to 0:50).** Unallocated.

    **Cut list**

    1. First: the a and v waves on the left atrial trace (Section 1). Keep the three main traces.
    2. Second: the worked example in Section 4. Its active check does the same calculation.
    3. Third: drawing the loop live in Section 3. Show a finished loop and keep the poll.

    A note on the numbers: the physiology here is settled, but typical values differ a little between textbooks, so check each [VERIFY] number against the text your course assigns.

## What to check

The prompt marks what it supplied with [VERIFY], so most of the checking is visible. The flags are a help, not a guarantee. These are the lines a careful physiologist checks, and why.

1. **"Total: 3 + 10 + 10 + 10 + 9 + 3 = 45 minutes."** The sums add up, and the prompt shows them so you can check. Check them against the room you teach in: if the session really starts late, say "tighten to 45 minutes".
2. **Every [VERIFY], and the claims without one.** Each flag marks something Claude supplied rather than you. The flags are incomplete: "The loop's width is the stroke volume", the poll's answer, and takeaways 2 to 4 carry none, and the closing note says to check the numbers when mechanisms need checking too. Treat every physiological statement as unchecked until you have checked it.
3. **"Her 60 mm Hg is the gradient across the valve, which would show on the Wiggers diagram as a gap between the two traces during ejection [VERIFY]."** The one real error. 180 and 120 mm Hg are two peaks that do not happen at the same moment, so their difference is a peak-to-peak gradient, not a pressure difference measured at one moment; the [echocardiography guidelines](https://asecho.org/wp-content/uploads/2017/04/2017ValveStenosisGuideline.pdf) make the same distinction. A sharp student will ask.
4. **"Every valve event is a pressure crossing."** Right as a teaching rule, slightly too tidy: late in ejection, ventricular pressure falls a little below aortic pressure while blood keeps flowing out on its momentum, so the aortic valve closes just after the crossing. Decide whether your students need the nuance.
5. **"...a normal resting ejection fraction is often quoted as roughly 55 to 70%"** A common teaching range, but sources differ: the American Society of Echocardiography gives 52 to 72% for men and 54 to 74% for women. Teach one range and say where it comes from.
6. **The spaced retrieval point.** It asks students to recall what they did in the check just before, which is hardly spaced. Retrieval after a gap does more for long-term memory.
7. **The three answer keys (E, left, and A).** All correct, and the arithmetic holds (56/140 is 40%). Work each one yourself anyway, because students will learn whatever the key says.

## What we changed

Two edits to the text, after the checks above.

**The close.**

- **Before:** "Her 60 mm Hg is the gradient across the valve, which would show on the Wiggers diagram as a gap between the two traces during ejection [VERIFY]."
- **After:** "Her 60 mm Hg compares two peaks that happen at different moments, a peak-to-peak gradient. On the Wiggers diagram, the stenosis shows as left ventricular pressure running well above aortic pressure for most of ejection."

**The ejection fraction range.**

- **Before:** "a normal resting ejection fraction is often quoted as roughly 55 to 70% [VERIFY]"
- **After:** "a normal resting ejection fraction is about 52 to 72% in men and 54 to 74% in women (American Society of Echocardiography)"

The other [VERIFY] lines checked out against the sources below (the valve rule as a deliberate simplification), so their flags came off, and the retrieval question moved to the start of Section 4, ten minutes after Section 2 ends.

??? note "The physiology in this example, and where it was checked"

    - Left ventricular pressure: under about 12 mm Hg at the end of filling (CV Physiology gives 8 to 12), a peak of about 120 mm Hg at rest.
    - Aortic pressure: about 80 to 120 mm Hg. The aortic valve opens when left ventricular pressure exceeds aortic diastolic pressure, about 80 mm Hg.
    - Valve events: the mitral valve closes as left ventricular pressure rises above left atrial pressure (S1, with tricuspid closure); the aortic valve opens, then closes at the dicrotic notch (S2, with pulmonic closure), just after ventricular pressure falls below aortic pressure; the mitral valve opens as ventricular pressure falls below atrial pressure.
    - Left atrial pressure: an a wave from atrial contraction and a v wave from filling against a closed mitral valve.
    - Pressure-volume loop: volume across, pressure up, counterclockwise; the corners and sides are as the outline gives them, and the loop's width is the stroke volume.
    - Stroke volume is end-diastolic minus end-systolic volume, and ejection fraction is stroke volume over end-diastolic volume. 120 and 50 mL are typical teaching values; OpenStax gives about 130 mL end-diastolic and 50 to 60 mL end-systolic.
    - Aortic stenosis: exertional chest pain (angina) is one of the classic symptoms, and the murmur is a harsh crescendo-decrescendo ejection murmur heard best at the upper sternal borders. Normally the gradient across the aortic valve during ejection is a few mm Hg; in stenosis, left ventricular pressure is much higher than aortic pressure during ejection.
    - The keys: E, left, and A (140 minus 84 is 56 mL, and 56/140 is 40%).

    Checked in September 2026 against [OpenStax Anatomy and Physiology 2e, section 19.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-3-cardiac-cycle), CV Physiology's pages on the [cardiac cycle](https://cvphysiology.com/heart-disease/hd002), the [pressure-volume loop](https://cvphysiology.com/cardiac-function/cf024), [reduced ejection](https://cvphysiology.com/heart-disease/hd002d), and [valve stenosis](https://cvphysiology.com/heart-disease/hd004), the [Merck Manual's aortic stenosis page](https://www.merckmanuals.com/professional/cardiovascular-disorders/valvular-disorders/aortic-stenosis), and the American Society of Echocardiography's [chamber quantification summary](https://www.asecho.org/wp-content/uploads/2018/08/WFTF-Chamber-Quantification-Summary-Doc-Final-July-18.pdf) and [aortic stenosis update](https://asecho.org/wp-content/uploads/2017/04/2017ValveStenosisGuideline.pdf).
