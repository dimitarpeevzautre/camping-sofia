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
  it is written down (ten entries, listed on the score card).
- **To look at.** Ducks, lily pads and reeds on the pond; butterflies, cloud shadows, a hot-air balloon and a
  skein of birds by day; a golden hour at dusk; fairy lights, fireflies, woodsmoke and a ring of campers round
  the fire at night; a playground the children walk to; backpackers' tents going up in the field. Very quiet
  birdsong by day and crickets after dark.
- **Seasons.** From 20 September to the end of November some of the trees are gold and russet, leaves fall instead
  of butterflies, and eight mushrooms come up in the grass each shift to be picked by rolling over them.
  `?season=autumn` or `?season=summer` forces either.
- **Before you start.** A campervan or a car and caravan drives itself to a pitch behind the start card.

Controls: arrow keys or WASD, Space for the handbrake, H for the horn, M to mute, R for the radio, P to pause.
Touch buttons appear on phones, and a gamepad works. Content is kept to a PG-13 level: nobody is hurt, and the
strongest line in the scripts is a joke about home-made rakia.

The game was busier once (a warden who chased bad drivers, ramps, cones to knock over, lives, rush hours). The
owner played it and asked for something slower and prettier. Some of that code is still in `js/game.js`,
switched off; treat it as removed.

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
anywhere unless the leaderboard is switched on.

## Leaderboard

The score card can show weekly and all-time top lists from a small service (Cloud Run in front of Firestore) on
the `backend` branch of this repository. It stores a nickname and the figures of a shift, nothing else. Until
the service's address is set in `API` in the leaderboard section of `js/game.js`, the lists stay hidden.

## How it is drawn

Everything is drawn on one canvas each frame. Anything that does not change from frame to frame (a parked
camper, traffic going straight, the driven vehicle while it holds its line) is drawn once onto a small canvas of
its own and reused until the camera has moved a metre and a half; see `viaSprite` in `js/game.js`. Without that a
full camp ran at a few frames a second on a phone.

## Run it locally

```
python -m http.server 8123
```

Then open http://127.0.0.1:8123/. Add `?debug` to the address to expose the game state as `window.camp` in the
browser console, and `?debug&shot` to hide the map, goals and pointer when taking a picture such as `og.jpg`.

## Deploy

Pushing to `gh-pages` (the default branch) publishes the repository root to GitHub Pages
(`.github/workflows/pages.yml`). `CNAME` keeps the custom domain. Bump the `?v=` numbers on the stylesheet and
script in `index.html` when they change, so browsers fetch the new files.

## Not there yet

- No waiting list. There is nowhere to send sign-ups yet; add a form to the start card once there is.
- No opening date, address or real photos. The camp in the game is made up, and the footer says so.
