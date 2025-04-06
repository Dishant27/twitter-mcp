#!/usr/bin/env python3
"""
Sample code for Twitter account management operations
"""

import tweepy
import os
from PIL import Image
import io

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

def get_account_info(api):
    """
    Get information about the authenticated user's account
    
    Args:
        api: Authenticated tweepy API object
        
    Returns:
        User object containing account information
    """
    try:
        me = api.verify_credentials()
        print(f"Account information for @{me.screen_name}:")
        print(f"  - Display name: {me.name}")
        print(f"  - Bio: {me.description}")
        print(f"  - Location: {me.location}")
        print(f"  - Following: {me.friends_count}, Followers: {me.followers_count}")
        print(f"  - Tweets: {me.statuses_count}")
        print(f"  - Account created: {me.created_at}")
        return me
    except Exception as e:
        print(f"Error getting account information: {e}")
        return None

def update_profile(api, **kwargs):
    """
    Update the authenticated user's profile information
    
    Args:
        api: Authenticated tweepy API object
        kwargs: Optional fields to update (name, description, location, url)
        
    Returns:
        Updated user object if successful, None otherwise
    """
    try:
        # Only pass parameters that are provided
        update_params = {}
        
        if 'name' in kwargs:
            update_params['name'] = kwargs['name']
            
        if 'description' in kwargs:
            update_params['description'] = kwargs['description']
            
        if 'location' in kwargs:
            update_params['location'] = kwargs['location']
            
        if 'url' in kwargs:
            update_params['url'] = kwargs['url']
            
        # Update profile
        updated_user = api.update_profile(**update_params)
        
        print(f"Profile updated successfully for @{updated_user.screen_name}")
        return updated_user
    except Exception as e:
        print(f"Error updating profile: {e}")
        return None

def update_profile_image(api, image_path):
    """
    Update the authenticated user's profile image
    
    Args:
        api: Authenticated tweepy API object
        image_path: Path to the new profile image file
        
    Returns:
        Updated user object if successful, None otherwise
    """
    try:
        if not os.path.exists(image_path):
            print(f"Image file not found: {image_path}")
            return None
            
        # Check image size and format
        with Image.open(image_path) as img:
            width, height = img.size
            print(f"Image dimensions: {width}x{height}")
            
            # Twitter recommends 400x400 pixels for profile images
            if width < 400 or height < 400:
                print("Warning: Twitter recommends profile images of at least 400x400 pixels")
        
        # Update profile image
        updated_user = api.update_profile_image(filename=image_path)
        
        print(f"Profile image updated successfully for @{updated_user.screen_name}")
        return updated_user
    except Exception as e:
        print(f"Error updating profile image: {e}")
        return None

