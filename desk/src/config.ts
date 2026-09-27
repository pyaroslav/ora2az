// Environment variables prefixed SANITY_APP_ are inlined into the browser
// bundle by the Sanity CLI (dev server and `sanity build`).
// https://www.sanity.io/docs/app-sdk/sdk-configuration#environment-variables

export const projectId: string = process.env.SANITY_APP_PROJECT_ID ?? ''
export const dataset: string = process.env.SANITY_APP_DATASET ?? 'production'
