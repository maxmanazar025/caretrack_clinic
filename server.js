import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import patientRoutes from './routes/patients.js';
import illnessRoutes from './routes/illnesses.js';
import db from './database.js'; 
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/illnesses', illnessRoutes);

// Global search API endpoint
app.get('/api/search', authenticateToken, (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json({ doctors: [], patients: [], illnesses: [] });
  }

  try {
    const query = q.toLowerCase();
    
    // Search doctors
    const doctors = db.getDoctors({ search: query });
    
    // Search patients
    const patients = db.getPatients({ search: query });
    
    // Search illnesses
    const illnesses = db.getIllnesses({ search: query });

    res.json({
      doctors,
      patients,
      illnesses
    });
  } catch (err) {
    res.status(500).json({
      error: 'Qidiruvda xatolik yuz berdi.',
      error_en: 'Search error occurred.',
      details: err.message
    });
  }
});

// Fallback to index.html for SPA router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`CareTrack Clinic server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
