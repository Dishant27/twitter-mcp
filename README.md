# Twitter MCP Server

This MCP server allows Clients to interact with Twitter, enabling comprehensive Twitter operations including posting tweets, searching Twitter, managing accounts, and organizing lists.

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

## Claude Configuration

To use this server with Claude, you'll need to set up the MCP configuration. Here's an example of how the configuration structure should look:

```json
{
  "name": "twitter",
  "display_name": "Twitter",
  "description": "Twitter MCP allows Claude to interact with Twitter",
  "path": "path/to/twitter-mcp/dist/index.js",
  "startup": {
    "env": {
      "TWITTER_API_KEY": "your_twitter_api_key",
      "TWITTER_API_SECRET": "your_twitter_api_secret",
      "TWITTER_ACCESS_TOKEN": "your_twitter_access_token",
      "TWITTER_ACCESS_TOKEN_SECRET": "your_twitter_access_token_secret"
    }
  },
  "transport": "stdio"
}
```

Save this configuration in your Claude MCP config directory, typically located at:
- Windows: `%APPDATA%\AnthropicClaude\mcp-servers`
- macOS: `~/Library/Application Support/AnthropicClaude/mcp-servers`
- Linux: `~/.config/AnthropicClaude/mcp-servers`

## Features

### Tweet Operations
- Post tweets with text content (up to 280 characters)
- Search for tweets by query with customizable result count

### Account Management
- Get profile information for any user or the authenticated account
- Update profile details (name, bio, location, website URL)
- Follow and unfollow Twitter users
- List followers for any user or the authenticated account
- List accounts that a user is following

### List Management
- Create new Twitter lists (public or private)
- Get information about specific Twitter lists
- Retrieve all lists owned by the authenticated user

## Available MCP Tools

| Tool Name | Description |
|-----------|-------------|
| `post_tweet` | Post a new tweet to Twitter |
| `search_tweets` | Search for tweets on Twitter |
| `get_profile` | Get Twitter profile information for a user or the authenticated account |
| `update_profile` | Update the authenticated user's Twitter profile |
| `follow_user` | Follow a Twitter user |
| `unfollow_user` | Unfollow a Twitter user |
| `list_followers` | List followers of a Twitter user or the authenticated account |
| `list_following` | List accounts that a Twitter user or the authenticated account is following |
| `create_list` | Create a new Twitter list |
| `get_list_info` | Get information about a Twitter list |
| `get_user_lists` | Get all lists owned by the authenticated user |

## Requirements

- Node.js 18.x or higher
- Twitter Developer account with API keys
- Twitter API v1 and v2 access

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TWITTER_API_KEY` | Your Twitter API key |
| `TWITTER_API_SECRET` | Your Twitter API secret |
| `TWITTER_ACCESS_TOKEN` | Your Twitter access token |
| `TWITTER_ACCESS_TOKEN_SECRET` | Your Twitter access token secret |

## Repository Structure

```
twitter-mcp/
├── .github/
│   └── workflows/
│       ├── publish.yml
│       └── release.yml
├── code/
│   ├── account_management.py  # Sample Python code for account management
│   ├── post_tweet.py          # Sample Python code for posting tweets
│   └── retrieve_tweets.py     # Sample Python code for retrieving tweets
├── src/
│   ├── index.ts        # Main entry point
│   ├── twitter-api.ts  # Twitter API client
│   ├── formatter.ts    # Response formatter
│   └── types.ts        # Type definitions
├── .env.example
├── .gitignore
├── Dockerfile
├── LICENSE
├── package.json
├── README.md
└── tsconfig.json
```

## License

MIT