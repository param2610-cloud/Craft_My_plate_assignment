import { env } from './env.js';
import type { PricingConfig } from '../utils/pricing.util.js';

const MINUTES_PER_HOUR = 60;

const toMinuteOfDay = (value: string) => {
  const [hourPart, minutePart] = value.split(':');
  const hours = Number(hourPart);
  const minutes = Number(minutePart ?? '0');
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * MINUTES_PER_HOUR + minutes;
};

const parseWindows = (windowValue: string) => {
  const windows = windowValue
    .split(',')
    .map((segment) => segment.trim())
    .map((segment) => {
      const [startRaw, endRaw] = segment.split('-');
      const startMinute = startRaw ? toMinuteOfDay(startRaw) : null;
      const endMinute = endRaw ? toMinuteOfDay(endRaw) : null;
      if (startMinute === null || endMinute === null || endMinute <= startMinute) {
        return null;
      }
      return { startMinute, endMinute };
    })
    .filter((entry): entry is { startMinute: number; endMinute: number } => Boolean(entry));

  if (windows.length === 0) {
    return [
      { startMinute: 10 * MINUTES_PER_HOUR, endMinute: 13 * MINUTES_PER_HOUR },
      { startMinute: 16 * MINUTES_PER_HOUR, endMinute: 19 * MINUTES_PER_HOUR }
    ];
  }

  return windows;
};

const parseWeekdays = (value: string) => {
  const weekdaySet = new Set<number>();
  value
    .split(',')
    .map((entry) => entry.trim())
    .forEach((entry) => {
      const parsed = Number(entry);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 6) {
        weekdaySet.add(parsed);
      }
    });
  return weekdaySet.size > 0 ? weekdaySet : new Set([1, 2, 3, 4, 5]);
};

export const pricingConfig: PricingConfig = {
  peakMultiplier: env.pricing.peakMultiplier,
  offPeakMultiplier: env.pricing.offPeakMultiplier,
  peakWeekdayIndexes: parseWeekdays(env.pricing.peakWeekdays),
  peakWindows: parseWindows(env.pricing.peakWindows),
  timezoneOffsetMinutes: env.pricing.timezoneOffsetMinutes
};
