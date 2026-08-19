import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { ErrorResponse } from '@hob/shared';
import {
  analyticsResponseSchema,
  applicationCreateInputSchema,
  applicationDtoSchema,
  applicationListSchema,
  applicationUpdateInputSchema,
  attachmentDtoSchema,
  attachmentUploadQuerySchema,
  errorResponseSchema,
  idParamSchema,
  interviewCreateInputSchema,
  interviewDtoSchema,
} from '@hob/shared';
import { prisma } from '../db.js';
import { currentUser, requireSession } from '../middleware/requireSession.js';
import {
  applicationInclude,
  toApplicationDto,
  toAttachmentDto,
  toInterviewDto,
} from '../applications/mappers.js';
import { deleteAttachment, isBlobConfigured, uploadAttachment } from '../attachments/blob.js';
import { recordInitialStatus, recordStatusChange } from '../applications/statusChanges.js';
import { loadAnalytics } from '../applications/analytics.js';

/** Ten megabytes; a CV or a portfolio PDF, not a video. */
const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Answered for an application that does not exist and for one belonging to
 * somebody else, on purpose: telling the two apart would confirm which ids are
 * taken. Ownership is part of the lookup rather than a check after it.
 */
const applicationNotFound: ErrorResponse = {
  statusCode: 404,
  error: 'Not Found',
  message: 'Application not found',
};

const blobNotConfigured: ErrorResponse = {
  statusCode: 503,
  error: 'Service Unavailable',
  message: 'File storage is not configured',
};

const emptyUpload: ErrorResponse = {
  statusCode: 400,
  error: 'Bad Request',
  message: 'Request body is empty',
};

