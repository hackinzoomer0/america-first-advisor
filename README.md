# America First Advisor

A web app that finds federal candidates running in your congressional district, scores them against America First policy criteria using AI, and gives you a clear **Vote** or **Withhold** recommendation for each.

## How It Works

1. **Address lookup** — Enter your address. Your congressional district is resolved via the US Census Geocoder API.
2. **Candidate fetch** — Active candidates for your district are pulled from the FEC (Federal Election Commission) open data API.
3. **AI analysis** — Each candidate is analyzed by an AI model against America First criteria across four policy areas: Immigration, Foreign Policy, Social Policy, and Religion.
4. **Scoring** — Candidates receive a score from 1–10 per category. A weighted overall score is computed. A score of **7 or above** = Vote recommendation; **below 7** = Withhold.
5. **Caching** — Analysis results are stored in a database. Repeat lookups for already-analyzed candidates are served instantly without re-running AI.

## Tech Stack

| Service | Purpose |
|---|---|
| Next.js + Vercel | Frontend and API routes |
| Mapbox Search JS | Address autocomplete |
| US Census Geocoder | Coordinates → congressional district |
| OpenFEC API | Candidate data by state and district |
| Google Gemini | AI-powered candidate policy analysis |
| Neon (PostgreSQL) | Candidate analysis cache |

## Limitations

This project runs on **free-tier** plans across all services, which introduces several constraints:

- **AI latency** — Candidate analysis runs on-demand. First-time lookups for a new set of candidates may take 15–30 seconds while the AI processes them.
- **API rate limits** — The FEC API free key allows 1,000 requests/day. High traffic may result in temporary lookup failures.
- **Database compute** — The database has limited compute; cold starts may add a few seconds of latency on the first request after inactivity.
- **Serverless timeouts** — Hosting is on a free serverless plan with function execution time limits. Very large candidate sets could time out.
- **AI accuracy** — Candidate scoring depends on what the AI model knows from its training data. Information may be incomplete, outdated, or inaccurate — particularly for lesser-known or newer candidates.
- **Federal candidates only** — Only candidates registered with the FEC are included. State and local races are not covered.
- **Election cycle** — Only candidates active in the current election year are shown.

## Local Setup

Clone the repo and install dependencies:

```bash
npm install
```

Create a `.env.local` file with the following variables (obtain keys from each service's developer portal):

```
GEMINI_API_KEY=
FEC_API_KEY=
NEXT_PUBLIC_MAPBOX_API_KEY=
DATABASE_URL=
```

Run the dev server:

```bash
npm run dev
```

## Disclaimer

This tool is for informational purposes only. Scores and recommendations reflect alignment with specific policy criteria configured by the site operator and do not constitute official political endorsements. AI-generated analysis may contain errors or reflect outdated information. Always research candidates independently before voting.
