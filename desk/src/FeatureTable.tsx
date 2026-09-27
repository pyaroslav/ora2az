import {useDocuments} from '@sanity/sdk-react'
import {Suspense} from 'react'
import {FeatureRow} from './FeatureRow'

export type StatusFilter = 'all' | 'draft' | 'certified'

// GROQ filter fragments appended to the documentType filter by useDocuments.
const FILTERS: Record<StatusFilter, string | undefined> = {
  all: undefined,
  draft: 'reviewStatus != "certified"',
  certified: 'reviewStatus == "certified"',
}

const COLUMN_COUNT = 7

export function FeatureTable({filter}: {filter: StatusFilter}) {
  // useDocuments returns lightweight document handles; each row fetches
  // its own fields with useDocumentProjection.
  const {data, count, hasMore, isPending, loadMore} = useDocuments({
    documentType: 'oracleFeature',
    filter: FILTERS[filter],
    batchSize: 50,
    orderings: [{field: 'name', direction: 'asc'}],
  })

  return (
    <section className="features-section">
      <p className="features-summary">
        Showing {data.length} of {count} {filter === 'all' ? 'features' : `${filter} features`}
      </p>

      <div className="table-wrap">
        <table className="features">
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">Category</th>
              <th scope="col">Deprecated in</th>
              <th scope="col">Desupported in</th>
              <th scope="col">Obituary</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((handle) => (
              <Suspense
                key={handle.documentId}
                fallback={
                  <tr className="row row--loading">
                    <td colSpan={COLUMN_COUNT}>Loading…</td>
                  </tr>
                }
              >
                <FeatureRow handle={handle} />
              </Suspense>
            ))}
            {data.length === 0 && (
              <tr className="row row--empty">
                <td colSpan={COLUMN_COUNT}>No features match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button type="button" className="load-more" onClick={() => loadMore()} disabled={isPending}>
          {isPending ? 'Loading…' : 'Load more'}
        </button>
      )}
    </section>
  )
}
