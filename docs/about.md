---
last_reviewed: 2026-09-01
---

# About

## Purpose

The AUA AI Hub is a curated reference and news site on artificial intelligence (AI) for the faculty, staff, and students of the American University of Antigua College of Medicine (AUACOM). It is maintained by the Associate Dean of AI in Medical Education, who also chairs the institution's AI Committee. The site favors accuracy and restraint over novelty: fewer items, verified, in plain language.

## How content is selected

Most of this site is written and reviewed by people; the News, Videos, and Podcasts sections and the LiveBench table on the Benchmarks page are produced by an automated pipeline that runs several times a day. Here is exactly what it does:

1. **News.** The pipeline reads a fixed, public list of sources: established AI publications and blogs, PubMed literature searches, and medical education and digital health journals. New items are filtered to a recent window, screened against a blocklist of promotional content, and de-duplicated. A language model then selects the items most relevant to medical educators and writes a one-sentence summary of each; when the language model is unavailable, a simpler keyword ranking runs instead.
2. **Videos and podcasts.** The same pipeline follows a hand-picked roster of YouTube channels and podcast shows. The language model selects relevant uploads and episodes and writes a one-sentence description for each, so you know what you are getting into before you click. Everything links out to the original platform; nothing is embedded or tracked here.
3. **Benchmarks.** The [Benchmarks page](benchmarks.md) carries a snapshot of the LiveBench leaderboard, rebuilt with each pipeline run from LiveBench's published data, with the calculation method described on that page.
4. **Weekly digest.** Every Friday a second selection pass picks the most significant items of the week, news, videos, and podcasts, plus any updates made to the conference calendar, into a weekly digest. Each week's digest is preserved in the [News Archive](news/archive/index.md) and published to a [digest feed](digest.xml) that any feed reader can follow. The [This Week page](news/this-week.md) is separate: a rolling view of everything kept in the last seven days, refreshed with each run.

<figure class="figure figure--html hf">
<div class="hf-flow">
<div class="hf-col">
<p class="hf-label">Fixed public sources</p>
<ul class="hf-list">
<li>AI publications and blogs</li>
<li>PubMed literature searches</li>
<li>medical education journals</li>
<li>YouTube and podcast rosters</li>
<li>LiveBench leaderboard data</li>
</ul>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-col">
<div class="hf-box">
<p class="hf-box-title">Automated pipeline</p>
<p class="hf-box-sub">Recent-window filter, blocklist, de-duplicate; a language model selects and summarizes each item.</p>
</div>
<span class="hf-arrow hf-arrow--down" aria-hidden="true"></span>
<p class="hf-banner">Fridays: weekly digest, archived and published</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-col">
<p class="hf-label">Generated sections</p>
<ul class="hf-list">
<li>News</li>
<li>Videos</li>
<li>Podcasts</li>
<li>This Week (rolling 7 days)</li>
<li>Benchmarks (LiveBench)</li>
</ul>
</div>
</div>
<figcaption>The pipeline writes only the generated sections; every hand-written page stays human-maintained.</figcaption>
</figure>

**Human oversight.** The source lists, selection criteria, and summarization instructions are all maintained by the site owner, and the pipeline cannot modify any hand-written page (with one narrow exception below). Even so, summaries and descriptions are machine-generated; read them as pointers to the original sources, not as substitutes.

**Freshness.** Guide and reference pages carry a "Content last reviewed" date in their footer. A weekly automated check re-reads each page on a schedule set by how quickly its facts tend to change, verifies the page's checkable claims against current sources, and updates the date when everything holds (the one edit the pipeline may make to a hand-written page); anything that looks out of date is escalated to the maintainer for a human correction. The date moves only when a review actually happened, by machine or by hand.

**Automated upkeep.** For calendar and roster data, watch processes re-check official sources on a schedule, and a narrow class of changes is applied automatically; everything that requires judgment stays human. New listings on the [Opportunities page](opportunities.md) can also be added automatically when they are hosted on an established challenge platform and pass the same checks; new conferences are always reviewed by a person first.

