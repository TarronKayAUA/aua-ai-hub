---
last_reviewed: 2026-09-03
---

# The Neanderthal gene that explained nothing

<span class="meta-chip">For faculty and students</span><span class="meta-chip">About 11 minutes</span> <span class="meta-note">A worked example. Not medical advice, and not a clinical service.</span>

In August a paper landed that was, for me personally, almost too convenient to be believed.

Two changes in the growth hormone receptor gene, inherited from Neanderthals some forty-seven thousand years ago, turn out to be common in South Asian populations and vanishingly rare in European ones. Carrying them is associated with more lean muscle. The finding was published in *Current Biology* by a team including Svante Pääbo, and it went around the world in a week ([Kanis et al., 2026](https://doi.org/10.1016/j.cub.2026.07.025)).

I am South Asian. I have been visibly muscular my entire adult life without ever training for it, to the point that I was used as an anatomical model for neck musculature in medical school. And I have had my own raw genotype file sitting in a folder since 2022, downloaded from a consumer testing service and never seriously looked at.

So the question assembled itself in about four seconds, and so did the mistake.

## Why the answer was going to be no before I looked

Here is the trap, and it is worth naming before any results, because naming it afterwards would be too late to be honest.

<figure class="figure">
<svg viewBox="0 0 660 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bar chart comparing the frequency of the archaic growth hormone receptor variant, about 24 percent in South Asian populations against about 0.5 percent in European populations">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">why the paper made the news</text>
<text x="150" y="46" text-anchor="end" font-size="11" fill="var(--md-typeset-color)">South Asian populations</text>
<rect x="160" y="34" width="384" height="18" rx="3" fill="var(--md-primary-fg-color)"/>
<text x="554" y="48" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">up to 24%</text>
<text x="150" y="80" text-anchor="end" font-size="11" fill="var(--md-typeset-color)">European populations</text>
<rect x="160" y="68" width="8" height="18" rx="3" fill="var(--md-default-fg-color--light)"/>
<text x="178" y="82" font-size="11" fill="var(--md-typeset-color)">about 0.5%</text>
<text x="330" y="112" text-anchor="middle" font-size="10" font-style="italic" fill="var(--md-default-fg-color--light)">a large difference in how common the variant is, which says nothing yet about what it does to any one person</text>
</svg>
<figcaption>Frequency gaps are what make a variant newsworthy. They are not what make it meaningful for a person.</figcaption>
</figure>

A genome-wide association study establishes that a statistical relationship exists across a population. It does not, and cannot, establish that the relationship explains anything about the particular human being reading the headline. Those are different claims that happen to sound identical when you are the human being in question and the finding flatters you.

Everything that follows is an attempt to hold that line against a story I badly wanted to be true.

## The file, and what I did with it

The raw download from a consumer genetics service is far less intimidating than its reputation. It is a text file of about sixteen megabytes, one variant per line, four columns:

```
# rsid      chromosome  position   genotype
rs4477212   1           82154      AA
rs3094315   1           752566     AG
rs3131972   1           752721     GG
rs12124819  1           776546     AG
```

Six hundred thousand rows or so. Completely unmanageable for a person scrolling, and utterly trivial for a targeted lookup, which is the entire reason a project like this is possible at all for someone who is not a geneticist.

I built a panel of around 250 variants and ran it in two directions. Backward from traits I already knew I had, looking for the genetics underneath them. And forward from the genotype, for things that would never announce themselves in a mirror. Of the sixty-one variants that made the final report, fifty-five were recoverable from my chip. The other six simply were not on it, and are reported as absent rather than quietly guessed at.

## The rules I wrote before I was allowed to look

This is the part I would keep if I could keep only one, and every rule was fixed before a single lookup ran.

**The deflating fact went first.** Before searching for anything, I established the finding that argues against the whole enterprise: archaic ancestry is *depleted* for the heritability of body composition traits, not enriched. Two independent analyses agree. Putting that on the table first meant any positive result had to survive a prior pointing firmly the other way. It is remarkably hard to do this afterwards, and remarkably easy to skip.

**Every claim got a grade.** Statistical significance is necessary and nowhere near sufficient, so each line in the report carried one of four tiers:

| Tier | What it means | Examples |
|---|---|---|
| A | Deterministic or guideline-grade. True of this body. | Mendelian genotypes, pharmacogenomics with clinical guidelines |
| B | Robust and material. Replicated across ancestries, effect large enough to notice. | Alcohol metabolism, lactase persistence |
| C | Real but individually near-meaningless. Effect sizes stated in embarrassing plainness. | Most cognition and personality single variants |
| D | Folklore, labelled as such. | The "warrior gene" and its relatives |

Tier C is the one doing the work, and it is the tier most consumer genetics quietly omits. A finding can be entirely real, replicated, statistically unimpeachable, and still tell you absolutely nothing useful about yourself. Giving that its own category, instead of letting it sit next to Tier A looking equally important, is most of the discipline right there.

**Unconfirmed stays unconfirmed.** Rare pathogenic-looking calls in consumer array data are wrong roughly forty percent of the time, because the probes misbehave precisely where variants are rare. So the standing rule was that any alarming rare result gets flagged as a probable artifact until clinically retested, and never reported as a finding. If you take one thing from this article into your own life, take that one.

**And some things were refused outright.** I wanted to look at cognitive and behavioural traits, because of course I did. Those live in thousands of tiny-effect variants and can only be read through a polygenic score, and published scores are trained overwhelmingly on European-ancestry cohorts with well-documented miscalibration when applied to a South Asian genome. The answer I got, which I kept because it was better than the question:

> A number I could technically compute for you would be pseudo-quantitative garbage, and those websites you used years ago handed people exactly that. I won't.

That refusal was settled before the analysis began, not negotiated in the moment when a tempting number was already on the table. Refusals decided in advance are the only kind that hold.

## Why the file never left my machine

Years ago I uploaded this same data to third-party interpretation sites, stripping the identifying headers off first, feeling rather clever about it.

That instinct was right and it could not possibly have worked. Genotype data *is* the identifier. There is no header you can remove that de-identifies half a million of your own variants, because the variants are the thing that identifies you. I had performed a ritual, not a precaution.

Parsing locally removes the problem rather than managing it. The file sits in a folder, specific lines get read, nothing is transmitted anywhere. If you are weighing whether to upload your own data somewhere, that is the whole lesson and you can stop reading here.

## What was actually in there

The paper's own tag variant was not on my chip. The other archaic change on the same inherited segment was, and I carry one copy of it. Because the two travel together on the introgressed haplotype, one copy of the second is a strong indicator that I carry one copy of the whole thing. Confirming it properly would require sequencing rather than an array.

So: probably a carrier. Which felt, briefly, wonderful.

Then the arithmetic.

<figure class="figure">
<svg viewBox="0 0 660 175" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scale comparison showing that one copy of the variant contributes about 285 grams and two copies about 570 grams, against a personal difference from population average measured in several kilograms">
<text x="330" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--md-typeset-color)">the variant, drawn to scale against the thing it was supposed to explain</text>
<line x1="60" y1="118" x2="620" y2="118" stroke="var(--md-default-fg-color--light)" stroke-width="1.5"/>
<text x="60" y="136" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)">0 kg</text>
<line x1="153" y1="114" x2="153" y2="122" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="153" y="136" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)">1 kg</text>
<line x1="340" y1="114" x2="340" y2="122" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="340" y="136" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)">3 kg</text>
<line x1="527" y1="114" x2="527" y2="122" stroke="var(--md-default-fg-color--light)" stroke-width="1"/>
<text x="527" y="136" text-anchor="middle" font-size="10" fill="var(--md-default-fg-color--light)">5 kg</text>
<rect x="60" y="96" width="27" height="18" fill="var(--md-primary-fg-color)"/>
<line x1="73" y1="96" x2="73" y2="62" stroke="var(--md-primary-fg-color)" stroke-width="1"/>
<text x="80" y="58" font-size="11" font-weight="bold" fill="var(--md-typeset-color)">one copy: 285 g</text>
<text x="80" y="72" font-size="10" fill="var(--md-default-fg-color--light)">what I actually carry</text>
<rect x="60" y="96" width="53" height="18" fill="none" stroke="var(--md-primary-fg-color)" stroke-width="1.5" stroke-dasharray="3,2"/>
<text x="122" y="110" font-size="10" fill="var(--md-default-fg-color--light)">two copies: 570 g</text>
<path d="M60,150 L60,158 L560,158 L560,150" fill="none" stroke="#c62828" stroke-width="1.5"/>
<text x="310" y="172" text-anchor="middle" font-size="10.5" fill="#c62828">the difference from population average this was invoked to explain: several kilograms</text>
</svg>
<figcaption>285 grams per allele copy, against a difference measured in kilograms. Drawn to scale, which is the entire point.</figcaption>
</figure>

