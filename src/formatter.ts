import { Tweet, TwitterUser, TwitterList } from './types';

export class ResponseFormatter {
  /**
   * Format search response
   */
  static formatSearchResponse(
    query: string,
    tweets: Tweet[],
    users: Record<string, TwitterUser>
  ): string {
    let response = `Search results for "${query}":\n\n`;

    if (tweets.length === 0) {
      return response + 'No tweets found matching your query.';
    }

    tweets.forEach((tweet, index) => {
      const user = users[tweet.authorId];
      response += `${index + 1}. @${user?.username || 'Unknown'} `;
      if (user?.verified) response += '✓ ';
      response += `(${user?.name || 'Unknown'}):\n`;
      response += `${tweet.text}\n`;
      response += `🔁 ${tweet.publicMetrics.retweetCount} | ❤️ ${tweet.publicMetrics.likeCount} | 💬 ${tweet.publicMetrics.replyCount}\n`;
      response += `🔗 https://twitter.com/${user?.username}/status/${tweet.id}\n\n`;
    });

    return response;
  }

  /**
   * Format user profile
   */
  static formatUserProfile(user: TwitterUser): string {
    let response = `Profile for @${user.username} `;
    if (user.verified) response += '✓';
    response += `\n\n`;
    
    response += `Name: ${user.name}\n`;
    if (user.description) response += `Bio: ${user.description}\n`;
    response += `Followers: ${user.followersCount.toLocaleString()} | Following: ${user.followingCount.toLocaleString()}\n`;
    response += `Account created: ${new Date(user.createdAt).toLocaleDateString()}\n`;
    response += `🔗 https://twitter.com/${user.username}\n`;
    
    return response;
  }

  /**
   * Format users list (followers or following)
   */
  static formatUsersList(users: TwitterUser[], listType: 'followers' | 'following'): string {
    const title = listType === 'followers' ? 'Followers' : 'Following';
    let response = `${title} (${users.length}):\n\n`;

    if (users.length === 0) {
      return response + `No ${listType.toLowerCase()} found.`;
    }

    users.forEach((user, index) => {
      response += `${index + 1}. @${user.username} `;
      if (user.verified) response += '✓ ';
      response += `(${user.name})\n`;
      if (user.description) {
        // Truncate description if too long
        const desc = user.description.length > 50 
          ? user.description.substring(0, 47) + '...' 
          : user.description;
        response += `   ${desc}\n`;
      }
      response += `   Followers: ${user.followersCount.toLocaleString()}\n\n`;
    });

    return response;
  }

  /**
   * Format Twitter lists
   */
  static formatLists(lists: TwitterList[]): string {
    let response = `Twitter Lists (${lists.length}):\n\n`;

    if (lists.length === 0) {
      return response + 'No lists found.';
    }

    lists.forEach((list, index) => {
      response += `${index + 1}. ${list.name} ${list.private ? '🔒' : ''}\n`;
      if (list.description) response += `   ${list.description}\n`;
      response += `   Members: ${list.memberCount.toLocaleString()} | Followers: ${list.followerCount.toLocaleString()}\n\n`;
    });

    return response;
  }

  /**
   * Format Twitter list info
   */
  static formatListInfo(list: TwitterList): string {
    let response = `List: ${list.name} ${list.private ? '🔒' : ''}\n\n`;
    
    if (list.description) response += `Description: ${list.description}\n`;
    response += `Privacy: ${list.private ? 'Private' : 'Public'}\n`;
    response += `Members: ${list.memberCount.toLocaleString()}\n`;
    response += `Followers: ${list.followerCount.toLocaleString()}\n`;
    response += `🔗 https://twitter.com/i/lists/${list.id}\n`;
    
    return response;
  }

  /**
   * Format response for MCP
   */
  static toMcpResponse(text: string): string {
    return text;
  }
}