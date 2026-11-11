# camping-sofia.com

The coming-soon page for Camping Sofia. The page is a small game: an invented campsite seen from above, where
guests arrive at the gate one after another and you drive each to the pitch that lights up. It never ends; when
the camp fills, the longest-staying guests check out.

Each parking scores up to 100 for accuracy and 100 for speed. The score shown is the total for the guests on site
now, less every bump: guests pack up after a while, drive out by the gate and take their points with them. Every guest brings a
family (adults, children who run about on the lanes, sometimes a dog or a cat) who turn in at night.

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
