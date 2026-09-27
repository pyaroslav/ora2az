import Link from 'next/link'
import {getRoster, getStats} from '@/sanity/queries'
import {configured} from '@/sanity/client'
import {Fid, fidelityEpitaph} from '@/components/Badge'
import type {Fidelity} from '@/sanity/types'

export const dynamic = 'force-dynamic'

const RANK: Record<Fidelity, number> = {exact: 0, partial: 1, workaround: 2, none: 3}
const worst = (ms: Array<{fidelity: Fidelity}>) =>
  ms.length ? ms.reduce((w, m) => (RANK[m.fidelity] > RANK[w] ? m.fidelity : w), 'exact' as Fidelity) : undefined

function life(f: {introducedIn?: string; deprecatedIn?: string; desupportedIn?: string}) {
  const born = f.introducedIn ?? '—'
  if (f.desupportedIn) return `${born} – ${f.desupportedIn}, desupported`
  if (f.deprecatedIn) return `${born} – deprecated ${f.deprecatedIn}`
  return `${born} – still with us, but not in Azure`
}

export default async function Page() {
  const [roster, stats] = await Promise.all([getRoster(), getStats()])
  return (
    <>
      <div className="stats" aria-label="Edition figures">
        <div><b>{stats.desupported}</b><span>desupported</span></div>
        <div><b>{stats.deprecated}</b><span>deprecated</span></div>
        <div><b>{stats.noHome}</b><span>no Azure home</span></div>
        <div><b>{stats.disputes}</b><span>contested accounts</span></div>
        <div><b>{stats.sources}</b><span>sources cited</span></div>
      </div>

      {!configured && (
        <p className="card">This edition has no dataset yet. Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> to print the notices.</p>
      )}
      {configured && roster.length === 0 && <p className="card">The presses are warm but the roster is empty. Seed the dataset.</p>}

      <section className="notices" aria-label="Notices">
        {roster.map((f) => {
          const w = worst(f.mappings)
          return (
            <article className="notice" key={f._id}>
              <h3><Link href={`/obituary/${f.slug}`}>{f.name}</Link></h3>
              <div className="life">{life(f)}</div>
              <p>
                <em>{fidelityEpitaph(w)}.</em>{' '}
                {f.mappings.length > 0 && (
                  <>Survived by {f.mappings.map((m, i) => (
                    <span key={i}>{i > 0 ? ', ' : ''}{m.target} <Fid f={m.fidelity} /></span>
                  ))}.</>
                )}
                {f.oracleReplacement ? <> Oracle names <b>{f.oracleReplacement}</b> as next of kin.</> : null}
                {f.blockerCount > 0 ? <> {f.blockerCount} blocking complication{f.blockerCount > 1 ? 's' : ''} recorded.</> : null}
              </p>
            </article>
          )
        })}
      </section>
    </>
  )
}
