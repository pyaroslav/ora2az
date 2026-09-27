import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {getObituary} from '@/sanity/queries'
import {Fid, Pub, Sev, fidelityEpitaph} from '@/components/Badge'
import {Prose} from '@/components/Prose'
import {SourceList} from '@/components/SourceList'

export const dynamic = 'force-dynamic'

type Props = {params: Promise<{slug: string}>}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params
  const f = await getObituary(slug)
  return {title: f ? `${f.name} — Legacy Obituaries` : 'Notice not found'}
}

export default async function Obituary({params}: Props) {
  const {slug} = await params
  const f = await getObituary(slug)
  if (!f) notFound()

  const bestFidelity = f.mappings[0]?.fidelity // mappings are sorted best-first
  const status = f.desupportedIn
    ? `Desupported in Oracle Database ${f.desupportedIn}${f.deprecatedIn ? ` after deprecation in ${f.deprecatedIn}` : ''}.`
    : f.deprecatedIn
      ? `Deprecated in Oracle Database ${f.deprecatedIn}; still functional, no longer recommended.`
      : 'Not deprecated by Oracle. Listed here because Azure offers no clean equivalent.'
  const allSources = [
    ...f.sources,
    ...f.mappings.flatMap((m) => [...(m.sources ?? []), ...m.caveats.map((c) => c.evidence!).filter(Boolean)]),
    ...f.disputes.flatMap((d) => [d.claimA.evidence!, d.claimB.evidence!, d.resolvedBy!].filter(Boolean)),
  ]

  return (
    <article className="obit">
      <header>
        <h1>{f.name}</h1>
        <div className="life">
          {f.introducedIn ?? '—'} · {f.category}
          {f.deprecatedIn ? ` · deprecated ${f.deprecatedIn}` : ''}
          {f.desupportedIn ? ` · desupported ${f.desupportedIn}` : ''}
        </div>
        <p className="epitaph">{fidelityEpitaph(bestFidelity)}.</p>
        <p className="cert muted">{f.reviewStatus === 'certified' ? '✓ certified by the mortician' : 'draft notice, awaiting certification'}</p>
      </header>

      <h2 className="rule">In life</h2>
      <Prose value={f.summary} />

      <h2 className="rule">Cause of departure</h2>
      <p>{status}{f.oracleReplacement ? <> Oracle names <b>{f.oracleReplacement}</b> as the successor.</> : null}</p>

      {f.obituary?.length ? (<><h2 className="rule">Obituary</h2><Prose value={f.obituary} /></>) : null}

      <h2 className="rule">Survived by</h2>
      {f.mappings.length === 0 && <p className="muted">No Azure relation has come forward.</p>}
      {f.mappings.map((m) => (
        <section className="card" key={m._id}>
          <h3>{m.target.name} <Fid f={m.fidelity} /> {m.effort ? <span className="badge">effort {m.effort}</span> : null}</h3>
          {m.appliesToOracleVersions?.length ? <div className="scope">Applies to Oracle {m.appliesToOracleVersions.join(', ')}</div> : null}
          <p>{m.rationale}</p>
          <Prose value={m.steps} />
          {m.caveats.length > 0 && (
            <>
              <h4 className="rule" style={{fontSize: '0.95rem'}}>Complications</h4>
              {m.caveats.map((c) => (
                <div className="caveat" key={c._id}>
                  <Sev s={c.severity} /> {c.statement}
                  <div className="scope">
                    {c.appliesTo?.oracleVersions?.length ? `Oracle ${c.appliesTo.oracleVersions.join(', ')}` : ''}
                    {c.appliesTo?.editions?.length ? ` · ${c.appliesTo.editions.join(', ')}` : ''}
                    {c.appliesTo?.azureTiers?.length ? ` · ${c.appliesTo.azureTiers.join(', ')}` : ''}
                    {c.evidence ? <> · <Pub p={c.evidence.publisher} /> <a href={c.evidence.url}>{c.evidence.title}</a></> : null}
                    {c.firsthand ? ' · observed firsthand' : ''}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      ))}

      {f.disputes.length > 0 && (
        <>
          <h2 className="rule">Contested accounts</h2>
          {f.disputes.map((d) => (
            <section className="dispute" key={d._id}>
              <h3 style={{fontFamily: 'var(--font-display)'}}>{d.title}</h3>
              <p className="muted">{d.whatDisagrees}</p>
              <div className="claims">
                {[d.claimA, d.claimB].map((c, i) => (
                  <div key={i}>
                    <p>{c.statement}</p>
                    {c.evidence ? <div className="scope"><Pub p={c.evidence.publisher} /> <a href={c.evidence.url}>{c.evidence.title}</a></div> : null}
                  </div>
                ))}
              </div>
              <p><b>Resolution.</b> {d.resolution}{d.resolvedBy ? <> (<a href={d.resolvedBy.url}>{d.resolvedBy.title}</a>)</> : null}</p>
            </section>
          ))}
        </>
      )}

      <SourceList sources={allSources} />
      <p style={{marginTop: '1.5rem'}}><Link href="/">← All notices</Link></p>
    </article>
  )
}
