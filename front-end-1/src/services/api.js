const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  // Auth endpoints
  register: async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Registration failed' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Register API error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Login failed' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login API error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  // Resume endpoints
  uploadResume: async (userId, file) => {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('resume', file);
      
      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Upload failed' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Upload resume API error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  // JD endpoints
  uploadJD: async (userId, file) => {
    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('jd', file);
      
      const response = await fetch(`${API_BASE_URL}/upload-jd`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Upload failed' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Upload JD API error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  // Get user data
  getUserResume: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-resume/${userId}`);
      
      if (!response.ok) {
        return { success: false, error: 'Resume not found' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get resume API error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  getUserJD: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-jd/${userId}`);
      
      if (!response.ok) {
        return { success: false, error: 'JD not found' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get JD API error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  // Create interview
  createInterview: async (userId, resumeId, jdId, interviewType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/create-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: userId, 
          resume_id: resumeId, 
          jd_id: jdId, 
          interview_type: interviewType 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to create interview' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Create interview API error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  // Get user interviews
  getUserInterviews: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-interviews/${userId}`);
      
      if (!response.ok) {
        return { success: false, error: 'Interviews not found' };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get interviews API error:', error);
      return { success: false, error: 'Network error' };
    }
  }
};