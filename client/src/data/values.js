export const JOB_VALUES = [
  { value: 'growth',    label: '成長・スキルアップ',       icon: '📈' },
  { value: 'salary',    label: '給与・待遇',               icon: '💴' },
  { value: 'worklife',  label: 'ワークライフバランス',       icon: '⚖️' },
  { value: 'impact',    label: '社会貢献・インパクト',       icon: '🌱' },
  { value: 'stability', label: '安定・長期雇用',            icon: '🏛️' },
  { value: 'global',    label: 'グローバル展開',            icon: '🌍' },
  { value: 'tech',      label: '技術力・イノベーション',     icon: '🔬' },
  { value: 'culture',   label: '社風・カルチャー',           icon: '🎯' },
  { value: 'autonomy',  label: '裁量・自由度',              icon: '🗝️' },
  { value: 'brand',     label: 'ブランド・知名度',           icon: '⭐' },
  { value: 'training',  label: '育成・研修制度',            icon: '📚' },
  { value: 'diversity', label: '多様性・インクルージョン',   icon: '🤝' },
  { value: 'remote',    label: 'リモート・柔軟勤務',        icon: '🏠' },
  { value: 'teamwork',  label: 'チームワーク・仲間',        icon: '👥' },
];

export const COMPANY_APPEALS = [
  { value: 'growth',    label: '成長・スキルアップ環境',     icon: '📈' },
  { value: 'salary',    label: '業界水準以上の給与',         icon: '💴' },
  { value: 'worklife',  label: '残業少・ライフバランス重視', icon: '⚖️' },
  { value: 'impact',    label: '社会課題解決型ビジネス',     icon: '🌱' },
  { value: 'stability', label: '安定経営・長期雇用',         icon: '🏛️' },
  { value: 'global',    label: 'グローバル展開・海外経験',   icon: '🌍' },
  { value: 'tech',      label: '最先端技術・R&D重視',        icon: '🔬' },
  { value: 'culture',   label: 'フラットな社風',             icon: '🎯' },
  { value: 'autonomy',  label: '若手への大きな裁量',         icon: '🗝️' },
  { value: 'brand',     label: '業界シェアNo.1・高知名度',   icon: '⭐' },
  { value: 'training',  label: '充実した研修・育成制度',     icon: '📚' },
  { value: 'diversity', label: 'ダイバーシティ推進',         icon: '🤝' },
  { value: 'remote',    label: 'リモート・フレックス制度',   icon: '🏠' },
  { value: 'teamwork',  label: 'チームワーク重視の文化',     icon: '👥' },
];

export const APPEALS_MAP = Object.fromEntries(COMPANY_APPEALS.map(a => [a.value, a]));
export const VALUES_MAP  = Object.fromEntries(JOB_VALUES.map(v => [v.value, v]));
