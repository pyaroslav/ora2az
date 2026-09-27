import {defineField, defineType} from 'sanity'
import {sourcesField, summaryField} from './shared'

export default defineType({
  name: 'azureTarget',
  title: 'Azure target',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}, validation: (r) => r.required()}),
    defineField({
      name: 'service',
      type: 'string',
      options: {
        list: [
          'azure-sql-db', 'azure-sql-mi', 'azure-pg-flex', 'oracle-db-at-azure', 'oracle-on-azure-vm',
          'blob-adls', 'data-factory', 'synapse', 'fabric', 'service-bus', 'functions', 'elastic-jobs',
          'ai-search', 'monitor', 'key-vault', 'migration-tool', 'other',
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({name: 'tierNotes', title: 'Tier / SKU notes', type: 'text', rows: 3}),
    summaryField,
    sourcesField,
  ],
  preview: {select: {title: 'name', subtitle: 'service'}},
})
