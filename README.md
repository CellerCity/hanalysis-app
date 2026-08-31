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

## Retrieval

`data_collection/WHO_scraper.py` pulls WHO fact sheets, chunks them, and writes them to
MongoDB; `upload_facts.py` embeds each chunk with `all-MiniLM-L6-v2` and stores the vector
alongside the text.

At query time `microservice/app.py` embeds the question with the same model, runs an Atlas
vector search, and keeps the top hit only if its cosine score clears **0.75**. Below that
threshold the nearest fact was usually topically related but not an answer, and quoting it
produced confident wrong advice, so the assistant answers from the model alone instead and
does not cite a source.

The generation prompt carries fixed safety rules: the assistant is forbidden from giving a
diagnosis or naming a medication.

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
| GET | `/health-metrics` | - | guest mode, location from query string |

Flask: `POST /api/analyze`, `POST /api/chat`, `GET /api/trends`.

Auth is JWT in an `Authorization: Bearer` header, verified by `backend/middleware/authMiddleware.js`.
Passwords are hashed with bcrypt.

Google Trends was integrated through `pytrends`, but the live endpoint returns an empty list:
the free tier rate-limited us during the demo, so trend data is served from a pre-populated
`TrendsCache` collection keyed by region code instead.

## Running it

Four terminals. Copy each `.env.example` to `.env` and fill in the values first.

```bash
# 1. MongoDB fact library (once)
cd data_collection && pip install -r requirements.txt
python WHO_scraper.py && python upload_facts.py

# 2. Flask microservice
cd microservice && pip install -r requirements.txt && python app.py

# 3. Express API
cd backend && npm install && npm run dev

# 4. React frontend
cd frontend && npm install && npm run dev
```

Frontend runs on `:5173`, Express on `:5000`, Flask on `:8000`.

Sample request bodies for testing the services directly are in `microservice/test_data.json`,
`microservice/test_chat.json` and `backend/test_chat_data.json`:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d @test_data.json http://127.0.0.1:8000/api/analyze
```

## Keys required

`backend`: MongoDB, JWT secret, WeatherAPI, NewsAPI, ipgeolocation.io
`microservice`: MongoDB, Google Gemini
`data_collection`: MongoDB

See the `.env.example` in each directory.
