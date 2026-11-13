# camping-sofia.com

The coming-soon page for Camping Sofia, a project by thestable.bg. The page is a small, calm game: an invented
campsite seen from above, where guests arrive at the gate one after another and you drive each to the pitch that
lights up. Nothing hurries you. When the camp fills, the longest-staying guests pack up and drive out.

## How it plays

- **Parking.** Each parking scores up to 100 for accuracy and up to 100 for speed. A slow parking only loses the
  speed points: guests never leave and there are no lives. Clean parkings in a row multiply the points (up to x3),
  a perfect one adds 50, a VIP is worth double, and parking after dark or in the rain adds a little.
- **A shift.** It lasts until you choose "Finish the shift" on the score card (the Score plate, or P). Finishing
  banks the points as coins for the camp shop and records the shift among your five best.
- **Guests.** Campervans, motorhomes, cars with caravans and cars with rooftop tents. Now and then a rare
  vehicle arrives (nine kinds); each is worth 100 the first time and is kept in an album on the score card.
- **On the lanes.** An ice-cream van, a tractor, a touring biker, cyclists and backpackers, all slow, each
  keeping to the right-hand side of its road so the middle is always free. Tips to
  pick up, an occasional purple boost (double points, self-parking, a shield), a wash bay, ten hidden gnomes, an
  errand for a camper every so often and, rarely, a dog that has run off with the sausages.
- **People.** Each guest brings a small family. Campers from different pitches who meet stop for a short scripted
  chat, and they remark on what happens around them. The owner, Baba Ginka, has a few words too.
- **The biplane.** "Fly the biplane" on the start card. It cannot land or stop. Four things you can do with it
  are worth points and are not announced (seven of them); the score card counts the ones found. It leaves a
  trail in the sky.
- **The nature notebook.** Not announced either: stop for a moment near one of the camp's quieter residents and
  it is written down (ten entries, listed on the score card): the cat on the reception roof, the stork, the ducks,
  a squirrel, a deer at dusk, fireflies, an owl on the gate and the moon in the pond after dark, a hedgehog to
  wait for, and the rainbow after a daytime shower. After the third guest of a shift the owner hints at it, until
  the first entry is made. Stopping by the campfire at night gets a word from whoever is sitting there.
- **To look at.** Ducks, lily pads and reeds on the pond; butterflies, cloud shadows, a hot-air balloon and a
  skein of birds by day; a golden hour at dusk; fairy lights, fireflies, woodsmoke and a ring of campers round
  the fire at night; a playground the children walk to; backpackers' tents going up in the field; a washing line
  that comes in when it rains. Very quiet
  birdsong by day and crickets after dark.
- **Seasons.** From 20 September to the end of November some of the trees are gold and russet, leaves fall instead
  of butterflies, pumpkins sit by the reception door, the campers have a few seasonal things to say, and eight
  mushrooms come up in the grass each shift to be picked by rolling over them.
  From December to February the camp is under snow: white ground and roofs, frosted trees, snow on the pines,
  a frozen pond with no lilies, and snowflakes in place of the leaves. From March to May some trees are in pink or white
  blossom, petals drift down and the meadow has twice the flowers. `?season=spring`, `summer`, `autumn` or `winter`
  forces one.
- **Foraging.** Eight things to gather lie in the grass each shift, in new places every time: mushrooms in
  autumn, pine cones in winter, wild garlic in spring, wild strawberries in summer. Rolling over one picks it;
  all eight in a shift earn a badge.
- **Before you start.** A campervan or a car and caravan drives itself to a pitch behind the start card.

Controls: arrow keys or WASD, Space for the handbrake, H for the horn, M to mute, R for the radio, P to pause.
Touch buttons appear on phones, and a gamepad works. Content is kept to a PG-13 level: nobody is hurt, and the
strongest line in the scripts is a joke about home-made rakia.

The game was busier once (a warden who chased bad drivers, ramps, cones to knock over, lives, rush hours). The
owner played it and asked for something slower and prettier. Some of that code is still in `js/game.js`,
switched off; treat it as removed.

## What is on the screen

The owner's standing instruction is that the game should be calm and the screen uncluttered, on a small phone
above all. Treat every plate, button and message as a cost.

- **Phone** (either side of the screen under about 560 px, upright or sideways): a small minimap with no goal list,
  two plates (Pitch, Score), one sound button, a thin patience bar and small, see-through touch buttons. The radio
  control is on the score card.
- **Minimap**: lanes, the pitch to go to, an errand or the dog when there is one, and the vehicle. Nothing else.
- **Messages**: small, translucent, near the top. A routine parking shows none: the points float up from the pitch.
  What does appear is occasional (a VIP, a goal, a badge, a rare vehicle, a notebook entry, an errand, the dog,
  rain). The owner, Baba Ginka, speaks once at the start of the first shift and gives one hint about the notebook.
