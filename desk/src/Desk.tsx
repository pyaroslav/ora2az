import {Suspense, useState} from 'react'
import {useQuery} from '@sanity/sdk-react'
import {CountsStrip} from './CountsStrip'
import {FeatureTable, type StatusFilter} from './FeatureTable'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  draft: 'Drafts',
  certified: 'Certified',
}

export function Desk() {
  // Land on Drafts when something awaits review; otherwise show everything. A clicked tab wins.
  const [chosen, setFilter] = useState<StatusFilter | null>(null)
  const {data: pending} = useQuery<number>({query: 'count(*[_type == "oracleFeature" && reviewStatus != "certified"])'})
  const filter: StatusFilter = chosen ?? (pending ? 'draft' : 'all')

  return (
    <main className="desk">
      <header className="desk-masthead">
        <h1>Mortician&rsquo;s Desk</h1>
        <p className="desk-sub">
          Review desk for Legacy Obituaries. Certifying a draft publishes it to the public site;
          un-certifying pulls it back to draft.
        </p>
      </header>

      <Suspense fallback={<div className="counts counts--loading">Counting…</div>}>
        <CountsStrip />
      </Suspense>

      <nav className="filters" aria-label="Filter by review status">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            className={key === filter ? 'filter filter--active' : 'filter'}
            aria-pressed={key === filter}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </nav>

      <Suspense fallback={<p className="desk-loading">Loading features…</p>}>
        <FeatureTable filter={filter} />
      </Suspense>
    </main>
  )
}
