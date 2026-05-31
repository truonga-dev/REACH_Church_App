const NOTIF_KEY = 'reach_notifications_enabled';
const LANG_KEY = 'reach_language';

export function getNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(NOTIF_KEY);
  return raw === null ? true : raw === 'true';
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIF_KEY, String(enabled));
}

export type AppLanguage = 'vi' | 'en';

export function getLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'vi';
  return (localStorage.getItem(LANG_KEY) as AppLanguage) || 'vi';
}

export function setLanguage(lang: AppLanguage): void {
  localStorage.setItem(LANG_KEY, lang);
}
