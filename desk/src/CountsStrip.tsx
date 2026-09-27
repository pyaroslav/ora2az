import {useQuery} from '@sanity/sdk-react'

interface Counts {
  total: number
  certified: number
  drafts: number
  disputes: number
}

// One live GROQ query for the whole strip. Anything without
// reviewStatus == "certified" counts as a draft, including documents
// created before the field existed.
const COUNTS_QUERY = `{
  "total": count(*[_type == "oracleFeature"]),
  "certified": count(*[_type == "oracleFeature" && reviewStatus == "certified"]),
  "drafts": count(*[_type == "oracleFeature" && reviewStatus != "certified"]),
  "disputes": count(*[_type == "dispute"])
}`

export function CountsStrip() {
  const {data, isPending} = useQuery<Counts>({query: COUNTS_QUERY})

  const items: Array<[label: string, value: number, tone: string]> = [
    ['Features', data?.total ?? 0, 'total'],
    ['Certified', data?.certified ?? 0, 'certified'],
    ['Drafts', data?.drafts ?? 0, 'draft'],
    ['Disputes', data?.disputes ?? 0, 'dispute'],
  ]

  return (
    <section className={isPending ? 'counts counts--pending' : 'counts'} aria-label="Totals">
      {items.map(([label, value, tone]) => (
        <div key={label} className={`count count--${tone}`}>
          <span className="count-value">{value}</span>
          <span className="count-label">{label}</span>
        </div>
      ))}
    </section>
  )
}
