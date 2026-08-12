import type { FastifyPluginAsync } from 'fastify';
import type { ErrorResponse, SignInInput, SignUpInput, UserDto } from '@hob/shared';
import { PASSWORD_MIN_LENGTH } from '@hob/shared';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../db.js';
import { burnPasswordComparison, hashPassword, verifyPassword } from '../auth/password.js';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  deleteSession,
  setSessionCookie,
  userSelect,
} from '../auth/session.js';
import { currentUser, requireSession } from '../middleware/requireSession.js';

const UNIQUE_CONSTRAINT_FAILED = 'P2002';

function emailTaken(email: string): ErrorResponse {
  return { statusCode: 409, error: 'Conflict', message: `Email ${email} is already taken` };
}

/** Same message for unknown email and wrong password — do not reveal which one it was. */
const invalidCredentials: ErrorResponse = {
  statusCode: 401,
  error: 'Unauthorized',
  message: 'Invalid email or password',
};

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: 'string' },
    name: { type: ['string', 'null'] },
  },
} as const;

const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const;

const emailSchema = { type: 'string', format: 'email', maxLength: 254 } as const;
const passwordSchema = {
  type: 'string',
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: 128,
} as const;

const signUpBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: emailSchema,
    password: passwordSchema,
    name: { type: ['string', 'null'], maxLength: 200 },
  },
} as const;

const signInBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: emailSchema,
    // No minLength here: old passwords stay valid even if the rule tightens later.
    password: { type: 'string', maxLength: 128 },
  },
} as const;

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: SignUpInput }>(
    '/sign-up',
    {
      schema: {
        body: signUpBodySchema,
        response: { 201: userSchema, 409: errorSchema },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body;

      let user: UserDto;
      try {
        user = await prisma.user.create({
          data: { email, name: name ?? null, password: await hashPassword(password) },
          select: userSelect,
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === UNIQUE_CONSTRAINT_FAILED) {
          return reply.code(409).send(emailTaken(email));
        }
        throw err;
      }

      setSessionCookie(reply, await createSession(user.id));
      return reply.code(201).send(user);
    },
  );

  app.post<{ Body: SignInInput }>(
    '/sign-in',
    {
      schema: {
        body: signInBodySchema,
        response: { 200: userSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const account = await prisma.user.findUnique({ where: { email } });

      if (!account) {
        await burnPasswordComparison(password);
        return reply.code(401).send(invalidCredentials);
      }

      if (!(await verifyPassword(password, account.password))) {
        return reply.code(401).send(invalidCredentials);
      }

      setSessionCookie(reply, await createSession(account.id));
      return { id: account.id, email: account.email, name: account.name };
    },
  );

  app.post(
    '/sign-out',
    { schema: { response: { 204: { type: 'null' } } } },
    async (request, reply) => {
      const token = request.cookies[SESSION_COOKIE];
      if (token) await deleteSession(token);

      // Always clear the cookie, even without a live session — signing out must not fail.
      clearSessionCookie(reply);
      return reply.code(204).send();
    },
  );

  app.get(
    '/me',
    {
      onRequest: requireSession,
      schema: { response: { 200: userSchema, 401: errorSchema } },
    },
    async (request) => currentUser(request),
  );
};

export default authRoutes;
