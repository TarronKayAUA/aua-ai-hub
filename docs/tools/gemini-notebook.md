---
last_reviewed: 2026-09-01
---

# Gemini Notebook: Grounded in Your Own Sources

<span class="meta-chip">For everyone</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">Widely used at AUA, which is why it has its own page</span>

Gemini Notebook is a research notebook that answers questions from the documents you upload, with a citation back to the passage, rather than from general knowledge of the web. Finding and quoting inside your own material is what it does best; every summary, study guide, or audio overview it generates from that material is a step further from the source and needs checking. (It was NotebookLM until Google renamed it on July 16, 2026 ([announcement](https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/)); same product, existing notebooks and links still work.)

| Reliable for | Weaker at |
| --- | --- |
| Locating a fact or passage across a fixed set of sources | Study guides, reports, and other summaries, where emphasis shifts |
| Answers with a citation you can open and check | Audio and video overviews generated from primary research |
| Guideline lookup with the guideline in the notebook | Appraisal and judgment, such as rating a study's quality |
| Questions across a whole term of lecture material at once | Harder questions whose wording does not match the source's keywords |

What makes it different from a chat assistant is that it answers from the documents you upload rather than from general knowledge of the web. Two features are exceptions worth knowing: Discover sources searches the web or your Google Drive, and Deep Research browses on your behalf. Both add what they find as sources you can see and check, so the grounding principle holds, but the material is no longer only what you chose. Opening the same notebook from inside the Gemini app is a different matter, and is not source-only.

## What it is for

Grounding pays off when you need to **find and use something specific inside a fixed set of documents**. That is the job it is built for, and studies across several clinical specialties have found it more accurate than a general assistant working from memory when the right document is in the notebook.

In practice:

- **Ask questions across a stack of material at once.** A term of lecture handouts, or the twelve papers for a project, become one thing you can interrogate.
- **Locate rather than recall.** "Which of these lectures covers the coagulation cascade, and what does it say about factor V?" is what it is built for.
- **Generate study formats from your own material.** Notes, mind maps, reports (including study guides, briefing documents, and frequently asked questions), flashcards and quizzes, data tables, slide decks, infographics, audio overviews, and video overviews.

Answers carry inline citations, and clicking one jumps to the passage in the source. Two caveats: Google notes that a very short source is cited as a whole document rather than a passage, and a citation being attached is not proof that the passage supports the sentence.

## What grounding does not do

How accurate any of this is on a given day depends on the current model and on what you put in the notebook, and it improves. Three limits are worth knowing anyway, because they follow from what the tool does rather than from how good the model is, and they have held so far across every generation.

**It does not fact-check your sources.** Grounding means answering from your documents, not verifying them. Upload something wrong and it will relay it confidently, with a citation attached. This is not a gap waiting to be closed; it is the design working as intended, and it puts the burden of source quality entirely on you.

**Retrieval is selective.** With many sources it searches and picks passages rather than reading everything, so something you uploaded can be missing from an answer without the answer saying so. Absence of a fact is not evidence the fact is absent from your material.

**Every transformation is a further step away from the source.** A study guide, a summary, or an audio overview has to decide what matters, and that is where emphasis shifts, qualifications drop, and a single author's view becomes a general statement. Independent evaluations have consistently found the derived formats less faithful than direct answers, even when the underlying facts are extracted correctly, and settled material such as textbook chapters survives the process better than primary research does, whose findings live in exactly the caveats that summarizing strips.

!!! tip "The rule that follows from all of this"
    Finding and quoting is what it does best. Every transformation into a study guide, podcast, or verdict is a further place where errors enter, so open the citation and confirm the passage actually says what the answer claims.

    For exam preparation this means material generated from your lectures is a revision aid, not a source of truth. The moment you cannot trace a claim to a passage in your own upload, check it against the lecture.

    It is weakest at judgment. Asking it to appraise the quality of a study, or to decide which of two views is better supported, asks for the thing grounding does not provide.

