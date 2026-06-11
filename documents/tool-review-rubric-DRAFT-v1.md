# AI Tool Review Rubric, DRAFT v1 for committee iteration

Status: working draft, not published on the site. Lives in documents/ (not
deployed). Prepared 2026-06-10 for iteration by the owner and the AI
Responsible Use Subcommittee. When a version is adopted, it can be published
as a Governance page so the provisional status badges on the Tools directory
point to a visible process.

Anchored in: the draft AI Responsible Use Policy v4 (its "Approved AI Tool"
concept ties approval to specified categories of sensitive data), the
existing site statuses (approved, conditional, restricted, under review), and
published higher-education evaluation frameworks consulted on 2026-06-10:
McMaster University's AI tool evaluation rubric (functionality, privacy,
pedagogy, ethics), the 1EdTech TrustEd Apps Generative AI Data Rubric
(privacy and data practices), and the Control Alt Achieve 18-criterion
education rubric. Medical-education criteria (PHI, clinical fit, accuracy for
medical content) are additions specific to AUA.

---

## Part A. Screening facts (collected before scoring)

| Item | Notes |
| --- | --- |
| Tool name, vendor, version reviewed | |
| URL and deployment form | Web, app, API, local |
| Who requested the review, and for what use case | |
| Hosting jurisdiction and data residency | Including where inputs are processed |
| Vendor terms: are user inputs used to train models? | Opt-out available? Default state? |
| Data retention and deletion: can a user export and delete their data? | |
| Account requirement and minimum age | |
| Cost to students and to faculty | Free, freemium, paid; institutional license available? |
| Accessibility conformance claims | WCAG statement, if any |
| Vendor security posture | Breach history, certifications claimed (e.g., SOC 2), HIPAA BAA available? |

A review cannot proceed to scoring until each fact above is confirmed from
the vendor's published terms, not from marketing copy.

## Part B. Scored domains

Each criterion scores 2 (meets), 1 (partial or unclear), or 0 (fails).
"Unclear" never scores 2: undocumented claims count against the tool.

### 1. Data privacy and security (gate domain)

- Inputs are not used for model training, or training use can be fully
  disabled at the account level.
- Data retention is documented, bounded, and user-deletable.
- The tool's data handling can comply with FERPA for student records, with
  HIPAA for patient information (only relevant if approval for those
  categories is sought), and with the Antigua and Barbuda Data Protection
  Act.
- Processing location and jurisdiction are documented and acceptable for the
  data categories sought.
- Authentication and access controls are appropriate to the data involved.

A score of 0 on any criterion in this domain caps the overall outcome at
"conditional" and blocks approval for any sensitive data category.

### 2. Legal and institutional compliance

- Terms of service permit educational and institutional use.
- Intellectual property terms are acceptable: users retain rights to their
  inputs and outputs, or terms are at least compatible with academic use.
- The vendor discloses AI-specific risks and limitations rather than hiding
  them.
- No terms conflict with the AI Responsible Use Policy (for example, terms
  that grant the vendor broad rights over uploaded course materials).

### 3. Accuracy and reliability for medical and educational content

- Output quality on domain-relevant tasks has been spot-tested by a reviewer
  using realistic AUA tasks, and failure modes are documented in the review.
- The tool communicates uncertainty or cites sources where the use case
  needs it.
- Known weaknesses (hallucinated citations, dated knowledge, image
  misreading) are tolerable for the proposed use case with stated
  precautions.

### 4. Pedagogical and operational fit

- The tool serves a real AUA task better than tools already approved or
  listed; redundancy is a reason to decline, not a disqualifier.
- Learning-curve burden is proportionate to the benefit.
- It supports rather than substitutes for the skills the curriculum intends
  students to build (a tool that completes the learning task itself needs
  course-level rules, which the review should state).

### 5. Equity, access, and cost

- A meaningful free tier exists, or the institution can license it; a tool
  that only works well when students pay is flagged.
- Works on commonly held devices and connection speeds, including off-campus.
- No discriminatory failure modes relevant to the use case are known or
  observed in spot-testing.

### 6. Transparency and vendor accountability

- The vendor names the underlying models or discloses meaningful technical
  detail.
- There is a working channel to report problems to the vendor.
- The vendor's update cadence and changelog let the committee know when
  re-review is needed.

## Part C. Outcome and publication

The review maps to the site's existing statuses:

- **Approved**: strong across all domains. The approval record MUST list the
  specific sensitive data categories (if any) the tool is approved to handle,
  mirroring the policy's Approved AI Tool definition. Approval without listed
  categories means approved for non-sensitive use only.
- **Conditional**: useful but with binding restrictions; the conditions are
  published in the entry's status note (for example, "no student-identifiable
  data", "outputs require faculty verification before assessment use").
- **Restricted**: failed gate criteria or poses risks that conditions cannot
  contain; not for institutional use.
- **Under review**: in queue or insufficient information; default state for
  new listings.

Process notes for iteration:

1. Reviews are conducted by at least two reviewers (one committee member,
   one user from the requesting audience) and ratified by the subcommittee.
2. Every status is re-reviewed annually (matching the policy's annual review
   cycle) or upon a material vendor change, whichever is sooner.
3. The completed scoring sheet is retained internally; the published entry
   carries only status, status note, and last_reviewed date.
4. Open question for the committee: should student-facing study tools
   (Medical Learning category) face an additional criterion on pedagogical
   claims evidence, since vendors market exam-readiness claims that the
   committee cannot verify?
5. Open question: minimum bar for listing on the site at all (currently the
   owner's judgment) versus the bar for an approved status.
