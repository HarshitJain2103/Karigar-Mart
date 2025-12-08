import { create } from 'zustand';

const useLanguageStore = create((set) => ({
  language: localStorage.getItem('language') || 'en',
  
  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
  },
}));

export default useLanguageStore;