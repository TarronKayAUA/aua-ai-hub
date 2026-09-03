---
last_reviewed: 2026-09-03
---


# Checking a headline against my own genome

<span class="meta-chip">For faculty and students</span><span class="meta-chip">About 7 minutes</span> <span class="meta-note">A worked example. Not medical advice, and not a clinical service.</span>

In August a paper reported that two changes in the growth hormone receptor gene, inherited from Neanderthals, are common in South Asian populations and rare in European ones, and that carrying them is associated with slightly more lean muscle mass ([Kanis et al., *Current Biology*, 2026](https://www.cell.com/current-biology/fulltext/S0960-9822(26)00890-0)). It was covered widely. I am South Asian. I have been visibly muscular my whole adult life without training for it, to the point that I was used as an anatomical model for neck musculature in medical school. And I have had my own raw genotype file sitting in a folder since 2022.

So the question assembled itself, and so did the mistake.

This is not a piece about a discovery. It is about declining an answer I wanted, and about the rules I set in advance to make declining it possible.

## The claim, and the error it invites

The frequency gap is what made the paper news.

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
<figcaption>Frequency differences between populations are what make a variant newsworthy. They are not what make it meaningful for an individual.</figcaption>
</figure>

The error personal genomics invites is to take a finding that holds across a population and read it as the explanation for one body. A genome-wide association study certifies that a statistical relationship exists in a group. It does not certify that the relationship means anything for the person reading it. Everything that follows is an attempt to hold that line against a story I found flattering.

## What I actually did

The raw file from a consumer testing service is less intimidating than it sounds. It is a tab-separated text file of about 16 megabytes, one variant per line:

```
# rsid      chromosome  position   genotype
rs4477212   1           82154      AA
rs3094315   1           752566     AG
rs3131972   1           752721     GG
rs12124819  1           776546     AG
```

Roughly 600,000 rows, which is unmanageable for a person scrolling and trivial for a targeted lookup. I built a panel of about 250 variants and ran it in two directions: backward from traits I already knew I had, and forward from the genotype for things that would never announce themselves. Of the final panel, 55 of 61 reported variants were recoverable from my chip. The other six were not on it, and are reported as absent rather than guessed at.

## The rules, set before I looked

This is the part worth stealing.

**The deflating context came first.** Before searching for anything, I established the background finding that argues against the whole enterprise: archaic ancestry is *depleted*, not enriched, for the heritability of body composition traits. Two independent analyses agree on this. Establishing that first meant that a positive result had to survive a prior that pointed the other way.

**Every claim got a grade.** Statistical significance is necessary and nowhere near sufficient, so each line in the report carried one of four tiers:

| Tier | What it means | Examples |
|---|---|---|
| A | Deterministic or guideline-grade. True of this body. | Mendelian genotypes, pharmacogenomics with clinical guidelines |
| B | Robust and material. Replicated across ancestries, effect large enough to notice. | Alcohol metabolism, lactase persistence |
| C | Real but individually near-meaningless. Reported with effect sizes stated in embarrassing plainness. | Most cognition and personality single variants |
| D | Folklore, labeled as such. | The "warrior gene" and similar |

Tier C is the one that does the work. A finding can be entirely real, replicated, statistically unimpeachable, and still tell you nothing useful about yourself. Giving that its own category, rather than letting it sit next to Tier A results looking equally important, is most of the discipline.

**Unconfirmed stays unconfirmed.** Rare pathogenic-looking calls in direct-to-consumer array data are wrong roughly 40 percent of the time, because the probes misbehave exactly where variants are rare. The standing rule was that any alarming rare result gets flagged as a probable array artifact until clinically retested, and never reported as a finding.

**Some things were refused outright.** I wanted to look at cognitive and behavioral traits. Those live in thousands of tiny-effect variants and can only be read through a polygenic score, and published scores are trained overwhelmingly on European-ancestry cohorts with documented miscalibration when applied to South Asian genomes. The assistant's answer, which I kept:

> A number I could technically compute for you would be pseudo-quantitative garbage, and those websites you used years ago handed people exactly that. I won't.

That refusal was agreed before the analysis began, not negotiated when a tempting number appeared.

## Why I parsed it on my own machine

Years ago I uploaded my data to third-party interpretation sites, stripping identifiers first. That instinct was right and it could not work. Genotype data *is* the identifier. There is no header you can remove that de-identifies half a million of your own variants.

Parsing locally removes the problem rather than managing it. The file stays in a folder, specific lines get read, nothing is transmitted anywhere. For anyone weighing whether to upload their own data somewhere, that is the whole lesson.

## What I found

The paper's own tag variant was not on my chip. The second archaic change on the same inherited segment was, and I carry one copy of it. Because the two travel together, one copy is a strong indicator that I carry one copy of the whole segment. Confirming it properly would need sequencing rather than an array.

So: probably a carrier. The question was whether that explained anything.

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
<figcaption>285 grams of additional body weight per allele copy, almost all of it lean mass, against a difference measured in kilograms. The variant contributes single digit percent of the thing I was trying to explain.</figcaption>
</figure>

The association is real, drawn from over 1.1 million people, and almost entirely irrelevant to me personally. My hypothesis was directionally reasonable and the variant is plausibly in my genome. It does not explain what I invoked it to explain.

The same pattern holds for the other trait the variant touches. It associates with about three millimeters of additional height per copy, which is a real finding and, for any individual, nothing at all. The paleoanthropologist John Hawks made exactly this point in his commentary on the paper: three millimeters of height is not much for one person, and folk reasoning about archaic ancestry is a poor way to explain individual traits.

## Where it went wrong

The most useful thing that happened was an error.

Discussing an association between this variant and jaw morphology reported in earlier work, the assistant framed things in a way implying that Neanderthal ancestry meant a more retrusive jaw. I pushed back from anatomy, because that is backward: Neanderthal mandibles were large, robust, and positioned further forward than ours. What they lacked was a bony chin, which is a modern human novelty, and the popular framing confuses the chin with the jaw.

It conceded immediately. What matters is what the correction then exposed. The variant's association in living people runs in the *opposite* direction from actual archaic anatomy, and that is only a paradox if you assume an inherited archaic allele reproduces the archaic phenotype. It does not. An allele operating on a modern developmental background produces modern human variation.

That assumption had been sitting underneath the reasoning, unstated. Challenging one anatomical detail did not just fix a fact; it surfaced a category error that would have propagated through everything downstream. I could only catch it because mandibular anatomy is inside my training. Outside it, I would have accepted the framing.

## What transfers

- State the deflating context before you search, not after you find something.
- Grade every claim, and make sure your weakest grade says out loud that the finding is individually near meaningless.
- Decide what you will refuse to compute before a tempting number is on the table.
- Parse identifying data locally. Genotype cannot be anonymized by removing a header.
- Press the model hard on something inside your own expertise. That is the only place you can referee, and what you learn there tells you how much to trust it everywhere else.

## Why only one result appears here

This analysis returned around sixty results, including pharmacogenomic findings and disease risk loci. Those are my medical record and they stay private. The single variant discussed here is ancestry-informative rather than disease-predictive, roughly a quarter of South Asians carry it, and it cannot be used to infer anything adverse about me. A genome is also partly information about relatives who did not consent to any of this, which is the other reason the published slice is one common variant rather than a panel.

Deciding which single result was safe to publish took longer than running the analysis.

## What this does not show

One person, one array, no clinical outcome, and nothing measured downstream. The variant call is indirect, inferred from a linked marker rather than the one the paper used, and unconfirmed by sequencing. This was a physician analyzing his own data out of curiosity. It is not a service, not a study, and not advice.
