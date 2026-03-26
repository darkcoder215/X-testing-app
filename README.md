# X Filtered Stream

Stream near real-time Posts from X (formerly Twitter) matching your filter rules using the [Filtered Stream API v2](https://docs.x.com/x-api/posts/filtered-stream/introduction).

## Features

- **Real-time streaming** — Receive Posts within seconds of publication
- **Persistent rules** — Add and remove filter rules without disconnecting
- **Powerful operators** — Match on keywords, hashtags, users, language, and more
- **Auto-reconnection** — Exponential backoff with keep-alive monitoring
- **Multiple output formats** — Pretty-print, compact, or JSON output
- **Bulk rule management** — Load rules from JSON files
- **Zero dependencies** (beyond `dotenv`) — Uses native Node.js `fetch` and streams

## Prerequisites

- **Node.js 18+** (uses native `fetch` and `ReadableStream`)
- An approved [X Developer Account](https://developer.x.com/en/portal/petition/essential/basic-info)
- A [Project and App](https://developer.x.com/en/portal/dashboard) with a Bearer Token

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure your Bearer Token
cp .env.example .env
# Edit .env and add your X_BEARER_TOKEN

# 3. Add a rule
node src/index.js rules add "#AI lang:en -is:retweet" --tag="AI tweets"

# 4. Start streaming
node src/index.js stream
```

## Usage

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
| Connections | 1 | Multiple |

## Configuration

All configuration is done via environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `X_BEARER_TOKEN` | Your X API Bearer Token | *required* |
| `STREAM_TWEET_FIELDS` | Tweet fields to include | `author_id,created_at,lang,...` |
| `STREAM_EXPANSIONS` | Data expansions | `author_id` |
| `STREAM_USER_FIELDS` | User fields to include | `name,username,...` |
| `MAX_RECONNECT_ATTEMPTS` | Max reconnection retries | `10` |
| `INITIAL_RECONNECT_DELAY_MS` | Initial retry delay (ms) | `1000` |

## Project Structure

```
src/
  index.js              # CLI entry point and command routing
  lib/
    config.js           # Configuration from environment
    client.js           # X API HTTP client (auth, requests, streaming)
  handlers/
    rules.js            # Stream rules CRUD operations
    stream.js           # Filtered Stream connection and processing
    formatter.js        # Post output formatters (pretty, compact, JSON)
  __tests__/
    rules.test.js       # Unit tests
examples/
  rules.json            # Sample filter rules
```

## How It Works

1. **Create rules** — Define filter rules using operators via the CLI
2. **Connect to stream** — The app opens a persistent HTTP connection to `GET /2/tweets/search/stream`
3. **Receive Posts** — Matching Posts arrive in near real-time (~6-7s P99 latency)
4. **Auto-reconnect** — If the connection drops, reconnects with exponential backoff

The stream sends keep-alive signals (`\r\n`) every 20 seconds. If nothing is received for 30 seconds, the app automatically reconnects.

## Running Tests

```bash
npm test
```

## License

MIT
