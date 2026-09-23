---
last_reviewed: 2026-09-01
---

# Image Generation Benchmarks

Text-to-image artificial intelligence (AI) models are judged differently from language models, because there is no answer key for a picture. The field's standard is the **arena**: thousands of people see two images generated from the same prompt, without knowing which model made which, and vote for the better one. Votes become Elo-style ratings, the same math used to rank chess players.

That measures human preference at scale, which is useful for general illustration. The caveat is that preference rewards what looks good, not what is accurate, so look past the overall rank for:

- **Prompt adherence:** whether the image contains what was asked for, in the arrangement asked for.
- **Text rendering:** legible, correctly spelled labels, still a common failure.
- **Anatomy:** counts and spatial relations (fingers, joints, teeth, ribs), the two things generators handle worst.
- **Style range:** whether a model can produce a clean schematic as well as a photograph.

A model can win on beauty and lose on every one of those.

<figure class="figure figure--html hf">
<p class="hf-title">How an arena ranks models</p>
<div class="hf-flow">
<div class="hf-box">
<p class="hf-box-title">One prompt</p>
<p class="hf-box-sub">"a heart, labeled"</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-col">
<div class="hf-box hf-box--plain">
<p>Image A</p>
<p class="hf-box-sub">model name hidden</p>
</div>
<div class="hf-box hf-box--plain">
<p>Image B</p>
<p class="hf-box-sub">model name hidden</p>
</div>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--warn hf-box--pill">
<p class="hf-box-title">A person votes</p>
<p class="hf-box-sub">better one wins</p>
</div>
<span class="hf-arrow" aria-hidden="true"></span>
<div class="hf-box hf-box--filled">
<p class="hf-box-title">Thousands of votes</p>
<p>become Elo-style ratings, the math that ranks chess players</p>
</div>
</div>
<p class="hf-note">Blind at the vote, honest in aggregate: it measures preference at scale.</p>
<p class="hf-note hf-note--alert">The caveat: preference rewards what looks good, which is not always what is accurate.</p>
<figcaption>The arena mechanism behind every leaderboard on this page and the video page.</figcaption>
</figure>

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

- :material-account-group:{ .lg .middle } __Arena: Text-to-Image__

    ---

    The arena that popularized blind-vote ranking, applied to image generation, run by the Arena team (formerly LMArena).

    [Visit the leaderboard](https://arena.ai/leaderboard/text-to-image)

</div>

## Medical images are a different question

No public leaderboard ranks models on generating *accurate* medical imagery, and the peer-reviewed evidence says the gap between pretty and correct is wide:

- A 2025 study in the Journal of Pediatric Ophthalmology and Strabismus had general text-to-image models depict common pediatric eye pathologies and scored them against human medical illustration: the generated images rated poorly overall and worse on pathological accuracy specifically ([Jong et al.](https://doi.org/10.3928/01913913-20250724-03)).
- A clinical perspective in Cureus draws the practical conclusion: generated imagery may eventually enrich patient communication and teaching, but inaccuracy and bias mean it should supplement verified clinical material, never replace it ([Javan et al., 2024](https://doi.org/10.7759/cureus.68313)).
- The technical literature on medical image synthesis and translation is advancing quickly, with its own evaluation metrics distinct from preference arenas; a 2025 review in Medical Image Analysis maps that landscape ([Chen et al., 2025](https://doi.org/10.1016/j.media.2025.103605)).
- For teaching figures specifically, the [AI-Generated Images in Teaching](../playbooks/ai-images.md) playbook covers the anatomy evaluations, what to reach for instead, and when a flawed image is defensible in a session.

The practical guidance for the American University of Antigua College of Medicine (AUACOM) follows directly: treat general-purpose image models as illustration tools, not anatomy references. A generated image used in teaching needs review for accuracy by someone with the relevant expertise, and the [AI Responsible Use Policy](../governance/policy.md) requires you to verify AI-generated content and label it as AI-generated.

!!! danger "Never crossed, whatever the tool"
    - Identifiable patient images never enter a generation tool; that is patient data in a public tool, regardless of creative intent.
    - Generated imagery has no place in diagnosis.

To run open image models yourself, see [Running Models Locally](../tools/local.md#beyond-chat-images-video-and-voice). Image generation tools are listed under [Image Generation](../tools/index.md#image-generation) in the tools directory. For language model rankings, see [Language Model Benchmarks](../benchmarks.md); for video generation, the [Video Generation Benchmarks](video.md).
