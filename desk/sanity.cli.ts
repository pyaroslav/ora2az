import {defineCliConfig} from 'sanity/cli'

// The Sanity CLI loads .env files into process.env before evaluating this
// file, so the organization id can live in .env instead of being hard-coded.
// Docs: https://www.sanity.io/docs/app-sdk/sdk-configuration#cli-configuration
const organizationId = process.env.SANITY_APP_ORGANIZATION_ID

if (!organizationId) {
  throw new Error(
    'SANITY_APP_ORGANIZATION_ID is not set. Copy .env.example to .env and fill in your organization id.',
  )
}

// Defaults for the optional runtime variables read by src/config.ts.
// The bundler inlines each process.env.SANITY_APP_* reference individually,
// and a variable that is unset at build time would be left as a bare
// `process.env` lookup, which does not exist in the browser. Setting the
// defaults here guarantees every reference has a value to inline.
process.env.SANITY_APP_PROJECT_ID ??= ''
process.env.SANITY_APP_DATASET ??= 'production'

export default defineCliConfig({
  app: {
    organizationId,
    entry: './src/App.tsx',
    title: "Mortician's Desk",
  },
  deployment: {appId: 'mnuftqiwykngiwbua6tj9xrr'},
})
