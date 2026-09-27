# News & Events

<!--
  News & Events landing (layout redesign, 2026-09-25; layout plan L18). Two
  panels, the newest Medical Education items and what is coming up, then
  one row per section. The `timely:` markers are filled at build time by
  scripts/layout_home.py from includes/latest.md, data/conferences.yaml and
  data/polls.yaml; nothing dated is typed here. Styles live in
  docs/stylesheets/layout-home.css with the home page's, since the two
  pages share the timely blocks.
-->

Artificial intelligence (AI) news selected for medical education, and what is coming up. An automated pipeline selects the news and refreshes it several times a day, and the summaries are machine generated; [how content is selected](about.md#how-content-is-selected) explains the process.

<div class="ne-panels" markdown>

<section class="timely-block timely-panel" markdown>

## Newest in Medical Education {: data-search-exclude="true" }

<!-- timely:news 5 -->

[All medical education news](news/medical-education.md){ .timely-more }

</section>

<section class="timely-block timely-panel" markdown>

## Coming Up {: data-search-exclude="true" }

<!-- timely:coming-up 2 -->

[All conferences and events](conferences.md){ .timely-more }

<!-- timely:poll -->

[Announcements and Committee Polls](announcements/index.md){ .timely-more }

</section>

</div>

## More News and Events

<div class="door-rows door-rows--two" markdown>

- [This Week](news/this-week.md) <span class="row-sub">Everything kept in the last seven days, across every section</span>
- [Clinical Practice](news/clinical-practice.md) <span class="row-sub">AI in clinical care, deployment, and regulation</span>
- [General AI](news/general-ai.md) <span class="row-sub">Model releases, benchmarks, and developments in general AI</span>
- [Videos](news/videos.md) <span class="row-sub">Recent videos from a curated set of channels</span>
- [Podcasts](news/podcasts.md) <span class="row-sub">Recent episodes on AI in medicine, education, and beyond</span>
- [Opportunities](opportunities.md) <span class="row-sub">Hackathons, challenges, and programs you can enter</span>
- [Announcements and Committee Polls](announcements/index.md) <span class="row-sub">Institutional updates and the AI Committee's polls</span>
- [News Archive](news/archive/index.md) <span class="row-sub">The Friday highlights digest for each past week</span>

</div>
