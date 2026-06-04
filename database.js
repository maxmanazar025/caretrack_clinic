import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db.json');

// Ma'lumotlar tuzilmasi
let data = {
  users: [],
  doctors: [],
  patients: [],
  illnesses: []
};


// Ma'lumotlarni JSON faylga saqlash
function saveData() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Data saving error:', err);
  }
}

// Json fayldan ma'lumotlarni yuklash
function loadData() {
  try {
    if (fs.existsSync(dbPath)) {
      const fileContent = fs.readFileSync(dbPath, 'utf8');
      data = JSON.parse(fileContent);
    } else {
      seedDatabase();
    }
  } catch (err) {
    console.error('Data loading error, seeding default:', err);
    seedDatabase();
  }
}

// Seed function
function seedDatabase() {
  console.log('Seeding pure JS database with default records...');
  
  const saltRounds = 10;
  
  // 1. Seed Users
  data.users = [
    {
      id: 1,
      email: 'admin@medicore.uz',
      password_hash: bcrypt.hashSync('admin123', saltRounds),
      role: 'admin',
      full_name: 'Administrator MediCore',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      email: 'doctor@medicore.uz',
      password_hash: bcrypt.hashSync('doctor123', saltRounds),
      role: 'clinician',
      full_name: 'Dr. Madina Karimova',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      email: 'recept@medicore.uz',
      password_hash: bcrypt.hashSync('recept123', saltRounds),
      role: 'receptionist',
      full_name: 'Zuhra Qobilova',
      created_at: new Date().toISOString()
    }
  ];

  // 2. Seed Doctors
  data.doctors = [
    {
      id: 1,
      full_name: 'Dr. Shaxzod Alimov',
      specialization: 'Kardiolog (Cardiologist)',
      department: 'Cardiology',
      phone: '+998 90 123-45-67',
      email: 'shaxzod.alimov@medicore.uz',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      full_name: 'Dr. Madina Karimova',
      specialization: 'Nevropatolog (Neurologist)',
      department: 'Neurology',
      phone: '+998 91 987-65-43',
      email: 'doctor@medicore.uz',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      full_name: 'Dr. Rustam Yusupov',
      specialization: 'Dermatolog (Dermatologist)',
      department: 'Dermatology',
      phone: '+998 93 111-22-33',
      email: 'rustam.yusupov@medicore.uz',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      full_name: 'Dr. Elena Petrova',
      specialization: 'Ortoped (Orthopedist)',
      department: 'Orthopedics',
      phone: '+998 94 444-55-66',
      email: 'elena.petrova@medicore.uz',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      full_name: 'Dr. Sardor Olimov',
      specialization: 'Terapevt (General Practitioner)',
      department: 'General Medicine',
      phone: '+998 95 555-66-77',
      email: 'sardor.olimov@medicore.uz',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // 3. Seed Patients
  data.patients = [
    {
      id: 1,
      full_name: 'Jasur Aliev',
      date_of_birth: '1990-05-12',
      gender: 'male',
      phone: '+998 99 999-88-77',
      address: 'Toshkent sh., Yunusobod tumani, 4-daha',
      doctor_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      full_name: 'Nilufar Umarova',
      date_of_birth: '1985-08-22',
      gender: 'female',
      phone: '+998 97 777-66-55',
      address: 'Toshkent sh., Chilonzor tumani, Lutfiy ko\'chasi',
      doctor_id: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      full_name: 'Bekzod Rustamov',
      date_of_birth: '1999-12-01',
      gender: 'male',
      phone: '+998 90 222-33-44',
      address: 'Samarqand sh., Dahbed ko\'chasi, 12-uy',
      doctor_id: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // 4. Seed Illnesses (Tashxislar)
  data.illnesses = [
    {
      id: 1,
      icd_code: 'I10',
      description: 'Arterial Gipertenziya (Essential hypertension)',
      severity: 'medium',
      patient_id: 1,
      diagnosed_at: '2026-01-15',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      icd_code: 'E11',
      description: 'Qandli diabet 2-tip (Type 2 diabetes mellitus)',
      severity: 'medium',
      patient_id: 1,
      diagnosed_at: '2026-03-10',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      icd_code: 'G43',
      description: 'Migren (Migraine without aura)',
      severity: 'high',
      patient_id: 2,
      diagnosed_at: '2026-02-20',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      icd_code: 'J06.9',
      description: 'O\'tkir yuqori nafas yo\'llari infeksiyasi (Acute upper respiratory infection, unspecified)',
      severity: 'low',
      patient_id: 3,
      diagnosed_at: '2026-05-18',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  saveData();
}

// Load data initially
loadData();

// Database Service API
const db = {
  // --- USERS ---
  getUserByEmail(email) {
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  // --- DOCTORS ---
  getDoctors({ search, department } = {}) {
    let list = [...data.doctors];
    if (department) {
      list = list.filter(d => d.department === department);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => 
        d.full_name.toLowerCase().includes(q) || 
        d.specialization.toLowerCase().includes(q) || 
        d.email.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.full_name.localeCompare(b.full_name));
  },

  getDoctorById(id) {
    const docId = parseInt(id, 10);
    return data.doctors.find(d => d.id === docId) || null;
  },

  createDoctor(doctorData) {
    const id = data.doctors.length > 0 ? Math.max(...data.doctors.map(d => d.id)) + 1 : 1;
    const newDoc = {
      id,
      full_name: doctorData.full_name,
      specialization: doctorData.specialization,
      department: doctorData.department,
      phone: doctorData.phone,
      email: doctorData.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.doctors.push(newDoc);
    saveData();
    return newDoc;
  },

  updateDoctor(id, doctorData) {
    const docId = parseInt(id, 10);
    const index = data.doctors.findIndex(d => d.id === docId);
    if (index === -1) return null;

    data.doctors[index] = {
      ...data.doctors[index],
      full_name: doctorData.full_name,
      specialization: doctorData.specialization,
      department: doctorData.department,
      phone: doctorData.phone,
      email: doctorData.email,
      updated_at: new Date().toISOString()
    };
    saveData();
    return data.doctors[index];
  },

  deleteDoctor(id) {
    const docId = parseInt(id, 10);
    const index = data.doctors.findIndex(d => d.id === docId);
    if (index === -1) return false;

    data.doctors.splice(index, 1);
    
    // Set doctor_id to null in patients who were assigned to this doctor
    data.patients = data.patients.map(p => {
      if (p.doctor_id === docId) {
        return { ...p, doctor_id: null, updated_at: new Date().toISOString() };
      }
      return p;
    });

    saveData();
    return true;
  },

  // --- PATIENTS ---
  getPatients({ search, doctor_id } = {}) {
    let list = data.patients.map(p => {
      const doc = data.doctors.find(d => d.id === p.doctor_id);
      return {
        ...p,
        doctor_name: doc ? doc.full_name : null
      };
    });

    if (doctor_id) {
      const dId = parseInt(doctor_id, 10);
      list = list.filter(p => p.doctor_id === dId);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.full_name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getPatientById(id) {
    const patId = parseInt(id, 10);
    const patient = data.patients.find(p => p.id === patId);
    if (!patient) return null;

    const doc = data.doctors.find(d => d.id === patient.doctor_id);
    return {
      ...patient,
      doctor_name: doc ? doc.full_name : null,
      doctor_specialization: doc ? doc.specialization : null,
      doctor_department: doc ? doc.department : null
    };
  },

  createPatient(patientData) {
    const id = data.patients.length > 0 ? Math.max(...data.patients.map(p => p.id)) + 1 : 1;
    const newPatient = {
      id,
      full_name: patientData.full_name,
      date_of_birth: patientData.date_of_birth,
      gender: patientData.gender,
      phone: patientData.phone,
      address: patientData.address,
      doctor_id: patientData.doctor_id ? parseInt(patientData.doctor_id, 10) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.patients.push(newPatient);
    saveData();
    return newPatient;
  },

  updatePatient(id, patientData) {
    const patId = parseInt(id, 10);
    const index = data.patients.findIndex(p => p.id === patId);
    if (index === -1) return null;

    data.patients[index] = {
      ...data.patients[index],
      full_name: patientData.full_name,
      date_of_birth: patientData.date_of_birth,
      gender: patientData.gender,
      phone: patientData.phone,
      address: patientData.address,
      doctor_id: patientData.doctor_id ? parseInt(patientData.doctor_id, 10) : null,
      updated_at: new Date().toISOString()
    };
    saveData();
    return data.patients[index];
  },

  deletePatient(id) {
    const patId = parseInt(id, 10);
    const index = data.patients.findIndex(p => p.id === patId);
    if (index === -1) return false;

    data.patients.splice(index, 1);
    // Cascade delete illnesses
    data.illnesses = data.illnesses.filter(i => i.patient_id !== patId);

    saveData();
    return true;
  },

  // --- ILLNESSES ---
  getIllnesses({ search, severity } = {}) {
    let list = data.illnesses.map(i => {
      const patient = data.patients.find(p => p.id === i.patient_id);
      return {
        ...i,
        patient_name: patient ? patient.full_name : 'Noma\'lum Bemor'
      };
    });

    if (severity) {
      list = list.filter(i => i.severity === severity);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => 
        i.icd_code.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.patient_name.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.diagnosed_at) - new Date(a.diagnosed_at));
  },

  getIllnessesByPatientId(patientId) {
    const patId = parseInt(patientId, 10);
    return data.illnesses
      .filter(i => i.patient_id === patId)
      .sort((a, b) => new Date(b.diagnosed_at) - new Date(a.diagnosed_at));
  },

  createIllness(illData) {
    const id = data.illnesses.length > 0 ? Math.max(...data.illnesses.map(i => i.id)) + 1 : 1;
    const newIll = {
      id,
      icd_code: illData.icd_code,
      description: illData.description,
      severity: illData.severity,
      patient_id: parseInt(illData.patient_id, 10),
      diagnosed_at: illData.diagnosed_at,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.illnesses.push(newIll);
    saveData();
    return newIll;
  },

  updateIllness(id, illData) {
    const illId = parseInt(id, 10);
    const index = data.illnesses.findIndex(i => i.id === illId);
    if (index === -1) return null;

    data.illnesses[index] = {
      ...data.illnesses[index],
      icd_code: illData.icd_code,
      description: illData.description,
      severity: illData.severity,
      diagnosed_at: illData.diagnosed_at,
      updated_at: new Date().toISOString()
    };
    saveData();
    return data.illnesses[index];
  },

  deleteIllness(id) {
    const illId = parseInt(id, 10);
    const index = data.illnesses.findIndex(i => i.id === illId);
    if (index === -1) return false;

    data.illnesses.splice(index, 1);
    saveData();
    return true;
  }
};

export default db;
export { data };
