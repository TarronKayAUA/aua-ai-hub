---
last_reviewed: 2026-09-03
---

# Building a recommender I could not read

<span class="meta-chip">For anyone evaluating an AI-built system</span><span class="meta-chip">About 10 minutes</span> <span class="meta-note">A worked example from outside medicine, kept here because the measurement problems are the same ones clinical data poses.</span>

Over three weeks in August 2026 I built a media tracker and recommender for my family: it follows films, television, games and books, tells you the day something you are waiting for arrives, and answers "what should we watch tonight" for whoever is actually in the room. It has been in real use since August.

I wrote none of it.

| | |
|---|---|
| Commits in 21 days | 509, peak of 60 in one day |
| Application code | About 31,000 lines |
| Test code | About 31,100 lines, 61 suites, 4,795 checks |
| Design and rationale document | 2,849 lines |
| Running cost | About $5 a month, roughly 3 cents per recommendation |
| Lines of code I wrote | Zero |

The two middle rows are the point. There is slightly more code verifying the application than there is application, and that inversion is what made the rest possible. It is also the only reason I have any business describing the system at all.

## The failure mode that matters is not a crash

A crash is loud. Somebody phones about it. The dangerous failure in a system like this is software that keeps running and quietly gets worse: a search that ignores half your filters, a slider that saves nothing, a button reading "No games yet" to a man with 2,103 games imported.

So the whole test suite is organized around one question, written at the top of the design document:

> If this broke silently, what would the family see, and how long before anyone said so?

If the honest answer is "nothing, or something that looks like an ordinary mediocre recommendation", the change does not ship without a test. If the answer is "a crash, a blank screen, a missing notification someone will mention", it ships without one.

Three consequences followed, and they are the transferable part:

- **Every suite says in plain English what its failure means for the family.** A red result reads "deep search quietly ignores some of your filters", not "assertion failed at line 47". The second sentence is useless to me. The first is the only one I can act on.
- **A test that checks nothing counts as a failure.** A check whose pattern matched zero lines reports success while verifying nothing, so the runner fails any suite with zero assertions.
- **Every test must be seen to fail.** Write it, deliberately break the code, watch it go red, put the code back. An unfalsified test is an unverified claim.

## Six ways a test can pass against broken code

Many of the checks work by reading the source: is every route the page calls one the server actually implements? This project found six distinct ways such a check can pass while the code underneath is broken.

1. It matched the comment explaining the rule instead of the code obeying it.
2. It looked past its anchor and found what it wanted in the function underneath.
3. It proved a sentence exists in the file, never that anyone ever sees it.
4. It carried an exemption for a case it had already stopped being able to detect.
5. It anchored on a name the surrounding prose repeats, so the documentation satisfied it.
6. It expected one style of line ending in a file checked out with the other, so the pattern could never match anything.

Every one was found by deliberately breaking the code to see whether the test noticed. None was found by reading. In each case the test reads correctly and the code reads correctly, and only the relationship between them is wrong. That is precisely the class of defect a person who cannot read the code has no other way to catch.

## What the data was actually answering

The hardest problems were never bugs. They were pieces of software measuring the wrong thing and reporting it confidently.

The clearest example cost me a fortnight of tedium. Importing a game library gives you hours played, which looks like a gift for a system that needs to know what you like. It was sold to me as the games shelf's cold start solution, and it worked, in the sense that it ran correctly and produced numbers.

Then I looked at the numbers. Some genuinely excellent games sat at 3.0. The top of my inferred taste profile was the games I had left running the longest, and in fourth place was not a game at all but a virtual reality overlay utility, scoring 94 for having been open in the background. A game I had never started scored 30, which is also exactly what a deliberate "I disliked this" writes, so a backlog of unplayed games read as a couple of hundred active dislikes.

Playtime measures retention. It does not measure affection. All 502 inferred ratings were deleted, which committed me to hand-rating a two thousand game library.

The same error recurred in other clothes. The time I recorded a rating measured when I sat down to catch up, not when I watched. A novelty axis asked a question about the rater and was being averaged as though it were about the work. In every case the code was correct, the tests passed, and the thing being measured was not the thing being reported.

## The person who could not say no

The most interesting problem in the project turned out to be me.

| Instrument | Negative responses |
|---|---|
| 935 ratings | Exactly 1 below the dislike threshold |
| 575 answers to "want more like this?" | Zero |
| 2,819 followed titles | 17 ever abandoned |

