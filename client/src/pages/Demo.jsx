import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function Demo() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loadingRole, setLoadingRole] = useState(null);

  const handleSelect = async (role) => {
    setError('');
    setLoadingRole(role);
    try {
      const { token, user } = await api.demoLogin(role);
      login(user, token);
    } catch (err) {
      setError(err.message);
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white px-8 pt-12 pb-8">
      <div className="inline-flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">就活Match</span>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-1">デモ画面を見る</h2>
      <p className="text-slate-500 text-sm mb-6">体験したい立場を選んでください。あらかじめ探す画面やメッセージが用意されています</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleSelect('student')}
          disabled={loadingRole !== null}
          className="w-full text-left p-5 border-2 border-slate-200 hover:border-violet-400 rounded-2xl transition-all group disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-violet-50 transition-colors">🎓</div>
            <div>
              <p className="font-semibold text-slate-900">就活生としてデモを見る</p>
              <p className="text-slate-500 text-sm">企業を探す画面・マッチング相手とのやり取りを体験</p>
            </div>
            {loadingRole === 'student' ? (
              <div className="ml-auto w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg className="ml-auto text-slate-300 group-hover:text-violet-400 transition-colors flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            )}
          </div>
        </button>

        <button
          onClick={() => handleSelect('company')}
          disabled={loadingRole !== null}
          className="w-full text-left p-5 border-2 border-slate-200 hover:border-violet-400 rounded-2xl transition-all group disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-violet-50 transition-colors">🏢</div>
            <div>
              <p className="font-semibold text-slate-900">企業としてデモを見る</p>
              <p className="text-slate-500 text-sm">就活生を探す画面・マッチング相手とのやり取りを体験</p>
            </div>
            {loadingRole === 'company' ? (
              <div className="ml-auto w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <svg className="ml-auto text-slate-300 group-hover:text-violet-400 transition-colors flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            )}
          </div>
        </button>
      </div>

      <p className="text-center mt-6 text-slate-500 text-sm">
        <Link to="/login" className="text-violet-600 font-semibold hover:underline">ログイン画面に戻る</Link>
      </p>
    </div>
  );
}
