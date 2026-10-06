---
last_reviewed: 2026-09-29
author: Tarron Kayalackakom
---

# My Favorite Game Was Not a Game

<span class="meta-chip">For anyone evaluating an AI-built system</span><span class="meta-chip">About 18 minutes</span> <span class="meta-note">By [Tarron Kayalackakom](../about.md#the-maintainer). A worked example from outside medicine, kept here because the measurement problems are the same ones clinical data poses.</span>

The fourth-favorite game of my life, according to software I had commissioned and paid for and was rather proud of, was a frame rate counter.

Its name is fpsVR. It is a small utility that floats your graphics performance in the corner of your vision while you are wearing a virtual reality headset, and it had scored 94 out of 100, placing it above things I have genuinely loved. Two rows below sat Mirror's Edge, at 30. I have never started Mirror's Edge. It came in a bundle.

Nothing had crashed. No test had failed. The system was working exactly as designed, and what it was telling me was that I love a frame rate counter, because the way you use a frame rate counter is to leave it running.

That single screen is the most useful thing that happened in this project, and everything below is really a longer version of it.

## What I Built, and What I Did Not Do

In August 2026 I built a media tracker for my family. It follows films, television, games and books across six people in two countries, tells you the day the thing you are waiting for actually arrives, and answers the question that ruins more evenings than any other: what should we watch tonight, for whoever happens to be in the room.

It has been in real use since August. It costs about seven and a half dollars a month to run, five for the hosting plan and about two and a half for the AI, plus about six cents each time it thinks hard about a recommendation.

<figure class="figure">
<img src="../../assets/worked-examples/tracker-pick.jpg" alt="A recommendation for the film Yojimbo, marked Strong match 92, with a written explanation connecting it to films the reader already likes">
<figcaption>What comes out of it. Everything else in this article exists to decide which forty titles the model was allowed to choose from.</figcaption>
</figure>

I did not write any of it. Not a line. Across some sixteen hundred messages I never once cited a file path or a function name, and when the interface first showed me a diff I had to ask what I was looking at and whether I was supposed to do anything about it.

| Measure | Value |
|---|---|
| Commits in 47 days | 732, with a peak of 60 in a single day |
| Application code | About 64,600 lines: 52,500 of logic, 6,900 drawing the art, 5,100 of styling |
| Test code | About 51,000 lines, 117 suites, 8,378 individual checks |
| Design and rationale documents | About 7,900 lines, in 16 documents |
| Lines of code I wrote | Zero |

The row I want you to look at twice is not the last one. It is the pair in the middle. Counting only the logic, and leaving out the code that draws the pictures and styles the pages, the code checking this system is now within three percent of the size of the system itself, and it has been catching up the whole way: in late August it was less than half. That is not an accident of enthusiasm. It is the entire reason I am able to tell you anything about whether the thing works.

## The Failures That Do Not Announce Themselves

A crash is a gift. A crash is loud, somebody phones you about it within the hour, and you know precisely where to look.

What I was actually afraid of was the other kind. Software that keeps running and quietly gets worse. A search that silently ignores half your filters. A slider that appears to save your preference and does not. A cheerful empty state reading "No games yet" to a man who has just imported 2,103 games.

None of those ring any alarms. They just make the product a bit worse, forever, and everyone slowly stops using it without ever quite being able to say why.

So the whole test suite got organized around one question, which sits at the top of the project's design document and which I have since started applying to almost everything:

> If this broke silently, what would the family see, and how long before anyone said so?

If the honest answer is "nothing much, or something that looks like an ordinary mediocre recommendation", then the change does not ship until there is a test watching it. If the answer is "a blank screen, a crash, a missing notification that somebody will complain about at dinner", then the family is the test and we ship it without one.

Three habits fell out of taking that seriously, and they are the part I would press on anyone.

The first is that every test suite has to say, in plain English, what its failure means for a human being. When something goes red, the report says *deep search is quietly ignoring some of your filters*. It does not say *assertion failed at line 47*. I cannot act on the second sentence. Nobody outside a very small profession can.

<figure class="figure">
<img src="../../assets/worked-examples/tracker-refine.png" alt="A panel of filter controls: media type, review threshold, mood, genres to rule in or out, language, and time available">
<figcaption>Every one of these is a promise. Quietly disregard half of them and you still get a perfectly plausible film.</figcaption>
</figure>

The second is that a test which checks nothing counts as a failure. This sounds like pedantry until you meet one. A check whose search pattern matches zero lines will report a serene, confident pass while verifying absolutely nothing, forever. The runner now fails any suite that finishes without having actually asserted anything.

The third is the one I would tattoo on something. **Every test must be seen to fail.** Write it, then deliberately break the code underneath it, watch it go red, then put the code back. A test you have never seen fail is not a test. It is a claim about a test.

## Six Ways to Be Lied to by a Passing Check

That last habit earned its keep in a way I did not anticipate.

A lot of the checks work by reading the source code and asking structural questions. Does every address the web page tries to call actually exist on the server? Simple enough. Over the course of the project we found six separate ways that a check like that can pass triumphantly while the code underneath it is broken.

1. It matched the comment explaining the rule, rather than the code obeying it.
2. It looked slightly too far past its anchor and found what it wanted in the function underneath.
3. It proved a sentence exists somewhere in the file. Not that any human being ever sees it.
4. It carried an exemption for a special case that it had, at some point, quietly stopped being able to detect at all.
5. It anchored on a word that the surrounding documentation happens to repeat, so the documentation satisfied it.
6. It expected one style of invisible line ending in a file that had been checked out with the other, so the pattern could never match anything, ever, under any circumstances.

Every single one of those was found by deliberately breaking the code to see whether the test would notice. Not one was found by reading.

That is worth sitting with. In each case the test reads correctly. The code reads correctly. Only the relationship between them is wrong, and a relationship is not a thing you can see by looking at either end of it. Which is oddly liberating if, like me, you cannot read either end of it in the first place.

## The Thing That Was Measuring the Wrong Thing

Which brings us back to the frame rate counter.

Importing a games library hands you hours played, and hours played looks like an absolute gift to a system that needs to know what you enjoy. It was sold to me, cheerfully and correctly, as the solution to the cold start problem on the games shelf (a recommender knows nothing about your taste until you have rated things). It ran. It produced numbers. The numbers populated a profile and the profile fed recommendations and every part of that pipeline was working as specified.

Then I looked at it. Genuinely excellent games sat at 3. My inferred favorites were, in order, the games I had left running longest, which is a category that includes several I actively resent. And underneath the comedy sat something worse: a game I had never launched scored 30, and 30 is also precisely what the system writes when a person deliberately says *I disliked this*. My backlog, two hundred games of good intentions, was being read as two hundred active dislikes.

Playtime measures retention. It has almost nothing to do with affection. The two correlate just enough to look like a signal and not nearly enough to be one.

All 502 inferred ratings were deleted, which committed me to hand-rating a library of two thousand games, an act of penance I am still performing.

The same mistake kept arriving in different costumes. The timestamp on a rating measured when I had sat down to catch up on admin, not when I watched anything. A "novelty" axis asked a question about the rater and was quietly being averaged as though it were a property of the film. In every one of these the code was correct, the tests passed, and the number being reported was not the number anyone believed it was.

None of these were bugs. That is the part I want to be clear about. Every one of them shipped as working, tested, entirely correct software.

## The Man Who Cannot Say No

The most interesting defect in the system turned out to be me.

| Instrument | Negative responses (as of early September 2026) |
|---|---|
| 935 ratings | Exactly one below the dislike threshold |
| 575 answers to "want more like this?" | Zero |
| 2,819 followed titles | 17 ever abandoned |

Three completely independent instruments. Three near-zero counts. When your measuring equipment disagrees with reality this consistently, the equipment is usually broken. Here it was fine. It was faithfully recording a man who does not say no.

I worked out why eventually, and it is not flattering. I avoid saying no because it feels like criticism, and some part of me does not want the model to hold it against me. I am aware of how that sounds. I said it out loud to the machine, in writing, and I am now repeating it on my employer's website, which tells you something about the standard of self-examination this project demanded.

A recommender cannot learn anything from an unbroken run of approval. Worse, "I liked it" and "send me more of that" turn out to be entirely different sentences: documentary is my highest-rated genre and sits in the bottom third of what I actually reach for on a given evening.

The fix was to stop asking for verdicts and start asking for choices. Show me two things, make me pick one. I always pick. And every pick quietly produces a loser without requiring anybody to condemn anything.

Two thousand sixty-one forced comparisons later, the bottom of my appetite list finally contained real negatives: things sitting at 70 to 75 in my ratings that I plainly never want to see again. The first honest bad news the system had ever held about me.

## Agreeing to Be Wrong in Advance

That instrument cost forty minutes of relentless tapping, and I want to describe the two things that make me believe it rather than merely enjoy it.

The first is that **the failure condition was written down before the data was collected.** If the tournament results simply mirrored the star ratings already on file, then the whole exercise had bought nothing, and the honest response was to throw the instrument away. The threshold was set in advance: a rank correlation above 0.70 against my existing ratings meant discard it.

It came in between 0.49 and 0.69 across the three shelves it was measured on (films and television together, games, and books). Under the line it had been given permission to fail at on all three, while predicting my actual appetite answers dramatically better than my ratings ever had. A test it was allowed to fail, and did not.

The second is that the same discipline caught the first version cheating.

Version one chose which pairs to show me by always choosing whichever pair covered the most new genres, which had the unadvertised effect of making rare, oddball titles the most attractive things in the library to put on screen. Which meant my "unpopular" results were partly just a census of my own shelves, wearing a preference's clothes and looking very convincing.

The tell was a correlation of +0.50 between how rare a title's genre was and how often it lost. Nothing on the screen looked wrong. Nothing in the code was wrong. It was found only by checking the answers against the thing the chooser had been quietly optimizing for, which is a check you only think to run if you have already accepted that your instruments can flatter you.

And none of this was possible at first, because the application had cheerfully shown 118 recommendations while keeping no record whatsoever of which ones it had shown, in what order, or what anybody did next. There is no clever statistics that recovers from that. Somebody has to write down what was asked before anything can be learned from the answer.

<figure class="figure">
<img src="../../assets/worked-examples/tracker-feedback.jpg" alt="A card asking whether the reader watched any of five previously suggested titles, with Watched It, Not yet and No buttons beside each">
<figcaption>The least clever screen here, and the one everything else depends on. Note the third button, and the permission to skip.</figcaption>
</figure>

## What the Measurements Said When I Stopped Flattering Myself

An audit in September asked the rude question: is the personalization actually doing anything?

The answer is that most of the machinery changes about two of every ten recommendation cards. The language model's general knowledge is doing most of the work. At one point a deliberately scrambled version of my taste profile predicted my ratings better than the real one, which is the sort of result that makes you put your coffee down.

Elsewhere, a feature that blended the model's ranking with the statistical one looked good in offline testing, was built out completely, was raced against the existing approach on live data with the win condition agreed beforehand, and lost. It ships today, switched off, with the losing machinery and the race rig left in place, because a negative result you keep is worth more than one you quietly delete.

Twice I was convinced the AI prompt was bloated and expensive. Twice a fair race showed the cheaper version was worse. The only saving I ever actually found came from reading the bill instead of reasoning about it: a caching feature designed to make repeated questions cheap had spent 42 cents to save rather less than half a penny, because it turns out every night's question is about a different night.

## What the Benchmarks Could Not Tell Me

In the last week of September two claims arrived at once: a bigger model had come out, and the benchmarks said that letting a model think harder was the sweet spot. Both are claims about an average task. Mine is not an average task, and I had just spent a month learning what happens when I take a flattering number on trust.

So both were raced on the one instrument I do trust: 118 films and shows that had not been released yet, which I had rated "would I watch this?" before any model saw them. Every contender got the same forty titles per round, over ten rounds, and was scored on how many of its top five I had said yes to. The rule for switching was written down first: a gain counts only if chance cannot explain it.

| Model, effort | Top five I would watch | Price per pick | Output tokens | Against Sonnet 5.5, low (95% range) |
|---|---|---|---|---|
| Sonnet 5.5, low | 4.10 of 5 | 4.32¢ | 981 | Baseline |
| Sonnet 5.5, medium | 3.90 of 5 | 4.41¢ | 1,069 | −0.20 (−0.86 to +0.46) |
| Sonnet 5.5, high | 3.60 of 5 | 5.25¢ | 1,912 | −0.50 (−1.01 to +0.01) |
| Sonnet 5, low | 3.80 of 5 | 4.96¢ | 1,625 | −0.30 (−0.65 to +0.05) |
| Opus 5.5, low | 3.50 of 5 | 9.43¢ | 1,378 | −0.60 (−0.97 to −0.23) |
| Opus 5.5, high (estimate) | Not tested | About 12¢ (11 to 14¢) | About 2,700 | Not run |

All three models are Anthropic's Claude models. Prices are per pick, computed from the token counts returned with each call. The Sonnet 5 and Opus rows were run five days earlier, on the same titles with the same prompt code. Opus 5.5 at high effort was estimated rather than run, because high effort had not helped Sonnet. The whole effort race cost $1.88.

Thinking harder did not help. High effort never beat low effort in a single round, cost a fifth more, and took twice as long. The biggest model came last, at more than twice the price. The best line in the table, and the cheapest, was simply the newer version of the same mid-sized model, though its lead over the old one is small enough that chance could explain it.

The smaller finding mattered more to me than the table. Run twice on the same titles, the same model agrees on about four of its five picks. I had never measured that, and it means any gap of a few tenths is noise. Without that one number I would have read every difference in the table as a result.

## What I Never Handed Over

Nearly everything technical was delegated. The database, the deployment, the statistics, the tests, the styling, the choice of platform, the wording of every prompt.

What stayed with me was narrower than I expected and, it turns out, sufficient.

The boundary stayed with me. The system may track content from unofficial sources but must never scrape their catalogs or link to unlicensed streams. I set that in the first hour, by refusing my own euphemism and making myself say plainly what I meant, and it never moved afterwards.

Money stayed with me. Every ceiling, the per-person quota built twelve hours in before anybody else even had an account, and the shutdown procedure written on the day the storage was approved rather than on the day something went wrong.

Where a failure lands stayed with me. Asked once to raise an image size limit tenfold, I refused. The proposal worked perfectly. It also moved the failure from somewhere loud to somewhere silent, and I had already learned what that costs.

And what the family is asked to do stayed with me, mostly because I kept watching them not do it. My father, an engineer in his seventies, clicked straight through the onboarding without reading a word of it, then took an uncomfortably long time to find the button I was verbally telling him to press. I am also, obviously, the worst possible judge of whether any of it is intuitive, having helped build the thing.

Last, and least comfortably: the facts about myself that invalidate the data. That I only watch things I have already researched, so my ratings bunch up at the top of the scale. That I essentially never rewatch anything, which makes "would you watch it again" a useless question to ask me. No amount of analysis would have recovered either of those. They had to be confessed.

## The Pictures Were Written, Not Generated

The tracker's margins carry seven night scenes: a harbor, a city bridge, a snowbound cabin, rain over rooftops, a night train, an abstract field of starlight, and one that began as a study drawn for this very website, the view from Antigua's west coast toward Montserrat. None of them came out of an image generator. Every line is code an agent wrote, and the page draws the picture fresh for your screen, the hour, and tonight's actual moon.

<figure class="figure">
<img src="../../assets/worked-examples/tracker-scene-island.jpg" alt="A night seascape from a headland on Antigua's west coast, looking over a calm sea to the dark outlines of Montserrat, Redonda and Nevis, under a bright moon and stars.">
<figcaption>Not an image model: every line of this is code an agent wrote, drawn fresh for the viewer's screen, the hour, and tonight's real moon.</figcaption>
</figure>

That was not an aesthetic choice. A generated image is a claim you can only look at. Code can be checked: the big changes to the scenes were tested by drawing every scene before and after and comparing the results byte for byte, 3,408 drawings in one review. And one drawing serves every screen size, every hour and every phase of the moon, where a generated picture would need a new file for each. The Hub's [AI-Generated Images in Teaching](../playbooks/ai-images.md) playbook covers the same question for teaching figures.

## What Transfers

- Ask what a real person would actually see if this broke silently, and put your effort where the answer is "nothing at all".
- Write down the result that would make you abandon the idea, before you collect the data that might.
- When a measurement flatters you, go and look at what it is physically measuring. Hours played is not affection. A timestamp is not a memory.
- If somebody will not give you bad news, stop asking for verdicts and start asking for choices.
- Nothing can be evaluated until something writes down what was asked.

The binding constraint on quality was never the code. It was knowing what question the data was actually answering, and that judgment stayed with me the whole way through, because it was the one thing the machine could not supply for itself.

Every measurement error in this piece shipped as working, tested, correct-looking software. Not one of them was a bug. And in every single case, the person who eventually noticed could not read a line of the code doing it.
