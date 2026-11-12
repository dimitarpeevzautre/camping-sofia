# Camping Sofia leaderboard

The backend of the parking game on camping-sofia.com. One small Node service on Cloud Run, storing scores in
Firestore. The game itself lives on the `gh-pages` branch; this branch (`backend`) is never published to the site.

- `GET /top` returns the twenty best scores of this week (ISO week, UTC) and of all time.
- `POST /score` with `{ name, score, parked, time }` stores a score and returns its place and the lists.

Only a nickname and the figures of a shift are stored. The caller's IP is used in memory for rate limiting
(six posts a minute) and is not written anywhere.

## Run locally

    MEMORY=1 PORT=8787 node server.js

`MEMORY=1` keeps scores in memory instead of Firestore, so no Google Cloud access is needed.

## Deploy

    gcloud run deploy camping-sofia-scores --source . --region europe-west3 \
      --allow-unauthenticated --max-instances 2 --memory 256Mi

The project needs the Cloud Run, Cloud Build, Artifact Registry and Firestore APIs, and a Firestore database in
native mode. The service's URL goes into `API` at the top of the leaderboard section of `js/game.js`.
