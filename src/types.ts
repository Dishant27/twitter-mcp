import z from 'zod';

// Base configuration
export const ConfigSchema = z.object({
  apiKey: z.string(),
  apiSecretKey: z.string(),
  accessToken: z.string(),
  accessTokenSecret: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

// Twitter API error
export class TwitterError extends Error {
  constructor(
    message: string,
    public readonly code: number = 0,
    public readonly data?: any
  ) {
    super(message);
    this.name = 'TwitterError';
  }

  static isRateLimit(error: TwitterError): boolean {
    return error.code === 88 || error.message.includes('rate limit');
  }
}

// Schemas for tool inputs
export const PostTweetSchema = z.object({
  text: z.string().max(280),
});

export const SearchTweetsSchema = z.object({
  query: z.string(),
  count: z.number().min(10).max(100),
});

// Account Management Schemas
export const GetProfileSchema = z.object({
  username: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().max(50).optional(),
  description: z.string().max(160).optional(),
  location: z.string().max(30).optional(),
  url: z.string().url().max(100).optional(),
}).refine(
  data => Object.keys(data).length > 0,
  { message: "At least one profile field must be provided" }
);

export const FollowUserSchema = z.object({
  username: z.string(),
});

export const UnfollowUserSchema = z.object({
  username: z.string(),
});

export const ListFollowersSchema = z.object({
  username: z.string().optional(),
  count: z.number().min(1).max(200).default(20),
});

export const ListFollowingSchema = z.object({
  username: z.string().optional(),
  count: z.number().min(1).max(200).default(20),
});

export const CreateListSchema = z.object({
  name: z.string().max(25),
  description: z.string().max(100).optional(),
  private: z.boolean().default(false),
});

export const ListInfoSchema = z.object({
  listId: z.string(),
});

// Types for Twitter responses
export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  profileImageUrl?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  publicMetrics: {
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    quoteCount: number;
  };
}

export interface TwitterList {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  followerCount: number;
  private: boolean;
  ownerId: string;
}