import express from 'express';
import anthropic, { MODEL } from '../claudeClient.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { world, history = [], message } = req.body;
  if (!world || !message || !message.trim()) {
    return res.status(400).json({ error: 'world and message are required' });
  }

  const systemPrompt = `君はユーザーが入力した『もしも世界』の案内人。その世界に深く没入した描写と対話を提供する。

【この世界の設定】
もしも設定: もしも${world.premise}だったら
タイトル: ${world.title}
情景描写: ${world.visual}
世界観サマリー: ${world.summary}
現実との違い: ${(world.branchPoints || []).join(' / ')}

上記の世界観を厳密に守り、案内人として一貫した口調で回答すること。設定に矛盾する質問には、世界観を保ったまま自然に答えること。`;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const reply = response.content?.[0]?.text ?? '';
    res.json({ reply });
  } catch (err) {
    console.error('chat error:', err);
    res.status(500).json({ error: 'チャット応答の生成に失敗しました' });
  }
});

export default router;
