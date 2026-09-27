Space round: IN PROGRESS, step 1 of 3 (navigation) built; next: write-ups, then measuring gaps

# Space Round Status (resume point)

Branch `space-round` (from origin/main 1f6b2f8). Brief: `_round/c/BRIEF.md`.

## Environment

- Chromium trusts the agent proxy CA: `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n ccr-agent-proxy -i /root/.ccr/agent-proxy-ca.crt` (libnss3-tools installed). Checked: Google Fonts CSS loads with status 200, so `_round/measure.py` measures with Inter.
- Baseline build of 1f6b2f8+brief: /tmp/sp-base; baseline measure (all pages, no shots) in /tmp/claude-0/sp/base.

## Step 1: Redundant Navigation (built)

- Browse disclosure: see section 1 below (filled in with the no-JS proof).
- Foot dedupe rule in scripts/layout_nav.py `_body_listed` / `_more`.
