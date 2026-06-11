# Image Generation Benchmarks

Text-to-image models are judged differently from language models. There is no answer key for a picture, so the field's standard is the **arena**: thousands of people are shown two images generated from the same prompt, without knowing which model made which, and vote for the better one. Votes become Elo-style ratings, the same math used to rank chess players. It measures human preference at scale, which is most of what matters for generated images, with one caveat: preference rewards what looks good, which is not always what is accurate.

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

## Arena snapshot

--8<-- "includes/media-image.md"

A note on method: this table is rebuilt nightly by the same pipeline that refreshes the News section, using the Artificial Analysis free Data API. If the upstream data is unreachable, the most recent successful snapshot stays in place and the date above tells you how fresh it is.

## Medical images are a different question

No public leaderboard ranks models on generating *accurate* medical imagery, and the peer-reviewed evidence says the gap between pretty and correct is wide. A 2025 study in the Journal of Pediatric Ophthalmology and Strabismus had general text-to-image models depict common pediatric eye pathologies and scored them against human medical illustration: the generated images rated poorly overall and worse on pathological accuracy specifically ([DOI](https://doi.org/10.3928/01913913-20250724-03)). A clinical perspective in Cureus reaches the same balance point for practice: generated imagery may eventually enrich patient communication and teaching, but inaccuracy and bias demand that it supplement, never substitute for, verified clinical material ([DOI](https://doi.org/10.7759/cureus.68313)). The technical literature on medical image synthesis and translation is advancing quickly, with its own evaluation metrics distinct from preference arenas; a 2025 review in Medical Image Analysis maps that landscape ([DOI](https://doi.org/10.1016/j.media.2025.103605)).

The practical guidance for AUACOM follows directly: treat general-purpose image models as illustration tools, not anatomy references. A generated image used in teaching needs expert review for accuracy and labeling as AI-generated per the [AI Responsible Use Policy](../governance/policy.md), and generated imagery has no place in diagnosis. Never upload identifiable patient images to a generation tool; that is patient data in a public tool, regardless of creative intent.

For how these models work and how to run open ones yourself, see [Running Models Locally](../tools/local.md). For language model rankings, see [Language Model Benchmarks](../benchmarks.md); for video generation, the [Video Generation Benchmarks](video.md).
