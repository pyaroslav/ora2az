import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'source',
  title: 'Source',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'publisher',
      type: 'string',
      options: {list: ['oracle', 'microsoft', 'community', 'firsthand']},
      validation: (r) => r.required(),
    }),
    defineField({name: 'url', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'docVersion', title: 'Document / product version', type: 'string'}),
    defineField({name: 'retrievedAt', type: 'date', validation: (r) => r.required()}),
    defineField({name: 'note', type: 'text', rows: 2}),
  ],
  preview: {select: {title: 'title', subtitle: 'publisher'}},
})
