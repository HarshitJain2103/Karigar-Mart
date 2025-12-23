import { create } from 'zustand';
import useAuthStore from '@/stores/authStore';
import { getApiUrl } from '@/lib/api';

const useCartStore = create((set, get) => ({
  items: [], 
  resetCart: () => set({ items: [] }),
  subtotal: () => {
    return get().items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  },
  setCart: (cartItems) => set({ items: Array.isArray(cartItems) ? cartItems : [] }),

  addToCart: async (product, quantity) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const response = await fetch(getApiUrl('/api/users/profile/cart'), {
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
      const response = await fetch(getApiUrl(`/api/users/profile/cart/${productId}`), {
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

  updateItemQuantity: async (productId, quantity) => {
    const token = useAuthStore.getState().token;
    if (!token || quantity < 1) return; 
    try {
      const response = await fetch(getApiUrl('/api/users/profile/cart'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });
      const updatedCart = await response.json();
      set({ items: updatedCart });
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  },
  
  clearCart: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const response = await fetch(getApiUrl('/api/users/profile/cart'), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedCart = await response.json(); 
      set({ items: updatedCart });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },
}));


export default useCartStore;