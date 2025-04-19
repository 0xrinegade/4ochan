import React, { useState, useEffect } from 'react';
import { useNostr } from '@/hooks/useNostr';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { formatPubkey } from '@/lib/nostr';

// Types for user profile data from the server
interface UserProfileData {
  id: number;
  username: string;
  nostrPubkey: string;
  displayName: string | null;
  avatar: string | null;
  bannerImage: string | null;
  bio: string | null;
  signature: string | null;
  location: string | null;
  website: string | null;
  social: { [key: string]: string } | null;
  interests: string[] | null;
  createdAt: string;
  lastSeen: string;
  isAdmin: boolean;
  isModerator: boolean;
  isVerified: boolean;
  postCount: number;
  reputationScore: number;
  trustLevel: number;
  karma: number;
  activityStreak: number;
  customCss: string | null;
  theme: string | null;
}

interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  awardedAt: string;
  awardReason: string | null;
  badge?: {
    id: number;
    name: string;
    description: string;
    iconUrl: string;
    color: string;
    rarity: string;
  };
}

interface UserProfileProps {
  userId?: number;
  pubkey?: string;
  compact?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, pubkey, compact = false }) => {
  const { identity } = useNostr();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [followers, setFollowers] = useState<UserProfileData[]>([]);
  const [following, setFollowing] = useState<UserProfileData[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Determine if this is the current user's profile
  const isCurrentUser = pubkey ? pubkey === identity.pubkey : false;
  
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        let response;
        
        // Fetch by ID or pubkey
        if (userId) {
          response = await fetch(`/api/users/${userId}`);
        } else if (pubkey) {
          response = await fetch(`/api/users/nostr/${pubkey}`);
        } else {
          throw new Error('Either userId or pubkey must be provided');
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await response.json();
        setProfileData(userData);
        
        // If we have a user ID, fetch badges, followers, and following
        if (userData.id) {
          // Fetch badges
          const badgesRes = await fetch(`/api/users/${userData.id}/badges`);
          if (badgesRes.ok) {
            const badgesData = await badgesRes.json();
            setBadges(badgesData);
          }
          
          // Fetch followers
          const followersRes = await fetch(`/api/users/${userData.id}/followers`);
          if (followersRes.ok) {
            const followersData = await followersRes.json();
            setFollowers(followersData);
            
            // Check if current user is following this profile
            if (!isCurrentUser && identity.pubkey) {
              // This would require a backend endpoint to check by pubkey
              // For now, we check by looking through the followers list
              const isFollowingUser = followersData.some(
                (follower: UserProfileData) => follower.nostrPubkey === identity.pubkey
              );
              setIsFollowing(isFollowingUser);
            }
          }
          
          // Fetch following
          const followingRes = await fetch(`/api/users/${userData.id}/following`);
          if (followingRes.ok) {
            const followingData = await followingRes.json();
            setFollowing(followingData);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId || pubkey) {
      fetchProfile();
    }
  }, [userId, pubkey, identity.pubkey]);

  const handleFollow = async () => {
    if (!profileData?.id) return;
    
    try {
      // Mock currentUserId for demo - in production would come from authenticated session
      const currentUserId = 1;
      
      const response = await fetch(
        `/api/users/${currentUserId}/follow/${profileData.id}`, 
        { method: 'POST' }
      );
      
      if (response.ok) {
        setIsFollowing(true);
        toast({
          title: "Success",
          description: `You are now following ${profileData.displayName || profileData.username}`,
        });
      } else {
        throw new Error('Failed to follow user');
      }
    } catch (err) {
      console.error('Error following user:', err);
      toast({
        title: "Error",
        description: "Could not follow this user. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleUnfollow = async () => {
    if (!profileData?.id) return;
    
    try {
      // Mock currentUserId for demo - in production would come from authenticated session
      const currentUserId = 1;
      
      const response = await fetch(
        `/api/users/${currentUserId}/follow/${profileData.id}`, 
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        setIsFollowing(false);
        toast({
          title: "Success",
          description: `You are no longer following ${profileData.displayName || profileData.username}`,
        });
      } else {
        throw new Error('Failed to unfollow user');
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      toast({
        title: "Error",
        description: "Could not unfollow this user. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="bg-white border border-black p-4">Loading profile...</div>;
  }

  if (error || !profileData) {
    return (
      <div className="bg-white border border-black p-4">
        <div className="text-red-700 font-bold">Error: {error || 'User not found'}</div>
      </div>
    );
  }

  // Render compact profile version (for sidebar, comment sections, etc.)
  if (compact) {
    return (
      <div className="bg-white border border-black p-2 flex items-center">
        {profileData.avatar ? (
          <img 
            src={profileData.avatar} 
            alt={profileData.displayName || profileData.username} 
            className="w-8 h-8 mr-2 border border-black"
          />
        ) : (
          <div className="w-8 h-8 bg-primary text-white flex items-center justify-center mr-2 border border-black">
            {(profileData.displayName || profileData.username || 'User')[0].toUpperCase()}
          </div>
        )}
        
        <div className="flex-1">
          <div className="font-bold">
            {profileData.displayName || profileData.username}
            {profileData.isVerified && (
              <span className="ml-1 text-xs bg-primary text-white px-1 font-bold">✓</span>
            )}
          </div>
          
          <div className="text-xs">
            Rep: {profileData.reputationScore} • Posts: {profileData.postCount}
          </div>
        </div>
      </div>
    );
  }

  // Function to get trust level name
  const getTrustLevelName = (level: number) => {
    switch(level) {
      case 0: return 'New User';
      case 1: return 'Basic User';
      case 2: return 'Member';
      case 3: return 'Regular';
      case 4: return 'Trusted';
      case 5: return 'Elder';
      default: return `Level ${level}`;
    }
  };

  // Function to create social media link
  const getSocialIcon = (platform: string) => {
    switch(platform.toLowerCase()) {
      case 'twitter': return '𝕏'; // Twitter symbol
      case 'github': return '🐙'; // Octopus for GitHub
      case 'linkedin': return 'in'; // LinkedIn text
      case 'instagram': return '📷'; // Camera for Instagram
      case 'youtube': return '▶️'; // Play button for YouTube
      default: return '🔗'; // Generic link icon
    }
  };

  // Render full profile
  return (
    <div className="thread-container">
      <div className="section-header">user profile</div>
      
      <div className="p-0">
        {/* Banner image if available */}
        {profileData.bannerImage && (
          <div className="w-full h-32 relative overflow-hidden border-b border-black">
            <img 
              src={profileData.bannerImage} 
              alt="Profile banner" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-3">
          {/* User header with avatar and stats */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-shrink-0">
              {profileData.avatar ? (
                <img 
                  src={profileData.avatar} 
                  alt={profileData.displayName || profileData.username} 
                  className="w-24 h-24 border border-black"
                />
              ) : (
                <div className="w-24 h-24 bg-primary text-white flex items-center justify-center text-2xl font-bold border border-black">
                  {(profileData.displayName || profileData.username || 'User')[0].toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h2 className="text-xl font-bold mr-2">
                  {profileData.displayName || profileData.username}
                </h2>
                
                {profileData.isVerified && (
                  <span className="bg-primary text-white px-1 py-0.5 text-xs font-bold">Verified</span>
                )}
                
                {profileData.isAdmin && (
                  <span className="bg-red-700 text-white ml-1 px-1 py-0.5 text-xs font-bold">Admin</span>
                )}
                
                {profileData.isModerator && (
                  <span className="bg-blue-700 text-white ml-1 px-1 py-0.5 text-xs font-bold">Mod</span>
                )}
              </div>
              
              <div className="text-sm mb-2">@{profileData.username}</div>
              
              {/* Trust level badge */}
              {profileData.trustLevel > 0 && (
                <div className="text-sm mb-2">
                  <span className="bg-gray-200 border border-black text-black px-2 py-0.5 text-xs">
                    {getTrustLevelName(profileData.trustLevel)}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-600 mb-2">
                {profileData.location && (
                  <div className="mb-1">📍 {profileData.location}</div>
                )}
                {profileData.website && (
                  <div className="mb-1">
                    🌐 <a 
                      href={
                        profileData.website.startsWith('http') 
                          ? profileData.website 
                          : `https://${profileData.website}`
                      } 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profileData.website}
                    </a>
                  </div>
                )}
                <div className="mb-1">
                  🔑 Nostr: {formatPubkey(profileData.nostrPubkey)}
                </div>
              </div>
              
              {/* Social links */}
              {profileData.social && Object.keys(profileData.social).length > 0 && (
                <div className="flex gap-2 mb-3">
                  {Object.entries(profileData.social).map(([platform, url]) => (
                    <a 
                      key={platform}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block border border-black bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
                    >
                      {getSocialIcon(platform)} {platform}
                    </a>
                  ))}
                </div>
              )}
              
              {/* User stats in retro table */}
              <table className="w-full border-collapse border border-black text-left text-sm">
                <tbody>
                  <tr>
                    <td className="border border-black p-1 font-bold">Reputation</td>
                    <td className="border border-black p-1">{profileData.reputationScore}</td>
                    <td className="border border-black p-1 font-bold">Karma</td>
                    <td className="border border-black p-1">{profileData.karma || 0}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-bold">Posts</td>
                    <td className="border border-black p-1">{profileData.postCount}</td>
                    <td className="border border-black p-1 font-bold">Streak</td>
                    <td className="border border-black p-1">{profileData.activityStreak || 0} days</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-bold">Followers</td>
                    <td className="border border-black p-1">{followers.length}</td>
                    <td className="border border-black p-1 font-bold">Following</td>
                    <td className="border border-black p-1">{following.length}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 font-bold">Joined</td>
                    <td className="border border-black p-1" colSpan={3}>
                      {new Date(profileData.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                </tbody>
              </table>
              
              {/* Follow/Unfollow button */}
              {!isCurrentUser && (
                <div className="mt-3">
                  {isFollowing ? (
                    <Button 
                      variant="outline" 
                      onClick={handleUnfollow}
                      className="border-black hover:bg-gray-100"
                    >
                      Unfollow
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleFollow}
                      className="bg-primary text-white"
                    >
                      Follow
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Interests/Topics */}
          {profileData.interests && profileData.interests.length > 0 && (
            <div className="mb-4">
              <div className="section-header">interests</div>
              <div className="bg-white border border-black border-t-0 p-2">
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.map((interest, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline"
                      className="border-black bg-gray-100"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Bio */}
          {profileData.bio && (
            <div className="mb-4">
              <div className="section-header">about</div>
              <div className="bg-white border border-black border-t-0 p-2 whitespace-pre-wrap">
                {profileData.bio}
              </div>
            </div>
          )}
          
          {/* Badges */}
          {badges.length > 0 && (
            <div className="mb-4">
              <div className="section-header">badges</div>
              <div className="bg-white border border-black border-t-0 p-2">
                <div className="flex flex-wrap gap-2">
                  {badges.map(badge => (
                    <Badge 
                      key={badge.id} 
                      variant="outline"
                      className="border-black bg-gray-100"
                      title={badge.badge?.description || ""}
                    >
                      {badge.badge?.name || `Badge #${badge.badgeId}`}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Signature */}
          {profileData.signature && (
            <div className="mb-4">
              <div className="section-header">signature</div>
              <div className="bg-white border border-black border-t-0 p-2 italic text-sm whitespace-pre-wrap">
                {profileData.signature}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;