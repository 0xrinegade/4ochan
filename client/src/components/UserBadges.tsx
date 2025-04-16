import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface BadgeData {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  color: string;
  rarity: string;
  isHidden: boolean;
}

interface UserBadgeData {
  id: number;
  userId: number;
  badgeId: number;
  awardedAt: string;
  awardReason: string | null;
  badge?: BadgeData;
}

interface UserBadgesProps {
  userId: number;
  limit?: number;
  showLabels?: boolean;
  className?: string;
}

export const UserBadges: React.FC<UserBadgesProps> = ({ 
  userId, 
  limit, 
  showLabels = false,
  className = ''
}) => {
  const { toast } = useToast();
  const [badges, setBadges] = useState<UserBadgeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/users/${userId}/badges`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch badges');
        }
        
        // Get badge details for each user badge
        const userBadges: UserBadgeData[] = await response.json();
        
        // Fetch badge details if not included
        if (userBadges.length > 0 && !userBadges[0].badge) {
          // This would require separate badge detail fetching
          // In our implementation, we assume badges come with their details
        }
        
        setBadges(userBadges);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBadges();
  }, [userId]);

  // Get badge color from the color string or use default
  const getBadgeColor = (badge?: BadgeData): string => {
    if (!badge || !badge.color) return '#6f6f6f';
    return badge.color;
  };

  // Get CSS background for rarity
  const getRarityBackground = (rarity: string = 'common'): string => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'background: linear-gradient(135deg, #FFD700, #FFA500)';
      case 'epic':
        return 'background: linear-gradient(135deg, #9370DB, #8A2BE2)';
      case 'rare':
        return 'background: linear-gradient(135deg, #1E90FF, #0000CD)';
      case 'uncommon':
        return 'background: linear-gradient(135deg, #32CD32, #006400)';
      default: // common
        return 'background: linear-gradient(135deg, #A9A9A9, #696969)';
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading badges...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (badges.length === 0) {
    return showLabels ? (
      <div className="text-sm text-gray-500">No badges earned yet</div>
    ) : null;
  }

  // Limit the number of badges shown if requested
  const displayBadges = limit ? badges.slice(0, limit) : badges;
  const hasMore = limit && badges.length > limit;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayBadges.map(userBadge => (
        <TooltipProvider key={userBadge.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Badge 
                  variant="outline"
                  className="border-black"
                  style={{
                    backgroundColor: getBadgeColor(userBadge.badge),
                    color: '#ffffff',
                    boxShadow: '1px 1px 0 #000'
                  }}
                >
                  {userBadge.badge?.name || `Badge #${userBadge.badgeId}`}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-black text-white border-0 p-2 max-w-[250px]">
              <div className="text-center mb-1 font-bold">
                {userBadge.badge?.name || `Badge #${userBadge.badgeId}`}
              </div>
              
              {userBadge.badge?.rarity && (
                <div 
                  className="text-xs mb-1 py-0.5 rounded text-center font-bold"
                  style={{ [getRarityBackground(userBadge.badge.rarity)]: true }}
                >
                  {userBadge.badge.rarity.toUpperCase()}
                </div>
              )}
              
              {userBadge.badge?.description && (
                <div className="text-sm mb-1">
                  {userBadge.badge.description}
                </div>
              )}
              
              {userBadge.awardReason && (
                <div className="text-xs italic">
                  "{userBadge.awardReason}"
                </div>
              )}
              
              <div className="text-xs mt-1">
                Awarded on {new Date(userBadge.awardedAt).toLocaleDateString()}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {hasMore && (
        <Badge variant="outline" className="border-black bg-gray-100">
          +{badges.length - limit!} more
        </Badge>
      )}
    </div>
  );
};

export default UserBadges;