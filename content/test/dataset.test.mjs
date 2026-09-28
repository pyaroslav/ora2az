// Assertions against the PUBLIC ora2az dataset (no token needed). Run: npm test (in content/)
import {test} from 'node:test'
import assert from 'node:assert/strict'

const PID = process.env.SANITY_PROJECT_ID ?? 'udyjvgsk'
const q = async (groq) => {
  const r = await fetch(`https://${PID}.api.sanity.io/v2026-09-01/data/query/production?query=${encodeURIComponent(groq)}`)
  assert.equal(r.status, 200, `query failed: ${groq}`)
  return (await r.json()).result
}

test('document counts are what the posts claim', async () => {
  const c = await q(`{"f":count(*[_type=="oracleFeature"]),"t":count(*[_type=="azureTarget"]),"m":count(*[_type=="mapping"]),"c":count(*[_type=="caveat"]),"d":count(*[_type=="dispute"]),"s":count(*[_type=="source"]),"g":count(*[_type=="glossary"]),"p":count(*[_type=="pattern"])}`)
  assert.deepEqual(c, {f: 50, t: 21, m: 101, c: 88, d: 5, s: 155, g: 16, p: 10})
})

test('no document id contains a dot (dots are path prefixes and hide documents)', async () => {
  assert.equal(await q(`count(*[!(_id match "_.*") && _id match "*.*"])`), 0)
})

test('no reference points at a missing document', async () => {
  const dangling = await q(`*[_type in ["mapping","caveat","dispute","pattern","oracleFeature","azureTarget","glossary"]]{_id, "refs": [
    ...coalesce(sources[]._ref, []), oracleFeature._ref, azureTarget._ref, mapping._ref, evidence._ref, claimA._ref, claimB._ref, resolvedBy._ref, ...coalesce(relatedMappings[]._ref, [])
  ]}[count(refs[defined(@) && !(@ in *[]._id)]) > 0]._id`)
  assert.deepEqual(dangling, [])
})

test('every mapping has a valid fidelity and both ends', async () => {
  assert.equal(await q(`count(*[_type=="mapping" && (!(fidelity in ["exact","partial","workaround","none"]) || !defined(oracleFeature->_id) || !defined(azureTarget->_id))])`), 0)
})

test('every caveat carries an evidence source with a URL', async () => {
  assert.equal(await q(`count(*[_type=="caveat" && !defined(evidence->url)])`), 0)
})

test('every feature, target, mapping, glossary term and pattern cites at least one source', async () => {
  assert.equal(await q(`count(*[_type in ["oracleFeature","azureTarget","mapping","glossary","pattern"] && count(sources) < 1])`), 0)
})

test('every dispute has two claims from different evidence and a resolution', async () => {
  const d = await q(`*[_type=="dispute"]{_id, "a": claimA->evidence._ref, "b": claimB->evidence._ref, resolution}`)
  assert.equal(d.length, 5)
  for (const x of d) { assert.ok(x.a && x.b && x.a !== x.b, `${x._id}: claims share evidence`); assert.ok(x.resolution?.length > 40, `${x._id}: thin resolution`) }
})

test('DBMS_JOB: deprecated in 12.2, not desupported, successor DBMS_SCHEDULER', async () => {
  const f = await q(`*[_id=="feature_dbms-job"][0]{deprecatedIn, desupportedIn, oracleReplacement}`)
  assert.deepEqual(f, {deprecatedIn: '12.2', desupportedIn: null, oracleReplacement: 'DBMS_SCHEDULER'})
})

test('Oracle Streams: deprecated 12.1, desupported 19c', async () => {
  assert.deepEqual(await q(`*[_id=="feature_oracle-streams"][0]{deprecatedIn, desupportedIn}`), {deprecatedIn: '12.1', desupportedIn: '19c'})
})

test('non-CDB architecture: desupported in 21c', async () => {
  assert.equal(await q(`*[_id=="feature_non-cdb-architecture"][0].desupportedIn`), '21c')
})

test('empty string = NULL survives exactly only on Oracle Database@Azure (the eval q04 fix)', async () => {
  const m = await q(`*[_type=="mapping" && oracleFeature._ref=="feature_empty-string-null"]{"t": azureTarget._ref, fidelity} | order(t asc)`)
  assert.deepEqual(m.find((x) => x.t === 'target_oracle-db-at-azure')?.fidelity, 'exact')
  assert.ok(m.filter((x) => x.t !== 'target_oracle-db-at-azure').every((x) => x.fidelity !== 'exact'))
})

test('SSMA maps unconstrained NUMBER to float(53) and that caveat sits in a dispute', async () => {
  const c = await q(`*[_id=="caveat_number-ssma-float53"][0]{statement, "disputed": count(*[_type=="dispute" && references(^._id)])}`)
  assert.match(c.statement, /float\[?\(?53/)
  assert.equal(c.disputed, 1)
})

test('review gate: published obituary prose exists only on certified features', async () => {
  assert.equal(await q(`count(*[_type=="oracleFeature" && defined(obituary) && reviewStatus != "certified"])`), 0)
})

test('Knowledge Base source set is 26 documents (glossary + pattern)', async () => {
  assert.equal(await q(`count(*[_type in ["glossary","pattern"]])`), 26)
})
