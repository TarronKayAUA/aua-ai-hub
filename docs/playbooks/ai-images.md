---
last_reviewed: 2026-08-25
---

# Playbook: AI-Generated Images in Teaching

<span class="meta-chip">For faculty</span> <span class="meta-note">Anatomy, histology, pathology, and any teaching material where a picture carries the content</span>

## The task

You need a figure for a session, and the view you want does not turn up in the atlas or the slide bank. An image generator will produce something in seconds. This page is about whether to use it, what it costs when you do, and what to reach for instead.

The short version: artificial intelligence (AI) image generators are not a reliable source of anatomical teaching figures, the failure is not visible to a reader who does not already know the anatomy, and the alternative you want is usually a resource you have not exhausted yet rather than a generated picture.

## Why a wrong picture is worse than no picture

Two findings, from separate literatures, meet here.

Distinctive visual material tends to be remembered better than plain text, an effect documented since the 1970s. Recent work suggests the advantage comes from how perceptually distinctive the material is rather than from images being stored in a separate memory channel. No one has tested anatomical diagrams against anatomical terms, so the teaching-facing version is an extrapolation, but the practical expectation is reasonable: the picture on the slide is likely to outlast the words you say next to it.

Misunderstandings of core biomedical concepts then prove stubborn. In a two-tier test given to 987 medical students across an entire curriculum, incorrect responses fell between the first and second year and then stayed flat at roughly 35 percent from the second year through to the final year. A separate study, of 161 first-year students in cardiovascular physiology, points at confidence as what makes them stick: when a student was confident in a wrong answer, only 35.8 percent of those answers were later corrected, against 61.4 percent when confidence was low.

No one has run the study that joins these two findings, but the prediction is not subtle. An inaccurate image shown at first exposure is memorable, it arrives with the authority of a teaching slide, and it produces the kind of confident belief that later correction struggles against.

## What the evidence says about these tools

Peer-reviewed evaluations are consistent, and specific enough to be useful:

- A 2024 study in *Anatomical Sciences Education* found that none of three popular generators produced a skull, heart, or brain illustration that was both detailed and anatomically accurate. Foramina, suture lines, and coronary artery origins were routinely missing or wrong.
- In a 2025 study of 736 craniofacial images, physician reviewers scored even the best model below 3 out of 5 for anatomical detail, with foramina, suture lines, muscle origins and insertions, and neurovascular structures misrendered across every model tested. The same study reported that labels on those images were frequently illegible or nonsensical.
- A 2025 study generating 1,500 images for hand surgery patient education found fabricated anatomy in 99.8 percent of them, even though four of the six generators matched real patient-education materials on visual detail and clarity.
- A 2025 comparison in *Clinical Anatomy* found most tools could not render a thorax with the correct number of ribs, with bony structures the weakest area, though heart and brain depictions were mostly acceptable.

Notice what the second and third findings mean together. The images score well on looking detailed and badly on being right. Visual quality carries no information about accuracy, which is why a glance at whether a figure looks professional tells you nothing, and why the review that matters has to come from someone who knows the structure.

The mechanism is measurable. On a large 2025 benchmark, leading image models rendered recognizable objects 88 to 99 percent of the time but handled counting only 55 to 70 percent of the time and spatial relations 37 to 70 percent of the time, with accuracy falling as a prompt asks for more elements at once. Anatomy is largely counting and spatial relations.

Read those figures with one caveat. Published evaluations lag the products: the models tested above are one to three generations behind what vendors currently ship, and no independent evaluation of the newest image models on anatomical accuracy has been published. The numbers may understate current capability. What has not changed is that the failure modes are structural, and that you cannot tell from the image which case you are in.

!!! warning "This is unreliability, not uniform failure"
    The same *Clinical Anatomy* comparison found that all four generators produced accurate gross brain reconstructions, two of the four produced anatomically correct hearts, and one produced a satisfactory hand skeleton and sternum while the other three misrendered them. Models have also improved measurably between generations. The problem is not that everything comes out wrong; it is that you cannot tell which parts did. General-purpose vendors describe their image models in terms of speed, resolution, and visual quality, never clinical correctness, and none documents medical or anatomical validation. Where a specialist tool does advertise anatomical accuracy, its own instructions still tell you to have a clinician review the output.

## Generated pictures and rendered models are not the same thing

This is the distinction most worth carrying away, because it resolves the original problem rather than just forbidding an approach.

An **image generator** synthesizes plausible pixels. There is no body underneath it. Asked for a view that is unusual or hard to find, it does not report the difficulty; it produces something confident and wrong.

A **three-dimensional (3D) anatomy platform** renders a fixed model that human experts authored and reviewed. The best-documented platforms state what that geometry was built from, including imaging of a donated body, cadaver dissection, and published atlases; others document expert review but not the provenance of the model itself, so the four major products are not equivalent on this point. Rotating the view moves the camera around geometry that already exists, so the anatomy is not re-derived from angle to angle. That is the categorical difference from generation. It is not a claim that every possible viewing angle has been separately validated, and no vendor makes that claim.

If your school or library licenses one of these platforms, it is the right answer to "I need a view no atlas shows." Check with the library rather than assuming access.

