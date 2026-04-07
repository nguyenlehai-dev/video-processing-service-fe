import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Key, Plus, Trash2, Copy, Check, Edit2, X, Save } from 'lucide-react';

export default function Dashboard() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;

  const [editingKeyId, setEditingKeyId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchKeys = async (currentPage = page) => {
    try {
      const skip = (currentPage - 1) * limit;
      const res = await apiClient.get(`/api-keys/?skip=${skip}&limit=${limit}`);
      setKeys(res.data.api_keys || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys(page);
  }, [page]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    const name = e.target.keyName.value;
    try {
      const res = await apiClient.post('/api-keys/', { name });
      setNewKey(res.data.key);
      fetchKeys(page);
      e.target.reset();
    } catch (err) {
      console.error('Failed to create key', err);
      if (err.response?.status === 400) {
        alert(err.response.data.detail);
      }
    }
  };

  const handleRevoke = async (keyId) => {
    if (window.confirm("Are you sure you want to delete this API Key? Any application using it will break immediately.")) {
      try {
        await apiClient.delete(`/api-keys/${keyId}`);
        let targetPage = page;
        if (keys.length === 1 && page > 1) {
          targetPage = page - 1;
          setPage(targetPage);
        }
        fetchKeys(targetPage);
      } catch (err) {
        console.error('Failed to revoke key', err);
      }
    }
  };

  const startEdit = (key) => {
    setEditingKeyId(key.id);
    setEditName(key.name);
  };

  const cancelEdit = () => {
    setEditingKeyId(null);
    setEditName('');
  };

  const saveEdit = async (keyId) => {
    if (!editName.trim()) return;
    try {
      await apiClient.put(`/api-keys/${keyId}`, { name: editName });
      setEditingKeyId(null);
      setEditName('');
      fetchKeys(page);
    } catch (err) {
      console.error('Failed to update key', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><Key style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem', color: 'var(--warning)' }}/> API Keys</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem' }}>
        
        {/* Left Column - List Keys */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3>Your Secret Keys</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Do not share your API keys with others. Delete any key that you suspect has been compromised.</p>
          
          {loading ? <p>Loading keys...</p> : (
            keys.length === 0 ? <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No API keys found. Create one to get started.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                {keys.map(k => (
                  <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    {editingKeyId === k.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          style={{ padding: '0.5rem', flex: 1, maxWidth: '300px' }}
                          autoFocus
                        />
                        <button onClick={() => saveEdit(k.id)} className="btn btn-primary" style={{ padding: '0.5rem' }}><Save size={16} /></button>
                        <button onClick={cancelEdit} className="btn btn-secondary" style={{ padding: '0.5rem' }}><X size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <div style={{ wordBreak: 'break-all', paddingRight: '1rem' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{k.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.25rem' }}>Prefix: {k.key_prefix}...</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button onClick={() => startEdit(k)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                            <Edit2 size={16} color="var(--accent-primary)" />
                          </button>
                          <button onClick={() => handleRevoke(k.id)} className="btn btn-danger" style={{ padding: '0.5rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Pagination Controls */}
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="btn btn-secondary" 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Page {page} of {Math.ceil(total / limit)}</span>
              <button 
                className="btn btn-secondary" 
                disabled={page >= Math.ceil(total / limit)} 
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Create Key & New Key Reveal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {newKey && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
              <h4 style={{ color: 'var(--success)' }}>Key Created Successfully!</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>Please copy this key immediately. You will not be able to see it again.</p>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" value={newKey} readOnly style={{ fontFamily: 'monospace', flex: 1 }} />
                <button onClick={() => copyToClipboard(newKey)} className="btn" style={{ background: 'var(--bg-tertiary)', color: 'white' }}>
                  {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3>Create new key</h3>
            <form onSubmit={handleCreateKey} style={{ marginTop: '1rem' }}>
              <label>Name / Identifier</label>
              <input type="text" name="keyName" placeholder="e.g. Production Server" required />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                <Plus size={18} /> Generate Key
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
