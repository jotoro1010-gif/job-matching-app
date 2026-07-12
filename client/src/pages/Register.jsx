import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';
import { FACULTIES, getDepartments } from '../data/faculties';
import { UNIVERSITIES } from '../data/universities';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-slate-50";

export default function Register() {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', role: '', name: '', bio: '', skills: '', location: '', faculty: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@shukatsu-match.local`;
      const { token, user } = await api.register({ ...form, email: guestEmail, password: 'guest-prototype' });
      login(user, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white px-8 pt-12 pb-8">
      {/* ロゴ */}
      <div className="inline-flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">就活Match</span>
      </div>

      {/* ステップ表示 */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400'}`}>1</div>
        <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-violet-600' : 'bg-slate-200'}`} />
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-400'}`}>2</div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">あなたの立場は？</h2>
          <p className="text-slate-500 text-sm mb-6">登録するアカウントの種類を選んでください</p>
          <div className="space-y-3">
            <button
              onClick={() => { setForm({ ...form, role: 'student' }); setStep(2); }}
              className="w-full text-left p-5 border-2 border-slate-200 hover:border-violet-400 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-violet-50 transition-colors">🎓</div>
                <div>
                  <p className="font-semibold text-slate-900">就活生として登録</p>
                  <p className="text-slate-500 text-sm">理想の企業を探す</p>
                </div>
                <svg className="ml-auto text-slate-300 group-hover:text-violet-400 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </button>

            <button
              onClick={() => { setForm({ ...form, role: 'company' }); setStep(2); }}
              className="w-full text-left p-5 border-2 border-slate-200 hover:border-violet-400 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-violet-50 transition-colors">🏢</div>
                <div>
                  <p className="font-semibold text-slate-900">企業として登録</p>
                  <p className="text-slate-500 text-sm">優秀な人材を探す</p>
                </div>
                <svg className="ml-auto text-slate-300 group-hover:text-violet-400 transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">プロフィール設定</h2>
          <p className="text-slate-500 text-sm mb-6">{form.role === 'student' ? '就活生' : '企業'}として登録します</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                {form.role === 'student' ? 'お名前' : '企業名'}
              </label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder={form.role === 'student' ? '山田 太郎' : '株式会社〇〇'} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                {form.role === 'student' ? '自己紹介' : '会社紹介'}
              </label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className={`${inputClass} h-24 resize-none`} placeholder={form.role === 'student' ? '強み・やりたいことなど' : '事業内容・求める人材像'} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                {form.role === 'student' ? 'スキル' : '業種'}
              </label>
              <input type="text" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className={inputClass} placeholder={form.role === 'student' ? 'React, Python, Figma...' : 'SaaS, フィンテック...'} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">所在地</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="東京都渋谷区" />
            </div>

            {form.role === 'student' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">大学名</label>
                  <input
                    type="text"
                    list="university-list"
                    value={form.university}
                    onChange={e => setForm({ ...form, university: e.target.value })}
                    className={inputClass}
                    placeholder="例：東京大学"
                    autoComplete="off"
                  />
                  <datalist id="university-list">
                    {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">学部</label>
                  <div className="relative">
                    <select
                      value={form.faculty}
                      onChange={e => setForm({ ...form, faculty: e.target.value, department: '' })}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">選択してください</option>
                      {FACULTIES.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">学科</label>
                  <div className="relative">
                    <select
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      className={`${inputClass} appearance-none`}
                      disabled={!form.faculty}
                    >
                      <option value="">{form.faculty ? '選択してください' : '先に学部を選択'}</option>
                      {getDepartments(form.faculty).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="px-5 py-3 border border-slate-200 text-slate-500 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
                戻る
              </button>
              <button type="submit" disabled={loading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                {loading ? '登録中...' : 'アカウントを作成'}
              </button>
            </div>
          </form>
        </div>
      )}

      <p className="text-center mt-6 text-slate-500 text-sm">
        既存のアカウントを使う方は{' '}
        <Link to="/login" className="text-violet-600 font-semibold hover:underline">アカウントを選ぶ</Link>
      </p>
    </div>
  );
}
