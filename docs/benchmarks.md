# Language Model Benchmarks

How do you know whether one artificial intelligence (AI) model is better than another? Benchmarks are the field's answer: standardized test sets that every model takes, so results can be compared. This page covers language models: how to read their leaderboards, the ones worth knowing, and a live snapshot of one of them. Generative media is ranked differently; see the companion pages on [image generation](benchmarks/image.md) and [video generation](benchmarks/video.md).

## How to read a leaderboard

Three cautions keep benchmark numbers useful:

1. **Benchmarks measure the test, not your task.** A model that tops a math benchmark may still write mediocre patient-education materials. Scores are a compass, not a verdict; the only benchmark that truly matters is a trial on your own work.
2. **Contamination inflates scores.** When a benchmark's questions leak into training data, models can score well by memory rather than ability. Newer benchmarks fight this by refreshing their questions on a schedule, which is why LiveBench, featured below, regenerates its question set and delays publishing recent questions.
3. **Small gaps are noise.** A point or two of difference between models is rarely meaningful. Pay attention to tiers, trends over months, and category strengths (a model can be strong at coding and middling at instruction following), not single-rank differences.

For the vocabulary, see [benchmark, eval, and leaderboard](basics/glossary.md) in the glossary.

## The leaderboards worth knowing

<div class="grid cards" markdown>

- :material-chart-line:{ .lg .middle } __Artificial Analysis__

    ---

    Independent measurements of intelligence, speed, and price across providers. The best single view of the cost-versus-capability tradeoff.

    [Visit Artificial Analysis](https://artificialanalysis.ai/models)

- :material-flask-outline:{ .lg .middle } __LiveBench__

    ---

    An open, contamination-aware benchmark that refreshes its questions on a schedule. The table below is drawn from its published data nightly.

    [Visit LiveBench](https://livebench.ai/)

- :material-table-large:{ .lg .middle } __BenchLM__

    ---

    Aggregates scores from hundreds of public benchmarks into one comparable view, with sources cited per score.

    [Visit BenchLM](https://benchlm.ai/)

- :material-account-group:{ .lg .middle } __LMArena__

    ---

    Rankings from millions of blind head-to-head votes by real users, a measure of preference rather than test performance.

    [Visit LMArena](https://lmarena.ai/)

</div>

## LiveBench snapshot

--8<-- "includes/livebench.md"

A note on method: this table is rebuilt nightly by the same pipeline that refreshes the News section, using LiveBench's published per-task data. Category scores are the mean of each category's task scores, and the global average is the mean of the categories, matching how LiveBench presents its own leaderboard. If the upstream data is unreachable, the most recent successful snapshot stays in place and the date above tells you how fresh it is.
