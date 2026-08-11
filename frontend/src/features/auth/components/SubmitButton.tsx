interface SubmitButtonProps {
  children: string
  pendingLabel: string
  isSubmitting: boolean
}

export function SubmitButton({ children, pendingLabel, isSubmitting }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white dark:focus-visible:outline-neutral-100"
    >
      {isSubmitting ? pendingLabel : children}
    </button>
  )
}
