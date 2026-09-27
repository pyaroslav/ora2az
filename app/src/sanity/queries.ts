import {q} from './client'
import type {Feature, FeatureCard} from './types'

const SOURCE = `{_id, title, publisher, url, docVersion, retrievedAt}`

/** The roster: anything Oracle has deprecated/desupported, or that has no clean Azure home. */
export const ROSTER = /* groq */ `
*[_type == "oracleFeature" && (
    defined(desupportedIn) || defined(deprecatedIn) ||
    count(*[_type == "mapping" && references(^._id) && fidelity in ["none", "workaround"]]) > 0
)] | order(coalesce(desupportedIn, deprecatedIn, "zz") asc, name asc) {
  _id, name, "slug": slug.current, category, introducedIn, deprecatedIn, desupportedIn, oracleReplacement, reviewStatus,
  "mappings": *[_type == "mapping" && references(^._id)]{fidelity, "target": azureTarget->name},
  "blockerCount": count(*[_type == "caveat" && severity == "blocker" && mapping->oracleFeature._ref == ^._id])
}`

export const OBITUARY = /* groq */ `
*[_type == "oracleFeature" && slug.current == $slug][0]{
  _id, name, "slug": slug.current, category, introducedIn, deprecatedIn, desupportedIn, oracleReplacement, reviewStatus,
  summary, obituary,
  "sources": sources[]->${SOURCE},
  "mappings": *[_type == "mapping" && references(^._id)]{
    _id, fidelity, effort, rationale, steps, appliesToOracleVersions,
    "target": azureTarget->{name, "slug": slug.current, service},
    "sources": sources[]->${SOURCE},
    "caveats": *[_type == "caveat" && references(^._id)] | order(severity asc){
      _id, severity, statement, appliesTo, firsthand, "evidence": evidence->${SOURCE}
    }
  },
  "disputes": *[_type == "dispute" && (
      claimA->mapping->oracleFeature._ref == ^._id || claimB->mapping->oracleFeature._ref == ^._id
  )]{
    _id, title, whatDisagrees, resolution, "resolvedBy": resolvedBy->${SOURCE},
    "claimA": claimA->{statement, "evidence": evidence->${SOURCE}},
    "claimB": claimB->{statement, "evidence": evidence->${SOURCE}}
  }
}`

export const STATS = /* groq */ `{
  "features": count(*[_type == "oracleFeature"]),
  "desupported": count(*[_type == "oracleFeature" && defined(desupportedIn)]),
  "deprecated": count(*[_type == "oracleFeature" && defined(deprecatedIn) && !defined(desupportedIn)]),
  "noHome": count(*[_type == "mapping" && fidelity == "none"]),
  "disputes": count(*[_type == "dispute"]),
  "sources": count(*[_type == "source"])
}`

export const SLUGS = /* groq */ `*[_type == "oracleFeature" && defined(slug.current)].slug.current`

const FIDELITY_RANK: Record<string, number> = {exact: 0, partial: 1, workaround: 2, none: 3}

export const getRoster = () => q<FeatureCard[]>(ROSTER, {}, [])
export const getStats = () =>
  q(STATS, {}, {features: 0, desupported: 0, deprecated: 0, noHome: 0, disputes: 0, sources: 0})
export const getSlugs = () => q<string[]>(SLUGS, {}, [])
export async function getObituary(slug: string): Promise<Feature | null> {
  const f = await q<Feature | null>(OBITUARY, {slug}, null)
  if (!f) return null
  f.mappings = (f.mappings ?? []).sort((a, b) => FIDELITY_RANK[a.fidelity] - FIDELITY_RANK[b.fidelity])
  f.disputes ??= []
  f.sources ??= []
  return f
}
