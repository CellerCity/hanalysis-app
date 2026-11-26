# HANALYSIS

A hyperlocal health risk forecaster. It combines a user's health profile with live
weather and air-quality data for their location, and answers health questions through
a retrieval-augmented chat assistant grounded in WHO fact sheets.

Course project, Data Analytics (CS61061), IIT Kharagpur, Prof. Abhijnan Chakraborty,
August-November 2025. Built with Tanmoy Halder and Jakwan Shahir Siddique.

## Architecture

Four separate pieces, each runnable on its own:

```
frontend/          React + Vite     dashboard, chat, auth pages
backend/           Node + Express   users, profiles, caching, API orchestration
microservice/      Python + Flask   RAG retrieval and Gemini generation
data_collection/   Python           scrapes WHO fact sheets into MongoDB
```

The browser talks only to Express. Express holds the user records and the caches, calls
WeatherAPI and ipgeolocation.io directly, and forwards anything needing a language model
to Flask. Flask owns the vector search and the Gemini calls; it never sees a user account.

Splitting the LLM work into its own service keeps the Python ML dependencies
(`sentence-transformers`, `torch`) out of the Node process, so the API server stays small
and the two can be restarted independently.

## Risk analysis

`GET /api/analysis/full` builds the dashboard assessment in two Gemini calls:

1. **Baseline.** A generic 30-year-old with no conditions, at the user's current location,
   given the current weather, AQI, 3-day forecast and search trends. The result is cached per
   location for one hour in `GuestAnalysisCache`, and guest mode reuses the same cache.
2. **Personalised.** The baseline plus the user's age, pre-existing conditions and allergies;
   the model adjusts the score and recommendations for this user.

Each call returns JSON with `riskScore` (1-10), `riskLevel`, `summary` and `recommendations`.

## Retrieval

`data_collection/WHO_scraper.py` pulls the WHO fact sheets (232 pages), splits each page at its
`h2`/`h3` headings, and saves 1,989 chunks to `who_facts.json`. `upload_facts.py` inserts the chunks
into MongoDB Atlas as plain text.

Retrieval first used keyword search: an exact match on the topic name, then MongoDB `$text` search
over the text index `upload_facts.py` creates. It was later replaced with semantic search.
`microservice/update_embeddings.py` backfills the existing documents: it embeds every chunk without a
`chunk_embedding` using `all-MiniLM-L6-v2` (384 dimensions) and writes the vector back. The text index
is no longer queried.

Vector search needs an Atlas Vector Search index named `search_buddy` on `health_facts`, created in
the Atlas UI:

```json
{
  "fields": [
    { "type": "vector", "path": "chunk_embedding", "numDimensions": 384, "similarity": "cosine" }
  ]
}
```

At query time `microservice/app.py` embeds the question with the same model, runs `$vectorSearch`
(100 candidates, top 1), and keeps the hit only if its score is above **0.75**. Atlas normalises cosine
scores to [0, 1] as `(1 + cosine) / 2`, so this is a raw cosine similarity of **0.5**. Below it, the
nearest fact was usually related to the question but did not answer it, and quoting it produced
confident wrong advice, so the assistant answers from the model alone and does not cite a source.

The chat prompt carries fixed safety rules: no diagnosis, no medication or dosage, and no personal
instructions; answers end with a fixed disclaimer.

## API

Express, mounted under `/api`:

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/users/register` | - | create account, returns JWT |
| POST | `/users/login` | - | returns JWT |
| GET | `/profile/me` | JWT | read health profile |
| PUT | `/profile/me` | JWT | update health profile |
| GET | `/analysis/full` | JWT | personalised risk assessment |
| POST | `/chat` | JWT | grounded chat turn |
| GET | `/health-metrics` | - | guest mode; `location` query parameter, defaults to Kharagpur (the frontend always sends Kharagpur) |

Flask: `POST /api/analyze`, `POST /api/chat`, `GET /api/trends`.

Auth is JWT in an `Authorization: Bearer` header, verified by `backend/middleware/authMiddleware.js`.
Passwords are hashed with bcrypt. On every login the backend geolocates the request IP with
ipgeolocation.io and stores it as the user's current location; on localhost it falls back to
`DEV_DEFAULT_LOCATION`.

Google Trends was first fetched live with `pytrends`, but the free endpoint rate-limited us (HTTP 429)
during the demo. `/api/trends` in Flask now returns an empty list, and trend data is served from a
snapshot in the `TrendsCache` collection, keyed by region code (`IN-WE` for Kharagpur).
`microservice/test_trends.py` saves a snapshot to `trends_data.json`, which was imported into Atlas by hand.

## Running it

Requires a MongoDB Atlas cluster: `$vectorSearch` is not available on a local MongoDB.

Four terminals. Copy each `.env.example` to `.env` and fill in the values first.

```bash
# 1. Fact library (once)
cd data_collection && pip install -r requirements.txt
python WHO_scraper.py         # optional: who_facts.json is already committed
python upload_facts.py        # drops and recreates health_facts with plain-text chunks
cd ../microservice && pip install -r requirements.txt
python update_embeddings.py   # adds chunk_embedding to every chunk
# then create the search_buddy vector index in Atlas (see Retrieval)

# 2. Flask microservice
cd microservice && python app.py

# 3. Express API
cd backend && npm install && npm run dev

# 4. React frontend
cd frontend && npm install && npm run dev
```

Re-running `upload_facts.py` deletes the embeddings; run `update_embeddings.py` again and check the
vector index still exists.

The first start of the microservice downloads the `all-MiniLM-L6-v2` model from Hugging Face.

Frontend runs on `:5173`, Express on `:5000`, Flask on `:8000`.

Sample request bodies for testing the services directly are in `microservice/test_data.json`,
`microservice/test_chat.json` and `backend/test_chat_data.json`:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d @test_data.json http://127.0.0.1:8000/api/analyze
```

## Keys required

`backend`: MongoDB, JWT secret, WeatherAPI, ipgeolocation.io
`microservice`: MongoDB, Google Gemini
`data_collection`: MongoDB

See the `.env.example` in each directory.