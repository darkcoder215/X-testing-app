# X Filtered Stream

Stream near real-time Posts from X (formerly Twitter) matching your filter rules using the [Filtered Stream API v2](https://docs.x.com/x-api/posts/filtered-stream/introduction).

## Features

- **Interactive setup** — Guided wizard to configure your Bearer Token and validate it
- **Real-time streaming** — Receive Posts within seconds of publication (~6-7s P99 latency)
- **FIFO queue architecture** — Decoupled ingestion and processing for handling high volumes
- **Smart reconnection** — Per-error-type backoff strategies (TCP linear, HTTP exponential, 429 special)
- **Volume tracking** — Monitors post throughput with anomaly alerts on significant drops
- **Post deduplication** — Filters duplicate Posts from backfill and recovery overlaps
- **Recovery mode** — Replay missed Posts for a time window (Enterprise, up to 24h)
- **Backfill on reconnect** — Automatically requests missed Posts when reconnecting (Enterprise)
- **Persistent rules** — Add and remove filter rules without disconnecting
- **Powerful operators** — Match on keywords, hashtags, users, language, and more
- **Multiple output formats** — Pretty-print, compact, or JSON output
- **Bulk rule management** — Load rules from JSON files
- **In-stream error handling** — Detects operational disconnects and error messages
- **Graceful shutdown** — Session stats on SIGINT/SIGTERM
- **Zero heavy deps** (only `dotenv`) — Uses native Node.js 18+ `fetch` and streams

## Prerequisites

- **Node.js 18+** (uses native `fetch` and `ReadableStream`)
- An approved [X Developer Account](https://developer.x.com/en/portal/petition/essential/basic-info)
- A [Project and App](https://developer.x.com/en/portal/dashboard) with a Bearer Token

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the setup wizard (creates .env with your Bearer Token)
node src/index.js setup

# 3. Add a rule
node src/index.js rules add "#AI lang:en -is:retweet" --tag="AI tweets"

# 4. Start streaming
node src/index.js stream
```

Or configure manually:

```bash
cp .env.example .env
# Edit .env and add your X_BEARER_TOKEN
```

## Usage

### Setup

```bash
# Interactive setup — validates your Bearer Token against the API
node src/index.js setup
```

### Managing Rules

```bash
# List active rules
node src/index.js rules list

# Add a single rule
node src/index.js rules add "from:elonmusk" --tag="Elon"

# Add rules from a JSON file
node src/index.js rules add-file examples/rules.json

# Delete specific rules by ID
node src/index.js rules delete 123456789 987654321

# Delete all rules
node src/index.js rules delete-all
```

### Streaming

```bash
# Default pretty-printed output
node src/index.js stream

# Compact single-line output (good for high volume)
node src/index.js stream --format=compact

# JSON output (pipe to jq or other tools)
node src/index.js stream --format=json | jq '.data.text'
```

### Recovery (Enterprise)

Replay missed Posts from a time window (up to 24 hours):

```bash
node src/index.js recover \
  --start=2024-01-15T10:00:00Z \
  --end=2024-01-15T10:10:00Z

# With a specific output format
node src/index.js recover \
  --start=2024-01-15T10:00:00Z \
  --end=2024-01-15T10:10:00Z \
  --format=json
```

### Using npm Scripts

```bash
npm start              # Show help
npm run stream         # Start streaming
npm run rules:list     # List rules
npm run rules:add      # Add rules (edit script args)
npm run rules:delete-all  # Delete all rules
```

## Rule Syntax

Rules use the same operators as X search queries:

| Rule | Matches |
|------|---------|
| `#python` | Posts with #python hashtag |
| `from:elonmusk` | Posts by @elonmusk |
| `"breaking news" has:images` | Posts with exact phrase and images |
| `(@XDevelopers OR @X) -is:retweet` | Mentions, excluding retweets |
| `(AI OR "machine learning") lang:en` | AI-related English Posts |
| `#tech has:links -is:retweet -is:reply` | Tech posts with links, no RTs/replies |

See the full [operator reference](https://docs.x.com/x-api/posts/filtered-stream/integrate/operators).

## Access Levels

| Feature | Pay-per-use | Enterprise |
|---------|-------------|------------|
| Rules per project | 1,000 | 25,000+ |
| Rule length | 1,024 chars | 2,048 chars |
| Connections | 1 | Multiple + redundant |
| Backfill | - | Up to 5 minutes |
| Recovery | - | Up to 24 hours |

## Reconnection Strategy

The app uses different backoff strategies depending on the error type, following X's official recommendations:

| Error Type | Strategy | Initial Delay | Max Delay |
|------------|----------|---------------|-----------|
| TCP/IP / Network | Linear (+250ms/attempt) | 250ms | 16s |
| HTTP (4xx/5xx) | Exponential (2x) | 5s | 320s |
| Rate Limit (429) | Exponential (2x) | 60s | No cap |

## Architecture

```
Stream Connection ──→ FIFO Queue ──→ Processing (formatter + output)
     (lightweight)      (buffer)        (heavy work, async)
```

The FIFO queue decouples stream ingestion from processing, ensuring the connection is never slowed by output formatting or I/O. This prevents server-side buffer buildup that would cause the connection to drop.

## Configuration

Run `node src/index.js setup` for interactive configuration, or set environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `X_BEARER_TOKEN` | Your X API Bearer Token | *required* |
| `STREAM_BACKFILL_MINUTES` | Backfill on reconnect (0-5, Enterprise) | `0` |
| `STREAM_TWEET_FIELDS` | Tweet fields to include | `author_id,created_at,lang,...` |
| `STREAM_EXPANSIONS` | Data expansions | `author_id` |
| `STREAM_USER_FIELDS` | User fields to include | `name,username,...` |
| `MAX_RECONNECT_ATTEMPTS` | Max reconnection retries | `10` |
| `VOLUME_TRACKING_INTERVAL_MS` | Volume check interval (ms) | `60000` |
| `VOLUME_ALERT_THRESHOLD_PERCENT` | Alert on volume drop (%) | `50` |

## Project Structure

```
src/
  index.js              # CLI entry point and command routing
  lib/
    config.js           # Configuration and validation
    client.js           # X API HTTP client with User-Agent
    package-info.js     # Package name/version for User-Agent header
  handlers/
    setup.js            # Interactive setup wizard with token validation
    rules.js            # Stream rules CRUD operations
    stream.js           # Filtered Stream with FIFO queue, reconnection,
                        #   volume tracking, deduplication, and recovery
    formatter.js        # Post output formatters (pretty, compact, JSON)
  __tests__/
    rules.test.js       # Unit tests (21 tests)
examples/
  rules.json            # Sample filter rules
```

## How It Works

1. **Setup** — Run `setup` to configure and validate your Bearer Token
2. **Create rules** — Define filter rules using operators via the CLI
3. **Connect to stream** — Opens a persistent HTTP connection to `GET /2/tweets/search/stream`
4. **FIFO queue** — Incoming data is pushed to a queue, processed asynchronously
5. **Receive Posts** — Matching Posts arrive in near real-time (~6-7s P99 latency)
6. **Deduplication** — Duplicate Post IDs (from backfill/recovery) are filtered out
7. **Volume monitoring** — Tracks throughput and alerts on significant drops
8. **Auto-reconnect** — On disconnect, uses the appropriate backoff strategy per error type
9. **Backfill** — On reconnect, requests missed Posts (if Enterprise + configured)
10. **Recovery** — For longer outages, replay a time window up to 24 hours

The stream sends keep-alive signals (`\r\n`) every 20 seconds. If nothing is received for 20 seconds, the app triggers automatic reconnection.

## Running Tests

```bash
npm test
```

## License

MIT
