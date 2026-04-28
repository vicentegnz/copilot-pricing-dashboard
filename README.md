# copilot-ometer

> **Local-first analytics dashboard for [GitHub Copilot
> CLI](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line).**  
> See exactly how many tokens you have used, which models you have talked to,
> what each session cost, and how your usage trends over time -- all from your
> own machine, no cloud, no telemetry.

---

## Features

| Page               | What you get                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Overview**       | Stat cards, usage-over-time area chart, model cost donut, GitHub-style activity heatmap          |
| **Sessions**       | Searchable table of every session -- messages, tool calls, tokens, cost                          |
| **Session detail** | Full conversation replay with tool call badges, per-model token breakdown, model switch timeline |
| **Costs**          | Cost-over-time stacked by model, top-10 sessions bar chart, per-model cost table                 |

Data is read directly from `~/.copilot/session-state/` (or any path you
configure). Nothing leaves your machine.

---

## Quick start

### Option A -- npm

```bash
git clone https://github.com/vicentegnz/copilot-ometer.git
cd copilot-ometer
npm install
npm run dev
```

Open **http://localhost:3000** -- that is it.

### Option B -- Docker

```bash
# Linux / macOS
docker run -p 3000:3000 \
  -v ~/.copilot/session-state:/data/sessions:ro \
  ghcr.io/vicentegnz/copilot-ometer

# Windows PowerShell
docker run -p 3000:3000 `
  -v "$env:USERPROFILE\.copilot\session-state:/data/sessions:ro" `
  ghcr.io/vicentegnz/copilot-ometer
```

### Option C -- Docker Compose

```bash
git clone https://github.com/vicentegnz/copilot-ometer.git
cd copilot-ometer
cp .env.example .env.local   # optional: override session path
docker compose up
```

Open **http://localhost:3000**.

---

## Configuration

Copy `.env.example` to `.env.local` and set any variables you need:

```bash
cp .env.example .env.local
```

| Variable              | Default                    | Description                           |
| --------------------- | -------------------------- | ------------------------------------- |
| `COPILOT_SESSION_DIR` | `~/.copilot/session-state` | Path to your Copilot CLI session data |

> **Windows users:** use forward slashes in `.env.local`:  
> `COPILOT_SESSION_DIR=C:/Users/YourName/.copilot/session-state`

---

## How it works

```
~/.copilot/session-state/
+-- <session-uuid>/
    +-- events.jsonl     <- every event: messages, tool calls, model changes, shutdown metrics
    +-- workspace.yaml   <- session name, cwd, timestamps
```

The API routes parse `events.jsonl` server-side on each request and return
aggregated JSON to the client. The `session.shutdown` event contains
authoritative per-model token counts used for cost estimation.

Costs use the [GitHub Copilot pricing
table](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)
(per 1M tokens). Your plan's included AI credit allowance may cover some or all
usage.

---

## Build Docker image locally

```bash
docker build -t copilot-ometer .
docker run -p 3000:3000 \
  -v ~/.copilot/session-state:/data/sessions:ro \
  copilot-ometer
```

---

## Tech stack

- **[Next.js 15](https://nextjs.org)** -- App Router, Turbopack, standalone
  output
- **[TypeScript](https://www.typescriptlang.org)** -- fully typed throughout
- **[Tailwind CSS v4](https://tailwindcss.com) +
  [shadcn/ui](https://ui.shadcn.com)** -- dark-mode UI components
- **[Recharts](https://recharts.org)** -- area charts, donut, bar charts
- **[SWR](https://swr.vercel.app)** -- client-side data fetching with
  stale-while-revalidate

No database required. Reads session files directly via Node.js API routes.

---

## Contributing

PRs welcome! A few ideas for contribution:

- Date range filter on the sessions table
- Export data as CSV / JSON
- Token budget alerts
- Support for multiple data directories

```bash
git clone https://github.com/vicentegnz/copilot-ometer.git
cd copilot-ometer
npm install
npm run dev   # http://localhost:3000
```

---

## License

MIT