## Look harder before you generate

The situation that sends people to a generator is usually this one: every figure you can find of a structure is a section, and you want it from another direction. It is tempting to conclude the view does not exist.

Often it does exist, and the reason you did not find it is worth knowing. A structure that lies deep to another is hidden rather than absent, and atlases handle that by removing or reflecting what covers it rather than by changing the angle. Those plates are then captioned by what was taken away, which is precisely the wording that a search on the structure's own name will not surface. Sectional diagrams sit alongside them for a different job, showing how neighboring spaces relate rather than showing the structure face on. And the view you want may already exist in the radiology literature, in whichever imaging plane is standard for that region rather than the one you were picturing.

The search failed, not the literature. There is also a cost to skipping past this that is easy to miss: why a structure is awkward to depict is often itself the anatomy, and a generated picture that renders it conveniently visible erases the very relationship a student needs to understand.

Before generating, work through the atlas plate list and its captions rather than the index, a 3D platform if you have one, a colleague who teaches the region, a librarian, and the radiology literature for the corresponding imaging plane.

## The one workflow with evidence behind it

It is not generation. In a 2026 study, AI editing of an already accurate human-made illustration was ranked at or near the top by expert anatomy lecturers on accuracy and overall quality, while images generated from a text prompt were not. If you have a correct figure and need it adjusted, recolored, relabeled, or cropped, that is a different and better-supported use than asking for a structure to be drawn from nothing. The correctness comes from the illustration you started with, so it still needs checking after the edit.

## Using a flawed image on purpose

Asking students to find what is wrong with an inaccurate image is real pedagogy, and it is a reasonable instinct when you are looking at a figure you have already made. Several things are worth knowing before you build a session around it.

**It has been studied, and the result was sobering.** In a 2026 study, 121 students compared correct ophthalmic anatomy images against AI-generated variants containing deliberate errors, with immediate instructor feedback. Post-test knowledge scores did not differ from the control for either group. Educational background moderated only the self-reported outcomes, and not in the direction you might expect: students without medical training reported higher satisfaction and higher confidence in their own performance, while the medical students reported no benefit at all. Note also what the study had to do to run the exercise. Ophthalmologists and anatomists designed each error deliberately, one known error type per image, and only about a third of the generated candidates passed expert review for use.

Two things keep that null from settling the question. The study measured immediately and did not assess retention, and in one erroneous-examples study the benefit was absent on the immediate test and significant a week later. The wider family of designs also has support: across 53 studies, having learners grapple with a problem before instruction outperformed instruction first, with a moderate effect, provided a consolidation phase follows.

**Spotting someone else's errors may be the weaker version of the design.** In a 2023 set of experiments, learners who generated a wrong answer themselves and then corrected it outperformed a control group that spotted and corrected the same errors their peers had made. That specific comparison is one experiment within one study of undergraduates reading science texts, so treat it as a reason to prefer the stronger design rather than as a settled result. The cheap change it suggests: have students predict or sketch the structure first, then compare against both the flawed image and the correct one.

The evidence supports the format only under these conditions:

- **Not at first exposure.** Studying flawed examples helped transfer for learners who already had reasonable prior knowledge, while learners with weak prior knowledge did better with correct examples only. A novice has no way to tell which parts of the image are the deliberate errors, and calling the activity a critique does not guarantee they leave holding the correct version.
- **The correct image is present.** Side by side, so the comparison drives retrieval of real relationships rather than free-floating suspicion.
- **Every error named in the debrief.** Students who analyzed contrasting cases and then received explicit instruction outperformed students who analyzed the same cases twice with no telling. An error nobody caught, left uncorrected, is worse than the same error in an ordinary figure, because the exercise implied the rest of the image was sound.
- **Decided in advance.** "This figure turned out wrong, so let us make it a critique exercise" is how an inaccurate image stays on the slide with a justification attached.

These are floors, not a guarantee. The ophthalmic study already showed each flawed image beside its correct counterpart and gave immediate feedback naming every error, which is two of these four conditions, and still found no knowledge gain. One more caution: the only outcomes that moved in that study were self-reported, and in the erring experiments learners could not identify which condition had actually helped them even after being tested. Positive student feedback is not evidence that the exercise taught the anatomy.

## Before you rely on any of it

- The [AI Responsible Use Policy](../governance/policy.md) makes you accountable for the final output, requires you to verify the accuracy and validity of AI-generated content before using it, and asks you to consult faculty or other experts when you are unsure of it. For an anatomical figure, verifying accuracy means someone who knows the anatomy checking the anatomy.
- Labels are the one failure you can check without knowing the structure. Typography in generated images has improved, but a legible word is not the same as the right word in the right place.
- If a generated image is already in your material and it is wrong, take it out. Removing it costs one slide. Leaving it costs a correction you may never get to make, in students who will be confident.
- Patient images, identifiable clinical photographs, and licensed atlas figures are governed by [The Rules](../pathway/rules.md) and by the license on the material, whatever tool is involved.

Students are meeting these tools too, and generating their own study figures. The student-facing version of this guidance is on the [Common Misconceptions](../basics/misconceptions.md) page.
