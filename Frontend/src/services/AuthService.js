import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class AuthService {
  // Register method
  async register(fullName, email, phoneNumber, address, password, role = 'player') {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        fullName,
        email,
        phoneNumber,
        address,
        password,
        role
      });
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message || response.data.error };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.response?.data?.error || 'Registration failed' 
      };
    }
  }

  // Login method
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password 
      });

      if (response.data?.token) {
        const userData = {
          token: response.data.token,
          user: response.data.data
        };
        localStorage.setItem('user', JSON.stringify(userData));
        this.setAuthHeader(response.data.token);
        return { success: true, data: userData };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.response?.data?.error || 'Login failed' 
      };
    }
  }

  // Set axios auth header
  setAuthHeader(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  // Get current user
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      // Set auth header if token exists
      if (user?.token) {
        this.setAuthHeader(user.token);
      }
      return user;
    } catch (error) {
      // If parsing fails, remove invalid user data
      localStorage.removeItem('user');
      return null;
    }
  }

  // Check if authenticated
  isAuthenticated() {
    const user = this.getCurrentUser();
    return user !== null;
  }

  // Get user role
  getUserRole() {
    const user = this.getCurrentUser();
    const role = user?.user?.role?.toLowerCase()?.trim();
    return role || null;
  }

  // Get user data
  getUserData() {
    const user = this.getCurrentUser();
    return user?.user || null;
  }

  // Get token
  getToken() {
    const user = this.getCurrentUser();
    return user?.token || null;
  }

  // Logout
  logout() {
    localStorage.removeItem('user');
    this.setAuthHeader(null);
  }

  // Verify token with backend (optional)
  async verifyToken() {
    try {
      const user = this.getCurrentUser();
      if (!user?.token) return false;
      
      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      return response.data.valid;
    } catch (error) {
      // Don't automatically logout on verification failure
      // Let the caller decide what to do
      return false;
    }
  }
}

const authService = new AuthService();
export default authService;
