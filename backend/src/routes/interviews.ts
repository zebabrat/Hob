import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { ErrorResponse } from '@hob/shared';
import {
  errorResponseSchema,
  idParamSchema,
  interviewDtoSchema,
  interviewUpdateInputSchema,
} from '@hob/shared';
import { prisma } from '../db.js';
import { currentUser, requireSession } from '../middleware/requireSession.js';
import { toInterviewDto } from '../applications/mappers.js';

const interviewNotFound: ErrorResponse = {
  statusCode: 404,
  error: 'Not Found',
  message: 'Interview not found',
};

/**
 * Rounds are addressed by their own id, so ownership is reached through the
 * application they belong to: `application: { userId }` in the WHERE means a
 * round from somebody else's application never matches.
 */
export const interviewRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', requireSession);

  app.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: interviewUpdateInputSchema,
        response: {
          200: interviewDtoSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { count } = await prisma.interview.updateMany({
        where: { id: request.params.id, application: { userId: currentUser(request).id } },
        data: request.body,
      });

      if (count === 0) return reply.code(404).send(interviewNotFound);

      const interview = await prisma.interview.findUniqueOrThrow({
        where: { id: request.params.id },
      });

      return reply.send(toInterviewDto(interview));
    },
  );

  app.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        response: {
          204: z.null(),
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { count } = await prisma.interview.deleteMany({
        where: { id: request.params.id, application: { userId: currentUser(request).id } },
      });

      if (count === 0) return reply.code(404).send(interviewNotFound);

      return reply.code(204).send(null);
    },
  );
};

export default interviewRoutes;
