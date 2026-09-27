import {defineField, defineType} from 'sanity'
import {ORACLE_EDITIONS, versionList} from './shared'

export default defineType({
  name: 'caveat',
  title: 'Caveat',
  type: 'document',
  fields: [
    defineField({name: 'mapping', type: 'reference', to: [{type: 'mapping'}], validation: (r) => r.required()}),
    defineField({
      name: 'severity',
      type: 'string',
      options: {list: ['blocker', 'major', 'minor'], layout: 'radio'},
      validation: (r) => r.required(),
    }),
    defineField({name: 'statement', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({
      name: 'appliesTo',
      type: 'object',
      fields: [
        versionList('oracleVersions', 'Oracle versions'),
        defineField({name: 'editions', type: 'array', of: [{type: 'string'}], options: {list: [...ORACLE_EDITIONS]}}),
        defineField({name: 'azureTiers', title: 'Azure tiers / SKUs', type: 'array', of: [{type: 'string'}]}),
      ],
    }),
    defineField({name: 'evidence', type: 'reference', to: [{type: 'source'}], validation: (r) => r.required()}),
    defineField({name: 'firsthand', title: 'Observed firsthand by the author', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'statement', subtitle: 'severity'}},
})
