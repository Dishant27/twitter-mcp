#!/usr/bin/env python3
"""
Sample code to post tweets using Twitter API
"""

import tweepy
import os
from datetime import datetime

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

def post_tweet(api, text):
    """
    Post a simple text tweet
    
    Args:
        api: Authenticated tweepy API object
        text: Tweet content (max 280 characters)
        
    Returns:
        Posted tweet object if successful, None otherwise
    """
    try:
        if len(text) > 280:
            print(f"Tweet is too long ({len(text)} characters). Maximum is 280 characters.")
            return None
            
        tweet = api.update_status(text)
        print(f"Tweet posted successfully! Tweet ID: {tweet.id}")
        return tweet
    except Exception as e:
        print(f"Error posting tweet: {e}")
        return None

def post_tweet_with_media(api, text, media_path):
    """
    Post a tweet with attached media (image, gif, or video)
    
    Args:
        api: Authenticated tweepy API object
        text: Tweet content
        media_path: Path to media file to upload
        
    Returns:
        Posted tweet object if successful, None otherwise
    """
    try:
        if not os.path.exists(media_path):
            print(f"Media file not found: {media_path}")
            return None
            
        # Upload media to Twitter
        media = api.media_upload(media_path)
        
        # Post tweet with media
        tweet = api.update_status(text, media_ids=[media.media_id])
        print(f"Tweet with media posted successfully! Tweet ID: {tweet.id}")
        return tweet
    except Exception as e:
        print(f"Error posting tweet with media: {e}")
        return None

def reply_to_tweet(api, tweet_id, reply_text):
    """
    Reply to an existing tweet
    
    Args:
        api: Authenticated tweepy API object
        tweet_id: ID of the tweet to reply to
        reply_text: Content of the reply
        
    Returns:
        Posted reply tweet object if successful, None otherwise
    """
    try:
        reply = api.update_status(
            status=reply_text,
            in_reply_to_status_id=tweet_id,
            auto_populate_reply_metadata=True
        )
        print(f"Reply posted successfully! Reply ID: {reply.id}")
        return reply
    except Exception as e:
        print(f"Error posting reply: {e}")
        return None

def main():
    # Setup Twitter client
    api = setup_twitter_client()
    
    # Example 1: Post a simple text tweet
    tweet_text = f"Testing the Twitter API with Python! #Python #TwitterAPI (posted at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"  
    tweet = post_tweet(api, tweet_text)
    
    if tweet:
        # Example 2: Reply to our own tweet
        reply_text = "This is a reply to my previous tweet using Python!"
        reply_to_tweet(api, tweet.id, reply_text)
    
    # Example 3: Post a tweet with media (uncomment to test)
    # media_path = "path/to/your/image.jpg"  # Replace with an actual path
    # post_tweet_with_media(api, "Check out this image! #Python", media_path)

if __name__ == "__main__":
    main()
