---
last_reviewed: 2026-09-01
---

# Video Generation Benchmarks

Video generation is ranked the same way as [image generation](image.md): blind human-preference arenas, where voters compare two clips generated from the same prompt and an Elo-style rating accumulates (the image page has [a diagram of the mechanism](image.md)). Video adds dimensions that images do not have, and the good leaderboards split them into separate tasks: **text-to-video** (a clip from a written prompt), **image-to-video** (animating a supplied still while preserving its composition), and increasingly video editing (instruction-based changes to an existing clip). A model can lead one task and trail badly on another, so check the task that matches your use before comparing ranks.

What separates video models in practice, and what to look past the overall rank for:

- **Temporal consistency:** objects keep their identity across frames.
- **Motion plausibility:** physics that does not distract.
- **Prompt adherence over time:** events happen in the requested order.
- **Clip length:** how long a clip runs before quality decays.

Audio is the newest frontier, with some arenas now ranking with and without generated sound.

## The leaderboards worth knowing

<div class="grid cards" markdown>

- :material-video-outline:{ .lg .middle } __Artificial Analysis: Text-to-Video__

    ---

    Blind-vote arena rankings for generating clips from written prompts, proprietary and open-weights models together.

    [Visit Text-to-Video](https://artificialanalysis.ai/video/leaderboard/text-to-video)

- :material-movie-open-outline:{ .lg .middle } __Artificial Analysis: Image-to-Video__

    ---

    Rankings for animating a supplied image, the task behind most practical video work, scored with and without audio.

    [Visit Image-to-Video](https://artificialanalysis.ai/video/leaderboard/image-to-video)

- :material-account-group:{ .lg .middle } __LMArena: Text-to-Video__

    ---

    The LMArena team's blind-vote video arena, a useful second opinion on the same question.

    [Visit the leaderboard](https://arena.ai/leaderboard/text-to-video)

- :material-animation-play-outline:{ .lg .middle } __LMArena: Image-to-Video__

    ---

    LMArena's image-animation rankings, comparing how faithfully models bring a still to life.

    [Visit the leaderboard](https://arena.ai/leaderboard/image-to-video)

</div>

## A note on medical use

Everything on the [image generation page about medical contexts](image.md#medical-images-are-a-different-question) applies with more force here: there is no public benchmark for clinically accurate generated video, preference scores say nothing about anatomical or procedural correctness, and a fluent clip of a procedure can be confidently wrong in ways a non-expert will not catch. Generated video in teaching needs expert review and AI-generated labeling per the [AI Responsible Use Policy](../governance/policy.md).

!!! danger "Never crossed, whatever the tool"
    - Patient-identifiable material never enters a generation tool.
    - Synthetic media depicting real, identifiable people without consent is prohibited territory regardless of intent.

The tools being ranked are listed under [Video Generation](../tools/index.md#video-generation) in the directory; for text models, see the [Language Model Benchmarks](../benchmarks.md).
