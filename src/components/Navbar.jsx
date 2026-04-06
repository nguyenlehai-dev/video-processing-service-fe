import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, Video, LayoutDashboard, Key } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel" style={{ margin: '1rem 2rem', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', borderRadius: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '1.25rem' }}>
          <Video color="var(--accent-primary)" />
          PlenxEditor
        </Link>
        
        {isAuthenticated && (
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><LayoutDashboard size={18} /> Dashboard</Link>
            <Link to="/studio" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Video size={18} /> Studio</Link>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAuthenticated ? (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.username || 'User'}</span>
            <button onClick={handleLogout} className="btn" style={{ background: 'transparent', padding: '0.5rem', color: 'var(--text-secondary)' }}>
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Authenticate</Link>
        )}
      </div>
    </nav>
  );
}
