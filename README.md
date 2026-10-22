# Ready900 Buddy

An unofficial AI study buddy for the Microsoft Azure Fundamentals (AZ-900) exam. It explains Azure concepts in plain language, with African examples, in four languages, can read answers aloud, and can quiz you Socratic-style instead of just handing over answers.

> **Unofficial study tool, not affiliated with or endorsed by Microsoft.**
> Content is based on the public AZ-900 skills outline. It contains no real exam questions and no Microsoft logos.

Built for the **Vibe Coding Hackathon: AZ-900 Exam Prep Edition**, track: **AI Study Buddy**.

## Live demo

| | |
|---|---|
| Live app | `TODO: https://your-app.onrender.com` |
| API health check | `TODO: https://your-api.onrender.com/health` |
| Demo video | `TODO: link` |

> Free Render services sleep when idle, so the first request can take about a minute. Open the app a few minutes before trying it.

**Best audio experience:** use Microsoft Edge. Text-to-speech uses the voices your browser and device provide, and Edge usually offers the most languages.

## What it does

- **Four study modes**
  - *Explain simply*: plain, beginner-friendly explanations.
  - *Local example*: Azure ideas explained with everyday African analogies (load-shedding, mobile money, spaza shops).
  - *Exam tips*: common traps and what to watch for.
  - *Socratic*: one guiding question at a time. It gives hints rather than answers, confirms correct reasoning, then offers a harder follow-up.
- **Four languages:** English, siSwati, isiZulu and Kiswahili. Azure technical terms stay in English. **siSwati output is the weakest and should be checked by a speaker.**
- **Structured replies:** each answer is split into cards: explanation, local example, key terms (hover or tap for the meaning), exam trap, a "Check yourself" question, and the AZ-900 outline section it relates to.
- **Listen:** browser text-to-speech with sentence highlighting and speed control (0.8x / 1x / 1.2x). The Listen button only appears when your device has a voice for the selected language, so you never hear Swahili read in an English voice.
- **Scope guard:** off-topic questions get a gentle redirect instead of an answer.
- **Glassmorphism UI:** dark by default, light mode toggle, responsive, respects `prefers-reduced-motion`.

## Architecture

```
Browser (React SPA)                        C# API (ASP.NET Core)              LLM providers
------------------                         ---------------------              -------------
chat history in localStorage   POST        rate limit (per session)           1. Gemini
anonymous sessionId           ------>      daily cap, input checks     --->   2. Groq
last 6 turns sent per request  /api/buddy  cache (in-memory)                  3. Cerebras
                               /messages   prompt builder (mode+language)     4. Mistral
                                           provider fallback chain            5. OpenRouter
                                           static fallback replies
```

Key decisions:

- **The frontend never calls an LLM directly.** All keys stay on the server, in environment variables.
- **The API is stateless.** Chat history lives in the browser's `localStorage`. Each request carries the last 6 turns, and that is how Socratic mode knows what was already asked. There is no database, no login and no accounts.
- **Anonymous sessions:** the app generates a `sessionId` with `crypto.randomUUID()` on first visit and sends it as the `X-Session-Id` header, used only for rate limiting.
- **Swappable data layer:** the frontend has a mock buddy and a real HTTP client behind one function, controlled by `VITE_USE_MOCK`.

### Reliability

LLM free tiers fail, rate-limit and sometimes return empty output. The API is built to survive that:

1. **Provider chain:** Gemini first, then OpenAI-compatible providers in the order configured. Any failure (HTTP error, timeout, empty or malformed JSON) falls through to the next provider.
2. **Temporary skip:** a provider that fails is skipped for 30 seconds so users aren't stuck waiting on it again.
3. **Per-provider timeout:** 15 seconds each, so a slow provider can't hang the app.
4. **Response cache:** identical first-turn questions (same message, mode and language) are served from memory for 12 hours and shown with a "cached" badge.
5. **Static fallbacks:** if every provider fails, the five suggested questions in each mode are answered from `Fallbacks.json`, so the main demo path still works.

### Protection

- Rate limit: 10 requests per minute per session, returning `RATE_LIMITED` with a retry time.
- Global daily cap on LLM calls (default 500), returning `DAILY_LIMIT`.
- 500-character input limit, history trimmed to 6 turns, capped output tokens.
- CORS restricted to the configured frontend origin.

## API

`POST /api/buddy/messages`, header `X-Session-Id: <uuid>`

Request:

```json
{
  "conversationId": "optional string",
  "message": "What is high availability?",
  "mode": "simple | local | exam | socratic",
  "language": "en | ss | zu | sw",
  "history": [{ "role": "user | assistant", "content": "..." }]
}
```

Reply:

```json
{
  "conversationId": "string",
  "mode": "simple",
  "explanation": "string",
  "localExample": "string | null",
  "keyTerms": [{ "term": "string", "meaning": "string" }],
  "examTrap": "string | null",
  "checkQuestion": "string | null",
  "outlineSection": "string | null",
  "cached": false
}
```

In Socratic mode, `explanation` holds the guiding question or feedback and the other fields are empty.

