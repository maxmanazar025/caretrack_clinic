import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'caretrack_clinic_secret_key_123_safetynet';

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email va parolni kiriting.',
      error_en: 'Please provide email and password.'
    });
  }

  try {
    const user = db.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: 'Email yoki parol noto\'g\'ri.',
        error_en: 'Invalid email or password.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Email yoki parol noto\'g\'ri.',
        error_en: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (err) {
    res.status(500).json({
      error: 'Tizimda xatolik yuz berdi.',
      error_en: 'Server error occurred.',
      details: err.message
    });
  }
});

// Profile route
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
