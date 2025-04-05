# Twitter MCP Server

This MCP server allows Clients to interact with Twitter, enabling posting tweets and searching Twitter.

## Quick Start

1. Create a Twitter Developer account and get your API keys from [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Set all required API keys in the environment variables
3. Clone this repository: `git clone https://github.com/Dishant27/twitter-mcp.git`
4. Install dependencies: `npm install`
5. Run the server:
- With environment variables:
```bash
TWITTER_API_KEY=your_api_key \
TWITTER_API_SECRET=your_api_secret \
TWITTER_ACCESS_TOKEN=your_access_token \
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret \
npm start
```
- Using a `.env` file:
```bash
# Create a .env file with your Twitter API keys
echo "TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret" > .env

# Start the server
npm start
```

6. Use with a MCP client, such as Claude.

## Features

- Post tweets with text
- Search for tweets by query

## Requirements

- Node.js 18.x or higher
- Twitter Developer account with API keys

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TWITTER_API_KEY` | Your Twitter API key |
| `TWITTER_API_SECRET` | Your Twitter API secret |
| `TWITTER_ACCESS_TOKEN` | Your Twitter access token |
| `TWITTER_ACCESS_TOKEN_SECRET` | Your Twitter access token secret |

## License

MIT