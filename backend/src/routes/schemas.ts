import { PASSWORD_MIN_LENGTH } from '@hob/shared';

/** Field and response shapes shared by the route plugins. */

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: 'string' },
    name: { type: ['string', 'null'] },
  },
} as const;

export const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const;

export const idParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', minimum: 1 },
  },
} as const;

export const emailSchema = {
  type: 'string',
  format: 'email',
  minLength: 3,
  maxLength: 254,
} as const;

export const nameSchema = {
  type: ['string', 'null'],
  maxLength: 200,
} as const;

export const passwordSchema = {
  type: 'string',
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: 128,
} as const;
