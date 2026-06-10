# About

## Purpose

The AUA AI Hub is a curated reference and news site on artificial intelligence (AI) for the faculty and students of the American University of Antigua College of Medicine (AUACOM). It is maintained by the Office of the Assistant Dean for AI in Medical Education, which also chairs the institution's AI Governance Committee. The site favors accuracy and restraint over novelty: fewer items, verified, in plain language.

## How content is selected

Most of this site is written and reviewed by people; the News, Videos, Podcasts, and benchmark sections are produced by an automated pipeline that runs nightly. Here is exactly what it does:

1. **News.** The pipeline reads a fixed, public list of sources: established AI publications and blogs, PubMed literature searches, and medical education and digital health journals. New items are filtered to a recent window, screened against a blocklist of promotional content, and de-duplicated. A language model then selects the items most relevant to medical educators and writes a one-sentence summary of each; when the language model is unavailable, a simpler keyword ranking runs instead.
2. **Videos and podcasts.** The same pipeline follows a hand-picked roster of YouTube channels and podcast shows. The language model selects relevant uploads and episodes and writes a one-sentence description for each, so you know what you are getting into before you click. Everything links out to the original platform; nothing is embedded or tracked here.
3. **Benchmarks.** The [Benchmarks page](benchmarks.md) carries a snapshot of the LiveBench leaderboard, rebuilt nightly from LiveBench's published data, with the calculation method described on that page.
4. **Weekly digest.** Every Friday a second selection pass picks the most significant items of the week, news, videos, and podcasts, plus any updates made to the conference calendar, into a digest feed for email distribution, with each week's digest preserved in the [News Archive](news/archive/index.md). The [This Week page](news/this-week.md) is separate: a rolling view of everything kept in the last seven days, refreshed nightly.

Human oversight: the source lists, selection criteria, and summarization instructions are all maintained by the site owner, and the pipeline cannot modify any hand-written page. Even so, summaries and descriptions are machine-generated; read them as pointers to the original sources, not as substitutes.

## Governance note

The [tools directory](tools/index.md) carries governance status badges, and the [prompt library](prompts/index.md) carries review status badges. Both are provisional until ratified through the AI Governance Committee process. Nothing on this site is institutional policy unless explicitly marked as such.

## Privacy

This site sets no cookies and runs no advertising scripts. Anonymous visit counts are collected with GoatCounter, a privacy-respecting service that uses no cookies and stores no personal information. Video thumbnails and podcast artwork load from the platforms that publish them; clicking any card takes you to the original platform, which has its own privacy practices.

## Disclaimer

This site is informational. AI-generated summaries and descriptions may contain errors; readers should verify claims against the linked primary sources before relying on them. Tool listings are not endorsements, benchmark scores are not purchasing advice, and prompts are templates whose outputs require your own verification. Nothing here constitutes clinical guidance, legal advice, or institutional policy unless explicitly marked as such.

## The maintainer

<div class="maintainer-card">
<img class="maintainer-photo" src="../assets/profile.jpg" alt="Portrait of Dr. Tarron Kayalackakom">
<div class="maintainer-bio">
<p>The AUA AI Hub is curated and maintained by <strong>Dr. Tarron Kayalackakom</strong>, Assistant Dean for Artificial Intelligence in Medical Education at the American University of Antigua College of Medicine and chair of the university's AI Governance Committee. Dr. Kayalackakom built this site to give the AUACOM community one reliable, plainly written place to follow a fast-moving field, and reviews its sources, tools, and guidance on an ongoing basis.</p>
</div>
</div>

## Contact

Questions, corrections, tool suggestions, prompt contributions, and conference submissions: contact the Office of the Assistant Dean for AI in Medical Education, AUACOM.
