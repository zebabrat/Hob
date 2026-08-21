import type { AttachmentDto } from '@hob/shared'
import { formatShortDate } from 'shared/helpers/formatShortDate'
import { Button } from 'shared/components/ui/button'
import { isImageFileName } from '../helpers/attachmentPreview'

interface AttachmentListProps {
  attachments: AttachmentDto[]
  deletingId: number | null
  onDelete: (id: number) => void
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className="h-8 w-8 shrink-0 text-muted-foreground"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v5h5" />
    </svg>
  )
}

export function AttachmentList({ attachments, deletingId, onDelete }: AttachmentListProps) {
  if (attachments.length === 0) {
    return <p className="border-t border-border-weak py-3 text-sm text-text-tertiary">No files yet.</p>
  }

  return (
    <ul>
      {attachments.map((attachment) => (
        <li
          key={attachment.id}
          className="flex items-center gap-2.5 border-t border-border-weak py-3 last:border-b"
        >
          {isImageFileName(attachment.fileName) ? (
            <img src={attachment.blobUrl} alt="" className="h-8 w-8 shrink-0 object-cover" />
          ) : (
            <FileIcon />
          )}

          <a
            href={attachment.blobUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 truncate font-mono text-[0.71875rem] text-foreground hover:underline"
          >
            {attachment.fileName}
          </a>

          <span className="font-mono text-[0.625rem] text-text-tertiary">
            {formatShortDate(attachment.uploadedAt)}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(attachment.id)}
            disabled={deletingId === attachment.id}
            className="shrink-0 text-destructive hover:text-destructive"
          >
            {deletingId === attachment.id ? 'Removing…' : 'Delete'}
          </Button>
        </li>
      ))}
    </ul>
  )
}
