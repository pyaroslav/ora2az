import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'dispute',
  title: 'Dispute (two sources disagree)',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'claimA', type: 'reference', to: [{type: 'caveat'}], validation: (r) => r.required()}),
    defineField({name: 'claimB', type: 'reference', to: [{type: 'caveat'}], validation: (r) => r.required()}),
    defineField({name: 'whatDisagrees', type: 'text', rows: 3, validation: (r) => r.required()}),
    defineField({name: 'resolution', type: 'text', rows: 4, validation: (r) => r.required()}),
    defineField({name: 'resolvedBy', type: 'reference', to: [{type: 'source'}]}),
  ],
  preview: {select: {title: 'title'}},
})
