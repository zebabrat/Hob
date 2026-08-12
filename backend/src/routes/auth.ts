import type { FastifyPluginAsync } from 'fastify';
import type { ErrorResponse, SignInInput, SignUpInput } from '@hob/shared';
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
import {
  emailSchema,
  errorSchema,
  nameSchema,
  passwordSchema,
  userSchema,
} from './schemas.js';

/** Same message for unknown email and wrong password — do not reveal which one it was. */
const invalidCredentials: ErrorResponse = {
  statusCode: 401,
  error: 'Unauthorized',
  message: 'Invalid email or password',
};

const signUpBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: emailSchema,
    password: passwordSchema,
    name: nameSchema,
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

/**
 * Credential endpoints are the ones worth guessing at, so they get a tighter
 * budget than the rest of the API: enough for a person who mistypes a password,
 * far too little to work through a password list.
 */
const credentialsRateLimit = {
  rateLimit: {
    max: 10,
    timeWindow: '1 minute',
  },
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: SignUpInput }>(
    '/sign-up',
    {
      config: credentialsRateLimit,
      schema: {
        body: signUpBodySchema,
        response: { 201: userSchema, 409: errorSchema },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body;

      // A taken email surfaces as a Prisma unique violation and is turned into
      // 409 by the shared error handler.
      const user = await prisma.user.create({
        data: { email, name: name ?? null, password: await hashPassword(password) },
        select: userSelect,
      });

      setSessionCookie(reply, await createSession(user.id));
      return reply.code(201).send(user);
    },
  );

  app.post<{ Body: SignInInput }>(
    '/sign-in',
    {
      config: credentialsRateLimit,
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
