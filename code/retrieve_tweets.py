#!/usr/bin/env python3
"""
Sample code to retrieve tweets using Twitter API
"""

import tweepy
import json

def setup_twitter_client():
    """
    Setup Twitter API client with authentication
    """
    # Replace these placeholder values with your actual Twitter API credentials
    consumer_key = "YOUR_CONSUMER_KEY"
    consumer_secret = "YOUR_CONSUMER_SECRET"
    access_token = "YOUR_ACCESS_TOKEN"
    access_token_secret = "YOUR_ACCESS_TOKEN_SECRET"
    
    # Authenticate to Twitter
    auth = tweepy.OAuth1UserHandler(
        consumer_key, consumer_secret, access_token, access_token_secret
    )
    
    # Create API object
    api = tweepy.API(auth)
    
    return api

def get_user_timeline(api, username, count=10):
    """
    Retrieve recent tweets from a user's timeline
    
    Args:
        api: Authenticated tweepy API object
        username: Twitter username to retrieve tweets from
        count: Number of tweets to retrieve (default: 10)
        
    Returns:
        List of tweets
    """
    try:
        tweets = api.user_timeline(screen_name=username, count=count, tweet_mode="extended")
        return tweets
    except Exception as e:
        print(f"Error retrieving tweets for {username}: {e}")
        return []

def search_tweets(api, query, count=10):
    """
    Search for tweets matching a query
    
    Args:
        api: Authenticated tweepy API object
        query: Search query string
        count: Number of tweets to retrieve (default: 10)
        
    Returns:
        List of tweets matching the query
    """
    try:
        tweets = api.search_tweets(q=query, count=count, tweet_mode="extended")
        return tweets
    except Exception as e:
        print(f"Error searching for tweets with query '{query}': {e}")
        return []

def display_tweets(tweets):
    """
    Pretty print tweet information
    """
    for tweet in tweets:
        print(f"\n{'=' * 50}")
        print(f"User: @{tweet.user.screen_name}")
        print(f"Tweet ID: {tweet.id}")
        print(f"Created at: {tweet.created_at}")
        print(f"Content: {tweet.full_text}")
        print(f"Retweets: {tweet.retweet_count}, Likes: {tweet.favorite_count}")

def main():
    # Setup Twitter client
    api = setup_twitter_client()
    
    # Example 1: Get tweets from a user's timeline
    username = "twitter"
    print(f"\nRetrieving recent tweets from @{username}...")
    user_tweets = get_user_timeline(api, username, count=5)
    display_tweets(user_tweets)
    
    # Example 2: Search for tweets based on a query
    search_query = "#Python"
    print(f"\nSearching for tweets with query '{search_query}'...")
    search_results = search_tweets(api, search_query, count=5)
    display_tweets(search_results)

if __name__ == "__main__":
    main()
