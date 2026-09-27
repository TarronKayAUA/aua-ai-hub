---
last_reviewed: 2026-09-26
action:
  - text: Open the Lecture Outline Builder
    link: prompts/index.md#lecture-outline-builder
  - text: Read the lecture guide
    link: playbooks/lecture-prep.md
    style: secondary
---

# Worked Example: Outlining a Physiology Lecture

<span class="meta-chip">Faculty</span><span class="meta-chip">About 11 minutes</span>

What the Lecture Outline Builder gives back for a 50-minute session, and the checking it needs before you teach from it. An outline is a starting point: the diagrams, your explanations, and a rehearsal still come after.

The session details are invented for this example. Claude's outline is its real output, unedited, and long, as a real one is: [what to check](#what-to-check) follows it. The same prompt can word things differently each time and in each tool, so yours may differ in the details.

## What Went In

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

## The Prompt

The [Lecture Outline Builder](../prompts/index.md#lecture-outline-builder) from the Prompt Library, word for word, as it stood in September 2026. It shows its time arithmetic first, maps every section to one objective, writes out an active check for each, and marks as [VERIFY] any factual claim you did not supply and no attached source supports.

## What Came Back

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

## What to Check

The prompt marks what it supplied with [VERIFY], so most of the checking is visible. The flags are a help, not a guarantee. These are the lines a careful physiologist checks, and why.

1. **"Total: 3 + 10 + 10 + 10 + 9 + 3 = 45 minutes. All four objectives fit; nothing needs trimming."** The sums add up, active checks included, and the prompt shows them so you can check. Arithmetic is not the same as fitting, though: whether the diagrams, discussion, and feedback really fit in those minutes takes a rehearsal to find out. If the session really starts late, say "tighten to 45 minutes".
2. **Every [VERIFY], and the claims without one.** Each flag marks something Claude supplied rather than you. The flags are incomplete: "The loop's width is the stroke volume", the poll's answer, and takeaways 2 to 4 carry none, and the closing note says to check the numbers when mechanisms need checking too. Treat every physiological statement as unchecked until you have checked it.
3. **The case, at both ends: "How can these two pressures be 60 mm Hg apart?" and "Her 60 mm Hg is the gradient across the valve, which would show on the Wiggers diagram as a gap between the two traces during ejection [VERIFY]."** The most consequential error, and it runs through the opener as well as the close. 180 and 120 mm Hg are two peaks that do not happen at the same moment, so their difference is a peak-to-peak gradient. Calling it a gradient is fine; treating it as the gap between the two traces at one moment is the error, because that gap is the instantaneous gradient, a different measurement. The opener sets up the same misreading by pairing the two peaks with "the aortic valve is open while the ventricle ejects". The [echocardiography guidelines](https://asecho.org/wp-content/uploads/2017/04/2017ValveStenosisGuideline.pdf) make the distinction, and note that the peak-to-peak value is smaller than the largest instantaneous difference. A sharp student will ask.
4. **"One rule for every valve ... closes when that difference reverses" and "Every valve event is a pressure crossing."** Useful as a teaching rule, but too absolute as written: late in ejection, ventricular pressure falls a little below aortic pressure while blood keeps flowing out on its momentum, so the aortic valve closes just after the crossing. Put that qualification in the teaching wording itself rather than leaving it as optional nuance.
5. **"Aortic pressure falls throughout diastole..."** (the Section 1 key). Nearly: just after the aortic valve closes there is a brief rise, the dicrotic wave, and then the decline. The key, E, is still correct.
6. **Two small descriptions in Section 1.** "Below about 12 mm Hg" is defensible, but the source range is clearer: left ventricular pressure is low during filling and reaches about 8 to 12 mm Hg at the end of filling. And "Start from last week's ECG as the time axis" is loose: the ECG is a trace plotted against time, so plot it and the three pressure traces on a shared time axis.
7. **"...a normal resting ejection fraction is often quoted as roughly 55 to 70%"** A reasonable broad teaching range, and the one the American Heart Association uses. The American Society of Echocardiography's 52 to 72% for men and 54 to 74% for women are reference ranges for adult left ventricular ejection fraction measured by two-dimensional echocardiography, so they depend on the method. Teach one range and say where it comes from and how it was measured.
8. **The spaced retrieval point.** It asks students, at the start of Section 3, for what they did in the check just before, so it is immediate retrieval practice rather than spaced. That is useful in itself, but spaced retrieval after intervening material generally does more for long-term retention ([Karpicke and Bauernschmidt, 2011](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Bauernschmidt_JEPLMC.pdf)).
9. **The cut list.** A teaching judgment rather than a fact to check. Cutting the a and v waves first weakens objective 1, which asks for atrial pressure; and the worked example and the active check use the same formula but do different jobs (showing, then practicing). Showing a prepared loop instead of drawing it live saves time without losing either.
10. **The three answer keys (E, left, and A).** All correct, and the arithmetic holds (70/120 is about 58%, and 56/140 is 40%). Work each one yourself anyway, because students will learn whatever the key says.

## What We Changed

Our edits, after the checks above. Claude's outline stays exactly as it came back; every "After" below is our revision, not Claude's output.

**The case, at both ends.**

- **Opener, before:** "The aortic valve is open while the ventricle ejects. How can these two pressures be 60 mm Hg apart?"
- **Opener, after:** "Her recorded ventricular and aortic systolic peaks differ by 60 mm Hg. Why can a narrowed aortic valve make the ventricle generate a much higher pressure even while the valve is open?"
- **Close, before:** "Her 60 mm Hg is the gradient across the valve, which would show on the Wiggers diagram as a gap between the two traces during ejection [VERIFY]."
- **Close, after:** "Her 60 mm Hg is a peak-to-peak gradient, calculated from the two pressure maxima, which do not happen at the same moment. It is not an instantaneous pressure difference. On the Wiggers diagram, the stenosis shows as left ventricular pressure running above aortic pressure for most of ejection, and the vertical gap between the traces at any one moment is the instantaneous gradient."

**The valve rule.**

- **Before:** "One rule for every valve: it opens when the pressure behind it exceeds the pressure ahead of it, and closes when that difference reverses [VERIFY]." Takeaway 2: "Every valve event is a pressure crossing."
- **After:** "Pressure differences drive passive valve opening and closing. In a simplified diagram, valve events line up with pressure crossings. Late in ejection, blood keeps moving forward briefly after the gradient reverses, so the aortic valve closes just after its crossing." Takeaway 2: "Valve events follow pressure differences; the aortic valve closes just after its crossing."

**Smaller physiology edits.**

- **Section 1 key, before:** "Aortic pressure falls throughout diastole as blood runs off to the tissues..." **After:** "After a brief rise just after the aortic valve closes (the dicrotic wave), aortic pressure declines as blood runs off to the tissues..." The key stays E.
- **Section 1, before:** "Start from last week's ECG as the time axis" and "low during filling (below about 12 mm Hg)". **After:** "Plot last week's ECG and the three pressure traces on a shared time axis" and "low during filling, reaching about 8 to 12 mm Hg at the end of filling".
- **Section 4, before:** "a normal resting ejection fraction is often quoted as roughly 55 to 70% [VERIFY]". **After:** "a normal resting ejection fraction is often quoted as roughly 55 to 70%; for adults measured by two-dimensional echocardiography, the American Society of Echocardiography's reference ranges are 52 to 72% in men and 54 to 74% in women". This adds measurement context; it does not correct the original range, which is a reasonable one.

**Timing and teaching choices.**

- **Time arithmetic, before:** "All four objectives fit; nothing needs trimming." **After:** "The planned activities total 45 minutes, leaving 5 minutes of buffer. Rehearse the diagrams, discussion, and feedback to see whether the scope fits."
- **Retrieval:** the question moved to the start of Section 4. That adds a retrieval opportunity after other material, although Section 3 also revisits the valve events while building the loop, so students will have met them only minutes before. For distributed practice, ask students for the sequence again after intervening material and in a later class, then give feedback.
- **Cut list:** reordered so the atrial waves go last. First, show a prepared loop instead of drawing it live; second, the worked example in Section 4; third, the a and v waves.

We checked the remaining [VERIFY] lines against the sources below. For this simplified, normal-heart teaching model they hold, so their flags came off in our copy; the note below lists what was checked. Checking against sources is not a rehearsal: the outline still needs its diagrams drawn, your explanations written, and a run-through before it is ready to teach.

??? note "The physiology in this example, and where it was checked"

    - Left ventricular pressure: low during filling, about 8 to 12 mm Hg at the end of filling (CV Physiology), and a peak of about 120 mm Hg at rest.
    - Aortic pressure: about 80 to 120 mm Hg in this illustrative example. The aortic valve opens when left ventricular pressure exceeds aortic diastolic pressure, about 80 mm Hg. Elastic recoil of the aortic wall holds pressure up during diastole. After valve closure there is a small notch and a brief rise (the dicrotic wave), then a slow decline to the lowest point just before the next ejection.
    - Valve events: the mitral valve closes as left ventricular pressure rises above left atrial pressure (S1, with tricuspid closure); the aortic valve opens, then closes at the dicrotic notch (S2, with pulmonic closure), just after ventricular pressure falls below aortic pressure, because blood keeps moving forward on its momentum briefly after the gradient reverses; the mitral valve opens as ventricular pressure falls below atrial pressure. Between each closing and the next opening, both valves are closed and volume does not change.
    - Left atrial pressure: an a wave from atrial contraction and a v wave from filling against a closed mitral valve. The smaller c wave is left out, which is reasonable at this scope.
    - Pressure-volume loop: volume across, pressure up, counterclockwise; the corners and sides are as the outline gives them, and the loop's width is the stroke volume.
    - Stroke volume is end-diastolic minus end-systolic volume, and ejection fraction is stroke volume over end-diastolic volume. 120 and 50 mL are typical teaching values; OpenStax gives about 130 mL end-diastolic and 50 to 60 mL end-systolic. The American Heart Association gives 55 to 70% as a normal ejection fraction; the American Society of Echocardiography's 2015 reference ranges for adults by two-dimensional echocardiography are 52 to 72% (men) and 54 to 74% (women).
    - Aortic stenosis: exertional chest pain (angina) is one of the classic symptoms, and the murmur is a harsh crescendo-decrescendo ejection murmur heard best at the upper sternal borders. Normally the gradient across the aortic valve during ejection is a few mm Hg; in stenosis, left ventricular pressure is much higher than aortic pressure during ejection. A catheter peak-to-peak gradient compares two maxima that occur at different moments; it is not an instantaneous pressure difference, and it is smaller than the largest instantaneous difference.
    - Spaced retrieval: repeated retrieval with longer gaps between attempts generally improves long-term retention more than retrieval with no gap; immediate retrieval is still useful practice.
    - The keys: E, left, and A (140 minus 84 is 56 mL, and 56/140 is 40%; 70/120 is about 58%).

    Checked in September 2026 against [OpenStax Anatomy and Physiology 2e, section 19.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-3-cardiac-cycle), CV Physiology's pages on the [cardiac cycle](https://cvphysiology.com/heart-disease/hd002), [atrial contraction](https://cvphysiology.com/heart-disease/hd002a), [reduced ejection](https://cvphysiology.com/heart-disease/hd002d), [isovolumetric relaxation](https://cvphysiology.com/heart-disease/hd002e), the [pressure-volume loop](https://cvphysiology.com/cardiac-function/cf024), and [valve stenosis](https://cvphysiology.com/heart-disease/hd004), the [Merck Manual's aortic stenosis page](https://www.merckmanuals.com/professional/cardiovascular-disorders/valvular-disorders/aortic-stenosis), the American Heart Association's ejection fraction page on heart.org, the American Society of Echocardiography's [chamber quantification summary](https://www.asecho.org/wp-content/uploads/2018/08/WFTF-Chamber-Quantification-Summary-Doc-Final-July-18.pdf) and [aortic stenosis update](https://asecho.org/wp-content/uploads/2017/04/2017ValveStenosisGuideline.pdf), and Karpicke and Bauernschmidt's [spaced retrieval study](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Bauernschmidt_JEPLMC.pdf).
