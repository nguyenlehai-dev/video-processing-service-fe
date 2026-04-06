import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react';

export default function Dashboard() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await apiClient.get('/api-keys/');
      setKeys(res.data);
    } catch (err) {
      console.error('Failed to fetch keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    const name = e.target.keyName.value;
    try {
      const res = await apiClient.post('/api-keys/', { name });
      setNewKey(res.data.key); // The raw key only shown once
      fetchKeys();
      e.target.reset();
    } catch (err) {
      console.error('Failed to create key', err);
    }
  };

  const handleRevoke = async (keyId) => {
    if (window.confirm("Are you sure you want to revoke this key?")) {
      try {
        await apiClient.delete(`/api-keys/${keyId}`);
        fetchKeys();
      } catch (err) {
        console.error('Failed to revoke key', err);
      }
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Left Column - List Keys */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>Your Secret Keys</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Do not share your API keys with others. Revoke any key that you suspect has been compromised.</p>
          
          {loading ? <p>Loading keys...</p> : (
            keys.length === 0 ? <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No API keys found. Create one to get started.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {keys.map(k => (
                  <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{k.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.25rem' }}>Prefix: {k.prefix}...</div>
                    </div>
                    <button onClick={() => handleRevoke(k.id)} className="btn btn-danger" style={{ padding: '0.5rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )
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
