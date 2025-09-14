import { create } from 'zustand';
import useAuthStore from './authStore';

const useCartStore = create((set, get) => ({
  items: [], 
  
  setCart: (cartItems) => set({ items: cartItems }),

  addToCart: async (product, quantity) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/users/profile/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity }),
      });
      const updatedCart = await response.json();
      set({ items: updatedCart });
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  },

  removeFromCart: async (productId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/api/users/profile/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedCart = await response.json();
      set({ items: updatedCart });
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  },
  
  clearCart: () => set({ items: [] }),
}));


export default useCartStore;