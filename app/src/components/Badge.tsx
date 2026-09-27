import type {Fidelity, Publisher, Severity} from '@/sanity/types'

const FIDELITY: Record<Fidelity, string> = {
  exact: 'Lives on under a new name',
  partial: 'Survived, partially',
  workaround: 'Survived by a workaround',
  none: 'No forwarding address in Azure',
}
export const fidelityEpitaph = (f?: Fidelity) => (f ? FIDELITY[f] : 'Whereabouts unknown')

export function Fid({f}: {f: Fidelity}) {
  return <span className={`badge fid-${f}`}>{f}</span>
}
export function Sev({s}: {s: Severity}) {
  return <span className={`badge sev-${s}`}>{s}</span>
}
export function Pub({p}: {p: Publisher}) {
  return <span className={`badge pub-${p}`}>{p}</span>
}
