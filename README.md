# Prism

A chat interface for Meta's Llama models, running on the Hugging Face Inference API.

**Live:** [prism-steel.vercel.app](https://prism-steel.vercel.app)

<img width="1918" height="1018" alt="image" src="https://github.com/user-attachments/assets/98abb1f6-492f-4913-b182-0a2b0ba169c6" />

---

## What it is

Prism is a minimal chat client. You type, it sends your message to a Llama model hosted on Hugging Face, and it renders the reply. That's the whole product surface.

It's split into a React frontend and a separate backend service. The split exists for one reason: the Hugging Face token can't go in the browser. Everything else about the project follows from that decision.

---

## Architecture

```
React frontend  ──►  Backend API  ──►  Hugging Face Inference API  ──►  Llama model
      ▲                  │
      │                  └─ holds HUGGINGFACE_API_KEY
      └──────────  rendered reply  ◄───────────
```

The frontend has no credentials. It posts a message to the backend's chat endpoint; the backend attaches the token, calls Hugging Face, normalizes what comes back, and returns it. A token shipped to the browser is readable in DevTools and billable to your account — this is the part of the project worth pointing at.

Two things the request path has to survive:

- **Cold starts.** Hugging Face unloads idle models. The first request after a quiet period returns a 503 with an `estimated_time` field instead of a completion. <!-- FILL: what the backend does here — retry with backoff, or pass a "model warming up" state to the UI? If it currently just surfaces the error, say that; it's honest and it sets up the roadmap. -->
- **Malformed replies.** Raw model output can arrive with the prompt echoed back, truncated mid-sentence, or wrapped in chat template tokens. <!-- FILL: what you strip or normalize before returning it. -->

---

## Stack

| | |
|---|---|
| Frontend |  Create React App  |
| Backend |  Node + Express  |
| Model |  meta-llama/Llama-3.2-3B-Instruct  |
| Inference | Hugging Face Inference API |
| Hosting | Vercel (frontend) Render(backend) |

---

## Running it locally

Two processes: backend first, then frontend.

```bash
git clone <repository-url>
cd prism
```

**Backend**

```bash
cd server        # FILL: your actual directory name
npm install
```

Create `.env` in the backend directory:

```
HUGGINGFACE_API_KEY=hf_your_token_here
PORT=5000
```

Get a token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) — read access is enough.

```bash
npm run dev
```

**Frontend**

```bash
cd ../client     # FILL: your actual directory name
npm install
```

Create `.env` in the frontend directory pointing at the backend:

```
VITE_API_URL=http://localhost:5000
```

<!-- FILL: if this is Create React App rather than Vite, the prefix is
     REACT_APP_ instead of VITE_. Get this right — it's the single most
     common reason a cloned repo doesn't run. -->

```bash
npm run dev
```

Open the address the dev server prints.

---

## Deployment notes

The frontend is on Vercel with `VITE_API_URL` set in Settings → Environment Variables, pointing at the deployed backend rather than localhost.

The backend needs `HUGGINGFACE_API_KEY` set in its own host's environment, and CORS configured to accept the Vercel domain. Forgetting the second one produces a frontend that works locally and silently fails in production.

If you fork this and swap models, check the model is actually served by the Inference API — many larger Llama variants aren't available on the free tier, and the 404 looks like a code bug rather than a permissions one.

---

## Current limitations

Stated plainly, because they're real:

- **No conversation memory.** Each message is sent independently; the model doesn't see what came before.
- **No streaming.** You wait for the full completion, which on a cold model is several seconds of nothing.
- **Two cold starts, not one.** If the backend is on a free tier that sleeps, a first request can wait for the backend to wake *and* the model to load.
- One hardcoded model, no picker.
- Chat history is lost on refresh.

---

## Next

Three things, in the order I'd do them:

1. **Multi-turn context** — send prior messages so it behaves like a conversation rather than a series of one-shots. The real work is deciding what to drop as the context window fills.
2. **Streaming responses** — switch the backend to the streaming endpoint and forward chunks to the client. Removes most of the perceived latency without making the model any faster.
3. **Markdown and code rendering** — Llama returns fenced code blocks constantly and Prism currently shows them as raw text.

---

## License

MIT — see [LICENSE](./LICENSE).
