import {createClient} from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
export const apiVersion = '2026-09-01'

export const client = createClient({
  projectId: projectId || 'missing',
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})

export const configured = Boolean(projectId)

/** Fetch with a short cache; returns `fallback` when the project is not configured yet. */
export async function q<T>(query: string, params: Record<string, unknown> = {}, fallback: T): Promise<T> {
  if (!configured) return fallback
  return client.fetch<T>(query, params, {next: {revalidate: 60}})
}
