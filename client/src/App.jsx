import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Swipe from './pages/Swipe';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function NavBar() {
  const { user, unreadCount } = useAuth();
  const location = useLocation();
  if (!user) return null;
  if (location.pathname.match(/^\/matches\/.+/)) return null;

  const active = (path) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-white border-t border-slate-100">
        <div className="flex justify-around py-2">
          <Link to="/swipe" className={`flex flex-col items-center gap-0.5 px-6 py-1 rounded-xl transition-colors ${active('/swipe') ? 'text-violet-600' : 'text-slate-400'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="text-[10px] font-medium">探す</span>
          </Link>

          <Link to="/matches" className={`flex flex-col items-center gap-0.5 px-6 py-1 rounded-xl transition-colors relative ${active('/matches') ? 'text-violet-600' : 'text-slate-400'}`}>
            <div className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">マッチ</span>
          </Link>

          <Link to="/profile" className={`flex flex-col items-center gap-0.5 px-6 py-1 rounded-xl transition-colors ${active('/profile') ? 'text-violet-600' : 'text-slate-400'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="text-[10px] font-medium">マイページ</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUnreadCount(0);
  };

  const updateUser = (updates) => {
    const newUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setUnreadCount(0);
      return;
    }

    api.getUnreadCount().then(({ count }) => setUnreadCount(count)).catch(() => {});

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const s = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = s;
    s.on('notification', ({ count }) => setUnreadCount(count));

    return () => { s.disconnect(); socketRef.current = null; };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, unreadCount, setUnreadCount }}>
      <BrowserRouter>
        <div className="max-w-md mx-auto min-h-screen pb-16 bg-slate-50">
          <NavBar />
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/swipe" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/swipe" /> : <Register />} />
            <Route path="/swipe" element={<RequireAuth><Swipe /></RequireAuth>} />
            <Route path="/matches" element={<RequireAuth><Matches /></RequireAuth>} />
            <Route path="/matches/:matchId" element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="*" element={<Navigate to={user ? '/swipe' : '/login'} />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
