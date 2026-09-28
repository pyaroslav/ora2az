import {
  defineAction,
  defineActivity,
  defineField,
  defineGuard,
  defineOp,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

// The life of one obituary ("death notice") on an Oracle feature:
//
//   drafted --(fact-check: pass)--> fact-checked --(certify)--> certified
//      ^   \__(fact-check: fail, note; stays in drafted)          |
//      |                         |                                 |
//      +------(send-back)--------+                                 |
//      +--------------------------(retract)------------------------+
//
// `certified` is the resting stage. It keeps one caller-fired `retract` action, so it is
// deliberately not terminal: a terminal stage completes the instance, and the obituary freeze
// guard below only lives while an instance occupies the stage.

export const noticeLifecycle = defineWorkflow({
  name: 'notice-lifecycle',
  title: 'Obituary notice lifecycle',
  description:
    'Moves one Oracle feature obituary from draft, through an automated release/ORA-code fact check, to human certification.',
  initialStage: 'drafted',
  fields: [
    defineField({
      type: 'subject',
      name: 'subject',
      title: 'Oracle feature',
      types: ['oracleFeature'],
      required: true,
      initialValue: {type: 'input'},
      description: 'The published oracleFeature document whose obituary this instance tracks.',
    }),
    defineField({type: 'string', name: 'factCheck', title: 'Fact check result', description: '"passed" or "failed".'}),
    defineField({type: 'text', name: 'factCheckNote', title: 'Fact check note'}),
    defineField({type: 'datetime', name: 'factCheckedAt', title: 'Fact checked at'}),
    defineField({type: 'string', name: 'decision', title: 'Last editorial decision', description: '"certified", "sent-back" or "retracted".'}),
    defineField({type: 'text', name: 'decisionNote', title: 'Decision note'}),
    defineField({type: 'actor', name: 'certifiedBy', title: 'Certified by'}),
  ],
  start: {
    requirements: [{type: 'singleSubject', name: 'one-open-notice', title: 'This obituary already has an open workflow'}],
  },
  stages: [
    defineStage({
      name: 'drafted',
      title: 'Drafted',
      description: 'An obituary draft exists. The fact check script runs against the draft document and reports here.',
      activities: [
        defineActivity({
          name: 'fact-check',
          title: 'Fact check releases and ORA- codes',
          description:
            'Every Oracle release and ORA- code the obituary mentions must appear in the feature\'s own data (summary, releases, mappings, caveats, disputes). Fired by workflows/scripts/fact-check.mjs.',
          actions: [
            defineAction({
              name: 'pass',
              title: 'Fact check passed',
              status: 'done',
              params: [{type: 'string', name: 'note', title: 'Note'}],
              ops: [
                defineOp({type: 'field.set', target: {field: 'factCheck'}, value: {type: 'literal', value: 'passed'}}),
                defineOp({type: 'field.set', target: {field: 'factCheckNote'}, value: {type: 'param', param: 'note'}}),
                defineOp({type: 'field.set', target: {field: 'factCheckedAt'}, value: {type: 'now'}}),
                // A decision left over from an earlier send-back or retraction must not re-route the next visit.
                defineOp({type: 'field.unset', target: {field: 'decision'}}),
              ],
            }),
            defineAction({
              name: 'fail',
              title: 'Fact check failed',
              // No status: the activity stays active, so the instance stays in `drafted`
              // with the note until the obituary is fixed and the check passes.
              params: [{type: 'string', name: 'note', title: 'What failed', required: true}],
              ops: [
                defineOp({type: 'field.set', target: {field: 'factCheck'}, value: {type: 'literal', value: 'failed'}}),
                defineOp({type: 'field.set', target: {field: 'factCheckNote'}, value: {type: 'param', param: 'note'}}),
                defineOp({type: 'field.set', target: {field: 'factCheckedAt'}, value: {type: 'now'}}),
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({
          name: 'to-fact-checked',
          title: 'Fact check passed',
          to: 'fact-checked',
          when: "$allActivitiesDone && $fields.factCheck == 'passed'",
        }),
      ],
    }),
    defineStage({
      name: 'fact-checked',
      title: 'Fact-checked',
      description: 'The draft passed the fact check. A human editor certifies it (edit reviewStatus + publish), or sends it back.',
      activities: [
        defineActivity({
          name: 'certification',
          title: 'Certify the obituary',
          actions: [
            defineAction({
              name: 'certify',
              title: 'Certify',
              status: 'done',
              params: [{type: 'string', name: 'note', title: 'Note'}],
              ops: [
                defineOp({type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'certified'}}),
                defineOp({type: 'field.set', target: {field: 'decisionNote'}, value: {type: 'param', param: 'note'}}),
                defineOp({type: 'field.set', target: {field: 'certifiedBy'}, value: {type: 'actor'}}),
              ],
            }),
            defineAction({
              name: 'send-back',
              title: 'Send back to draft',
              status: 'done',
              params: [{type: 'string', name: 'reason', title: 'Reason', required: true}],
              ops: [
                defineOp({type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'sent-back'}}),
                defineOp({type: 'field.set', target: {field: 'decisionNote'}, value: {type: 'param', param: 'reason'}}),
                defineOp({type: 'field.unset', target: {field: 'factCheck'}}),
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-certified', title: 'Certified', to: 'certified', when: "$fields.decision == 'certified'"}),
        defineTransition({name: 'back-to-drafted', title: 'Sent back', to: 'drafted', when: "$fields.decision == 'sent-back'"}),
      ],
    }),
    defineStage({
      name: 'certified',
      title: 'Certified',
      description: 'The obituary is certified and published. Its text is frozen while the instance sits here; retract to edit it.',
      guards: [
        defineGuard({
          name: 'freeze-obituary',
          title: 'Certified obituary is frozen',
          description: 'Allows edits and publishes of the feature only when they leave the obituary unchanged.',
          match: {idRefs: [{type: 'fieldRead', field: 'subject'}], actions: ['update', 'publish']},
          predicate: '!delta::changedAny((obituary))',
        }),
      ],
      activities: [
        defineActivity({
          name: 'retraction',
          title: 'Retract (only if the obituary must change)',
          actions: [
            defineAction({
              name: 'retract',
              title: 'Retract to draft',
              status: 'done',
              params: [{type: 'string', name: 'reason', title: 'Reason', required: true}],
              ops: [
                defineOp({type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'retracted'}}),
                defineOp({type: 'field.set', target: {field: 'decisionNote'}, value: {type: 'param', param: 'reason'}}),
                defineOp({type: 'field.unset', target: {field: 'certifiedBy'}}),
                defineOp({type: 'field.unset', target: {field: 'factCheck'}}),
              ],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'retract', title: 'Retracted', to: 'drafted', when: "$fields.decision == 'retracted'"}),
      ],
    }),
  ],
})
