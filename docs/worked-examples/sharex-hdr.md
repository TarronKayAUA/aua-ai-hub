---
last_reviewed: 2026-09-03
---

# Forking a program I could not have written

<span class="meta-chip">For anyone thinking of contributing to open source</span><span class="meta-chip">About 7 minutes</span> <span class="meta-note">A worked example, in someone else's codebase, with an outcome I did not control.</span>

ShareX is a widely used Windows screenshot tool. On a high dynamic range (HDR) display it produced washed out screenshots, and the standard workaround was to toggle HDR off before every capture. A request to fix this had been open since January 2023 and had accumulated 280 comments.

Two people had published forks that addressed it. One of them was what I used, until it drifted far enough behind the official version that I started getting update prompts I could not silence.

So in July 2026 I forked the official version and built my own HDR capture path, in a language I do not write, against graphics interfaces I had never heard of. This is what that involved and, more importantly, what it did not.

## Doing the reading first

The first commit in the project is not code. It is a document titled a forward-port plan, whose opening line records that it is an "archaeology record completed before implementation".

It pins the exact upstream commit the work started from, along with its date and subject. It records that the other fork was examined as a read-only reference, and how much of it: 12 commits, 67 changed paths, 5,685 insertions. It records the baseline build of the untouched official code before anything was modified, down to the toolchain version and the elapsed time, so that any later build failure could be attributed to my changes rather than to the starting point.

Then it lists what the project may not do. That list is the part I would keep if I could keep only one thing:

- Keep the official behavior as the baseline, and keep the existing capture path as the default.
- If the new path fails, fall back to the old one once, and log it.
- Do not merge, rebase, or mass cherry-pick from the other fork.
- Do not copy the other fork's branding, updater, or installer.
- Do not route screen recording or scrolling capture through the new path until those have their own correctness design.
- Build and validate after every stage.

I could not review the code being written for me in any meaningful way. I do not know C# well enough to catch a subtle error in a shader or a pixel format conversion. What I could do was decide the boundaries in advance, in language I did understand, and hold them.

## What it does

Thirty-six commits over eight days: HDR display discovery, a capture path through the Windows desktop duplication interface, tone-mapping shaders, and three outputs from one capture. An ordinary image for normal use, a lossless file preserving the full HDR data, and a modern format that shows correctly on both HDR and non-HDR screens.

## Refusing things on someone else's behalf

The last third of the work is not features. It is a sequence of commits auditing the licenses of every bundled dependency, preserving a third party's copyright notice that had been trimmed, removing a proprietary component that should not have been redistributed, and labeling the build unmistakably as unofficial.

One of those decisions matters more than the rest. **I disabled the update mechanism in my fork.** Left alone, my build would have gone on checking the official project's update channel, which would have meant my users receiving prompts driven by someone else's release schedule, and my fork quietly riding on infrastructure I did not maintain. Switching it off cost me a feature and cost my users convenience. It was still obviously correct, because the alternative imposed on a project that had not agreed to any of this.

Nobody asked me to do any of that. It is the part of the work I am most confident about, and it is the part that required no technical skill at all.

## What I could not verify

The plan document ends with a validation note recording what was tested and what was not. Display discovery, shader compilation, the settings, the routing, and the fallback path all worked, and the solution built clean. But the machine session available at the time returned an access denied error from the screen duplication interface before a single frame could be captured, so the end-to-end path, the actual HDR pixels going through the actual tone mapper, could not be confirmed there.

I published it anyway, with that limitation written into the documentation, and posted it publicly with the same caveat plus the two displays I had actually tested on and their peak brightness.

The comment I left on the issue thread began: "I'm not a programmer!"

That was not modesty. It was the most useful thing I could tell people who were deciding whether to run an unsigned screenshot tool from a stranger.

## What happened next

Eight days after I posted, the maintainer of the official project shipped HDR tone mapping into ShareX itself, with this note:

> I used AI to implement this feature because I do not have the necessary experience with HDR tone mapping. That is also why it took a long time to get this added.

I want to be careful here, because the tempting story is not one I can support. Another fork had existed for over a year and has 114 stars against my zero. A third contributor had been working on the problem for months and discussing it in that thread. Years of pressure had accumulated on an issue with 280 comments. The maintainer never referenced my fork, and I have no evidence of influence and am not claiming any. The people who built the earlier implementations are actual programmers, and if anything the credit is theirs.

What I can say is what is on the public record: the thing I wanted got built, by someone competent, into the software everyone actually uses, and I no longer need my fork.

The genuinely interesting part is the coincidence of disclosure. Two people, neither with expertise in this specific domain, both reached for AI to solve the same problem within the same fortnight, and both said so plainly and without being asked. The reception differed. My post drew curiosity. The maintainer's drew a lengthy argument about whether AI-written code belongs in open source at all, conducted by people with strong views and no agreement.

That argument is not settled, and I do not think my experience settles it. But the norm both of us reached for independently, say that you used it and say what you did not verify, seems like the minimum, and it cost neither of us anything.

## What transfers

- Do the archaeology before the implementation, and write it down. Pin the exact starting point so later failures have somewhere to be attributed.
- Write the list of things you will not do while you still have no emotional investment in the feature.
- When you cannot review the code, review the boundaries instead. Scope, defaults, fallbacks, and what happens on failure are all decidable without reading a line.
- Publish what you could not test, in the same place you publish the thing itself.
- If you fork someone's project, take care not to spend their resources or their reputation. Turning off my updater was the single clearest decision in the project.
