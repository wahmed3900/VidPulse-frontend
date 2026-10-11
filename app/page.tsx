import VidPulseDashboard from '@/components/vid-pulse-dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">VidPulse Analytics Studio</h1>
        
        {/* Render your dashboard component with a sample video ID */}
        <VidPulseDashboard videoId="5amK5ylj0GY" />
      </div>
    </main>
  );
}
