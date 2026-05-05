import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

function SwipeCard({ candidate, onSwipe }) {
  const cardRef = useRef(null);
  const startX = useRef(null);
  const currentX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);

  const handleStart = (clientX) => {
    startX.current = clientX;
    setDragging(true);
  };

  const handleMove = (clientX) => {
    if (!dragging || startX.current === null) return;
    const diff = clientX - startX.current;
    currentX.current = diff;
    setOffset(diff);
  };

  const handleEnd = () => {
    setDragging(false);
    if (currentX.current > 80) {
      onSwipe(true);
    } else if (currentX.current < -80) {
      onSwipe(false);
    }
    setOffset(0);
    currentX.current = 0;
    startX.current = null;
  };

  const rotation = offset / 15;
  const likeOpacity = Math.min(offset / 80, 1);
  const nopeOpacity = Math.min(-offset / 80, 1);

  return (
    <div
      ref={cardRef}
      className="absolute w-full cursor-grab active:cursor-grabbing select-none"
      style={{ transform: `translateX(${offset}px) rotate(${rotation}deg)`, transition: dragging ? 'none' : 'transform 0.3s' }}
      onMouseDown={e => handleStart(e.clientX)}
      onMouseMove={e => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={e => handleStart(e.touches[0].clientX)}
      onTouchMove={e => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center overflow-hidden">
          {candidate.avatar
            ? <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
            : <span className="text-8xl">{candidate.role === 'company' ? '🏢' : '👩‍🎓'}</span>
          }
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">{candidate.name}</h2>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${candidate.role === 'company' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {candidate.role === 'company' ? '企業' : '就活生'}
            </span>
          </div>
          {candidate.location && <p className="text-gray-400 text-sm mt-1">📍 {candidate.location}</p>}
          {candidate.bio && <p className="text-gray-600 mt-3 leading-relaxed line-clamp-3">{candidate.bio}</p>}
          {candidate.skills && (
            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                <span key={skill} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{skill}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LIKE / NOPE オーバーレイ */}
      <div className="absolute top-6 left-6 border-4 border-green-400 text-green-400 px-4 py-2 rounded-lg font-bold text-2xl rotate-[-20deg]" style={{ opacity: likeOpacity }}>
        LIKE
      </div>
      <div className="absolute top-6 right-6 border-4 border-red-400 text-red-400 px-4 py-2 rounded-lg font-bold text-2xl rotate-[20deg]" style={{ opacity: nopeOpacity }}>
        NOPE
      </div>
    </div>
  );
}

export default function Swipe() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchPopup, setMatchPopup] = useState(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleSwipe = async (liked) => {
    const candidate = candidates[candidates.length - 1];
    if (!candidate) return;
    setCandidates(prev => prev.slice(0, -1));
    try {
      const res = await api.swipe(candidate.id, liked);
      if (res.matched) {
        setMatchPopup(res.partner);
      }
    } catch (e) {
      console.error(e);
    }
    if (candidates.length <= 1) {
      setTimeout(fetchCandidates, 500);
    }
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        {user.role === 'student' ? '企業を探す' : '就活生を探す'}
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-400">
          <span className="text-6xl mb-4">🎉</span>
          <p className="text-lg font-medium">候補が見つかりません</p>
          <p className="text-sm mt-1">しばらく後にまた確認してください</p>
          <button onClick={fetchCandidates} className="mt-6 bg-pink-500 text-white px-6 py-2 rounded-full">
            更新する
          </button>
        </div>
      ) : (
        <>
          <div className="relative h-[480px]">
            {candidates.map((c, i) => (
              <div key={c.id} style={{ zIndex: i, opacity: i === candidates.length - 1 ? 1 : 0.8, transform: `scale(${0.95 + i * 0.01})` }} className="absolute w-full">
                {i === candidates.length - 1 && <SwipeCard candidate={c} onSwipe={handleSwipe} />}
                {i !== candidates.length - 1 && (
                  <div className="bg-white rounded-3xl shadow-md h-[480px] w-full" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-8 mt-6">
            <button
              onClick={() => handleSwipe(false)}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl border-2 border-red-200 hover:border-red-400 transition-colors"
            >
              ✗
            </button>
            <button
              onClick={() => handleSwipe(true)}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl border-2 border-green-200 hover:border-green-400 transition-colors"
            >
              ♥
            </button>
          </div>
        </>
      )}

      {matchPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setMatchPopup(null)}>
          <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-6xl mb-4">🎊</div>
            <h2 className="text-2xl font-bold text-pink-500">マッチング成立！</h2>
            <p className="text-gray-600 mt-2">{matchPopup.name} さんとマッチしました</p>
            <button
              onClick={() => setMatchPopup(null)}
              className="mt-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-full font-semibold"
            >
              DMを送る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
