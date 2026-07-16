---
last_reviewed: 2026-07-13
---

# Playbook: Administrative Drafting

<span class="meta-chip">For faculty and staff</span> <span class="meta-note">Works with any capable assistant in the [tools directory](../tools/index.md)</span>

--8<-- "includes/prompt-maturity-note.md"

## The task

Turn facts you already have into finished administrative prose: memos, committee minutes, reports, accreditation narratives, and the recurring correspondence that consumes afternoons. This is the task where AI assistance pays back fastest, and the one where a fabricated detail does the most institutional damage, because the output becomes a record.

## Where AI helps, and where it hurts

AI is excellent at the shape of administrative writing: structure, register, condensing forty minutes of meeting notes into eight minutes of minutes, converting a bullet list into a memo, and rewriting the same information for a second audience. It is dangerous at the substance: models fill gaps with plausible institutional facts (dates, room numbers, policy names, who agreed to what) delivered in exactly the confident register administrative prose uses. The division of labor must be absolute: **every fact comes from you; the model only arranges them.**

The second hazard is voice. Administrative documents signed by you should sound like you; a department that starts producing identical AI-cadence memos has lost something real. The fix is cheap: draft from your own examples.

<figure class="figure">
<svg viewBox="0 0 660 225" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sensitivity gate before drafting: public content proceeds, internal content needs judgment and de-identification, confidential content never enters public AI tools">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">classify before anything is pasted</text>
<rect x="20" y="88" width="140" height="50" rx="8" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="90" y="109" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">the document</text>
<text x="90" y="123" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">you need drafted</text>
<defs><marker id="ad-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<line x1="162" y1="113" x2="208" y2="113" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ad-ar)"/>
<rect x="212" y="30" width="180" height="50" rx="8" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="302" y="51" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--md-typeset-color)">public</text>
<text x="302" y="67" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">announcements, published policy</text>
<rect x="212" y="88" width="180" height="50" rx="8" fill="none" stroke="#e65100" stroke-width="2"/>
<text x="302" y="109" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--md-typeset-color)">internal</text>
<text x="302" y="125" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">routine operations, planning</text>
<rect x="212" y="146" width="180" height="50" rx="8" fill="none" stroke="#c62828" stroke-width="2"/>
<text x="302" y="167" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--md-typeset-color)">confidential</text>
<text x="302" y="183" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">personnel, individuals, legal</text>
<line x1="394" y1="55" x2="440" y2="55" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ad-ar)"/>
<text x="530" y="52" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">draft with AI freely;</text>
<text x="530" y="66" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">verify the record layer</text>
<line x1="394" y1="113" x2="440" y2="113" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ad-ar)"/>
<text x="530" y="110" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">judgment first, and</text>
<text x="530" y="124" text-anchor="middle" font-size="9.5" fill="var(--md-typeset-color)">de-identify any individuals</text>
<line x1="394" y1="171" x2="440" y2="171" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ad-ar)"/>
<text x="530" y="168" text-anchor="middle" font-size="9.5" fill="#c62828">no public AI tools,</text>
<text x="530" y="182" text-anchor="middle" font-size="9.5" fill="#c62828">in whole or summarized part</text>
<text x="330" y="216" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">a mixed document is treated as its most sensitive part</text>
</svg>
<figcaption>The tier decides the tool before the tool sees a word.</figcaption>
</figure>

## Gather first

- The facts, as your own bullet list: decisions made, dates, names, amounts, action items. Writing this list is the thinking; do not skip it and hope the model infers the facts from context.
- One or two prior examples of the genre in your voice (your best past memo, last month's minutes).
- The audience and its register: a memo to faculty and a report to an accreditor carry the same facts differently.

## The workflow

1. **Classify the sensitivity first, before anything is pasted.** Three tiers: *public* (announcements, published policy) can go anywhere; *internal* (routine operations, non-sensitive planning) needs judgment and de-identification of any individuals discussed; *confidential* (personnel matters, individual student or employee situations, pre-decisional deliberations, anything legal) does not enter public AI tools at all, in whole or in summarized part. When a document mixes tiers, treat it as its most sensitive part.
2. **Supply the facts as bullets, with an explicit no-invention rule.** "Draft a memo from exactly these facts; where information is missing, write [TO CONFIRM] rather than filling the gap." The bracket flags are the safety net that makes gaps visible instead of plausible.
3. **Draft from your example.** Attach the prior memo or minutes and ask for the new content in that structure and register. Revision mode beats generation mode: the model changes less, and what survives is your voice.
4. **Verify the record layer.** Every name, date, amount, title, and stated commitment gets checked against your bullet list; anything present in the draft but absent from your list was invented and comes out. This is a two-minute pass that catches the one error that matters.
5. **Sign it as yours.** Your signature is the accountability, exactly as the [policy](../governance/policy.md) frames it: whatever a tool contributed, the document and its errors are yours. If your unit has an attribution practice for AI-assisted documents, follow it.

## Guardrails for this task

- Minutes of confidential sessions (personnel, individual student matters, legal consultations) are drafted without AI assistance, full stop. If the institution ever vets and approves a system for that class of data, this line changes with the policy; no public tool qualifies today.
- A drafted commitment is a real commitment: dates and promises in AI-arranged prose bind you exactly as if you had typed them, so verify them, not just the spelling.
- Colleagues named in a document have not consented to being described to an AI tool; keep characterizations of identifiable people out of prompts.
- An AI-assisted document that becomes an official record is subject to every records practice the manual version would be; assistance changes the drafting, not the document's status.

## Before you rely on it

- [ ] Sensitivity tier classified before anything was pasted, and the document treated as its most sensitive part.
- [ ] Every fact in the draft traces to your bullet list; every [TO CONFIRM] resolved or removed.
- [ ] Names, dates, amounts, and commitments verified individually.
- [ ] It reads like you wrote it, because by the final pass, you did.