Two hundred and eighty-five grams. Per copy. That is the effect, drawn from over 1.1 million people, and it is a real and replicated finding.

It is also about the weight of a large apple, set against a physique that differs from the population mean by several kilograms. My one copy accounts for single-digit percent of the thing I was trying to explain. The variant is very probably in my genome and it is very nearly irrelevant to the question I asked it.

The same pattern holds for the other trait it touches, incidentally. It associates with roughly three millimetres of additional height per copy. The palaeoanthropologist John Hawks made exactly this point in his commentary on the paper: three millimetres is not much for one person, and folk reasoning about archaic ancestry is a poor way to explain individual traits.

## The correction, which was the most useful thing that happened

Somewhere in the middle of all this, discussing an association between this variant and jaw morphology reported in earlier work, the assistant framed things in a way that implied Neanderthal ancestry meant a more retruded jaw.

I pushed back, because that is backwards. Neanderthal mandibles were large, robust, and positioned further forward than ours. What they lacked was a bony chin, which is a modern human novelty, and the popular imagination confuses the chin with the jaw entirely.

It conceded immediately, which is not the interesting part. The interesting part is what the correction then dragged into the light.

The variant's association in living people runs in the *opposite* direction from actual archaic anatomy. Which is only a paradox if you have been quietly assuming that an inherited archaic allele reproduces the archaic phenotype. It does not. An allele operating on a modern human developmental background produces modern human variation, full stop.

