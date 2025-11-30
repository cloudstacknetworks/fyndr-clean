/**
 * STEP 21: Supplier Broadcasts Panel Component
 * Displays buyer messages and announcements visible to all suppliers
 */

'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Loader2, Calendar } from 'lucide-react';

interface BroadcastMessage {
  id: string;
  message: string;
  createdAt: string;
}

interface BroadcastsPanelProps {
  rfpId: string;
}

export default function BroadcastsPanel({ rfpId }: BroadcastsPanelProps) {
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchBroadcasts();
  }, [rfpId]);
  
  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/supplier/rfps/${rfpId}/broadcasts`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch broadcast messages');
      }
      
      const data = await response.json();
      setBroadcasts(data.broadcasts);
    } catch (err) {
      console.error('Error fetching broadcasts:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Megaphone className="h-6 w-6 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Buyer Messages & Announcements
        </h2>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">
        Important updates and clarifications from the buyer team.
      </p>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Megaphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No announcements yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Check back later for updates from the buyer.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {broadcasts.map((broadcast) => (
            <div
              key={broadcast.id}
              className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700 uppercase">
                  Announcement
                </span>
                <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(broadcast.createdAt)}
                </span>
              </div>
              
              <p className="text-gray-800 whitespace-pre-wrap">
                {broadcast.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
