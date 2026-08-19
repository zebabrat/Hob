import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { ErrorResponse } from '@hob/shared';
import { errorResponseSchema, idParamSchema } from '@hob/shared';
import { prisma } from '../db.js';
import { currentUser, requireSession } from '../middleware/requireSession.js';
import { deleteAttachment, isBlobConfigured } from '../attachments/blob.js';

const attachmentNotFound: ErrorResponse = {
  statusCode: 404,
  error: 'Not Found',
  message: 'Attachment not found',
};

export const attachmentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', requireSession);

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
      const attachment = await prisma.attachment.findFirst({
        where: { id: request.params.id, application: { userId: currentUser(request).id } },
        select: { id: true, blobUrl: true },
      });

      if (!attachment) return reply.code(404).send(attachmentNotFound);

      await prisma.attachment.delete({ where: { id: attachment.id } });

      /*
       * The row goes first and the file second, best effort.
       *
       * Neither order is free: this way a failure leaves a file nobody
       * references, the other way round it leaves a row pointing at a file that
       * is gone. The first costs storage and stays invisible; the second shows
       * up as a download that fails. So the invisible one is the one to risk.
       */
      if (isBlobConfigured()) {
        await deleteAttachment(attachment.blobUrl).catch((error: unknown) => {
          request.log.error(
            { err: error, blobUrl: attachment.blobUrl },
            'row deleted but blob remains',
          );
        });
      }

      return reply.code(204).send(null);
    },
  );
};

export default attachmentRoutes;
