Week round: IN PROGRESS, building the render-time hook (scripts/layout_week.py)

# Week Round Status (resume point)

Branch `week-round` (from origin/main 79ce3c9). Brief: `_round/c/BRIEF.md`.

- Round tools were brought from origin/space-round into `_round/`.
- Chromium already trusts the proxy CA (it has the ccr-agent-proxy entry), so measurement loads Inter.
- For local testing, placeholder MP3s are copied into docs/assets/audio for the three This Week briefs, the three feed pages and digests w38 and w39, so the players render. They are gitignored (`news-*`, `digest-*`) and never committed.
- Baseline build: /tmp/wk-base. Baseline measures: /tmp/claude-0/wk/base.

## Baseline (measure.py, before)

| Page | Height 1920 | Blank 1920 | Height 1440 | Blank 1440 |
|---|---|---|---|---|
| news/this-week | 10313 | 39% | 9390 | 41% |
| news/archive/2026-w39 | 12722 | 20% | 11463 | 21% |
| news/archive/2026-w38 | 11073 | 22% | 10022 | 20% |
