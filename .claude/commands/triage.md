---
description: Review the repo's open automation issues and apply approved items
argument-hint: [e.g. "issue 6: apply items 1 and 2, decline item 3" or blank to review]
---

Review this repository's open automation issues and act on them.

Owner's instruction for this run: $ARGUMENTS

## Ground rules

1. Read CLAUDE.md in full before anything else; its working rules govern
   every step below (verify external facts yourself, dry-run before
   write-mode, `mkdocs build --strict` before commit, published-content
   style rules including no em dashes, the authority register).
2. Issues come from six automated sources: **Content watch** (weekly
   roster recommendations with evidence links), **Conference watch**
   (calendar changes that failed an auto-apply gate, plus newly
   announced conferences), **Opportunity watch** (weekly open calls and
   deadlines with paste-ready YAML for data/opportunities.yaml),
   **Tool discovery** (a monthly scheduled survey proposing new
   directory candidates; roster edits from it follow the content-watch
   rules), **Feed health** (a feed died), **Link health** (a link
   died). Anything else is a human-filed issue; summarize it but do not
   act without explicit instruction.
3. If the owner's instruction above names an issue and items, act on
   exactly those items and nothing else. If it is blank or says "review",
   summarize each open issue's items with a one-line recommendation each,
   then STOP and wait. Never apply a substantive change the owner has not
   named.

## Applying an item

- **Verify the claim against its linked source yourself** (fetch the
  official page or news link). The issue text is a lead, not a fact.
- **Content watch items**: edit data/tools.yaml or data/open_models.yaml
  following the format documented in each file's header and the tier
  criteria in data/conferences.yaml's header (medicine and medical
  education first, higher education second, general education third;
  English-language only). New tools enter `governance_status:
  listed` with the standard "Listed for discovery, not endorsement; the
  policy's data rules apply." note;
  services operated from China carry the standard data-handling note;
  copy conventions from neighboring entries. New open-weights models need
  their license verified from the Hugging Face model card tag.
- **Conference watch items**: confirm dates on the official page; edit
  data/conferences.yaml with a `# Verified YYYY-MM-DD from <source>`
  comment. Dates you cannot confirm stay TBD, never estimated.
- **Opportunity watch items**: confirm the call and its deadline on the
  official page; edit data/opportunities.yaml following its header
  conventions with a verified comment. Past-deadline entries archive
  automatically; never delete them by hand.
- **Feed and link health items**: follow the README playbook section
  "When automation emails you". A site that blocks scripted clients but
  is live in a browser belongs in the MANUALLY_VERIFIED allowlist in
  scripts/verify_links.py with a dated comment.

## After edits

1. Run the relevant checks: `python scripts/verify_links.py` for new
   URLs, `python scripts/verify_feeds.py` for feed changes, and
   `mkdocs build --strict` always (run everything with
   `& ".venv\Scripts\python.exe"` on this machine, plain `python` in CI).
2. Commit with a descriptive message and push.
3. Close each fully handled issue with a comment stating what was applied
   and what was declined and why; leave partially handled issues open
   with a comment on the remainder.
4. Report back: applied, declined, still open, and anything you noticed
   that the owner should know.
