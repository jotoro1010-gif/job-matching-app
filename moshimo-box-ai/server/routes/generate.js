import express from 'express';
import anthropic, { MODEL } from '../claudeClient.js';

const router = express.Router();

const TONE_INSTRUCTIONS = {
  sf: '硬派なSF考証のトーンで、テクノロジーや社会構造の変化を論理的に描写する。',
  emotional: '心に残る感動的なトーンで、登場人物の感情や人間ドラマを重視して描写する。',
  comedy: 'ユーモラスでコメディタッチなトーンで、突っ込みどころのある可笑しさを織り込んで描写する。',
  historical: '歴史考証風の硬い文体で、時代背景や史実との整合性を意識して描写する。',
};

router.post('/', async (req, res) => {
  const { premise, tone = 'sf' } = req.body;
  if (!premise || !premise.trim()) {
    return res.status(400).json({ error: 'premise is required' });
  }

  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.sf;
  const systemPrompt = `君はユーザーが入力した「もしも世界」の設計者。${toneInstruction}
必ず以下のJSON形式のみで出力し、それ以外の文章や前後の説明は一切含めないこと。
{
  "title": "その世界を象徴する短いタイトル",
  "visual": "具体的で没入感のある情景描写(150字程度)",
  "summary": "世界観サマリー(200字程度)",
  "branchPoints": ["現実との主な違い1", "違い2", "違い3"]
}`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: `もしも${premise}だったら` }],
    });

    const text = message.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AIの応答からJSONを抽出できませんでした');

    const world = JSON.parse(jsonMatch[0]);

    res.json({
      id: Date.now().toString(),
      premise,
      tone,
      createdAt: new Date().toISOString(),
      ...world,
    });
  } catch (err) {
    console.error('generate error:', err);
    res.status(500).json({ error: '世界の生成に失敗しました' });
  }
});

export default router;
