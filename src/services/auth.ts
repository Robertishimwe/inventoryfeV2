import axios from 'axios';
import { saveUser, saveSettings } from './db';
import { getSystemSettings } from './api';

const API_URL = 'https://hardwarems-3.onrender.com/api/';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: number;
    role: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export async function login(credentials: LoginCredentials) {
  try {
    const response = await axios.post<LoginResponse>(`${API_URL}auth/login`, credentials);
    
    // Store token in session storage
    sessionStorage.setItem('token', response.data.token);
    
    // Store user data in IndexedDB
    await saveUser(response.data.user);
    
    // Fetch and store system settings
    try {
      const settings = await getSystemSettings();
      await saveSettings(settings);
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(error?.response?.data.Message)
      throw new Error(error.response?.data.Message || 'Login failed');
    }
    throw error;
  }
}