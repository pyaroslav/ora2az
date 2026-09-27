import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  studioHost: process.env.SANITY_STUDIO_HOSTNAME ?? 'ora2az',
  autoUpdates: true,
  deployment: {appId: 'jf9dxlcbi4ahn1yxfp3bbyyu'},
})
