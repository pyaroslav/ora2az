import {defineField, defineType} from 'sanity'
import {sourcesField} from './shared'

export default defineType({
  name: 'pattern',
  title: 'Migration pattern',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'problem', type: 'text', rows: 3, validation: (r) => r.required()}),
    defineField({name: 'approach', type: 'array', of: [{type: 'block'}], validation: (r) => r.required()}),
    defineField({name: 'whenNotTo', title: 'When not to use it', type: 'text', rows: 3}),
    defineField({name: 'relatedMappings', type: 'array', of: [{type: 'reference', to: [{type: 'mapping'}]}]}),
    sourcesField,
  ],
  preview: {select: {title: 'title'}},
})
