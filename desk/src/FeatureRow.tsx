import {useDocumentProjection, type DocumentHandle} from '@sanity/sdk-react'
import {useRef} from 'react'
import {CertifyButton} from './CertifyButton'

export type ReviewStatus = 'draft' | 'certified'

interface FeatureProjection {
  name?: string
  slug?: string
  category?: string
  deprecatedIn?: string
  desupportedIn?: string
  reviewStatus?: string
  hasObituary?: boolean
}

const PROJECTION = `{
  name,
  "slug": slug.current,
  category,
  deprecatedIn,
  desupportedIn,
  reviewStatus,
  "hasObituary": defined(obituary) && count(obituary) > 0
}`

const EMPTY = '·'

export function FeatureRow({handle}: {handle: DocumentHandle}) {
  // The ref lets the SDK defer this projection until the row scrolls into view.
  const ref = useRef<HTMLTableRowElement>(null)

  const {data, isPending} = useDocumentProjection<FeatureProjection>({
    ...handle,
    ref,
    projection: PROJECTION,
  })

  const status: ReviewStatus = data?.reviewStatus === 'certified' ? 'certified' : 'draft'
  const hasObituary = Boolean(data?.hasObituary)

  return (
    <tr ref={ref} className={isPending ? 'row row--pending' : 'row'}>
      <td>
        <strong className="feature-name">{data?.name ?? 'Untitled feature'}</strong>
        {data?.slug && <div className="feature-slug">/{data.slug}</div>}
      </td>
      <td>{data?.category ?? EMPTY}</td>
      <td>{data?.deprecatedIn ?? EMPTY}</td>
      <td>{data?.desupportedIn ?? EMPTY}</td>
      <td>
        {hasObituary ? (
          <span className="pill pill--yes">written</span>
        ) : (
          <span className="pill pill--no">missing</span>
        )}
      </td>
      <td>
        <span className={`pill pill--${status}`}>{status}</span>
      </td>
      <td className="actions">
        <CertifyButton handle={handle} status={status} hasObituary={hasObituary} />
      </td>
    </tr>
  )
}
