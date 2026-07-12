// デモ画面（メール/パス不要でログインできる「デモ画面はこちら」）用の固定アカウントを用意する。
// サーバー起動のたびに冪等に実行する: ディスクが永続化されない環境（Render無料プラン等）でも
// 再起動・再デプロイのたびに自動でデモアカウントと会話データを復元する。
const bcrypt = require('bcryptjs');
const db = require('./db');

const DEMO_STUDENT_EMAIL = 'demo-student@shukatsu-match.local';
const DEMO_COMPANY_EMAIL = 'demo-company@shukatsu-match.local';

const PARTNER_COMPANIES = [
  { email: 'demo-partner-c1@shukatsu-match.local', name: '株式会社サンプルテック', bio: 'AIプロダクトを開発するスタートアップです。少数精鋭でスピード感を持って開発しています。', industry: 'it_software', work_style: 'hybrid', company_size: 'startup', salary_range: '400to500', company_appeals: ['growth', 'tech'] },
  { email: 'demo-partner-c2@shukatsu-match.local', name: '合同会社デモコンサル', bio: '大手企業向けの経営コンサルティングを行っています。若手にも裁量の大きい環境です。', industry: 'consulting', work_style: 'onsite', company_size: 'sme', salary_range: '500to600', company_appeals: ['autonomy', 'salary'] },
  { email: 'demo-partner-c3@shukatsu-match.local', name: '株式会社フューチャーネット', bio: 'インターネットサービスの企画・運営を行う成長企業です。', industry: 'internet', work_style: 'remote', company_size: 'large', salary_range: '600to800', company_appeals: ['worklife', 'remote'] },
];

const PARTNER_STUDENTS = [
  { email: 'demo-partner-s1@shukatsu-match.local', name: '中村 陽太', bio: 'Web開発とデザインが好きな大学3年生です。個人でアプリを開発した経験があります。', skills: 'React, Figma, TypeScript', university: '早稲田大学', faculty: 'engineering', department: '情報理工学科' },
  { email: 'demo-partner-s2@shukatsu-match.local', name: '佐々木 美月', bio: 'マーケティングとデータ分析に興味があります。学生団体で広報を担当していました。', skills: 'Python, SQL, Tableau', university: '慶應義塾大学', faculty: 'economics', department: '経済学科' },
  { email: 'demo-partner-s3@shukatsu-match.local', name: '高木 蓮', bio: '長期インターンでバックエンド開発を経験しています。チームでの開発が好きです。', skills: 'Node.js, Go, AWS', university: '筑波大学', faculty: 'science', department: '情報科学類' },
];

function ensureUser(fields) {
  let user = db.users.findByEmail(fields.email);
  if (user) return user;
  const { lastInsertRowid } = db.users.create(fields);
  return db.users.findById(lastInsertRowid);
}

function ensureMatchWithMessages(userAId, userBId, status, conversation) {
  const existing = db.matches.findByUser(userAId).find(m => m.user1_id === userBId || m.user2_id === userBId);
  if (existing) return existing;
  const match = db.matches.findOrCreate(userAId, userBId);
  db.matches.updateStatus(match.id, status);
  conversation.forEach(({ senderId, content }) => {
    db.messages.create(match.id, senderId, content);
  });
  return match;
}

function ensureDemoData() {
  const dummyHash = bcrypt.hashSync('demo-no-direct-login', 10);

  const demoStudent = ensureUser({
    email: DEMO_STUDENT_EMAIL, password: dummyHash, role: 'student',
    name: 'デモ 太郎', bio: 'このアカウントはデモ用のサンプルです。就活生側の画面をお試しいただけます。',
    skills: 'React, Python, チームマネジメント', location: '東京都',
    university: '駒澤大学', faculty: 'economics', department: '経営学科',
    preferred_industries: ['it_software', 'internet', 'consulting'],
    job_values: ['growth', 'worklife', 'teamwork'],
    work_style: 'hybrid', company_size: 'startup', relocation: 'conditional',
  });

  const demoCompany = ensureUser({
    email: DEMO_COMPANY_EMAIL, password: dummyHash, role: 'company',
    name: 'デモ株式会社', bio: 'このアカウントはデモ用のサンプルです。企業側の画面をお試しいただけます。',
    skills: '', location: '東京都',
    industry: 'it_software', work_style: 'hybrid', company_size: 'sme', salary_range: '400to500',
    company_appeals: ['growth', 'culture'],
  });

  const partnerCompanies = PARTNER_COMPANIES.map(ensureUser);
  const partnerStudents = PARTNER_STUDENTS.map(ensureUser);

  const studentConversations = [
    { status: 'active', partner: partnerCompanies[0], conv: [
      { from: 'partner', text: 'はじめまして！プロフィール拝見し、ぜひお話ししたく連絡しました。' },
      { from: 'demo', text: 'ご連絡ありがとうございます！興味があります、よろしくお願いします。' },
    ] },
    { status: 'document_review', partner: partnerCompanies[1], conv: [
      { from: 'demo', text: 'はじめまして、応募させていただきました。よろしくお願いいたします。' },
      { from: 'partner', text: 'ご応募ありがとうございます。まずは書類を確認させていただきますね。' },
    ] },
    { status: 'interview_scheduling', partner: partnerCompanies[2], conv: [
      { from: 'partner', text: '書類選考通過のご連絡です。一度面接でお話しできればと思います。' },
      { from: 'demo', text: 'ありがとうございます！ぜひよろしくお願いします。' },
    ] },
  ];

  studentConversations.forEach(({ status, partner, conv }) => {
    ensureMatchWithMessages(demoStudent.id, partner.id, status, conv.map(m => ({
      senderId: m.from === 'demo' ? demoStudent.id : partner.id, content: m.text,
    })));
  });

  const companyConversations = [
    { status: 'active', partner: partnerStudents[0], conv: [
      { from: 'demo', text: 'はじめまして！プロフィール拝見しました。ぜひ一度お話ししたいです。' },
      { from: 'partner', text: 'ご連絡ありがとうございます！お話しできるの楽しみにしています。' },
    ] },
    { status: 'interview_scheduling', partner: partnerStudents[1], conv: [
      { from: 'partner', text: 'はじめまして。御社のお仕事に興味があり応募しました。' },
      { from: 'demo', text: 'ご応募ありがとうございます！ぜひ一度面接でお話ししたいです。' },
    ] },
    { status: 'offer', partner: partnerStudents[2], conv: [
      { from: 'demo', text: '面接お疲れ様でした。ぜひ一緒に働きたいと社内で話しています。' },
      { from: 'partner', text: 'ありがとうございます！大変嬉しいです、こちらこそよろしくお願いします。' },
    ] },
  ];

  companyConversations.forEach(({ status, partner, conv }) => {
    ensureMatchWithMessages(demoCompany.id, partner.id, status, conv.map(m => ({
      senderId: m.from === 'demo' ? demoCompany.id : partner.id, content: m.text,
    })));
  });

  return { demoStudentId: demoStudent.id, demoCompanyId: demoCompany.id };
}

module.exports = { ensureDemoData, DEMO_STUDENT_EMAIL, DEMO_COMPANY_EMAIL };
