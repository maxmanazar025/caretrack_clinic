const API_BASE = ''; // Empty since frontend is served from the same server

// Helper for making requests with authentication
async function request(url, options = {}) {
  const token = localStorage.getItem('caretrack_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.error || 'Server error occurred',
      message_en: data.error_en || 'Server error occurred',
      details: data
    };
  }

  return data;
}

const API = {
  // Authentication
  auth: {
    async login(email, password) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('caretrack_token', data.token);
      localStorage.setItem('caretrack_user', JSON.stringify(data.user));
      return data;
    },
    logout() {
      localStorage.removeItem('caretrack_token');
      localStorage.removeItem('caretrack_user');
    },
    getCurrentUser() {
      const userStr = localStorage.getItem('caretrack_user');
      try {
        return userStr ? JSON.parse(userStr) : null;
      } catch (e) {
        return null;
      }
    },
    async getMe() {
      return request('/api/auth/me');
    }
  },

  // Doctors
  doctors: {
    getAll({ search, department } = {}) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/api/doctors${query}`);
    },
    getById(id) {
      return request(`/api/doctors/${id}`);
    },
    create(doctorData) {
      return request('/api/doctors', {
        method: 'POST',
        body: JSON.stringify(doctorData)
      });
    },
    update(id, doctorData) {
      return request(`/api/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(doctorData)
      });
    },
    delete(id) {
      return request(`/api/doctors/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Patients
  patients: {
    getAll({ search, doctor_id } = {}) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (doctor_id) params.append('doctor_id', doctor_id);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/api/patients${query}`);
    },
    getById(id) {
      return request(`/api/patients/${id}`);
    },
    create(patientData) {
      return request('/api/patients', {
        method: 'POST',
        body: JSON.stringify(patientData)
      });
    },
    update(id, patientData) {
      return request(`/api/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patientData)
      });
    },
    delete(id) {
      return request(`/api/patients/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Illnesses
  illnesses: {
    getAll({ search, severity } = {}) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (severity) params.append('severity', severity);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/api/illnesses${query}`);
    },
    create(illnessData) {
      return request('/api/illnesses', {
        method: 'POST',
        body: JSON.stringify(illnessData)
      });
    },
    update(id, illnessData) {
      return request(`/api/illnesses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(illnessData)
      });
    },
    delete(id) {
      return request(`/api/illnesses/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Global search
  search: {
    global(query) {
      return request(`/api/search?q=${encodeURIComponent(query)}`);
    }
  }
};

export default API;
