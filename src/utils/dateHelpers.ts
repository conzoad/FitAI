import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { Language } from '../stores/useLanguageStore';

const locales = { ru, en: enUS };

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateLocalized(date: Date | string, lang: Language = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMMM yyyy', { locale: locales[lang] });
}

/** @deprecated Use formatDateLocalized */
export const formatDateRussian = formatDateLocalized;

export function formatDayShort(date: Date | string, lang: Language = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM', { locale: locales[lang] });
}

export function formatWeekday(date: Date | string, lang: Language = 'ru'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEEEE', { locale: locales[lang] });
}

export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getDaysArray(count: number): Date[] {
  const days: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}
