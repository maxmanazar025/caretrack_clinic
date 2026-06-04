import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Get all illnesses (with search and severity filter, populated with patient name)
router.get('/', (req, res) => {
  const { search, severity } = req.query;

  try {
    const illnesses = db.getIllnesses({ search, severity });
    res.json(illnesses);
  } catch (err) {
    res.status(500).json({
      error: 'Tashxislar tarixini yuklashda xatolik yuz berdi.',
      error_en: 'Error fetching illness records.',
      details: err.message
    });
  }
});

// 2. Create a new illness/diagnosis record [Admin & Clinician Only]
router.post('/', authorizeRoles('admin', 'clinician'), (req, res) => {
  const { icd_code, description, severity, patient_id, diagnosed_at } = req.body;

  if (!icd_code || !description || !severity || !patient_id || !diagnosed_at) {
    return res.status(400).json({
      error: 'Barcha maydonlarni to\'ldiring.',
      error_en: 'Please fill in all fields.'
    });
  }

  try {
    // Check if patient exists
    const patient = db.getPatientById(patient_id);
    if (!patient) {
      return res.status(400).json({
        error: 'Bunday bemor mavjud emas.',
        error_en: 'Patient does not exist.'
      });
    }

    const newIll = db.createIllness({ icd_code, description, severity, patient_id, diagnosed_at });

    res.status(201).json({
      message: 'Tashxis yozuvi muvaffaqiyatli saqlandi.',
      message_en: 'Illness record successfully added.',
      id: newIll.id
    });
  } catch (err) {
    res.status(500).json({
      error: 'Tashxis yozishda xatolik yuz berdi.',
      error_en: 'Error adding illness record.',
      details: err.message
    });
  }
});

// 3. Update an illness/diagnosis record [Admin & Clinician Only]
router.put('/:id', authorizeRoles('admin', 'clinician'), (req, res) => {
  const { id } = req.params;
  const { icd_code, description, severity, diagnosed_at } = req.body;

  if (!icd_code || !description || !severity || !diagnosed_at) {
    return res.status(400).json({
      error: 'Barcha maydonlarni to\'ldiring.',
      error_en: 'Please fill in all fields.'
    });
  }

  try {
    const success = db.updateIllness(id, { icd_code, description, severity, diagnosed_at });
    if (!success) {
      return res.status(404).json({
        error: 'Tashxis yozuvi topilmadi.',
        error_en: 'Illness record not found.'
      });
    }

    res.json({
      message: 'Tashxis yozuvi muvaffaqiyatli yangilandi.',
      message_en: 'Illness record successfully updated.'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Tashxisni yangilashda xatolik yuz berdi.',
      error_en: 'Error updating illness record.',
      details: err.message
    });
  }
});

// 4. Delete an illness/diagnosis record [Admin Only]
router.delete('/:id', authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;

  try {
    const success = db.deleteIllness(id);
    if (!success) {
      return res.status(404).json({
        error: 'Tashxis yozuvi topilmadi.',
        error_en: 'Illness record not found.'
      });
    }

    res.json({
      message: 'Tashxis yozuvi o\'chirildi.',
      message_en: 'Illness record successfully deleted.'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Tashxisni o\'chirishda xatolik yuz berdi.',
      error_en: 'Error deleting illness record.',
      details: err.message
    });
  }
});

export default router;