- **Score card**: the score, the buttons and the leaderboard first; statistics, collections and sharing are folded
  away until opened.
- **No shake, no banners**: the view does not shake on a bump, and nothing is written large across the screen.
  A parking floats up one figure from the pitch.

### Simple by default, `?full` for the rest

The owner compared two versions and chose the simple one, so that is what `camping-sofia.com` serves: only the
parking, with no tips or boosts on the lanes, no errands, no runaway dog, no goals, no patience bar (time earns a
flat 50 a parking), no multiplier chip, no badge or record messages, and a start card without the legend and the
shop. The scenery, seasons, nature notebook, foraging, biplane and leaderboard are in both.

`camping-sofia.com/?full` is the fuller version with all of those switched back on. The sections of "How it
plays" above that mention tips, boosts, errands, the dog, goals or the patience bar describe `?full`. The switch
is `SIMPLE` near the top of `js/game.js`.

## Files

- `index.html`: the page and its English text (title, start card, score card, footer).
- `css/site.css`: the signs in front of the game (name plate, score plates, cards, touch buttons).
- `js/game.js`: the game, in one file: language tables, camp layout, vehicles, driving, people, the extras,
  drawing, the score card, the loop.
- `logo.svg`, `favicon.png`, `og.jpg`: the mark, the fallback icon and the picture shown when the link is shared.

There is no build step and no dependency. Sound is synthesised with Web Audio, so there are no audio files.

## Languages

English and Bulgarian. The language follows the browser, can be switched on the start card and can be forced
with `?lang=bg` or `?lang=en`. The strings are in `STR` at the top of `js/game.js`; the English defaults for the
markup are in `index.html`, and elements carry `data-t` (text) or `data-a` (title or aria-label) keys.

## What is kept in the browser

Everything a player keeps is in `localStorage`: best score, the five best shifts, badges, gnomes found, rare
vehicles spotted, pilot's secrets, coins and perks, nickname, language and sound choices. Nothing is sent
anywhere except a score you choose to post to the leaderboard; once a nickname is saved, later finished shifts
are posted under it automatically.

## Leaderboard

The score card shows this week's and the all-time top lists, and offers to post a finished shift under a nickname.
The scores are kept in a Firestore database in the Google Cloud project `camping-sofia-game` (Frankfurt, free tier,
no billing account), which the page talks to directly: there is no server in between and nobody signs in. A score
is a nickname, the points, the number of guests parked, the length of the shift, the ISO week and the time it was
stored. Nothing else is sent.

The database's rules are the only gate. They allow reading up to fifty entries at a time and adding one
well-formed score (a nickname of up to 16 letters, digits, spaces or `_.-`, and figures within plausible bounds),
and refuse every change or deletion. They are in `firestore.rules` on the `backend` branch, with a note on
publishing them. Anyone can therefore post a made-up score: the list is for fun, not proof. Nicknames matching a
short list of rude words are stored but not shown. `?lb=off` hides the leaderboard; setting `API` to `false` in the
leaderboard section of `js/game.js` switches it off for everyone.

## How it is drawn

Everything is drawn on one canvas each frame. Anything that does not change from frame to frame (a parked
camper, traffic going straight, the driven vehicle while it holds its line) is drawn once onto a small canvas of
its own and reused until the camera has moved between 0.3 m and a metre, depending on how fast the device is;
in between it is slid by the lean of its roof, so tall parked vehicles do not twitch. See `viaSprite` in
`js/game.js`. Without that a
full camp ran at a few frames a second on a phone.

## Run it locally

```
python -m http.server 8123
```

Then open http://127.0.0.1:8123/. Add `?debug` to the address to expose the game state as `window.camp` in the
browser console, and `?debug&shot` to hide the map, goals and pointer when taking a picture such as `og.jpg`.
`?debug&probe` paints a magenta mark inside the first parked vehicle's cached drawing at roof height and a cyan one
fresh on the ground under it; tracking both while driving past measures how far the cache lags (see `viaSprite`).

## Deploy

Pushing to `gh-pages` (the default branch) publishes the repository root to GitHub Pages
(`.github/workflows/pages.yml`). `CNAME` keeps the custom domain. Bump the `?v=` numbers on the stylesheet and
script in `index.html` when they change, so browsers fetch the new files.

## Not there yet

- No waiting list. There is nowhere to send sign-ups yet; add a form to the start card once there is.
- No opening date, address or real photos. The camp in the game is made up, and the footer says so.
