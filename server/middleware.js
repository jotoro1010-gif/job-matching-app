const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'shukatsu_secret_key';

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'トークンが無効です' });
  }
}

module.exports = { authenticate };
