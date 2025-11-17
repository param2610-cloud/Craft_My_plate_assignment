import { pricingConfig } from '../config/pricing.js';

const MINUTE_MS = 60 * 1000;

export interface PricingInput {
  baseHourlyRate: number;
  startTime: string;
  endTime: string;
}

interface PeakWindow {
  startMinute: number;
  endMinute: number;
}

export interface PricingConfig {
  peakMultiplier: number;
  offPeakMultiplier: number;
  peakWeekdayIndexes: Set<number>;
  peakWindows: PeakWindow[];
  timezoneOffsetMinutes: number;
}

const getLocalParts = (date: Date, offsetMinutes: number) => {
  const shifted = new Date(date.getTime() + offsetMinutes * MINUTE_MS);
  const minuteOfDay = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  return {
    weekday: shifted.getUTCDay(),
    minuteOfDay
  };
};

export const isPeakMinute = (date: Date, config: PricingConfig = pricingConfig) => {
  const { weekday, minuteOfDay } = getLocalParts(date, config.timezoneOffsetMinutes);
  if (!config.peakWeekdayIndexes.has(weekday)) {
    return false;
  }

  return config.peakWindows.some(
    (window) => minuteOfDay >= window.startMinute && minuteOfDay < window.endMinute
  );
};

export const calculateDynamicPrice = (
  input: PricingInput,
  config: PricingConfig = pricingConfig
) => {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid datetime supplied to pricing calculator');
  }

  if (start >= end) {
    return 0;
  }

  const perMinuteRate = input.baseHourlyRate / 60;
  let cursor = start.getTime();
  const endMs = end.getTime();
  let total = 0;

  while (cursor < endMs) {
    const minuteEnd = Math.min(endMs, cursor + MINUTE_MS);
    const minuteDate = new Date(cursor);
    const multiplier = isPeakMinute(minuteDate, config)
      ? config.peakMultiplier
      : config.offPeakMultiplier;

    const fraction = (minuteEnd - cursor) / MINUTE_MS;
    total += perMinuteRate * multiplier * fraction;

    cursor = minuteEnd;
  }

  return Math.round(total);
};
