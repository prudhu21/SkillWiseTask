import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  try {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.background = type === 'success'
      ? '#10B981'
      : type === 'error'
      ? '#EF4444'
      : '#6B7280';
    el.style.color = 'white';
    el.style.padding = '10px 14px';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
    el.style.zIndex = '99999';
    el.textContent = message;
    el.style.opacity = '0';
    el.style.transition = 'opacity .2s ease, transform .2s ease';
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(-6px)';
    });

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(0px)';
      setTimeout(() => el.remove(), 200);
    }, 3000);
  } catch {}
}

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'password') {
        localStorage.setItem('token', 'dummy-jwt-token');
        showToast('Login successful', 'success');
        navigate('/'); 
      } else {
        showToast('Invalid credentials', 'error');
      }
      setLoading(false);
    }, 700);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f3f4f6',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: 360,
          background: '#fff',
          padding: 32,
          borderRadius: 10,
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Login</h2>

        <label style={{ fontSize: 14, color: '#444' }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            marginBottom: 16,
          }}
          placeholder="Enter username"
        />

        <label style={{ fontSize: 14, color: '#444' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            marginBottom: 20,
          }}
          placeholder="Enter password"
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: '#2563EB',
            color: 'white',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 15,
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: '#777',
            textAlign: 'center',
          }}
        >
          Default credentials:<br />
          <strong>admin</strong> / <strong>password</strong>
        </div>
      </form>
    </div>
  );
};

export default Login;
