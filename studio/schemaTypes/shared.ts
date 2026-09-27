import {defineField} from 'sanity'

export const ORACLE_VERSIONS = ['11.2', '12.1', '12.2', '18c', '19c', '21c', '23ai', '26ai'] as const
export const ORACLE_EDITIONS = ['SE2', 'EE', 'XE/Free', 'Autonomous', 'Exadata'] as const

export const sourcesField = defineField({
  name: 'sources',
  title: 'Sources',
  type: 'array',
  of: [{type: 'reference', to: [{type: 'source'}]}],
  validation: (r) => r.min(1).error('Every claim needs at least one source.'),
})

export const summaryField = defineField({
  name: 'summary',
  title: 'Summary',
  type: 'array',
  of: [{type: 'block'}],
})

export const versionList = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: [{type: 'string'}],
    options: {list: [...ORACLE_VERSIONS]},
  })
