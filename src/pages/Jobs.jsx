import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Loader2, Server, Download, CheckCircle, XCircle, Clock, Video, ListTree, RefreshCcw, Eye, EyeOff } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const apiKey = localStorage.getItem('studio_api_key') || '';
  const [retryLoadings, setRetryLoadings] = useState({});
  const [expandedJob, setExpandedJob] = useState(null);

  const fetchJobs = async (currentPage = page) => {
    if (!apiKey) {
      setError('Khong tim thay API Key. Vui long nhap API Key trong trang Studio hoac API Docs de theo doi job.');
      setLoading(false);
      return;
    }
    try {
      const skip = (currentPage - 1) * limit;
      const res = await apiClient.get(`/video/jobs?skip=${skip}&limit=${limit}`, {
        headers: { 'X-API-Key': apiKey }
      });
      setJobs(res.data.jobs);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Khong the tai danh sach job. Hay kiem tra lai API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId) => {
    setRetryLoadings(prev => ({ ...prev, [jobId]: true }));
    try {
      await apiClient.post(`/video/jobs/${jobId}/retry`, {}, {
        headers: { 'X-API-Key': apiKey }
      });
      // Refresh job list
      fetchJobs(page);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Khong the chay lai job");
    } finally {
      setRetryLoadings(prev => ({ ...prev, [jobId]: false }));
    }
  };

  useEffect(() => {
    fetchJobs(page);
    
    // Auto refresh every 3 seconds if there are pending/processing jobs
    const interval = setInterval(() => {
      setJobs(currentJobs => {
        const needsRefresh = currentJobs.some(j => j.status === 'processing' || j.status === 'pending');
        if (needsRefresh) {
          fetchJobs(page);
        }
        return currentJobs; 
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [apiKey, page]);

  const getStatusBadge = (job) => {
    const status = job.status;
    let color = 'var(--text-muted)';
    let Icon = Clock;
    
    if (status === 'completed') { color = 'var(--success)'; Icon = CheckCircle; }
    if (status === 'failed') { color = 'var(--danger)'; Icon = XCircle; }
    if (status === 'processing') { color = 'var(--warning)'; }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color, fontWeight: '600', textTransform: 'capitalize' }}>
        {status === 'processing' || status === 'pending' ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
        {status} 
        {status === 'processing' ? `(${job.progress}%)` : ''}
      </div>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
    return new Date(utcDateStr).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    return `(${(bytes / (1024 * 1024)).toFixed(2)} MB)`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ListTree size={32} color="var(--accent-primary)" />
          <h1 style={{ margin: 0 }}>Background Tasks Queue</h1>
        </div>
        <button onClick={fetchJobs} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      {error ? (
        <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          {error}
        </div>
      ) : loading && jobs.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={48} className="animate-spin" color="var(--accent-primary)" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <Server size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>No jobs found in your queue</h3>
          <p style={{ color: 'var(--text-muted)' }}>Go to the Studio to start processing some videos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Duration</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Created At</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Completed At</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Failed Details</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <React.Fragment key={job.id}>
                  <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {job.id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '1rem', textTransform: 'capitalize', fontWeight: '500' }}>
                      {job.operation.replace('-', ' ')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(job)}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {job.duration ? `${job.duration.toFixed(1)}s` : '-'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {formatDate(job.created_at)}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                       {job.status === 'completed' || job.status === 'failed' ? formatDate(job.completed_at) : '-'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--danger)', fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={job.error_message}>
                      {job.error_message || '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          {expandedJob === job.id ? <EyeOff size={14} /> : <Eye size={14} />} {expandedJob === job.id ? 'An' : 'Chi tiet'}
                        </button>
                        {job.status === 'completed' && job.output_url ? (
                          <a href={job.output_url} target="_blank" rel="noreferrer" className="btn btn-primary premium-glow" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={14} /> Download
                          </a>
                        ) : job.status === 'failed' ? (
                          <button 
                            className="btn btn-primary" 
                            disabled={retryLoadings[job.id]}
                            onClick={() => handleRetryJob(job.id)}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', opacity: retryLoadings[job.id] ? 0.7 : 1 }}
                          >
                            {retryLoadings[job.id] ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />} Retry
                          </button>
                        ) : (
                          <button className="btn btn-secondary" disabled style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', opacity: 0.5, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Download size={14} /> Download
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedJob === job.id && (
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan="8" style={{ padding: '1.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Input Files</h4>
                            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', margin: 0, border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {JSON.stringify(job.input_files || [], null, 2)}
                            </pre>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Parameters</h4>
                            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', margin: 0, border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {JSON.stringify(job.params || {}, null, 2)}
                            </pre>
                          </div>
                          {(job.output_url || job.error_message) && (
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Output</h4>
                                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', margin: 0, border: '1px solid rgba(255,255,255,0.05)', color: job.error_message ? 'var(--danger)' : 'var(--success)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                  {job.output_url ? job.output_url : job.error_message}
                                </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <button 
                className="btn btn-secondary" 
                disabled={page === 1} 
                onClick={() => { setPage(page - 1); fetchJobs(page - 1); }}
              >
                Previous
              </button>
              
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                Page {page} of {Math.ceil(total / limit)} (Total: {total} Jobs)
              </span>
              
              <button 
                className="btn btn-secondary" 
                disabled={page >= Math.ceil(total / limit)} 
                onClick={() => { setPage(page + 1); fetchJobs(page + 1); }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