def update_profile_banner(api, banner_path):
    """
    Update the authenticated user's profile banner
    
    Args:
        api: Authenticated tweepy API object
        banner_path: Path to the new banner image file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        if not os.path.exists(banner_path):
            print(f"Banner file not found: {banner_path}")
            return False
            
        # Check image size and format
        with Image.open(banner_path) as img:
            width, height = img.size
            print(f"Banner dimensions: {width}x{height}")
            
            # Twitter recommends 1500x500 pixels for banners
            if width < 1500 or height < 500:
                print("Warning: Twitter recommends banner images of 1500x500 pixels")
        
        # Update profile banner
        api.update_profile_banner(filename=banner_path)
        
        print("Profile banner updated successfully")
        return True
    except Exception as e:
        print(f"Error updating profile banner: {e}")
        return False

def get_followers(api, count=20):
    """
    Get a list of users following the authenticated user
    
    Args:
        api: Authenticated tweepy API object
        count: Number of followers to retrieve (default: 20)
        
    Returns:
        List of follower user objects
    """
    try:
        followers = api.get_followers(count=count)
        print(f"Retrieved {len(followers)} followers:")
        
        for i, follower in enumerate(followers, 1):
            print(f"  {i}. @{follower.screen_name} - {follower.name}")
            
        return followers
    except Exception as e:
        print(f"Error retrieving followers: {e}")
        return []

def get_following(api, count=20):
    """
    Get a list of users that the authenticated user is following
    
    Args:
        api: Authenticated tweepy API object
        count: Number of following users to retrieve (default: 20)
        
    Returns:
        List of following user objects
    """
    try:
        following = api.get_friends(count=count)
        print(f"Retrieved {len(following)} accounts you are following:")
        
        for i, friend in enumerate(following, 1):
            print(f"  {i}. @{friend.screen_name} - {friend.name}")
            
        return following
    except Exception as e:
        print(f"Error retrieving following accounts: {e}")
        return []

def follow_user(api, username):
    """
    Follow a specified user
    
    Args:
        api: Authenticated tweepy API object
        username: Screen name of the user to follow
        
    Returns:
        Followed user object if successful, None otherwise
    """
    try:
        user = api.create_friendship(screen_name=username)
        print(f"Successfully followed @{user.screen_name}")
        return user
    except Exception as e:
        print(f"Error following user @{username}: {e}")
        return None

def unfollow_user(api, username):
    """
    Unfollow a specified user
    
    Args:
        api: Authenticated tweepy API object
        username: Screen name of the user to unfollow
        
    Returns:
        Unfollowed user object if successful, None otherwise
    """
    try:
        user = api.destroy_friendship(screen_name=username)
        print(f"Successfully unfollowed @{user.screen_name}")
        return user
    except Exception as e:
        print(f"Error unfollowing user @{username}: {e}")
        return None

def create_list(api, name, description, private=False):
    """
    Create a new Twitter list
    
    Args:
        api: Authenticated tweepy API object
        name: Name of the list
        description: Description of the list
        private: Whether the list should be private (default: False)
        
    Returns:
        Created list object if successful, None otherwise
    """
    try:
        new_list = api.create_list(name=name, description=description, mode='private' if private else 'public')
        print(f"List '{new_list.name}' created successfully")
        return new_list
    except Exception as e:
        print(f"Error creating list: {e}")
        return None

def get_lists(api):
    """
    Get all lists owned by the authenticated user
    
    Args:
        api: Authenticated tweepy API object
        
    Returns:
        List of owned lists
    """
    try:
        owned_lists = api.get_lists()
        print(f"Retrieved {len(owned_lists)} lists:")
        
        for i, lst in enumerate(owned_lists, 1):
            print(f"  {i}. {lst.name} - {lst.description} ({lst.member_count} members)")
            
        return owned_lists
    except Exception as e:
        print(f"Error retrieving lists: {e}")
        return []

def main():
    # Setup Twitter client
    api = setup_twitter_client()
    
    # Example 1: Get account information
    print("\n=== Account Information ===")
    account_info = get_account_info(api)
    
    # Example 2: Update profile information
    print("\n=== Update Profile Information ===")
    print("Note: Commented out to prevent actual updates")
    # update_profile(
    #     api,
    #     name="Updated Name",
    #     description="This is an updated bio using Python Tweepy!",
    #     location="San Francisco, CA",
    #     url="https://example.com"
    # )
    
    # Example 3: Update profile image
    print("\n=== Update Profile Image ===")
    print("Note: Commented out to prevent actual updates")
    # profile_image_path = "path/to/profile/image.jpg"  # Replace with actual path
    # update_profile_image(api, profile_image_path)
    
    # Example 4: Update profile banner
    print("\n=== Update Profile Banner ===")
    print("Note: Commented out to prevent actual updates")
    # banner_image_path = "path/to/banner/image.jpg"  # Replace with actual path
    # update_profile_banner(api, banner_image_path)
    
    # Example 5: Get followers
    print("\n=== Get Followers ===")
    followers = get_followers(api, count=5)  # Limit to 5 for example
    
    # Example 6: Get accounts you're following
    print("\n=== Get Following ===")
    following = get_following(api, count=5)  # Limit to 5 for example
    
    # Example 7: Follow a user
    print("\n=== Follow User ===")
    print("Note: Commented out to prevent actual follow")
    # follow_user(api, "twitter")
    
    # Example 8: Unfollow a user
    print("\n=== Unfollow User ===")
    print("Note: Commented out to prevent actual unfollow")
    # unfollow_user(api, "twitter")
    
    # Example 9: Create a Twitter list
    print("\n=== Create Twitter List ===")
    print("Note: Commented out to prevent actual list creation")
    # create_list(api, "Python Developers", "A list of Python developers and organizations", private=False)
    
    # Example 10: Get all owned lists
    print("\n=== Get Owned Lists ===")
    owned_lists = get_lists(api)

if __name__ == "__main__":
    main()