export const applicationRoutes: FastifyPluginAsyncZod = async (app) => {
  // Everything below belongs to the signed-in user; none of it is public.
  app.addHook('onRequest', requireSession);

  app.get(
    '/',
    { schema: { response: { 200: applicationListSchema, 401: errorResponseSchema } } },
    async (request, reply) => {
      const applications = await prisma.application.findMany({
        where: { userId: currentUser(request).id },
        include: applicationInclude,
        orderBy: [{ appliedDate: 'desc' }, { id: 'desc' }],
      });

      return reply.send(applications.map(toApplicationDto));
    },
  );

  /*
   * Declared ahead of GET /:id — Fastify's router matches the static segment
   * first regardless of order, but a reader scanning top to bottom should not
   * have to know that to see why "analytics" can never be parsed as an id.
   */
  app.get(
    '/analytics',
    { schema: { response: { 200: analyticsResponseSchema, 401: errorResponseSchema } } },
    async (request, reply) => reply.send(await loadAnalytics(currentUser(request).id)),
  );

  app.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        response: {
          200: applicationDtoSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const application = await prisma.application.findFirst({
        where: { id: request.params.id, userId: currentUser(request).id },
        include: applicationInclude,
      });

      if (!application) return reply.code(404).send(applicationNotFound);

      return reply.send(toApplicationDto(application));
    },
  );

  app.post(
    '/',
    {
      schema: {
        body: applicationCreateInputSchema,
        response: { 201: applicationDtoSchema, 401: errorResponseSchema },
      },
    },
    async (request, reply) => {
      const application = await prisma.$transaction(async (tx) => {
        const created = await tx.application.create({
          data: { ...request.body, userId: currentUser(request).id },
          include: applicationInclude,
        });

        // created.status, not request.body.status: creation lets the column
        // default (APPLIED) fill in when the caller sends nothing, and the
        // audit row has to name whatever actually landed in the database.
        await recordInitialStatus(tx, created.id, created.status);

        return created;
      });

      return reply.code(201).send(toApplicationDto(application));
    },
  );

  app.patch(
    '/:id',
    {
      schema: {
        params: idParamSchema,
        body: applicationUpdateInputSchema,
        response: {
          200: applicationDtoSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const userId = currentUser(request).id;

      const application = await prisma.$transaction(async (tx) => {
        /*
         * Writing the audit row needs to know the status this application had
         * before the update, which a blind updateMany cannot tell us — hence
         * the read first. Ownership is still enforced by updateMany's own
         * WHERE below, not by this read: if the row is deleted or reassigned
         * between the two, the update matches nothing and the whole thing
         * answers 404, same as before.
         */
        const before = await tx.application.findFirst({
          where: { id: request.params.id, userId },
          select: { status: true },
        });

        if (!before) return null;

        const { count } = await tx.application.updateMany({
          where: { id: request.params.id, userId },
          data: request.body,
        });

        if (count === 0) return null;

        const { status: nextStatus } = request.body;
        if (nextStatus !== undefined && nextStatus !== before.status) {
          await recordStatusChange(tx, request.params.id, before.status, nextStatus);
        }

        return tx.application.findUniqueOrThrow({
          where: { id: request.params.id },
          include: applicationInclude,
        });
      });

      if (!application) return reply.code(404).send(applicationNotFound);

      return reply.send(toApplicationDto(application));
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
      const application = await prisma.application.findFirst({
        where: { id: request.params.id, userId: currentUser(request).id },
        select: { id: true, attachments: { select: { blobUrl: true } } },
      });

      if (!application) return reply.code(404).send(applicationNotFound);

      // The rows go by cascade, but the files in Blob have no cascade to follow,
      // so they are removed here. Best effort: a storage failure must not leave
      // the application undeletable, and a leftover file costs storage, nothing
      // more.
      if (isBlobConfigured()) {
        await Promise.all(
          application.attachments.map(({ blobUrl }) =>
            deleteAttachment(blobUrl).catch((error: unknown) => {
              request.log.error({ err: error, blobUrl }, 'could not delete blob');
            }),
          ),
        );
      }

      await prisma.application.delete({ where: { id: application.id } });

      return reply.code(204).send(null);
    },
  );

  app.post(
    '/:id/interviews',
    {
      schema: {
        params: idParamSchema,
        body: interviewCreateInputSchema,
        response: {
          201: interviewDtoSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const application = await prisma.application.findFirst({
        where: { id: request.params.id, userId: currentUser(request).id },
        select: { id: true },
      });

      if (!application) return reply.code(404).send(applicationNotFound);

      const interview = await prisma.interview.create({
        data: { ...request.body, applicationId: application.id },
      });

      return reply.code(201).send(toInterviewDto(interview));
    },
  );

  /*
   * Uploads live in their own plugin so that their body parsing stays theirs.
   *
   * The file arrives as the request body, whatever its type, so in here every
   * content type has to end up as raw bytes. Fastify parses some of them by
   * itself — text/plain becomes a string, application/json becomes an object —
   * and a .txt or .json attachment would arrive as something that is not a
   * Buffer. Removing those two parsers and catching everything else covers the
   * lot. It applies only to this scope: the JSON routes above keep the normal
   * parser, because they are outside it.
   */
  await app.register(attachmentUploadRoutes);
};

/**
 * Declared as its own plugin, and typed like the others so the Zod provider
 * still describes the handler. Registered inside the application routes, from
 * which it inherits both the /api/applications prefix and the session hook.
 */
const attachmentUploadRoutes: FastifyPluginAsyncZod = async (uploads) => {
  uploads.removeContentTypeParser(['application/json', 'text/plain']);
  uploads.addContentTypeParser('*', { parseAs: 'buffer' }, (_request, body, done) => {
    done(null, body);
  });

  uploads.post(
    '/:id/attachments',
    {
      bodyLimit: ATTACHMENT_MAX_BYTES,
      schema: {
        params: idParamSchema,
        querystring: attachmentUploadQuerySchema,
        response: {
          201: attachmentDtoSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!isBlobConfigured()) return reply.code(503).send(blobNotConfigured);

      const application = await prisma.application.findFirst({
        where: { id: request.params.id, userId: currentUser(request).id },
        select: { id: true },
      });

      if (!application) return reply.code(404).send(applicationNotFound);

      const body = request.body;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        return reply.code(400).send(emptyUpload);
      }

      const { fileName } = request.query;
      // Uploaded before the row is written: a file with no row wastes storage,
      // while a row pointing at a file that was never stored is a broken link
      // in the interface.
      const blobUrl = await uploadAttachment(
        application.id,
        fileName,
        body,
        request.headers['content-type'],
      );

      const attachment = await prisma.attachment.create({
        data: { applicationId: application.id, blobUrl, fileName },
      });

      return reply.code(201).send(toAttachmentDto(attachment));
    },
  );
};

export default applicationRoutes;
