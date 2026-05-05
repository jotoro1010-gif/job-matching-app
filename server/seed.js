const bcrypt = require('bcryptjs');
const db = require('./db');

const students = [
  { name: '田中太郎', bio: 'Webエンジニアを目指しています。個人でポートフォリオサイトを制作中。チームで働くことが好きです。', skills: 'React, JavaScript, HTML/CSS', location: '東京都' },
  { name: '佐藤花子', bio: 'データサイエンス専攻。機械学習とデータ分析が得意です。インターン経験あり。', skills: 'Python, TensorFlow, SQL', location: '大阪府' },
  { name: '鈴木一郎', bio: 'モバイルアプリ開発に興味があります。Swift・Kotlinでアプリをリリース済み。', skills: 'Swift, Kotlin, React Native', location: '東京都' },
  { name: '高橋美咲', bio: 'UI/UXデザイナー志望。ユーザー中心設計を学んでおり、デザインとコードの橋渡し役を目指しています。', skills: 'Figma, Adobe XD, HTML/CSS', location: '神奈川県' },
  { name: '伊藤健太', bio: 'バックエンド開発が好き。大規模なシステム設計に興味があります。OSS活動も行っています。', skills: 'Node.js, Go, PostgreSQL', location: '愛知県' },
  { name: '渡辺さくら', bio: 'クラウド・インフラエンジニア志望。AWSの資格を取得しました。DevOpsにも興味があります。', skills: 'AWS, Docker, Terraform', location: '福岡県' },
  { name: '山本大輝', bio: 'フルスタックエンジニアを目指しています。スタートアップでのインターン経験があります。', skills: 'Vue.js, Laravel, MySQL', location: '東京都' },
  { name: '中村あかり', bio: 'セキュリティエンジニア志望。CTF参加経験あり。倫理的ハッキングを学んでいます。', skills: 'Python, Linux, Networking', location: '北海道' },
  { name: '小林翔太', bio: 'ゲーム開発が好き。Unityでスマホゲームをリリースしたことがあります。', skills: 'Unity, C#, Blender', location: '大阪府' },
  { name: '加藤奈々', bio: 'プロダクトマネージャー志望。エンジニアとビジネスの両方を理解できる人材を目指しています。', skills: 'Python, Excel, Figma', location: '東京都' },
  { name: '吉田勇気', bio: '組み込みシステム開発に興味。IoTデバイスの自作が趣味です。', skills: 'C, C++, Raspberry Pi', location: '宮城県' },
  { name: '山田愛', bio: 'フロントエンド専攻。アクセシビリティとパフォーマンス最適化に力を入れています。', skills: 'React, TypeScript, Next.js', location: '東京都' },
  { name: '松本拓海', bio: 'ブロックチェーン技術に興味があり、DAppsの開発を学んでいます。', skills: 'Solidity, JavaScript, Web3.js', location: '京都府' },
  { name: '井上莉子', bio: '自然言語処理専攻。LLMのファインチューニングを研究中です。', skills: 'Python, PyTorch, Transformers', location: '東京都' },
  { name: '木村陽太', bio: 'SRE志望。高可用性システムの設計・運用に興味があります。', skills: 'Kubernetes, Prometheus, Go', location: '神奈川県' },
  { name: '林菜々子', bio: 'Webデザイナー兼フロントエンドエンジニア。デザインシステムの構築が得意です。', skills: 'React, Figma, Tailwind CSS', location: '大阪府' },
  { name: '清水康平', bio: 'データエンジニア志望。ETLパイプラインの構築経験があります。', skills: 'Python, Spark, BigQuery', location: '東京都' },
  { name: '山口美月', bio: 'QAエンジニア志望。テスト自動化とCI/CDに強みがあります。', skills: 'Selenium, Jest, GitHub Actions', location: '広島県' },
  { name: '池田優', bio: 'クロスプラットフォームアプリ開発が得意。Flutter歴2年です。', skills: 'Flutter, Dart, Firebase', location: '東京都' },
  { name: '橋本悠太', bio: 'VR/AR開発に興味があります。Meta Questでのアプリ開発経験あり。', skills: 'Unity, C#, OpenXR', location: '兵庫県' },
  { name: '阿部彩花', bio: 'テックリード志望。アーキテクチャ設計とチームマネジメントに興味があります。', skills: 'Java, Spring Boot, Microservices', location: '東京都' },
  { name: '斎藤浩二', bio: 'DevOpsエンジニア志望。インフラ自動化とコスト最適化が好きです。', skills: 'AWS, Ansible, Python', location: '埼玉県' },
  { name: '森田未来', bio: 'プロダクトデザイナー志望。ユーザーインタビューとプロトタイピングが得意です。', skills: 'Figma, Framer, UserResearch', location: '東京都' },
  { name: '石川竜也', bio: 'コンピュータビジョン専攻。画像認識AIの研究をしています。', skills: 'Python, OpenCV, PyTorch', location: '愛知県' },
  { name: '前田千夏', bio: '経営情報学専攻。IT戦略とデジタルトランスフォーメーションを学んでいます。', skills: 'Python, Tableau, SQL', location: '東京都' },
  { name: '藤田雄大', bio: 'ネットワークエンジニア志望。CCNAを取得しクラウドへの移行に取り組んでいます。', skills: 'Cisco, AWS, Python', location: '千葉県' },
  { name: '岡田梨花', bio: 'AIプロダクトのUXに興味。エンジニアとデザイナーの橋渡し役を目指しています。', skills: 'Figma, Python, Prompt Engineering', location: '東京都' },
  { name: '後藤和馬', bio: 'Rustが好きなシステムプログラマー志望。低レイヤーの処理に興味があります。', skills: 'Rust, C, Linux', location: '京都府' },
  { name: '長谷川麻衣', bio: 'EdTechに興味。教育×テクノロジーで社会課題を解決したいと考えています。', skills: 'React, Node.js, Firebase', location: '東京都' },
  { name: '村田聖也', bio: 'FinTech志望。決済システムやセキュリティに強みを持つエンジニアを目指しています。', skills: 'Java, Spring, Kafka', location: '東京都' },
];

