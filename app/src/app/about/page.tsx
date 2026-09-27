import {projectId, dataset} from '@/sanity/client'

export default function About() {
  return (
    <article className="obit">
      <h2 className="rule">About this paper</h2>
      <p>
        Every notice is assembled from a structured dataset, not written by hand. An Oracle feature document carries its
        introduction, deprecation and desupport releases with sources. Mapping documents connect it to Azure targets with a
        fidelity grade (exact, partial, workaround, none). Caveats hang off mappings and are scoped to Oracle versions,
        editions and Azure tiers, each with an evidence source. When two sources disagree, a dispute document records both
        claims and the resolution.
      </p>
      <p>
        The same dataset powers a migration advisor agent that can only answer from what these
        documents say. This site is the obituary column; the agent is the coroner.
      </p>
      <h2 className="rule">Query it yourself</h2>
      <p className="muted">
        Public dataset: project <code>{projectId || '<not configured>'}</code>, dataset <code>{dataset}</code>.
        {projectId ? (
          <> Try <a href={`https://${projectId}.api.sanity.io/v2026-09-01/data/query/${dataset}?query=${encodeURIComponent('*[_type=="dispute"]{title,resolution}')}`}>all disputes</a>.</>
        ) : null}
      </p>
      <h2 className="rule">Sources policy</h2>
      <p>Oracle documentation, Microsoft Learn, community tool documentation, and the author&apos;s public blog and labs. Nothing else.</p>
    </article>
  )
}
