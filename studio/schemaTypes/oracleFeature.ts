import {defineField, defineType} from 'sanity'
import {ORACLE_VERSIONS, sourcesField, summaryField} from './shared'

export default defineType({
  name: 'oracleFeature',
  title: 'Oracle feature',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}, validation: (r) => r.required()}),
    defineField({
      name: 'category',
      type: 'string',
      options: {
        list: ['datatype', 'plsql', 'sql', 'storage', 'scheduler', 'security', 'ha', 'replication', 'integration', 'search', 'tooling', 'platform', 'nls', 'performance'],
      },
      validation: (r) => r.required(),
    }),
    defineField({name: 'introducedIn', type: 'string', options: {list: [...ORACLE_VERSIONS, 'pre-11.2']}}),
    defineField({name: 'deprecatedIn', type: 'string', options: {list: [...ORACLE_VERSIONS]}}),
    defineField({name: 'desupportedIn', type: 'string', options: {list: [...ORACLE_VERSIONS]}}),
    defineField({name: 'oracleReplacement', title: 'Replacement inside Oracle (if any)', type: 'string'}),
    summaryField,
    defineField({
      name: 'obituary',
      title: 'Obituary (Path Two prose, editor-reviewed)',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'reviewStatus',
      type: 'string',
      options: {list: ['draft', 'certified'], layout: 'radio'},
      initialValue: 'draft',
    }),
    sourcesField,
  ],
  preview: {select: {title: 'name', subtitle: 'category'}},
})
