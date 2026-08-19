import type { ChangeEvent } from 'react'
import { FormError } from 'shared/components/FormError'
import { buttonVariants } from 'shared/components/ui/button-variants'
import { cn } from 'shared/lib/utils'

interface AttachmentUploadProps {
  isUploading: boolean
  error: string | null
  onUpload: (file: File) => void
}

/** Uploads on pick — attachments are not the form with a Save button; each one is its own action. */
export function AttachmentUpload({ isUploading, error, onUpload }: AttachmentUploadProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Cleared so picking the same file again still fires a change event.
    event.target.value = ''
    if (file) onUpload(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <FormError message={error} />

      {/*
       * A real <input type="file"> hidden behind a label styled like a
       * button — buttonVariants (not the Button component) because a
       * button element cannot itself wrap the input.
       */}
      <label
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-fit cursor-pointer has-disabled:cursor-not-allowed',
        )}
      >
        {isUploading ? 'Uploading…' : 'Upload file'}
        <input type="file" className="sr-only" disabled={isUploading} onChange={handleChange} />
      </label>
    </div>
  )
}
