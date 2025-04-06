import Twitter from 'twitter-api-v2';
import { Config, TwitterError, TwitterUser, Tweet, TwitterList } from './types';

export class TwitterClient {
  private client: Twitter;

  constructor(config: Config) {
    this.client = new Twitter({
      appKey: config.apiKey,
      appSecret: config.apiSecretKey,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });
  }

  /**
   * Post a new tweet
   */
  async postTweet(text: string): Promise<{ id: string }> {
    try {
      const { data } = await this.client.v2.tweet(text);
      return { id: data.id };
    } catch (error) {
      this.handleTwitterError(error);
      throw error; // TypeScript needs this
    }
  }

  /**
   * Search for tweets
   */
  async searchTweets(query: string, count: number): Promise<{ tweets: Tweet[]; users: Record<string, TwitterUser> }> {
    try {
      const result = await this.client.v2.search(query, {
        max_results: count,
        'tweet.fields': 'created_at,public_metrics,author_id',
        'user.fields': 'profile_image_url,description,created_at,verified,public_metrics',
        expansions: 'author_id',
      });

      const tweets: Tweet[] = result.data.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id,
        createdAt: tweet.created_at,
        publicMetrics: {
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          replyCount: tweet.public_metrics?.reply_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0,
          quoteCount: tweet.public_metrics?.quote_count || 0,
        },
      }));

      const users: Record<string, TwitterUser> = {};
      result.includes.users?.forEach(user => {
        users[user.id] = {
          id: user.id,
          name: user.name,
          username: user.username,
          description: user.description,
          profileImageUrl: user.profile_image_url,
          verified: user.verified || false,
          followersCount: user.public_metrics?.followers_count || 0,
          followingCount: user.public_metrics?.following_count || 0,
          createdAt: user.created_at || '',
        };
      });

      return { tweets, users };
    } catch (error) {
      this.handleTwitterError(error);
      throw error; // TypeScript needs this
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(username?: string): Promise<TwitterUser> {
    try {
      const fields = 'profile_image_url,description,created_at,verified,public_metrics';
      
      // Get current user profile if no username is provided
      const user = username 
        ? await this.client.v2.userByUsername(username, { 'user.fields': fields })
        : await this.client.v2.me({ 'user.fields': fields });

      const userData = user.data;
      
      return {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        description: userData.description,
        profileImageUrl: userData.profile_image_url,
        verified: userData.verified || false,
        followersCount: userData.public_metrics?.followers_count || 0,
        followingCount: userData.public_metrics?.following_count || 0,
        createdAt: userData.created_at || '',
      };
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: {
    name?: string;
    description?: string;
    location?: string;
    url?: string;
  }): Promise<TwitterUser> {
    try {
      const result = await this.client.v1.updateAccountProfile(profileData);
      
      return {
        id: result.id_str,
        name: result.name,
        username: result.screen_name,
        description: result.description,
        profileImageUrl: result.profile_image_url_https,
        verified: result.verified,
        followersCount: result.followers_count,
        followingCount: result.friends_count,
        createdAt: result.created_at,
      };
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  async followUser(username: string): Promise<TwitterUser> {
    try {
      const result = await this.client.v2.follow(
        await this.getUserIdByUsername(username)
      );

      if (!result.data.following) {
        throw new TwitterError('Failed to follow user');
      }

      return this.getUserProfile(username);
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(username: string): Promise<TwitterUser> {
    try {
      const result = await this.client.v2.unfollow(
        await this.getUserIdByUsername(username)
      );

      if (!result.data.following) {
        return this.getUserProfile(username);
      } else {
        throw new TwitterError('Failed to unfollow user');
      }
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Get followers of a user
   */
  async getFollowers(username?: string, count: number = 20): Promise<TwitterUser[]> {
    try {
      const userId = username 
        ? await this.getUserIdByUsername(username)
        : (await this.client.v2.me()).data.id;

      const result = await this.client.v2.followers(userId, {
        max_results: count,
        'user.fields': 'profile_image_url,description,created_at,verified,public_metrics',
      });

      return result.data.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description,
        profileImageUrl: user.profile_image_url,
        verified: user.verified || false,
        followersCount: user.public_metrics?.followers_count || 0,
        followingCount: user.public_metrics?.following_count || 0,
        createdAt: user.created_at || '',
      }));
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(username?: string, count: number = 20): Promise<TwitterUser[]> {
    try {
      const userId = username 
        ? await this.getUserIdByUsername(username)
        : (await this.client.v2.me()).data.id;

      const result = await this.client.v2.following(userId, {
        max_results: count,
        'user.fields': 'profile_image_url,description,created_at,verified,public_metrics',
      });

      return result.data.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description,
        profileImageUrl: user.profile_image_url,
        verified: user.verified || false,
        followersCount: user.public_metrics?.followers_count || 0,
        followingCount: user.public_metrics?.following_count || 0,
        createdAt: user.created_at || '',
      }));
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Create a Twitter list
   */
  async createList(name: string, description?: string, isPrivate: boolean = false): Promise<TwitterList> {
    try {
      const result = await this.client.v2.createList({
        name,
        description,
        private: isPrivate,
      });

      return {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || '',
        memberCount: 0,
        followerCount: 0,
        private: result.data.private || false,
        ownerId: await this.getCurrentUserId(),
      };
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Get list information
   */
  async getListInfo(listId: string): Promise<TwitterList> {
    try {
      const result = await this.client.v2.list(listId, {
        'list.fields': 'follower_count,member_count,owner_id,private',
      });

      return {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description || '',
        memberCount: result.data.member_count || 0,
        followerCount: result.data.follower_count || 0,
        private: result.data.private || false,
        ownerId: result.data.owner_id || '',
      };
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Get user lists
   */
  async getUserLists(): Promise<TwitterList[]> {
    try {
      const userId = await this.getCurrentUserId();
      const result = await this.client.v2.listsOwned(userId, {
        'list.fields': 'follower_count,member_count,owner_id,private',
      });

      return result.data.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description || '',
        memberCount: list.member_count || 0,
        followerCount: list.follower_count || 0,
        private: list.private || false,
        ownerId: list.owner_id || userId,
      }));
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Helper: Get user ID by username
   */
  private async getUserIdByUsername(username: string): Promise<string> {
    try {
      const result = await this.client.v2.userByUsername(username);
      return result.data.id;
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Helper: Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    try {
      const result = await this.client.v2.me();
      return result.data.id;
    } catch (error) {
      this.handleTwitterError(error);
      throw error;
    }
  }

  /**
   * Error handler
   */
  private handleTwitterError(error: any): never {
    console.error('Twitter API error:', error);
    
    // Handle rate limiting
    if (error.code === 88 || (error.errors && error.errors[0]?.code === 88)) {
      throw new TwitterError('Twitter rate limit exceeded', 88, error);
    }
    
    // Handle auth errors
    if ([32, 89, 135, 215, 226].includes(error.code) || 
        (error.errors && [32, 89, 135, 215, 226].includes(error.errors[0]?.code))) {
      throw new TwitterError('Twitter authentication error', error.code || 0, error);
    }
    
    // For all other errors
    const message = error.message || 
                  (error.errors && error.errors[0]?.message) || 
                  'Unknown Twitter API error';
                  
    const code = error.code || 
               (error.errors && error.errors[0]?.code) || 
               0;
               
    throw new TwitterError(message, code, error);
  }
}