# Art refinement pass: progress

Branch `art-refine`, started 2026-09-30. Delete this folder (`.claude/art-refine/`) before merging to main.

## How to resume

1. `git checkout art-refine` and read this file. Every ticked item is committed and verified; the working tree
   should be clean between pictures (if not, the last picture was interrupted: `git diff` shows it, finish or
   `git checkout -- .` it).
2. Full detail of every item (what, where, the code sketch, the critic's verdict) is in `items.json`: `ranked.items`
   (by rank) and `groups[].proposals` / `groups[].critique`. The owner's picking page and the renders were in the
   session scratchpad (`artpass/`), which may be gone; regenerate renders with scripts/art_review.py if needed.
3. Per picture: make its items, then `node --check`, strict build, NaN scan of the drawn attributes, before/after
   renders in the five versions (1920 and 1440), pixel identity of every other picture, commit, tick here.

## Owner's decisions (2026-09-30)

- #18 Curtain Bluff: he lives near Turtle Bay and sees the whole of Montserrat on clear days. If re-aiming the view
  to show Montserrat makes it better or more iconic, reframe; if not, change the caption to Nevis (his yes on the
  wording is still needed; data/art_slots.yaml is his). The Day version looks plain next to the others ("could use
  some additional pizzazz"); the reframe may be the answer, else propose other ideas.
- #49 and #79 (campus tower roof, flanking roofs): stage side by side for him to decide; he finds the tower a little
  flat next to the other buildings. Perspective changes must be checked for accuracy; texture changes are fine.
- #5 (yacht lights follow the heeled rig, green light removed): yes, an important accuracy change.
- Everything else: the implementer's judgement; "most if not all of them make sense". His rule: if a picture already
  looks good and is instantly identifiable, a change made only to match reality is not necessarily warranted;
  changes for accurate perspective, size and texture are generally fine and approved.
- He must be able to stop and resume cleanly (he leaves campus around 17:00 local on 2026-09-30).

## Items

### campus-hero

- [ ] #1 fix v4 `campus-hero-1`: Close the gap beside the portico where the sea shows through
- [ ] #2 fix v3 `campus-hero-2`: Campus shade is lighter than its walls at Dawn, Sunset and Dusk
- [ ] #19 add v4 `campus-hero-3`: The red pent roof across each inner block
- [ ] #20 fix v3 `campus-hero-4`: Drive lamps: heads by Day
- [ ] #21 fix v3 `campus-hero-8`: Inner blocks and outer wings overlap in a muddle
- [ ] #49 fix v3 `campus-hero-9`: The tower's roof: a low hipped roof with white cresting, not a tall pyramid (HOLD: owner decision, see above)
- [ ] #51 add v3 `campus-hero-6`: The white-trimmed gablet in the portico roof
- [ ] #79 fix v2 `campus-hero-7`: Hipped roofs split down the middle beside the now-uniform tower roof (HOLD: owner decision, see above)
- [ ] #95 add v2 `campus-hero-5`: A ledge and low balustrade at the foot of the lookout

### shirley-heights

- [ ] #17 fix v4 `shirley-heights-1`: Day blurs cut into boxes; flank shade spills off the land
- [ ] #36 fix v3 `shirley-heights-2`: A pale vertical curtain across the harbour mouth
- [ ] #56 add v3 `shirley-heights-6`: Surf on the reef at the harbour mouth
- [ ] #57 add v3 `shirley-heights-5`: Light columns under the dockyard's lamps and moored yachts
- [ ] #75 fix v2 `shirley-heights-7`: The lookout lantern's post is land-green by Day
- [ ] #92 add v2 `shirley-heights-3`: The lookout lantern: a pool of light, and last in the sequence
- [ ] #100 add v2 `shirley-heights-4`: Afterglow rim on the range's crest beside the Sun

### curtain-bluff

- [ ] #18 fix v4 `curtain-bluff-1`: The caption names Montserrat, but the island drawn is Nevis (HOLD: owner decision, see above)
- [ ] #39 fix v3 `curtain-bluff-2`: A Day yacht's sail hides Nevis
- [ ] #60 add v3 `curtain-bluff-4`: Water hatch dense at the horizon
- [ ] #101 add v2 `curtain-bluff-3`: Mist at the coast's foot, and optionally its reflection
- [ ] #102 add v2 `curtain-bluff-6`: Reflections under the Day yachts
- [ ] #113 add v2 `curtain-bluff-5`: Shore lights low along the near coast, with their columns

### sailing-week

- [ ] #5 fix v4 `sailing-week-1`: Masthead and bow lights do not follow the heeled rig
- [ ] #24 fix v3 `sailing-week-2`: Glitter under an empty western sky at Dawn
- [ ] #25 fix v3 `sailing-week-3`: Bow waves float free ahead of the bows
- [ ] #26 fix v3 `sailing-week-5`: The coast rim runs across the land and into the water
- [ ] #68 fix v2 `sailing-week-7`: Day houses stand on the pale far range
- [ ] #81 fix v2 `sailing-week-4`: The tipped hull lifts its stern out of the water
- [ ] #93 add v2 `sailing-week-6`: A boom under each mainsail

### lamp-steps

- [ ] #15 fix v4 `lamp-steps-1`: The far shore's lights are missing; only their columns are drawn
- [ ] #29 fix v3 `lamp-steps-8`: The yacht's masthead light sits exactly on the horizon
- [ ] #34 fix v3 `lamp-steps-2`: The turret's slit sits on the edge between its faces; its shade spills into the sky
- [ ] #69 fix v2 `lamp-steps-3`: The century plant is in front of the stairs but behind the lantern on them
- [ ] #70 fix v2 `lamp-steps-7`: The scrub beside the steps reads as pebbles; make it shrubs
- [ ] #76 fix v2 `lamp-steps-6`: The lookout's warm halo is on before its windows light
- [ ] #94 add v2 `lamp-steps-4`: The anchored yacht's reflection, and a furled mainsail on a boom
- [ ] #98 add v2 `lamp-steps-5`: Carry the stone courses up the turret and across the broken wall

### library

- [ ] #12 fix v4 `library-1`: The carrel row's nearest corner post and rails are see-through
- [ ] #61 add v3 `library-3`: Window reveals: the wall's thickness turning into each opening
- [ ] #64 fix v2 `library-2`: Tables stand on two legs: add the far legs
- [ ] #72 fix v2 `library-4`: The right-hand wall's window has no sill

### telescope

- [ ] #45 fix v3 `telescope-1`: Wall joints in uneven pairs, one row only, one spilling onto the guardhouse
- [ ] #59 add v3 `telescope-3`: Make the guardhouse read as stone: staggered joints and quoins
- [ ] #66 fix v2 `telescope-5`: The lens reads as a pale ball stuck on the end of the tube
- [ ] #86 add v2 `telescope-4`: A shadow under the guardhouse's eave
- [ ] #89 add v2 `telescope-6`: The lit doorway lays a pool of light on the ground

### tool-wall

- [ ] #13 fix v4 `tool-wall-1`: The middle boat hides behind the window's mullion
- [ ] #32 fix v3 `tool-wall-5`: The hammer on the bench: the outline's hammer, resting on its claw
- [ ] #44 fix v3 `tool-wall-3`: The transom bar crosses the top of the setting Sun
- [ ] #73 fix v2 `tool-wall-2`: The window's reveal is on the wrong jamb
- [ ] #78 fix v2 `tool-wall-7`: The vise reads as a small window
- [ ] #80 fix v2 `tool-wall-6`: The evening planet sits half under the window frame
- [ ] #107 add v2 `tool-wall-4`: A rack for the screwdrivers and chisels, a peg for the tape

### prompt-desk

- [ ] #14 fix v4 `prompt-desk-1`: The transom cuts the rising Sun in half at Dawn
- [ ] #43 fix v3 `prompt-desk-3`: The sailing boat's light has no column and the boat no reflection
- [ ] #63 fix v2 `prompt-desk-4`: The pen floats above the desk's back edge
- [ ] #74 fix v2 `prompt-desk-2`: The window's reveal is on the wrong jamb
- [ ] #84 add v2 `prompt-desk-5`: Coffee in the mug, and its shaded side, so it reads by Day
- [ ] #91 add v2 `prompt-desk-6`: The orb's glow laid on the desk beneath it

### bell-tower

- [ ] #16 fix v4 `bell-tower-2`: Quoins stick out of the tower as see-through blocks and are out of step
- [ ] #27 fix v3 `bell-tower-1`: Slivers of sea and sky show between the town's houses
- [ ] #35 fix v3 `bell-tower-3`: The shaft shows a side face the belfry and roof do not have
- [ ] #65 fix v2 `bell-tower-4`: The weather vane is drawn above the picture
- [ ] #67 fix v2 `bell-tower-6`: The notice board's little roof merges with the house roofs behind it
- [ ] #103 add v2 `bell-tower-5`: Give the sea its finish: horizon hatch and the headland's reflection
- [ ] #112 add v2 `bell-tower-7`: Pave the square in perspective, as the Way In picture does

### dish-net

- [ ] #46 fix v3 `dish-net-1`: The station's left end hangs over the falling slope
- [ ] #47 fix v3 `dish-net-7`: A concrete base course so the station stands off the hill after dark
- [ ] #58 add v3 `dish-net-2`: A halo round the station's lit windows, and a rim on its roof edge
- [ ] #104 add v2 `dish-net-6`: Give the bowl its roundness: a shaded band along its back
- [ ] #105 add v2 `dish-net-4`: A concrete plinth and contact shadow under the dish's pedestal
- [ ] #106 add v2 `dish-net-3`: A door in the station's empty right-hand bay

### lecture-hall

- [ ] #9 fix v4 `lecture-hall-1`: The third high window runs under the screen
- [ ] #22 fix v3 `lecture-hall-3`: Collarbones to join the skeleton's arms to its body
- [ ] #28 fix v3 `lecture-hall-2`: The front wall shows through the seats to the picture's foot
- [ ] #50 add v3 `lecture-hall-5`: The skeleton's shadow on the wall
- [ ] #83 add v2 `lecture-hall-4`: The projector the beam comes from
- [ ] #108 add v2 `lecture-hall-6`: Sills and head reveals for the high windows

### hospital-room

- [ ] #10 fix v4 `hospital-room-1`: Stand the bed and drip stand on the floor
- [ ] #42 fix v3 `hospital-room-2`: Hang the drip bag from its hook, with a drip chamber
- [ ] #52 add v3 `hospital-room-8`: The reading lamp's lit underside
- [ ] #62 fix v2 `hospital-room-3`: A wall plate for the monitor's arm
- [ ] #77 fix v2 `hospital-room-4`: Columns on the water under the window's hill lights
- [ ] #90 add v2 `hospital-room-5`: The reading lamp's light landing on the bed
- [ ] #109 add v2 `hospital-room-6`: The mesh band at the top of the privacy curtain

### week-calendar

- [x] #4 fix v4 `week-calendar-1`: The Sunset clock shows two hour hands
- [ ] #30 fix v3 `week-calendar-3`: Event dots collide with a crossed-off day and the ring
- [ ] #33 fix v3 `week-calendar-2`: The potted plant is drawn in the landscape's night colour
- [ ] #40 fix v3 `week-calendar-7`: The mug keeps its evening white at Night
- [ ] #53 add v3 `week-calendar-5`: The sconce's own light: the lit mouth under its shade
- [ ] #71 fix v2 `week-calendar-4`: Calendar and clock shadows fall toward the lights

### committee-room

- [ ] #31 fix v3 `committee-room-1`: The water jug's handle is on its spout side
- [ ] #41 fix v3 `committee-room-2`: The lampshade's underside is missing by Day
- [ ] #82 add v2 `week-calendar-6+committee-room-5`: The boats' reflections in the window view
- [ ] #87 add v2 `committee-room-4`: A shadow under the window sill
- [ ] #110 add v2 `committee-room-3`: A marker tray under the project board

### way-in

- [ ] #11 fix v4 `way-in-1`: Turn the corner: shade the coping and string course over the side face
- [ ] #48 fix v3 `way-in-3`: Let the planter read: pour it in the ramp's concrete with a lit lip
- [ ] #111 add v2 `way-in-6`: By Day, small houses where the headland's lights stand at night

### bettys-hope

- [ ] #6 fix v4 `bettys-hope-1`: Boiling-house arches break through the broken wall top
- [ ] #37 fix v3 `bettys-hope-6`: Tail-pole wheel tangled in the drying racks
- [ ] #85 add v2 `bettys-hope-4`: Estate house: shadow under the eaves
- [ ] #88 add v2 `bettys-hope-3`: Complete the mill lamp: a pool on the ground and a cap
- [ ] #99 add v2 `bettys-hope-2`: The mill cap turns the corner with the tower
- [ ] #114 fix v1 `bettys-hope-5`: Twin tower's shade stops short of its broken crown

### court-house

- [x] #3 fix v4 `court-house-1`: String course crosses the shaded side face lit
- [ ] #7 fix v4 `court-house-4`: The sea shows between the town houses down to the street
- [ ] #38 fix v3 `court-house-3`: The railing bars the lit entrance
- [ ] #54 add v3 `court-house-2`: Quoins returning round the corner onto the side face
- [ ] #96 add v2 `court-house-5`: Voussoirs and keystone on the wing's entrance arch

### st-johns-harbour

- [ ] #8 fix v4 `st-johns-harbour-1`: Far houses and lights sit between and on the cathedral's towers
- [ ] #23 fix v3 `st-johns-harbour-6`: The ships' masts stand on nothing, a deck above the ship
- [ ] #55 add v3 `st-johns-harbour-2`: Rows of balcony glass along the ships' decks
- [ ] #97 add v2 `st-johns-harbour-5`: Contact shadow under the cannon's carriage
- [ ] #115 add v1 `st-johns-harbour-3`: The fort's coping turns the corner onto the outer wall
