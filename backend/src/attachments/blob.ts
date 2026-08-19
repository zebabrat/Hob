import { del, put } from '@vercel/blob';
import { config } from '../config.js';

/**
 * Vercel Blob, wrapped so the token is read in one place and the routes stay
 * free of storage details.
 *
 * The token is optional configuration, so every call here states what it needs
 * and the routes check `isBlobConfigured()` before doing any work.
 */
export function isBlobConfigured(): boolean {
  return config.blobToken !== null;
}

function token(): string {
  if (config.blobToken === null) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }
  return config.blobToken;
}

/**
 * Stores a file and returns its public URL.
 *
 * Keyed by application so the storage listing stays readable, with a random
 * suffix on the name: two people uploading `resume.pdf` to the same application
 * must not overwrite each other, and the stored name is what deletion uses.
 */
export async function uploadAttachment(
  applicationId: number,
  fileName: string,
  body: Buffer,
  contentType: string | undefined,
): Promise<string> {
  const { url } = await put(`applications/${applicationId}/${fileName}`, body, {
    access: 'public',
    token: token(),
    addRandomSuffix: true,
    ...(contentType ? { contentType } : {}),
  });

  return url;
}

export async function deleteAttachment(blobUrl: string): Promise<void> {
  await del(blobUrl, { token: token() });
}
