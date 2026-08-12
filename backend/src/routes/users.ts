import type { FastifyPluginAsync } from 'fastify';
import type {
  CreateUserInput,
  ErrorResponse,
  UpdateUserInput,
  UserDto,
} from '@hob/shared';
import { PASSWORD_MIN_LENGTH } from '@hob/shared';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../db.js';
import { hashPassword } from '../auth/password.js';
import { userSelect } from '../auth/session.js';
import { requireSession } from '../middleware/requireSession.js';

interface IdParams {
  id: number;
}

/** Prisma error codes we translate into meaningful HTTP responses. */
const UNIQUE_CONSTRAINT_FAILED = 'P2002';
const RECORD_NOT_FOUND = 'P2025';

function isPrismaError(err: unknown, code: string): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;
}

function notFound(id: number): ErrorResponse {
  return {
    statusCode: 404,
    error: 'Not Found',
    message: `User with id ${id} not found`,
  };
}

function emailTaken(email: string): ErrorResponse {
  return {
    statusCode: 409,
    error: 'Conflict',
    message: `Email ${email} is already taken`,
  };
}

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

const idParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', minimum: 1 },
  },
} as const;

const emailSchema = {
  type: 'string',
  format: 'email',
  minLength: 3,
  maxLength: 254,
} as const;

const nameSchema = {
  type: ['string', 'null'],
  maxLength: 200,
} as const;

const createUserBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: emailSchema,
    password: { type: 'string', minLength: PASSWORD_MIN_LENGTH, maxLength: 128 },
    name: nameSchema,
  },
} as const;

const updateUserBodySchema = {
  type: 'object',
  additionalProperties: false,
  // Require at least one field, otherwise a PUT with an empty body would
  // silently change nothing and still answer 200.
  minProperties: 1,
  properties: {
    email: emailSchema,
    name: nameSchema,
  },
} as const;

export const usersRoutes: FastifyPluginAsync = async (app) => {
  // Every route in this plugin is behind a session. onRequest, not preHandler:
  // schema validation runs before preHandler, so an unauthenticated request
  // would otherwise get a 400 describing the body it was not allowed to send.
  app.addHook('onRequest', requireSession);

  app.get(
    '/',
    {
      schema: {
        response: {
          200: { type: 'array', items: userSchema },
        },
      },
    },
    async (): Promise<UserDto[]> => {
      return prisma.user.findMany({ orderBy: { id: 'asc' }, select: userSelect });
    },
  );

  app.get<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 200: userSchema, 404: errorSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const user = await prisma.user.findUnique({ where: { id }, select: userSelect });

      if (!user) {
        return reply.code(404).send(notFound(id));
      }

      return user;
    },
  );

  app.post<{ Body: CreateUserInput }>(
    '/',
    {
      schema: {
        body: createUserBodySchema,
        response: { 201: userSchema, 409: errorSchema },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body;

      try {
        const user = await prisma.user.create({
          data: { email, name: name ?? null, password: await hashPassword(password) },
          select: userSelect,
        });
        return reply.code(201).send(user);
      } catch (err) {
        if (isPrismaError(err, UNIQUE_CONSTRAINT_FAILED)) {
          return reply.code(409).send(emailTaken(email));
        }
        throw err;
      }
    },
  );

  app.put<{ Params: IdParams; Body: UpdateUserInput }>(
    '/:id',
    {
      schema: {
        params: idParamsSchema,
        body: updateUserBodySchema,
        response: { 200: userSchema, 404: errorSchema, 409: errorSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { email, name } = request.body;

      try {
        const user = await prisma.user.update({
          where: { id },
          // Prisma ignores undefined fields, which makes this a partial update
          data: { email, name },
          select: userSelect,
        });
        return user;
      } catch (err) {
        if (isPrismaError(err, RECORD_NOT_FOUND)) {
          return reply.code(404).send(notFound(id));
        }
        if (isPrismaError(err, UNIQUE_CONSTRAINT_FAILED) && email !== undefined) {
          return reply.code(409).send(emailTaken(email));
        }
        throw err;
      }
    },
  );

  app.delete<{ Params: IdParams }>(
    '/:id',
    {
      schema: {
        params: idParamsSchema,
        response: { 204: { type: 'null' }, 404: errorSchema },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        await prisma.user.delete({ where: { id } });
        return reply.code(204).send();
      } catch (err) {
        if (isPrismaError(err, RECORD_NOT_FOUND)) {
          return reply.code(404).send(notFound(id));
        }
        throw err;
      }
    },
  );
};

export default usersRoutes;
