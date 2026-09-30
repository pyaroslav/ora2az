import {ImageResponse} from 'next/og'
import {getObituary} from '@/sanity/queries'
import {fidelityEpitaph} from '@/components/Badge'

export const alt = 'A notice from The Legacy Obituaries'
export const size = {width: 1200, height: 630}
export const contentType = 'image/png'

// A per-notice social card in the paper's style: masthead, name, dates, epitaph, survivors.
export default async function Image({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const f = await getObituary(slug)
  const name = f?.name ?? 'Notice not found'
  const life = f
    ? [f.introducedIn ? `born ${f.introducedIn}` : null, f.deprecatedIn ? `deprecated ${f.deprecatedIn}` : null, f.desupportedIn ? `desupported ${f.desupportedIn}` : null].filter(Boolean).join(' · ')
    : ''
  const epitaph = f ? `${fidelityEpitaph(f.mappings[0]?.fidelity)}.` : ''
  const survivors = f ? [...new Set(f.mappings.map((m) => m.target?.name).filter(Boolean))].slice(0, 3).join(' · ') : ''
  return new ImageResponse(
    (
      <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f4efe4', color: '#1d1a16', padding: '48px 72px', fontFamily: 'serif'}}>
        <div style={{display: 'flex', justifyContent: 'center', fontSize: 30, letterSpacing: 2, borderBottom: '3px solid #1d1a16', paddingBottom: 14}}>THE LEGACY OBITUARIES</div>
        <div style={{display: 'flex', justifyContent: 'center', fontSize: 20, color: '#5a5248', marginTop: 8}}>Notices of desupport &amp; departure · Oracle Database → Azure</div>
        <div style={{display: 'flex', flexGrow: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
          <div style={{display: 'flex', fontSize: name.length > 34 ? 60 : 78, fontWeight: 700, lineHeight: 1.1}}>{name}</div>
          {life ? <div style={{display: 'flex', fontSize: 28, color: '#5a5248', marginTop: 18}}>{life}</div> : null}
          {epitaph ? <div style={{display: 'flex', fontSize: 38, fontStyle: 'italic', marginTop: 26}}>{epitaph}</div> : null}
        </div>
        {survivors ? <div style={{display: 'flex', justifyContent: 'center', fontSize: 24, borderTop: '1px solid #1d1a16', paddingTop: 14}}>Survived by {survivors}</div> : null}
      </div>
    ),
    size,
  )
}
