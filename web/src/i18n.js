import { createContext, useContext, useState, useEffect } from 'react';

// translations
const translations = {
  en: {
    loginTitle: 'Vendor Login',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    loginButton: 'Login',
    invalidCredentials: 'Invalid credentials',
    vendorPanel: 'Vendor Dashboard',
    name: 'Name',
    product: 'Product',
    location: 'Location',
    shareLocation: 'Share location',
    logout: 'Logout',
  },
  pt: {
    loginTitle: 'Login do Vendedor',
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    loginButton: 'Entrar',
    invalidCredentials: 'Credenciais inválidas',
    vendorPanel: 'Painel do Vendedor',
    name: 'Nome',
    product: 'Produto',
    location: 'Localização',
    shareLocation: 'Partilhar localização',
    logout: 'Sair',
  },
};

// defaultLang
const defaultLang = localStorage.getItem('lang') || (navigator.language.startsWith('pt') ? 'pt' : 'en');

// I18nContext
const I18nContext = createContext({ lang: defaultLang, setLang: () => {} });

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(defaultLang);
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);
  return <I18nContext.Provider value={{ lang, setLang }}>{children}</I18nContext.Provider>;
};

export const useLang = () => useContext(I18nContext);

export const useTranslation = () => {
  const { lang } = useContext(I18nContext);
  return (key) => translations[lang][key] || key;
};
