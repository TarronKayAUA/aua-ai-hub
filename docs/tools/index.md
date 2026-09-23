---
last_reviewed: 2026-09-01
---

# Tool Directory

A directory of artificial intelligence (AI) tools relevant to teaching, learning, research, and clinical education at the American University of Antigua College of Medicine (AUACOM). Each entry carries a status describing the institution's relationship with the tool.

<img class="section-banner" src="../assets/section-tools.svg" alt="">

!!! note "A listing is not an endorsement"
    Statuses describe where the institution actually stands with a tool, not a quality verdict. Committee review of any tool can be requested through the [review process](../governance/review-process.md), and the data rules below apply everywhere, whatever a tool's status.

??? info "How to read the statuses"
    | Status | What it means |
    | --- | --- |
    | <span class="badge badge-listed">Listed</span> | In the directory because it is relevant and live. Not an endorsement; use your own judgment. |
    | <span class="badge badge-licensed">Licensed</span> | Institutionally licensed or procured by the university. |
    | <span class="badge badge-reviewed">Reviewed</span> | Examined by the AI Committee; conclusions in the entry's note. |
    | <span class="badge badge-caution">Use with caution</span> | A specific concern is documented in the entry's note; read it before using the tool. |
    | <span class="badge badge-restricted">Restricted</span> | Reviewed and found unsuitable for institutional use. |

Where an entry carries a specific caution or access condition, it is printed on the card under the description. The small label beside each vendor shows cost: free, freemium (a free tier with paid upgrades), paid, institutional (needs an organization's license), or AUA-licensed (provided by AUA). Expand a category to browse it.

Whatever a tool's status, two rules always apply: never enter protected health information (PHI), and never enter student records covered by the Family Educational Rights and Privacy Act (FERPA). See [PHI and FERPA considerations](../basics/glossary.md#phi-and-ferpa-considerations) in the glossary. The [AI Responsible Use Policy](../governance/policy.md) also keeps confidential personnel information, proprietary information, and unpublished research data out of publicly available tools unless a tool has been approved for that data.

## Not sure where to start?

The directory catalogs; the guides recommend. Route by what you need:

- **A general assistant:** for questions and drafting, browse [Assistants](#assistants), and [Choosing Your Interface](interfaces.md) explains which kind of tool fits which work.
- **Study tools:** [Medical Learning](#medical-learning), with the study workflow routed on the [students page](../students.md).
- **Literature and research:** [AI for Research](research.md) maps tools to each stage of a project, starting with Scopus with AI, licensed through the AUA Library.
- **Slides and diagrams:** [Presentations and Design](#presentations-and-design) covers decks, posters, and text-to-diagram tools.
- **Data stays on your machine:** [Local Models](#local-models), with [Running Models Locally](local.md) as the walkthrough and [Hardware for Local AI](hardware.md) for sizing the machine.
- **A task end to end:** The [playbooks](../playbooks/index.md) walk one task at a time, guardrails included, and the [prompt library](../prompts/index.md) holds the reusable templates they draw on.
- **Delegate a task to an agent:** [AI Agents](agents.md) is the field guide; [Your First Agent Session](first-session.md) runs one in 20 minutes on a folder that cannot be hurt.
- **Documents, decks, and spreadsheets:** In Claude, four document [skills](skills.md) come built in; the same page shows how to switch file creation on if they are not working, and why skills from unknown authors should be treated as software, not advice.
- **Your own lectures and papers:** [Gemini Notebook](gemini-notebook.md) answers from what you upload, with citations; [Standing Setups](standing-setups.md) makes any assistant remember your course.

<!-- render:tools -->

---

## Open-weights models

The assistants above run in their vendor's cloud. Open-weights models are different: the model file itself is published for anyone to download and run on their own hardware, so nothing you type leaves your machine. The Local Models tools above are the usual way to run them; [Running Models Locally](local.md) is a practical walkthrough. Capability rankings shift quickly; the [Benchmarks page](../benchmarks.md) tracks current standings. Model families carry a license instead of a governance status, because there is no service operator to have a relationship with; as everywhere in this directory, a listing is not an endorsement, and the license named on each entry is the fact to check before any use beyond personal experimentation.

Open-weights model families and notable single releases; each entry shows the date its license and description were last checked:

<!-- render:open-models -->

To suggest a tool, use the contact details on the [About page](../about.md). To request committee review, follow [How Tools Are Reviewed](../governance/review-process.md). Reviewed and Restricted come only from that review; Use with caution can also record a documented concern outside a full review; Listed and Licensed reflect cataloging and procurement facts.
