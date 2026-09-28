// Mirrors a desk certification onto the notice-lifecycle workflow (see ../../workflows).
// Advisory like everything in Workflows early access: the content write has already happened
// when this runs, and a missing instance is not an error.
import type {SanityClient} from '@sanity/client'
import {createEngine, ENGINE_API_VERSION} from '@sanity/workflow-engine'
import {dataset, projectId} from './config'

const DEFINITION = 'notice-lifecycle'

function engineFor(client: SanityClient) {
  return createEngine({
    client: client.withConfig({apiVersion: ENGINE_API_VERSION}),
    workflowResource: {type: 'dataset', id: `${projectId}.${dataset}`},
    tag: 'production',
  })
}

/** Fire `certify` (fact-checked -> certified) or `retract` (certified -> drafted) on the feature's open instance. */
export async function syncWorkflow(client: SanityClient, documentId: string, next: 'certified' | 'draft'): Promise<string | null> {
  const engine = engineFor(client)
  const publishedId = documentId.replace(/^drafts\./, '')
  const instances = await engine.instancesForDocument({document: `dataset:${projectId}:${dataset}:${publishedId}`})
  const open = instances.find((i) => i.definition === DEFINITION)
  if (!open) return null
  if (next === 'certified' && open.currentStage === 'fact-checked') {
    await engine.fireAction({instanceId: open._id, activity: 'certification', action: 'certify'})
    return 'certified'
  }
  if (next === 'draft' && open.currentStage === 'certified') {
    await engine.fireAction({instanceId: open._id, activity: 'retraction', action: 'retract', params: {reason: 'Un-certified in the desk'}})
    return 'drafted'
  }
  return open.currentStage
}
