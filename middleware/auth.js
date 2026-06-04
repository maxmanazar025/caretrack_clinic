import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'caretrack_clinic_secret_key_123_safetynet';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Authorization: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token topilmadi. Tizimga qayta kiring.',
      error_en: 'Token not found. Please log in again.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Noto\'g\'ri yoki muddati o\'tgan token.',
        error_en: 'Invalid or expired token.'
      });
    }

    req.user = user;
    next();
  });
}
