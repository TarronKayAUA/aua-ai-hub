---
last_reviewed: 2026-07-02
---

# Running AI Models Locally

Every assistant in the [tools directory](index.md) runs in a vendor's cloud: what you type travels to their servers. There is another way. The [open-weights models](index.md#open-weights-models) at the bottom of the directory can be downloaded and run entirely on your own computer, where nothing you type leaves the machine. This page is a practical starting point.

**Why bother.** Three reasons people run models locally: privacy (your text never leaves your hardware), cost (the models and the tools below are free), and learning (nothing demystifies a language model like running one yourself). The honest trade-off: local models are smaller and noticeably less capable than frontier cloud models, and they run slower. For drafting an email that is fine; for hard reasoning you will notice the gap.

!!! warning "Local does not mean exempt"
    Running a model locally removes the vendor from the picture, but institutional rules still apply. The [AI Responsible Use Policy](../governance/policy.md) governs work with patient information and student records regardless of where the model runs.

<figure class="figure">
<svg viewBox="0 0 660 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Where your text goes: to vendor servers with a cloud assistant, nowhere with a local model, to a rented server with cloud GPUs">
<defs><marker id="lo-ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--md-primary-fg-color)"/></marker></defs>
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">where your text goes</text>
<text x="24" y="59" text-anchor="start" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">cloud assistant</text>
<rect x="150" y="36" width="130" height="36" rx="6" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.4" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="215" y="58" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">your text</text>
<text x="360" y="46" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">leaves your machine</text>
<line x1="282" y1="54" x2="438" y2="54" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lo-ar)"/>
<rect x="440" y="36" width="180" height="36" rx="6" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="530" y="58" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">the vendor's servers</text>
<text x="24" y="124" text-anchor="start" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">local model</text>
<rect x="150" y="101" width="250" height="36" rx="6" fill="none" stroke="#2e7d32" stroke-width="2"/>
<text x="275" y="123" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">your text stays on this machine</text>
<text x="420" y="123" text-anchor="start" font-size="9.5" fill="var(--md-default-fg-color--light)">nothing leaves; works offline</text>
<text x="24" y="189" text-anchor="start" font-size="10.5" font-weight="bold" fill="var(--md-typeset-color)">rented GPU</text>
<rect x="150" y="166" width="130" height="36" rx="6" fill="var(--md-default-fg-color--lightest)" fill-opacity="0.4" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="215" y="188" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">your text</text>
<text x="360" y="176" text-anchor="middle" font-size="9" fill="var(--md-default-fg-color--light)">leaves, to hardware you control</text>
<line x1="282" y1="184" x2="438" y2="184" stroke="var(--md-primary-fg-color)" stroke-width="2" marker-end="url(#lo-ar)"/>
<rect x="440" y="166" width="180" height="36" rx="6" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5"/>
<text x="530" y="188" text-anchor="middle" font-size="10" fill="var(--md-typeset-color)">a server you rent</text>
<text x="330" y="222" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">the policy's data rules apply in all three lanes</text>
</svg>
<figcaption>Privacy is the headline reason to run locally: the middle lane is the only one where nothing leaves.</figcaption>
</figure>

## What you need

Memory is the main constraint. A model has to fit in your computer's memory (RAM), or better, in the video memory of a graphics card. Most local models are used in quantized form, meaning compressed versions that trade a small amount of quality for a much smaller size. Rough expectations:

- **A typical laptop (8 GB of memory)** runs small models, around 4 billion parameters and under. Fine for experimenting, summaries, and simple drafting.
- **16 GB of memory** comfortably runs mid-size models; OpenAI's gpt-oss-20b, for example, is designed to run in 16 GB.
- **32 GB or a recent gaming graphics card** opens up the 20 to 30 billion parameter class, where local models start feeling genuinely useful.
- Apple silicon Macs share memory between the processor and graphics, which makes them popular for local models; the same memory math applies.

For the full picture (what tokens per second feels like, why video memory beats system memory, quantization trade-offs, mixture-of-experts models, and an interactive estimator for your own machine), see [Hardware for Local AI](hardware.md).

## The simple path: a local chat assistant

1. **Install a runner.** [LM Studio](https://lmstudio.ai) is the easiest start: a desktop application where you browse models, click download, and chat, no command line involved. [Ollama](https://ollama.com) is the command-line equivalent, and pairs with [Open WebUI](https://openwebui.com) if you want a browser chat interface on top. All three are free and listed in the [directory](index.md).
2. **Pick a small model first.** Start with something in the 4 billion parameter class (a small Gemma or Qwen variant), confirm it runs smoothly, then work upward to the largest model your memory allows. The [open-weights section](index.md#open-weights-models) lists the major families, the [Benchmarks page](../benchmarks.md) tracks how they currently rank, and both runners show curated, ready-to-download versions of all of them.
3. **Calibrate expectations.** Replies stream more slowly than cloud assistants, knowledge cutoffs are real, and there is no web search unless you add one. Treat outputs with the same verification habits as any other model, per the [misconceptions page](../basics/misconceptions.md).

## Beyond chat: images, video, and voice

Text is the simple case. Open-weights models also exist for image generation, video generation, speech-to-text, and text-to-speech, and a different tool dominates that world: [ComfyUI](https://www.comfy.org), a free, open-source application where you assemble model pipelines visually by connecting nodes on a canvas. It is the standard way to run the Stable Diffusion family and newer open image and video models locally. The learning curve is steeper than a chat runner, and image and video models generally want more video memory than text models, but the community templates make the first steps manageable.

For voice, [Whisper](https://github.com/openai/whisper) (already in the directory) transcribes speech to text entirely on your machine, and open text-to-speech models are improving quickly.

## When your machine cannot keep up: renting a GPU

If a model you want will not fit in your hardware, you can rent the hardware instead: cloud providers such as Amazon Web Services (AWS) offer GPU instances by the hour, and GPU rental marketplaces like [RunPod](https://www.runpod.io) and [Vast.ai](https://vast.ai) make the same thing simpler and usually cheaper, with one-click templates for Ollama, Open WebUI, and ComfyUI. You get capability no laptop can match and pay only while the machine runs.

Be clear-eyed about what this trades away. The moment your model runs on rented hardware, your data leaves your machine, which was the headline reason to run locally in the first place. A rented GPU running an open-weights model is still more under your control than a consumer chatbot (you choose the model, nothing is retained to train on by default, and you can destroy the instance), but the [AI Responsible Use Policy](../governance/policy.md)'s data rules apply exactly as they do to any hosted tool: no patient information, student records, or confidential material. Add the practical frictions (per-hour billing that keeps running if you forget to shut down, and more setup than a desktop app) and the honest summary is: rent for capability and experiments, run truly locally for privacy, and use the directory's cloud tools, within the policy's data rules, for everyday work.

## Watch: setting it up

Verified walkthroughs for the tools on this page. Links reviewed June 2026; check a video's date against the tool's current version.

<!-- render:guide-videos:local -->

Beyond these, several channels followed by our [Videos page](../news/videos.md) regularly test new open-weights releases on consumer hardware, which is the fastest way to see what a model of a given size can actually do before downloading anything. For agents rather than models, see the companion guide on [AI Agents](agents.md).
