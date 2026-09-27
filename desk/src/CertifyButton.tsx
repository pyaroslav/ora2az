import {
  editDocument,
  publishDocument,
  useApplyDocumentActions,
  type DocumentHandle,
} from '@sanity/sdk-react'
import {useState} from 'react'
import type {ReviewStatus} from './FeatureRow'

interface CertifyButtonProps {
  handle: DocumentHandle
  status: ReviewStatus
  hasObituary: boolean
}

export function CertifyButton({handle, status, hasObituary}: CertifyButtonProps) {
  const apply = useApplyDocumentActions()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function setReviewStatus(next: ReviewStatus) {
    setBusy(true)
    setError(null)
    try {
      // Both actions go out as one transaction: patch reviewStatus on the
      // draft (creating the draft from the published version if needed),
      // then publish that draft so the public site sees the new status.
      const result = await apply([
        editDocument(handle, {set: {reviewStatus: next}}),
        publishDocument(handle),
      ])
      await result.submitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const isDraft = status === 'draft'
  const blocked = isDraft && !hasObituary

  return (
    <div className="certify">
      <button
        type="button"
        className={isDraft ? 'btn btn--certify' : 'btn btn--uncertify'}
        disabled={busy || blocked}
        title={blocked ? 'Write the obituary in Studio before certifying.' : undefined}
        onClick={() => setReviewStatus(isDraft ? 'certified' : 'draft')}
      >
        {busy ? 'Saving…' : isDraft ? 'Certify' : 'Un-certify'}
      </button>
      {error && (
        <span className="certify-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