??? note "How automated changes are gated, in detail"
    A change is applied automatically only when every mechanical gate passes: it must be grounded in the item's own official page, the details must be coherent, and date changes must hold across two consecutive checks. Every automatic change lands in the public data files with a comment recording when and how it was verified, so the full audit trail is one click away in the site's repository. Tool governance statuses, prompt review statuses, the policy text, and all removals are never changed by automation, and anything that fails a gate is escalated to the maintainer instead of applied.

## Governance note

The university's [AI Responsible Use Policy](governance/policy.md) and the [AI Committee](governance/committee.md) are published in the Governance section. The [tools directory](tools/index.md) shows the institution's relationship with each tool, with committee review available on request, and the [prompt library](prompts/index.md) marks each prompt Draft or Reviewed, a status that is provisional until the committee ratifies its review process. The policy is the only institutional policy on this site. The playbooks, prompts, and other guidance are suggested practice, offered with the reasons they help; where a page summarizes the policy, the policy's own text governs.

## Privacy

This site sets no cookies and runs no advertising scripts. Page fonts load from Google Fonts, which receives your browser's address when a page loads but sets no cookies. Anonymous visit counts are collected with GoatCounter, a privacy-respecting service that uses no cookies and stores no personal information. Pages with a comments section load a small widget from giscus, an open-source service backed by this site's public GitHub Discussions board: reading comments requires nothing, posting requires a free GitHub account, and anything posted is public. Video thumbnails and podcast artwork load from the platforms that publish them; clicking any card takes you to the original platform, which has its own privacy practices.

## Disclaimer

This site is informational. Summaries of news, videos, and podcasts are machine-written and can contain errors, so the linked sources are the reference. Listings on this site are not endorsements, and benchmark scores are not purchasing advice. Nothing here is clinical guidance or legal advice.

## The maintainer

<div class="maintainer-card">
<img class="maintainer-photo" src="../assets/profile.jpg" alt="Portrait of Dr. Tarron Kayalackakom">
<div class="maintainer-bio">
<p>The AUA AI Hub is curated and maintained by <strong>Dr. Tarron Kayalackakom</strong>, Associate Dean of Artificial Intelligence in Medical Education and Assistant Professor in the Education Enhancement Department at the American University of Antigua College of Medicine, and chair of the university's <a href="../governance/committee/">AI Committee</a>. Dr. Kayalackakom built this site to give the AUACOM community one reliable, plainly written place to follow a fast-moving field, and keeps its sources, tool entries, and guidance current on an ongoing basis.</p>
</div>
</div>

## Comments and feedback

The site's [accessibility statement](accessibility.md) describes what has been checked, what is known to be imperfect, and how to report a barrier.

The fastest way to tell us what works, what does not, and what to fix: the [feedback form](https://forms.office.com/r/5a8RCi2YKP), five questions, about two minutes, including a field for corrections to anything on this site.

News, video, podcast, and digest pages also carry a comments section where you can discuss items and react to them, and the [Prompt Exchange](prompts/exchange.md) accepts community prompt contributions with public voting. Both run on the site's [GitHub Discussions board](https://github.com/TarronKayAUA/aua-ai-hub/discussions) and require a free [GitHub account](https://github.com/signup) to post.

**Community standards.** Comments and posts are public, so leave out patient details, student records, and exam content, which are not yours to publish. Discussion is moderated to keep it professional.

## Contact

Questions, corrections, tool suggestions, private prompt contributions, conference submissions, and anything not suited to a public comment: contact Dr. Tarron Kayalackakom, Associate Dean of AI in Medical Education, AUACOM, at [tkayalackakom@auamed.net](mailto:tkayalackakom@auamed.net).

For general feedback about the site, the [feedback form](https://forms.office.com/r/5a8RCi2YKP) takes about two minutes and routes to the same place.
