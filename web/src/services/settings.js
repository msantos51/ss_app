// Guardar e ler definições de notificações no localStorage
const ENABLED_KEY = 'notifications_enabled';

export function isNotificationsEnabled() {
  // val
  const val = localStorage.getItem(ENABLED_KEY);
  return val !== 'false';
}

export function setNotificationsEnabled(enabled) {
  localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
}
