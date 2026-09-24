# How Tools Are Reviewed

!!! note "Working draft"
    This rubric is a working draft, published for transparency and comment ahead of AI Committee ratification; it will change as the committee refines it.

The [tools directory](../tools/index.md) gives every entry a status describing the institution's relationship with the tool. Most entries are Listed, which is a catalog fact rather than a review outcome: the tool is relevant and live, and nothing more is claimed. This page describes the rubric applied when a tool is actually reviewed, so that process is visible rather than implied. Reviews are request-driven: a tool is examined when someone at the American University of Antigua College of Medicine (AUACOM) needs a decision about it, not on a rolling schedule across the whole directory.

## What a review establishes

Consistent with the [AI Responsible Use Policy](policy.md), a Reviewed status is not a general endorsement. The policy keeps no approved list for tools in general use; it asks users to make sure a tool meets its data security, ethical, and legal requirements, so ordinary, non-sensitive work needs no review. A review matters most for sensitive data: the policy allows sensitive, confidential, or proprietary information into a public tool only when the AI Responsible Use Subcommittee has specifically vetted and approved the tool for that data, and a review record names exactly which data categories and uses it clears, if any.

<figure class="figure figure--html hf">
<div class="hf-flow">
<div class="hf-box">
<p class="hf-box-title">Screening facts</p>
<p class="hf-box-sub">from the vendor's terms, not marketing copy</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p class="hf-box-title">Six scored domains</p>
<p class="hf-pill">Data privacy and security is the gate</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box">
<p class="hf-box-title">Directory status</p>
<p class="hf-box-sub">Reviewed, Use with caution, or Restricted</p>
</div>
</div>
<p class="hf-note">A privacy failure caps the outcome at Use with caution and blocks clearance for any sensitive data category.</p>
<p class="hf-return">Re-reviewed annually, or sooner on a material vendor change.</p>
<figcaption>Privacy is a gate, not a score; and review outcomes expire into annual re-review.</figcaption>
</figure>

## Step 1: Screening facts

Before any scoring, the reviewer confirms from the vendor's published terms (not marketing copy): who operates the tool and where data is processed; whether user inputs are used for model training and whether that can be disabled; data retention and deletion rights; account requirements and minimum age; cost to students and faculty; accessibility claims; and the vendor's security posture. Undocumented claims count against the tool throughout.

## Step 2: Scored domains

Each criterion is scored at one of three levels: meets, partial (which includes unclear), or fails.

1. **Data privacy and security** (the gate domain): training-use controls, bounded and deletable retention, compatibility with the Family Educational Rights and Privacy Act (FERPA) and, where relevant, the Health Insurance Portability and Accountability Act (HIPAA), acceptable processing jurisdiction, and sound access controls. A failure anywhere in this domain caps the outcome at Use with caution and blocks clearance for any sensitive data category.
2. **Legal and institutional compliance**: terms permit educational use, intellectual property terms are compatible with academic work, and nothing in the terms conflicts with university policy.
3. **Accuracy and reliability**: spot-tested on realistic AUACOM tasks by a reviewer, with failure modes documented and tolerable for the proposed use.
4. **Pedagogical and operational fit**: serves a real task better than what is already listed, with learning-curve burden proportionate to benefit, and without substituting for skills the curriculum intends students to build.
5. **Equity, access, and cost**: a meaningful free tier or institutional license, works on common devices and connections, and no known discriminatory failure modes relevant to the use.
6. **Transparency and vendor accountability**: the vendor discloses what is under the hood, offers a working problem-report channel, and communicates changes well enough to know when re-review is due.

## Step 3: Outcome

A completed review ends in one of three statuses: Reviewed, Use with caution, or Restricted. The table lists all five directory statuses; Listed and Licensed are not review outcomes:

| Status | Meaning |
| --- | --- |
| <span class="badge badge-listed">Listed</span> | The default for every entry: in the directory because it is relevant and live; not an endorsement, and not a review outcome |
| <span class="badge badge-licensed">Licensed</span> | Institutionally licensed or procured; a statement of fact rather than a review verdict |
| <span class="badge badge-reviewed">Reviewed</span> | Examined through this process; the entry's status note carries the conclusions, including the data categories cleared, if any |
| <span class="badge badge-caution">Use with caution</span> | The entry's status note documents a specific concern (how the tool handles data, a consent step, unresolved legal terms), worth reading before you rely on the tool |
| <span class="badge badge-restricted">Restricted</span> | Reviewed and found unsuitable for institutional use; the status note says why |

Any status a review assigns (Reviewed, Use with caution, or Restricted) is revisited annually, matching the policy's annual review cycle, or sooner upon a material vendor change. A Use with caution status can also record a documented concern outside a full review. The weekly automated content watch checks entries against their sources and proposes corrections for the maintainer to apply; it never changes a status, and status changes are never automated. The published entry carries the status, its note, and the last-reviewed date; the full scoring record of a review is retained internally.

To request a review of any tool, listed or not, use the [feedback form](https://forms.office.com/r/5a8RCi2YKP) or the contact route on the [About page](../about.md).
