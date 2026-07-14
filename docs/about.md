# About

## Purpose

The AUA AI Hub is a curated reference and news site on artificial intelligence (AI) for the faculty and students of the American University of Antigua College of Medicine (AUACOM). It is maintained by the Assistant Dean of AI in Medical Education, who also chairs the institution's AI Committee. The site favors accuracy and restraint over novelty: fewer items, verified, in plain language.

## How content is selected

Most of this site is written and reviewed by people; the News, Videos, Podcasts, and benchmark sections are produced by an automated pipeline that runs nightly. Here is exactly what it does:

1. **News.** The pipeline reads a fixed, public list of sources: established AI publications and blogs, PubMed literature searches, and medical education and digital health journals. New items are filtered to a recent window, screened against a blocklist of promotional content, and de-duplicated. A language model then selects the items most relevant to medical educators and writes a one-sentence summary of each; when the language model is unavailable, a simpler keyword ranking runs instead.
2. **Videos and podcasts.** The same pipeline follows a hand-picked roster of YouTube channels and podcast shows. The language model selects relevant uploads and episodes and writes a one-sentence description for each, so you know what you are getting into before you click. Everything links out to the original platform; nothing is embedded or tracked here.
3. **Benchmarks.** The [Benchmarks page](benchmarks.md) carries a snapshot of the LiveBench leaderboard, rebuilt nightly from LiveBench's published data, with the calculation method described on that page.
4. **Weekly digest.** Every Friday a second selection pass picks the most significant items of the week, news, videos, and podcasts, plus any updates made to the conference calendar, into a digest feed for email distribution, with each week's digest preserved in the [News Archive](news/archive/index.md). The [This Week page](news/this-week.md) is separate: a rolling view of everything kept in the last seven days, refreshed nightly.

<figure class="figure">
<svg viewBox="0 0 660 245" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pipeline diagram: fixed public sources flow through the nightly pipeline into the site's generated sections, with a Friday digest branch">
<defs><marker id="ab-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="105" y="30" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--md-default-fg-color--light)">fixed public sources</text>
<rect x="20" y="40" width="170" height="24" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="105" y="55" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">AI publications and blogs</text>
<rect x="20" y="70" width="170" height="24" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="105" y="85" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">PubMed literature searches</text>
<rect x="20" y="100" width="170" height="24" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="105" y="115" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">medical education journals</text>
<rect x="20" y="130" width="170" height="24" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="105" y="145" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">YouTube and podcast rosters</text>
<rect x="20" y="160" width="170" height="24" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="105" y="175" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">LiveBench leaderboard data</text>
<path d="M 192 52 L 216 52 M 192 82 L 216 82 M 192 112 L 216 112 M 192 142 L 216 142 M 192 172 L 216 172 M 216 52 L 216 172" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<line x1="216" y1="112" x2="240" y2="112" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ab-ar)"/>
<rect x="242" y="62" width="180" height="100" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="2"/>
<text x="332" y="84" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">nightly pipeline</text>
<text x="332" y="102" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">recent-window filter,</text>
<text x="332" y="115" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">blocklist, de-duplicate,</text>
<text x="332" y="128" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">a language model selects</text>
<text x="332" y="141" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">and summarizes each item</text>
<line x1="424" y1="112" x2="448" y2="112" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ab-ar)"/>
<path d="M 452 55 L 452 175 M 452 55 L 468 55 M 452 85 L 468 85 M 452 115 L 468 115 M 452 145 L 468 145 M 452 175 L 468 175" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="555" y="30" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--md-default-fg-color--light)">generated sections</text>
<rect x="470" y="44" width="170" height="22" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="555" y="58" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">News</text>
<rect x="470" y="74" width="170" height="22" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="555" y="88" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">Videos</text>
<rect x="470" y="104" width="170" height="22" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="555" y="118" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">Podcasts</text>
<rect x="470" y="134" width="170" height="22" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="555" y="148" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">This Week (rolling 7 days)</text>
<rect x="470" y="164" width="170" height="22" rx="4" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.5"/>
<text x="555" y="178" text-anchor="middle" font-size="9" fill="var(--md-typeset-color)">Benchmarks (LiveBench)</text>
<line x1="332" y1="162" x2="332" y2="188" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ab-ar)"/>
<rect x="242" y="190" width="180" height="34" rx="6" fill="var(--md-primary-fg-color)"/>
<text x="332" y="204" text-anchor="middle" font-size="9.5" fill="#ffffff">Fridays: weekly digest,</text>
<text x="332" y="217" text-anchor="middle" font-size="9.5" fill="#ffffff">archived and emailed</text>
</svg>
<figcaption>The pipeline writes only the generated sections; every hand-written page stays human-maintained.</figcaption>
</figure>

