# camping-sofia.com

The coming-soon page for Camping Sofia. The page is a small game: an invented campsite seen from above, where
guests arrive at the gate one after another and you drive each to the pitch that lights up. It never ends; when
the camp fills, the longest-staying guests check out.

Each parking scores up to 100 for accuracy and 100 for speed. The score shown is the total for the guests on site
now, less every bump: guests pack up after a while, drive out by the gate and take their points with them. Every guest brings a
small family (one or two adults, sometimes a child who runs about on the lanes, now and then a dog or a cat) who turn in at night.

## Files

- `index.html`: the page and all its text (title, the start card, the footer note).
- `css/site.css`: the signs in front of the game (name plate, score plates, start card, touch buttons).
- `js/game.js`: the game. The camp layout (roads, pitches, buildings, trees), the vehicles, the driving model and
  the drawing are all in this one file, in that order.
- `og.jpg`: the image shown when the link is shared.

There is no build step and no dependency.

## Run it locally

```
python -m http.server 8123
```

Then open http://127.0.0.1:8123/. Add `?debug` to the address to expose the game state as `window.camp` in the
browser console.

## Deploy

Pushing to `gh-pages` (the default branch) publishes the repository root to GitHub Pages
(`.github/workflows/pages.yml`). `CNAME` keeps the custom domain.

## Not there yet

- No waiting list. There is nowhere to send sign-ups yet; add a form to the start card once there is.
- No opening date, address or real photos. The camp in the game is made up, and the footer says so.

Pressing the Score plate pauses the game and opens a card with the figures behind the score (parkings, average
accuracy and speed, bumps, time played) and links to share it.

The page is in English and Bulgarian. The language follows the browser, can be switched on the start card and
can be forced with `?lang=bg` or `?lang=en`; the Bulgarian strings live at the top of `js/game.js`.

The score card also draws a 1200 x 630 picture of the score over the camp as it looks at that moment. It can be
saved, and the device share sheet attaches it where the browser allows files.

A shift ends when three guests have given up waiting. Clean parkings in a row multiply the points (up to x3),
a perfect one adds 50, a VIP is worth double and parking after dark adds a quarter. Tips on the roads give 25 points
(yellow) or 8 seconds (blue); H honks people out of the way. Best score, badges and the mute choice are kept in
`localStorage`. Sound is synthesised with Web Audio, so there are no audio files.

Space is the handbrake: above walking pace it swings the back round (not with a caravan on). A purple token on the
roads is a boost: speed, a time freeze, double points, self-parking or a shield. Campers from different pitches who
meet stop for a short scripted chat; the scripts are in the language tables at the top of `js/game.js`.
