import type {Metadata} from 'next'
import Link from 'next/link'
import {CONDITIONS, coroner} from '@/lib/coroner'

export const metadata: Metadata = {title: "The Coroner's Reports — Legacy Obituaries"}

const mark = (v: number | null | undefined) => (v === 1 ? '✓' : v === 0 ? '✗' : '·')

export default function Coroner() {
  const totals = CONDITIONS.map((c) => {
    const rs = coroner.questions.map((q) => q.runs.frozen[c.key])
    const n = (k: 'verdict' | 'grounded' | 'citations') => rs.filter((r) => r?.grade[k] === 1).length
    const d = (k: 'verdict' | 'grounded' | 'citations') => rs.filter((r) => typeof r?.grade[k] === 'number').length
    return {c, v: `${n('verdict')}/${d('verdict')}`, g: `${n('grounded')}/${d('grounded')}`, s: `${n('citations')}/${d('citations')}`}
  })
  return (
    <article className="obit" style={{maxWidth: '60rem'}}>
      <header>
        <h1>The Coroner&rsquo;s Reports</h1>
        <p className="life">18 questions · 4 witnesses · graded blind · frozen {coroner.frozen}</p>
        <p className="epitaph">Every answer the migration agent gave in its evaluation, with every query it ran. Nothing to install.</p>
      </header>

      <h2 className="rule">How to read this</h2>
      <ul className="prose-col" style={{listStyle: 'square', paddingLeft: '1.2rem'}}>
        {CONDITIONS.map((c) => <li key={c.key}><b>{c.label}.</b> {c.blurb}</li>)}
        <li>Answers were shuffled and relabelled before an independent model graded them against a fixed rubric; citations were checked by script. <b>Verdict</b>: reached the expected conclusion. <b>Grounded</b>: no claim beyond retrieved evidence. <b>Cited</b>: cited every required publisher.</li>
        <li>Models: the two Sanity conditions ran on the <b>smaller</b> model; the two baselines ran on the <b>larger</b> model. Grader: the {coroner.graderModel}. The DEV posts name both models.</li>
      </ul>

      <h2 className="rule">Totals</h2>
      <div className="stats" style={{gridTemplateColumns: 'repeat(auto-fit,minmax(12rem,1fr))'}}>
        {totals.map((t) => (
          <div key={t.c.key}><span>{t.c.label}</span><b>{t.v}</b><span>verdicts · grounded {t.g} · cited {t.s}</span></div>
        ))}
      </div>

      <h2 className="rule">The cases</h2>
      <div style={{overflowX: 'auto'}}>
        <table className="coroner-table">
          <thead><tr><th>#</th><th>Question</th>{CONDITIONS.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {coroner.questions.map((q) => (
              <tr key={q.id}>
                <td className="muted">{q.id}</td>
                <td><Link href={`/coroner/${q.id}`}>{q.q}</Link> <span className="badge">{q.type}</span></td>
                {CONDITIONS.map((c) => {
                  const g = q.runs.frozen[c.key]?.grade
                  return <td key={c.key} className="mono" title={g?.note ?? ''}>{mark(g?.verdict)}{mark(g?.grounded)}{mark(g?.citations)}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{fontSize: '0.85rem'}}>Each cell: verdict · grounded · cited. Hover for the grader&rsquo;s note. Raw runs: <a href="https://github.com/pyaroslav/ora2az/tree/main/agent/eval">agent/eval</a>.</p>
    </article>
  )
}
