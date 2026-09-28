import {defineWorkflowConfig} from '@sanity/workflow-engine/define'

import {noticeLifecycle} from './definitions/notice-lifecycle.ts'

// One deployment: the engine stores its definitions, instances and guards in the same
// dataset as the content (udyjvgsk.production), partitioned under the tag "production".
export default defineWorkflowConfig({
  deployments: [
    {
      name: 'production',
      tag: 'production',
      // Required subject fields need reader model 10. This repo is the only runtime on the resource.
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: 'udyjvgsk.production'},
      definitions: [noticeLifecycle],
    },
  ],
})
