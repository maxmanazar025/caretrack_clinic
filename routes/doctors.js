import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = express.Router();

// Apply auth middleware to all doctor routes
router.use(authenticateToken);

// 1. Get all doctors (with optional search and department filter)
router.get('/', (req, res) => {
  const { search, department } = req.query;
  
  try {
    const doctors = db.getDoctors({ search, department });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({
      error: 'Shifokorlarni yuklashda xatolik.',
      error_en: 'Error fetching doctors.',
      details: err.message
    });
  }
});

// 2. Get a single doctor profile (including their assigned patients)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  try {
    const doctor = db.getDoctorById(id);

    if (!doctor) {
      return res.status(404).json({
        error: 'Shifokor topilmadi.',
        error_en: 'Doctor not found.'
      });
    }

    // Get patients of this doctor
    const patients = db.getPatients({ doctor_id: id });

    res.json({
      ...doctor,
      patients
    });
  } catch (err) {
    res.status(500).json({
      error: 'Shifokor profilini yuklashda xatolik.',
      error_en: 'Error fetching doctor profile.',
      details: err.message
    });
  }
});

// 3. Create a new doctor [Admin Only]
router.post('/', authorizeRoles('admin'), (req, res) => {
  const { full_name, specialization, department, phone, email } = req.body;

  if (!full_name || !specialization || !department || !phone || !email) {
    return res.status(400).json({
      error: 'Barcha maydonlarni to\'ldiring.',
      error_en: 'Please fill in all fields.'
    });
  }

  try {
    // Check if email already exists in doctors list
    const doctorsList = db.getDoctors();
    const emailExists = doctorsList.some(d => d.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({
        error: 'Bu email bilan ro\'yxatdan o\'tgan shifokor mavjud.',
        error_en: 'Doctor with this email already exists.'
      });
    }

    const newDoc = db.createDoctor({ full_name, specialization, department, phone, email });

    res.status(201).json({
      message: 'Shifokor muvaffaqiyatli yaratildi.',
      message_en: 'Doctor successfully created.',
      id: newDoc.id
    });
  } catch (err) {
    res.status(500).json({
      error: 'Shifokor yaratishda xatolik yuz berdi.',
      error_en: 'Error creating doctor.',
      details: err.message
    });
  }
});

// 4. Update an existing doctor [Admin Only]
router.put('/:id', authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;
  const { full_name, specialization, department, phone, email } = req.body;

  if (!full_name || !specialization || !department || !phone || !email) {
    return res.status(400).json({
      error: 'Barcha maydonlarni to\'ldiring.',
      error_en: 'Please fill in all fields.'
    });
  }

  try {
    const doctor = db.getDoctorById(id);
    if (!doctor) {
      return res.status(404).json({
        error: 'Shifokor topilmadi.',
        error_en: 'Doctor not found.'
      });
    }

    // Check email unique constraint excluding current doctor
    const doctorsList = db.getDoctors();
    const emailConflict = doctorsList.some(d => d.email.toLowerCase() === email.toLowerCase() && d.id !== parseInt(id, 10));
    if (emailConflict) {
      return res.status(400).json({
        error: 'Bu email band. Boshqa email kiriting.',
        error_en: 'Email is already taken by another doctor.'
      });
    }

    db.updateDoctor(id, { full_name, specialization, department, phone, email });

    res.json({
      message: 'Shifokor muvaffaqiyatli yangilandi.',
      message_en: 'Doctor successfully updated.'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Shifokorni yangilashda xatolik yuz berdi.',
      error_en: 'Error updating doctor.',
      details: err.message
    });
  }
});

// 5. Delete a doctor [Admin Only]
router.delete('/:id', authorizeRoles('admin'), (req, res) => {
  const { id } = req.params;

  try {
    const success = db.deleteDoctor(id);
    if (!success) {
      return res.status(404).json({
        error: 'Shifokor topilmadi.',
        error_en: 'Doctor not found.'
      });
    }

    res.json({
      message: 'Shifokor muvaffaqiyatli o\'chirildi.',
      message_en: 'Doctor successfully deleted.'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Shifokorni o\'chirishda xatolik yuz berdi.',
      error_en: 'Error deleting doctor.',
      details: err.message
    });
  }
});

export default router;
