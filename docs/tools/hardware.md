# Hardware for Local AI

[Running Models Locally](local.md) gets you started in ten minutes. This page is the deeper layer: what actually determines whether a model runs on your machine and how fast it feels, taught through one piece of arithmetic you can do on a napkin. By the end you should be able to estimate, for any model and any computer, whether it fits and roughly how fast it will run, without buying anything or trusting a benchmark chart.

!!! note "Should you run models locally at all?"
    Be honest about the economics first: a serious graphics card costs more than years of cloud assistant subscriptions, and cloud frontier models are simply better. The reasons local wins are privacy (nothing you type leaves the machine, which matters under the [AI Responsible Use Policy](../governance/policy.md)'s data rules), zero marginal cost once you own the hardware, and education. The best local setup is usually the computer you already own, which is what the estimator below is for. If you need serious hardware occasionally, [rent it by the hour](local.md#when-your-machine-cannot-keep-up-renting-a-gpu) instead of buying.

## What tokens per second feels like

Local model speed is measured in tokens per second, where a token is roughly three quarters of a word. Numbers are abstract; feel the difference instead. Each button replays the same passage at a different rate (this is a simulation of the rate, not a benchmark of any particular machine):

<div class="tps-demo" id="tps-demo" markdown="0">
<button data-tps="3">3 tokens/s (a crawl)</button>
<button data-tps="12">12 tokens/s (reading speed)</button>
<button data-tps="40">40 tokens/s (comfortable)</button>
<button data-tps="120">120 tokens/s (instant)</button>
<div class="tps-demo-output">Press a button to see the passage typed at that rate.</div>
</div>

Below about 5 tokens per second, a local model is only usable for short answers. Around 10 to 15 it keeps pace with your reading. Past 40 it stops mattering. That framing turns every hardware question into one concrete target: what rate will this machine produce?

## The one number that decides speed: memory bandwidth

Generating a token requires reading essentially all of the model's active weights out of memory, once per token. Processors are rarely the bottleneck; the pipe between memory and processor is. That gives the estimate this whole page is built on:

**Tokens per second (ceiling) ≈ memory bandwidth ÷ bytes read per token**

Real systems achieve roughly half to two thirds of that ceiling. Memory bandwidth is a published specification: look for "memory bandwidth" on any graphics card or chip spec sheet, in gigabytes per second (GB/s). The hierarchy is stark, and it is the reason the same model feels instant on one machine and unusable on another:

| Where the model lives | Typical bandwidth | What it means |
| --- | --- | --- |
| Graphics card memory (VRAM) | 250 to 1,000+ GB/s | The fast path; this is why GPUs matter |
| Unified memory (Apple silicon and similar) | 100 to 800+ GB/s by chip tier | Capacity of system memory at GPU-class speeds |
| System memory (RAM, dual-channel DDR5) | 60 to 100 GB/s | Runs models, slowly; capacity is cheap here |
| Solid-state drive (SSD) | 3 to 7 GB/s | A model spilling here slows to a crawl |
| Hard disk (HDD) | ~0.2 GB/s | Not usable for inference at all |

Two consequences worth internalizing. First, **VRAM versus RAM is not about speed of the chips near your processor; it is about the width of the pipe**: a midrange graphics card moves data four to six times faster than excellent system memory. Second, **speed follows where the bytes live**. A model entirely in the fast tier runs at the fast tier's rate; every byte it reads from a slower tier is paid for at that tier's rate.

### When it does not quite fit: partial offloading

Runners like Ollama and LM Studio do not give up when a model exceeds video memory; they split it, keeping as many layers as fit on the graphics card and reading the rest from system memory. The arithmetic on this page still works, applied per tier: the spilled fraction is read at system-memory speed, so the result is a blend weighted toward the slower tier. For **dense** models that blend is punishing, and a large dense model living mostly in RAM does crawl. For **mixture-of-experts** models it is surprisingly livable, because only the small active fraction is read per token: gpt-oss-120b split across a 16 GB laptop graphics card and 64 GB of system RAM reads roughly 3 GB per token, mostly from RAM at around 90 GB/s, which pencils out to the teens of tokens per second. That is reading speed, from a model four times larger than the card, and it is a real configuration people run today. The refined rule: **total capacity across VRAM plus RAM decides what is possible; where the bytes sit, and how many of them are active per token, decides how fast.** Spilling past RAM onto an SSD remains a hard stop.

### Unified memory, the interesting middle

Apple silicon Macs (and a growing set of similar PC chips) share one pool of memory between the processor and graphics at bandwidths far above ordinary RAM. The trade is capacity for bandwidth: a 96 GB unified-memory machine runs models no consumer graphics card can hold, at speeds between a GPU and a CPU. For mixture-of-experts models (below), which need lots of capacity but little bandwidth per token, unified memory is arguably the best consumer hardware there is. If you own a higher-tier Apple silicon Mac, you own a genuinely good local AI machine and may not need to buy anything.

## Sizing a model: parameters × quantization

The memory a model needs is its parameter count times the bytes stored per parameter, and **quantization** sets the bytes:

| Precision | Bytes per parameter (approx.) | Quality |
| --- | --- | --- |
| FP16 (full) | 2.0 | Reference quality; rarely worth it locally |
| Q8 (8-bit) | ~1.06 | Indistinguishable from full for most use |
| Q4 (4-bit) | ~0.57 | The standard choice; small, measurable quality loss |

So an 8 billion parameter model is roughly 16 GB at full precision, 8.5 GB at Q8, and 4.7 GB at Q4. Q4 is the default the community settled on because the quality loss is modest and the size halves twice; below Q4 (Q3, Q2) degradation gets noticeable quickly, and those are best avoided except in emergencies. On top of the weights, budget **1 to 2 GB of working memory** for short conversations, and more for long ones: the model keeps notes on everything in the current context (the KV cache), and a very long document or chat can add several gigabytes. People who size for the weights alone are the people wondering why their 32,000-token context will not load.

## Dense, mixture-of-experts, and multimodal

- **Dense models** use every parameter for every token. Memory needed and speed both follow the full parameter count. Most small models (4B, 8B) are dense.
- **Mixture-of-experts (MoE)** models carry many parameters but route each token through a small subset. The rule: **total parameters size the memory, active parameters set the speed.** OpenAI's gpt-oss-20b needs a 20B-class memory footprint but reads only 3.6B parameters per token, so it runs at small-model speed. This is why MoE dominates recent open releases, and why capacity-rich, bandwidth-modest machines (unified memory, CPU with lots of RAM) punch above their weight on them.
- **Multimodal models** (image or audio input) carry extra components and working memory on top of the language model; expect an extra one to several gigabytes over the text-only arithmetic.

Note that every open family ships **variants at several sizes** (a Qwen or Gemma release spans sub-billion to flagship scale), so "can I run Qwen?" is really "which Qwen fits my memory?"; the [open-weights section](index.md#open-weights-models) lists the families and the runners list the sizes.

## Put it together: the estimator

Pick a model, a quantization, and the hardware tier closest to yours. The widget applies exactly the arithmetic above (nothing is measured or promised; the parameter counts are verified from each model's published weights, and bandwidths are representative figures for the tier, checked July 2026):

<!-- render:hardware-estimator -->

Worked example, by hand: gpt-oss-20b at Q4 is 21.5B × 0.57 ≈ 12.3 GB plus working memory, call it 14 GB, so it misses an 8 GB card entirely, fits a 16 GB card or Mac, and on a 500 GB/s card the ceiling is 500 ÷ (3.6 × 0.57) ≈ 240 tokens per second: effectively instant, because only the active parameters move per token.

## Practical notes

**Laptops throttle.** A laptop GPU's headline bandwidth assumes thermals it cannot sustain; after a few minutes of generation expect noticeably below the estimate, and expect fan noise and battery drain. Plugged in and cooled, gaming laptops remain perfectly capable local machines.

**NPUs are not there yet.** The "neural processing units" heavily marketed in current laptops accelerate small background tasks well, but today's local language model stacks run overwhelmingly on GPUs and CPUs; do not buy a machine for its NPU rating expecting local chat speedups.

**Formats, briefly.** Downloaded models come as GGUF files (the universal format used by LM Studio, Ollama, and everything llama.cpp-based) or MLX (Apple-optimized). The runners in the [quick-start guide](local.md) pick sensible files for you; the quantization suffix in a filename (Q4_K_M, Q8_0) is the bytes-per-parameter choice from the table above.

**This is a terrible moment to buy memory.** Memory prices spiked through late 2025 and 2026 as manufacturers shifted production toward datacenter AI: a 32 GB DDR5 kit that cost $80 to $120 a year ago listed near $375 in mid 2026, and analysts do not expect meaningful relief before late 2027 ([price tracking](https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities), [market analysis](https://www.idc.com/resource-center/blog/global-memory-shortage-crisis-market-analysis-and-the-potential-impact-on-the-smartphone-and-pc-markets-in-2026/)). Graphics cards carry the same pressure. The practical advice follows from everything above: use the machine you have, favor mixture-of-experts models that fit it, and [rent cloud GPUs](local.md#when-your-machine-cannot-keep-up-renting-a-gpu) for the occasional heavy job rather than buying into a spiked market.

## What you probably own

| Your machine | What runs comfortably (Q4) | Expect |
| --- | --- | --- |
| Laptop, 8 GB RAM, no GPU | 4B-class dense models | Reading speed at best |
| MacBook with 16 GB unified memory | Up to ~8B dense, small MoE | Reading speed to comfortable |
| Gaming laptop, 8 GB VRAM | Up to ~8B dense in VRAM | Comfortable, minding thermals |
| Desktop, 12 to 16 GB VRAM | 20B-class MoE (gpt-oss-20b), 8 to 14B dense | Comfortable to instant |
| Mac with 64 to 128 GB unified memory | Large MoE (Llama 4 Scout, gpt-oss-120b) | Reading speed to comfortable on models nothing else consumer-grade can run |

The estimates on this page were authored July 2026; parameter counts come from each model's published weights and bandwidth figures from vendor specifications. The arithmetic does not age; the examples slowly will.
