import type { FormEvent } from 'react'
import { FormError } from 'shared/components/FormError'
import { SubmitButton } from 'shared/components/SubmitButton'
import { TextField } from 'shared/components/TextField'
import { Button } from 'shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'shared/components/ui/dialog'
import { Label } from 'shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'shared/components/ui/select'
import { UNSPECIFIED_WORK_FORMAT, readApplicationValues, workFormatSelectLabel } from '../helpers/formValues'
import type { ApplicationFormValues } from '../types'

interface CreateApplicationModalProps {
  isOpen: boolean
  isSubmitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (values: ApplicationFormValues) => void
}

export function CreateApplicationModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: CreateApplicationModalProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(readApplicationValues(event.currentTarget))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New application</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormError message={error} />

          <TextField
            label="Company"
            name="company"
            placeholder="Acme"
            required
            disabled={isSubmitting}
          />

          <TextField
            label="Position"
            name="position"
            placeholder="Backend Engineer"
            required
            disabled={isSubmitting}
          />

          <TextField
            label="Applied on"
            name="appliedDate"
            type="date"
            required
            disabled={isSubmitting}
          />

          <TextField
            label="Salary"
            name="salary"
            type="number"
            min={0}
            placeholder="180000"
            hint="Optional"
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-application-work-format">Work format</Label>
            {/* name+defaultValue keep this readable by the same FormData-based
                helper every other field here uses — Base UI's Select renders
                a hidden native input so a plain form submit still sees it. */}
            <Select
              name="workFormat"
              defaultValue={UNSPECIFIED_WORK_FORMAT}
              disabled={isSubmitting}
            >
              <SelectTrigger id="create-application-work-format" className="w-full">
                {/*
                 * A children render-prop, not the `placeholder` prop: this
                 * Select always has a real value (the sentinel counts), so
                 * it is never in Base UI's "no value" placeholder state —
                 * `placeholder` would never fire. See workFormatSelectLabel.
                 */}
                <SelectValue>{(value: string) => workFormatSelectLabel(value)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSPECIFIED_WORK_FORMAT}>Not specified</SelectItem>
                <SelectItem value="REMOTE">Remote</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="ONSITE">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TextField
            label="Job posting"
            name="jobUrl"
            type="url"
            placeholder="https://example.com/jobs/1"
            hint="Optional"
            disabled={isSubmitting}
          />

          <DialogFooter className="mt-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
            <SubmitButton isSubmitting={isSubmitting} pendingLabel="Adding…">
              Add application
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
