// (em português) Este ficheiro configura a tradução da app

import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  en: {
    statsTitle: 'Stats',
    noRoutes: 'No routes recorded',
    favorites: 'Favorites',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove favorite',
    accountSettingsTitle: 'Account Settings',
    notificationsEnabled: 'Notifications Enabled',
    notificationRadius: 'Notification Radius',
    languageTitle: 'Language',
    paidWeeksTitle: 'Paid Weeks',
    portuguese: 'Portuguese',
    english: 'English',
  },
  pt: {
    statsTitle: 'Estatísticas',
    noRoutes: 'Nenhum trajeto registado',
    favorites: 'Favoritos',
    addFavorite: 'Adicionar aos favoritos',
    removeFavorite: 'Remover favorito',
    accountSettingsTitle: 'Definições da Conta',
    notificationsEnabled: 'Notificações Ativas',
    notificationRadius: 'Raio de Notificação',
    languageTitle: 'Idioma',
    paidWeeksTitle: 'Semanas Pagas',
    portuguese: 'Português',
    english: 'Inglês',
  },
};

const LANGUAGE_KEY = 'language';

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.locale = Localization.locale;

export async function setLanguage(lang) {
  i18n.locale = lang;
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export async function getLanguage() {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (stored) {
    i18n.locale = stored;
    return stored;
  }
  return i18n.locale;
}

export function t(key, opts) {
  return i18n.t(key, opts);
}

export { i18n };

export default t;
