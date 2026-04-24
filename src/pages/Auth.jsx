import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../api/client';
import { User, Lock, Mail } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Backend expects JSON for LoginRequest: { email, password }
        const res = await apiClient.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        setToken(res.data.access_token);
        navigate('/');
      } else {
        await apiClient.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        setIsLogin(true);
        setError('Dang ky thanh cong! Vui long dang nhap.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Da xay ra loi. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--accent-primary)' }}>
          {isLogin ? 'Chao mung ban quay lai' : 'Tao tai khoan'}
        </h2>
        
        {error && (
          <div style={{ padding: '0.75rem', background: error.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: error.includes('successful') ? 'var(--success)' : 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div>
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Enter username" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  required 
                />
              </div>
            </div>
          )}

          <div>
            <label>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                placeholder="Enter email" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>
          </div>

          <div>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                placeholder="Enter password" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Chua co tai khoan? " : "Da co tai khoan? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' }}>
            {isLogin ? 'Dang ky ngay' : 'Dang nhap tai day'}
          </span>
        </div>
      </div>
    </div>
  );
}
