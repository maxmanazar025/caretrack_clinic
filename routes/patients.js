import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Get all patients (with search and doctor filter)
router.get('/', (req, res) => {
  const { search, doctor_id } = req.query;

  try {
    const patients = db.getPatients({ search, doctor_id });
    res.json(patients);
  } catch (err) {
    res.status(500).json({
      error: 'Bemorlarni yuklashda xatolik yuz berdi.',
      error_en: 'Error fetching patients.',
      details: err.message
    });
  }
});

// 2. Get a full patient profile (includes attached doctor details and all illness/diagnosis history)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const patient = db.getPatientById(id);

    if (!patient) {
      return res.status(404).json({
        error: 'Bemor topilmadi.',
        error_en: 'Patient not found.'
      });
    }

    // Get illness history
    const illnesses = db.getIllnessesByPatientId(id);

    res.json({
      ...patient,
      illnesses
    });
  } catch (err) {
    res.status(500).json({
      error: 'Bemor profilini yuklashda xatolik yuz berdi.',
      error_en: 'Error fetching patient profile.',
      details: err.message
    });
  }
});

// 3. Create a patient [Admin & Receptionist Only]
router.post('/', authorizeRoles('admin', 'receptionist'), (req, res) => {
  const { full_name, date_of_birth, gender, phone, address, doctor_id } = req.body;

  if (!full_name || !date_of_birth || !gender || !phone || !address) {
    return res.status(400).json({
      error: 'Barcha maydonlarni to\'ldiring (shifokor ixtiyoriy).',
      error_en: 'Please fill in all required fields (doctor is optional).'
    });
  }

  try {
    const newPatient = db.createPatient({
      full_name,
      date_of_birth,
      gender,
      phone,
      address,
      doctor_id
    });

    res.status(201).json({
      message: 'Bemor muvaffaqiyatli ro\'yxatga olindi.',
      message_en: 'Patient successfully registered.',
      id: newPatient.id
    });
  } catch (err) {
    res.status(500).json({
      error: 'Bemorni ro\'yxatga olishda xatolik yuz berdi.',
      error_en: 'Error registering patient.',
      details: err.message
    });
  }
});

// 4. Update patient details [Admin & Clinician Only]
router.put('/:id', authorizeRoles('admin', 'clinician'), (req, res) => {
  const { id } = req.params;
  const { full_name, date_of_birth, gender, phone, address, doctor_id } = req.body;

  if (!full_name || !date_of_birth || !gender || !phone || !address) {
    return res.status(400).json({
      error: 'Barcha maydonlarni to\'ldiring.',
      error_en: 'Please fill in all fields.'
    });
  }

  try {
    const patient = db.getPatientById(id);
    if (!patient) {
      return res.status(404).json({
        error: 'Bemor topilmadi.',
        error_en: 'Patient not found.'
      });
    }

    db.updatePatient(id, {
      full_name,
      date_of_birth,
      gender,
      phone,
      address,
      doctor_id
    });

    res.json({
      message: 'Bemor ma\'lumotlari yangilandi.',
      message_en: 'Patient details successfully updated.'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Bemor ma\'lumotlarini yangilashda xatolik yuz berdi.',
      error_en: 'Error updating patient details.',
      details: err.message
    });
  }
});

// 5. Delete patient [Admin Only]
router.delete('/:id', authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;

  try {
    const success = db.deletePatient(id);
    if (!success) {
      return res.status(404).json({
        error: 'Bemor topilmadi.',
        error_en: 'Patient not found.'
      });
    }

    res.json({
      message: 'Bemor yozuvi va unga bog\'liq tashxislar o\'chirildi.',
      message_en: 'Patient record and associated diagnoses successfully deleted.'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Bemorni o\'chirishda xatolik yuz berdi.',
      error_en: 'Error deleting patient.',
      details: err.message
    });
  }
});

export default router;