Errors: `{ "error": { "code": "...", "message": "..." }, "retryAfterSeconds": 10 }`

| Code | HTTP status | Meaning |
|---|---|---|
| `RATE_LIMITED` | 429 | Too many requests from this session |
| `DAILY_LIMIT` | 429 | The global daily cap was reached |
| `OFF_TOPIC` | 422 | The question isn't about AZ-900 |
| `PROVIDER_ERROR` | 502 | Every LLM provider failed |
| `BAD_REQUEST` | 400 | Empty or over-long message, or invalid mode or language |

`GET /health` returns `{ "status": "ok" }`.

## Tech stack

**Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Framer Motion. The first version of the UI was built with Lovable, without Supabase or any Lovable backend.

**Backend:** C# / ASP.NET Core minimal API, built-in rate limiter, `IMemoryCache`, `IHttpClientFactory`, Docker.

**LLMs:** Gemini, plus any OpenAI-compatible providers (Groq, Cerebras, Mistral, OpenRouter) configured in settings.

## Run locally

### Backend

```bash
cd BackendAPI

# API keys go in user-secrets, never in appsettings.json
dotnet user-secrets set "Gemini:ApiKey" "<key>"
dotnet user-secrets set "OpenAiCompat:0:ApiKey" "<key for the provider at index 0>"
# repeat for the other providers you want to enable

dotnet run
```

Non-secret settings live in `appsettings.json`:

```json
{
  "Gemini": { "Model": "gemini-flash-latest" },
  "Limits": { "DailyCalls": 500 },
  "Cors": { "Origins": "http://localhost:5173" },
  "OpenAiCompat": [
    { "Name": "groq",       "BaseUrl": "https://api.groq.com/openai/v1", "Model": "" },
    { "Name": "cerebras",   "BaseUrl": "https://api.cerebras.ai/v1",     "Model": "" },
    { "Name": "mistral",    "BaseUrl": "https://api.mistral.ai/v1",      "Model": "" },
    { "Name": "openrouter", "BaseUrl": "https://openrouter.ai/api/v1",   "Model": "" }
  ]
}
```

Providers with no `ApiKey` or `Model` are skipped, so you only need to configure the ones you want. The array order is the fallback order. Secrets are matched to providers by array position, so keep the order stable.

### Frontend

```bash
npm install
cp .env.example .env     # then edit the values below
npm run dev              # http://localhost:5173
```

```dotenv
# "true" uses the built-in mock buddy (src/api/mock.ts), no backend needed.
# "false" calls the real C# API through src/api/http.ts.
VITE_USE_MOCK=false

# Base URL of the C# API, used when VITE_USE_MOCK=false. Example: https://localhost:5001
VITE_API_URL=
```

Tip: type `/mock429` in mock mode to preview the rate-limit banner.

## Deploy (Render)

**Backend (Docker web service)**

1. Create a Render *Web Service* from this repo, with the root directory set to `BackendAPI` and the runtime set to Docker.
2. Set environment variables (use `__` in place of `:`):

   ```
   Gemini__ApiKey=...
   OpenAiCompat__0__ApiKey=...
   OpenAiCompat__1__ApiKey=...
   Cors__Origins=https://<your-frontend>.onrender.com
   ```

   Also set the model names for each provider (`OpenAiCompat__0__Model=...`, and so on) if they aren't already in `appsettings.json`.
3. Confirm `GET /health` responds.

**Frontend (Static Site)**

1. Build command: `npm install && npm run build`, publish directory: `dist`.
2. Set `VITE_USE_MOCK=false` and `VITE_API_URL=https://<your-api>.onrender.com`, then redeploy. Vite reads these at build time.

## Evaluation

`TODO: results of the evaluation set. Suggested format:`

| # | Question | Mode | Language | Accurate? | Notes |
|---|---|---|---|---|---|
| 1 | | | | | |

`TODO: summary line, e.g. "N of M answers judged accurate by a reviewer. Failures and what we changed."`

Language quality is checked by speakers of each language, and siSwati output is flagged as lower quality.

## How the prompts work

`TODO: briefly describe the prompt design: a system prompt per mode and language, a strict JSON output schema, grounding to the AZ-900 skills outline, the off-topic guard, and the Socratic rules (one question at a time, hint after a wrong answer, confirm and summarise after a correct one).`

## Screenshots

`TODO: add screenshots (dark mode, light mode, Socratic mode, a non-English reply).`

## Limitations

- siSwati output is the weakest of the four languages, and isiZulu and Kiswahili should also be checked by speakers.
- Text-to-speech depends on the user's device. Kiswahili and isiZulu voices are only available on some browsers and devices, and there is no siSwati voice.
- The cache and the daily cap are in memory and reset when the server restarts.
- LLM answers can be wrong. Always check important facts against the official Microsoft Learn AZ-900 study guide.

## Team

- `TODO: name`: backend, API and deployment
- `TODO: name`: UI testing, evaluation set, language checks and pitch

## Disclaimer

Unofficial study tool, not affiliated with or endorsed by Microsoft. Microsoft and Azure are trademarks of Microsoft Corporation. This project is not a substitute for official exam preparation materials.