const companies = [
  { name: '株式会社テックラボ', bio: 'AI・機械学習プロダクトを開発するスタートアップ。自由な開発文化が特徴です。裁量を持って働きたいエンジニアを募集中。', skills: 'AI/ML, SaaS, スタートアップ', location: '東京都渋谷区' },
  { name: '合同会社イノベーションハブ', bio: 'DXソリューションを企業に提供。多様なプロジェクトに携われる環境です。リモートワーク可。', skills: 'DX, コンサルティング, 受託開発', location: '大阪府大阪市' },
  { name: '株式会社デジタルウェーブ', bio: 'ECプラットフォームの開発・運営。急成長中で積極採用中。年次に関係なく活躍できます。', skills: 'EC, フルスタック, 急成長', location: '東京都新宿区' },
  { name: '株式会社ネクストビジョン', bio: 'ヘルスケアITのリーディングカンパニー。医療×テクノロジーで社会貢献できます。', skills: 'ヘルスケア, SaaS, B2B', location: '神奈川県横浜市' },
  { name: '合同会社クリエイティブハブ', bio: 'ゲーム・エンタメ向けのAIツールを開発。クリエイターを支援する製品を作っています。', skills: 'ゲーム, AI, クリエイティブ', location: '東京都港区' },
  { name: '株式会社フューチャーコード', bio: 'フィンテックサービスを展開。金融×テクノロジーで新しいサービスを作っています。スキルアップ支援充実。', skills: 'FinTech, セキュリティ, 決済', location: '東京都千代田区' },
  { name: '株式会社スマートライフ', bio: 'IoTを活用したスマートホームサービスを開発。ハードとソフトの両方を扱えます。', skills: 'IoT, 組み込み, クラウド', location: '愛知県名古屋市' },
  { name: '株式会社グローバルテック', bio: 'グローバルに展開するSaaSプロダクト。英語環境での開発経験が積めます。', skills: 'グローバル, SaaS, 英語', location: '東京都品川区' },
  { name: '合同会社エデュテック', bio: 'オンライン教育プラットフォームを運営。EdTechで教育格差をなくすことを目指しています。', skills: 'EdTech, 教育, プラットフォーム', location: '東京都文京区' },
  { name: '株式会社クリーンテック', bio: '環境テクノロジーで脱炭素を推進。GreenTechのリーダーとして注目されています。', skills: 'GreenTech, データ分析, 社会課題', location: '京都府京都市' },
  { name: '株式会社モバイルファースト', bio: 'スマートフォンアプリの企画・開発。ユーザー数1000万を超えるアプリを手がけています。', skills: 'iOS, Android, Flutter', location: '東京都渋谷区' },
  { name: '株式会社セキュアシールド', bio: 'サイバーセキュリティのスペシャリスト集団。ホワイトハッカーが活躍できる環境です。', skills: 'セキュリティ, ペネトレーション, 診断', location: '東京都中央区' },
  { name: '合同会社アグリテック', bio: '農業×AIで食料問題を解決。ドローンや画像解析技術を活用した農業支援システムを開発。', skills: 'AgriTech, AI, ドローン', location: '北海道札幌市' },
  { name: '株式会社メタバースラボ', bio: 'VR/ARを活用したメタバース空間を開発。次世代のコミュニケーションを創出しています。', skills: 'VR/AR, Unity, 3DCG', location: '東京都渋谷区' },
  { name: '株式会社ロジテック', bio: '物流テクノロジーで配送効率を最大化。ルート最適化AIを開発・運用しています。', skills: '物流, 最適化, AI', location: '大阪府大阪市' },
  { name: '株式会社ヘルスAI', bio: 'AIを活用した医療診断支援システムを開発。医師とエンジニアが共同で働く環境です。', skills: '医療AI, 画像認識, Python', location: '東京都文京区' },
  { name: '合同会社スポーツテック', bio: 'スポーツ×データ分析で選手のパフォーマンスを最大化。スポーツが好きなエンジニア歓迎。', skills: 'スポーツ分析, データサイエンス, iOS', location: '大阪府大阪市' },
  { name: '株式会社リーガルテック', bio: '法律×テクノロジーでリーガルサービスをDX。弁護士とエンジニアが協力して開発しています。', skills: 'LegalTech, NLP, SaaS', location: '東京都千代田区' },
  { name: '株式会社スマートファクトリー', bio: '製造業向けIoTプラットフォームを開発。工場の生産効率を劇的に改善しています。', skills: '製造, IoT, エッジコンピューティング', location: '愛知県豊田市' },
  { name: '株式会社トラベルテック', bio: '旅行・観光テクノロジーで体験を豊かに。インバウンド向けサービスも展開中。', skills: '観光, 多言語, API', location: '東京都新宿区' },
  { name: '合同会社フードテック', bio: 'フードデリバリーと食料品DXのプラットフォームを運営。急成長スタートアップ。', skills: 'FoodTech, EC, ロジスティクス', location: '東京都目黒区' },
  { name: '株式会社ブロックチェーンラボ', bio: 'Web3・ブロックチェーン技術の社会実装に取り組むベンチャー。', skills: 'Web3, Solidity, DeFi', location: '東京都港区' },
  { name: '株式会社クラウドアーキテクト', bio: 'クラウドインフラのコンサルティングと構築。AWSパートナー企業として多数の案件を手がけています。', skills: 'AWS, GCP, インフラ', location: '東京都品川区' },
  { name: '合同会社データブリッジ', bio: 'データ分析・BI導入のプロフェッショナル集団。クライアントのデータ活用を支援しています。', skills: 'データ分析, BI, SQL', location: '福岡県福岡市' },
  { name: '株式会社ペイメントプロ', bio: '決済インフラを支えるFinTech企業。高い信頼性と安全性が求められる環境でスキルアップ。', skills: '決済, セキュリティ, Java', location: '東京都中央区' },
  { name: '株式会社ビジョンAI', bio: 'コンピュータビジョン技術で製造・小売業のDXを推進。論文→製品化が得意なチームです。', skills: 'Computer Vision, PyTorch, C++', location: '東京都渋谷区' },
  { name: '合同会社リモートワークス', bio: 'フルリモートのSaaS企業。働き方改革ツールを自社で使いながら開発しています。', skills: 'SaaS, リモート, コラボレーション', location: '全国（フルリモート）' },
  { name: '株式会社アクセシビリティテック', bio: '障害者・高齢者向けのインクルーシブテクノロジーを開発。社会的インパクトを重視する会社です。', skills: 'アクセシビリティ, React, iOS', location: '東京都豊島区' },
  { name: '株式会社スマートエナジー', bio: 'エネルギーマネジメントシステムを開発。再生可能エネルギーの普及に貢献しています。', skills: 'エネルギー, IoT, データ分析', location: '東京都江東区' },
  { name: '合同会社HRテック', bio: '採用・人事管理のSaaSプロダクトを開発。HR領域のDXをリードする急成長スタートアップ。', skills: 'HRTech, SaaS, データ活用', location: '東京都渋谷区' },
];

