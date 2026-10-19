#!/usr/bin/env node
/**
 * X (Twitter) MCP server
 *
 * Stdio MCP server: stdout carries the JSON-RPC protocol, so all logging goes
 * to stderr (console.error). Never write to stdout from this process.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { TwitterClient } from './twitter-api.js';
import { ResponseFormatter } from './formatter.js';
import { Config, ConfigSchema, TwitterError } from './types.js';

function text(body: string): CallToolResult {
  return { content: [{ type: 'text', text: ResponseFormatter.toMcpResponse(body) }] };
}

export class TwitterServer {
  private server: McpServer;
  private client: TwitterClient;

  constructor(config: Config) {
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      // Only report which fields are missing/invalid; never echo values.
      const fields = result.error.issues.map(i => i.path.join('.')).join(', ');
      throw new Error(`Invalid configuration: missing or invalid ${fields}`);
    }

    this.client = new TwitterClient(result.data);
    this.server = new McpServer(
      { name: 'twitter-mcp', version: '1.1.0' },
      { capabilities: { tools: {} } }
    );

    this.server.server.onerror = (error) => {
      console.error('[MCP Error]:', error instanceof Error ? error.message : error);
    };

    process.on('SIGINT', async () => {
      console.error('Shutting down server...');
      await this.server.close();
      process.exit(0);
    });

    this.registerTools();
  }

  /** Run a tool body, logging the tool name and mapping errors to tool results. */
  private async run(name: string, fn: () => Promise<CallToolResult>): Promise<CallToolResult> {
    console.error(`Tool called: ${name}`);
    try {
      return await fn();
    } catch (error) {
      return this.handleError(error);
    }
  }

  private registerTools(): void {
    // Tweet operations
    this.server.registerTool(
      'post_tweet',
      {
        description: 'Post a new tweet to Twitter',
        inputSchema: {
          text: z.string().max(280).describe('The content of your tweet')
        }
      },
      async ({ text: body }) => this.run('post_tweet', async () => {
        const tweet = await this.client.postTweet(body);
        return text(`Tweet posted successfully!\nURL: https://twitter.com/status/${tweet.id}`);
      })
    );

    this.server.registerTool(
      'search_tweets',
      {
        description: 'Search for tweets on Twitter',
        inputSchema: {
          query: z.string().describe('Search query'),
          count: z.number().min(10).max(100).describe('Number of tweets to return (10-100)')
        }
      },
      async ({ query, count }) => this.run('search_tweets', async () => {
        const { tweets, users } = await this.client.searchTweets(query, count);
        return text(ResponseFormatter.formatSearchResponse(query, tweets, users));
      })
    );

    // Account management operations
    this.server.registerTool(
      'get_profile',
      {
        description: 'Get Twitter profile information for a user or the authenticated account',
        inputSchema: {
          username: z.string().optional()
            .describe('Twitter username (if not provided, returns authenticated user profile)')
        }
      },
      async ({ username }) => this.run('get_profile', async () => {
        const profile = await this.client.getUserProfile(username);
        return text(ResponseFormatter.formatUserProfile(profile));
      })
    );

    this.server.registerTool(
      'update_profile',
      {
        description: 'Update the authenticated user\'s Twitter profile',
        inputSchema: {
          name: z.string().max(50).optional().describe('Display name (max 50 chars)'),
          description: z.string().max(160).optional().describe('Bio (max 160 chars)'),
          location: z.string().max(30).optional().describe('Location (max 30 chars)'),
          url: z.string().url().max(100).optional().describe('Website URL (max 100 chars)')
        }
      },
      async (args) => this.run('update_profile', async () => {
        const { name, description, location, url } = args;
        if ([name, description, location, url].every(v => v === undefined)) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Invalid parameters: At least one profile field must be provided' }]
          };
        }
        const updated = await this.client.updateProfile({ name, description, location, url });
        return text(`Profile updated successfully!\n\n${ResponseFormatter.formatUserProfile(updated)}`);
      })
    );

    this.server.registerTool(
      'follow_user',
      {
        description: 'Follow a Twitter user',
        inputSchema: {
          username: z.string().describe('Twitter username to follow')
        }
      },
      async ({ username }) => this.run('follow_user', async () => {
        const user = await this.client.followUser(username);
        return text(`Successfully followed @${user.username}!\n\n${ResponseFormatter.formatUserProfile(user)}`);
      })
    );

    this.server.registerTool(
      'unfollow_user',
      {
        description: 'Unfollow a Twitter user',
        inputSchema: {
          username: z.string().describe('Twitter username to unfollow')
        }
      },
      async ({ username }) => this.run('unfollow_user', async () => {
        const user = await this.client.unfollowUser(username);
        return text(`Successfully unfollowed @${user.username}!\n\n${ResponseFormatter.formatUserProfile(user)}`);
      })
    );

    this.server.registerTool(
      'list_followers',
      {
        description: 'List followers of a Twitter user or the authenticated account',
        inputSchema: {
          username: z.string().optional()
            .describe('Twitter username (if not provided, returns authenticated user\'s followers)'),
          count: z.number().min(1).max(200).default(20)
            .describe('Number of followers to return (1-200)')
        }
      },
      async ({ username, count }) => this.run('list_followers', async () => {
        const followers = await this.client.getFollowers(username, count);
        return text(ResponseFormatter.formatUsersList(followers, 'followers'));
      })
    );

    this.server.registerTool(
      'list_following',
      {
        description: 'List accounts that a Twitter user or the authenticated account is following',
        inputSchema: {
          username: z.string().optional()
            .describe('Twitter username (if not provided, returns authenticated user\'s following)'),
          count: z.number().min(1).max(200).default(20)
            .describe('Number of accounts to return (1-200)')
        }
      },
      async ({ username, count }) => this.run('list_following', async () => {
        const following = await this.client.getFollowing(username, count);
        return text(ResponseFormatter.formatUsersList(following, 'following'));
      })
    );

    // List operations
    this.server.registerTool(
      'create_list',
      {
        description: 'Create a new Twitter list',
        inputSchema: {
          name: z.string().max(25).describe('List name (max 25 chars)'),
          description: z.string().max(100).optional().describe('List description (max 100 chars)'),
          private: z.boolean().default(false).describe('Whether the list should be private (default: false)')
        }
      },
      async ({ name, description, private: isPrivate }) => this.run('create_list', async () => {
        const list = await this.client.createList(name, description, isPrivate);
        return text(`List "${list.name}" created successfully!\n\n${ResponseFormatter.formatListInfo(list)}`);
      })
    );

    this.server.registerTool(
      'get_list_info',
      {
        description: 'Get information about a Twitter list',
        inputSchema: {
          listId: z.string().describe('Twitter list ID')
        }
      },
      async ({ listId }) => this.run('get_list_info', async () => {
        const list = await this.client.getListInfo(listId);
        return text(ResponseFormatter.formatListInfo(list));
      })
    );

    this.server.registerTool(
      'get_user_lists',
      {
        description: 'Get all lists owned by the authenticated user',
        inputSchema: {}
      },
      async () => this.run('get_user_lists', async () => {
        const lists = await this.client.getUserLists();
        return text(ResponseFormatter.formatLists(lists));
      })
    );
  }

  private handleError(error: unknown): CallToolResult {
    if (error instanceof TwitterError) {
      if (TwitterError.isRateLimit(error)) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'Rate limit exceeded. Please wait a moment before trying again.' }]
        };
      }
      return {
        isError: true,
        content: [{ type: 'text', text: `Twitter API error: ${error.message}` }]
      };
    }

    console.error('Unexpected error:', error instanceof Error ? error.message : String(error));
    return {
      isError: true,
      content: [{ type: 'text', text: 'An unexpected error occurred' }]
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Twitter MCP server running on stdio');
  }
}

// Start the server
dotenv.config();

const config = {
  apiKey: process.env.TWITTER_API_KEY,
  apiSecretKey: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
};

try {
  const server = new TwitterServer(config as Config);
  server.start().catch(error => {
    console.error('Failed to start server:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
} catch (error) {
  console.error('Failed to start server:', error instanceof Error ? error.message : error);
  process.exit(1);
}