??? note "The published evidence, as of August 2026"
    Specific numbers date quickly, so treat these as a snapshot rather than as the state of the tool.

    On the positive side, controlled comparisons in dental trauma, orthopedic disability assessment, and cancer staging have found document-grounded answers substantially more accurate than the same model without the document, with large time savings ([DOI](https://doi.org/10.1111/edt.70065), [DOI](https://doi.org/10.1177/20552076261473719), [DOI](https://doi.org/10.1007/s12194-026-01026-0)).

    On the negative side, podcasts generated from 21 research articles in one issue of *Radiology* were assessed by residents, and 71 percent contained incorrect statements while capturing only 76 percent of the articles' own key results ([PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC11950872/)). Podcasts built from textbook chapters fared better ([DOI](https://doi.org/10.1097/gox.0000000000007299)). On 121 United States Medical Licensing Examination (USMLE) Step 1 dermatology questions, grounding in student study guides scored below a general chat model, with the gap widening on harder items where the question stem lacked the keywords needed to retrieve the right passage ([PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC13298547/)).

    The published education research is thin. Nearly all of it is small and single-site, with one two-institution pharmacy study as the exception ([DOI](https://doi.org/10.1016/j.ajpe.2025.101925)), and none has measured learning outcomes against a control group. The tool is documented as a time saver and a well-liked format, not as a proven learning tool.

## Setting one up

The pattern that works is one notebook per course, not one per session.

1. **Add your sources.** Lecture slides, handouts, your own notes, assigned readings. Fifty sources fit in one notebook on the free tier, at up to 500,000 words each, which is more than a term of material for most courses.
2. **Ask before you generate.** Start with questions and read the citations. This tells you quickly whether the notebook contains what you think it does.
3. **Generate formats last, and check them.** A study guide or audio overview is worth having once you know the sources well enough to notice when the emphasis is off.
4. **Keep it current.** Add each week's material as it arrives rather than rebuilding at exam time.

For the general version of this habit across other tools, see [Standing Setups](standing-setups.md).

## Limits, plans, and the student offer

The free tier gives 100 notebooks, 50 sources per notebook, 50 chat queries a day, and 3 audio overviews a day, with each source capped at 500,000 words or 200 megabytes ([limits](https://support.google.com/gemininotebook/answer/16213268)). For most coursework that is enough.

Google is running a student offer of 12 months free on a paid plan, which raises those limits, though its terms warn that promotional limits may differ from those of a paid subscription. Two details matter locally. The plan depends on the country of your institution, and for an institution in Antigua and Barbuda that is Google AI Plus, not the AI Pro tier advertised to United States students ([offer](https://blog.google/innovation-and-ai/products/gemini-app/student-offer-google-ai/)). It also requires you to be 18 or over, to verify student status through a third-party service, and to enter a payment method that begins charging automatically when the year ends, so it is a free year rather than a free plan, and it must be redeemed by December 31, 2026 ([terms](https://one.google.com/offer/studentoffer8)). Whether AUA is recognized by the verification service is something you will discover at sign-up; we have not tested it.

## What Google does with what you upload

AUA does not provide institutional Google accounts, so everyone here is on a personal one. Two facts are worth knowing, because the interface does not surface them:

- Google states that notebook content "will not be used to directly train our foundational AI models, unless you choose to provide feedback." Note the wording: it covers direct training of Google's foundation models rather than every use of the content. Pressing thumbs up or thumbs down sends the surrounding context, including your uploaded sources, to human reviewers, and that material is retained for up to three years, disconnected from your account ([privacy](https://support.google.com/gemininotebook/answer/17004255)). Deleting your Gemini activity does not delete notebook data.
- The exemption from human review that Google documents for Workspace and Workspace for Education accounts does not apply to personal accounts, and paying for a plan does not change it.

None of that is a reason to avoid the tool for your own coursework. It is a reason to think before uploading anything that is not yours to upload. What belongs in a public artificial intelligence (AI) tool, and what never does, is covered by the [AI Responsible Use Policy](../governance/policy.md) and summarized in [The Rules](../pathway/rules.md).

Google's own help pages state that Gemini Notebook can make mistakes, and its documentation says not to rely on it for medical advice. The tool is listed in the [directory](index.md) for discovery, not as an endorsement, and the policy's data rules apply to it as to everything else.