async function seed() {
  // 既にシード済みか確認
  const fs = require('fs');
  const path = require('path');
  const dbPath = path.join(__dirname, 'db.json');
  const existing = fs.existsSync(dbPath)
    ? JSON.parse(fs.readFileSync(dbPath, 'utf8')).users.filter(u => u.email.endsWith('@seed.example.com'))
    : [];

  if (existing.length >= 60) {
    console.log(`ℹ️  シードデータは既に存在します（${existing.length}件）。スキップします。`);
    return;
  }

  const password = await bcrypt.hash('password123', 10);
  let added = 0;

  students.forEach((s, i) => {
    const email = `student${i + 1}@seed.example.com`;
    try {
      db.users.create({ ...s, email, password, role: 'student' });
      added++;
    } catch (e) {
      if (e.code !== 'UNIQUE') throw e;
    }
  });

  companies.forEach((c, i) => {
    const email = `company${i + 1}@seed.example.com`;
    try {
      db.users.create({ ...c, email, password, role: 'company' });
      added++;
    } catch (e) {
      if (e.code !== 'UNIQUE') throw e;
    }
  });

  console.log(`✅ シード完了: ${added} 件追加`);
  console.log('ログインパスワード: password123');
}

seed().catch(e => { console.error(e); process.exit(1); });
