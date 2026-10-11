'use client';
import { useEffect, useState } from 'react';

export default function VidPulseDashboard({ videoId }: { videoId: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveData() {
      try {
        const res = await fetch(`/api/youtube/analytics?videoId=${videoId}`);
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch live YouTube data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveData();
  }, [videoId]);

  if (loading) return <div>Loading live algorithm metrics...</div>;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h3 className="text-sm text-neutral-400">Thumbnail Impressions</h3>
        <p className="text-3xl font-bold mt-2">{metrics?.impressions ?? 0}</p>
      </div>
      <div className="bg-neutral-900 p-6 rounded-xl">
        <h3 className="text-sm text-neutral-400">Click-Through Rate (CTR)</h3>
        <p className="text-3xl font-bold mt-2">{metrics?.ctr ?? '0'}%</p>
      </div>
    </div>
  );
}
