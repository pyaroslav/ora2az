import type {Metadata} from 'next'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {marked} from 'marked'
import {CONDITIONS, coroner, getQuestion, type Run} from '@/lib/coroner'

type Props = {params: Promise<{id: string}>}
export function generateStaticParams() { return coroner.questions.map((q) => ({id: q.id})) }
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const q = getQuestion((await params).id)
  return {title: q ? `${q.id}: ${q.q} — Coroner's Reports` : 'Case not found'}
}

const yes = (v: number | null | undefined, label: string) =>
  typeof v === 'number' ? <span className={`badge ${v ? 'fid-exact' : 'fid-none'}`}>{v ? '✓' : '✗'} {label}</span> : null

function Witness({label, blurb, run}: {label: string; blurb: string; run?: Run}) {
  if (!run) return null
  return (
    <section className="card witness">
      <h3>{label}</h3>
      <div className="scope">{blurb}</div>
      <div className="scope">
        <code>{run.model}</code> · {run.turns} turn{run.turns === 1 ? '' : 's'} · {Math.round((run.ms ?? 0) / 1000)} s · {(run.tokens.in / 1000).toFixed(1)}k in / {(run.tokens.out / 1000).toFixed(1)}k out
      </div>
      <p style={{margin: '0.4rem 0'}}>{yes(run.grade.verdict, 'verdict')} {yes(run.grade.grounded, 'grounded')} {yes(run.grade.citations, 'cited')} {yes(run.grade.refusal, 'refused')}</p>
      {run.grade.note && <p className="muted" style={{fontStyle: 'italic'}}>Grader: {run.grade.note}</p>}
      {run.calls.length > 0 && (
        <details>
          <summary>{run.calls.length} tool call{run.calls.length === 1 ? '' : 's'}</summary>
          <ol className="calls">
            {run.calls.map((c, i) => (
              <li key={i}>
                <b>{c.tool}</b> <span className="muted">on {c.server} · {c.resultChars.toLocaleString()} chars back</span>
                {Object.keys(c.input).length > 0 && <pre>{typeof c.input.query === 'string' ? c.input.query : JSON.stringify(c.input, null, 1)}</pre>}
              </li>
            ))}
          </ol>
        </details>
      )}
      {run.bm25.length > 0 && (
        <details><summary>{run.bm25.length} keyword-search passages</summary>
          <ol className="calls">{run.bm25.map((p) => <li key={p.id}><code>{p.id}</code> <span className="muted">score {p.score}</span></li>)}</ol>
        </details>
      )}
      <details open><summary>Answer</summary><div className="answer" dangerouslySetInnerHTML={{__html: marked.parse(run.answer, {async: false}) as string}} /></details>
    </section>
  )
}

export default async function Case({params}: Props) {
  const q = getQuestion((await params).id)
  if (!q) notFound()
  const i = coroner.questions.findIndex((x) => x.id === q.id)
  const prev = coroner.questions[i - 1], next = coroner.questions[i + 1]
  return (
    <article className="obit" style={{maxWidth: '72rem'}}>
      <header>
        <p className="life">Case {q.id} · {q.type}</p>
        <h1 style={{fontSize: 'clamp(1.5rem,4vw,2.3rem)'}}>{q.q}</h1>
        <p className="epitaph">Expected: {q.expected}</p>
      </header>
      {q.addedAfterFreeze && <p className="card">Added after the frozen run to test the Knowledge Base on how-to prose. Not counted in the frozen totals.</p>}
      {q.afterFixNote && <p className="card">{q.afterFixNote} The re-run is shown at the bottom; the frozen totals are not updated.</p>}
      <div className="witnesses">
        {CONDITIONS.map((c) => <Witness key={c.key} label={c.label} blurb={c.blurb} run={(q.runs.frozen ?? q.runs.added)?.[c.key]} />)}
      </div>
      {q.runs.afterFix && (
        <>
          <h2 className="rule">After the fix</h2>
          <div className="witnesses">
            {CONDITIONS.map((c) => <Witness key={c.key} label={c.label} blurb={c.blurb} run={q.runs.afterFix?.[c.key]} />)}
          </div>
        </>
      )}
      <p style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between'}}>
        {prev ? <Link href={`/coroner/${prev.id}`}>← {prev.id}</Link> : <span />}
        <Link href="/coroner">All cases</Link>
        {next ? <Link href={`/coroner/${next.id}`}>{next.id} →</Link> : <span />}
      </p>
    </article>
  )
}
