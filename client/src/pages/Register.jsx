import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function Register() {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', password: '', role: '', name: '', bio: '', skills: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.register(form);
      login(user, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-pink-500">就活Match</h1>
        <p className="text-gray-500 mt-2">新規登録</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-center font-semibold text-gray-700">あなたは？</p>
          <button
            onClick={() => { setForm({ ...form, role: 'student' }); setStep(2); }}
            className="w-full bg-blue-50 border-2 border-blue-300 text-blue-700 py-4 rounded-xl font-semibold text-lg"
          >
            👩‍🎓 就活生
          </button>
          <button
            onClick={() => { setForm({ ...form, role: 'company' }); setStep(2); }}
            className="w-full bg-purple-50 border-2 border-purple-300 text-purple-700 py-4 rounded-xl font-semibold text-lg"
          >
            🏢 企業
          </button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <input
            type="text"
            placeholder={form.role === 'student' ? 'お名前' : '企業名'}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
            required
          />
          <input
            type="email"
            placeholder="メールアドレス"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
            required
          />
          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
            minLength={6}
            required
          />
          <textarea
            placeholder={form.role === 'student' ? '自己紹介（強み・やりたいことなど）' : '会社紹介・求める人材'}
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400 h-24 resize-none"
          />
          <input
            type="text"
            placeholder={form.role === 'student' ? 'スキル（例: React, Python）' : '業種・事業内容'}
            value={form.skills}
            onChange={e => setForm({ ...form, skills: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
          />
          <input
            type="text"
            placeholder="勤務地・所在地"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {loading ? '登録中...' : '登録する'}
          </button>
          <button type="button" onClick={() => setStep(1)} className="w-full text-gray-400 py-2">
            戻る
          </button>
        </form>
      )}

      <p className="text-center mt-6 text-gray-500">
        すでにアカウントをお持ちの方は{' '}
        <Link to="/login" className="text-pink-500 font-semibold">ログイン</Link>
      </p>
    </div>
  );
}
