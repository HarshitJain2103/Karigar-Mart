import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: null,

  login: (authData) => {
    localStorage.setItem('token', authData.token);
    set({ token: authData.token, user: authData.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
  
  fetchUserProfile: async () => {
    const token = get().token; 
    if (!token) {
      return; 
    }

    try {
      const response = await fetch('http://localhost:8000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const userData = await response.json();
      set({ user: userData }); 
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      get().logout(); 
    }
  },
}));

export default useAuthStore;