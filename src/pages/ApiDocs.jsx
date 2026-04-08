import React, { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle2, BookOpen, Code } from 'lucide-react';

export default function ApiDocs() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('studio_api_key') || '');
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem('studio_api_key', apiKey);
  }, [apiKey]);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Get the dynamic domain base URL
  const baseUrl = window.location.origin;

  const standardJobResponse = `{
  "job_id": "a9b92426-cc0f-412c-bd2a-fe8ef3283e58",
  "status": "pending",
  "message": "Processing job queued.",
  "thumbnail_url": null,
  "has_audio": null
}`;

  const endpoints = [
    {
      title: 'Cut Video',
      method: 'POST',
      url: '/api/v1/video/cut',
      description: 'Trim a segment from a video using start and end timestamps.',
      params: [
        { name: 'video', type: 'File', desc: 'Video file (optional if video_url/job_id is provided)' },
        { name: 'video_url', type: 'String', desc: 'Alternatively, a direct video URL (e.g. CDN link)' },
        { name: 'job_id', type: 'String', desc: 'Alternatively, an existing Job ID' },
        { name: 'start_time', type: 'String', desc: 'Start time (format: HH:MM:SS or seconds)' },
        { name: 'end_time', type: 'String', desc: 'End time (format: HH:MM:SS or seconds)' }
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/cut \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_url=https://cdn.plxeditor.com/video.mp4" \\
  -F "start_time=00:00:10" \\
  -F "end_time=00:00:30"`,
      response: standardJobResponse
    },
    {
      title: 'Merge Multiple Videos',
      method: 'POST',
      url: '/api/v1/video/merge',
      description: 'Merge or concatenate multiple video files together in sequence. This process utilizes Background Workers and Job Queues.',
      params: [
        { name: 'videos', type: 'Array of Files', desc: 'Multiple video files (optional if video_urls is provided)' },
        { name: 'video_urls', type: 'Array of Strings', desc: 'Alternatively, multiple direct video URLs' },
        { name: 'job_id', type: 'String', desc: 'Alternatively, an existing Job ID from /jobs/init' },
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/merge \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_urls=https://cdn.plxeditor.com/part1.mp4" \\
  -F "video_urls=https://cdn.plxeditor.com/part2.mp4"`,
      response: standardJobResponse
    },
    {
      title: 'Merge Audio Into Video',
      method: 'POST',
      url: '/api/v1/video/add-audio',
      description: 'Add or replace the audio track in a video with a secondary audio file.',
      params: [
        { name: 'video', type: 'File', desc: 'Primary video file' },
        { name: 'audio', type: 'File', desc: 'Secondary audio file (optional if audio_url is provided)' },
        { name: 'audio_url', type: 'String', desc: 'Alternatively, a direct audio URL (e.g. CDN link)' },
        { name: 'replace', type: 'Boolean', desc: 'If true, replaces existing audio. False will mix/merge them.' }
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/add-audio \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_url=https://cdn.plxeditor.com/video.mp4" \\
  -F "audio_url=https://cdn.plxeditor.com/audio.mp3" \\
  -F "replace=false"`,
      response: standardJobResponse
    },
    {
      title: 'Crop Video',
      method: 'POST',
      url: '/api/v1/video/crop',
      description: 'Crop a video visually to specified dimensions and offsets.',
      params: [
        { name: 'video', type: 'File', desc: 'Video file (optional if video_url/job_id is provided)' },
        { name: 'video_url', type: 'String', desc: 'Alternatively, a direct video URL (e.g. CDN link)' },
        { name: 'job_id', type: 'String', desc: 'Alternatively, an existing Job ID' },
        { name: 'width', type: 'Integer', desc: 'Crop width in pixels' },
        { name: 'height', type: 'Integer', desc: 'Crop height in pixels' },
        { name: 'x', type: 'Integer', desc: 'Horizontal offset from left (px)' },
        { name: 'y', type: 'Integer', desc: 'Vertical offset from top (px)' }
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/crop \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_url=https://cdn.plxeditor.com/video.mp4" \\
  -F "width=1080" \\
  -F "height=1080" \\
  -F "x=0" \\
  -F "y=0"`,
      response: standardJobResponse
    },
    {
      title: 'Extract Audio',
      method: 'POST',
      url: '/api/v1/video/extract-audio',
      description: 'Extract the audio track from a video file into a specified format.',
      params: [
        { name: 'video', type: 'File', desc: 'Video file (optional if video_url/job_id is provided)' },
        { name: 'video_url', type: 'String', desc: 'Alternatively, a direct video URL (e.g. CDN link)' },
        { name: 'job_id', type: 'String', desc: 'Alternatively, an existing Job ID' },
        { name: 'format', type: 'String', desc: 'Output audio format (mp3, wav, aac, flac)' }
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/extract-audio \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_url=https://cdn.plxeditor.com/video.mp4" \\
  -F "format=mp3"`,
      response: standardJobResponse
    },
    {
      title: 'Change Video Speed',
      method: 'POST',
      url: '/api/v1/video/speed',
      description: 'Change the playback speed of a video.',
      params: [
        { name: 'video', type: 'File', desc: 'Video file (optional if video_url/job_id is provided)' },
        { name: 'video_url', type: 'String', desc: 'Alternatively, a direct video URL (e.g. CDN link)' },
        { name: 'job_id', type: 'String', desc: 'Alternatively, an existing Job ID' },
        { name: 'speed', type: 'Float', desc: 'Speed multiplier (0.25 to 4.0)' },
        { name: 'adjust_audio', type: 'Boolean', desc: 'Whether to adjust audio speed accordingly' }
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/speed \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_url=https://cdn.plxeditor.com/video.mp4" \\
  -F "speed=2.0" \\
  -F "adjust_audio=true"`,
      response: standardJobResponse
    },
    {
      title: 'Resize Video',
      method: 'POST',
      url: '/api/v1/video/resize',
      description: 'Resize a video to specified dimensions.',
      params: [
        { name: 'video', type: 'File', desc: 'Video file (optional if video_url/job_id is provided)' },
        { name: 'video_url', type: 'String', desc: 'Alternatively, a direct video URL (e.g. CDN link)' },
        { name: 'job_id', type: 'String', desc: 'Alternatively, an existing Job ID' },
        { name: 'width', type: 'Integer', desc: 'Target width' },
        { name: 'height', type: 'Integer', desc: 'Target height' },
        { name: 'maintain_aspect', type: 'Boolean', desc: 'Maintain aspect ratio (pad if necessary)' }
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/resize \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_url=https://cdn.plxeditor.com/video.mp4" \\
  -F "width=1280" \\
  -F "height=720" \\
  -F "maintain_aspect=true"`,
      response: standardJobResponse
    },
    {
      title: 'Extract Frames',
      method: 'POST',
      url: '/api/v1/video/extract-frames',
      description: 'Extract specific frames from a video as a ZIP archive of images.',
      params: [
        { name: 'video', type: 'File', desc: 'Video file (optional if video_url/job_id is provided)' },
        { name: 'video_url', type: 'String', desc: 'Alternatively, a direct video URL (e.g. CDN link)' },
        { name: 'job_id', type: 'String', desc: 'Alternatively, an existing Job ID' },
        { name: 'first_frame', type: 'Boolean', desc: 'Extract the first frame' },
        { name: 'last_frame', type: 'Boolean', desc: 'Extract the last frame' },
        { name: 'timestamp', type: 'Float', desc: 'Extract frame at specific second (e.g., 5.5)' }
      ],
      example: `curl -X POST ${baseUrl}/api/v1/video/extract-frames \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}" \\
  -F "video_url=https://cdn.plxeditor.com/video.mp4" \\
  -F "first_frame=true" \\
  -F "timestamp=5.5"`,
      response: standardJobResponse
    },
    {
      title: 'List All Jobs',
      method: 'GET',
      url: '/api/v1/video/jobs',
      description: 'List all processing jobs for the current API Key account.',
      params: [
        { name: 'skip', type: 'Integer', desc: 'Pagination offset' },
        { name: 'limit', type: 'Integer', desc: 'Pagination limit (default 50)' }
      ],
      example: `curl -X GET "${baseUrl}/api/v1/video/jobs?skip=0&limit=50" \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}"`,
      response: `[
  {
    "id": "a9b92426-cc0f-412c-bd2a-fe8ef3283e58",
    "operation": "cut",
    "status": "completed",
    "progress": 100.0,
    "error_message": null,
    "output_url": "https://pub-...r2.dev/output/xyz.mp4",
    "created_at": "2026-04-07T03:33:30.000Z",
    "completed_at": "2026-04-07T03:34:10.000Z"
  }
]`
    },
    {
      title: 'Check Job Status (Polling)',
      method: 'GET',
      url: '/api/v1/video/jobs/{job_id}',
      description: 'Check the status of a scheduled processing job. Returns status (pending, processing, completed, failed) and output URL.',
      params: [],
      example: `curl -X GET ${baseUrl}/api/v1/video/jobs/YOUR_JOB_ID \\
  -H "X-API-Key: \${apiKey || 'YOUR_API_KEY_HERE'}"`,
      response: `{
  "id": "a9b92426-cc0f-412c-bd2a-fe8ef3283e58",
  "operation": "merge",
  "status": "completed",
  "progress": 100.0,
  "error_message": null,
  "output_url": "https://cdn.plxeditor.com/output/merge_a9b92426.mp4",
  "thumbnail_url": "https://cdn.plxeditor.com/output/merge_a9b92426_thumbnail.jpg",
  "has_audio": true,
  "created_at": "2026-04-07T03:33:30.000Z",
  "completed_at": "2026-04-07T03:34:10.000Z"
}`
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <BookOpen size={32} color="var(--accent-primary)" />
        <h1 style={{ margin: 0 }}>API Documentation</h1>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', borderTop: '4px solid var(--accent-primary)' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={20} /> Developer API Key
        </h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter your API key below. The code examples on this page will automatically update with your key for easy copy-pasting.
        </p>
        <input 
          type="text" 
          placeholder="Paste your API Key here" 
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ width: '100%', maxWidth: '500px', padding: '0.75rem', fontSize: '1rem' }} 
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {endpoints.map((ep, index) => (
          <div key={index} className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ 
                background: ep.method === 'GET' ? 'var(--info)' : 'var(--success)', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: 'var(--radius-sm)', 
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {ep.method}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{ep.title}</h2>
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '1.1rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              {ep.url}
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{ep.description}</p>

            {ep.params.length > 0 && (
              <>
                <h4 style={{ marginBottom: '0.5rem' }}>Parameters</h4>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '2rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem' }}>Name</th>
                        <th style={{ padding: '0.5rem' }}>Type</th>
                        <th style={{ padding: '0.5rem' }}>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ep.params.map((param, i) => (
                        <tr key={i} style={{ borderBottom: i === ep.params.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold', color: 'var(--accent-light)' }}>{param.name}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{param.type}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{param.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h4 style={{ marginBottom: '0.5rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={16} /> Request Example
            </h4>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => copyToClipboard(ep.example, index)}
                className="btn"
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem' }}
                title="Copy code"
              >
                {copiedIndex === index ? <CheckCircle2 size={16} color="var(--success)" /> : <Copy size={16} />}
              </button>
              <pre style={{ 
                background: '#1e1e2e', 
                padding: '1.5rem', 
                borderRadius: 'var(--radius-md)', 
                overflowX: 'auto',
                color: '#cdd6f4',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                margin: 0
              }}>
                <code>{ep.example}</code>
              </pre>
            </div>

            {ep.response && (
              <>
                <h4 style={{ marginBottom: '0.5rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a6e3a1' }}>
                  <CheckCircle2 size={16} /> Response Format
                </h4>
                <pre style={{ 
                  background: '#181825', 
                  padding: '1.5rem', 
                  borderRadius: 'var(--radius-md)', 
                  overflowX: 'auto',
                  color: '#a6e3a1',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  margin: 0,
                  border: '1px solid rgba(166, 227, 161, 0.2)'
                }}>
                  <code>{ep.response}</code>
                </pre>
              </>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