That assumption had been sitting underneath the entire line of reasoning, unstated, doing damage. Challenging one anatomical detail did not merely fix a fact. It exposed a category error that would have propagated through everything downstream, unnoticed, for as long as I cared to keep asking questions.

And I could only catch it because mandibular anatomy happens to be inside my training. One step outside that, and I would have nodded along.

## What transfers

- Put the deflating context on the table before you search, not after you find something. Afterwards is too late to be honest with yourself.
- Grade every claim, and make sure your weakest grade says out loud that the finding is individually meaningless. Most consumer genetics omits that tier entirely, which is precisely how it sells.
- Decide what you will refuse to compute before a tempting number exists.
- Genotype data cannot be anonymised by deleting a header. Parse it where it sits.
- Press hard on something inside your own expertise. It is the only place you can referee, and what you learn there tells you how much to trust everything else.

## Why only one result appears here

The analysis returned around sixty results, including pharmacogenomic findings and disease risk loci. Those are my medical record and they stay private.

The single variant discussed here is ancestry-informative rather than disease-predictive, roughly a quarter of South Asians carry it, and nothing adverse can be inferred from it by an insurer, an employer, or anybody else. A genome is also partly information about relatives who consented to none of this, which is the other reason the published slice is one common variant rather than a panel.

Deciding which single result was safe to publish took considerably longer than running the analysis did.

## What this does not show

One person, one array, no clinical outcome, nothing measured downstream. The variant call is indirect, inferred from a linked marker rather than the one the paper itself used, and unconfirmed by sequencing. This was a physician poking at his own data out of curiosity on a weekend. It is not a service, not a study, and not advice.
