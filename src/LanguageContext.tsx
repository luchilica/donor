import React, { createContext, useContext, ReactNode } from 'react';
import { BY_DICT } from './i18n';

interface LanguageContextProps {
  language: 'RU' | 'BY';
  setLanguage: (lang: 'RU' | 'BY') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'RU',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children, language, setLanguage }: { children: ReactNode, language: 'RU' | 'BY', setLanguage: (lang: 'RU' | 'BY') => void }) => {
  const t = (key: string) => {
    if (language === 'RU') return key;
    return BY_DICT[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
