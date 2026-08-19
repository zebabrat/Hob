import type { ApplicationDto, AttachmentDto, InterviewDto } from '@hob/shared';
import type { Attachment, Interview, Prisma } from '../generated/prisma/client.js';

/**
 * What "with all details" means, in one place. Both the list and the single
 * application route use it, so the two cannot answer with different shapes.
 */
export const applicationInclude = {
  interviews: { orderBy: { createdAt: 'asc' } },
  attachments: { orderBy: { uploadedAt: 'asc' } },
} satisfies Prisma.ApplicationInclude;

type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: typeof applicationInclude;
}>;

export function toInterviewDto(interview: Interview): InterviewDto {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    round: interview.round,
    scheduledAt: interview.scheduledAt?.toISOString() ?? null,
    notes: interview.notes,
    createdAt: interview.createdAt.toISOString(),
  };
}

export function toAttachmentDto(attachment: Attachment): AttachmentDto {
  return {
    id: attachment.id,
    applicationId: attachment.applicationId,
    blobUrl: attachment.blobUrl,
    fileName: attachment.fileName,
    uploadedAt: attachment.uploadedAt.toISOString(),
  };
}

/** Dates become ISO strings here, which is the only form the contract knows. */
export function toApplicationDto(application: ApplicationWithRelations): ApplicationDto {
  return {
    id: application.id,
    userId: application.userId,
    company: application.company,
    position: application.position,
    status: application.status,
    salary: application.salary,
    workFormat: application.workFormat,
    jobUrl: application.jobUrl,
    summary: application.summary,
    notes: application.notes,
    appliedDate: application.appliedDate.toISOString(),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    interviews: application.interviews.map(toInterviewDto),
    attachments: application.attachments.map(toAttachmentDto),
  };
}
