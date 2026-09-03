---
last_reviewed: 2026-09-03
---

# I fixed software I cannot read

<span class="meta-chip">For anyone thinking of contributing to open source</span><span class="meta-chip">About 9 minutes</span> <span class="meta-note">A worked example, in someone else's codebase, with an ending I did not control.</span>

ShareX is a screenshot tool that several million people use. On a monitor capable of high dynamic range, which is now most decent monitors, it produced washed out and slightly grey screenshots, and the accepted workaround was to turn HDR off before every single capture and turn it back on afterwards.

Somebody opened an issue about this in January 2023. By the summer of 2026 it had accumulated 280 comments, most of them variations on "please".

Two people had published forks that fixed it. I used one of them happily for months, until it drifted far enough behind the official version that I started getting update prompts I could not silence, which is the sort of small daily irritation that eventually makes a person do something unreasonable.

So in July 2026 I forked the official version myself and built an HDR capture path into it, in a programming language I do not write, against Windows graphics interfaces I had never previously heard of.

This is an account of what that involved, and rather more usefully, of what it involved refusing.

## The reading came first

The first commit in my fork contains no code at all. It is a document, and its opening line describes itself as an "archaeology record completed before implementation".

I did not write that document either, of course. But I asked for it, and I read it, and I would not have let the work start without it.

It pins the exact commit of the official project the work began from, with its date and its subject line, so that any later problem could be traced to a known starting point rather than argued about. It records that the other existing fork was examined as a read-only reference, and precisely how much of it: twelve commits, sixty-seven changed files, five and a half thousand inserted lines. It records a build of the completely untouched official code, before anything was modified, down to the toolchain version and the ninety-eight seconds it took, so that if my changes broke the build I could not blame the ground I was standing on.

And then it lists the things the project was not allowed to do:

- Keep the official behaviour as the baseline, and keep the existing capture path as the default.
- If the new path fails, fall back to the old one once, and log it.
- Do not merge, rebase, or mass cherry-pick from the other fork.
- Do not copy the other fork's branding, updater, or installer.
- Do not route screen recording or scrolling capture through the new path until those have their own correctness design.
- Build and validate after every stage.

I want to be precise about why that list exists, because it is the whole method. I could not review the code being written for me in any way that would have caught a real defect. I do not know C# well enough to spot a subtle error in a shader, and I certainly cannot eyeball a pixel format conversion and tell you it is wrong.

What I could do was decide the boundaries in advance, in language I understood perfectly well, and then hold them when it became inconvenient. Scope, defaults, fallbacks, and what happens on failure are all decidable without reading a line of anything.

## What it does

Thirty-six commits over eight days. Display discovery for HDR-capable monitors, a capture path through the Windows desktop duplication interface, tone-mapping shaders, and three files out of one capture: an ordinary image for normal use, a lossless file preserving the full high dynamic range data, and a modern format that displays correctly on both HDR and ordinary screens.

It works. I have been using it since July.

## The part I am actually proud of

The last third of the project is not features at all.

It is a run of commits auditing the licence of every bundled dependency, restoring a third party's copyright notice that had been trimmed at some point, removing a proprietary component that had no business being redistributed, and labelling the build unmistakably as unofficial so that nobody could mistake it for the real thing.

And one decision that matters more than the rest of them combined. **I disabled the update mechanism in my fork.**

Left alone, my build would have carried on quietly checking the official project's update channel. Which would have meant my users getting update prompts driven by somebody else's release schedule, and my fork riding for free on infrastructure maintained by people who had not agreed to carry it, and support questions eventually landing in their issue tracker rather than mine.

Switching it off cost me a feature and cost my users convenience. It was still obviously the right call, because every alternative imposed on a project that had never agreed to any of this.

Nobody asked me to do that. It is the part of the work I am most confident about, and it required no technical skill whatsoever, which I suspect is not a coincidence.

## What I could not test

The plan document ends with a validation note that I have come to think of as the most honest thing in the repository.

Display discovery worked. The shaders compiled. The settings, the routing and the fallback all worked, and the whole solution built clean. But the machine session available at the time returned an access denied error from the screen duplication interface before a single frame could be captured, which meant the end-to-end path, actual HDR pixels going through the actual tone mapper, was never confirmed in that environment.

I published it anyway, with that limitation written into the documentation rather than quietly omitted, and posted it publicly with the same caveat plus the two monitors I had genuinely tested on and their peak brightness.

The comment I left on that thread opened with four words:

> I'm not a programmer!

That was not modesty and it was not charm. It was the single most useful piece of information I could give somebody deciding whether to run an unsigned screenshot utility written by a stranger on the internet.

## What happened eight days later

The maintainer of the official project shipped HDR tone mapping into ShareX itself.

His note read:

> I used AI to implement this feature because I do not have the necessary experience with HDR tone mapping. That is also why it took a long time to get this added.

I have to be careful here, because there is a flattering story available and I cannot support it.

Another fork had existed for over a year and has 114 stars against my zero. A third contributor had been working on the problem for months and discussing it openly in that same thread. Years of pressure had piled up on an issue with 280 comments and no shortage of people asking. The maintainer never referenced my fork, I have no evidence of influence, and I am not claiming any. The people who built the earlier implementations are actual programmers, and if credit is owed anywhere it is owed to them.

What I can say is simply what is on the public record: the thing I wanted got built, by somebody competent, into the software everybody actually uses, and my fork is now unnecessary. Which is precisely the outcome I would have chosen if anybody had asked me.

The genuinely interesting part is what happened either side of it. Two people, neither with any expertise in this specific domain, both reached for AI to solve the same problem within a fortnight of each other, and both volunteered that they had done so without anybody asking.

The receptions differed rather sharply. My post drew polite curiosity. His drew a long and increasingly heated argument about whether AI-written code belongs in open source at all, conducted by people with strong opinions and no prospect of agreement.

I do not think my experience settles that argument, and I would be suspicious of anyone who claimed theirs did. But the norm both of us reached for independently, which is to say that you used it and say what you have not verified, seems close to the minimum. It cost neither of us anything, and it is the only reason either claim can be assessed at all.

## What transfers

- Do the archaeology before the implementation and write it down. Pin the exact starting point, so that later failures have somewhere to be attributed other than an argument.
- Write your list of refusals while you still have no emotional investment in the feature. It is a completely different document if you write it afterwards.
- When you cannot review the code, review the boundaries instead. Scope, defaults, fallbacks and failure behaviour are all decidable without reading anything.
- Publish what you could not test, in the same place you publish the thing itself.
- If you fork somebody's project, take care not to spend their resources or their reputation. Turning off my own updater was the clearest decision in the entire project, and the only one that cost me something.
