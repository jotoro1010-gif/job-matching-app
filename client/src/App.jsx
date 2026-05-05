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

  const linkClass = (path) =>
    `flex flex-col items-center text-xs ${location.pathname.startsWith(path) ? 'text-pink-500' : 'text-gray-400'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      <Link to="/swipe" className={`flex flex-col items-center text-xs ${location.pathname === '/swipe' ? 'text-pink-500' : 'text-gray-400'}`}>
        <span className="text-2xl">💼</span>
        <span>探す</span>
      </Link>

      <Link to="/matches" className={linkClass('/matches')}>
        <div className="relative">
          <span className="text-2xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span>マッチ</span>
      </Link>

      <Link to="/profile" className={linkClass('/profile')}>
        <span className="text-2xl">👤</span>
        <span>プロフィール</span>
      </Link>
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

  // グローバル通知ソケット
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setUnreadCount(0);
      return;
    }

    api.getUnreadCount().then(({ count }) => setUnreadCount(count)).catch(() => {});

    const s = io('http://localhost:3001', { auth: { token: localStorage.getItem('token') } });
    socketRef.current = s;
    s.on('notification', ({ count }) => setUnreadCount(count));

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, unreadCount, setUnreadCount }}>
      <BrowserRouter>
        <div className="max-w-md mx-auto min-h-screen pb-16">
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
