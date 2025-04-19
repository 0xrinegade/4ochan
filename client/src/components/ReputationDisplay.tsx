import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';

interface ReputationLevel {
  id: number;
  level: number;
  name: string;
  description: string;
  minPoints: number;
  maxPoints: number | null;
  color: string;
  benefits: any;
  iconUrl: string | null;
}

interface ReputationDisplayProps {
  userId: number;
  currentScore?: number;
  compact?: boolean;
}

export const ReputationDisplay: React.FC<ReputationDisplayProps> = ({ 
  userId, 
  currentScore, 
  compact = false 
}) => {
  const [reputationScore, setReputationScore] = useState<number>(currentScore || 0);
  const [reputationLevel, setReputationLevel] = useState<ReputationLevel | null>(null);
  const [nextLevel, setNextLevel] = useState<ReputationLevel | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchReputationData = async () => {
      try {
        // If currentScore was not provided, fetch it
        if (currentScore === undefined) {
          const scoreResponse = await fetch(`/api/users/${userId}/reputation`);
          if (!scoreResponse.ok) throw new Error('Failed to fetch reputation score');
          const scoreData = await scoreResponse.json();
          setReputationScore(scoreData.score);
        }
        
        // Fetch user's current reputation level
        const levelResponse = await fetch(`/api/users/${userId}/reputation/level`);
        if (!levelResponse.ok) throw new Error('Failed to fetch reputation level');
        const levelData = await levelResponse.json();
        setReputationLevel(levelData.currentLevel);
        setNextLevel(levelData.nextLevel);
        
        // Calculate progress to next level
        if (levelData.currentLevel && levelData.nextLevel) {
          const current = reputationScore - levelData.currentLevel.minPoints;
          const total = levelData.nextLevel.minPoints - levelData.currentLevel.minPoints;
          const calculatedProgress = Math.min(100, Math.max(0, (current / total) * 100));
          setProgress(calculatedProgress);
        } else if (levelData.currentLevel && !levelData.nextLevel) {
          // Max level reached
          setProgress(100);
        }
      } catch (err) {
        console.error('Error fetching reputation data:', err);
        setError('Could not load reputation data');
      } finally {
        setLoading(false);
      }
    };

    fetchReputationData();
  }, [userId, currentScore]);

  // Default reputation level data if server fails
  if (error && !reputationLevel) {
    // Create a basic level based on score
    const defaultLevel = {
      id: 0,
      level: Math.floor(reputationScore / 100),
      name: getTrustLevelName(Math.floor(reputationScore / 100)),
      description: "User reputation level",
      minPoints: Math.floor(reputationScore / 100) * 100,
      maxPoints: Math.floor(reputationScore / 100) * 100 + 100,
      color: "#888888",
      benefits: null,
      iconUrl: null
    };
    setReputationLevel(defaultLevel);
    setProgress(((reputationScore - defaultLevel.minPoints) / 100) * 100);
    setError('');
  }

  function getTrustLevelName(level: number): string {
    switch(level) {
      case 0: return 'New User';
      case 1: return 'Basic User';
      case 2: return 'Member';
      case 3: return 'Regular';
      case 4: return 'Trusted';
      case 5: return 'Elder';
      default: return level > 5 ? 'Legend' : `Level ${level}`;
    }
  }

  // Show nothing while loading in compact mode
  if (loading && compact) return null;

  // Loading state
  if (loading) {
    return (
      <div className="border border-black p-2 bg-white mb-2">
        <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Compact view
  if (compact) {
    return reputationLevel ? (
      <div className="flex items-center gap-1">
        <Badge 
          variant="outline" 
          className="border-black px-2 py-0.5 text-xs font-normal bg-gray-100"
          style={{ backgroundColor: reputationLevel.color + '20' }}
        >
          {reputationLevel.name}
        </Badge>
        <span className="text-xs text-gray-600">{reputationScore} points</span>
      </div>
    ) : null;
  }

  // Full display
  return (
    <div className="border border-black p-3 bg-white mb-4">
      <div className="section-header">reputation</div>
      <div className="p-2 border border-black border-t-0 bg-white">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            {reputationLevel?.iconUrl ? (
              <img 
                src={reputationLevel.iconUrl} 
                alt={reputationLevel.name} 
                className="w-5 h-5 mr-2"
              />
            ) : (
              <div 
                className="w-5 h-5 mr-2 flex items-center justify-center font-bold text-xs rounded-full"
                style={{ backgroundColor: reputationLevel?.color || '#888888', color: 'white' }}
              >
                {reputationLevel?.level}
              </div>
            )}
            <span className="font-bold">{reputationLevel?.name || 'Unknown'}</span>
          </div>
          <span className="text-sm">{reputationScore} points</span>
        </div>
        
        {nextLevel && (
          <>
            <Progress value={progress} className="h-2 mb-1" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{reputationLevel?.minPoints}</span>
              <span>{nextLevel.minPoints} needed for {nextLevel.name}</span>
            </div>
          </>
        )}
        
        {reputationLevel && !nextLevel && (
          <div className="text-center text-sm mt-2 italic">
            Maximum level reached! 🏆
          </div>
        )}
        
        {reputationLevel?.description && (
          <div className="mt-2 text-sm">
            {reputationLevel.description}
          </div>
        )}
        
        {reputationLevel?.benefits && (
          <div className="mt-2">
            <div className="text-sm font-bold">Benefits:</div>
            <ul className="list-disc list-inside text-xs">
              {Object.entries(reputationLevel.benefits).map(([key, value]) => (
                <li key={key}>{key}: {String(value)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReputationDisplay;