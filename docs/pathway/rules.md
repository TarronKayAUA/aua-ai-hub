---
last_reviewed: 2026-07-02
---

# Module 3: The Rules

**For everyone · about 10 minutes · CGEA competency domain: Ethical Use of AI**

## What you will be able to do

- List the categories of information that must never go into a public AI tool.
- State your responsibilities when AI contributes to your work: accountability, labeling, and verification.
- Know where to check a tool's status and how to report a problem.

## The core idea

AUA encourages AI use where it helps you do your work, inside guardrails set by the [AI Responsible Use Policy](../governance/policy.md). The policy is short and readable; this module is the orientation, not the substitute. Four rules carry most of its weight:

1. **You are accountable.** Whatever a tool contributed, the work, the decisions, and the errors are yours. "The AI wrote it" is not a defense; the policy makes human oversight and final responsibility explicit.

2. **Some data never goes in.** Public AI tools may store, learn from, or expose what you type. Entering sensitive information into them is prohibited unless a tool has been specifically vetted and approved for that data. The prohibited categories include patient health information (PHI), student education records protected by the Family Educational Rights and Privacy Act (FERPA), confidential personnel information, and AUA proprietary information including unpublished research data. The policy states this list is not exhaustive: treat secure assessment materials, unpublished manuscripts, and anything you would not email outside the university with the same caution.

3. **Label and verify.** AI-generated content must be identified and attributed according to academic standards and your course or department's guidelines, never presented as your own original work. Anything an AI produces that you intend to rely on (especially references, which models fabricate fluently) must be verified at the original source. AI is also not a primary source for foundational knowledge; your course materials and the academic literature are.

4. **Check before you trust a tool.** The [tools directory](../tools/index.md) shows each tool's governance status, and [How Tools Are Reviewed](../governance/review-process.md) explains what the statuses mean and how they are assigned. Whatever the status, the data rules above always apply.

<figure class="figure">
<svg viewBox="0 0 660 235" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A gate before every paste: if the text contains patient information, student records, personnel information, or unpublished work, it stays out of public tools; otherwise proceed with accountability, labeling, and verification">
<defs><marker id="rl-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<rect x="20" y="85" width="150" height="50" rx="8" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="95" y="106" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">what you are</text>
<text x="95" y="120" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">about to type</text>
<line x1="172" y1="110" x2="216" y2="110" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rl-ar)"/>
<rect x="220" y="30" width="220" height="175" rx="8" fill="none" stroke="#c62828" stroke-width="2"/>
<text x="330" y="52" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">does it contain:</text>
<text x="330" y="74" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">patient information (PHI)</text>
<text x="330" y="92" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">student records (FERPA)</text>
<text x="330" y="110" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">personnel information</text>
<text x="330" y="128" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">unpublished or proprietary work</text>
<text x="330" y="152" text-anchor="middle" font-size="9" font-style="italic" fill="var(--md-default-fg-color--light)">the policy's list is not exhaustive:</text>
<text x="330" y="165" text-anchor="middle" font-size="9" font-style="italic" fill="var(--md-default-fg-color--light)">if you would not email it outside</text>
<text x="330" y="178" text-anchor="middle" font-size="9" font-style="italic" fill="var(--md-default-fg-color--light)">the university, treat it the same</text>
<line x1="442" y1="80" x2="478" y2="80" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rl-ar)"/>
<rect x="482" y="45" width="160" height="62" rx="8" fill="none" stroke="#c62828" stroke-width="2"/>
<text x="562" y="66" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">yes: it stays out;</text>
<text x="562" y="80" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">use an approved tool</text>
<text x="562" y="94" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">or de-identify first</text>
<line x1="442" y1="160" x2="478" y2="160" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rl-ar)"/>
<rect x="482" y="128" width="160" height="62" rx="8" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="562" y="149" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">no: go ahead;</text>
<text x="562" y="163" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">you stay accountable,</text>
<text x="562" y="177" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">label and verify</text>
<text x="330" y="226" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">the gate comes before every paste; a tool's status never relaxes it</text>
</svg>
<figcaption>Rule 2 as a habit: run the gate before anything enters a public tool.</figcaption>
</figure>

If you see misuse, a data exposure, or a tool producing harmful or discriminatory output, the policy expects you to report it to the AI Responsible Use Subcommittee; the [About page](../about.md) has the contact route. Reports are handled confidentially, and retaliation against good-faith reporters is prohibited.

## Self-check

??? question "A student pastes a classmate's draft case write-up into a chatbot to get feedback for them. Any problem?"
    Yes, potentially two. If the write-up contains patient details, that is PHI in a public tool. And another student's identifiable academic work is education-record territory; it is not yours to submit to a third-party service. De-identified, your-own-work feedback requests are the safe version.

??? question "You used a chatbot to draft a paragraph of a committee report and edited it lightly. What does the policy expect?"
    That the AI contribution is acknowledged per the applicable guidelines, that you verified any factual claims in it, and that you stand behind the final text as your own responsibility. Light editing does not transfer accountability to the tool.

??? question "A tool in the directory is marked Under review. Does that mean you cannot use it?"
    No. Under review means evaluation is in progress; use personal judgment. What it never means is that the data rules are relaxed: no PHI, no student records, no confidential information in any public tool regardless of status.

**Next:** [Module 4: Teaching and Assessment](teaching-assessment.md), [Module 5: Research and Scholarship](research.md), or [Module 6: Clinical Contexts](clinical.md), depending on your role.
