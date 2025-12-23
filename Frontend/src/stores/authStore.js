import { create } from 'zustand';
import { getApiUrl } from '@/lib/api';

const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  wishlist: [],

  login: (authData) => {
    localStorage.setItem('token', authData.token);
    set({ token: authData.token, user: authData.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
  setUser: (userData) => set({ user: userData }),

  fetchUserProfile: async () => {
    const token = get().token;
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(getApiUrl('/api/users/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const userData = await response.json();
      set({ user: userData });
      return userData;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      get().logout();
      return null;
    }
  },
  setWishlist: (wishlistItems) => set({ wishlist: Array.isArray(wishlistItems) ? wishlistItems : [] }),

  toggleWishlist: async (productId) => {
    const token = get().token;
    if (!token) return;

    const currentWishlist = get().wishlist;
    const isWishlisted = currentWishlist.some(item => item._id === productId);

    const endpoint = getApiUrl(`/api/users/profile/wishlist`);
    const method = isWishlisted ? 'DELETE' : 'POST';

    try {
      const response = await fetch(isWishlisted ? `${endpoint}/${productId}` : endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: isWishlisted ? null : JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error('Failed to update wishlist');

      const updatedWishlist = await response.json();
      set({ wishlist: updatedWishlist });
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    }
  },
}));

export default useAuthStore;