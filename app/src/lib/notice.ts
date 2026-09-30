import type {getObituary} from '@/sanity/queries'
import {fidelityEpitaph} from '@/components/Badge'

type Feature = NonNullable<Awaited<ReturnType<typeof getObituary>>>

// One line for link previews: dates, epitaph, and who carries on.
export function noticeLine(f: Feature): string {
  const life = [f.introducedIn ? `Born ${f.introducedIn}` : null, f.deprecatedIn ? `deprecated ${f.deprecatedIn}` : null, f.desupportedIn ? `desupported ${f.desupportedIn}` : null].filter(Boolean).join(', ')
  const survivors = [...new Set(f.mappings.map((m) => m.target?.name).filter(Boolean))].slice(0, 3).join(', ')
  return [life, `${fidelityEpitaph(f.mappings[0]?.fidelity)}.`, survivors ? `Survived by ${survivors}.` : null].filter(Boolean).join('. ').replace(/\.\./g, '.')
}
