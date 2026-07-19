import {
  ErrorCode,
  McpError,
  TextContent,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { TwitterError, XquikSearchSchema } from './types';

export interface XquikSearchParams {
  query: string;
  count: number;
  queryType: 'Latest' | 'Top';
  cursor?: string;
  sinceTime?: string;
  untilTime?: string;
}

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export const XQUIK_SEARCH_TOOL: Tool = {
  name: 'xquik_search_tweets',
  description: 'Search X posts through Xquik when XQUIK_API_KEY is configured',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      count: {
        type: 'number',
        description: 'Number of posts to return (1-100)',
        minimum: 1,
        maximum: 100,
        default: 10,
      },
      queryType: {
        type: 'string',
        description: 'Search mode',
        enum: ['Latest', 'Top'],
        default: 'Latest',
      },
      cursor: {
        type: 'string',
        description: 'Optional pagination cursor',
      },
      sinceTime: {
        type: 'string',
        description: 'Optional lower time bound',
      },
      untilTime: {
        type: 'string',
        description: 'Optional upper time bound',
      },
    },
    required: ['query'],
  },
};

export class XquikClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://xquik.com',
    private readonly fetcher: Fetcher = fetch
  ) {}

  async searchTweets(params: XquikSearchParams): Promise<unknown> {
    const query = new URLSearchParams({
      q: params.query,
      queryType: params.queryType,
      limit: String(params.count),
    });

    if (params.cursor) {
      query.set('cursor', params.cursor);
    }
    if (params.sinceTime) {
      query.set('sinceTime', params.sinceTime);
    }
    if (params.untilTime) {
      query.set('untilTime', params.untilTime);
    }

    const response = await this.fetcher(
      `${this.baseUrl}/api/v1/x/tweets/search?${query.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'x-api-key': this.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new TwitterError(
        `Xquik search failed with status ${response.status}`,
        response.status
      );
    }

    return response.json();
  }
}

export async function handleXquikSearch(
  client: XquikClient | undefined,
  args: unknown
) {
  const result = XquikSearchSchema.safeParse(args);
  if (!result.success) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid parameters: ${result.error.message}`
    );
  }
  if (!client) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      'XQUIK_API_KEY is required for xquik_search_tweets'
    );
  }

  const data = await client.searchTweets(result.data);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ] as TextContent[],
  };
}
