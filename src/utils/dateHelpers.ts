import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateRussian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMMM yyyy', { locale: ru });
}

export function formatDayShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM', { locale: ru });
}

export function formatWeekday(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'EEEEEE', { locale: ru });
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