Three independent instruments, three near-zero negative counts. That is not an instrument fault, it is how I answer. I eventually worked out why, and it is not flattering: I avoid saying no because it feels like criticism the model will hold against me.

A recommender cannot learn taste from an unbroken run of approval. So the fix was to stop asking for verdicts and start asking for choices. Shown two titles and told to pick one, I always pick, and **every pick silently produces a loser without anyone having to condemn anything.** About 2,061 forced comparisons later, the bottom of my appetite list finally held real negatives: things I had rated 70 to 75 and genuinely wanted no more of.

Two disciplines make that credible rather than merely satisfying.

**The failure condition was agreed before the data was collected.** If the tournament results simply mirrored the star ratings already on file, then forty minutes of tapping had bought nothing and the instrument should be thrown away. The threshold was written down in advance: a rank correlation above 0.70 meant discard it. Measured, it came in at 0.49 to 0.68, and it predicted my actual appetite answers far better than the rating column did. It passed a test it had been allowed to fail.

**That same discipline caught the first version cheating.** Version one chose which titles to compare by maximizing genre coverage, which quietly made rare, oddball titles the most attractive things in the library, so "unpopular" results were partly a census of my own shelves wearing a preference's clothes. The tell was a correlation of +0.50 between how rare a title's genre was and how often it lost. Nothing on screen looked wrong. It was found only by checking the answers against the thing the chooser had been optimizing for.

None of that was possible for the first several months, because the app had shown 118 recommendations and kept no record of which ones it showed, in what order, or what anyone did next. No amount of clever statistics helps until something writes down what was asked.

## What the measurements said that I did not want to hear

An audit in September asked whether the recommender was doing what it claimed. The honest finding is that most of the personalisation machinery is worth about two cards in ten, because the language model's general knowledge does most of the work. At one point a deliberately scrambled version of my taste profile predicted my ratings better than the real one.

Separately, a feature that blended the model's ranking with the statistical one looked good in offline tests, was built completely, was raced against the existing approach on live data with the win condition written down beforehand, and lost. It ships switched off, with the losing machinery and the test rig left in place.

Twice I suspected the AI prompt was too long and expensive. Twice a fair comparison showed the cheaper version was worse. The one saving actually found came from reading the bill rather than reasoning about it: a caching feature meant to make repeat questions cheap had cost 42 cents to save less than half a penny, because every night's question is about a different night.

## What I never delegated

Nearly everything technical was delegated: the database, the deployment, the statistics, the tests, the styling, the platform choice, the wording of every prompt. Across roughly 1,600 messages I never once cited a file path or a line number.

What stayed with me was narrower and, it turns out, sufficient:

- **The boundary.** The system may track content from unofficial sources but must never scrape their catalogues or link to unlicensed streams. I set that in the first hour by refusing my own euphemism, and it never moved.
- **Money.** Every spending ceiling, the per-user quota built twelve hours in before anyone else had an account, and the shutdown procedure written when the storage was approved rather than after an alarm.
- **Where a failure lands.** Asked to raise an image size limit tenfold, I refused, because the proposal worked but moved the failure somewhere silent.
- **What the family is asked to do.** Every major usability change traces to watching a specific relative fail to do something. My father clicked straight through the onboarding without reading it. I am also disqualified as a judge of this, because I helped build it, so it is obviously more intuitive to me.
- **Facts about myself that invalidate the data.** That I only watch things I have already researched, so my ratings are compressed into the top of the scale. That I never rewatch anything. No analysis could have recovered those, and each one changed a mechanism.

## What transfers

- Ask what the family, or the patient, or the student would actually see if this broke silently. Test the things where the answer is "nothing".
- Write the failure condition before you collect the data, and be willing to throw the instrument away.
- When a measurement flatters you, check what it is measuring. Playtime is not affection, and time of rating is not time of watching.
- If a person will not give you negative signal, stop asking for verdicts and ask for choices instead.
- Nothing can be evaluated until something logs what was asked and what happened next.

The binding constraint on quality was never the code. It was knowing what question the data was actually answering, and that judgment stayed with me throughout, because it was the one thing the machine could not supply for itself. Every error above shipped as working, tested, correct-looking software. None of them was a bug. And in each case the person who caught it could not read a line of the code doing it.
