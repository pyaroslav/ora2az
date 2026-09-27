export type Publisher = 'oracle' | 'microsoft' | 'community' | 'firsthand'
export type Fidelity = 'exact' | 'partial' | 'workaround' | 'none'
export type Severity = 'blocker' | 'major' | 'minor'
export type PT = Array<{_type: 'block'; _key: string; children: Array<{text: string}>; style?: string; listItem?: string}>

export interface Source { _id: string; title: string; publisher: Publisher; url: string; docVersion?: string; retrievedAt?: string }
export interface Caveat {
  _id: string; severity: Severity; statement: string; firsthand?: boolean
  appliesTo?: {oracleVersions?: string[]; editions?: string[]; azureTiers?: string[]}
  evidence?: Source
}
export interface Mapping {
  _id: string; fidelity: Fidelity; effort?: 'S' | 'M' | 'L'; rationale: string; steps?: PT
  appliesToOracleVersions?: string[]; target: {name: string; slug: string; service: string}
  sources?: Source[]; caveats: Caveat[]
}
export interface Dispute {
  _id: string; title: string; whatDisagrees: string; resolution: string; resolvedBy?: Source
  claimA: {statement: string; evidence?: Source}; claimB: {statement: string; evidence?: Source}
}
export interface FeatureCard {
  _id: string; name: string; slug: string; category: string
  introducedIn?: string; deprecatedIn?: string; desupportedIn?: string; oracleReplacement?: string
  reviewStatus?: 'draft' | 'certified'
  mappings: Array<{fidelity: Fidelity; target: string}>
  blockerCount: number
}
export interface Feature extends Omit<FeatureCard, 'mappings' | 'blockerCount'> {
  summary?: PT; obituary?: PT; sources: Source[]; mappings: Mapping[]; disputes: Dispute[]
}
