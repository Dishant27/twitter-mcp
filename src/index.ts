#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
  ErrorCode,
  McpError,
  TextContent
} from '@modelcontextprotocol/sdk/types.js';
import { TwitterClient } from './twitter-api.js';
import { ResponseFormatter } from './formatter.js';
import {
  Config, ConfigSchema,
  PostTweetSchema, SearchTweetsSchema,
  GetProfileSchema, UpdateProfileSchema,
  FollowUserSchema, UnfollowUserSchema,
  ListFollowersSchema, ListFollowingSchema,
  CreateListSchema, ListInfoSchema,
  TwitterError
} from './types.js';
import dotenv from 'dotenv';

export class TwitterServer {
  private server: Server;
  private client: TwitterClient;

  constructor(config: Config) {
    // Validate config
    const result = ConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.client = new TwitterClient(config);
    this.server = new Server({
      name: 'twitter-mcp',
      version: '1.0.0'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Error handler
    this.server.onerror = (error) => {
      console.error('[MCP Error]:', error);
    };

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down server...');
      await this.server.close();
      process.exit(0);
    });

    // Register tool handlers
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Tweet operations
        {
          name: 'post_tweet',
          description: 'Post a new tweet to Twitter',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'The content of your tweet',
                maxLength: 280
              }
            },
            required: ['text']
          }
        } as Tool,
        {
          name: 'search_tweets',
          description: 'Search for tweets on Twitter',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              count: {
                type: 'number',
                description: 'Number of tweets to return (10-100)',
                minimum: 10,
                maximum: 100
              }
            },
            required: ['query', 'count']
          }
        } as Tool,
        
        // Account management operations
        {
          name: 'get_profile',
          description: 'Get Twitter profile information for a user or the authenticated account',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Twitter username (if not provided, returns authenticated user profile)'
              }
            },
            required: []
          }
        } as Tool,
        {
          name: 'update_profile',
          description: 'Update the authenticated user\'s Twitter profile',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Display name (max 50 chars)'
              },
              description: {
                type: 'string',
                description: 'Bio (max 160 chars)'
              },
              location: {
                type: 'string',
                description: 'Location (max 30 chars)'
              },
              url: {
                type: 'string',
                description: 'Website URL (max 100 chars)'
              }
            },
            required: []
          }
        } as Tool,
        {
          name: 'follow_user',
          description: 'Follow a Twitter user',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Twitter username to follow'
              }
            },
            required: ['username']
          }
        } as Tool,
        {
          name: 'unfollow_user',
          description: 'Unfollow a Twitter user',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Twitter username to unfollow'
              }
            },
            required: ['username']
          }
        } as Tool,
        {
          name: 'list_followers',
          description: 'List followers of a Twitter user or the authenticated account',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Twitter username (if not provided, returns authenticated user\'s followers)'
              },
              count: {
                type: 'number',
                description: 'Number of followers to return (1-200)',
                minimum: 1,
                maximum: 200,
                default: 20
              }
            },
            required: []
          }
        } as Tool,
        {
          name: 'list_following',
          description: 'List accounts that a Twitter user or the authenticated account is following',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Twitter username (if not provided, returns authenticated user\'s following)'
              },
              count: {
                type: 'number',
                description: 'Number of accounts to return (1-200)',
                minimum: 1,
                maximum: 200,
                default: 20
              }
            },
            required: []
          }
        } as Tool,
        {
          name: 'create_list',
          description: 'Create a new Twitter list',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'List name (max 25 chars)'
              },
              description: {
                type: 'string',
                description: 'List description (max 100 chars)'
              },
              private: {
                type: 'boolean',
                description: 'Whether the list should be private (default: false)'
              }
            },
            required: ['name']
          }
        } as Tool,
        {
          name: 'get_list_info',
          description: 'Get information about a Twitter list',
          inputSchema: {
            type: 'object',
            properties: {
              listId: {
                type: 'string',
                description: 'Twitter list ID'
              }
            },
            required: ['listId']
          }
        } as Tool,
        {
          name: 'get_user_lists',
          description: 'Get all lists owned by the authenticated user',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        } as Tool
      ]
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.error(`Tool called: ${name}`, args);

      try {
        switch (name) {
          // Tweet operations
          case 'post_tweet':
            return await this.handlePostTweet(args);
          case 'search_tweets':
            return await this.handleSearchTweets(args);
            
          // Account management operations
          case 'get_profile':
            return await this.handleGetProfile(args);
          case 'update_profile':
            return await this.handleUpdateProfile(args);
          case 'follow_user':
            return await this.handleFollowUser(args);
          case 'unfollow_user':
            return await this.handleUnfollowUser(args);
          case 'list_followers':
            return await this.handleListFollowers(args);
          case 'list_following':
            return await this.handleListFollowing(args);
          case 'create_list':
            return await this.handleCreateList(args);
          case 'get_list_info':
            return await this.handleGetListInfo(args);
          case 'get_user_lists':
            return await this.handleGetUserLists(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  // Tweet operations handlers
  private async handlePostTweet(args: unknown) {
    const result = PostTweetSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const tweet = await this.client.postTweet(result.data.text);
    return {
      content: [{
        type: 'text',
        text: `Tweet posted successfully!\nURL: https://twitter.com/status/${tweet.id}`
      }] as TextContent[]
    };
  }

  private async handleSearchTweets(args: unknown) {
    const result = SearchTweetsSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const { tweets, users } = await this.client.searchTweets(
      result.data.query,
      result.data.count
    );

    const formattedResponse = ResponseFormatter.formatSearchResponse(
      result.data.query,
      tweets,
      users
    );

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  // Account management operations handlers
  private async handleGetProfile(args: unknown) {
    const result = GetProfileSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const profile = await this.client.getUserProfile(result.data.username);
    const formattedResponse = ResponseFormatter.formatUserProfile(profile);

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleUpdateProfile(args: unknown) {
    const result = UpdateProfileSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const updatedProfile = await this.client.updateProfile({
      name: result.data.name,
      description: result.data.description,
      location: result.data.location,
      url: result.data.url
    });

    const formattedResponse = `Profile updated successfully!\n\n${ResponseFormatter.formatUserProfile(updatedProfile)}`;

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleFollowUser(args: unknown) {
    const result = FollowUserSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const user = await this.client.followUser(result.data.username);
    const formattedResponse = `Successfully followed @${user.username}!\n\n${ResponseFormatter.formatUserProfile(user)}`;

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleUnfollowUser(args: unknown) {
    const result = UnfollowUserSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const user = await this.client.unfollowUser(result.data.username);
    const formattedResponse = `Successfully unfollowed @${user.username}!\n\n${ResponseFormatter.formatUserProfile(user)}`;

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleListFollowers(args: unknown) {
    const result = ListFollowersSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const followers = await this.client.getFollowers(
      result.data.username,
      result.data.count
    );

    const formattedResponse = ResponseFormatter.formatUsersList(followers, 'followers');

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleListFollowing(args: unknown) {
    const result = ListFollowingSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const following = await this.client.getFollowing(
      result.data.username,
      result.data.count
    );

    const formattedResponse = ResponseFormatter.formatUsersList(following, 'following');

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleCreateList(args: unknown) {
    const result = CreateListSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const list = await this.client.createList(
      result.data.name,
      result.data.description,
      result.data.private
    );

    const formattedResponse = `List "${list.name}" created successfully!\n\n${ResponseFormatter.formatListInfo(list)}`;

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleGetListInfo(args: unknown) {
    const result = ListInfoSchema.safeParse(args);
    if (!result.success) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${result.error.message}`
      );
    }

    const list = await this.client.getListInfo(result.data.listId);
    const formattedResponse = ResponseFormatter.formatListInfo(list);

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private async handleGetUserLists(args: unknown) {
    // No parameters needed for this endpoint
    const lists = await this.client.getUserLists();
    const formattedResponse = ResponseFormatter.formatLists(lists);

    return {
      content: [{
        type: 'text',
        text: ResponseFormatter.toMcpResponse(formattedResponse)
      }] as TextContent[]
    };
  }

  private handleError(error: unknown) {
    if (error instanceof McpError) {
      throw error;
    }

    if (error instanceof TwitterError) {
      if (TwitterError.isRateLimit(error)) {
        return {
          content: [{
            type: 'text',
            text: 'Rate limit exceeded. Please wait a moment before trying again.',
            isError: true
          }] as TextContent[]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `Twitter API error: ${(error as TwitterError).message}`,
          isError: true
        }] as TextContent[]
      };
    }

    console.error('Unexpected error:', error);
    throw new McpError(
      ErrorCode.InternalError,
      'An unexpected error occurred'
    );
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
  apiKey: process.env.TWITTER_API_KEY!,
  apiSecretKey: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!
};

const server = new TwitterServer(config);
server.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});