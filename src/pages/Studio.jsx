import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Video, Scissors, Music, Forward, Maximize, FileVideo, Download, Key, Loader2, Play } from 'lucide-react';

const TOOLS = [
  { id: 'cut', name: 'Cut Video', icon: Scissors, description: 'Trim video between timestamps' },
  { id: 'extract-audio', name: 'Extract Audio', icon: Music, description: 'Get MP3 audio from video' },
  { id: 'speed', name: 'Change Speed', icon: Forward, description: 'Speed up or slow down' },
  { id: 'resize', name: 'Resize', icon: Maximize, description: 'Change video resolution' },
];

export default function Studio() {
  const [activeTool, setActiveTool] = useState('cut');
  const [file, setFile] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('studio_api_key') || '');
  
  // Tool params
  const [params, setParams] = useState({
    start_time: '00:00:00', end_time: '00:00:10', // cut
    speed: '1.5', // speed
    width: '1280', height: '720' // resize
  });

  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  // Save API Key to localstorage
  useEffect(() => {
    localStorage.setItem('studio_api_key', apiKey);
  }, [apiKey]);

  // Polling Job Status
  useEffect(() => {
    let interval;
    if (jobId && jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed') {
      interval = setInterval(async () => {
        try {
          const res = await apiClient.get(`/video/jobs/${jobId}`);
          setJobStatus(res.data);
          if (res.data.status === 'completed' || res.data.status === 'failed') {
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error polling job", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a video file first.');
    if (!apiKey) return setError('API Key is required to use the Studio.');
    
    setError('');
    setLoading(true);
    setJobId(null);
    setJobStatus(null);

    const formData = new FormData();
    formData.append('file', file);
    
    // Append parameters based on active tool
    if (activeTool === 'cut') {
      formData.append('start_time', params.start_time);
      formData.append('end_time', params.end_time);
    } else if (activeTool === 'speed') {
      formData.append('speed', params.speed);
    } else if (activeTool === 'resize') {
      formData.append('width', params.width);
      formData.append('height', params.height);
    }

    try {
      const res = await apiClient.post(`/video/${activeTool}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-API-Key': apiKey
        }
      });
      setJobId(res.data.job_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'var(--success)';
      case 'failed': return 'var(--danger)';
      case 'processing': return 'var(--warning)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
      
      {/* Sidebar - Tools & Global Config */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={16} color="var(--accent-primary)"/> API Access Key
          </h3>
          <input 
            type="password" 
            placeholder="Paste your API Key here" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ marginTop: '0.5rem' }} 
          />
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Processing Tools</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {TOOLS.map(tool => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button 
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className="btn"
                  style={{ 
                    justifyContent: 'flex-start',
                    background: isActive ? 'var(--accent-hover)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    border: isActive ? '1px solid var(--accent-light)' : '1px solid transparent',
                    padding: '1rem'
                  }}
                >
                  <Icon size={18} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600' }}>{tool.name}</div>
                    <div style={{ fontSize: '0.75rem', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '0.2rem' }}>{tool.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* Main Content - Workspace */}
      <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Workspace - {TOOLS.find(t => t.id === activeTool)?.name}</h2>
        </div>

        {error && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)' }}>{error}</div>}

        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            border: '2px dashed var(--border-color)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '4rem 2rem', 
            textAlign: 'center',
            background: file ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}>
          <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} accept="video/*" style={{ display: 'none' }} />
          {file ? (
            <div>
              <FileVideo size={48} color="var(--accent-primary)" style={{ margin: '0 auto 1rem' }} />
              <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{file.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{(file.size / (1024*1024)).toFixed(2)} MB</div>
            </div>
          ) : (
            <div>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-tertiary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
              }}>
                <Video size={32} color="var(--text-secondary)" />
              </div>
              <div style={{ fontWeight: '600', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Click or drag video here to upload</div>
              <div style={{ color: 'var(--text-muted)' }}>Supported formats: mp4, avi, mov, mkv</div>
            </div>
          )}
        </div>

        {/* Tool Configs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
          {activeTool === 'cut' && (
            <>
              <div><label>Start Time (HH:MM:SS)</label><input type="text" value={params.start_time} onChange={e => setParams({...params, start_time: e.target.value})} /></div>
              <div><label>End Time (HH:MM:SS)</label><input type="text" value={params.end_time} onChange={e => setParams({...params, end_time: e.target.value})} /></div>
            </>
          )}
          {activeTool === 'speed' && (
            <div><label>Speed Factor (e.g. 1.5, 2.0)</label><input type="number" step="0.1" value={params.speed} onChange={e => setParams({...params, speed: e.target.value})} /></div>
          )}
          {activeTool === 'resize' && (
            <>
              <div><label>Width (px)</label><input type="number" value={params.width} onChange={e => setParams({...params, width: e.target.value})} /></div>
              <div><label>Height (px)</label><input type="number" value={params.height} onChange={e => setParams({...params, height: e.target.value})} /></div>
            </>
          )}
          {activeTool === 'extract-audio' && (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>No extra parameters needed. It will extract the primary audio track.</p>
          )}
        </div>

        {/* Submit */}
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !file} style={{ padding: '1rem', fontSize: '1.1rem' }}>
          {loading ? <><Loader2 className="animate-spin" /> Uploading...</> : <><Play /> Start Processing</>}
        </button>

        {/* Results Polling View */}
        {jobId && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>Job ID: {jobId.substring(0, 8)}...</h3>
                <div style={{ color: getStatusColor(jobStatus?.status), fontWeight: '600', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {jobStatus?.status === 'processing' || jobStatus?.status === 'pending' || !jobStatus ? <Loader2 size={16} className="animate-spin" /> : null}
                  {jobStatus?.status || 'Initiating...'}
                </div>
                {jobStatus?.error_message && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{jobStatus.error_message}</div>}
              </div>
              
              {jobStatus?.status === 'completed' && jobStatus?.download_url && (
                <a href={jobStatus.download_url} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  <Download size={18} /> Download Result
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
