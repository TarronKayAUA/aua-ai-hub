# How Tools Are Reviewed

!!! warning "Provisional"
    This rubric is a working draft, published for transparency and comment ahead of AI Committee ratification; expect it to change.

The [tools directory](../tools/index.md) gives every entry a status describing the institution's relationship with the tool. Most entries are Listed, which is a catalog fact rather than a review outcome: the tool is relevant and live, and nothing more is claimed. This page describes the rubric applied when a tool is actually reviewed, so that process is visible rather than implied. Reviews are request-driven: a tool is examined when someone at the American University of Antigua College of Medicine (AUACOM) needs a decision about it, not on a rolling schedule across the whole directory.

## What a review establishes

Following the [AI Responsible Use Policy](../governance/policy.md), a Reviewed status is not a general endorsement. A review clears a tool, where it clears it, *for specified categories of data and use*. A review record that names no sensitive data categories means the tool is cleared for non-sensitive use only; the policy's data rules apply at all times regardless of any tool's status.

<figure class="figure">
<svg viewBox="0 0 660 185" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Review flow: screening facts, six scored domains with privacy as the gate, then a directory status, with annual re-review">
<defs><marker id="rp-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker><marker id="rp-red" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#c62828"/></marker></defs>
<text x="330" y="14" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">re-reviewed annually, or sooner on a material vendor change</text>
<path d="M 555 38 L 555 24 L 105 24 L 105 36" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1.5" marker-end="url(#rp-ar)"/>
<rect x="20" y="40" width="170" height="75" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="105" y="62" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">screening facts</text>
<text x="105" y="82" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">from the vendor's terms,</text>
<text x="105" y="96" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">not marketing copy</text>
<rect x="245" y="40" width="170" height="75" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="330" y="60" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">six scored domains</text>
<rect x="257" y="72" width="146" height="32" rx="4" fill="var(--md-primary-fg-color)"/>
<text x="330" y="85" text-anchor="middle" font-size="9" fill="#ffffff">data privacy and security</text>
<text x="330" y="97" text-anchor="middle" font-size="9" fill="#ffffff">is the gate</text>
<rect x="470" y="40" width="170" height="75" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="555" y="62" text-anchor="middle" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">directory status</text>
<text x="555" y="82" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">Reviewed, Use with caution,</text>
<text x="555" y="96" text-anchor="middle" font-size="9.5" fill="var(--md-default-fg-color--light)">or Restricted</text>
<line x1="192" y1="77" x2="243" y2="77" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rp-ar)"/>
<line x1="417" y1="77" x2="468" y2="77" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#rp-ar)"/>
<path d="M 330 115 L 330 138" fill="none" stroke="#c62828" stroke-width="2" marker-end="url(#rp-red)"/>
<text x="330" y="154" text-anchor="middle" font-size="9.5" fill="#c62828">a privacy failure caps the outcome at Use with caution</text>
<text x="330" y="168" text-anchor="middle" font-size="9.5" fill="#c62828">and blocks clearance for any sensitive data category</text>
</svg>
<figcaption>Privacy is a gate, not a score; and review outcomes expire into annual re-review.</figcaption>
</figure>

## Step 1: Screening facts

Before any scoring, the reviewer confirms from the vendor's published terms (not marketing copy): who operates the tool and where data is processed; whether user inputs are used for model training and whether that can be disabled; data retention and deletion rights; account requirements and minimum age; cost to students and faculty; accessibility claims; and the vendor's security posture. Undocumented claims count against the tool throughout.

## Step 2: Scored domains

Each criterion is scored as meets, partial or unclear, or fails.

1. **Data privacy and security** (the gate domain): training-use controls, bounded and deletable retention, compatibility with the Family Educational Rights and Privacy Act (FERPA) and, where relevant, the Health Insurance Portability and Accountability Act (HIPAA), acceptable processing jurisdiction, and sound access controls. A failure anywhere in this domain caps the outcome at Use with caution and blocks clearance for any sensitive data category.
2. **Legal and institutional compliance**: terms permit educational use, intellectual property terms are compatible with academic work, and nothing in the terms conflicts with university policy.
3. **Accuracy and reliability**: spot-tested on realistic AUACOM tasks by a reviewer, with failure modes documented and tolerable for the proposed use.
4. **Pedagogical and operational fit**: serves a real task better than what is already listed, with learning-curve burden proportionate to benefit, and without substituting for skills the curriculum intends students to build.
5. **Equity, access, and cost**: a meaningful free tier or institutional license, works on common devices and connections, and no known discriminatory failure modes relevant to the use.
6. **Transparency and vendor accountability**: the vendor discloses what is under the hood, offers a working problem-report channel, and communicates changes well enough to know when re-review is due.

## Step 3: Outcome

A completed review lands a tool in one of the review-bearing statuses; Listed and Licensed exist outside this process:

| Status | Meaning |
| --- | --- |
| <span class="badge badge-listed">Listed</span> | The default for every entry: in the directory because it is relevant and live; not an endorsement, and not a review outcome |
| <span class="badge badge-licensed">Licensed</span> | Institutionally licensed or procured; a statement of fact rather than a review verdict |
| <span class="badge badge-reviewed">Reviewed</span> | Examined through this process; the entry's status note carries the conclusions, including the data categories cleared, if any |
| <span class="badge badge-caution">Use with caution</span> | A specific documented concern in the entry's status note (data handling, consent requirements, unresolved legal terms); read the note before use |
| <span class="badge badge-restricted">Restricted</span> | Reviewed and found unsuitable; not for institutional use |

Any status a review assigns (Reviewed, Use with caution, or Restricted) is revisited annually, matching the policy's annual review cycle, or sooner upon a material vendor change. A Use with caution status can also record a documented concern outside a full review, as most current ones do. The weekly automated content watch keeps every entry's facts fresh but never changes a status; status changes are never automated. The published entry carries the status, its note, and the last-reviewed date; the full scoring record of a review is retained internally.

To request a review of any tool, listed or not, use the [feedback form](https://forms.office.com/r/5a8RCi2YKP) or the contact route on the [About page](../about.md).
