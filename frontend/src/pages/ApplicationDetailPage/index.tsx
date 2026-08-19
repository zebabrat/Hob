import { useParams } from 'react-router'
import { ApplicationDetail } from 'features/applications'

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()

  return <ApplicationDetail id={Number(id)} />
}
