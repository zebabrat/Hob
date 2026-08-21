import type { ApplicationDto, AttachmentDto, InterviewDto, StatusChangeDto } from '@hob/shared';
import type { Attachment, Interview, Prisma, StatusChange } from '../generated/prisma/client.js';

/**
 * What "with all details" means, in one place. Both the list and the single
 * application route use it, so the two cannot answer with different shapes.
 */
export const applicationInclude = {
  interviews: { orderBy: { createdAt: 'asc' } },
  attachments: { orderBy: { uploadedAt: 'asc' } },
  statusChanges: { orderBy: { changedAt: 'asc' } },
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

export function toStatusChangeDto(statusChange: StatusChange): StatusChangeDto {
  return {
    id: statusChange.id,
    applicationId: statusChange.applicationId,
    fromStatus: statusChange.fromStatus,
    toStatus: statusChange.toStatus,
    changedAt: statusChange.changedAt.toISOString(),
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
    recruiter: application.recruiter,
    status: application.status,
    priority: application.priority,
    salary: application.salary,
    salaryType: application.salaryType,
    workFormat: application.workFormat,
    jobUrl: application.jobUrl,
    source: application.source,
    offerDeadline: application.offerDeadline?.toISOString() ?? null,
    labels: application.labels,
    summary: application.summary,
    notes: application.notes,
    appliedDate: application.appliedDate.toISOString(),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    interviews: application.interviews.map(toInterviewDto),
    attachments: application.attachments.map(toAttachmentDto),
    statusChanges: application.statusChanges.map(toStatusChangeDto),
  };
}
