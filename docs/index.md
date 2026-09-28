---
hide:
  - navigation
  - toc
---

# AUA AI Hub { .hp-hidden }

<!--
  Home page (layout redesign, 2026-09-25; layout plan L11, owner decisions 4,
  7 and 11). A Door page: the hero with a search field, three shortcuts to
  common tasks, two routes for newcomers, six "Start here" cards, and a
  timely column that sits beside them on wide screens and after the cards on
  phones. Styles: docs/stylesheets/layout-home.css. Behaviour (the search
  field, the reader-side date check): docs/javascripts/layout-home.js.

  Nothing time-sensitive is typed here. The `timely:` markers are filled at
  build time by scripts/layout_home.py from the pipeline's feed pages,
  data/conferences.yaml, data/opportunities.yaml and data/polls.yaml, and `timely:minutes` reads the
  "About N minutes" chip on each named page, so a time quoted here always
  matches the page it points to.

  Card titles are headings (`### ... {: .card-title }`) so they show in
  heading navigation; the trailing `{: ... }` belongs to the heading, which
  is what lets `{ .card-link }` stay on the link and make the whole card
  one link. data-search-exclude keeps this page's duplicates of other
  pages, and its daily-changing column, out of site search.
-->

<div class="home" markdown>

<section class="home-hero" aria-label="Welcome and site search" data-island-hero>
<img class="home-hero__wordmark" src="assets/wordmark-white.png" alt="American University of Antigua College of Medicine" width="800" height="297">
<p class="home-hero__tagline">Artificial intelligence (AI), curated for medical education.</p>
<p class="home-hero__sub">For the American University of Antigua College of Medicine (AUACOM) community: step-by-step guides, tools, plain answers, and the policy that governs AI use.</p>
<form class="home-search" role="search" action="./" method="get" data-home-search>
<label class="home-search__label" for="home-search-input">Search guides, tools and prompts</label>
<svg class="home-search__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.52 6.52 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5"/></svg>
<input class="home-search__input" id="home-search-input" type="search" name="q" placeholder="Search guides, tools and prompts" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
</form>
</section>

<section class="home-tasks" aria-labelledby="common-tasks" markdown>

## Common Tasks {: .hp-hidden #common-tasks data-search-exclude="true" }

<div class="grid cards" markdown>

- ### :material-head-question-outline:{ .home-icon } [Practice Questions from Your Slides](prompts/index.md#nbme-style-question-tutor){ .card-link } {: .card-title data-search-exclude="true" }

    Prompt for students

- ### :material-presentation:{ .home-icon } [Prepare a Lecture](playbooks/lecture-prep.md){ .card-link } {: .card-title data-search-exclude="true" }

    Guide for faculty

- ### :material-file-document-edit-outline:{ .home-icon } [Draft a Memo or Minutes](playbooks/admin-drafting.md){ .card-link } {: .card-title data-search-exclude="true" }

    Guide for faculty and staff

</div>

</section>

<div class="home-routes" markdown>

- [New to AI? The Basics in <!-- timely:minutes pathway/how-ai-works.md pathway/prompting.md pathway/rules.md --> Minutes](pathway/index.md) <span class="row-sub">Modules 1 to 3 of the AI Literacy Pathway</span>
- [The AI Responsible Use Policy](governance/policy.md) <span class="row-sub">Short, readable, and the one reference</span>

</div>

<section class="home-start" markdown>

## Start Here {: data-search-exclude="true" }

<div class="grid cards" markdown>

- ### :material-account-school:{ .home-icon } [For Students](students.md){ .card-link } {: .card-title data-search-exclude="true" }

    Practice questions and flashcards from your own slides, shelf and National Board of Medical Examiners (NBME) score reports, rotations, and residency applications.

- ### :material-human-male-board:{ .home-icon } [For Faculty & Staff](faculty.md){ .card-link } {: .card-title data-search-exclude="true" }

    Step-by-step guides for lectures, exam questions, syllabus statements, feedback on student writing, and memos and minutes.

- ### :material-flask-outline:{ .home-icon } [Research](tools/research.md){ .card-link } {: .card-title data-search-exclude="true" }

    Literature reviews, research tools and what AUA licenses, where to disclose AI use, and running a model on your own computer for privacy.

    - [Reviewing the Literature](playbooks/literature-reviews.md)
    - [Running Models Locally](tools/local.md)

- ### :material-toolbox:{ .home-icon } [Tools & Prompts](tools-and-prompts.md){ .card-link } {: .card-title data-search-exclude="true" }

    Find a tool by task and see what AUA licenses, or copy a ready-made prompt.

    - [Tool Directory](tools/index.md)
    - [Prompt Library](prompts/index.md)

- ### :material-scale-balance:{ .home-icon } [Policy & Governance](governance/index.md){ .card-link } {: .card-title data-search-exclude="true" }

    The AI Responsible Use Policy, the AI Committee, and how to request a tool review.

    - [AI Responsible Use Policy](governance/policy.md)
    - [Module 3: The Policy in Practice](pathway/rules.md)

- ### :material-newspaper-variant:{ .home-icon } [News & Events](news-and-events.md){ .card-link } {: .card-title data-search-exclude="true" }

    Medical education AI news refreshed several times a day, conferences with their abstract deadlines, opportunities to take part, and committee announcements.

</div>

</section>

<aside class="home-timely" aria-label="New and coming up" markdown>

<section class="timely-block" markdown>

## Latest News {: data-search-exclude="true" }

<!-- timely:feeds-mini 2 medical-education clinical-practice general-ai -->

[All News](news-and-events.md#latest-news){ .timely-more }

</section>

<section class="timely-block" markdown>

## Coming Up {: data-search-exclude="true" }

<!-- timely:events 1 -->

<!-- timely:calls 1 -->

<!-- timely:committee -->

</section>

</aside>

<section class="home-short" markdown>

## Short on Time? {: data-search-exclude="true" }

<div class="door-rows" markdown>

- [Module 1: How AI Works](pathway/how-ai-works.md) <span class="row-sub">How AI works, in <!-- timely:minutes pathway/how-ai-works.md --> minutes</span>
- [Common Misconceptions](basics/misconceptions.md) <span class="row-sub">What AI can and cannot do, in <!-- timely:minutes basics/misconceptions.md --> minutes</span>
- [Glossary](basics/glossary.md) <span class="row-sub">AI terms, one paragraph each</span>

</div>

</section>

Institutional updates and committee polls: [Announcements and Committee Polls](announcements/index.md). Questions: [Contact](about.md#contact).
{: .home-foot }

</div>
