import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ name: '', bio: '', skills: '', location: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarData, setAvatarData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getMe().then(data => {
      setForm({ name: data.name || '', bio: data.bio || '', skills: data.skills || '', location: data.location || '' });
      setAvatarPreview(data.avatar || '');
    }).catch(console.error);
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('画像ファイルを選択してください');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarData) return;
    setUploadingAvatar(true);
    try {
      const { avatar } = await api.updateAvatar(avatarData);
      updateUser({ avatar });
      setAvatarData(null);
      setMessage('プロフィール写真を更新しました');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMe(form);
      updateUser({ name: form.name });
      setMessage('プロフィールを保存しました');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">プロフィール</h1>

      {message && (
        <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
          {message}
        </div>
      )}

      {/* アバター */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center cursor-pointer relative group"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">{user?.role === 'company' ? '🏢' : '👤'}</span>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <span className="text-white text-xs font-medium">変更</span>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 text-pink-500 text-sm font-medium"
        >
          写真を変更
        </button>
        {avatarData && (
          <button
            onClick={handleAvatarUpload}
            disabled={uploadingAvatar}
            className="mt-2 bg-pink-500 text-white px-5 py-1.5 rounded-full text-sm font-medium disabled:opacity-50"
          >
            {uploadingAvatar ? 'アップロード中...' : '写真を保存する'}
          </button>
        )}
      </div>

      {/* プロフィール編集フォーム */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {user?.role === 'company' ? '企業名' : 'お名前'}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {user?.role === 'company' ? '会社紹介・求める人材' : '自己紹介'}
          </label>
          <textarea
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400 h-28 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {user?.role === 'company' ? '業種・事業内容' : 'スキル（例: React, Python）'}
          </label>
          <input
            type="text"
            value={form.skills}
            onChange={e => setForm({ ...form, skills: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">所在地</label>
          <input
            type="text"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-pink-400"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {saving ? '保存中...' : 'プロフィールを保存'}
        </button>
      </form>

      <button
        onClick={logout}
        className="mt-8 w-full border border-gray-300 text-gray-500 py-3 rounded-xl font-medium"
      >
        ログアウト
      </button>
    </div>
  );
}