Human oversight: the source lists, selection criteria, and summarization instructions are all maintained by the site owner, and the pipeline cannot modify any hand-written page (with one narrow exception below). Even so, summaries and descriptions are machine-generated; read them as pointers to the original sources, not as substitutes.

Freshness: guide and reference pages carry a "Content last reviewed" date in their footer. A weekly automated check re-reads each page on a schedule set by how quickly its facts tend to change, verifies the page's checkable claims against current sources, and updates the date when everything holds (the one edit the pipeline may make to a hand-written page); anything that looks out of date is escalated to the maintainer for a human correction. The date moves only when a review actually happened, by machine or by hand.

Automated upkeep goes one careful step further for the calendar and roster data. Watch processes re-check conference pages, opportunity listings, and tool pages against their official sources on a schedule, and a narrow class of changes is applied automatically, but only when every mechanical gate passes: the change must be grounded in the official page itself, the details must be coherent, and date changes must hold across two consecutive checks. Every automatic change lands in the public data files with a comment recording when and how it was verified, so the full audit trail is one click away in the site's repository. Everything that requires judgment stays human: tool governance statuses, prompt review statuses, the policy text, and all removals are never changed by automation, and anything that fails a gate is escalated to the maintainer instead of applied.

## Governance note

The university's [AI Responsible Use Policy](governance/policy.md) and the [AI Committee](governance/committee.md) are published in the Governance section. The [tools directory](tools/index.md) carries governance status badges describing the institution's relationship with each tool (a listing is not an endorsement, and committee review is available on request), and the [prompt library](prompts/index.md) carries review status badges that are provisional until ratified through the committee process. Nothing else on this site is institutional policy unless explicitly marked as such.

## Privacy

This site sets no cookies and runs no advertising scripts. Anonymous visit counts are collected with GoatCounter, a privacy-respecting service that uses no cookies and stores no personal information. Pages with a comments section load a small widget from giscus, an open-source service backed by this site's public GitHub Discussions board: reading comments requires nothing, posting requires a free GitHub account, and anything posted is public. Video thumbnails and podcast artwork load from the platforms that publish them; clicking any card takes you to the original platform, which has its own privacy practices.

## Disclaimer

This site is informational. AI-generated summaries and descriptions may contain errors; readers should verify claims against the linked primary sources before relying on them. Tool listings are not endorsements, benchmark scores are not purchasing advice, and prompts are templates whose outputs require your own verification. Nothing here constitutes clinical guidance, legal advice, or institutional policy unless explicitly marked as such.

## The maintainer

<div class="maintainer-card">
<img class="maintainer-photo" src="../assets/profile.jpg" alt="Portrait of Dr. Tarron Kayalackakom">
<div class="maintainer-bio">
<p>The AUA AI Hub is curated and maintained by <strong>Dr. Tarron Kayalackakom</strong>, Assistant Dean of Artificial Intelligence in Medical Education and Assistant Professor in the Education Enhancement Department at the American University of Antigua College of Medicine, and chair of the university's <a href="../governance/committee/">AI Committee</a>. Dr. Kayalackakom built this site to give the AUACOM community one reliable, plainly written place to follow a fast-moving field, and reviews its sources, tools, and guidance on an ongoing basis.</p>
</div>
</div>

## Comments and feedback

The fastest way to tell us what works, what does not, and what to fix: the [feedback form](https://forms.office.com/r/5a8RCi2YKP), five questions, about two minutes, including a field for corrections to anything on this site.

News, video, podcast, and digest pages also carry a comments section where you can discuss items and react to them, and the [Prompt Exchange](prompts/index.md) accepts community prompt contributions with public voting. Both run on the site's [GitHub Discussions board](https://github.com/TarronKayAUA/aua-ai-hub/discussions) and require a free [GitHub account](https://github.com/signup) to post.

**Community standards.** Comments and posts are public. Keep discussion professional, and never post patient information, student records, or exam content, consistent with the university's [AI Responsible Use Policy](governance/policy.md). Content is subject to moderation, and repeated misuse may result in loss of posting access.

## Contact

Questions, corrections, tool suggestions, private prompt contributions, conference submissions, and anything not suited to a public comment: contact the Assistant Dean of AI in Medical Education, AUACOM.
