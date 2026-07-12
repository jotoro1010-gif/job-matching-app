import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { FACULTIES } from '../data/faculties';
import { INDUSTRY_MAP } from '../data/industries';
import { APPEALS_MAP, VALUES_MAP } from '../data/values';

const FACULTY_LABEL = Object.fromEntries(FACULTIES.map(f => [f.value, f.label]));
const WORK_STYLE_LABEL = { remote: 'フルリモート', hybrid: 'ハイブリッド', onsite: '出社' };
const COMPANY_SIZE_LABEL = { startup: 'ベンチャー', sme: '中小企業', large: '大手企業', foreign: '外資系' };
const SALARY_LABEL = { under300: '〜300万', '300to400': '300〜400万', '400to500': '400〜500万', '500to600': '500〜600万', '600to800': '600〜800万', over800: '800万〜' };

function Tag({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    violet: 'bg-violet-50 text-violet-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${colors[color]}`}>{children}</span>;
}

// ────────────────────────────────────────────────
// スタック用スワイプカード
// タップ（ドラッグ8px未満）→ 詳細ページへ
// ドラッグ（8px以上）→ LIKE / NOPE
// ────────────────────────────────────────────────
function SwipeCard({ candidate, onSwipe, onOpenDetail }) {
  const startX = useRef(null);
  const currentX = useRef(0);
  const didDrag = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const ind = INDUSTRY_MAP[candidate.industry];

  const handleStart = (clientX) => {
    startX.current = clientX;
    didDrag.current = false;
    setDragging(true);
  };
  const handleMove = (clientX) => {
    if (!dragging || startX.current === null) return;
    const diff = clientX - startX.current;
    if (Math.abs(diff) > 8) didDrag.current = true;
    currentX.current = diff;
    setOffset(diff);
  };
  const handleEnd = () => {
    if (startX.current === null) return; // ドラッグ/タップが開始されていない（カーソルが通り過ぎただけ）
    setDragging(false);
    if (!didDrag.current) {
      // タップ判定 → 詳細へ
      setOffset(0); currentX.current = 0; startX.current = null;
      if (onOpenDetail) onOpenDetail();
      return;
    }
    if (currentX.current > 80) onSwipe(true);
    else if (currentX.current < -80) onSwipe(false);
    setOffset(0); currentX.current = 0; startX.current = null;
  };

  const rotation = offset / 18;
  const likeOpacity = Math.min(Math.max(offset / 80, 0), 1);
  const nopeOpacity = Math.min(Math.max(-offset / 80, 0), 1);

  return (
    <div
      className="absolute w-full cursor-grab active:cursor-grabbing select-none"
      style={{ transform: `translateX(${offset}px) rotate(${rotation}deg)`, transition: dragging ? 'none' : 'transform 0.3s ease' }}
      onMouseDown={e => handleStart(e.clientX)}
      onMouseMove={e => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={e => handleStart(e.touches[0].clientX)}
      onTouchMove={e => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
        {/* 写真エリア */}
        <div className="h-52 bg-slate-100 flex items-center justify-center overflow-hidden relative">
          {candidate.avatar
            ? <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
            : (
              <div className={`w-full h-full flex items-center justify-center ${candidate.role === 'company' ? 'bg-violet-50' : 'bg-slate-100'}`}>
                <span className="text-7xl opacity-40">{candidate.role === 'company' ? '🏢' : '🎓'}</span>
              </div>
            )
          }
          <div className="absolute top-3 left-3">
            <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${candidate.role === 'company' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-white'}`}>
              {candidate.role === 'company' ? '企業' : '就活生'}
            </span>
          </div>
          {candidate.superLikedMe && (
            <div className="absolute top-3 right-3 bg-amber-400 text-white text-xs font-bold px-2.5 py-1 rounded-lg">★ スーパーライク</div>
          )}
          {/* LIKE / NOPE オーバーレイ */}
          <div className="absolute inset-0 flex items-start justify-start p-4" style={{ opacity: likeOpacity }}>
            <div className="border-2 border-emerald-400 text-emerald-400 px-3 py-1 rounded-lg font-bold text-xl rotate-[-12deg]">LIKE</div>
          </div>
          <div className="absolute inset-0 flex items-start justify-end p-4" style={{ opacity: nopeOpacity }}>
            <div className="border-2 border-rose-400 text-rose-400 px-3 py-1 rounded-lg font-bold text-xl rotate-[12deg]">NOPE</div>
          </div>
        </div>

        {/* 情報エリア */}
        <div className="p-4">
          <h2 className="text-xl font-bold text-slate-900 leading-tight mb-1">{candidate.name}</h2>
          {candidate.role === 'student' && candidate.university && (
            <p className="text-slate-600 text-xs font-semibold mb-0.5">🏫 {candidate.university}</p>
          )}
          {candidate.role === 'student' && (candidate.faculty || candidate.department) && (
            <p className="text-slate-400 text-xs mb-1">
              {FACULTY_LABEL[candidate.faculty] || candidate.faculty}
              {candidate.department ? ` / ${candidate.department}` : ''}
            </p>
          )}
          {candidate.location && (
            <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {candidate.location}
            </p>
          )}
          {candidate.bio && (
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2">{candidate.bio}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {candidate.role === 'company' && ind && <Tag color="violet">{ind.icon} {ind.label}</Tag>}
            {candidate.role === 'student' && candidate.skills && candidate.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 2).map(skill => (
              <Tag key={skill}>{skill}</Tag>
            ))}
          </div>
          {/* 詳細を見るヒント */}
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-300 mt-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            タップして詳細を確認
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 詳細ビュー（スワイプカード + 詳細情報 + ボタン）
// ────────────────────────────────────────────────
function CandidateDetail({ candidate, onSwipe, onBack, superLikeRemaining }) {
  const [swiped, setSwiped] = useState(null);
  const ind = INDUSTRY_MAP[candidate.industry];

  const handleAction = async (liked, type = 'normal') => {
    if (swiped) return;
    setSwiped(liked ? (type === 'super' ? 'super' : 'like') : 'nope');
    await onSwipe(liked, type);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 bg-white border-b border-slate-100">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="font-bold text-slate-900 text-base flex-1 truncate">{candidate.name}</h2>
        {candidate.superLikedMe && (
          <span className="text-[11px] bg-amber-400 text-white font-bold px-2.5 py-1 rounded-lg flex-shrink-0">★ スーパーライク</span>
        )}
      </div>

      {/* スクロールコンテンツ */}
      <div className="flex-1 overflow-y-auto pb-36">
        {/* アバター */}
        <div className="h-64 bg-slate-100 relative overflow-hidden">
          {candidate.avatar
            ? <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
            : (
              <div className={`w-full h-full flex items-center justify-center ${candidate.role === 'company' ? 'bg-violet-50' : 'bg-slate-100'}`}>
                <span className="text-8xl opacity-30">{candidate.role === 'company' ? '🏢' : '🎓'}</span>
              </div>
            )
          }
        </div>

        <div className="px-4 pt-5 space-y-4">
          {/* 基本情報 */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${candidate.role === 'company' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700'}`}>
                {candidate.role === 'company' ? '企業' : '就活生'}
              </span>
              {ind && <Tag color="violet">{ind.icon} {ind.label}</Tag>}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{candidate.name}</h1>
            {candidate.role === 'student' && (
              <div className="mt-1.5">
                {candidate.university && <p className="text-sm text-slate-600 font-medium">🏫 {candidate.university}</p>}
                {(candidate.faculty || candidate.department) && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {FACULTY_LABEL[candidate.faculty] || candidate.faculty}
                    {candidate.department ? ` / ${candidate.department}` : ''}
                  </p>
                )}
              </div>
            )}
            {candidate.location && (
              <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {candidate.location}
              </p>
            )}
          </div>

          {/* 自己紹介 */}
          {candidate.bio && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                {candidate.role === 'company' ? '企業紹介' : '自己紹介'}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{candidate.bio}</p>
            </div>
          )}

          {/* スキル（就活生） */}
          {candidate.role === 'student' && candidate.skills && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">スキル</p>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                  <Tag key={skill}>{skill}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* 企業選びの軸（就活生） */}
          {candidate.role === 'student' && Array.isArray(candidate.job_values) && candidate.job_values.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">企業選びの軸</p>
              <div className="flex flex-wrap gap-2">
                {candidate.job_values.map(v => {
                  const jv = VALUES_MAP[v];
                  return jv ? <Tag key={v} color="violet">{jv.icon} {jv.label}</Tag> : null;
                })}
              </div>
            </div>
          )}

          {/* 企業の条件・売り */}
          {candidate.role === 'company' && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">条件・特徴</p>
              {(candidate.work_style || candidate.company_size || candidate.salary_range) && (
                <div className="grid grid-cols-2 gap-2">
                  {candidate.work_style && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold mb-0.5">勤務形態</p>
                      <p className="text-sm font-semibold text-slate-700">{WORK_STYLE_LABEL[candidate.work_style] || candidate.work_style}</p>
                    </div>
                  )}
                  {candidate.company_size && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold mb-0.5">会社規模</p>
                      <p className="text-sm font-semibold text-slate-700">{COMPANY_SIZE_LABEL[candidate.company_size] || candidate.company_size}</p>
                    </div>
                  )}
                  {candidate.salary_range && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 font-semibold mb-0.5">給与レンジ</p>
                      <p className="text-sm font-semibold text-slate-700">{SALARY_LABEL[candidate.salary_range] || candidate.salary_range}</p>
                    </div>
                  )}
                </div>
              )}
              {Array.isArray(candidate.company_appeals) && candidate.company_appeals.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">企業の売り</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.company_appeals.map(v => {
                      const a = APPEALS_MAP[v];
                      return a ? <Tag key={v} color="violet">{a.icon} {a.label}</Tag> : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* アクションフッター（固定） */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-100 px-4 pt-3 pb-3 max-w-md mx-auto">
        {swiped ? (
          <div className={`h-14 flex items-center justify-center rounded-2xl font-bold text-sm ${
            swiped === 'nope' ? 'bg-slate-100 text-slate-500' :
            swiped === 'super' ? 'bg-amber-50 text-amber-500' :
            'bg-emerald-50 text-emerald-600'
          }`}>
            {swiped === 'nope' ? '✕ スキップしました' : swiped === 'super' ? '★ スーパーライクしました' : '♥ いいねしました'}
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction(false)}
              className="flex-1 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-semibold text-sm hover:bg-rose-50 hover:border-rose-300 hover:text-rose-500 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              スキップ
            </button>
            <button
              onClick={() => handleAction(true, 'super')}
              disabled={superLikeRemaining <= 0}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all ${superLikeRemaining > 0 ? 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-md text-amber-400' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-40'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span className="text-[9px] mt-0.5 font-medium">{superLikeRemaining}</span>
            </button>
            <button
              onClick={() => handleAction(true)}
              className="flex-1 h-14 bg-violet-600 rounded-2xl flex items-center justify-center gap-2 text-white font-semibold text-sm hover:bg-violet-700 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              いいね
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────────
export default function Swipe() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchPopup, setMatchPopup] = useState(null);
  const [superLikeRemaining, setSuperLikeRemaining] = useState(3);
  const [selected, setSelected] = useState(null);
  const [errorToast, setErrorToast] = useState('');

  useEffect(() => {
    if (!errorToast) return;
    const timer = setTimeout(() => setErrorToast(''), 3000);
    return () => clearTimeout(timer);
  }, [errorToast]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const [data, slData] = await Promise.all([api.getCandidates(), api.getSuperLikeCount()]);
      setCandidates(data);
      setSuperLikeRemaining(slData.remaining);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleRestart = async () => {
    setLoading(true);
    try {
      await api.resetSwipes();
      await fetchCandidates();
    } catch (e) { console.error(e); setLoading(false); }
  };

  const handleSwipe = async (liked, type = 'normal') => {
    const candidate = selected || candidates[candidates.length - 1];
    if (!candidate) return;
    const candidateId = candidate.id;
    if (type === 'super' && liked) setSuperLikeRemaining(r => Math.max(0, r - 1));
    try {
      const res = await api.swipe(candidateId, liked, type);
      if (res.matched) setMatchPopup(res.partner);
    } catch (e) {
      if (e.message && e.message.includes('上限')) { setErrorToast(e.message); setSuperLikeRemaining(0); }
      console.error(e);
    }
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    if (selected) setTimeout(() => setSelected(null), 900);
    else if (candidates.length <= 1) setTimeout(fetchCandidates, 500);
  };

  // 詳細ビュー
  if (selected) {
    return (
      <>
        <CandidateDetail
          candidate={selected}
          onSwipe={handleSwipe}
          onBack={() => setSelected(null)}
          superLikeRemaining={superLikeRemaining}
        />
        {matchPopup && (
          <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 px-6" onClick={() => setMatchPopup(null)}>
            <div className="bg-white rounded-3xl p-8 w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🎊</div>
              <h2 className="text-2xl font-bold text-slate-900">マッチング成立</h2>
              <p className="text-slate-500 mt-2 text-sm">{matchPopup.name} さんとマッチしました</p>
              <button onClick={() => setMatchPopup(null)} className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors">
                メッセージを送る
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // スタック一覧ビュー
  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-slate-900">
          {user.role === 'student' ? '企業を探す' : '就活生を探す'}
        </h1>
        {!loading && candidates.length > 0 && (
          <span className="text-xs text-slate-400 font-medium">{candidates.length}件</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-slate-400">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">✓</div>
          <p className="font-semibold text-slate-600">候補を見尽くしました</p>
          <p className="text-sm mt-1">しばらく後にまた確認してください</p>
          <button onClick={handleRestart} className="mt-6 bg-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors">
            更新する
          </button>
        </div>
      ) : (
        <>
          {/* カードスタック */}
          <div className="relative h-[430px]">
            {candidates.map((c, i) => (
              <div
                key={c.id}
                style={{
                  zIndex: i,
                  opacity: i === candidates.length - 1 ? 1 : 0.7,
                  transform: `scale(${0.96 + i * 0.01}) translateY(${(candidates.length - 1 - i) * -6}px)`,
                }}
                className="absolute w-full"
              >
                {i === candidates.length - 1 ? (
                  <SwipeCard
                    candidate={c}
                    onSwipe={(liked) => handleSwipe(liked)}
                    onOpenDetail={() => setSelected(c)}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-[430px] w-full" />
                )}
              </div>
            ))}
          </div>

          {/* アクションボタン */}
          <div className="flex justify-center items-center gap-5 mt-5">
            <button
              onClick={() => handleSwipe(false)}
              className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:border-rose-300 hover:text-rose-400 hover:shadow-md transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>

            <button
              onClick={() => handleSwipe(true, 'super')}
              disabled={superLikeRemaining <= 0}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${superLikeRemaining > 0 ? 'bg-white border-amber-300 hover:border-amber-400 hover:shadow-md text-amber-400' : 'bg-slate-50 border-slate-200 text-slate-300 opacity-50'}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">残り{superLikeRemaining}</span>
            </button>

            <button
              onClick={() => handleSwipe(true)}
              className="w-14 h-14 bg-violet-600 border border-violet-600 rounded-2xl flex items-center justify-center text-white hover:bg-violet-700 hover:shadow-md transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </>
      )}

      {matchPopup && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 px-6" onClick={() => setMatchPopup(null)}>
          <div className="bg-white rounded-3xl p-8 w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🎊</div>
            <h2 className="text-2xl font-bold text-slate-900">マッチング成立</h2>
            <p className="text-slate-500 mt-2 text-sm">{matchPopup.name} さんとマッチしました</p>
            <button onClick={() => setMatchPopup(null)} className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors">
              メッセージを送る
            </button>
          </div>
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 max-w-[90%] text-center">
          {errorToast}
        </div>
      )}
    </div>
  );
}
