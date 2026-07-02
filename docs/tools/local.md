# Running AI Models Locally

Every assistant in the [tools directory](index.md) runs in a vendor's cloud: what you type travels to their servers. There is another way. The [open-weights models](index.md#open-weights-models) at the bottom of the directory can be downloaded and run entirely on your own computer, where nothing you type leaves the machine. This page is a practical starting point.

**Why bother.** Three reasons people run models locally: privacy (your text never leaves your hardware), cost (the models and the tools below are free), and learning (nothing demystifies a language model like running one yourself). The honest trade-off: local models are smaller and noticeably less capable than frontier cloud models, and they run slower. For drafting an email that is fine; for hard reasoning you will notice the gap.

!!! warning "Local does not mean exempt"
    Running a model locally removes the vendor from the picture, but institutional rules still apply. The [AI Responsible Use Policy](../governance/policy.md) governs work with patient information and student records regardless of where the model runs.

## What you need

Memory is the main constraint. A model has to fit in your computer's memory (RAM), or better, in the video memory of a graphics card. Most local models are used in quantized form, meaning compressed versions that trade a small amount of quality for a much smaller size. Rough expectations:

- **A typical laptop (8 GB of memory)** runs small models, around 4 billion parameters and under. Fine for experimenting, summaries, and simple drafting.
- **16 GB of memory** comfortably runs mid-size models; OpenAI's gpt-oss-20b, for example, is designed to run in 16 GB.
- **32 GB or a recent gaming graphics card** opens up the 20 to 30 billion parameter class, where local models start feeling genuinely useful.
- Apple silicon Macs share memory between the processor and graphics, which makes them popular for local models; the same memory math applies.

For the full picture (what tokens per second feels like, why video memory beats system memory, quantization trade-offs, mixture-of-experts models, and an interactive estimator for your own machine), see [Hardware for Local AI](hardware.md).

## The simple path: a local chat assistant

1. **Install a runner.** [LM Studio](https://lmstudio.ai) is the easiest start: a desktop application where you browse models, click download, and chat, no command line involved. [Ollama](https://ollama.com) is the command-line equivalent, and pairs with [Open WebUI](https://openwebui.com) if you want a browser chat interface on top. All three are free and listed in the [directory](index.md).
2. **Pick a small model first.** Start with something in the 4 billion parameter class (a small Gemma or Qwen variant), confirm it runs smoothly, then work upward to the largest model your memory allows. The [open-weights section](index.md#open-weights-models) lists the major families; both runners show curated, ready-to-download versions of all of them.
3. **Calibrate expectations.** Replies stream more slowly than cloud assistants, knowledge cutoffs are real, and there is no web search unless you add one. Treat outputs with the same verification habits as any other model, per the [misconceptions page](../basics/misconceptions.md).

## Beyond chat: images, video, and voice

Text is the simple case. Open-weights models also exist for image generation, video generation, speech-to-text, and text-to-speech, and a different tool dominates that world: [ComfyUI](https://www.comfy.org), a free, open-source application where you assemble model pipelines visually by connecting nodes on a canvas. It is the standard way to run the Stable Diffusion family and newer open image and video models locally. The learning curve is steeper than a chat runner, and image and video models generally want more video memory than text models, but the community templates make the first steps manageable.

For voice, [Whisper](https://github.com/openai/whisper) (already in the directory) transcribes speech to text entirely on your machine, and open text-to-speech models are improving quickly.

## When your machine cannot keep up: renting a GPU

If a model you want will not fit in your hardware, you can rent the hardware instead: cloud providers such as Amazon Web Services (AWS) offer GPU instances by the hour, and GPU rental marketplaces like [RunPod](https://www.runpod.io) and [Vast.ai](https://vast.ai) make the same thing simpler and usually cheaper, with one-click templates for Ollama, Open WebUI, and ComfyUI. You get capability no laptop can match and pay only while the machine runs.

Be clear-eyed about what this trades away. The moment your model runs on rented hardware, your data leaves your machine, which was the headline reason to run locally in the first place. A rented GPU running an open-weights model is still more under your control than a consumer chatbot (you choose the model, nothing is retained to train on by default, and you can destroy the instance), but the [AI Responsible Use Policy](../governance/policy.md)'s data rules apply exactly as they do to any hosted tool: no patient information, student records, or confidential material. Add the practical frictions (per-hour billing that keeps running if you forget to shut down, and more setup than a desktop app) and the honest summary is: rent for capability and experiments, run truly locally for privacy, and use approved cloud tools for everyday work.

## Watch: setting it up

Verified walkthroughs for the tools on this page. Links reviewed June 2026; check a video's date against the tool's current version.

<!-- render:guide-videos:local -->

Beyond these, several channels followed by our [Videos page](../news/videos.md) regularly test new open-weights releases on consumer hardware, which is the fastest way to see what a model of a given size can actually do before downloading anything. For agents rather than models, see the companion guide on [AI Agents](agents.md).
