import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ApplicationDto } from '@hob/shared'
import { toFormErrorMessage } from 'shared/api/errorMessage'
import { deleteAttachment } from '../api/deleteAttachment'
import { uploadAttachment } from '../api/uploadAttachment'

/** Upload and delete for one application's files. Same object, same reasoning as useInterviews. */
export function useAttachments(
  applicationId: number,
  setApplication: Dispatch<SetStateAction<ApplicationDto | null>>,
) {
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setError(null)
      setIsUploading(true)

      try {
        const created = await uploadAttachment(applicationId, file)
        setApplication((current) =>
          current ? { ...current, attachments: [...current.attachments, created] } : current,
        )
      } catch (err) {
        setError(toFormErrorMessage(err))
      } finally {
        setIsUploading(false)
      }
    },
    [applicationId, setApplication],
  )

  const remove = useCallback(
    async (attachmentId: number) => {
      setError(null)
      setDeletingId(attachmentId)

      try {
        await deleteAttachment(attachmentId)
        setApplication((current) =>
          current
            ? {
                ...current,
                attachments: current.attachments.filter(
                  (attachment) => attachment.id !== attachmentId,
                ),
              }
            : current,
        )
      } catch (err) {
        setError(toFormErrorMessage(err))
      } finally {
        setDeletingId(null)
      }
    },
    [setApplication],
  )

  return { upload, remove, isUploading, deletingId, error }
}
