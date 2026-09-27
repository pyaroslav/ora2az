import {SanityApp, type SanityConfig} from '@sanity/sdk-react'
import {dataset, projectId} from './config'
import {Desk} from './Desk'
import './desk.css'

export default function App() {
  if (!projectId) {
    return (
      <main className="desk desk--setup">
        <h1>Mortician&rsquo;s Desk</h1>
        <p>
          No project configured. Copy <code>.env.example</code> to <code>.env</code>, set{' '}
          <code>SANITY_APP_PROJECT_ID</code> (and <code>SANITY_APP_DATASET</code> if it is not{' '}
          <code>production</code>), then restart <code>npm run dev</code>.
        </p>
      </main>
    )
  }

  // The desk is a reviewer tool, so it reads the drafts perspective: unpublished
  // drafts and pending edits show up alongside published documents.
  const config: SanityConfig[] = [{projectId, dataset, perspective: 'drafts'}]

  return (
    <SanityApp config={config} fallback={<div className="desk-loading">Opening the desk…</div>}>
      <Desk />
    </SanityApp>
  )
}
