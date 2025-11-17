import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import { env } from '../config/env.js';

const hasS3Config = Boolean(env.aws?.s3.bucket && env.aws?.s3.bookingsKey);

const buildClient = () =>
  new S3Client({
    region: env.aws?.region || 'us-east-1',
    credentials:
      env.aws?.accessKeyId && env.aws?.secretAccessKey
        ? {
            accessKeyId: env.aws.accessKeyId,
            secretAccessKey: env.aws.secretAccessKey
          }
        : undefined
  });

const client = hasS3Config ? buildClient() : null;

const streamToString = (stream: Readable) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    stream.once('error', reject);
    stream.once('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });

const bodyToString = async (body?: GetObjectCommandOutput['Body']) => {
  if (!body) {
    return '';
  }

  if (typeof body === 'string') {
    return body;
  }

  if (body instanceof Readable) {
    return streamToString(body);
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body).toString('utf-8');
  }

  const asAny = body as { text?: () => Promise<string>; transformToString?: () => Promise<string> };
  if (typeof asAny.text === 'function') {
    return asAny.text();
  }
  if (typeof asAny.transformToString === 'function') {
    return asAny.transformToString();
  }

  return '';
};

export const s3BookingsStorage = {
  isEnabled: Boolean(client),
  async load<T>() {
    if (!client) {
      throw new Error('S3 storage is not configured');
    }

    const response = await client.send(
      new GetObjectCommand({
        Bucket: env.aws.s3.bucket,
        Key: env.aws.s3.bookingsKey
      })
    );

    const text = await bodyToString(response.Body);
    if (!text) {
      return null;
    }

    return JSON.parse(text) as T;
  },
  async save<T>(payload: T) {
    if (!client) {
      throw new Error('S3 storage is not configured');
    }

    await client.send(
      new PutObjectCommand({
        Bucket: env.aws.s3.bucket,
        Key: env.aws.s3.bookingsKey,
        Body: JSON.stringify(payload, null, 2),
        ContentType: 'application/json'
      })
    );
  }
};
