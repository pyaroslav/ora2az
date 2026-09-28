// In-memory tests of every path through notice-lifecycle (no project, no network). Run: npm test
import {createBench, GuardDeniedError, subjectField} from '@sanity/workflow-engine-test'
import {expect, test} from 'vitest'

import {noticeLifecycle} from '../definitions/notice-lifecycle.ts'

const feature = {_id: 'feature_x', _type: 'oracleFeature', name: 'X', reviewStatus: 'draft'}
const obit = [{_type: 'block', _key: 'a', children: [{_type: 'span', _key: 'b', text: 'It is survived by…'}]}]

async function start() {
  const bench = createBench({
    now: '2026-09-27T00:00:00.000Z',
    documents: [feature, {...feature, _id: 'drafts.feature_x', obituary: obit}],
  })
  await bench.deployDefinitions({expectedMinReaderModel: 10, definitions: [noticeLifecycle]})
  const {instance} = await bench.startInstance({
    definition: 'notice-lifecycle',
    initialFields: [subjectField('feature_x', {type: 'oracleFeature'})],
  })
  return {bench, id: instance._id, instance}
}
const fire = (bench: Awaited<ReturnType<typeof start>>['bench'], instanceId: string, activity: string, action: string, params?: Record<string, unknown>) =>
  bench.fireAction({instanceId, activity, action, params})

test('starts in drafted', async () => {
  const {instance} = await start()
  expect(instance.currentStage).toBe('drafted')
})

test('a failed fact check stays in drafted with the note, and a later pass moves on', async () => {
  const {bench, id} = await start()
  await fire(bench, id, 'fact-check', 'fail', {note: 'mentions 21c'})
  expect(await bench.currentStage(id)).toBe('drafted')
  expect(await bench.activityStatus(id, 'fact-check')).toBe('active')
  await fire(bench, id, 'fact-check', 'pass', {note: 'ok'})
  expect(await bench.currentStage(id)).toBe('fact-checked')
})

test('certify reaches certified and freezes the obituary, but not other fields', async () => {
  const {bench, id} = await start()
  await fire(bench, id, 'fact-check', 'pass', {note: 'ok'})
  await fire(bench, id, 'certification', 'certify')
  expect(await bench.currentStage(id)).toBe('certified')
  expect((await bench.activeGuardsForDocument('drafts.feature_x')).map((g) => g.name)).toContain('freeze-obituary')
  await expect(bench.editDocument({documentId: 'drafts.feature_x', patch: {set: {obituary: []}}})).rejects.toThrow(GuardDeniedError)
  await bench.editDocument({documentId: 'drafts.feature_x', patch: {set: {name: 'X renamed'}}})
})

test('send-back returns to drafted and needs a fresh fact check', async () => {
  const {bench, id} = await start()
  await fire(bench, id, 'fact-check', 'pass', {note: 'ok'})
  await fire(bench, id, 'certification', 'send-back', {reason: 'tone'})
  expect(await bench.currentStage(id)).toBe('drafted')
  expect(await bench.activityStatus(id, 'fact-check')).toBe('active')
  await fire(bench, id, 'fact-check', 'pass', {note: 'ok'})
  expect(await bench.currentStage(id)).toBe('fact-checked') // the old decision does not bounce it back
})

test('retract lifts the freeze and returns to drafted; re-certification works', async () => {
  const {bench, id} = await start()
  await fire(bench, id, 'fact-check', 'pass', {note: 'ok'})
  await fire(bench, id, 'certification', 'certify')
  await fire(bench, id, 'retraction', 'retract', {reason: 'new desupport info'})
  expect(await bench.currentStage(id)).toBe('drafted')
  expect(await bench.activeGuardsForDocument('drafts.feature_x')).toEqual([])
  await bench.editDocument({documentId: 'drafts.feature_x', patch: {set: {obituary: []}}})
  await fire(bench, id, 'fact-check', 'pass', {note: 'ok'})
  expect(await bench.currentStage(id)).toBe('fact-checked')
  await fire(bench, id, 'certification', 'certify')
  expect(await bench.currentStage(id)).toBe('certified')
})
