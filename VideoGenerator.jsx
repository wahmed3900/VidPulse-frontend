'use client';
import { useState, useRef } from 'react';

const VOICES = [
  { value: 'en-GB-RyanNeural',   label: '🇬🇧 Ryan — British Male' },
  { value: 'en-US-AriaNeural',   label: '🇺🇸 Aria — US Female' },
  { value: 'en-US-GuyNeural',    label: '🇺🇸 Guy — US Male' },
  { value: 'en-IN-NeerjaNeural', label: '🇮🇳 Neerja — Indian Female' },
  { value: 'en-AU-NatashaNeural',label: '🇦🇺 Natasha — Australian Female' },
  { value: 'en-CA-ClaraNeural',  label: '🇨🇦 Clara — Canadian Female' },
];

const TTS_URL = 'http://localhost:5050/generate-video';

export default function VideoGenerator() {
  const [script, setScript]       = useState('');
  const [voice, setVoice]         = useState('en-GB-RyanNeural');
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState({ label: '', pct: 0 });
  const [videoUrl, setVideoUrl]   = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [error, setError]         = useState('');
  const [vidCount, setVidCount]   = useState(0);
  const videoRef = useRef(null);

  async function handleGenerate() {
    if (!script.trim()) { setError('Please paste your script first.'); return; }
    setError('');
    setLoading(true);
    setVideoUrl(null);
    setVideoBlob(null);

    try {
      setProgress({ label: 'Generating voiceover…', pct: 20 });
      await delay(500);
      setProgress({ label: 'Rendering video…', pct: 50 });
      await delay(300);
      setProgress({ label: 'Encoding MP4…', pct: 75 });

      const resp = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: script, voice }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${resp.status}`);
      }

      setProgress({ label: 'Done!', pct: 100 });
      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setVidCount(c => c + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress({ label: '', pct: 0 }), 1200);
    }
  }

  function handleDownload() {
    if (!videoBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(videoBlob);
    a.download = `VidPulse-${Date.now()}.mp4`;
    a.click();
  }

  function handleClear() {
    setScript('');
    setVideoUrl(null);
    setVideoBlob(null);
    setError('');
  }

  return (
    <div style={styles.wrap}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Video Generator</h1>
          <p style={styles.subtitle}>Paste your script, pick a voice, and generate your video with AI voiceover</p>
        </div>
        <span style={styles.badge}>● Local TTS Active</span>
      </div>

      {/* Stat tiles */}
      <div style={styles.statGrid}>
        {[
          { label: 'Thumbnail Impressions', value: '45',      change: '↑ 12% this week',  up: true  },
          { label: 'Click-Through Rate',    value: '2.2%',    change: '↓ 0.3% vs last',   up: false },
          { label: 'Videos Generated',      value: vidCount,  change: 'This session',      up: true  },
          { label: 'Avg Duration',          value: '—',       change: 'After first render', up: null  },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statValue}>{s.value}</div>
            <div style={{ ...styles.statChange, color: s.up === true ? '#3ecf8e' : s.up === false ? '#f05a5a' : '#7a7a9a' }}>
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Generator card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>🎬 Generate Video with Voiceover</span>
          <span style={styles.cardMeta}>Powered by Edge TTS + MoviePy</span>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.genLayout}>

            {/* Left: inputs */}
            <div style={styles.leftCol}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Script / Text</label>
                <textarea
                  style={styles.textarea}
                  value={script}
                  onChange={e => setScript(e.target.value)}
                  placeholder={"Paste your video script here...\nThe AI will clean it up, generate the voiceover, and render the video automatically."}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Voice</label>
                <select style={styles.select} value={voice} onChange={e => setVoice(e.target.value)}>
                  {VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>

              {/* Progress */}
              {loading && (
                <div style={styles.progressArea}>
                  <div style={styles.progressLabel}>{progress.label}</div>
                  <div style={styles.progressWrap}>
                    <div style={{ ...styles.progressBar, width: `${progress.pct}%` }} />
                  </div>
                </div>
              )}

              {error && <div style={styles.errorMsg}>❌ {error}</div>}

              <div style={styles.btnRow}>
                <button style={{ ...styles.btn, ...styles.btnPrimary, opacity: loading ? .5 : 1 }}
                  onClick={handleGenerate} disabled={loading}>
                  {loading ? '⏳ Generating…' : '▶ Generate Video'}
                </button>
                <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={handleClear}>
                  Clear
                </button>
              </div>
            </div>

            {/* Right: preview / options */}
            <div style={styles.rightCol}>
              {videoUrl ? (
                <div style={styles.previewArea}>
                  <video ref={videoRef} src={videoUrl} controls style={styles.video} />
                  <div style={styles.btnRow}>
                    <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleDownload}>
                      ⬇ Download MP4
                    </button>
                    <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={() => { setVideoUrl(null); setVideoBlob(null); }}>
                      New Video
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.optionsTitle}>Options</div>
                  {[
                    { label: 'Auto-clean script',  desc: 'Strip stage directions, markdown, emojis' },
                    { label: 'Text overlay',        desc: 'Show script preview on video' },
                    { label: '1080p quality',       desc: 'Currently renders at 720p' },
                  ].map(o => (
                    <div key={o.label} style={styles.optionRow}>
                      <div>
                        <div style={styles.optionLabel}>{o.label}</div>
                        <div style={styles.optionDesc}>{o.desc}</div>
                      </div>
                      <Toggle />
                    </div>
                  ))}

                  <div style={styles.tips}>
                    <div style={styles.tipsTitle}>💡 Quick Tips</div>
                    <ul style={styles.tipsList}>
                      {[
                        'Keep scripts under 3 min for best results',
                        'The server must be running on localhost:5050',
                        'Stage directions like [PAUSE] are auto-removed',
                        'Video length matches voiceover duration exactly',
                      ].map(t => <li key={t} style={styles.tipsItem}>→ {t}</li>)}
                    </ul>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

function Toggle({ defaultOn = true }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div onClick={() => setOn(!on)} style={{
      width: 38, height: 22, borderRadius: 12, flexShrink: 0,
      background: on ? '#7c5cfc' : '#2a2a3d', position: 'relative', cursor: 'pointer', transition: 'background .2s',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 19 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s',
      }} />
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Inline styles ─────────────────────────────────────────────────
const styles = {
  wrap:        { display: 'flex', flexDirection: 'column', gap: 24, padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0', fontFamily: 'Inter, system-ui, sans-serif' },
  header:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  title:       { fontSize: 22, fontWeight: 700, letterSpacing: '-.5px', margin: 0 },
  subtitle:    { color: '#7a7a9a', fontSize: 13, marginTop: 4 },
  badge:       { background: 'rgba(124,92,252,.2)', color: '#7c5cfc', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(124,92,252,.3)', whiteSpace: 'nowrap' },
  statGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  statCard:    { background: '#13131a', border: '1px solid #2a2a3d', borderRadius: 12, padding: 20 },
  statLabel:   { fontSize: 12, color: '#7a7a9a', fontWeight: 500, marginBottom: 8 },
  statValue:   { fontSize: 28, fontWeight: 700, letterSpacing: -1 },
  statChange:  { fontSize: 12, marginTop: 6 },
  card:        { background: '#13131a', border: '1px solid #2a2a3d', borderRadius: 12, overflow: 'hidden' },
  cardHeader:  { padding: '18px 24px 16px', borderBottom: '1px solid #2a2a3d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:   { fontSize: 15, fontWeight: 600 },
  cardMeta:    { fontSize: 12, color: '#7a7a9a' },
  cardBody:    { padding: 24 },
  genLayout:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  leftCol:     { display: 'flex', flexDirection: 'column', gap: 18 },
  rightCol:    { display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup:   { display: 'flex', flexDirection: 'column', gap: 8 },
  formLabel:   { fontSize: 11, fontWeight: 600, color: '#7a7a9a', textTransform: 'uppercase', letterSpacing: '.5px' },
  textarea:    { background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#e8e8f0', padding: '12px 14px', fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical', minHeight: 160, outline: 'none', lineHeight: 1.6, width: '100%' },
  select:      { background: '#1c1c28', border: '1px solid #2a2a3d', borderRadius: 8, color: '#e8e8f0', padding: '11px 14px', fontSize: 13.5, fontFamily: 'inherit', outline: 'none', width: '100%' },
  progressArea:{ display: 'flex', flexDirection: 'column', gap: 8 },
  progressWrap:{ background: '#1c1c28', borderRadius: 6, height: 6, overflow: 'hidden' },
  progressBar: { height: '100%', background: 'linear-gradient(90deg,#7c5cfc,#5b8af5)', borderRadius: 6, transition: 'width .3s' },
  progressLabel:{ fontSize: 12, color: '#7a7a9a' },
  errorMsg:    { fontSize: 13, color: '#f05a5a', background: 'rgba(240,90,90,.08)', border: '1px solid rgba(240,90,90,.2)', borderRadius: 8, padding: '10px 14px' },
  btnRow:      { display: 'flex', gap: 10 },
  btn:         { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s', fontFamily: 'inherit' },
  btnPrimary:  { background: 'linear-gradient(135deg,#7c5cfc,#5b8af5)', color: '#fff' },
  btnOutline:  { background: 'transparent', color: '#e8e8f0', border: '1px solid #2a2a3d' },
  previewArea: { display: 'flex', flexDirection: 'column', gap: 14 },
  video:       { width: '100%', borderRadius: 8, background: '#000' },
  optionsTitle:{ fontSize: 13, fontWeight: 600, color: '#7a7a9a', marginBottom: 4 },
  optionRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #2a2a3d' },
  optionLabel: { fontSize: 13, fontWeight: 500 },
  optionDesc:  { fontSize: 11.5, color: '#7a7a9a', marginTop: 2 },
  tips:        { background: 'rgba(124,92,252,.07)', border: '1px solid rgba(124,92,252,.2)', borderRadius: 8, padding: 14 },
  tipsTitle:   { fontSize: 12, fontWeight: 600, color: '#7c5cfc', marginBottom: 8 },
  tipsList:    { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 },
  tipsItem:    { fontSize: 12, color: '#7a7a9a' },
};
