import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client';
import { Video, Scissors, Music, Forward, Maximize, FileVideo, Download, Key, Loader2, Play, Image as ImageIcon, Crop, Headphones, FileAudio } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';

const TOOLS = [
  { id: 'cut', name: 'Cut Video', icon: Scissors, description: 'Trim video between timestamps' },
  { id: 'merge', name: 'Merge Videos', icon: FileVideo, description: 'Basic concat multiple videos' },
  { id: 'extract-audio', name: 'Extract Audio', icon: Music, description: 'Get MP3 audio from video' },
  { id: 'add-audio', name: 'Merge/Replace Audio', icon: Headphones, description: 'Add or replace audio track' },
  { id: 'speed', name: 'Change Speed', icon: Forward, description: 'Speed up or slow down' },
  { id: 'resize', name: 'Resize', icon: Maximize, description: 'Change video resolution' },
  { id: 'crop', name: 'Crop Video', icon: Crop, description: 'Crop video dimensions' },
  { id: 'extract-frames', name: 'Extract Frames', icon: ImageIcon, description: 'Get frames at specific times' },
];

export default function Studio() {
  const {
    activeTool, setActiveTool,
    file, setFile,
    secondaryFile, setSecondaryFile,
    mergeFiles, setMergeFiles,
    apiKey, setApiKey,
    isDragging, setIsDragging,
    isDraggingSecondary, setIsDraggingSecondary,
    isDraggingMerge, setIsDraggingMerge,
    params, setParams,
    jobId, setJobId,
    jobStatus, setJobStatus,
    loading, setLoading,
    uploadProgress, setUploadProgress,
    error, setError
  } = useStudioStore();

  const [draftKey, setDraftKey] = useState(apiKey || '');
  const [isValidatingAuth, setIsValidatingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const fileInputRef = useRef();
  const secondaryFileInputRef = useRef();
  const mergeFileInputRef = useRef();

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
          const res = await apiClient.get(`/video/jobs/${jobId}`, {
            headers: {
              'X-API-Key': apiKey
            }
          });
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
    if (activeTool === 'merge' && mergeFiles.length < 2) return setError('Please select at least 2 videos to merge.');
    if (activeTool !== 'merge' && !file && !fileUrl) return setError('Please select a video file or enter a Cloudflare R2 URL.');
    if (activeTool === 'add-audio' && !secondaryFile) return setError('Please select an audio file to merge.');
    if (!apiKey) return setError('API Key is required to use the Studio.');
    
    setError('');
    setLoading(true);
    setJobId(null);
    setJobStatus(null);

    try {
      setUploadProgress(0);
      
      const filesToUpload = activeTool === 'merge' ? mergeFiles : 
                           activeTool === 'add-audio' ? [file || {name: fileUrl}, secondaryFile] : [file || {name: fileUrl}];
                           
      const initRes = await apiClient.post('/video/jobs/init', {
        tool_name: activeTool,
        filenames: filesToUpload.map(f => f.name)
      }, { headers: { 'X-API-Key': apiKey } });
      
      const jId = initRes.data.job_id;
      const uploadUrls = initRes.data.upload_urls;
      setJobId(jId);

      let totalBytes = filesToUpload.reduce((acc, f) => acc + f.size, 0);
      let uploadedBytes = new Array(filesToUpload.length).fill(0);
      let lastReportedProgress = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const fileObj = filesToUpload[i];
        const pushUrl = uploadUrls[i];
        
        if (!pushUrl || !fileObj.size) {
            uploadedBytes[i] = 100; // Simulated full size or bypass
            continue;
        }

        await axios.put(pushUrl, fileObj, {
          headers: {
            'Content-Type': fileObj.type || 'application/octet-stream'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.loaded) {
                uploadedBytes[i] = progressEvent.loaded;
                const sumLoaded = uploadedBytes.reduce((a, b) => a + b, 0);
                const percentCompleted = Math.round((sumLoaded * 100) / (totalBytes || 1));
                setUploadProgress(percentCompleted);
                
                if (percentCompleted - lastReportedProgress >= 5 || percentCompleted === 100) {
                  lastReportedProgress = percentCompleted;
                  apiClient.put(`/video/jobs/${jId}/upload-progress`, 
                     { progress: percentCompleted },
                     { headers: { 'X-API-Key': apiKey } }
                  ).catch(() => {});
                }
            }
          }
        });
      }

      if (lastReportedProgress !== 100) {
        setUploadProgress(100);
        await apiClient.put(`/video/jobs/${jId}/upload-progress`, { progress: 100 }, { headers: { 'X-API-Key': apiKey } }).catch(() => {});
      }

      const processFormData = new FormData();
      processFormData.append('job_id', jId);
      
      if (activeTool === 'cut') {
        processFormData.append('start_time', params.start_time);
        processFormData.append('end_time', params.end_time);
      } else if (activeTool === 'speed') {
        processFormData.append('speed', params.speed);
      } else if (activeTool === 'resize') {
        processFormData.append('width', params.width);
        processFormData.append('height', params.height);
      } else if (activeTool === 'crop') {
        processFormData.append('width', params.crop_width);
        processFormData.append('height', params.crop_height);
        processFormData.append('x', params.crop_x);
        processFormData.append('y', params.crop_y);
      } else if (activeTool === 'add-audio') {
        processFormData.append('replace', params.replace_audio);
      } else if (activeTool === 'extract-frames') {
        processFormData.append('first_frame', params.first_frame);
        processFormData.append('last_frame', params.last_frame);
        if (params.timestamp.trim() !== '') {
          processFormData.append('timestamp', parseFloat(params.timestamp));
        }
      }

      const res = await apiClient.post(`/video/${activeTool}`, processFormData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'X-API-Key': apiKey 
        }
      });

      setJobStatus(res.data);
    } catch (err) {
      console.error(err);
      let errorDetail = err.response?.data?.detail;
      if (Array.isArray(errorDetail)) {
        errorDetail = errorDetail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
      } else if (typeof errorDetail === 'object') {
        errorDetail = JSON.stringify(errorDetail);
      }
      setError(errorDetail || err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
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

  // Drag handlers for Primary File
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  // Drag handlers for Secondary File (Audio)
  const handleDragOverSecondary = (e) => {
    e.preventDefault();
    setIsDraggingSecondary(true);
  };
  const handleDragLeaveSecondary = (e) => {
    e.preventDefault();
    setIsDraggingSecondary(false);
  };
  const handleDropSecondary = (e) => {
    e.preventDefault();
    setIsDraggingSecondary(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSecondaryFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  // Drag handlers for Merge Files
  const handleDragOverMerge = (e) => {
    e.preventDefault();
    setIsDraggingMerge(true);
  };
  const handleDragLeaveMerge = (e) => {
    e.preventDefault();
    setIsDraggingMerge(false);
  };
  const handleDropMerge = (e) => {
    e.preventDefault();
    setIsDraggingMerge(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setMergeFiles([...mergeFiles, ...Array.from(e.dataTransfer.files)]);
      e.dataTransfer.clearData();
    }
  };

  const handleVerifyKey = async () => {
    setIsValidatingAuth(true);
    setAuthError('');
    try {
      await apiClient.get('/video/jobs', {
        params: { limit: 1 },
        headers: { 'X-API-Key': draftKey }
      });
      setApiKey(draftKey);
    } catch (err) {
      setApiKey(''); // Clear global state 
      setAuthError('Invalid or expired API Key');
    } finally {
      setIsValidatingAuth(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '2rem', height: 'auto', minHeight: '80vh' }}>
      
      {/* Sidebar - Tools & Global Config */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={16} color="var(--accent-primary)"/> SYSTEM AUTH
            </span>
            {apiKey && apiKey === draftKey && <span style={{ fontSize: '0.75rem', color: 'var(--success)', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>Active</span>}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="password" 
              placeholder="Paste your API Key" 
              value={draftKey}
              onChange={(e) => {
                setDraftKey(e.target.value);
                if (e.target.value === '') setApiKey('');
              }}
              style={{ flex: 1, background: 'rgba(0,0,0,0.2)' }} 
            />
            <button 
              className={`btn btn-primary ${draftKey && draftKey !== apiKey ? 'premium-glow' : ''}`}
              onClick={handleVerifyKey}
              disabled={isValidatingAuth || !draftKey || draftKey === apiKey}
              style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isValidatingAuth ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
            </button>
          </div>
          {authError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{authError}</div>}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', fontWeight: '700' }}>Toolbox</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {TOOLS.map(tool => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button 
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  disabled={loading}
                  className={`btn tool-card ${isActive ? 'active premium-glow' : ''}`}
                  style={{ 
                    justifyContent: 'flex-start',
                    background: isActive ? 'linear-gradient(90deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: '1px solid transparent',
                    borderBottomColor: isActive ? 'transparent' : 'rgba(255,255,255,0.05)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      background: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', 
                      padding: '0.6rem', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex'
                    }}>
                      <Icon size={18} color={isActive ? "white" : "var(--text-muted)"} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{tool.name}</div>
                      <div style={{ fontSize: '0.75rem', color: isActive ? 'var(--text-secondary)' : 'var(--text-muted)', marginTop: '0.2rem' }}>{tool.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* Main Content - Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Workspace Canvas Header */}
        <div className="glass-panel" style={{ padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Current Workspace</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{TOOLS.find(t => t.id === activeTool)?.name}</h2>
          </div>
          {jobStatus && jobStatus.status === 'processing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <Loader2 size={14} className="animate-spin" /> Processing Backend
            </div>
          )}
        </div>

        {error && <div className="animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', borderRadius: 'var(--radius-lg)' }}>
          <strong>Error Encountered: </strong> {error}
        </div>}

        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Upload Area */}
          {activeTool === 'merge' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
              <div 
                className="dropzone-animate"
                onClick={() => mergeFileInputRef.current?.click()}
                onDragOver={handleDragOverMerge}
                onDragLeave={handleDragLeaveMerge}
                onDrop={handleDropMerge}
                style={{ 
                  border: `2px dashed ${isDraggingMerge ? 'var(--accent-primary)' : 'var(--border-color)'}`, 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '4rem 2rem', 
                  textAlign: 'center',
                  background: isDraggingMerge ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                <input type="file" ref={mergeFileInputRef} onChange={(e) => {
                  if (e.target.files) setMergeFiles([...mergeFiles, ...Array.from(e.target.files)]);
                }} accept="video/*" multiple style={{ display: 'none' }} />
                
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-tertiary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}>
                  <FileVideo size={36} color={isDraggingMerge ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                </div>
                <div style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Drop media files here</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Select multiple files. First file dictates timeline resolution.</div>
              </div>

              {mergeFiles.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {mergeFiles.map((f, i) => (
                    <div className="tool-card" key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 'bold', marginRight: '0.5rem', color: 'var(--accent-primary)' }}>#{i+1}</span>
                        {f.name}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setMergeFiles(mergeFiles.filter((_, idx) => idx !== i)); }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: activeTool === 'add-audio' ? '1fr 1fr' : '1fr', gap: '1.5rem', minHeight: '300px' }}>
              
              {/* Primary Video Upload */}
              <div 
                className="dropzone-animate"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ 
                  border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-color)'}`, 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '3rem 2rem', 
                  textAlign: 'center',
                  background: isDragging ? 'rgba(99, 102, 241, 0.1)' : (file ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), transparent)' : 'rgba(0,0,0,0.15)'),
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                <input type="file" ref={fileInputRef} onChange={(e) => { setFile(e.target.files[0]); setFileUrl(''); }} accept="video/*" style={{ display: 'none' }} />
                {file ? (
                  <div className="animate-fade-in">
                    <FileVideo size={54} color="var(--accent-primary)" style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.4))' }} />
                    <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{file.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{(file.size / (1024*1024)).toFixed(2)} MB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg-tertiary)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                    }}>
                      <Video size={32} color={isDragging ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Drop video here</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>or click to browse local files</div>
                  </div>
                )}
              </div>
              {!file && (
                <div style={{ marginTop: '-0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', fontWeight: '600' }}>OR</div>
                  <input 
                    type="url" 
                    className="form-control" 
                    placeholder="Paste an existing R2/Cloudflare URL to bypass upload..." 
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    style={{ background: 'var(--bg-card)', padding: '0.85rem 1rem' }}
                  />
                </div>
              )}

              {/* Secondary Audio Upload (Only for add-audio) */}
              {activeTool === 'add-audio' && (
                <div 
                  className="dropzone-animate"
                  onClick={() => secondaryFileInputRef.current?.click()}
                  onDragOver={handleDragOverSecondary}
                  onDragLeave={handleDragLeaveSecondary}
                  onDrop={handleDropSecondary}
                  style={{ 
                    border: `2px dashed ${isDraggingSecondary ? '#ec4899' : 'var(--border-color)'}`, 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '3rem 2rem', 
                    textAlign: 'center',
                    background: isDraggingSecondary ? 'rgba(236, 72, 153, 0.1)' : (secondaryFile ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.05), transparent)' : 'rgba(0,0,0,0.15)'),
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                  <input type="file" ref={secondaryFileInputRef} onChange={(e) => setSecondaryFile(e.target.files[0])} accept="audio/*" style={{ display: 'none' }} />
                  {secondaryFile ? (
                    <div className="animate-fade-in">
                      <FileAudio size={54} color="#ec4899" style={{ margin: '0 auto 1.5rem', filter: 'drop-shadow(0 0 10px rgba(236,72,153,0.4))' }} />
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{secondaryFile.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{(secondaryFile.size / (1024*1024)).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ 
                        width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg-tertiary)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                      }}>
                        <Headphones size={32} color={isDraggingSecondary ? '#ec4899' : 'var(--text-secondary)'} />
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Drop audio here</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>or click to browse local files</div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Render Global Progress Bar during Upload */}
          {loading && uploadProgress > 0 && uploadProgress <= 100 && (
            <div className="animate-fade-in" style={{ padding: '2rem 0 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Uploading direct to R2...</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{uploadProgress}%</span>
              </div>
              <div className="premium-progress-container">
                <div className="premium-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}

          {/* Tool Parameters Box */}
          <div style={{ marginTop: '2.5rem', background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.02)' }}>
            <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
               Operation Syntax 
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {activeTool === 'cut' && (
                <>
                  <div><label>Start Timestamp (HH:MM:SS)</label><input type="text" value={params.start_time} onChange={e => setParams({...params, start_time: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                  <div><label>End Timestamp (HH:MM:SS)</label><input type="text" value={params.end_time} onChange={e => setParams({...params, end_time: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                </>
              )}
              {activeTool === 'speed' && (
                <div><label>Speed Factor (0.25 to 4.0)</label><input type="number" step="0.1" value={params.speed} onChange={e => setParams({...params, speed: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
              )}
              {activeTool === 'resize' && (
                <>
                  <div><label>Output Width (px)</label><input type="number" value={params.width} onChange={e => setParams({...params, width: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                  <div><label>Output Height (px)</label><input type="number" value={params.height} onChange={e => setParams({...params, height: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                </>
              )}
              {activeTool === 'crop' && (
                <>
                  <div><label>Crop Width (px)</label><input type="number" value={params.crop_width} onChange={e => setParams({...params, crop_width: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                  <div><label>Crop Height (px)</label><input type="number" value={params.crop_height} onChange={e => setParams({...params, crop_height: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                  <div><label>Offset X (px)</label><input type="number" value={params.crop_x} onChange={e => setParams({...params, crop_x: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                  <div><label>Offset Y (px)</label><input type="number" value={params.crop_y} onChange={e => setParams({...params, crop_y: e.target.value})} style={{ background: 'rgba(255,255,255,0.05)' }} /></div>
                </>
              )}
              {activeTool === 'extract-audio' && (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1/-1' }}>No extra parameters needed. Intelligent detection will extract the best native audio track.</p>
              )}
              {activeTool === 'merge' && (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1/-1' }}>The output canvas resolution and framerate will intelligently match the first video dropped.</p>
              )}
              {activeTool === 'add-audio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: '1 / -1' }}>
                  <label className="tool-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                    <input type="checkbox" checked={params.replace_audio} onChange={e => setParams({...params, replace_audio: e.target.checked})} style={{ width: '24px', height: '24px', accentColor: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: '1.05rem', fontWeight: '500' }}>Replace native audio track <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '0.5rem' }}>(Default mixes both tracks)</span></span>
                  </label>
                </div>
              )}
              {activeTool === 'extract-frames' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: '1 / -1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1rem' }}>
                    <label className="tool-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                      <input type="checkbox" checked={params.first_frame} onChange={e => setParams({...params, first_frame: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }} />
                      <span>Extract Initial Frame</span>
                    </label>
                    <label className="tool-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-primary)', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                      <input type="checkbox" checked={params.last_frame} onChange={e => setParams({...params, last_frame: e.target.checked})} style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }} />
                      <span>Extract Final Frame</span>
                    </label>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <label>Extract Specific Timestamp (seconds, e.g. 5.5)</label>
                    <input type="number" step="0.1" placeholder="Empty drops this feature" value={params.timestamp} onChange={e => setParams({...params, timestamp: e.target.value})} style={{ width: '100%', maxWidth: '350px', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button 
              className={`btn btn-primary ${!loading && ((activeTool === 'merge' ? mergeFiles.length >= 2 : file) && (activeTool !== 'add-audio' || secondaryFile)) ? 'premium-glow' : ''}`} 
              onClick={handleSubmit} 
              disabled={loading || (activeTool === 'merge' ? mergeFiles.length < 2 : !file) || (activeTool === 'add-audio' && !secondaryFile)} 
              style={{ padding: '1rem 3rem', fontSize: '1.2rem', fontWeight: '600', borderRadius: '3rem', transition: 'all 0.3s' }}
            >
              {loading ? <><Loader2 className="animate-spin" /> EXECUTING...</> : <><Play /> IGNITE PROCESS</>}
            </button>
          </div>

        </div>

        {/* Results Polling View */}
        {jobId && (
          <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))', 
              padding: '1.5rem 2.5rem', borderRadius: 'var(--radius-lg)',
              border: jobStatus?.status === 'completed' ? '1px solid var(--success)' : '1px solid rgba(255,255,255,0.05)',
              boxShadow: jobStatus?.status === 'completed' ? '0 0 30px rgba(16,185,129,0.15)' : 'none'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Ticket Registry ID</div>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', fontFamily: 'monospace' }}>{jobId}</h3>
                
                <div style={{ 
                  color: jobStatus?.status === 'completed' ? 'var(--success)' : (jobStatus?.status === 'failed' ? 'var(--danger)' : 'var(--warning)'), 
                  fontWeight: '700', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '1px' 
                }}>
                  {jobStatus?.status === 'processing' || jobStatus?.status === 'pending' || !jobStatus ? <Loader2 size={16} className="animate-spin" /> : null}
                  {jobStatus?.status || 'INITIATING UPLINK'}
                </div>
                {jobStatus?.error_message && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '4px' }}>{jobStatus.error_message}</div>}
              </div>
              
              {jobStatus?.status === 'completed' && jobStatus?.output_url && (
                <a href={jobStatus.output_url} target="_blank" rel="noreferrer" className="btn btn-primary premium-glow" style={{ textDecoration: 'none', padding: '1rem 2rem', background: 'var(--success)' }}>
                  <Download size={20} /> RETRIEVE ARTIFACT
                </a>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
