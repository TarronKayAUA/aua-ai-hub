# How Tools Are Reviewed

The [tools directory](../tools/index.md) assigns every entry a governance status. This page describes the rubric behind those statuses, so the process is visible rather than implied.

!!! warning "Provisional"
    This rubric is the working process used by the Office of the Assistant Dean of AI in Medical Education, pending ratification by the AI Committee. It is published for transparency and comment; the committee may revise it.

## What a review establishes

Following the [AI Responsible Use Policy](../governance/policy.md), approval is not a general endorsement. A tool is approved, where it is approved, *for specified categories of data and use*. An approval that names no sensitive data categories means the tool is approved for non-sensitive use only; the policy's data rules apply at all times regardless of any tool's status.

## Step 1: Screening facts

Before any scoring, the reviewer confirms from the vendor's published terms (not marketing copy): who operates the tool and where data is processed; whether user inputs are used for model training and whether that can be disabled; data retention and deletion rights; account requirements and minimum age; cost to students and faculty; accessibility claims; and the vendor's security posture. Undocumented claims count against the tool throughout.

## Step 2: Scored domains

Each criterion is scored as meets, partial or unclear, or fails.

1. **Data privacy and security** (the gate domain): training-use controls, bounded and deletable retention, compatibility with the Family Educational Rights and Privacy Act (FERPA) and, where relevant, the Health Insurance Portability and Accountability Act (HIPAA), acceptable processing jurisdiction, and sound access controls. A failure anywhere in this domain caps the outcome at Conditional and blocks approval for any sensitive data category.
2. **Legal and institutional compliance**: terms permit educational use, intellectual property terms are compatible with academic work, and nothing in the terms conflicts with university policy.
3. **Accuracy and reliability**: spot-tested on realistic AUACOM tasks by a reviewer, with failure modes documented and tolerable for the proposed use.
4. **Pedagogical and operational fit**: serves a real task better than what is already listed, with learning-curve burden proportionate to benefit, and without substituting for skills the curriculum intends students to build.
5. **Equity, access, and cost**: a meaningful free tier or institutional license, works on common devices and connections, and no known discriminatory failure modes relevant to the use.
6. **Transparency and vendor accountability**: the vendor discloses what is under the hood, offers a working problem-report channel, and communicates changes well enough to know when re-review is due.

## Step 3: Outcome

The review maps onto the statuses shown in the directory:

| Status | Meaning |
| --- | --- |
| <span class="badge badge-approved">Approved</span> | Strong across all domains; the approval record names the sensitive data categories covered, if any |
| <span class="badge badge-conditional">Conditional</span> | Useful with binding restrictions, published in the entry's status note |
| <span class="badge badge-restricted">Restricted</span> | Failed gate criteria or risks that conditions cannot contain; not for institutional use |
| <span class="badge badge-under-review">Under review</span> | In queue or insufficient information; the default for new listings |

Every status is re-reviewed annually, matching the policy's annual review cycle, or sooner upon a material vendor change. The published entry carries the status, its note, and the last-reviewed date; the full scoring record is retained internally.

To request a review of a tool not yet listed, use the [feedback form](https://forms.office.com/r/5a8RCi2YKP) or the contact route on the [About page](../about.md).
