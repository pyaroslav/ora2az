import type {Source} from '@/sanity/types'
import {Pub} from './Badge'

export function SourceList({sources, title = 'Notices of correction'}: {sources: Source[]; title?: string}) {
  const seen = new Set<string>()
  const list = sources.filter((s) => s && !seen.has(s._id) && seen.add(s._id))
  if (!list.length) return null
  return (
    <section aria-labelledby="sources">
      <h2 id="sources" className="rule">{title}</h2>
      <ol className="sources">
        {list.map((s) => (
          <li key={s._id}>
            <Pub p={s.publisher} /> <a href={s.url} rel="noopener noreferrer">{s.title}</a>
            {s.docVersion ? <span className="muted"> · {s.docVersion}</span> : null}
            {s.retrievedAt ? <span className="muted"> · read {s.retrievedAt}</span> : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
