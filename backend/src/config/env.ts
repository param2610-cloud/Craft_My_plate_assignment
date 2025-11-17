import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const awsRegion = process.env.AWS_REGION ?? '';
const env = {
  port: toNumber(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  timezone: process.env.TZ ?? 'Asia/Kolkata',
  pricing: {
    peakMultiplier: toNumber(process.env.PEAK_MULTIPLIER, 1.5),
    offPeakMultiplier: toNumber(process.env.OFF_PEAK_MULTIPLIER, 1),
    peakWindows: process.env.PEAK_WINDOWS ?? '10:00-13:00,16:00-19:00',
    peakWeekdays: process.env.PEAK_WEEKDAYS ?? '1,2,3,4,5',
    timezoneOffsetMinutes: toNumber(process.env.PRICING_TZ_OFFSET_MINUTES, 330)
  },
  aws: {
    region: awsRegion,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    s3: {
      bucket: process.env.S3_DB_BUCKET ?? '',
      bookingsKey: process.env.S3_DB_KEY ?? ''
    }
  }
};

export { env };
