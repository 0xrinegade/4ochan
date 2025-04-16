import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface ReputationLog {
  id: number;
  userId: number;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId: string | null;
  createdAt: string;
  createdById: number | null;
}

interface ReputationDisplayProps {
  userId: number;
  initialScore?: number;
  showDetails?: boolean;
}

export const ReputationDisplay: React.FC<ReputationDisplayProps> = ({ 
  userId,
  initialScore,
  showDetails = false
}) => {
  const { toast } = useToast();
  const [reputationScore, setReputationScore] = useState<number>(initialScore || 0);
  const [logs, setLogs] = useState<ReputationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!initialScore);
  const [showLog, setShowLog] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Fetch reputation data
  useEffect(() => {
    const fetchReputationData = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch reputation score if not provided
        if (!initialScore) {
          const scoreRes = await apiRequest(`/api/users/${userId}/reputation`);
          if (scoreRes.ok) {
            const data = await scoreRes.json();
            setReputationScore(data.reputationScore);
          } else {
            throw new Error('Failed to fetch reputation score');
          }
        }
        
        // Fetch logs if showing details
        if (showDetails) {
          const logsRes = await apiRequest(`/api/users/${userId}/reputation/logs`);
          if (logsRes.ok) {
            const logsData = await logsRes.json();
            setLogs(logsData);
          } else {
            throw new Error('Failed to fetch reputation logs');
          }
        }
      } catch (err) {
        console.error('Error fetching reputation data:', err);
        setError('Could not load reputation data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReputationData();
  }, [userId, initialScore, showDetails]);

  // Get color class based on reputation score
  const getReputationColor = (score: number): string => {
    if (score < 0) return 'text-red-700';
    if (score < 10) return 'text-gray-700';
    if (score < 50) return 'text-primary';
    if (score < 100) return 'text-primary font-bold';
    return 'text-primary font-bold blink'; // Blinking effect for high reputation
  };

  // Get rank label based on reputation score
  const getReputationRank = (score: number): string => {
    if (score < 0) return 'Troll';
    if (score < 10) return 'Newbie';
    if (score < 50) return 'Regular';
    if (score < 100) return 'Trusted';
    if (score < 500) return 'Elder';
    return 'Legend';
  };

  const toggleLog = () => {
    setShowLog(!showLog);
  };

  if (isLoading) {
    return <span className="inline-block bg-gray-100 text-gray-700 px-1 text-sm">...</span>;
  }

  if (error) {
    return <span className="inline-block bg-red-100 text-red-700 px-1 text-sm">Error</span>;
  }

  // Simple compact display
  if (!showDetails) {
    return (
      <span className={`monaco ${getReputationColor(reputationScore)}`}>
        {reputationScore}
      </span>
    );
  }

  // Detailed display with logs
  return (
    <div className="thread-container">
      <div className="section-header">reputation profile</div>
      
      <div className="p-3">
        <div className="flex items-center mb-3">
          <div className="text-2xl font-bold mr-3 monaco">
            <span className={getReputationColor(reputationScore)}>
              {reputationScore}
            </span>
          </div>
          
          <div className="border border-black px-2 py-1 bg-white text-sm">
            Rank: <span className="font-bold">{getReputationRank(reputationScore)}</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="w-full bg-gray-200 h-4 border border-black">
            <div 
              className="bg-primary h-full" 
              style={{ 
                width: `${Math.min(Math.max((reputationScore / 100) * 100, 0), 100)}%` 
              }}
            ></div>
          </div>
        </div>
        
        <Button
          variant="outline"
          className="border-black mb-3"
          onClick={toggleLog}
        >
          {showLog ? 'Hide Reputation History' : 'Show Reputation History'}
        </Button>
        
        {showLog && (
          <div className="border border-black">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-left">Date</th>
                  <th className="border border-black p-1 text-left">Change</th>
                  <th className="border border-black p-1 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border border-black p-1">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`border border-black p-1 ${log.amount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {log.amount >= 0 ? `+${log.amount}` : log.amount}
                      </td>
                      <td className="border border-black p-1">
                        {log.reason}
                        {log.sourceType && (
                          <span className="text-xs ml-1 text-gray-500">
                            ({log.sourceType})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="border border-black p-2 text-center">
                      No reputation history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReputationDisplay;