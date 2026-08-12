import type { FastifyPluginAsync } from 'fastify';
import type { CreateUserInput, UpdateUserInput, UserDto } from '@hob/shared';
import { prisma } from '../db.js';
import { notFound } from '../errors.js';
import { hashPassword } from '../auth/password.js';
import { userSelect } from '../auth/session.js';
import { requireSession } from '../middleware/requireSession.js';
import {
  emailSchema,
  errorSchema,
  idParamsSchema,
  nameSchema,
  passwordSchema,
  userSchema,
} from './schemas.js';

interface IdParams {
  id: number;
}

const createUserBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: emailSchema,
    password: passwordSchema,
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

      // findUnique answers null rather than failing, so this one 404 stays here;
      // the failures Prisma throws are mapped centrally.
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

      const user = await prisma.user.create({
        data: { email, name: name ?? null, password: await hashPassword(password) },
        select: userSelect,
      });

      return reply.code(201).send(user);
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
    async (request) => {
      const { email, name } = request.body;

      return prisma.user.update({
        where: { id: request.params.id },
        // Prisma ignores undefined fields, which makes this a partial update
        data: { email, name },
        select: userSelect,
      });
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
      await prisma.user.delete({ where: { id: request.params.id } });

      return reply.code(204).send();
    },
  );
};

export default usersRoutes;
