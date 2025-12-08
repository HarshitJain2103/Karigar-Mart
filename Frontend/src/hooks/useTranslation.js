import { translations } from '@/lib/translations';
import useLanguageStore from '@/stores/languageStore';

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);

  const t = (path, vars = {}) => {
    const keys = path.split('.');
    let value = translations[language] || translations['en'];

    for (const key of keys) {
      value = value?.[key];
    }

    if (!value) return path; 

    if (typeof value === "string") {
      Object.keys(vars).forEach((key) => {
        const regex1 = new RegExp(`{${key}}`, "g");      
        const regex2 = new RegExp(`{{${key}}}`, "g");    
        value = value.replace(regex1, vars[key]);
        value = value.replace(regex2, vars[key]);
      });
    }

    return value;
  };

  return { t, language };
};