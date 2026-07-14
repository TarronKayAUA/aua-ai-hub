---
last_reviewed: 2026-07-13
---

# Image Generation Benchmarks

Text-to-image models are judged differently from language models. There is no answer key for a picture, so the field's standard is the **arena**: thousands of people are shown two images generated from the same prompt, without knowing which model made which, and vote for the better one. Votes become Elo-style ratings, the same math used to rank chess players. It measures human preference at scale, which is most of what matters for generated images, with one caveat: preference rewards what looks good, which is not always what is accurate.

<figure class="figure">
<svg viewBox="0 0 660 215" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="How an arena ranks models: one prompt produces two images from hidden models, a person votes for the better one, and thousands of blind votes become Elo-style ratings">
<defs><marker id="ar-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="330" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">how an arena ranks models</text>
<rect x="20" y="76" width="120" height="52" rx="8" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="80" y="98" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">one prompt</text>
<text x="80" y="114" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">"a heart, labeled"</text>
<line x1="142" y1="92" x2="176" y2="66" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar-ar)"/>
<line x1="142" y1="112" x2="176" y2="138" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar-ar)"/>
<rect x="180" y="38" width="130" height="54" rx="8" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1.5"/>
<text x="245" y="60" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">image A</text>
<text x="245" y="78" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">model name hidden</text>
<rect x="180" y="112" width="130" height="54" rx="8" fill="none" stroke="var(--md-default-fg-color--light)" stroke-width="1.5"/>
<text x="245" y="134" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">image B</text>
<text x="245" y="152" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">model name hidden</text>
<line x1="312" y1="65" x2="356" y2="92" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar-ar)"/>
<line x1="312" y1="139" x2="356" y2="112" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar-ar)"/>
<rect x="360" y="76" width="120" height="52" rx="26" fill="none" stroke="#ff8f00" stroke-width="2"/>
<text x="420" y="98" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--md-typeset-color)">a person votes</text>
<text x="420" y="114" text-anchor="middle" font-size="8.5" fill="var(--md-default-fg-color--light)">better one wins</text>
<line x1="482" y1="102" x2="516" y2="102" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#ar-ar)"/>
<rect x="520" y="60" width="120" height="84" rx="8" fill="var(--md-primary-fg-color)"/>
<text x="580" y="82" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">thousands of votes</text>
<text x="580" y="99" text-anchor="middle" font-size="9" fill="#ffffff">become Elo-style</text>
<text x="580" y="114" text-anchor="middle" font-size="9" fill="#ffffff">ratings, the math</text>
<text x="580" y="129" text-anchor="middle" font-size="9" fill="#ffffff">that ranks chess players</text>
<text x="330" y="182" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">blind at the vote, honest in aggregate: it measures preference at scale</text>
<text x="330" y="200" text-anchor="middle" font-size="9" fill="#c62828">the caveat: preference rewards what looks good, which is not always what is accurate</text>
</svg>
<figcaption>The arena mechanism behind every leaderboard on this page and the video page.</figcaption>
</figure>

When you read an image arena, look past the overall rank to the things that separate models in practice: adherence (did the image contain what the prompt asked for, in the right relationships), text rendering (legible labels and signs remain hard), anatomy (hands, joints, dentition), and style range. A model can win on beauty and lose on every one of those.

## The leaderboards worth knowing

<div class="grid cards" markdown>

- :material-image-outline:{ .lg .middle } __Artificial Analysis: Image Arena__

    ---

    Blind head-to-head votes across text-to-image models, with proprietary and open-weights models ranked together.

    [Visit the Image Arena](https://artificialanalysis.ai/image/arena)

- :material-chart-bar:{ .lg .middle } __Artificial Analysis: Image Models__

    ---

    The companion model view, adding generation speed and price per image to the quality ratings.

    [Visit Image Models](https://artificialanalysis.ai/image/models)

- :material-account-group:{ .lg .middle } __LMArena: Text-to-Image__

    ---

    The arena that popularized blind-vote ranking, applied to image generation, run by the LMArena team.

    [Visit the leaderboard](https://arena.ai/leaderboard/text-to-image)

</div>

## Medical images are a different question

No public leaderboard ranks models on generating *accurate* medical imagery, and the peer-reviewed evidence says the gap between pretty and correct is wide. A 2025 study in the Journal of Pediatric Ophthalmology and Strabismus had general text-to-image models depict common pediatric eye pathologies and scored them against human medical illustration: the generated images rated poorly overall and worse on pathological accuracy specifically ([DOI](https://doi.org/10.3928/01913913-20250724-03)). A clinical perspective in Cureus reaches the same balance point for practice: generated imagery may eventually enrich patient communication and teaching, but inaccuracy and bias demand that it supplement, never substitute for, verified clinical material ([DOI](https://doi.org/10.7759/cureus.68313)). The technical literature on medical image synthesis and translation is advancing quickly, with its own evaluation metrics distinct from preference arenas; a 2025 review in Medical Image Analysis maps that landscape ([DOI](https://doi.org/10.1016/j.media.2025.103605)).

The practical guidance for AUACOM follows directly: treat general-purpose image models as illustration tools, not anatomy references. A generated image used in teaching needs expert review for accuracy and labeling as AI-generated per the [AI Responsible Use Policy](../governance/policy.md), and generated imagery has no place in diagnosis. Never upload identifiable patient images to a generation tool; that is patient data in a public tool, regardless of creative intent.

For how these models work and how to run open ones yourself, see [Running Models Locally](../tools/local.md). For language model rankings, see [Language Model Benchmarks](../benchmarks.md); for video generation, the [Video Generation Benchmarks](video.md).
