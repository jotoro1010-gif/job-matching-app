import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { FACULTIES, getDepartments } from '../data/faculties';
import { UNIVERSITIES } from '../data/universities';
import { INDUSTRIES, INDUSTRY_MAP } from '../data/industries';
import { JOB_VALUES, COMPANY_APPEALS } from '../data/values';

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-slate-50";
const selectClass = `${inputClass} appearance-none`;

const SALARY_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'under300', label: '〜300万円' },
  { value: '300to400', label: '300〜400万円' },
  { value: '400to500', label: '400〜500万円' },
  { value: '500to600', label: '500〜600万円' },
  { value: '600to800', label: '600〜800万円' },
  { value: 'over800', label: '800万円〜' },
];
const WORK_STYLE_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'remote', label: 'フルリモート' },
  { value: 'hybrid', label: 'ハイブリッド' },
  { value: 'onsite', label: '出社' },
];
const COMPANY_SIZE_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'startup', label: 'ベンチャー・スタートアップ' },
  { value: 'sme', label: '中小企業' },
  { value: 'large', label: '大手企業' },
  { value: 'foreign', label: '外資系' },
];
const RELOCATION_STUDENT = [
  { value: '', label: '選択してください' },
  { value: 'ok', label: '可' },
  { value: 'no', label: '不可' },
  { value: 'conditional', label: '条件付きで可' },
];
const RELOCATION_COMPANY = [
  { value: '', label: '選択してください' },
  { value: 'required', label: 'あり（必須）' },
  { value: 'optional', label: 'あり（任意）' },
  { value: 'none', label: 'なし' },
];

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-6 mb-3">{children}</p>;
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={selectClass}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </Field>
  );
}

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ name: '', bio: '', skills: '', location: '', salary_range: '', work_style: '', company_size: '', relocation: '', faculty: '', department: '', university: '', preferred_industries: [], industry: '', job_values: [], company_appeals: [] });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarData, setAvatarData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getMe().then(data => {
      setForm({
        name: data.name || '', bio: data.bio || '', skills: data.skills || '', location: data.location || '',
        salary_range: data.salary_range || '', work_style: data.work_style || '',
        company_size: data.company_size || '', relocation: data.relocation || '',
        faculty: data.faculty || '', department: data.department || '', university: data.university || '',
        preferred_industries: Array.isArray(data.preferred_industries) ? data.preferred_industries : [],
        industry: data.industry || '',
        job_values: Array.isArray(data.job_values) ? data.job_values : [],
        company_appeals: Array.isArray(data.company_appeals) ? data.company_appeals : [],
      });
      setAvatarPreview(data.avatar || '');
    }).catch(console.error);
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('画像ファイルを選択してください'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setAvatarPreview(reader.result); setAvatarData(reader.result); };
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
    } catch (e) { setMessage(e.message); } finally { setUploadingAvatar(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMe(form);
      updateUser({ name: form.name });
      setMessage('プロフィールを保存しました');
    } catch (e) { setMessage(e.message); } finally { setSaving(false); }
  };

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const isCompany = user?.role === 'company';

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-bold text-slate-900 mb-6">マイページ</h1>

      {message && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          {message}
        </div>
      )}

      {/* アバター */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-2xl border border-slate-100">
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer relative group flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            : <span className="text-3xl">{isCompany ? '🏢' : '👤'}</span>
          }
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{form.name || '未設定'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{isCompany ? '企業アカウント' : '就活生アカウント'}</p>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-violet-600 font-semibold hover:underline">写真を変更</button>
            {avatarData && (
              <button onClick={handleAvatarUpload} disabled={uploadingAvatar} className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg disabled:opacity-50">
                {uploadingAvatar ? '保存中...' : '保存'}
              </button>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <SectionLabel>基本情報</SectionLabel>

        <Field label={isCompany ? '企業名' : 'お名前'}>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} required />
        </Field>

        <Field label={isCompany ? '会社紹介・求める人材' : '自己紹介'}>
          <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} className={`${inputClass} h-24 resize-none`} />
        </Field>

        <Field label={isCompany ? '業種・事業内容' : 'スキル（例: React, Python）'}>
          <input type="text" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} className={inputClass} />
        </Field>

        <Field label="所在地">
          <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} />
        </Field>

        {!isCompany && (
          <>
            <Field label="大学名">
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
            </Field>

            <Field label="学部">
              <div className="relative">
                <select
                  value={form.faculty}
                  onChange={e => setForm({ ...form, faculty: e.target.value, department: '' })}
                  className={selectClass}
                >
                  <option value="">選択してください</option>
                  {FACULTIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </Field>

            <Field label="学科">
              <div className="relative">
                <select
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className={selectClass}
                  disabled={!form.faculty}
                >
                  <option value="">{form.faculty ? '選択してください' : '先に学部を選択'}</option>
                  {getDepartments(form.faculty).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </Field>
          </>
        )}

        <SectionLabel>マッチング条件</SectionLabel>

        {/* 希望業界（就活生：最大3つ） */}
        {!isCompany && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              希望業界
              <span className={`ml-2 font-bold ${form.preferred_industries.length >= 3 ? 'text-violet-600' : 'text-slate-400'}`}>
                {form.preferred_industries.length}/3
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(ind => {
                const selected = form.preferred_industries.includes(ind.value);
                const maxed = form.preferred_industries.length >= 3 && !selected;
                return (
                  <button
                    key={ind.value}
                    type="button"
                    disabled={maxed}
                    onClick={() => {
                      const curr = form.preferred_industries;
                      set('preferred_industries')(
                        selected ? curr.filter(v => v !== ind.value) : [...curr, ind.value]
                      );
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                      selected
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : maxed
                        ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-400'
                    }`}
                  >
                    {ind.icon} {ind.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 企業選びの軸（就活生：最大3つ） */}
        {!isCompany && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              企業選びの軸
              <span className={`ml-2 font-bold ${form.job_values.length >= 3 ? 'text-violet-600' : 'text-slate-400'}`}>
                {form.job_values.length}/3
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {JOB_VALUES.map(v => {
                const selected = form.job_values.includes(v.value);
                const maxed = form.job_values.length >= 3 && !selected;
                return (
                  <button
                    key={v.value}
                    type="button"
                    disabled={maxed}
                    onClick={() => {
                      const curr = form.job_values;
                      set('job_values')(selected ? curr.filter(x => x !== v.value) : [...curr, v.value]);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                      selected
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : maxed
                        ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-400'
                    }`}
                  >
                    {v.icon} {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 業界（企業：1つ選択） */}
        {isCompany && (
          <SelectField
            label="業界"
            value={form.industry}
            onChange={set('industry')}
            options={[{ value: '', label: '選択してください' }, ...INDUSTRIES.map(i => ({ value: i.value, label: `${i.icon} ${i.label}` }))]}
          />
        )}

        {/* 企業の売り（企業：最大3つ） */}
        {isCompany && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              企業の売り
              <span className={`ml-2 font-bold ${form.company_appeals.length >= 3 ? 'text-violet-600' : 'text-slate-400'}`}>
                {form.company_appeals.length}/3
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COMPANY_APPEALS.map(a => {
                const selected = form.company_appeals.includes(a.value);
                const maxed = form.company_appeals.length >= 3 && !selected;
                return (
                  <button
                    key={a.value}
                    type="button"
                    disabled={maxed}
                    onClick={() => {
                      const curr = form.company_appeals;
                      set('company_appeals')(selected ? curr.filter(x => x !== a.value) : [...curr, a.value]);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
                      selected
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : maxed
                        ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-400'
                    }`}
                  >
                    {a.icon} {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isCompany && <SelectField label="給与レンジ" value={form.salary_range} onChange={set('salary_range')} options={SALARY_OPTIONS} />}
        {isCompany && <SelectField label="勤務形態" value={form.work_style} onChange={set('work_style')} options={WORK_STYLE_OPTIONS} />}
        <SelectField label={isCompany ? '会社規模' : '希望会社規模'} value={form.company_size} onChange={set('company_size')} options={COMPANY_SIZE_OPTIONS} />
        <SelectField label="転勤" value={form.relocation} onChange={set('relocation')} options={isCompany ? RELOCATION_COMPANY : RELOCATION_STUDENT} />

        <div className="pt-2">
          <button type="submit" disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            {saving ? '保存中...' : 'プロフィールを保存'}
          </button>
        </div>
      </form>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <button onClick={logout} className="w-full text-slate-400 py-3 rounded-xl font-medium text-sm hover:text-slate-600 hover:bg-slate-100 transition-colors">
          ログアウト
        </button>
      </div>
    </div>
  );
}
