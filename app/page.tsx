// app/page.tsx
import VidPulseDashboard from '@/components/vid-pulse-dashboard';

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 bg-black text-white">
      <h1 className="text-2xl font-bold mb-6">VidPulse Analytics Studio</h1>
      
      {/* Pass the YouTube Video ID */}
      <VidPulseDashboard videoId="5amK5ylj0GY" />
    </main>
  );
}
